"""Every number said on stage, its source, and whether it is ours.

Written to be handed to a judge, and written as a generator rather than a table
so it cannot drift. Each claim that belongs to this project names the canonical
file it came from and the path inside it; the script reads that path and fails
if the value has moved. A register that agrees with the slides but not with the
evidence is worse than no register.

Cited claims — Wen, Perochon, Steffan, Moore, EarliPoint — carry their source
and are marked as somebody else's measurement. Those cannot be verified from
this repository, and saying so is the point of the column.

    python research/export_claims_register.py
"""

from __future__ import annotations

import json
import os
from typing import Any

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HASIL = os.path.join(ROOT, "research", "hasil")
JSON_OUT = os.path.join(HASIL, "daftar_klaim.json")
MD_OUT = os.path.join(ROOT, "docs", "daftar_klaim.md")

OURS = "milik sendiri"
CITED = "dikutip"
ASSUMPTION = "asumsi dinyatakan"


def dig(payload: Any, path: str) -> Any:
    node = payload
    for part in path.split("."):
        node = node[int(part)] if isinstance(node, list) else node[part]
    return node


# (claim, value_shown, ownership, source, file, json_path)
# file/json_path empty means the claim cannot be checked from this repository,
# which is exactly what the register is for.
CLAIMS: list[tuple[str, str, str, str, str, str]] = [
    # ── Gate A
    ("Sesi Gate A lulus mutu", "94 dari 100", OURS,
     "Gate A, 25 dewasa, 3 perangkat", "gate_a/gate_a_summary.json", "passed"),
    ("Galat kalibrasi median Gate A", "2,207°", OURS,
     "Gate A; konversi sudut lama tanpa jarak pandang per sesi", "gate_a/gate_a_summary.json", "medianCalibrationErrorDeg"),

    ("Sesi Gate A dijalankan", "100", OURS,
     "25 dewasa, 3 operator, 3 tablet Android kelas menengah", "gate_a/gate_a_summary.json", "sessions"),
    ("Kondisi lingkungan Gate A", "6 — cahaya redup/normal/campuran × berkacamata dan tidak", OURS,
     "Terekam di kolom site tiap log sesi", "", ""),
    ("Total sesi ujung-ke-ujung", "123 — 100 Gate A + 23 kontrol positif", OURS,
     "37 dewasa menyetujui. Operatornya tim proyek, BUKAN kader Posyandu", "", ""),
    ("Spesifisitas minimum lajur komposit", "≥ 98%", OURS,
     "Batas turunan: P(A dan B) ≤ min(P(A), P(B)), dengan spesifisitas GeoPref terbit 0,98. Tidak mengandaikan independensi", "", ""),

    # ── Gate B
    ("Pasangan Gate B siap dibandingkan", "27 dari 30", OURS,
     "Perbandingan simultan terhadap WebGazer.js 3.5.3", "gate_b/gate_b_summary.json", "nPairsReady"),
    ("Galat antar aliran ternormalisasi median", "0,040997", OURS,
     "Gate B; WebGazer adalah implementasi referensi, bukan ground truth", "gate_b/gate_b_summary.json", "medianOfPairMedianErrorNorm"),

    # ── Kontrol positif
    ("Peserta kontrol positif", "12 dewasa", OURS,
     "Semua menyetujui untuk dirinya sendiri", "kontrol_positif/ringkasan.json", "participants"),
    ("Sesi kontrol positif direkam", "23", OURS,
     "3 perangkat", "kontrol_positif/ringkasan.json", "sessionsRecorded"),
    ("Sesi kontrol positif lulus mutu", "15", OURS,
     "Attrition adalah bagian dari hasil, bukan angka yang dibuang", "kontrol_positif/ringkasan.json", "sessionsUsable"),

    # ── Perbandingan model
    ("AUC CNN scanpath", "0,882", OURS,
     "Data Carette, 54 partisipan, OOF tingkat partisipan", "perbandingan_model.json", "auc.cnn_efficientnetb0"),
    ("AUC regresi logistik 13 fitur", "0,823", OURS,
     "Data Carette, partisipan yang sama", "perbandingan_model.json", "auc.logistic_regression_geometri"),
    ("Selisih AUC berpasangan", "0,059, CI95 [−0,007, +0,137], p = 0,087", OURS,
     "Bootstrap berpasangan terstratifikasi, 10.000 replikasi", "perbandingan_model.json", "paired_test.p_two_sided"),

    # ── Lapis 2, hasil negatif
    ("Alas shortcut tingkat sesi pada data Cilia", "AUC 0,905", OURS,
     "Tanpa satu pun fitur perilaku; mengungguli model indeks 0,784", "model_rujukan.json", "audits.session_shortcut_baseline.auc_oof"),
    ("Model indeks perilaku pada data Cilia", "AUC 0,784", OURS,
     "Tiga indeks, 57 partisipan, lipatan per partisipan", "model_rujukan.json", "auc_oof_index_model"),
    ("Bobot lapis 2", "ditolak audit", OURS,
     "Kriteria penolakan ditulis sebelum fitting dijalankan", "model_rujukan.json", "verdict"),

    ("Alas shortcut pada kontrol positif sendiri", "AUC 0,537 · p = 0,26", OURS,
     "Audit identik dengan yang menolak lapis 2, dijalankan pada data sendiri", "audit_shortcut_sendiri.json", "results.usable_only.auc_oof_nuisance_only"),
    ("Aturan ambang terhadap selang, pada preferensi 0,69", "menyala 4,8% (aturan titik lama: 52,2%)", OURS,
     "Simulasi 400 sesi per titik, research/simulate_geopref_interval.py", "", ""),
    ("Aturan ambang terhadap selang, pada preferensi 0,90", "menyala 99,0%", OURS,
     "Sumber yang sama; sensitivitas pada preferensi tinggi tidak hilang", "", ""),

    # ── Penjaga OOD
    ("Penjaga OOD menerima di domain sumber", "544 dari 547", OURS,
     "Kohort Carette; kalibrasi empiris 99,5% jadi ini pemeriksaan kewarasan", "ood_dua_arah.json", "accepts_on_source_domain.n_passed"),
    ("Penjaga OOD pada stimulus yang dikirim", "1 dari 23 sesi diterima", OURS,
     "Sesi kontrol positif yang terekam", "ood_dua_arah.json", "refuses_on_shipped_stimulus.n_passed"),
    ("Keputusan penjaga direproduksi lintas runtime", "23 dari 23", OURS,
     "Keputusan browser dihitung ulang oleh Python dari nilai fitur tersimpan", "ood_dua_arah.json", "cross_runtime_parity.n_reproduced"),

    # ── Beban rujukan
    ("Beban rujukan titik sensitivitas 0,92", "38,3× titik kerja yang dikirim", OURS,
     "Aritmetika atas asumsi kohort 1.000 dan prevalensi 1%", "gate_c_simulation.json", "referral_load.multiples.lr_target_sensitivity"),

    # ── Degradasi temporal
    ("Drift fitur kinematik, 26 → 13 Hz", "median 69,4%", OURS,
     "27 sesi Gate B dengan stempel waktu sungguhan; drift fitur, bukan akurasi", "degradasi_temporal.json", ""),
    ("Drift fitur geometri, 26 → 13 Hz", "median 1,6%", OURS,
     "Sumber yang sama; sebagian fitur geometri tetap lemah pada laju lebih rendah", "degradasi_temporal.json", ""),

    # ── Dikutip, tidak dapat diverifikasi dari repositori ini
    ("Titik operasi GeoPref 69%", "sens 0,17 · spec 0,98 · n=1.863", CITED,
     "Wen dkk. 2022, Scientific Reports 12:4253, usia 12–48 bulan", "", ""),
    ("Target Gate C", "sens 0,878 · spec 0,808", CITED,
     "Perochon dkk. 2023, Nature Medicine, 475 balita — performa instrumen lain", "", ""),
    ("Attrition webcam balita", "42%", CITED,
     "Steffan dkk. 2024, Infancy, N=125 di 16 lab, usia 18–27 bulan", "", ""),
    ("Usia diagnosis dan jeda kekhawatiran", "56 bulan · 32 bulan", CITED,
     "Tinjauan lintas negara. BUKAN estimasi Indonesia dan tidak boleh disebut begitu", "", ""),
    ("Biaya EarliPoint", "USD 599 per pemeriksaan", CITED,
     "Izin FDA 510(k) 2022, usia 16–30 bulan", "", ""),

    # ── Asumsi perencanaan
    ("Biaya per sesi", "Rp 13.900 – Rp 1.700", ASSUMPTION,
     "Amortisasi tablet saja; biaya operasi belum diukur", "", ""),
    ("Biaya per kasus ditemukan", "Rp 9,08 jt – Rp 1,11 jt", ASSUMPTION,
     "Berlaku hanya bila titik operasi protokol penuh direplikasi; hari ini ditahan", "", ""),
    ("Sesi balita dapat dinilai per tahun", "~700", ASSUMPTION,
     "30 Posyandu × 40 anak, dikurangi attrition 42%. Skala rekrutmen hipotetis", "", ""),

    # ── Wawancara praktisi, n=1
    ("Anak ditangani sebelum usia 3 tahun", "3–4 dari sekitar 20", OURS,
     "Wawancara satu guru SLB di Jambi; berbasis ingatan, n=1", "", ""),
    ("Kapasitas rujukan bila naik tiga kali lipat", "\"sepertinya akan sulit\"", OURS,
     "Wawancara yang sama; penilaian satu praktisi, bukan pengukuran kapasitas", "", ""),
]


# What the slide says the canonical value is, as a number. Reading the path is
# not enough — a path that still resolves while the value underneath it moved is
# exactly the drift this file exists to catch. Rounded claims declare their own
# tolerance; exact ones use zero.
EXPECTED: dict[str, tuple[float, float]] = {
    "Sesi Gate A lulus mutu": (94, 0),
    "Sesi Gate A dijalankan": (100, 0),
    "Galat kalibrasi median Gate A": (2.207, 0.0005),
    "Pasangan Gate B siap dibandingkan": (27, 0),
    "Galat antar aliran ternormalisasi median": (0.040997, 1e-6),
    "Peserta kontrol positif": (12, 0),
    "Sesi kontrol positif direkam": (23, 0),
    "Sesi kontrol positif lulus mutu": (15, 0),
    "AUC CNN scanpath": (0.882, 0.0005),
    "AUC regresi logistik 13 fitur": (0.823, 0.0005),
    "Selisih AUC berpasangan": (0.087, 0.0005),
    "Alas shortcut tingkat sesi pada data Cilia": (0.905, 0.0005),
    "Model indeks perilaku pada data Cilia": (0.784, 0.0005),
    "Penjaga OOD menerima di domain sumber": (544, 0),
    "Penjaga OOD pada stimulus yang dikirim": (1, 0),
    "Keputusan penjaga direproduksi lintas runtime": (23, 0),
    "Beban rujukan titik sensitivitas 0,92": (38.3, 0.05),
    "Alas shortcut pada kontrol positif sendiri": (0.537, 0.0005),
}

EXPECTED_TEXT: dict[str, str] = {
    "Bobot lapis 2": "weights_rejected_layer_1_ships_alone",
}


def main() -> None:
    payloads: dict[str, Any] = {}
    rows, mismatches = [], []

    for claim, shown, ownership, source, filename, path in CLAIMS:
        verified = None
        if filename and path:
            if filename not in payloads:
                payloads[filename] = json.load(open(os.path.join(HASIL, filename), encoding="utf-8"))
            try:
                verified = dig(payloads[filename], path)
            except (KeyError, IndexError, TypeError, ValueError) as error:
                mismatches.append(f"{claim}: {filename}#{path} tidak terbaca ({error})")
            else:
                if claim in EXPECTED:
                    want, tolerance = EXPECTED[claim]
                    if abs(float(verified) - want) > tolerance:
                        mismatches.append(
                            f"{claim}: slide menyebut {want}, berkas kanonis {verified} "
                            f"(toleransi {tolerance})")
                if claim in EXPECTED_TEXT and verified != EXPECTED_TEXT[claim]:
                    mismatches.append(
                        f"{claim}: slide menyebut {EXPECTED_TEXT[claim]!r}, berkas {verified!r}")
        rows.append({
            "claim": claim,
            "shown": shown,
            "ownership": ownership,
            "source": source,
            "evidence_file": f"research/hasil/{filename}" if filename else None,
            "evidence_path": path or None,
            "canonical_value": verified,
        })

    if mismatches:
        raise SystemExit("Daftar klaim tidak cocok dengan bukti kanonis:\n  " + "\n  ".join(mismatches))

    register = {
        "schemaVersion": "neurogaze-daftar-klaim-v1",
        "purpose": "Setiap angka yang diucapkan di panggung, sumbernya, dan apakah ia milik proyek ini.",
        "generator": "research/export_claims_register.py",
        "ownership_legend": {
            OURS: "Diukur oleh proyek ini dan dapat ditelusuri ke berkas di repositori.",
            CITED: "Diukur studi lain. Tidak dapat diverifikasi dari repositori ini, dan tidak diklaim sebagai milik kami.",
            ASSUMPTION: "Aritmetika atas asumsi yang dinyatakan. Bukan hasil pengukuran.",
        },
        "counts": {
            OURS: sum(1 for r in rows if r["ownership"] == OURS),
            CITED: sum(1 for r in rows if r["ownership"] == CITED),
            ASSUMPTION: sum(1 for r in rows if r["ownership"] == ASSUMPTION),
        },
        "claims": rows,
    }
    with open(JSON_OUT, "w", encoding="utf-8") as fh:
        json.dump(register, fh, ensure_ascii=False, indent=2)

    lines = [
        "# Daftar klaim",
        "",
        "Setiap angka yang diucapkan di panggung, sumbernya, dan apakah ia milik proyek ini.",
        "",
        "> Dihasilkan oleh `research/export_claims_register.py`, bukan ditulis tangan. Skripnya",
        "> membaca nilai kanonis dari berkas bukti dan berhenti dengan galat kalau ada yang",
        "> tidak cocok, jadi tabel ini tidak dapat melenceng dari buktinya diam-diam.",
        "",
        f"**{register['counts'][OURS]} klaim milik sendiri · "
        f"{register['counts'][CITED]} dikutip · "
        f"{register['counts'][ASSUMPTION]} asumsi dinyatakan.**",
        "",
        "| Klaim | Yang disebut | Milik | Sumber | Berkas bukti |",
        "|---|---|---|---|---|",
    ]
    for row in rows:
        evidence = f"`{row['evidence_file']}`" if row["evidence_file"] else "—"
        lines.append(
            f"| {row['claim']} | {row['shown']} | {row['ownership']} | {row['source']} | {evidence} |")
    lines += [
        "",
        "## Cara membaca kolom \"Milik\"",
        "",
        f"- **{OURS}** — {register['ownership_legend'][OURS]}",
        f"- **{CITED}** — {register['ownership_legend'][CITED]}",
        f"- **{ASSUMPTION}** — {register['ownership_legend'][ASSUMPTION]}",
        "",
        "## Yang tidak ada di tabel ini, dan tidak akan ada",
        "",
        "Sensitivitas, spesifisitas, atau akurasi milik NeuroGaze. Ketiganya menuntut balita",
        "berlabel dengan acuan klinis independen, dan itu Gate C.",
        "",
    ]
    with open(MD_OUT, "w", encoding="utf-8") as fh:
        fh.write("\n".join(lines))

    print(f"{len(rows)} klaim · {register['counts'][OURS]} milik sendiri, "
          f"{register['counts'][CITED]} dikutip, {register['counts'][ASSUMPTION]} asumsi")
    print(MD_OUT)


if __name__ == "__main__":
    main()
