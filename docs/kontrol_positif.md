# Kontrol positif: membuktikan instrumen ini responsif

Gate A membuktikan alat ukurnya teliti. Gate B membuktikan aliran pengukurannya
sejalan dengan metode yang divalidasi orang lain. Tidak satu pun membuktikan hal
ketiga yang sebenarnya menentukan: **apakah pipeline ini dapat membedakan dua
kondisi perilaku yang berbeda.**

Kalau tidak bisa, seluruh premis produk ini runtuh — dan tanpa kontrol positif kita
baru akan tahu di Gate C, setelah melibatkan balita.

Catatan ini adalah pasangan dari kontrol negatif yang sudah ada di proyek
(kebocoran split pada `research/hasil/cnn_scanpath/audit_kebocoran_split.csv`, uji
shortcut dataset wajah pada `research/hasil/audit_wajah.json`). Prinsipnya sama
seperti garis kontrol pada alat uji: beri instrumen sinyal yang diketahui ada, lalu
periksa apakah ia merespons.

---

## Apa yang dibuktikan dan tidak dibuktikan

**Dibuktikan:** tiga sinyal keputusan di `app/src/outcome/referralRecommendation.ts`
bergerak ke arah yang benar ketika pola yang dicari benar-benar diproduksi.

**Tidak dibuktikan:** apa pun tentang autisme. Peserta adalah orang dewasa yang
memproduksi pola secara sengaja. Ini bukan sensitivitas, bukan spesifisitas, dan
bukan akurasi. Angka-angka itu baru ada di Gate C.

Ini juga bukan validasi ambang. Batas "dua sinyal menyimpang" tetap pilihan desain.

---

## Bahasa

Di dokumen, di aplikasi, dan **terutama di panggung**, kondisi kedua disebut:

> "memproduksi pola perhatian yang literatur identifikasi sebagai penanda dini"

Bukan "berpura-pura autis", bukan "memperagakan anak autis", bukan variasi apa pun
dari itu.

Alasannya dua, dan keduanya cukup sendiri-sendiri. Pertama, yang diperagakan memang
pola terukur — arah pandangan, respons isyarat, putaran kepala — bukan seseorang.
Kedua, mengkarikaturkan perilaku autistik di depan panel yang mungkin punya kaitan
personal dengan ASD akan merusak setiap hal lain yang dibangun proyek ini.

Sebutkan protokol empat butir di bawah **sebelum** sesi dimulai, supaya penonton tahu
ini prosedur tertulis, bukan improvisasi.

---

## Protokol

Tiap sesi direkam dua kali, satu per kondisi, dengan peserta dan perangkat yang sama.

### Kondisi 1 — menonton biasa

Peserta menonton baterai tanpa instruksi apa pun selain melihat layar dengan wajar.

### Kondisi 2 — pola diproduksi

Tiga butir. Tiap butir memetakan ke tepat satu sinyal keputusan.

| # | Yang dilakukan peserta | Sinyal yang disasar | Dasar arah |
|---|---|---|---|
| 1 | Selama blok pilihan tontonan, pandangan diarahkan ke panel geometrik | `geometric_preference` | Wen dkk. 2022, *Scientific Reports* 12:4253, n=1.863, usia 12–48 bulan |
| 2 | Tidak mengikuti arah mata maupun tunjukan model; pandangan tetap di tengah | `cue_following` | Paradigma responding joint attention, Billeci dkk. 2019 |
| 3 | Tidak menoleh saat nama dipanggil | `response_to_name` | Nadig dkk. 2007; Perochon dkk. 2023, *Nature Medicine* |

Di lapangan sinyal 1 selalu berstatus *tidak dapat dinilai*, karena ambang 69% ditahan
selama stimulus terbit belum tersedia. Jadi yang benar-benar dapat dinilai pada sesi
biasa hanya dua, dan aturan menuntut keduanya menyimpang. Itu memang konservatif, dan
lebih baik daripada menambah sinyal keempat yang tidak dapat ditafsirkan.

**Kedipan sengaja tidak ikut.** Versi sebelumnya memasukkan diferensial kedipan sosial
vs non-sosial sebagai butir keempat. Itu dicabut karena dua alasan yang berdiri
sendiri-sendiri: satu-satunya blok non-aktor di baterai ini adalah klip pilihan
tontonan, sehingga kontrasnya tercampur penuh dengan medium penyajian (vektor gambar
tangan lawan video nyata); dan jendela 16,75 detik mengkuantisasi laju kedip pada
kelipatan 3,6 per menit, sehingga selisihnya didominasi derau pencacahan sebelum isi
adegan sempat berpengaruh. Kedipan tetap dilaporkan sebagai angka deskriptif.

---

## Merekam dan mendaftarkan

Rekam memakai aplikasi versi yang sedang berjalan, lalu:

```bash
npm run replay:register -- <audit-log.json> --as sesi-normal-01.json
npm run replay:check
```

Pendaftar menolak log yang tidak membawa jejak frame, jadi log dari sesi replay
tidak bisa masuk tanpa disadari.

**Urutan penting:** protokol stimulus harus sudah final sebelum merekam. Rekaman
pada versi stimulus lama tidak sebanding dan harus diulang. Versi yang berlaku
tercatat di `STIMULUS_VERSION`, dan geometri AOI di `GEOPREF_AOI_VERSION`.

Perlu diketahui sebelum sesi pertama: blok pilihan tontonan **tidak bersuara**, dan itu
memang protokolnya (Moore dkk. 2018 menyatakan stimulusnya tanpa audio). Peserta tidak
perlu menunggu suara yang tidak akan datang. Sejak `neurogaze-geopref-aoi-v2.0.0`,
bingkai hitam di sekeliling panel dipangkas sehingga panelnya tampak jauh lebih besar
daripada tangkapan layar lama; itu perbaikan ukuran sudut, bukan aset yang berbeda.

---

## Yang dilaporkan

Untuk tiap sesi: kondisi, status ketiga sinyal, dan apakah aturan komposit menyala.
Ditambah pernyataan lingkup di setiap tempat angka itu muncul:

- jumlah peserta dan jumlah sesi, apa adanya;
- peserta dewasa, bukan balita;
- pola diproduksi sengaja, bukan diamati;
- hasilnya responsivitas instrumen, bukan akurasi skrining.

Kalau peserta yang terkumpul mencapai delapan orang atau lebih, regresi logistik pada
ketiga sinyal dengan GroupKFold per orang boleh dilatih dan dilaporkan berdampingan
sebagai analisis sensitivitas. Di bawah itu, jangan dilatih — laporkan kontrol
positifnya saja. Aturan transparan tetap menjadi jalur keputusan apa pun hasilnya.
