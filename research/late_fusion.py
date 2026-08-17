"""Quality-aware late fusion for Neurogaze.

Inputs must be calibrated, participant-grouped out-of-fold probabilities from a paired
cohort: every probability in one row must describe the same child and session.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Mapping, Sequence

import numpy as np
from scipy.optimize import minimize


@dataclass(frozen=True)
class FusionOutput:
    probability: np.ndarray
    available_modalities: np.ndarray


def _as_matrix(
    values: Mapping[str, Sequence[float]], modalities: Sequence[str]
) -> np.ndarray:
    missing = [name for name in modalities if name not in values]
    if missing:
        raise ValueError(f"Missing arrays: {', '.join(missing)}")
    matrix = np.column_stack(
        [np.asarray(values[name], dtype=float) for name in modalities]
    )
    finite = matrix[np.isfinite(matrix)]
    if finite.size and ((finite < 0).any() or (finite > 1).any()):
        raise ValueError("Values must be within [0, 1] or NaN when unavailable")
    return matrix


def fuse_probabilities(
    probabilities: Mapping[str, Sequence[float]],
    weights: Mapping[str, float],
    *,
    quality: Mapping[str, Sequence[float]] | None = None,
    minimum_quality: float = 0.5,
) -> FusionOutput:
    """Compute a weighted mean, renormalized over usable modalities per sample."""
    modalities = tuple(weights)
    if not modalities:
        raise ValueError("At least one modality is required")
    weight_vector = np.asarray([weights[name] for name in modalities], dtype=float)
    if (~np.isfinite(weight_vector)).any() or (weight_vector < 0).any():
        raise ValueError("Fusion weights must be finite and non-negative")
    if weight_vector.sum() <= 0:
        raise ValueError("At least one fusion weight must be positive")

    matrix = _as_matrix(probabilities, modalities)
    quality_matrix = (
        np.ones_like(matrix) if quality is None else _as_matrix(quality, modalities)
    )
    usable = np.isfinite(matrix) & (quality_matrix >= minimum_quality)
    effective_weights = usable * quality_matrix * weight_vector
    denominator = effective_weights.sum(axis=1)
    if (denominator <= 0).any():
        rows = np.flatnonzero(denominator <= 0).tolist()
        raise ValueError(f"No usable modality for sample rows: {rows}")

    safe_probabilities = np.nan_to_num(matrix, nan=0.0)
    fused = (safe_probabilities * effective_weights).sum(axis=1) / denominator
    return FusionOutput(fused, usable.sum(axis=1))


def learn_nonnegative_weights(
    probabilities: Mapping[str, Sequence[float]],
    labels: Sequence[int],
    *,
    quality: Mapping[str, Sequence[float]] | None = None,
    minimum_quality: float = 0.5,
) -> dict[str, float]:
    """Fit simplex weights by log loss on paired out-of-fold probabilities."""
    modalities = tuple(probabilities)
    labels_array = np.asarray(labels, dtype=float)
    if labels_array.ndim != 1 or not np.isin(labels_array, [0, 1]).all():
        raise ValueError("Labels must be a one-dimensional binary array")
    matrix = _as_matrix(probabilities, modalities)
    if matrix.shape[0] != labels_array.size:
        raise ValueError("Probabilities and labels must have the same sample count")

    def softmax(theta: np.ndarray) -> np.ndarray:
        shifted = theta - theta.max()
        exp = np.exp(shifted)
        return exp / exp.sum()

    def objective(theta: np.ndarray) -> float:
        learned = dict(zip(modalities, softmax(theta), strict=True))
        try:
            fused = fuse_probabilities(
                probabilities,
                learned,
                quality=quality,
                minimum_quality=minimum_quality,
            ).probability
        except ValueError:
            return 1e6
        clipped = np.clip(fused, 1e-7, 1 - 1e-7)
        return float(
            -np.mean(
                labels_array * np.log(clipped)
                + (1 - labels_array) * np.log(1 - clipped)
            )
        )

    result = minimize(objective, np.zeros(len(modalities)), method="BFGS")
    if not result.success:
        raise RuntimeError(f"Weight optimization failed: {result.message}")
    return dict(zip(modalities, softmax(result.x), strict=True))
