# Status tangkapan layar

**Berkas di `neurogaze-v3/` sudah tidak sesuai dengan aplikasi yang berjalan.** Jangan
dipakai di deck atau makalah sebelum diambil ulang.

Yang berubah sejak set itu dibuat:

- Baterai 96 → 80 detik, dan blok pilihan tontonan pindah ke urutan kedua.
- Urutan isyarat diseimbangkan per sesi, jadi label adegan tidak lagi tetap.
- Laporan membawa lajur rekomendasi komposit dan panel riset yang menampilkan putusan
  penjaga OOD beserta jarak tiap fitur.
- Sesi yang ditahan kini menyebut gerbang mana yang menolak.

Yang paling menyesatkan: **`08-refer-report.png` menampilkan hasil rujukan yang kode
saat ini tidak dapat produksi.** Ambang 69% ditahan selama stimulus penuh belum
tersedia, jadi laporan seperti itu hanya muncul lewat mode demonstrasi — dan mode itu
selalu membawa banner yang menyatakan dirinya demonstrasi. Memakai tangkapan lama
berarti menunjukkan keluaran yang tidak ada.

## Cara mengambil ulang

Set ini baru bisa lengkap setelah ada rekaman sesi nyata yang terdaftar, karena jalur
sintetis selalu ditahan oleh penjaga OOD. Urutannya:

1. Rekam sesi mengikuti [`../kontrol_positif.md`](../kontrol_positif.md).
2. Daftarkan: `npm run replay:register -- <audit-log.json> --as sesi-a.json`.
3. Jalankan `npm run dev`, lalu ambil ulang seluruh alur ke `neurogaze-v4/`.
4. Sertakan satu tangkapan mode demonstrasi lengkap dengan banner-nya, supaya jelas
   dari mana laporan rujukan itu berasal.
