"""Proxy degradation study for Carette raster scanpaths.

The source dataset contains rendered PNGs, not ordered gaze samples. Spatial
noise and pixel dropout can be simulated directly. Sampling-rate reduction is
only a sparsification proxy and cannot recreate 30 Hz velocity/acceleration/
jerk; outputs are labelled accordingly.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd
from PIL import Image
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import GroupKFold, cross_val_predict

from evaluate import aggregate_to_participants
from features import (
    ALL_FEATURES,
    GRID,
    INK_THRESHOLD,
    KINEMATIC_FEATURES,
    RANDOM_STATE,
)
from training import (
    INNER_SPLITS,
    OUTER_SPLITS,
    _base_model,
    apply_platt,
    fit_platt,
)


PX_PER_DEGREE = 20.0


@dataclass(frozen=True)
class Condition:
    name: str
    axis: str
    noise_deg: float = 0.0
    sampling_hz: int = 250
    dropout: float = 0.0
    pose_jitter_deg: float = 0.0


CONDITIONS = [
    *[
        Condition(f"noise_{value:g}deg", "noise", noise_deg=value)
        for value in (0, 0.5, 1, 1.5, 2, 3)
    ],
    *[
        Condition(f"sampling_{value}hz_proxy", "sampling", sampling_hz=value)
        for value in (120, 60, 30)
    ],
    *[
        Condition(f"dropout_{int(value * 100)}pct", "dropout", dropout=value)
        for value in (0.1, 0.2, 0.3)
    ],
    *[
        Condition(f"pose_jitter_{value:g}deg", "pose", pose_jitter_deg=value)
        for value in (1, 2, 3)
    ],
    Condition(
        "tablet_proxy",
        "combined",
        noise_deg=1.5,
        sampling_hz=30,
        dropout=0.2,
        pose_jitter_deg=2,
    ),
]


def load_sparse_scanpath(path) -> tuple[int, int, np.ndarray, np.ndarray]:
    array = np.asarray(Image.open(path).convert("RGB"), dtype=np.float64) / 255.0
    h, w = array.shape[:2]
    ink = array.sum(axis=2) > INK_THRESHOLD
    y, x = np.nonzero(ink)
    return h, w, np.column_stack([y, x]), array[ink]


def _deduplicate(
    coordinates: np.ndarray, colors: np.ndarray, width: int
) -> tuple[np.ndarray, np.ndarray]:
    linear = coordinates[:, 0] * width + coordinates[:, 1]
    order = np.argsort(linear)
    linear = linear[order]
    colors = colors[order]
    unique, starts = np.unique(linear, return_index=True)
    reduced = np.maximum.reduceat(colors, starts, axis=0)
    return np.column_stack([unique // width, unique % width]), reduced


def degrade_sparse(
    sparse: tuple[int, int, np.ndarray, np.ndarray],
    condition: Condition,
    rng: np.random.Generator,
) -> tuple[int, int, np.ndarray, np.ndarray]:
    h, w, coordinates, colors = sparse
    coordinates = coordinates.copy()
    colors = colors.copy()
    keep_probability = (condition.sampling_hz / 250.0) * (1 - condition.dropout)
    if keep_probability < 1:
        keep = rng.random(len(coordinates)) < keep_probability
        coordinates, colors = coordinates[keep], colors[keep]
    if not len(coordinates):
        return h, w, coordinates, colors

    xy = coordinates[:, ::-1].astype(float)
    center = np.array([w / 2, h / 2])
    if condition.pose_jitter_deg:
        angle = np.deg2rad(rng.normal(0, condition.pose_jitter_deg))
        rotation = np.array(
            [[np.cos(angle), -np.sin(angle)], [np.sin(angle), np.cos(angle)]]
        )
        xy = (xy - center) @ rotation.T + center
        xy += rng.normal(0, condition.pose_jitter_deg * PX_PER_DEGREE / 4, 2)
    if condition.noise_deg:
        xy += rng.normal(0, condition.noise_deg * PX_PER_DEGREE, xy.shape)
    xy[:, 0] = np.clip(np.rint(xy[:, 0]), 0, w - 1)
    xy[:, 1] = np.clip(np.rint(xy[:, 1]), 0, h - 1)
    coordinates = xy[:, ::-1].astype(int)
    coordinates, colors = _deduplicate(coordinates, colors, w)
    return h, w, coordinates, colors


def features_from_sparse(
    sparse: tuple[int, int, np.ndarray, np.ndarray]
) -> dict[str, float]:
    h, w, coordinates, colors = sparse
    n_ink = len(coordinates)
    result = {"ink_frac": n_ink / (h * w)}
    if n_ink < 5:
        result.update({key: 0.0 for key in ALL_FEATURES if key != "ink_frac"})
        return result

    y, x = coordinates[:, 0], coordinates[:, 1]
    xn, yn = x / w, y / h
    result["centroid_x"], result["centroid_y"] = xn.mean(), yn.mean()
    result["std_x"], result["std_y"] = xn.std(), yn.std()
    result["span_x"], result["span_y"] = xn.max() - xn.min(), yn.max() - yn.min()
    radial = np.hypot(xn - xn.mean(), yn - yn.mean())
    result["radial_mean"], result["radial_std"] = radial.mean(), radial.std()

    r, g, b = colors[:, 0], colors[:, 1], colors[:, 2]
    result["vel_mean"], result["vel_std"] = r.mean(), r.std()
    result["acc_mean"], result["jerk_mean"] = g.mean(), b.mean()
    result["fixation_ratio"] = float(((r < g * 0.6) & (r < b * 0.6)).mean())
    result["saccade_ratio"] = float(((r > g * 0.9) & (r > 0.05)).mean())

    cell = np.zeros((GRID, GRID))
    gi = np.clip((yn * GRID).astype(int), 0, GRID - 1)
    gj = np.clip((xn * GRID).astype(int), 0, GRID - 1)
    np.add.at(cell, (gi, gj), 1)
    p = cell.ravel() / cell.sum()
    p = p[p > 0]
    result["grid_entropy"] = float(-(p * np.log(p)).sum() / np.log(GRID * GRID))
    result["n_active_cells"] = float((cell > 0).sum() / (GRID * GRID))
    result["bbox_fill"] = result["ink_frac"] / max(
        result["span_x"] * result["span_y"], 1e-9
    )
    result["aspect_ratio"] = result["span_x"] / max(result["span_y"], 1e-9)
    return result


def degraded_feature_frame(
    sparse_scanpaths, condition: Condition, seed: int
) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    rows = [
        features_from_sparse(degrade_sparse(scanpath, condition, rng))
        for scanpath in sparse_scanpaths
    ]
    return pd.DataFrame(rows)[ALL_FEATURES]


def fit_outer_predictors(
    original: pd.DataFrame, labels: np.ndarray, groups: np.ndarray, features: list[str]
):
    X = original[features].to_numpy(float)
    predictors = []
    for train_idx, test_idx in GroupKFold(n_splits=OUTER_SPLITS).split(
        X, labels, groups
    ):
        inner_raw = cross_val_predict(
            _base_model(),
            X[train_idx],
            labels[train_idx],
            cv=GroupKFold(n_splits=INNER_SPLITS),
            groups=groups[train_idx],
            method="predict_proba",
        )[:, 1]
        calibrator = fit_platt(inner_raw, labels[train_idx], groups[train_idx])
        base = _base_model().fit(X[train_idx], labels[train_idx])
        predictors.append((test_idx, base, calibrator))
    return predictors


def predict_degraded(
    degraded: pd.DataFrame,
    features: list[str],
    predictors,
) -> np.ndarray:
    X = degraded[features].to_numpy(float)
    probability = np.full(len(X), np.nan)
    for test_idx, base, calibrator in predictors:
        probability[test_idx] = apply_platt(
            calibrator, base.predict_proba(X[test_idx])[:, 1]
        )
    return probability


def participant_metrics(
    probabilities: np.ndarray,
    labels: np.ndarray,
    groups: np.ndarray,
    threshold: float,
) -> tuple[dict, np.ndarray, np.ndarray]:
    p, y, _ = aggregate_to_participants(probabilities, labels, groups)
    decision = p >= threshold
    return (
        {
            "auc": float(roc_auc_score(y, p)),
            "sensitivity": float(decision[y == 1].mean()),
            "specificity": float((~decision[y == 0]).mean()),
        },
        p,
        y,
    )


def bootstrap_auc_ci(
    predictions: list[np.ndarray], labels: np.ndarray, n_boot: int = 200
) -> list[float]:
    rng = np.random.default_rng(RANDOM_STATE)
    values = []
    for _ in range(n_boot):
        p = predictions[int(rng.integers(0, len(predictions)))]
        idx = rng.integers(0, len(labels), len(labels))
        if len(np.unique(labels[idx])) == 2:
            values.append(roc_auc_score(labels[idx], p[idx]))
    return [float(np.percentile(values, 2.5)), float(np.percentile(values, 97.5))]


def feature_stability(
    original: pd.DataFrame, degraded: pd.DataFrame, features: list[str]
) -> dict:
    correlations = {}
    for feature in features:
        correlations[feature] = float(
            pd.Series(original[feature]).corr(
                pd.Series(degraded[feature]), method="spearman"
            )
        )
    return {
        "median_spearman": float(np.nanmedian(list(correlations.values()))),
        "kinematic_median_spearman": float(
            np.nanmedian([correlations[f] for f in KINEMATIC_FEATURES])
        ),
        "per_feature_spearman": correlations,
    }
