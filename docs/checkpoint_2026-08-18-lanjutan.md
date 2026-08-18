# Checkpoint 18 Agustus 2026 (lanjutan) — pitch, paper, dan drift yang ketahuan

Melanjutkan [`checkpoint_2026-08-18.md`](checkpoint_2026-08-18.md), yang menutup Fase 4–6
dan menyisakan delapan pekerjaan. Sesi ini mengerjakan yang bisa dikerjakan tanpa kamera,
tanpa LaTeX, dan tanpa manusia kedua — lalu menemukan satu hal yang tidak ada di daftar mana
pun: angka durasi sesi yang salah di layar operator.

---

## 1. Yang selesai di sesi ini

### 1.1 Pitch 7 menit (Task 30, Prioritas 3) — [`pitch_7_menit.md`](pitch_7_menit.md)

Naskah utuh, bukan kerangka. Delapan bagian dengan peta waktu per bagian, kalimat yang
dibacakan, apa yang harus ada di layar tiap saat, dan aturan pemotongan bila demo molor
(potong Bagian 6; jangan pernah potong Bagian 5 dan 7).

Tiga bagian yang paling menentukan:

- **Bagian 5, batas alat.** Tabel empat titik kerja dipakai untuk menjelaskan kenapa
  sensitivitas 17 persen adalah pilihan, bukan kekurangan. Naskahnya menyebut angka yang
  benar: titik sensitivitas 0,9 merujuk **740 dari 1.000** anak, GeoPref merujuk **19** dan
  menemukan 1,5 dari 9 kasus yang ada.
- **Bagian 7, momen integritas.** Dua cerita: panel riset menolak model Carette karena OOD,
  dan rekomputasi Gate B menurunkan angka sendiri dari 99,7574 ke 99,7118 persen lalu
  menerbitkan selisihnya.
- **Rencana kalau demo berakhir WITHHELD.** Dokumennya memberi kalimat yang dipakai
  di tempat, bukan menyuruh mengulang. Keadaan ditahan adalah bahan bicara: attrition webcam
  balita 42 persen, dan alat yang tidak pernah menolak mengeluarkan angka adalah alat yang
  mengarang angka.

Ditambah tujuh pertanyaan yang hampir pasti datang beserta jawabannya, dan satu tabel yang
memetakan tiap angka di naskah ke berkas sumbernya.

### 1.2 Paper: Task 29 struktural, kecuali kompilasinya

Sumbernya, `paper/sumber/paper_final.tex`, sudah memuat seluruh perubahan struktural yang
diminta. **PDF-nya belum dikompilasi** — tidak ada toolchain LaTeX di environment ini.

| Perubahan | Letak |
|---|---|
| Bagian arsitektur keputusan tiga lapis + tabel preseden (GeoPref / SenseToKnow / EarliPoint / WebGazer) | `\subsection{Arsitektur keputusan}`, label `sec:lapisan`, Tabel `tab:preseden` |
| Tabel dampak operasional empat titik kerja | `sec:operasional`, Tabel `tab:operasional` |
| Wen dkk. 2022 masuk tinjauan pustaka sebagai sumber ambang 69% | `\subsection{Atensi visual sebagai penanda perilaku}` |
| Steffan dkk. 2024 sebagai pembenaran pembanding Gate B + attrition 42% | `sec:gateb` |
| Papoutsaki dkk. 2016 + blok akurasi absolut Gate A (2,36° / 3,58°) | `sec:gatea` |
| Carette diturunkan: tidak pernah memutuskan, hanya panel riset ber-OOD | abstrak, `sec:lapisan`, `\subsection{Arsitektur sistem}` |
| Angka CNN dicabut sebagai kandidat titik kerja Gate C | `\subsection{Ringkasan capaian validasi}`, `sec:lanjut` |
| Catatan tata kelola: spesifisitas lintas ras, pra-registrasi subgrup, nol validasi Indonesia | `sec:tatakelola` |
| Batasan kelima: nol balita di seluruh bukti | `sec:batasan` |
| Kontribusi jadi delapan; arsitektur berlapis masuk sebagai kontribusi (ii) | `\subsection{Solusi yang diusulkan}` |

Tiga sitiran baru ditambahkan: `wen2022`, `steffan2024`, `papoutsaki2016`.

Klaim di baris "dua titik kerja dilaporkan berdampingan" **diverifikasi benar**:
`model.json` mengekspor keduanya dan default-nya `youden`.

Karena tidak bisa dikompilasi, integritasnya diperiksa secara struktural
(`\cite` tanpa `\bibitem`, `\ref` tanpa `\label`, environment tidak seimbang, jumlah kolom
tabel vs jumlah `&` per baris, delta kurung kurawal). Seluruhnya bersih. Lebar kedua tabel
baru sudah disetel agar muat di blok teks NeurIPS; itu satu-satunya hal yang baru bisa
dipastikan setelah kompilasi.

### 1.3 Drift yang ketahuan: sesi 96 detik yang ditulis 66 detik

Tidak ada di daftar pekerjaan mana pun, dan ini yang paling perlu diperbaiki.

`STIMULUS_PHASES` berisi 12 fase dengan total **96.000 ms**. Baterainya tumbuh dari 66 ke 96
detik ketika blok preferential-looking (17 detik) dan panggilan nama (13 detik) ditambahkan.
Salinan teks yang menyebut durasi tidak ikut berubah:

- Layar persiapan mengatakan kepada operator *"Stimulus berlangsung sekitar satu menit
  (66 detik)"*. Ini angka yang dipakai kader untuk memperkirakan apakah anak di depannya akan
  bertahan. Ia meleset setengah menit.
- Konsol admin menampilkan `Durasi total 66 detik`, rinciannya `5 + (8 × 7) + 5 detik`, dan
  versi stimulus `v3 / ID-joint-cues-vector-v3` — padahal `STIMULUS_VERSION` sudah
  `ID-joint-cues-geopref-name-v4`.
- Tes kontrak `child-flow-contract.test.ts` **menegakkan angka yang salah**:
  `assert.match(adminConsole, /66 detik/)` dan `/ID-joint-cues-vector-v3/`. Tes yang
  seharusnya menjaga kecocokan justru mengunci nilai basi.

Perbaikannya membuat drift yang sama tidak bisa terulang:

- `protocol.ts` mengekspor `STIMULUS_TOTAL_MS`, `STIMULUS_TOTAL_SECONDS`, dan
  `SCORED_TRIAL_COUNT`, seluruhnya diturunkan dari `STIMULUS_PHASES`.
- `page.tsx` dan `admin-console.tsx` membaca nilai itu; tidak ada durasi yang ditulis literal.
- Tesnya dibalik: ia sekarang mengimpor protokolnya, memastikan totalnya 96 detik dan
  percobaan berskornya 8, lalu menolak berkas mana pun yang masih memuat `66 detik` literal.

Sekalian di konsol admin: `Agreement AOI` yang tadinya `99,7574%` diganti nilai rekomputasi
`99,7118%` dengan nilai simpanan sebagai catatan — aturan di `AGENTS.md` sudah menyebut ini,
tapi konsolnya belum ikut. Dan metrik Gate C yang berlabel *"Sensitivitas kandidat 84,62%"*
diganti *"sekunder"*, ditambah satu baris target Gate C dari Perochon dkk.

### 1.4 `npm test` tidak menjalankan sembilan berkas tes

Skrip `test` di `package.json` memuat daftar berkas yang ditulis tangan. Daftarnya
tertinggal: `recording`, `geopref-score`, `joint-attention`, `phenotype-entropy`,
`phenotype-indices`, `phenotype-profile`, `response-to-name`, `session-outcome`,
`frame-trace`, `consent-blockers`, dan `rendered-html` tidak pernah ikut jalan. Perintah di
`docs/verifikasi.md` (`npx tsx --test tests/*.test.ts`) menjalankan semuanya, jadi
selisihnya baru terlihat kalau kedua perintah dibandingkan.

Sekarang skripnya memakai glob: `node --test "tests/*.test.mjs"` lalu
`tsx --test "tests/*.test.ts"`. Berkas tes baru langsung ikut jalan tanpa menyunting
`package.json`.

### 1.5 Pendaftaran rekaman jadi satu perintah (menyiapkan Prioritas 1)

Prosedur enam langkah di checkpoint sebelumnya punya satu mode gagal yang senyap: log yang
diekspor dari sesi **replay** akan tersalin dengan mulus, lalu menghasilkan indeks lapisan B
kosong persis seperti simulasi yang seharusnya ia gantikan.

- `inspectAuditLog()` di `src/replay/recording.ts` sekarang mengembalikan alasan penolakan,
  bukan `null` polos. `recordingFromAuditLog()` menjadi pembungkus tipis di atasnya, jadi
  perilaku lama tidak berubah.
- `app/scripts/register-recording.ts` memvalidasi, menyalin, dan mendaftarkan dalam satu
  perintah, serta menolak berkas yang salah beserta alasannya.

```powershell
cd app
npm run replay:register -- ..\tmp\audit.json --as session-a.json
npm run replay:check
```

`--check` membaca ulang setiap rekaman yang terdaftar; manifest kosong dilaporkan sebagai
keadaan yang sah, bukan kegagalan.

### 1.6 `tsc --noEmit` bersih

Satu galat yang sudah ada sebelumnya (flag regex `s` terhadap target ES2017 di
`child-flow-contract.test.ts`) diganti `[\s\S]*`. Batasan ini bisa dicoret dari daftar.

### 1.7 Dokumentasi yang menyusul kode

- `docs/panduan_operator.md` — bagian "Membaca hasil" ditulis ulang. Versi lamanya hanya
  bilang *"sesi kamera anak tidak mengeluarkan skor risiko ASD"*, yang benar secara harfiah
  tetapi menyesatkan sejak sesi kamera mulai menghasilkan laporan terukur. Sekarang ia
  menyebut empat kemungkinan hasil, kenapa hasil di bawah ambang bukan kabar baik, dan kenapa
  hasil ditahan bukan kesalahan operator.
- `app/README.md` — kontrak produk ditulis ulang mengikuti arsitektur tiga lapis, ditambah
  cara mendaftarkan rekaman.
- `docs/verifikasi.md` — `npx tsc --noEmit` dan `npm run replay:check` masuk daftar rilis.
- `README.md` dan `AGENTS.md` — celah replay diperbarui, dan aturan glob pada `npm test`
  dicatat supaya daftar berkas tidak dikembalikan.

---

## 2. Konsep webapp hari ini

Satu PWA luring di tablet Android kelas menengah bawah, dioperasikan kader Posyandu di meja
keempat, seluruh pemrosesan kamera di perangkat. Sembilan langkah: persetujuan, persiapan,
tutorial, posisi, kalibrasi, cek arah, stimulus, pemeriksaan mutu, laporan.

**Baterai stimulus: 96 detik, 12 fase.** Lima detik baseline, delapan percobaan isyarat
berskor masing-masing 7 detik, 17 detik preferential-looking, 13 detik panggilan nama, lima
detik penutup.

**Yang dikeluarkan sesi** adalah laporan satu anak dengan tiga bagian:

1. **Lapis A — GeoPref.** Persentase waktu pada pola geometrik terhadap ambang terbit 69
   persen. Satu-satunya pemicu rujukan otomatis di seluruh sistem. Saat ini ambangnya
   **ditahan** karena klipnya 16,75 detik CC BY, bukan stimulus terbit 60–90 detik.
2. **Lapis B — enam indeks perilaku.** Menghadap ke depan, gerak kepala, kedip sosial, kedip
   non-sosial, respons nama, dan mengikuti isyarat. Deskriptif, masing-masing membawa AUC
   preseden sebagai provenance, **tidak pernah dijumlahkan**.
3. **Kalimat hasil.** Empat kemungkinan: rujuk, terukur tanpa rujuk, protokol dipersingkat,
   ditahan.

**Empat hal yang tidak akan pernah muncul di laporan:** skor gabungan, probabilitas ASD,
gauge atau lampu lalu lintas, dan kata yang membuat hasil di bawah ambang terbaca sebagai
aman.

**Regresi logistik Carette** ada di dalam aplikasi tetapi berada di luar jalur keputusan. Ia
hanya mengisi panel riset yang dijaga penapis OOD, dan tetap dipertahankan karena menjadi
dasar bukti evaluasi paper serta satu-satunya bukti paritas $10^{-12}$ antara Python dan
TypeScript.

**Laporan bisa dicetak** sebagai serah terima satu halaman untuk Puskesmas. Log audit tinggal
di memori sampai operator mengekspor atau menghapusnya. Nama panggilan anak hidup di sebuah
ref untuk speech synthesis dan tidak pernah menyentuh profil, log, atau disk.

**Demo cepat** menjalankan pipeline yang sama dan melabeli laporannya sesuai sumber:
"REKAMAN — bukan sesi langsung" atau "SIMULASI — bukan sesi langsung". Selama manifest
kosong, demo memakai simulasi, indeks lapisan B tetap kosong, dan laporannya berakhir
ditahan. Ini benar secara logika sistem dan tetap lemah sebagai demonstrasi.

---

## 3. Batasan

### 3.1 Lingkungan (tidak berubah dari checkpoint sebelumnya)

- **Tidak ada kamera.** Jalur tangkapan langsung belum pernah diverifikasi ujung ke ujung.
  Ini masih risiko teknis terbesar yang tersisa: kodenya lulus tes unit dan kontrak, tapi
  belum pernah bertemu wajah sungguhan.
- **Tidak ada LaTeX.** PDF paper basi terhadap sumbernya, dan sekarang selisihnya lebih besar
  daripada sebelumnya karena sumbernya bertambah dua tabel dan dua bagian.
- Galat `tsc --noEmit` sudah tidak ada. Batasan ini hilang.

### 3.2 Data (tidak berubah)

- Harness perekam Gate B tidak ada di repo; `app/app/admin/gate-b/capture/` adalah folder
  kosong. Selisih klasifikasi AOI karena itu diterbitkan, bukan didamaikan.
- Belum ada satu pun balita dalam bukti mana pun.
- Tidak ada instrumen di sini yang divalidasi di Indonesia.
- Replay masih sintetis selama `app/public/replay/index.json` kosong.

### 3.3 Ilmiah (permanen)

Tidak berubah, dan seluruhnya kini tertulis di paper maupun di naskah pitch: GeoPref hanya
alat rule-in (sens 17%, NPV 65%); protokolnya sedang dipersingkat sehingga ambangnya ditahan;
model Carette tidak bisa memutuskan apa pun; indeks lapisan B tidak boleh digabung;
kesepakatan antaraliran tidak pernah bisa menjadi akurasi; dan spesifisitas SenseToKnow
timpang lintas ras (53,6% vs 82,7%) sehingga analisis subgrup wajib dipra-registrasi.

---

## 4. Yang belum selesai

| # | Pekerjaan | Kenapa belum | Butuh apa |
|---|---|---|---|
| 1 | **Rekam 3 sesi dewasa** (Task 15) | Tidak ada kamera di sini | Manusia + perangkat berkamera, ~30 menit. Pendaftarannya kini satu perintah |
| 2 | **Kompilasi ulang paper** | Tidak ada LaTeX di sini | Overleaf, ~10 menit, lalu ganti `paper/Rizzz_Paper_Final.pdf` |
| 3 | **Baca-ulang paper setelah kompilasi** | Butuh #2 | Periksa lebar `tab:preseden` dan `tab:operasional`, penempatan float, dan nomor bagian pada rujukan silang baru |
| 4 | **Task 22 — paket provenance** | Artefak fisik | Manusia, ~2 jam |
| 5 | **Task 18 langkah 2 & 4** — blok 9 target diketahui di sesi Gate B | Harness perekamnya tidak ada; sisi analisis sudah siap dan teruji | ~6 jam |
| 6 | **Kirim surat UCSD** | Draf siap | Persetujuan pembimbing |
| 7 | **Uji toleransi balita** terhadap baterai 96 detik | Butuh anak, pengasuh, izin etik | Di luar jangkauan; sampaikan sebagai keterbatasan |
| 8 | **Latihan pitch dengan stopwatch** | Naskahnya baru jadi | 1 jam, dua kali putaran |

---

## 5. Urutan yang saya sarankan berikutnya

**Prioritas 1 tetap merekam tiga sesi dewasa.** Alasannya tidak berubah dan sekarang lebih
murah: satu tindakan 30 menit memverifikasi jalur kamera yang belum pernah diuji, mengisi
enam indeks, mengubah demo dari WITHHELD menjadi laporan bernilai, dan menutup Task 15.
Prosedurnya sekarang:

1. `cd app; npm run dev`, buka di perangkat berkamera (HTTPS atau localhost).
2. Jalani sesi utuh, lalu **Unduh log audit JSON** di laporan.
3. `npm run replay:register -- <berkas> --as session-a.json`
4. Ulangi untuk `session-b` dan `session-c`. Buat salah satunya sengaja gagal mutu (tutup
   kamera di tengah) supaya keadaan ditahan juga punya rekaman nyata.
5. `npm run replay:check`, lalu klik Demo cepat.

**Selesai bila** laporan demo berlabel "REKAMAN" dan enam indeks berisi angka. Kalau perintah
di langkah 3 menolak berkasnya, ia akan menyebut sendiri apa yang kurang — hampir selalu
`gaze.frames`, yang berarti sesinya berjalan dalam mode replay, bukan kamera langsung.

Sekalian catat apakah `TURN_YAW_THRESHOLD` 0,28 memicu respons nama secara wajar.

**Prioritas 2: kompilasi paper** (#2 lalu #3). Sumbernya sudah siap; yang tersisa pekerjaan
mekanis plus satu putaran baca-ulang tata letak.

**Prioritas 3: latih pitch dengan stopwatch.** Naskahnya ada, waktunya belum pernah diuji
dengan suara sungguhan. Bagian 3 dan 5 yang paling mungkin molor.

**Bila waktu sangat terbatas:** Prioritas 1 lalu 3. Paper yang PDF-nya basi lebih kecil
risikonya daripada demo yang menampilkan "sesi belum dapat dinilai" di depan juri, dan lebih
kecil lagi daripada pitch yang tidak pernah dilatih.

---

## 6. Cara memverifikasi

```powershell
.\.venv\Scripts\python.exe -m pytest -q
.\.venv\Scripts\python.exe research\gate_evidence_repository.py --rebuild --verify
.\.venv\Scripts\python.exe research\export_operating_points.py --check
.\.venv\Scripts\python.exe research\export_public_evidence.py --check
cd app
npm test
npm run lint
npx tsc --noEmit
npm run replay:check
```

Dijalankan ulang setelah seluruh perubahan sesi ini, dan seluruhnya lolos:

- 39 tes Python
- 3 tes Node (`tests/*.test.mjs`) dan **158** tes TypeScript (`tests/*.test.ts`),
  naik dari 156 karena dua tes baru
- ESLint bersih, `tsc --noEmit` bersih, `next build` sukses
- Manifest 130 berkas bukti terverifikasi
- Kedua generator artefak melaporkan keluarannya sudah mutakhir
- `model.json` default `youden`; lengan simulasi Gate C tetap
  `['lr_target_sensitivity', 'lr_youden', 'geopref_published', 'gate_c_target']`

Demo cepat juga dijalankan di browser: laporan keluar berlabel "SIMULASI — bukan sesi
langsung" dengan hasil ditahan dan indeks kosong, tanpa satu pun galat konsol maupun galat
server. Itu perilaku yang benar selama manifest rekaman kosong.

Daftar lengkapnya di [`verifikasi.md`](verifikasi.md).

---

## 7. Aturan yang tidak boleh dilanggar saat melanjutkan

Delapan aturan di `checkpoint_2026-08-18.md` Bagian 7 tetap berlaku seluruhnya. Sesi ini
menambah dua:

9. **Durasi sesi, jumlah percobaan, dan versi stimulus tidak boleh ditulis literal di
   antarmuka.** Baca dari `STIMULUS_TOTAL_SECONDS`, `SCORED_TRIAL_COUNT`, dan
   `STIMULUS_VERSION`. Sebuah tes kontrak menolak berkas yang memuat `66 detik` literal.
10. **`npm test` memakai glob, jangan dikembalikan menjadi daftar berkas.** Daftar yang
    ditulis tangan sudah pernah diam-diam melewatkan sembilan berkas tes.
