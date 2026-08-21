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
> memutuskan apakah keluaran model layak dibaca untuk sesi yang sedang berjalan.

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

### 2. Seleksi model dan bukti domain sumber

Data Carette memberi bukti konsep participant-grouped pada 54 anak usia sekolah di
Prancis dengan eye-tracker 250 Hz. Ia tidak memiliki uji eksternal dan bukan validasi
klinis NeuroGaze. CNN mencapai AUC 0,882 dan regresi logistik 13 fitur 0,823; selisih
berpasangan tidak dapat dibedakan dari nol (ΔAUC 0,059, CI95 [−0,007, +0,137],
p = 0,087) dan korelasi prediksinya 0,93. Kontrak masukan CNN juga tidak dapat dipenuhi
kamera 30 fps. Karena itu tidak ada model Carette yang menggerakkan keputusan.

`research/hasil/perbandingan_model.json`

### 3. Studi degradasi temporal

**Ini angka milik kami sendiri, bukan sitiran, dan sekarang belum pernah dipamerkan.**

Pertanyaannya: kamera tablet Posyandu berjalan 26 fps dan kadang lebih lambat. Kalau
laju cuplik turun, keluarga fitur mana yang masih bisa dipercaya?

Kami desimasi 27 sesi berpasangan Gate B yang membawa stempel waktu sungguhan, lalu
ukur pergeserannya:

| Laju | Fitur kinematik | Fitur geometri |
|---|---:|---:|
| 26 Hz → 13 Hz | **median drift relatif 69,4%** | **median drift relatif 1,6%** |

> Pada 27 sesi, penurunan laju dari sekitar 26 ke 13 Hz menghasilkan median drift
> relatif 69,4 persen untuk fitur kinematik dan 1,6 persen untuk fitur geometri. Ini
> bukan perbandingan akurasi klasifikasi. Hasilnya mendukung keluarga geometri, tetapi
> beberapa fiturnya tetap memiliki pelestarian peringkat lemah atau drift besar pada
> laju yang lebih rendah.

`research/hasil/degradasi_temporal.json` · 27 sesi, aliran (x, y, t) nyata

### 4. Tata kelola dan penolakan

Model regresi logistik **dikirim ke tablet dan dijalankan setiap sesi.** Lalu penjaga
memutuskan apakah keluarannya boleh dibaca.

Di layar laporan, saat ini juga:

```
PUTUSAN PENJAGA    Ditolak · 3 fitur ditandai · cakupan 100%
KELUARAN MODEL     ditahan
JARAK TERJAUH      9,1 z · Mahalanobis 87,9
```

> Model Carette berjalan hanya untuk panel riset. Penjaga menolaknya pada sesi sekarang
> dan menyebut fitur yang berada di luar distribusi. Hasilnya tidak pernah masuk ke
> keputusan, dan indeks lapis B tidak pernah digabung: `combinedScore` tetap `null`.

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

Jawab dengan kesiapan yang sudah diuji dan pekerjaan yang masih nyata.

> Betul, belum ada balita di data kami. Yang sudah diuji adalah rantai rekayasa pada
> orang dewasa, bukan skrining klinis.
>
> Yang sudah berdiri dan sudah terbukti jalan: kamera ke landmark, landmark ke
> pandangan terkalibrasi, pandangan ke fitur, fitur ke model, model ke penjaga,
> penjaga ke laporan — dan seluruh rantai itu punya log audit yang bisa diekspor dan
> diputar ulang. Kami membuktikannya bukan dengan diagram, melainkan dengan merekam
> 23 sesi lewat aplikasi yang sama, lalu **menghitung ulang angkanya dari jejak mentah
> dengan skrip terpisah** dan mendapat angka yang sama.
>
> Gate C tetap membutuhkan lebih dari label: mitra yang mampu menjalankan kaji etik,
> izin orang tua, acuan klinis buta, linkage data yang menjaga privasi, rekrutmen,
> analisis fairness dan kegagalan, serta validasi prospektif sebelum titik operasi
> dipilih.

Permintaan mitranya: satu tim klinis/etik, satu koordinator Posyandu, dan protokol
bersama untuk uji keterpakaian kader serta studi Gate C. Pengumpulan data dilakukan
sebagai penelitian prospektif, bukan sebagai penyebaran produk terselubung.

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
