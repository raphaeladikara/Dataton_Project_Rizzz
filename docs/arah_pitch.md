# Arah pitch: apa yang dijual, apa yang tidak, dan kalimat yang tidak boleh keluar

Catatan ini menetapkan bingkai presentasi semifinal. Naskah menitnya ada di
[`pitch_7_menit.md`](pitch_7_menit.md) dan [`pitch_10_menit.md`](pitch_10_menit.md);
yang ini menjelaskan **kenapa naskah itu berbentuk begitu**, supaya siapa pun yang
menyuntingnya tahu batas mana yang boleh digeser.

Ditulis karena bingkai yang salah dapat merusak proyek yang benar. Beberapa kalimat
yang terdengar seperti pembelaan integritas justru melemahkannya, dan bedanya halus.

---

## Bingkai utama

> Kami tidak merekam balita maupun anak autistik. Bukan karena penelitian terhadap
> anak autistik tidak etis — seluruh bukti yang kami pakai lahir dari penelitian yang
> merekam anak autistik, dengan izin yang benar. Yang tidak etis adalah **kami**
> melakukannya tanpa struktur itu. Balita tidak bisa memberi persetujuan; yang
> menggantikannya adalah keputusan orang lain, dan yang mengawasi keputusan itu
> namanya kaji etik. Jadi risetnya tidak berhenti — ia pindah ke tiga sumber yang
> boleh: orang dewasa yang menyetujui untuk dirinya sendiri, data anak yang sudah
> diterbitkan orang lain dengan izin yang mereka punya, dan praktisi yang menangani
> anak-anak ini setiap hari.

Tiga hal yang dijaga bingkai ini sekaligus:

1. **Tidak menuduh siapa pun.** Wen dkk., Perochon dkk., Steffan dkk., dan Cilia dkk.
   semuanya merekam anak. Bingkai "meneliti anak autistik itu tidak etis" menuduh
   seluruh basis bukti proyek ini sekaligus, dan juri yang menyadarinya akan bertanya
   kenapa kita mengutip penelitian yang baru saja kita sebut tidak etis.
2. **Jalannya tetap terbuka.** Kalau perekaman anak pada dasarnya tidak etis, Gate C
   tidak punya masa depan dan seluruh peta jalan proyek ini omong kosong. Yang benar:
   ia menuntut struktur yang belum kami punya, dan struktur itu bisa didapat.
3. **Batasnya jadi keputusan, bukan keadaan.** "Kami tidak punya izin" terdengar
   seperti kegagalan. "Kami menolak jalan memutar yang tersedia" adalah pilihan. Yang
   kedua yang benar, dan yang kedua yang layak diceritakan.

Rincian lengkap, termasuk apa yang boleh dan tidak boleh direkam, ada di
[`etika_perekaman.md`](etika_perekaman.md).

### Kalimat yang tidak boleh keluar

| Jangan | Karena | Pakai |
|---|---|---|
| "Tidak etis menjadikan anak ASD sebagai percobaan" | Menuduh setiap studi yang kita kutip | "Merekam anak menuntut kaji etik, dan kami tidak punya" |
| "Kami berpura-pura autis" / "saya jadi ASD" | Mengarikaturkan orang, bukan mengukur pola | "Saya memproduksi pola perhatian yang literatur identifikasi sebagai penanda dini" |
| "Kami sudah mengganti ambang dengan likelihood ratio" | Belum. Rancangannya ada, kodenya belum | "Rancangan penggantinya lengkap; yang belum adalah memasangnya" |
| "Bobot model kami dipasang pada data Cilia" | Datanya belum diunduh | "Itu langkah berikutnya, dan datanya sudah terbit dengan lisensi terbuka" |
| "Lima lembaga menolak kami" **sebagai kalimat penutup** | Yang dibawa pulang juri jadi penolakan | Sebut di isi atau di tanya jawab, jangan di akhir |
| "Guru ASD memvalidasi alat kami" | Praktisi tidak menilai instrumen | "Beliau memvalidasi masalahnya, bukan alatnya" |

---

## Apa yang dijual, menurut bobot rubrik

Rubrik memberi **35% ke Impact**, **30% ke Demo dan Pitching**, dan **10% ke
Evaluation dan Responsible AI**. Naskah versi pertama membalik urutan itu: sepertiga
waktu bicara habis untuk keterbatasan dan integritas, yang bobotnya paling kecil.

Integritas proyek ini sudah terbukti dari **dua** artefak dan tidak butuh lima:

1. Penjaga out-of-distribution yang menolak model kami sendiri, di perangkat, sambil
   menyebut fitur mana yang di luar distribusi.
2. Dataset wajah dengan AUC 0,932 — angka tertinggi di proyek ini — yang dibuang, dan
   bobotnya tidak ada di repositori.

Cerita ketiga, keempat, dan kelima tidak menambah kredibilitas. Mereka memindahkan
waktu dari kolom yang bobotnya lebih besar. **Yang dipangkas bukan kejujurannya,
melainkan pengulangannya.**

### Yang harus mendapat waktu lebih banyak daripada sebelumnya

- **Kontrol positif sebagai bukti utama.** Instrumen ini merespons: nol dari sembilan
  sesi menonton biasa, pemisahan tanpa tumpang tindih pada ketiga sinyal, dan
  provenance lengkap dari kamera ke angka. Ini klaim kemampuan yang berbentuk positif.
- **Dampak, biaya, dan jalur adopsi.** Rp 13.900 versus Rp 9.700.000 per pemeriksaan,
  dan penyebaran produk sebagai mesin pengumpul datanya sendiri. Ada lengkap di
  [`dampak_dan_adopsi.md`](dampak_dan_adopsi.md) dan sebelumnya tidak muncul sama
  sekali di naskah mana pun.
- **Wawancara praktisi.** Satu-satunya riset primer di proyek ini yang menyentuh
  konteks Indonesia. Panduannya di [`wawancara_praktisi.md`](wawancara_praktisi.md).

### Yang harus mendapat waktu lebih sedikit

- **Gate A dan Gate B.** Tetap disebut, satu kalimat, sebagai pemeriksaan instrumen.
  Alasannya bukan angkanya lemah — melainkan rantai buktinya punya satu mata rantai
  yang tidak dapat diperiksa dari dalam repositori, dan memimpin dengan bukti itu
  berarti memimpin dengan satu-satunya bagian yang bisa dipertanyakan. Lihat
  [`provenance/harness_gate_a_b.md`](provenance/harness_gate_a_b.md).

---

## Bingkai bagian AI

> **Bingkai lengkapnya sekarang punya dokumen sendiri:
> [`bingkai_ai.md`](bingkai_ai.md)** — empat komponen arsitektur bergerbang beserta
> berkas buktinya, tabel degradasi temporal, dan naskah untuk menjawab "belum ada
> balita". Bagian di bawah ini adalah ringkasan alasannya.

Pertanyaan yang akan datang, dan sekarang belum terjawab di naskah mana pun:
**"AI-nya di mana?"** Faktanya setiap model di repositori ini dikarantina, ditolak,
atau belum dibangun, dan yang memutuskan di produk adalah aturan pencacahan.

Naskah lama menyebut "model terbaik kami tidak dipakai" tiga kali dan tidak pernah
sekali pun menyebut apa yang dikerjakan bagian AI-nya. Itu jujur dan sekaligus
merugikan tanpa perlu.

Yang benar untuk dikatakan:

> Bagian AI-nya bukan satu model. Ia rantai keputusan tentang model mana yang boleh
> menyentuh anak: pipeline pandangan di perangkat yang lolos uji parity Python ke
> browser, seleksi model yang menolak CNN kami sendiri lewat bootstrap berpasangan
> pada 54 partisipan yang sama, studi degradasi temporal yang menunjukkan fitur
> kinematik bergeser 69% ketika laju turun dari 26 ke 13 Hz sementara fitur geometri
> bergeser 1,6%, dan penjaga out-of-distribution yang menolak model kami di perangkat,
> saat itu juga, sambil menyebut fitur mana yang di luar distribusi.

Angka 69% berbanding 1,6% itu **satu-satunya temuan orisinal-terukur di proyek ini**
dan sebelumnya hanya muncul sebagai butir keempat di halaman `/validation`. Ia menjawab
"kenapa fitur geometri, bukan kinematik" dengan angka milik sendiri, bukan sitiran.

### Kenapa tidak ada model generatif di produk

Jawaban yang dipakai kalau ditanya:

> Kami pertimbangkan untuk membangkitkan penjelasan bagi orang tua. Kami tolak: setiap
> kalimat di laporan ini harus dapat ditelusuri ke berkas, dan model generatif tidak
> dapat menjaminnya di perangkat yang luring dan tanpa pengawasan. Jadi tempatnya
> bukan di depan orang tua — melainkan di pemeriksaan klaim kami sendiri.

---

## Bingkai inovasi

Naskah lama menyerahkan kesimpulan "tidak novel" kepada juri dengan kalimat "bukan
modelnya; kami memakai keluarga indeks SenseToKnow sebagai preseden." Jujur, dan juga
merugikan pada kriteria berbobot 10%.

Diferensiasi yang benar, dan sebelumnya tidak pernah dinamai:

- **Tanpa backend.** PWA statis. Posyandu ke-1 dan ke-1.000 memakai berkas yang sama.
  Tidak ada server, basis data, maupun biaya marginal perangkat lunak.
- **Keadaan ditahan sebagai hasil kelas satu.** Menolak mengeluarkan angka didesain
  sebagai keluaran, bukan ditangani sebagai error.
- **Arsitektur tata kelola, bukan model.** Tiga lapis yang tipe datanya sendiri
  melarang digabung, penjaga yang menolak model sendiri di perangkat, dan ambang
  terbit yang ditahan ketika protokolnya tidak cocok.

Satu kalimat:

> Yang baru di sini bukan cara mengukur tatapan — itu sudah dipecahkan Nature Medicine.
> Yang baru adalah arsitektur yang membuat alat ukur itu boleh dipegang relawan
> Posyandu tanpa mengarang satu angka pun.

---

## Batas yang tetap berlaku

Bingkai boleh berubah. Berikut tidak.

- **Tidak ada angka tanpa sumber**, dan tidak ada klaim yang tidak dapat ditunjukkan
  di layar dalam sepuluh detik.
- **Tidak ada klaim berkala lampau untuk pekerjaan yang belum dikerjakan.** Ini yang
  paling mudah dilanggar tanpa sengaja saat menulis naskah, dan pelanggarannya merusak
  premis proyek lebih parah daripada sepuluh keterbatasan yang diakui.
- **Mode demonstrasi selalu disebut ketika dipakai.** Bannernya tercetak di laporan;
  penyaji tetap menyebutkannya dengan suara.
- **Hasil negatif tidak pernah dibacakan sebagai aman**, di panggung maupun di layar.
- **Rekaman disebut kondisinya**, bukan nomornya. Tombol peragaan sekarang memuat
  label kondisi tiap rekaman justru supaya penyaji tidak dapat keliru menyebut yang
  satu sebagai yang lain.
