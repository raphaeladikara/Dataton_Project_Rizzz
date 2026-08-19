# Provenance bukti Gate A dan Gate B

Catatan ini menjawab satu pertanyaan yang akan diajukan pembaca teliti dan yang
sebelumnya tidak dijawab di mana pun: **dari mana 130 berkas mentah di
`research/hasil/gate_a/sesi` dan `research/hasil/gate_b/pasangan` berasal, dan
mengapa perangkat lunak yang menghasilkannya tidak ada di repositori ini.**

Ditulis karena rantai buktinya punya satu mata rantai yang tidak bisa diperiksa, dan
menyebutkannya lebih baik daripada menunggu orang lain menemukannya.

---

## Yang bisa diperiksa hari ini

Tiga hal, dan ketiganya bisa dijalankan pembaca:

**1. Ringkasan adalah fungsi jujur dari berkas mentah.**

```bash
python research/gate_evidence_repository.py --rebuild --verify
```

Menghasilkan `gate_a_summary.json` dan `gate_b_summary.json` dari 130 berkas mentah,
lalu memverifikasi SHA-256 setiap berkas terhadap `evidence_manifest.json`. Keluarannya
identik byte-per-byte dengan yang sudah tersimpan. Tidak ada angka ringkasan yang
diketik tangan.

**2. Metrik Gate B dapat diturunkan ulang dari koordinat mentah.**

```bash
python research/recompute_gate_b.py
```

Menghitung ulang jarak antar aliran dari koordinat, bukan dari field yang sudah jadi.
Jaraknya tereproduksi sampai 0,001 piksel. Kesepakatan AOI tidak, pada 4 dari 27
pasangan, dan selisihnya (99,7574% → 99,7118%) diterbitkan di `gate_b_summary.json`
alih-alih didamaikan.

**3. Penyebut setiap angka mutu dinyatakan.**

`gate_a_summary.json` kini membawa blok `qualityDenominator`. `meanValidFrameRate`
0,964 dan `meanGazeDropout` 0,036 dihitung atas **94 sesi yang lulus**, bukan 100.
Atas seluruh 100 sesi angkanya 0,9429 dan 0,0537. Enam sesi gagal memuat laju wajah
terburuk di set ini, jadi penyebut sesi-lulus lebih menguntungkan; keduanya diterbitkan
supaya yang menguntungkan tidak bisa dikutip sendirian.

## Yang tidak bisa diperiksa

**Harness perekamnya tidak ada di repositori ini, dan tidak pernah ada.**

Bukan dihapus — `git log --all --diff-filter=D` tidak menemukan satu pun berkas `.py`
atau `.ts` yang pernah dihapus sepanjang riwayat. Seluruh 130 berkas masuk sekaligus
pada commit awal yang di-squash (`613538d`). Alat perekamnya hidup di luar repositori
ini selama pengambilan data dan hilang sebelum repositori dibentuk.

Konsekuensinya harus dinyatakan lugas: **tidak ada satu pun cara, dari dalam
repositori ini, untuk membuktikan bahwa berkas-berkas itu berasal dari kamera dan
bukan dari sebuah generator.** Yang bisa dibuktikan hanyalah bahwa isinya konsisten
secara internal dan bahwa seluruh angka turunan berasal dari isinya.

### Jejak pembulatan, dan penjelasannya

Pemeriksaan yang akan dilakukan pembaca skeptis, beserta hasilnya:

| Pemeriksaan | Temuan |
|---|---|
| Panjang desimal `faceRate` Gate A | 4 desimal pada 92 dari 100 berkas |
| Panjang desimal `gridMedianErrorDeg` | 3 desimal pada 84 dari 94 berkas |
| Panjang desimal koordinat mentah WebGazer | 3 desimal pada 20.808 dari 23.133 sampel |
| `longestNullBurstMs` == `callbackIntervalP50Ms` | 8 dari 30 pasangan |

Jalur ekspor yang dikirim hari ini (`downloadAuditLog` di
`app/src/audit/sessionLog.ts`) menulis float mentah — `faceRate` adalah
`detections / attempts`, rasio dua bilangan bulat, dan `JSON.stringify` menuliskannya
dengan presisi penuh. `toFixed` hanya dipakai untuk string tampilan.

Artinya berkas-berkas ini **tidak ditulis oleh jalur ekspor yang dikirim sekarang.**
Penjelasan yang diberikan pemilik data: harness perekam yang hilang itu membulatkan
saat menulis, praktik yang lazim untuk log JSON. Penjelasan itu konsisten dengan
seluruh pengamatan di atas dan tidak dapat diverifikasi lagi karena kodenya tidak ada.

Kesamaan `longestNullBurstMs` dan `callbackIntervalP50Ms` pada 8 pasangan belum punya
penjelasan. Nilainya tetap diterbitkan apa adanya.

---

## Dokumentasi foto

Sesi Gate A dan Gate B benar-benar dijalankan, dan ada dokumentasi fotonya: peserta
mencoba aplikasi di tablet, dan rig perbandingan Gate B dengan kedua aliran berjalan
bersamaan. Foto-foto itu dipakai di deck presentasi.

Yang dijawab foto dan yang tidak, dinyatakan terpisah supaya tidak tertukar:

- **Dijawab:** apakah sesinya terjadi, siapa pesertanya, dan di perangkat apa. Itu
  pertanyaan pertama yang muncul dan sekarang punya jawaban.
- **Tidak dijawab:** apakah berkas JSON di repositori ini adalah keluaran sesi-sesi itu.
  Sidik jari pembulatan di tabel sebelumnya tetap berlaku, dan foto tidak berbicara
  tentang berkas.

Karena itu foto bukan pengganti catatan ini, melainkan tambahan padanya. Menjawab
pertanyaan tentang provenance berkas dengan foto peserta adalah menjawab pertanyaan
yang berbeda, dan itu akan terbaca seperti mengelak.

**Foto peserta adalah data pribadi.** Izin tertulis dari tiap orang yang wajahnya
tampak, dan slide yang memuatnya menyebutkan bahwa foto dipakai dengan izin. Proyek
yang seluruh premisnya adalah consent tidak boleh longgar pada consent-nya sendiri.

### Yang menutup celahnya, dan biayanya kecil

Rekam ulang 5–8 sesi Gate A lewat aplikasi yang dikirim sekarang (`purpose:
gate_a_adult`), ekspor apa adanya, commit bersama pembaruan manifest. Berkas baru itu
presisi penuh dan jalur ekspornya sama dengan yang dilihat pembaca di layar. Set lama
tetap dipakai untuk angka terbit; set kecil yang baru membuktikan bahwa alat ini memang
menghasilkan berkas seperti itu. Sesudah dikerjakan, tambahkan barisnya ke tabel di
bawah dan sebutkan tanggalnya.

---

## Bagaimana klaim Gate A/B harus dibaca

| Klaim | Status |
|---|---|
| Sesinya dijalankan pada peserta sungguhan | **Terdokumentasi** — foto, dipakai dengan izin |
| Ringkasan diturunkan dari berkas mentah | **Dapat diperiksa** — jalankan generatornya |
| Integritas berkas mentah sejak masuk repo | **Dapat diperiksa** — manifest SHA-256 |
| Metrik Gate B diturunkan dari koordinat, bukan field jadi | **Dapat diperiksa** — `recompute_gate_b.py` |
| Berkas mentah adalah keluaran sesi-sesi itu | **Tidak dapat diperiksa dari repositori ini** |

Baris terakhir adalah alasan catatan ini ada. Gate A dan Gate B tetap dilaporkan
sebagai lulus terhadap kriteria yang dinyatakan, dan pembacanya berhak tahu bahwa satu
mata rantai bersandar pada pernyataan pemilik data, bukan pada artefak.

Konsekuensi untuk presentasi, dan alasannya ada di
[`../arah_pitch.md`](../arah_pitch.md): Gate A dan Gate B disebut sebagai pemeriksaan
instrumen dalam satu kalimat, bukan sebagai bukti utama. Memimpin dengan keduanya
berarti memimpin dengan satu-satunya bagian bukti yang bisa dipertanyakan, sementara
kontrol positif berdiri di atas rantai yang lengkap.

---

## Aturan untuk perekaman berikutnya

Supaya masalah ini tidak berulang, setiap sesi bukti mulai sekarang direkam lewat
aplikasi yang dikirim, bukan lewat alat terpisah.

1. **Rekam lewat aplikasi.** `npm run dev`, jalur "Mulai observasi kamera", pilih
   `purpose` yang sesuai (`gate_a_adult`, `gate_b_bridge`, atau kontrol positif).
   Jangan pakai jalur Demo cepat: ia tidak menghasilkan jejak frame.
2. **Ekspor apa adanya.** Tombol unduh di panel teknis laporan menulis log lengkap
   presisi penuh. **Jangan membulatkan, memformat ulang, atau menyunting berkasnya.**
   Presisi penuh itulah yang membedakan berkas hasil tangkapan dari berkas hasil
   tulis ulang.
3. **Commit berkas mentahnya tanpa perubahan**, lalu jalankan
   `python research/gate_evidence_repository.py --rebuild --verify` dalam perubahan
   yang sama, sehingga ringkasan dan manifest bergerak bersama berkas mentahnya.
4. **Jangan menyunting berkas di `research/hasil/gate_a/sesi` atau
   `research/hasil/gate_b/pasangan`.** Keduanya bukti imutabel; kalau ada yang salah,
   rekam ulang.
5. **Kalau sebuah alat harus hidup di luar aplikasi** — misalnya jembatan WebGazer
   untuk Gate B — alat itu masuk ke `research/` di commit yang sama dengan data yang
   dihasilkannya. Data tanpa alatnya tidak diterima sebagai bukti baru.

Kontrol positif di [`../kontrol_positif.md`](../kontrol_positif.md) adalah kumpulan
bukti pertama yang mengikuti aturan ini sepenuhnya, dan karena itu ia menjadi bukti
pertama di proyek ini yang provenance-nya lengkap dari kamera sampai angka.
