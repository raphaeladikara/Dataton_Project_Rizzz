# Pitch 7 menit

Naskah kerja untuk presentasi semifinal. Delapan bagian, total 7 menit, ditambah
daftar pertanyaan yang hampir pasti muncul beserta jawabannya.

Aturan yang berlaku di seluruh naskah: **tidak ada angka tanpa sumber, dan tidak ada
klaim yang tidak bisa ditunjukkan di layar dalam sepuluh detik.** Setiap angka di bawah
punya baris "di layar" yang menunjukkan dari artefak mana ia berasal.

Sebelum naik: buka empat tab — beranda aplikasi, `/validation`,
`research/hasil/gate_c_simulation.json` (atau tabel Bagian 5 yang sudah dicetak), dan
laporan hasil demo. Jangan berpindah tab lebih dari tiga kali sepanjang pitch.

---

## Peta waktu

| # | Bagian | Menit | Kumulatif |
|---|---|---:|---:|
| 1 | Masalah | 0:45 | 0:45 |
| 2 | Kenapa alat yang ada gagal di Posyandu | 0:45 | 1:30 |
| 3 | Demo | 1:30 | 3:00 |
| 4 | Kenapa boleh dipercaya | 0:50 | 3:50 |
| 5 | Kenapa punya batas | 1:00 | 4:50 |
| 6 | Bukti instrumen | 0:50 | 5:40 |
| 7 | Momen integritas | 0:50 | 6:30 |
| 8 | Yang belum selesai | 0:30 | 7:00 |

Bagian 3 adalah satu-satunya yang boleh molor. Kalau demo makan 2 menit, potong
Bagian 6 jadi dua kalimat — Gate A dan Gate B sudah tertulis di `/validation` dan juri
bisa membacanya sendiri. Yang tidak boleh dipotong adalah Bagian 5 dan 7.

---

## 1. Masalah (0:45)

> Autisme paling responsif terhadap intervensi sebelum usia tiga tahun. Di Indonesia,
> diagnosis rata-rata baru datang di usia 56 bulan — sekitar 32 bulan setelah orang tua
> pertama kali merasa ada yang berbeda. Jadi masalahnya bukan orang tua yang tidak
> sadar. Masalahnya adalah 32 bulan antara "saya khawatir" dan "ini namanya apa".
>
> Titik layanan yang sudah menjangkau hampir setiap desa cuma satu: Posyandu. Yang
> belum ada di sana adalah pengukuran objektif.

**Di layar:** satu slide, dua angka (56 bulan, 32 bulan). Jangan lebih.

## 2. Kenapa alat yang ada gagal di Posyandu (0:45)

> Ada dua kutub. Di satu sisi ceklis seperti M-CHAT dan KPSP: murah, bisa disebar, tapi
> bergantung pada laporan manusia dan spesifisitasnya rendah. Di sisi lain instrumen
> objektif: EarliPoint sudah dapat izin FDA 510(k) untuk anak 16 sampai 30 bulan, dan
> biayanya 599 dolar per pemeriksaan dengan eye-tracker khusus di fasilitas klinis.
>
> Yang tidak ada adalah pengukuran objektif yang bisa dijalankan kader, di tablet
> Android biasa, tanpa jaringan. Itu yang kami bangun.

**Di layar:** tiga kolom — ceklis / Neurogaze / eye-tracker klinis.

## 3. Demo (1:30)

Jalankan **Demo cepat** dari beranda. Diam sebentar; biarkan sesinya berjalan.

> Yang jalan barusan pipeline yang sama persis dengan sesi sungguhan: kalibrasi,
> stimulus, gerbang mutu, resolver hasil. Demonya tidak bisa menampilkan hasil yang
> tidak akan diproduksi sistem, karena demonya memakai kode yang sama.

Tunjuk label sumber di kepala laporan.

> Laporan ini bilang sendiri dari mana ia datang: rekaman atau simulasi. Kami tidak mau
> juri harus percaya bahwa yang dilihat itu sesi asli.

Lalu tunjuk tiga hal, berurutan:

1. **Persentase fiksasi geometrik** — satu angka, dengan ambangnya.
2. **Lima indeks perilaku** — masing-masing membawa sumber referensinya sendiri.
3. **Lajur komposit** — tiga sinyal, masing-masing dengan nilai terukur dan statusnya.
4. **Kalimat hasil** — rujuk, terukur tanpa rujuk, protokol dipersingkat, atau ditahan.

> Perhatikan yang tidak ada di laporan ini: tidak ada skor gabungan, tidak ada gauge,
> tidak ada persentase risiko autisme. Keenam ukuran itu tidak boleh dijumlahkan
> sebelum ada balita berlabel untuk memfit bobotnya, jadi tipe datanya sendiri
> melarang: field `combinedScore` bernilai null dan tidak ada jalur kode yang bisa
> mengisinya.

**Kalau demo berakhir "sesi belum dapat dinilai":** jangan panik dan jangan ulangi.
Itu bahan bicara.

> Ini keadaan ditahan, dan ini hasil yang sah, bukan error. Attrition webcam pada balita
> yang dilaporkan ManyBabies 42 persen. Alat yang tidak pernah menolak mengeluarkan
> angka adalah alat yang mengarang angka.

## 4. Kenapa boleh dipercaya (0:50)

> Satu-satunya pemicu rujukan otomatis di sistem ini bukan ambang karangan kami. Namanya
> GeoPref, dan ambangnya 69 persen waktu pada pola geometrik. Angkanya dari Wen dan
> kolega 2022 di Scientific Reports: 1.863 anak, usia 12 sampai 48 bulan — persis rentang
> usia sasaran kami. Sensitivitas 17 persen, spesifisitas 98 persen, PPV 81 persen.
>
> Kami tidak melatih ambang ini. Kami tidak mengoptimasinya. Kami memakai angka terbit
> apa adanya, dan kalau protokolnya tidak sama persis, ambangnya kami tahan.

**Di layar:** `/validation`, atau slide dengan kutipan Wen 2022.

Catatan penting untuk dikatakan sekarang, bukan nanti:

> Klip stimulus yang kami pakai 16,75 detik CC BY, bukan stimulus terbit 60 sampai 90
> detik. Karena itu ambang 69 persen sedang **ditahan** di aplikasi: sesi melaporkan
> persentase terukur dan menyatakan protokolnya dipersingkat. Surat permintaan akses
> stimulus penuh ke UCSD sudah disiapkan.

## 5. Kenapa punya batas (1:00)

Ini bagian terpenting. Lambatkan.

> Sensitivitas 17 persen artinya alat ini melewatkan sebagian besar anak autistik. Itu
> bukan bug. Itu bentuk alatnya. GeoPref adalah alat *rule-in*: hasil positif layak
> ditindaklanjuti, hasil negatif hampir tidak mengubah apa pun — NPV-nya 65 persen.
> Karena itu aplikasi tidak pernah menulis kata "aman", dan hasil di bawah ambang
> selalu datang dengan kalimat bahwa tes ini melewatkan sebagian besar anak ASD.
>
> Alat ini jalan berdampingan dengan SDIDTK, bukan menggantikannya.

Tampilkan tabel empat lengan. Ini artefak terkuat yang kami punya.

| Titik kerja | Sens | Spec | Laju rujukan | Rujukan per 1 kasus benar |
|---|---:|---:|---:|---:|
| Regresi logistik, sensitivitas 0,9 | 0,923 | 0,179 | 82,2% | 89,1 |
| Regresi logistik, Youden | 0,731 | 0,821 | 18,4% | 25,2 |
| **GeoPref 69% (yang dipakai)** | **0,170** | **0,980** | **2,2%** | **12,6** |
| Target Gate C (preseden tablet) | 0,878 | 0,808 | 19,9% | 22,6 |

> Kohort 1.000 anak, prevalensi 1 persen, coverage teknis 90 persen — jadi 900 anak
> bisa dinilai dan 9 kasus ada di dalamnya. Baris paling atas adalah titik kerja yang
> paling menggoda dipamerkan: sensitivitas 92 persen. Ia merujuk 740 dari 1.000 anak.
> Puskesmas mana pun akan berhenti memakai alatnya di minggu kedua.
>
> Baris yang kami pilih merujuk 19 anak dan butuh 12,6 rujukan untuk menemukan satu
> kasus benar. Ia juga menemukan paling sedikit: 1,5 dari 9. Kami memilihnya bukan
> karena angkanya paling bagus, tapi karena itu satu-satunya yang muat di kapasitas
> rujukan yang benar-benar ada.

**Di layar:** `research/hasil/gate_c_simulation.json` atau tabel di atas.

## 6. Bukti instrumen (0:50)

> Dua pertanyaan berbeda: apakah kamera tablet cukup teliti, dan apakah aliran
> pengukurannya sejalan dengan metode yang sudah divalidasi orang lain.
>
> Yang pertama, Gate A: 100 sesi, 25 peserta dewasa, tiga tablet Android, cahaya normal
> dan redup, dengan dan tanpa kacamata. Terhadap target kalibrasi yang koordinatnya
> kami tahu, galat mediannya 2,36 derajat dan persentil 90-nya 3,58 derajat pada 94
> sesi. Sebagai pembanding, WebGazer melaporkan 4,17 derajat.
>
> Yang kedua, Gate B: 30 perbandingan browser simultan terhadap WebGazer.js 3.5.3.
> Kenapa WebGazer? Karena itu metode yang divalidasi ManyBabies untuk balita 18 sampai
> 27 bulan — Steffan dkk. 2024, 125 anak, 16 laboratorium. Kami tidak memilih pembanding
> yang menguntungkan; kami memilih yang punya bukti pada usia sasaran.

**Di layar:** `/validation`.

Satu kalimat penutup bagian ini, dan katakan sebelum juri menanyakannya:

> Gate A dan Gate B membuktikan alat ukurnya bekerja. Keduanya tidak membuktikan apa pun
> tentang akurasi diagnosis. Belum ada satu pun balita dalam bukti kami.

## 7. Momen integritas (0:50)

Dua cerita, keduanya pendek.

> Pertama: model terbaik kami tidak dipakai. Regresi logistik Carette punya AUC 0,82 dan
> CNN-nya 0,88, tapi fitur geometrinya mengkodekan tata letak stimulus studi asalnya,
> anaknya berusia rata-rata 7,88 tahun, dan sumbernya eye-tracker 250 Hz. Jadi batas
> keputusannya tidak berpindah ke balita di kamera 30 fps — bahkan seandainya usianya
> cocok. Model itu tetap ada di repo, tapi ia hanya mengisi panel riset yang dijaga
> penapis out-of-distribution, dan tidak punya jalur kode untuk memutuskan apa pun.
>
> Kedua: kami menghitung ulang metrik Gate B dari koordinat mentah, bukan dari field
> yang ditulis browser. Jaraknya tereproduksi sampai 0,001 piksel. Agreement AOI tidak:
> pada 4 dari 27 pasangan ada satu sampel yang jatuh tepat di luar kotak AOI. Angka kami
> turun dari 99,7574 menjadi 99,7118 persen. Harness perekamnya tidak ada lagi di repo,
> jadi selisihnya tidak bisa ditelusuri ke sumbernya — dan kami menerbitkan selisihnya
> alih-alih mendamaikannya.
>
> Selisih 0,05 persen itu tidak mengubah kesimpulan apa pun. Kami menyebutnya karena
> tim yang mengoreksi angkanya sendiri lebih layak dipercaya daripada tim yang angkanya
> selalu bagus.

## 8. Yang belum selesai (0:30)

> Gate C dan Gate D masih terbuka. Targetnya sudah kami tetapkan dari literatur, bukan
> dari harapan: sensitivitas 88 persen dan spesifisitas 81 persen, angka SenseToKnow di
> Nature Medicine pada kelas perangkat yang sama.
>
> Yang kami butuhkan bukan pekerjaan teknis tambahan. Yang kami butuhkan mitra klinis
> berizin etik. Kami sudah menghubungi lima lembaga dan semuanya menolak — dan itu
> keputusan yang benar dari pihak mereka.
>
> Sampai izin itu ada, tidak ada satu pun balita dan tidak ada satu pun anak autistik
> yang kami rekam. Bukan untuk melatih model, bukan untuk demo hari ini. Yang berlabel
> di jalur kami seluruhnya datang dari data yang peneliti lain sudah terbitkan dengan
> izin yang mereka punya.

Berhenti di sini. Jangan menambahkan kalimat penutup yang menjual.

---

## Pertanyaan yang hampir pasti datang

**"Sensitivitas 17 persen itu tidak berguna, kan?"**
Berguna kalau perannya benar. Ini alat rule-in yang jalan berdampingan dengan ceklis,
bukan pengganti ceklis. Ceklis menangkap luas dengan spesifisitas rendah; GeoPref
menangkap sempit dengan spesifisitas 98 persen. Yang tidak boleh terjadi adalah hasil
negatifnya dibaca sebagai aman, dan itulah kenapa aplikasi menolak menulisnya begitu.

**"Kenapa tidak pakai CNN yang AUC-nya lebih tinggi?"**
Tiga alasan yang berdiri sendiri-sendiri. Kontrak inputnya salah: CNN itu dilatih pada
raster yang kanal warnanya membawa kecepatan, akselerasi, dan jerk dari sinyal 250 Hz,
dan tidak ada cara sah merekonstruksinya dari kamera 30 fps. Ia tidak jalan di perangkat
sasaran. Dan selisih 0,059 AUC itu diukur pada populasi yang usianya salah.

**"Kalau belum ada balita, kenapa yakin ini jalan?"**
Kami tidak yakin, dan tidak mengklaim yakin. Yang kami buktikan tiga hal: alat ukurnya
teliti (Gate A), aliran pengukurannya sejalan dengan metode yang divalidasi untuk balita
(Gate B), dan ambang keputusannya diambil dari studi 1.863 balita, bukan dari data kami.
Yang belum terbukti adalah performa skrining pada balita Indonesia. Itu Gate C.

**"Kenapa tidak rekam anak-anak di sekitar kalian saja buat data? Cuma 80 detik."**
Durasi bukan yang menentukan. Balita tidak bisa memberi persetujuan, jadi yang
menggantikannya adalah keputusan orang lain, dan struktur yang mengawasi keputusan itu
namanya kaji etik. Melewatinya bukan mempercepat penelitian — itu menghapus satu-satunya
pihak yang mewakili kepentingan anaknya. Kami menghubungi lima lembaga dan semuanya
menolak, dan pada tahap bukti kami hari ini itu keputusan yang benar. Kalau kami
bersedia melewatinya demi lomba, tidak ada alasan percaya kami tidak akan melewatinya
untuk hal lain.

**"Kalau tidak ada balita, model kalian dilatih pakai apa?"**
Data eye-tracking anak ASD dan TD yang sudah diterbitkan terbuka — Cilia dkk. 2022, CC
BY 4.0, 59 anak, koordinat mentah, ID partisipan ada. Consent-nya diambil pihak yang
punya izinnya. Kami tidak merekam satu anak pun. Yang kami pindahkan dari sana adalah
bobot relatif antar indeks, bukan titik operasinya, dan pernyataan lingkupnya ikut ke
laporan: anak 3–12 tahun dengan eye-tracker lab bukan balita 12–48 bulan dengan kamera
tablet. Ambang keputusannya sendiri kami cabut dan ganti dengan penjumlahan likelihood
ratio yang tiap sukunya punya kutipan — sinyal tanpa titik operasi terbit dapat LR satu
dan tidak menggerakkan apa pun.

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
keluarga indeksnya sebagai preseden. Yang kami tambahkan orkestrasi untuk konteks lain:
dioperasikan kader bukan klinisi, luring, di tablet kelas menengah bawah, dengan gerbang
mutu yang menahan hasil dan laporan satu halaman yang bisa diserahkan ke Puskesmas di
atas kertas.

---

## Sumber setiap angka

| Angka | Sumber |
|---|---|
| 56 bulan, 32 bulan | Bagian Pendahuluan paper, sitiran di `paper/sumber/paper_final.tex` |
| Ambang 69%, sens 17%, spec 98%, PPV 81%, NPV 65% | Wen dkk. 2022, *Scientific Reports*, n=1.863, usia 12–48 bulan |
| Sens 87,8% / spec 80,8%, AUC 0,90 | Perochon dkk. 2023, *Nature Medicine* (SenseToKnow), 475 balita |
| Spec 53,6% vs 82,7% lintas ras | Perochon dkk. 2023 |
| Attrition 42%, N=125, 16 lab | Steffan dkk. 2024, *Infancy*, usia 18–27 bulan |
| WebGazer 4,17° | Papoutsaki dkk. 2016 |
| 599 dolar, FDA 510(k) | EarliPoint, izin 2022, usia 16–30 bulan |
| Gate A: 2,36° median, 3,58° p90, 94 sesi | `research/hasil/gate_a/gate_a_summary.json`, blok `knownTargetValidation` |
| Gate B: 0,040997; AOI 0,997118 vs 0,997574 | `research/hasil/gate_b/gate_b_summary.json`, blok `recomputation` |
| Tabel empat lengan | `research/hasil/gate_c_simulation.json` |
| AUC 0,8228 (LR) dan 0,8819 (CNN) | `research/hasil/training.json`, `research/hasil/cnn_scanpath` |
| Carette: 54 anak, 7,88 tahun, 250 Hz | Carette dkk. 2019 |
