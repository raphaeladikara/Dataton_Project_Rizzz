# Neurogaze

**Arsitektur inferensi bergerbang untuk riset pengukuran atensi di Posyandu.** PWA statis
yang berjalan luring di tablet Android biasa: kamera diproses di perangkat, video mentah
tidak pernah diunggah maupun disimpan, dan tidak ada server di belakangnya. Posyandu
ke-1 dan Posyandu ke-1.000 memuat berkas yang sama.

> Neurogaze bukan alat diagnosis dan belum mengaktifkan rujukan otomatis balita.
> Ambang *rule-in* 69% dari literatur ditahan karena klip lapangan lebih pendek
> daripada protokol tempat titik operasi itu diterbitkan.

**Rujukan otomatis balita ditahan.**

Baterai pengukuran berlangsung 67 detik. Waktu kunjungan juga mencakup izin,
penyiapan, dan kalibrasi. Laporan satu halaman adalah prototipe untuk diuji bersama
tenaga kesehatan; belum ada kader atau praktisi yang mengujinya.

Repositori ini berisi produknya dan bukti yang menopangnya. Seluruh dokumentasi ada di
berkas ini; angkanya berasal dari berkas bukti di [`research/hasil`](research/hasil), dan
dua tabel di bawah dihasilkan skrip yang gagal kalau isinya melenceng dari bukti.

---

## Yang membedakan sistem ini

Hampir semua ML yang dikerahkan ke lapangan mengandaikan data masuk mirip data latihnya.
Ketika andaian itu salah, modelnya tetap mengeluarkan angka — dengan percaya diri, tanpa
memberi tahu siapa pun. Di skrining anak, itu rasa aman palsu yang diserahkan ke orang
tua.

Neurogaze memasang gerbang tepat di titik itu. Tujuh komponen menyusunnya, dan tiap
komponen punya berkas buktinya.

### 1. Fitur dipilih dengan pengukuran, bukan selera

Kamera Posyandu berjalan ~26 fps dan sering lebih lambat. Kami desimasi 27 sesi
berpasangan Gate B yang membawa stempel waktu sungguhan, lalu ukur keluarga fitur mana
yang bertahan:

| Laju efektif | Fitur kinematik | Fitur geometri |
|---|---:|---:|
| 26,2 Hz (dasar) | — | — |
| **13,1 Hz** | **bergeser 69,4%** | **bergeser 1,6%** |
| 8,7 Hz | bergeser 79,7% | bergeser 2,8% |
| 5,2 Hz | bergeser 84,4% | bergeser 5,6% |

Angka 69,4% dan 1,6% adalah median drift relatif akibat desimasi, bukan akurasi
klasifikasi. Hasilnya mendukung pemilihan geometri, tetapi tidak membuat seluruh
fitur geometri kebal: beberapa fitur tetap memiliki pelestarian peringkat lemah atau
drift besar pada laju yang lebih rendah.
[`research/hasil/degradasi_temporal.json`](research/hasil/degradasi_temporal.json)

### 2. Seleksi model yang menjatuhkan model kami sendiri

CNN kami ber-AUC 0,882; regresi logistik 13 fitur ber-AUC 0,823. Yang dikirim: yang
lebih rendah. Bootstrap berpasangan terstratifikasi, 10.000 replikasi, 54 partisipan
yang sama — ΔAUC 0,059 dengan CI95 **[−0,007, +0,137]**, p = 0,087, dan korelasi
prediksi **0,93**. CNN-nya bukan model yang lebih pintar; ia model yang lebih rumit
untuk sinyal yang sama.
[`research/hasil/perbandingan_model.json`](research/hasil/perbandingan_model.json)

### 3. Penjaga out-of-distribution yang berjalan di perangkat, dan terbukti dua arah

Regresi logistik dikirim ke tablet dan dijalankan **setiap sesi**. Penjaga lalu
memutuskan apakah keluarannya boleh dibaca — dan pada stimulus ini ia menolak, sambil
menyebut fitur mana yang di luar distribusi beserta jaraknya. Penolakan itu tercetak di
laporan, bukan disembunyikan.

Penjaga yang hanya pernah menolak tidak dapat dibedakan dari `false` yang dipasang tetap,
jadi ia dijalankan pada dua populasi:

| | Diterima | Mahalanobis median |
|---|---:|---:|
| Domain sumber Carette, 547 vektor | **544** | 10,8 |
| Stimulus yang dikirim, 23 sesi kontrol positif | **1** | 199,2 |

Referensinya dikalibrasi pada persentil 99,5 kohort itu, jadi baris pertama adalah
pemeriksaan kewarasan dan bukan uji generalisasi. Yang menjadi bukti adalah kontrasnya,
dan bahwa seluruh 23 keputusan yang dibuat TypeScript di peramban **dihitung ulang oleh
Python dari log dan menghasilkan verdict yang sama**.
[`app/src/quality/ood.ts`](app/src/quality/ood.ts) ·
[`research/hasil/ood_dua_arah.json`](research/hasil/ood_dua_arah.json)

### 4. Tata kelola yang dijaga type checker

`combinedScore` bernilai `null` dan tidak ada jalur kode yang dapat mengisinya.
Menggabungkan lajur berambang-terbit dengan lajur deskriptif bukan sesuatu yang kami
janjikan tidak akan dilakukan — itu sesuatu yang **tidak dapat dikompilasi**.

### 5. Bobot dari data anak terbit, dan audit yang menolaknya

Memasang bobot antar indeks tidak menuntut merekam balita: data anak berlabel sudah
terbit. Cilia dkk. 2022 (CC BY 4.0, 59 anak, 2,25 juta baris koordinat) dipakai untuk
menghitung indeks di ruang perilaku, bukan ruang piksel. Empat audit beserta kriteria
penolakannya ditulis sebelum fitting dijalankan. Dua gagal, dan yang menentukan adalah ini:

| Prediktor tunggal | AUC |
|---|---:|
| Rasio pelacakan alat | 0,853 |
| Fraksi kedip | 0,847 |
| Fraksi fiksasi | 0,826 |
| Mengikuti isyarat arah *(perilaku)* | **0,504** |

Alas yang tidak memuat satu pun fitur perilaku mencapai AUC 0,905; model indeks perilaku
hanya 0,784. **Pada dataset itu, seberapa baik alatnya merekam seorang anak lebih
memprediksi labelnya daripada apa yang ditatap anak itu.** Bobot tidak dipromosikan,
lapis likelihood-ratio dikirim sendirian, dan penolakannya diterbitkan sebagai hasil.
[`research/hasil/model_rujukan.json`](research/hasil/model_rujukan.json)

Dan kami menjalankan audit yang sama pada data sendiri. Mutu rekaman tingkat sesi saja,
pada kontrol positif kami: **AUC 0,537, p = 0,26** — kebetulan. Yang memisahkan kedua
kondisi kami adalah perilaku, bukan cara sesinya direkam.
[`research/hasil/audit_shortcut_sendiri.json`](research/hasil/audit_shortcut_sendiri.json)

### 6. Ambang dibandingkan terhadap selang, bukan terhadap satu angka

Klip 16,75 detik hanya menghasilkan sekitar 300 sampel di dalam AOI, jadi galat
pencuplikan berjalan belasan poin. Ambang 69% karena itu dibandingkan dengan selang
kepercayaan 95% sesi; selang yang melintasi ambang membuat sinyalnya *tidak dapat
dinilai*, bukan positif.

| Preferensi sebenarnya | Aturan titik lama | Aturan selang sekarang |
|---:|---:|---:|
| 0,69 — persis di ambang | 52,2% | **4,8%** |
| 0,90 — preferensi tinggi | 100% | **99,0%** |

Lemparan koinnya hilang; sensitivitas pada preferensi tinggi tidak. Tabelnya
direproduksi oleh
[`research/simulate_geopref_interval.py`](research/simulate_geopref_interval.py).

### 7. Audit shortcut, dirilis sebagai alat

Pemeriksaan yang menolak bobot lapis 2 tidak berlaku khusus untuk proyek ini. Ia berlaku
untuk siapa pun yang melatih klasifikator pada dua kelompok yang direkam sedikit berbeda,
dan kegagalan yang dicarinya senyap: setiap fitur yang dibaca modelnya tetap punya nama
yang terdengar seperti perilaku.

```bash
python research/shortcut_audit.py data.csv --label kelas \
    --nuisance n_sampel rasio_pelacakan fraksi_kedip \
    --behaviour indeks_1 indeks_2 --group id_partisipan
```

Ia dijalankan pada dua arah di repositori ini: `shortcut_present` pada data Cilia, dan
`no_shortcut_detected` pada kontrol positif kami sendiri.
[`research/shortcut_audit.py`](research/shortcut_audit.py)

---

## Apa yang dihasilkan satu sesi

Baterai 67 detik mengukur tiga hal dan melaporkannya terpisah. Blok preferential
looking berjalan kedua, tepat sesudah blok atensi pembuka, karena ia membawa
satu-satunya ambang terbit di sistem ini dan tidak boleh diukur pada anak yang sudah
lelah dan sudah terprimasi secara sosial.

| Lapis | Isinya | Status hari ini |
|---|---|---|
| **A — GeoPref** | Persentase fiksasi geometrik; titik operasi 69% berasal dari Wen dkk. 2022 (n=1.863, usia 12–48 bulan, sensitivitas 17%, spesifisitas 98%) | Persentase dilaporkan, tetapi rujukan otomatis ditahan pada klip 16,75 detik |
| **B — Profil perilaku** | Menghadap layar, gerak kepala, laju kedip, respons nama, mengikuti isyarat dengan uji tanda dalam-sesi | Tidak. Deskriptif, dibaca berdampingan dengan SDIDTK/M-CHAT |
| **B2 — Rekomendasi komposit** | Aturan terbaca atas GeoPref dan kontras mengikuti isyarat | Hanya diperagakan pada orang dewasa; `emitsReferral` tetap `false` |
| **C — Model gabungan berbobot** | Dirancang, belum dipasang. Kalibrasi likelihood-ratio yang tiap sukunya wajib punya sitiran | Belum |

Ambang terbit dibandingkan terhadap **selang kepercayaan 95%** sesi, bukan terhadap satu
titik. Sesi yang mengukur 71% pada cuplikan 16,75 detik tidak dapat dibedakan dari yang
mengukur 67%, jadi selang yang melintasi 69% membuat sinyalnya *tidak dapat dinilai* —
standar yang sama seperti uji tanda pada mengikuti isyarat.

Tiga indeks sengaja dikeluarkan dari aturan. Menghadap layar dan gerak kepala membawa
AUC preseden tetapi tidak punya ambang yang dapat dipindahkan. Diferensial kedip keluar
karena satu-satunya blok non-aktor di baterai adalah klip preferential looking, sehingga
kontras kedip sosial/non-sosial sepenuhnya terkonfound dengan medium penyajian. Ketiganya
tetap muncul di laporan sebagai ukuran deskriptif.

**Tidak ada pengukuran yang melintasi batas medium.** GeoPref diskor seluruhnya di dalam
klip; mengikuti isyarat membandingkan pasca-isyarat terhadap pra-isyarat di dalam
percobaan vektor yang sama; respons nama adalah deteksi kejadian di dalam blok vektor.

### Laporan yang benar-benar keluar

Dua peragaan dari rekaman terdaftar yang sama-sama lulus mutu: yang kiri memenuhi
aturan, yang kanan tidak. Keduanya membawa spanduk mode demonstrasi dan `emitsReferral`
tetap `false`, karena pesertanya orang dewasa dan klipnya dipersingkat.

| Aturan menyala | Aturan tidak menyala |
|---|---|
| ![Laporan peragaan, aturan menyala](docs/tangkapan_layar/03-laporan-peragaan-pola-diproduksi.png) | ![Laporan peragaan, aturan tidak menyala](docs/tangkapan_layar/04-laporan-peragaan-menonton-biasa.png) |

Lapis pengasuh muncul lebih dulu — apa yang terjadi, apakah rekamannya terpakai, langkah
berikutnya, batas hasil — sedangkan indeks, selang kepercayaan, p-value, jalur keputusan,
status OOD, dan metadata teknis berada di balik satu pengungkapan.

Seluruh tangkapan layar diambil 21 Agustus 2026 dari build produksi (`npm run build`
lalu `npm start`), bukan dari mode pengembangan dan bukan mockup — Chrome headless,
1440 px untuk layar lebar dan 390 px untuk ponsel.

| Berkas | Isi | Asal angka |
|---|---|---|
| [`01-beranda.png`](docs/tangkapan_layar/01-beranda.png) | Beranda, satu tombol sesi lapangan | — |
| [`02-panduan-dan-demo.png`](docs/tangkapan_layar/02-panduan-dan-demo.png) | Panduan & demo: tiga skenario tetap, satu kendali per rekaman terdaftar, dan peragaan kamera langsung | — |
| [`03-laporan-peragaan-pola-diproduksi.png`](docs/tangkapan_layar/03-laporan-peragaan-pola-diproduksi.png) | Laporan peragaan, aturan menyala | Replay `sesi-produksi.json` |
| [`04-laporan-peragaan-menonton-biasa.png`](docs/tangkapan_layar/04-laporan-peragaan-menonton-biasa.png) | Laporan peragaan, aturan tidak menyala | Replay `sesi-biasa.json` |
| [`05-laporan-rincian-tenaga-kesehatan.png`](docs/tangkapan_layar/05-laporan-rincian-tenaga-kesehatan.png) | Laporan yang sama dengan pengungkapan tenaga kesehatan dibuka | Replay `sesi-produksi.json` |
| [`06-bukti-validasi.png`](docs/tangkapan_layar/06-bukti-validasi.png) | Halaman `/validation` | `research/hasil` lewat `export_public_evidence.py` |
| [`07-beranda-ponsel.png`](docs/tangkapan_layar/07-beranda-ponsel.png) | Beranda pada 390 px | — |
| [`08-menu-ringkas-ponsel.png`](docs/tangkapan_layar/08-menu-ringkas-ponsel.png) | Menu ringkas terbuka, empat tujuan tetap berlabel | — |

Yang **tidak** ada di sana, dan kenapa: tidak ada sesi kamera langsung dengan peserta
sungguhan, karena menangkapnya berarti memasang wajah orang di repositori publik tanpa
persetujuan untuk itu. Dan tidak ada laporan rujukan lapangan, karena jalur
`target_population_research` tidak pernah membuat perbandingan 69% — gambar yang
memperlihatkannya akan berbohong.

---

## Bukti lapangan yang sudah ada

Sebelum bicara apa yang belum diuji, ini yang sudah dijalankan — dan seluruhnya pada
manusia sungguhan, perangkat sungguhan, dan cahaya sungguhan.

| | |
|---|---|
| Sesi dijalankan ujung-ke-ujung | **123** — 100 Gate A, 23 kontrol positif |
| Dewasa yang menyetujui dan diukur | **37** — 25 Gate A, 12 kontrol positif |
| Operator | 3 |
| Tablet Android kelas menengah | 3 — Galaxy Tab A8, Lenovo Tab M10, Redmi Note 13 |
| Kondisi lingkungan | 6 — cahaya redup, normal, campuran × berkacamata dan tidak |

Batasnya disebut bersama angkanya: **operatornya tim proyek, bukan kader Posyandu, dan
lokasinya bukan Posyandu.** Yang ditunjukkan ini adalah alur operator yang berjalan
berulang di perangkat dan pencahayaan yang realistis. Keterpakaian oleh kader adalah baris
terpisah di matriks kesiapan, dan baris itu masih kosong.

## Status bukti

Bukti terkuat di sini adalah **kontrol positif**: 12 orang dewasa yang menyetujui untuk
dirinya sendiri, 23 sesi direkam pada tiga perangkat, dan 15 lulus mutu. Denominator
per kondisi adalah 9/11 sesi menonton biasa dan 6/12 sesi pola diproduksi yang dapat
dipakai. Dalam mode demonstrasi, aturan menyala pada 0/9 sesi biasa dan 4/6 sesi pola
diproduksi; mode ini tidak mengeluarkan rujukan.

Ini juga bukti pertama di proyek ini yang rantainya utuh dari kamera sampai angka —
direkam lewat aplikasi, lalu **dihitung ulang dari jejak mentah oleh skrip terpisah**
dan menghasilkan angka yang sama.
[`research/hasil/kontrol_positif/README.md`](research/hasil/kontrol_positif/README.md)

Yang **tidak** ditunjukkannya: apa pun tentang autisme. Pesertanya orang dewasa yang
mengikuti naskah, jadi tidak ada sensitivitas, spesifisitas, atau akurasi di dalamnya.
Yang dibuktikannya adalah bahwa instrumennya merespons, dan bahwa rantai pengukurannya
lengkap dan terinstrumentasi.

### Protokol gerbang validasi

Setiap gerbang menjawab pertanyaan yang berbeda. Kelulusan satu gerbang tidak boleh
dipakai sebagai pengganti gerbang berikutnya. Sesi yang ditahan tetap dihitung dalam
denominator, dan semua hasil harus dapat ditelusuri ke log atau sumber penelitian.

| Gerbang | Pertanyaan yang dijawab | Status | Hasil kanonis |
|---|---|---|---|
| **A — kelayakan teknis** | Apakah webapp dapat memperoleh sinyal kamera dan gaze yang cukup stabil untuk menjalankan sesi? | **Lulus** | 100 sesi, 25 peserta, 3 perangkat; 94% selesai, galat kalibrasi median 2,207°, frame valid 96,4%, dropout 3,6% |
| **B — agreement terhadap WebGazer** | Apakah aliran gaze Neurogaze cukup sejalan dengan WebGazer.js sebagai implementasi referensi pada sesi browser simultan? | **Lulus** | 30 perbandingan simultan terhadap WebGazer.js 3.5.3; 27 siap, galat ternormalisasi median 0,040997, agreement AOI 99,7118% dihitung ulang dari koordinat mentah |
| **C — validasi klinis** | Seberapa baik Neurogaze membantu skrining pada balita 16–30 bulan dibanding hasil klinis independen yang dinilai tanpa melihat keluarannya? | Terbuka | 87,8% / 80,8% adalah preseden SenseToKnow, bukan hasil NeuroGaze |
| **D — implementasi lapangan** | Apakah alur dapat diselesaikan secara aman dan konsisten oleh operator di layanan nyata? | Terbuka | Perlu completion rate, durasi, kebutuhan bantuan, pemahaman laporan, masalah perangkat, dan penerimaan pengguna di lokasi sasaran |

Kontrak kelulusan Gate B ditetapkan sebelum datanya ada: sedikitnya 30 pasangan, valid
pair rate ≥ 90%, galat median ternormalisasi ≤ 0,05, agreement AOI rata-rata ≥ 95%, dan
agreement AOI utama ≥ 95%. Kelimanya dipenuhi oleh 30 log kanonis. ICC fitur tetap
metrik deskriptif.

Pembanding Gate B adalah implementasi referensi WebGazer.js, bukan ground truth atau
standar emas. ManyBabies menguji metode itu pada balita 18–27 bulan (Steffan dkk. 2024,
*Infancy*, N=125 di 16 lab). Gate B adalah agreement perangkat lunak; blok target
diketahui head-to-head belum direkam. Angka Gate A 2,36° median / 3,58° p90 pada 94
sesi lulus adalah konversi sudut lama tanpa jarak pandang per sesi, bukan akurasi
absolut eksak atau bukti bahwa NeuroGaze mengungguli angka 4,17° dari protokol lain.

Ekspor mentah, ringkasan turunan, dan manifest SHA-256 ada di
[`research/hasil`](research/hasil). Setiap metrik pasangan diturunkan ulang dari
koordinat mentah oleh [`research/recompute_gate_b.py`](research/recompute_gate_b.py).

### Matriks kesiapan

Status kanonis enam kapabilitas. Tabel ini **dihasilkan** oleh
[`research/export_readiness_matrix.py`](research/export_readiness_matrix.py) bersama
[`research/hasil/readiness_matrix.json`](research/hasil/readiness_matrix.json); ubah
generatornya lalu ekspor ulang, jangan sunting tabelnya langsung.

<!-- generated:readiness-matrix -->
Status per 2026-08-21.

| Kapabilitas | Status | Bukti hari ini | Batas klaim |
|---|---|---|---|
| Rantai pengukuran di perangkat | Siap untuk demonstrasi rekayasa | Pipeline browser, uji parity, Gate A, dan Gate B | Gate A/B menguji pengukuran teknis, bukan skrining klinis. |
| Respons instrumen pada pola yang diproduksi | Ditunjukkan pada kontrol positif dewasa | 12 dewasa; 23 sesi direkam; 15 lulus mutu; aturan demo 0/9 biasa dan 4/6 pola diproduksi | Manipulation check, bukan sensitivitas, spesifisitas, ASD, atau status klinis peserta. |
| Rujukan otomatis balita | Ditahan | Klip lapangan 16,75 detik lebih pendek daripada protokol penuh tempat ambang 69% diterbitkan | Perbandingan 69% hanya boleh diperagakan dalam mode demo dan tidak mengeluarkan rujukan. |
| Alur operator ujung-ke-ujung | Dijalankan berulang di perangkat nyata | 123 sesi dijalankan 3 operator pada 37 dewasa yang menyetujui: 100 sesi Gate A dan 23 sesi kontrol positif, di 3 tablet Android kelas menengah dan 6 kondisi lingkungan (cahaya redup, normal, campuran × berkacamata dan tidak) | Operatornya tim proyek, bukan kader Posyandu, dan lokasinya bukan Posyandu. Ini menunjukkan alurnya dapat dijalankan berulang di perangkat dan cahaya yang nyata; ia tidak menunjukkan alurnya dapat dijalankan kader. |
| Keterpakaian oleh kader | Belum diuji | Belum ada kader Posyandu yang menjalankan aplikasi | Perlu uji tugas, waktu, kegagalan, pelatihan, dan dukungan di alur layanan nyata. |
| Validitas pada balita Indonesia | Belum diuji | Belum ada balita dalam bukti proyek dan instrumen yang digunakan di sini belum divalidasi di Indonesia | Perlu mitra yang mampu menjalankan kaji etik, izin orang tua setelah penjelasan, acuan klinis buta, linkage privat, rekrutmen, analisis fairness/kegagalan, dan validasi prospektif. |
<!-- /generated:readiness-matrix -->

NeuroGaze saat ini membuktikan rantai pengukuran, mekanisme penolakan, pelaporan, dan
respons instrumen terhadap manipulasi perilaku pada orang dewasa. Proyek ini belum
membuktikan skrining klinis balita Indonesia.

---

## Stimulus preferential looking

Ambang 69% pernah diterapkan pada dua tes berbeda yang tidak berbagi preseden. Wen dkk.
2022 (*Scientific Reports* 12:4253) memvalidasinya pada **GeoPref asli 62,22 detik** —
n=1.863, sensitivitas 17%, spesifisitas 98%. Moore dkk. 2018 membawa ambang yang sama ke
**Complex Social GeoPref 90 detik** demi konsistensi, melaporkan sensitivitas 18%,
spesifisitas 97%, AUC 0,74 pada sampel jauh lebih kecil. Tiap aset di
[`app/src/geopref/stimulusMeta.ts`](app/src/geopref/stimulusMeta.ts) membawa titik
operasinya sendiri.

Yang dikirim bukan keduanya: **cuplikan 16,75 detik** dari video contoh Complex Social
yang diterbitkan sebagai Additional file 2 Moore dkk. 2018. Maka `validatedProtocol`
bernilai false, ambangnya **ditahan**, dan sesi melaporkan persentase terukur sambil
menyatakan protokolnya disingkat.

Dua sifat aset ini disengaja: **ia senyap** (metode Moore dkk. menyatakan tanpa audio —
jangan tambahkan suara) dan **ia letterboxed** (panel hanya mengisi 19,8% frame 640×360,
jadi aplikasi memangkas sekelilingnya agar geometri sudutnya cocok dengan yang
dilaporkan). `geoprefPanelDegrees()` membuat geometri itu dapat diperiksa per perangkat.

---

## Kenapa belum ada rujukan yang keluar

Pertanyaan tersulit yang bisa diajukan ke proyek ini bukan soal sensitivitas 17%.
Pertanyaannya lebih telanjang: kalau alat ini dipasang di Posyandu besok pagi, berapa
anak yang dirujuknya? Jawabannya **nol**, dan bukan karena tidak ada anak yang perlu
dirujuk. Ada dua kunci terpasang di kode, keduanya dipasang sengaja.

**Kunci 1 — Lapis A tidak dapat menyala.** `resolveSessionOutcome` menyalakan
`emitsReferral` hanya pada keadaan `RULE_IN_GEOMETRIC`, dan keadaan itu menuntut
`validatedProtocol` bernilai benar. Klip yang di-*bundle* adalah cuplikan 16,75 detik,
sedangkan ambang 69% divalidasi pada GeoPref asli 62,22 detik. Jadi `validatedProtocol`
bernilai salah, ambangnya ditahan, dan sesi berakhir sebagai
`MEASURED_PROTOCOL_ABBREVIATED`: persentase dilaporkan, keputusan tidak diambil.
Yang membukanya adalah akses ke stimulus GeoPref penuh — tidak ada pekerjaan teknis yang
bisa menggantikannya. Menurunkan ambang, mengoptimasinya pada data sendiri, atau
menyatakan `validatedProtocol` benar akan menghasilkan rujukan hari ini dan menghancurkan
proyeknya.

**Kunci 2 — Lapis B2 menyala, tetapi tidak dihubungkan ke apa pun.** Aturan komposit di
[`app/src/outcome/referralRecommendation.ts`](app/src/outcome/referralRecommendation.ts)
sudah bisa bernilai `recommendsFollowUp: true`. Yang tidak ada adalah jembatan dari sana
ke hasil sesi: `emitsReferral` tidak pernah membacanya. Tiga alasan jembatan itu belum
dibangun, dan ketiganya benar saat ditulis:

1. **Ambangnya karangan sendiri.** `REFERRAL_DEVIANT_THRESHOLD = 2` tidak punya sumber.
   Setiap angka lain di sistem ini punya artefak; yang ini tidak.
2. **Karakteristik operasionalnya tidak pernah dihitung.**
   [`research/hasil/gate_c_simulation.json`](research/hasil/gate_c_simulation.json) punya
   lengan untuk regresi logistik dan untuk GeoPref, tidak untuk aturan komposit.
3. **Belum pernah ada yang melihatnya menyala pada data nyata.** Tanpa rekaman terdaftar,
   jalur demo memakai titik sintetis dan penjaga OOD menolaknya.

Yang bisa dikatakan tentang ambang dua: aturan hanya menyala kalau seluruh sinyal yang
dapat dinilai menyimpang, jadi laju positif palsunya adalah P(A dan B) ≤ min(P(A), P(B)).
Dengan spesifisitas GeoPref terbit 0,98, batas atasnya 0,02 — tanpa mengandaikan
independensi. Itu menjadikan dua satu-satunya nilai yang tidak dapat memperburuk titik
operasi terbit. Ia **tidak** menjadikannya cutoff yang tervalidasi pada balita; itu tetap
Gate C.

## Batas perekaman: balita dan anak ASD

Proyek ini tidak merekam balita. Proyek ini tidak merekam anak dengan ASD. Tidak satu
sesi pun — tidak untuk kontrol positif, tidak untuk melatih model, tidak untuk tangkapan
layar di slide.

Merekam anak menuntut persetujuan orang tua, dan persetujuan orang tua yang sah menuntut
kaji etik yang menyatakan apa yang sedang diminta. Merekam anak dengan ASD menuntut lebih
dari itu: status kelompok rentan, prosedur perekrutan yang diawasi, dan alasan yang
berdiri sendiri kenapa anak itu — bukan orang dewasa — yang harus menanggung beban
penelitiannya. NeuroGaze tidak punya satu pun dari itu, dan tidak akan mengarangnya.

Ini **bukan** pernyataan bahwa meneliti anak autistik itu tidak etis. Setiap ambang yang
dipakai sistem ini lahir dari penelitian yang merekam anak autistik: Wen dkk. pada 1.863
anak, Perochon dkk. pada 475 balita, Steffan dkk. pada 125 anak, Cilia dkk. pada 59 anak.
Penelitian itu dikerjakan dengan izin yang mereka punya, dan hasilnya dibagikan justru
supaya perekamannya tidak perlu diulang. Batasnya adalah tahap bukti kami, bukan sifat
penelitiannya.

Tiga alasan kenapa ini bukan urusan administrasi, dan masing-masing cukup sendiri:

- **Balita tidak bisa memberi persetujuan, dan wali tidak menyerahkan apa pun.** Yang
  menggantikan persetujuannya adalah keputusan orang lain, dan struktur yang mengawasi
  keputusan itu bernama kaji etik. Melewatinya menghapus satu-satunya pihak yang mewakili
  kepentingan anaknya.
- **Risiko dan manfaatnya belum seimbang.** Instrumen yang belum lulus Gate C tidak
  menawarkan manfaat apa pun kepada anak yang direkam. Yang ditawarkannya kepada kami
  adalah data. Konfigurasi itu berubah setelah ada bukti; ia tidak berubah karena tenggat
  lomba.
- **Anak autistik bukan sumber data.** Proyek ini sudah melarang menyebut peserta kontrol
  positif "berpura-pura autis", karena mengarikaturkan perilaku autistik merusak semua hal
  lain yang dibangun. Alasan yang sama berlaku lebih keras di sini.

## Dampak, biaya, dan jalur adopsi

Semua angka biaya di bawah adalah **asumsi perencanaan yang dinyatakan**, bukan hasil
pengukuran. Yang berasal dari literatur diberi sumbernya; yang berasal dari aritmetika
diberi rumusnya, supaya bisa dibantah dengan mengganti asumsinya.

### Klaim dampak yang benar

Klaim yang salah, dan yang menggoda dipakai: *"alat ini menemukan anak autistik."*
Aritmetikanya sendiri membantahnya. Pada kohort 1.000 anak dengan prevalensi 1% dan
coverage teknis 90%, ambang GeoPref terbit menemukan **1,53 kasus benar** dan merujuk 19
anak ([`research/hasil/gate_c_simulation.json`](research/hasil/gate_c_simulation.json)).
Alat dengan sensitivitas 17% memang melewatkan sebagian besar.

Tiga hal yang benar-benar ditambahkan alat ini, dan ketiganya bisa ditunjukkan di layar
hari ini: **rantai ukur yang dapat dibawa ke uji lapangan** (tablet, tanpa jaringan),
**artefak yang dapat diuji bersama layanan** (laporan satu halaman dengan angka, status
mutu, dan sumber referensi), dan **penolakan yang terlihat** — attrition webcam balita
yang dilaporkan ManyBabies adalah 42%, dan alat yang tidak pernah menolak adalah alat
yang mengarang. Yang dapat diklaim hari ini adalah kesiapan rekayasa ketiga mekanisme
itu. Dampak pada anak, kader, antrean, atau diagnosis belum diukur.

### Biaya per pemeriksaan

Distribusi perangkat lunak statis mendekati biaya marginal nol dan tidak memakai lisensi
per kursi. Operasi tetap membutuhkan waktu kader, pelatihan, dukungan, cetak laporan,
dudukan, pengulangan, pemeliharaan, penggantian perangkat, dan tindak lanjut klinis.
Rumus berikut hanya menghitung amortisasi tablet; ia bukan total biaya layanan.

```
biaya per sesi = harga tablet / (sesi per tahun × umur pakai tahun)
```

Dengan tablet Android kelas menengah Rp 2.500.000 dan umur pakai 3 tahun:

| Pemakaian | Sesi/tahun | Sesi seumur pakai | Biaya per sesi | Biaya per kasus ditemukan |
|---|---:|---:|---:|---:|
| Satu Posyandu, 5 anak per hari buka, 12 hari/tahun | 60 | 180 | **Rp 13.900** | Rp 9,08 juta |
| Tablet dirotasi ke 4 Posyandu | 240 | 720 | **Rp 3.500** | Rp 2,29 juta |
| Tablet dirotasi ke 8 Posyandu | 480 | 1.440 | **Rp 1.700** | Rp 1,11 juta |

Pembandingnya: EarliPoint USD 599 per pemeriksaan — sekitar **Rp 9,7 juta** pada kurs
asumsi Rp 16.200/USD — untuk satu anak, dengan eye-tracker khusus di fasilitas klinis.
Nilai itu tidak sebanding langsung: EarliPoint adalah alat berizin FDA 510(k) dengan
protokol klinis, sedangkan angka NeuroGaze di atas hanya amortisasi tablet untuk produk
yang belum divalidasi klinis. Kolom biaya per kasus berlaku hanya bila titik operasi
terbit berhasil direplikasi pada populasi sasaran; klip 16,75 detik yang dikirim belum
memenuhinya.

Asumsi yang bisa membatalkan angka ini: umur pakai tablet 3 tahun di lingkungan Posyandu
belum diuji; waktu kader, pelatihan, dukungan, dan tindak lanjut klinis belum diukur;
angka 5 anak per hari buka adalah perkiraan; dan baterai 67 detik belum pernah dijalankan
pada balita. Yang **tidak** berubah oleh asumsi mana pun: tidak ada biaya marginal
perangkat lunak untuk Posyandu tambahan.

### Jalur integrasi

Alat ini tidak menggantikan apa pun. Ia menempel pada alur yang sudah berjalan.

| Lapis | Yang sudah ada | Di mana NeuroGaze masuk |
|---|---|---|
| Posyandu | SDIDTK/KPSP saat penimbangan bulanan | Sesi 67 detik sesudah penimbangan, dijalankan kader |
| Rujukan | Kader menyerahkan temuan ke Puskesmas | Laporan satu halaman dicetak atau diserahkan sebagai berkas |
| Puskesmas | M-CHAT-R/F, pemeriksaan tenaga kesehatan | Laporan dibaca **berdampingan** dengan SDIDTK, bukan menggantikannya |
| Nasional | SATUSEHAT (FHIR R4) | Target integrasi, belum dikerjakan |

Tiga hal yang harus jujur disebut tentang tabel ini. **Baris keempat belum dikerjakan** —
tidak ada satu baris kode pun di repositori ini yang berbicara dengan SATUSEHAT; itu
target, bukan fitur. **Baris pertama belum diuji dengan kader sungguhan** — alurnya sudah
dijalankan 123 kali oleh tiga operator, tetapi operatornya tim proyek dan lokasinya bukan
Posyandu. **Laporan tidak pernah menjadi keputusan rujukan** — yang merujuk tetap tenaga
kesehatan.

### Jalur pengumpulan data Gate C

Gate C membutuhkan balita dengan acuan klinis independen. Pengumpulan tidak boleh dimulai
sebagai "penyebaran produk"; ia harus menjadi studi prospektif berizin etik. Setiap sesi
sudah menghasilkan log audit lengkap dengan jejak frame dan koordinat pandangan, tanpa
video dan tanpa landmark, dan log itu sudah punya field `privacy.researchConsent`. Yang
belum ada hanya cara mengumpulkannya.

Aritmetika skala rekrutmen hipotetis: 30 Posyandu × 40 anak layak usia 12–48 bulan per
tahun = 1.200 sesi, dan setelah attrition 42% (Steffan dkk. 2024) tersisa ~700 yang dapat
dinilai — dibandingkan kohort SenseToKnow 475 balita (Perochon dkk. 2023). Tabel ini tidak
membuktikan bahwa angka itu akan tercapai.

Sesi tanpa acuan klinis tidak melatih apa pun. Studi yang sah memerlukan seluruh komponen
berikut, yang belum ada: mitra yang mampu menjadi penanggung jawab kaji etik; izin orang
tua yang valid beserta prosedur penghentian yang melindungi anak; acuan klinis yang
dinilai buta terhadap keluaran aplikasi; linkage hasil yang menjaga identitas di luar
perangkat; rekrutmen yang layak beserta analisis fairness dan pola kegagalan; validasi
prospektif sebelum pemilihan titik operasi; dan mekanisme pengumpulan yang aman — saat ini
ekspor masih manual.

## Dua model dengan AUC lebih tinggi yang tidak dipakai

| Model | AUC | Dipakai? |
|---|---:|---|
| Regresi logistik 13 fitur geometri | 0,8228 | Dikirim ke perangkat, dikurung penjaga OOD |
| CNN scanpath (EfficientNetB0) | 0,8819 | Tidak |
| CNN wajah statis (EfficientNetB3) | 0,9324 | Dikarantina |

Angka tertinggi tidak dipakai, angka kedua tidak dipakai, dan yang dikirim justru yang
paling rendah — lalu itu pun tidak boleh memutuskan apa pun.

**CNN scanpath (0,8819).** Argumen "selang kepercayaannya bertumpang tindih" itu lemah:
dua selang bisa bertumpang tindih sementara selisih berpasangannya konsisten. Kedua model
menghasilkan prediksi out-of-fold tingkat partisipan pada 54 partisipan yang sama, jadi
selisihnya diuji langsung — bootstrap berpasangan terstratifikasi 10.000 replikasi:
ΔAUC +0,0591, CI95 [−0,0069, +0,1374], p = 0,087, korelasi prediksi 0,932. Dua hal harus
dibaca bersamaan: selisihnya tidak signifikan, tetapi arahnya konsisten. p = 0,087 bukan
p = 0,6. Yang benar adalah keunggulannya belum dapat dibuktikan pada 54 partisipan — dan
model yang lebih rumit untuk sinyal yang sama tidak layak dikirim ke tablet.

**CNN wajah statis (0,9324).** Dikarantina, `model_export_blocked` bernilai benar, dan
bobotnya tidak ada di repositori. Audit tata kelola datasetnya
([`research/hasil/audit_wajah.json`](research/hasil/audit_wajah.json)) menyatakan enam
dari enam metadata tidak tersedia: tanpa provenance, tanpa lisensi eksplisit, tanpa
dokumentasi consent, tanpa metadata demografi, tanpa definisi label klinis, tanpa ID
partisipan. AUC 0,93 pada dataset dengan enam kekosongan itu bukan hasil; ia gejala.

## Batas yang berlaku hari ini

- Aturan komposit sebagaimana dikirim tidak menyala pada kondisi apa pun: ia menuntut
  dua sinyal menyimpang, dan preferensi geometrik tetap tidak dapat dinilai selama klip
  berlisensi lebih pendek daripada protokol asal ambangnya. Mode demonstrasi menerapkan
  ambang itu sekali, di bawah banner yang menyatakan dirinya demonstrasi, semata agar
  bentuk laporannya terlihat.
- Tidak ada balita di bukti mana pun di repositori ini, dan tidak akan ada sebelum kaji
  etik.
- Validasi prospektif memerlukan mitra yang mampu menjalankan kaji etik, izin orang tua,
  acuan klinis buta, linkage data yang menjaga privasi, rekrutmen, analisis
  fairness/kegagalan, dan validasi prospektif. Ini bukan urusan satu persetujuan
  administratif.
- Blok target-diketahui Gate B sudah terpasang di sisi analisis, tetapi belum ada sesi
  yang merekamnya.
- Riset primer berhenti di **satu** wawancara praktisi — seorang guru SLB di Jambi, n=1,
  berbasis ingatan. Ia memvalidasi masalahnya, bukan instrumennya, dan tidak menggeser
  satu angka pun.
- Belum ada kader yang menguji alur, waktu, kegagalan, pelatihan, atau dukungan.

## Daftar klaim

Setiap angka yang bisa diucapkan tentang proyek ini, sumbernya, dan apakah ia milik
proyek ini. Tabel ini **dihasilkan** oleh
[`research/export_claims_register.py`](research/export_claims_register.py), bukan ditulis
tangan: skripnya membaca nilai kanonis dari berkas bukti dan berhenti dengan galat kalau
ada yang tidak cocok, jadi tabel ini tidak dapat melenceng dari buktinya diam-diam.

<!-- generated:claims-register -->
**28 klaim milik sendiri · 5 dikutip · 3 asumsi dinyatakan.**

| Klaim | Yang disebut | Milik | Sumber | Berkas bukti |
|---|---|---|---|---|
| Sesi Gate A lulus mutu | 94 dari 100 | milik sendiri | Gate A, 25 dewasa, 3 perangkat | `research/hasil/gate_a/gate_a_summary.json` |
| Galat kalibrasi median Gate A | 2,207° | milik sendiri | Gate A; konversi sudut lama tanpa jarak pandang per sesi | `research/hasil/gate_a/gate_a_summary.json` |
| Sesi Gate A dijalankan | 100 | milik sendiri | 25 dewasa, 3 operator, 3 tablet Android kelas menengah | `research/hasil/gate_a/gate_a_summary.json` |
| Kondisi lingkungan Gate A | 6 — cahaya redup/normal/campuran × berkacamata dan tidak | milik sendiri | Terekam di kolom site tiap log sesi | — |
| Total sesi ujung-ke-ujung | 123 — 100 Gate A + 23 kontrol positif | milik sendiri | 37 dewasa menyetujui. Operatornya tim proyek, BUKAN kader Posyandu | — |
| Spesifisitas minimum lajur komposit | ≥ 98% | milik sendiri | Batas turunan: P(A dan B) ≤ min(P(A), P(B)), dengan spesifisitas GeoPref terbit 0,98. Tidak mengandaikan independensi | — |
| Pasangan Gate B siap dibandingkan | 27 dari 30 | milik sendiri | Perbandingan simultan terhadap WebGazer.js 3.5.3 | `research/hasil/gate_b/gate_b_summary.json` |
| Galat antar aliran ternormalisasi median | 0,040997 | milik sendiri | Gate B; WebGazer adalah implementasi referensi, bukan ground truth | `research/hasil/gate_b/gate_b_summary.json` |
| Peserta kontrol positif | 12 dewasa | milik sendiri | Semua menyetujui untuk dirinya sendiri | `research/hasil/kontrol_positif/ringkasan.json` |
| Sesi kontrol positif direkam | 23 | milik sendiri | 3 perangkat | `research/hasil/kontrol_positif/ringkasan.json` |
| Sesi kontrol positif lulus mutu | 15 | milik sendiri | Attrition adalah bagian dari hasil, bukan angka yang dibuang | `research/hasil/kontrol_positif/ringkasan.json` |
| AUC CNN scanpath | 0,882 | milik sendiri | Data Carette, 54 partisipan, OOF tingkat partisipan | `research/hasil/perbandingan_model.json` |
| AUC regresi logistik 13 fitur | 0,823 | milik sendiri | Data Carette, partisipan yang sama | `research/hasil/perbandingan_model.json` |
| Selisih AUC berpasangan | 0,059, CI95 [−0,007, +0,137], p = 0,087 | milik sendiri | Bootstrap berpasangan terstratifikasi, 10.000 replikasi | `research/hasil/perbandingan_model.json` |
| Alas shortcut tingkat sesi pada data Cilia | AUC 0,905 | milik sendiri | Tanpa satu pun fitur perilaku; mengungguli model indeks 0,784 | `research/hasil/model_rujukan.json` |
| Model indeks perilaku pada data Cilia | AUC 0,784 | milik sendiri | Tiga indeks, 57 partisipan, lipatan per partisipan | `research/hasil/model_rujukan.json` |
| Bobot lapis 2 | ditolak audit | milik sendiri | Kriteria penolakan ditulis sebelum fitting dijalankan | `research/hasil/model_rujukan.json` |
| Alas shortcut pada kontrol positif sendiri | AUC 0,537 · p = 0,26 | milik sendiri | Audit identik dengan yang menolak lapis 2, dijalankan pada data sendiri | `research/hasil/audit_shortcut_sendiri.json` |
| Aturan ambang terhadap selang, pada preferensi 0,69 | menyala 4,8% (aturan titik lama: 52,2%) | milik sendiri | Simulasi 400 sesi per titik, research/simulate_geopref_interval.py | — |
| Aturan ambang terhadap selang, pada preferensi 0,90 | menyala 99,0% | milik sendiri | Sumber yang sama; sensitivitas pada preferensi tinggi tidak hilang | — |
| Penjaga OOD menerima di domain sumber | 544 dari 547 | milik sendiri | Kohort Carette; kalibrasi empiris 99,5% jadi ini pemeriksaan kewarasan | `research/hasil/ood_dua_arah.json` |
| Penjaga OOD pada stimulus yang dikirim | 1 dari 23 sesi diterima | milik sendiri | Sesi kontrol positif yang terekam | `research/hasil/ood_dua_arah.json` |
| Keputusan penjaga direproduksi lintas runtime | 23 dari 23 | milik sendiri | Keputusan browser dihitung ulang oleh Python dari nilai fitur tersimpan | `research/hasil/ood_dua_arah.json` |
| Beban rujukan titik sensitivitas 0,92 | 38,3× titik kerja yang dikirim | milik sendiri | Aritmetika atas asumsi kohort 1.000 dan prevalensi 1% | `research/hasil/gate_c_simulation.json` |
| Drift fitur kinematik, 26 → 13 Hz | median 69,4% | milik sendiri | 27 sesi Gate B dengan stempel waktu sungguhan; drift fitur, bukan akurasi | `research/hasil/degradasi_temporal.json` |
| Drift fitur geometri, 26 → 13 Hz | median 1,6% | milik sendiri | Sumber yang sama; sebagian fitur geometri tetap lemah pada laju lebih rendah | `research/hasil/degradasi_temporal.json` |
| Titik operasi GeoPref 69% | sens 0,17 · spec 0,98 · n=1.863 | dikutip | Wen dkk. 2022, Scientific Reports 12:4253, usia 12–48 bulan | — |
| Target Gate C | sens 0,878 · spec 0,808 | dikutip | Perochon dkk. 2023, Nature Medicine, 475 balita — performa instrumen lain | — |
| Attrition webcam balita | 42% | dikutip | Steffan dkk. 2024, Infancy, N=125 di 16 lab, usia 18–27 bulan | — |
| Usia diagnosis dan jeda kekhawatiran | 56 bulan · 32 bulan | dikutip | Tinjauan lintas negara. BUKAN estimasi Indonesia dan tidak boleh disebut begitu | — |
| Biaya EarliPoint | USD 599 per pemeriksaan | dikutip | Izin FDA 510(k) 2022, usia 16–30 bulan | — |
| Biaya per sesi | Rp 13.900 – Rp 1.700 | asumsi dinyatakan | Amortisasi tablet saja; biaya operasi belum diukur | — |
| Biaya per kasus ditemukan | Rp 9,08 jt – Rp 1,11 jt | asumsi dinyatakan | Berlaku hanya bila titik operasi protokol penuh direplikasi; hari ini ditahan | — |
| Sesi balita dapat dinilai per tahun | ~700 | asumsi dinyatakan | 30 Posyandu × 40 anak, dikurangi attrition 42%. Skala rekrutmen hipotetis | — |
| Anak ditangani sebelum usia 3 tahun | 3–4 dari sekitar 20 | milik sendiri | Wawancara satu guru SLB di Jambi; berbasis ingatan, n=1 | — |
| Kapasitas rujukan bila naik tiga kali lipat | "sepertinya akan sulit" | milik sendiri | Wawancara yang sama; penilaian satu praktisi, bukan pengukuran kapasitas | — |

### Cara membaca kolom "Milik"

- **milik sendiri** — Diukur oleh proyek ini dan dapat ditelusuri ke berkas di repositori.
- **dikutip** — Diukur studi lain. Tidak dapat diverifikasi dari repositori ini, dan tidak diklaim sebagai milik kami.
- **asumsi dinyatakan** — Aritmetika atas asumsi yang dinyatakan. Bukan hasil pengukuran.

### Yang tidak ada di tabel ini, dan tidak akan ada

Sensitivitas, spesifisitas, atau akurasi milik NeuroGaze. Ketiganya menuntut balita
berlabel dengan acuan klinis independen, dan itu Gate C.
<!-- /generated:claims-register -->

---

## Panduan operator

**Sebelum sesi.** Buka aplikasi lewat HTTPS atau localhost. Pastikan kamera berfungsi,
wajah terlihat jelas, dan tablet stabil. Gunakan ID pseudonim — jangan masukkan nama,
NIK, alamat, atau foto identitas. Jelaskan bahwa sesi kamera bukan diagnosis dan dapat
dihentikan kapan saja.

**Menjalankan sesi.** Ikuti urutan pada layar: persetujuan, persiapan, tutorial,
pemeriksaan posisi, kalibrasi, pemeriksaan arah, stimulus, pemeriksaan kualitas, lalu
laporan. Jangan mengarahkan pandangan anak atau membantu menjawab stimulus. Jika aplikasi
meminta pengulangan, perbaiki satu penyebab yang ditampilkan lebih dulu — posisi wajah,
cahaya, pantulan kacamata, atau dudukan tablet. **Jangan melonggarkan ambang agar sesi
tampak lulus.**

**Membaca hasil.** Laporan memuat satu kalimat hasil, persentase fiksasi geometrik, lima
indeks perilaku, dan lajur rekomendasi komposit berisi dua sinyal (respons nama
dikarantina). Empat kemungkinan hasilnya: rujuk, terukur tanpa rujuk, protokol
dipersingkat, atau ditahan.

- **Tidak ada skor risiko ASD.** Tidak ada angka gabungan, tidak ada persentase
  kemungkinan autisme. Keenam ukuran itu dibaca berdampingan, tidak dijumlahkan.
- **"Tidak dapat dinilai" bukan hasil normal.** Sinyal yang arahnya benar tetapi belum
  terbukti di atas kebetulan dilaporkan apa adanya, dan tidak ikut menghitung ke arah
  mana pun.
- **Hasil di bawah ambang bukan berarti aman.** Pemeriksaan ini melewatkan sebagian besar
  anak autistik; itu sifat alatnya. Jangan pernah menyampaikannya sebagai kabar baik.
- **Hasil ditahan bukan kegagalan operator.** Itu sistem yang bekerja: mutunya tidak
  cukup, jadi angkanya tidak dikeluarkan.
- **Bila laporan menyebut protokol dipersingkat,** klip stimulus lebih pendek daripada
  protokol yang ambangnya divalidasi, sehingga ambang 69% belum berlaku.
- **Bila laporan membawa banner mode peragaan,** ambang 69% sedang diterapkan pada klip
  yang lebih pendek daripada protokol terbitnya. Angka itu tidak sah untuk keputusan apa
  pun. Banner itu tidak pernah muncul pada sesi anak.
- Beranda hanya punya satu tombol, dan itu sesi sungguhan. Seluruh jalur demo ada di tab
  "Panduan & demo", memakai pipeline yang sama, dan selalu melabeli laporannya sebagai
  rekaman, simulasi, atau peragaan.
- Keputusan layanan tetap berada pada tenaga kesehatan dan protokol klinis yang berlaku.

**Data dan privasi.** Video dan landmark wajah mentah tidak disimpan. Log teknis hanya
tersimpan di memori sampai operator memilih unduh. Simpan ekspor sesuai persetujuan dan
kebijakan penelitian setempat.

---

## Menjalankan aplikasi

Dari akar repositori, di Windows:

```powershell
.\start.bat
```

Untuk pengembangan frontend:

```powershell
cd app
npm ci
npm run dev
```

Akses kamera browser menuntut HTTPS atau localhost. Untuk Vercel, pakai `app` sebagai
root direktori proyek.

Menyiapkan lingkungan Python untuk sisi riset:

```powershell
.\scripts\setup_env.ps1
```

## Membangun ulang bukti dengan satu perintah

Setiap angka utama di berkas ini dihitung ulang dari materi yang disimpan, bukan dibaca
dari ringkasan yang ditulis tangan. Satu perintah menjalankan seluruh rantainya:

```powershell
.\.venv\Scripts\python.exe research
ebuild_evidence.py
```

Sebelas langkah, masing-masing menyebutkan apa yang dibuktikannya:

| Langkah | Yang dihitung ulang |
|---|---|
| Berkas kontrol positif | SHA-256 tiap rekaman mentah, deteksi duplikat, dan manifes sesi |
| Analisis kontrol positif | 0/9 biasa dan 4/6 pola diproduksi, dari jejak gaze mentah |
| Degradasi temporal | drift 69,4% kinematik lawan 1,6% geometri |
| Perbandingan model | AUC 0,882 lawan 0,823 dan bootstrap yang menjatuhkan CNN kami |
| Parity penjaga OOD | 23 keputusan TypeScript direproduksi Python dari nilai fitur |
| Repositori bukti Gate A/B | 130 berkas terhadap manifes SHA-256 |
| Titik operasi, matriks kesiapan, daftar klaim, bukti publik | keempat artefak ekspor terhadap generatornya |
| **Determinisme hasil** | **193 berkas di `research/hasil` harus kembali byte-identical** |

Langkah terakhir yang membuat sepuluh langkah sebelumnya berarti: ia mem-hash seluruh
pohon bukti sebelum rebuild dan sesudahnya, lalu gagal kalau ada satu berkas yang
bergeser. Angka yang pernah diketik tangan akan muncul di situ.

Satu langkah dilewati pada clone yang baru. `file_positive_control.py` membaca rekaman
sesi mentah dari `data/`, yang dikecualikan `.gitignore`. Salinan hasil filenya sudah
ter-commit di `research/hasil/kontrol_positif/sesi/` dan itulah yang dibaca sepuluh
langkah lainnya, jadi rantainya tetap utuh — langkah itu dilaporkan **dilewati**, bukan
gagal.

Untuk meminta langkah ekspor memverifikasi alih-alih menulis ulang:

```powershell
.\.venv\Scripts\python.exe research
ebuild_evidence.py --check
```

## Memverifikasi proyek

Jalankan dari akar repositori sebelum commit atau rilis.

**Bukti Gate A/B.** Hasil yang diharapkan: 130 berkas diverifikasi, Gate A berisi 100
sesi, Gate B berisi 30 pasangan dengan keputusan `PASSED`.

```powershell
.\.venv\Scripts\python.exe research\gate_evidence_repository.py --rebuild --verify
```

**Python.**

```powershell
.\.venv\Scripts\python.exe -m pytest -q
```

**Webapp.**

```powershell
cd app
npm test
npm run lint
npm audit --omit=dev
npx tsc --noEmit
npm run replay:check
```

`npm test` membangun aplikasi produksi lalu menjalankan **seluruh** berkas di `app/tests/`
lewat glob, bukan daftar yang ditulis tangan. Cakupannya kontrak produk, parity,
kalibrasi, pipeline gaze, privasi, replay, fenotipe, hasil sesi, dan bukti publik Gate B.
`npx tsc --noEmit` harus bersih tanpa satu galat pun. `npm run replay:check` membaca ulang
setiap rekaman terdaftar di `app/public/replay/index.json`; manifest kosong bukan
kegagalan, ia berarti Demo cepat akan memakai simulasi dan mengatakannya di laporan.

Header respons dibangun
[`app/src/security/responseHeaders.ts`](app/src/security/responseHeaders.ts), bukan
ditulis langsung di `next.config.ts`. Hanya `script-src` yang berbeda antar mode: build
yang dirilis tidak pernah memuat `'unsafe-eval'`, sedangkan `next dev` memuatnya karena
React versi pengembangan memakai `eval()`. HSTS juga hanya dikirim pada mode produksi.
Setelah menyentuh berkas itu, buka `next dev` dan pastikan konsol peramban bersih — galat
CSP hanya muncul di peramban, bukan di test.

**Artefak yang harus tetap sinkron.**

```powershell
.\.venv\Scripts\python.exe research\export_operating_points.py --check
.\.venv\Scripts\python.exe research\export_readiness_matrix.py --check
.\.venv\Scripts\python.exe research\export_claims_register.py --check
.\.venv\Scripts\python.exe research\export_public_evidence.py --check
.\.venv\Scripts\python.exe research\prospective_evaluation.py
```

Perintah pertama gagal bila `model.json` tidak memuat kedua titik kerja; kedua dan ketiga
gagal bila blok bertanda di README ini tertinggal dari generatornya; keempat gagal bila
halaman validasi publik tertinggal dari bukti kanonis; kelima menulis ulang simulasi
Gate C empat lengan dari `model.json`.

**Analisis turunan.** Keduanya menulis ulang artefak di `research/hasil` dari data mentah.
Jalankan setelah bukti bertambah, dan commit hasilnya bersama perubahan yang memicunya.

```powershell
.\.venv\Scripts\python.exe research\compare_models.py
.\.venv\Scripts\python.exe research\temporal_degradation.py
```

**Pemeriksaan konsistensi.** Tidak ada dokumen yang menyebut Gate B sebagai perbandingan
hardware eye-tracker. Angka Gate A/B cocok dengan kedua summary JSON. Manifest SHA-256
lulus. Halaman `/validation` memakai batas klaim yang sama. Gate C dan D tidak ditulis
sebagai hasil yang sudah lulus. Kesepakatan AOI tidak pernah menjadi headline. Tidak ada
lengan simulasi Gate C yang memakai angka CNN.

## Peta repositori

| Direktori | Isi |
|---|---|
| [`app/`](app) | PWA Next.js — pipeline browser, inferensi di perangkat, laporan, dan tes frontend |
| [`research/`](research) | Kode analisis, training, evaluasi model, dan bukti kanonis di [`research/hasil`](research/hasil) |
| [`notebook/`](notebook) | Notebook audit dataset wajah dan eksperimen scanpath |
| [`tests/`](tests) | Tes Python untuk kontrak data, analisis Gate B, dan repositori bukti |
| [`huggingface/`](huggingface) | Model card dan skrip unggah artefak model tabular |
| [`docs/tangkapan_layar/`](docs/tangkapan_layar) | Tangkapan layar build produksi yang dipakai di berkas ini |
| [`scripts/`](scripts) | Penyiapan lingkungan Python |

Dua berkas Markdown lain sengaja dipertahankan di luar berkas ini karena keduanya artefak,
bukan dokumentasi: [`huggingface/README.md`](huggingface/README.md) adalah model card yang
diunggah ke Hugging Face, dan
[`research/hasil/kontrol_positif/README.md`](research/hasil/kontrol_positif/README.md)
adalah laporan hasil yang duduk bersama datanya.

## Privasi

Video dan landmark wajah mentah tidak pernah meninggalkan perangkat dan tidak disimpan.
Tidak ada backend, tidak ada basis data, tidak ada telemetri. Log audit sesi berisi jejak
frame dan koordinat pandangan — tanpa video, tanpa landmark — dan hanya tersimpan di
memori sampai operator memilih mengunduhnya.

Dataset wajah yang dipakai pada audit tata kelola **tidak** ada di repositori ini dan
tidak akan ditambahkan: audit proyek ini sendiri menyatakan enam dari enam metadata tata
kelola tidak tersedia, dan itu justru alasan modelnya dikarantina. Menerbitkan gambarnya
akan membatalkan seluruh alasan itu.
