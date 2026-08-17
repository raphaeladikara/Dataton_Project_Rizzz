# Protokol validasi Gate A–D

## Prinsip umum

Setiap gate menjawab pertanyaan yang berbeda. Kelulusan satu gate tidak boleh dipakai sebagai pengganti gate berikutnya. Sesi yang ditahan tetap dihitung dalam denominator, dan semua hasil harus dapat ditelusuri ke log atau sumber penelitian.

## Gate A — kelayakan teknis

Pertanyaan: apakah webapp dapat memperoleh sinyal kamera dan gaze yang cukup stabil untuk menjalankan sesi? Metrik inti meliputi completion rate, galat kalibrasi, frame valid, dropout, dan penahanan hasil invalid.

Status: **lulus** berdasarkan 100 sesi webapp. Rinciannya ada di `bukti_gate_a_b.md`.

## Gate B — agreement terhadap WebGazer

Pertanyaan: apakah aliran gaze Neurogaze cukup sejalan dengan WebGazer.js sebagai referensi proyek pada sesi browser simultan?

Kontrak kelulusan:

- sedikitnya 30 pasangan;
- valid pair rate sedikitnya 90%;
- galat median ternormalisasi paling tinggi 0.05;
- agreement AOI rata-rata sedikitnya 95%;
- agreement AOI utama sedikitnya 95%.

Status: **lulus**. Seluruh lima kriteria dipenuhi oleh 30 log kanonis. ICC fitur tetap metrik deskriptif.

## Gate C — validasi klinis

Pertanyaan: seberapa baik Neurogaze membantu skrining pada balita 16–30 bulan jika dibandingkan dengan hasil klinis independen yang dinilai tanpa melihat keluaran Neurogaze?

Status: **terbuka**. Analisis retrospektif pada data usia sekolah adalah bukti prinsip dan tidak menggantikan studi prospektif pada populasi sasaran.

## Gate D — implementasi lapangan

Pertanyaan: apakah alur dapat diselesaikan secara aman dan konsisten oleh operator di layanan nyata?

Status: **terbuka**. Pengujian perlu mencatat completion rate, durasi, kebutuhan bantuan, pemahaman laporan, masalah perangkat, dan penerimaan pengguna di lokasi sasaran.
