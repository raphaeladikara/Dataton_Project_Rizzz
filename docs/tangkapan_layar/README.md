# Tangkapan layar aplikasi

Diambil 21 Agustus 2026 dari build produksi (`npm run build` lalu `npm start`),
bukan dari mode pengembangan dan bukan mockup. Chrome headless, lebar 1440 px
untuk layar lebar dan 390 px untuk ponsel.

Set sebelumnya (`neurogaze-v3`) dihapus karena memperlihatkan laporan yang kode
sekarang tidak dapat menghasilkan. Set ini dibuat ulang dengan aturan: **setiap
laporan berasal dari rekaman nyata yang terdaftar**, bukan dari jalur sintetis —
jalur sintetis selalu ditahan penjaga OOD, jadi ia tidak boleh dipakai sebagai
gambar produk.

| Berkas | Isi | Asal angka |
|---|---|---|
| `01-beranda.png` | Beranda, satu tombol sesi lapangan | — |
| `02-panduan-dan-demo.png` | Panduan & demo: tiga skenario tetap, satu kendali per rekaman terdaftar, dan peragaan kamera langsung | — |
| `03-laporan-peragaan-pola-diproduksi.png` | Laporan peragaan, aturan menyala | Replay `sesi-produksi.json` |
| `04-laporan-peragaan-menonton-biasa.png` | Laporan peragaan, aturan tidak menyala | Replay `sesi-biasa.json` |
| `05-laporan-rincian-tenaga-kesehatan.png` | Laporan yang sama dengan pengungkapan tenaga kesehatan dibuka | Replay `sesi-produksi.json` |
| `06-bukti-validasi.png` | Halaman `/validation` | `research/hasil` lewat `export_public_evidence.py` |
| `07-beranda-ponsel.png` | Beranda pada 390 px | — |
| `08-menu-ringkas-ponsel.png` | Menu ringkas terbuka, empat tujuan tetap berlabel | — |

## Yang tidak ada di sini, dan kenapa

- **Tidak ada sesi kamera langsung dengan peserta sungguhan.** Menangkapnya
  berarti merekam wajah orang, dan tidak ada persetujuan untuk memasang gambar
  itu di repositori publik.
- **Tidak ada laporan rujukan lapangan.** Jalur `target_population_research`
  tidak pernah membuat perbandingan 69%, jadi laporan seperti itu memang tidak
  bisa diproduksi — dan gambar yang memperlihatkannya akan berbohong.
- Kedua laporan peragaan membawa spanduk mode demonstrasi dan `emitsReferral`
  tetap `false`. Keduanya memperagakan bentuk respons arsitektur pada orang
  dewasa, bukan hasil klinis.

Ambil ulang dengan menjalankan build produksi lalu menelusuri
`Panduan & demo → Peragakan · <label rekaman>`.
