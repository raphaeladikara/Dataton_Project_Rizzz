# Mengeluarkan dataset wajah dari riwayat Git

**Status: belum dikerjakan. Butuh keputusan pemilik repositori** karena langkahnya
menulis ulang riwayat dan memaksa push ke remote.

---

## Masalahnya

```bash
git ls-files data/ | wc -l
# 3487
```

Tiga ribu empat ratus delapan puluh tujuh foto wajah anak, berlabel `Autistic` dan
`Non_Autistic`, terlacak di Git. Remote-nya publik.

Audit proyek ini sendiri (`research/hasil/audit_wajah.json`) menyatakan enam dari enam
metadata tata kelola tidak tersedia:

| Metadata | Status |
|---|---|
| Provenance sumber gambar | tidak ada |
| Lisensi eksplisit | tidak ada |
| Dokumentasi consent subjek | tidak ada |
| Metadata demografi | tidak ada |
| Definisi label klinis | tidak ada |
| ID partisipan | tidak ada |

Itu alasan modelnya dikarantina, `model_export_blocked` bernilai benar, dan bobotnya
tidak ada di repositori. Menerbitkan gambarnya membatalkan seluruh alasan itu.

Penalarannya sudah ada di repo ini. `.gitignore` mengecualikan `referensi/` dengan
komentar yang menjelaskan bahwa repo wajib dipublikkan dan folder itu memuat materi
atas nama orang yang bisa diidentifikasi. Logika yang sama berlaku untuk `data/`,
dengan taruhan yang lebih besar: subjeknya anak-anak, dan labelnya status disabilitas.

## Yang sudah dikerjakan

`data/` sudah masuk `.gitignore` beserta alasannya. Itu mencegah penambahan baru,
tetapi **tidak mengeluarkan apa pun dari riwayat.** Berkasnya masih ada di setiap
commit yang pernah memuatnya, dan masih bisa diambil siapa pun yang mengkloning.

## Yang perlu dikerjakan

### 1. Keluarkan dari indeks

```bash
git rm -r --cached data/
git commit -m "Stop tracking the face dataset; its governance audit forbids publishing it"
```

Berkasnya tetap di disk. Notebook audit membaca path lokal, jadi
`notebook/audit_dataset_wajah.ipynb` dan `research/run_face_audit.py` tetap jalan.

### 2. Tulis ulang riwayat

Langkah 1 saja tidak cukup: commit lama masih memuat gambarnya.

```bash
pip install git-filter-repo
git filter-repo --path data/ --invert-paths --force
```

`git filter-repo` menghapus remote sebagai pengaman. Pasang lagi:

```bash
git remote add origin https://github.com/raphaeladikara/Dataton_Project_Rizzz
```

### 3. Paksa push

```bash
git push --force --all origin
git push --force --tags origin
```

**Ini yang butuh keputusan.** Force push menulis ulang riwayat publik. Kalau ada orang
lain yang sudah mengkloning, klon mereka rusak dan harus diklon ulang. Untuk repo satu
orang, risikonya kecil; tetap sebutkan sebelum menjalankannya.

### 4. Periksa

```bash
git ls-files data/ | wc -l          # harus 0
git log --all --oneline -- data/    # harus kosong
git count-objects -vH               # ukuran repo turun signifikan
```

### 5. Bersihkan jejak di GitHub

Force push tidak selalu menghapus objek yang sudah di-cache GitHub, terutama kalau
pernah ada fork atau PR. Setelah langkah 3, buka Settings repositori dan minta
GitHub Support membersihkan cache-nya kalau isinya benar-benar harus hilang. Untuk
tingkat sensitivitas di sini, langkah 1–4 sudah proporsional.

---

## Yang tetap boleh dipublikasikan

Seluruh hasil auditnya, dan memang harus:

- `research/hasil/audit_wajah.json` — inventaris, provenance kosong, uji shortcut,
  keputusan karantina
- `research/hasil/audit_wajah/` — baseline shortcut properti berkas
- `research/hasil/audit_wajah_inventory.csv` — inventaris tanpa gambar
- `notebook/audit_dataset_wajah.ipynb` — notebooknya, selama keluaran selnya tidak
  memuat gambar wajah yang dirender

### Sudah diperiksa, dan memang ada — sudah dibersihkan

Notebook Jupyter menyimpan keluaran sel sebagai PNG base64 di dalam berkas `.ipynb`.
`notebook/audit_dataset_wajah.ipynb` berukuran 5 MB dan memuat delapan gambar
tertanam. Enam di antaranya grafik. Dua tidak:

| Sel | Isi | Ukuran |
|---:|---|---:|
| 10 | `Sampel gambar per kelas` — grid 2×5 wajah anak, tiap panel berjudul kelasnya | 1,4 MB |
| 35 | `Sampel salah klasifikasi` — 12 wajah anak, tiap panel berjudul label benar, label prediksi, dan `p(ASD)` | 1,8 MB |

Sel 35 lebih berat daripada dataset mentahnya: setiap wajah di situ dicetak
berdampingan dengan probabilitas autisme yang diberikan sebuah model.

Keduanya sudah dihapus dari keluaran notebook. Yang dipertahankan: seluruh grafik
(distribusi kelas, kurva pelatihan, confusion matrix) dan seluruh keluaran teks,
termasuk baris `Salah klasifikasi: 66/419 (15.8%)` yang merupakan hasil audit
sebenarnya. Berkasnya turun dari 5,0 MB ke 0,77 MB.

Kalau notebook dijalankan ulang, **jangan jalankan sel 10 dan 35** — atau bersihkan
keluarannya lagi sebelum commit. Pemeriksaan cepat:

```bash
python -c "import json,io; nb=json.load(io.open('notebook/audit_dataset_wajah.ipynb',encoding='utf8')); print(sum('image/png' in o.get('data',{}) for c in nb['cells'] for o in c.get('outputs',[])))"
# 6 = hanya grafik. Lebih dari itu, periksa sel mana.
```

---

## Kenapa ini didahulukan

Bukan karena risiko hukumnya besar — datasetnya beredar luas di Kaggle dan bukan
repositori ini yang pertama menerbitkannya.

Karena **argumen terkuat proyek ini adalah bahwa ia menolak angka terbaiknya sendiri
atas dasar tata kelola.** Argumen itu tidak bertahan satu menit di hadapan orang yang
menjalankan `git ls-files` dan menemukan gambarnya masih di sana. Yang hilang bukan
poin kepatuhan, melainkan kredibilitas seluruh bagian tentang AI yang bertanggung
jawab — bagian yang seharusnya jadi nilai tertinggi proyek ini.
