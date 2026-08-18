"""Paired comparison of the two scanpath models on identical participants.

The project has been justifying the logistic regression over the CNN with
overlapping confidence intervals. That argument is weak: two intervals can
overlap while a paired difference is still consistent and real, and the reverse
also happens. Both models produced out-of-fold participant-level predictions on
the same 54 Carette participants, so the difference can be tested directly.

Participant ids differ only by a leading "T" in the tabular export (TC30 vs
C30); they match 54/54 once stripped.
"""

from __future__ import annotations

import csv
import json
from pathlib import Path

import numpy as np
from sklearn.metrics import roc_auc_score

ROOT = Path(__file__).resolve().parent.parent
HASIL = ROOT / "research" / "hasil"
OUT = HASIL / "perbandingan_model.json"

BOOTSTRAP = 10_000
SEED = 20260819


def load_pairs() -> tuple[np.ndarray, np.ndarray, np.ndarray, list[str]]:
    tabular = np.load(HASIL / "training_oof_geometri.npz", allow_pickle=True)
    lr = {
        str(pid).lstrip("T"): (float(p), int(y))
        for pid, p, y in zip(
            tabular["participant_id"],
            tabular["participant_probability"],
            tabular["participant_label"],
        )
    }

    cnn: dict[str, tuple[float, int]] = {}
    with open(HASIL / "cnn_scanpath" / "oof_participant.csv", encoding="utf-8") as handle:
        for row in csv.DictReader(handle):
            cnn[row["participant_id"]] = (float(row["p"]), int(row["label"]))

    shared = sorted(set(lr) & set(cnn))
    if len(shared) != len(lr) or len(shared) != len(cnn):
        raise SystemExit(f"participant sets differ: lr={len(lr)} cnn={len(cnn)} shared={len(shared)}")
    for pid in shared:
        if lr[pid][1] != cnn[pid][1]:
            raise SystemExit(f"label disagreement on {pid}: {lr[pid][1]} vs {cnn[pid][1]}")

    labels = np.array([lr[p][1] for p in shared])
    return (
        np.array([lr[p][0] for p in shared]),
        np.array([cnn[p][0] for p in shared]),
        labels,
        shared,
    )


def paired_bootstrap(labels, a, b, *, n: int = BOOTSTRAP, seed: int = SEED) -> dict:
    """Stratified paired bootstrap of AUC(b) - AUC(a).

    Resampling is stratified by class so every replicate keeps both classes and
    the AUC stays defined. The same resampled participants score both models,
    which is what makes the difference paired.
    """
    rng = np.random.default_rng(seed)
    positive = np.flatnonzero(labels == 1)
    negative = np.flatnonzero(labels == 0)
    deltas = np.empty(n)
    for i in range(n):
        idx = np.concatenate(
            [rng.choice(positive, positive.size, replace=True), rng.choice(negative, negative.size, replace=True)]
        )
        deltas[i] = roc_auc_score(labels[idx], b[idx]) - roc_auc_score(labels[idx], a[idx])

    observed = roc_auc_score(labels, b) - roc_auc_score(labels, a)
    low, high = np.percentile(deltas, [2.5, 97.5])
    # Two-sided bootstrap p: how often the replicate difference lands on the
    # other side of zero from the observed one.
    tail = float(np.mean(deltas <= 0)) if observed > 0 else float(np.mean(deltas >= 0))
    return {
        "observed_delta_auc": round(float(observed), 6),
        "ci95": [round(float(low), 6), round(float(high), 6)],
        "p_two_sided": round(min(1.0, 2 * tail), 6),
        "fraction_of_replicates_favouring_cnn": round(float(np.mean(deltas > 0)), 4),
        "bootstrap_replications": n,
        "seed": seed,
    }


def main() -> None:
    lr_p, cnn_p, labels, shared = load_pairs()
    lr_auc = float(roc_auc_score(labels, lr_p))
    cnn_auc = float(roc_auc_score(labels, cnn_p))
    test = paired_bootstrap(labels, lr_p, cnn_p)
    agreement = float(np.corrcoef(lr_p, cnn_p)[0, 1])

    verdict = (
        "cnn_not_distinguishable_from_logistic_regression"
        if test["ci95"][0] <= 0 <= test["ci95"][1]
        else "difference_excludes_zero"
    )

    payload = {
        "question": "Apakah CNN scanpath benar-benar lebih baik daripada regresi logistik 13 fitur?",
        "method": "Bootstrap berpasangan terstratifikasi atas prediksi out-of-fold tingkat partisipan; kedua model dinilai pada partisipan yang sama.",
        "n_participants": len(shared),
        "n_positive": int(labels.sum()),
        "n_negative": int((labels == 0).sum()),
        "auc": {
            "logistic_regression_geometri": round(lr_auc, 6),
            "cnn_efficientnetb0": round(cnn_auc, 6),
        },
        "paired_test": test,
        "prediction_correlation_pearson": round(agreement, 4),
        "verdict": verdict,
        "interpretation": (
            "Selisih AUC berpasangan tidak mengecualikan nol, jadi keunggulan CNN tidak dapat "
            "dibedakan dari derau pada 54 partisipan. Ini alasan kuantitatif untuk tidak memakai "
            "CNN, menggantikan argumen lama yang hanya menyebut selang kepercayaan bertumpang tindih."
            if verdict == "cnn_not_distinguishable_from_logistic_regression"
            else "Selisih AUC berpasangan mengecualikan nol; alasan menolak CNN harus bersandar pada kontrak masukan, bukan performa."
        ),
        "limitations": [
            "Prediksi OOF berasal dari dua pipeline lipatan yang berbeda, jadi pasangannya berada di tingkat partisipan dan bukan di tingkat lipatan.",
            "54 partisipan usia sekolah pada eye-tracker 250 Hz; tidak berlaku untuk balita pada kamera 30 fps.",
            "Uji ini membandingkan dua model pada data yang sama, bukan mengukur kegunaan klinis keduanya.",
        ],
    }
    OUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps(payload, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
