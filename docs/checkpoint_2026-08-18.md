# Checkpoint 18 Agustus 2026 — status penuh dan rencana penuntasan

Dokumen ini menggantikan catatan sesi harian. Ia memuat empat hal: apa yang sudah
selesai, apa yang belum, batasan nyata yang ditemukan, dan urutan kerja terbaik untuk
menuntaskan proyek. Melanjutkan `docs/checkpoint_2026-08-17.md`, yang berhenti setelah
Fase 3 dan Task 25.

**Status repo:** seluruh pekerjaan sudah berada di `main` dan ter-push ke
`origin/main`. Repo hanya punya satu branch, `main`; branch fitur sudah dihapus di lokal
maupun remote. Riwayat commit ditulis ulang sehingga satu-satunya kontributor adalah
Raphael Angelo. Working tree bersih.

---

## 1. Status singkat

| Gerbang | Status | Angka kanonis |
|---|---|---|
| **A — kelayakan instrumen** | Lulus | 100 sesi, 25 peserta dewasa, 3 tablet. 94 lulus mutu. Galat kalibrasi median 2,207°. **Akurasi terhadap target diketahui: median 2,36°, p90 3,58°.** Frame valid 96,4%, dropout 3,6% |
| **B — kesepakatan pengukuran** | Lulus | 30 pasangan simultan vs WebGazer.js 3.5.3; 27 siap, 3 ditahan. Galat median ternormalisasi 0,040997. **Kesepakatan AOI 0,997118 hasil rekomputasi** (nilai simpanan 0,997574). ICC(A,1) rata-rata 0,505 |
| **C — validasi klinis** | Terbuka | Belum ada satu pun balita. Target dari preseden: sens 87,8% / spec 80,8% (Perochon dkk. 2023) |
| **D — implementasi lapangan** | Terbuka | Belum ada uji Posyandu |

**Pemeriksaan otomatis:** 39 tes Python, 156 tes TypeScript, ESLint bersih,
`next build` sukses, manifest 130 berkas bukti terverifikasi, dua generator artefak
lolos `--check`.

**Arsitektur keputusan (jangan dikaburkan):**

- **Lapisan A — GeoPref.** Satu-satunya pemicu rujukan otomatis. Ambang 69% fiksasi
  geometrik (Wen dkk. 2022, n=1.863, usia 12–49 bulan, sens 17%, spec 98%, PPV 81%,
  NPV 65%).
- **Lapisan B — profil multi-indeks.** Deskriptif, tanpa skor gabungan. Meniru
  keluarga indeks SenseToKnow (Perochon dkk. 2023, *Nature Medicine*).
- **Lapisan C — model gabungan.** Belum dibangun. Bobotnya butuh balita berlabel.

---

## 2. Yang sudah selesai

### 2.1 Integritas bukti (Fase 4–5)

**Rekomputasi Gate B — `research/recompute_gate_b.py` (Task 17).**
Semua metrik terbit dihitung ulang dari koordinat `sampleMatches`, bukan dibaca dari
field yang ditulis browser. Jarak tereproduksi sampai 0,001 piksel. Kesepakatan AOI
**tidak**: pada 4 dari 27 pasangan, satu sampel jatuh tepat di luar kotak AOI menurut
`neurogaze-aoi-v3.1.0` padahal saat perekaman dihitung sepakat. Harness perekamnya
tidak ada di repo, jadi selisihnya tidak bisa ditelusuri ke sumbernya. Ia
**diterbitkan** di `gate_b_summary.json` (blok `recomputation`) alih-alih didamaikan.
Angka yang dikutip mulai sekarang **0,997118**. Gate B tetap lulus (batas 0,95).

**Dua titik kerja model — `research/export_operating_points.py` (Task 20).**
`model.json` dulu hanya mengekspor titik sensitivitas 0,9 yang spesifisitasnya 0,179;
pada prevalensi 1% titik itu merujuk 82% antrean. Sekarang `decision.operating_points`
memuat keduanya dan `default_operating_point` adalah `youden`
(0,4985 → sens 0,731 / spec 0,821), sama dengan yang selalu dilaporkan paper.
Backfill dilakukan dari prediksi OOF tersimpan, bukan dengan melatih ulang — melatih
ulang akan menimpa metadata seleksi studi degradasi di `training.json`.
`validateModel` di sisi TypeScript menolak ekspor yang titik defaultnya hilang atau
tidak cocok dengan `refer_if_probability_gte`.

**Simulasi Gate C empat lengan (Task 21).** Berkas lama memproyeksikan sens 0,846 /
spec 0,75 — itu angka CNN, model yang tidak bisa jalan di perangkat sasaran. Sekarang:

| lengan | sens | spec | laju rujukan | PPV | rujukan per 1 kasus benar |
|---|---:|---:|---:|---:|---:|
| `lr_target_sensitivity` | 0,9231 | 0,1786 | 82,2% | 0,011 | 89,1 |
| `lr_youden` | 0,7308 | 0,8214 | 18,4% | 0,040 | 25,2 |
| **`geopref_published`** | 0,17 | 0,98 | **2,2%** | **0,079** | **12,6** |
| `gate_c_target` | 0,878 | 0,808 | 19,9% | 0,044 | 22,6 |

Prevalensi 1%, coverage teknis 90%, kohort 1.000 anak. Lengan regresi logistik membaca
`model.json` sehingga tidak bisa melenceng darinya. **Tabel ini artefak pitch terkuat
yang dihasilkan sesi ini**: ia menjelaskan dalam satu baris kenapa alat rule-in adalah
bentuk yang benar untuk antrean Posyandu.

### 2.2 Klaim publik (Task 19)

Halaman `/validation` dulu berkepala "99,76% agreement AOI". Angka itu jenuh secara
geometri: kotak AOI selebar 28% layar sementara galat antar aliran hanya 4,1% lebar
layar, jadi kesepakatan setinggi itu nyaris tidak terhindarkan. Sekarang:

- Headline: **galat median 2,36° terhadap target yang diketahui** (94 sesi Gate A,
  p90 3,58°), digambar pada satu skala bersama WebGazer 4,17° (Papoutsaki dkk. 2016).
- Kesepakatan diturunkan jadi angka pendukung, dikutip pada nilai rekomputasi, dan
  membawa penjelasan kenapa ia jenuh.
- ICC dilaporkan apa adanya dengan catatan rasio-varians, ditemani batas kesepakatan
  Bland-Altman termasuk fitur dengan selisih terlebar (`aspect_ratio`).
- Konteks balita: WebGazer adalah metode yang divalidasi ManyBabies untuk usia 18–27
  bulan (Steffan dkk. 2024, N=125, 16 lab), dan attrition 42% dari studi yang sama
  dipakai sebagai dasar desain penahanan hasil.

`gate-b-public.json` sekarang **di-generate** oleh `research/export_public_evidence.py`
dari ringkasan kanonis. Ubah generatornya, jangan JSON-nya. `gate_a_summary.json`
mendapat blok `knownTargetValidation` supaya klaim akurasi punya sumber kanonis.

Kontras teks kecil dinaikkan dari 3,8:1 ke 4,9:1; tidak ada gulir horizontal di 375px.

### 2.3 UX dan demo (Fase 6, Task 26–28)

- **Demo cepat.** Satu klik dari beranda ke laporan jadi. Ia menjalankan pipeline asli
  — kalibrasi, stimulus, gerbang mutu, resolver hasil yang sama — sehingga demo tidak
  bisa menampilkan hasil yang tidak akan diproduksi sistem. Ia memutar rekaman nyata
  bila terdaftar di `app/public/replay/index.json`, dan melabeli laporan sesuai
  sumbernya: "REKAMAN — bukan sesi langsung" atau "SIMULASI — bukan sesi langsung".
- **Penomoran langkah satu sumber** (`sessionStepPosition`). Layar kalibrasi fullscreen
  dulu bilang "Langkah 3 dari 6" sementara rail bilang 09 / 09.
- **Ringkasan cetak.** Satu halaman: hasil, enam indeks beserta provenance-nya, batas
  klaim, dan baris tanda tangan. Kader menyerahkan kertas ke Puskesmas, bukan
  `audit.json`.
- **Skip link + live region kedua** untuk layar fullscreen tempat rail tidak dirender.
- **Karakter kalibrasi.** Wajah beranimasi 88px (>2° pada jarak tablet normal) yang
  datang dengan lompatan, bernapas, dan berkedip. Target lama justru diganti halo
  kosong persis saat ia menjadi aktif.

Task 27 langkah 4 (hapus preload font tak terpakai) **tidak dikerjakan**: ketiga
keluarga font dan seluruh axis Fraunces dipakai di atas lipatan. Premisnya keliru.

### 2.4 Dokumentasi (Task 23–24, sebagian 29)

- `docs/keputusan_ilmiah.md` — sembilan keputusan yang menentukan batas klaim, termasuk
  argumen terkuat untuk menurunkan model Carette: fitur geometrinya mengkodekan tata
  letak stimulus studi asal, jadi batas keputusannya tidak berpindah bahkan seandainya
  usia dan laju sampelnya cocok.
- `docs/provenance/permintaan_stimulus_ucsd.md` — draf permintaan akses stimulus
  GeoPref penuh ke Wen dan Pierce. **Belum dikirim.**
- README, AGENTS, `docs/README.md`, `docs/verifikasi.md` disesuaikan; verifikasi kini
  memuat pemeriksaan drift untuk kedua generator.
- `paper/sumber/paper_final.tex` dikoreksi: kesepakatan AOI di lima tempat menjadi
  99,7118 persen, plus paragraf yang menjelaskan selisihnya dan kenapa angka itu jenuh.

### 2.5 Sisi Gate B untuk akurasi absolut (Task 18, sebagian)

`viewingGeometry` (lebar/tinggi layar, jarak pandang, id perangkat) kini diekspor di
log audit Gate B dalam bentuk yang dibaca `accuracy_against_targets`. Fungsi itu punya
tes positif: pasangan sintetis yang digeser tepat satu derajat sudut menghasilkan
1,00° untuk aliran tablet dan 0,00° untuk referensi.

---

## 3. Yang belum selesai

| # | Pekerjaan | Kenapa belum | Butuh apa |
|---|---|---|---|
| 1 | **Rekaman 3 sesi dewasa** (Task 15) | Tidak ada kamera di environment pengembangan | Manusia + tablet/laptop berkamera, ~30 menit |
| 2 | **Kompilasi ulang paper** | Tidak ada toolchain LaTeX di environment ini | Overleaf atau TeX lokal, ~10 menit |
| 3 | **Task 29 struktural** — bagian arsitektur tiga lapis, tabel preseden, tabel empat titik kerja, Carette diturunkan jadi proof-of-principle, sitiran Steffan, catatan tata kelola | Butuh kompilasi untuk diverifikasi, dan urutannya setelah #2 | 2–3 jam menulis |
| 4 | **Task 30 — struktur pitch 7 menit** | Belum dikerjakan | 1–2 jam |
| 5 | **Task 22 — paket provenance** (6–10 foto sesi wajah diburamkan, rekaman layar 60–90 detik, register peserta ter-pseudonimisasi, pindaian consent) | Semuanya artefak fisik | Manusia, ~2 jam |
| 6 | **Task 18 langkah 2 & 4** — blok 9 target diketahui di dalam sesi Gate B, lalu 10–15 sesi dewasa untuk mengisinya | Sisi analisis siap, sisi perekaman belum dibangun | ~4 jam koding + ~2 jam perekaman |
| 7 | **Kirim surat UCSD** (Task 24 langkah 1) | Draf siap, perlu persetujuan pembimbing dan alamat pengirim resmi | Keputusan manusia |
| 8 | **Uji toleransi balita** terhadap baterai 96 detik | Butuh anak, pengasuh, dan idealnya izin etik | Di luar jangkauan sebelum tenggat; sampaikan sebagai keterbatasan |

---

## 4. Batasan yang ditemukan

### 4.1 Batasan lingkungan

- **Tidak ada kamera.** Seluruh jalur tangkapan langsung — kamera, ucapan panggilan
  nama, dan indeks fenotipe pada frame nyata — belum pernah diverifikasi ujung ke
  ujung. Ini risiko teknis terbesar yang tersisa: kodenya lulus tes unit dan kontrak,
  tapi belum pernah bertemu wajah sungguhan.
- **Tidak ada LaTeX.** PDF paper basi terhadap sumbernya.
- **Satu galat `tsc --noEmit` yang sudah ada sebelumnya** di
  `tests/child-flow-contract.test.ts` (flag regex `s` terhadap target ES2017). Tidak
  memengaruhi `npm run build` maupun jalannya tes.

### 4.2 Batasan data

- **Harness perekam Gate B tidak ada di repo.** Berkas pasangan bisa dibaca dan
  dihitung ulang, tetapi selisih klasifikasi AOI tidak bisa didamaikan ke sumbernya.
  Itu sebabnya selisihnya diterbitkan, bukan diperbaiki.
- **Belum ada satu pun balita** dalam bukti mana pun di repo ini. Semua Gate A dan
  Gate B adalah dewasa.
- **Tidak ada instrumen di sini yang divalidasi di Indonesia.**
- **Replay masih sintetis** selama `index.json` kosong, sehingga empat dari enam indeks
  lapisan B kosong dan demo berakhir WITHHELD. Ini benar secara logika sistem, tetapi
  lemah sebagai demonstrasi.

### 4.3 Batasan ilmiah yang bersifat permanen

- **GeoPref hanya alat rule-in.** Sensitivitas 17%: sebagian besar anak autistik tidak
  akan terdeteksi. NPV 65%: hasil di bawah ambang hampir tidak mengubah keyakinan.
  Ini sifat alatnya, bukan cacat implementasi, dan antarmuka wajib mengatakannya.
- **Protokol GeoPref sedang dipersingkat.** Yang berjalan klip CC BY 16,75 detik, bukan
  stimulus terbit 60–90 detik. Karena itu `validatedProtocol` bernilai `false` dan
  ambang 69% **ditahan**; aplikasi melaporkan persentase terukur dan menyatakan
  protokolnya dipersingkat.
- **Model Carette tidak bisa dipakai memutuskan apa pun.** Fitur geometrinya
  mengkodekan tata letak stimulus studi asal; usianya rata-rata 7,88 tahun; sumbernya
  eye-tracker 250 Hz.
- **Indeks lapisan B tidak boleh digabung** sebelum ada balita berlabel untuk
  memfit bobotnya.
- **Kesepakatan antaraliran tidak pernah bisa menjadi akurasi.** Dua penaksir bisa
  sepakat sambil sama-sama meleset.
- **Isu keadilan yang harus disebut di muka:** pada studi aslinya, spesifisitas
  SenseToKnow 53,6% pada anak kulit hitam vs 82,7% kulit putih. GeoPref dilaporkan
  setara lintas ras. Analisis subgrup harus dipra-registrasi untuk Gate C.

---

## 5. Rencana penuntasan

Urutan ini disusun berdasarkan *apa yang membuka paling banyak hal lain*, bukan
berdasarkan besar kecilnya pekerjaan.

### Prioritas 1 — Rekam tiga sesi dewasa (≈30 menit, membuka empat hal sekaligus)

Ini satu-satunya tindakan yang sekaligus: (a) memverifikasi jalur kamera langsung yang
belum pernah diuji ujung ke ujung, (b) mengisi enam indeks lapisan B, (c) mengubah demo
dari WITHHELD menjadi laporan bernilai, dan (d) menutup Task 15.

1. Jalankan `npm run dev` di `app/`, buka di perangkat berkamera (HTTPS atau localhost).
2. Pilih "Mulai observasi kamera", jalani sesi utuh sampai laporan.
3. Di laporan, klik **Unduh log audit JSON**.
4. Salin berkasnya ke `app/public/replay/session-a.json`.
5. Tambahkan `"session-a.json"` ke array `recordings` di
   `app/public/replay/index.json`.
6. Ulangi untuk `session-b` dan `session-c` — pilih satu sesi yang sengaja gagal mutu
   (tutup kamera di tengah) agar keadaan WITHHELD juga punya rekaman nyata.
7. Klik "Demo cepat": laporan harus berlabel "REKAMAN — bukan sesi langsung" dan
   indeks harus terisi.

**Selesai bila:** demo cepat menghasilkan laporan berisi angka pada enam indeks, dan
label rekaman muncul. Bila indeks masih kosong, log itu tidak membawa `gaze.frames` —
periksa apakah sesi berjalan dalam mode kamera langsung, bukan replay.

Sekalian catat: apakah `TURN_YAW_THRESHOLD` 0,28 memicu respons nama secara wajar pada
lima sesi dewasa. Rencana menyebut kalibrasi ulang ambang ini sebelum dipakai.

### Prioritas 2 — Selesaikan paper (≈3 jam)

1. Kompilasi ulang `paper/sumber/paper_final.tex` (Overleaf paling cepat) dan ganti
   `paper/Rizzz_Paper_Final.pdf`.
2. Tambahkan bagian arsitektur tiga lapis dengan tabel preseden
   (SenseToKnow / EarliPoint / GeoPref) dan tabel dampak operasional empat titik kerja
   — angkanya sudah jadi di `research/hasil/gate_c_simulation.json`, tinggal disalin.
3. Turunkan hasil Carette menjadi *proof-of-principle bahwa geometri scanpath membawa
   sinyal ASD pada anak usia sekolah*; hapus kalimat yang membacanya sebagai performa
   produk.
4. Sitir Steffan dkk. (2024) sebagai pembenaran pilihan pembanding Gate B, dan laporkan
   attrition 42% sebagai dasar ekspektasi penyelesaian sesi balita.
5. Tambahkan catatan tata kelola (perbedaan spesifisitas lintas ras, pra-registrasi
   subgrup, tidak ada validasi Indonesia).
6. Verifikasi klaim di baris 275 — "dua titik kerja dilaporkan berdampingan" — sekarang
   sudah benar setelah Task 20.

### Prioritas 3 — Susun pitch 7 menit (≈2 jam)

Urutan yang saya sarankan, dan alasannya:

1. **Masalah** — diagnosis rata-rata di usia 56 bulan, 32 bulan setelah keresahan
   pertama orang tua.
2. **Kenapa alat yang ada gagal di Posyandu** — M-CHAT sensitif tapi tidak spesifik;
   eye-tracker lab tidak terjangkau.
3. **Demo** — putar rekaman (atau sesi live bila berani), enam indeks keluar.
4. **Kenapa boleh dipercaya** — GeoPref, ambang 69%, n=1.863, spesifisitas 98%, usia
   12–49 bulan. Bukan ambang karangan sendiri.
5. **Kenapa punya batas** — sens 17%, alat rule-in, harus jalan bersama SDIDTK.
   Tunjukkan tabel empat lengan: GeoPref merujuk 2,2% antrean pada 12,6 rujukan per
   kasus benar, sementara titik sens-0,9 merujuk 82%.
6. **Bukti instrumen** — Gate A 2,36° pada target diketahui; Gate B terhadap WebGazer
   yang divalidasi ManyBabies untuk balita.
7. **Momen integritas** — dua sekaligus: panel riset menolak model Carette karena OOD,
   dan rekomputasi Gate B menurunkan angka kami sendiri dari 99,76% ke 99,71% lalu
   menerbitkan selisihnya. Tim yang mengoreksi angkanya sendiri lebih dipercaya
   daripada tim yang angkanya selalu bagus.
8. **Yang belum selesai** — Gate C dengan target sens 88 / spec 81 yang berasal dari
   literatur, bukan angan-angan.

### Prioritas 4 — Paket provenance (≈2 jam, Task 22)

Kumpulkan foto sesi (wajah diburamkan) yang memperlihatkan tiga model tablet, rekaman
layar 60–90 detik satu sesi Gate A utuh, register peserta ter-pseudonimisasi yang cocok
dengan `profile.participantId` di 100 berkas, dan pernyataan bertanda tangan
operator/pembimbing. Tulis `docs/bukti_provenance.md` yang memetakan tiap artefak ke
sesi yang didukungnya beserta SHA-256, dengan pernyataan cakupan: provenance
membuktikan sesi itu terjadi, bukan keberlakuannya pada balita.

### Prioritas 5 — Kirim surat UCSD (≈15 menit, imbal hasilnya besar tapi lambat)

Kirim sekarang meski hasilnya kemungkinan tidak datang sebelum tenggat: bila stimulus
penuh tiba, `validatedProtocol` berubah dan ambang 69% aktif tanpa perubahan kode lain.
Setidaknya fakta bahwa permintaannya sudah dikirim adalah bagian dari cerita tata
kelola.

### Prioritas 6 — Blok target diketahui Gate B (≈6 jam, hanya bila waktu tersisa)

Bangun blok sembilan target 1.500 ms di sesi Gate B, ekspor sebagai `accuracyTargets`,
lalu rekam 10–15 sesi dewasa. Sisi analisisnya sudah ada dan sudah diuji. Ini menaikkan
Gate B dari kesepakatan ke akurasi absolut untuk kedua aliran — bagus untuk paper,
tidak wajib untuk pitch karena Gate A sudah menyediakan angka akurasi.

### Bila waktu sangat terbatas

Kerjakan **Prioritas 1 lalu 3**. Rekaman membuat demo hidup, dan pitch adalah yang
dinilai. Paper yang PDF-nya basi satu angka lebih kecil risikonya daripada demo yang
menampilkan "sesi belum dapat dinilai" di depan juri.

---

## 6. Cara memverifikasi

```powershell
.\.venv\Scripts\python.exe -m pytest -q
.\.venv\Scripts\python.exe research\gate_evidence_repository.py --rebuild --verify
.\.venv\Scripts\python.exe research\export_operating_points.py --check
.\.venv\Scripts\python.exe research\export_public_evidence.py --check
cd app; npx tsx --test tests/*.test.ts
cd app; npm run lint; npm run build
```

Pemeriksaan konsistensi lintas artefak:

```powershell
.\.venv\Scripts\python.exe -c "import json; m=json.load(open('research/hasil/model.json')); s=json.load(open('research/hasil/gate_c_simulation.json')); print(m['decision']['default_operating_point']); print([a['id'] for a in s['arms']])"
```

Hasil yang diharapkan: `youden`, lalu
`['lr_target_sensitivity', 'lr_youden', 'geopref_published', 'gate_c_target']`.

Daftar lengkapnya ada di `docs/verifikasi.md`.

Seluruh perintah di atas dijalankan ulang pada 06bfd5d dan lolos: 39 tes Python,
156 tes TypeScript, ESLint bersih, `next build` sukses, manifest 130 berkas
terverifikasi, dan kedua generator melaporkan artefaknya sudah mutakhir.

### Keadaan git saat checkpoint ini

- Branch: hanya `main`, sinkron dengan `origin/main` pada `06bfd5d` (30 commit).
- Branch fitur `feat/live-measured-outcome` dan `feat/gate-evidence-and-demo-path`
  sudah di-merge dan dihapus di lokal maupun remote.
- Riwayat ditulis ulang untuk membuang trailer co-author; satu-satunya author dan
  committer di seluruh riwayat adalah Raphael Angelo. Hash commit lama tidak berlaku
  lagi, jadi klon lama harus di-clone ulang, bukan di-pull.
- Working tree bersih.

---

## 7. Aturan yang tidak boleh dilanggar saat melanjutkan

Diringkas dari `AGENTS.md` dan `docs/keputusan_ilmiah.md`, ditaruh di sini karena
inilah yang paling mudah rusak tanpa sengaja:

1. **Model Carette tidak pernah memutuskan apa pun.** Ia hanya mengisi panel riset yang
   dijaga OOD.
2. **Indeks lapisan B tidak pernah digabung** menjadi satu skor.
3. **Hasil di bawah ambang bukan kabar baik.** Ditegakkan oleh tipe
   (`reassures: false`), salinan teks, dan tes kontrak.
4. **Akurasi absolut hanya dikutip dari blok target diketahui.** Tidak pernah dari
   kesepakatan antaraliran.
5. **Kesepakatan AOI tidak pernah jadi headline.**
6. **Nama panggilan anak bersifat sementara** — hidup di ref untuk speech synthesis,
   tidak pernah masuk `profile`, log audit, atau disk.
7. **Berkas mentah di `research/hasil/gate_a/sesi` dan `gate_b/pasangan` adalah bukti
   yang tidak boleh diubah.** Regenerasi hanya lewat
   `gate_evidence_repository.py --rebuild --verify`.
8. **Ubah generator, bukan JSON hasil generate** (`gate-b-public.json`,
   `gate_c_simulation.json`, blok `decision` di `model.json`).
