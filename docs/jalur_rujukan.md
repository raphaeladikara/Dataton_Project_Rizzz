# Jalur rujukan: kenapa belum ada, dan bagaimana membukanya

Pertanyaan tersulit yang bisa diajukan ke proyek ini bukan soal sensitivitas 17%.
Pertanyaannya lebih telanjang:

> Kalau alat ini dipasang di Posyandu besok pagi, berapa anak yang dirujuknya?

Jawaban jujur hari ini adalah **nol**, dan bukan karena tidak ada anak yang perlu
dirujuk. Karena ada dua kunci terpasang di kode, keduanya dipasang sengaja, dan
keduanya masih terkunci.

Catatan ini menjelaskan kedua kunci itu, apa yang membuka masing-masing, dan mana
yang bisa dikerjakan tanpa menunggu pihak ketiga.

Dua catatan lain memikul bagian yang tidak muat di sini.
[`etika_perekaman.md`](etika_perekaman.md) menjelaskan kenapa jalur "kumpulkan saja
data balita sendiri" tertutup dan akan tetap tertutup.
[`model_rujukan.md`](model_rujukan.md) berisi rancangan model yang menggantikannya.

---

## Kunci 1 — Lapis A tidak dapat menyala

`resolveSessionOutcome` menyalakan `emitsReferral` hanya pada satu keadaan:
`RULE_IN_GEOMETRIC`. Keadaan itu menuntut `scoreGeopref` memutuskan bahwa ambang 69%
berlaku, dan itu menuntut `validatedProtocol` bernilai benar.

Klip yang di-*bundle* adalah cuplikan 16,75 detik dari video contoh Moore dkk. 2018,
sedangkan ambang 69% divalidasi Wen dkk. 2022 pada GeoPref asli 62,22 detik. Jadi
`validatedProtocol` bernilai salah, ambangnya **ditahan**, dan sesi berakhir sebagai
`MEASURED_PROTOCOL_ABBREVIATED`: persentase dilaporkan, keputusan tidak diambil.

**Yang membuka kunci ini:** akses ke stimulus GeoPref penuh. Draf permintaannya sudah
ada di [`provenance/permintaan_stimulus_ucsd.md`](provenance/permintaan_stimulus_ucsd.md).
Tidak ada pekerjaan teknis yang bisa menggantikannya, dan mengarang ambang sendiri
pada cuplikan 16,75 detik akan menghapus satu-satunya hal yang membuat Lapis A layak
dipercaya: ambangnya bukan kita yang memilih.

**Yang tidak boleh dilakukan:** menurunkan ambang, mengoptimasi ambang pada data
sendiri, atau menyatakan `validatedProtocol` benar dan berharap tidak ada yang
memeriksa. Ketiganya menghasilkan rujukan hari ini dan menghancurkan proyeknya.

---

## Kunci 2 — Lapis B2 menyala, tetapi tidak dihubungkan ke apa pun

Aturan komposit di `referralRecommendation.ts` **sudah** bisa bernilai
`recommendsFollowUp: true`. Yang tidak ada adalah jembatan dari sana ke hasil sesi:
`emitsReferral` tidak pernah membacanya. Lajur komposit tampil di laporan sebagai
panel deskriptif di samping Lapis A, dan berhenti di situ.

Ada tiga alasan jembatan itu belum dibangun, dan ketiganya benar pada saat ditulis:

1. **Ambangnya karangan sendiri.** `REFERRAL_DEVIANT_THRESHOLD = 2` tidak punya
   sumber. Setiap angka lain di sistem ini punya artefak; yang ini tidak.
2. **Karakteristik operasionalnya tidak pernah dihitung.** `gate_c_simulation.json`
   punya lengan untuk regresi logistik dan untuk GeoPref, tidak untuk aturan komposit.
   Jadi tidak ada yang tahu apa yang dilakukannya pada antrean Posyandu.
3. **Belum pernah ada yang melihatnya menyala pada data nyata.** Tanpa rekaman
   terdaftar, jalur demo memakai titik sintetis dan penjaga OOD menolaknya.

Ketiganya bisa diselesaikan tanpa menunggu siapa pun. Itulah isi rencana di bawah.

---

## Jalan yang paling wajar, dan kenapa ia tertutup

Dua kunci di atas terpasang di kode. Yang berikut ini tidak — ia terpasang di luar,
dan justru karena itu bentuk rencananya berubah.

Cara paling lurus menyelesaikan alasan 1 dan 2 di atas adalah membangun **pita
normatif**: rekam 40–60 balita tipikal, susun sebaran tiap indeks terhadap usia, lalu
nyatakan "menyimpang" sebagai persentil, bukan sebagai angka pilihan sendiri. Itu
sekaligus membuat spesifisitas terukur secara konstruksi — flag di persentil ke-5
berarti laju positif-palsu sekitar 5% — dan itu persis bahasa yang sudah dipakai kader
tiap bulan di KMS.

Jalan itu tertutup, dan tertutupnya bukan soal kesulitan teknis.

Merekam balita menuntut kaji etik yang menyahkan persetujuan orang tua. Lima lembaga
sudah dihubungi dan seluruhnya menolak, dan pada tahap bukti hari ini penolakan itu
keputusan yang benar. Merekam anak dengan ASD menuntut lebih dari itu lagi. Alasan
lengkapnya, beserta apa yang harus ada sebelum batas ini bergeser, di
[`etika_perekaman.md`](etika_perekaman.md).

Konsekuensinya untuk rencana: **pita normatif dipindahkan ke spesifikasi Gate C**, dan
yang menggantikannya di rencana hari ini adalah dua lapis yang tidak menuntut satu
rekaman anak pun — kalibrasi likelihood-ratio dari titik operasi terbit, dan bobot yang
dipasang pada data anak berlabel yang sudah diterbitkan orang lain di bawah lisensi
terbuka. Rancangannya di [`model_rujukan.md`](model_rujukan.md).

---

## Kesalahan yang harus diperbaiki lebih dulu

Sebelum lajur komposit pantas mengeluarkan rujukan, ada satu kekeliruan logis di
dalamnya yang harus dicabut.

`summarizeJointAttention` mengembalikan `NOT_DISTINGUISHABLE` ketika uji tanda tidak
mencapai p < 0,05. `cueSignal` memetakan itu menjadi `"menyimpang"`. Artinya
**tidak-terbukti-mengikuti** dihitung sebagai **terbukti-tidak-mengikuti**.

Itu persis kekeliruan yang dikritik proyek ini di tempat lain, dan konsekuensinya
tidak kecil. Dengan delapan percobaan, uji tanda satu sisi baru mencapai p < 0,05 pada
tujuh keberhasilan:

| Mengikuti | p (satu sisi) | Status lama |
|---:|---:|---|
| 8/8 | 0,004 | normal |
| 7/8 | 0,035 | normal |
| 6/8 | 0,145 | **menyimpang** |
| 5/8 | 0,363 | **menyimpang** |
| 4/8 | 0,637 | menyimpang |

Anak yang mengikuti enam dari delapan isyarat — perilaku yang sepenuhnya wajar —
dilabeli menyimpang. Karena di lapangan hanya dua sinyal yang dapat dinilai dan
aturannya menuntut keduanya, satu panggilan nama yang terlewat sudah cukup untuk
memicu rekomendasi.

**Perbaikannya** adalah memisahkan tiga keadaan alih-alih dua, dan memakai arah
kenaikan (median *lift* pasca-isyarat terhadap pra-isyarat) sebagai pembeda:

| Bukti | Status baru |
|---|---|
| p < 0,05 | normal — terbukti mengikuti |
| p ≥ 0,05 tetapi median lift > 0 | **tidak dapat dinilai** — arahnya benar, buktinya kurang |
| median lift ≤ 0 dan mengikuti ≤ separuh percobaan | menyimpang — ada bukti tidak mengikuti |

Setelah perbaikan ini, `"menyimpang"` berarti sesuatu yang benar-benar terukur, dan
aturan komposit menjadi **lebih jarang menyala**, bukan lebih sering. Itu arah yang
benar: lajur rujukan yang layak dipercaya lebih berharga daripada lajur rujukan yang
sering berbunyi.

---

## Rencana delapan langkah

Tiga langkah pertama tidak butuh unduhan, tidak butuh peserta, dan tidak butuh izin
siapa pun. Sisanya bergantung pada satu berkas terbuka dan pada hasil kontrol positif.

### Langkah 1 — Cabut kekeliruan absence-of-evidence

Ubah `summarizeJointAttention` dan `cueSignal` sesuai tabel di atas, dengan uji yang
mengunci ketiga keadaan. Tidak butuh data baru. Selesai dalam satu sesi kerja.

**Selesai bila:** ada uji yang gagal kalau `NOT_DISTINGUISHABLE` dengan lift positif
pernah dipetakan ke `menyimpang` lagi.

### Langkah 2 — Jalankan kontrol positif

Protokol lengkapnya di [`kontrol_positif.md`](kontrol_positif.md). Delapan sampai
sepuluh peserta dewasa, dua kondisi masing-masing, ~90 menit kerja.

Yang dihasilkan adalah tabel dua baris:

| | Komposit menyala | Tidak menyala |
|---|---:|---:|
| Menonton biasa | *a* | *b* |
| Pola diproduksi | *c* | *d* |

Kontrol positif adalah **fondasi, bukan puncak**. Ia membuktikan instrumennya
merespons; ia tidak menghasilkan model dan tidak bisa menghasilkan model. Kalau ia
gagal, langkah 3–8 tidak ada gunanya dikerjakan.

**Selesai bila:** tabel itu ada, seluruh sesi termasuk yang ditahan terdaftar di
`lembar_sesi.csv`, dan dua rekaman terdaftar di `app/public/replay/`.

### Langkah 3 — Ganti aturan pencacahan dengan kalibrasi likelihood-ratio

`REFERRAL_DEVIANT_THRESHOLD = 2` adalah satu-satunya angka di sistem ini yang tidak
punya artefak. Ia digantikan penjumlahan log-LR yang setiap sukunya diambil dari titik
operasi terbit, dengan aturan keras: **sinyal tanpa titik operasi terbit mendapat
LR = 1** dan tidak menggerakkan keputusan sampai angkanya diekstrak dari makalahnya.

Rancangan, aritmetika, dan batasnya di [`model_rujukan.md`](model_rujukan.md).

**Selesai bila:** `referral_lr.json` memuat satu baris per sinyal dengan kutipan
sumbernya, dan sinyal tanpa sumber tercatat ber-LR = 1 secara eksplisit.

### Langkah 4 — Unduh dan verifikasi dataset Cilia

Dataset eye-tracking ASD/TD terbit di bawah CC BY 4.0, DOI
`10.6084/m9.figshare.20113592.v1`: 59 anak, koordinat mentah 60 Hz, ID partisipan ada.
Tidak ada anak yang perlu kami rekam.

**Selesai bila:** manifest berisi SHA-256 berkasnya, dan tabel dataset di
`model_rujukan.md` sudah diverifikasi terhadap isi berkas yang sebenarnya — bukan
terhadap deskripsi terbitannya.

### Langkah 5 — Bangun indeks dan jalankan empat audit

Indeks perilaku dihitung dari koordinat mentah, bukan dari raster. Empat audit
mengikutinya: desimasi 60 → 30 Hz, alas shortcut tingkat sesi, kebocoran partisipan,
dan penjaga OOD dua arah. Kriteria penolakannya ditulis lebih dulu di
[`model_rujukan.md`](model_rujukan.md), sebelum angkanya dilihat.

**Selesai bila:** empat berkas hasil audit ada di `research/hasil/`, apa pun isinya.

### Langkah 6 — Pasang bobot, atau terbitkan penolakannya

Regresi logistik pada tiga sampai lima indeks, `GroupKFold` per partisipan. Yang
dipindahkan ke NeuroGaze adalah **bobot relatif antar indeks**, bukan titik operasinya.

Dengan n=59 dan usia yang salah, penolakan adalah hasil yang cukup mungkin. Kalau
ditolak, Lapis 1 tetap dikirim sendirian dan penolakannya diterbitkan sebagai temuan.

**Selesai bila:** `model_rujukan.json` ada — berisi bobot beserta pernyataan
lingkupnya, atau berisi alasan penolakan beserta audit yang membatalkannya.

### Langkah 7 — Hitung biaya operasionalnya

Tambah lengan aturan komposit ke `research/prospective_evaluation.py`. Karena
sensitivitas dan spesifisitasnya pada balita belum diketahui, lengan ini **tidak boleh
mengasumsikan angka**. Yang dihitung adalah pertanyaan terbalik:

> Berapa spesifisitas minimum yang harus dicapai aturan komposit supaya laju
> rujukannya muat di kapasitas rujukan yang ada?

Pada kohort 1.000 anak, prevalensi 1%, coverage teknis 90%, laju rujukan adalah
`prevalensi × sensitivitas + (1 − prevalensi) × (1 − spesifisitas)`. Suku pertama
kecil sekali; yang menentukan adalah suku kedua. Untuk laju rujukan di bawah 20%,
spesifisitas harus **≥ 0,81** — kebetulan hampir persis angka SenseToKnow (0,808).

Itu pernyataan yang jauh lebih berguna daripada asumsi: ia mengubah "entah berapa"
menjadi "inilah yang harus dibuktikan Gate C, dan inilah yang terjadi kalau tidak
tercapai".

**Selesai bila:** `gate_c_simulation.json` memuat lengan komposit berisi analisis
titik impas, dan tabel di pitch memuat barisnya.

### Langkah 8 — Promosikan lajur komposit menjadi lajur rujukan

Hubungkan `recommendsFollowUp` ke keluaran sesi sebagai jenis hasil tersendiri —
bukan digabung ke `RULE_IN_GEOMETRIC`, bukan menggantikannya. Dua lajur, dua label,
dua dasar bukti, tidak pernah dijumlahkan.

Kalimat hasilnya berbunyi seperti ini, dan setiap bagiannya bisa dipertahankan:

> Disarankan pemeriksaan lanjutan. Probabilitas pasca-tes 7,9% dari prevalensi awal 1%,
> digerakkan oleh preferensi geometrik. Aturan ini belum divalidasi pada balita; arah
> tiap sinyalnya diambil dari literatur, bobotnya dipasang pada 59 anak usia 3–12 tahun
> dari data terbit, dan responsivitas instrumennya diuji pada 10 orang dewasa. Bawa
> hasil ini bersama SDIDTK ke Puskesmas.

Perhatikan yang tidak diklaim: bukan diagnosis, bukan sensitivitas, bukan spesifisitas
pada balita Indonesia. Yang diklaim adalah **rekomendasi pemeriksaan lanjutan** dari
aturan yang membawa alasannya per sinyal dan lingkupnya per parameter.

---
## Kriteria promosi — dan kriteria menolak promosi

Langkah 8 hanya boleh dijalankan kalau kontrol positif memenuhi semuanya:

- **Responsif.** Aturan menyala pada mayoritas sesi pola-diproduksi. Kalau menyala
  pada kurang dari separuh, instrumen tidak menangkap pola yang sengaja diproduksi
  di depannya, dan tidak ada alasan percaya ia menangkap yang tidak disengaja.
- **Tidak berisik.** Aturan menyala pada **nol** sesi menonton-biasa. Peserta dewasa
  yang menonton wajar tidak boleh memicu rekomendasi. Satu saja sudah cukup untuk
  menunda promosi sampai penyebabnya ditemukan.
- **Tiap sinyal bergerak.** Ketiga sinyal berubah status antar kondisi pada mayoritas
  peserta. Sinyal yang tidak pernah bergerak tidak boleh ikut menghitung.
- **Attrition dilaporkan.** Sesi yang ditahan masuk hitungan penyebut.

Kalau salah satu tidak terpenuhi, **lajur komposit tetap deskriptif** dan itu
dilaporkan apa adanya. Kontrol positif yang gagal adalah temuan yang lebih berharga
daripada kontrol positif yang tidak pernah dijalankan — dan jauh lebih berharga
daripada lajur rujukan yang menyala tanpa dasar.

---

## Jadi, apakah masalah "tidak ada rujukan" selesai?

Sebagian, dan bagian yang selesai adalah bagian yang bisa dikerjakan sendiri.

| | Sebelum | Sesudah langkah 1–8 |
|---|---|---|
| Lapis A (GeoPref) | Ditahan | Masih ditahan — butuh stimulus UCSD |
| Lapis B2 (komposit) | Panel deskriptif | **Lajur rujukan dengan alasan per sinyal** |
| Sesi menghasilkan rujukan? | Tidak pernah | Ya, lewat lajur komposit |
| Ambang gabungan | `= 2`, tanpa artefak | Odds pasca-tes dari LR terbit; ambang keputusan dinyatakan sebagai kebijakan kapasitas |
| Bobot antar sinyal | Tidak ada — semua dihitung setara | Dipasang pada 59 anak berlabel dari data terbit, atau penolakannya diterbitkan |
| Keluaran keputusan | "2 dari 3 menyimpang" | Probabilitas pasca-tes dengan lingkup per parameter |
| Sensitivitas/spesifisitas pada balita | Tidak diketahui | Masih tidak diketahui — itu Gate C |
| Balita yang direkam tim ini | Nol | **Tetap nol** |
| Demo menampilkan laporan berisi angka? | Tidak | Ya |

Yang berubah bukan "sekarang kami tahu anak ini autis". Yang berubah adalah alat ini
berhenti menjadi alat dokumentasi dan mulai memberi arahan — arahan yang membawa
alasannya, batasnya, dan bukti bahwa instrumennya benar-benar merespons.

Baris kedua dari bawah yang paling sering terlewat: seluruh perubahan di tabel ini
dicapai **tanpa satu pun anak direkam oleh tim ini**. Itu bukan kebetulan dan bukan
keterbatasan yang disiasati; itu batas yang dipasang lebih dulu, lalu rencananya
dibangun di dalamnya.

Dan itu bisa dikatakan di panggung tanpa satu kalimat pun yang perlu dilunakkan
kalau ada yang bertanya lebih dalam.

---

## Yang tetap tidak berubah

- Tidak ada balita di dalam bukti apa pun sampai Gate C, dan tidak ada balita yang
  direkam tim ini kapan pun sebelum kaji etik lolos.
- Tidak ada anak dengan ASD yang direkam tim ini. Data anak berlabel yang dipakai
  seluruhnya berasal dari terbitan berlisensi terbuka.
- Tidak ada skor gabungan. `combinedScore` tetap `null` dan tetap tidak punya jalur
  kode untuk diisi.
- Hasil yang tidak memicu rekomendasi tetap bukan tanda aman.
- Lapis A dan Lapis B2 tidak pernah dijumlahkan, dan tidak pernah saling
  menggantikan.
