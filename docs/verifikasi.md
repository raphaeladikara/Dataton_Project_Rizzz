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
npx tsc --noEmit
npm run replay:check
```

`npm test` membangun aplikasi produksi lalu menjalankan **seluruh** berkas di `tests/`
lewat glob, bukan daftar berkas yang ditulis tangan; menambah berkas test baru tidak lagi
menuntut menyunting `package.json`. Cakupannya kontrak produk, parity, kalibrasi, pipeline
gaze, privasi, replay, fenotipe, hasil sesi, dan bukti publik Gate B.

`npx tsc --noEmit` harus bersih tanpa satu galat pun.

`npm run replay:check` membaca ulang setiap rekaman yang terdaftar di
`app/public/replay/index.json`. Manifest kosong bukan kegagalan; ia berarti Demo cepat akan
memakai simulasi dan mengatakannya di laporan.

## Artefak yang harus tetap sinkron

```powershell
.\.venv\Scripts\python.exe research\export_operating_points.py --check
.\.venv\Scripts\python.exe research\export_public_evidence.py --check
.\.venv\Scripts\python.exe research\prospective_evaluation.py
```

Perintah pertama gagal bila `model.json` tidak memuat kedua titik kerja, kedua bila
halaman validasi publik tertinggal dari ringkasan Gate A/B, dan ketiga menulis ulang
simulasi Gate C empat lengan dari `model.json`.

```powershell
.\.venv\Scripts\python.exe -c "import json; m=json.load(open('research/hasil/model.json')); s=json.load(open('research/hasil/gate_c_simulation.json')); print(m['decision']['default_operating_point']); print([a['id'] for a in s['arms']])"
```

Hasil yang diharapkan: `youden`, lalu
`['lr_target_sensitivity', 'lr_youden', 'geopref_published', 'gate_c_target']`.

## Pemeriksaan konsistensi

- Tidak ada dokumen yang menyebut Gate B sebagai perbandingan hardware eye-tracker.
- Angka Gate A/B cocok dengan kedua summary JSON.
- Manifest SHA-256 lulus.
- Paper dan halaman `/validation` memakai WebGazer.js serta batas klaim yang sama.
- Gate C dan D tidak ditulis sebagai hasil yang sudah lulus.
- Kesepakatan AOI tidak pernah menjadi headline; akurasi absolut hanya dikutip dari
  blok target diketahui Gate A.
- Tidak ada lengan simulasi Gate C yang memakai angka CNN.
