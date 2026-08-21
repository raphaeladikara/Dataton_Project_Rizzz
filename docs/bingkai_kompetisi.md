# Bingkai kompetisi: memindahkan klaim, bukan melunakkan batas

Catatan ini duduk di atas [`arah_pitch.md`](arah_pitch.md) dan [`bingkai_ai.md`](bingkai_ai.md).
Keduanya sudah benar soal **apa yang tidak boleh dikatakan**. Yang belum ada, dan yang
ditulis di sini, adalah **apa yang harus dikatakan sebagai gantinya** — supaya kejujuran
proyek ini berhenti terdengar seperti daftar kekurangan.

Tidak ada batas yang digeser di sini. Yang digeser adalah unit klaimnya.

---

## Diagnosis: kenapa naskah sekarang kehilangan poin

Setiap permukaan proyek ini — README, deck, laporan aplikasi, naskah pitch — membuka
dengan negasi. "Bukan alat diagnosis." "Rujukan ditahan." "Belum ada balita." "Bukan
sensitivitas." Semuanya benar dan semuanya perlu.

Masalahnya bukan kejujurannya. Masalahnya adalah **tolok ukur yang tersirat di
belakangnya**. Kalau seluruh naskah mengukur diri terhadap "alat skrining autisme
balita yang tervalidasi", maka setiap kalimat jujur otomatis berbunyi seperti selisih
yang belum tertutup. Juri yang menilai Impact 35% mendengar: *belum, belum, belum.*

Padahal proyek ini **sudah menyelesaikan sesuatu yang utuh**. Bukan setengah dari alat
skrining — melainkan seluruh dari sesuatu yang lain.

---

## Klaim utama yang baru

> Studi prospektif yang bisa memvalidasi ukuran atensi berbasis tablet pada balita
> Indonesia hari ini tidak bisa dimulai — bukan karena tidak ada yang mau, melainkan
> karena **instrumennya tidak ada**. Kami membangun instrumen itu sampai selesai, dan
> membuktikannya bekerja. Yang tersisa untuk Gate C adalah label dan kaji etik, bukan
> rekayasa.

Ini klaim yang lengkap, sudah terpenuhi hari ini, dan tidak butuh satu balita pun untuk
dibuktikan. Ia juga memindahkan seluruh daftar "belum" dari kolom kegagalan ke kolom
lingkup: hal-hal itu memang bukan bagian dari yang kami janjikan selesai.

Tesnya sederhana. Kalimat lama "kami belum punya data balita" mengundang pertanyaan
*"jadi kalian punya apa?"*. Kalimat baru mengundang pertanyaan *"seberapa jauh
instrumennya sudah jalan?"* — dan untuk pertanyaan itu proyek ini punya 130 berkas
bukti mentah, manifest SHA-256, dan skrip yang menghitung ulang angkanya.

### Satu kalimat yang harus bisa diulang juri ke juri lain

> Tim itu tidak membangun model yang menebak autisme. Mereka membangun rantai ukur yang
> memutuskan sendiri kapan angkanya tidak layak dibaca.

---

## Constraint etik: tulang punggung, bukan permintaan maaf

Bagian ini paling sering dibawakan sebagai keterbatasan. Ia bukan keterbatasan. Ia
**keputusan desain yang menghasilkan tiga sumber bukti** — dan ketiganya sudah dipakai.

| Sumber yang boleh | Dipakai untuk | Statusnya |
|---|---|---|
| Orang dewasa yang menyetujui untuk dirinya sendiri | Kontrol positif, Gate A, Gate B | Selesai — 12 dewasa, 23 sesi, rantai kamera-ke-angka utuh |
| Data anak yang sudah diterbitkan peneliti lain dengan izin mereka | Seleksi model, ambang, preseden indeks | Selesai untuk Carette; Cilia dkk. (CC BY 4.0) belum diunduh |
| Praktisi yang menangani anak-anak ini setiap hari | Validasi masalah dan alur kerja | Protokolnya siap; wawancaranya belum |

Kalimat panggungnya:

> Lima lembaga kami datangi dan lima-limanya menolak. Kami tidak mencari jalan memutar.
> Kami memindahkan risetnya ke tiga sumber yang boleh, dan tiga-tiganya menghasilkan
> bukti yang ada di repositori ini. Yang tidak kami lakukan adalah merekam balita tanpa
> kaji etik supaya punya angka untuk dipamerkan hari ini.

Dua hal yang **tidak boleh** ikut keluar di sini:

- Jangan menutup bagian mana pun dengan "lima lembaga menolak kami". Itu kalimat isi,
  bukan kalimat penutup — kalau ditaruh di akhir, yang dibawa pulang juri adalah
  penolakannya.
- Jangan menyebut perekaman anak sebagai hal yang pada dasarnya tidak etis. Seluruh
  ambang di sistem ini lahir dari studi yang merekam anak. Rinciannya di
  [`etika_perekaman.md`](etika_perekaman.md).

### Kenapa constraint ini justru menaikkan skor Responsible AI

Karena ia bukan pernyataan niat. Ia terlihat di kode: `emitsReferral` di-hardcode
`false`, `combinedScore` bertipe `null`, dan ambang 69% ditahan oleh perbandingan
selang kepercayaan. Tim mana pun bisa mengatakan mereka menjunjung etika. Yang jarang
adalah tim yang etikanya **tidak dapat dikompilasi kalau dilanggar**.

---

## Impact (35%): tiga tingkat, dan yang terkuat bukan biaya

Naskah sekarang memimpin dengan biaya per kasus. Itu angka bersyarat, turunan dari
titik operasi yang justru sedang ditahan, dan ia menyeret argumen ke medan yang
dimenangkan alat berizin FDA. Turunkan ia ke tingkat tiga.

### Tingkat 1 — sudah selesai hari ini, tidak bersyarat

Instrumen yang sebelumnya tidak ada. Tangkap luring, kalibrasi, gerbang mutu, jejak
audit yang dapat diekspor dan diputar ulang, parity Python–TypeScript, dan bukti mentah
yang dapat dihitung ulang oleh skrip terpisah.

> Sebuah kelompok riset yang ingin menjawab pertanyaan ini untuk balita Indonesia hari
> ini harus membangun dulu seluruh rantai itu sebelum merekrut satu anak pun. Itu
> pekerjaan bulanan, dan ia sudah selesai. Ini yang kami serahkan.

Penerima manfaatnya konkret dan bisa disebut: Puskesmas, kelompok riset kesehatan anak,
dan koordinator Posyandu yang selama ini tidak punya instrumen untuk diuji.

### Tingkat 2 — keputusan desain yang menentukan apakah dampak mungkin sama sekali

Ini argumen terkuat proyek ini dan sekarang terkubur di slide 9.

> Alat skrining gagal di layanan primer bukan karena melewatkan kasus. Ia gagal karena
> membanjiri kapasitas rujukan yang ada. Titik operasi bersensitivitas 92% merujuk 740
> dari 1.000 anak; Puskesmas mana pun berhenti memakainya di minggu kedua. Kami memilih
> titik kerja yang menemukan paling sedikit, karena itu satu-satunya yang muat.

Tambahkan satu kalimat yang membuatnya jadi klaim dampak, bukan klaim teknis:

> Sensitivitas 17% terdengar seperti alat yang buruk sampai Anda menghitung berapa
> rujukan yang benar-benar bisa dilayani. Kami mengoptimalkan terhadap kendala yang
> mengikat, bukan terhadap kendala yang enak dipamerkan.

Kedua, **keadaan ditahan adalah klaim dampak**, bukan keterbatasan:

> Bahaya terbesar di skrining massal bukan kasus yang terlewat — itu sudah terjadi hari
> ini tanpa alat apa pun. Bahaya terbesarnya adalah rasa aman palsu yang diberikan
> kepada orang tua oleh alat yang selalu mengeluarkan angka. Attrition webcam balita
> yang dilaporkan ManyBabies 42%. Alat yang tidak pernah menolak adalah alat yang
> mengarang di empat dari sepuluh sesi.

### Tingkat 3 — skenario, diberi label skenario

Biaya per sesi dan biaya per kasus. Tetap ditampilkan, tetap dengan syaratnya, tetapi
bukan sebagai pembuka.

### Yang masih hilang dan sebaiknya ditambahkan

- **Satu orang yang disebutkan namanya.** Naskah sekarang seluruhnya abstrak. Satu kader,
  satu ibu, satu bidan — dari wawancara praktisi yang belum dilakukan — akan mengubah
  bagian ini lebih besar daripada tabel biaya mana pun.
- **Paket siap-mitra sebagai artefak.** Surat permintaan stimulus UCSD, protokol
  wawancara praktisi, dan protokol Gate C sudah ada di repositori. Tunjukkan ketiganya
  sebagai satu berkas. "Kami belum punya mitra" berubah jadi "paketnya siap dikirim
  hari ini".

---

## AI Implementation (15%): berhenti menjual penolakan sebagai keseluruhan

Empat komponen di [`bingkai_ai.md`](bingkai_ai.md) benar, tetapi tiga di antaranya
berbunyi *kami tidak memakai model*. Juri yang mencari implementasi AI mendengar tiga
penolakan dan satu regresi logistik yang keluarannya selalu ditahan.

Urutan yang lebih baik: **sebutkan apa yang berjalan dulu, penolakannya belakangan.**

> Empat model berjalan di tablet ini setiap sesi. Satu di antaranya bertugas memutuskan
> apakah tiga lainnya boleh dibaca.

Lalu isi keempatnya dengan yang memang berjalan:

1. **MediaPipe FaceLandmarker**, 478 titik, WASM, di perangkat, ~26 fps luring pada
   tablet Android kelas menengah. Angkanya ada di `research/hasil/device_benchmark.json`.
2. **Regresi pandangan terkalibrasi** — lima titik, galat median 2,207°, diuji
   berdampingan dengan WebGazer.js pada 27 pasangan simultan.
3. **Regresi logistik 13 fitur**, dikirim ke tablet, dijalankan tiap sesi.
4. **Penjaga out-of-distribution** yang memutuskan apakah nomor 3 layak dibaca.

Baru setelah itu ceritanya berbalik: nomor 3 ditolak nomor 4, dan CNN yang lebih tinggi
AUC-nya tidak dikirim sama sekali. Penolakan jadi puncak cerita, bukan keseluruhan
cerita.

### Kelemahan yang harus diakui sendiri sebelum juri menemukannya

Logika keputusan yang dikirim hari ini adalah aturan pencacahan:
`REFERRAL_DEVIANT_THRESHOLD = 2`. Juri yang jeli akan bilang "produk kalian sebuah
if-statement." Jawabannya bukan membantah, melainkan menyebut penggantinya yang sudah
dirancang lengkap di [`model_rujukan.md`](model_rujukan.md) — dan lebih baik lagi,
memasangnya sebelum semifinal. Lihat daftar di bagian terakhir catatan ini.

---

## Innovation (10%): beri nama pada yang memang baru

Kontribusi arsitektural sulit dirasakan dalam sepuluh menit kalau tidak punya nama.
Dua yang layak dinamai, dan keduanya milik proyek ini:

### 1. Arsitektur inferensi bergerbang

> Pola penerapan di mana runtime memutuskan, per sesi, apakah keluaran model dapat
> diterima — dan mencetak alasannya kalau tidak.

Yang membuatnya bukan sekadar validasi masukan: gerbangnya menyebut **fitur mana** yang
di luar distribusi beserta jaraknya, penolakannya **tercetak di laporan** alih-alih
disembunyikan, dan pemisahan lajurnya **dijaga type checker**.

### 2. Ambang dibandingkan terhadap selang, bukan terhadap titik

Ini kontribusi metodologis yang sekarang cuma jadi catatan kaki "kalau ada waktu".
Naikkan jadi slide sendiri.

> Hampir semua penerapan ambang terbit membandingkan estimasi titik sesi terhadap
> cutoff. Kami membandingkan selang kepercayaan 95% sesi. Sesi yang mengukur 71% dengan
> selang 62–79 berstatus tidak dapat dinilai, bukan positif. Efeknya terukur: peserta
> yang preferensinya persis di ambang memicu aturan lama separuh waktu, aturan sekarang
> lima persen.

Angkanya milik sendiri, terukur, dan langsung dapat dipahami. `ambang_selang_kepercayaan.md`.

### 3. Temuan degradasi temporal, dinaikkan jadi klaim untuk bidangnya

Sekarang dibawakan sebagai alasan internal memilih fitur geometri. Ia lebih besar dari itu:

> Siapa pun yang menerapkan eye-tracking berbasis webcam di perangkat kelas menengah
> sebaiknya tidak memakai fitur kinematik. Pada 27 sesi dengan stempel waktu sungguhan,
> menurunkan laju dari 26 ke 13 Hz menggeser fitur kinematik 69,4% dan fitur geometri
> 1,6%. Kami mengukurnya karena harus memilih; hasilnya berlaku di luar proyek ini.

Tetap sebut batasnya: itu drift fitur, bukan akurasi klasifikasi, dan sebagian fitur
geometri tetap lemah pada laju yang lebih rendah.

---

## Demo & Pitching (30%): tiga perubahan panggung

### 1. Buang relawan dari jalur berwaktu

Meminta juri maju tanpa briefing adalah taruhan besar dengan hadiah kecil. Kalau tidak
ada yang maju, ada jeda mati. Kalau yang maju bergerak berlebihan, gerbang mutu menahan
sesinya dan demo tidak menghasilkan apa pun — separuh sesi pola diproduksi memang gugur
di gerbang mutu, dan itu ada di data sendiri.

Gantinya: **penyaji sendiri yang menjalankan kondisi pola diproduksi**, karena penyaji
adalah orang dewasa yang menyetujui, terlatih, dan dapat diulang. Relawan tetap
ditawarkan — tetapi setelah pitch, di luar jam:

> Tabletnya ada di sini setelah sesi ini. Siapa pun yang mau menguji apakah alat ini
> hanya merujuk semua orang, silakan coba sendiri.

Keberatannya tetap diucapkan lebih dulu — itu gerakan berbiaya nol yang sudah benar di
naskah sekarang. Yang dibuang cuma risikonya.

### 2. Isi 67 detik itu

Enam puluh tujuh detik diam adalah 11% dari pitch sepuluh menit. Prinsip produk
melarang apa pun bersaing dengan stimulus di layar anak — dan itu benar untuk lapangan.
Tetapi `stage_demo` bukan lapangan. Cermin panggung yang hanya hidup di mode itu
menyelesaikan keduanya: layar anak tetap bersih, penyaji punya sesuatu untuk
dinarasikan, dan penonton melihat sistemnya hidup alih-alih menunggu video selesai.

### 3. Satu layar perbandingan

Bukti paling meyakinkan proyek ini adalah **alat ini membedakan** — 0 dari 9 sesi
menonton biasa, 4 dari 6 sesi pola diproduksi. Untuk menunjukkannya sekarang, dua sesi
harus dijalankan berurutan, dan di bawah jam sepuluh menit hampir pasti hanya satu yang
sempat.

Satu layar yang menampilkan dua rekaman terdaftar berdampingan, dengan tiga sinyal
penentu sejajar, menyelesaikan itu dalam satu klik dan tanpa risiko kamera.

### 4. Pembuka dingin

Sebelum slide pertama, sebelum satu kalimat pun:

> *(Layar sudah menampilkan panel penjaga: **Ditolak · 3 fitur ditandai · keluaran model
> ditahan**.)*
>
> Ini model kami sendiri. Sistem kami sendiri baru saja menolak membiarkan Anda
> membacanya. Sepuluh menit berikutnya menjelaskan kenapa itu produknya, bukan bugnya.

### 5. Rapikan tumpukan spanduk di laporan

Laporan peragaan sekarang membuka dengan tiga kotak peringatan bertumpuk sebelum satu
hasil pun terlihat. Isinya benar; tumpukannya yang salah. Di panggung itu terbaca
sebagai permintaan maaf, dan itu kesan visual pertama juri terhadap keluaran sistem.
Satu spanduk mode demonstrasi yang memuat ketiganya menjaga seluruh tata kelolanya dan
mengembalikan hasilnya ke atas lipatan.

---

## Yang sudah diperbaiki di repositori

- Deck slide 2 tidak lagi menyebut 56 bulan sebagai usia diagnosis **di Indonesia**.
  Angkanya kini berlabel tinjauan lintas negara, dan klaim Indonesia dipindahkan ke
  bentuk yang dapat dipertahankan: ketiadaan instrumen di alur Posyandu.
- Deck slide 12 tidak lagi berjudul "penyebarannya adalah mesin pengumpul datanya
  sendiri". Judul itu memframe penyebaran produk sebagai cara memanen data balita, yang
  persis dilarang [`dampak_dan_adopsi.md`](dampak_dan_adopsi.md). Angka 700 kini
  berlabel hipotetis dan penutupnya menyebut studi prospektif berizin etik.
- Matriks kesiapan di `/validation` tidak lagi meluber keluar kartunya. Kolom "Batas"
  terpotong di tepi layar karena `white-space: nowrap` diterapkan pada kolom berisi
  kalimat.

## Yang belum, diurutkan menurut poin per jam kerja

1. **Pasang lapis likelihood-ratio** menggantikan `REFERRAL_DEVIANT_THRESHOLD = 2`.
   Rancangannya lengkap, tiap sukunya wajib bersitiran, dan **tidak butuh satu balita
   pun**. Ini satu-satunya perubahan yang mengubah "produk kami if-statement" jadi
   "produk kami lapis kombinasi bukti terkalibrasi".
2. **Unduh dan pasang bobot pada data Cilia dkk.** CC BY 4.0, data anak yang sudah
   diterbitkan dengan izin peneliti lain — persis sumber kedua yang proyek ini sudah
   nyatakan boleh. Ini menghasilkan model yang benar-benar dilatih pada anak, tanpa
   melanggar satu batas pun.
3. **Tunjukkan penjaga OOD menerima, bukan hanya menolak.** Gerbang yang selalu bilang
   tidak tidak dapat dibedakan dari `false` yang di-hardcode. Jalankan pada sesi
   Carette yang ditahan: kalau ia menerima di sana dan menolak di sini, gerbangnya
   terbukti membedakan. Datanya sudah ada.
4. **Layar perbandingan berdampingan** untuk demo.
5. **Cermin panggung** selama 67 detik, hanya di `stage_demo`.
6. **Satu wawancara praktisi.** Ini bukti termurah yang tersisa dan satu-satunya yang
   memberi bagian Impact seorang manusia untuk disebut.
7. **Kompilasi ulang `paper/Rizzz_Paper_Final.pdf`.** PDF-nya lebih tua daripada
   sumbernya dan belum memuat kontrol positif.
8. **Daftar klaim satu halaman** — tiap angka di pitch, sumbernya, dan apakah ia milik
   sendiri atau dikutip. Diserahkan ke juri. Murah, dan hampir tidak mungkin tidak
   menaikkan skor Responsible AI.
