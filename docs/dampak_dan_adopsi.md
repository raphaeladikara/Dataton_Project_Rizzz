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

Masalah yang boleh dipakai untuk membuka bagian ini:

> Tinjauan lintas negara melaporkan diagnosis ASD rata-rata sekitar usia 56 bulan,
> sekitar 32 bulan setelah kekhawatiran pertama orang tua. Itu bukan estimasi
> Indonesia. Di Indonesia, celah yang belum dijawab proyek ini adalah apakah ukuran
> tatapan berbasis tablet dapat dijalankan kader dan divalidasi pada balita di alur
> layanan setempat.

Tiga hal yang benar-benar ditambahkan alat ini, dan ketiganya bisa ditunjukkan di
layar hari ini:

**1. Rantai ukur yang dapat dibawa ke uji lapangan.** NeuroGaze mengukur respons
terhadap stimulus terstandar pada tablet tanpa jaringan. Belum ada kader yang
menjalankannya dan belum ada balita Indonesia dalam bukti, jadi manfaat di Posyandu
masih hipotesis implementasi.

**2. Artefak yang dapat diuji bersama layanan.** Laporan satu halaman membawa angka,
status mutu, dan sumber referensi. Apakah format ini membantu atau justru menambah
pekerjaan Puskesmas belum pernah diuji dengan praktisi.

**3. Penolakan yang terlihat.** Alat yang menolak mengeluarkan angka ketika rekamannya
tidak layak mencegah hal yang paling berbahaya di skrining massal: rasa aman palsu.
Attrition webcam balita yang dilaporkan ManyBabies adalah 42% (Steffan dkk. 2024).
Alat yang tidak pernah menolak adalah alat yang mengarang.

Yang dapat diklaim hari ini adalah kesiapan rekayasa ketiga mekanisme itu. Dampak pada
anak, kader, antrean, atau diagnosis belum diukur.

---

## Biaya per pemeriksaan

### Pembanding

| Instrumen | Biaya | Sumber |
|---|---|---|
| EarliPoint | USD 599 per pemeriksaan, eye-tracker khusus, di fasilitas klinis | Izin FDA 510(k) 2022, usia 16–30 bulan |
| SDIDTK / KPSP | Praktis nol, tetapi berbasis laporan dan spesifisitasnya rendah | Instrumen Kemenkes yang sudah berjalan |
| NeuroGaze | Skenario, bukan biaya teramati | Aritmetika atas asumsi yang dinyatakan |

### Rumus

Distribusi perangkat lunak statis mendekati biaya marginal nol dan tidak memakai
lisensi per kursi. Operasi tetap membutuhkan waktu kader, pelatihan, dukungan, cetak
laporan, dudukan, pengulangan, pemeliharaan, penggantian perangkat, dan tindak lanjut
klinis. Rumus berikut hanya menghitung amortisasi tablet; ia bukan total biaya layanan.

```
biaya per sesi = harga tablet / (sesi per tahun × umur pakai tahun)
```

Dengan tablet Android kelas menengah Rp 2.500.000 dan umur pakai 3 tahun:

| Pemakaian | Sesi/tahun | Sesi seumur pakai | Biaya per sesi |
|---|---:|---:|---:|
| Satu Posyandu, 5 anak per hari buka, 12 hari/tahun | 60 | 180 | **Rp 13.900** |
| Tablet dirotasi ke 4 Posyandu | 240 | 720 | **Rp 3.500** |
| Tablet dirotasi ke 8 Posyandu | 480 | 1.440 | **Rp 1.700** |

EarliPoint pada kurs asumsi Rp 16.200/USD adalah sekitar **Rp 9.700.000 per
pemeriksaan**. Nilai itu tidak sebanding langsung dengan NeuroGaze: EarliPoint adalah
alat berizin dengan protokol klinis, sedangkan angka NeuroGaze di atas hanya amortisasi
tablet untuk produk yang belum divalidasi klinis.

### Asumsi yang harus diuji, dan yang bisa membatalkan angka ini

- Umur pakai tablet 3 tahun di lingkungan Posyandu belum diuji.
- Waktu kader, pelatihan, dukungan, pencetakan, dudukan, pengulangan, pemeliharaan,
  penggantian, dan tindak lanjut klinis belum diukur atau dihitung.
- Angka 5 anak per hari buka adalah perkiraan, bukan observasi.
- Baterai 67 detik belum pernah dijalankan pada balita. Kalau toleransinya jauh lebih
  rendah dan sesi harus diulang, sesi per hari turun dan biaya per sesi naik.

Yang **tidak** berubah oleh asumsi mana pun: tidak ada biaya marginal perangkat lunak
untuk Posyandu tambahan. PWA tanpa backend, tanpa basis data, tanpa lisensi. Posyandu
ke-1 dan Posyandu ke-1.000 memakai berkas statis yang sama.

### Biaya per kasus — skenario bersyarat, bukan hasil NeuroGaze

Perbandingan biaya per *pemeriksaan* punya satu kelemahan yang juri tajam akan temukan
dalam tiga puluh detik: ia membandingkan alat bersensitivitas 17% dengan alat berizin
FDA seolah keduanya melakukan hal yang sama. Serangan itu sah, dan jawabannya adalah
menghitung metrik yang lebih keras terhadap diri sendiri lebih dulu.

Simulasi `research/hasil/gate_c_simulation.json` memakai kohort 1.000 anak,
prevalensi 1%, coverage teknis 90%, dan karakteristik operasi protokol penuh terbit.
Angka 1,53 kasus benar hanya berlaku bila titik operasi itu berhasil direplikasi pada
populasi sasaran; klip 16,75 detik yang dikirim belum memenuhinya.

| Pemakaian | Biaya per sesi | Biaya 1.000 sesi | **Biaya per kasus ditemukan** |
|---|---:|---:|---:|
| Satu Posyandu | Rp 13.900 | Rp 13,9 juta | **Rp 9,08 juta** |
| Dirotasi 4 Posyandu | Rp 3.500 | Rp 3,5 juta | **Rp 2,29 juta** |
| Dirotasi 8 Posyandu | Rp 1.700 | Rp 1,7 juta | **Rp 1,11 juta** |

Pembandingnya: EarliPoint **Rp 9,7 juta untuk satu kali pemeriksaan**, satu anak.

Jika tabel ditampilkan, kalimat panggungnya harus memuat syaratnya:

> Ini skenario perencanaan, bukan performa NeuroGaze yang teramati. Biaya per kasus baru
> dapat dibahas jika protokol penuh direplikasi, validitas balita Indonesia terukur,
> dan biaya operasi serta tindak lanjut klinis dimasukkan.

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

Gate C membutuhkan balita dengan acuan klinis independen. Pengumpulan tidak boleh
dimulai sebagai “penyebaran produk”; ia harus menjadi studi prospektif berizin etik.

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

Tabel ini hanya menghitung skala rekrutmen hipotetis. Ia bukan rencana operasional dan
tidak membuktikan bahwa 30 Posyandu, 1.200 sesi, atau 700 sesi dapat dinilai akan
tercapai.

### Yang sulit, dan tidak boleh disamarkan

Sesi tanpa acuan klinis tidak melatih apa pun. Studi yang sah memerlukan seluruh
komponen berikut, yang belum ada:

1. mitra yang mampu menjadi penanggung jawab kaji etik dan penelitian;
2. izin orang tua yang valid dan prosedur penghentian yang melindungi anak;
3. acuan klinis yang dinilai buta terhadap keluaran aplikasi;
4. linkage hasil yang menjaga identitas di luar perangkat;
5. rekrutmen yang layak dan analisis fairness serta pola kegagalan;
6. validasi prospektif sebelum pemilihan titik operasi;
7. mekanisme pengumpulan/sinkronisasi yang aman; saat ini ekspor masih manual.

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
| — | Selang kepercayaan pada persentase GeoPref | Tidak ada | **Selesai** |
| Sekarang | Kalibrasi likelihood-ratio menggantikan ambang `= 2` | Ekstraksi titik operasi dari makalah | Belum |
| Berikutnya | Blok target diketahui Gate B, dua aliran | Rig Gate B | Belum |
| Berikutnya | Unduh dan audit data terbit Cilia dkk., pasang bobot antar indeks | Tidak ada — CC BY 4.0 | Belum |
| Berikutnya | Uji protokol penuh tanpa mengaktifkan rujukan | Stimulus penuh, protokol etik | Belum |
| Berikutnya | Antrean sinkronisasi luring untuk log audit | Keputusan desain privasi | Belum |
| Gate C | Studi prospektif dengan acuan klinis buta | Kaji etik, izin orang tua, linkage privat, mitra klinis | Belum |
| Gate D | Implementasi lapangan dengan kader | Gate C lolos | Belum |

Wawancara praktisi dan uji kader belum dilakukan. Keduanya memberi bukti operasional,
bukan validasi klinis, dan tetap memerlukan akses serta persetujuan peserta yang sesuai.

Perhatikan di mana pita normatif duduk: ia turun ke Gate C, bukan karena sulit
dibangun, melainkan karena membangunnya menuntut merekam balita dan itu menuntut kaji
etik yang belum ada. Detail batas itu di [`etika_perekaman.md`](etika_perekaman.md);
rancangan yang menggantikannya di [`model_rujukan.md`](model_rujukan.md).

---

## Sumber

| Angka | Sumber |
|---|---|
| 56 bulan, 32 bulan | Tinjauan lintas negara di bagian pendahuluan makalah; bukan estimasi Indonesia |
| Attrition 42%, N=125, 16 lab | Steffan dkk. 2024, *Infancy*, usia 18–27 bulan |
| Kohort 475 balita, sens 87,8% / spec 80,8% | Perochon dkk. 2023, *Nature Medicine* |
| USD 599, FDA 510(k), usia 16–30 bulan | EarliPoint, izin 2022 |
| 1,53 kasus benar per 1.000 anak | `research/hasil/gate_c_simulation.json`, lengan `geopref_published` |
| Harga tablet, umur pakai, sesi per hari | Asumsi perencanaan, belum diukur |
