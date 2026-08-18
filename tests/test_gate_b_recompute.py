import json
from pathlib import Path

# pyproject.toml sets pythonpath = ["research"], matching tests/test_gate_b_analysis.py.
from recompute_gate_b import (
    GEOMETRY_TOLERANCE_NORM,
    GEOMETRY_TOLERANCE_PX,
    accuracy_against_targets,
    recompute_pair,
    recomputation_report,
)

ROOT = Path(__file__).resolve().parent.parent
PAIRS = sorted((ROOT / "research" / "hasil" / "gate_b" / "pasangan").glob("*.json"))
SUMMARY = ROOT / "research" / "hasil" / "gate_b" / "gate_b_summary.json"


def _load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def _ready() -> list[dict]:
    return [pair for pair in map(_load, PAIRS) if pair["status"] == "comparison_ready"]


def test_recomputed_distances_match_the_stored_fields():
    mismatches = []
    for pair in _ready():
        recomputed = recompute_pair(pair)
        for field, tolerance in (
            ("medianErrorPx", GEOMETRY_TOLERANCE_PX),
            ("p90ErrorPx", GEOMETRY_TOLERANCE_PX),
            ("medianErrorNorm", GEOMETRY_TOLERANCE_NORM),
        ):
            if abs(recomputed[field] - pair[field]) > tolerance:
                mismatches.append((pair["pairId"], field, recomputed[field], pair[field]))
    assert not mismatches, mismatches


def test_recompute_derives_distance_from_coordinates_not_stored_distance():
    pair = _load(PAIRS[0])
    stripped = json.loads(json.dumps(pair))
    for match in stripped["sampleMatches"]:
        match.pop("distancePx", None)
        match.pop("distanceNorm", None)
    assert abs(recompute_pair(stripped)["medianErrorPx"] - pair["medianErrorPx"]) < 1e-3


def test_every_aoi_classification_delta_is_published_in_the_summary():
    """Recomputation disagrees with capture on a handful of samples.

    That difference belongs in the published summary, not in a comment.
    """
    report = recomputation_report(_ready())
    published = _load(SUMMARY)["recomputation"]
    assert published["pairsWithAoiClassificationDelta"] == report["pairsWithAoiClassificationDelta"]
    assert {delta["pairId"] for delta in published["aoiClassificationDeltas"]} == {
        delta["pairId"] for delta in report["aoiClassificationDeltas"]
    }
    assert published["meanAoiAgreementRecomputed"] == report["meanAoiAgreementRecomputed"]


def test_the_recomputed_cohort_still_clears_the_acceptance_criterion():
    summary = _load(SUMMARY)
    recomputed = summary["recomputation"]["meanAoiAgreementRecomputed"]
    assert recomputed >= summary["acceptanceCriteria"]["minimumMeanAoiAgreement"]
    assert recomputed <= summary["meanAoiAgreement"]


def test_accuracy_against_targets_refuses_pairs_without_a_known_target_block():
    pair = _load(PAIRS[0])
    try:
        accuracy_against_targets(pair)
    except ValueError as error:
        assert "known-target" in str(error)
    else:
        raise AssertionError("a pair without accuracyTargets must not yield degrees")
