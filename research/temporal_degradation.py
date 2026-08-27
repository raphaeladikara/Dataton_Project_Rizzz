"""Feature stability under REAL temporal decimation.

`degradation.py` reduces "sampling rate" by deleting pixels from a rendered
scanpath raster, and says so in its own metadata:

    "sampling_interpretation": "Pixel sparsification proxy only; not temporal
     resampling."

That proxy is what the feature-set freeze rests on (`training.json`,
`selection_status: final_after_degradation`), and it cannot be repaired with the
Carette data: those 547 files are rendered PNGs with no timestamps, so no
temporal operation is defined on them at all.

Gate B is different. Its raw pairs carry timestamped (x, y, t) samples from real
browser sessions, so decimation in time -- the operation a slower camera actually
performs -- can be applied directly. There are no ASD labels here, so this cannot
produce an AUC. What it produces is the quantity that decides whether a model
trained at one rate transfers to another: how far each feature moves when the
same session is sampled more slowly.

Source is the WebGazer stream rather than the tablet stream because it is the
faster of the two (~26 Hz against ~11 Hz), and the only one with room to decimate
across the 30/15/10 Hz region the proxy study claimed to model.

    python research/temporal_degradation.py
"""

from __future__ import annotations

import glob
import json
import math
import statistics
from pathlib import Path

import numpy as np
from scipy.stats import spearmanr

ROOT = Path(__file__).resolve().parent.parent
PAIRS = ROOT / "research" / "hasil" / "gate_b" / "pasangan"
OUT = ROOT / "research" / "hasil" / "degradasi_temporal.json"

WIDTH, HEIGHT, GRID = 640, 480, 8
MAX_GAP_MS = 180.0
# Normalised units per second. A saccade crosses a meaningful part of the screen
# within one sample interval; below this the eye is effectively parked.
SACCADE_THRESHOLD = 1.2

GEOMETRY = ["ink_frac", "centroid_x", "centroid_y", "std_x", "std_y", "span_x", "span_y",
            "radial_mean", "radial_std", "grid_entropy", "n_active_cells", "bbox_fill", "aspect_ratio"]
KINEMATIC = ["vel_mean", "vel_std", "acc_mean", "jerk_mean", "fixation_ratio", "saccade_ratio"]

DECIMATION = [1, 2, 3, 4, 5]


def load_series() -> list[tuple[str, np.ndarray]]:
    """Normalised (t, x, y) per ready pair, using each sample's own viewport."""
    series = []
    for path in sorted(glob.glob(str(PAIRS / "*.json"))):
        pair = json.loads(Path(path).read_text(encoding="utf-8"))
        if pair.get("status") != "comparison_ready":
            continue
        rows = []
        for sample in pair["webgazer"]["samples"]:
            data = sample.get("data")
            view = sample.get("viewport") or {}
            width, height = view.get("width"), view.get("height")
            if not data or not width or not height:
                continue
            rows.append((float(sample["elapsedTimeMs"]), float(data["x"]) / width, float(data["y"]) / height))
        if len(rows) >= 60:
            series.append((pair["pairId"], np.array(sorted(rows))))
    return series


def rasterize(points: np.ndarray) -> np.ndarray:
    """Binary ink mask, matching app/src/scanpath/features.ts.

    Segments break on gaps over MAX_GAP_MS so a decimated series does not draw
    long straight lines the eye never travelled. That would manufacture ink and
    flatter the geometric features exactly where this study is trying to measure
    them.
    """
    mask = np.zeros((HEIGHT, WIDTH), dtype=bool)

    def mark(px: int, py: int) -> None:
        x0, x1 = max(0, px - 1), min(WIDTH, px + 2)
        y0, y1 = max(0, py - 1), min(HEIGHT, py + 2)
        mask[y0:y1, x0:x1] = True

    previous = None
    for t, x, y in points:
        px = int(round(min(max(x, 0.0), 1.0) * (WIDTH - 1)))
        py = int(round(min(max(y, 0.0), 1.0) * (HEIGHT - 1)))
        if previous is not None and t - previous[0] <= MAX_GAP_MS:
            qx, qy = previous[1], previous[2]
            steps = max(abs(px - qx), abs(py - qy))
            for s in range(1, steps + 1):
                mark(qx + round((px - qx) * s / steps), qy + round((py - qy) * s / steps))
        else:
            mark(px, py)
        previous = (t, px, py)
    return mask


def geometry_features(mask: np.ndarray) -> dict[str, float]:
    ys, xs = np.nonzero(mask)
    if xs.size < 5:
        return {name: 0.0 for name in GEOMETRY}
    xn, yn = xs / WIDTH, ys / HEIGHT
    cx, cy = float(xn.mean()), float(yn.mean())
    span_x, span_y = float(xn.max() - xn.min()), float(yn.max() - yn.min())
    radial = np.hypot(xn - cx, yn - cy)
    cells = np.zeros((GRID, GRID))
    for gx, gy in zip((xn * GRID).astype(int).clip(0, GRID - 1), (yn * GRID).astype(int).clip(0, GRID - 1)):
        cells[gy, gx] += 1
    share = cells[cells > 0] / cells.sum()
    return {
        "ink_frac": float(xs.size / (WIDTH * HEIGHT)),
        "centroid_x": cx, "centroid_y": cy,
        "std_x": float(xn.std()), "std_y": float(yn.std()),
        "span_x": span_x, "span_y": span_y,
        "radial_mean": float(radial.mean()), "radial_std": float(radial.std()),
        "grid_entropy": float(-(share * np.log(share)).sum() / math.log(GRID * GRID)),
        "n_active_cells": float((cells > 0).sum() / (GRID * GRID)),
        "bbox_fill": float(xs.size / max(span_x * WIDTH * span_y * HEIGHT, 1.0)),
        "aspect_ratio": float(span_x / span_y) if span_y > 1e-9 else 0.0,
    }


def kinematic_features(points: np.ndarray) -> dict[str, float]:
    """Finite differences on the series itself, the quantities Carette encodes in colour."""
    t, x, y = points[:, 0] / 1000.0, points[:, 1], points[:, 2]
    dt = np.diff(t)
    keep = (dt > 1e-6) & (dt <= MAX_GAP_MS / 1000.0)
    if keep.sum() < 4:
        return {name: 0.0 for name in KINEMATIC}
    velocity = np.hypot(np.diff(x), np.diff(y))[keep] / dt[keep]
    if velocity.size < 3:
        return {name: 0.0 for name in KINEMATIC}
    step = float(np.median(dt[keep]))
    acceleration = np.abs(np.diff(velocity)) / step
    jerk = np.abs(np.diff(acceleration)) / step if acceleration.size > 1 else np.zeros(1)
    saccade = float((velocity >= SACCADE_THRESHOLD).mean())
    return {
        "vel_mean": float(velocity.mean()), "vel_std": float(velocity.std()),
        "acc_mean": float(acceleration.mean()), "jerk_mean": float(jerk.mean()),
        "fixation_ratio": 1.0 - saccade, "saccade_ratio": saccade,
    }


def features(points: np.ndarray) -> dict[str, float]:
    return {**geometry_features(rasterize(points)), **kinematic_features(points)}


def main() -> None:
    series = load_series()
    if len(series) < 10:
        raise SystemExit(f"only {len(series)} usable pairs; refusing to report a stability study on that")

    baseline_rate = statistics.median(
        1000.0 / float(np.median(np.diff(points[:, 0]))) for _, points in series
    )
    baseline = [features(points) for _, points in series]

    conditions = []
    for factor in DECIMATION:
        decimated = [features(points[::factor]) for _, points in series]
        rows = []
        for name in GEOMETRY + KINEMATIC:
            full = np.array([b[name] for b in baseline])
            low = np.array([d[name] for d in decimated])
            scale = np.maximum(np.abs(full), 1e-9)
            relative = np.abs(low - full) / scale
            rho = 1.0 if factor == 1 else float(spearmanr(full, low).statistic)
            rows.append({
                "feature": name,
                "family": "geometri" if name in GEOMETRY else "kinematik",
                "median_relative_change": round(float(np.median(relative)), 4),
                "spearman_vs_full_rate": round(rho if rho == rho else 0.0, 4),
            })

        def summarize(family: str) -> dict[str, float]:
            subset = [r for r in rows if r["family"] == family]
            return {
                "median_relative_change": round(statistics.median(r["median_relative_change"] for r in subset), 4),
                "median_spearman": round(statistics.median(r["spearman_vs_full_rate"] for r in subset), 4),
                "features_below_spearman_0_8": sum(1 for r in subset if r["spearman_vs_full_rate"] < 0.8),
                "n_features": len(subset),
            }

        conditions.append({
            "decimation_factor": factor,
            "effective_rate_hz": round(baseline_rate / factor, 2),
            "geometri": summarize("geometri"),
            "kinematik": summarize("kinematik"),
            "per_feature": rows,
        })

    payload = {
        "study_type": "real_temporal_decimation",
        "question": "Ketika sesi yang sama dicuplik lebih lambat, keluarga fitur mana yang bergeser lebih jauh?",
        "why_this_exists": (
            "degradasi.json menurunkan laju cuplik dengan menghapus piksel dari raster dan menyatakan sendiri "
            "bahwa itu proxy, bukan resampling temporal. Data Carette berupa PNG tanpa stempel waktu sehingga "
            "operasi temporal tidak terdefinisi di sana. Pasangan Gate B membawa (x, y, t) sungguhan, jadi "
            "desimasi waktu dapat dijalankan apa adanya."
        ),
        "source": "research/hasil/gate_b/pasangan, aliran WebGazer pada pasangan comparison_ready",
        "n_sessions": len(series),
        "baseline_rate_hz": round(baseline_rate, 2),
        "saccade_threshold_normalised_per_s": SACCADE_THRESHOLD,
        "conditions": conditions,
        "limitations": [
            "Tidak ada label ASD pada data Gate B, jadi studi ini melaporkan stabilitas fitur dan bukan AUC.",
            "Sumbernya aliran WebGazer, bukan aliran NeuroGaze, karena hanya yang pertama punya laju cukup tinggi untuk didesimasi.",
            "Stabilitas fitur adalah syarat perlu untuk transfer antar laju cuplik, bukan syarat cukup.",
            "Desimasi menjaga sampel yang benar-benar terekam; kamera yang lebih lambat juga mengubah blur dan waktu pajan, yang tidak dimodelkan di sini.",
        ],
    }
    OUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")

    print(f"{len(series)} sesi, laju dasar {baseline_rate:.1f} Hz\n")
    print(f"{'faktor':>6} {'Hz':>7} | {'geometri drift':>15} {'rho':>6} | {'kinematik drift':>16} {'rho':>6}")
    for c in conditions:
        g, k = c["geometri"], c["kinematik"]
        print(f"{c['decimation_factor']:>6} {c['effective_rate_hz']:>7} | "
              f"{g['median_relative_change']:>15.4f} {g['median_spearman']:>6.3f} | "
              f"{k['median_relative_change']:>16.4f} {k['median_spearman']:>6.3f}")
    print(f"\n-> {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
