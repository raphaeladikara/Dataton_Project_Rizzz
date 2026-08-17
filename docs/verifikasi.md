# Verifikasi proyek

Jalankan dari root repository sebelum commit atau rilis.

## Bukti Gate A/B

```powershell
.\.venv\Scripts\python.exe research\gate_evidence_repository.py --rebuild --verify
```

Hasil yang diharapkan: 130 berkas diverifikasi, Gate A berisi 100 sesi, dan Gate B berisi 30 pasangan dengan keputusan `PASSED`.

## Python

```powershell
.\.venv\Scripts\python.exe -m pytest -q
```

## Webapp

```powershell
cd app
npm test
npm run lint
npm audit
```

`npm test` membangun aplikasi produksi dan menjalankan test kontrak, parity, kalibrasi, pipeline gaze, privasi, replay, serta bukti publik Gate B.

## Pemeriksaan konsistensi

- Tidak ada dokumen yang menyebut Gate B sebagai perbandingan hardware eye-tracker.
- Angka Gate A/B cocok dengan kedua summary JSON.
- Manifest SHA-256 lulus.
- Paper dan halaman `/validation` memakai WebGazer.js serta batas klaim yang sama.
- Gate C dan D tidak ditulis sebagai hasil yang sudah lulus.
