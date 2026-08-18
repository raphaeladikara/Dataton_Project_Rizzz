# Keputusan ilmiah

Catatan ini merekam alasan di balik pilihan-pilihan yang menentukan apa yang boleh
dan tidak boleh dikatakan aplikasi ini. Ia ditulis supaya penguji, juri, atau
pengembang berikutnya bisa menilai argumennya, bukan hanya hasilnya.

Terakhir diperbarui: 18 Agustus 2026.

---

## 1. Kenapa model Carette diturunkan dari jalur keputusan

Regresi logistik yang dilatih pada dataset scanpath Carette dkk. adalah dasar
seluruh bukti evaluasi di paper: AUC tingkat partisipan 0,823 dengan pemisahan
per partisipan, kalibrasi Platt yang hanya melihat skor OOF, dan parity Python ↔
TypeScript pada 1e-12. Ia tetap ada di repo. Ia tidak boleh memutuskan apa pun
tentang seorang anak.

Alasannya berlapis, dan yang paling menentukan bukan yang paling sering disebut:

1. **Fiturnya mengkodekan tata letak stimulus asal.** Fitur geometri seperti
   `centroid_x`, `span_y`, dan `bbox_fill` dihitung dari raster scanpath. Nilainya
   menggambarkan di mana konten stimulus penelitian itu berada di layar. Stimulus
   NeuroGaze berbeda, jadi batas keputusannya tidak berpindah — bahkan seandainya
   usia dan perangkatnya sama.
2. **Usia.** Rata-rata partisipan Carette 7,88 tahun. Sasaran NeuroGaze 16–30
   bulan. Pola scanpath pada dua rentang usia ini bukan besaran yang sama.
3. **Perangkat dan laju sampel.** Sumbernya eye-tracker 250 Hz; sasarannya kamera
   depan tablet ~30 fps.

Konsekuensi di kode: model dijalankan hanya untuk mengisi panel riset, dan penjaga
OOD menolaknya pada data balita. Penolakan itu ditampilkan, bukan disembunyikan.
`app/src/inference/model.ts` memvalidasi ekspor model, dan `app/tests/parity.test.ts`
menjaga kesetaraan numerik lintas bahasa.

## 2. Kenapa GeoPref boleh menjadi satu-satunya pemicu rujukan

Ambang 69% fiksasi geometrik berasal dari Wen dkk. 2022 (*Scientific Reports*,
n=1.863, usia 12–48 bulan, sensitivitas 17%, spesifisitas 98%, PPV 81%, NPV 65%).
Empat hal membuatnya bisa dipindahkan ke sini, dan ketiganya harus benar sekaligus:

- **Usia sasarannya persis sama.** Bukan ekstrapolasi dari anak usia sekolah.
- **Stimulusnya jenis yang sama**: dua panel berdampingan, satu sosial dan satu
  geometrik, dengan perbandingan waktu tatap sebagai keluarannya.
- **Ambangnya eksternal.** Ia tidak di-fit pada data kami, jadi tidak ada
  kebocoran optimisme dari pemilihan ambang sendiri.
- **Tuntutan pengukurannya rendah.** Ia hanya perlu membedakan dua AOI besar di
  kiri dan kanan layar, bukan menentukan titik fiksasi presisi tinggi. Galat
  median Gate A 2,36° jauh lebih kecil daripada lebar panelnya.

## 3. Apa yang GeoPref tidak bisa lakukan

Sensitivitasnya 17%. Alat ini melewatkan sebagian besar anak autistik — bukan
karena implementasinya buruk, tetapi karena preferensi geometrik kuat hanya muncul
pada sebagian subtipe. NPV-nya 65%, artinya hasil di bawah ambang hampir tidak
mengubah keyakinan apa pun.

Karena itu hasil di bawah ambang tidak boleh dibaca sebagai kabar baik. Aturannya
ditegakkan tiga lapis: tipe (`reassures: false` di `app/src/outcome/sessionOutcome.ts`),
salinan teks di layar, dan tes kontrak. Melemahkan salah satunya berarti melanggar
keputusan ini.

## 4. Kenapa indeks multi-lapis tidak digabung menjadi satu skor

Lapisan B (menghadap layar, gerak kepala, laju kedip, respons nama, mengikuti
isyarat) meniru keluarga indeks SenseToKnow (Perochon dkk. 2023, *Nature Medicine*,
AUC 0,90, sensitivitas 87,8%, spesifisitas 80,8%). Preseden itu mencapai angka
tersebut dengan menggabungkan indeks memakai bobot yang di-fit pada balita
berlabel. Kami tidak punya balita berlabel.

Menggabungkan tanpa bobot yang di-fit berarti mengarang. Karena itu
`PhenotypeProfile.combinedScore` bertipe `null` dan `combinationRuleStatus` adalah
literal: kode menolak keberadaan skor gabungan sampai Gate C menyediakan datanya.

## 5. Dua titik kerja model, bukan satu

Ekspor model sebelumnya hanya memuat titik sensitivitas 0,9. Spesifisitasnya di
titik itu 0,179 — pada prevalensi 1% ia merujuk 82% antrean. Sekarang keduanya
diekspor (`decision.operating_points`) dan bawaannya Youden (0,4985 → sensitivitas
0,731 / spesifisitas 0,821). Simulasi Gate C empat lengan menunjukkan biaya tiap
titik berdampingan; lihat `research/hasil/gate_c_simulation.json`.

## 6. Status protokol GeoPref hari ini

Ambang 69% sudah diterapkan pada **dua tes yang berbeda**, dan keduanya tidak berbagi
preseden. Ini harus dipisah, karena mencampurnya berarti menempelkan bukti satu tes ke
pengukuran tes lain:

| Tes | Durasi | Preseden |
|---|---|---|
| GeoPref asli | 62,22 detik | Wen dkk. 2022, *Scientific Reports* 12:4253, n=1.863, usia 12–48 bulan, sens 17%, spec 98% |
| Complex Social GeoPref | 90 detik | Moore dkk. 2018, ambang dibawa apa adanya demi konsistensi, sens 18%, spec 97%, AUC 0,74, sampel jauh lebih kecil |
| Cuplikan yang berjalan | 16,75 detik | tidak ada |

Yang berjalan bukan salah satu dari dua tes itu, melainkan **cuplikan satu dari lima
adegan** video contoh Complex Social yang terbit sebagai Additional file 2 milik Moore
dkk. Karena itu `validatedProtocol` bernilai `false` dan ambangnya **ditahan**: sesi
melaporkan persentase terukur dan menyatakan protokolnya dipersingkat. Tiap aset di
`app/src/geopref/stimulusMeta.ts` membawa `precedent`-nya sendiri, sehingga angka Wen
dkk. tidak dapat menempel pada sesi Complex Social maupun sebaliknya.

Dua sifat aset yang sering disalahartikan sebagai cacat, dan keduanya disengaja:

**Klipnya bisu.** Metode Moore dkk. menyatakan stimulusnya tidak memuat audio, dan
kedua varian GeoPref disajikan tanpa suara. Pemeriksaan kontainer mengonfirmasi berkas
ini memang tidak punya trek audio sama sekali — bukan trek yang di-*mute*. Menambahkan
suara berarti menyimpang dari protokol.

**Klipnya berbingkai hitam.** Panel sosial dan geometrik hanya menempati 19,8 persen
luas bingkai 640×360; sisanya hitam, karena berkas ini ilustrasi suplemen, bukan master
presentasi. Ditampilkan utuh, tiap panel menyubtensi sekitar 7,6° × 4,9° pada tablet
sasaran, berbanding 12,9° × 9,1° yang dilaporkan Moore dkk. Aplikasi karena itu
memangkas kotak hitamnya. Pemangkasan tidak mengubah satu piksel konten dan
mengembalikan ukuran sudut ke sekitar 12,6° × 8,2°. `geoprefPanelDegrees()` membuat
klaim itu dapat diperiksa per perangkat, bukan menjadi komentar yang tidak pernah
diuji ulang.

Sebelum ini, komentar di kode menyatakan panelnya "cocok dengan persegi 525×363 pada
1920×1080 yang dipakai Wen dkk." Layar yang dipakai Wen dkk. adalah Tobii T120
beresolusi **1280×1024**, bukan 1920×1080, sehingga dua AOI-nya menempati 29,1 persen
luas layar, bukan 27,3 persen. Angka itu sudah dikoreksi.

## 7. Kenapa Gate B dibandingkan dengan WebGazer, dan apa artinya

WebGazer.js dipilih sebagai pembanding karena itulah metode yang divalidasi
ManyBabies untuk balita 18–27 bulan (Steffan dkk. 2024, *Infancy*, N=125, 16 lab).
Perbandingan dua aliran hanya menghasilkan *kesepakatan*, bukan akurasi: dua
penaksir bisa sepakat sambil sama-sama meleset. Karena itu:

- Akurasi absolut hanya boleh dikutip dari blok target diketahui Gate A
  (median 2,36°, p90 3,58°, 94 sesi dewasa).
- Kesepakatan AOI 99,7% tidak dipajang sebagai headline: kotak AOI selebar 28%
  layar sementara galat antar aliran 4,1% lebar layar, jadi angka setinggi itu
  nyaris tidak bisa tidak terjadi.
- ICC(A,1) rata-rata 0,505 dilaporkan apa adanya, dengan catatan bahwa ICC adalah
  rasio varians: saat semua peserta menonton stimulus yang sama, varians
  antar-peserta kecil dan ICC ikut turun meski selisih absolutnya kecil. Batas
  kesepakatan Bland-Altman adalah metrik utamanya.

## 8. Rekomputasi Gate B dan selisih yang ditemukan

`research/recompute_gate_b.py` menghitung ulang metrik terbit dari koordinat
mentah. Jarak tereproduksi sampai 0,001 px. Kesepakatan AOI tidak: pada 4 dari 27
pasangan, satu sampel jatuh tepat di luar kotak AOI menurut `neurogaze-aoi-v3.1.0`
padahal saat perekaman dihitung sepakat. Harness perekamnya tidak ada di repo ini,
sehingga selisih itu tidak bisa ditelusuri ke sumbernya. Ia diterbitkan di
`gate_b_summary.json` alih-alih didamaikan, dan angka yang dikutip adalah hasil
rekomputasi (0,997118, bukan 0,997574).

## 9. Yang masih belum dijawab

- Belum ada satu pun balita dalam bukti mana pun di repo ini.
- Tidak ada instrumen di sini yang divalidasi di Indonesia.
- Toleransi balita terhadap baterai 96 detik belum diuji.
- Spesifisitas SenseToKnow berbeda antar kelompok ras pada studi aslinya (53,6%
  pada anak kulit hitam vs 82,7% kulit putih). Analisis subgrup harus
  dipra-registrasi untuk Gate C. GeoPref dilaporkan setara lintas ras.

---

## 10. Kenapa lapisan rekomendasi boleh dibangun tanpa balita berlabel

Keputusan §4 melarang skor gabungan berbobot, dan larangan itu tetap berlaku:
`PhenotypeProfile.combinedScore` masih bertipe `null` dan tidak ada jalur kode yang
dapat mengisinya. Yang dibangun di `app/src/outcome/referralRecommendation.ts` bukan
skor, melainkan **aturan yang dapat dibaca manusia**, dan perbedaannya menentukan.

Perochon dkk. mencapai performa gabungannya dengan bobot yang di-fit pada 475 balita
berlabel. Bobot itu tidak dapat direkonstruksi dari AUC yang mereka laporkan, jadi
menebaknya berarti mengarang. Jalan keluarnya bukan menebak bobot, melainkan
**memilih hanya sinyal yang dapat dinilai tanpa norma populasi**:

| Sinyal | Kenapa tidak butuh norma balita |
|---|---|
| Preferensi geometrik | Ambangnya terbit dan eksternal (Wen dkk. 2022) |
| Mengikuti isyarat | Kontras dalam-subjek: sesudah isyarat vs sebelum isyarat, anak yang sama |
| Diferensial kedipan | Kontras dalam-subjek: fase aktor vs blok pilihan tontonan |
| Respons nama | Deteksi peristiwa dalam-subjek pada tiga panggilan |

`facingForward` dan `headMovement` sengaja **tidak** masuk keputusan. Keduanya membawa
AUC preseden tetapi tidak punya ambang terbit yang dapat dipindahkan, jadi
memasukkannya berarti mengarang angka. Keduanya tetap tampil sebagai deskriptif.

Satu parameter tetap merupakan karangan kami: berapa sinyal harus menyimpang.
`REFERRAL_DEVIANT_THRESHOLD` bernilai 2, ditandai `design_choice_not_validated_cutoff`
di tipe datanya, dan dinyatakan sebagai pilihan desain di layar maupun di cetakan.
Justifikasinya harus lewat jalan yang sama seperti pemilihan titik kerja GeoPref:
biaya operasional pada antrean nyata, bukan performa pada data kami.

Dua jalur dilaporkan berdampingan dan tidak pernah dilebur. Ambang 69% adalah
satu-satunya angka di sistem ini yang bukan kami yang menentukan; meleburnya ke dalam
komposit berarti kehilangan kemampuan mengatakan itu.

## 11. Kenapa mode demonstrasi tidak melanggar invarian

Klip yang tersedia lebih pendek daripada protokol terbit, jadi `validatedProtocol`
bernilai `false` dan jalur `RULE_IN_GEOMETRIC` tidak dapat dicapai. Konsekuensinya
tidak disengaja: bentuk laporan rujukan — hal yang paling perlu dilihat penguji —
tidak pernah muncul.

Mode demonstrasi menerapkan ambang pada klip pendek itu, tetapi menghasilkan
**jenis keluaran yang berbeda**: `GEOMETRIC_PREFERENCE_DEMONSTRATION` di scorer,
`RULE_IN_DEMONSTRATION` di resolver, dengan `emitsReferral: false` yang ditulis
langsung di cabangnya, bukan dibaca dari konfigurasi.

Invariannya karena itu tetap utuh dan tetap dapat dijaga tes: **protokol yang tidak
tervalidasi tidak pernah memicu rujukan.** Mode ini hanya dapat dimasuki dari kontrol
demo dan hanya dalam mode replay; `start()` menghitung ulang flag-nya setiap kali dan
menggerbangnya pada mode, sehingga tidak ada argumen yang menyalakannya di lapangan.
Ia dicatat di log audit sebagai `session.demonstration_mode`, jadi sesi yang diekspor
tidak dapat menyembunyikannya.

## 12. Kenapa kontrol positif memakai orang dewasa yang memproduksi pola

Gate A membuktikan ketelitian, Gate B membuktikan kesepakatan. Tidak satu pun
membuktikan bahwa pipeline dapat membedakan dua kondisi perilaku — dan kalau tidak
bisa, seluruh premisnya runtuh. Kontrol positif menutup celah itu tanpa melibatkan
balita.

Bingkainya adalah kontrol positif, bukan klasifikasi: beri instrumen sinyal yang
diketahui ada, periksa apakah ia merespons. Yang dihasilkan adalah responsivitas
instrumen, bukan sensitivitas maupun spesifisitas. Protokol, bahasa yang wajib
dipakai, dan batas klaimnya ada di `docs/kontrol_positif.md`.

Risiko sirkularitasnya nyata dan ditangani dengan dua cara: arah tiap sinyal diambil
dari literatur, bukan dari data akting; dan bila kelak ada model ter-fit, evaluasinya
harus dikelompokkan per orang, sama seperti kontrol negatif pada CNN.

## 13. Urutan isyarat harus diseimbangkan, bukan beralternasi

Sampai v4, delapan percobaan isyarat berjalan pada urutan kiri, kanan, kiri, kanan,
kiri, kanan, kiri, kanan — tetap, di setiap sesi.

Itu confound, bukan sekadar kurang rapi. Anak yang sekadar memindai kiri-kanan secara
ritmis akan mencetak "mengikuti isyarat" pada setiap percobaan tanpa joint attention
apa pun, dan uji tanda di `app/src/inference/jointAttention.ts` tidak dapat
membedakan keduanya justru karena urutan isyaratnya sendiri beralternasi. Sejak
lapisan rekomendasi memakai sinyal ini untuk memutuskan, cacat itu berhenti menjadi
persoalan akademis.

Sejak v5, urutan dipermutasi dari hash id sesi dengan syarat jumlah kiri sama dengan
kanan dan tidak ada tiga sisi sama beruntun. Deterministik, dapat diaudit dari log,
dan tidak dapat dipilih operator — pola yang sama dengan penyeimbangan sisi GeoPref.

## 14. Kenapa blok pilihan tontonan dipindah ke depan

Blok itu membawa satu-satunya ambang terbit di sistem ini, tetapi pada v4 ia berjalan
pada detik ke-61 dari 96 — di posisi kesembilan dari dua belas fase. Dua hal
menggerusnya di sana: perhatian balita paling habis di akhir baterai, dan enam puluh
detik ajakan sosial intensif sebelumnya mem-*prime* perhatian sosial, yang menekan
preferensi geometrik justru ke arah berlawanan dengan yang diandalkan pemicu rujukan.

Sejak v5 ia berjalan kedua, tepat sesudah perhatian awal. Durasi tiap percobaan
isyarat juga turun dari 7 ke 5 detik — latensi mengikuti pandangan berada jauh di
bawah 2 detik, sehingga jendela respons 3,3 detik tetap longgar — dan jumlah
percobaan tetap delapan, karena menguranginya memperburuk daya uji tanda. Baterai
utuh kini 80 detik, masih yang terpendek di antara seluruh preseden yang dikutip
makalah ini.

## 15. Kenapa aktornya vektor gambar tangan, bukan rekaman manusia

Blok isyarat arah memakai aktor yang digambar sebagai SVG dan dianimasikan lewat CSS.
Ini keputusan yang perlu dipertahankan dengan bukti, bukan dengan selera, karena lebih
dari separuh baterai memakainya.

**Yang memberatkan, dan kami sebut duluan.** Tinjauan stimulus eye-tracking joint
attention melaporkan perbedaan antar-kelompok yang **lebih tegas** pada stimulus beragen
manusia dibanding beragen animasi, serta perbedaan fiksasi ke mata dan wajah antara
aktor manusia dan kartun. Untuk perbandingan antar-kelompok, agen animasi kemungkinan
memperkecil efek yang ingin diukur.

**Kenapa itu tidak membatalkan pilihan ini.** Sinyal keputusan yang kami ambil dari blok
ini bukan perbandingan antar-kelompok, melainkan **kontras dalam-subjek**: tatapan ke
target sesudah isyarat dibanding sebelum isyarat, pada anak yang sama, pada aktor yang
sama, di dalam percobaan yang sama. Uji tanda tidak menuntut norma populasi, sehingga
kekuatan efek antar-kelompok pada agen animasi bukan asumsi yang dipakai aturan ini.

**Yang mendukung, dan syaratnya spesifik.** Wajah skematik memang memicu gaze following:
bayi baru lahir sudah membedakan tatapan langsung dari tatapan menyamping pada wajah
skematik, dan saccade ke target periferal lebih cepat ketika gerak pupil wajah tengah
terlihat. Tetapi efeknya dibawa oleh sifat perseptual tertentu, bukan oleh "adanya
wajah":

1. **Polaritas kontras mata.** Isyarat bergantung pada pola lazim mata—pupil gelap di
   atas sklera terang. Isyarat dengan polaritas terbalik menghasilkan efek yang jauh
   lebih lemah.
2. **Gerak pupil yang terlihat.** Yang menjadi isyarat adalah mata yang bergerak, bukan
   wajah yang sekadar digambar sudah menghadap ke samping.
3. **Sinyal ostensif mendahului arah.** Bayi mengikuti tatapan ketika didahului kontak
   mata atau sapaan, dan tidak ketika didahului animasi non-sosial yang sekadar menarik
   perhatian.

Ketiganya sudah terpenuhi di aset kami dan sekarang dijaga tes, bukan sekadar niat
desain: `.sclera` `#fffdf7` melawan `.pupil` `#16181b`; `.eyeball` benar-benar
ber-*translate* ±16 px pada onset isyarat dengan transisi 240 ms berjeda 50 ms sehingga
mata bergerak lebih dulu daripada kepala dan tangan; dan epok ostensif mengembalikan
kontak mata sebelum ada informasi arah sama sekali. Kontrak itu ada di
`app/tests/child-flow-contract.test.ts`, sehingga penataan ulang gaya visual tidak dapat
diam-diam mencabut sifat yang membuat isyaratnya bekerja.

**Alasan operasional yang tetap berlaku.** Onset jatuh pada milidetik yang dideklarasikan
protokol di semua tablet, tanpa bergantung pada dekoder atau frame yang jatuh—dan analisis
pra/pasca-isyarat kami bergantung persis pada ketepatan itu. Asetnya kecil dan berjalan
luring penuh. Stimulusnya berupa kode yang berversi dan dapat di-*diff*, bukan gumpalan
biner. Dan tidak ada anak yang perlu direkam, sehingga tidak ada persoalan izin,
privasi, maupun lisensi rekaman.

**Batasnya.** Tidak ada satu pun bukti bahwa balita merespons aktor ini. Yang kami punya
adalah paradigma terbit, sifat perseptual yang sesuai literatur, dan rancangan yang
dijaga tes. Apakah balita Indonesia benar-benar mengikuti isyaratnya adalah pertanyaan
Gate C, dan kontrol positif pada orang dewasa hanya menunjukkan instrumennya responsif.

## 16. Tidak ada pengukuran yang melintasi batas medium

Satu sesi menampilkan dua dunia visual: klip video terbit untuk blok pilihan tontonan,
dan aktor vektor untuk sisanya. Perpindahannya memang terlihat, dan pertanyaan yang
benar bukan "apakah kelihatan menyambung" melainkan "apakah ada angka yang dihitung
melintasi sambungan itu".

Jawabannya sekarang tidak ada:

- **Preferensi geometrik** dihitung seluruhnya di dalam klip, oleh modulnya sendiri.
- **Mengikuti isyarat** membandingkan pasca-isyarat dengan pra-isyarat di dalam
  percobaan vektor yang sama.
- **Respons nama** adalah deteksi peristiwa di dalam blok vektor.

Sebelumnya ada satu pengecualian, dan itulah alasan diferensial kedipan dicabut dari
lapisan keputusan (§10): ia membandingkan fase aktor vektor dengan blok video, sehingga
"sosial lawan non-sosial" tercampur penuh dengan "vektor lawan video nyata". Selisih apa
pun bisa saja digerakkan medium, bukan isi adegan, dan arah biasnya sistematis. Dengan
sinyal itu dicabut, batas medium tidak lagi masuk ke keputusan mana pun.
