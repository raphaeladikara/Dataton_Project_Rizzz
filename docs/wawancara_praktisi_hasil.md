# Hasil wawancara praktisi — guru SLB, Jambi

Wawancara pertama dan satu-satunya riset primer di proyek ini. Protokolnya ada di
[`wawancara_praktisi.md`](wawancara_praktisi.md); catatan ini memuat jawabannya, apa
yang berubah karenanya, dan apa yang **tidak** boleh disimpulkan darinya.

| | |
|---|---|
| Narasumber | Seorang guru sekolah luar biasa di Jambi |
| Format | 15 pertanyaan, blok A–E sesuai protokol induk |
| Sumber | Transkrip wawancara, disimpan di luar repositori |
| Anak yang didampingi | Sekitar 20 |

> **Nama narasumber sengaja tidak ditulis di sini.** Pertanyaan E3 protokol — boleh
> disebut nama dan institusinya di presentasi — tidak terekam jawabannya di transkrip,
> dan repositori ini wajib dipublikkan setelah deadline semifinal. Aturan proyek sendiri
> berbunyi: atribusi ditanyakan, bukan diasumsikan. Sampai izin itu ada tertulis, seluruh
> permukaan — termasuk dokumen ini — menyebut peran saja.
>
> Kalau izinnya sudah ada, nama dan institusi boleh ditambahkan, dan nilainya jauh lebih
> berat daripada "seorang guru SLB". Yang tidak boleh adalah menambahkannya lebih dulu
> lalu meminta izin belakangan.

---

## Batas yang berlaku pada seluruh isi catatan ini

Ini satu wawancara. Bukan survei, bukan kajian, dan tidak menanggung generalisasi.

- **n = 1.** Satu guru, satu sekolah, satu provinsi.
- **Berbasis ingatan.** Angka-angkanya perkiraan yang diucapkan dalam percakapan, bukan
  hitungan dari catatan sekolah. Beliau sendiri memagarinya: "kira-kira", "mungkin",
  "sepertinya". Pagar itu ikut dikutip; ia tidak dibuang agar kalimatnya terdengar
  lebih kuat.
- **Memvalidasi masalahnya, bukan alatnya.** Beliau tidak melihat, menjalankan, atau
  menilai aplikasi ini. Seorang guru tidak berada dalam posisi menilai ketelitian
  estimasi pandangan dari kamera tablet, dan tidak diminta.
- **Bukan data anak.** Tidak ada nama, rekam medis, atau detail yang mempersempit
  identitas seorang anak yang diminta maupun diberikan.

Kalimat yang dipakai di panggung:

> Beliau memvalidasi masalahnya, bukan alatnya. Instrumen ini masih belum diuji siapa pun.

---

## A · Keterlambatan dan jalur menuju bantuan

**Sebaran usia masuk.** Dari sekitar 20 anak yang didampingi, hanya **3–4 yang mulai
ditangani sebelum usia 3 tahun**. Cukup banyak yang baru masuk layanan saat TK besar
atau bahkan sudah SD.

**Kasus paling terlambat.** Seorang anak baru datang sekitar **usia 7 tahun**, padahal
orang tuanya sudah merasa ada yang berbeda sejak **usia 2–3 tahun**.

> "Keluarga menganggapnya hanya terlambat bicara dan nanti akan mengejar sendiri."

**Siapa yang pertama sadar.** Orang tua atau guru PAUD. Tetapi kesadaran itu tidak
langsung berlanjut jadi pemeriksaan — ada yang memilih menunggu, atau mengira
penyebabnya gadget atau keterlambatan bicara biasa.

**Berapa tempat sebelum arahan jelas.** Guru PAUD → Puskesmas → psikolog → dokter tumbuh
kembang. **Tiga sampai empat tempat** sebelum keluarga merasa mendapat penjelasan yang
jelas.

### Apa artinya untuk pitch

Premis inti proyek ini adalah **yang macet bukan kesadarannya, melainkan jalur
sesudahnya**. Jawaban A3 dan A4 mendukungnya secara langsung, dan dari sumber yang tidak
punya kepentingan pada produk ini.

Angka "32 bulan" di slide masalah selama ini pinjaman dari tinjauan lintas negara. Kasus
ini bukan penggantinya dan tidak boleh dipakai sebagai estimasi Indonesia — ia satu
kasus. Yang ia berikan adalah **bentuk** keterlambatan itu dalam konteks Indonesia:
orang tua sadar di usia 2–3, anak masuk layanan di usia 7.

---

## B · Konsekuensi

**Beda yang mulai dini dan yang terlambat.** Yang mulai lebih dini biasanya lebih cepat
belajar komunikasi dasar, mengikuti instruksi, dan beradaptasi di sekolah. Yang datang
terlambat tetap bisa berkembang, tetapi sering harus mengejar lebih banyak kemampuan
sekaligus.

**Yang paling ingin diubah.** Ini jawaban yang paling dekat dengan deskripsi produk ini,
dan diucapkan tanpa dipancing:

> "Saya ingin orang tua mengetahui lebih awal bahwa anaknya perlu diperiksa lebih
> lanjut. Bukan langsung diberi label autisme, tetapi supaya tidak kehilangan waktu
> beberapa tahun."

**Beban keluarga.** Biaya terapi beberapa kali seminggu ditambah transport. Ada orang tua
yang mengurangi jam kerja atau berhenti bekerja untuk mendampingi anak.

### Apa artinya untuk pitch

Kutipan B2 adalah pemisahan lajur proyek ini — *"perlu diperiksa lebih lanjut"*, bukan
*"positif autisme"* — diucapkan oleh orang yang belum pernah melihat aplikasinya. Itu
lebih berat daripada penjelasan arsitektur mana pun, dan tempatnya di bagian yang
menjelaskan kenapa `emitsReferral` tidak pernah berarti diagnosis.

Beban keluarga (B3) adalah sisi biaya yang [`dampak_dan_adopsi.md`](dampak_dan_adopsi.md)
tidak punya: dokumen itu hanya menghitung biaya sistem. Tarif dan frekuensi persisnya
tidak tergali, jadi ia tetap kualitatif dan **tidak boleh dijadikan angka**.

---

## C · Kapasitas rujukan — blok paling menentukan

Ini blok yang memvalidasi keputusan desain paling mudah diserang: memilih titik kerja
dengan sensitivitas 17%.

**Kalau rujukan jadi tiga kali lipat:**

> "Sepertinya akan sulit. Sekarang saja untuk beberapa layanan keluarga harus menunggu.
> Kalau semua langsung dirujuk, tenaga dan jadwal yang tersedia mungkin kewalahan."

**Lama antre:** beberapa minggu sampai beberapa bulan, tergantung tempat dan tenaga.

**Positif palsu:** pernah terjadi. Selama masa tunggu, orang tua sudah merasa anaknya
pasti autisme, padahal hasil akhirnya berbeda. "Itu membuat mereka sangat cemas."

### Apa artinya untuk pitch

**Ini temuan terpenting dari seluruh wawancara.** Argumen "kami memilih baris yang muat
di kapasitas rujukan yang benar-benar ada" selama ini bersandar sepenuhnya pada simulasi
di `research/hasil/gate_c_simulation.json`. Sekarang ia punya observasi lapangan di
sampingnya.

Perhatikan bahwa pertanyaannya menyebut **tiga kali lipat**, sementara baris teratas
tabel empat lengan merujuk 82,2% dari kohort — bukan tiga kali, melainkan sekitar tiga
puluh tujuh kali lipat dari 2,2%. Jadi jawabannya berlaku *a fortiori*: kalau tiga kali
saja sudah "mungkin kewalahan", titik kerja bersensitivitas 92% bukan pilihan yang
sedang dipertimbangkan.

Yang **tidak** boleh dikatakan: bahwa beliau menyetujui titik kerja 17%, atau menilai
tabel itu. Beliau tidak melihatnya. Yang beliau berikan adalah keadaan kapasitas, dan
kesimpulan tentang titik kerja tetap milik kami.

Jawaban C3 memberi biaya positif palsu dalam bentuk manusia — kecemasan selama masa
tunggu. Itu pembenaran kedua untuk memilih spesifisitas tinggi, dan pembenaran untuk
keadaan *tidak dapat dinilai* yang menolak melempar keluarga ke antrean atas dasar
pengukuran yang tidak cukup pasti.

---

## D · Bentuk keluaran — dan dua perubahan produk yang lahir dari sini

**Apa yang harus ada di laporan:**

> "Jangan hanya angka. Harus jelas apa yang terlihat pada anak, seberapa yakin hasil
> pengukurannya, dan apa langkah berikutnya. Kalau hanya skor, guru atau orang tua belum
> tentu tahu harus melakukan apa."

Tiga dari empat sudah ada di lapis pengasuh laporan: *apa yang terjadi*, *rekaman dapat
digunakan*, *langkah berikutnya*, *batas hasil*. Yang **belum** ada dalam bahasa awam
adalah **seberapa yakin pengukurannya** — selang kepercayaan dan status mutu memang
dihitung, tetapi keduanya berada di balik pengungkapan tenaga kesehatan.

**Hasil di bawah ambang akan dibaca sebagai apa:**

> "Banyak orang tua mungkin menganggap berarti anaknya pasti normal dan tidak perlu
> melakukan apa-apa lagi."

Ini konfirmasi lapangan atas `reassures: false`, dari arah yang sepenuhnya berbeda
dengan argumen NPV 65%. Yang satu statistik, yang satu perilaku pembaca.

**Bahasa yang aman:**

> "Jangan ditulis seolah anaknya positif autisme. Lebih baik mengatakan bahwa ada pola
> tertentu yang sebaiknya diperiksa lebih lanjut oleh tenaga profesional."

Ini hampir persis kalimat yang sudah dipakai aplikasi: *"Disarankan pemeriksaan
lanjutan"*. Validasi desain, bukan perubahan.

---

## E · Blind spot yang ditemukan wawancara ini

Pertanyaan penutup — *ada yang penting tapi belum ditanyakan?* — menghasilkan bahan
paling berguna, persis seperti yang diperkirakan protokol.

> "Menurut saya bukan hanya alatnya. Setelah hasil keluar harus jelas siapa yang
> menjelaskan dan mendampingi orang tua, karena hasil screening apa pun bisa membuat
> mereka takut atau bingung."

Dan sebelumnya:

> "Orang tua harus mengenali tanda lebih cepat, tetapi setelah itu juga harus tahu harus
> ke mana. Kalau sudah curiga tetapi tidak tahu langkah berikutnya, akhirnya tetap
> terlambat."

**Ini kelemahan produk, bukan pujian untuk produk.** Laporan menyebut *ke mana* — kader,
Puskesmas, dokter anak — tetapi tidak menyebut **siapa yang menemani orang tua membaca
hasilnya**. Alat yang mengeluarkan hasil lalu meninggalkan orang tua sendirian dengan
kertas itu menciptakan persis kecemasan yang diceritakan di C3.

---

## Yang berubah karena wawancara ini

| # | Perubahan | Berasal dari | Berkas |
|---|---|---|---|
| 1 | Lapis pengasuh membawa pernyataan keyakinan dalam bahasa awam, tidak lagi hanya di balik pengungkapan teknis | D1 — "seberapa yakin hasil pengukurannya" | `app/src/outcome/reportPresentation.ts` |
| 2 | Langkah berikutnya menyebut **siapa yang mendampingi**, bukan hanya ke mana membawa kertasnya | E2 — blind spot pendampingan | `app/src/outcome/reportPresentation.ts` |
| 3 | Kapasitas rujukan berhenti jadi asumsi perencanaan dan punya observasi lapangan di sampingnya | C1, C2 | `docs/dampak_dan_adopsi.md`, deck slide titik kerja |
| 4 | `reassures: false` punya pembenaran kedua yang bukan statistik | D2 | `docs/bingkai_kompetisi.md`, naskah pitch |

Yang **tidak** berubah: tidak ada ambang, titik operasi, bobot, atau angka performa yang
digeser oleh wawancara ini. Satu wawancara tidak menggerakkan angka.

---

## Yang masih kosong sesudah wawancara ini

- **Belum ada kader yang menyentuh aplikasi.** Ini tetap pengujian termurah yang tersisa
  dan tetap belum dilakukan. Wawancara guru tidak menggantikannya.
- **Belum ada tenaga Puskesmas atau dokter anak.** Merekalah yang memvalidasi kapasitas
  rujukan dari sisi penyedia dan sekaligus calon mitra kaji etik. Guru memberi
  konsekuensi dan cerita kasus; Puskesmas memberi jalur.
- **Angka antrean masih rentang, bukan bilangan.** "Beberapa minggu sampai beberapa
  bulan" tidak dapat dipakai untuk menghitung titik impas kapasitas.
- **Izin atribusi belum tertulis.**
