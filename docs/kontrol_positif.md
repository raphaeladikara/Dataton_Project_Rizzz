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

Jalur dari kontrol positif menuju produk yang mengeluarkan rujukan ada di
[`jalur_rujukan.md`](jalur_rujukan.md). Baca itu dulu kalau yang ingin diketahui
adalah *kenapa ini penting*; catatan ini menjawab *bagaimana menjalankannya*.

---

## Apa yang dibuktikan dan tidak dibuktikan

**Dibuktikan:** tiga sinyal keputusan di `app/src/outcome/referralRecommendation.ts`
bergerak ke arah yang benar ketika pola yang dicari benar-benar diproduksi.

**Tidak dibuktikan:** apa pun tentang autisme. Peserta adalah orang dewasa yang
memproduksi pola secara sengaja. Ini bukan sensitivitas, bukan spesifisitas, dan
bukan akurasi. Angka-angka itu baru ada di Gate C.

Ini juga bukan validasi ambang. Batas "dua sinyal menyimpang" tetap pilihan desain
sampai ada balita berlabel.

Yang dihasilkan adalah satu kalimat yang sekarang belum bisa diucapkan sama sekali:
*"aturan komposit menyala pada N dari M sesi pola-diproduksi dan pada K dari M sesi
menonton-biasa."* Itu bukan akurasi klinis, tapi itu bukti responsivitas — dan
responsivitas adalah prasyarat yang belum dipenuhi proyek ini.

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

Sebutkan protokol tiga butir di bawah **sebelum** sesi dimulai, supaya penonton tahu
ini prosedur tertulis, bukan improvisasi.

---

## Yang perlu disiapkan

| Item | Spesifikasi | Catatan |
|---|---|---|
| Perangkat | Tablet Android kelas menengah, kamera depan ≥26 fps | Satu peserta harus memakai perangkat yang sama untuk kedua kondisinya |
| Dudukan | Stand tablet atau tumpukan buku | Tablet tidak boleh dipegang; getaran tangan masuk ke jejak pose |
| Jarak | 500 mm mata–layar, diukur sekali dengan meteran | Angka yang sama dimasukkan ke kolom jarak pandang di aplikasi |
| Tinggi | Pusat layar sejajar mata peserta | Kalau layar terlalu rendah, rentang vertikal kalibrasi gagal |
| Cahaya | Ruangan terang merata, tanpa jendela di belakang peserta | Backlight membuat iris tidak terbaca |
| Peserta | 8–10 orang dewasa | Di bawah 8, jangan latih model apa pun; laporkan kontrol positifnya saja |
| Browser | Chrome/Edge di `localhost` atau HTTPS | Kamera tidak jalan di HTTP non-lokal |
| Waktu | ~12 menit per peserta untuk dua kondisi | 8 peserta ≈ satu setengah jam kerja |

**Prasyarat versi.** Protokol stimulus harus sudah final sebelum perekaman pertama.
Rekaman pada versi stimulus lama tidak sebanding dan harus diulang. Catat
`STIMULUS_VERSION` dan `GEOPREF_AOI_VERSION` yang berlaku di lembar sesi, dan jangan
menyentuh `app/src/stimulus/protocol.ts` sampai seluruh perekaman selesai.

---

## Persetujuan peserta

Peserta adalah orang dewasa, jadi ini sederhana, tapi tetap harus ada. Sebelum sesi,
sampaikan lisan dan catat persetujuannya di lembar sesi:

- Yang direkam adalah **koordinat pandangan dan sudut kepala**, bukan video. Video
  tidak pernah meninggalkan perangkat dan tidak pernah disimpan.
- Berkas hasilnya akan dipublikasikan di repositori publik.
- Identitas diganti kode (`KP-03`), bukan nama.
- Peserta boleh berhenti kapan saja, dan boleh meminta berkasnya dihapus setelahnya.

Isi kolom identitas di aplikasi dengan **kode peserta, bukan nama**. Kolom itu masuk
ke `profile.childId` di log audit, dan log audit akan di-commit.

---

## Protokol

Tiap peserta direkam dua kali, satu per kondisi, dengan perangkat yang sama.

**Urutan tidak boleh dibalik: kondisi 1 selalu lebih dulu.** Instruksi kondisi 2
tidak bisa ditarik kembali. Peserta yang sudah tahu bahwa isyarat arah sedang diukur
akan menonton berbeda pada kondisi 1, dan kondisi "menonton biasa"-nya tidak lagi
biasa. Ini satu-satunya tempat di proyek ini yang urutannya sengaja tidak
diseimbangkan, dan alasannya ditulis di sini supaya tidak dikira kelalaian.

### Kondisi 1 — menonton biasa

Satu-satunya instruksi:

> "Duduk santai, lihat layar dengan wajar. Tidak ada jawaban benar atau salah, dan
> tidak ada yang perlu dicari. Kalau ada suara, tanggapi sewajarnya saja."

Jangan menyebut isyarat arah, jangan menyebut panggilan nama, jangan menyebut panel
mana yang menarik. Operator diam sepanjang 80 detik.

### Kondisi 2 — pola diproduksi

Tiga butir. Tiap butir memetakan ke tepat satu sinyal keputusan.

| # | Yang dilakukan peserta | Sinyal yang disasar | Dasar arah |
|---|---|---|---|
| 1 | Selama blok pilihan tontonan, pandangan diarahkan ke panel geometrik | `geometric_preference` | Wen dkk. 2022, *Scientific Reports* 12:4253, n=1.863, usia 12–48 bulan |
| 2 | Tidak mengikuti arah mata maupun tunjukan model; pandangan tetap di tengah | `cue_following` | Paradigma responding joint attention, Billeci dkk. 2019 |
| 3 | Tidak menoleh saat nama dipanggil | `response_to_name` | Nadig dkk. 2007; Perochon dkk. 2023, *Nature Medicine* |

Naskah instruksi yang dibacakan utuh sebelum kondisi 2, tanpa improvisasi:

> "Sesi kedua ini kamu memproduksi tiga pola secara sengaja. Satu: waktu ada dua
> panel bersebelahan, pandangi terus panel yang isinya bentuk-bentuk geometris
> bergerak, jangan panel yang isinya orang. Dua: setelah itu akan muncul tokoh yang
> melihat atau menunjuk ke kiri atau ke kanan — jangan ikuti; tahan pandangan di
> tengah layar. Tiga: kalau ada suara memanggil nama, jangan menoleh. Tetap
> menghadap layar sepanjang sesi."

Butir ketiga punya jebakan yang harus disebut: **tetap menghadap layar.** Kalau
peserta menunduk atau memalingkan wajah untuk "menghindari" panggilan, indeks
menghadap-ke-depan ikut jatuh dan gerbang mutu bisa menahan sesinya. Yang diminta
adalah tidak *menoleh ke arah suara*, bukan menghilang dari kamera.

**Kedipan sengaja tidak ikut.** Versi sebelumnya memasukkan diferensial kedipan sosial
vs non-sosial sebagai butir keempat. Itu dicabut karena dua alasan yang berdiri
sendiri-sendiri: satu-satunya blok non-aktor di baterai ini adalah klip pilihan
tontonan, sehingga kontrasnya tercampur penuh dengan medium penyajian (vektor gambar
tangan lawan video nyata); dan jendela 16,75 detik mengkuantisasi laju kedip pada
kelipatan 3,6 per menit, sehingga selisihnya didominasi derau pencacahan sebelum isi
adegan sempat berpengaruh. Kedipan tetap dilaporkan sebagai angka deskriptif.

---

## Menjalankan satu sesi

Langkah demi langkah. Sekali hafal, satu sesi memakan ~6 menit.

1. **Jalankan aplikasi.** `cd app && npm run dev`, buka `http://localhost:3000` di
   tablet (satu jaringan, pakai alamat Network yang dicetak Next.js) atau langsung di
   perangkat uji.
2. **Mulai observasi kamera** dari beranda. Jangan lewat Demo cepat — jalur itu tidak
   menghasilkan jejak frame.
3. **Isi metadata sesi:**
   - Identitas: `KP-03` (kode peserta, bukan nama)
   - Usia: kosongkan, atau isi usia peserta dalam bulan kalau ingin lengkap
   - Lokasi: `Lab` atau nama ruangan
   - Operator: inisial
   - Jarak mata–layar: `500` (atau angka yang benar-benar diukur)
   - Tujuan sesi: pilih yang bukan demo, supaya log membawa `purpose` yang benar
4. **Persetujuan** dicentang sesuai yang sudah disampaikan lisan.
5. **Kalibrasi.** Peserta mengikuti titik yang berpindah. Kalau aplikasi menolak
   dengan `CALIBRATION_STABILITY`, `CALIBRATION_COVERAGE`, atau `CALIBRATION_RANGE_*`,
   perbaiki penyebab yang disebut pesannya lalu ulangi. **Jangan lanjut dengan
   kalibrasi yang lolos paksa** — galat kalibrasi masuk ke seluruh angka sesudahnya.
6. **Bacakan instruksi kondisi** persis seperti naskah di atas, lalu diam.
7. **Jalankan baterai 80 detik.** Operator tidak bicara, tidak menunjuk layar, tidak
   berdiri di sisi kiri atau kanan peserta. Berdirilah di belakang tablet.
8. **Laporan muncul.** Catat isinya ke lembar sesi (kolomnya di bawah).
9. **Unduh log audit.** Tombol unduh di panel teknis laporan. Berkasnya turun sebagai
   `neurogaze-audit-KP-03-<8 hex>.json`.
10. **Ganti nama dan simpan** sesuai konvensi di bawah.

Antara kondisi 1 dan 2, beri jeda ~1 menit dan kalibrasi ulang. Kalibrasi tidak
diwariskan antar sesi.

---

## Yang direkam, dan kenapa aman disimpan

Log audit **tidak memuat video dan tidak memuat landmark wajah**. Yang ada di dalamnya:

| Isi | Contoh | Sensitif? |
|---|---|---|
| `profile.childId`, `site`, `operator` | `KP-03`, `Lab`, `RA` | Tidak, kalau diisi kode |
| `points` | koordinat pandangan ternormalisasi + fase + epok | Tidak |
| `frames` | `yaw`, `pitch`, `rollDeg`, `eyeOpen`, `faceDetected` per frame | Tidak |
| `calibration`, `quality`, `device` | galat, laju frame valid, kecerahan | Tidak |
| `environment.userAgent` | string browser dan perangkat | Ringan — sidik jari perangkat, bukan orang |
| `events` | jejak waktu tahapan sesi | Tidak |

Karena itu berkas ini **boleh di-commit ke repositori publik**, dan memang sebaiknya
begitu: itu satu-satunya cara bukti kontrol positifnya bisa diperiksa orang lain.
Syaratnya kolom identitas diisi kode, bukan nama — dan itu tanggung jawab operator
saat mengisi formulir, bukan sesuatu yang bisa dibersihkan sesudahnya.

Nama panggilan yang dipakai untuk speech synthesis hidup di sebuah ref dan tidak
pernah masuk ke `profile`, log audit, maupun disk. Untuk kontrol positif, isi kolom
itu dengan nama panggilan peserta yang sebenarnya — supaya panggilan namanya terdengar
wajar — dan jangan khawatir: ia tidak ikut ke berkas.

---

## Penamaan dan penyimpanan

```
research/hasil/kontrol_positif/
├── README.md                       ← ringkasan hasil, ditulis setelah selesai
├── lembar_sesi.csv                 ← satu baris per sesi, termasuk yang gagal
├── sesi/
│   ├── kp-01-biasa-1.json
│   ├── kp-01-produksi-1.json
│   ├── kp-02-biasa-1.json
│   ├── kp-02-biasa-2.json          ← percobaan kedua setelah yang pertama ditahan
│   ├── kp-02-produksi-1.json
│   └── …
└── ringkasan.json                  ← dihasilkan skrip analisis, bukan diketik
```

Pola nama: `kp-<peserta>-<kondisi>-<percobaan>.json`, dengan kondisi `biasa` atau
`produksi`. Huruf kecil semua, tanpa spasi.

**Sesi yang ditahan tetap disimpan dan tetap dihitung.** Attrition adalah data, dan
proyek ini sudah mengutip attrition webcam balita 42% dari Steffan dkk. 2024. Kalau
kontrol positif punya attrition 0% karena yang gagal dibuang, angkanya bohong.

---

## Kriteria mutu satu sesi

Sesi dipakai untuk analisis kalau seluruhnya terpenuhi:

- Galat kalibrasi ≤ 3,0°
- Laju frame valid ≥ 0,85
- Dropout gaze ≤ 0,20
- Gerbang validitas sesi tidak menolak fase mana pun
- Kondisi 2: peserta benar-benar menjalankan ketiga butir (penilaian operator, dicatat
  sebagai kolom terpisah — kalau operator ragu, tandai dan jangan diam-diam pakai)

Maksimal **tiga percobaan** per peserta per kondisi. Kalau tiga-tiganya gagal, catat
peserta itu sebagai tidak dapat dinilai dan lanjut. Memaksa sampai berhasil mengubah
kontrol positif menjadi seleksi hasil.

---

## Lembar sesi

`research/hasil/kontrol_positif/lembar_sesi.csv`, satu baris per percobaan:

```csv
peserta,kondisi,percobaan,perangkat,berkas,galat_kalibrasi_deg,laju_frame_valid,dropout,outcome,sinyal_geopref,sinyal_isyarat,sinyal_nama,komposit_menyala,butir_dijalankan,catatan
KP-01,biasa,1,tab-a,kp-01-biasa-1.json,2.10,0.94,0.06,MEASURED_PROTOCOL_ABBREVIATED,tidak_dapat_dinilai,normal,normal,tidak,-,
KP-01,produksi,1,tab-a,kp-01-produksi-1.json,2.35,0.92,0.08,MEASURED_PROTOCOL_ABBREVIATED,tidak_dapat_dinilai,menyimpang,menyimpang,ya,3/3,
KP-02,biasa,1,tab-a,kp-02-biasa-1.json,4.80,0.61,0.34,WITHHELD,-,-,-,-,-,cahaya jendela di belakang peserta
KP-02,biasa,2,tab-a,kp-02-biasa-2.json,2.02,0.95,0.05,MEASURED_PROTOCOL_ABBREVIATED,tidak_dapat_dinilai,normal,normal,tidak,-,tirai ditutup
```

Kolom `sinyal_*` disalin apa adanya dari lajur rekomendasi di laporan. Kolom
`butir_dijalankan` hanya untuk kondisi `produksi`.

---

## Mendaftarkan rekaman untuk demo

Dua berkas masuk ke jalur demo: satu sesi `biasa` yang lolos mutu, dan satu sesi
`produksi` yang lolos mutu, keduanya sebaiknya dari peserta yang sama.

```bash
cd app
npm run replay:register -- ../research/hasil/kontrol_positif/sesi/kp-01-biasa-1.json --as sesi-biasa.json
npm run replay:register -- ../research/hasil/kontrol_positif/sesi/kp-01-produksi-1.json --as sesi-produksi.json
npm run replay:check
```

Pendaftar menolak log yang tidak membawa jejak frame, jadi log dari sesi replay tidak
bisa masuk tanpa disadari. `replay:check` membaca ulang setiap berkas yang terdaftar,
jadi entri rusak gagal di sini dan bukan di depan juri.

Sesudah ini, **Demo cepat berhenti memakai titik sintetis**. Lintasan Lissajous di
`app/src/replay/scenarios.ts` memang benar-benar di luar distribusi, penjaga OOD
menolaknya, dan laporannya ditahan — itu perilaku yang benar, tapi artinya sebelum
pendaftaran tidak ada satu pun cara menampilkan laporan berisi angka nyata.

Perlu diketahui sebelum sesi pertama: blok pilihan tontonan **tidak bersuara**, dan itu
memang protokolnya (Moore dkk. 2018 menyatakan stimulusnya tanpa audio). Peserta tidak
perlu menunggu suara yang tidak akan datang. Sejak `neurogaze-geopref-aoi-v2.0.0`,
bingkai hitam di sekeliling panel dipangkas sehingga panelnya tampak jauh lebih besar
daripada tangkapan layar lama; itu perbaikan ukuran sudut, bukan aset yang berbeda.

---

## Yang dilaporkan

Untuk tiap sesi: kondisi, status ketiga sinyal, dan apakah aturan komposit menyala.
Ditambah pernyataan lingkup di setiap tempat angka itu muncul:

- jumlah peserta dan jumlah sesi, apa adanya, termasuk yang ditahan;
- peserta dewasa, bukan balita;
- pola diproduksi sengaja, bukan diamati;
- hasilnya responsivitas instrumen, bukan akurasi skrining.

Bentuk akhir yang dituju adalah tabel sesederhana ini, dan tabel ini yang naik ke
panggung:

| | Aturan komposit menyala | Tidak menyala |
|---|---:|---:|
| Menonton biasa | 0 | 8 |
| Pola diproduksi | 7 | 1 |

Baris atas adalah yang penting. Kalau kolom kiri baris atas tidak nol, aturannya
terlalu longgar dan angkanya harus diterbitkan apa adanya — itu temuan, bukan
kegagalan. Yang tidak boleh terjadi adalah tabel ini tidak pernah dibuat.

Kalau peserta yang terkumpul mencapai delapan orang atau lebih, regresi logistik pada
ketiga sinyal dengan GroupKFold per orang boleh dilatih dan dilaporkan berdampingan
sebagai analisis sensitivitas. Di bawah itu, jangan dilatih — laporkan kontrol
positifnya saja. Aturan transparan tetap menjadi jalur keputusan apa pun hasilnya.

---

## Sesudah kontrol positif

Kontrol positif tidak membuka ambang GeoPref dan tidak menghasilkan sensitivitas.
Yang dibukanya adalah hak aturan komposit untuk berhenti menjadi panel deskriptif dan
menjadi lajur rujukan yang sebenarnya. Kriteria promosinya, dan apa yang harus
dikerjakan sesudahnya, ada di [`jalur_rujukan.md`](jalur_rujukan.md).
