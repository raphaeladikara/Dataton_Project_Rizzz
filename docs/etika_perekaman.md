# Batas perekaman: balita, anak ASD, dan kenapa batas itu tidak dinegosiasikan

Proyek ini tidak merekam balita. Proyek ini tidak merekam anak dengan ASD. Tidak satu
sesi pun — tidak untuk kontrol positif, tidak untuk melatih model, tidak untuk
tangkapan layar di slide.

Catatan ini menjelaskan kenapa, apa yang sudah dicoba, apa yang boleh dikerjakan
sebagai gantinya, dan apa yang harus ada sebelum batas ini bergeser. Ia ditulis supaya
jawabannya sama siapa pun yang ditanya — di panggung, di ruang juri, atau oleh orang
yang melanjutkan repositori ini setahun lagi.

---

## Batasnya, dalam satu paragraf

Merekam anak menuntut persetujuan orang tua, dan persetujuan orang tua yang sah
menuntut kaji etik yang menyatakan apa yang sedang diminta. Merekam anak dengan ASD
menuntut lebih dari itu: status kelompok rentan, prosedur perekrutan yang diawasi, dan
alasan yang berdiri sendiri kenapa anak itu — bukan orang dewasa — yang harus
menanggung beban penelitiannya. NeuroGaze tidak punya satu pun dari itu, dan tidak akan
mengarangnya.

---

## Kenapa ini bukan sekadar urusan administrasi

Ada godaan menganggap izin sebagai formalitas yang menghambat pekerjaan yang sebenarnya
baik. Tiga alasan berikut membuat anggapan itu keliru, dan ketiganya cukup
sendiri-sendiri.

**Balita tidak bisa memberi persetujuan, dan wali tidak menyerahkan apa pun.** Orang
dewasa yang ikut kontrol positif memutuskan untuk dirinya sendiri, mengerti apa yang
direkam, dan boleh mencabutnya. Balita tidak melakukan satu pun dari itu. Yang
menggantikan persetujuannya adalah keputusan orang lain, dan struktur yang mengawasi
keputusan orang lain itu bernama kaji etik. Melewatinya bukan mempercepat proses; itu
menghapus satu-satunya pihak yang mewakili kepentingan anaknya.

**Risiko dan manfaatnya belum seimbang.** Instrumen yang belum lulus Gate C tidak
menawarkan manfaat apa pun kepada anak yang direkam. Yang ditawarkannya kepada kami
adalah data. Merekam anak demi alat yang belum terbukti berguna bagi anak itu adalah
persis konfigurasi yang dirancang untuk dicegah kaji etik. Konfigurasi itu berubah
setelah ada bukti; ia tidak berubah karena tenggat lomba.

**Anak autistik bukan sumber data.** Proyek ini sudah melarang, di
[`kontrol_positif.md`](kontrol_positif.md), menyebut peserta "berpura-pura autis",
karena mengarikaturkan perilaku autistik merusak semua hal lain yang dibangun. Alasan
yang sama berlaku lebih keras di sini. Merekrut anak autistik untuk memvalidasi alat
yang mungkin tidak pernah sampai kepada mereka memperlakukan mereka sebagai bahan,
bukan sebagai orang yang seharusnya dilayani alat ini.

---

## Yang sudah dicoba, dan hasilnya

Lima lembaga dihubungi untuk kaji etik studi prospektif. Seluruhnya menolak.

Itu bukan kegagalan administratif dan tidak akan dibingkai begitu. Pada tahap bukti
saat ini — tanpa satu pun demonstrasi bahwa pipeline dapat membedakan dua kondisi
perilaku — penolakan adalah keputusan yang benar dari pihak mereka. Komite yang
meloloskan proposal ini hari ini akan menjalankan komite yang buruk.

Yang mengubah tahapnya adalah bukti, dan bukti itu harus datang dari pihak yang boleh
memberikannya: orang dewasa yang menyetujui untuk dirinya sendiri, dan data yang sudah
diterbitkan orang lain dengan izin yang mereka punya.

---

## Yang boleh dikerjakan

| Sumber | Boleh? | Dasarnya |
|---|---|---|
| Orang dewasa yang memproduksi pola secara sengaja | **Ya** | Persetujuan untuk diri sendiri, lisan, tercatat di lembar sesi. Protokol di [`kontrol_positif.md`](kontrol_positif.md) |
| Orang dewasa autistik yang menyetujui sendiri | **Ya, bersyarat** | Lihat bagian di bawah |
| Data eye-tracking terbit berlisensi terbuka | **Ya** | Consent sudah diambil pihak yang punya izinnya; lisensinya menyatakan penggunaan ulang |
| Balita, direkam sendiri | **Tidak** | Tidak ada kaji etik, jadi tidak ada persetujuan orang tua yang sah |
| Anak ASD, direkam sendiri | **Tidak** | Di atas, ditambah status kelompok rentan |
| Dataset wajah anak tanpa provenance | **Tidak** | Dikarantina permanen; alasannya di [`model_dikarantina.md`](model_dikarantina.md) |

### Data terbit bukan celah, melainkan jalan yang benar

Perekaman yang tidak boleh diulang oleh kami sudah dilakukan satu kali, oleh tim yang
punya izinnya, dengan orang tua yang menyetujuinya, lalu hasilnya dibagikan justru
supaya tidak perlu diulang.

Memakai data itu bukan versi lebih longgar dari etika yang dipegang catatan ini. Itu
konsekuensi langsungnya: kalau perekaman anak harus dijarangkan, maka data anak yang
sudah ada harus dipakai semaksimal mungkin. Menolaknya atas nama kehati-hatian justru
mendorong ke arah perekaman baru yang tidak perlu.

Kewajiban yang ikut, dan tidak ada yang opsional:

- **Atribusi sesuai lisensinya.** CC BY 4.0 menuntut penyebutan penulis dan DOI di
  setiap tempat hasilnya muncul, termasuk paper dan slide.
- **Tidak ada upaya identifikasi ulang**, dan tidak ada penggabungan lintas dataset
  yang dapat mempersempit identitas partisipan.
- **Data mentahnya tidak diredistribusi** dari repositori ini. Yang di-commit adalah
  skrip pengunduh dan pengolahnya, plus ringkasan hasilnya.
- **Lingkupnya dinyatakan.** Anak usia 3–12 tahun dengan eye-tracker lab bukan balita
  12–48 bulan dengan kamera tablet. Kalau ada bilangan yang dipindahkan, batas
  pemindahannya ikut dipindahkan.

Rinciannya di [`model_rujukan.md`](model_rujukan.md).

### Orang dewasa autistik: boleh, tetapi bukan sebagai pengambilan sampel

Orang dewasa autistik menyetujui untuk dirinya sendiri. Tidak ada izin orang tua, tidak
ada etika riset anak. Secara teknis ini satu-satunya jalur menuju data kasus-kontrol
berlabel pada **perangkat yang benar dan stimulus yang benar**.

Kalau jalur ini kelak dipakai, tiga syarat berlaku:

1. **Dikerjakan bersama komunitasnya**, bukan pada komunitasnya. Perekrutan lewat
   organisasi swadaya, dengan orang autistik ikut menyusun protokolnya.
2. **Hasil null disiapkan sejak awal.** Respons terhadap panggilan nama dan mengikuti
   isyarat arah melemah tajam pada usia dewasa. Kemungkinan besar tidak ada beda yang
   terukur, dan itu yang diterbitkan.
3. **Tidak diklaim sebagai validasi.** Dewasa autistik bukan proksi balita autistik.
   Yang dihasilkannya paling banter bukti bahwa indeksnya bergerak pada orang dengan
   diagnosis nyata — bukan angka skrining.

Jalur ini tidak ada di rencana yang berjalan. Ia dicatat supaya kalau kelak
dipertimbangkan, syaratnya sudah tertulis lebih dulu.

---

## Apa yang harus ada sebelum batas ini bergeser

Berurutan. Tidak ada yang bisa dilompati.

| # | Prasyarat | Status |
|---|---|---|
| 1 | Bukti instrumen merespons dua kondisi perilaku | Kontrol positif, belum dijalankan |
| 2 | Jalur rujukan yang setiap parameternya punya sumber | Dirancang; [`model_rujukan.md`](model_rujukan.md) |
| 3 | Karakteristik operasional dihitung terhadap kapasitas rujukan nyata | Lengan komposit di `prospective_evaluation.py`, belum ada |
| 4 | Mitra klinis yang bersedia menjadi sponsor kaji etik | Lima lembaga menolak |
| 5 | Protokol prospektif dengan analisis subgrup dipra-registrasi | Belum didraf |
| 6 | Tautan hasil klinis tanpa menyimpan identitas anak | Masalah desain privasi, belum dipecahkan |
| 7 | Kaji etik lolos | — |

Baris 1–3 tidak menunggu siapa pun. Baris 4–7 menunggu, dan menunggunya adalah bagian
dari pekerjaan, bukan hambatan terhadap pekerjaan.

---

## Kalau juri bertanya

**"Kenapa tidak ada balita di bukti kalian sama sekali?"**
Karena merekam balita menuntut kaji etik yang kami tidak punya, dan tanpa kaji etik itu
persetujuan orang tua tidak sah. Kami menghubungi lima lembaga dan semuanya menolak.
Pada tahap bukti kami hari ini, penolakan itu keputusan yang benar. Yang kami kerjakan
adalah mengubah tahap buktinya, bukan mencari jalan memutar.

**"Bukankah itu berarti alat kalian belum terbukti?"**
Ya, dan aplikasinya menuliskan itu di layar. Yang terbukti: alat ukurnya teliti
(Gate A), pengukurannya sejalan dengan metode yang divalidasi untuk balita (Gate B),
dan ambang keputusannya diambil dari studi 1.863 balita, bukan dari data kami. Yang
belum terbukti adalah performa skrining pada balita Indonesia. Itu Gate C, dan Gate C
butuh izin yang kami belum punya.

**"Kenapa tidak rekam anak-anak di sekitar kalian saja? Cuma 80 detik."**
Durasi bukan yang menentukan. Yang menentukan: balita tidak dapat memberi persetujuan,
jadi yang menggantikannya adalah keputusan orang lain, dan struktur yang mengawasi
keputusan itu adalah kaji etik. Melewatinya menghapus pihak yang mewakili kepentingan
anaknya. Kalau kami bersedia melewatinya untuk lomba, tidak ada alasan percaya kami
tidak akan melewatinya untuk hal lain.

**"Lalu model kalian dilatih pakai apa?"**
Data eye-tracking anak ASD dan TD yang sudah diterbitkan terbuka oleh Cilia dkk. di
bawah CC BY 4.0 — consent-nya diambil pihak yang punya izinnya. Kami tidak merekam satu
anak pun. Bobotnya dari sana, arah tiap sinyalnya dari literatur, kalibrasinya dari
titik operasi yang diterbitkan, dan responsivitas instrumennya diukur pada orang dewasa
yang menyetujui untuk dirinya sendiri. Lingkup pemindahannya dinyatakan di laporan,
bukan disembunyikan.

**"Kalau begitu kapan alat ini boleh dipakai ke anak?"**
Setelah tujuh prasyarat di atas terpenuhi berurutan, dan prasyarat keempat sampai
ketujuh butuh mitra klinis berizin. Kami tidak punya jadwal untuk itu, dan menyebut
jadwal yang tidak kami kendalikan akan menjadi kebohongan pertama di proyek ini.

---

## Untuk yang melanjutkan repositori ini

Batas di catatan ini bukan sikap kami, melainkan konsekuensi dari tahap bukti. Ia
bergeser ketika buktinya bergeser, lewat urutan di tabel prasyarat, dan tidak lewat
jalan lain.

Kalau kamu tergoda merekam "cuma beberapa anak buat demo": itu persis keputusan yang
meruntuhkan seluruh argumen integritas proyek ini, dan runtuhnya tidak bisa diperbaiki
dengan menghapus berkasnya sesudahnya.
