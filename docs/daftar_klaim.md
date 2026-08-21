# Daftar klaim

Setiap angka yang diucapkan di panggung, sumbernya, dan apakah ia milik proyek ini.

> Dihasilkan oleh `research/export_claims_register.py`, bukan ditulis tangan. Skripnya
> membaca nilai kanonis dari berkas bukti dan berhenti dengan galat kalau ada yang
> tidak cocok, jadi tabel ini tidak dapat melenceng dari buktinya diam-diam.

**21 klaim milik sendiri · 5 dikutip · 3 asumsi dinyatakan.**

| Klaim | Yang disebut | Milik | Sumber | Berkas bukti |
|---|---|---|---|---|
| Sesi Gate A lulus mutu | 94 dari 100 | milik sendiri | Gate A, 25 dewasa, 3 perangkat | `research/hasil/gate_a/gate_a_summary.json` |
| Galat kalibrasi median Gate A | 2,207° | milik sendiri | Gate A; konversi sudut lama tanpa jarak pandang per sesi | `research/hasil/gate_a/gate_a_summary.json` |
| Pasangan Gate B siap dibandingkan | 27 dari 30 | milik sendiri | Perbandingan simultan terhadap WebGazer.js 3.5.3 | `research/hasil/gate_b/gate_b_summary.json` |
| Galat antar aliran ternormalisasi median | 0,040997 | milik sendiri | Gate B; WebGazer adalah implementasi referensi, bukan ground truth | `research/hasil/gate_b/gate_b_summary.json` |
| Peserta kontrol positif | 12 dewasa | milik sendiri | Semua menyetujui untuk dirinya sendiri | `research/hasil/kontrol_positif/ringkasan.json` |
| Sesi kontrol positif direkam | 23 | milik sendiri | 3 perangkat | `research/hasil/kontrol_positif/ringkasan.json` |
| Sesi kontrol positif lulus mutu | 15 | milik sendiri | Attrition adalah bagian dari hasil, bukan angka yang dibuang | `research/hasil/kontrol_positif/ringkasan.json` |
| AUC CNN scanpath | 0,882 | milik sendiri | Data Carette, 54 partisipan, OOF tingkat partisipan | `research/hasil/perbandingan_model.json` |
| AUC regresi logistik 13 fitur | 0,823 | milik sendiri | Data Carette, partisipan yang sama | `research/hasil/perbandingan_model.json` |
| Selisih AUC berpasangan | 0,059, CI95 [−0,007, +0,137], p = 0,087 | milik sendiri | Bootstrap berpasangan terstratifikasi, 10.000 replikasi | `research/hasil/perbandingan_model.json` |
| Alas shortcut tingkat sesi pada data Cilia | AUC 0,905 | milik sendiri | Tanpa satu pun fitur perilaku; mengungguli model indeks 0,784 | `research/hasil/model_rujukan.json` |
| Model indeks perilaku pada data Cilia | AUC 0,784 | milik sendiri | Tiga indeks, 57 partisipan, lipatan per partisipan | `research/hasil/model_rujukan.json` |
| Bobot lapis 2 | ditolak audit | milik sendiri | Kriteria penolakan ditulis sebelum fitting dijalankan | `research/hasil/model_rujukan.json` |
| Penjaga OOD menerima di domain sumber | 544 dari 547 | milik sendiri | Kohort Carette; kalibrasi empiris 99,5% jadi ini pemeriksaan kewarasan | `research/hasil/ood_dua_arah.json` |
| Penjaga OOD pada stimulus yang dikirim | 1 dari 23 sesi diterima | milik sendiri | Sesi kontrol positif yang terekam | `research/hasil/ood_dua_arah.json` |
| Keputusan penjaga direproduksi lintas runtime | 23 dari 23 | milik sendiri | Keputusan browser dihitung ulang oleh Python dari nilai fitur tersimpan | `research/hasil/ood_dua_arah.json` |
| Beban rujukan titik sensitivitas 0,92 | 38,3× titik kerja yang dikirim | milik sendiri | Aritmetika atas asumsi kohort 1.000 dan prevalensi 1% | `research/hasil/gate_c_simulation.json` |
| Drift fitur kinematik, 26 → 13 Hz | median 69,4% | milik sendiri | 27 sesi Gate B dengan stempel waktu sungguhan; drift fitur, bukan akurasi | `research/hasil/degradasi_temporal.json` |
| Drift fitur geometri, 26 → 13 Hz | median 1,6% | milik sendiri | Sumber yang sama; sebagian fitur geometri tetap lemah pada laju lebih rendah | `research/hasil/degradasi_temporal.json` |
| Titik operasi GeoPref 69% | sens 0,17 · spec 0,98 · n=1.863 | dikutip | Wen dkk. 2022, Scientific Reports 12:4253, usia 12–48 bulan | — |
| Target Gate C | sens 0,878 · spec 0,808 | dikutip | Perochon dkk. 2023, Nature Medicine, 475 balita — performa instrumen lain | — |
| Attrition webcam balita | 42% | dikutip | Steffan dkk. 2024, Infancy, N=125 di 16 lab, usia 18–27 bulan | — |
| Usia diagnosis dan jeda kekhawatiran | 56 bulan · 32 bulan | dikutip | Tinjauan lintas negara. BUKAN estimasi Indonesia dan tidak boleh disebut begitu | — |
| Biaya EarliPoint | USD 599 per pemeriksaan | dikutip | Izin FDA 510(k) 2022, usia 16–30 bulan | — |
| Biaya per sesi | Rp 13.900 – Rp 1.700 | asumsi dinyatakan | Amortisasi tablet saja; biaya operasi belum diukur | — |
| Biaya per kasus ditemukan | Rp 9,08 jt – Rp 1,11 jt | asumsi dinyatakan | Berlaku hanya bila titik operasi protokol penuh direplikasi; hari ini ditahan | — |
| Sesi balita dapat dinilai per tahun | ~700 | asumsi dinyatakan | 30 Posyandu × 40 anak, dikurangi attrition 42%. Skala rekrutmen hipotetis | — |
| Anak ditangani sebelum usia 3 tahun | 3–4 dari sekitar 20 | milik sendiri | Wawancara satu guru SLB di Jambi; berbasis ingatan, n=1 | — |
| Kapasitas rujukan bila naik tiga kali lipat | "sepertinya akan sulit" | milik sendiri | Wawancara yang sama; penilaian satu praktisi, bukan pengukuran kapasitas | — |

## Cara membaca kolom "Milik"

- **milik sendiri** — Diukur oleh proyek ini dan dapat ditelusuri ke berkas di repositori.
- **dikutip** — Diukur studi lain. Tidak dapat diverifikasi dari repositori ini, dan tidak diklaim sebagai milik kami.
- **asumsi dinyatakan** — Aritmetika atas asumsi yang dinyatakan. Bukan hasil pengukuran.

## Yang tidak ada di tabel ini, dan tidak akan ada

Sensitivitas, spesifisitas, atau akurasi milik NeuroGaze. Ketiganya menuntut balita
berlabel dengan acuan klinis independen, dan itu Gate C.
