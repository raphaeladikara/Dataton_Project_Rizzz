# Bingkai AI: apa yang dijual, dan kalimat yang dipakai

Catatan ini menggantikan cara lama menjawab **"AI-nya di mana?"**. Naskah lama
menjawabnya dengan tiga kali menyebut "model terbaik kami tidak dipakai", yang jujur
sekaligus merugikan pada kriteria berbobot 10%.

Semua yang ada di sini terpasang di repositori dan bisa ditunjukkan di layar dalam
sepuluh detik. Tidak ada yang perlu dikarang.

---

## Kalimat pembuka

Satu kalimat, dan ini yang harus keluar sebelum apa pun:

> Kami tidak membangun satu model yang menebak autisme. Kami membangun **arsitektur
> inferensi bergerbang** — sistem yang menjalankan modelnya di perangkat, lalu
> memutuskan sendiri apakah keluaran model itu layak dibaca untuk anak yang sedang
> duduk di depannya.

Kalau hanya satu kalimat yang boleh diingat juri, itu kalimatnya.

Kenapa ini bukan basa-basi: hampir semua ML yang dikerahkan ke lapangan berasumsi
bahwa data yang masuk mirip data latihnya. Ketika asumsi itu salah, modelnya tetap
mengeluarkan angka — dengan percaya diri, dan tanpa memberi tahu siapa pun. Di
skrining kesehatan anak, itu bukan bug kecil. Itu rasa aman palsu yang diberikan
kepada orang tua.

Neurogaze memasang gerbang di tempat itu.

---

## Empat komponen yang membentuk klaim ini

Pakai empat kotak ini sebagai satu slide arsitektur. Masing-masing punya berkas
buktinya.

### 1. Pipeline pandangan di perangkat, lolos uji parity

Ekstraksi fitur berjalan dua kali di dua runtime berbeda — Python untuk riset,
TypeScript di browser untuk produk — dan hasilnya diuji identik. Tanpa ini, angka di
makalah dan angka di tablet adalah dua sistem yang kebetulan bernama sama.

> Fitur yang kami evaluasi di riset dan fitur yang dihitung tablet itu berkas yang
> sama, diuji berpasangan. Bukan reimplementasi yang mirip.

`research/export_parity_fixture.py`

### 2. Studi degradasi temporal — temuan orisinal kami

**Ini angka milik kami sendiri, bukan sitiran, dan sekarang belum pernah dipamerkan.**

Pertanyaannya: kamera tablet Posyandu berjalan 26 fps dan kadang lebih lambat. Kalau
laju cuplik turun, keluarga fitur mana yang masih bisa dipercaya?

Kami desimasi 27 sesi berpasangan Gate B yang membawa stempel waktu sungguhan, lalu
ukur pergeserannya:

| Laju | Fitur kinematik | Fitur geometri |
|---|---:|---:|
| 26 Hz → 13 Hz | **bergeser 69%** | **bergeser 1,6%** |

> Kami tidak memilih fitur geometri karena lebih mudah. Kami mengukurnya. Ketika laju
> kamera turun separuh — yang di Posyandu bukan kemungkinan, melainkan hari Selasa —
> fitur kinematik bergeser 69 persen dan fitur geometri bergeser 1,6 persen. Itu
> selisih empat puluh kali lipat, dan itu yang menentukan arsitekturnya.

`research/hasil/degradasi_temporal.json` · 27 sesi, aliran (x, y, t) nyata

**Ini slide yang paling kurang dimanfaatkan di seluruh proyek.** Ia menjawab
"kenapa desain kalian begini" dengan pengukuran sendiri, dan tidak ada tim lain yang
akan punya angka seperti ini.

### 3. Seleksi model yang membunuh model kami sendiri

CNN kami ber-AUC 0,882. Regresi logistik 13 fitur ber-AUC 0,823. Yang menang: yang
lebih rendah.

Bootstrap berpasangan terstratifikasi, 10.000 replikasi, pada 54 partisipan yang sama:

- ΔAUC = 0,059, CI95 **[−0,007, +0,137]**, p = 0,087 → tidak dapat dibedakan dari nol
- Korelasi prediksi = **0,93** → CNN menemukan sinyal yang sama, bukan sinyal tambahan

> Selisihnya tidak lolos uji, dan prediksinya berkorelasi 0,93 — jadi CNN kami bukan
> model yang lebih pintar, ia model yang lebih rumit untuk sinyal yang sama.

`research/hasil/perbandingan_model.json`

### 4. Penjaga out-of-distribution — dan ini yang paling jarang ada di produk mana pun

Model regresi logistik **dikirim ke tablet dan dijalankan setiap sesi.** Lalu penjaga
memutuskan apakah keluarannya boleh dibaca.

Di layar laporan, saat ini juga:

```
PUTUSAN PENJAGA    Ditolak · 3 fitur ditandai · cakupan 100%
KELUARAN MODEL     ditahan
JARAK TERJAUH      9,1 z · Mahalanobis 87,9
```

> Ini bukan tangkapan layar yang kami siapkan. Ini yang aplikasi cetak setiap sesi.
> Modelnya jalan, penjaganya menolak, dan ia menyebutkan **fitur mana** yang di luar
> distribusi beserta jaraknya. Kami tidak menyembunyikan model yang tidak layak — kami
> menjalankannya di depan kalian dan menunjukkan sistem menangkapnya.

`app/src/quality/ood.ts`

---

## Dua mekanisme tambahan kalau ada waktu

**Ambang terhadap selang kepercayaan, bukan terhadap satu angka.** Ambang 69%
dibandingkan dengan selang kepercayaan 95% sesi. Sesi yang mengukur 71% dengan selang
62–79 berstatus *tidak dapat dinilai*, bukan *positif*. Efeknya terukur: seseorang
yang preferensinya persis di ambang memicu aturan lama separuh waktu, aturan sekarang
lima persen. `docs/ambang_selang_kepercayaan.md`

**Pemisahan lajur di tingkat tipe.** `combinedScore` bernilai `null` dan tidak ada
jalur kode yang dapat mengisinya. Menggabungkan lajur berambang-terbit dengan lajur
deskriptif bukan hal yang kami janjikan tidak akan dilakukan — itu hal yang **tidak
dapat dikompilasi**. Tata kelola yang dijaga type checker, bukan dijaga niat baik.

---

## Menjawab "belum ada balita" tanpa kehilangan poin

Ini pertanyaan yang pasti datang. Jawaban lama menghabiskan waktu untuk menjelaskan
apa yang tidak kami punya. Jawaban baru menjelaskan apa yang sudah siap.

> Betul, belum ada balita di data kami, dan itu keputusan yang kami ambil sadar-sadar.
> Tapi perhatikan apa yang sebenarnya sedang ditanyakan: yang belum kami punya itu
> **label**, bukan sistemnya.
>
> Yang sudah berdiri dan sudah terbukti jalan: kamera ke landmark, landmark ke
> pandangan terkalibrasi, pandangan ke fitur, fitur ke model, model ke penjaga,
> penjaga ke laporan — dan seluruh rantai itu punya log audit yang bisa diekspor dan
> diputar ulang. Kami membuktikannya bukan dengan diagram, melainkan dengan merekam
> 23 sesi lewat aplikasi yang sama, lalu **menghitung ulang angkanya dari jejak mentah
> dengan skrip terpisah** dan mendapat angka yang sama.
>
> Jadi yang kami bawa ke Gate C bukan prototipe yang harus dibangun ulang. Ini
> instrumen yang sudah terpasang dan sudah terinstrumentasi, menunggu satu hal:
> label klinis. Begitu satu mitra berizin etik ada, hari pertama pengumpulan data
> adalah hari pertama pelatihan — bukan hari pertama rekayasa.

Kalimat yang menutupnya:

> Sebagian besar tim di ruangan ini punya model tanpa jalur ke lapangan. Kami punya
> jalur ke lapangan yang sudah jalan, menunggu modelnya. Dari dua masalah itu, yang
> kedua yang bisa diselesaikan dengan satu tanda tangan.

---

## Kenapa penyebarannya adalah mesin pengumpul datanya sendiri

Lanjutkan langsung dari kalimat di atas — ini yang mengubah "belum ada data" dari
kelemahan menjadi rencana:

> Tiga puluh Posyandu selama satu tahun menghasilkan sekitar **700 sesi balita yang
> dapat dinilai**. Kohort yang dipakai Nature Medicine untuk SenseToKnow berisi 475.
> Artinya alat ini, dalam setahun penyebaran biasa, mengumpulkan data lebih banyak
> daripada studi yang jadi acuan kami — dan mengumpulkannya di populasi yang belum
> pernah ada instrumennya.

`docs/dampak_dan_adopsi.md`

---

## Kenapa tidak ada model generatif

> Kami pertimbangkan untuk membangkitkan penjelasan bagi orang tua, lalu tolak. Setiap
> kalimat di laporan ini harus bisa ditelusuri ke berkas, dan model generatif tidak
> bisa menjaminnya di perangkat luring tanpa pengawasan. Jadi tempatnya bukan di depan
> orang tua — melainkan di pemeriksaan klaim kami sendiri.

---

## Batas yang tetap berlaku

Bingkai boleh dipertajam. Berikut tidak boleh dilanggar, dan bukan karena kesopanan —
karena melanggarnya membuat proyek ini bisa dijatuhkan dengan satu pertanyaan.

- **Tidak ada klaim berkala lampau untuk pekerjaan yang belum dikerjakan.** "Rancangan
  penggantinya lengkap" benar. "Kami sudah mengganti ambang dengan likelihood ratio"
  tidak.
- **Tidak ada angka sensitivitas, spesifisitas, atau akurasi yang diklaim milik kami.**
  Setiap angka jenis itu di naskah adalah milik studi lain, dan disebut pemiliknya.
- **Mode demonstrasi selalu disebut dengan suara ketika dipakai**, bukan hanya tercetak
  di banner.
- **Hasil negatif tidak pernah dibacakan sebagai aman.**
- **Kontrol positif tidak pernah disebut sebagai bukti alat ini mendeteksi autisme.**
  Ia bukti rantai kamera-ke-angka utuh. Itu klaim yang berbeda, dan itu klaim yang
  benar.
