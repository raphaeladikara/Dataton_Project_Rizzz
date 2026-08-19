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

**Kontrol positif adalah fondasi, bukan puncak.** Ia uji validitas, bukan prosedur
pelatihan, dan tidak ada jalur dari sepuluh orang dewasa yang memperagakan pola menuju
bobot yang bisa dipelajari. Modelnya datang dari tempat lain —
[`model_rujukan.md`](model_rujukan.md) — dan kontrol positif adalah yang menentukan
apakah model itu pantas dihubungkan ke keluaran sesi sama sekali.

---

## Sudah dijalankan

Direkam 19 Agustus 2026: 12 peserta di tiga perangkat, 23 rekaman berbeda, 15 lolos
kriteria mutu. **Instrumen ini merespons.** Kedua sinyal memisahkan kedua kondisi
tanpa satu pun sesi bertumpang tindih, dan aturan komposit — dalam mode demonstrasi —
menyala pada 4 dari 6 sesi pola-diproduksi dan **0 dari 9** sesi menonton-biasa.

Angka lengkapnya, confound-nya, dan cara menjalankan ulang analisisnya:
[`research/hasil/kontrol_positif/README.md`](../research/hasil/kontrol_positif/README.md).

Catatan ini tetap ditulis sebagai instruksi menjalankan sesi, karena perekaman
berikutnya akan menjalankannya lagi. Yang berubah sesudah putaran pertama ada di
[Yang ditemukan perekaman pertama](#yang-ditemukan-perekaman-pertama) di bawah, dan
sebagian di antaranya mengubah apa yang harus diperiksa sebelum sesi dimulai.

---

## Apa yang dibuktikan dan tidak dibuktikan

**Dibuktikan:** sinyal keputusan di `app/src/outcome/referralRecommendation.ts`
bergerak ke arah yang benar ketika pola yang dicari benar-benar diproduksi.

**Sejak v2, sinyalnya dua, bukan tiga.** Respons nama dikarantina: paradigma terbitnya
memanggil dari belakang anak dan mengkode putaran kepala, sedangkan speaker tablet
menaruh suaranya di depan tempat tidak ada arah yang harus dicari. Speaker di belakang
peserta memulihkannya di lab tetapi tidak realistis di meja Posyandu, jadi sinyal itu
tidak dapat dikumpulkan sebagaimana ia divalidasi. Ia tetap dilaporkan sebagai indeks
deskriptif. Kontrol positif ini karenanya membuktikan **dua** sinyal, dan itu harus
disebut apa adanya.

**Tidak dibuktikan:** apa pun tentang autisme. Peserta adalah orang dewasa yang
memproduksi pola secara sengaja. Ini bukan sensitivitas, bukan spesifisitas, dan
bukan akurasi. Angka-angka itu baru ada di Gate C.

**Juga tidak dihasilkan:** model. Sepuluh peserta yang mengikuti naskah tidak
menghasilkan bobot yang bisa dipelajari, dan melatih apa pun pada data akting akan
menghasilkan model yang mempelajari naskahnya. Kalau kontrol positif adalah
satu-satunya yang dikerjakan, produknya berhenti sebagai alat dokumentasi — persis
keadaan yang ingin dikeluarkan darinya.

Ini juga bukan validasi ambang. Batas "dua sinyal menyimpang" tetap pilihan desain
sampai ada balita berlabel.

Yang dihasilkan adalah satu kalimat yang sekarang belum bisa diucapkan sama sekali:
*"aturan komposit menyala pada N dari M sesi pola-diproduksi dan pada K dari M sesi
menonton-biasa."* Itu bukan akurasi klinis, tapi itu bukti responsivitas — dan
responsivitas adalah prasyarat yang belum dipenuhi proyek ini.

---

## Kenapa peserta harus dewasa

Pertanyaan yang wajar: kalau yang diukur adalah pola perhatian balita, kenapa yang
direkam orang dewasa?

Jawabannya bukan kepraktisan. Merekam balita menuntut kaji etik yang menyahkan
persetujuan orang tua, dan lima lembaga yang dihubungi untuk itu seluruhnya menolak.
Pada tahap bukti hari ini, penolakan itu keputusan yang benar dari pihak mereka.
Merekam anak dengan ASD menuntut lebih dari itu lagi — kelompok rentan, perekrutan yang
diawasi, dan alasan yang berdiri sendiri kenapa anak itu yang harus menanggung beban
penelitiannya.

Orang dewasa memberi persetujuan untuk dirinya sendiri, mengerti apa yang direkam, dan
boleh mencabutnya. Itu satu-satunya konfigurasi yang sah yang tersedia bagi proyek ini
hari ini, dan kontrol positif dirancang untuk muat di dalamnya alih-alih meminta
perkecualian.

Batas lengkapnya, apa yang sudah dicoba, dan apa yang harus ada sebelum batas itu
bergeser: [`etika_perekaman.md`](etika_perekaman.md). Baca sebelum sesi pertama, karena
di situlah jawaban untuk pertanyaan juri yang hampir pasti datang.

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

Sebutkan protokol dua butir di bawah **sebelum** sesi dimulai, supaya penonton tahu
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

**Kenapa respons nama dikarantina.** Yang diukur `response_to_name` bukan "bereaksi
terhadap suara", melainkan **berorientasi ke arah orang yang memanggil dari luar bidang
pandang** — Perochon dkk. 2023 menulisnya lugas: *"their name was called three times by an
examiner standing behind them"*, dan yang dikode adalah putaran kepala dari facial
landmark. Kalau suara keluar dari tablet, ia datang dari tempat yang sedang ditatap
peserta, dan selama fase itu layar menampilkan wajah tokoh vektor — jadi yang "memanggil"
tampak ada di layar. Respons yang benar berubah menjadi *tetap menatap layar*, yang tidak
bisa dibedakan dari tidak merespons sama sekali.

Dua sesi uji membuktikan keduanya. Dengan suara dari tablet, `|yaw|` maksimum sepanjang
1.585 frame hanya 0,118 terhadap ambang tolehan 0,28 — tidak satu frame pun mendekat.
Dengan speaker kabel di belakang kursi, tolehannya kembali muncul (maksimum 1,572, empat
belas frame melewati ambang). Paradigmanya memang pulih.

Tetapi speaker di belakang peserta tidak realistis di meja Posyandu, dan memvalidasi
sinyal pada konfigurasi yang tidak akan pernah dipakai kader berarti membuktikan sesuatu
yang produknya tidak bisa lakukan. Karena itu sinyal ini **dikarantina**: tetap direkam,
tetap dilaporkan sebagai indeks deskriptif, dan tidak masuk aturan komposit. Daftar
karantina beserta alasannya ada di `QUARANTINED_SIGNALS`.

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

## Dua mode panggilan nama

Modenya dideklarasikan di layar persetujuan, bukan ditebak dari ada-tidaknya nama.

| | Speaker tidak dicentang | Speaker dicentang |
|---|---|---|
| Kolom nama | tidak muncul | muncul, wajib diisi |
| Panggilan saat sesi | tidak dibunyikan sama sekali | dibunyikan tiga kali |
| Indeks respons nama | tidak terukur | terukur, masuk log sebagai `gaze.responseToName` |
| Kolom `sinyal_nama` | `tidak_dipakai` | `dikarantina (n/m)` |
| Masuk aturan komposit | tidak | **tetap tidak** |

Fase panggilan nama tetap berjalan 13 detik di kedua mode. Menghapusnya akan mengubah
baterai dan membuat rekaman ini tidak sebanding dengan yang sudah ada.

Baris terakhir tabel yang paling penting: mode speaker menentukan **apakah indeksnya
dikumpulkan**, bukan apakah ia dihitung. Speaker di belakang adalah konfigurasi lab, dan
memvalidasi sinyal pada rig yang tidak akan dipakai kader tetap tidak sah — jadi
sinyalnya dikarantina di kedua mode. Mode speaker ada supaya indeksnya bisa dikumpulkan
untuk keperluan lain, dan supaya log menyebut sendiri rig mana yang dipakai.

Log mencatat modenya sebagai `positiveControl.speakerBehind`. `npm run kp:check` menolak
log yang menyatakan speaker dipakai tetapi tidak memuat panggilan, dan sebaliknya.

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

Dua butir. Tiap butir memetakan ke tepat satu sinyal keputusan yang masih dihitung.

| # | Yang dilakukan peserta | Sinyal yang disasar | Dasar arah |
|---|---|---|---|
| 1 | Selama blok pilihan tontonan, pandangan diarahkan ke panel geometrik | `geometric_preference` | Wen dkk. 2022, *Scientific Reports* 12:4253, n=1.863, usia 12–48 bulan |
| 2 | Tidak mengikuti arah mata maupun tunjukan model; pandangan tetap di tengah | `cue_following` | Paradigma responding joint attention, Billeci dkk. 2019 |

Naskah instruksi yang dibacakan utuh sebelum kondisi 2, tanpa improvisasi:

> "Sesi kedua ini kamu memproduksi dua pola secara sengaja. Satu: waktu ada dua
> panel bersebelahan, pandangi terus panel yang isinya bentuk-bentuk geometris
> bergerak, jangan panel yang isinya orang. Dua: setelah itu akan muncul tokoh yang
> melihat atau menunjuk ke kiri atau ke kanan — jangan ikuti; tahan pandangan di
> tengah layar. Tetap menghadap layar sepanjang sesi."

**Tetap menghadap layar** harus disebut. Kalau peserta menunduk atau memalingkan wajah,
indeks menghadap-ke-depan ikut jatuh dan gerbang mutu bisa menahan sesinya.

Nama peserta tetap akan dipanggil selama sesi — fase itu bagian dari baterai 80 detik
dan tidak dihapus. Peserta tidak diberi instruksi apa pun tentangnya, di kedua kondisi,
karena sinyalnya dikarantina dan hanya dicatat sebagai angka deskriptif.

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
2. **Masuk lewat Gate A.** Topbar → **Panduan & demo** → gulir ke bawah → **Mulai Gate A
   sekarang**. Bukan tombol "Mulai observasi kamera" di beranda: jalur itu meminta usia
   16–30 bulan dan peserta dewasa tidak bisa melewatinya tanpa mengarang angka yang lalu
   ikut masuk ke log. Jangan lewat Demo cepat — jalur itu tidak menghasilkan jejak frame.
3. **Isi metadata sesi:**
   - Identitas: `KP-03` (kode peserta, bukan nama)
   - Jenis sesi: pilih **Kontrol positif · kondisi 1** atau **kondisi 2** sesuai yang
     sedang direkam. Pilihan ini yang menentukan nama berkas unduhan dan yang membuat
     layar intro berhenti menyebut tugas apa pun.
   - Percobaan ke-: `1`, naik hanya kalau percobaan sebelumnya ditahan
   - Lokasi: `Lab` atau nama ruangan; nilai ini juga masuk sebagai `deviceId`
   - Operator: inisial
   - Jarak mata–layar: `500` (atau angka yang benar-benar diukur)
   - **Pakai speaker di belakang peserta:** biarkan **tidak dicentang** untuk protokol
     Posyandu yang realistis. Kolom nama panggilan baru muncul kalau dicentang.
   - Nama panggilan peserta: hanya kalau speaker dipakai, dan kalau begitu wajib diisi.
     Kolomnya tidak disimpan, tidak masuk log, dan hilang saat sesi selesai.
4. **Persetujuan** dicentang sesuai yang sudah disampaikan lisan.
5. **Kalibrasi.** Peserta mengikuti titik yang berpindah. Kalau aplikasi menolak
   dengan `CALIBRATION_STABILITY`, `CALIBRATION_COVERAGE`, atau `CALIBRATION_RANGE_*`,
   perbaiki penyebab yang disebut pesannya lalu ulangi. **Jangan lanjut dengan
   kalibrasi yang lolos paksa** — galat kalibrasi masuk ke seluruh angka sesudahnya.
6. **Bacakan instruksi kondisi** persis seperti naskah di atas, lalu diam.
7. **Jalankan baterai 80 detik.** Operator tidak bicara, tidak menunjuk layar, tidak
   berdiri di sisi kiri atau kanan peserta. Berdirilah di belakang tablet.
8. **Laporan muncul.** Catat isinya ke lembar sesi (kolomnya di bawah).
9. **Unduh log audit.** Tombol **Unduh log audit JSON** di bawah laporan. Karena sesi ini
   ditandai kontrol positif, berkasnya sudah turun dengan nama yang benar —
   `kp-03-biasa-1.json` — jadi tidak ada yang perlu diganti namanya.
10. **Periksa berkasnya sebelum difilekan.**

    ```bash
    cd app && npm run kp:check -- ~/Downloads/kp-03-biasa-1.json
    ```

    Ia menolak sesi yang tidak layak, memperingatkan yang mencurigakan, dan mencetak baris
    `lembar_sesi.csv` siap tempel sehingga tidak ada angka yang disalin dengan tangan.
    **Jalankan ini pada sesi pertama hari itu**, supaya sesi yang di bawah batas mutu
    ketahuan sebelum delapan orang terlanjur direkam.
11. **Pindahkan** berkasnya ke `research/hasil/kontrol_positif/sesi/`, lalu tempel barisnya
    ke `lembar_sesi.csv`.

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
`produksi`. Huruf kecil semua, tanpa spasi. Nama ini dibentuk aplikasi dari kolom yang
diisi di layar persetujuan, bukan diketik operator — dan kondisi yang sama juga tersimpan
di dalam berkasnya sebagai `positiveControl`, sehingga berkas yang tertukar namanya masih
bisa dikembalikan ke kondisi yang benar.

Kolom `sinyal_*`, `komposit_menyala`, dan `outcome` di lembar sesi tersedia dua tempat:
di panel **Respons instrumen · kontrol positif** pada laporan, dan di dalam log sebagai
`assessment.positiveControl`. Kalau keduanya berbeda, yang benar adalah log.

**Sesi yang ditahan tetap disimpan dan tetap dihitung.** Attrition adalah data, dan
proyek ini sudah mengutip attrition webcam balita 42% dari Steffan dkk. 2024. Kalau
kontrol positif punya attrition 0% karena yang gagal dibuang, angkanya bohong.

---

## Kriteria mutu satu sesi

Sesi dipakai untuk analisis kalau seluruhnya terpenuhi:

- Galat kalibrasi ≤ 3,0°
- Laju frame valid ≥ 0,85
- Dropout gaze ≤ 0,20
- **Pandangan menempel di tepi layar ≤ 25%** — kriteria ini tidak ada di putaran
  pertama karena tidak ada yang mengukurnya, dan ia yang menahan delapan dari 23
  rekaman. Kalibrasi yang memetakan sesi ke luar layar membuat setiap AOI tidak
  mungkin terkena, sementara sesinya tetap terbaca bersih di kolom lain
- Gerbang validitas sesi tidak menolak fase mana pun
- Kondisi 2: peserta benar-benar menjalankan kedua butir (penilaian operator, dicatat
  sebagai kolom terpisah — kalau operator ragu, tandai dan jangan diam-diam pakai)

Maksimal **tiga percobaan** per peserta per kondisi. Kalau tiga-tiganya gagal, catat
peserta itu sebagai tidak dapat dinilai dan lanjut. Memaksa sampai berhasil mengubah
kontrol positif menjadi seleksi hasil.

---

## Lembar sesi

`research/hasil/kontrol_positif/lembar_sesi.csv`, satu baris per percobaan:

```csv
peserta,kondisi,percobaan,perangkat,berkas,galat_kalibrasi_deg,laju_frame_valid,dropout,outcome,sinyal_geopref,sinyal_isyarat,sinyal_nama,komposit_menyala,butir_dijalankan,catatan
KP-01,biasa,1,tab-a,kp-01-biasa-1.json,2.10,0.94,0.06,MEASURED_PROTOCOL_ABBREVIATED,tidak_dapat_dinilai,normal,dikarantina,tidak,-,
KP-01,produksi,1,tab-a,kp-01-produksi-1.json,2.35,0.92,0.08,MEASURED_PROTOCOL_ABBREVIATED,tidak_dapat_dinilai,menyimpang,dikarantina,tidak,2/2,geopref ditahan protokol dipersingkat
KP-02,biasa,1,tab-a,kp-02-biasa-1.json,4.80,0.61,0.34,WITHHELD,-,-,dikarantina,-,-,cahaya jendela di belakang peserta
KP-02,biasa,2,tab-a,kp-02-biasa-2.json,2.02,0.95,0.05,MEASURED_PROTOCOL_ABBREVIATED,tidak_dapat_dinilai,normal,dikarantina,tidak,-,tirai ditutup
```

Kolom `sinyal_*` disalin apa adanya dari lajur rekomendasi di laporan. Kolom
`butir_dijalankan` hanya untuk kondisi `produksi`, dan sekarang di luar dua, bukan tiga. Kolom `sinyal_nama` selalu berisi `dikarantina`.

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

Untuk tiap sesi: kondisi, status kedua sinyal yang dihitung, indeks respons nama sebagai angka deskriptif, dan apakah aturan komposit menyala.
Ditambah pernyataan lingkup di setiap tempat angka itu muncul:

- jumlah peserta dan jumlah sesi, apa adanya, termasuk yang ditahan;
- peserta dewasa, bukan balita;
- pola diproduksi sengaja, bukan diamati;
- hasilnya responsivitas instrumen, bukan akurasi skrining.

Tabel yang naik ke panggung, dari perekaman 19 Agustus 2026:

| | Aturan komposit menyala | Tidak menyala |
|---|---:|---:|
| Menonton biasa | **0** | 9 |
| Pola diproduksi | **4** | 2 |

Baris atas kolom kiri adalah yang penting, dan ia nol. Kalau suatu saat ia tidak nol,
aturannya terlalu longgar dan angkanya harus diterbitkan apa adanya — itu temuan,
bukan kegagalan. Yang tidak boleh terjadi adalah tabel ini tidak pernah dibuat.

**Tabel itu mode demonstrasi, dan itu harus disebut setiap kali ia ditampilkan.**
Aturan sebagaimana dikirim tidak menyala pada kondisi mana pun dan tidak akan pernah
bisa: ia menuntut dua sinyal menyimpang, dan preferensi geometrik berstatus
`tidak_dapat_dinilai` selama klip lebih pendek daripada protokol tempat ambang 69%
diturunkan. Tabel di atas menerapkan ambang itu pada klip pendek semata supaya
pertanyaan "apakah aturannya merespons" punya jawaban. Ia bukan rujukan.

Dua sesi produksi yang tidak menyala gagal pada prasyarat perhatian, bukan pada
perilakunya — tidak ada bukti pesertanya sedang menatap model saat isyarat
disampaikan, jadi sinyal isyaratnya ditahan. Tidak mengikuti dan tidak pernah melihat
adalah dua klaim berbeda.

Peserta melewati delapan orang, jadi regresi logistik dengan GroupKFold dilatih dan
dilaporkan berdampingan sebagai analisis sensitivitas: AUC luar-lipatan 1,00 pada 13
sesi dengan **perangkat** sebagai grup, bukan orang — karena identitas peserta tidak
terekam. Aturan transparan tetap menjadi jalur keputusan, dan bobot yang dipasang pada
orang dewasa yang mengikuti naskah mempelajari naskahnya.

---

## Yang ditemukan perekaman pertama

Kontrol positif dirancang untuk menguji instrumennya. Ia melakukannya, dan yang
ditemukannya bukan hanya bahwa instrumen itu merespons: sembilan cacat muncul, dan
tidak satu pun sempat terlihat sebagai galat pada saat perekaman. Sesinya tampak
bersih, lolos setiap gerbang, dan tidak melaporkan apa-apa.

Enam pertama datang dari rekamannya. Tiga terakhir baru muncul ketika rekaman nyata
pertama didaftarkan ke jalur demo — sesuatu yang tidak pernah bisa dilakukan sebelum
kontrol positif ada, karena tidak ada rekaman nyata untuk didaftarkan.

Semuanya sudah diperbaiki dan bertes regresi. Empat yang pertama saling berkaitan
lewat satu baris kode.

**1. Proyeksi kalibrasi dijepit ke dalam layar di sumbernya.** `applyCalibration`
mengembalikan koordinat yang sudah di-`clamp` ke [0, 1], sehingga tiga penjaga yang
berbeda memeriksa angka yang sudah tidak bisa melanggar batas: galat kalibrasi diukur
terhadap target yang selalu di dalam layar, jadi prediksi yang dijepit tampak lebih
dekat daripada yang sebenarnya; `offScreenRate` menghitung sampel di luar [0, 1] dan
karenanya tidak pernah menghitung satu pun, membuat `OFF_SCREEN_DOMINANT` tidak
terjangkau; dan `rejectedBounds` bernilai 0 di seluruh 24 rekaman. Sesi yang
kalibrasinya melempar 57% baterainya ke atas layar tidak bisa dibedakan dari sesi
yang jatuh tepat di panel.

**2. `DOES_NOT_FOLLOW` tidak pernah bisa dicapai.** Peserta yang tidak pernah masuk ke
AOI target mendapat lift = 0 di setiap percobaan, karena tatapan pra-isyarat dan
pasca-isyaratnya sama-sama nol. Uji tanda membaca itu sebagai seri lalu menyebutnya
tidak dapat dinilai — sehingga non-following terkuat yang mungkin, orang yang menonton
model lalu tidak bergerak ke mana pun, justru satu-satunya pola yang tidak bisa
dilaporkan aturannya. Dua belas dari dua belas sesi produksi mendarat di sana.
Kriteria lantai yang menggantikannya menuntut bukti perhatian: peserta harus terlihat
menatap model saat isyarat disampaikan, di mayoritas percobaan.

**3. `sessionId` dicetak di layar persetujuan, bukan per rekaman.** Operator yang
menjalankan baterai lagi tanpa kembali melewati persetujuan menghasilkan rekaman kedua
yang membawa `sessionId` dan `createdAt` rekaman pertama. Lima tabrakan seperti itu ada
di himpunan ini, dan dua berkas adalah rekaman yang sama diunduh dua kali — dari
lognya saja, tidak bisa dibedakan dari dua rekaman dua orang.

**4. Kedua skema counterbalancing di-key ke kolom identitas.** `geoprefLayout` dan
`sessionStimulusPhases` sama-sama membaca `profile.childId`, meskipun docstring
keduanya menyebut session id. Kolom itu diisi `GA-20260819-01` di 22 dari 24 berkas,
jadi **panel geometrik ada di kanan pada seluruh 24 sesi dan urutan isyaratnya identik
pada seluruhnya.** Preferensi geometrik dan kebiasaan melirik ke kanan tidak terpisah
di data itu, dan tidak ada perbaikan kode yang bisa menyembuhkan rekaman yang sudah
ada — confound itu terbit bersama angkanya.

**5. Dua nilai dibaca dari state di dalam fungsi yang baru saja mengubahnya.**
Skoring geopref di `runStimulus` membaca `stageAspect` dan kunci counterbalance dari
state React, padahal fungsi yang sama menuliskannya beberapa ratus baris di atas — jadi
yang terbaca adalah nilai render sebelumnya: sisi panel rekaman sebelumnya, dan pada
run pertama, nilai awal state alih-alih rasio panggung tempat klip benar-benar
di-letterbox. Panel laporan dan log audit bisa menyebut angka berbeda untuk sesi yang
sama.

**6. Empat berkas tidak bertanda kontrol positif.** Direkam sebelum jenis sesi dipilih
di layar persetujuan, jadi `kp:check` menolaknya dan kondisinya hanya bisa diambil dari
nama folder operator.

### Tiga lagi, dari jalur demo

Sebelum ini "Demo cepat" memutar lintasan Lissajous sintetis yang memang di luar
distribusi, jadi laporannya selalu ditahan dan tidak ada satu pun jalankan yang pernah
membawa angka nyata. Mendaftarkan dua rekaman kontrol positif membuka tiga hal
sekaligus.

**7. Penjaga OOD model warisan menahan seluruh laporan.** Penjaga itu dibangun untuk
memutuskan apakah keluaran model Carette boleh dibaca. Bendera-benderanya diumpankan ke
gerbang mutu, sehingga ia memutuskan hal yang sama sekali lain: apakah sesinya layak
dilaporkan sama sekali. Rekaman nyata pertama yang didaftarkan kembali sebagai kegagalan
kamera — sambil menampilkan kalimat "rekaman cukup baik untuk dianalisis" di panel yang
sama. Penjaga sekarang menggerbangi inferensi model yang memang miliknya, dan tidak lebih;
skor modelnya tetap ditahan, termasuk di log audit.

**8. Angka yang menganimasi naik dari nol berhenti di nol.** `requestAnimationFrame` tidak
berjalan di tab tersembunyi, jadi laporan yang dibuka lalu ditinggalkan di latar merender
setiap indeks sebagai 0 dan bertahan di sana. Untuk angka seperti "0% waktu pada pola
geometrik" itu bukan nilai yang jelas hilang, melainkan nilai yang masuk akal — dan
judulnya menyebut 19% di tampilan yang sama.

**9. Replay mengundi ulang sisi panelnya.** Kunci counterbalance dicetak baru tiap
jalankan, termasuk saat memutar rekaman. Akibatnya rekaman yang sama kembali sebagai 81%
geometrik pada satu jalankan dan 19% pada jalankan berikutnya — komplemennya, dari
menghitung panel yang satunya. Replay sekarang mewarisi kunci rekamannya.

### Yang berubah karena itu

- `npm run kp:check` sekarang menolak berkas yang tidak dapat dibedakan satu sama lain,
  dan memperingatkan log yang tidak mencatat saturasi maupun penugasan counterbalance.
  Jalankan pada **seluruh** berkas hari itu sekaligus, bukan satu per satu — duplikat
  tidak terlihat dari satu berkas.
- Log sekarang membawa `gaze.counterbalance`: sisi panel, urutan isyarat, dan kunci
  yang menurunkannya. Penugasannya dapat diperiksa dari berkas, bukan direkonstruksi
  dari source pada versi yang menghasilkannya.
- Kriteria mutu bertambah satu, dan ia yang paling banyak menahan sesi.
- Demo cepat memutar rekaman nyata dan merender laporan berisi angka nyata. Skor model
  warisan tetap ditahan penjaga OOD, sebagaimana seharusnya.
- **Isi kolom identitas dengan kode peserta yang berbeda untuk tiap orang.** Ini bukan
  lagi soal kerapian arsip: kolom itu tidak lagi menentukan counterbalancing, tapi ia
  tetap satu-satunya tempat identitas peserta tercatat, dan tanpanya tidak ada analisis
  berpasangan dan tidak ada GroupKFold per orang.

---

## Sesudah kontrol positif

Kontrol positif tidak membuka ambang GeoPref, tidak menghasilkan sensitivitas, dan
tidak menghasilkan model. Yang dibukanya adalah **hak** aturan komposit untuk berhenti
menjadi panel deskriptif dan menjadi lajur rujukan yang sebenarnya.

Hak itu berbeda dari isinya. Isi lajur rujukan datang dari dua lapis yang dikerjakan
secara paralel dan tidak menuntut satu rekaman anak pun:

| Lapis | Menggantikan | Sumbernya |
|---|---|---|
| Kalibrasi likelihood-ratio | `REFERRAL_DEVIANT_THRESHOLD = 2` | Titik operasi terbit; sinyal tanpa titik operasi ber-LR = 1 |
| Bobot antar sinyal | Pencacahan setara antar sinyal | 59 anak berlabel dari data terbit CC BY 4.0 (Cilia dkk. 2022) |

Rancangan lengkapnya di [`model_rujukan.md`](model_rujukan.md); urutan pengerjaan dan
kriteria promosinya di [`jalur_rujukan.md`](jalur_rujukan.md).

Urutannya penting dan tidak boleh dibalik: **instrumen yang tidak merespons tidak
pantas mengeluarkan rujukan, seberapa pun rapi kalibrasinya.** Kalau kontrol positif
gagal memenuhi kriteria promosi, lajur komposit tetap deskriptif meskipun bobotnya
sudah terpasang dengan baik.
