# Pitch kompetisi 10–12 menit

Ini naskah aktif. Jalankan satu sesi kamera langsung pada orang dewasa yang
memproduksi pola. Jangan memendekkan bagian sebelum dan sesudah demo; dua kalimat itu
yang mencegah hasil peragaan dibaca sebagai penilaian kesehatan.

## Urutan dan waktu

| Waktu | Bagian | Yang terlihat |
|---|---|---|
| 0:00–1:00 | Keterlambatan lintas negara dan celah Indonesia | sumber masalah, bukan angka produk |
| 1:00–2:00 | Yang bekerja hari ini | kamera, kalibrasi, gerbang mutu, laporan |
| 2:00–4:00 | Kontrol positif dewasa langsung | `Panduan & demo` → `Peragakan · kamera langsung` |
| 4:00–4:40 | Interpretasi dan batas demo | banner demo dan laporan |
| 4:40–6:20 | Empat bagian AI | pengukuran, seleksi, robustness, tata kelola |
| 6:20–7:30 | Tangga bukti dan kesiapan | `readiness_matrix.md` |
| 7:30–9:00 | Dampak bersyarat | skenario biaya dan biaya operasi yang belum diukur |
| 9:00–10:30 | Roadmap dan permintaan mitra | protokol etik/klinis prospektif |
| 10:30–12:00 | Cadangan | tanya jawab atau pemulihan demo |

## 1. Masalah: pisahkan fakta internasional dari konteks Indonesia

> Tinjauan lintas negara melaporkan diagnosis autisme rata-rata sekitar usia 56 bulan,
> kira-kira 32 bulan setelah kekhawatiran pertama orang tua. Itu angka internasional,
> bukan estimasi Indonesia.
>
> Celah yang kami lihat di Indonesia lebih mendasar: layanan primer belum memiliki
> ukuran tatapan berbasis kamera yang sudah divalidasi pada balita Indonesia dan dapat
> dijalankan di alur Posyandu. NeuroGaze sedang membangun serta menguji rantai ukurnya;
> kami belum mengklaim skrining klinis.

Jangan mengatakan “diagnosis Indonesia rata-rata 56 bulan”.

## 2. Yang bekerja hari ini

> Hari ini aplikasi memproses kamera di tablet, mengkalibrasi pandangan, memeriksa mutu,
> menghitung indeks terpisah, menolak model yang berada di luar distribusi, dan membuat
> laporan yang bisa diaudit. Baterai pengukurannya 67 detik; izin, penyiapan, dan
> kalibrasi menambah waktu kunjungan.
>
> Klip lapangan yang kami kirim hanya 16,75 detik. Titik operasi GeoPref 69 persen
> diterbitkan pada protokol penuh 60–90 detik, jadi aplikasi menahan rujukan otomatis
> balita. Satu-satunya tempat aturan itu terlihat adalah mode demonstrasi dewasa, dan
> `emitsReferral` tetap `false`.

## 3. Demo langsung: kontrol positif dewasa

### Sebelum menekan mulai — ucapkan persis

> **Ini kontrol positif pada orang dewasa yang mengikuti instruksi. Saya akan sengaja
> memproduksi pola yang dicari alat. Hasilnya hanya menunjukkan apakah rantai ukur dan
> aturan peragaan merespons; hasil ini bukan penilaian autisme, bukan status klinis
> saya, dan tidak mengeluarkan rujukan.**

Buka **Panduan & demo**, pilih **Peragakan · kamera langsung**, lalu tunjukkan banner
demonstrasi. Operator membacakan instruksi kondisi “pola diproduksi”. Peserta menjaga
kepala stabil, memandang panel geometrik pada blok video, kembali ke tengah pada blok
vektor, dan tidak mengikuti isyarat arah.

Jangan memilih **Mulai observasi kamera**. Tombol itu adalah lajur
`target_population_research`; perbandingan 69% ditahan di sana dan aturan tidak dapat
menyala.

### Saat laporan muncul

Tunjuk tulisan **“Disarankan pemeriksaan lanjutan · 2 dari 2 sinyal menyimpang”** sebagai
bentuk pola rujukan yang diperagakan. Lalu tunjuk banner demo dan status
`emitsReferral: false` pada log audit.

### Sesudah hasil — ucapkan persis

> **Yang menyala adalah simulasi pola rujukan, bukan rujukan dan bukan hasil kesehatan
> peserta. Bukti kontrol positif lengkap kami mencakup 12 orang dewasa: 23 sesi
> direkam, 15 lulus mutu; 9 dari 11 sesi menonton biasa dan 6 dari 12 sesi pola
> diproduksi dapat dipakai. Aturan demo menyala pada 0 dari 9 sesi biasa dan 4 dari 6
> sesi pola diproduksi. Ini manipulation check end-to-end, bukan sensitivitas,
> spesifisitas, atau ASD.**

Kalau ada waktu, putar rekaman terdaftar kondisi menonton biasa. Jangan mengandalkan
peserta acak sebagai kontrol negatif: dari delapan percobaan, kurang dari tujuh respons
berhasil tidak mencapai p < 0,05 dan akan dibaca “tidak dapat dinilai”, bukan normal.

## 4. Empat bagian AI

### Pengukuran

> Model pandangan berjalan di perangkat. Parity Python–browser, gerbang kualitas, dan
> audit log menjaga agar angka dapat ditelusuri ke sampel yang menghasilkannya. Video
> mentah dan landmark wajah tidak diunggah atau disimpan.

### Pemilihan model dan bukti

> Kami membandingkan CNN dan regresi logistik pada data Carette dengan pemisahan per
> partisipan. Dataset itu hanya bukti konsep domain sumber: 54 anak usia sekolah di
> Prancis, eye-tracker 250 Hz, dan tidak ada uji eksternal. CNN tidak memberi kenaikan
> AUC yang dapat dibedakan dari nol, sementara kontrak masukannya tidak dapat dipenuhi
> kamera 30 fps. Karena itu model tersebut tidak dipakai untuk keputusan.

### Robustness temporal

> Pada 27 sesi Gate B, desimasi dari sekitar 26 ke 13 Hz menghasilkan median drift
> relatif 69,4 persen pada fitur kinematik dan 1,6 persen pada fitur geometri. Ini bukan
> kemenangan akurasi klasifikasi. Hasil ini memilih keluarga fitur yang lebih stabil;
> beberapa fitur geometri tetap punya pelestarian peringkat lemah atau drift besar
> ketika laju turun lebih jauh.

### Tata kelola dan penolakan

> Regresi Carette tetap dijalankan hanya untuk panel riset. Penjaga OOD menolak
> keluarannya pada sesi sekarang karena domain stimulus, usia, dan frekuensi akuisisinya
> tidak berpindah. `combinedScore` tetap `null`; indeks lapis B tidak digabung. Untuk
> lajur lapangan, protokol pendek juga menahan titik operasi 69 persen. Menolak angka
> yang belum layak dibaca adalah keluaran sistem, bukan error.

## 5. Tangga bukti dan matriks kesiapan

Tampilkan [`readiness_matrix.md`](readiness_matrix.md).

> Rantai ukur di perangkat siap untuk demonstrasi rekayasa. Respons instrumen sudah
> ditunjukkan pada orang dewasa. Rujukan otomatis balita ditahan. Keterpakaian kader dan
> validitas pada balita Indonesia belum diuji.
>
> Gate A memiliki 100 sesi berulang dari 25 orang dewasa; 94 lulus mutu. Angka 2,36
> derajat adalah konversi sudut lama tanpa jarak pandang per sesi, bukan akurasi absolut
> eksak. Gate B membandingkan 30 aliran simultan dengan implementasi referensi
> WebGazer.js; 27 siap dan 3 ditahan. WebGazer bukan ground truth, target diketahui
> head-to-head belum direkam, dan keterbatasan ICC fitur tetap dipublikasikan.

Jangan membuka bagian bukti dengan agreement AOI 0,997118. Kotak AOI jauh lebih lebar
daripada galat antar-aliran, sehingga angka itu hampir pasti tinggi.

## 6. Dampak dan ekonomi distribusi — selalu bersyarat

> PWA statis membuat biaya distribusi perangkat lunak mendekati nol: Posyandu berikutnya
> memuat berkas yang sama dan tidak membutuhkan lisensi per kursi. Operasinya tidak
> gratis. Kader tetap membutuhkan waktu, pelatihan, dukungan, cetak laporan, dudukan,
> pengulangan sesi, pemeliharaan, penggantian tablet, dan layanan klinis sesudah hasil.
>
> Angka biaya per sesi dan per kasus di dokumen kami adalah skenario perencanaan. Ia
> hanya relevan bila protokol penuh diperoleh, titik operasi terbit direplikasi pada
> populasi sasaran, penyelesaian sesi memadai, dan jalur klinis menerima tindak lanjut.
> NeuroGaze belum mengamati biaya per kasus dan belum mengukur performa skrining balita.

Nilai hari ini bukan “kasus ditemukan”, melainkan pengurangan biaya rekayasa menuju
studi prospektif: pipeline, refusal state, dan audit trail sudah dapat dibawa ke mitra
tanpa dibangun ulang.

## 7. Roadmap berizin etik dan permintaan mitra

> Langkah berikutnya bukan satu tanda tangan. Kami membutuhkan mitra klinis dan riset
> yang mampu menjadi penanggung jawab kaji etik, menyusun izin orang tua yang benar,
> menyediakan acuan klinis buta terhadap keluaran aplikasi, menghubungkan
> data tanpa membuka identitas anak, merekrut secara adil, menganalisis fairness dan
> pola kegagalan, lalu menjalankan validasi prospektif sebelum memilih titik operasi.
>
> Permintaan kami konkret: satu Puskesmas atau rumah sakit pendidikan, satu tim etik/
> penelitian, dan satu koordinator Posyandu untuk bersama-sama menyusun protokol Gate C
> dan uji keterpakaian kader. Kami membawa aplikasi terinstrumentasi dan protokol
> analisis; mitra membawa perlindungan peserta, acuan klinis, serta jalur layanan yang
> membuat hasil dapat dinilai secara sah.

Merekam anak bukan tindakan yang dengan sendirinya tidak etis. Yang belum ada adalah
kaji etik, izin yang valid, acuan independen, dan tata kelola data yang membuat
penggunaan rekaman untuk keputusan proxy dapat dipertanggungjawabkan.

## Tanya jawab juri

### “Jadi alat ini sudah merujuk balita?”

> Belum. Klip lapangan 16,75 detik tidak mereplikasi protokol penuh tempat ambang 69
> persen diterbitkan, jadi rujukan otomatis ditahan. Mode panggung hanya memperagakan
> bentuk aturan pada orang dewasa dan `emitsReferral` tetap `false`.

### “Empat dari enam bukan sensitivitas 67 persen?”

> Bukan. Enam sesi itu berasal dari orang dewasa yang diminta memproduksi pola. Empat
> sesi menunjukkan rule firing dalam manipulation check; tidak ada status klinis,
> sehingga sensitivitas atau spesifisitas tidak terdefinisi.

### “Kenapa banyak sesi pola diproduksi ditahan?”

> Enam dari 12 sesi pola diproduksi lulus mutu. Gerakan sengaja membuat tatapan lebih
> mudah menempel di tepi layar; gerbang kualitas menahannya. Attrition itu bagian dari
> hasil, bukan angka yang kami buang diam-diam.

### “2,36 derajat berarti lebih akurat daripada WebGazer 4,17 derajat?”

> Tidak. Angka 2,36 derajat adalah konversi lama pada Gate A tanpa jarak pandang yang
> direkam per sesi. Angka 4,17 derajat berasal dari perangkat dan protokol lain. Gate B
> sendiri mengukur agreement perangkat lunak, bukan akurasi target head-to-head.

### “Apa nilai model Carette?”

> Bukti konsep participant-grouped bahwa pipeline fitur-ke-model dapat direproduksi
> pada domain sumber. Datanya 54 anak usia sekolah di Prancis pada 250 Hz, tanpa uji
> eksternal. Fitur tata letaknya tidak berpindah ke stimulus sekarang, maka OOD guard
> menolaknya dan model tidak pernah menentukan keputusan.

### “Mengapa tidak langsung merekam balita?”

> Karena keputusan proxy untuk anak memerlukan kaji etik dan izin orang tua yang valid,
> serta acuan klinis independen dan linkage data yang aman. Kami tidak menyebut
> perekaman anak sebagai sesuatu yang pada dasarnya salah; kami mengatakan struktur
> perlindungan dan validasinya belum tersedia.

### “Berapa biaya per kasus?”

> Belum ada biaya per kasus yang teramati. Dokumen dampak hanya mensimulasikan skenario
> bila titik operasi protokol penuh berhasil direplikasi. Operasi tetap memerlukan waktu
> kader, pelatihan, dukungan, alat bantu, pengulangan, pemeliharaan, penggantian, dan
> tindak lanjut klinis.

### “Apa yang membuktikan ini relevan untuk Indonesia?”

> Belum ada validasi Indonesia. Relevansinya saat ini adalah hipotesis implementasi:
> PWA luring dan pemrosesan lokal ditujukan pada keterbatasan jaringan serta privasi.
> Uji kader dan studi balita Indonesia harus menentukan apakah hipotesis itu benar.

## Bila demo gagal

Sebut penyebab yang terlihat, jangan menekan tombol berkali-kali. Tampilkan dua replay
terdaftar dan ringkasan kontrol positif. Ucapkan:

> Demo langsung tertahan oleh gerbang mutu. Itu hasil yang sah: sistem menolak membuat
> angka ketika inputnya tidak layak. Bukti kamera-ke-angka yang sudah direkam tetap 23
> sesi, dengan denominator mutu dan kondisi yang baru kami tunjukkan.
