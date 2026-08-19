"""Does the instrument respond when the pattern it looks for is really produced?

Gate A shows the measurement is precise. Gate B shows it agrees with a method
someone else validated. Neither shows the thing the product rests on, and this
script is what answers it: give the pipeline a signal known to be present, then
check whether it moves.

Both signals are recomputed here from the gaze trace rather than read out of the
`assessment` block the app wrote at recording time. That is not distrust of the
app — it is that the recordings predate nine fixes, two of which changed what the
app would compute from the very same trace. Recomputing means the numbers below
belong to one version of the analysis instead of to whichever version happened
to be running that afternoon, and it means anyone can rerun them against the
filed evidence.

Nothing here is about autism. The participants are consenting adults producing
patterns on instruction, so there is no sensitivity, no specificity, and no
accuracy in the output. What there is: whether two behavioural conditions come
out of the pipeline as different numbers.
"""

from __future__ import annotations

import json
from collections import defaultdict
from dataclasses import dataclass, asdict
from pathlib import Path
from statistics import median

import numpy as np
from scipy.stats import mannwhitneyu
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import GroupKFold
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

ROOT = Path(__file__).resolve().parent.parent
SESSIONS = ROOT / "research" / "hasil" / "kontrol_positif" / "sesi"
RESULTS = ROOT / "research" / "hasil" / "kontrol_positif"

# ---------------------------------------------------------------------------
# Geometry, mirrored from app/src/geopref/protocol.ts and app/src/gaze/aoi.ts.
# Kept as literals rather than parsed out of the TypeScript so that a change on
# either side shows up as a disagreement instead of being silently followed.
# ---------------------------------------------------------------------------
CROP = {"x0": 129, "x1": 513, "y0": 120, "y1": 242}
CROP_WIDTH = CROP["x1"] - CROP["x0"]
CROP_HEIGHT = CROP["y1"] - CROP["y0"]
GEOPREF_ASPECT = CROP_WIDTH / CROP_HEIGHT
GEOPREF_FRAME_AOI = {
    "left": (0.0, (316 - 129) / CROP_WIDTH),
    "right": ((324 - 129) / CROP_WIDTH, 1.0),
}
AOI_ATLAS = {
    "face": (0.36, 0.64, 0.14, 0.58),
    "target_left": (0.04, 0.32, 0.38, 0.82),
    "target_right": (0.68, 0.96, 0.38, 0.82),
}

GEOPREF_PHASE = "geopref_preference"
DIRECTIONAL_PHASES = (
    "gaze_left", "gaze_right", "pointing_left", "pointing_right",
    "gaze_left_repeat", "gaze_right_repeat", "pointing_left_repeat", "pointing_right_repeat",
)

# Quality criteria from docs/kontrol_positif.md, plus the saturation limit the
# recordings themselves made the case for.
LIMITS = {
    "calibration_error_deg": 3.0,
    "face_rate": 0.85,
    "gaze_dropout": 0.20,
    "gaze_saturation": 0.25,
    "geopref_aoi_coverage": 0.50,
    "geopref_min_samples": 60,
}

# These logs were written before the pipeline counted saturated samples, so it
# has to be recovered from the trace. Points were clamped to the edge and then
# smoothed and resampled, which leaves a saturated stretch sitting just off the
# boundary rather than exactly on it. `saturation_sensitivity` in the output
# reports what the count would be at other cut-offs, so the choice of this
# number can be checked rather than taken on faith.
EDGE_EPSILON = 2e-3
EDGE_EPSILON_SWEEP = (0.0, 5e-4, 1e-3, 2e-3, 5e-3, 1e-2)

# app/src/geopref/protocol.ts: hash of a session key, even means geometric on the
# left. Every recording here was rendered with the key set to the identity field,
# which held one value across 22 of 24 files — so this reproduces the side each
# participant was actually shown, including the fact that it never changed.
def session_hash(value: str) -> int:
    result = 0
    for character in value:
        result = (result * 31 + ord(character)) & 0xFFFFFFFF
    return result


def geometric_side(key: str) -> str:
    return "left" if session_hash(key) % 2 == 0 else "right"


def project_geopref_aoi(viewport_aspect: float) -> dict[str, tuple[float, float, float, float]]:
    """AOIs in viewport space. The clip is letterboxed, so the panels move with it."""
    wide = viewport_aspect > GEOPREF_ASPECT
    width_fraction = GEOPREF_ASPECT / viewport_aspect if wide else 1.0
    height_fraction = 1.0 if wide else viewport_aspect / GEOPREF_ASPECT
    x_offset = (1 - width_fraction) / 2
    y_offset = (1 - height_fraction) / 2
    return {
        name: (
            x_offset + x0 * width_fraction,
            x_offset + x1 * width_fraction,
            y_offset,
            y_offset + height_fraction,
        )
        for name, (x0, x1) in GEOPREF_FRAME_AOI.items()
    }


def classify(point: dict, boxes: dict[str, tuple[float, float, float, float]]) -> str | None:
    for name, (x0, x1, y0, y1) in boxes.items():
        if x0 <= point["x"] <= x1 and y0 <= point["y"] <= y1:
            return name
    return None


@dataclass
class Session:
    file: str
    device: str
    condition: str
    attempt: int
    child_id: str
    session_id: str
    created_at: str
    viewport_aspect: float
    calibration_error_deg: float
    face_rate: float
    gaze_dropout: float
    gaze_saturation: float
    geometric_side: str
    geopref_percent: float | None
    geopref_aoi_coverage: float
    geopref_valid_samples: int
    cue_trials_scored: int
    cue_trials_followed: int
    cue_trials_entering_target: int
    cue_attended_at_cue: int
    centre_hold_iqr: float
    saturation_by_epsilon: dict[str, float]
    withheld_reasons: list[str]

    @property
    def usable(self) -> bool:
        return not self.withheld_reasons


def load_session(path: Path) -> Session:
    log = json.loads(path.read_text(encoding="utf-8"))
    gaze = log["gaze"]
    points = gaze["processedPoints"]
    quality = log["quality"]
    meta = log.get("positiveControl") or {}
    environment = log["environment"]
    aspect = environment["viewport"]["width"] / environment["viewport"]["height"]

    device = path.stem.split("-")[1]
    condition = meta.get("condition") or path.stem.split("-")[2]

    def saturation_at(epsilon: float) -> float:
        if not points:
            return 1.0
        hits = sum(
            1 for point in points
            if point["x"] <= epsilon or point["x"] >= 1 - epsilon
            or point["y"] <= epsilon or point["y"] >= 1 - epsilon
        )
        return hits / len(points)

    saturation_by_epsilon = {f"{epsilon:g}": saturation_at(epsilon) for epsilon in EDGE_EPSILON_SWEEP}

    # Signal 1 — preferential looking, scored entirely inside the video block.
    boxes = project_geopref_aoi(aspect)
    side = geometric_side(log["profile"]["childId"] or "NG-0000")
    geopref_points = [point for point in points if point.get("phase") == GEOPREF_PHASE]
    labels = [classify(point, boxes) for point in geopref_points]
    on_panel = [label for label in labels if label]
    geometric = sum(1 for label in on_panel if label == side)
    coverage = len(on_panel) / len(geopref_points) if geopref_points else 0.0
    # Same criterion app/src/geopref/score.ts applies before it will report a
    # percentage: too little looking at either panel and the ratio is a ratio of
    # noise. It withholds the signal, not the session — cue following is scored
    # in a different block and is unaffected by how the video block went.
    percent = (
        geometric / len(on_panel)
        if on_panel
        and coverage >= LIMITS["geopref_aoi_coverage"]
        and len(on_panel) >= LIMITS["geopref_min_samples"]
        else None
    )

    # Signal 2 — cue following, scored entirely inside the vector block. The
    # per-trial epochs are already summarised in the log and are not affected by
    # anything the fixes changed, so they are read rather than rebuilt.
    responses = [
        gaze["cueFeatures"]["targetResponse"][phase]
        for phase in DIRECTIONAL_PHASES
        if phase in gaze["cueFeatures"]["targetResponse"]
    ]
    scored = [response for response in responses if response.get("targetLift") is not None]

    directional = sorted(
        point["x"] for point in points if point.get("phase") in DIRECTIONAL_PHASES
    )
    if directional:
        low = directional[int(0.25 * (len(directional) - 1))]
        high = directional[int(0.75 * (len(directional) - 1))]
        iqr = high - low
    else:
        iqr = float("nan")

    withheld = []
    if quality["calibrationErrorDeg"] > LIMITS["calibration_error_deg"]:
        withheld.append(f"galat kalibrasi {quality['calibrationErrorDeg']:.2f}°")
    if quality["faceRate"] < LIMITS["face_rate"]:
        withheld.append(f"laju frame valid {quality['faceRate']:.2f}")
    if quality["gazeDropout"] > LIMITS["gaze_dropout"]:
        withheld.append(f"dropout {quality['gazeDropout']:.2f}")
    saturation = saturation_at(EDGE_EPSILON)
    if saturation > LIMITS["gaze_saturation"]:
        withheld.append(f"pandangan menempel di tepi layar {saturation:.0%}")

    return Session(
        file=path.name,
        device=device,
        condition=condition,
        attempt=meta.get("attempt") or 1,
        child_id=log["profile"]["childId"],
        session_id=log["sessionId"],
        created_at=log["createdAt"],
        viewport_aspect=aspect,
        calibration_error_deg=quality["calibrationErrorDeg"],
        face_rate=quality["faceRate"],
        gaze_dropout=quality["gazeDropout"],
        gaze_saturation=saturation,
        geometric_side=side,
        geopref_percent=percent,
        geopref_aoi_coverage=coverage,
        geopref_valid_samples=len(on_panel),
        cue_trials_scored=len(scored),
        cue_trials_followed=sum(1 for response in scored if response["targetLift"] > 0),
        cue_trials_entering_target=sum(1 for response in scored if response["probability"] > 0),
        cue_attended_at_cue=sum(1 for response in scored if response.get("faceAtCue") is True),
        centre_hold_iqr=iqr,
        saturation_by_epsilon=saturation_by_epsilon,
        withheld_reasons=withheld,
    )


# Wen et al. 2022, Scientific Reports 12:4253 — the one externally published
# cut-off in the system.
GEOPREF_THRESHOLD = 0.69
# app/src/inference/jointAttention.ts
MIN_ATTENDED_SHARE = 0.6
MAX_TRIALS_ENTERING_TARGET = 1


def sign_test_p(successes: int, trials: int) -> float:
    """One-sided exact binomial tail under p = 0.5, as the app computes it."""
    from math import comb
    if trials <= 0:
        return 1.0
    return sum(comb(trials, k) for k in range(successes, trials + 1)) / 2 ** trials


def signal_statuses(session: Session) -> dict[str, str]:
    """
    The two decision signals, exactly as app/src/outcome/referralRecommendation.ts
    would read them — with one deliberate difference, named here rather than
    buried: geometric preference is scored against the published threshold even
    though the licensed clip is shorter than the protocol the threshold came
    from. The app refuses that comparison and is right to, because on a real
    session it would become a referral.

    It is done here because refusing it makes the positive control unable to
    answer its own question. With geometric preference permanently unassessable,
    the composite cannot fire under any behaviour whatsoever, and a table of
    zeroes would say nothing about whether the rule responds — only that one of
    its inputs is blocked, which was already known without recording anybody.

    Everything computed from this carries `demonstrasi` in its name and is not a
    referral, has never been one, and must not be quoted as one.
    """
    if session.geopref_percent is None:
        geopref = "tidak_dapat_dinilai"
    elif session.geopref_percent >= GEOPREF_THRESHOLD:
        geopref = "menyimpang"
    else:
        geopref = "normal"

    scored = session.cue_trials_scored
    if scored < 5:
        cue = "tidak_dapat_dinilai"
    elif sign_test_p(session.cue_trials_followed, scored) < 0.05:
        cue = "normal"
    elif (
        session.cue_trials_entering_target <= MAX_TRIALS_ENTERING_TARGET
        and session.cue_attended_at_cue >= -(-int(scored * MIN_ATTENDED_SHARE * 100) // 100)
    ):
        cue = "menyimpang"
    else:
        cue = "tidak_dapat_dinilai"
    return {"geometric_preference": geopref, "cue_following": cue}


def composite_table(sessions: list[Session]) -> dict:
    """The table docs/kontrol_positif.md says has to exist, whatever it says."""
    counts = {
        condition: {"menyala": 0, "tidak": 0, "sesi": []}
        for condition in ("biasa", "produksi")
    }
    for session in sessions:
        statuses = signal_statuses(session)
        assessable = sum(1 for status in statuses.values() if status != "tidak_dapat_dinilai")
        deviant = sum(1 for status in statuses.values() if status == "menyimpang")
        fires = assessable >= 2 and deviant >= 2
        counts[session.condition]["menyala" if fires else "tidak"] += 1
        counts[session.condition]["sesi"].append({
            "berkas": session.file,
            **statuses,
            "menyala": fires,
        })
    return counts


def auc(positive: list[float], negative: list[float]) -> float:
    """Rank-based, ties counted as half. Same quantity Mann-Whitney tests."""
    if not positive or not negative:
        return float("nan")
    wins = sum(
        1.0 if p > n else 0.5 if p == n else 0.0
        for p in positive for n in negative
    )
    return wins / (len(positive) * len(negative))


def separation(name: str, produced: list[float], ordinary: list[float], higher_is_produced: bool) -> dict:
    """One signal's contrast between conditions, with the overlap named outright."""
    positive, negative = (produced, ordinary) if higher_is_produced else (
        [-value for value in produced], [-value for value in ordinary]
    )
    statistic = auc(positive, negative)
    test = mannwhitneyu(positive, negative, alternative="greater") if positive and negative else None
    gap = min(positive) - max(negative)
    return {
        "signal": name,
        "n_produksi": len(produced),
        "n_biasa": len(ordinary),
        "median_produksi": median(produced) if produced else None,
        "median_biasa": median(ordinary) if ordinary else None,
        "range_produksi": [min(produced), max(produced)] if produced else None,
        "range_biasa": [min(ordinary), max(ordinary)] if ordinary else None,
        "auc": statistic,
        "separated": bool(gap > 0),
        # Distance between the two conditions at their closest, in the signal's
        # own units. Positive means no session of one condition overlaps the
        # other; the number says by how much, which a bare AUC of 1.00 does not.
        "margin": gap,
        "mannwhitney_p": float(test.pvalue) if test is not None else None,
    }


def sensitivity_model(sessions: list[Session]) -> dict:
    """
    The sensitivity analysis docs/kontrol_positif.md permits above eight
    participants, and nothing more than that.

    It is not the decision path and must never become one. The transparent rule
    stays the decision path whatever comes out here, for the reason written in
    referralRecommendation.ts: weights fitted on adults performing a script
    learn the script. What the fit is good for is a check on whether the two
    signals carry the separation jointly or whether one of them is doing all the
    work — which is a question about the instrument, not about any child.

    Grouping is by device, not by participant, because the participant is not in
    the files. Four people sat at each device, so a device-held-out fold holds
    out four people at once: coarser than the protocol asked for, and stricter.
    """
    usable = [session for session in sessions if session.usable and session.geopref_percent is not None]
    features = np.array([
        [session.geopref_percent, session.cue_trials_entering_target / max(session.cue_trials_scored, 1)]
        for session in usable
    ])
    labels = np.array([1 if session.condition == "produksi" else 0 for session in usable])
    groups = np.array([session.device for session in usable])

    distinct_groups = sorted(set(groups))
    folds = GroupKFold(n_splits=len(distinct_groups))
    predictions = np.full(len(labels), np.nan)
    per_fold = []
    for held_out, (train_index, test_index) in zip(distinct_groups, folds.split(features, labels, groups)):
        if len(set(labels[train_index])) < 2:
            per_fold.append({"held_out_device": held_out, "skipped": "hanya satu kondisi di lipatan latih"})
            continue
        model = make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000))
        model.fit(features[train_index], labels[train_index])
        probability = model.predict_proba(features[test_index])[:, 1]
        predictions[test_index] = probability
        per_fold.append({
            "held_out_device": held_out,
            "n_test": int(len(test_index)),
            "n_produksi": int(labels[test_index].sum()),
            "auc_out_of_fold": auc(
                list(probability[labels[test_index] == 1]),
                list(probability[labels[test_index] == 0]),
            ),
        })

    scored = ~np.isnan(predictions)
    overall = auc(
        list(predictions[scored & (labels == 1)]),
        list(predictions[scored & (labels == 0)]),
    )
    full = make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000)).fit(features, labels)
    coefficients = full.named_steps["logisticregression"].coef_[0]

    return {
        "purpose": "analisis_sensitivitas_bukan_jalur_keputusan",
        "grouping": "perangkat (4 peserta per perangkat), bukan peserta",
        "n_sessions": int(len(labels)),
        "n_groups": len(distinct_groups),
        "features": ["geopref_percent", "cue_trials_entering_target_share"],
        "auc_out_of_fold": overall,
        "per_fold": per_fold,
        # On standardised inputs, so the two are comparable to each other and to
        # nothing else. Reported to show whether the separation rests on one
        # signal or on both, which is the only question this fit answers.
        "standardised_coefficients": {
            "geopref_percent": float(coefficients[0]),
            "cue_trials_entering_target_share": float(coefficients[1]),
        },
        "warning": (
            "Dilatih pada orang dewasa yang memperagakan pola sesuai naskah. Bobot ini "
            "mempelajari naskahnya, bukan autisme, dan tidak boleh dipasang ke jalur rujukan."
        ),
    }


def main() -> None:
    sessions = sorted(
        (load_session(path) for path in sorted(SESSIONS.glob("*.json"))),
        key=lambda session: (session.device, session.condition, session.created_at),
    )
    usable = [session for session in sessions if session.usable]

    def values(condition: str, pick, only_usable: bool = True) -> list[float]:
        pool = usable if only_usable else sessions
        return [
            pick(session) for session in pool
            if session.condition == condition and pick(session) is not None
            and not (isinstance(pick(session), float) and np.isnan(pick(session)))
        ]

    signals = [
        separation(
            "geometric_preference",
            values("produksi", lambda session: session.geopref_percent),
            values("biasa", lambda session: session.geopref_percent),
            higher_is_produced=True,
        ),
        separation(
            "cue_following",
            values("produksi", lambda session: float(session.cue_trials_entering_target)),
            values("biasa", lambda session: float(session.cue_trials_entering_target)),
            higher_is_produced=False,
        ),
        separation(
            "centre_hold_spread",
            values("produksi", lambda session: session.centre_hold_iqr),
            values("biasa", lambda session: session.centre_hold_iqr),
            higher_is_produced=False,
        ),
    ]

    # What the composite rule would do, stated for both conditions. It is zero
    # on both, and the reason is structural rather than behavioural: the rule
    # needs two deviant signals and geometric preference cannot be assessed at
    # all while the licensed clip is shorter than the published protocol. The
    # table is printed anyway, because the alternative is the table nobody made.
    demonstration = composite_table(usable)

    attrition = defaultdict(lambda: {"direkam": 0, "dipakai": 0, "ditahan": 0})
    for session in sessions:
        attrition[session.condition]["direkam"] += 1
        attrition[session.condition]["dipakai" if session.usable else "ditahan"] += 1

    # The saturation limit is the one criterion invented here rather than taken
    # from the protocol, and it decides eight of the twenty-three sessions. It
    # rests on a cut-off for how close to an edge counts as on it — necessary
    # because these logs were smoothed after clamping. Sweeping the cut-off says
    # whether the withholding is a property of the recordings or of the number
    # chosen, which is the difference between a criterion and a preference.
    sensitivity = {
        epsilon: {
            "ditahan": sum(
                1 for session in sessions
                if session.saturation_by_epsilon[epsilon] > LIMITS["gaze_saturation"]
            ),
            "ditahan_produksi": sum(
                1 for session in sessions
                if session.condition == "produksi"
                and session.saturation_by_epsilon[epsilon] > LIMITS["gaze_saturation"]
            ),
        }
        for epsilon in (f"{value:g}" for value in EDGE_EPSILON_SWEEP)
    }

    summary = {
        "schemaVersion": 1,
        "scope": (
            "Responsivitas instrumen pada orang dewasa yang memproduksi pola secara sengaja. "
            "Bukan sensitivitas, bukan spesifisitas, bukan akurasi, dan bukan pernyataan apa pun "
            "tentang autisme."
        ),
        "participants": 12,
        "participantsPerDevice": 4,
        "pairingRecoverable": False,
        "sessionsRecorded": len(sessions),
        "sessionsUsable": len(usable),
        "attritionByCondition": dict(attrition),
        "qualityLimits": LIMITS,
        "edgeEpsilon": EDGE_EPSILON,
        "edgeEpsilonSensitivity": sensitivity,
        "signals": signals,
        "compositeRule": {
            "threshold": 2,
            "asShipped": {
                "fired": {"biasa": 0, "produksi": 0},
                "reason": (
                    "Aturan yang dikirim menuntut dua sinyal menyimpang, dan preferensi geometrik "
                    "berstatus tidak_dapat_dinilai selama klip lebih pendek daripada protokol "
                    "terbit. Paling banyak satu sinyal tersedia, jadi aturannya tidak dapat "
                    "menyala pada perilaku apa pun. Nol di kedua baris adalah keadaan aturannya, "
                    "bukan hasil pengukuran tentang peserta."
                ),
            },
            "demonstrasi": {
                "fired": {condition: counts["menyala"] for condition, counts in demonstration.items()},
                "notFired": {condition: counts["tidak"] for condition, counts in demonstration.items()},
                "perSession": {condition: counts["sesi"] for condition, counts in demonstration.items()},
                "caveat": (
                    "Ambang 69% diterapkan pada klip yang lebih pendek daripada protokol tempat "
                    "ambang itu diturunkan. Angka ini menjawab apakah aturannya merespons, bukan "
                    "apakah aturannya benar, dan bukan rujukan."
                ),
            },
        },
        "sensitivityModel": sensitivity_model(sessions),
        "confounds": [
            "Panel geometrik berada di kanan pada seluruh 24 sesi dan urutan isyarat identik pada "
            "seluruhnya, karena kedua skema counterbalancing diturunkan dari kolom identitas yang "
            "diisi sama untuk semua peserta. Preferensi geometrik karena itu tidak terpisah dari "
            "bias melirik ke kanan di data ini.",
            "Identitas peserta tidak terekam, jadi tidak ada analisis berpasangan dan grup validasi "
            "silang adalah perangkat, bukan orang.",
            "Urutan kondisi tidak diseimbangkan, dan itu disengaja: instruksi kondisi 2 tidak dapat "
            "ditarik kembali. Efek urutan karena itu tidak dapat dipisahkan dari efek kondisi.",
        ],
        "sessions": [asdict(session) for session in sessions],
    }

    RESULTS.mkdir(parents=True, exist_ok=True)
    (RESULTS / "ringkasan.json").write_text(
        json.dumps(summary, indent=2, ensure_ascii=False, default=float) + "\n", encoding="utf-8"
    )

    header = (
        "rekaman,kondisi,percobaan,perangkat,berkas,galat_kalibrasi_deg,laju_frame_valid,dropout,"
        "saturasi,geopref_persen,geopref_cakupan,isyarat_masuk_target,isyarat_diikuti,"
        "sebaran_tengah,dipakai,catatan"
    )
    rows = [header]
    for session in sessions:
        rows.append(",".join([
            session.file.removeprefix("kp-").removesuffix(".json"),
            session.condition,
            str(session.attempt),
            session.device,
            session.file,
            f"{session.calibration_error_deg:.2f}",
            f"{session.face_rate:.2f}",
            f"{session.gaze_dropout:.2f}",
            f"{session.gaze_saturation:.2f}",
            f"{session.geopref_percent:.3f}" if session.geopref_percent is not None else "-",
            f"{session.geopref_aoi_coverage:.2f}",
            f"{session.cue_trials_entering_target}/{session.cue_trials_scored}",
            f"{session.cue_trials_followed}/{session.cue_trials_scored}",
            f"{session.centre_hold_iqr:.3f}",
            "ya" if session.usable else "tidak",
            "; ".join(session.withheld_reasons),
        ]))
    (RESULTS / "lembar_sesi.csv").write_text("\n".join(rows) + "\n", encoding="utf-8")

    print(f"{len(sessions)} rekaman, {len(usable)} lolos mutu")
    for condition, counts in attrition.items():
        print(f"  {condition}: {counts['dipakai']} dipakai, {counts['ditahan']} ditahan dari {counts['direkam']}")
    print()
    for signal in signals:
        print(
            f"  {signal['signal']:22} AUC {signal['auc']:.3f}  "
            f"margin {signal['margin']:+.3f}  p={signal['mannwhitney_p']:.2e}"
        )
    print("\n  ambang tepi -> sesi ditahan (dari produksi):")
    for epsilon, counts in sensitivity.items():
        print(f"    {epsilon:>7}  {counts['ditahan']:>2} ({counts['ditahan_produksi']})")
    print("\n  aturan komposit (mode demonstrasi):")
    for condition, counts in demonstration.items():
        print(f"    {condition:9} menyala {counts['menyala']:>2}, tidak menyala {counts['tidak']:>2}")
    model = summary["sensitivityModel"]
    print(f"\n  regresi logistik (grup=perangkat): AUC luar-lipatan {model['auc_out_of_fold']:.3f} "
          f"pada {model['n_sessions']} sesi, {model['n_groups']} grup")


if __name__ == "__main__":
    main()
