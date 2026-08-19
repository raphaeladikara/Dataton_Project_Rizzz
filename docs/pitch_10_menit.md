# Sesi demo 10 menit

Naskah untuk slot demo. Naskah pitch terpisah ada di
[`pitch_7_menit.md`](pitch_7_menit.md); yang ini fokus pada apa yang dijalankan di
layar dan urutannya.

Aturan yang berlaku: **tidak ada angka tanpa sumber, dan tidak ada klaim yang tidak
bisa ditunjukkan di layar dalam sepuluh detik.**

**Prasyarat.** Rekaman kontrol positif sudah didaftarkan
(`npm run replay:check` melaporkan seluruh rekaman terbaca). Tanpa itu, jalur demo
memakai titik sintetis dan laporannya ditahan — bukan karena kesalahan, tetapi karena
scanpath sintetis benar-benar di luar distribusi dan penjaga menolaknya. Protokol
perekamannya ada di [`kontrol_positif.md`](kontrol_positif.md).

---

## Peta waktu

| Menit | Bagian | Di layar |
|---:|---|---|
| 0:00–1:00 | Masalah: diagnosis rata-rata 56 bulan, 32 bulan sesudah kecurigaan pertama orang tua | 1 slide, 2 angka |
| 1:00–1:45 | Kenapa alat yang ada gagal di Posyandu: ceklis vs EarliPoint $599 | 1 slide, 3 kolom |
| 1:45–3:15 | **Sesi langsung, kondisi menonton biasa** | Aplikasi |
| 3:15–5:15 | **Sesi langsung, kondisi pola diproduksi** | Aplikasi |
| 5:15–6:00 | Bingkai kontrol positif dan batasnya | Aplikasi |
| 6:00–7:00 | Kenapa punya batas: sensitivitas 17%, tabel empat lengan | `gate_c_simulation.json` |
| 7:00–7:45 | Bukti instrumen: Gate A 2,36° vs WebGazer 4,17° | `/validation` |
| 7:45–9:15 | **Momen integritas** | Panel riset + `/validation` |
| 9:15–10:00 | Gate C dan D, target dari literatur | — |

---

## 1:45 — Sesi langsung, menonton biasa

Jalankan sesi. Diam; biarkan 80 detik berjalan tanpa narasi berlebih. Satu kalimat di
awal saja:

> Ini pipeline yang sama persis dengan sesi di Posyandu. Delapan puluh detik. Yang
> pertama muncul adalah blok pilihan tontonan, karena blok itu membawa satu-satunya
> ambang terbit yang kami pakai, dan ia tidak boleh diukur pada anak yang sudah lelah.

Setelah laporan muncul, tunjuk tiga hal berurutan:

1. Persentase fiksasi geometrik dengan ambangnya.
2. Tiga sinyal aturan komposit, masing-masing dengan nilai terukur, status, dan
   sumber literaturnya.
3. Kalimat hasil.

> Perhatikan yang tidak ada: tidak ada skor gabungan, tidak ada gauge, tidak ada
> persentase risiko autisme. Keenam ukuran itu tidak boleh dijumlahkan sebelum ada
> balita berlabel untuk memfit bobotnya, jadi tipe datanya sendiri melarang —
> `combinedScore` bernilai null dan tidak ada jalur kode yang bisa mengisinya.

Kalau ada satu sinyal berstatus **tidak dapat dinilai**, tunjuk itu dan jelaskan:

> Sinyal ini arahnya benar tapi belum terbukti di atas kebetulan, jadi ia tidak
> dihitung ke arah mana pun. Delapan percobaan tidak bisa mencapai p di bawah 0,05
> di bawah tujuh keberhasilan — jadi anak yang mengikuti enam dari delapan isyarat
> gagal signifikan sambil sudah mengikuti sebagian besarnya. Menghitung itu sebagai
> penyimpangan berarti membaca ketiadaan bukti sebagai bukti ketiadaan, dan aturan
> ini dulu memang begitu sampai kami cabut.

---

## 3:15 — Sesi langsung, pola diproduksi

**Sebutkan protokolnya sebelum mulai.** Ini yang membedakan prosedur dari improvisasi.

> Sekarang saya akan memproduksi pola perhatian yang literatur identifikasi sebagai
> penanda dini. Empat butir, dan tiap butir memetakan ke tepat satu sinyal:
> pandangan diarahkan ke panel geometrik; tidak mengikuti arah mata atau tunjukan
> model; tidak menoleh saat nama dipanggil; laju kedip dipertahankan sama antara
> adegan sosial dan blok pilihan tontonan.

Jangan pernah mengatakan "berpura-pura autis" atau variasi apa pun darinya. Yang
diperagakan adalah pola terukur, bukan seseorang. Ini bukan soal kehalusan bahasa:
mengkarikaturkan perilaku autistik di depan panel yang mungkin punya kaitan personal
dengan ASD akan merusak setiap hal lain yang kalian bangun.

Jalankan sesi. Setelah laporan muncul, tunjuk sinyal yang menyimpang dan alasannya.

> Alat ini tidak mengeluarkan skor. Ia mengeluarkan daftar sinyal, apa yang terukur
> pada masing-masing, dan dari mana arah tiap sinyal berasal. Kader bisa membacakan
> ini ke orang tua, dan dokter di Puskesmas bisa memeriksa alasannya.

Bila ada sinyal yang tidak bergerak, sebut apa adanya. Sinyal kedipan adalah yang
paling sulit dikendalikan secara sadar dan paling mungkin gagal.

---

## 5:15 — Bingkai kontrol positif

Bagian ini yang menentukan apakah dua menit sebelumnya terbaca sebagai bukti atau
sebagai teater. Lambatkan.

> Ini kontrol positif: beri instrumen sinyal yang diketahui ada, lalu periksa apakah ia
> merespons. Gate A membuktikan alatnya teliti. Gate B membuktikan pengukurannya
> sejalan dengan metode yang divalidasi ManyBabies untuk balita. Tidak satu pun
> membuktikan bahwa alat ini bisa **membedakan** dua kondisi — dan kalau tidak bisa,
> seluruh premis kami runtuh.
>
> Yang barusan membuktikan instrumennya responsif. Ia tidak membuktikan alat ini
> mendeteksi autisme, dan pesertanya orang dewasa yang memproduksi pola dengan
> sengaja. Sensitivitas dan spesifisitas baru ada di Gate C.

Tunjuk dua hal yang sengaja tidak ikut memutuskan:

> Menghadap layar dan gerak kepala adalah dua indeks dengan AUC preseden tertinggi —
> 0,838 dan 0,864. Keduanya tidak masuk aturan keputusan, karena tidak ada ambang
> terbit yang bisa dipindahkan ke sini. Memasukkannya berarti kami mengarang angkanya.

Lalu batas ambangnya sendiri:

> Satu-satunya angka yang kami karang adalah berapa sinyal harus menyimpang. Kami
> memilih dua, dan tipe datanya sendiri menandai itu sebagai pilihan desain, bukan
> ambang tervalidasi.

---

## 7:45 — Momen integritas

Porsi terbesar setelah demo, dan aset terkuat proyek ini. Tiga cerita pendek.

**Pertama, penjaga yang menolak model kami sendiri.** Buka panel riset di laporan.

> Regresi logistik ini dikirim ke perangkat dan dijalankan setiap sesi. Penjaga
> out-of-distribution memutuskan apakah keluarannya boleh dibaca — dan di sini ia
> menolak, dengan fitur yang disebut namanya dan jarak robust-z-nya. Fitur
> geometrinya mengkodekan tata letak stimulus asalnya, jadi batas keputusannya tidak
> berpindah ke stimulus kami. Yang berpindah ke Gate C adalah representasinya, bukan
> koefisiennya.

**Kedua, kontrol negatif integritas split.**

> Kami menjalankan ulang pipeline CNN dan mengganti satu hal saja: unit pengelompokan
> split. Empat puluh satu dari lima puluh empat anak langsung muncul di sisi latih dan
> sisi uji sekaligus. Kami tidak menyimpulkan arah biasnya — simpangan antar fold
> terlalu besar untuk itu. Yang kami simpulkan lebih mendasar: angka yang dihasilkan
> protokol bocor berhenti menjawab pertanyaan yang ingin dijawab produk.

**Ketiga, dataset yang kami buang.**

> CNN pada dataset wajah statis mencapai AUC 0,932. Itu angka tertinggi di seluruh
> proyek ini, dan tidak kami pakai. Enam dari enam metadata tata kelola tidak tersedia,
> tidak ada ID partisipan sehingga kebocoran identitas tidak bisa disingkirkan, dan uji
> shortcut kami menunjukkan statistik piksel saja sudah mencapai 0,751 dengan
> permutasi p = 0,005. Bobotnya tidak ada di repositori.

**Keempat, batas yang kami pasang sebelum datanya menggoda.** Sebutkan hanya kalau
waktunya cukup; kalau tidak, simpan untuk tanya jawab.

> Tidak ada satu pun balita dan tidak ada satu pun anak autistik yang kami rekam.
> Bukan karena sulit — karena balita tidak bisa memberi persetujuan, dan yang
> menggantikannya adalah keputusan orang lain yang seharusnya diawasi kaji etik. Lima
> lembaga kami hubungi dan semuanya menolak, dan pada tahap bukti kami itu benar. Jadi
> bobot model kami dipasang pada 59 anak berlabel dari data yang peneliti lain sudah
> terbitkan dengan izin yang mereka punya, lisensi terbuka, ID partisipan lengkap.
> Perekaman yang tidak boleh kami ulang sudah dilakukan sekali oleh orang yang berhak,
> dan dibagikan justru supaya tidak perlu diulang.

Satu kalimat penutup bagian ini:

> Tim yang mengoreksi angkanya sendiri lebih layak dipercaya daripada tim yang
> angkanya selalu bagus.

---

## 9:15 — Penutup

> Gate C dan Gate D masih terbuka. Targetnya sudah kami tetapkan dari literatur, bukan
> dari harapan: sensitivitas 88 persen dan spesifisitas 81 persen, angka SenseToKnow di
> Nature Medicine pada kelas perangkat yang sama. Yang kami butuhkan mitra klinis
> berizin etik.

Berhenti di sini.

**Jangan** tutup dengan "lima lembaga menolak kami". Itu benar, layak disebut, dan
tempatnya di sesi tanya jawab — bukan sebagai kalimat terakhir yang juri bawa pulang.

---

## Bila demo gagal di panggung

**Laporan ditahan.** Jangan panik, jangan ulangi. Buka panel riset dan tunjuk gerbang
mana yang menahan beserta alasannya.

> Ini keadaan ditahan, dan ini hasil yang sah. Attrition webcam pada balita yang
> dilaporkan ManyBabies 42 persen. Alat yang tidak pernah menolak mengeluarkan angka
> adalah alat yang mengarang angka. Dan perhatikan alat ini menyebut gerbang mana yang
> menolak, bukan cuma bilang tidak bisa.

**Kamera tidak jalan.** Pakai rekaman terdaftar lewat Demo cepat, dan katakan bahwa
yang tampil adalah rekaman, bukan sesi langsung — label itu memang sudah tercetak di
laporan.

**Ambang GeoPref tidak menyala.** Memang tidak akan, di lapangan. Klip yang tersedia
16,75 detik dan protokol terbitnya 60–90 detik, jadi ambangnya ditahan. Untuk
menunjukkan bentuk laporan rujukan, pakai **Peragakan bentuk laporan rujukan** — tombolnya
ada di bawah tiga kartu demo di bagian "Demo tanpa kamera" pada beranda. Laporannya akan
membawa banner mode demonstrasi dan tetap tidak mengeluarkan rujukan.
