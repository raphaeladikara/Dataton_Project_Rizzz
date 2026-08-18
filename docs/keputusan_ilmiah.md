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

Ambang 69% fiksasi geometrik berasal dari Wen dkk. 2022 (*Molecular Autism*,
n=1.863, usia 12–49 bulan, sensitivitas 17%, spesifisitas 98%, PPV 81%, NPV 65%).
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

Stimulus UCSD penuh (60–90 detik) belum tersedia. Yang berjalan adalah klip CC BY
4.0 16,75 detik dari Moore dkk. 2018, dengan batas panel diukur langsung dari aset
(x 129–316 sosial, x 324–513 geometrik, y 120–242 pada bingkai 640×360).

Karena durasinya di bawah protokol terbit, `validatedProtocol` bernilai `false` dan
ambang 69% **tidak** diberlakukan: aplikasi melaporkan persentase yang terukur dan
menyatakan bahwa protokolnya dipersingkat (`MEASURED_PROTOCOL_ABBREVIATED`). Bila
stimulus penuh datang, flag itu berubah dan ambangnya aktif tanpa perubahan kode
lain. Permintaan aksesnya ada di `docs/provenance/permintaan_stimulus_ucsd.md`.

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
