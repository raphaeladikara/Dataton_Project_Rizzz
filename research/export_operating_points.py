"""Backfill both operating points into the exported model artifacts.

training.py now emits decision.operating_points, but the shipped artifacts were
written before it did. Retraining to pick them up would also overwrite the
degradation study's selection metadata in training.json, so this script derives
the points from the stored participant-level OOF predictions — the same folds the
thresholds were always measured on — and rewrites only the decision blocks.

Usage:
  python research/export_operating_points.py [--check]
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from typing import Any

import numpy as np

from training import operating_points, save_json


ROOT = Path(__file__).resolve().parent.parent
RESULTS = ROOT / "research" / "hasil"
WEB_MODEL = ROOT / "app" / "public" / "models" / "model.json"


def _oof(feature_set: str) -> tuple[np.ndarray, np.ndarray]:
    stored = np.load(RESULTS / f"training_oof_{feature_set}.npz", allow_pickle=True)
    return stored["participant_probability"], stored["participant_label"]


def _with_points(model: dict[str, Any], feature_set: str) -> dict[str, Any]:
    points = operating_points(*_oof(feature_set))
    updated = {key: value for key, value in model.items() if key != "sha256_without_checksum"}
    updated["decision"] = {
        # Kept for compatibility with readers that predate operating_points;
        # it now points at the default, which is Youden.
        "refer_if_probability_gte": points["youden"]["threshold"],
        "default_operating_point": "youden",
        "operating_points": points,
        "threshold_status": model["decision"]["threshold_status"],
        "quality_gate_required": model["decision"]["quality_gate_required"],
    }
    payload = json.dumps(updated, sort_keys=True).encode("utf-8")
    updated["sha256_without_checksum"] = hashlib.sha256(payload).hexdigest()
    return updated


def rewrite(check_only: bool = False) -> list[str]:
    model = json.loads((RESULTS / "model.json").read_text(encoding="utf-8"))
    training = json.loads((RESULTS / "training.json").read_text(encoding="utf-8"))

    updated_model = _with_points(model, model["feature_set"])
    updated_training = json.loads(json.dumps(training))
    for feature_set, candidate in updated_training["candidates"].items():
        candidate["model"] = _with_points(candidate["model"], feature_set)

    changed: list[str] = []
    for path, before, after in (
        (RESULTS / "model.json", model, updated_model),
        (RESULTS / "training.json", training, updated_training),
        (WEB_MODEL, json.loads(WEB_MODEL.read_text(encoding="utf-8")), updated_model),
    ):
        if before == after:
            continue
        changed.append(str(path.relative_to(ROOT)))
        if not check_only:
            save_json(path, after)
    return changed


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="report drift without writing")
    args = parser.parse_args()
    changed = rewrite(check_only=args.check)
    if not changed:
        print("Operating points already exported.")
    elif args.check:
        raise SystemExit(f"Stale operating points in: {', '.join(changed)}")
    else:
        print(f"Rewrote decision blocks in: {', '.join(changed)}")


if __name__ == "__main__":
    main()
