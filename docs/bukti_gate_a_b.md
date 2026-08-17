# Bukti Gate A dan Gate B

Dokumen ini merangkum hasil yang dapat ditelusuri kembali ke ekspor webapp. Berkas mentah tidak diedit; `research/hasil/evidence_manifest.json` mengunci ukuran dan SHA-256 setiap berkas.

## Gate A — lulus

Sumber: `research/hasil/gate_a/sesi` dan `research/hasil/gate_a/gate_a_summary.json`.

| Metrik | Hasil |
|---|---:|
| Sesi / peserta / perangkat | 100 / 25 / 3 |
| Sesi lulus | 94 |
| Completion rate | 94% |
| Galat kalibrasi median | 2.207° |
| Frame valid rata-rata | 96.4% |
| Dropout gaze rata-rata | 3.6% |
| Skor risiko yang dipancarkan | 0 |

Gate A lulus sebagai validasi teknis akuisisi kamera dan gaze. Hasil ini tidak mengukur akurasi ASD.

## Gate B — lulus

Sumber: `research/hasil/gate_b/pasangan` dan `research/hasil/gate_b/gate_b_summary.json`.

Tiga puluh sesi membandingkan aliran gaze Neurogaze dengan WebGazer.js 3.5.3 secara simultan di browser. Dua puluh tujuh pasangan siap dianalisis dan tiga ditahan; pasangan yang ditahan tetap masuk denominator.

| Metrik | Hasil | Batas |
|---|---:|---:|
| Jumlah pasangan | 30 | ≥30 |
| Valid pair rate | 90% | ≥90% |
| Galat median ternormalisasi | 0.040997 | ≤0.05 |
| Galat median koordinat | 44.159 px | deskriptif |
| Agreement AOI rata-rata | 99.7574% | ≥95% |
| Agreement AOI utama | 100% (27/27) | ≥95% |
| Rata-rata ICC(A,1), 13 fitur | 0.505043 | deskriptif |

Semua kriteria kelulusan yang tercatat terpenuhi, sehingga keputusan agregat adalah `PASSED`. ICC dilaporkan untuk transparansi tetapi bukan kriteria kelulusan.

Gate B membuktikan agreement terhadap WebGazer.js sebagai referensi proyek. Gate B tidak membuktikan sensitivitas, spesifisitas, diagnosis ASD, atau kesetaraan dengan eye-tracker laboratorium.

## Verifikasi integritas

```powershell
.\.venv\Scripts\python.exe research\gate_evidence_repository.py --rebuild --verify
```

Perintah tersebut membangun ulang kedua ringkasan dari 130 berkas mentah dan memeriksa manifest SHA-256.
