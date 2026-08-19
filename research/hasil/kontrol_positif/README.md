# Kontrol positif — hasil

Direkam 19 Agustus 2026. **Instrumen ini merespons.** Ketika pola yang dicarinya
benar-benar diproduksi, kedua sinyal keputusan bergerak ke arah yang benar, dan
tidak ada satu pun sesi menonton-biasa yang bertumpang tindih dengan sesi
pola-diproduksi pada sinyal mana pun.

Itu kalimat yang sebelum ini tidak bisa diucapkan sama sekali. Yang tetap tidak
bisa diucapkan, dan tidak akan bisa dari data ini: apa pun tentang autisme.
Pesertanya orang dewasa yang memperagakan pola sesuai naskah. Tidak ada
sensitivitas, tidak ada spesifisitas, tidak ada akurasi di sini.

Protokol, naskah instruksi, dan alasan pesertanya harus dewasa:
[`docs/kontrol_positif.md`](../../../docs/kontrol_positif.md).

## Yang direkam

| | |
|---|---:|
| Peserta | 12 |
| Perangkat | 3, empat peserta per perangkat |
| Berkas diterima | 24 |
| Rekaman berbeda | 23 |
| Lolos kriteria mutu | 15 |

Satu berkas adalah rekaman yang sama diunduh dua kali, dan itu tercatat di
[`manifes_sesi.json`](manifes_sesi.json) alih-alih dihapus diam-diam.

**Attrition 35%, dan itu dilaporkan apa adanya.** Sembilan dari 11 sesi biasa dan
enam dari 12 sesi produksi lolos. Yang menahannya hampir seluruhnya satu sebab:
kalibrasi memetakan sebagian besar sesi ke luar tepi layar. Steffan dkk. 2024
melaporkan attrition webcam balita 42%; angka di sini bukan kelainan, dan kalau
sesi yang gagal dibuang, angkanya akan bohong.

## Yang diukur

Dihitung ulang dari jejak pandangan oleh
[`research/analyze_positive_control.py`](../../analyze_positive_control.py), bukan
disalin dari blok `assessment` yang ditulis aplikasi saat perekaman — rekaman ini
mendahului sembilan perbaikan, dan dua di antaranya mengubah apa yang akan
dihitung aplikasi dari jejak yang persis sama.

| Sinyal | Menonton biasa | Pola diproduksi | AUC | Jarak terdekat | p |
|---|---|---|---:|---:|---:|
| Preferensi geometrik | 0,34 (0,08–0,73) | 0,94 (0,89–1,00) | 1,00 | +0,16 | 5,8×10⁻⁴ |
| Percobaan masuk target | 8 dari 8 (5–8) | 0 dari 8 (0–1) | 1,00 | 4 percobaan | 6,3×10⁻⁴ |
| Sebaran tatapan di fase isyarat | 0,31 (0,07–0,40) | 0,05 (0,03–0,06) | 1,00 | +0,008 | 2,0×10⁻⁴ |

Angka di kolom kondisi adalah median dengan rentang. **Kolom "jarak terdekat"
yang penting**, bukan AUC-nya: AUC 1,00 hanya berarti tidak ada pasangan yang
tertukar urutannya, sementara jarak terdekat menyebut selebar apa celahnya dalam
satuan sinyal itu sendiri. Sesi biasa dengan preferensi geometrik tertinggi ada
di 0,73; sesi produksi terendah di 0,89.

## Aturan komposit

Dokumen protokol meminta satu tabel, dan tabel itu harus dibuat apa pun isinya.
Ada dua, karena aturan yang dikirim dan aturan yang diuji bukan hal yang sama.

**Sebagaimana dikirim** — tidak menyala pada kondisi mana pun, dan tidak akan
pernah bisa. Aturannya menuntut dua sinyal menyimpang; preferensi geometrik
berstatus `tidak_dapat_dinilai` selama klip yang dilisensikan lebih pendek
daripada protokol terbit tempat ambang 69% diturunkan. Paling banyak satu sinyal
tersedia. Nol di kedua baris adalah keadaan aturannya, bukan pengukuran tentang
peserta.

**Mode demonstrasi** — ambang yang sama diterapkan pada klip pendek itu, semata
supaya pertanyaan "apakah aturannya merespons" punya jawaban:

| | Menyala | Tidak menyala |
|---|---:|---:|
| Menonton biasa | **0** | 9 |
| Pola diproduksi | **4** | 2 |

Baris atas kolom kiri adalah yang penting, dan ia nol: aturannya tidak menyala
pada orang yang sekadar menonton. Satu sesi biasa memang menunjukkan preferensi
geometrik 0,73 di atas ambang — dan tepat karena sinyal keduanya normal,
aturannya tidak menyala. Itu ambang-dua bekerja sebagaimana dirancang.

Dua sesi produksi yang tidak menyala gagal pada **prasyarat perhatian**, bukan
pada perilakunya: keduanya tidak menunjukkan bukti peserta sedang menatap model
saat isyarat disampaikan, jadi sinyal isyaratnya ditahan sebagai tidak dapat
dinilai. Tidak mengikuti dan tidak pernah melihat adalah dua klaim berbeda, dan
hanya satu yang didukung sesi-sesi itu.

Angka mode demonstrasi bukan rujukan, tidak pernah menjadi rujukan, dan tidak
boleh dikutip sebagai satu.

## Analisis sensitivitas

Regresi logistik pada kedua sinyal, sebagaimana diizinkan protokol di atas
delapan peserta. **Ia bukan jalur keputusan dan tidak boleh menjadi satu** —
bobot yang dipasang pada orang dewasa yang mengikuti naskah mempelajari
naskahnya.

| | |
|---|---:|
| Sesi | 13 |
| Grup validasi silang | 3 (perangkat) |
| AUC luar-lipatan | 1,00 |
| Koefisien terstandar · preferensi geometrik | +1,06 |
| Koefisien terstandar · masuk target | −1,29 |

Grupnya perangkat, bukan orang, karena orangnya tidak ada di berkas — kolom
identitas berisi nilai yang sama di 22 dari 24 berkas. Empat peserta duduk di
tiap perangkat, jadi satu lipatan menahan empat orang sekaligus: lebih kasar
daripada yang diminta protokol, dan lebih ketat.

Kedua koefisien berukuran sebanding dan berlawanan arah, yang menjawab
satu-satunya pertanyaan yang pantas ditanyakan pada fit ini: pemisahannya
ditanggung kedua sinyal, bukan satu sinyal yang menyeret yang lain.

## Confound yang harus ikut disebut

**Panel geometrik berada di kanan pada seluruh 24 sesi, dan urutan isyarat
identik pada seluruhnya.** Kedua skema counterbalancing diturunkan dari kolom
identitas yang seragam itu. Akibatnya preferensi geometrik dan kebiasaan melirik
ke kanan tidak terpisah di data ini — peserta yang cenderung melirik kanan akan
menghasilkan angka yang sama dengan peserta yang benar-benar memilih panel
geometrik. Kodenya sudah diperbaiki dan mencatat penugasannya ke dalam log, tapi
perbaikan itu tidak menyembuhkan rekaman yang sudah ada.

**Identitas peserta tidak terekam,** jadi tidak ada analisis berpasangan; yang
ada perbandingan antar-kondisi dengan perangkat sebagai grup.

**Urutan kondisi tidak diseimbangkan,** dan itu disengaja — instruksi kondisi 2
tidak bisa ditarik kembali. Efek urutan karena itu tidak terpisah dari efek
kondisi.

## Yang dibongkarnya

Kontrol positif menguji instrumennya, dan itu berarti ia juga menemukan cacatnya:
sembilan, tidak satu pun terlihat sebagai galat pada saat perekaman. Enam datang dari
rekamannya — yang terberat, proyeksi kalibrasi yang dijepit ke dalam layar di sumbernya,
membutakan tiga penjaga sekaligus. Tiga lagi baru muncul ketika rekaman nyata pertama
didaftarkan ke jalur demo.

Daftar lengkap beserta alasan tiap perbaikannya:
[`docs/kontrol_positif.md`](../../../docs/kontrol_positif.md#yang-ditemukan-perekaman-pertama).

Konsekuensinya untuk angka di atas: rekaman ini dibuat oleh versi sebelum perbaikan itu.
Karena itu kedua sinyal dihitung ulang dari jejak pandangannya oleh skrip analisis, bukan
disalin dari blok `assessment` yang ditulis aplikasi saat merekam.

## Isi folder

| Berkas | Siapa yang menulis |
|---|---|
| `sesi/kp-<perangkat>-<kondisi>-<n>.json` | Diunduh dari aplikasi, apa adanya |
| `manifes_sesi.json` | `research/file_positive_control.py` |
| `lembar_sesi.csv` | `research/analyze_positive_control.py` |
| `ringkasan.json` | `research/analyze_positive_control.py` |
| `README.md` | Ditulis tangan setelah membaca ketiganya |

Nama berkas menandai **perangkat dan kondisi, bukan orang**. Kodenya tampak
teratur; itu bukan kode peserta, dan tidak ada kode peserta yang bisa dipulihkan.

Berkas di `sesi/` adalah bukti mentah — jangan dibulatkan, diformat ulang, atau
disunting. Ia boleh masuk repositori publik karena tidak memuat video maupun
landmark wajah.

## Menjalankan ulang

```bash
.venv/Scripts/python.exe research/file_positive_control.py
```

```bash
.venv/Scripts/python.exe research/analyze_positive_control.py
```
