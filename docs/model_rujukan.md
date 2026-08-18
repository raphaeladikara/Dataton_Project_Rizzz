# Model rujukan: dari aturan pencacahan menjadi keputusan berkalibrasi

Lapis C di README bertuliskan "Not built. Weights need labelled toddlers". Balita
berlabel tidak akan ada, dan alasannya bukan teknis —
[`etika_perekaman.md`](etika_perekaman.md) menjelaskannya. Catatan ini menjelaskan apa
yang menggantikannya.

Yang menggantikannya bukan satu model, melainkan dua lapis yang menyelesaikan dua
masalah berbeda:

| Lapis | Menyelesaikan | Butuh data baru? |
|---|---|---|
| **Kalibrasi likelihood-ratio** | `REFERRAL_DEVIANT_THRESHOLD = 2` tidak punya sumber | Tidak |
| **Bobot dari data terbit** | Bobot antar sinyal tidak pernah dipasang pada anak berlabel | Tidak — data sudah terbit |

Keduanya berdiri sendiri. Kalau lapis kedua gagal audit, lapis pertama tetap jalan dan
tetap menghapus satu-satunya angka karangan di sistem.

---

## Kenapa aturan pencacahan sekarang tidak cukup

`buildReferralRecommendation` mencacah: berapa sinyal berstatus `menyimpang`, apakah
mencapai dua. Tiga hal salah dengannya, dan tidak satu pun soal implementasi.

**Angka dua tidak punya artefak.** Setiap bilangan lain di sistem ini bisa ditelusuri
ke berkas. Yang ini tidak, dan tipenya sendiri mengakuinya:
`design_choice_not_validated_cutoff`.

**Ketiga sinyal dihitung sama berat.** Preferensi geometrik membawa spesifisitas 98%.
Respons nama tidak membawa apa pun sekuat itu. Menjumlahkannya satu-satu menyatakan
keduanya sama informatifnya, dan itu pernyataan yang tidak ada dasarnya.

**`tidak_dapat_dinilai` ditangani dengan canggung.** Sinyal yang tidak terukur
memaksa `assessableCount` turun, lalu ambang yang sama diterapkan pada penyebut yang
berbeda. Dua dari dua bukan hal yang sama dengan dua dari tiga, tetapi aturannya
memperlakukannya begitu.

---

## Lapis 1 — kalibrasi likelihood-ratio

Ganti pencacahan dengan penjumlahan log-likelihood-ratio. Tiap sinyal menyumbang LR
yang diturunkan dari sensitivitas dan spesifisitas **terbit**, bukan dari data kami.

```
odds_pasca = odds_pra × Π LR(sinyal_i)
```

`odds_pra` datang dari prevalensi, atau — lebih tepat untuk lapangan — dari hasil
SDIDTK/M-CHAT yang memang sudah ada di tangan petugas ketika sesi dijalankan.

### Nilai yang sudah pasti

| Sinyal | Sumber | Sens | Spec | LR+ | LR− |
|---|---|---:|---:|---:|---:|
| Preferensi geometrik | Wen dkk. 2022, n=1.863, 12–48 bln | 0,17 | 0,98 | **8,50** | **0,85** |

### Aturan untuk sinyal yang belum punya titik operasi

Mengikuti isyarat dan respons nama belum punya sens/spec terbit yang dapat langsung
dipakai. Aturannya keras, dan ini yang menjaga lapis ini tetap jujur:

> Sinyal tanpa titik operasi terbit mendapat **LR = 1**. Ia tidak menyumbang apa pun ke
> keputusan sampai angkanya diekstrak dari makalah dan dicatat dengan kutipannya.

LR = 1 berarti sinyal itu tetap tampil di laporan sebagai deskriptif, tetapi tidak
menggerakkan odds. Ini juga menyelesaikan masalah `tidak_dapat_dinilai` dengan rapi:
sinyal yang tidak terukur juga ber-LR = 1, jadi tidak ada penyebut yang perlu diutak-atik.

Pekerjaan ekstraksinya:

- [ ] Billeci dkk. 2019 — apakah paradigma RJA melaporkan sens/spec atau hanya
      perbedaan kelompok? Kalau hanya perbedaan kelompok, LR tetap 1.
- [ ] Nadig dkk. 2007 dan Perochon dkk. 2023 — titik operasi respons-nama tingkat
      indeks tunggal, bukan performa model gabungan.

Kalau keduanya berakhir LR = 1, lapis ini tetap merupakan perbaikan: keputusannya jadi
bersandar hanya pada satu-satunya sinyal yang benar-benar punya titik operasi, dan itu
lebih jujur daripada mencacah tiga sinyal seolah setara.

### Yang dihasilkan, dan kenapa angkanya rendah hati

Pada prevalensi 1% dengan hanya GeoPref yang menyumbang:

| | |
|---|---:|
| Probabilitas pra-tes | 1,0% |
| Odds pra-tes | 0,0101 |
| × LR+ 8,50 | 0,0859 |
| **Probabilitas pasca-tes** | **7,9%** |

Tujuh koma sembilan persen. Itu angka yang membenarkan kalimat "disarankan pemeriksaan
lanjutan" dan sekaligus membantah "ini diagnosis" — dalam satu bilangan yang bisa
dicetak di laporan dan dipertahankan kalau ditanya.

Ambang rujukannya lalu ditetapkan bukan dari performa, melainkan dari **kapasitas
rujukan Puskesmas setempat**, dan dinyatakan sebagai keputusan kebijakan. Itu jenis
angka karangan yang boleh: karangan yang mengaku sebagai kebijakan, bukan karangan yang
menyamar sebagai temuan.

### Batas yang harus ikut ditulis

- **Independensi bersyarat itu salah.** Ketiga sinyal berkorelasi pada anak yang sama.
  Perkalian LR karena itu melebih-lebihkan keyakinan. Analisis sensitivitas dengan
  faktor peredam pada suku kedua dan ketiga wajib dilaporkan berdampingan.
- **LR-nya berpindah populasi.** Wen dkk. mengukur pada GeoPref 62,22 detik dengan
  eye-tracker. NeuroGaze berjalan pada cuplikan 16,75 detik dengan kamera tablet.
  Selama `validatedProtocol` bernilai salah, GeoPref pun ber-LR = 1 dan lapis ini tidak
  menghasilkan apa-apa. Itu perilaku yang benar, dan itu berarti Kunci 1 di
  [`jalur_rujukan.md`](jalur_rujukan.md) tetap kunci.

---

## Lapis 2 — bobot dari data yang sudah diterbitkan

Perochon dkk. memasang bobot pada 475 balita berlabel dan bobot itu tidak dapat
direkonstruksi dari AUC yang mereka laporkan. Itu alasan yang tertulis di komentar
`referralRecommendation.ts`, dan alasan itu benar.

Jalan keluarnya bukan menebak bobot dan bukan merekam anak. Jalan keluarnya adalah
memasang bobot pada anak berlabel yang datanya sudah terbit.

### Datasetnya

| | |
|---|---|
| Judul | Eye-Tracking Dataset to Support the Research on Autism Spectrum Disorder |
| Penulis | Cilia, Carette, Elbattah, Guérin, Dequen |
| DOI | `10.6084/m9.figshare.20113592.v1` |
| Terbit | 22 Juni 2022 |
| Lisensi | **CC BY 4.0** |
| Ukuran | ~139 MB (satu zip) |
| Partisipan | 59 anak, usia 3–12 tahun; 29 ASD / 30 TD |
| Perekam | SMI Red-M, 60 Hz |
| Isi | 25 berkas CSV koordinat mentah (~2,17 juta baris) + `Participants.csv` berisi ID, gender, usia, skor CARS |
| Stimulus | Gambar statis (balon, tokoh kartun) dan **video dinamis**, termasuk blok joint-attention dengan tokoh manusia yang mengarahkan perhatian |

Ini sumber yang sama dengan 547 PNG di `data/autism eye tracking dataset/`. PNG itu
adalah render dari CSV ini.

> **Seluruh baris di tabel ini berasal dari deskripsi dataset dan harus diverifikasi
> terhadap berkas sungguhan saat diunduh.** Kalau jumlah partisipan, laju cuplik, atau
> keberadaan blok joint-attention ternyata berbeda, yang diperbaiki adalah tabel ini,
> bukan analisisnya.

### Koreksi terhadap klaim lama

[`model_dikarantina.md`](model_dikarantina.md) sebelumnya menyatakan deret waktu
aslinya "tidak ada" dan karena itu pelatihan ulang pada representasi 30 Hz mustahil.
Yang tidak ada adalah di folder kami. Deret waktunya terbit, terbuka, dan berlisensi
permisif. Klaim itu sudah diperbaiki di catatan tersebut.

### Langkah yang menentukan: latih di ruang indeks, bukan ruang piksel

Ini alasan percobaan sebelumnya gagal berpindah, dan alasan yang ini berbeda.

Tiga belas fitur geometri tinta dan CNN scanpath sama-sama mengkodekan **di mana
stimulus studi itu duduk di layar**. Batas keputusannya karena itu tidak berpindah, dan
`degradasi_temporal.json` menunjukkan kanal kinematiknya bergeser 69% ketika laju
cuplik dibelah.

Koordinat (x, y, t) mentah membiarkan sesuatu yang raster tidak: menghitung indeks
**perilaku** yang mengacu ke stimulus, bukan ke layar.

| Indeks NeuroGaze | Padanan yang dapat dihitung dari Cilia |
|---|---|
| Mengikuti isyarat | Blok joint-attention: tatap pasca-isyarat vs pra-isyarat, dalam-subjek |
| Preferensi sosial/non-sosial | Video dinamis: proporsi waktu pada AOI sosial vs non-sosial |
| Dispersi tatapan | Sebaran fiksasi yang dinormalisasi dalam-subjek |
| Respons nama | **Tidak ada padanan.** Protokol Cilia tidak memanggil nama |

Lalu pasang regresi logistik kecil — tiga sampai lima indeks, `GroupKFold` per
`participant_id`. Keluarannya adalah **bobot relatif antar indeks**, dan bobot itulah
yang dipindahkan ke NeuroGaze. Bukan titik operasinya, bukan interceptnya, bukan
probabilitasnya.

Respons nama tidak punya padanan, jadi bobotnya tidak dapat dipasang dari sini dan
tetap mengandalkan Lapis 1. Itu dicatat, bukan ditambal.

### Pernyataan lingkup yang wajib ikut

> Bobot dipasang pada 59 anak usia 3–12 tahun dengan eye-tracker lab 60 Hz. NeuroGaze
> berjalan pada anak 12–48 bulan dengan kamera tablet ~30 Hz. Yang dipindahkan adalah
> bobot relatif antar indeks; titik operasinya tidak dipindahkan dan tetap tidak
> diketahui sampai Gate C.

Kalimat itu muncul di laporan, di paper, dan di slide. Kalau ia tidak muat, yang
dipotong adalah hal lain.

---

## Audit yang wajib, dan yang membatalkan lapis 2

Repositori ini sudah punya kebiasaannya. Ketiganya memakai pola yang sama seperti
audit dataset wajah dan audit kebocoran split.

**1. Desimasi 60 → 30 Hz, pasang ulang, bandingkan bobot.**
Kalau ada bobot yang berbalik tanda atau berubah lebih dari faktor dua pada 30 Hz,
transfernya gagal dan yang diterbitkan adalah kegagalannya. Ini juga menutup lubang
yang ditinggalkan `degradasi.json`, yang menyatakan sendiri bahwa penghapusan piksel
hanyalah proksi.

**2. Alas shortcut tingkat sesi.**
Regresi logistik yang hanya diberi gangguan tingkat sesi — durasi rekaman, jumlah
sampel valid, dropout, galat kalibrasi — tanpa satu pun fitur perilaku. Kalau AUC-nya
mendekati AUC model indeks, yang terukur adalah perbedaan pengumpulan data antar
kelas, persis seperti alas 0,7515 pada dataset wajah. Lapis 2 dibatalkan.

**3. Kebocoran partisipan.**
`participant_id` ada, jadi audit ini mungkin — tidak seperti pada dataset wajah.
`GroupKFold` per partisipan, dan tabel kebocoran diterbitkan seperti
`audit_kebocoran_split.csv`.

**4. Penjaga OOD dua arah.**
Vektor indeks dari sesi NeuroGaze harus mendarat di dalam sebaran indeks Cilia. Kalau
tidak, hasilnya ditahan dan penjaga menyebut fitur yang menyimpang, sama seperti
perilaku yang sudah ada pada lintasan Lissajous.

### Kriteria menolak

Lapis 2 **tidak dipromosikan** kalau salah satu terjadi:

- bobot berbalik tanda pada desimasi 30 Hz;
- alas shortcut mencapai dalam 0,05 AUC dari model indeks;
- selang kepercayaan bobot mana pun melewati nol pada `GroupKFold` per partisipan;
- indeks joint-attention tidak dapat direkonstruksi dari CSV karena penanda bloknya
  tidak ada.

Kalau ditolak, Lapis 1 tetap dikirim sendirian, dan penolakannya diterbitkan sebagai
hasil. Dengan n=59 dan usia yang salah, penolakan adalah hasil yang cukup mungkin —
dan makalah-makalah pada dataset ini melaporkan AUC mencurigakan tinggi persis ketika
mereka tidak mengelompokkan per partisipan.

---

## Yang tetap tidak diklaim

- Bukan diagnosis, dan tidak pernah menjadi diagnosis.
- Bukan sensitivitas maupun spesifisitas pada balita Indonesia. Itu tetap Gate C.
- `combinedScore` tetap `null`. Probabilitas pasca-tes adalah keluaran Lapis 1 yang
  membawa turunannya sendiri; ia bukan skor gabungan berbobot dari seluruh indeks, dan
  Lapis A tetap dilaporkan terpisah tanpa pernah dilebur.
- Hasil yang tidak memicu rekomendasi tetap bukan tanda aman.

---

## Urutan pengerjaan

| # | Pekerjaan | Prasyarat | Keluaran |
|---|---|---|---|
| 1 | Cabut kekeliruan absence-of-evidence pada `cueSignal` | — | Uji yang mengunci tiga keadaan |
| 2 | Jalankan kontrol positif, 8–10 dewasa | Langkah 1 | Tabel dua baris + dua rekaman terdaftar |
| 3 | Ekstrak LR dari makalah, pasang Lapis 1 | — | `referral_lr.json` dengan kutipan per baris |
| 4 | Unduh Cilia, verifikasi tabel dataset | — | Manifest + SHA-256 |
| 5 | Bangun indeks, jalankan empat audit | Langkah 4 | Empat berkas hasil audit |
| 6 | Pasang bobot, atau terbitkan penolakannya | Langkah 5 lolos | `model_rujukan.json` |
| 7 | Lengan komposit di `prospective_evaluation.py` | Langkah 3 | Titik impas kapasitas rujukan |
| 8 | Promosikan lajur komposit jadi lajur rujukan | Langkah 2 lolos kriteria | `emitsReferral` lewat lajur kedua |

Langkah 1–3 tidak menunggu apa pun dan tidak butuh unduhan. Langkah 4–6 bergantung pada
satu berkas 139 MB. Langkah 8 bergantung pada kontrol positif, bukan pada model —
instrumen yang tidak merespons tidak pantas mengeluarkan rujukan seberapa pun rapi
kalibrasinya.

---

## Sumber

| Klaim | Sumber |
|---|---|
| GeoPref sens 0,17 / spec 0,98, n=1.863, 12–48 bulan | Wen dkk. 2022, *Scientific Reports* 12:4253 |
| Target Gate C sens 0,878 / spec 0,808 | Perochon dkk. 2023, *Nature Medicine* |
| Dataset eye-tracking ASD terbuka, CC BY 4.0 | Cilia dkk. 2022, `10.6084/m9.figshare.20113592.v1` |
| Fitur kinematik bergeser 69% saat laju dibelah | `research/hasil/degradasi_temporal.json` |
| Alas shortcut dataset wajah 0,7515 | `research/hasil/audit_wajah.json` |
| Attrition webcam balita 42% | Steffan dkk. 2024, *Infancy*, N=125 |
