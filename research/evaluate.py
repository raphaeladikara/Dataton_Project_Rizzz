"""Helper evaluasi bersama untuk notebook riset Neurogaze.

Sama seperti `features.py`, modul ini berupa `.py` karena dipakai tiga notebook
sekaligus (ablasi, training, degradasi) dan hasilnya harus identik di ketiganya.

Aturan yang tidak boleh dilanggar di seluruh modul ini: **setiap pemisahan data
memakai GroupKFold dengan ID partisipan sebagai grup.** Satu anak menyumbang
banyak citra, sehingga split acak menempatkan citra dari anak yang sama di sisi
latih dan uji sekaligus. Dekomposisi protokol pada POC mengukur efeknya:
penggelembungan AUC sebesar 0,048 hanya dari hilangnya grouping partisipan.

Unit keputusan produk adalah **anak**, bukan citra. Metrik utama karena itu
selalu dihitung setelah agregasi ke level partisipan.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score, roc_curve
from sklearn.model_selection import GroupKFold, cross_val_predict
from sklearn.naive_bayes import GaussianNB
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC

RANDOM_STATE = 42
N_SPLITS = 5

# Ditetapkan sebelum melihat hasil apa pun. Regresi logistik dipilih karena
# koefisiennya dapat diekspor apa adanya ke produk (inferensi hanya dot product,
# tanpa runtime ML di perangkat) dan dapat diperiksa juri satu per satu.
PRIMARY_MODEL = "Logistic Regression"


def build_models() -> dict:
    """Lima model pembanding, identik dengan yang dipakai POC preliminary."""
    return {
        "Logistic Regression": make_pipeline(
            StandardScaler(),
            LogisticRegression(max_iter=5000, random_state=RANDOM_STATE),
        ),
        "SVM (RBF)": make_pipeline(
            StandardScaler(), SVC(probability=True, random_state=RANDOM_STATE)
        ),
        "Naive Bayes": make_pipeline(StandardScaler(), GaussianNB()),
        "Random Forest": RandomForestClassifier(
            n_estimators=400,
            min_samples_leaf=2,
            random_state=RANDOM_STATE,
            n_jobs=-1,
        ),
        "Gradient Boosting": GradientBoostingClassifier(random_state=RANDOM_STATE),
    }


def oof_probabilities(model, X, y, groups) -> np.ndarray:
    """Probabilitas out-of-fold dengan GroupKFold per partisipan."""
    return cross_val_predict(
        model,
        X,
        y,
        cv=GroupKFold(n_splits=N_SPLITS),
        groups=groups,
        method="predict_proba",
    )[:, 1]


def aggregate_to_participants(
    probabilities: np.ndarray, labels: np.ndarray, groups: np.ndarray
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Rata-ratakan probabilitas citra menjadi satu skor per anak."""
    frame = pd.DataFrame({"p": probabilities, "y": labels, "g": groups})
    agg = frame.groupby("g").agg(p=("p", "mean"), y=("y", "max"), n=("p", "size"))
    return agg.p.values, agg.y.values.astype(int), agg.index.values


def bootstrap_auc(
    probabilities: np.ndarray, labels: np.ndarray, n_boot: int = 2000
) -> tuple[float, float]:
    """CI 95% AUC lewat bootstrap pada unit yang diberikan (biasanya anak)."""
    rng = np.random.default_rng(RANDOM_STATE)
    n = len(labels)
    scores = []
    for _ in range(n_boot):
        idx = rng.integers(0, n, n)
        if len(np.unique(labels[idx])) < 2:
            continue
        scores.append(roc_auc_score(labels[idx], probabilities[idx]))
    return float(np.percentile(scores, 2.5)), float(np.percentile(scores, 97.5))


def paired_bootstrap_delta_auc(
    probabilities_a: np.ndarray,
    probabilities_b: np.ndarray,
    labels: np.ndarray,
    n_boot: int = 2000,
) -> dict[str, float]:
    """CI 95% selisih AUC (a - b) dengan resample anak yang sama untuk keduanya.

    Membandingkan dua CI yang saling tumpang tindih bukan uji yang benar untuk
    selisih. Karena kedua set fitur dievaluasi pada anak yang sama dan lipatan
    yang sama, resample harus berpasangan: satu penarikan indeks dipakai untuk
    menghitung kedua AUC, lalu selisihnya yang dikumpulkan.
    """
    rng = np.random.default_rng(RANDOM_STATE)
    n = len(labels)
    deltas = []
    for _ in range(n_boot):
        idx = rng.integers(0, n, n)
        if len(np.unique(labels[idx])) < 2:
            continue
        deltas.append(
            roc_auc_score(labels[idx], probabilities_a[idx])
            - roc_auc_score(labels[idx], probabilities_b[idx])
        )
    deltas = np.asarray(deltas)
    return {
        "delta": float(
            roc_auc_score(labels, probabilities_a)
            - roc_auc_score(labels, probabilities_b)
        ),
        "ci_low": float(np.percentile(deltas, 2.5)),
        "ci_high": float(np.percentile(deltas, 97.5)),
    }


def operating_point(
    probabilities: np.ndarray, labels: np.ndarray, target_sensitivity: float = 0.90
) -> dict[str, float]:
    """Titik kerja dengan spesifisitas terbaik pada sensitivitas >= target.

    Skrining triase memprioritaskan sensitivitas: melewatkan anak yang perlu
    dirujuk jauh lebih merugikan daripada merujuk anak yang ternyata tipikal.
    """
    fpr, tpr, thresholds = roc_curve(labels, probabilities)
    feasible = np.flatnonzero(tpr >= target_sensitivity)
    i = feasible[np.argmin(fpr[feasible])]
    sensitivity, specificity = float(tpr[i]), float(1 - fpr[i])
    positives = labels.sum()
    negatives = len(labels) - positives
    tp = sensitivity * positives
    fp = (1 - specificity) * negatives
    ppv = float(tp / (tp + fp)) if (tp + fp) > 0 else float("nan")
    return {
        "threshold": float(thresholds[i]),
        "sensitivity": sensitivity,
        "specificity": specificity,
        "ppv": ppv,
    }


def ppv_at_prevalence(
    sensitivity: float, specificity: float, prevalence: float
) -> float:
    """PPV pada prevalensi populasi nyata, bukan prevalensi dataset.

    Dataset seimbang (26 ASD, 28 TD) sehingga PPV di dalamnya menyesatkan.
    Pada prevalensi lapangan sekitar 1%, PPV runtuh dan jumlah rujukan per kasus
    membengkak — inilah kendala rancangan yang menentukan beban layanan.
    """
    tp = sensitivity * prevalence
    fp = (1 - specificity) * (1 - prevalence)
    return float(tp / (tp + fp))


def cohens_d(a: pd.Series, b: pd.Series) -> float:
    """Ukuran efek terstandar, dihitung pada level anak bukan level citra."""
    na, nb = len(a), len(b)
    if na < 2 or nb < 2:
        return 0.0
    sp = np.sqrt(((na - 1) * a.var(ddof=1) + (nb - 1) * b.var(ddof=1)) / (na + nb - 2))
    return float((a.mean() - b.mean()) / sp) if sp > 0 else 0.0


def participant_level_frame(
    frame: pd.DataFrame, groups: np.ndarray, labels: np.ndarray
) -> pd.DataFrame:
    """Rata-ratakan fitur per anak, untuk perhitungan ukuran efek."""
    pf = frame.copy()
    pf["participant"] = groups
    pf["label"] = labels
    return pf.groupby("participant").mean(numeric_only=True)
