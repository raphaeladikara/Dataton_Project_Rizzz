from prospective_evaluation import eligible_thresholds, endpoint_summary, threshold_metrics


def test_endpoint_summary_keeps_abstentions_in_denominator():
    result = endpoint_summary([0, 0, 1, 1], [.1, .2, .8, .9], [True, False, True, True])
    assert result["denominator"] == 4
    assert result["coverage"] == .75
    assert result["abstentionRate"] == .25


def test_threshold_metrics_supports_local_prevalence_and_capacity_filter():
    row = threshold_metrics([0, 0, 1, 1], [.1, .3, .7, .9], .5, prevalence=.01)
    assert row["sensitivity"] == 1
    assert row["specificity"] == 1
    assert row["ppv"] == 1
    assert eligible_thresholds([0, 0, 1, 1], [.1, .3, .7, .9], minimum_sensitivity=.9, maximum_referral_rate=.5)


import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SIMULATION = ROOT / "research" / "hasil" / "gate_c_simulation.json"


def _simulation() -> dict:
    return json.loads(SIMULATION.read_text(encoding="utf-8"))


def test_simulation_covers_every_relevant_operating_point():
    arms = {arm["id"] for arm in _simulation()["arms"]}
    assert arms == {"lr_target_sensitivity", "lr_youden", "geopref_published", "gate_c_target"}


def test_geopref_arm_uses_the_published_external_operating_point():
    arm = next(a for a in _simulation()["arms"] if a["id"] == "geopref_published")
    assert arm["assumptions"]["sensitivity"] == 0.17
    assert arm["assumptions"]["specificity"] == 0.98
    assert arm["assumptions"]["source"].startswith("Wen et al. 2022")
    assert arm["operational_projection"]["referral_rate"] < 0.05


def test_gate_c_target_arm_cites_the_tablet_precedent():
    arm = next(a for a in _simulation()["arms"] if a["id"] == "gate_c_target")
    assert arm["assumptions"]["sensitivity"] == 0.878
    assert arm["assumptions"]["specificity"] == 0.808
    assert "Perochon" in arm["assumptions"]["source"]
    assert arm["status"] == "target_not_achieved"


def test_no_arm_silently_uses_the_cnn():
    for arm in _simulation()["arms"]:
        assert "cnn" not in arm["assumptions"]["source"].lower()


def test_logistic_regression_arms_track_the_exported_model():
    model = json.loads((ROOT / "research" / "hasil" / "model.json").read_text(encoding="utf-8"))
    points = model["decision"]["operating_points"]
    by_id = {arm["id"]: arm for arm in _simulation()["arms"]}
    for arm_id, point_name in (
        ("lr_target_sensitivity", "target_sensitivity_090"),
        ("lr_youden", "youden"),
    ):
        assumptions = by_id[arm_id]["assumptions"]
        assert assumptions["sensitivity"] == round(points[point_name]["sensitivity"], 4)
        assert assumptions["specificity"] == round(points[point_name]["specificity"], 4)


def test_the_published_simulation_matches_a_fresh_run():
    from prospective_evaluation import gate_c_simulation

    published = _simulation()
    fresh = gate_c_simulation()
    assert fresh["arms"] == published["arms"]
    assert fresh["assumptions"] == published["assumptions"]
