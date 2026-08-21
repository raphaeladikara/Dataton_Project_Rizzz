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


# --- Gate C planning simulation -------------------------------------------------
#
# Every number below is an expectation under stated assumptions. None of it is an
# observation: no prospective toddler has been enrolled. The arms exist so that a
# reader can see what each candidate operating point would do to a Posyandu queue.

import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent
MODEL_PATH = ROOT / "research" / "hasil" / "model.json"
SIMULATION_PATH = ROOT / "research" / "hasil" / "gate_c_simulation.json"

COHORT_SIZE = 1000
TARGET_PREVALENCE = 0.01
TECHNICAL_COVERAGE = 0.90


def operational_projection(sensitivity: float, specificity: float, *, prevalence: float, coverage: float, cohort_size: int) -> dict[str, Any]:
    """Counts and predictive values among the children the battery can score."""
    assessable = cohort_size * coverage
    true_positive = assessable * prevalence * sensitivity
    false_negative = assessable * prevalence * (1 - sensitivity)
    true_negative = assessable * (1 - prevalence) * specificity
    false_positive = assessable * (1 - prevalence) * (1 - specificity)
    referred = true_positive + false_positive
    return {
        "expected_counts": {
            "assessable": round(assessable, 4),
            "withheld": round(cohort_size - assessable, 4),
            "true_positive": round(true_positive, 4),
            "false_negative": round(false_negative, 4),
            "true_negative": round(true_negative, 4),
            "false_positive": round(false_positive, 4),
        },
        "operational_projection": {
            "referral_rate": round(referred / assessable, 6),
            "positive_predictive_value": round(true_positive / referred, 6) if referred else None,
            "negative_predictive_value": round(true_negative / (true_negative + false_negative), 6),
            "referrals_per_true_positive": round(referred / true_positive, 4) if true_positive else None,
        },
    }


def _model_operating_points() -> dict[str, dict[str, float]]:
    return json.loads(MODEL_PATH.read_text(encoding="utf-8"))["decision"]["operating_points"]


def gate_c_arms() -> list[dict[str, Any]]:
    points = _model_operating_points()
    return [
        {
            "id": "lr_target_sensitivity",
            "label": "Regresi logistik, titik sensitivitas 0,9",
            "status": "shipped_not_recommended",
            "assumptions": {
                "sensitivity": round(points["target_sensitivity_090"]["sensitivity"], 4),
                "specificity": round(points["target_sensitivity_090"]["specificity"], 4),
                "threshold": round(points["target_sensitivity_090"]["threshold"], 6),
                "source": "research/hasil/model.json, titik sensitivitas 0,9 pada OOF tingkat partisipan Carette (n=54, usia sekolah, 250 Hz)",
            },
            "note": "Spesifisitas 0,179 merujuk sebagian besar antrean; dilaporkan agar biayanya terlihat.",
        },
        {
            "id": "lr_youden",
            "label": "Regresi logistik, titik Youden",
            "status": "shipped_research_only",
            "assumptions": {
                "sensitivity": round(points["youden"]["sensitivity"], 4),
                "specificity": round(points["youden"]["specificity"], 4),
                "threshold": round(points["youden"]["threshold"], 6),
                "source": "research/hasil/model.json, titik Youden pada OOF tingkat partisipan Carette (n=54, usia sekolah, 250 Hz)",
            },
            "note": "Titik default ekspor model. Tetap di luar jalur keputusan produk karena penjaga OOD menolaknya pada balita.",
        },
        {
            "id": "geopref_published",
            "label": "GeoPref, ambang 69% terbit",
            "status": "active_rule_in",
            "assumptions": {
                "sensitivity": 0.17,
                "specificity": 0.98,
                "threshold": 0.69,
                "source": "Wen et al. 2022, Scientific Reports, n=1.863, usia 12-48 bulan",
            },
            "note": "Satu-satunya pemicu rujukan otomatis di produk. Sensitivitas rendah adalah sifat alat rule-in, bukan cacat implementasi.",
        },
        {
            "id": "gate_c_target",
            "label": "Target Gate C (preseden tablet)",
            "status": "target_not_achieved",
            "assumptions": {
                "sensitivity": 0.878,
                "specificity": 0.808,
                "threshold": None,
                "source": "Perochon et al. 2023, Nature Medicine (SenseToKnow), kamera depan tablet, usia 17-36 bulan",
            },
            "note": "Bukan performa NeuroGaze. Ini angka yang harus dikejar Gate C, diambil dari literatur alih-alih dikarang.",
        },
    ]


REFERRAL_CAPACITY = 0.20


def composite_rule_break_even(
    *,
    prevalence: float = TARGET_PREVALENCE,
    capacity: float = REFERRAL_CAPACITY,
) -> dict[str, Any]:
    """Specificity the composite rule must reach to fit the referral capacity.

    The other arms assume a sensitivity and a specificity and read off the cost.
    That is not available here: nobody has measured what the composite rule does
    on toddlers, and assuming a pair of numbers would invent exactly the kind of
    figure the rest of this project refuses to invent.

    So the question is asked backwards. Referral rate is

        prevalence x sensitivity + (1 - prevalence) x (1 - specificity)

    At a prevalence of 1% the first term cannot exceed 0.01 whatever the
    sensitivity, so the referral rate is governed almost entirely by the false
    positives. Solving for the specificity that keeps the rate inside `capacity`
    turns an unknown into a requirement Gate C can be designed to test.
    """
    # Worst case for the capacity constraint: perfect sensitivity refers every
    # true case, so it contributes its whole prevalence share.
    def required(at_capacity: float) -> float:
        return round(1 - (at_capacity - prevalence * 1.0) / (1 - prevalence), 4)

    return {
        "id": "composite_rule_break_even",
        "label": "Aturan komposit, spesifisitas minimum yang dibutuhkan",
        "status": "requirement_not_measurement",
        "question": "Berapa spesifisitas minimum aturan komposit supaya laju rujukannya muat di kapasitas rujukan?",
        "assumptions": {
            "referral_capacity": capacity,
            "prevalence": prevalence,
            "sensitivity_assumed": 1.0,
            "source": "Aritmetika atas kapasitas rujukan yang dinyatakan; bukan performa terukur.",
        },
        "required_specificity": required(capacity),
        "sensitivity_to_capacity": {
            f"{value:.2f}": required(value) for value in (0.05, 0.10, 0.20, 0.30)
        },
        "circularity_warning": (
            "Kapasitas 0,20 dipilih menyamai laju rujukan lengan target Gate C (0,199), jadi "
            "kemiripan syarat ini dengan spesifisitas Perochon 0,808 adalah akibat konstruksi, "
            "bukan temuan. Jangan sajikan sebagai kebetulan yang mengesankan."
        ),
        "what_this_actually_shows": (
            "Pada prevalensi 1%, suku sensitivitas tidak pernah melebihi 0,01 sehingga laju rujukan "
            "hampir seluruhnya ditentukan spesifisitas. Konsekuensinya: menaikkan sensitivitas aturan "
            "komposit nyaris tidak membebani antrean, sedangkan kehilangan beberapa poin spesifisitas "
            "membebaninya secara langsung. Itu yang menentukan ke mana Gate C harus diarahkan."
        ),
        "note": (
            "Blok ini sengaja tidak mengasumsikan sensitivitas dan spesifisitas aturan komposit. "
            "Keduanya belum diukur pada balita, dan mengarangnya akan mengulang persis kesalahan "
            "yang dihindari lengan-lengan lain. Yang dihitung adalah syarat yang harus dipenuhi."
        ),
        "unlocks": "docs/jalur_rujukan.md, langkah 3",
    }


def referral_load_multiples(arms: list[dict[str, Any]]) -> dict[str, Any]:
    """Each operating point's referral load as a multiple of the shipped one.

    The capacity argument used to be arithmetic against a stated assumption. It
    now has one field observation beside it: a practitioner asked whether the
    service could absorb three times the current referrals answered that it
    probably could not, because families already wait weeks to months for some
    services (docs/wawancara_praktisi_hasil.md, blok C).

    That is one person's judgement about their own district and it is not a
    capacity measurement. What it does is fix the unit. Expressing every arm as a
    multiple of the shipped GeoPref rate makes the comparison the same one the
    question asked, instead of leaving the reader to divide percentages.
    """
    baseline = next(
        (arm for arm in arms if arm["id"] == "geopref_published"), None)
    if baseline is None:
        return {"status": "baseline_arm_missing"}
    base_rate = baseline["operational_projection"]["referral_rate"]
    return {
        "id": "referral_load_multiples",
        "status": "arithmetic_over_stated_assumptions",
        "baseline_arm": "geopref_published",
        "baseline_referral_rate": base_rate,
        "multiples": {
            arm["id"]: round(arm["operational_projection"]["referral_rate"] / base_rate, 1)
            for arm in arms
        },
        "field_anchor": {
            "source": "docs/wawancara_praktisi_hasil.md, blok C",
            "n": 1,
            "asked": "Kalau anak yang disarankan diperiksa lanjut menjadi tiga kali lebih banyak, sanggup?",
            "answered": "Sepertinya akan sulit; tenaga dan jadwal yang tersedia mungkin kewalahan.",
            "current_wait": "beberapa minggu sampai beberapa bulan, tergantung tempat dan tenaga",
        },
        "what_this_shows": (
            "Titik kerja yang dikirim menghasilkan beban rujukan paling rendah di antara seluruh "
            "lengan. Lengan yang paling menggoda dipamerkan — sensitivitas 0,92 — menghasilkan "
            "beban puluhan kali lipat dari itu, jauh di atas kelipatan tiga yang sudah dinilai "
            "sulit oleh satu praktisi."
        ),
        "not_claimed": [
            "Satu wawancara bukan pengukuran kapasitas, dan angkanya tidak dipakai sebagai kapasitas.",
            "Praktisi tersebut tidak melihat tabel ini dan tidak menilai titik kerja mana pun.",
            "Kelipatan di sini adalah rasio laju rujukan yang diproyeksikan, bukan jumlah anak yang teramati.",
        ],
    }


def gate_c_simulation(
    *,
    cohort_size: int = COHORT_SIZE,
    prevalence: float = TARGET_PREVALENCE,
    coverage: float = TECHNICAL_COVERAGE,
) -> dict[str, Any]:
    arms = []
    for arm in gate_c_arms():
        projection = operational_projection(
            arm["assumptions"]["sensitivity"],
            arm["assumptions"]["specificity"],
            prevalence=prevalence,
            coverage=coverage,
            cohort_size=cohort_size,
        )
        arms.append({**arm, **projection})
    return {
        "status": "simulation_only_not_clinical_validation",
        "purpose": "Membandingkan biaya operasional tiap titik kerja pada antrean Posyandu 1.000 anak.",
        "assumptions": {
            "cohort_size": cohort_size,
            "target_prevalence": prevalence,
            "technical_coverage": coverage,
            "coverage_source": "Steffan et al. 2024, Infancy: attrition webcam balita 42%; 0,90 adalah asumsi perencanaan yang lebih longgar dan harus diuji di lapangan.",
        },
        "arms": arms,
        "composite_rule": composite_rule_break_even(prevalence=prevalence),
        "referral_load": referral_load_multiples(arms),
        "limitations": [
            "Tidak ada balita prospektif yang direkrut; setiap angka adalah ekspektasi, bukan observasi.",
            "Lengan regresi logistik berasal dari 54 partisipan Carette usia sekolah pada 250 Hz dan tidak berlaku untuk balita.",
            "Lengan GeoPref memakai performa terbit pada stimulus UCSD penuh; klip CC BY 16,75 detik belum tentu mereproduksinya.",
            "Lengan target Gate C adalah performa instrumen lain, bukan milik NeuroGaze.",
            "Prevalensi dan coverage teknis adalah asumsi perencanaan yang dinyatakan, bukan hasil pengukuran lokal.",
            "Blok composite_rule adalah syarat, bukan lengan: sensitivitas dan spesifisitas aturan komposit pada balita belum pernah diukur.",
            "Simulasi ini tidak bisa meluluskan Gate C atau memilih ambang klinis.",
        ],
    }


def write_gate_c_simulation(path: Path = SIMULATION_PATH) -> Path:
    path.write_text(
        json.dumps(gate_c_simulation(), indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    return path


if __name__ == "__main__":
    print(write_gate_c_simulation())
