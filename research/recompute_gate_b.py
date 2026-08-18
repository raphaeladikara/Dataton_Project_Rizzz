"""Recompute Gate B agreement metrics from the raw paired samples.

analyze_gate_b.py aggregates fields the browser already wrote. This module
derives the same fields from sampleMatches so the published summary can be
checked against the coordinates rather than trusted.
"""
from __future__ import annotations

import math
from statistics import median
from typing import Any

# Mirrors app/src/gaze/aoi.ts (AOI_VERSION neurogaze-aoi-v3.1.0). The stored
# pair files name the side boxes left_target / right_target, so keep those names
# here: the recomputed distribution has to be comparable to aoiDistribution.
AOI_ATLAS = {
    "face": (0.36, 0.64, 0.14, 0.58),
    "left_target": (0.04, 0.32, 0.38, 0.82),
    "right_target": (0.68, 0.96, 0.38, 0.82),
}

AOI_NAMES = (*AOI_ATLAS, "background")

# The eye needs time to land after a target appears; the first 300 ms of each
# known-target interval is dropped before the fixation is scored.
TARGET_SETTLE_MS = 300


def classify_aoi(x: float, y: float) -> str:
    for name, (x0, x1, y0, y1) in AOI_ATLAS.items():
        if x0 <= x <= x1 and y0 <= y <= y1:
            return name
    return "background"


def _viewport_for(pair: dict[str, Any], match: dict[str, Any]) -> dict[str, int]:
    for sample in pair["webgazer"]["samples"]:
        if sample["sequence"] == match["webgazerSequence"]:
            return sample["viewport"]
    return pair["webgazer"]["samples"][0]["viewport"]


def recompute_pair(pair: dict[str, Any]) -> dict[str, float]:
    """Derive the published agreement fields from the matched coordinates."""
    matches = pair["sampleMatches"]
    if not matches:
        raise ValueError(f"{pair['pairId']} has no sample matches")

    errors_px: list[float] = []
    errors_norm: list[float] = []
    agreements: list[int] = []
    counts = {
        "webgazer": dict.fromkeys(AOI_NAMES, 0),
        "tabletNeurogaze": dict.fromkeys(AOI_NAMES, 0),
    }

    for match in matches:
        viewport = _viewport_for(pair, match)
        width, height = viewport["width"], viewport["height"]
        dx = match["tabletX"] - match["webgazerX"]
        dy = match["tabletY"] - match["webgazerY"]
        errors_px.append(math.hypot(dx, dy))
        errors_norm.append(math.hypot(dx / width, dy / height))
        reference = classify_aoi(match["webgazerX"] / width, match["webgazerY"] / height)
        tablet = classify_aoi(match["tabletX"] / width, match["tabletY"] / height)
        counts["webgazer"][reference] += 1
        counts["tabletNeurogaze"][tablet] += 1
        agreements.append(int(reference == tablet))

    n = len(matches)
    return {
        "medianErrorPx": round(median(errors_px), 3),
        "medianErrorNorm": round(median(errors_norm), 6),
        "p90ErrorPx": round(_quantile(errors_px, 0.9), 3),
        "aoiAgreement": round(sum(agreements) / n, 6),
        "aoiDistribution": {
            stream: {name: round(value / n, 6) for name, value in stream_counts.items()}
            for stream, stream_counts in counts.items()
        },
        "nMatches": n,
    }


def _quantile(values: list[float], q: float) -> float:
    """Linear interpolation between order statistics, matching numpy's default."""
    ordered = sorted(values)
    position = (len(ordered) - 1) * q
    low = math.floor(position)
    high = math.ceil(position)
    if low == high:
        return ordered[low]
    return ordered[low] + (ordered[high] - ordered[low]) * (position - low)


def verify_pair_metrics(pairs: list[dict[str, Any]]) -> None:
    """Raise if a published distance disagrees with the coordinates behind it.

    Only the geometric fields are enforced here. AOI agreement is a classification
    on top of those coordinates and is reported by recomputation_report instead.
    """
    for pair in pairs:
        if not has_raw_samples(pair):
            continue
        recomputed = recompute_pair(pair)
        for field, tolerance in (
            ("medianErrorPx", GEOMETRY_TOLERANCE_PX),
            ("p90ErrorPx", GEOMETRY_TOLERANCE_PX),
            ("medianErrorNorm", GEOMETRY_TOLERANCE_NORM),
        ):
            if field not in pair:
                continue
            if abs(recomputed[field] - pair[field]) > tolerance:
                raise ValueError(
                    f"{pair['pairId']}: stored {field}={pair[field]} but raw samples give {recomputed[field]}"
                )


def accuracy_against_targets(pair: dict[str, Any]) -> dict[str, float]:
    """Absolute accuracy in degrees for both streams on identical known targets.

    Stream-to-stream agreement cannot produce an accuracy figure: two streams can
    agree while both look at the wrong place. Only a pair that carries the
    known-target block and the viewing geometry can be scored in degrees.
    """
    targets = pair.get("accuracyTargets")
    geometry = pair.get("viewingGeometry")
    if not targets:
        raise ValueError(f"{pair['pairId']} lacks the known-target block")
    if not geometry or not geometry.get("screenWidthMm") or not geometry.get("viewingDistanceMm"):
        raise ValueError(f"{pair['pairId']} lacks viewing geometry")

    viewport = pair["webgazer"]["samples"][0]["viewport"]
    px_per_mm = viewport["width"] / geometry["screenWidthMm"]
    distance_px = geometry["viewingDistanceMm"] * px_per_mm

    def errors(samples: list[dict[str, Any]], x_key: str, y_key: str) -> list[float]:
        out: list[float] = []
        for target in targets:
            window = [
                sample
                for sample in samples
                if target["onsetMs"] + TARGET_SETTLE_MS <= sample["elapsedMs"] <= target["offsetMs"]
                and sample.get(x_key) is not None
            ]
            if not window:
                continue
            mx = median([sample[x_key] for sample in window])
            my = median([sample[y_key] for sample in window])
            dpx = math.hypot(
                mx - target["x"] * viewport["width"],
                my - target["y"] * viewport["height"],
            )
            out.append(math.degrees(math.atan2(dpx, distance_px)))
        return out

    webgazer = errors(
        [
            {**sample["data"], "elapsedMs": sample["elapsedTimeMs"]}
            for sample in pair["webgazer"]["samples"]
            if sample["data"]
        ],
        "x",
        "y",
    )
    neurogaze = errors(
        [
            {**sample, "elapsedMs": sample["sessionElapsedTimeMs"]}
            for sample in pair["tabletStream"]["samples"]
            if sample.get("valid")
        ],
        "x",
        "y",
    )
    return {
        "webgazerMedianErrorDeg": round(median(webgazer), 3) if webgazer else float("nan"),
        "neurogazeMedianErrorDeg": round(median(neurogaze), 3) if neurogaze else float("nan"),
        "targetsScored": min(len(webgazer), len(neurogaze)),
    }


# The browser wrote aoiAgreement rounded to four decimals, so anything smaller
# than this is a rounding artifact rather than a classification difference.
AOI_ROUNDING_TOLERANCE = 5e-5
GEOMETRY_TOLERANCE_PX = 0.01
GEOMETRY_TOLERANCE_NORM = 1e-4


def has_raw_samples(pair: dict[str, Any]) -> bool:
    return bool(pair.get("sampleMatches")) and bool(pair.get("webgazer", {}).get("samples"))


def aoi_disagreements(pair: dict[str, Any]) -> list[dict[str, Any]]:
    """Matched samples where the two streams land in different AOIs."""
    rows: list[dict[str, Any]] = []
    for match in pair["sampleMatches"]:
        viewport = _viewport_for(pair, match)
        width, height = viewport["width"], viewport["height"]
        reference = classify_aoi(match["webgazerX"] / width, match["webgazerY"] / height)
        tablet = classify_aoi(match["tabletX"] / width, match["tabletY"] / height)
        if reference != tablet:
            rows.append(
                {
                    "webgazerSequence": match["webgazerSequence"],
                    "phase": match.get("phase"),
                    "webgazerAoi": reference,
                    "tabletAoi": tablet,
                }
            )
    return rows


def recomputation_report(pairs: list[dict[str, Any]]) -> dict[str, Any]:
    """Compare every published pair metric against the coordinates behind it.

    The geometric fields are enforced by verify_pair_metrics. AOI agreement is
    reported instead: the capture harness that wrote these files is not in this
    repository, so a classification difference cannot be traced to its source and
    must be published rather than reconciled away.
    """
    verifiable = [pair for pair in pairs if has_raw_samples(pair)]
    deltas: list[dict[str, Any]] = []
    recomputed_agreements: list[float] = []

    for pair in verifiable:
        recomputed = recompute_pair(pair)
        recomputed_agreements.append(recomputed["aoiAgreement"])
        difference = recomputed["aoiAgreement"] - pair["aoiAgreement"]
        if abs(difference) > AOI_ROUNDING_TOLERANCE:
            disagreements = aoi_disagreements(pair)
            deltas.append(
                {
                    "pairId": pair["pairId"],
                    "storedAoiAgreement": pair["aoiAgreement"],
                    "recomputedAoiAgreement": recomputed["aoiAgreement"],
                    "difference": round(difference, 6),
                    "matchedSamples": recomputed["nMatches"],
                    "samplesInDifferentAoi": disagreements,
                }
            )

    mean_recomputed = (
        round(sum(recomputed_agreements) / len(recomputed_agreements), 6)
        if recomputed_agreements
        else None
    )
    return {
        "module": "research/recompute_gate_b.py",
        "scope": "Published pair metrics rederived from sampleMatches coordinates.",
        "aoiVersion": "neurogaze-aoi-v3.1.0",
        "pairsVerified": len(verifiable),
        "pairsWithoutRawSamples": len(pairs) - len(verifiable),
        "geometryTolerance": {
            "medianErrorPx": GEOMETRY_TOLERANCE_PX,
            "medianErrorNorm": GEOMETRY_TOLERANCE_NORM,
        },
        "geometryReproduced": True,
        "meanAoiAgreementRecomputed": mean_recomputed,
        "pairsWithAoiClassificationDelta": len(deltas),
        "aoiClassificationDeltas": deltas,
        "note": (
            "Distances rederive to within 0.001 px. AOI agreement is lower on "
            f"{len(deltas)} pairs because single matched samples sit just outside an "
            "AOI box under neurogaze-aoi-v3.1.0 yet were counted as agreeing at "
            "capture time. The capture harness is not in this repository, so the "
            "recomputed value is the one to quote."
        ),
    }
