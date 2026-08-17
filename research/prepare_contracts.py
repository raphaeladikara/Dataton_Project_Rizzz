"""Freeze the current Neurogaze research contracts used by the final paper."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.model_selection import StratifiedGroupKFold

from features import GEOMETRY_FEATURES, load_metadata


ROOT = Path(__file__).resolve().parent.parent
CONFIG = ROOT / "research" / "configs"
SEEDS = (42, 314, 2718, 1618, 2026)


def canonical_hash(value: object) -> str:
    payload = json.dumps(value, sort_keys=True, separators=(",", ":")).encode()
    return hashlib.sha256(payload).hexdigest()


def write_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def feature_schema() -> dict:
    body = {
        "schemaVersion": 1,
        "id": "neurogaze-geometry-replay-v1",
        "inputContract": "carette_scanpath_replay_only",
        "raster": {"width": 640, "height": 480, "lineRadiusPx": 1, "maxConnectedGapMs": 180},
        "features": [
            {"name": name, "dtype": "float64", "unit": "normalized", "required": True}
            for name in GEOMETRY_FEATURES
        ],
        "excluded": ["velocity", "acceleration", "jerk"],
        "exclusionReason": "Not reliable for noisy camera gaze without paired validation.",
        "liveCameraScoring": False,
    }
    body["sha256"] = canonical_hash(body)
    return body


def dataset_manifest(meta: pd.DataFrame, schema_hash: str) -> dict:
    inventory = "\n".join(f"{row.file}|{row.participant}|{row.label}" for row in meta.itertuples())
    return {
        "schemaVersion": 1,
        "datasetId": "carette-eye-tracking-proof-of-principle",
        "status": "replay_only_not_clinically_deployable",
        "records": int(len(meta)),
        "participants": int(meta.participant.nunique()),
        "labels": meta.groupby("group").size().astype(int).to_dict(),
        "featureSchemaHash": schema_hash,
        "inventorySha256": hashlib.sha256(inventory.encode()).hexdigest(),
        "targetPopulationMatch": False,
        "limitations": ["Not toddlers aged 16-30 months", "Not tablet camera", "Rendered PNG has no raw timestamps"],
    }


def split_registry(meta: pd.DataFrame, schema_hash: str) -> dict:
    y = meta.label.to_numpy(int)
    groups = meta.participant.to_numpy(str)
    repeats = []
    for seed in SEEDS:
        folds = []
        splitter = StratifiedGroupKFold(n_splits=5, shuffle=True, random_state=seed)
        for fold, (train, test) in enumerate(splitter.split(np.zeros(len(meta)), y, groups)):
            train_ids = sorted(set(groups[train]))
            test_ids = sorted(set(groups[test]))
            if set(train_ids) & set(test_ids):
                raise RuntimeError("participant leakage in split registry")
            folds.append({"fold": fold, "trainParticipantIds": train_ids, "testParticipantIds": test_ids})
        repeats.append({"seed": seed, "folds": folds})
    registry = {
        "schemaVersion": 1,
        "datasetId": "carette-eye-tracking-proof-of-principle",
        "groupKey": "participant",
        "featureSchemaHash": schema_hash,
        "externalTest": None,
        "repeats": repeats,
    }
    registry["sha256"] = canonical_hash(registry)
    return registry


def session_schema() -> dict:
    return {
        "schemaVersion": 3,
        "appVersion": "3.0.0-child-flow",
        "stimulusVersion": "ID-joint-cues-vector-v3",
        "stimulusDurationSeconds": 66,
        "phases": 10,
        "scoredTrials": 8,
        "sessionPurposes": ["demo_replay", "gate_a_adult", "target_population_research"],
        "liveCameraScoring": False,
        "requiredHierarchy": ["child_id", "visit_id", "session_id"],
        "privacy": {"pseudonymRequired": True, "rawMediaDefault": False, "retention": "until_tab_closed_or_operator_export"},
        "referenceOutcomeStorage": "separate_and_blinded",
    }


def main() -> None:
    meta = load_metadata().reset_index(drop=True)
    schema = feature_schema()
    manifest = dataset_manifest(meta, schema["sha256"])
    registry = split_registry(meta, schema["sha256"])
    write_json(CONFIG / "feature_schema.json", schema)
    write_json(CONFIG / "dataset_manifest_carette.json", manifest)
    write_json(CONFIG / "split_registry_carette.json", registry)
    write_json(CONFIG / "session_schema.json", session_schema())
    print(json.dumps({"featureSchemaHash": schema["sha256"], "splitRegistryHash": registry["sha256"]}, indent=2))


if __name__ == "__main__":
    main()
