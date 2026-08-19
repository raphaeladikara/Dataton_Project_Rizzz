# Sesi demo 10 menit

Naskah untuk slot demo. Naskah pitch terpisah ada di
[`pitch_7_menit.md`](pitch_7_menit.md), dan bingkai yang menentukan urutan keduanya ada
di [`arah_pitch.md`](arah_pitch.md); yang ini fokus pada apa yang dijalankan di layar.

Aturan yang berlaku: **tidak ada angka tanpa sumber, dan tidak ada klaim yang tidak
bisa ditunjukkan di layar dalam sepuluh detik.**

**Prasyarat.** `npm run replay:check` melaporkan dua rekaman terbaca beserta labelnya:
`sesi-biasa.json — Menonton biasa` dan `sesi-produksi.json — Pola diproduksi`. Tanpa
itu, jalur demo memakai titik sintetis dan laporannya ditahan — bukan karena kesalahan,
tetapi karena scanpath sintetis benar-benar di luar distribusi dan penjaga menolaknya.
Protokol perekamannya ada di [`kontrol_positif.md`](kontrol_positif.md).

**Anggaran waktu yang harus dihitung sebelum menyusun ulang naskah ini.** Satu sesi
kamera penuh memakan sekitar tiga menit: persetujuan, persiapan, kalibrasi lima titik,
lalu 80 detik stimulus. Dua sesi langsung tidak muat di slot sepuluh menit bersama
apa pun yang lain. Naskah ini menjalankan **satu** sesi langsung dan memutar rekaman
untuk kondisi yang satunya.

---

## Peta waktu

| Menit | Bagian | Di layar |
|---:|---|---|
| 0:00–1:00 | Masalah: diagnosis rata-rata 56 bulan, 32 bulan sesudah kecurigaan pertama orang tua | 1 slide, 2 angka |
| 1:00–1:45 | Kenapa alat yang ada gagal di Posyandu: ceklis vs EarliPoint $599 | 1 slide, 3 kolom |
| 1:45–3:00 | **Rekaman: kondisi pola diproduksi** | Aplikasi |
| 3:00–5:30 | **Sesi langsung: kontrol negatif dari penonton** | Aplikasi |
| 5:30–6:30 | Bingkai kontrol positif dan batasnya | `kontrol_positif/README.md` |
| 6:30–7:15 | Kenapa punya batas: sensitivitas 17%, tabel empat lengan | `gate_c_simulation.json` |
| 7:15–8:15 | Dampak, biaya per sesi, jalur adopsi | Laporan cetak + slide biaya |
| 8:15–9:15 | **Momen integritas** | Panel riset |
| 9:15–10:00 | Gate C dan D, target dari literatur, dan yang dibutuhkan | — |

---

## 1:45 — Rekaman: kondisi pola diproduksi

**Sebutkan protokolnya sebelum mulai.** Ini yang membedakan prosedur dari improvisasi.

> Yang akan kalian lihat rekaman sesi kamera sungguhan, 19 Agustus, seorang dewasa yang
> menyetujui untuk dirinya sendiri. Instruksinya empat butir dan tiap butir memetakan ke
> tepat satu sinyal: pandangan diarahkan ke panel geometrik, dan tidak mengikuti arah
> mata atau tunjukan model.

**Jangan pernah** mengatakan "berpura-pura autis", "jadi ASD", atau variasi apa pun.
Yang diperagakan adalah pola terukur, bukan seseorang. Ini bukan soal kehalusan bahasa:
mengarikaturkan perilaku autistik di depan panel yang mungkin punya kaitan personal
dengan ASD akan merusak setiap hal lain yang kalian bangun.

**Kenapa rekaman dan bukan peragaan langsung.** Dari enam sesi produksi di kontrol
positif, aturannya menyala pada empat. Dua sisanya gagal pada prasyarat perhatian —
pesertanya tidak pernah menatap model saat isyarat disampaikan, jadi sinyal isyaratnya
ditahan. Sepertiga kemungkinan gagal bukan risiko yang layak diambil pada bagian yang
harus berhasil. Rekaman ini juga tetap jujur: laporannya mencetak sendiri bahwa ia
rekaman, lengkap dengan tanggal dan ID sesinya.

Kalau tetap ingin langsung, tombol **Peragakan · kamera langsung** menjalankan sesi
kamera sungguhan dengan ambang yang sama diterapkan, di bawah banner yang sama. Ia
hanya tersedia untuk peserta dewasa dan tidak dapat dicapai dari jalur anak. Cara
mereplikasi polanya, beserta berapa ketat ambangnya, ada di bagian berikut — dan
latihlah sampai berhasil tiga kali berturut-turut sebelum memakainya di panggung.

### Cara mereplikasi polanya, dan seberapa ketat ambangnya

Ambangnya sekarang dibandingkan terhadap **selang kepercayaan**, bukan terhadap satu
angka. Konsekuensinya untuk peraga:

| Yang harus terjadi | Kenapa |
|---|---|
| Tahan panel geometrik **≥ 90%** durasi klip | Pada preferensi sebenarnya 0,90 aturannya menyala 99% dari waktu; pada 0,75 hanya 24% |
| Tahan **konsisten**, bukan rata-rata | Selangnya melebar mengikuti variasi antar detik. Menatap 100% selama delapan detik lalu berpaling delapan detik menghasilkan angka yang sama dengan menatap 90% terus-menerus, tapi selang yang jauh lebih lebar |
| Saat blok isyarat: **tatap model**, jangan tutup mata atau menunduk | Prasyarat perhatian. Peserta yang tidak pernah menatap model membuat sinyal isyarat ditahan sebagai tidak dapat dinilai, dan aturannya butuh dua sinyal |
| Jangan ikuti arah mata atau tunjukan model | Ini sinyal kedua. Masuk area target pada ≤ 1 dari 8 percobaan |
| Duduk stabil, jarak tetap, cahaya dari depan | Kalibrasi adalah penyebab attrition dominan di kontrol positif |

Dua butir pertama itu yang berubah. Di aturan lama, 70% sudah cukup; sekarang 70%
berstatus **tidak dapat dinilai**, karena selangnya melintasi ambang. Tabel karakteristik
operasi lengkapnya di
[`ambang_selang_kepercayaan.md`](ambang_selang_kepercayaan.md).

**Ini juga jawaban untuk pertanyaan "bagaimana kalau relawan salah dirujuk".** Ketatnya
bukan demi demo — ia menghapus wilayah abu-abu tempat positif palsu hidup. Peserta yang
sekadar menonton harus melewati dua hal yang tidak mungkin sekaligus: seluruh selang
preferensi geometriknya di atas 69%, **dan** kegagalan mengikuti isyarat yang terukur
sementara ia terbukti menatap model.

Jalankan **Peragakan · Pola diproduksi** di tab **Panduan & demo**.

Setelah laporan muncul, **sebut bannernya lebih dulu**, sebelum juri membacanya sendiri:

> Banner merah di atas itu penting dan saya mau menyebutnya duluan. Klip yang kami
> lisensikan 16,75 detik, sementara ambang 69% diturunkan pada protokol 60 sampai 90
> detik. Jadi di lapangan ambang itu **ditahan**. Mode peragaan menerapkannya sekali
> supaya bentuk laporan rujukannya terlihat, dan aplikasi mencetak sendiri bahwa ia
> sedang melakukan itu.

Lalu tunjuk tiga hal berurutan:

1. Persentase fiksasi geometrik — 94% — dengan ambangnya.
2. Dua sinyal aturan komposit, masing-masing dengan nilai terukur, status, dan sumber
   literaturnya. Yang ketiga, respons nama, dikarantina dan alasannya tertulis di layar.
3. Kalimat hasil: disarankan pemeriksaan lanjutan, 2 dari 2 sinyal menyimpang.

> Perhatikan yang tidak ada: tidak ada skor gabungan, tidak ada gauge, tidak ada
> persentase risiko autisme. Keenam ukuran itu tidak boleh dijumlahkan sebelum ada
> balita berlabel untuk memfit bobotnya, jadi tipe datanya sendiri melarang —
> `combinedScore` bernilai null dan tidak ada jalur kode yang bisa mengisinya.

Kalau ada satu sinyal berstatus **tidak dapat dinilai**, tunjuk itu dan jelaskan:

> Sinyal ini arahnya benar tapi belum terbukti di atas kebetulan, jadi ia tidak
> dihitung ke arah mana pun. Delapan percobaan tidak bisa mencapai p di bawah 0,05
> di bawah tujuh keberhasilan — jadi anak yang mengikuti enam dari delapan isyarat
> gagal signifikan sambil sudah mengikuti sebagian besarnya. Menghitung itu sebagai
> penyimpangan berarti membaca ketiadaan bukti sebagai bukti ketiadaan, dan aturan
> ini dulu memang begitu sampai kami cabut.

---

## 3:00 — Sesi langsung: kontrol negatif dari penonton

Bagian dengan nilai tertinggi di seluruh sesi demo, dan satu-satunya yang tidak bisa
diatur sebelumnya. **Ucapkan keberatannya sendiri sebelum juri memikirkannya.**

> Pertanyaan yang benar sekarang, dan saya mau menanyakannya sendiri sebelum kalian:
> bagaimana kalau alat ini cuma merujuk semua orang? Alat yang selalu bilang "periksa
> lebih lanjut" akan lolos dua menit barusan tanpa mengukur apa pun.
>
> Jadi saya butuh satu orang dari ruangan ini. Tidak ada briefing, tidak ada instruksi
> dari saya. Ikuti saja tutorial di layar dan tonton seperti biasa.

Ambil relawan. **Jangan** memilih rekan satu tim — seluruh nilai bagian ini ada pada
kenyataan bahwa orangnya tidak bisa diatur.

Jalankan sesi kamera penuh. Selama berjalan, diam. Satu kalimat di awal:

> Ini pipeline yang sama persis dengan yang barusan, dan sama persis dengan sesi di
> Posyandu. Yang pertama muncul blok pilihan tontonan, karena blok itu membawa
> satu-satunya ambang terbit yang kami pakai dan tidak boleh diukur pada anak yang
> sudah lelah.

Setelah laporan muncul:

> Tidak ada rujukan. Dan yang lebih penting daripada itu: aplikasi tidak menulis kata
> "aman". Hasil di bawah ambang selalu datang dengan kalimat bahwa tes ini melewatkan
> sebagian besar anak ASD, karena NPV-nya 65 persen.

Tunjuk juga apa yang tertulis di lajur kompositnya. Kalau berbunyi *"sinyal yang dapat
dinilai terlalu sedikit"* dan bukan *"normal"*, sebut itu apa adanya:

> Satu sinyalnya normal dan satunya tidak dapat dinilai, jadi aturannya tidak punya
> cukup bahan untuk menyusun rekomendasi. Itu berbeda dari "orang ini baik-baik saja",
> dan alat ini menolak menyamakan keduanya.

---

## 5:30 — Bingkai kontrol positif

Bagian ini yang menentukan apakah tiga menit sebelumnya terbaca sebagai bukti atau
sebagai teater. Lambatkan.

> Ini kontrol positif: beri instrumen sinyal yang diketahui ada, lalu periksa apakah ia
> merespons. Gate A membuktikan alatnya teliti. Gate B membuktikan pengukurannya
> sejalan dengan metode yang divalidasi ManyBabies untuk balita. Tidak satu pun
> membuktikan bahwa alat ini bisa **membedakan** dua kondisi — dan kalau tidak bisa,
> seluruh premis kami runtuh.
>
> Yang barusan membuktikan instrumennya responsif. Ia tidak membuktikan alat ini
> mendeteksi autisme, dan pesertanya orang dewasa yang memproduksi pola dengan
> sengaja. Sensitivitas dan spesifisitas baru ada di Gate C.

Sebut seluruh datanya, bukan hanya dua sesi yang tampil:

> Dua sesi yang kalian lihat bagian dari 23. Dua belas peserta, tiga perangkat.
> Ketiga sinyal keputusan memisahkan kedua kondisi tanpa satu sesi pun bertumpang
> tindih, dan aturan kompositnya menyala pada **nol dari sembilan** sesi menonton
> biasa. Attrition-nya 35 persen dan kami terbitkan apa adanya — kalau sesi yang gagal
> dibuang, angkanya akan bohong.
>
> Dan ini bukti pertama di proyek kami yang provenance-nya lengkap dari kamera sampai
> angka, karena direkam lewat aplikasi yang sama yang baru kalian lihat jalan.

**Kalau ditanya soal confound sisi panel** — jawabannya 20 detik, dan ada tertulis di
`research/hasil/kontrol_positif/README.md` sebelum ada yang bertanya:

> Betul, panel geometriknya di kanan pada seluruh sesi. Tapi layout-nya sama di kedua
> kondisi, jadi kebiasaan melirik kanan tidak bisa memisahkan keduanya — ia konstanta,
> bukan pembeda. Dan kalau bias itu yang menggerakkan angkanya, penonton biasa juga
> akan tinggi; mereka di 0,34, artinya dua pertiga waktunya justru di panel sosial.
> Lalu dua dari tiga sinyal kami diukur di blok yang tidak punya panel sama sekali.

Tunjuk dua hal yang sengaja tidak ikut memutuskan:

> Menghadap layar dan gerak kepala adalah dua indeks dengan AUC preseden tertinggi —
> 0,838 dan 0,864. Keduanya tidak masuk aturan keputusan, karena tidak ada ambang
> terbit yang bisa dipindahkan ke sini. Memasukkannya berarti kami mengarang angkanya.

Lalu batas ambangnya sendiri:

> Satu-satunya angka yang kami karang adalah berapa sinyal harus menyimpang. Kami
> memilih dua, dan tipe datanya sendiri menandai itu sebagai pilihan desain, bukan
> ambang tervalidasi.

---

## 6:30 — Kenapa punya batas

Tampilkan tabel empat lengan dari `research/hasil/gate_c_simulation.json`.

> Sensitivitas 17 persen artinya alat ini melewatkan sebagian besar anak autistik. Itu
> bukan bug, itu bentuk alatnya. Kohort 1.000 anak, prevalensi 1 persen. Baris paling
> atas paling menggoda dipamerkan: sensitivitas 92 persen. Ia merujuk 740 dari 1.000
> anak, dan Puskesmas mana pun berhenti memakainya di minggu kedua.
>
> Baris yang kami pilih merujuk 19 anak dan butuh 12,6 rujukan untuk menemukan satu
> kasus benar. Ia juga menemukan paling sedikit: 1,5 dari 9. Kami memilihnya bukan
> karena angkanya paling bagus, tapi karena itu satu-satunya yang muat di kapasitas
> rujukan yang benar-benar ada.

---

## 7:15 — Dampak, biaya, jalur adopsi

Bagian dengan bobot rubrik terbesar. Jangan lewatkan meskipun demo molor.

> Tidak ada biaya habis pakai, tidak ada biaya jaringan, tidak ada lisensi per kursi,
> tidak ada waktu klinisi. Yang tersisa amortisasi perangkat. Tablet dua setengah juta,
> umur pakai tiga tahun, dirotasi ke empat Posyandu: **Rp 3.500 per pemeriksaan**.
> EarliPoint sekitar sembilan juta tujuh ratus ribu. Selisihnya tiga sampai empat orde
> besaran, dan itu bukan hasil optimasi — perangkat kerasnya memang sudah ada di tangan
> orang.

Tunjukkan laporan cetaknya. Ini satu-satunya artefak fisik di seluruh proyek, dan ia
klaim dampak yang bisa dipegang.

> Alat ini tidak menggantikan apa pun. Ia menempel pada alur yang sudah jalan: sesi 80
> detik sesudah penimbangan bulanan, laporan satu halaman diserahkan ke Puskesmas,
> dibaca berdampingan dengan SDIDTK. Yang dipercepat bukan diagnosisnya — melainkan
> antreannya: tenaga Puskesmas menerima sesuatu yang bisa dibaca, bukan kecemasan yang
> harus digali ulang dari awal.
>
> Dan ini yang belum kelihatan dari luar: penyebaran produk ini adalah mesin pengumpul
> datanya sendiri. Tiga puluh Posyandu selama setahun menghasilkan sekitar 700 sesi
> balita yang dapat dinilai — lebih banyak daripada kohort 475 balita yang dipakai
> Nature Medicine. Yang mengubahnya menjadi data latih adalah hasil klinis yang
> dikembalikan Puskesmas, dan itu butuh tiga hal yang belum ada. Ketiganya tercatat di
> repositori kami sebagai rencana, bukan sebagai fitur.

**Di layar:** [`dampak_dan_adopsi.md`](dampak_dan_adopsi.md) atau slide biaya.

---

## 8:15 — Momen integritas

Aset terkuat proyek ini, dan justru karena itu **dua cerita saja**. Cerita ketiga dan
keempat tidak menambah kredibilitas; keduanya memindahkan waktu dari bagian yang
bobotnya lebih besar. Simpan sisanya untuk tanya jawab.

**Pertama, penjaga yang menolak model kami sendiri.** Buka panel riset di laporan.

> Regresi logistik ini dikirim ke perangkat dan dijalankan setiap sesi. Penjaga
> out-of-distribution memutuskan apakah keluarannya boleh dibaca — dan di sini ia
> menolak, dengan fitur yang disebut namanya dan jarak robust-z-nya. Fitur
> geometrinya mengkodekan tata letak stimulus asalnya, jadi batas keputusannya tidak
> berpindah ke stimulus kami. Yang berpindah ke Gate C adalah representasinya, bukan
> koefisiennya.

**Kedua, dataset yang kami buang.**

> CNN pada dataset wajah statis mencapai AUC 0,932. Itu angka tertinggi di seluruh
> proyek ini, dan tidak kami pakai. Enam dari enam metadata tata kelola tidak tersedia,
> tidak ada ID partisipan sehingga kebocoran identitas tidak bisa disingkirkan, dan uji
> shortcut kami menunjukkan statistik piksel saja sudah mencapai 0,751 dengan
> permutasi p = 0,005. Bobotnya tidak ada di repositori.

Satu kalimat penutup bagian ini:

> Tim yang mengoreksi angkanya sendiri lebih layak dipercaya daripada tim yang
> angkanya selalu bagus.

**Simpan untuk tanya jawab, jangan diucapkan di sini:** kontrol negatif integritas
split (41 dari 54 anak muncul di dua sisi ketika unit pengelompokan diganti), dan
provenance Gate A/B. Keduanya kuat dan keduanya memanjangkan bagian yang sudah cukup.

---

## 9:15 — Penutup

> Kami tidak merekam satu balita pun dan tidak akan sebelum ada kaji etik. Bukan karena
> meneliti anak autistik tidak etis — seluruh bukti yang kami pakai lahir dari
> penelitian yang merekam anak autistik dengan izin yang benar. Yang tidak etis adalah
> kami melakukannya tanpa struktur itu. Jadi risetnya tidak berhenti; ia pindah ke
> orang dewasa yang menyetujui untuk dirinya sendiri, ke data yang peneliti lain sudah
> terbitkan dengan izin yang mereka punya, dan ke praktisi yang menangani anak-anak ini
> setiap hari.
>
> Gate C dan Gate D masih terbuka. Targetnya sudah kami tetapkan dari literatur, bukan
> dari harapan: sensitivitas 88 persen dan spesifisitas 81 persen, angka SenseToKnow di
> Nature Medicine pada kelas perangkat yang sama. Yang belum ada bukan pekerjaan
> teknisnya — itu ada di tangan kalian sekarang, jalan, luring, di tablet. Yang belum
> ada satu mitra klinis berizin etik. Dan begitu mitra itu ada, penyebaran alat ini
> adalah mesin pengumpul datanya sendiri.

Berhenti di sini.

**Jangan** tutup dengan "lima lembaga menolak kami". Itu benar, layak disebut, dan
tempatnya di sesi tanya jawab — bukan sebagai kalimat terakhir yang juri bawa pulang.

---

## Bila demo gagal di panggung

**Laporan ditahan.** Jangan panik, jangan ulangi. Buka panel riset dan tunjuk gerbang
mana yang menahan beserta alasannya.

> Ini keadaan ditahan, dan ini hasil yang sah. Attrition webcam pada balita yang
> dilaporkan ManyBabies 42 persen. Alat yang tidak pernah menolak mengeluarkan angka
> adalah alat yang mengarang angka. Dan perhatikan alat ini menyebut gerbang mana yang
> menolak, bukan cuma bilang tidak bisa.

**Kamera tidak jalan, jadi kontrol negatif langsung batal.** Pakai **Peragakan ·
Menonton biasa**, dan katakan terus terang bahwa yang tampil rekaman, bukan sesi
langsung — label itu memang sudah tercetak di kepala laporan. Nilainya berkurang karena
rekamannya bisa dipilih sebelumnya; sebut itu apa adanya alih-alih membiarkan juri
menyimpulkannya sendiri:

> Ini jadi lebih lemah daripada yang saya rencanakan, dan saya sebut supaya jelas:
> rekaman bisa dipilih sebelumnya, relawan tidak. Yang tetap benar, sesi ini dari
> kontrol positif dan angkanya ada di repositori.

**Relawan tidak ada yang maju.** Jangan memaksa dan jangan memakai rekan satu tim
diam-diam. Kalau harus memakai rekan tim, sebutkan bahwa dia rekan tim.

**Ambang GeoPref tidak menyala.** Memang tidak akan, di lapangan. Klip yang tersedia
16,75 detik dan protokol terbitnya 60–90 detik, jadi ambangnya ditahan. Untuk
menunjukkan bentuk laporan rujukan, pakai **Peragakan · Pola diproduksi** di tab
**Panduan & demo**. Laporannya membawa banner mode demonstrasi dan tetap tidak
mengeluarkan rujukan.

**Tidak menemukan tombol demonya.** Beranda sekarang hanya punya satu tombol, dan itu
sesi sungguhan. Seluruh jalur demo pindah ke tab **Panduan & demo**, di bawah panduan
operator.

**Salah menekan tombol peragaan.** Kedua tombol memuat labelnya masing-masing dan
laporannya mencetak ID sesi yang diputar. Kalau yang terbuka kondisi yang salah,
hentikan dan ulangi dengan tombol yang benar; jangan menarasikan kondisi yang satu di
atas rekaman yang satunya.
