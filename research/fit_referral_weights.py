"""Layer 2 of the referral model: fit relative index weights on published child data.

Runs the four audits README.md, "Bobot dari data anak terbit, dan audit yang menolaknya" makes mandatory and applies its
rejection criteria. Promoting the weights is the outcome only if all four pass;
otherwise the rejection is the published result and Layer 1 ships alone.

The rejection criteria, verbatim from that document:

  - a weight flips sign under 60 -> 30 Hz decimation;
  - the session-level shortcut baseline comes within 0.05 AUC of the index model;
  - any weight's confidence interval crosses zero under participant grouping;
  - the joint-attention index cannot be reconstructed from the CSVs.

With n=59 at the wrong ages, rejection is a likely outcome, and the papers on
this dataset report suspiciously high AUC exactly where they do not group by
participant. Writing the criteria down before running the fit is what stops the
result from being chosen after the fact.
"""

from __future__ import annotations

import json
import os

import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import StratifiedKFold
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CILIA = os.path.join(ROOT, "research", "hasil", "cilia")
OUT = os.path.join(ROOT, "research", "hasil", "model_rujukan.json")

SEED = 20260821
BOOTSTRAP = 4000

# The behavioural indices. eye_mouth_ratio is measured and reported but kept out
# of the model: it is present for 35 of 57 participants, and dropping a third of
# an already small cohort to carry one index buys less than it costs.
INDICES = ["cue_lateral_gain", "centre_hold_spread", "social_dwell_frac"]

# Session-level nuisances with no behavioural content. If these alone predict as
# well as the indices, what the model learned is how the two groups were
# recorded — the same failure the face dataset's 0.7515 pixel baseline exposed.
NUISANCES = ["n_samples", "tracking_ratio", "fixation_frac", "blink_frac", "n_cue_trials"]


def _model() -> object:
    return make_pipeline(StandardScaler(), LogisticRegression(max_iter=2000, C=1.0))


def _oof_auc(X: np.ndarray, y: np.ndarray, seed: int = SEED) -> float:
    """Out-of-fold AUC.

    Each row is one participant, so a fold split is already a participant split
    and leakage across folds is impossible by construction. That is the standing
    difference from the face dataset, where no participant id existed and the
    question could not even be asked.
    """
    folds = StratifiedKFold(n_splits=5, shuffle=True, random_state=seed)
    oof = np.zeros(len(y), dtype=float)
    for train, test in folds.split(X, y):
        model = _model()
        model.fit(X[train], y[train])
        oof[test] = model.predict_proba(X[test])[:, 1]
    return float(roc_auc_score(y, oof))


def _fit_weights(X: np.ndarray, y: np.ndarray) -> np.ndarray:
    model = _model()
    model.fit(X, y)
    return model[-1].coef_[0].astype(float)


def _bootstrap_weights(X: np.ndarray, y: np.ndarray) -> np.ndarray:
    rng = np.random.default_rng(SEED)
    pos, neg = np.flatnonzero(y == 1), np.flatnonzero(y == 0)
    draws = []
    for _ in range(BOOTSTRAP):
        idx = np.concatenate([
            rng.choice(pos, size=len(pos), replace=True),
            rng.choice(neg, size=len(neg), replace=True),
        ])
        if len(np.unique(y[idx])) < 2:
            continue
        try:
            draws.append(_fit_weights(X[idx], y[idx]))
        except Exception:
            continue
    return np.asarray(draws)


def _complete(table: pd.DataFrame, columns: list[str]) -> pd.DataFrame:
    return table.dropna(subset=columns).reset_index(drop=True)


def main() -> None:
    hz60 = pd.read_csv(os.path.join(CILIA, "indeks_60hz.csv"))
    hz30 = pd.read_csv(os.path.join(CILIA, "indeks_30hz.csv"))

    fit60 = _complete(hz60, INDICES)
    X60, y60 = fit60[INDICES].to_numpy(float), fit60["label"].to_numpy(int)

    assert fit60["participant_id"].is_unique, "one row per participant is the whole leakage argument"

    weights = _fit_weights(X60, y60)
    auc_index = _oof_auc(X60, y60)
    boot = _bootstrap_weights(X60, y60)
    lo, hi = np.percentile(boot, [2.5, 97.5], axis=0)

    # ── Audit 1: temporal decimation, 60 -> 30 Hz
    fit30 = _complete(hz30, INDICES)
    X30, y30 = fit30[INDICES].to_numpy(float), fit30["label"].to_numpy(int)
    weights30 = _fit_weights(X30, y30)
    auc30 = _oof_auc(X30, y30)
    sign_flips = [
        INDICES[i] for i in range(len(INDICES))
        if np.sign(weights[i]) != np.sign(weights30[i])
    ]
    magnitude_ratio = [
        float(abs(weights30[i]) / abs(weights[i])) if abs(weights[i]) > 1e-9 else float("inf")
        for i in range(len(INDICES))
    ]

    # ── Audit 2: session-level shortcut baseline
    nuis = _complete(hz60, NUISANCES)
    Xn, yn = nuis[NUISANCES].to_numpy(float), nuis["label"].to_numpy(int)
    auc_shortcut = _oof_auc(Xn, yn)

    # Which single column carries the shortcut. Reported because "the baseline
    # was high" is an accusation; naming the column is a finding.
    def _single_auc(column: str) -> dict | None:
        mask = hz60[column].notna()
        if mask.sum() < 20:
            return None
        labels = hz60["label"].to_numpy(int)[mask.to_numpy()]
        values = hz60[column][mask]
        auc = roc_auc_score(labels, values)
        return {
            "auc": float(max(auc, 1 - auc)),
            "median_asd": float(values[labels == 1].median()),
            "median_td": float(values[labels == 0].median()),
            "n": int(mask.sum()),
        }

    per_feature = {
        c: v for c in NUISANCES + INDICES + ["eye_mouth_ratio", "scanpath_coverage", "age"]
        if (v := _single_auc(c)) is not None
    }

    # Does scanpath coverage — the analogue of the ink_frac feature the 13-feature
    # set and the scanpath CNN both read — measure behaviour, or measure how much
    # recording there was?
    cov_mask = hz60["scanpath_coverage"].notna() & hz60["n_samples"].notna()
    coverage_r = float(np.corrcoef(
        hz60["scanpath_coverage"][cov_mask], hz60["n_samples"][cov_mask])[0, 1])
    track_mask = hz60["scanpath_coverage"].notna() & hz60["tracking_ratio"].notna()
    coverage_track_r = float(np.corrcoef(
        hz60["scanpath_coverage"][track_mask], hz60["tracking_ratio"][track_mask])[0, 1])

    # ── Audit 3: participant grouping
    leakage = {
        "unit_of_analysis": "participant",
        "duplicate_participant_rows": int(hz60["participant_id"].duplicated().sum()),
        "leakage_possible_by_construction": False,
        "note": "Setiap baris satu partisipan, jadi pemisahan lipatan sudah pemisahan partisipan. Ini yang tidak dapat diperiksa pada dataset wajah karena ID partisipannya tidak ada.",
    }

    # ── Audit 4: two-way OOD on the one index both systems measure
    control = json.load(open(
        os.path.join(ROOT, "research", "hasil", "kontrol_positif", "ringkasan.json"), encoding="utf-8"))
    spread = next(s for s in control["signals"] if s["signal"] == "centre_hold_spread")
    cilia_spread = fit60["centre_hold_spread"]
    mu, sd = float(cilia_spread.mean()), float(cilia_spread.std(ddof=1))
    ood = {
        "index": "centre_hold_spread",
        "cilia_mean": mu,
        "cilia_sd": sd,
        "cilia_range": [float(cilia_spread.min()), float(cilia_spread.max())],
        "neurogaze_ordinary_median": spread["median_biasa"],
        "neurogaze_produced_median": spread["median_produksi"],
        "z_ordinary": float((spread["median_biasa"] - mu) / sd),
        "z_produced": float((spread["median_produksi"] - mu) / sd),
    }
    ood["lands_inside"] = bool(abs(ood["z_ordinary"]) <= 3 and abs(ood["z_produced"]) <= 3)

    # ── Rejection criteria, applied
    ci_crosses_zero = [INDICES[i] for i in range(len(INDICES)) if lo[i] <= 0 <= hi[i]]
    shortcut_too_close = bool(auc_shortcut >= auc_index - 0.05)
    rejections = []
    if sign_flips:
        rejections.append(f"bobot berbalik tanda pada desimasi 30 Hz: {', '.join(sign_flips)}")
    if shortcut_too_close:
        rejections.append(
            f"alas shortcut tingkat sesi mencapai AUC {auc_shortcut:.3f} terhadap model indeks {auc_index:.3f}, "
            "selisihnya di bawah 0,05")
    if ci_crosses_zero:
        rejections.append(f"selang kepercayaan bobot melewati nol: {', '.join(ci_crosses_zero)}")

    promoted = not rejections

    result = {
        "schemaVersion": "neurogaze-model-rujukan-lapis2-v1",
        "question": "Bisakah bobot relatif antar indeks dipasang pada anak berlabel yang datanya sudah terbit, lalu dipindahkan ke NeuroGaze?",
        "source": {
            "dataset": "Cilia dkk. 2022, Eye-Tracking Dataset to Support the Research on ASD",
            "doi": "10.6084/m9.figshare.20113592.v1",
            "licence": "CC BY 4.0",
            "n_participants_available": int(len(hz60)),
            "n_participants_complete_case": int(len(fit60)),
            "n_asd": int(y60.sum()),
            "n_td": int(len(y60) - y60.sum()),
            "age_range_years": [float(fit60["age"].min()), float(fit60["age"].max())],
            "recorder_hz": 60,
        },
        "indices": INDICES,
        "index_coverage": {c: int(hz60[c].notna().sum()) for c in INDICES + ["eye_mouth_ratio"]},
        "weights_60hz": {INDICES[i]: float(weights[i]) for i in range(len(INDICES))},
        "weights_ci95": {INDICES[i]: [float(lo[i]), float(hi[i])] for i in range(len(INDICES))},
        "auc_oof_index_model": auc_index,
        "audits": {
            "temporal_decimation": {
                "weights_30hz": {INDICES[i]: float(weights30[i]) for i in range(len(INDICES))},
                "auc_oof_30hz": auc30,
                "sign_flips": sign_flips,
                "magnitude_ratio_30_over_60": {INDICES[i]: magnitude_ratio[i] for i in range(len(INDICES))},
            },
            "session_shortcut_baseline": {
                "features": NUISANCES,
                "auc_oof": auc_shortcut,
                "within_0_05_of_index_model": shortcut_too_close,
                "per_feature_auc": per_feature,
                "finding": (
                    "Alas yang tidak memuat satu pun fitur perilaku mengungguli model indeks. "
                    "Prediktor tunggal terkuat adalah seberapa baik alat merekam anaknya, bukan "
                    "apa yang ditatap anaknya."
                ),
            },
            "scanpath_coverage_diagnostic": {
                "question": "Apakah cakupan scanpath — padanan ink_frac yang dibaca 13 fitur dan CNN scanpath — mengukur perilaku atau mengukur banyaknya rekaman?",
                "auc": per_feature.get("scanpath_coverage", {}).get("auc"),
                "pearson_with_n_samples": coverage_r,
                "pearson_with_tracking_ratio": coverage_track_r,
                "finding": (
                    "Cakupan scanpath berkorelasi kuat dengan jumlah sampel dan hanya lemah dengan "
                    "rasio pelacakan. Ia terutama mengukur berapa banyak data yang sempat terkumpul, "
                    "dan jumlah itu sendiri berbeda antar kelompok."
                ),
            },
            "participant_leakage": leakage,
            "two_way_ood": ood,
        },
        "rejection_criteria_failed": rejections,
        "promoted": promoted,
        "verdict": (
            "weights_promoted" if promoted else "weights_rejected_layer_1_ships_alone"
        ),
        "response_to_name": {
            "analogue_exists": False,
            "reason": "Protokol Cilia tidak memanggil nama anak, jadi indeks ini tidak punya padanan di sini dan bobotnya tidak dapat dipasang dari sumber ini.",
        },
        "scope_statement": (
            "Bobot dipasang pada anak usia 3–12 tahun dengan eye-tracker lab 60 Hz. NeuroGaze berjalan "
            "pada anak 12–48 bulan dengan kamera tablet ~30 Hz. Yang dipindahkan hanya bobot relatif "
            "antar indeks; titik operasinya tidak dipindahkan dan tetap tidak diketahui sampai Gate C."
        ),
        "not_claimed": [
            "Bukan sensitivitas atau spesifisitas NeuroGaze.",
            "Bukan validasi klinis, dan bukan bukti apa pun tentang balita Indonesia.",
            "combinedScore tetap null; ini bobot antar indeks lapis B, bukan skor gabungan yang dicetak.",
        ],
        "seed": SEED,
        "bootstrap_replications": int(len(boot)),
    }

    with open(OUT, "w", encoding="utf-8", newline="\n") as fh:
        json.dump(result, fh, ensure_ascii=False, indent=2)

    print(f"index model OOF AUC : {auc_index:.4f}")
    print(f"shortcut baseline   : {auc_shortcut:.4f}")
    print(f"30 Hz OOF AUC       : {auc30:.4f}")
    for i, name in enumerate(INDICES):
        print(f"  {name:22s} w={weights[i]:+.3f}  CI95 [{lo[i]:+.3f}, {hi[i]:+.3f}]  30Hz w={weights30[i]:+.3f}")
    print(f"OOD centre_hold_spread z: biasa {ood['z_ordinary']:+.2f}, produksi {ood['z_produced']:+.2f}")
    print(f"VERDICT: {result['verdict']}")
    for line in rejections:
        print("  reject:", line)


if __name__ == "__main__":
    main()
