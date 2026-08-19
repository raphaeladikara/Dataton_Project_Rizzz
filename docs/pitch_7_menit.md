# Pitch 7 menit

Naskah kerja untuk presentasi semifinal. Bingkai dan alasan di balik urutannya ada di
[`arah_pitch.md`](arah_pitch.md); yang ini naskah menitnya.

Aturan yang berlaku di seluruh naskah: **tidak ada angka tanpa sumber, dan tidak ada
klaim yang tidak bisa ditunjukkan di layar dalam sepuluh detik.**

**Prasyarat.** `npm run replay:check` melaporkan dua rekaman terbaca dan berlabel.
Tanpa itu, jalur demo memakai titik sintetis dan laporannya ditahan — bukan karena
kesalahan, melainkan karena scanpath sintetis memang di luar distribusi.

Sebelum naik: buka tiga tab — beranda aplikasi, `/validation`, dan tabel Bagian 6 yang
sudah dicetak. Jangan berpindah tab lebih dari tiga kali sepanjang pitch.

---

## Peta waktu

| # | Bagian | Menit | Kumulatif |
|---|---|---:|---:|
| 1 | Masalah | 0:40 | 0:40 |
| 2 | Kenapa alat yang ada gagal di Posyandu | 0:25 | 1:05 |
| 3 | Demo: pola diproduksi | 0:50 | 1:55 |
| 4 | Demo: kontrol negatif langsung | 1:00 | 2:55 |
| 5 | Kontrol positif: instrumennya merespons | 0:50 | 3:45 |
| 6 | Kenapa punya batas | 0:45 | 4:30 |
| 7 | Dampak, biaya, jalur adopsi | 1:00 | 5:30 |
| 8 | Momen integritas | 0:40 | 6:10 |
| 9 | Penutup dan yang dibutuhkan | 0:30 | 6:40 |

Dua puluh detik cadangan sengaja disisakan untuk Bagian 4, yang satu-satunya bagian
dengan risiko panggung yang tidak dapat dikendalikan.

Kalau harus memotong: Bagian 8 turun menjadi satu cerita. Yang **tidak boleh** dipotong
adalah Bagian 4, 6, dan 7.

---

## 1. Masalah (0:40)

> Autisme paling responsif terhadap intervensi sebelum usia tiga tahun. Di Indonesia,
> diagnosis rata-rata baru datang di usia 56 bulan — sekitar 32 bulan setelah orang tua
> pertama kali merasa ada yang berbeda. Jadi masalahnya bukan orang tua yang tidak
> sadar. Masalahnya 32 bulan antara "saya khawatir" dan "ini namanya apa".
>
> Titik layanan yang sudah menjangkau hampir setiap desa cuma satu: Posyandu. Yang
> belum ada di sana adalah pengukuran objektif.

**Di layar:** satu slide, dua angka. Kalau wawancara praktisi sudah dilakukan, satu
kalimat orang tua menggantikan setengah slide ini —
[`wawancara_praktisi.md`](wawancara_praktisi.md), blok A2.

## 2. Kenapa alat yang ada gagal di Posyandu (0:25)

> Dua kutub. Di satu sisi ceklis seperti M-CHAT dan KPSP: murah, bisa disebar,
> bergantung pada laporan manusia, spesifisitasnya rendah. Di sisi lain instrumen
> objektif: EarliPoint sudah dapat izin FDA 510(k) untuk anak 16 sampai 30 bulan,
> biayanya 599 dolar per pemeriksaan dengan eye-tracker khusus di fasilitas klinis.
>
> Yang tidak ada adalah pengukuran objektif yang bisa dijalankan kader, di tablet
> Android biasa, tanpa jaringan.

**Di layar:** tiga kolom.

## 3. Demo: pola diproduksi (0:50)

**Sebutkan protokolnya sebelum memulai.** Ini yang membedakan prosedur dari improvisasi,
dan ini juga tempat kalimat yang paling mudah salah.

> Yang akan kalian lihat adalah rekaman sesi kamera sungguhan, direkam 19 Agustus,
> dengan seorang dewasa yang menyetujui untuk dirinya sendiri. Instruksinya empat butir,
> dan tiap butir memetakan ke tepat satu sinyal: pandangan diarahkan ke panel geometrik,
> dan tidak mengikuti arah mata atau tunjukan model.

**Jangan pernah** mengatakan "berpura-pura autis", "jadi ASD", atau variasi apa pun.
Yang diperagakan adalah pola terukur, bukan seseorang. Ini bukan soal kehalusan bahasa:
mengarikaturkan perilaku autistik di depan panel yang mungkin punya kaitan personal
dengan ASD merusak setiap hal lain yang dibangun.

Buka tab **Panduan & demo**, lalu jalankan **Peragakan · Pola diproduksi**.

Setelah laporan muncul, sebut bannernya lebih dulu — sebelum juri membacanya sendiri:

> Banner merah di atas itu penting. Klip yang kami lisensikan 16,75 detik, sementara
> ambang 69% diturunkan pada protokol 60 sampai 90 detik. Jadi di lapangan ambang itu
> **ditahan**. Mode peragaan menerapkannya sekali supaya bentuk laporannya terlihat,
> dan aplikasi mencetak sendiri bahwa ia sedang melakukan itu.

Lalu tunjuk tiga hal berurutan:

1. **94% waktu pada pola geometrik**, dengan ambangnya.
2. **Dua sinyal komposit**, masing-masing dengan nilai terukur, status, dan sumber
   literaturnya. Yang ketiga, respons nama, dikarantina dan alasannya tertulis.
3. **Kalimat hasil**: disarankan pemeriksaan lanjutan, 2 dari 2 sinyal menyimpang.

> Perhatikan yang tidak ada: tidak ada skor gabungan, tidak ada gauge, tidak ada
> persentase risiko autisme. Keenam ukuran itu tidak boleh dijumlahkan sebelum ada
> balita berlabel untuk memfit bobotnya, jadi tipe datanya sendiri melarang —
> `combinedScore` bernilai null dan tidak ada jalur kode yang bisa mengisinya.

## 4. Demo: kontrol negatif langsung (1:00)

Bagian dengan nilai tertinggi di seluruh pitch. **Ucapkan keberatannya sendiri sebelum
juri memikirkannya.**

> Sekarang pertanyaan yang benar, dan saya mau menanyakannya sendiri sebelum kalian:
> bagaimana kalau alat ini cuma merujuk semua orang? Alat yang selalu bilang "periksa
> lebih lanjut" akan lolos demo barusan tanpa mengukur apa pun.
>
> Jadi saya butuh satu orang dari ruangan ini. Tidak ada briefing, tidak ada instruksi.
> Ikuti saja tutorial di layar dan tonton seperti biasa.

Ambil relawan. **Jangan** memilih rekan satu tim. Jalankan sesi kamera penuh.

Selama 80 detik berjalan, diam. Satu kalimat saja di awal:

> Ini pipeline yang sama persis, tanpa satu baris pun yang berbeda.

Setelah laporan muncul:

> Tidak ada rujukan. Dan yang lebih penting: aplikasi tidak menulis kata "aman". Hasil
> di bawah ambang selalu datang dengan kalimat bahwa tes ini melewatkan sebagian besar
> anak ASD, karena NPV-nya 65 persen.

Kalau ada yang bertanya kenapa relawan tidak mungkin salah dirujuk — dan pertanyaan itu
bagus — jawabannya satu paragraf:

> Ambang 69 persen kami bandingkan terhadap selang kepercayaan sesi, bukan terhadap
> satu angka. Sesi yang mengukur 71 persen dengan selang 62 sampai 79 berstatus tidak
> dapat dinilai, karena klip 16,75 detik tidak bisa membedakannya dari 67 persen.
> Seseorang yang preferensinya persis di ambang memicu aturan lama separuh waktu; aturan
> sekarang memicunya lima persen. Dan rujukan tetap menuntut sinyal kedua ikut menyimpang.

**Kalau laporannya ditahan** — jangan panik, jangan ulangi:

> Ini keadaan ditahan, dan ini hasil yang sah, bukan error. Attrition webcam pada balita
> yang dilaporkan ManyBabies 42 persen. Alat yang tidak pernah menolak mengeluarkan
> angka adalah alat yang mengarang angka. Dan perhatikan aplikasi menyebut gerbang mana
> yang menahan, bukan cuma bilang tidak bisa.

**Kalau kameranya tidak jalan** — jalankan **Peragakan · Menonton biasa**, dan katakan
terus terang bahwa yang tampil rekaman, bukan sesi langsung. Labelnya memang sudah
tercetak di kepala laporan. Perhatikan bahwa lajur kompositnya akan berbunyi *"sinyal
yang dapat dinilai terlalu sedikit"*, bukan *"normal"* — sebut itu apa adanya:

> Satu sinyalnya normal dan satunya tidak dapat dinilai, jadi aturannya tidak punya
> cukup bahan untuk menyusun rekomendasi. Itu berbeda dari "anak ini baik-baik saja",
> dan aplikasi menolak menyamakan keduanya.

## 5. Kontrol positif: instrumennya merespons (0:50)

Bagian ini yang menentukan apakah dua menit sebelumnya terbaca sebagai bukti atau
sebagai teater. Lambatkan.

> Yang barusan kalian lihat dua sesi. Ini seluruh datanya: 12 orang dewasa, 23 sesi,
> tiga perangkat, direkam 19 Agustus.
>
> Ini kontrol positif. Beri instrumen sinyal yang diketahui ada, lalu periksa apakah ia
> merespons. Ketiga sinyal keputusan memisahkan kedua kondisi tanpa satu sesi pun
> bertumpang tindih, dan aturan kompositnya menyala pada **nol dari sembilan** sesi
> menonton biasa.
>
> Dan ini bukti pertama di proyek kami yang provenance-nya lengkap dari kamera sampai
> angka, karena direkam lewat aplikasi yang sama yang baru kalian lihat jalan.

Lalu batasnya, sebelum ditanya:

> Yang ini tidak membuktikan: apa pun tentang autisme. Pesertanya orang dewasa yang
> mengikuti naskah. Tidak ada sensitivitas, spesifisitas, atau akurasi di dalamnya.
> Attrition-nya 35 persen dan kami terbitkan apa adanya.

**Kalau ditanya soal confound sisi panel** — jawabannya 20 detik dan ada di
`research/hasil/kontrol_positif/README.md`:

> Betul, panel geometriknya di kanan pada seluruh sesi, dan itu tertulis di repositori
> kami. Tapi layout-nya sama di kedua kondisi, jadi kebiasaan melirik kanan tidak bisa
> memisahkan keduanya. Dan kalau bias itu yang menggerakkan angkanya, penonton biasa
> juga akan tinggi — mereka di 0,34, artinya dua pertiga waktunya justru di panel
> sosial. Dua dari tiga sinyal kami diukur di blok yang tidak punya panel sama sekali.

## 6. Kenapa punya batas (0:45)

> Sensitivitas 17 persen artinya alat ini melewatkan sebagian besar anak autistik. Itu
> bukan bug, itu bentuk alatnya. GeoPref adalah alat *rule-in*: hasil positif layak
> ditindaklanjuti, hasil negatif hampir tidak mengubah apa pun.

Tampilkan tabel empat lengan.

| Titik kerja | Sens | Spec | Laju rujukan | Rujukan per 1 kasus benar |
|---|---:|---:|---:|---:|
| Regresi logistik, sensitivitas 0,9 | 0,923 | 0,179 | 82,2% | 89,1 |
| Regresi logistik, Youden | 0,731 | 0,821 | 18,4% | 25,2 |
| **GeoPref 69% (yang dipakai)** | **0,170** | **0,980** | **2,2%** | **12,6** |
| Target Gate C (preseden tablet) | 0,878 | 0,808 | 19,9% | 22,6 |

> Kohort 1.000 anak, prevalensi 1 persen. Baris paling atas paling menggoda dipamerkan:
> sensitivitas 92 persen. Ia merujuk 740 dari 1.000 anak. Puskesmas mana pun berhenti
> memakainya di minggu kedua.
>
> Baris yang kami pilih merujuk 19 anak. Ia juga menemukan paling sedikit. Kami
> memilihnya bukan karena angkanya paling bagus, tapi karena itu satu-satunya yang muat
> di kapasitas rujukan yang benar-benar ada.

**Di layar:** `research/hasil/gate_c_simulation.json` atau tabel di atas. Kalau
wawancara praktisi sudah ada, angka antreannya masuk di sini — blok C.

## 7. Dampak, biaya, jalur adopsi (1:00)

Bagian yang sebelumnya tidak ada di naskah mana pun, dan berbobot paling besar di
rubrik.

> Tidak ada biaya habis pakai, tidak ada biaya jaringan, tidak ada lisensi per kursi,
> tidak ada waktu klinisi. Yang tersisa amortisasi perangkat. Tablet Android dua setengah
> juta, umur pakai tiga tahun, dirotasi ke empat Posyandu: **Rp 3.500 per pemeriksaan**.
> EarliPoint sekitar sembilan juta tujuh ratus ribu. Selisihnya tiga sampai empat orde
> besaran, dan itu bukan hasil optimasi — perangkat kerasnya memang sudah ada di tangan
> orang.
>
> Ia tidak menggantikan apa pun. Ia menempel: sesi 80 detik sesudah penimbangan
> bulanan, laporan satu halaman diserahkan ke Puskesmas, dibaca berdampingan dengan
> SDIDTK.

Tunjukkan laporan cetaknya. Ini satu-satunya artefak fisik di seluruh proyek.

Lalu bagian yang paling jarang terpikir:

> Dan ini yang belum kelihatan dari luar: penyebaran produk ini adalah mesin pengumpul
> datanya sendiri. Tiga puluh Posyandu selama satu tahun menghasilkan sekitar 700 sesi
> balita yang dapat dinilai — lebih banyak daripada kohort 475 balita yang dipakai
> Nature Medicine. Yang mengubahnya menjadi data latih adalah hasil klinis yang
> dikembalikan Puskesmas, dan itu butuh tiga hal yang belum ada. Ketiganya ada di
> repositori kami sebagai rencana, bukan sebagai fitur.

**Di layar:** [`dampak_dan_adopsi.md`](dampak_dan_adopsi.md) atau slide biaya.

## 8. Momen integritas (0:40)

Dua cerita. Tidak lebih.

> Pertama: model terbaik kami tidak dipakai. Regresi logistik Carette punya AUC 0,82 dan
> CNN-nya 0,88, tapi selisihnya tidak dapat dibedakan dari nol — bootstrap berpasangan
> pada 54 partisipan yang sama, p sama dengan 0,087. Dan fitur geometrinya mengkodekan
> tata letak stimulus studi asalnya. Model itu tetap dikirim ke perangkat dan dijalankan
> tiap sesi, tapi penjaga out-of-distribution memutuskan apakah keluarannya boleh
> dibaca — dan di sini ia menolak, dengan fitur yang disebut namanya.
>
> Kedua: CNN pada dataset wajah statis mencapai AUC 0,932. Itu angka tertinggi di
> seluruh proyek ini, dan kami buang. Enam dari enam metadata tata kelola tidak
> tersedia, tidak ada ID partisipan sehingga kebocoran identitas tidak bisa
> disingkirkan, dan uji shortcut kami menunjukkan statistik piksel saja sudah mencapai
> 0,751 dengan permutasi p sama dengan 0,005. Bobotnya tidak ada di repositori.

Satu kalimat penutup bagian ini:

> Tim yang mengoreksi angkanya sendiri lebih layak dipercaya daripada tim yang angkanya
> selalu bagus.

## 9. Penutup dan yang dibutuhkan (0:30)

> Kami tidak merekam satu balita pun dan tidak akan sebelum ada kaji etik. Bukan karena
> meneliti anak autistik tidak etis — seluruh bukti yang kami pakai lahir dari
> penelitian yang merekam anak autistik dengan izin yang benar. Yang tidak etis adalah
> kami melakukannya tanpa struktur itu. Jadi risetnya tidak berhenti; ia pindah ke
> orang dewasa yang menyetujui untuk dirinya sendiri, ke data yang peneliti lain sudah
> terbitkan dengan izin yang mereka punya, dan ke praktisi yang menangani anak-anak ini
> setiap hari.
>
> Yang belum ada bukan pekerjaan teknisnya — itu ada di tangan kalian sekarang, jalan,
> luring, di tablet. Yang belum ada satu mitra klinis berizin etik. Targetnya sudah kami
> tetapkan dari literatur, bukan dari harapan: sensitivitas 88 persen dan spesifisitas
> 81 persen, angka SenseToKnow di Nature Medicine pada kelas perangkat yang sama.
>
> Dan begitu mitra itu ada, penyebaran alat ini adalah mesin pengumpul datanya sendiri.

Berhenti di sini. **Jangan** tutup dengan "lima lembaga menolak kami". Itu benar, layak
disebut, dan tempatnya di sesi tanya jawab — bukan sebagai kalimat terakhir yang juri
bawa pulang.

---

## Pertanyaan yang hampir pasti datang

**"Sensitivitas 17 persen itu tidak berguna, kan?"**
Berguna kalau perannya benar. Ini alat rule-in yang jalan berdampingan dengan ceklis,
bukan pengganti ceklis. Ceklis menangkap luas dengan spesifisitas rendah; GeoPref
menangkap sempit dengan spesifisitas 98 persen. Yang tidak boleh terjadi adalah hasil
negatifnya dibaca sebagai aman, dan itulah kenapa aplikasi menolak menulisnya begitu.

**"Kenapa tidak pakai CNN yang AUC-nya lebih tinggi?"**
Tiga alasan yang berdiri sendiri-sendiri. Selisih AUC-nya tidak dapat dibedakan dari
nol pada 54 partisipan (p = 0,087), dan prediksi kedua model berkorelasi 0,93 — CNN
menemukan sinyal yang sama, bukan sinyal tambahan. Kontrak masukannya salah: ia dilatih
pada raster yang kanal warnanya membawa kecepatan, akselerasi, dan jerk dari sinyal
250 Hz, dan tidak ada cara sah merekonstruksinya dari kamera 30 fps. Dan ia tidak jalan
di perangkat sasaran.

**"Kalau belum ada balita, kenapa yakin ini jalan?"**
Kami tidak yakin dan tidak mengklaim yakin. Yang terbukti empat hal: alat ukurnya teliti
(Gate A), aliran pengukurannya sejalan dengan metode yang divalidasi ManyBabies untuk
balita (Gate B), instrumennya merespons ketika sinyalnya benar-benar ada (kontrol
positif), dan ambang keputusannya diambil dari studi 1.863 balita, bukan dari data kami.
Yang belum terbukti adalah performa skrining pada balita Indonesia. Itu Gate C.

**"Kenapa tidak rekam anak-anak di sekitar kalian saja? Cuma 80 detik."**
Durasi bukan yang menentukan. Balita tidak bisa memberi persetujuan, jadi yang
menggantikannya adalah keputusan orang lain, dan struktur yang mengawasi keputusan itu
namanya kaji etik. Melewatinya bukan mempercepat penelitian — itu menghapus satu-satunya
pihak yang mewakili kepentingan anaknya. Kami menghubungi lima lembaga dan semuanya
menolak, dan pada tahap bukti kami hari ini itu keputusan yang benar. Kalau kami bersedia
melewatinya demi lomba, tidak ada alasan percaya kami tidak akan melewatinya untuk hal
lain.

**"Kalau tidak ada balita, model kalian dilatih pakai apa?"**
Untuk evaluasi algoritmik di makalah: data eye-tracking anak yang sudah diterbitkan
terbuka, dengan ID partisipan dan pemisahan per anak. Untuk jalur keputusan di produk:
tidak dilatih sama sekali. Satu-satunya ambangnya diambil apa adanya dari Wen dkk. 2022,
dan sinyal keduanya membandingkan anak dengan dirinya sendiri, jadi tidak butuh norma
populasi. Yang masih karangan kami cuma satu angka — berapa sinyal harus menyimpang —
dan tipe datanya sendiri menandainya sebagai pilihan desain. Penggantinya sudah
dirancang lengkap di `docs/model_rujukan.md`: penjumlahan likelihood ratio yang tiap
sukunya wajib punya kutipan, dan sinyal tanpa titik operasi terbit dapat LR satu
sehingga tidak menggerakkan apa pun. Yang belum: memasangnya.

**"Angkanya jadi berapa?"**
Pada prevalensi satu persen, hasil GeoPref positif menggerakkan probabilitas ke sekitar
delapan persen. Delapan persen itu yang membenarkan kalimat "disarankan pemeriksaan
lanjutan", dan sekaligus yang membantah kalau ada yang membacanya sebagai diagnosis.
Kami lebih suka menyebut angka yang rendah hati daripada tidak menyebut angka.

**"Bagaimana dengan bias?"**
Harus disebut di muka: pada studi aslinya, spesifisitas SenseToKnow 53,6 persen pada anak
kulit hitam berbanding 82,7 persen pada anak kulit putih. GeoPref dilaporkan setara
lintas ras. Analisis subgrup akan dipra-registrasi untuk Gate C. Dan tidak ada satu pun
instrumen yang kami pakai divalidasi di Indonesia.

**"Data anaknya ke mana?"**
Tidak ke mana-mana. Seluruh pemrosesan kamera berjalan di perangkat; video mentah dan
landmark tidak pernah diunggah maupun disimpan. Log teknis hidup di memori sampai
operator memilih mengunduh. Nama panggilan anak dipakai untuk memanggil namanya lewat
speech synthesis, dan tidak pernah masuk ke profil, log audit, maupun disk.

**"Kenapa 80 detik? Balita tidak akan duduk selama itu."**
Ini keterbatasan yang kami akui dan belum uji. Baterainya belum pernah dijalankan pada
balita. Toleransi terhadap durasi ini adalah salah satu hal pertama yang harus diukur
Gate C, dan attrition 42 persen dari ManyBabies adalah ekspektasi awal kami, bukan
kejutan.

**"Bedanya dengan SenseToKnow apa?"**
Bukan modelnya. SenseToKnow membuktikan kamera perangkat konsumen layak; kami memakai
keluarga indeksnya sebagai preseden. Yang kami tambahkan arsitektur untuk konteks lain:
PWA tanpa backend sehingga Posyandu ke-1.000 tidak menambah biaya perangkat lunak,
dioperasikan kader bukan klinisi, luring, dengan keadaan ditahan yang didesain sebagai
hasil dan bukan sebagai error, dan laporan satu halaman yang bisa diserahkan di atas
kertas.

**"Gate A dan B ini datanya dari mana? Bisa dibuktikan?"**
Sesinya sungguhan dan ada dokumentasi fotonya. Yang harus kami sebut sendiri: harness
perekamnya hidup di luar repositori waktu itu dan hilang, jadi dari dalam repositori
tidak ada cara membuktikan berkasnya berasal dari kamera. Ringkasannya dapat
diturunkan ulang dari berkas mentah, hash-nya dapat diverifikasi, tapi mata rantai itu
bersandar pada pernyataan kami. Kami menuliskannya di
`docs/provenance/harness_gate_a_b.md` alih-alih menunggu orang lain menemukannya, dan
kontrol positif adalah bukti pertama yang direkam dengan aturan yang menutup celah itu.

**"Kenapa tidak ada AI generatif?"**
Kami pertimbangkan untuk membangkitkan penjelasan bagi orang tua, lalu tolak. Setiap
kalimat di laporan ini harus dapat ditelusuri ke berkas, dan model generatif tidak dapat
menjaminnya di perangkat yang luring dan tanpa pengawasan. Bagian AI-nya ada di tempat
lain: pipeline pandangan di perangkat yang lolos uji parity Python ke browser, seleksi
model lewat bootstrap berpasangan, studi degradasi temporal yang menunjukkan fitur
kinematik bergeser 69 persen ketika laju turun dari 26 ke 13 Hz sementara fitur geometri
bergeser 1,6 persen, dan penjaga out-of-distribution yang menolak model kami sendiri di
perangkat.

---

## Sumber setiap angka

| Angka | Sumber |
|---|---|
| 56 bulan, 32 bulan | Bagian Pendahuluan paper, sitiran di `paper/sumber/paper_final.tex` |
| Ambang 69%, sens 17%, spec 98%, PPV 81%, NPV 65% | Wen dkk. 2022, *Scientific Reports*, n=1.863, usia 12–48 bulan |
| Sens 87,8% / spec 80,8%, AUC 0,90 | Perochon dkk. 2023, *Nature Medicine* (SenseToKnow), 475 balita |
| Spec 53,6% vs 82,7% lintas ras | Perochon dkk. 2023 |
| Attrition 42%, N=125, 16 lab | Steffan dkk. 2024, *Infancy*, usia 18–27 bulan |
| 599 dolar, FDA 510(k) | EarliPoint, izin 2022, usia 16–30 bulan |
| Kontrol positif: 12 peserta, 23 sesi, 0 dari 9 | `research/hasil/kontrol_positif/ringkasan.json` |
| Tabel empat lengan | `research/hasil/gate_c_simulation.json` |
| Rp 3.500 dan Rp 13.900 per sesi | `docs/dampak_dan_adopsi.md`, asumsi dinyatakan |
| ΔAUC 0,059, p = 0,087, korelasi 0,93 | `research/hasil/perbandingan_model.json` |
| Degradasi temporal 69% vs 1,6% | `research/hasil/degradasi_temporal.json` |
| AUC 0,932 dan shortcut 0,751, p = 0,005 | `research/hasil/audit_wajah.json` |
| Gate A: 2,36° median, 3,58° p90, 94 sesi | `research/hasil/gate_a/gate_a_summary.json` |
| Gate B: 0,040997; AOI 0,997118 | `research/hasil/gate_b/gate_b_summary.json`, blok `recomputation` |
