# Pitch kompetisi 10–12 menit

Ini naskah aktif. Jalankan satu sesi kamera langsung pada orang dewasa yang
memproduksi pola. Jangan memendekkan bagian sebelum dan sesudah demo; dua kalimat itu
yang mencegah hasil peragaan dibaca sebagai penilaian kesehatan.

## Urutan dan waktu

| Waktu | Bagian | Yang terlihat |
|---|---|---|
| 0:00–1:00 | Keterlambatan lintas negara dan celah Indonesia | sumber masalah, bukan angka produk |
| 1:00–2:00 | Yang bekerja hari ini | kamera, kalibrasi, gerbang mutu, laporan |
| 2:00–3:00 | Layar perbandingan dua kondisi | `/perbandingan` — satu klik dari beranda |
| 3:00–4:30 | Satu sesi kamera langsung, penyaji sebagai peserta | `Panduan & demo` → `Peragakan · kamera langsung` |
| 4:30–5:00 | Interpretasi dan batas demo | banner demo dan laporan |
| 5:00–5:30 | Bukti lapangan: 123 sesi, 3 perangkat, 6 kondisi | slide foto dokumentasi |
| 5:30–6:40 | Empat bagian AI | pengukuran, seleksi, robustness, tata kelola |
| 6:40–7:30 | Tangga bukti dan kesiapan | `readiness_matrix.md` |
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

## 3a. Layar perbandingan — jalankan ini lebih dulu

Buka `/perbandingan` (tombol **Bandingkan dua kondisi** di bagian bukti beranda). Satu
klik, tanpa kamera, tanpa risiko gerbang mutu.

> **Keberatan yang paling wajar terhadap alat seperti ini: bagaimana kalau ia cuma
> merujuk semua orang? Alat yang selalu bilang "periksa lebih lanjut" akan lolos demo
> mana pun tanpa mengukur apa pun. Jadi ini bukan satu sesi yang berhasil — ini dua
> kondisi dari 15 sesi yang lulus mutu, berdampingan. Aturan menyala pada 0 dari 9 sesi
> menonton biasa dan 4 dari 6 sesi pola diproduksi. Pesertanya orang dewasa yang
> mengikuti naskah, jadi tidak ada sensitivitas, spesifisitas, atau pernyataan apa pun
> tentang autisme di layar ini.**

Tunjuk kolom **jarak terdekat**, bukan AUC. Sebut sendiri bahwa separuh sesi pola
diproduksi gugur di gerbang mutu dan penyebutnya tercetak apa adanya.

Mengucapkan keberatannya sendiri sebelum juri memikirkannya adalah gerakan berbiaya nol
dengan imbalan terbesar di seluruh pitch.

## 3b. Demo langsung: kontrol positif dewasa

**Penyaji yang menjadi peserta, bukan relawan dari kursi juri.** Meminta orang maju tanpa
briefing di dalam jam berwaktu adalah taruhan besar berhadiah kecil: kalau tidak ada yang
maju ada jeda mati, dan kalau yang maju bergerak berlebihan gerbang mutu menahan sesinya —
6 dari 12 sesi pola diproduksi memang gugur di sana, dan itu ada di data sendiri.

Relawan tetap ditawarkan, sesudah pitch:

> **Tabletnya ada di sini setelah sesi ini. Siapa pun yang mau menguji sendiri apakah alat
> ini merujuk semua orang, silakan coba.**

Selama 67 detik berjalan, **jangan diam** — cermin panggung hidup di mode ini dan
menampilkan bagian yang sedang diukur, apakah arah pandangan terbaca, dan status isyarat.
Narasikan itu. Kalimat yang paling berguna muncul ketika sampel ditolak:

> Wajahnya terlihat, tapi arah pandangan belum cukup jelas. Sampel detik ini ditolak,
> bukan ditebak. Itu seluruh produk ini dalam satu detik.

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

## 3c. Bukti lapangan — sebutkan, jangan lewatkan

Bagian ini sebelumnya tidak ada di naskah mana pun, padahal angkanya sudah lama tersedia.

> Yang baru saja Anda lihat bukan simulasi, dan bukan satu sesi yang kebetulan berhasil.
> Rantai ini sudah dijalankan **123 kali ujung-ke-ujung** — 100 sesi Gate A dan 23 sesi
> kontrol positif — pada **37 orang dewasa** yang menyetujui, oleh **tiga operator**, di
> **tiga tablet Android kelas menengah**: Galaxy Tab A8, Lenovo Tab M10, Redmi Note 13.
> Dan bukan di satu kondisi ideal: **enam kondisi lingkungan**, cahaya redup, normal, dan
> campuran, dengan dan tanpa kacamata.

Lalu batasnya, di kalimat yang sama dan sebelum ditanya:

> Yang diuji di situ alat ukurnya, bukan kadernya. Operatornya tim kami dan lokasinya
> bukan Posyandu. Keterpakaian oleh kader adalah baris terpisah di matriks kesiapan kami,
> dan baris itu masih kosong.

**Jangan pernah menyebut ini "uji kader".** Pertanyaan pertama yang datang adalah berapa
kader dan dari Posyandu mana, dan jawabannya nol.

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
>
> Dan penjaga itu bukan penolakan yang dipasang tetap — kami menjalankannya dua arah. Pada
> 547 vektor domain sumber ia menerima 544; pada 23 sesi kontrol positif di atas stimulus
> yang dikirim ia menerima 1. Referensinya dikalibrasi di persentil 99,5 sehingga angka
> pertama adalah pemeriksaan kewarasan, bukan uji generalisasi — kami menyebutnya sendiri.
> Yang menjadi buktinya adalah kontrasnya, dan bahwa Python menghitung ulang seluruh 23
> keputusan peramban itu dan mendapat verdict yang sama.

### Bobot dari data anak yang sudah terbit — dan audit yang menolaknya

Ini bagian AI terkuat yang baru, dan ia berbentuk hasil negatif.

> Untuk memasang bobot antar indeks kami tidak butuh merekam balita: data anak berlabel
> sudah terbit. Kami unduh Cilia dkk. 2022 — CC BY 4.0, 59 anak, 2,25 juta baris koordinat
> — lalu hitung indeks di ruang perilaku, bukan ruang piksel. Empat audit ditulis sebelum
> fitting dijalankan, lengkap dengan kriteria penolakannya. Dua gagal.
>
> Yang menentukan: alas yang tidak memuat satu pun fitur perilaku — jumlah sampel, rasio
> pelacakan, fraksi kedip, fraksi fiksasi — mencapai AUC 0,905, sementara model indeks
> perilaku kami hanya 0,784. Prediktor tunggal terkuat di dataset itu adalah **seberapa
> baik alatnya merekam anaknya**, bukan apa yang ditatap anaknya. Mengikuti isyarat arah
> berada di 0,504, yaitu kebetulan. Anak ASD terbaca 13 percobaan, anak TD 20.
>
> Jadi bobotnya tidak dipromosikan dan penolakannya kami terbitkan. Konsekuensinya lebih
> luas dari proyek kami: setiap klasifikator pada dataset ini yang tidak menjalankan alas
> semacam ini berisiko melaporkan performa yang sebagian bersumber dari perbedaan
> pengumpulan data antar kelompok.

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

### Kapasitas rujukan — argumen dampak yang paling kuat, dan sekarang punya jangkar

> Alat skrining gagal di layanan primer bukan karena melewatkan kasus. Ia gagal karena
> membanjiri kapasitas rujukan yang ada. Kami menanyakan itu ke seorang guru SLB di Jambi:
> kalau anak yang disarankan diperiksa lanjut jadi tiga kali lebih banyak, sanggup?
> Jawabannya tidak — tenaga dan jadwal yang tersedia mungkin kewalahan, dan keluarga sudah
> menunggu beberapa minggu sampai beberapa bulan untuk layanan tertentu.
>
> Titik kerja yang kami kirim menghasilkan beban rujukan paling rendah di antara seluruh
> lengan. Baris yang paling menggoda dipamerkan — sensitivitas 92 persen — menghasilkan
> **38,3 kali** beban itu. Tiga kali saja sudah dinilai sulit. Kami memilih baris yang
> paling sedikit menemukan karena itu satu-satunya yang muat.

Batasnya disebut di kalimat yang sama: satu wawancara bukan pengukuran kapasitas,
narasumbernya tidak melihat tabel itu, dan kesimpulan tentang titik kerja tetap milik kami.

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

### “Kalau bobot Cilia ditolak, berarti bagian AI kalian gagal dong?”

> Yang gagal adalah hipotesisnya, dan itu memang tugas audit. Yang berhasil adalah
> auditnya: kriteria penolakannya ditulis sebelum fitting dijalankan, jadi hasilnya tidak
> dipilih setelah melihat angkanya. Dan audit itu menemukan sesuatu yang berlaku di luar
> proyek kami — pada dataset itu, rasio pelacakan alat lebih memprediksi label daripada
> perilaku anaknya. Kami lebih memilih menerbitkan itu daripada mengirim bobot yang
> sebagian mempelajari cara datanya dikumpulkan.

### “544 dari 547 diterima itu kan hampir pasti tinggi?”

> Betul, dan kami menyebutnya sendiri di slide: referensinya dikalibrasi pada persentil
> 99,5 dari kohort itu, jadi tingkat penerimaan di sana adalah pemeriksaan kewarasan,
> bukan uji generalisasi. Yang menjadi bukti adalah kontrasnya dengan 1 dari 23 pada
> stimulus yang dikirim, plus fakta bahwa penolakannya menyebut fitur tata letak — persis
> alasan yang kami nyatakan di muka.

### “Satu wawancara kan bukan bukti?”

> Bukan, dan kami tidak memakainya sebagai bukti. Tidak ada satu angka pun di makalah atau
> di deck yang digeser oleh wawancara itu. Yang ia berikan adalah observasi lapangan di
> samping simulasi kapasitas rujukan kami, dan satu kekurangan produk yang tidak kami
> lihat sendiri: setelah hasil keluar, harus jelas siapa yang mendampingi orang tua.
> Bagian langkah berikutnya di laporan berubah karena itu.

### “Ambang dua sinyal itu kalian karang sendiri, kan?”

> Tidak ada yang menerbitkannya, betul, dan tipe datanya menyebut dirinya begitu. Tapi ia
> punya turunan. Aturan hanya menyala kalau kedua sinyal menyimpang, jadi laju positif
> palsunya P(A dan B), dan itu tidak pernah melebihi yang terkecil di antara keduanya.
> Preferensi geometrik membawa spesifisitas terbit 98 persen, jadi **spesifisitas lajur
> komposit sekurang-kurangnya 98 persen — batas, bukan estimasi, dan tanpa mengandaikan
> kedua sinyal saling bebas.** Turunkan ke satu, pertidaksamaannya berbalik dan
> spesifisitasnya paling banter 98 persen. Dua adalah satu-satunya nilai yang tidak dapat
> memperburuk titik operasi yang divalidasi orang lain.

### “Kenapa tidak pakai posterior odds saja sebagai pemutus?”

> Karena dengan dua sinyal yang kami kirim, mengikuti isyarat selalu ber-LR 1 — paradigmanya
> melaporkan perbedaan antar kelompok, bukan sensitivitas dan spesifisitas. Jadi posteriornya
> cuma punya tiga nilai, dan ketiganya ditentukan GeoPref sendirian. Ambang apa pun di
> atasnya secara aritmetika sama dengan "GeoPref menyimpang" — aturan satu sinyal, yang
> justru dilarang kode kami sendiri. Posteriornya tetap dihitung dan tercetak sebagai
> alasan; yang memutuskan tetap aturan dua sinyal.

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
