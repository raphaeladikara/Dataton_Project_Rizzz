"""Prospective endpoint metrics; requires locked Gate C predictions."""

from __future__ import annotations

import numpy as np
from sklearn.metrics import average_precision_score, brier_score_loss, roc_auc_score


def threshold_metrics(labels, probabilities, threshold: float, prevalence: float | None = None) -> dict:
    y = np.asarray(labels, dtype=int)
    p = np.asarray(probabilities, dtype=float)
    decision = p >= threshold
    tp, fn = ((decision) & (y == 1)).sum(), ((~decision) & (y == 1)).sum()
    tn, fp = ((~decision) & (y == 0)).sum(), ((decision) & (y == 0)).sum()
    sensitivity = tp / max(tp + fn, 1)
    specificity = tn / max(tn + fp, 1)
    observed_prevalence = float(y.mean())
    target_prevalence = observed_prevalence if prevalence is None else prevalence
    ppv = sensitivity * target_prevalence / max(sensitivity * target_prevalence + (1 - specificity) * (1 - target_prevalence), 1e-12)
    npv = specificity * (1 - target_prevalence) / max((1 - sensitivity) * target_prevalence + specificity * (1 - target_prevalence), 1e-12)
    net_benefit = tp / len(y) - fp / len(y) * threshold / max(1 - threshold, 1e-12)
    return {"threshold": threshold, "sensitivity": sensitivity, "specificity": specificity, "ppv": ppv, "npv": npv, "referralRate": float(decision.mean()), "netBenefit": float(net_benefit)}


def endpoint_summary(labels, probabilities, quality_passed) -> dict:
    y = np.asarray(labels, dtype=int)
    p = np.asarray(probabilities, dtype=float)
    passed = np.asarray(quality_passed, dtype=bool)
    if passed.sum() == 0 or len(np.unique(y[passed])) < 2:
        raise ValueError("at least one passed endpoint per class is required")
    return {
        "denominator": int(len(y)),
        "coverage": float(passed.mean()),
        "abstentionRate": float(1 - passed.mean()),
        "rocAucAmongPassed": float(roc_auc_score(y[passed], p[passed])),
        "prAucAmongPassed": float(average_precision_score(y[passed], p[passed])),
        "brierAmongPassed": float(brier_score_loss(y[passed], p[passed])),
    }


def eligible_thresholds(labels, probabilities, *, minimum_sensitivity: float, maximum_referral_rate: float, prevalence: float | None = None) -> list[dict]:
    candidates = sorted(set(float(value) for value in probabilities))
    rows = [threshold_metrics(labels, probabilities, threshold, prevalence) for threshold in candidates]
    return [row for row in rows if row["sensitivity"] >= minimum_sensitivity and row["referralRate"] <= maximum_referral_rate]
