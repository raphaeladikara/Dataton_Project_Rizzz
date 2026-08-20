# Dampak, biaya, dan jalur adopsi

Catatan ini menjawab tiga pertanyaan yang tidak dijawab bukti Gate A/B: apa yang
sebenarnya diubah alat ini, berapa biayanya, dan bagaimana ia sampai ke Posyandu.

Semua angka biaya di bawah adalah **asumsi perencanaan yang dinyatakan**, bukan hasil
pengukuran. Angka yang berasal dari literatur diberi sumbernya. Yang berasal dari
aritmetika diberi rumusnya, supaya bisa dibantah dengan mengganti asumsinya.

---

## Klaim dampak yang benar

Klaim yang salah, dan yang menggoda dipakai: *"alat ini menemukan anak autistik."*

Aritmetikanya sendiri membantahnya. Pada kohort 1.000 anak dengan prevalensi 1% dan
coverage teknis 90%, ambang GeoPref terbit menemukan **1,53 kasus benar** dan merujuk
19 anak (`research/hasil/gate_c_simulation.json`). Alat dengan sensitivitas 17% memang
melewatkan sebagian besar. Menjual volume penemuan kasus berarti menjual sesuatu yang
bisa dihitung juri dalam tiga puluh detik dan ditemukan salah.

Klaim yang benar berbunyi begini:

> Di Indonesia, diagnosis ASD rata-rata datang pada usia 56 bulan — sekitar 32 bulan
> setelah orang tua pertama kali merasa ada yang berbeda. Jarak 32 bulan itu bukan
> karena orang tua tidak sadar. Karena antara "saya khawatir" dan "ini namanya apa"
> tidak ada satu pun titik yang menghasilkan **pengukuran objektif**. Yang ada hanya
> laporan manusia, dan laporan manusia tidak bisa diserahkan.

Tiga hal yang benar-benar ditambahkan alat ini, dan ketiganya bisa ditunjukkan di
layar hari ini:

**1. Pengukuran objektif di titik yang sekarang tidak punya satu pun.** Posyandu
menjangkau hampir setiap desa. Yang dijalankannya adalah SDIDTK — ceklis, berbasis
laporan. NeuroGaze menambahkan pengukuran perilaku terhadap stimulus terstandar, di
perangkat yang sudah ada, tanpa klinisi dan tanpa jaringan.

**2. Sesuatu yang bisa dibawa.** Laporan satu halaman mengubah "anak saya kok beda"
menjadi lembar berisi persentase terukur, status tiap sinyal, dan sumber referensi
masing-masing. Yang dipercepat bukan diagnosisnya — melainkan **antreannya**: tenaga
Puskesmas menerima sesuatu yang bisa dibaca, bukan kecemasan yang harus digali ulang
dari awal.

**3. Penolakan yang terlihat.** Alat yang menolak mengeluarkan angka ketika rekamannya
tidak layak mencegah hal yang paling berbahaya di skrining massal: rasa aman palsu.
Attrition webcam balita yang dilaporkan ManyBabies adalah 42% (Steffan dkk. 2024).
Alat yang tidak pernah menolak adalah alat yang mengarang.

Ketiganya bisa diklaim tanpa satu balita pun dalam bukti — dan tidak satu pun runtuh
kalau sensitivitas Gate C ternyata rendah.

---

## Biaya per pemeriksaan

### Pembanding

| Instrumen | Biaya | Sumber |
|---|---|---|
| EarliPoint | USD 599 per pemeriksaan, eye-tracker khusus, di fasilitas klinis | Izin FDA 510(k) 2022, usia 16–30 bulan |
| SDIDTK / KPSP | Praktis nol, tetapi berbasis laporan dan spesifisitasnya rendah | Instrumen Kemenkes yang sudah berjalan |
| NeuroGaze | Lihat rumus di bawah | Aritmetika atas asumsi yang dinyatakan |

### Rumus

Tidak ada biaya per sesi yang bersifat konsumabel: tidak ada bahan habis pakai, tidak
ada biaya jaringan (aplikasi berjalan luring), tidak ada lisensi per kursi, dan tidak
ada waktu klinisi. Yang tersisa hanya amortisasi perangkat.

```
biaya per sesi = harga tablet / (sesi per tahun × umur pakai tahun)
```

Dengan tablet Android kelas menengah Rp 2.500.000 dan umur pakai 3 tahun:

| Pemakaian | Sesi/tahun | Sesi seumur pakai | Biaya per sesi |
|---|---:|---:|---:|
| Satu Posyandu, 5 anak per hari buka, 12 hari/tahun | 60 | 180 | **Rp 13.900** |
| Tablet dirotasi ke 4 Posyandu | 240 | 720 | **Rp 3.500** |
| Tablet dirotasi ke 8 Posyandu | 480 | 1.440 | **Rp 1.700** |

EarliPoint pada kurs Rp 16.200/USD adalah sekitar **Rp 9.700.000 per pemeriksaan**.
Selisihnya tiga sampai empat orde besaran, dan selisih itu bukan hasil optimasi —
ia muncul karena perangkat kerasnya sudah ada di tangan orang.

### Asumsi yang harus diuji, dan yang bisa membatalkan angka ini

- Umur pakai tablet 3 tahun di lingkungan Posyandu belum diuji.
- Waktu kader (~6 menit per sesi termasuk persiapan) tidak dihitung sebagai biaya di
  sini karena kader adalah relawan; kalau kebijakan menuntut insentif, angkanya
  berubah dan harus dihitung ulang.
- Angka 5 anak per hari buka adalah perkiraan, bukan observasi.
- Baterai 67 detik belum pernah dijalankan pada balita. Kalau toleransinya jauh lebih
  rendah dan sesi harus diulang, sesi per hari turun dan biaya per sesi naik.

Yang **tidak** berubah oleh asumsi mana pun: tidak ada biaya marginal perangkat lunak
untuk Posyandu tambahan. PWA tanpa backend, tanpa basis data, tanpa lisensi. Posyandu
ke-1 dan Posyandu ke-1.000 memakai berkas statis yang sama.

### Biaya per kasus ditemukan — angka yang harus dibawa ke panggung

Perbandingan biaya per *pemeriksaan* punya satu kelemahan yang juri tajam akan temukan
dalam tiga puluh detik: ia membandingkan alat bersensitivitas 17% dengan alat berizin
FDA seolah keduanya melakukan hal yang sama. Serangan itu sah, dan jawabannya adalah
menghitung metrik yang lebih keras terhadap diri sendiri lebih dulu.

Dari `research/hasil/gate_c_simulation.json`: kohort 1.000 anak, prevalensi 1%,
coverage teknis 90% → ambang GeoPref terbit menemukan **1,53 kasus benar**.

| Pemakaian | Biaya per sesi | Biaya 1.000 sesi | **Biaya per kasus ditemukan** |
|---|---:|---:|---:|
| Satu Posyandu | Rp 13.900 | Rp 13,9 juta | **Rp 9,08 juta** |
| Dirotasi 4 Posyandu | Rp 3.500 | Rp 3,5 juta | **Rp 2,29 juta** |
| Dirotasi 8 Posyandu | Rp 1.700 | Rp 1,7 juta | **Rp 1,11 juta** |

Pembandingnya: EarliPoint **Rp 9,7 juta untuk satu kali pemeriksaan**, satu anak.

Kalimat panggungnya:

> Ambil metrik yang paling keras terhadap kami — bukan biaya per pemeriksaan, tapi
> biaya per kasus yang benar-benar ditemukan, sudah memperhitungkan bahwa alat ini
> melewatkan sebagian besar. **Menemukan satu kasus dengan Neurogaze harganya kira-kira
> sama dengan sekali pemeriksaan EarliPoint.** Dan dengan satu tablet yang dirotasi ke
> empat Posyandu, harganya turun jadi seperempatnya.

Angka ini lebih rendah hati daripada "tiga sampai empat orde besaran", lebih mudah
diingat, dan — yang menentukan — ia bertahan ketika juri mengerjakan pembagiannya
sendiri.

---

## Jalur integrasi

Alat ini tidak menggantikan apa pun. Ia menempel pada alur yang sudah berjalan.

| Lapis | Yang sudah ada | Di mana NeuroGaze masuk |
|---|---|---|
| Posyandu | SDIDTK/KPSP saat penimbangan bulanan | Sesi 67 detik sesudah penimbangan, dijalankan kader |
| Rujukan | Kader menyerahkan temuan ke Puskesmas | Laporan satu halaman dicetak atau diserahkan sebagai berkas |
| Puskesmas | M-CHAT-R/F, pemeriksaan tenaga kesehatan | Laporan dibaca **berdampingan** dengan SDIDTK, bukan menggantikannya |
| Nasional | SATUSEHAT (FHIR R4) | Target integrasi, belum dikerjakan |

Tiga hal yang harus jujur disebut tentang tabel ini:

- **Baris keempat belum dikerjakan.** Tidak ada satu baris kode pun di repositori ini
  yang berbicara dengan SATUSEHAT. Itu target, bukan fitur, dan menyebutnya sebagai
  fitur akan langsung ketahuan.
- **Baris pertama belum diuji dengan kader sungguhan.** Belum ada kader yang menyentuh
  aplikasi ini. Itu pengujian termurah yang tersisa dan belum dilakukan.
- **Laporan tidak pernah menjadi keputusan rujukan.** Yang merujuk tetap tenaga
  kesehatan. Alat ini memberi arahan dan bahan, bukan surat rujukan.

---

## Jalur pengumpulan data Gate C

Ini bagian yang paling sering hilang dari proyek serupa, dan yang paling menentukan
apakah proyek ini punya masa depan setelah lomba.

Gate C butuh balita berlabel. Yang belum disadari dari luar: **penyebaran produk ini
adalah mesin pengumpul datanya sendiri.**

Setiap sesi sudah menghasilkan log audit lengkap dengan jejak frame dan koordinat
pandangan, tanpa video dan tanpa landmark. Log itu sudah punya field
`privacy.researchConsent`. Yang belum ada hanya cara mengumpulkannya.

### Aritmetika

| | |
|---|---:|
| Posyandu dalam pilot | 30 |
| Anak layak usia 12–48 bulan per Posyandu per tahun | 40 |
| Sesi per tahun | 1.200 |
| Setelah attrition 42% (Steffan dkk. 2024) | ~700 dapat dinilai |
| Kohort SenseToKnow (Perochon dkk. 2023) | 475 balita |

Satu tahun penyebaran di 30 Posyandu menghasilkan lebih banyak sesi balita daripada
kohort yang dipakai *Nature Medicine* — dengan asumsi 40 anak layak per Posyandu per
tahun, yang harus diperiksa terhadap data cakupan setempat sebelum dipercaya.

### Yang sulit, dan tidak boleh disamarkan

Sesi tanpa label tidak melatih apa pun. Yang mengubah 700 sesi menjadi 700 titik data
adalah **hasil klinis yang dikembalikan Puskesmas** — dan itu menuntut tiga hal yang
belum ada:

1. **Persetujuan etik.** Lima lembaga sudah dihubungi dan seluruhnya menolak. Itu
   keputusan yang benar dari pihak mereka pada tahap bukti saat ini, dan kontrol
   positif adalah salah satu hal yang mengubah tahap itu. Sampai izin itu ada, tidak
   ada balita dan tidak ada anak ASD yang direkam tim ini — bukan untuk demo, bukan
   untuk melatih apa pun. Batasnya di [`etika_perekaman.md`](etika_perekaman.md).
2. **Tautan hasil.** Mekanisme yang menghubungkan sesi dengan diagnosis yang keluar
   berbulan-bulan kemudian, tanpa menyimpan identitas anak di perangkat. Ini masalah
   desain privasi, bukan masalah teknis, dan belum dipecahkan.
3. **Antrean sinkronisasi.** PWA harus bisa mengantre log audit dan mengirimkannya
   ketika jaringan muncul. Belum ada; hari ini operator mengunduh berkas per sesi
   secara manual.

Ketiganya adalah pekerjaan setelah lomba, dan menyebutnya sebagai rencana lebih jujur
daripada menyebutnya sebagai kemampuan.

---

## Urutan yang masuk akal

| Tahap | Yang dikerjakan | Prasyarat | Status |
|---|---|---|---|
| — | Cabut kekeliruan absence-of-evidence pada `cueSignal` | Tidak ada | **Selesai** |
| — | Kontrol positif, 8–10 dewasa | Tidak ada | **Selesai** — 12 dewasa, 19 Agu 2026 |
| Sekarang | Wawancara praktisi ASD dan tenaga Puskesmas | Tidak ada | [`wawancara_praktisi.md`](wawancara_praktisi.md) |
| Sekarang | Uji kegunaan dengan 3 kader sungguhan | Akses ke satu Posyandu | Belum |
| Sekarang | Kirim permintaan stimulus GeoPref penuh ke UCSD | Surat sudah didraf | **Belum dikirim** |
| Sekarang | Selang kepercayaan pada persentase GeoPref | Tidak ada | Belum |
| Sekarang | Kalibrasi likelihood-ratio menggantikan ambang `= 2` | Ekstraksi titik operasi dari makalah | Belum |
| Berikutnya | Blok target diketahui Gate B, dua aliran | Rig Gate B | Belum |
| Berikutnya | Unduh dan audit data terbit Cilia dkk., pasang bobot antar indeks | Tidak ada — CC BY 4.0 | Belum |
| Berikutnya | Lajur komposit dipromosikan jadi lajur rujukan | Stimulus penuh | Belum |
| Berikutnya | Antrean sinkronisasi luring untuk log audit | Keputusan desain privasi | Belum |
| Gate C | Pita normatif balita + studi prospektif dengan hasil klinis | Persetujuan etik, mitra klinis | Belum |
| Gate D | Implementasi lapangan dengan kader | Gate C lolos | Belum |

Baris bertanda "Sekarang" tidak menunggu siapa pun dan bisa selesai dalam hitungan hari.
Itu yang membedakan rencana dari harapan. Dua di antaranya — wawancara praktisi dan uji
kader — adalah satu-satunya cara proyek ini memperoleh bukti yang menyentuh konteks
Indonesia sebelum Gate C, karena seluruh angka lain dipinjam dari populasi lain.

Perhatikan di mana pita normatif duduk: ia turun ke Gate C, bukan karena sulit
dibangun, melainkan karena membangunnya menuntut merekam balita dan itu menuntut kaji
etik yang belum ada. Detail batas itu di [`etika_perekaman.md`](etika_perekaman.md);
rancangan yang menggantikannya di [`model_rujukan.md`](model_rujukan.md).

---

## Sumber

| Angka | Sumber |
|---|---|
| 56 bulan, 32 bulan | Bagian pendahuluan makalah, `paper/sumber/` |
| Attrition 42%, N=125, 16 lab | Steffan dkk. 2024, *Infancy*, usia 18–27 bulan |
| Kohort 475 balita, sens 87,8% / spec 80,8% | Perochon dkk. 2023, *Nature Medicine* |
| USD 599, FDA 510(k), usia 16–30 bulan | EarliPoint, izin 2022 |
| 1,53 kasus benar per 1.000 anak | `research/hasil/gate_c_simulation.json`, lengan `geopref_published` |
| Harga tablet, umur pakai, sesi per hari | Asumsi perencanaan, belum diukur |
