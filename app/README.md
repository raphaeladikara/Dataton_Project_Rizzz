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

- Replay boleh menampilkan hasil model demonstrasi.
- Sesi kamera anak bersifat research-only dan tidak mengeluarkan skor ASD.
- Gate A memakai sesi dewasa untuk menguji akuisisi teknis.
- Halaman `/validation` memuat snapshot Gate B yang diturunkan dari 30 log agreement Neurogaze–WebGazer.
- Konsol `/admin` memerlukan `NEUROGAZE_ADMIN_PASSWORD_SHA256` dan `NEUROGAZE_ADMIN_SESSION_SECRET`.

## Verifikasi

```powershell
npm test
npm run lint
npm audit
```

Untuk deployment Vercel, tetapkan `app` sebagai Root Directory.
