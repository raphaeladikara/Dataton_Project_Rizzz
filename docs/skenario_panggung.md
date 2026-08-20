# Skenario panggung: dua babak, satu tombol

Dua orang menjalani sesi yang sama berturut-turut, dan penonton melihat dua
laporan yang berbeda. Itu seluruh isi demonstrasinya. Kalau hanya satu babak yang
dijalankan, yang terbukti adalah alat ini bisa mengeluarkan rujukan — bukan bahwa
ia bisa membedakan.

Yang naik ke panggung sudah lebih dulu diukur: 12 peserta, 23 rekaman, 19 Agustus
2026. Aturan komposit menyala pada 4 dari 6 sesi pola-diproduksi dan **0 dari 9**
sesi menonton-biasa ([`kontrol_positif.md`](kontrol_positif.md)). Demo langsung
adalah ilustrasi dari tabel itu, bukan penggantinya, dan sebaiknya disebut begitu.

---

## Sebelum naik

| | |
|---|---|
| Perangkat | Chrome atau Edge di `localhost` atau HTTPS. Kamera tidak jalan di HTTP non-lokal |
| Dudukan | Tablet atau laptop di stand. Jangan dipegang — getaran tangan masuk ke jejak pose |
| Jarak | 40–50 cm, pusat layar sejajar mata |
| Cahaya | Merata dari depan. **Tidak ada jendela di belakang peserta** — backlight membuat iris tidak terbaca |
| Mode | Dipilih di layar persetujuan, bukan sebelum itu. Lihat babak 1 |

---

## Babak 1 — pola diproduksi

Pencet **Mulai observasi kamera**. Tombolnya sama dengan yang dipakai kader di
Posyandu, dan halaman berikutnya adalah layar persetujuan yang sama.

**Di layar persetujuan, centang "Peragaan demo".** Kotaknya ada tepat di atas
centang panggilan nama. Begitu dicentang, tiga hal berubah sekaligus dan bisa
dilihat penonton: kolom usia hilang (pesertanya bukan balita, dan mengarang
angka 24 akan masuk ke log audit), judul layarnya jadi "Siapkan peragaan
panggung", dan strip gelap muncul di puncak layar sampai sesi selesai. ID yang
sudah terlanjur diketik tetap dipertahankan.

Kotak itu yang menerapkan ambang GeoPref 69%. Tanpanya, sesi berjalan seperti di
lapangan dan ambangnya ditahan — laporannya berhenti di angka, tanpa kesimpulan
rujukan. Itu bukan bug; itu memang yang dikirim.

Sesudah dicentang, jalani seluruh prosedur.

**Kalibrasi.** Ikuti kelima titik sampai lolos. Jangan dipaksakan: galat
kalibrasi masuk ke setiap angka sesudahnya, dan pada perekaman pertama
kriteria "pandangan menempel di tepi layar ≤25%" sendirian menahan 8 dari 23
rekaman.

**Blok pilihan tontonan** (dua panel bersebelahan, tanpa suara — itu memang
protokolnya). Pandangi terus panel berisi bentuk geometris bergerak. Jangan
melirik panel berisi orang.

**Blok isyarat arah** (tokoh vektor melihat atau menunjuk ke kiri/kanan).
Urutannya penting:

1. **Lihat wajah tokohnya dulu**, dan tetap di situ saat isyarat disampaikan.
2. **Baru** tahan pandangan di tengah. Jangan ikuti arah tunjukannya.

Butir pertama itu yang menggagalkan 2 dari 6 sesi produksi pada kontrol positif.
Bukan karena perilakunya salah, tapi karena `attendedAtCue` tidak mencapai 5 dari
8 — sistem menolak menyimpulkan seseorang tidak mengikuti isyarat kalau tidak ada
bukti isyarat itu sempat terlihat ([`jointAttention.ts`](../app/src/inference/jointAttention.ts)).
Menerawang ke kejauhan menghasilkan "tidak dapat dinilai", bukan "menyimpang".

Tetap menghadap layar sepanjang sesi. Nama akan dipanggil di satu fase; abaikan
saja, sinyalnya dikarantina dan hanya dicatat sebagai angka deskriptif.

**Yang muncul kalau berhasil:**

> **Sebaiknya diperiksa lebih lanjut di Puskesmas atau rumah sakit**
> Lajur komposit menyala · 2 dari 2 sinyal menyimpang

Di bawahnya tiga alasan bernomor: preferensi geometrik dengan selang
kepercayaannya, isyarat yang tidak diikuti, dan peluang pasca-tes 1,0% → 7,9%.

---

## Babak 2 — menonton biasa

Panggil orang yang belum menonton babak 1 dari dekat. Nyalakan sesi baru dari
tombol yang sama, dan **centang "Peragaan demo" lagi** — centangnya tidak
diwariskan antar sesi, sama seperti kalibrasi.

Satu-satunya instruksi, dibacakan apa adanya:

> "Duduk santai, lihat layar dengan wajar. Tidak ada jawaban benar atau salah,
> dan tidak ada yang perlu dicari. Kalau ada suara, tanggapi sewajarnya saja."

Jangan menyebut isyarat arah. Jangan menyebut panel mana yang menarik. Jangan
menunjuk layar. Berdirilah di belakang tablet, dan diam selama 80 detik.

**Yang muncul:**

> **Tidak ada tanda yang perlu ditindaklanjuti dari sesi ini**

Barisnya di bawah judul bisa berbunyi tiga cara, dan ketiganya normal:

| Baris kedua | Artinya |
|---|---|
| `2 dari 2 sinyal dinilai · tidak ada yang menyimpang` | kasus terbaik, ~3 dari 9 sesi |
| `1 sinyal dinilai dan tidak menyimpang · 1 sinyal tidak dapat dinilai` | cakupan AOI kurang, atau isyarat diikuti 5–6 dari 8 sehingga tidak lolos p<0,05 |
| `1 dari 2 sinyal menyimpang · di bawah batas 2` | satu sesi menonton-biasa pada kontrol positif memang mendarat di 73% geometrik |

Judul besarnya sama di ketiganya, dan itu disengaja. Yang berubah cuma
rinciannya. Kalau ada yang bertanya kenapa, jawabannya ada di baris kedua dan di
daftar alasan — dan itu jawaban yang lebih baik daripada judul yang berubah-ubah.

---

## Bahasa

Kondisi 1 disebut **"menonton biasa"**. Kondisi 2 disebut **"memproduksi pola
perhatian yang literatur identifikasi sebagai penanda dini"**.

Tidak pernah "berpura-pura autis", tidak pernah "memperagakan anak autis".
Alasannya dua dan masing-masing cukup sendiri: yang diperagakan memang pola
terukur, bukan seseorang; dan mengkarikaturkan perilaku autistik di depan panel
yang mungkin punya kaitan personal dengan ASD akan merusak setiap hal lain yang
dibangun proyek ini. Uraiannya di [`kontrol_positif.md`](kontrol_positif.md).

Sebutkan protokol dua butirnya **sebelum** babak 1 dimulai, supaya jelas ini
prosedur tertulis, bukan improvisasi.

---

## Kalau gagal di panggung

Gerbang mutu boleh menahan sesi, dan itu bukan kecelakaan — 42% attrition webcam
balita sudah terbit (Steffan dkk. 2024) dan menahan hasil adalah sistem yang
bekerja. Tapi tetap perlu ada yang ditampilkan.

**Jaring pengaman:** **Panduan & demo** → **Peragakan · Pola diproduksi** dan
**Peragakan · Menonton biasa**. Keduanya memutar sesi kamera sungguhan dari
kontrol positif dan menghasilkan laporan lengkap dengan angka nyata. Buka
keduanya sekali sebelum acara supaya asetnya sudah di cache.

Kalau babak 1 ditahan, ulangi sekali. Kalau ditahan lagi, putar rekamannya dan
sebutkan apa yang barusan terjadi: gerbang mutunya menahan sesi. Itu jawaban yang
lebih kuat daripada demo yang mulus, karena alat yang tidak pernah menahan apa pun
adalah alat yang menerima apa pun.

---

## Yang harus disebut

- **Ini prototipe.** Bukan alat diagnosis, dan belum divalidasi pada balita.
- **Ambang 69% sedang diterapkan pada klip yang lebih pendek daripada protokol
  terbitnya.** Di lapangan ambang itu ditahan, dan laporannya mengatakan itu di
  banner, di judul, dan di kertas cetaknya.
- **7,9% itu peluang pasca-tes, bukan probabilitas ASD anak ini.** Ia datang dari
  rasio kemungkinan 8,5 milik GeoPref dipasang pada prevalensi 1%, dan ia
  membenarkan "periksa lebih lanjut" persis sebanyak ia membantah "ini
  diagnosis". Rancangannya di [`model_rujukan.md`](model_rujukan.md).
- **Tabel 4/6 dan 0/9 adalah mode demonstrasi**, dan itu harus disebut setiap
  kali tabelnya ditampilkan.
- **Hasil yang tidak memicu rekomendasi bukan tanda aman.** Sensitivitas GeoPref
  17%: tes ini melewatkan sebagian besar anak ASD, dan laporannya mengatakan itu
  di setiap sesi yang tidak memicu apa-apa.
