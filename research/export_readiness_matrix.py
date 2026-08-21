"""Generate the canonical competition-readiness matrix.

The JSON is the machine-readable source consumed by public evidence. The Markdown
is the judge-readable view. Both are rendered from the same five capability rows.

Usage:
  python research/export_readiness_matrix.py [--check]
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parent.parent
JSON_TARGET = ROOT / "research" / "hasil" / "readiness_matrix.json"
MARKDOWN_TARGET = ROOT / "docs" / "readiness_matrix.md"


def build() -> dict[str, Any]:
    return {
        "schema": "neurogaze-readiness-matrix-v1",
        "asOf": "2026-08-21",
        "clinicalClaimsAvailable": False,
        "capabilities": [
            {
                "id": "on_device_measurement_chain",
                "capability": "Rantai pengukuran di perangkat",
                "status": "ready_for_engineering_demo",
                "statusLabel": "Siap untuk demonstrasi rekayasa",
                "evidence": "Pipeline browser, uji parity, Gate A, dan Gate B",
                "boundary": "Gate A/B menguji pengukuran teknis, bukan skrining klinis.",
            },
            {
                "id": "adult_responsivity",
                "capability": "Respons instrumen pada pola yang diproduksi",
                "status": "demonstrated",
                "statusLabel": "Ditunjukkan pada kontrol positif dewasa",
                "evidence": "12 dewasa; 23 sesi direkam; 15 lulus mutu; aturan demo 0/9 biasa dan 4/6 pola diproduksi",
                "boundary": "Manipulation check, bukan sensitivitas, spesifisitas, ASD, atau status klinis peserta.",
            },
            {
                "id": "automatic_toddler_referral",
                "capability": "Rujukan otomatis balita",
                "status": "withheld",
                "statusLabel": "Ditahan",
                "evidence": "Klip lapangan 16,75 detik lebih pendek daripada protokol penuh tempat ambang 69% diterbitkan",
                "boundary": "Perbandingan 69% hanya boleh diperagakan dalam mode demo dan tidak mengeluarkan rujukan.",
            },
            {
                # Dipisah dari keterpakaian kader dengan sengaja. Alur operator
                # sudah dijalankan ratusan kali; yang belum adalah dijalankan
                # oleh kader Posyandu di alur layanan. Menggabungkan keduanya
                # akan mengubah bukti yang nyata menjadi klaim yang runtuh
                # begitu ditanya "berapa kader, dari Posyandu mana".
                "id": "operator_flow",
                "capability": "Alur operator ujung-ke-ujung",
                "status": "exercised",
                "statusLabel": "Dijalankan berulang di perangkat nyata",
                "evidence": (
                    "123 sesi dijalankan 3 operator pada 37 dewasa yang menyetujui: "
                    "100 sesi Gate A dan 23 sesi kontrol positif, di 3 tablet Android kelas "
                    "menengah dan 6 kondisi lingkungan (cahaya redup, normal, campuran × "
                    "berkacamata dan tidak)"
                ),
                "boundary": (
                    "Operatornya tim proyek, bukan kader Posyandu, dan lokasinya bukan Posyandu. "
                    "Ini menunjukkan alurnya dapat dijalankan berulang di perangkat dan cahaya "
                    "yang nyata; ia tidak menunjukkan alurnya dapat dijalankan kader."
                ),
            },
            {
                "id": "kader_usability",
                "capability": "Keterpakaian oleh kader",
                "status": "not_tested",
                "statusLabel": "Belum diuji",
                "evidence": "Belum ada kader Posyandu yang menjalankan aplikasi",
                "boundary": "Perlu uji tugas, waktu, kegagalan, pelatihan, dan dukungan di alur layanan nyata.",
            },
            {
                "id": "indonesian_toddler_validity",
                "capability": "Validitas pada balita Indonesia",
                "status": "not_tested",
                "statusLabel": "Belum diuji",
                "evidence": "Belum ada balita dalam bukti proyek dan instrumen yang digunakan di sini belum divalidasi di Indonesia",
                "boundary": "Perlu mitra yang mampu menjalankan kaji etik, izin orang tua setelah penjelasan, acuan klinis buta, linkage privat, rekrutmen, analisis fairness/kegagalan, dan validasi prospektif.",
            },
        ],
        "source": {
            "generator": "research/export_readiness_matrix.py",
            "positiveControl": "research/hasil/kontrol_positif/ringkasan.json",
            "gateA": "research/hasil/gate_a/gate_a_summary.json",
            "gateB": "research/hasil/gate_b/gate_b_summary.json",
        },
    }


def render_markdown(matrix: dict[str, Any]) -> str:
    rows = "\n".join(
        f"| {item['capability']} | {item['statusLabel']} | {item['evidence']} | {item['boundary']} |"
        for item in matrix["capabilities"]
    )
    return f"""# Matriks kesiapan NeuroGaze

Status per {matrix['asOf']}. Berkas ini dan
`research/hasil/readiness_matrix.json` dibuat dari
`research/export_readiness_matrix.py`; ubah generatornya, lalu ekspor ulang.

| Kapabilitas | Status | Bukti hari ini | Batas klaim |
|---|---|---|---|
{rows}

NeuroGaze saat ini membuktikan rantai pengukuran, mekanisme penolakan, pelaporan,
dan respons instrumen terhadap manipulasi perilaku pada orang dewasa. Proyek ini
belum membuktikan skrining klinis balita Indonesia.
"""


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="fail if either generated file is stale")
    args = parser.parse_args()
    matrix = build()
    rendered_json = json.dumps(matrix, indent=2, ensure_ascii=False) + "\n"
    rendered_markdown = render_markdown(matrix)

    if args.check:
        stale = []
        if not JSON_TARGET.exists() or JSON_TARGET.read_text(encoding="utf-8") != rendered_json:
            stale.append(JSON_TARGET.relative_to(ROOT))
        if not MARKDOWN_TARGET.exists() or MARKDOWN_TARGET.read_text(encoding="utf-8") != rendered_markdown:
            stale.append(MARKDOWN_TARGET.relative_to(ROOT))
        if stale:
            raise SystemExit("Readiness artifacts are stale: " + ", ".join(map(str, stale)))
        print("Readiness artifacts are current.")
        return

    JSON_TARGET.write_text(rendered_json, encoding="utf-8")
    MARKDOWN_TARGET.write_text(rendered_markdown, encoding="utf-8")
    print(JSON_TARGET.relative_to(ROOT))
    print(MARKDOWN_TARGET.relative_to(ROOT))


if __name__ == "__main__":
    main()
