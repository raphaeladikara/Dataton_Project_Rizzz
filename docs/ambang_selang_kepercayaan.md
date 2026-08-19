# Ambang dibandingkan terhadap selang, bukan terhadap satu angka

Sampai 20 Agustus 2026, aturan rujukan membandingkan satu angka dengan satu ambang:
`percentGeometric >= 0.69`. Catatan ini menjelaskan kenapa itu salah, apa yang
menggantikannya, dan berapa besar bedanya secara kuantitatif.

Ringkasnya: sesi yang mengukur 71% dan sesi yang mengukur 67% tidak dapat dibedakan
pada klip 16,75 detik, tetapi aturan lama memberi keduanya putusan yang berlawanan.

---

## Masalahnya

Dua sinyal keputusan diperlakukan dengan standar bukti yang berbeda, dan yang lebih
longgar justru diberikan kepada sinyal yang paling menentukan.

**Mengikuti isyarat** sudah memakai uji tanda. Hasil yang arahnya benar tetapi tidak
mencapai p < 0,05 berstatus `tidak_dapat_dinilai`, bukan `menyimpang`, karena delapan
percobaan tidak dapat membuktikan apa pun di bawah tujuh keberhasilan. Alasannya
ditulis di kode: membaca ketiadaan bukti sebagai bukti ketiadaan.

**Preferensi geometrik** — satu-satunya sinyal yang membawa ambang terbit — dilaporkan
sebagai titik estimasi telanjang dan dibandingkan langsung dengan 0,69. Tidak ada
ketidakpastian sama sekali.

Klip 16,75 detik pada ~26 fps menghasilkan sekitar 300 sampel di dalam AOI. Kesalahan
pencuplikan pada angka sebesar itu berjalan belasan poin persentase. Aturan lama
memperlakukan 0,71 dan 0,94 sebagai putusan yang sama.

---

## Yang menggantikannya

Ambang dibandingkan terhadap **selang kepercayaan 95%**, bukan terhadap titik
estimasinya:

| Kondisi | Status sinyal |
|---|---|
| Seluruh selang di atas 0,69 | `menyimpang` |
| Seluruh selang di bawah 0,69 | `normal` |
| Selang melintasi 0,69 | `tidak_dapat_dinilai` |
| Selang tidak dapat diestimasi | `tidak_dapat_dinilai` |

Baris ketiga adalah intinya, dan ia memakai logika yang sudah dipakai sinyal isyarat:
pengukuran yang tidak dapat menempatkan dirinya di satu sisi ambang belum mengukur
apa pun tentang ambang itu.

Keadaan ini punya keluaran tersendiri, `MEASURED_INTERVAL_STRADDLES_THRESHOLD`, yang
berbeda dari `WITHHELD_INSUFFICIENT_LOOKING`: sesinya **mengukur** sesuatu dan
melaporkan persentasenya; yang ditolak hanya perbandingannya terhadap 69%.

### Kenapa bootstrap jendela waktu

Tiga penaksir dicoba, dan dua gagal:

**Bootstrap per sampel** melaporkan selang beberapa kali lebih sempit daripada yang
benar. Sampel pandangan di dalam satu fiksasi bukan pengamatan independen.

**Bootstrap blok dwell** — meresample runtun kontigu di AOI yang sama — gagal justru
pada kasus yang paling penting. Peserta yang menahan satu panel sepanjang klip
menghasilkan dua runtun, dan meresample dua runtun menghasilkan selang [0, 1]. Diuji
pada rekaman kontrol positif: sesi produksi punya 2 blok dan selangnya tidak informatif.

**Bootstrap jendela tetap 1 detik** dipakai. Jumlah bloknya terikat pada durasi klip,
bukan pada perilaku peserta, sehingga peserta yang tidak pernah berpaling tetap
mendapat selang yang sempit di 1,0. Ia juga punya sifat yang dibutuhkan ambang yang
sedang ditahan: **selangnya menyempit ketika protokolnya memanjang.** Klip 16,75 detik
memberi 17 blok; stimulus terbit 60–90 detik memberi 60–90.

Lebar jendela satu detik dipilih di atas durasi fiksasi yang dihasilkan baterai ini.
Resamplingnya deterministik (seed 20260819), jadi satu rekaman melaporkan selang yang
sama pada setiap pemutaran ulang.

---

## Berapa besar bedanya

Simulasi 400 sesi per titik, 17 jendela, variasi antar jendela disetel menyerupai
rekaman kontrol positif. Kolom kanan adalah aturan lama.

| Preferensi sebenarnya | P(aturan selang menyala) | P(aturan titik menyala) |
|---:|---:|---:|
| 0,60 | **0,0%** | 6,5% |
| 0,69 | **4,8%** | 52,2% |
| 0,75 | 24,2% | 89,5% |
| 0,80 | 59,5% | 98,8% |
| 0,85 | 88,2% | 100% |
| 0,90 | **99,0%** | 100% |
| 0,95 | 100% | 100% |

Baris 0,69 adalah alasan perubahan ini ada. Seseorang yang preferensi sebenarnya
persis di ambang memicu aturan lama separuh waktu — itu lemparan koin yang disajikan
sebagai pengukuran. Aturan baru memicunya 4,8% dari waktu, yang memang seharusnya:
sesi seperti itu tidak membawa bukti ke arah mana pun.

Yang tidak berubah: preferensi yang benar-benar tinggi tetap terbaca. Pada 0,90 aturan
baru menyala 99% dari waktu.

Angkanya dapat direproduksi dengan `research/simulate_geopref_interval.py`.

### Terhadap dua rekaman yang dikirim

| Rekaman | Terukur | 95% CI | Status |
|---|---:|---|---|
| `sesi-biasa.json` | 19% | 5–36% | `normal` |
| `sesi-produksi.json` | 94% | 81–100% | `menyimpang` |

Keduanya diselesaikan dengan margin lebar. Selang tidak mempersempit kemampuan
instrumen membedakan kedua kondisi; ia menghapus wilayah abu-abu di antaranya.

---

## Konsekuensi untuk aturan komposit

Rujukan menuntut **dua** sinyal menyimpang, dan sinyal kedua sudah konservatif.
`DOES_NOT_FOLLOW` menuntut salah satu dari:

- lift median di bawah nol **dan** target diikuti pada kurang dari separuh percobaan; atau
- masuk target pada paling banyak 1 dari 8 percobaan **dan** menatap model saat isyarat
  pada minimal 5 dari 8 percobaan.

Peserta yang mengikuti 5 atau 6 dari 8 isyarat berstatus `NOT_DISTINGUISHABLE`, yaitu
tidak dapat dinilai — bukan menyimpang. Pada sembilan sesi menonton biasa di kontrol
positif, tidak ada satu pun yang mencapai `DOES_NOT_FOLLOW`.

Jadi positif palsu menuntut dua kejadian yang tidak mungkin sekaligus: selang
preferensi geometrik yang seluruhnya di atas 0,69, **dan** kegagalan mengikuti isyarat
yang terukur sementara peserta terbukti menatap model. Peserta yang sekadar menonton
tidak menghasilkan satu pun dari keduanya.

---

## Apa yang tetap tidak berubah

Selang kepercayaan memperbaiki cara ambang dibandingkan. Ia **tidak** memperbaiki
hal-hal berikut, dan tidak boleh disajikan seolah begitu:

- Ambang 69% tetap ditahan di lapangan selama klip yang dilisensikan lebih pendek
  daripada protokol terbitnya. Selangnya tidak melisensikan ambang itu.
- Angka 2 di `REFERRAL_DEVIANT_THRESHOLD` tetap satu-satunya angka karangan di sistem
  ini. Penggantinya dirancang di [`model_rujukan.md`](model_rujukan.md) dan belum
  dipasang.
- Sensitivitas dan spesifisitas tetap tidak ada. Yang bertambah adalah kehati-hatian
  aturannya, bukan bukti tentang performanya pada balita.
