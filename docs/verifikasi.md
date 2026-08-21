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
npm audit --omit=dev
npx tsc --noEmit
npm run replay:check
```

`npm test` membangun aplikasi produksi lalu menjalankan **seluruh** berkas di `tests/`
lewat glob, bukan daftar berkas yang ditulis tangan; menambah berkas test baru tidak lagi
menuntut menyunting `package.json`. Cakupannya kontrak produk, parity, kalibrasi, pipeline
gaze, privasi, replay, fenotipe, hasil sesi, dan bukti publik Gate B.

`npx tsc --noEmit` harus bersih tanpa satu galat pun.

Header respons dibangun `app/src/security/responseHeaders.ts`, bukan ditulis langsung di
`next.config.ts`. Hanya `script-src` yang berbeda antar mode: build yang dirilis tidak
pernah memuat `'unsafe-eval'`, sedangkan `next dev` memuatnya karena React versi
pengembangan memakai `eval()` untuk menyusun ulang callstack. HSTS juga hanya dikirim pada
mode produksi; mengirimnya dari `http://localhost` akan memaksa seluruh port lokal lain di
mesin operator pindah ke HTTPS. Setelah menyentuh berkas itu, buka `next dev` dan pastikan
konsol peramban bersih — galat CSP hanya muncul di peramban, bukan di test.

`npm run replay:check` membaca ulang setiap rekaman yang terdaftar di
`app/public/replay/index.json`. Manifest kosong bukan kegagalan; ia berarti Demo cepat akan
memakai simulasi dan mengatakannya di laporan.

## Artefak yang harus tetap sinkron

```powershell
.\.venv\Scripts\python.exe research\export_operating_points.py --check
.\.venv\Scripts\python.exe research\export_readiness_matrix.py --check
.\.venv\Scripts\python.exe research\export_public_evidence.py --check
.\.venv\Scripts\python.exe research\prospective_evaluation.py
```

Perintah pertama gagal bila `model.json` tidak memuat kedua titik kerja, kedua bila
JSON dan Markdown matriks kesiapan tidak sinkron dengan generator, ketiga bila halaman
validasi publik tertinggal dari bukti kanonis, dan keempat menulis ulang simulasi Gate C
empat lengan dari `model.json`.

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

## Analisis turunan

```powershell
.\.venv\Scripts\python.exe research\compare_models.py
.\.venv\Scripts\python.exe research\temporal_degradation.py
```

Keduanya menulis ulang artefak di `research/hasil` dari data mentah:
`perbandingan_model.json` (uji berpasangan CNN lawan regresi logistik) dan
`degradasi_temporal.json` (desimasi waktu sungguhan pada 27 sesi Gate B). Jalankan
setelah bukti bertambah, dan commit hasilnya bersama perubahan yang memicunya.

## Sebelum repositori dipublikkan

- `git ls-files data/ | wc -l` harus `0`.
- Riwayat Git sudah dibersihkan dari `data/` — lihat `pembersihan_dataset_wajah.md`.
- Keluaran gambar di `notebook/audit_dataset_wajah.ipynb` hanya grafik, tidak ada wajah:

```powershell
.\.venv\Scripts\python.exe -c "import json,io; nb=json.load(io.open('notebook/audit_dataset_wajah.ipynb',encoding='utf8')); print(sum('image/png' in o.get('data',{}) for c in nb['cells'] for o in c.get('outputs',[])))"
```

Hasil yang diharapkan: `6`.
