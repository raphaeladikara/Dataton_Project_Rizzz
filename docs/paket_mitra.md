# Paket mitra Gate C — apa yang sudah siap dikirim hari ini

Permintaan proyek ini adalah satu mitra klinis/etik. Selama ini permintaan itu
disampaikan sebagai kalimat di akhir presentasi, dan kalimat tidak dapat diperiksa.

Catatan ini adalah daftar isinya: apa yang sudah jadi, di mana berkasnya, dan apa yang
masih kosong. Semua yang bertanda **siap** dapat dikirim ke calon mitra tanpa pekerjaan
tambahan.

Bedanya penting untuk cara menyebutnya di panggung. *"Kami belum punya mitra"* dan
*"paketnya siap dikirim, mitranya yang belum ada"* menggambarkan keadaan yang sama, dan
hanya satu di antaranya benar-benar menggambarkan pekerjaan yang sudah dilakukan.

---

## Yang dibawa Neurogaze ke meja

| # | Isi | Status | Berkas |
|---|---|---|---|
| 1 | Instrumen terinstrumentasi — tangkap luring, kalibrasi, gerbang mutu, jejak audit yang dapat diekspor dan diputar ulang | **Siap** | `app/` |
| 2 | Parity Python–TypeScript: fitur riset dan fitur tablet diuji berpasangan | **Siap** | `research/export_parity_fixture.py` |
| 3 | Bukti instrumen Gate A dan Gate B, 130 berkas mentah dengan manifest SHA-256 | **Siap** | `research/hasil/`, `evidence_manifest.json` |
| 4 | Kontrol positif dewasa dengan provenance kamera-ke-angka lengkap | **Siap** | `research/hasil/kontrol_positif/` |
| 5 | Protokol analisis Gate C dan kriteria penerimaannya | **Siap** | [`protokol_gate_validasi.md`](protokol_gate_validasi.md) |
| 6 | Rancangan lapis rujukan beserta empat audit wajib dan kriteria penolakannya | **Siap** | [`model_rujukan.md`](model_rujukan.md) |
| 7 | Simulasi beban rujukan per titik kerja, termasuk titik impas kapasitas | **Siap** | `research/hasil/gate_c_simulation.json` |
| 8 | Batas etik perekaman yang sudah ditetapkan sendiri | **Siap** | [`etika_perekaman.md`](etika_perekaman.md) |
| 9 | Protokol wawancara praktisi, sudah dijalankan sekali | **Siap** | [`wawancara_praktisi.md`](wawancara_praktisi.md) |
| 10 | Daftar klaim yang diverifikasi skrip terhadap berkas bukti | **Siap** | [`daftar_klaim.md`](daftar_klaim.md) |
| 11 | Permintaan akses stimulus GeoPref penuh ke UCSD | Draf **belum dikirim** | [`provenance/permintaan_stimulus_ucsd.md`](provenance/permintaan_stimulus_ucsd.md) |
| 12 | Naskah pengajuan kaji etik | **Belum ada** | — |
| 13 | Lembar penjelasan dan persetujuan orang tua | **Belum ada** | — |
| 14 | Perjanjian pengelolaan data dan rencana linkage yang menjaga identitas | **Belum ada** | — |

Sepuluh dari empat belas siap. Butir 11 hanya menunggu dikirim. Butir 12–14 menuntut
mitra yang menjadi penanggung jawabnya — bukan sesuatu yang dapat dikarang sendiri
lebih dulu, karena format dan komite yang menerimanya yang menentukan bentuknya.

---

## Yang dibawa mitra

Ini bukan daftar keinginan. Ini yang secara struktural tidak bisa disediakan tim ini.

| Kebutuhan | Kenapa hanya mitra yang bisa |
|---|---|
| Penanggung jawab kaji etik | Komite etik menerima pengajuan dari institusi, bukan dari tim lomba |
| Persetujuan orang tua yang sah | Keputusan proxy untuk anak menuntut struktur yang mengawasinya |
| Acuan klinis yang dinilai buta terhadap keluaran aplikasi | Butuh klinisi yang tidak melihat hasil alat sebelum menilai |
| Rekrutmen yang layak | Butuh akses ke populasi sasaran lewat jalur layanan |
| Jalur tindak lanjut | Hasil tanpa layanan sesudahnya bukan skrining, itu kecemasan |

---

## Tiga permintaan konkret

Diurutkan menurut nilai, dan seluruhnya dapat dimulai tanpa menunggu yang lain.

**1. Satu Puskesmas atau rumah sakit pendidikan.** Untuk menjadi penanggung jawab kaji
etik dan menyediakan acuan klinis. Ini yang membuka Gate C.

**2. Satu koordinator Posyandu, untuk uji keterpakaian kader.** Ini **tidak menunggu
kaji etik** dan tidak melibatkan satu anak pun: kader menjalankan aplikasi pada dirinya
sendiri atau pada orang dewasa yang menyetujui. Yang diukur adalah waktu tugas, titik
kegagalan, kebutuhan pelatihan, dan apakah alurnya masuk akal di meja Posyandu. Ini
pengujian termurah yang tersisa di seluruh proyek dan satu-satunya bukti pengguna yang
mungkin ada sebelum final.

**3. Satu tenaga kesehatan anak untuk wawancara kedua.** Wawancara pertama memberi
konsekuensi dan cerita kasus dari sisi sekolah. Sisi penyedia layanan — berapa lama
antrean sebenarnya, berapa pemeriksa yang ada, apa yang membuat sebuah rujukan berguna
atau justru membebani — belum tergali, dan itu justru sisi yang menopang argumen
kapasitas rujukan.

---

## Yang tidak diminta

- **Bukan dana.** Perangkat lunaknya tidak punya biaya marginal dan tidak ada yang
  perlu dibeli untuk memulai butir 2 dan 3.
- **Bukan izin menyebarkan produk.** Pengumpulan data hanya sah sebagai penelitian
  prospektif berizin etik, bukan sebagai penyebaran produk yang datanya dipanen
  belakangan. Perbedaan itu ditulis di [`dampak_dan_adopsi.md`](dampak_dan_adopsi.md)
  dan berlaku mengikat.
- **Bukan dukungan atau rekomendasi terhadap alatnya.** Belum ada yang menguji
  instrumen ini, dan mitra tidak diminta menyatakan sebaliknya.
