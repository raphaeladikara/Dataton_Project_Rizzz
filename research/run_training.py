"""Execute calibrated candidate training and export reproducible artifacts."""

from pathlib import Path

import numpy as np
import pandas as pd

from features import ALL_FEATURES, load_metadata
from training import MODEL_VERSION, save_json, train_nested_calibrated


ROOT = Path(__file__).resolve().parent
RESULTS = ROOT / "hasil"


def main() -> None:
    meta = load_metadata()
    frame = pd.read_csv(RESULTS / "fitur.csv")[ALL_FEATURES]
    labels = meta.label.to_numpy(dtype=int)
    groups = meta.participant.to_numpy()
    candidates = {}

    for feature_set in ("penuh", "geometri"):
        result = train_nested_calibrated(frame, labels, groups, feature_set)
        candidates[feature_set] = {
            "metrics": result.metrics,
            "model": result.model,
        }
        np.savez_compressed(
            RESULTS / f"training_oof_{feature_set}.npz",
            record_probability=result.record_probability,
            participant_probability=result.participant_probability,
            participant_label=result.participant_label,
            participant_id=result.participant_id,
        )

    # Geometry is the portable default; the degradation study is authoritative.
    save_json(RESULTS / "model.json", candidates["geometri"]["model"])
    save_json(
        RESULTS / "training.json",
        {
            "model_version": MODEL_VERSION,
            "selection_status": "provisional_pending_degradation",
            "provisional_feature_set": "geometri",
            "candidates": candidates,
        },
    )
    print(
        {
            name: round(candidate["metrics"]["auc_participant"], 4)
            for name, candidate in candidates.items()
        }
    )


if __name__ == "__main__":
    main()
