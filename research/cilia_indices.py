"""Build behavioural indices from the published Cilia et al. 2022 eye-tracking data.

Why this exists
---------------
Layer 2 of docs/model_rujukan.md needs *relative weights between indices*, fitted
on labelled children. We have none of our own and will not record any before
ethics review. Cilia et al. published theirs under CC BY 4.0, so the weights can
be fitted there.

The decisive constraint, and the reason earlier attempts on this source failed to
transfer: fit in **index space, not pixel space**. The 13 ink-geometry features
and the scanpath CNN both encode where that study's stimulus content sat on
screen, so their decision boundary does not move to a different stimulus. Raw
(x, y, t) permits indices that refer to the *behaviour* instead — where the child
looked relative to where the cue pointed, measured within the child.

What is computed, and what each one is the analogue of
-----------------------------------------------------
- ``cue_lateral_gain``   -> NeuroGaze "mengikuti isyarat arah". The cued side is
  named in the stimulus filename (``g``/``gauche`` left, ``d``/``droite`` right),
  so the contrast is right-cued mean gaze x minus left-cued mean gaze x, screen
  normalised, within participant. No AOI annotation required, which matters:
  most cue stimuli in this release carry none.
- ``centre_hold_spread`` -> NeuroGaze "sebaran tatapan". Dispersion of gaze on
  the neutral ``devant`` stimuli, where the actor faces forward and points
  nowhere.
- ``social_dwell_frac``  -> social versus non-social preference, on the subset of
  stimuli that do carry AOI labels.
- ``eye_mouth_ratio``    -> eye-region versus mouth-region dwell.

Response to name has no analogue: the Cilia protocol never calls the child's
name. That is recorded, not patched.

Nothing here is a NeuroGaze operating point. Only relative weights transfer, and
the scope statement in docs/model_rujukan.md travels with them.
"""

from __future__ import annotations

import glob
import json
import os
import re
from dataclasses import dataclass, asdict

import numpy as np
import pandas as pd

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data", "cilia2022", "Eye-Tracking Dataset")
OUT = os.path.join(ROOT, "research", "hasil", "cilia")

# The recorder reports in screen pixels with overshoot past the panel edges.
# Normalising by the nominal panel keeps every index dimensionless, which is the
# only form in which a weight can move to a tablet with a different screen.
SCREEN_W, SCREEN_H = 1280.0, 1024.0

SOCIAL_AOI = re.compile(r"visage|yeux|bouche|corps|mains|t[eê]te", re.I)
NONSOCIAL_AOI = re.compile(r"chien|chat|ballon|balloon|jouet", re.I)
EYE_AOI = re.compile(r"yeux", re.I)
MOUTH_AOI = re.compile(r"bouche", re.I)

# Direction lives in the filename. Accept the abbreviated and spelled forms, and
# require a word boundary so "droite" does not also match inside another token.
CUE_LEFT = re.compile(r"(?:\bg\b|gauche)", re.I)
CUE_RIGHT = re.compile(r"(?:\bd\b|droite)", re.I)
# A cue trial names a lateral target; a neutral trial is the actor facing forward
# with nothing to follow.
CUE_TARGET = re.compile(r"chien|chat", re.I)
NEUTRAL = re.compile(r"devant", re.I)


@dataclass
class ParticipantIndices:
    participant_id: int
    label: int
    age: float
    gender: str
    cue_lateral_gain: float
    centre_hold_spread: float
    social_dwell_frac: float
    eye_mouth_ratio: float
    # Session-level nuisances. Never enter the behavioural model; they exist so
    # the shortcut baseline can be fitted on them alone.
    n_samples: int
    tracking_ratio: float
    fixation_frac: float
    blink_frac: float
    n_cue_trials: int
    # Fraction of a 64x64 grid the scanpath visits: the direct analogue of the
    # ``ink_frac`` feature the 13-feature set and the scanpath CNN both read off
    # a rendered image. Carried as a diagnostic, never as a model input — the
    # question it answers is whether scanpath coverage is downstream of how well
    # the tracker held the child, which would make it a recording artefact
    # wearing a behavioural feature's name.
    scanpath_coverage: float


def _stimulus_kind(stimulus: str) -> tuple[str, int]:
    """Return (kind, direction) where direction is -1 left, +1 right, 0 none."""
    s = str(stimulus)
    if not CUE_TARGET.search(s):
        return ("neutral" if NEUTRAL.search(s) else "other", 0)
    # Strip the leading trial number so a stray "1 d" cannot read as a direction.
    body = re.sub(r"^\s*\d+\s*", "", s)
    if CUE_RIGHT.search(body):
        return ("cue", 1)
    if CUE_LEFT.search(body):
        return ("cue", -1)
    return ("other", 0)


def _gaze_columns(frame: pd.DataFrame) -> tuple[pd.Series, pd.Series]:
    """Mean of both eyes where both are present, otherwise whichever exists."""
    parts_x, parts_y = [], []
    for side in ("Right", "Left"):
        cx, cy = f"Point of Regard {side} X [px]", f"Point of Regard {side} Y [px]"
        if cx in frame.columns and cy in frame.columns:
            parts_x.append(pd.to_numeric(frame[cx], errors="coerce"))
            parts_y.append(pd.to_numeric(frame[cy], errors="coerce"))
    if not parts_x:
        empty = pd.Series(np.nan, index=frame.index)
        return empty, empty
    return (
        pd.concat(parts_x, axis=1).mean(axis=1),
        pd.concat(parts_y, axis=1).mean(axis=1),
    )


def _aoi_series(frame: pd.DataFrame) -> pd.Series:
    cols = [c for c in frame.columns if c.startswith("AOI Name")]
    if not cols:
        return pd.Series("", index=frame.index, dtype=object)
    return frame[cols[0]].astype(str)


def _category(frame: pd.DataFrame) -> pd.Series:
    for c in ("Category Right", "Category Left", "Category Group"):
        if c in frame.columns:
            return frame[c].astype(str)
    return pd.Series("", index=frame.index, dtype=object)


def load_samples(decimate: int = 1) -> pd.DataFrame:
    """One tidy frame of fixation samples for every participant.

    ``decimate`` keeps every nth sample. 2 halves the 60 Hz recording to the
    ~30 Hz a tablet camera delivers, which is audit 1 in docs/model_rujukan.md.
    """
    files = sorted(glob.glob(os.path.join(DATA, "Eye-tracking Output", "*.csv")))
    rows = []
    for path in files:
        raw = pd.read_csv(path, low_memory=False)
        if "Participant" not in raw.columns or "Stimulus" not in raw.columns:
            continue
        x, y = _gaze_columns(raw)
        frame = pd.DataFrame({
            "participant": raw["Participant"].astype(str),
            "stimulus": raw["Stimulus"].astype(str),
            "x": x,
            "y": y,
            "aoi": _aoi_series(raw),
            "category": _category(raw),
            "tracking": pd.to_numeric(raw.get("Tracking Ratio [%]"), errors="coerce"),
        })
        frame = frame[frame["participant"].str.fullmatch(r"\d+")]
        if decimate > 1:
            frame = frame.iloc[::decimate]
        rows.append(frame)
    samples = pd.concat(rows, ignore_index=True)
    samples["participant"] = samples["participant"].astype(int)
    kinds = samples["stimulus"].map(_stimulus_kind)
    samples["kind"] = [k for k, _ in kinds]
    samples["direction"] = [d for _, d in kinds]
    return samples


def build_indices(samples: pd.DataFrame, meta: pd.DataFrame) -> pd.DataFrame:
    out: list[ParticipantIndices] = []
    for pid, g in samples.groupby("participant"):
        row = meta.loc[meta["ParticipantID"] == pid]
        if row.empty:
            continue
        n_all = len(g)
        cat = g["category"]
        fixations = g[cat.str.contains("Fixation", case=False, na=False)]
        valid = fixations.dropna(subset=["x", "y"])

        nx = valid["x"] / SCREEN_W
        ny = valid["y"] / SCREEN_H

        cues = valid[valid["kind"] == "cue"]
        left = cues[cues["direction"] == -1]
        right = cues[cues["direction"] == 1]
        # Within-subject: the child is compared against itself across the two
        # cue directions, so a rightward gaze habit cancels instead of scoring.
        if len(left) >= 30 and len(right) >= 30:
            gain = float(right["x"].mean() / SCREEN_W - left["x"].mean() / SCREEN_W)
        else:
            gain = np.nan

        neutral = valid[valid["kind"] == "neutral"]
        if len(neutral) >= 30:
            spread = float(np.hypot(
                neutral["x"].std(ddof=1) / SCREEN_W,
                neutral["y"].std(ddof=1) / SCREEN_H,
            ))
        else:
            spread = float(np.hypot(nx.std(ddof=1), ny.std(ddof=1))) if len(nx) > 2 else np.nan

        aoi = valid["aoi"]
        social = aoi.str.contains(SOCIAL_AOI, na=False).sum()
        nonsocial = aoi.str.contains(NONSOCIAL_AOI, na=False).sum()
        social_frac = float(social / (social + nonsocial)) if (social + nonsocial) >= 30 else np.nan

        eyes = aoi.str.contains(EYE_AOI, na=False).sum()
        mouth = aoi.str.contains(MOUTH_AOI, na=False).sum()
        eye_ratio = float(eyes / (eyes + mouth)) if (eyes + mouth) >= 30 else np.nan

        if len(nx) > 10:
            gx = np.clip((nx.to_numpy() * 64).astype(int), 0, 63)
            gy = np.clip((ny.to_numpy() * 64).astype(int), 0, 63)
            coverage = float(len(set(zip(gx.tolist(), gy.tolist()))) / (64 * 64))
        else:
            coverage = np.nan

        out.append(ParticipantIndices(
            participant_id=int(pid),
            label=1 if str(row["Class"].iloc[0]).strip().upper() == "ASD" else 0,
            age=float(row["Age"].iloc[0]),
            gender=str(row["Gender"].iloc[0]),
            cue_lateral_gain=gain,
            centre_hold_spread=spread,
            social_dwell_frac=social_frac,
            eye_mouth_ratio=eye_ratio,
            n_samples=int(n_all),
            tracking_ratio=float(g["tracking"].mean(skipna=True)) if g["tracking"].notna().any() else np.nan,
            fixation_frac=float(len(fixations) / n_all) if n_all else np.nan,
            blink_frac=float(cat.str.contains("Blink", case=False, na=False).sum() / n_all) if n_all else np.nan,
            n_cue_trials=int(cues["stimulus"].nunique()),
            scanpath_coverage=coverage,
        ))
    return pd.DataFrame([asdict(o) for o in out]).sort_values("participant_id").reset_index(drop=True)


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    meta = pd.read_csv(os.path.join(DATA, "Metadata_Participants.csv"))
    for decimate, name in ((1, "indeks_60hz.csv"), (2, "indeks_30hz.csv")):
        samples = load_samples(decimate=decimate)
        table = build_indices(samples, meta)
        table.to_csv(os.path.join(OUT, name), index=False)
        print(f"{name}: {len(table)} participants, {table['label'].sum()} ASD")
        print(table[["cue_lateral_gain", "centre_hold_spread", "social_dwell_frac", "eye_mouth_ratio"]].notna().sum().to_dict())
    with open(os.path.join(OUT, "sumber.json"), "w", encoding="utf-8") as fh:
        json.dump({
            "dataset": "Cilia, Carette, Elbattah, Guérin, Dequen (2022)",
            "doi": "10.6084/m9.figshare.20113592.v1",
            "licence": "CC BY 4.0",
            "screen_normalisation_px": [SCREEN_W, SCREEN_H],
            "note": "Indeks perilaku, bukan fitur piksel. Hanya bobot relatif yang dipindahkan; titik operasi tidak.",
        }, fh, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()
