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


def _model() -> dict:
    return json.loads((ROOT / "research" / "hasil" / "model.json").read_text(encoding="utf-8"))


def test_model_exports_both_operating_points():
    points = _model()["decision"]["operating_points"]
    assert set(points) == {"target_sensitivity_090", "youden"}
    assert abs(points["youden"]["threshold"] - 0.4985) < 1e-3
    assert abs(points["youden"]["specificity"] - 0.821) < 1e-2
    assert abs(points["target_sensitivity_090"]["sensitivity"] - 0.9231) < 1e-3


def test_default_operating_point_is_youden():
    decision = _model()["decision"]
    assert decision["default_operating_point"] == "youden"
    assert decision["refer_if_probability_gte"] == decision["operating_points"]["youden"]["threshold"]


def test_operating_points_are_reproducible_from_the_stored_oof_predictions():
    import numpy as np

    from training import operating_points

    stored = np.load(ROOT / "research" / "hasil" / "training_oof_geometri.npz", allow_pickle=True)
    recomputed = operating_points(stored["participant_probability"], stored["participant_label"])
    exported = _model()["decision"]["operating_points"]
    for name, point in recomputed.items():
        for field in ("threshold", "sensitivity", "specificity"):
            assert abs(point[field] - exported[name][field]) < 1e-9, (name, field)


def test_the_shipped_web_model_matches_the_research_export():
    web = json.loads((ROOT / "app" / "public" / "models" / "model.json").read_text(encoding="utf-8"))
    assert web == _model()
