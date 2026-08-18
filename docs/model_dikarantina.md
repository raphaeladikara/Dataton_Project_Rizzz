# Dua model dengan AUC lebih tinggi yang tidak dipakai

Pertanyaan ini datang setiap kali angkanya dibaca berdampingan:

| Model | AUC | Dipakai? |
|---|---:|---|
| Regresi logistik 13 fitur geometri | 0,8228 | Dikirim ke perangkat, dikurung penjaga OOD |
| CNN scanpath (EfficientNetB0) | 0,8819 | Tidak |
| CNN wajah statis (EfficientNetB3) | 0,9324 | Dikarantina |

Angka tertinggi tidak dipakai, angka kedua tidak dipakai, dan yang dikirim justru
yang paling rendah — lalu itu pun tidak boleh memutuskan apa pun. Terlihat seperti
kehati-hatian yang berlebihan sampai angkanya dibongkar satu per satu.

Catatan ini membongkarnya. Setiap klaim di bawah punya berkas yang bisa dibuka.

---

## CNN scanpath — 0,8819

### Selisihnya diuji, dan tidak dapat dibedakan dari nol

Argumen lama hanya menyebut selang kepercayaan bertumpang tindih. Itu argumen lemah:
dua selang bisa bertumpang tindih sementara selisih berpasangannya konsisten dan nyata,
dan kebalikannya juga terjadi. Kedua model menghasilkan prediksi out-of-fold tingkat
partisipan pada 54 partisipan yang **sama**, jadi selisihnya bisa diuji langsung.

`research/compare_models.py`, bootstrap berpasangan terstratifikasi 10.000 replikasi:

| | |
|---|---:|
| AUC regresi logistik | 0,8228 |
| AUC CNN | 0,8819 |
| **ΔAUC berpasangan** | **+0,0591** |
| CI 95% | **−0,0069 sampai +0,1374** |
| p dua sisi | **0,087** |
| Replikasi yang memihak CNN | 95,7% |
| Korelasi prediksi kedua model | **0,932** |

Dua hal harus dibaca bersamaan, dan menghilangkan salah satunya berarti menipu.

**Selisihnya tidak signifikan, tetapi arahnya konsisten.** p = 0,087 bukan p = 0,6.
Pada sampel lebih besar CNN kemungkinan memang unggul sedikit. Menyebutnya "tidak
lebih baik" berlebihan; yang benar adalah keunggulannya belum dapat dibuktikan pada
54 partisipan.

**Korelasi 0,932 adalah angka yang lebih menentukan.** Kedua model memberi peringkat
yang hampir sama pada anak yang sama. CNN tidak menemukan sesuatu yang terlewat oleh
13 fitur geometri — ia menemukan hal yang sama lewat jalan yang lebih mahal dan tidak
dapat ditafsirkan. Itu alasan yang berdiri sendiri, terlepas dari signifikansi.

### Per lipatan, angkanya menceritakan hal lain

`research/hasil/cnn_scanpath/hasil_per_fold_participant.csv`:

| Lipatan | Anak di test | AUC test |
|---:|---:|---:|
| 0 | 10 | 0,762 |
| 1 | 11 | 0,733 |
| 2 | 11 | **1,000** |
| 3 | 11 | **1,000** |
| 4 | 11 | 0,929 |

Dua lipatan memberi AUC tepat 1,000 pada sebelas anak. Itu bukan performa, itu ukuran
sampel. Dengan sebelas anak, satu pertukaran peringkat mengubah AUC beberapa persen
sekaligus, dan simpangan baku antar lipatan (0,129) hampir dua kali lipat simpangan
pada skema pengelompokan yang lebih longgar (0,077) —
`research/hasil/cnn_scanpath/ablasi_grouping.csv`.

Mean dari lima angka yang dua di antaranya sempurna bukan estimasi yang bisa dipakai
memilih model.

### Fine-tuning tidak menyumbang apa pun

`ablasi_finetune.csv`, selisih AUC validasi sesudah membuka backbone:

```
+0,0030   −0,0013   −0,0019   +0,0043   +0,0004
```

Rata-rata +0,0009. Seluruh performa datang dari fitur ImageNet yang beku ditambah
sebuah kepala klasifikasi. Itu bukan alasan untuk tidak memakainya, tapi menghapus
argumen "CNN-nya belajar sesuatu yang tidak bisa ditangkap fitur tangan".

### Kontrak masukannya tidak bisa dipenuhi perangkat sasaran

Ini alasan yang berdiri sendiri, dan yang paling menentukan.

Raster yang dilatih CNN itu mengkodekan **kecepatan, akselerasi, dan jerk** ke dalam
kanal warna. Ketiganya turunan waktu dari sinyal 250 Hz milik eye-tracker Carette.
Kamera depan tablet berjalan di 26–30 fps. Turunan kedua dan ketiga dari sinyal 30 Hz
bukan versi berderau dari turunan sinyal 250 Hz — keduanya mengukur hal yang berbeda,
dan tidak ada rekonstruksi yang sah di antaranya.

Bukan "sulit". Masukannya tidak ada.

### Dan di kondisi perangkat sasaran, fitur geometri menang — kini diukur, bukan di-proxy

Argumen ini sebelumnya bersandar pada `research/hasil/degradasi.json`, yang menurunkan
"laju cuplik" dengan **menghapus piksel dari raster** dan menyatakan batas itu di
metadatanya sendiri: `"Pixel sparsification proxy only; not temporal resampling."`
Citra Carette tidak punya stempel waktu, jadi operasi temporal memang tidak
terdefinisi di sana.

Pasangan Gate B punya (x, y, t) sungguhan, jadi desimasi waktu dapat dijalankan apa
adanya. `research/temporal_degradation.py` menjalankannya pada 27 sesi nyata:

| Laju | Pergeseran geometri | ρ | Pergeseran kinematik | ρ |
|---:|---:|---:|---:|---:|
| 26,2 Hz | — | 1,000 | — | 1,000 |
| 13,1 Hz | **1,6%** | 0,803 | **69,4%** | 0,619 |
| 8,7 Hz | 2,8% | 0,679 | 79,7% | 0,533 |
| 6,5 Hz | 4,2% | 0,443 | 81,3% | 0,304 |
| 5,2 Hz | 5,6% | 0,386 | 84,4% | 0,193 |

Menurunkan laju separuh menggeser fitur kinematik sebesar 69% nilainya dan fitur
geometri sebesar 1,6% — **beda 42 kali**, pada operasi yang benar-benar dilakukan
kamera lambat, bukan pada penghapusan piksel.

Ini memperkuat kesimpulan proxy lewat jalur yang tidak bergantung padanya, dan
sekaligus menjelaskan kenapa CNN adalah kasus terburuk: informasinya seluruhnya
kinematik pada dua dari tiga kanal.

Satu catatan yang harus ikut dibaca: **geometri lebih tahan, bukan kebal.** ρ-nya
sudah turun ke 0,44 pada 6,5 Hz. Pipeline yang dikirim me-resample ke 20 Hz
(`DEFAULT_GAZE_CONFIG.resampleMs = 50`), sementara aliran tablet pada pasangan Gate B
berjalan sekitar 11 Hz — tepat di zona tempat ρ geometri berada antara 0,68 dan 0,80.
Laju cuplik perangkat perlu dipantau per sesi, bukan diasumsikan.

### Ringkasnya

CNN scanpath tidak dipakai karena empat alasan yang masing-masing cukup: keunggulannya
tidak dapat dibuktikan pada 54 partisipan (ΔAUC +0,059, p = 0,087) sementara
prediksinya berkorelasi 0,93 dengan model yang jauh lebih murah; angkanya tidak stabil
pada lipatan sekecil itu; masukannya mustahil disediakan kamera 30 fps; dan jenis
informasi yang diandalkannya adalah jenis yang paling rusak di perangkat sasaran.

### Apakah CNN ini bisa dibuat berguna?

Pertanyaan yang tepat, dan jawabannya berbeda untuk tiga kemungkinan penggunaan.

**Melatih ulang pada representasi 30 Hz — bisa, dan versi lama catatan ini keliru.**

Yang tertulis di sini sebelumnya: yang tersedia hanyalah 547 PNG, tidak ada CSV, tidak
ada stempel waktu, jadi deret waktunya "bukan sulit direkonstruksi; ia tidak ada".

Yang tidak ada adalah di folder kami. Tim yang sama menerbitkan **data mentahnya** —
Cilia dkk. 2022, `10.6084/m9.figshare.20113592.v1`, CC BY 4.0: 25 berkas CSV koordinat
mentah dari SMI Red-M pada 60 Hz, sekitar 2,17 juta baris, 59 anak usia 3–12 tahun
lengkap dengan ID partisipan dan skor CARS. 547 PNG itu adalah render dari CSV ini.

Desimasi 60 → 30 Hz karena itu adalah operasi yang sah dan terdefinisi, tidak seperti
sparsifikasi piksel yang dipakai `degradasi.json` dan yang menyatakan sendiri sebagai
proksi. Klaim lama dicabut, dan ini dicatat sebagai koreksi alih-alih diperbaiki diam-diam.

Yang **tidak** berubah karena koreksi ini: keempat alasan CNN scanpath tidak dipakai
tetap berdiri. Kontrak masukan CNN menuntut turunan kedua dan ketiga dari sinyal
250 Hz, dan itu tetap mustahil dari kamera 30 fps berapa pun rapinya CSV-nya. Yang
dibuka koreksi ini bukan CNN-nya, melainkan kemungkinan menghitung **indeks perilaku**
dari koordinat mentah — jalur yang berbeda, dan yang dirancang di
[`model_rujukan.md`](model_rujukan.md).

**Dipakai sebagai lapis kedua di jalur rujukan — tidak, dan korelasi 0,93 adalah
alasannya.** Model kedua berguna kalau ia salah pada kasus yang berbeda dari model
pertama. Dua model yang berkorelasi 0,93 salah pada anak yang sama, jadi menumpuknya
menambah biaya komputasi dan permukaan kegagalan tanpa menambah informasi.

**Sebagai hasil metodologis — ya, dan ini yang sekarang kurang dimanfaatkan.**
"Kami menguji apakah CNN membeli sesuatu di atas 13 fitur yang dapat ditafsirkan pada
data scanpath, dan pada 54 partisipan jawabannya tidak dapat dibuktikan" adalah
temuan, bukan permintaan maaf. Bersama studi degradasi temporal, keduanya membentuk
satu argumen yang utuh: pada kelas masalah ini, fitur geometri yang dapat ditafsirkan
cukup, dan lebih tahan terhadap perangkat murah. Itu kesimpulan yang berguna bagi
siapa pun yang membangun hal serupa.

**Model yang benar-benar akan masuk jalur rujukan bukan salah satu dari keduanya.**
Ia tidak bekerja di ruang piksel sama sekali. Yang dipasang adalah bobot relatif antar
**indeks perilaku** — mengikuti isyarat, preferensi sosial/non-sosial, dispersi
tatapan — yang dihitung dari koordinat mentah Cilia, diaudit terhadap desimasi 30 Hz
dan terhadap alas shortcut tingkat sesi, lalu dipindahkan ke NeuroGaze dengan lingkup
yang dinyatakan. Rancangan, kriteria penolakan, dan urutannya ada di
[`model_rujukan.md`](model_rujukan.md).

Kenapa bukan dilatih pada data NeuroGaze sendiri: itu menuntut balita berlabel, dan
merekamnya menuntut kaji etik yang belum ada. Batasnya dan alasannya di
[`etika_perekaman.md`](etika_perekaman.md).

---

## CNN wajah statis — 0,9324

Angka tertinggi di proyek ini. Ini yang paling penting untuk tidak dipakai, dan
alasannya berlapis.

### Tiga perempat "performanya" tersedia tanpa melihat wajah sama sekali

`research/hasil/audit_wajah.json`, blok `technical_shortcut_baseline_file_and_pixel`:

Sebuah regresi logistik yang hanya diberi **statistik gambar tingkat berkas** —
rata-rata kanal R/G/B, simpangan kecerahan, kecerahan tepi, energi tepi — mencapai
**AUC 0,7515**, dengan uji permutasi 200 kali menghasilkan p = 0,005.

Model itu tidak punya konsep wajah. Tidak tahu ada mata. Yang dilihatnya adalah
bagaimana berkasnya dikumpulkan dan diproses. Kalau alas seperti itu ada di 0,75,
maka 0,9324 milik CNN sebagian besar mengukur perbedaan pengumpulan data antar kelas,
bukan perbedaan pada anaknya.

(Audit terpisah di notebook memakai lima properti berkas saja tanpa piksel dan hanya
mencapai LR 0,478 / GBM 0,676. Kedua angka dilaporkan karena lingkupnya berbeda, dan
yang lebih tinggi yang harus dijawab.)

### Tidak ada ID partisipan, jadi kebocoran tidak bisa disingkirkan

`identity_audit.status = not_possible_reliably`. Tanpa ID partisipan, tidak ada cara
memastikan foto anak yang sama tidak muncul di train dan di test. Konsekuensinya
tertulis di berkasnya sendiri: *"Any train/test split could leak the same child across
folds."*

Bandingkan dengan CNN scanpath, yang punya `participant_id` dan karenanya bisa diaudit
— `audit_kebocoran_split.csv` menunjukkan 0 anak bocor pada pengelompokan partisipan,
dan 39/41/35 anak bocor pada pengelompokan duplikat visual. Audit itu bisa dilakukan
karena IDnya ada. Pada dataset wajah, audit yang sama tidak mungkin.

### Enam dari enam metadata tata kelola tidak ada

| Metadata | Status |
|---|---|
| Provenance sumber gambar | tidak ada |
| Lisensi eksplisit | tidak ada |
| Dokumentasi consent subjek | tidak ada |
| Metadata demografi | tidak ada |
| Definisi label klinis | tidak ada |
| ID partisipan | tidak ada |

Tanpa definisi label klinis, tidak ada yang tahu apa arti "Autistic" pada folder itu:
diagnosis klinis, label crowdsourced, atau hasil pencarian gambar. Tanpa consent,
tidak ada dasar memakainya. Tanpa demografi, tidak ada analisis subkelompok yang
mungkin — dan proyek ini mengutip spesifisitas SenseToKnow 53,6% pada anak kulit hitam
berbanding 82,7% pada anak kulit putih justru untuk menekankan bahwa analisis itu
wajib.

### Dan yang paling menentukan: ini produk yang berbeda

Alasan-alasan di atas bisa diperbaiki dengan dataset yang lebih baik. Yang ini tidak.

Seluruh premis NeuroGaze adalah **mengukur perilaku**: ke mana anak melihat, apakah ia
mengikuti isyarat, apakah ia menoleh saat dipanggil. Model wajah statis menyimpulkan
dari **penampilan**. Menempelkannya ke produk berarti menyatakan bahwa autisme dapat
dibaca dari bentuk wajah anak.

Itu fisiognomi, dan sejarahnya panjang serta buruk. Sebuah alat yang dipasang di
Posyandu dan menyimpulkan disabilitas perkembangan dari rupa anak akan salah dengan
cara yang tidak bisa diperbaiki dengan lebih banyak data — karena yang salah bukan
akurasinya, melainkan pertanyaannya.

`ethics.assessment` di berkas auditnya menuliskannya dalam satu kalimat: *"Static
facial morphology must not be used to infer ASD in this MVP."* Bobotnya tidak ada di
repositori, `model_export_blocked` bernilai benar, dan itu permanen.

**Yang akan membuatnya layak dipertimbangkan ulang:** tidak ada, untuk inferensi ASD.
Setelah provenance, lisensi, dan consent terdokumentasi, dataset itu mungkin berguna
untuk hal lain sama sekali — misalnya menguji ketahanan detektor wajah pada rentang
usia dan pencahayaan. Bukan untuk memprediksi label.

---

## Kenapa ini kekuatan, bukan permintaan maaf

Ada dua cara membaca tabel di awal catatan ini.

Cara pertama: tim ini punya tiga model dan memakai yang paling lemah. Cara kedua: tim
ini membangun tiga model, mengaudit ketiganya, menemukan bahwa dua yang terbaik
mengukur hal yang salah, dan menolaknya — lalu menerbitkan auditnya lengkap dengan
angka yang membuat penolakannya bisa diperiksa orang lain.

Yang membedakan bukan sikap hati-hati. Yang membedakan adalah **auditnya ada**.
Kebanyakan proyek tidak pernah menjalankan baseline shortcut, tidak pernah
mengelompokkan per partisipan, tidak pernah menghitung ulang metriknya dari koordinat
mentah, dan karena itu tidak pernah punya kesempatan menemukan bahwa angka terbaiknya
palsu.

Berkas yang membuat pemeriksaan itu mungkin:

| Klaim | Berkas |
|---|---|
| Selisih AUC berpasangan tidak mengecualikan nol; korelasi prediksi 0,93 | `research/hasil/perbandingan_model.json` (`research/compare_models.py`) |
| Degradasi temporal sungguhan: kinematik 69% vs geometri 1,6% pada laju separuh | `research/hasil/degradasi_temporal.json` (`research/temporal_degradation.py`) |
| Studi degradasi raster adalah proxy, dan menyatakannya sendiri | `research/hasil/degradasi.json`, `sampling_interpretation` |
| Angka CNN tidak stabil per lipatan | `research/hasil/cnn_scanpath/hasil_per_fold_participant.csv` |
| Fine-tuning tidak menyumbang | `research/hasil/cnn_scanpath/ablasi_finetune.csv` |
| Pengelompokan mengubah hasil | `research/hasil/cnn_scanpath/ablasi_grouping.csv`, `audit_kebocoran_split.csv` |
| Fitur geometri unggul di kondisi sasaran | `research/hasil/degradasi.json` |
| Shortcut wajah mencapai 0,7515 | `research/hasil/audit_wajah.json` |
| Bobot wajah tidak diekspor | `audit_wajah.json`, `decision.model_export_blocked` |
