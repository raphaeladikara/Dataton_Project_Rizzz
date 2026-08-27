"""Aggregate canonical Neurogaze–WebGazer Gate B comparison logs.

Usage:
  python research/analyze_gate_b.py research/hasil/gate_b/pasangan/*.json --output research/hasil/gate_b/gate_b_summary.json

This script reports measurement agreement and applies the recorded Gate B contract.
It never evaluates or predicts ASD.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from typing import Any

import numpy as np

from recompute_gate_b import recomputation_report, verify_pair_metrics


WEBGAZER_SCHEMA = "neurogaze-webgazer-comparison-v3"

WEBGAZER_ACCEPTANCE_CRITERIA = {
    "minimumPairs": 30,
    "minimumValidPairRate": 0.9,
    "maximumMedianErrorNorm": 0.05,
    "minimumMeanAoiAgreement": 0.95,
    "minimumPrimaryAoiAgreementRate": 0.95,
}


def load_pairs(paths: list[Path]) -> list[dict[str, Any]]:
    pairs: list[dict[str, Any]] = []
    seen: set[tuple[str, str, str]] = set()
    for path in paths:
        value = json.loads(path.read_text(encoding="utf-8"))
        schema = str(value.get("schema"))
        if schema != WEBGAZER_SCHEMA:
            raise ValueError(f"{path}: schema Gate B tidak didukung: {schema}")
        key = (str(value.get("participantId")), str(value.get("visitId")), str(value.get("pairId")))
        if key in seen:
            raise ValueError(f"Pasangan duplikat: {key}")
        seen.add(key)
        pairs.append(value)
    if len(pairs) < 2:
        raise ValueError("Analisis kohort memerlukan minimal 2 pasangan; pilot reliability biasanya membutuhkan lebih banyak.")
    return pairs


def icc_a1(values: np.ndarray) -> float | None:
    """ICC(A,1): two-way random effects, absolute agreement, single measure."""
    if values.ndim != 2 or values.shape[1] != 2 or values.shape[0] < 2:
        return None
    n, k = values.shape
    grand = values.mean()
    row_means = values.mean(axis=1)
    col_means = values.mean(axis=0)
    ms_rows = k * np.square(row_means - grand).sum() / (n - 1)
    ms_cols = n * np.square(col_means - grand).sum() / (k - 1)
    residual = values - row_means[:, None] - col_means[None, :] + grand
    ms_error = np.square(residual).sum() / ((n - 1) * (k - 1))
    denominator = ms_rows + (k - 1) * ms_error + k * (ms_cols - ms_error) / n
    return float((ms_rows - ms_error) / denominator) if denominator else None


def bootstrap_icc(values: np.ndarray, iterations: int = 2000, seed: int = 20260802) -> list[float] | None:
    if len(values) < 3:
        return None
    rng = np.random.default_rng(seed)
    estimates: list[float] = []
    for _ in range(iterations):
        sampled = values[rng.integers(0, len(values), len(values))]
        estimate = icc_a1(sampled)
        if estimate is not None and np.isfinite(estimate):
            estimates.append(estimate)
    if not estimates:
        return None
    return [float(np.quantile(estimates, 0.025)), float(np.quantile(estimates, 0.975))]


def feature_agreement(pairs: list[dict[str, Any]]) -> dict[str, Any]:
    names = sorted(set.intersection(*(set(pair.get("featurePairs", {})) for pair in pairs)))
    output: dict[str, Any] = {}
    for name in names:
        values = np.asarray([[pair["featurePairs"][name]["tablet"], pair["featurePairs"][name]["reference"]] for pair in pairs], dtype=float)
        differences = values[:, 0] - values[:, 1]
        mean_difference = float(differences.mean())
        sd_difference = float(differences.std(ddof=1)) if len(differences) > 1 else 0.0
        output[name] = {
            "nPairs": len(values),
            "iccA1": icc_a1(values),
            "iccA1Bootstrap95CI": bootstrap_icc(values),
            "blandAltmanMeanDifference": mean_difference,
            "blandAltmanLower95": mean_difference - 1.96 * sd_difference,
            "blandAltmanUpper95": mean_difference + 1.96 * sd_difference,
            "tabletMean": float(values[:, 0].mean()),
            "referenceMean": float(values[:, 1].mean()),
        }
    return output


def _rounded(value: float) -> float:
    return round(float(value), 6)


def _mean_aoi_distribution(pairs: list[dict[str, Any]], stream: str) -> dict[str, float]:
    names = ("face", "left_target", "right_target", "background")
    return {
        name: _rounded(np.mean([pair["aoiDistribution"][stream][name] for pair in pairs]))
        for name in names
    }


def _webgazer_input_digest(pairs: list[dict[str, Any]]) -> str:
    digest_input = [
        {
            "pairId": pair["pairId"],
            "webgazerSamplesSha256": pair.get("integrity", {}).get("webgazerSamplesSha256"),
            "tabletSamplesSha256": pair.get("integrity", {}).get("tabletSamplesSha256"),
            "sampleMatchesSha256": pair.get("integrity", {}).get("sampleMatchesSha256"),
        }
        for pair in sorted(pairs, key=lambda item: item["pairId"])
    ]
    payload = json.dumps(digest_input, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def summarize_webgazer(pairs: list[dict[str, Any]]) -> dict[str, Any]:
    ready = [pair for pair in pairs if pair.get("status") == "comparison_ready" and pair.get("contractVerified") is True]
    # Every distance below is rederived from the matched coordinates before it is
    # aggregated, so the summary reports checked numbers rather than trusted ones.
    verify_pair_metrics(ready)
    recomputation = recomputation_report(ready)
    valid_pair_rate = len(ready) / len(pairs)
    median_error_px = _rounded(np.median([pair["medianErrorPx"] for pair in ready])) if ready else None
    median_error_norm = _rounded(np.median([pair["medianErrorNorm"] for pair in ready])) if ready else None
    p90_error_px = _rounded(np.quantile([pair["medianErrorPx"] for pair in ready], 0.9)) if ready else None
    mean_aoi = _rounded(np.mean([pair["aoiAgreement"] for pair in ready])) if ready else None
    primary_count = sum(pair.get("primaryAoiMatched") is True for pair in ready)
    primary_rate = primary_count / len(ready) if ready else None
    agreements = feature_agreement(ready) if len(ready) >= 2 else {}
    for feature in agreements.values():
        for key, value in list(feature.items()):
            if isinstance(value, float):
                feature[key] = _rounded(value)
            elif isinstance(value, list):
                feature[key] = [_rounded(item) for item in value]
    icc_values = [item["iccA1"] for item in agreements.values() if item.get("iccA1") is not None]
    criteria = WEBGAZER_ACCEPTANCE_CRITERIA
    passed = (
        len(pairs) >= criteria["minimumPairs"]
        and valid_pair_rate >= criteria["minimumValidPairRate"]
        and median_error_norm is not None
        and median_error_norm <= criteria["maximumMedianErrorNorm"]
        and mean_aoi is not None
        and mean_aoi >= criteria["minimumMeanAoiAgreement"]
        and primary_rate is not None
        and primary_rate >= criteria["minimumPrimaryAoiAgreementRate"]
    )
    reference_runtime = ready[0].get("referenceRuntime") if ready else None
    return {
        "schema": "neurogaze-webgazer-cohort-summary-v3",
        "purpose": "tablet_webgazer_reference_agreement_not_asd",
        "measurementScope": "Agreement between the NeuroGaze browser stream and WebGazer.js as the project reference.",
        "nPairsTotal": len(pairs),
        "nPairsReady": len(ready),
        "nPairsWithheld": len(pairs) - len(ready),
        "validPairRate": _rounded(valid_pair_rate),
        "retryRate": _rounded(1 - valid_pair_rate),
        "medianOfPairMedianErrorPx": median_error_px,
        "medianOfPairMedianErrorNorm": median_error_norm,
        "p90OfPairMedianErrorPx": p90_error_px,
        "meanAoiAgreement": mean_aoi,
        "primaryAoiAgreementCount": primary_count,
        "primaryAoiAgreementRate": _rounded(primary_rate) if primary_rate is not None else None,
        "aoiDistribution": {
            "webgazer": _mean_aoi_distribution(ready, "webgazer") if ready else {},
            "tabletNeurogaze": _mean_aoi_distribution(ready, "tabletNeurogaze") if ready else {},
        },
        "recomputation": recomputation,
        "meanFeatureIccA1": _rounded(np.mean(icc_values)) if icc_values else None,
        "featureAgreement": agreements,
        "referenceRuntime": reference_runtime,
        "integrity": {
            "algorithm": "SHA-256",
            "inputSetDigest": _webgazer_input_digest(pairs),
            "digestScope": "Sorted pair IDs and embedded-array digests",
        },
        "acceptanceCriteria": criteria,
        "decision": "PASSED" if passed else "NOT_PASSED",
        "decisionReason": "Gate B passes only when every recorded WebGazer agreement criterion is met.",
        "pairIds": [pair["pairId"] for pair in pairs],
        "source": "embedded_browser_event_logs",
    }


def summarize(pairs: list[dict[str, Any]]) -> dict[str, Any]:
    if not pairs:
        raise ValueError("Analisis kohort memerlukan pasangan Gate B.")
    if any(pair.get("schema") != WEBGAZER_SCHEMA for pair in pairs):
        raise ValueError("Analisis Gate B hanya menerima kontrak WebGazer v3.")
    return summarize_webgazer(pairs)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("inputs", nargs="+", type=Path)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    result = summarize(load_pairs(args.inputs))
    rendered = json.dumps(result, indent=2, ensure_ascii=False) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(rendered, encoding="utf-8", newline="\n")
    print(rendered, end="")


if __name__ == "__main__":
    main()
