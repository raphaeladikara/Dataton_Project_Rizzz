---
language:
- id
library_name: scikit-learn
pipeline_tag: tabular-classification
tags:
- autism
- eye-tracking
- scanpath
- responsible-ai
- group-aware-evaluation
license: other
---

# Neurogaze gaze model

Regresi logistik 13 fitur geometri scanpath dengan kalibrasi Platt. Artefak ini hanya digunakan dalam replay deterministik; sesi kamera live tidak menjalankannya untuk memberi skor ASD.

> Model ini bukan alat diagnosis dan belum divalidasi secara klinis pada anak usia 16–30 bulan atau pada layanan Posyandu.

## Hasil retrospektif

- Data: 547 citra scanpath Carette dari 54 partisipan.
- Split: nested GroupKFold berdasarkan ID partisipan.
- AUC tingkat anak: 0.8228; 95% CI 0.6974–0.9290.
- Ambang replay 0.2243: sensitivitas 92.3% dan spesifisitas 17.9%.
- Proxy degradasi gabungan: AUC 0.6827; proxy bukan resampling temporal.

Partisipan sumber rata-rata berusia sekitar 7.9 tahun dan direkam dengan eye-tracker 250 Hz. Angka tersebut adalah bukti prinsip geometri scanpath, bukan performa klinis Neurogaze pada balita.

## Berkas

- `model.json`: scaler, koefisien, kalibrator, urutan fitur, checksum, dan batas penggunaan.
- `training.json`: metrik nested CV dan bootstrap.
- `degradasi.json`: sweep degradasi dan asumsi proxy.
- `audit_wajah.json`: audit tata kelola dataset wajah yang tidak digunakan oleh produk.
- `hasil_tingkat_anak.json`: hasil model pembanding tingkat anak.
- `fitur.csv`: fitur turunan Carette dan ID kelompok.

Implementasi referensi berada di `research/training.py`; implementasi browser berada di `app/src/inference/model.ts`. Test parity memeriksa probabilitas hingga toleransi numerik `1e-12`.

## Batas penggunaan

- Belum ada validasi eksternal atau prospektif.
- Belum ada evaluasi subkelompok demografis karena metadata tidak tersedia.
- Dataset wajah statis dan model auditnya tidak digunakan untuk inferensi produk.
- Ambang klinis harus ditentukan pada kohort target bersama klinisi dan kapasitas rujukan.
- Raw video dan audio tidak diperlukan oleh model JSON ini.
