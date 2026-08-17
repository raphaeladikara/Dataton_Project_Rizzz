import json
from pathlib import Path

from prepare_contracts import canonical_hash, feature_schema


ROOT = Path(__file__).resolve().parent.parent


def test_feature_schema_hash_is_stable_and_has_13_features():
    schema = feature_schema()
    claimed = schema.pop("sha256")
    assert len(schema["features"]) == 13
    assert schema["liveCameraScoring"] is False
    assert claimed == canonical_hash(schema)


def test_generated_split_registry_has_no_participant_leakage():
    path = ROOT / "research" / "configs" / "split_registry_carette.json"
    if not path.exists():
        return
    registry = json.loads(path.read_text(encoding="utf-8"))
    for repeat in registry["repeats"]:
        for fold in repeat["folds"]:
            assert set(fold["trainParticipantIds"]).isdisjoint(fold["testParticipantIds"])
