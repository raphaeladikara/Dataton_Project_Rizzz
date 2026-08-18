"""Nested group-aware training, calibration, and portable model export."""

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import brier_score_loss, roc_auc_score
from sklearn.model_selection import GroupKFold, cross_val_predict
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

from evaluate import aggregate_to_participants, bootstrap_auc
from features import FEATURE_SETS, RANDOM_STATE


EPS = 1e-7
OUTER_SPLITS = 5
INNER_SPLITS = 4
MODEL_VERSION = "neurogaze-gaze-lr-1.0.0"


def _base_model():
    return make_pipeline(
        StandardScaler(),
        LogisticRegression(max_iter=5000, random_state=RANDOM_STATE),
    )


def _logit(probabilities: np.ndarray) -> np.ndarray:
    p = np.clip(np.asarray(probabilities, dtype=float), EPS, 1 - EPS)
    return np.log(p / (1 - p))


def _inverse_group_weights(groups: np.ndarray) -> np.ndarray:
    counts = pd.Series(groups).value_counts()
    return np.asarray([1.0 / counts[g] for g in groups], dtype=float)


def fit_platt(
    raw_probabilities: np.ndarray, labels: np.ndarray, groups: np.ndarray
) -> LogisticRegression:
    """Fit Platt scaling without letting prolific participants dominate."""
    calibrator = LogisticRegression(C=1e6, max_iter=5000, random_state=RANDOM_STATE)
    calibrator.fit(
        _logit(raw_probabilities).reshape(-1, 1),
        labels,
        sample_weight=_inverse_group_weights(groups),
    )
    return calibrator


def apply_platt(
    calibrator: LogisticRegression, raw_probabilities: np.ndarray
) -> np.ndarray:
    return calibrator.predict_proba(_logit(raw_probabilities).reshape(-1, 1))[:, 1]


def _calibration_summary(probabilities: np.ndarray, labels: np.ndarray) -> dict:
    diagnostic = LogisticRegression(C=1e6, max_iter=5000, random_state=RANDOM_STATE)
    diagnostic.fit(_logit(probabilities).reshape(-1, 1), labels)
    return {
        "intercept": float(diagnostic.intercept_[0]),
        "slope": float(diagnostic.coef_[0, 0]),
        "brier": float(brier_score_loss(labels, probabilities)),
    }


def _sensitivity_constrained_threshold(
    probabilities: np.ndarray, labels: np.ndarray, target: float = 0.90
) -> float:
    """Largest empirical threshold that retains at least target sensitivity."""
    positive = np.sort(np.asarray(probabilities)[np.asarray(labels) == 1])
    allowed_misses = int(np.floor((1 - target) * len(positive)))
    return float(positive[min(allowed_misses, len(positive) - 1)])


def _youden_threshold(probabilities: np.ndarray, labels: np.ndarray) -> float:
    """Empirical threshold maximising sensitivity + specificity - 1."""
    probabilities = np.asarray(probabilities, dtype=float)
    labels = np.asarray(labels, dtype=int)
    best_threshold, best_index = float(probabilities.min()), -2.0
    for threshold in sorted(set(probabilities.tolist())):
        decision = probabilities >= threshold
        sensitivity = float(decision[labels == 1].mean())
        specificity = float((~decision[labels == 0]).mean())
        index = sensitivity + specificity - 1
        if index > best_index:
            best_threshold, best_index = float(threshold), index
    return best_threshold


def _point_at(probabilities: np.ndarray, labels: np.ndarray, threshold: float) -> dict:
    decision = np.asarray(probabilities, dtype=float) >= threshold
    labels = np.asarray(labels, dtype=int)
    return {
        "threshold": float(threshold),
        "sensitivity": float(decision[labels == 1].mean()),
        "specificity": float((~decision[labels == 0]).mean()),
    }


def operating_points(
    probabilities: np.ndarray, labels: np.ndarray, *, target: float = 0.90
) -> dict:
    """Both thresholds the project reports, measured on the same OOF folds.

    The sensitivity-constrained point is what a rule-out instrument would want and
    what earlier exports shipped alone; at 0.179 specificity it refers most of the
    cohort. Youden is the balanced point the paper reports. Publishing one without
    the other lets a reader mistake either for the model's whole behaviour.
    """
    probabilities = np.asarray(probabilities, dtype=float)
    labels = np.asarray(labels, dtype=int)
    sensitivity_point = _point_at(
        probabilities,
        labels,
        _sensitivity_constrained_threshold(probabilities, labels, target=target),
    )
    youden_point = _point_at(probabilities, labels, _youden_threshold(probabilities, labels))
    return {
        "target_sensitivity_090": {
            **sensitivity_point,
            "rule": "largest_empirical_threshold_with_sensitivity_at_least_target",
            "target_sensitivity": target,
            "intended_use": "rule_out_framing_shipped_but_not_recommended",
        },
        "youden": {
            **youden_point,
            "rule": "maximum_youden_index_on_participant_level_oof",
            "intended_use": "balanced_reporting_point_used_by_the_paper",
        },
    }


def bootstrap_threshold(
    probabilities: np.ndarray,
    labels: np.ndarray,
    *,
    target: float = 0.90,
    n_boot: int = 2000,
) -> dict:
    """Quantify threshold instability at participant level."""
    rng = np.random.default_rng(RANDOM_STATE)
    values = []
    n = len(labels)
    for _ in range(n_boot):
        idx = rng.integers(0, n, n)
        if len(np.unique(labels[idx])) < 2:
            continue
        values.append(
            _sensitivity_constrained_threshold(
                probabilities[idx], labels[idx], target=target
            )
        )
    point = _sensitivity_constrained_threshold(probabilities, labels, target=target)
    return {
        "method": "largest_empirical_threshold_with_sensitivity_at_least_target",
        "target_sensitivity": target,
        "threshold": point,
        "bootstrap_median": float(np.median(values)),
        "ci95": [float(np.percentile(values, 2.5)), float(np.percentile(values, 97.5))],
        "clinical_status": "demo_only_not_clinically_validated",
    }


@dataclass
class TrainingResult:
    feature_set: str
    record_probability: np.ndarray
    participant_probability: np.ndarray
    participant_label: np.ndarray
    participant_id: np.ndarray
    metrics: dict
    model: dict


def train_nested_calibrated(
    frame: pd.DataFrame,
    labels: np.ndarray,
    groups: np.ndarray,
    feature_set: str,
) -> TrainingResult:
    features = FEATURE_SETS[feature_set]
    X = frame[features].to_numpy(dtype=float)
    y = np.asarray(labels, dtype=int)
    groups = np.asarray(groups)
    outer_probability = np.full(len(y), np.nan, dtype=float)
    folds = []

    outer_cv = GroupKFold(n_splits=OUTER_SPLITS)
    for fold, (train_idx, test_idx) in enumerate(
        outer_cv.split(X, y, groups), start=1
    ):
        X_train, y_train, g_train = X[train_idx], y[train_idx], groups[train_idx]
        inner_cv = GroupKFold(n_splits=INNER_SPLITS)
        inner_raw = cross_val_predict(
            _base_model(),
            X_train,
            y_train,
            cv=inner_cv,
            groups=g_train,
            method="predict_proba",
        )[:, 1]
        calibrator = fit_platt(inner_raw, y_train, g_train)
        base = _base_model().fit(X_train, y_train)
        test_raw = base.predict_proba(X[test_idx])[:, 1]
        outer_probability[test_idx] = apply_platt(calibrator, test_raw)
        folds.append(
            {
                "fold": fold,
                "train_participants": int(len(np.unique(g_train))),
                "test_participants": int(len(np.unique(groups[test_idx]))),
            }
        )

    if np.isnan(outer_probability).any():
        raise RuntimeError("Nested OOF predictions are incomplete")

    p_part, y_part, participant_id = aggregate_to_participants(
        outer_probability, y, groups
    )
    auc = float(roc_auc_score(y_part, p_part))
    ci = bootstrap_auc(p_part, y_part)
    threshold = bootstrap_threshold(p_part, y_part)
    points = operating_points(p_part, y_part)
    decision = p_part >= threshold["threshold"]
    sensitivity = float(decision[y_part == 1].mean())
    specificity = float((~decision[y_part == 0]).mean())

    # Final deployable fit: calibration still learns only group-aware OOF scores.
    full_raw_oof = cross_val_predict(
        _base_model(),
        X,
        y,
        cv=GroupKFold(n_splits=OUTER_SPLITS),
        groups=groups,
        method="predict_proba",
    )[:, 1]
    final_calibrator = fit_platt(full_raw_oof, y, groups)
    final_pipeline = _base_model().fit(X, y)
    scaler: StandardScaler = final_pipeline.named_steps["standardscaler"]
    classifier: LogisticRegression = final_pipeline.named_steps[
        "logisticregression"
    ]

    metrics = {
        "n_records": int(len(y)),
        "n_participants": int(len(np.unique(groups))),
        "outer_folds": folds,
        "auc_participant": auc,
        "auc_participant_ci95": [float(ci[0]), float(ci[1])],
        "auc_record": float(roc_auc_score(y, outer_probability)),
        "participant_calibration": _calibration_summary(p_part, y_part),
        "record_brier": float(brier_score_loss(y, outer_probability)),
        "operating_point": {
            **threshold,
            "observed_sensitivity": sensitivity,
            "observed_specificity": specificity,
        },
    }
    model = {
        "schema_version": 1,
        "model_version": MODEL_VERSION,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "intended_use": "triage_research_demo_not_diagnosis",
        "feature_set": feature_set,
        "feature_order": features,
        "input_contract": {
            "type": "scanpath_features",
            "feature_count": len(features),
            "aggregation": "single_session",
        },
        "scaler": {
            "mean": scaler.mean_.astype(float).tolist(),
            "scale": scaler.scale_.astype(float).tolist(),
        },
        "classifier": {
            "type": "logistic_regression",
            "coef": classifier.coef_[0].astype(float).tolist(),
            "intercept": float(classifier.intercept_[0]),
        },
        "calibrator": {
            "type": "platt_on_logit",
            "coef": float(final_calibrator.coef_[0, 0]),
            "intercept": float(final_calibrator.intercept_[0]),
            "epsilon": EPS,
        },
        "decision": {
            # Kept for compatibility with readers that predate operating_points;
            # it now points at the default, which is Youden.
            "refer_if_probability_gte": points["youden"]["threshold"],
            "default_operating_point": "youden",
            "operating_points": points,
            "threshold_status": threshold["clinical_status"],
            "quality_gate_required": True,
        },
        "training": {
            "dataset": "Carette et al. scanpath PNG",
            "participant_grouped": True,
            "metrics": metrics,
            "limitations": [
                "Participants average 7.88 years; not validated in toddlers.",
                "Source device is a 250 Hz eye-tracker; not a tablet camera.",
                "Threshold is for deterministic demo behavior, not clinical use.",
            ],
        },
    }
    checksum_payload = json.dumps(model, sort_keys=True).encode("utf-8")
    model["sha256_without_checksum"] = hashlib.sha256(checksum_payload).hexdigest()
    return TrainingResult(
        feature_set,
        outer_probability,
        p_part,
        y_part,
        participant_id,
        metrics,
        model,
    )


def predict_from_export(model: dict, values: np.ndarray) -> np.ndarray:
    """Reference implementation shared by tests and browser parity fixtures."""
    values = np.asarray(values, dtype=float)
    z = (values - np.asarray(model["scaler"]["mean"])) / np.asarray(
        model["scaler"]["scale"]
    )
    score = z @ np.asarray(model["classifier"]["coef"]) + model["classifier"][
        "intercept"
    ]
    raw = 1.0 / (1.0 + np.exp(-score))
    logit = _logit(raw)
    calibrated_score = (
        model["calibrator"]["coef"] * logit + model["calibrator"]["intercept"]
    )
    return 1.0 / (1.0 + np.exp(-calibrated_score))


def save_json(path: Path, value: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(value, indent=2, ensure_ascii=False, allow_nan=False) + "\n",
        encoding="utf-8",
    )
