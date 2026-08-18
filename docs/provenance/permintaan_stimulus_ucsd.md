# Permintaan akses stimulus GeoPref (UCSD)

**Status: draf, belum dikirim.** Perlu persetujuan pembimbing dan alamat surel
resmi sebelum dikirim. Simpan salinan balasannya di berkas ini.

- Tujuan: Teresa H. Wen dan Karen Pierce, UC San Diego Autism Center of Excellence
- Perihal: Permintaan akses stimulus GeoPref untuk penggunaan riset non-komersial
- Dikirim pada: —
- Balasan: —

---

## Draf surat

Yth. Dr. Wen dan Prof. Pierce,

Saya menulis untuk meminta akses ke stimulus GeoPref (paradigma preferential
looking dua panel: adegan sosial di satu sisi, pola geometrik dinamis di sisi
lain) untuk penggunaan riset non-komersial.

Konteksnya: kami membangun NeuroGaze, prototipe perangkat lunak yang mengukur
pola perhatian balita memakai kamera depan tablet Android biasa, untuk konteks
Posyandu di Indonesia — layanan kesehatan masyarakat tingkat desa, di mana
eye-tracker laboratorium tidak terjangkau. Pekerjaan ini disiapkan untuk sebuah
kompetisi datathon dan bersifat penelitian, bukan produk komersial.

Alasan kami meminta stimulus asli, dan bukan membuat sendiri: ambang 69% fiksasi
geometrik yang Anda laporkan (Wen dkk., 2022, *Scientific Reports* 12:4253, n=1.863) hanya
sah untuk stimulus yang menghasilkannya. Saat ini kami menjalankan klip CC BY 4.0
berdurasi 16,75 detik dari Moore dkk. (2018) dan secara sengaja **menahan** ambang
69% karena protokolnya lebih pendek daripada protokol terbit; aplikasi hanya
melaporkan persentase yang terukur dan menyatakan bahwa protokolnya dipersingkat.
Dengan stimulus penuh, kami dapat menerapkan ambang itu sebagaimana ia divalidasi.

Beberapa hal yang mungkin relevan bagi Anda:

- Seluruh pemrosesan berjalan di perangkat. Video mentah dan landmark wajah tidak
  pernah disimpan atau diunggah; yang tersisa hanya deret koordinat tatapan dan
  skalar turunan.
- Stimulus tidak akan didistribusikan ulang. Ia dimuat di perangkat dan tidak
  diunggah ke layanan mana pun.
- Kami akan menyitir Wen dkk. (2022) di antarmuka, paper, dan repositori, dan
  senang menandatangani perjanjian penggunaan data apa pun yang Anda syaratkan.
- Kami dapat membagikan hasil dan kode kepada Anda bila berguna.

Bila akses tidak dimungkinkan, kami akan berterima kasih atas panduan mengenai
spesifikasi stimulus yang minimal harus dipenuhi agar ambang tersebut tetap sah:
durasi, jumlah pasangan panel, dan pertimbangan konten.

Terima kasih atas waktu Anda.

Hormat kami,
Raphael Angelo — tim NeuroGaze

---

## Bila stimulus datang

1. Letakkan berkas di `app/public/stimuli/geopref-complex-social-ucsd.mp4`.
2. Set `available: true` pada entri yang sesuai di `app/src/geopref/stimulusMeta.ts`.
3. Ukur ulang batas panel dari aset dan perbarui `GEOPREF_AOI`; verifikasi dengan
   overlay AOI di atas video sebelum mengambil data.
4. Flag `validatedProtocol` akan mengaktifkan ambang 69% tanpa perubahan lain.
5. Catat izin dan lisensinya di berkas ini beserta tanggal balasan.
