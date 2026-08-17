"""Export an anonymized, participant-weighted legacy reference for the web app.

The artifact is descriptive only. It lets the replay report compare a session with
the 54 Carette participants without exposing participant IDs or overweighting
children who contributed more scanpath images.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

import numpy as np
import pandas as pd

from features import GEOMETRY_FEATURES, load_metadata


ROOT = Path(__file__).resolve().parents[1]
FEATURES_PATH = ROOT / "research" / "hasil" / "fitur.csv"
OUTPUT_PATH = ROOT / "app" / "public" / "models" / "participant_reference.json"
QUANTILE_LEVELS = np.linspace(0, 1, 21)


def build_reference() -> dict:
    metadata = load_metadata().reset_index(drop=True)
    features = pd.read_csv(FEATURES_PATH)
    if len(metadata) != len(features):
        raise RuntimeError(
            f"Feature/metadata mismatch: {len(features)} rows vs {len(metadata)} rows"
        )
    missing = sorted(set(GEOMETRY_FEATURES) - set(features.columns))
    if missing:
        raise RuntimeError(f"Missing geometry features: {missing}")

    joined = features[GEOMETRY_FEATURES].copy()
    joined["participant"] = metadata["participant"].to_numpy()
    participant_means = joined.groupby("participant", sort=True)[GEOMETRY_FEATURES].mean()
    if len(participant_means) != 54:
        raise RuntimeError(f"Expected 54 participants, found {len(participant_means)}")

    quantiles = {
        feature: [float(value) for value in participant_means[feature].quantile(QUANTILE_LEVELS)]
        for feature in GEOMETRY_FEATURES
    }
    payload = {
        "schemaVersion": 1,
        "status": "legacy_descriptive_not_toddler_norm",
        "dataset": "Carette eye-tracking scanpath PNG",
        "sourceDevice": "SMI Red-m 250 Hz",
        "population": "school-age children; mean age 7.88 years",
        "aggregation": "mean_per_participant_before_quantiles",
        "records": int(len(features)),
        "participants": int(len(participant_means)),
        "quantileLevels": [float(value) for value in QUANTILE_LEVELS],
        "features": quantiles,
        "limitations": [
            "Not a norm for children aged 16-30 months.",
            "Not measured with a tablet camera.",
            "Descriptive percentiles must not change the clinical decision.",
        ],
    }
    canonical = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode()
    payload["sha256WithoutChecksum"] = hashlib.sha256(canonical).hexdigest()
    return payload


def main() -> None:
    payload = build_reference()
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(
        json.dumps(
            {
                "output": str(OUTPUT_PATH.relative_to(ROOT)),
                "records": payload["records"],
                "participants": payload["participants"],
            }
        )
    )


if __name__ == "__main__":
    main()
