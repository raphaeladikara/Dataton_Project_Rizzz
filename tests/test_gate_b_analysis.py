import json

import numpy as np

from analyze_gate_b import icc_a1, load_pairs, summarize


def test_icc_absolute_agreement_is_high_for_consistent_pairs():
    values = np.asarray([[0.1, 0.11], [0.3, 0.31], [0.5, 0.51], [0.7, 0.71]])
    assert icc_a1(values) > 0.95


def _webgazer_pair(index: int, status: str = "comparison_ready"):
    return {
        "schema": "neurogaze-webgazer-comparison-v3",
        "participantId": f"GB-{index}",
        "visitId": f"VIS-{index}",
        "pairId": f"GBC-{index}",
        "status": status,
        "contractVerified": status == "comparison_ready",
        "medianErrorPx": 40.0 + index,
        "p90ErrorPx": 70.0 + index,
        "medianErrorNorm": 0.04 + index / 1000,
        "p90ErrorNorm": 0.07 + index / 1000,
        "aoiAgreement": 0.98,
        "primaryAoiMatched": True,
        "aoiDistribution": {
            "webgazer": {"face": 0.2, "left_target": 0.3, "right_target": 0.3, "background": 0.2},
            "tabletNeurogaze": {"face": 0.21, "left_target": 0.29, "right_target": 0.3, "background": 0.2},
        },
        "featurePairs": {
            "span_x": {"tablet": 0.5 + index / 100, "reference": 0.49 + index / 100, "difference": 0.01}
        },
        "referenceRuntime": {
            "library": "WebGazer.js",
            "version": "3.5.3",
            "listenerContract": "setGazeListener(data, elapsedTime)",
            "coordinateSpace": "viewport_css_pixels",
        },
        "integrity": {
            "webgazerSamplesSha256": f"web-{index}",
            "tabletSamplesSha256": f"tablet-{index}",
            "sampleMatchesSha256": f"matches-{index}",
        },
    }


def test_current_webgazer_exports_are_loaded_and_summarized(tmp_path):
    paths = []
    pairs = [_webgazer_pair(index) for index in range(27)]
    pairs.extend(_webgazer_pair(index, "withheld") for index in range(27, 30))
    for index, pair in enumerate(pairs):
        path = tmp_path / f"pair-{index}.json"
        path.write_text(json.dumps(pair), encoding="utf-8")
        paths.append(path)

    result = summarize(load_pairs(paths))

    assert result["schema"] == "neurogaze-webgazer-cohort-summary-v3"
    assert result["purpose"] == "tablet_webgazer_reference_agreement_not_asd"
    assert result["nPairsTotal"] == 30
    assert result["nPairsReady"] == 27
    assert result["nPairsWithheld"] == 3
    assert result["medianOfPairMedianErrorPx"] == 53.0
    assert result["medianOfPairMedianErrorNorm"] == 0.053
    assert result["referenceRuntime"]["library"] == "WebGazer.js"
    assert result["decision"] == "NOT_PASSED"


def test_webgazer_gate_b_passes_the_recorded_acceptance_contract():
    pairs = []
    for index in range(30):
        pair = _webgazer_pair(index, "comparison_ready" if index < 27 else "withheld")
        pair["medianErrorNorm"] = 0.041
        pair["aoiAgreement"] = 0.998
        pairs.append(pair)

    result = summarize(pairs)

    assert result["decision"] == "PASSED"
    assert result["acceptanceCriteria"] == {
        "minimumPairs": 30,
        "minimumValidPairRate": 0.9,
        "maximumMedianErrorNorm": 0.05,
        "minimumMeanAoiAgreement": 0.95,
        "minimumPrimaryAoiAgreementRate": 0.95,
    }


def test_gate_b_loader_rejects_non_webgazer_contract(tmp_path):
    invalid = tmp_path / "invalid.json"
    invalid.write_text(json.dumps({"schema": "unknown"}), encoding="utf-8")
    with np.testing.assert_raises_regex(ValueError, "tidak didukung"):
        load_pairs([invalid])
