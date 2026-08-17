# Panduan audit kalibrasi

Log audit berisi telemetri teknis dan ID pseudonim; video, foto, dan landmark wajah mentah tidak disimpan.

## Mengambil log

1. Jalankan sesi melalui HTTPS pada perangkat yang diuji.
2. Selesaikan pemeriksaan perangkat, kalibrasi, dan stimulus.
3. Unduh log analisis atau log audit JSON dari layar hasil.
4. Simpan berkas dari satu putaran uji dalam satu folder tanpa mengubah isinya.

Gabungkan log dari root repo:

```powershell
.\.venv\Scripts\python.exe research\analyze_session_logs.py C:\path\ke\folder-log
```

## Petunjuk diagnosis

| Gejala | Kemungkinan penyebab | Tindakan |
|---|---|---|
| `no_face` tinggi | wajah keluar frame, terlalu jauh, atau gelap | perbaiki dudukan, jarak, dan cahaya |
| `blink` tinggi | sampel banyak diambil saat mata tertutup | beri jeda sebelum pengambilan berikutnya |
| `pose` tinggi | kepala bergerak selama target | stabilkan posisi tanpa memaksa peserta |
| dispersion tinggi di sudut | pemetaan tepi tidak stabil | cek margin target dan posisi tablet |
| drift pusat tinggi | posisi berubah selama urutan | ulangi setelah posisi stabil |
| range sumbu terlalu kecil | arah mata tidak tertangkap | audit kamera, orientasi, dan landmark |

Ubah satu faktor per putaran dan simpan hasil gagal. Data kegagalan diperlukan untuk menghitung completion rate secara jujur.
