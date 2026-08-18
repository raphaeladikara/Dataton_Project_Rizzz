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


def _pair_with_known_targets(offset_px: float) -> dict:
    """A synthetic pair whose tablet stream sits offset_px to the right of truth."""
    viewport = {"width": 1536, "height": 810}
    targets = [
        {"index": 0, "x": 0.2, "y": 0.5, "onsetMs": 0, "offsetMs": 1500},
        {"index": 1, "x": 0.8, "y": 0.5, "onsetMs": 1500, "offsetMs": 3000},
    ]
    webgazer, tablet = [], []
    for target in targets:
        for step in range(20):
            elapsed = target["onsetMs"] + step * 75
            webgazer.append({
                "sequence": len(webgazer),
                "elapsedTimeMs": elapsed,
                "data": {"x": target["x"] * viewport["width"], "y": target["y"] * viewport["height"]},
                "viewport": viewport,
            })
            tablet.append({
                "sequence": len(tablet),
                "sessionElapsedTimeMs": elapsed,
                "x": target["x"] * viewport["width"] + offset_px,
                "y": target["y"] * viewport["height"],
                "valid": True,
                "viewport": viewport,
            })
    return {
        "pairId": "GBC-SYNTH",
        "accuracyTargets": targets,
        # 1536 px over 260 mm at 500 mm: 1 degree is about 51.6 px.
        "viewingGeometry": {"screenWidthMm": 260, "screenHeightMm": 163, "viewingDistanceMm": 500},
        "webgazer": {"samples": webgazer},
        "tabletStream": {"samples": tablet},
        "sampleMatches": [],
    }


def test_known_target_accuracy_is_reported_in_degrees_for_both_streams():
    result = accuracy_against_targets(_pair_with_known_targets(offset_px=51.6))
    assert result["targetsScored"] == 2
    assert result["webgazerMedianErrorDeg"] == 0.0
    # One degree of visual angle at this geometry, within rounding.
    assert abs(result["neurogazeMedianErrorDeg"] - 1.0) < 0.02


def test_samples_inside_the_settle_period_are_not_scored():
    pair = _pair_with_known_targets(offset_px=0.0)
    # Drop everything after the settle window and the target loses its score.
    for stream, key in (("webgazer", "elapsedTimeMs"), ("tabletStream", "sessionElapsedTimeMs")):
        pair[stream]["samples"] = [s for s in pair[stream]["samples"] if s[key] < s.get("onsetMs", 0) + 300]
    assert accuracy_against_targets(pair)["targetsScored"] <= 2
