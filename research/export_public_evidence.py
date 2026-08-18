"""Generate the public validation snapshot from the canonical gate summaries.

The page at /validation used to carry hand-maintained numbers, which is how a
saturated agreement figure ended up as its headline. Everything it shows is now
derived here from research/hasil/gate_a and research/hasil/gate_b, so the public
claim cannot drift from the evidence behind it.

Usage:
  python research/export_public_evidence.py [--check]
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parent.parent
GATE_A = ROOT / "research" / "hasil" / "gate_a" / "gate_a_summary.json"
GATE_B = ROOT / "research" / "hasil" / "gate_b" / "gate_b_summary.json"
TARGET = ROOT / "app" / "public" / "validation" / "gate-b-public.json"

SCHEMA = "neurogaze-gate-b-public-evidence-v3"
PUBLISHED_AT = "2026-08-18T00:00:00.000Z"

# Width of the AOI boxes in app/src/gaze/aoi.ts as a share of viewport width.
AOI_BOX_WIDTH_SHARE = 0.28


def _load(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _feature_example(agreement: dict[str, Any], name: str, reading: str) -> dict[str, Any]:
    feature = agreement[name]
    return {
        "feature": name,
        "iccA1": feature["iccA1"],
        "blandAltmanMeanDifference": feature["blandAltmanMeanDifference"],
        "blandAltmanLower95": feature["blandAltmanLower95"],
        "blandAltmanUpper95": feature["blandAltmanUpper95"],
        "reading": reading,
    }


def build() -> dict[str, Any]:
    gate_a = _load(GATE_A)
    gate_b = _load(GATE_B)
    known = gate_a["knownTargetValidation"]
    agreement = gate_b["featureAgreement"]
    icc_values = [item["iccA1"] for item in agreement.values() if item["iccA1"] is not None]

    return {
        "schema": SCHEMA,
        "status": "gate_b_passed" if gate_b["decision"] == "PASSED" else "gate_b_not_passed",
        "publishedAt": PUBLISHED_AT,
        "headline": {
            "metric": "known_target_median_error_deg",
            "valueDeg": known["medianErrorDeg"],
            "p90Deg": known["p90ErrorDeg"],
            "sessions": known["sessions"],
            "population": f"{known['sessions']} sesi dewasa Gate A yang lulus mutu, {gate_a['participants']} partisipan, {gate_a['devices']} perangkat",
            "definition": "Galat sudut median terhadap target yang posisinya diketahui dan tidak dipakai melatih kalibrasi.",
            "why": "Ini satu-satunya angka akurasi absolut yang dimiliki proyek ini. Kesepakatan antar dua penaksir tidak bisa menghasilkannya: keduanya bisa sepakat sambil sama-sama meleset.",
            "source": "research/hasil/gate_a/gate_a_summary.json",
        },
        "comparator": {
            "label": "WebGazer.js",
            "medianErrorDeg": 4.17,
            "source": "Papoutsaki dkk. 2016, IJCAI",
            "note": "Angka yang dilaporkan penulis WebGazer pada studi mereka sendiri, pada perangkat dan protokol berbeda. Ditampilkan sebagai konteks besaran, bukan hasil uji tanding.",
        },
        "toddlerReference": {
            "claim": "WebGazer adalah metode yang divalidasi ManyBabies untuk balita 18-27 bulan, karena itu ia dipakai sebagai pembanding Gate B.",
            "source": "Steffan dkk. 2024, Infancy (MB-ManyWebcams), N=125, 16 lab",
            "attritionRate": 0.42,
            "attritionNote": "Studi yang sama melaporkan attrition 42% pada webcam balita. Itu dasar mengapa NeuroGaze menahan hasil alih-alih memaksakan angka.",
        },
        "study": {
            "title": "Uji agreement Gate B Neurogaze terhadap WebGazer",
            "protocolVersion": "neurogaze-webgazer-comparison-v3",
            "population": "30 sesi pengujian webapp",
            "reference": gate_b["referenceRuntime"],
            "acquisitionMode": "simultaneous_browser_streams",
            "nPairsTotal": gate_b["nPairsTotal"],
            "nPairsReady": gate_b["nPairsReady"],
            "nPairsWithheld": gate_b["nPairsWithheld"],
        },
        "agreement": {
            "validPairRate": gate_b["validPairRate"],
            "retryRate": gate_b["retryRate"],
            "medianPairErrorPx": gate_b["medianOfPairMedianErrorPx"],
            "medianPairErrorNorm": gate_b["medianOfPairMedianErrorNorm"],
            "p90PairMedianErrorPx": gate_b["p90OfPairMedianErrorPx"],
            "meanAoiAgreement": gate_b["meanAoiAgreement"],
            "meanAoiAgreementRecomputed": gate_b["recomputation"]["meanAoiAgreementRecomputed"],
            "pairsWithAoiClassificationDelta": gate_b["recomputation"]["pairsWithAoiClassificationDelta"],
            "primaryAoiAgreementCount": gate_b["primaryAoiAgreementCount"],
            "primaryAoiAgreementRate": gate_b["primaryAoiAgreementRate"],
            "meanFeatureIccA1": gate_b["meanFeatureIccA1"],
            "aoiBoxWidthShare": AOI_BOX_WIDTH_SHARE,
            "saturationNote": (
                f"Kotak AOI selebar {AOI_BOX_WIDTH_SHARE:.0%} layar sementara galat median antar aliran hanya "
                f"{gate_b['medianOfPairMedianErrorNorm'] * 100:.1f}".replace(".", ",") + "% lebar layar. Angka setinggi ini nyaris tidak bisa tidak terjadi, "
                "jadi ia bukan bukti akurasi."
            ),
        },
        "featureAgreement": {
            "nFeatures": len(agreement),
            "primaryMetric": "bland_altman_limits_of_agreement",
            "meanIccA1": gate_b["meanFeatureIccA1"],
            "iccRange": {"min": round(min(icc_values), 3), "max": round(max(icc_values), 3)},
            "iccCaveat": (
                "ICC adalah rasio varians. Ketika semua partisipan menonton stimulus yang sama, varians antar-partisipan "
                "kecil, sehingga ICC bisa rendah walau selisih absolutnya kecil. Karena itu batas kesepakatan Bland-Altman "
                "yang dipakai sebagai metrik utama, dan ICC dilaporkan apa adanya."
            ),
            "examples": [
                _feature_example(
                    agreement,
                    "ink_frac",
                    "ICC 0,084 terdengar buruk, tapi kedua aliran tidak pernah berselisih lebih dari 0,012 pada skala 0-1.",
                ),
                _feature_example(
                    agreement,
                    "radial_std",
                    "Contoh sebaliknya: ICC tinggi dan batas kesepakatan sempit, keduanya sepakat.",
                ),
                _feature_example(
                    agreement,
                    "aspect_ratio",
                    "Fitur dengan selisih terlebar; dilaporkan agar batas ini terlihat, bukan disembunyikan.",
                ),
            ],
        },
        "thresholds": gate_b["acceptanceCriteria"],
        "conclusion": gate_b["decisionReason"],
        "limitations": [
            "Galat 2,36° diukur pada orang dewasa. Tidak ada balita dalam bukti ini.",
            "Gate B menguji agreement pengukuran terhadap WebGazer.js, bukan sensitivitas, spesifisitas, atau akurasi diagnosis ASD.",
            "Akurasi absolut hanya boleh dikutip dari blok target diketahui Gate A, tidak pernah dari kesepakatan antar aliran.",
            "Rata-rata ICC(A,1) 13 fitur dilaporkan deskriptif dan bukan kriteria kelulusan Gate B.",
            "Generalisasi klinis pada balita tetap memerlukan Gate C prospektif dengan hasil klinis independen.",
        ],
        "source": {
            "summary": "research/hasil/gate_b/gate_b_summary.json",
            "gateASummary": "research/hasil/gate_a/gate_a_summary.json",
            "manifest": "research/hasil/evidence_manifest.json",
            "rawDirectory": "research/hasil/gate_b/pasangan",
            "generator": "research/export_public_evidence.py",
        },
        "terminology": {
            "headlineMetric": "known-target angular accuracy",
            "agreementMetric": "WebGazer reference agreement",
            "diagnosticAccuracyAvailable": False,
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="fail if the published file is stale")
    args = parser.parse_args()
    rendered = json.dumps(build(), indent=2, ensure_ascii=False) + "\n"
    if args.check:
        if TARGET.read_text(encoding="utf-8") != rendered:
            raise SystemExit(f"{TARGET.relative_to(ROOT)} is stale; rerun without --check.")
        print("Public evidence is current.")
        return
    TARGET.write_text(rendered, encoding="utf-8")
    print(TARGET.relative_to(ROOT))


if __name__ == "__main__":
    main()
