# Neurogaze webapp

Next.js PWA untuk akuisisi gaze lokal, pemeriksaan kualitas, replay deterministik, dan publikasi bukti Gate B. Video tidak diunggah atau disimpan.

## Menjalankan lokal

```powershell
cd app
npm ci
npm run dev
```

Kamera browser memerlukan HTTPS atau localhost.

## Kontrak produk

- Sesi kamera melaporkan pengukuran dua lapis: persentase fiksasi geometrik terhadap ambang
  GeoPref 69% (satu-satunya pemicu rujukan otomatis), dan enam indeks perilaku yang
  deskriptif. Tidak ada skor gabungan dan tidak ada probabilitas ASD.
- Regresi logistik Carette tidak pernah memutuskan apa pun; ia hanya mengisi panel riset
  yang dijaga penapis out-of-distribution.
- Hasil di bawah ambang bukan kabar baik. NPV GeoPref 65%, dan tipe `reassures: false`
  menegakkannya.
- Gate A memakai sesi dewasa untuk menguji akuisisi teknis.
- Halaman `/validation` memuat snapshot Gate B yang diturunkan dari 30 log agreement Neurogaze–WebGazer.
- Konsol `/admin` memerlukan `NEUROGAZE_ADMIN_PASSWORD_SHA256` dan `NEUROGAZE_ADMIN_SESSION_SECRET`.

## Mendaftarkan rekaman untuk Demo cepat

Selama `public/replay/index.json` kosong, Demo cepat memakai simulasi dan mengatakannya di
laporan. Untuk memutar sesi nyata, ekspor log audit dari sesi kamera langsung lalu:

```powershell
npm run replay:register -- ..\tmp\audit.json --as session-a.json
npm run replay:check
```

Perintah pertama menolak berkas yang tidak membawa jejak frame dan menyebutkan alasannya —
log tanpa `gaze.frames` biasanya berasal dari sesi replay, dan bila terlanjur terdaftar ia
akan menghasilkan indeks perilaku kosong persis seperti simulasi yang seharusnya diganti.

## Verifikasi

```powershell
npm test
npm run lint
npm audit
npx tsc --noEmit
npm run replay:check
```

`npm test` menjalankan seluruh berkas di `tests/` lewat glob.

Untuk deployment Vercel, tetapkan `app` sebagai Root Directory.
