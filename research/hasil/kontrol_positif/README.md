# Kontrol positif — bukti mentah

Belum ada sesi yang direkam. Folder ini disiapkan lebih dulu supaya berkas hasil
punya tempat yang jelas dan tidak berakhir di Downloads.

Protokol, naskah instruksi, kriteria mutu, dan cara membaca hasilnya ada di
[`docs/kontrol_positif.md`](../../../docs/kontrol_positif.md). Jangan menjalankan sesi
tanpa membaca bagian "Kenapa peserta harus dewasa" lebih dulu.

## Isi folder

| Berkas | Siapa yang menulis |
|---|---|
| `sesi/kp-<peserta>-<kondisi>-<percobaan>.json` | Diunduh dari aplikasi, apa adanya |
| `lembar_sesi.csv` | Operator, satu baris per percobaan termasuk yang gagal |
| `ringkasan.json` | Skrip analisis, belum ada |
| `README.md` | Ditulis ulang setelah perekaman selesai |

## Aturan

Berkas di `sesi/` adalah bukti mentah. Jangan membulatkan, memformat ulang, atau
menyunting isinya — kalau ada yang salah, rekam ulang. Presisi penuh itulah yang
membedakan berkas hasil tangkapan dari berkas hasil tulis ulang.

Sesi yang ditahan tetap disimpan dan tetap dihitung. Attrition adalah data.

Berkas ini boleh masuk repositori publik karena tidak memuat video maupun landmark
wajah, dan kolom identitas berisi kode peserta. Memastikan kolom itu berisi kode dan
bukan nama adalah tanggung jawab operator, bukan aplikasi.
