"""Shortcut audit — does your classifier read behaviour, or read how you recorded it?

A standalone check, released because it is the one that killed our own model.

The failure it looks for
------------------------
Two groups are often recorded slightly differently. Children who cannot sit
still produce shorter sessions, more blinks, worse tracking, fewer completed
trials. A classifier trained on that data can reach a high AUC by learning the
recording, not the behaviour — and it will do it silently, because every
feature it reads still has a behavioural name.

The check is one line of reasoning: fit a model on **nuisance columns only**,
carrying no behavioural signal at all, and see how far it gets. If that baseline
approaches your real model, what your real model learned is partly how the data
was collected.

What it found for us
--------------------
On the published Cilia et al. 2022 eye-tracking dataset (59 children), a
baseline of sample count, tracking ratio, blink fraction, fixation fraction and
trial count reaches OOF AUC 0.905, while our behavioural index model reaches
0.784. Tracking ratio alone reaches 0.853; the cue-following index reaches
0.504, which is chance. We did not promote the weights.

Run on our own positive control the same baseline reaches 0.537, p = 0.26.

Usage
-----
    python research/shortcut_audit.py data.csv --label class \\
        --nuisance n_samples tracking_ratio blink_frac \\
        --behaviour cue_gain social_frac \\
        --group participant_id

`--group` is optional but strongly recommended: without it, repeated measures
from one participant are treated as independent and every p-value is optimistic.
Labels may be any two values.

Output is JSON on stdout, or to `--out`.
"""

from __future__ import annotations

import argparse
import json
import sys

import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import StratifiedKFold
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

DEFAULT_SEED = 20260821


def _model():
    return make_pipeline(StandardScaler(), LogisticRegression(max_iter=2000))


def oof_auc(X: np.ndarray, y: np.ndarray, *, folds: int, seed: int) -> float:
    """Out-of-fold AUC. Folds are capped by the smallest class."""
    n_splits = max(2, min(folds, int(np.bincount(y).min())))
    splitter = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=seed)
    oof = np.zeros(len(y), dtype=float)
    for train, test in splitter.split(X, y):
        model = _model()
        model.fit(X[train], y[train])
        oof[test] = model.predict_proba(X[test])[:, 1]
    return float(roc_auc_score(y, oof))


def permutation_p(X: np.ndarray, y: np.ndarray, observed: float, *,
                  groups: np.ndarray | None, folds: int, seed: int, n: int) -> float:
    """How often a shuffled label reaches the observed AUC.

    With `groups`, labels are shuffled inside each group, so the permutation
    keeps each group's own class mix and does not manufacture separation that
    the grouping already forbids.
    """
    rng = np.random.default_rng(seed)
    hits = 0
    for i in range(n):
        if groups is None:
            shuffled = rng.permutation(y)
        else:
            shuffled = y.copy()
            for group in np.unique(groups):
                mask = groups == group
                shuffled[mask] = rng.permutation(y[mask])
        if len(np.unique(shuffled)) < 2:
            continue
        try:
            if oof_auc(X, shuffled, folds=folds, seed=seed + i) >= observed:
                hits += 1
        except ValueError:
            continue
    return (hits + 1) / (n + 1)


def single_feature_auc(frame: pd.DataFrame, columns: list[str], y: np.ndarray) -> dict:
    """Which one column carries it. A high baseline is an accusation; naming the
    column is a finding."""
    out = {}
    for name in columns:
        auc = roc_auc_score(y, frame[name])
        out[name] = {
            "auc": float(max(auc, 1 - auc)),
            "median_positive": float(frame[name][y == 1].median()),
            "median_negative": float(frame[name][y == 0].median()),
        }
    return dict(sorted(out.items(), key=lambda kv: -kv[1]["auc"]))


def audit(frame: pd.DataFrame, *, label: str, nuisance: list[str],
          behaviour: list[str] | None, group: str | None,
          folds: int, seed: int, permutations: int, margin: float) -> dict:
    columns = list(nuisance) + list(behaviour or [])
    usable = frame.dropna(subset=columns + [label]).reset_index(drop=True)
    if usable.empty:
        raise SystemExit("No complete rows after dropping missing values.")

    classes = sorted(usable[label].unique())
    if len(classes) != 2:
        raise SystemExit(f"Need exactly two classes in {label!r}, found {classes}.")
    y = (usable[label] == classes[1]).to_numpy(int)
    groups = usable[group].to_numpy() if group else None

    Xn = usable[nuisance].to_numpy(float)
    nuisance_auc = oof_auc(Xn, y, folds=folds, seed=seed)
    nuisance_p = permutation_p(Xn, y, nuisance_auc, groups=groups,
                               folds=folds, seed=seed, n=permutations)

    result = {
        "tool": "shortcut_audit",
        "n_rows": int(len(usable)),
        "n_groups": int(len(np.unique(groups))) if groups is not None else None,
        "grouped": group is not None,
        "classes": {"negative": str(classes[0]), "positive": str(classes[1])},
        "class_counts": {str(classes[0]): int((y == 0).sum()), str(classes[1]): int((y == 1).sum())},
        "nuisance": {
            "columns": nuisance,
            "auc_oof": nuisance_auc,
            "permutation_p": nuisance_p,
            "per_feature_auc": single_feature_auc(usable, nuisance, y),
        },
        "seed": seed,
        "permutations": permutations,
    }

    if behaviour:
        Xb = usable[behaviour].to_numpy(float)
        behaviour_auc = oof_auc(Xb, y, folds=folds, seed=seed)
        gap = behaviour_auc - nuisance_auc
        result["behaviour"] = {
            "columns": behaviour,
            "auc_oof": behaviour_auc,
            "per_feature_auc": single_feature_auc(usable, behaviour, y),
        }
        result["gap_behaviour_minus_nuisance"] = gap
        result["verdict"] = "shortcut_present" if gap < margin else "no_shortcut_detected"
        result["interpretation"] = (
            f"The nuisance-only baseline reaches {nuisance_auc:.3f} against the behavioural "
            f"model's {behaviour_auc:.3f}. The gap is below the {margin} margin, so what the "
            "behavioural model learned cannot be separated from how the data was recorded."
            if gap < margin else
            f"The behavioural model ({behaviour_auc:.3f}) clears the nuisance-only baseline "
            f"({nuisance_auc:.3f}) by more than {margin}."
        )
    else:
        result["verdict"] = "shortcut_present" if nuisance_p < 0.05 else "no_shortcut_detected"
        result["interpretation"] = (
            f"Recording-quality columns alone separate the classes (p = {nuisance_p:.4f}). "
            "Any model trained on this data may be reading collection differences."
            if nuisance_p < 0.05 else
            f"Recording-quality columns alone do not separate the classes above chance "
            f"(p = {nuisance_p:.4f})."
        )

    result["limits"] = [
        "Not finding a shortcut does not prove there is none; it proves these columns do not carry one.",
        "Without --group, repeated measures from one participant count as independent and the p-value is optimistic.",
        "AUC on a small sample is noisy. Read the permutation p-value, not the AUC.",
    ]
    return result


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("csv", help="One row per unit of analysis.")
    parser.add_argument("--label", required=True, help="Two-class outcome column.")
    parser.add_argument("--nuisance", required=True, nargs="+",
                        help="Recording-quality columns with no behavioural content.")
    parser.add_argument("--behaviour", nargs="*", default=None,
                        help="Optional: the columns your real model reads.")
    parser.add_argument("--group", default=None,
                        help="Participant column. Strongly recommended.")
    parser.add_argument("--folds", type=int, default=5)
    parser.add_argument("--seed", type=int, default=DEFAULT_SEED)
    parser.add_argument("--permutations", type=int, default=2000)
    parser.add_argument("--margin", type=float, default=0.05,
                        help="How far behaviour must clear nuisance to pass.")
    parser.add_argument("--out", default=None, help="Write JSON here instead of stdout.")
    args = parser.parse_args(argv)

    report = audit(
        pd.read_csv(args.csv),
        label=args.label, nuisance=args.nuisance, behaviour=args.behaviour,
        group=args.group, folds=args.folds, seed=args.seed,
        permutations=args.permutations, margin=args.margin,
    )
    text = json.dumps(report, ensure_ascii=False, indent=2)
    if args.out:
        with open(args.out, "w", encoding="utf-8", newline="\n") as fh:
            fh.write(text + "\n")
        print(f"{report['verdict']} · {args.out}")
    else:
        print(text)
    if report["verdict"] == "shortcut_present":
        sys.exit(1)


if __name__ == "__main__":
    main()
