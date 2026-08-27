/**
 * The technical panel: gate status, evidence tables, and the Gate C capacity
 * simulation.
 *
 * Numbers that are computed stay in the code and get their separator from
 * Intl. Numbers that are quoted from a paper or a results artifact live here as
 * strings, because "0,8819" and "0.8819" are the same measurement written for
 * two different readers, and an English reader shown the first one will read it
 * as a thousands separator.
 *
 * The tone of this page is the tone of a methods section. Where the Indonesian
 * says a gate has not passed, the English says so just as plainly — this is the
 * page a reviewer opens to find out what is *not* claimed.
 */
export const id = {
  "admin.skip": "Lewati ke isi utama",
  "admin.role": "Panel teknis",
  "admin.navAria": "Bagian panel",
  "admin.navClose": "Tutup",
  "admin.publicEvidence": "Bukti publik",
  "admin.updated": "Diperbarui",
  "admin.updatedAt": "Diperbarui {date}",
  "admin.stimulusVersion": "Versi stimulus",
  "admin.title": "Panel teknis Neurogaze",
  "admin.lead":
    "Bukti pengukuran di balik produk, ditulis untuk peninjau. Setiap angka membawa sumbernya, dan setiap gerbang yang belum lulus disebut belum lulus.",
  "admin.gatePrefix": "Gate {gate}:",
  "admin.passCriteria": "Kriteria kelulusan",
  "admin.footer":
    "Setiap angka di halaman ini berasal dari artefak di research/hasil atau dari artikel sumber yang disebut namanya. Bukti sekunder tidak menggantikan kohort prospektif maupun uji coba Posyandu.",

  // --- Navigation ------------------------------------------------------
  "admin.nav.summaryGroup": "Ringkasan",
  "admin.nav.summary": "Status gerbang",
  "admin.nav.gatesGroup": "Gerbang validasi",
  "admin.nav.gateA": "A · Teknis",
  "admin.nav.gateB": "B · Kesetaraan",
  "admin.nav.gateC": "C · Klinis",
  "admin.nav.gateD": "D · Operasional",
  "admin.nav.fieldGroup": "Bukti lapangan",
  "admin.nav.positiveControl": "Kontrol positif",
  "admin.nav.instrumentGroup": "Instrumen",
  "admin.nav.clip": "Validasi klip GeoPref",
  "admin.nav.scene": "Adegan vektor",

  // --- Summary ---------------------------------------------------------
  "admin.summary.title": "Status gerbang validasi",
  "admin.summary.lead":
    "Halaman ini memisahkan pengukuran teknis dari pengalaman peserta. Tidak ada skor ASD dan tidak ada keputusan klinis di sini.",
  "admin.summary.figureTitle": "Dua dari empat gerbang lulus",
  "admin.summary.figureNote":
    "Gerbangnya berurutan: masing-masing mengandaikan yang sebelumnya sudah lulus. A dan B mengukur instrumennya. C dan D mengukur apa yang terjadi ketika instrumen itu dibawa ke anak dan ke meja Posyandu — dan keduanya belum dijalankan.",
  "admin.summary.limitTitle": "Batas kesimpulan",
  "admin.summary.limitBody":
    "Gate A membuktikan kelayakan teknis dan Gate B membuktikan agreement terhadap WebGazer.js. Keduanya tidak membuktikan akurasi diagnosis ASD; klaim klinis tetap menunggu kohort balita dengan hasil klinis independen yang dinilai buta.",

  // --- Gate A ----------------------------------------------------------
  "admin.gateA.title": "Akuisisi stabil pada 100 sesi lintas kondisi",
  "admin.gateA.lead":
    "Menguji apakah kamera tablet dapat mendeteksi wajah dan iris, membedakan arah, menjalankan kalibrasi dan stimulus penuh, menahan hasil gagal, serta tetap bekerja luring.",
  "admin.gateA.status": "Lulus · 100 sesi",
  "admin.gateA.mTotal": "Total sesi",
  "admin.gateA.mTotalNote": "25 peserta · 4 sesi per orang",
  "admin.gateA.mDone": "Sesi selesai",
  "admin.gateA.mDoneNote": "6 ditahan, semuanya dikenali sistem",
  "admin.gateA.mError": "Galat median",
  "admin.gateA.mErrorNote": "Ambang kelulusan ≤3°",
  "admin.gateA.mFrames": "Frame valid",
  "admin.gateA.mFramesNote": "Wajah dan mata terbaca",
  "admin.gateA.mDropout": "Dropout gaze",
  "admin.gateA.mDropoutNote": "Sanity check lulus 96 dari 100",
  "admin.gateA.mOffline": "Mode luring",
  "admin.gateA.mOfflineNote": "Nol crash sepanjang pengujian",
  "admin.gateA.condNormalLight": "Cahaya normal",
  "admin.gateA.condDimLight": "Cahaya redup",
  "admin.gateA.condNoGlasses": "Tanpa kacamata",
  "admin.gateA.condGlasses": "Dengan kacamata",
  "admin.gateA.sessionsSuffix": "{count} sesi",
  "admin.gateA.successTitle": "Sesi berhasil menurut kondisi",
  "admin.gateA.successNote":
    "Persentase sesi yang selesai dan menghasilkan laporan. Garis tipis adalah ambang penyelesaian 90%.",
  "admin.gateA.successThreshold": "Ambang penyelesaian 90%",
  "admin.gateA.errorTitle": "Galat kalibrasi median menurut kondisi",
  "admin.gateA.errorNote":
    "Derajat sudut pandang, lebih kecil lebih baik. Kacamata dan cahaya redup memakan hampir seluruh anggaran 3°, dan keduanya tetap di bawahnya.",
  "admin.gateA.errorThreshold": "Ambang galat 3°",
  "admin.gateA.outcomeTitle": "Ke mana 100 sesi bermuara",
  "admin.gateA.outcomeNote":
    "Enam sesi tidak menghasilkan laporan, dan seluruhnya dikenali sistem. Menahan hasil adalah keluaran yang sah, bukan kegagalan.",
  "admin.gateA.outReported": "Selesai dan melaporkan",
  "admin.gateA.outGlasses": "Pantulan kacamata",
  "admin.gateA.outTilt": "Wajah terlalu miring",
  "admin.gateA.outOrientation": "Orientasi layar berubah",
  "admin.gateA.outcomeUnit": "{count} sesi",
  "admin.gateA.tableCaption": "Hasil menurut kondisi pengujian",
  "admin.gateA.colCondition": "Kondisi",
  "admin.gateA.colSessions": "Sesi",
  "admin.gateA.colSuccess": "Berhasil",
  "admin.gateA.colError": "Galat median",
  "admin.gateA.crit1": "Galat median ≤ 3°",
  "admin.gateA.crit2": "Bingkai wajah dan mata valid > 85%",
  "admin.gateA.crit3": "Penyelesaian sesi > 90%",
  "admin.gateA.crit4": "Tidak ada skor risiko dari sesi invalid",
  "admin.gateA.crit5": "Fungsi utama tetap luring",
  "admin.gateA.critNote":
    "Seluruh kriteria terpenuhi tanpa crash dan tanpa hasil risiko dari sesi invalid.",
  "admin.gateA.noteTitle": "Enam sesi tidak menghasilkan laporan",
  "admin.gateA.noteBody":
    "Tiga karena pantulan kacamata, dua karena wajah terlalu miring, satu karena orientasi layar berubah setelah kalibrasi. Seluruhnya dikenali sistem dan diarahkan untuk dikoreksi atau dikalibrasi ulang — bukan diloloskan diam-diam.",

  // --- Gate B ----------------------------------------------------------
  "admin.gateB.title": "Aliran gaze sejalan dengan referensi WebGazer.js",
  "admin.gateB.lead":
    "Menguji agreement koordinat dan area perhatian antara aliran Neurogaze dan WebGazer.js 3.5.3 pada webapp yang sama, lewat kontrak setGazeListener.",
  "admin.gateB.status": "Lulus · 27 dari 30",
  "admin.gateB.mPairs": "Pasangan direkam",
  "admin.gateB.mPairsNote": "Aliran browser simultan",
  "admin.gateB.mReady": "Pasangan siap",
  "admin.gateB.mReadyNote": "Valid pair rate 90%",
  "admin.gateB.mError": "Galat median",
  "admin.gateB.mErrorValue": "44,159 px",
  "admin.gateB.mErrorNote": "0,040997 ternormalisasi",
  "admin.gateB.mAoi": "Agreement AOI",
  "admin.gateB.mAoiValue": "99,7118%",
  "admin.gateB.mAoiNote": "Dihitung ulang dari koordinat mentah",
  "admin.gateB.mPrimary": "AOI utama cocok",
  "admin.gateB.mPrimaryNote": "Seluruh pasangan siap",
  "admin.gateB.mHeld": "Ditahan",
  "admin.gateB.mHeldNote": "Tetap ikut dihitung, tidak dibuang",
  "admin.gateB.aoiFace": "Wajah",
  "admin.gateB.aoiLeft": "Target kiri",
  "admin.gateB.aoiRight": "Target kanan",
  "admin.gateB.aoiBackground": "Latar",
  "admin.gateB.donutTitle": "Komposisi area perhatian",
  "admin.gateB.donutNote":
    "Rata-rata 27 pasangan siap, aliran Neurogaze. Kedua target identik memang menerima porsi yang hampir sama — itu rancangannya, bukan kebetulan.",
  "admin.gateB.donutCentre": "66,0%",
  "admin.gateB.donutCentreNote": "pada dua target",
  "admin.gateB.deltaTitle": "Selisih Neurogaze terhadap WebGazer.js",
  "admin.gateB.deltaNote":
    "Poin persen, per area. Sumbunya berhenti di 0,08 pp supaya batangnya kelihatan sama sekali.",
  "admin.gateB.deltaDomainLabel": "0,08 pp",
  "admin.gateB.deltaFootnote":
    "Selisih terbesar ada pada target kiri, 0,06 pp — satu bingkai dari sekitar 1.700. Kriteria kelulusan menuntut agreement AOI ≥ 95%; di sini tidak ada satu area pun yang meleset sepersepuluh poin persen.",
  "admin.gateB.meterTitle": "Galat median ternormalisasi",
  "admin.gateB.meterNote": "Jarak koordinat antara kedua aliran, dibagi diagonal layar.",
  "admin.gateB.meterDisplay": "0,040997",
  "admin.gateB.meterLimit": "Ambang kelulusan ≤ 0,05",
  "admin.gateB.pairsTitle": "Hasil 30 pasangan yang direkam",
  "admin.gateB.pairsNote":
    "Tiga pasangan ditahan karena mutu sinyal, dan tetap ikut dihitung dalam valid pair rate alih-alih dibuang dari penyebut.",
  "admin.gateB.pairsReady": "Siap dianalisis",
  "admin.gateB.pairsReadyUnit": "27 pasangan",
  "admin.gateB.pairsHeld": "Ditahan",
  "admin.gateB.tableCaption": "Distribusi area perhatian",
  "admin.gateB.colArea": "Area",
  "admin.gateB.crit1": "Minimal 30 pasangan",
  "admin.gateB.crit2": "Valid pair rate ≥ 90%",
  "admin.gateB.crit3": "Galat median ternormalisasi ≤ 0,05",
  "admin.gateB.crit4": "Agreement AOI rata-rata ≥ 95%",
  "admin.gateB.crit5": "Agreement AOI utama ≥ 95%",
  "admin.gateB.critNote":
    "Kesimpulan terbatas pada agreement terhadap WebGazer.js. Ia tidak menyatakan akurasi klinis ASD.",
  "admin.gateB.noteTitle": "Setiap angka diturunkan ulang dari koordinat mentah",
  "admin.gateB.noteBody":
    "Agreement AOI yang dipublikasikan adalah 99,7118% hasil rekomputasi, bukan 99,7574% yang tersimpan di berkas ringkasan. Selisihnya muncul pada 4 dari 27 pasangan dan diterbitkan apa adanya, bukan didamaikan. ICC(A,1) 13 fitur sebesar 0,505 tetap dilaporkan sebagai metrik deskriptif, bukan penentu kelulusan.",

  // --- Gate C ----------------------------------------------------------
  "admin.gateC.title": "Validasi prospektif belum dilakukan",
  "admin.gateC.lead":
    "Studi prospektif harus membandingkan Neurogaze dengan asesmen perkembangan, M-CHAT, dan diagnosis ahli yang dibutakan terhadap skor Neurogaze.",
  "admin.gateC.status": "Terbuka",
  "admin.gateC.mScanpaths": "Lintasan tatapan",
  "admin.gateC.mScanpathsNote": "Citra 640 × 480",
  "admin.gateC.mParticipants": "ID partisipan",
  "admin.gateC.mParticipantsNote": "Pemisahan data per anak",
  "admin.gateC.mAuc": "AUC tingkat anak",
  "admin.gateC.mAucValue": "0,8819",
  "admin.gateC.mAucNote": "95% CI 0,774–0,968",
  "admin.gateC.mTarget": "Target Gate C",
  "admin.gateC.mTargetValue": "87,8% / 80,8%",
  "admin.gateC.mTargetNote": "Perochon dkk. 2023, kamera tablet",
  "admin.gateC.aucTitle": "AUC tingkat anak, dengan selang kepercayaannya",
  "admin.gateC.aucNote":
    "Titik penuh adalah estimasi, batang adalah selang 95%. Sumbunya mulai dari tebakan acak, dan selangnya lebar karena hanya ada 54 anak.",
  "admin.gateC.aucFootnote":
    "Angka ini berasal dari scanpath anak usia sekolah pada eye-tracker 250 Hz. Ia menyatakan sesuatu tentang dataset itu, bukan tentang balita di depan kamera tablet.",
  "admin.gateC.legendInterval": "Selang 95%",
  "admin.gateC.legendPoint": "Estimasi titik",
  "admin.gateC.tickRandom": "0,50 · acak",
  "admin.gateC.tick75": "0,75",
  "admin.gateC.tick100": "1,00",
  "admin.gateC.intervalLabel": "Evaluasi memisahkan data tiap anak",
  "admin.gateC.intervalDisplay": "0,8819 · CI 0,774–0,968",
  "admin.gateC.dataTitle": "Data yang tersedia",
  "admin.gateC.dataBody":
    "Model awal memakai scanpath ASD/non-ASD dari anak usia sekolah, bukan kohort balita Posyandu. Evaluasi yang memisahkan data tiap anak menghasilkan AUC OOF 0,8819 pada 54 anak — tetapi model menerima citra raster dari eye-tracker 250 Hz, dan tidak ada cara sah merekonstruksi masukan itu dari kamera 30 fps.",
  "admin.gateC.linkPaper": "Artikel Carette dkk. 2019",
  "admin.gateC.linkDataset": "Dataset di Figshare",
  "admin.gateC.whyOpen": "Kenapa belum lulus",
  "admin.gateC.why1": "Belum ada balita prospektif usia 16–30 bulan",
  "admin.gateC.why2": "Belum ada hasil klinis independen yang dinilai buta",
  "admin.gateC.why3": "Rata-rata usia sumber 7,88 tahun",
  "admin.gateC.why4": "Perangkat sumber 250 Hz, bukan kamera tablet",
  "admin.gateC.why5": "Belum ada lokasi eksternal yang terpisah",
  "admin.gateC.why6": "Ambang klinis belum boleh ditetapkan",
  "admin.gateC.cnnTitle": "CNN wajah tidak dipakai",
  "admin.gateC.cnnBody":
    "MediaPipe hanya dipakai untuk menemukan wajah dan iris di perangkat. CNN wajah mencapai AUC 0,932 — angka tertinggi di proyek ini — dan dibuang: enam dari enam metadata tata kelola tidak tersedia, tidak ada ID partisipan, dan uji shortcut menunjukkan statistik piksel saja sudah mencapai 0,751 dengan permutasi p = 0,005.",

  // --- Gate C simulation -----------------------------------------------
  "admin.sim.title": "Simulasi kapasitas layanan",
  "admin.sim.lead":
    "Ubah kohort, prevalensi, dan cakupan teknis. Sensitivitas dan spesifisitas dikunci pada hasil notebook agar asumsinya selalu terlihat.",
  "admin.sim.badge": "Hanya simulasi",
  "admin.sim.cohortSize": "Ukuran kohort",
  "admin.sim.prevalence": "Prevalensi sasaran",
  "admin.sim.coverage": "Cakupan teknis",
  "admin.sim.sensitivity": "Sensitivitas kandidat",
  "admin.sim.sensitivityValue": "84,62",
  "admin.sim.specificity": "Spesifisitas kandidat",
  "admin.sim.specificityValue": "75,00",
  "admin.sim.threshold": "Ambang notebook",
  "admin.sim.thresholdValue": "0,476",
  "admin.sim.assessable": "Dapat dinilai",
  "admin.sim.withheld": "{count} sesi ditahan",
  "admin.sim.referralRate": "Rujukan diperkirakan",
  "admin.sim.ofAssessed": "{count} dari yang dinilai",
  "admin.sim.ppv": "PPV pada prevalensi ini",
  "admin.sim.ppvNote": "Bukan PPV terobservasi",
  "admin.sim.perTruePositive": "Rujukan per true positive",
  "admin.sim.perTruePositiveNote": "Proyeksi beban layanan",
  "admin.sim.matrixTitle": "Ke mana skenario ini menempatkan setiap anak",
  "admin.sim.matrixNote":
    "Baris adalah keadaan sebenarnya, kolom adalah keputusan aturan. Sel yang mahal ada di diagonal berlawanan.",
  "admin.sim.funnelTitle": "Dari kohort ke rujukan yang benar",
  "admin.sim.funnelNote": "Setiap baris adalah bagian dari baris di atasnya, digambar pada skala yang sama.",
  "admin.sim.stepCohort": "Kohort",
  "admin.sim.stepAssessable": "Dapat dinilai",
  "admin.sim.stepReferred": "Dirujuk",
  "admin.sim.stepCorrect": "Rujukan tepat",
  "admin.sim.ratioTitle": "Harga satu rujukan yang tepat",
  "admin.sim.ratioNote":
    "Satu titik satu rujukan. Titik hijau adalah anak yang memang jadi sasaran; sisanya keluarga yang diminta datang lagi tanpa perlu.",
  "admin.sim.ratioBody":
    "{ratio} rujukan per satu sasaran yang terjaring. Itulah beban yang harus ditanggung Puskesmas untuk setiap anak yang benar-benar perlu diperiksa lanjut.",
  "admin.sim.ratioUndefined":
    "Pada skenario ini tidak ada sasaran yang terjaring, jadi rasionya tidak terdefinisi.",
  "admin.sim.ppvTitle": "PPV runtuh saat prevalensi turun",
  "admin.sim.ppvCurveNote":
    "Sensitivitas dan spesifisitas dikunci; hanya prevalensi yang bergerak. Arahkan kursor untuk membaca titik lain pada kurva.",
  "admin.sim.ppvFootnote":
    "Inilah alasan ambang klinis tidak boleh ditetapkan dari AUC saja. Tes yang sama berpindah dari berguna ke membanjiri layanan hanya karena kohortnya berubah.",
  "admin.sim.interpretTitle": "Interpretasi skenario saat ini",
  "admin.sim.interpretBody":
    "Dengan {cohort} anak, prevalensi {prevalence}, dan cakupan {coverage}, perhitungan memperkirakan {referralRate} peserta yang dapat dinilai akan dirujuk. PPV diperkirakan {ppv}, sehingga jumlah rujukan keliru perlu menjadi tolok ukur Gate C — bukan hasil studi, melainkan aritmetika atas asumsi yang terlihat di atas.",
  "admin.sim.foot":
    "Angka desimal adalah nilai harapan matematis, bukan jumlah anak yang benar-benar diperiksa.",

  // --- Gate D ----------------------------------------------------------
  "admin.gateD.title": "Uji lapangan belum dilakukan",
  "admin.gateD.lead":
    "Dasar prosedurnya ada di literatur; yang belum ada adalah bukti bahwa kader Posyandu dapat menjalankannya dengan perangkat dan alur layanan yang benar-benar mereka punya.",
  "admin.gateD.status": "Terbuka",
  "admin.gateD.feasibility": "Bukti kelayakan prosedur",
  "admin.gateD.body1":
    "Cilia dkk. menjalankan eye-tracking pada anak dengan posisi fleksibel sekitar 60 cm dari layar — di kursi, di pangkuan orang tua, atau di kursi makan anak — dengan instruksi minimal dan kalibrasi lima titik. Carette dkk. melaporkan anak dapat menonton rangkaian stimulus sekitar lima menit dengan kalibrasi dan verifikasi.",
  "admin.gateD.body2":
    "Neurogaze menambahkan pemeriksaan kualitas, kontrol jeda dan berhenti, pemrosesan lokal, serta penahanan hasil saat sinyal tidak valid.",
  "admin.gateD.needed": "Yang masih dibutuhkan lapangan",
  "admin.gateD.need1": "5 Posyandu",
  "admin.gateD.need2": "20 kader",
  "admin.gateD.need3": "200 sesi anak",
  "admin.gateD.need4": "3 jenis tablet Android",
  "admin.gateD.need5": "Tingkat penyelesaian dan durasi nyata",
  "admin.gateD.need6": "Pemahaman laporan dan penerimaan orang tua",
  "admin.gateD.limitTitle": "Batas klaim",
  "admin.gateD.limitBody":
    "Kedua artikel di atas tidak menguji kader, kamera tablet, mode luring, maupun alur rujukan Neurogaze. Kemudahan penggunaan di lapangan karena itu belum dapat diklaim.",

  // --- Positive control ------------------------------------------------
  "admin.pc.title": "Kontrol positif: instrumennya merespons",
  "admin.pc.lead":
    "Beri instrumen sinyal yang diketahui ada, lalu periksa apakah ia merespons. Direkam 19 Agustus 2026 lewat aplikasi yang dikirim, lalu dihitung ulang dari jejak mentah oleh skrip terpisah.",
  "admin.pc.status": "Terukur",
  "admin.pc.mParticipants": "Peserta",
  "admin.pc.mParticipantsNote": "Dewasa, menyetujui untuk dirinya sendiri",
  "admin.pc.mSessions": "Sesi berbeda",
  "admin.pc.mSessionsNote": "Pada 3 perangkat, 4 peserta per perangkat",
  "admin.pc.mPassed": "Lolos kriteria mutu",
  "admin.pc.mPassedNote": "Attrition 35%, dilaporkan apa adanya",
  "admin.pc.mFired": "Aturan menyala pada menonton biasa",
  "admin.pc.mFiredNote": "Angka yang paling penting di tabel ini",
  "admin.pc.condOrdinary": "Menonton biasa",
  "admin.pc.condProduced": "Pola diproduksi",
  "admin.pc.sigGeometric": "Preferensi geometrik",
  "admin.pc.sigTrials": "Percobaan masuk target",
  "admin.pc.sigDispersion": "Sebaran tatapan fase isyarat",
  "admin.pc.rangeTitle": "Jarak antara dua kondisi, per sinyal",
  "admin.pc.rangeNote":
    "Tiap sinyal memakai sumbunya sendiri karena satuannya berbeda. Yang dibaca adalah lebar celah di antara kedua batang, bukan panjang batangnya.",
  "admin.pc.rangeFootnote":
    "Ketiga celah terbuka penuh: tidak ada satu pun sesi biasa yang menyentuh rentang sesi produksi pada sinyal mana pun.",
  "admin.pc.tableCaption": "Pemisahan tiap sinyal keputusan antara dua kondisi perilaku",
  "admin.pc.colSignal": "Sinyal",
  "admin.pc.colMargin": "Jarak terdekat",
  "admin.pc.colP": "p",
  "admin.pc.noteTitle": "Kolom yang penting adalah jarak terdekat, bukan AUC",
  "admin.pc.noteBody":
    "Ketiga sinyal ber-AUC 1,00, tetapi itu hanya berarti tidak ada pasangan yang tertukar urutannya. Jarak terdekat menyebut selebar apa celahnya dalam satuan sinyal itu sendiri: sesi biasa dengan preferensi geometrik tertinggi ada di 0,73, sesi produksi terendah di 0,89.",
  "admin.pc.ruleTitle": "Aturan komposit",
  "admin.pc.ruleShippedLead": "Sebagaimana dikirim",
  "admin.pc.ruleShippedBody":
    "— tidak menyala pada kondisi mana pun, dan tidak akan pernah bisa. Aturannya menuntut dua sinyal menyimpang; preferensi geometrik berstatus tidak dapat dinilai selama klip berlisensi lebih pendek daripada protokol asal ambangnya. Nol di kedua baris adalah keadaan aturannya, bukan pengukuran tentang peserta.",
  "admin.pc.ruleDemoLead": "Mode demonstrasi",
  "admin.pc.ruleDemoBody":
    "— ambang yang sama diterapkan pada klip pendek itu, semata supaya pertanyaan “apakah aturannya merespons” punya jawaban.",
  "admin.pc.dotsTitle": "Mode demonstrasi: satu titik satu sesi",
  "admin.pc.dotsNote":
    "Titik terisi berarti aturannya menyala pada sesi itu. Baris atas adalah pertanyaan spesifisitasnya.",
  "admin.pc.dotsFootnote":
    "Sembilan sesi menonton biasa, tidak satu pun memicu aturan. Empat dari enam sesi produksi memicunya.",
  "admin.pc.fired": "Menyala",
  "admin.pc.notFired": "Tidak menyala",
  "admin.pc.demoTableCaption": "Mode demonstrasi — bukan rujukan, dan tidak boleh dikutip sebagai satu",
  "admin.pc.colCondition": "Kondisi",
  "admin.pc.claimTitle": "Baris atas kolom kiri adalah yang penting, dan ia nol",
  "admin.pc.claimBody":
    "Aturannya tidak menyala pada orang yang sekadar menonton. Satu sesi biasa memang menunjukkan preferensi geometrik 0,73 di atas ambang — dan tepat karena sinyal keduanya normal, aturannya tidak menyala. Dua sesi produksi yang tidak menyala gagal pada prasyarat perhatian, bukan pada perilakunya: keduanya tidak pernah menatap model saat isyarat disampaikan, jadi sinyal isyaratnya ditahan.",
  // Quoted cells from research/hasil/kontrol_positif/ringkasan.json.
  "admin.pcRow1.ordinary": "0,34",
  "admin.pcRow1.ordinaryRange": "0,08–0,73",
  "admin.pcRow1.produced": "0,94",
  "admin.pcRow1.producedRange": "0,89–1,00",
  "admin.pcRow1.margin": "+0,16",
  "admin.pcRow1.p": "5,8 × 10⁻⁴",
  "admin.pcRow2.ordinary": "8 dari 8",
  "admin.pcRow2.ordinaryRange": "5–8",
  "admin.pcRow2.produced": "0 dari 8",
  "admin.pcRow2.producedRange": "0–1",
  "admin.pcRow2.margin": "4 percobaan",
  "admin.pcRow2.p": "6,3 × 10⁻⁴",
  "admin.pcRow3.ordinary": "0,31",
  "admin.pcRow3.ordinaryRange": "0,07–0,40",
  "admin.pcRow3.produced": "0,05",
  "admin.pcRow3.producedRange": "0,03–0,06",
  "admin.pcRow3.margin": "+0,008",
  "admin.pcRow3.p": "2,0 × 10⁻⁴",
  "admin.pcRange1.tick0": "0",
  "admin.pcRange1.tick1": "0,5",
  "admin.pcRange1.tick2": "1,0",
  "admin.pcRange2.tick0": "0",
  "admin.pcRange2.tick1": "4",
  "admin.pcRange2.tick2": "8",
  "admin.pcRange2.aDisplay": "5–8 dari 8",
  "admin.pcRange2.bDisplay": "0–1 dari 8",
  "admin.pcRange3.tick0": "0",
  "admin.pcRange3.tick1": "0,25",
  "admin.pcRange3.tick2": "0,50",

  "admin.pc.confoundHeading": "Confound yang harus ikut disebut",
  "admin.pc.confound1": "Panel geometrik selalu di kanan",
  "admin.pc.confound1Body":
    "Pada seluruh 24 sesi, dan urutan isyarat identik pada seluruhnya, karena kedua skema counterbalancing diturunkan dari kolom identitas yang terisi sama. Preferensi geometrik karena itu tidak terpisah dari bias melirik kanan di data ini.",
  "admin.pc.confound2": "Identitas peserta tidak terekam",
  "admin.pc.confound2Body":
    "Tidak ada analisis berpasangan. Grup validasi silang adalah perangkat, bukan orang — lebih kasar daripada yang diminta protokol, dan lebih ketat.",
  "admin.pc.confound3": "Urutan kondisi tidak diseimbangkan",
  "admin.pc.confound3Body":
    "Disengaja: instruksi kondisi kedua tidak dapat ditarik kembali. Efek urutan karena itu tidak dapat dipisahkan dari efek kondisi.",
  "admin.pc.limitTitle": "Yang data ini tidak tunjukkan",
  "admin.pc.limitBody":
    "Apa pun tentang autisme. Pesertanya orang dewasa yang mengikuti naskah, jadi tidak ada sensitivitas, spesifisitas, atau akurasi di dalamnya. Regresi logistik pada kedua sinyal mencapai AUC luar-lipatan 1,00 pada 13 sesi dengan grup perangkat — itu analisis sensitivitas, bukan jalur keputusan, dan bobot yang dipasang pada orang dewasa yang mengikuti naskah mempelajari naskahnya.",

  // --- GeoPref clip ----------------------------------------------------
  "admin.clip.title": "Validasi klip GeoPref",
  "admin.clip.lead":
    "Blok preferential looking membawa satu-satunya ambang terbit di sistem ini. Karena itu asetnya diperiksa sebagai berkas, bukan diterima sebagai aset.",
  "admin.clip.status": "Protokol disingkat",
  "admin.clip.mVideo": "Trek video",
  "admin.clip.mVideoNote": "avc1, 640 × 360, 502 frame",
  "admin.clip.mAudio": "Trek audio",
  "admin.clip.mAudioNote": "Senyap sesuai protokol, bukan audio yang hilang",
  "admin.clip.mDuration": "Durasi",
  "admin.clip.mDurationValue": "16,75 dtk",
  "admin.clip.mDurationNote": "Seperlima protokol terbit 90 detik",
  "admin.clip.mLicense": "Lisensi",
  "admin.clip.mLicenseNote": "Moore dkk. 2018, Additional file 2",
  "admin.clip.durationTitle": "Yang dikirim, dibanding protokol tempat ambangnya diturunkan",
  "admin.clip.durationNote":
    "Panjang klip dalam detik, pada skala yang sama. Yang berjalan di lapangan adalah batang paling atas.",
  "admin.clip.legendShipped": "Yang dikirim",
  "admin.clip.legendPublished": "Protokol terbit",
  "admin.clip.durShipped": "Dikirim",
  "admin.clip.durShippedSub": "Cuplikan Complex Social",
  "admin.clip.durShippedValue": "16,75 dtk",
  "admin.clip.durOriginal": "GeoPref asli",
  "admin.clip.durOriginalSub": "Wen dkk. 2022",
  "admin.clip.durOriginalValue": "62,22 dtk",
  "admin.clip.durComplex": "Complex Social",
  "admin.clip.durComplexSub": "Moore dkk. 2018",
  "admin.clip.durComplexValue": "90 dtk",
  "admin.clip.frameTitle": "Berapa banyak bingkai yang sebenarnya terpakai",
  "admin.clip.frameNote":
    "Bingkai 640 × 360 digambar sesuai skala. Kedua panel adalah seluruh isi yang membawa informasi; sisanya kotak hitam suplemen.",
  "admin.clip.panelSocial": "Sosial",
  "admin.clip.panelGeometric": "Geometrik",
  "admin.clip.subtenseTitle": "Sudut yang disubtensi tiap panel",
  "admin.clip.subtenseNote":
    "Digambar sesuai skala pada tablet sasaran. Garis putus-putus adalah ukuran yang dilaporkan Moore dkk.; blok isi adalah yang benar-benar dilihat anak.",
  "admin.clip.subtenseFootnote":
    "Aplikasi memangkas kotak hitamnya, tetapi memangkas tidak menambah piksel: panelnya tetap lebih kecil daripada yang dipakai saat ambang diturunkan.",
  "admin.clip.subtenseReference": "Moore dkk. · 12,9° × 9,1°",
  "admin.clip.subtenseShipped": "Yang dikirim · 7,6° × 4,9°",
  "admin.clip.geometryTitle": "Geometri panel diperiksa per perangkat",
  "admin.clip.geometryBody1Pre": "Panel sosial dan geometrik hanya menempati ",
  "admin.clip.geometryShare": "19,8%",
  "admin.clip.geometryBody1Post":
    " luas bingkai 640 × 360; sisanya hitam, karena berkasnya ilustrasi suplemen dan bukan master presentasi. Diputar utuh, tiap panel menyubtensi sekitar 7,6° × 4,9° pada tablet sasaran — jauh di bawah 12,9° × 9,1° yang dilaporkan Moore dkk.",
  "admin.clip.geometryBody2Pre": "Aplikasi memangkas kotak hitam itu, dan ",
  "admin.clip.geometryBody2Post":
    " membuat geometrinya dapat diperiksa per perangkat alih-alih diasumsikan.",
  "admin.clip.deliberate": "Sifat yang disengaja",
  "admin.clip.deliberate1Lead": "Senyap.",
  "admin.clip.deliberate1Body": "Metode Moore dkk. menyatakan tidak ada audio. Jangan menambahkan trek suara.",
  "admin.clip.deliberate2Lead": "Letterboxed.",
  "admin.clip.deliberate2Body": "Surround hitam dipangkas agar sudut panel mendekati yang dilaporkan.",
  "admin.clip.deliberate3Lead": "Panel geometrik di kanan.",
  "admin.clip.deliberate3Body": "Dicatat ke log sesi, bukan diasumsikan.",
  "admin.clip.assetsHeading": "Tiap aset membawa titik operasinya sendiri",
  "admin.clip.assetDuration": "Durasi",
  "admin.clip.assetOperating": "Titik operasi",
  "admin.clip.asset1Title": "Cuplikan Complex Social",
  "admin.clip.asset1Duration": "16,75 dtk",
  "admin.clip.asset1Status": "Dikirim",
  "admin.clip.asset1Operating": "Tidak ada preseden operasional",
  "admin.clip.asset1Note":
    "Satu dari lima adegan video contoh publik. Karena itu validatedProtocol bernilai false dan ambang 69% ditahan.",
  "admin.clip.asset2Title": "GeoPref asli 62,22 detik",
  "admin.clip.asset2Duration": "62,22 dtk",
  "admin.clip.asset2Status": "Diminta",
  "admin.clip.asset2Operating": "Sensitivitas 17% · spesifisitas 98%",
  "admin.clip.asset2Note":
    "Wen dkk. 2022, n=1.863, usia 12–48 bulan. Ini tes yang ambang 69% benar-benar divalidasi padanya.",
  "admin.clip.asset3Title": "Complex Social 90 detik",
  "admin.clip.asset3Duration": "90 dtk",
  "admin.clip.asset3Status": "Diminta",
  "admin.clip.asset3Operating": "Sensitivitas 18% · spesifisitas 97%",
  "admin.clip.asset3Note":
    "Moore dkk. 2018, AUC 0,74. Ambang 69% dibawa apa adanya demi konsistensi, bukan dioptimasi ulang.",
  "admin.clip.limitTitle": "Kenapa ambang 69% ditahan",
  "admin.clip.limitBody1":
    "Ambang itu diturunkan pada protokol 62,22 detik dan dibawa ke protokol 90 detik. Yang dikirim adalah cuplikan 16,75 detik dari keduanya — seperlima panjang protokol terbit, tanpa preseden operasional sendiri. Karena itu ",
  "admin.clip.limitBody2":
    " bernilai false, ambangnya ditahan di lapangan, dan sesi melaporkan persentase terukur sambil menyatakan protokolnya disingkat. Mode demonstrasi menerapkannya sekali, di bawah banner yang menyatakan dirinya demonstrasi.",

  // --- Vector scene ----------------------------------------------------
  "admin.scene.title": "Adegan vektor dirancang untuk skrining, bukan hiburan",
  "admin.scene.lead":
    "Setiap detik, objek, dan gerakan pada adegan punya alasan metodologis. Stimulus {version}.",
  "admin.scene.status": "{seconds} detik",
  "admin.scene.mDuration": "Durasi total",
  "admin.scene.mDurationValue": "{seconds} detik",
  "admin.scene.mDurationNote": "Tanpa speaker, blok panggilan nama tidak dijalankan",
  "admin.scene.mTrials": "Percobaan berskor",
  "admin.scene.mTrialsNote": "4 jenis isyarat × kiri dan kanan",
  "admin.scene.mPreCue": "Epok pra-isyarat",
  "admin.scene.mPreCueValue": "1,7 detik",
  "admin.scene.mPreCueNote": "Tanpa informasi arah sama sekali",
  "admin.scene.mResponse": "Jendela respons",
  "admin.scene.mResponseValue": "3,3 detik",
  "admin.scene.mResponseNote": "Latensi gaze following < 1,5 detik",
  "admin.scene.trialHeading": "Struktur satu percobaan · 5 detik",
  "admin.scene.stripTitle": "Satu percobaan, digambar sesuai waktunya",
  "admin.scene.stripNote":
    "Lebar tiap blok sebanding dengan durasinya. Onset isyarat memisahkan epok pra-isyarat yang benar-benar netral dari jendela yang dihitung sebagai respons.",
  "admin.scene.stripFootnote":
    "Ketiga angka di strip ini dibaca dari modul protokol, bukan diketik ulang di halaman ini.",
  "admin.scene.bandRest": "Istirahat",
  "admin.scene.bandOstensive": "Sinyal ostensif",
  "admin.scene.bandResponse": "Jendela respons",
  "admin.scene.secondsUnit": "{value} dtk",
  "admin.scene.markerOstensive": "{value} dtk · ostensif",
  "admin.scene.markerCue": "{value} dtk · isyarat arah",
  "admin.scene.tl1Time": "0,0–1,2 dtk",
  "admin.scene.tl1Title": "Istirahat",
  "admin.scene.tl1Note":
    "Model menunduk ke meja. Tangan di bawah tepi meja, tidak ada arah sama sekali.",
  "admin.scene.tl2Time": "1,2 dtk",
  "admin.scene.tl2Title": "Sinyal ostensif",
  "admin.scene.tl2Note":
    "Kepala terangkat, kontak mata, alis naik, senyum. Mengundang sebelum ada isyarat.",
  "admin.scene.tl3Time": "1,7 dtk",
  "admin.scene.tl3Title": "Isyarat arah",
  "admin.scene.tl3Note":
    "Wajah kembali netral. Mata bergerak lebih dulu, kepala menyusul, tangan terakhir.",
  "admin.scene.tl4Time": "1,7–5,0 dtk",
  "admin.scene.tl4Title": "Jendela respons",
  "admin.scene.tl4Note":
    "Adegan dibekukan. Seluruh pandangan pada periode ini dihitung sebagai respons.",
  "admin.scene.whyOstensive": "Kenapa harus ada sinyal ostensif dulu",
  "admin.scene.whyOstensiveBody":
    "Anak kecil mengikuti arah pandang terutama setelah menerima sinyal komunikatif — kontak mata, alis terangkat, sapaan. Tanpa ajakan itu, anak yang tidak mengikuti arah pandang belum tentu menunjukkan apa pun; ia bisa saja hanya tidak merasa diajak.",
  "admin.scene.whyVector": "Kenapa vektor, bukan rekaman video",
  "admin.scene.whyVectorBody":
    "Adegan digambar sebagai SVG dan dianimasikan lewat CSS. Onset isyarat karena itu jatuh persis pada milidetik yang dideklarasikan protokol di semua tablet, tidak bergeser karena frame yang jatuh atau dekoder yang berbeda. Asetnya kecil, berjalan luring penuh, dan tidak membawa masalah lisensi maupun privasi seperti rekaman aktor.",
  "admin.scene.designSource": "Sumber rancangan",
  "admin.scene.designSourceBody1Pre": "Struktur percobaan mengikuti paradigma ",
  "admin.scene.designSourceEm": "responding joint attention",
  "admin.scene.designSourceBody1Post":
    " yang dipakai pada balita: model perempuan duduk di belakang meja dengan dua objek identik, mula-mula menunduk, lalu menatap kamera dan menyapa, lalu memalingkan kepala ke salah satu objek sambil tetap diam dan berekspresi netral.",
  "admin.scene.designSourceBody2Pre": "Video suplemen paradigma itu (Billeci dkk.) tersimpan di repositori pada ",
  "admin.scene.designSourceBody2Post": " dan dipakai sebagai acuan langsung saat menyusun urutan adegan.",
  "admin.scene.construct": "Konstruk yang diukur",
  "admin.scene.constructBody":
    "Berkurangnya respons terhadap ajakan berbagi perhatian adalah salah satu perbedaan perilaku yang paling awal muncul dan paling konsisten dilaporkan pada anak dengan ASD. Cilia dkk. menemukan gerakan menunjuk yang disertai orientasi kepala sebagai isyarat sasaran paling kuat — itulah yang direplikasi di sini.",
  "admin.scene.omittedHeading": "Yang sengaja dihilangkan dari adegan",
  "admin.scene.limitTitle": "Batas klaim desain stimulus",
  "admin.scene.limitBody":
    "Rancangan yang berdasar tidak membuat keluarannya menjadi diagnosis. Baterai ini bukan GeoPref dan bukan instrumen yang sudah tervalidasi secara klinis; ia berstatus stimulus riset yang dapat diuji. Validitasnya ditentukan Gate C, bukan oleh kualitas rancangan di halaman ini. Perubahan apa pun pada adegan atau waktu wajib menaikkan versi stimulus, karena hasil lama tidak lagi sebanding.",

  // --- Chart primitives ------------------------------------------------
  "chart.threshold": "Ambang {value}",
  "chart.donutAria": "Komposisi: {parts}",
  "chart.donutPart": "{label} {value}%",
  "chart.matrixReferred": "Dirujuk",
  "chart.matrixNotReferred": "Tidak dirujuk",
  "chart.matrixTarget": "Sasaran",
  "chart.matrixNotTarget": "Bukan sasaran",
  "chart.matrixCaught": "terjaring",
  "chart.matrixMissed": "terlewat",
  "chart.matrixWrong": "rujukan keliru",
  "chart.matrixCorrect": "tidak dirujuk",
  "chart.ppvAria":
    "Nilai prediktif positif turun dari {high} pada prevalensi {highPrev} ke {low} pada prevalensi {lowPrev}.",
  "chart.ppvAxis": "prevalensi",
  "chart.ppvRead": "PPV pada prevalensi {prevalence}",
  "chart.ppvCursor": "posisi kursor",
  "chart.ppvCurrent": "skenario saat ini",
  "chart.frameAria":
    "Dua panel menempati {share}% luas bingkai 640 kali 360; sisanya kotak hitam.",
  "chart.frameUsed": "640 × 360 · {share}% terpakai",
  "chart.subtenseAria":
    "Panel yang dikirim menyubtensi {shippedW} kali {shippedH} derajat, dibandingkan {refW} kali {refH} derajat pada protokol terbit.",
  "chart.bandTitle": "{label}: {from}–{to} dtk",
  "chart.trialEnd": "{value} dtk",

  // --- Design choices --------------------------------------------------
  "admin.choice1": "Dua objek identik",
  "admin.choice1Body":
    "Objek berbeda membuat anak bisa sekadar menyukai salah satunya. Identik menyisakan isyarat sosial sebagai satu-satunya pembeda.",
  "admin.choice2": "Objek tidak pernah bergerak",
  "admin.choice2Body":
    "Gerakan menarik pandangan secara refleks. Objek diam memastikan yang terukur adalah respons terhadap ajakan.",
  "admin.choice3": "Pra-isyarat benar-benar netral",
  "admin.choice3Body":
    "Model menunduk, tangan di bawah meja. Tidak ada informasi kiri–kanan sebelum onset, jadi pembanding pra-isyarat sah dipakai.",
  "admin.choice4": "Pupil gelap di atas sklera terang",
  "admin.choice4Body":
    "Polaritas kontras mata yang lazim membawa efek gaze following; polaritas terbalik jauh lebih lemah. Dijaga uji kontrak, bukan pilihan gaya.",
  "admin.choice5": "Mata benar-benar bergerak",
  "admin.choice5Body":
    "Bola mata bergeser 16 px pada onset, transisi 240 ms berjeda 50 ms — mata berangkat lebih dulu daripada kepala dan tangan, seperti isyarat manusia.",
  "admin.choice6": "Ostensif dulu, arah kemudian",
  "admin.choice6Body":
    "Bayi mengikuti tatapan setelah sinyal komunikatif, bukan setelah animasi yang sekadar menarik perhatian.",
  "admin.choice7": "Isyarat berupa perubahan status",
  "admin.choice7Body":
    "Animasi berulang menjadi sumber gerakan tersendiri. Di sini isyarat adalah satu perpindahan pose pada milidetik yang dideklarasikan protokol.",
  "admin.choice8": "Blok isyarat tanpa suara",
  "admin.choice8Body":
    "Percobaan arah sengaja bisu supaya yang terukur murni tatapan. Respons nama diukur di bloknya sendiri.",
  "admin.choice9": "Urutan diseimbangkan tiap sesi",
  "admin.choice9Body":
    "Urutan kiri–kanan tetap membuat anak yang sekadar memindai mencetak nilai seperti anak yang benar-benar mengikuti. Urutan diacak dari id sesi, bukan dipilih operator.",
  "admin.choice10": "Gerak diam hanya napas dan kedip",
  "admin.choice10Body":
    "Wajah beku terasa mati dan kehilangan perhatian. Kedip dan napas simetris di tengah, jadi tidak menarik pandangan ke satu sisi.",
} as const;

export const en: Record<keyof typeof id, string> = {
  "admin.skip": "Skip to main content",
  "admin.role": "Technical panel",
  "admin.navAria": "Panel sections",
  "admin.navClose": "Close",
  "admin.publicEvidence": "Public evidence",
  "admin.updated": "Updated",
  "admin.updatedAt": "Updated {date}",
  "admin.stimulusVersion": "Stimulus version",
  "admin.title": "Neurogaze technical panel",
  "admin.lead":
    "The measurement evidence behind the product, written for a reviewer. Every number carries its source, and every gate that has not passed is called not passed.",
  "admin.gatePrefix": "Gate {gate}:",
  "admin.passCriteria": "Pass criteria",
  "admin.footer":
    "Every number on this page comes from an artifact under research/hasil or from a source paper named by name. Secondary evidence does not substitute for a prospective cohort or a Posyandu trial.",

  // --- Navigation ------------------------------------------------------
  "admin.nav.summaryGroup": "Summary",
  "admin.nav.summary": "Gate status",
  "admin.nav.gatesGroup": "Validation gates",
  "admin.nav.gateA": "A · Technical",
  "admin.nav.gateB": "B · Equivalence",
  "admin.nav.gateC": "C · Clinical",
  "admin.nav.gateD": "D · Operational",
  "admin.nav.fieldGroup": "Field evidence",
  "admin.nav.positiveControl": "Positive control",
  "admin.nav.instrumentGroup": "Instrument",
  "admin.nav.clip": "GeoPref clip validation",
  "admin.nav.scene": "Vector scene",

  // --- Summary ---------------------------------------------------------
  "admin.summary.title": "Validation gate status",
  "admin.summary.lead":
    "This page separates technical measurement from participant experience. There is no ASD score and no clinical decision here.",
  "admin.summary.figureTitle": "Two of four gates passed",
  "admin.summary.figureNote":
    "The gates are sequential: each assumes the previous one has passed. A and B measure the instrument. C and D measure what happens when that instrument is taken to a child and to a Posyandu table — and neither has been run.",
  "admin.summary.limitTitle": "Limits of the conclusion",
  "admin.summary.limitBody":
    "Gate A establishes technical feasibility and Gate B establishes agreement against WebGazer.js. Neither establishes ASD diagnostic accuracy; the clinical claim still awaits a toddler cohort with independent, blinded clinical outcomes.",

  // --- Gate A ----------------------------------------------------------
  "admin.gateA.title": "Stable acquisition across 100 sessions and conditions",
  "admin.gateA.lead":
    "Tests whether a tablet camera can detect the face and iris, discriminate direction, run full calibration and stimulus, withhold failed results, and keep working offline.",
  "admin.gateA.status": "Passed · 100 sessions",
  "admin.gateA.mTotal": "Total sessions",
  "admin.gateA.mTotalNote": "25 participants · 4 sessions each",
  "admin.gateA.mDone": "Sessions completed",
  "admin.gateA.mDoneNote": "6 withheld, all of them recognised by the system",
  "admin.gateA.mError": "Median error",
  "admin.gateA.mErrorNote": "Pass threshold ≤3°",
  "admin.gateA.mFrames": "Valid frames",
  "admin.gateA.mFramesNote": "Face and eyes readable",
  "admin.gateA.mDropout": "Gaze dropout",
  "admin.gateA.mDropoutNote": "Sanity check passed on 96 of 100",
  "admin.gateA.mOffline": "Offline mode",
  "admin.gateA.mOfflineNote": "Zero crashes across the whole test",
  "admin.gateA.condNormalLight": "Normal light",
  "admin.gateA.condDimLight": "Dim light",
  "admin.gateA.condNoGlasses": "Without glasses",
  "admin.gateA.condGlasses": "With glasses",
  "admin.gateA.sessionsSuffix": "{count} sessions",
  "admin.gateA.successTitle": "Successful sessions by condition",
  "admin.gateA.successNote":
    "Percentage of sessions that completed and produced a report. The thin line is the 90% completion threshold.",
  "admin.gateA.successThreshold": "90% completion threshold",
  "admin.gateA.errorTitle": "Median calibration error by condition",
  "admin.gateA.errorNote":
    "Degrees of visual angle, smaller is better. Glasses and dim light consume nearly the whole 3° budget, and both stay under it.",
  "admin.gateA.errorThreshold": "3° error threshold",
  "admin.gateA.outcomeTitle": "Where the 100 sessions ended up",
  "admin.gateA.outcomeNote":
    "Six sessions produced no report, and the system recognised every one of them. Withholding a result is a valid output, not a failure.",
  "admin.gateA.outReported": "Completed and reported",
  "admin.gateA.outGlasses": "Glasses reflection",
  "admin.gateA.outTilt": "Face tilted too far",
  "admin.gateA.outOrientation": "Screen orientation changed",
  "admin.gateA.outcomeUnit": "{count} sessions",
  "admin.gateA.tableCaption": "Results by test condition",
  "admin.gateA.colCondition": "Condition",
  "admin.gateA.colSessions": "Sessions",
  "admin.gateA.colSuccess": "Successful",
  "admin.gateA.colError": "Median error",
  "admin.gateA.crit1": "Median error ≤ 3°",
  "admin.gateA.crit2": "Valid face and eye frames > 85%",
  "admin.gateA.crit3": "Session completion > 90%",
  "admin.gateA.crit4": "No risk score from an invalid session",
  "admin.gateA.crit5": "Core functions stay offline-capable",
  "admin.gateA.critNote":
    "Every criterion was met, with no crashes and no risk result from an invalid session.",
  "admin.gateA.noteTitle": "Six sessions produced no report",
  "admin.gateA.noteBody":
    "Three from glasses reflections, two from the face being tilted too far, one from the screen orientation changing after calibration. The system recognised all of them and routed them to correction or recalibration — none was quietly passed through.",

  // --- Gate B ----------------------------------------------------------
  "admin.gateB.title": "The gaze stream agrees with the WebGazer.js reference",
  "admin.gateB.lead":
    "Tests coordinate and area-of-interest agreement between the Neurogaze stream and WebGazer.js 3.5.3 in the same web app, through the setGazeListener contract.",
  "admin.gateB.status": "Passed · 27 of 30",
  "admin.gateB.mPairs": "Pairs recorded",
  "admin.gateB.mPairsNote": "Simultaneous browser streams",
  "admin.gateB.mReady": "Pairs ready",
  "admin.gateB.mReadyNote": "Valid pair rate 90%",
  "admin.gateB.mError": "Median error",
  "admin.gateB.mErrorValue": "44.159 px",
  "admin.gateB.mErrorNote": "0.040997 normalised",
  "admin.gateB.mAoi": "AOI agreement",
  "admin.gateB.mAoiValue": "99.7118%",
  "admin.gateB.mAoiNote": "Recomputed from raw coordinates",
  "admin.gateB.mPrimary": "Primary AOI matches",
  "admin.gateB.mPrimaryNote": "All ready pairs",
  "admin.gateB.mHeld": "Withheld",
  "admin.gateB.mHeldNote": "Still counted, not discarded",
  "admin.gateB.aoiFace": "Face",
  "admin.gateB.aoiLeft": "Left target",
  "admin.gateB.aoiRight": "Right target",
  "admin.gateB.aoiBackground": "Background",
  "admin.gateB.donutTitle": "Area-of-interest composition",
  "admin.gateB.donutNote":
    "Mean across 27 ready pairs, Neurogaze stream. The two identical targets do receive almost the same share — that is the design, not a coincidence.",
  "admin.gateB.donutCentre": "66.0%",
  "admin.gateB.donutCentreNote": "on the two targets",
  "admin.gateB.deltaTitle": "Neurogaze difference against WebGazer.js",
  "admin.gateB.deltaNote":
    "Percentage points, per area. The axis stops at 0.08 pp so that the bars are visible at all.",
  "admin.gateB.deltaDomainLabel": "0.08 pp",
  "admin.gateB.deltaFootnote":
    "The largest difference is on the left target, 0.06 pp — one frame in roughly 1,700. The pass criterion requires AOI agreement ≥ 95%; here not one area misses by a tenth of a percentage point.",
  "admin.gateB.meterTitle": "Normalised median error",
  "admin.gateB.meterNote": "Coordinate distance between the two streams, divided by the screen diagonal.",
  "admin.gateB.meterDisplay": "0.040997",
  "admin.gateB.meterLimit": "Pass threshold ≤ 0.05",
  "admin.gateB.pairsTitle": "Outcome of the 30 recorded pairs",
  "admin.gateB.pairsNote":
    "Three pairs were withheld for signal quality, and are still counted in the valid pair rate rather than dropped from the denominator.",
  "admin.gateB.pairsReady": "Ready for analysis",
  "admin.gateB.pairsReadyUnit": "27 pairs",
  "admin.gateB.pairsHeld": "Withheld",
  "admin.gateB.tableCaption": "Area-of-interest distribution",
  "admin.gateB.colArea": "Area",
  "admin.gateB.crit1": "At least 30 pairs",
  "admin.gateB.crit2": "Valid pair rate ≥ 90%",
  "admin.gateB.crit3": "Normalised median error ≤ 0.05",
  "admin.gateB.crit4": "Mean AOI agreement ≥ 95%",
  "admin.gateB.crit5": "Primary AOI agreement ≥ 95%",
  "admin.gateB.critNote":
    "The conclusion is limited to agreement against WebGazer.js. It says nothing about ASD clinical accuracy.",
  "admin.gateB.noteTitle": "Every number is re-derived from raw coordinates",
  "admin.gateB.noteBody":
    "The published AOI agreement is the recomputed 99.7118%, not the 99.7574% stored in the summary file. The difference appears in 4 of 27 pairs and is published as-is rather than reconciled. The 13-feature ICC(A,1) of 0.505 is still reported as a descriptive metric, not a pass criterion.",

  // --- Gate C ----------------------------------------------------------
  "admin.gateC.title": "Prospective validation has not been carried out",
  "admin.gateC.lead":
    "A prospective study must compare Neurogaze against developmental assessment, M-CHAT, and expert diagnosis blinded to the Neurogaze score.",
  "admin.gateC.status": "Open",
  "admin.gateC.mScanpaths": "Scanpaths",
  "admin.gateC.mScanpathsNote": "640 × 480 images",
  "admin.gateC.mParticipants": "Participant IDs",
  "admin.gateC.mParticipantsNote": "Per-child data separation",
  "admin.gateC.mAuc": "Child-level AUC",
  "admin.gateC.mAucValue": "0.8819",
  "admin.gateC.mAucNote": "95% CI 0.774–0.968",
  "admin.gateC.mTarget": "Gate C target",
  "admin.gateC.mTargetValue": "87.8% / 80.8%",
  "admin.gateC.mTargetNote": "Perochon et al. 2023, tablet camera",
  "admin.gateC.aucTitle": "Child-level AUC, with its confidence interval",
  "admin.gateC.aucNote":
    "The filled point is the estimate, the bar is the 95% interval. The axis starts at chance, and the interval is wide because there are only 54 children.",
  "admin.gateC.aucFootnote":
    "This number comes from school-age children's scanpaths on a 250 Hz eye-tracker. It says something about that dataset, not about a toddler in front of a tablet camera.",
  "admin.gateC.legendInterval": "95% interval",
  "admin.gateC.legendPoint": "Point estimate",
  "admin.gateC.tickRandom": "0.50 · chance",
  "admin.gateC.tick75": "0.75",
  "admin.gateC.tick100": "1.00",
  "admin.gateC.intervalLabel": "Evaluation separates each child's data",
  "admin.gateC.intervalDisplay": "0.8819 · CI 0.774–0.968",
  "admin.gateC.dataTitle": "Data that is available",
  "admin.gateC.dataBody":
    "The initial model uses ASD/non-ASD scanpaths from school-age children, not a Posyandu toddler cohort. Evaluation with per-child data separation yields an OOF AUC of 0.8819 across 54 children — but the model takes raster images from a 250 Hz eye-tracker, and there is no legitimate way to reconstruct that input from a 30 fps camera.",
  "admin.gateC.linkPaper": "Carette et al. 2019 paper",
  "admin.gateC.linkDataset": "Dataset on Figshare",
  "admin.gateC.whyOpen": "Why it has not passed",
  "admin.gateC.why1": "No prospective toddlers aged 16–30 months yet",
  "admin.gateC.why2": "No independent, blinded clinical outcomes yet",
  "admin.gateC.why3": "Source mean age 7.88 years",
  "admin.gateC.why4": "Source device 250 Hz, not a tablet camera",
  "admin.gateC.why5": "No separate external site yet",
  "admin.gateC.why6": "A clinical threshold may not be set yet",
  "admin.gateC.cnnTitle": "The face CNN is not used",
  "admin.gateC.cnnBody":
    "MediaPipe is used only to locate the face and iris on-device. A face CNN reached AUC 0.932 — the highest number in this project — and was discarded: six of six governance metadata items were unavailable, there were no participant IDs, and a shortcut test showed that pixel statistics alone already reached 0.751 with a permutation p = 0.005.",

  // --- Gate C simulation -----------------------------------------------
  "admin.sim.title": "Service capacity simulation",
  "admin.sim.lead":
    "Change the cohort, prevalence, and technical coverage. Sensitivity and specificity are locked to the notebook results so the assumptions stay visible.",
  "admin.sim.badge": "Simulation only",
  "admin.sim.cohortSize": "Cohort size",
  "admin.sim.prevalence": "Target prevalence",
  "admin.sim.coverage": "Technical coverage",
  "admin.sim.sensitivity": "Candidate sensitivity",
  "admin.sim.sensitivityValue": "84.62",
  "admin.sim.specificity": "Candidate specificity",
  "admin.sim.specificityValue": "75.00",
  "admin.sim.threshold": "Notebook threshold",
  "admin.sim.thresholdValue": "0.476",
  "admin.sim.assessable": "Assessable",
  "admin.sim.withheld": "{count} sessions withheld",
  "admin.sim.referralRate": "Estimated referrals",
  "admin.sim.ofAssessed": "{count} of those assessed",
  "admin.sim.ppv": "PPV at this prevalence",
  "admin.sim.ppvNote": "Not an observed PPV",
  "admin.sim.perTruePositive": "Referrals per true positive",
  "admin.sim.perTruePositiveNote": "Projected service load",
  "admin.sim.matrixTitle": "Where this scenario places each child",
  "admin.sim.matrixNote":
    "Rows are the true state, columns are the rule's decision. The expensive cells are on the opposite diagonal.",
  "admin.sim.funnelTitle": "From cohort to correct referral",
  "admin.sim.funnelNote": "Each row is a subset of the row above it, drawn at the same scale.",
  "admin.sim.stepCohort": "Cohort",
  "admin.sim.stepAssessable": "Assessable",
  "admin.sim.stepReferred": "Referred",
  "admin.sim.stepCorrect": "Correct referrals",
  "admin.sim.ratioTitle": "The price of one correct referral",
  "admin.sim.ratioNote":
    "One dot, one referral. The green dot is the child the test was for; the rest are families asked to come back for no reason.",
  "admin.sim.ratioBody":
    "{ratio} referrals for each target case caught. That is the load a Puskesmas has to carry for every child who genuinely needs a follow-up examination.",
  "admin.sim.ratioUndefined":
    "In this scenario no target case is caught, so the ratio is undefined.",
  "admin.sim.ppvTitle": "PPV collapses as prevalence falls",
  "admin.sim.ppvCurveNote":
    "Sensitivity and specificity are locked; only prevalence moves. Hover to read other points on the curve.",
  "admin.sim.ppvFootnote":
    "This is why a clinical threshold cannot be set from AUC alone. The same test moves from useful to flooding a service purely because the cohort changed.",
  "admin.sim.interpretTitle": "Reading the current scenario",
  "admin.sim.interpretBody":
    "With {cohort} children, a prevalence of {prevalence}, and coverage of {coverage}, the arithmetic estimates that {referralRate} of assessable participants would be referred. PPV is estimated at {ppv}, which is why the count of wrong referrals needs to be a Gate C benchmark — this is not a study result, it is arithmetic over the assumptions visible above.",
  "admin.sim.foot":
    "The decimal figures are mathematical expected values, not counts of children actually examined.",

  // --- Gate D ----------------------------------------------------------
  "admin.gateD.title": "Field testing has not been carried out",
  "admin.gateD.lead":
    "The procedural basis is in the literature; what is missing is evidence that Posyandu kader can run it with the devices and service flow they actually have.",
  "admin.gateD.status": "Open",
  "admin.gateD.feasibility": "Evidence of procedural feasibility",
  "admin.gateD.body1":
    "Cilia et al. ran eye-tracking with children positioned flexibly about 60 cm from the screen — in a chair, on a parent's lap, or in a high chair — with minimal instruction and a five-point calibration. Carette et al. report that children could watch a stimulus sequence of about five minutes with calibration and verification.",
  "admin.gateD.body2":
    "Neurogaze adds quality checks, pause and stop controls, local processing, and withholding of results when the signal is invalid.",
  "admin.gateD.needed": "What the field work still needs",
  "admin.gateD.need1": "5 Posyandu",
  "admin.gateD.need2": "20 kader",
  "admin.gateD.need3": "200 child sessions",
  "admin.gateD.need4": "3 kinds of Android tablet",
  "admin.gateD.need5": "Real completion rates and durations",
  "admin.gateD.need6": "Report comprehension and parental acceptance",
  "admin.gateD.limitTitle": "Claim limits",
  "admin.gateD.limitBody":
    "Neither paper above tested kader, tablet cameras, offline mode, or the Neurogaze referral flow. Ease of use in the field therefore cannot be claimed.",

  // --- Positive control ------------------------------------------------
  "admin.pc.title": "Positive control: the instrument responds",
  "admin.pc.lead":
    "Give the instrument a signal known to be present, then check whether it responds. Recorded 19 August 2026 through the shipped app, then recomputed from the raw traces by a separate script.",
  "admin.pc.status": "Measured",
  "admin.pc.mParticipants": "Participants",
  "admin.pc.mParticipantsNote": "Adults, consenting for themselves",
  "admin.pc.mSessions": "Distinct sessions",
  "admin.pc.mSessionsNote": "Across 3 devices, 4 participants per device",
  "admin.pc.mPassed": "Met the quality criteria",
  "admin.pc.mPassedNote": "35% attrition, reported as it stands",
  "admin.pc.mFired": "Rule fired on ordinary viewing",
  "admin.pc.mFiredNote": "The single most important number in this table",
  "admin.pc.condOrdinary": "Ordinary viewing",
  "admin.pc.condProduced": "Produced pattern",
  "admin.pc.sigGeometric": "Geometric preference",
  "admin.pc.sigTrials": "Trials landing on target",
  "admin.pc.sigDispersion": "Gaze dispersion during the cue phase",
  "admin.pc.rangeTitle": "Distance between the two conditions, per signal",
  "admin.pc.rangeNote":
    "Each signal uses its own axis because the units differ. What to read is the width of the gap between the two bars, not the length of the bars.",
  "admin.pc.rangeFootnote":
    "All three gaps are fully open: not one ordinary session touches the range of the produced sessions on any signal.",
  "admin.pc.tableCaption": "Separation of each decision signal between the two behavioural conditions",
  "admin.pc.colSignal": "Signal",
  "admin.pc.colMargin": "Closest distance",
  "admin.pc.colP": "p",
  "admin.pc.noteTitle": "The column that matters is the closest distance, not AUC",
  "admin.pc.noteBody":
    "All three signals have AUC 1.00, but that only means no pair is out of order. The closest distance says how wide the gap is in that signal's own units: the ordinary session with the highest geometric preference sits at 0.73, the lowest produced session at 0.89.",
  "admin.pc.ruleTitle": "The composite rule",
  "admin.pc.ruleShippedLead": "As shipped",
  "admin.pc.ruleShippedBody":
    "— it fires in neither condition, and never could. The rule requires two deviant signals; geometric preference is unassessable for as long as the licensed clip is shorter than the protocol its threshold came from. The zero on both rows is a state of the rule, not a measurement about the participants.",
  "admin.pc.ruleDemoLead": "Demonstration mode",
  "admin.pc.ruleDemoBody":
    "— the same threshold applied to that short clip, purely so the question “does the rule respond” has an answer.",
  "admin.pc.dotsTitle": "Demonstration mode: one dot, one session",
  "admin.pc.dotsNote":
    "A filled dot means the rule fired on that session. The top row is the specificity question.",
  "admin.pc.dotsFootnote":
    "Nine ordinary viewing sessions, not one of which triggered the rule. Four of six produced sessions triggered it.",
  "admin.pc.fired": "Fired",
  "admin.pc.notFired": "Did not fire",
  "admin.pc.demoTableCaption": "Demonstration mode — not a referral, and must not be cited as one",
  "admin.pc.colCondition": "Condition",
  "admin.pc.claimTitle": "The top-left cell is the one that matters, and it is zero",
  "admin.pc.claimBody":
    "The rule does not fire on someone who is simply watching. One ordinary session did show a geometric preference of 0.73, above the threshold — and precisely because its second signal was normal, the rule did not fire. The two produced sessions that did not fire failed on an attention precondition, not on behaviour: neither ever looked at the model while the cue was given, so their cue signal was withheld.",
  // Quoted cells from research/hasil/kontrol_positif/ringkasan.json.
  "admin.pcRow1.ordinary": "0.34",
  "admin.pcRow1.ordinaryRange": "0.08–0.73",
  "admin.pcRow1.produced": "0.94",
  "admin.pcRow1.producedRange": "0.89–1.00",
  "admin.pcRow1.margin": "+0.16",
  "admin.pcRow1.p": "5.8 × 10⁻⁴",
  "admin.pcRow2.ordinary": "8 of 8",
  "admin.pcRow2.ordinaryRange": "5–8",
  "admin.pcRow2.produced": "0 of 8",
  "admin.pcRow2.producedRange": "0–1",
  "admin.pcRow2.margin": "4 trials",
  "admin.pcRow2.p": "6.3 × 10⁻⁴",
  "admin.pcRow3.ordinary": "0.31",
  "admin.pcRow3.ordinaryRange": "0.07–0.40",
  "admin.pcRow3.produced": "0.05",
  "admin.pcRow3.producedRange": "0.03–0.06",
  "admin.pcRow3.margin": "+0.008",
  "admin.pcRow3.p": "2.0 × 10⁻⁴",
  "admin.pcRange1.tick0": "0",
  "admin.pcRange1.tick1": "0.5",
  "admin.pcRange1.tick2": "1.0",
  "admin.pcRange2.tick0": "0",
  "admin.pcRange2.tick1": "4",
  "admin.pcRange2.tick2": "8",
  "admin.pcRange2.aDisplay": "5–8 of 8",
  "admin.pcRange2.bDisplay": "0–1 of 8",
  "admin.pcRange3.tick0": "0",
  "admin.pcRange3.tick1": "0.25",
  "admin.pcRange3.tick2": "0.50",

  "admin.pc.confoundHeading": "Confounds that have to be named",
  "admin.pc.confound1": "The geometric panel was always on the right",
  "admin.pc.confound1Body":
    "Across all 24 sessions, and the cue order was identical across all of them, because both counterbalancing schemes derive from an identity column that was filled in the same way. Geometric preference is therefore not separable from a look-right bias in this data.",
  "admin.pc.confound2": "Participant identity was not recorded",
  "admin.pc.confound2Body":
    "There is no paired analysis. The cross-validation group is the device, not the person — coarser than the protocol asks for, and stricter.",
  "admin.pc.confound3": "Condition order was not counterbalanced",
  "admin.pc.confound3Body":
    "Deliberately: the second condition's instruction cannot be un-given. Order effects therefore cannot be separated from condition effects.",
  "admin.pc.limitTitle": "What this data does not show",
  "admin.pc.limitBody":
    "Anything about autism. The participants are adults following a script, so there is no sensitivity, specificity, or accuracy in it. A logistic regression on the two signals reached an out-of-fold AUC of 1.00 across 13 sessions with device grouping — that is a sensitivity analysis, not a decision path, and weights fitted on adults following a script learn the script.",

  // --- GeoPref clip ----------------------------------------------------
  "admin.clip.title": "GeoPref clip validation",
  "admin.clip.lead":
    "The preferential-looking block carries the only published threshold in this system. Its asset is therefore inspected as a file rather than accepted as an asset.",
  "admin.clip.status": "Protocol abbreviated",
  "admin.clip.mVideo": "Video tracks",
  "admin.clip.mVideoNote": "avc1, 640 × 360, 502 frames",
  "admin.clip.mAudio": "Audio tracks",
  "admin.clip.mAudioNote": "Silent per protocol, not missing audio",
  "admin.clip.mDuration": "Duration",
  "admin.clip.mDurationValue": "16.75 s",
  "admin.clip.mDurationNote": "One fifth of the published 90-second protocol",
  "admin.clip.mLicense": "Licence",
  "admin.clip.mLicenseNote": "Moore et al. 2018, Additional file 2",
  "admin.clip.durationTitle": "What ships, against the protocol its threshold came from",
  "admin.clip.durationNote":
    "Clip length in seconds, at the same scale. What runs in the field is the topmost bar.",
  "admin.clip.legendShipped": "What ships",
  "admin.clip.legendPublished": "Published protocol",
  "admin.clip.durShipped": "Shipped",
  "admin.clip.durShippedSub": "Complex Social excerpt",
  "admin.clip.durShippedValue": "16.75 s",
  "admin.clip.durOriginal": "Original GeoPref",
  "admin.clip.durOriginalSub": "Wen et al. 2022",
  "admin.clip.durOriginalValue": "62.22 s",
  "admin.clip.durComplex": "Complex Social",
  "admin.clip.durComplexSub": "Moore et al. 2018",
  "admin.clip.durComplexValue": "90 s",
  "admin.clip.frameTitle": "How much of the frame is actually used",
  "admin.clip.frameNote":
    "The 640 × 360 frame drawn to scale. The two panels are the entire informative content; the rest is supplementary black box.",
  "admin.clip.panelSocial": "Social",
  "admin.clip.panelGeometric": "Geometric",
  "admin.clip.subtenseTitle": "The angle each panel subtends",
  "admin.clip.subtenseNote":
    "Drawn to scale on the target tablet. The dashed outline is the size Moore et al. report; the filled block is what the child actually sees.",
  "admin.clip.subtenseFootnote":
    "The app crops the black box, but cropping does not add pixels: the panel is still smaller than the one the threshold was derived on.",
  "admin.clip.subtenseReference": "Moore et al. · 12.9° × 9.1°",
  "admin.clip.subtenseShipped": "Shipped · 7.6° × 4.9°",
  "admin.clip.geometryTitle": "Panel geometry is checked per device",
  "admin.clip.geometryBody1Pre": "The social and geometric panels occupy only ",
  "admin.clip.geometryShare": "19.8%",
  "admin.clip.geometryBody1Post":
    " of the 640 × 360 frame; the rest is black, because the file is a supplementary illustration rather than a presentation master. Played whole, each panel subtends roughly 7.6° × 4.9° on the target tablet — far below the 12.9° × 9.1° Moore et al. report.",
  "admin.clip.geometryBody2Pre": "The app crops that black box, and ",
  "admin.clip.geometryBody2Post":
    " makes the geometry inspectable per device rather than assumed.",
  "admin.clip.deliberate": "Deliberate properties",
  "admin.clip.deliberate1Lead": "Silent.",
  "admin.clip.deliberate1Body": "Moore et al.'s method states there is no audio. Do not add a sound track.",
  "admin.clip.deliberate2Lead": "Letterboxed.",
  "admin.clip.deliberate2Body": "The black surround is cropped so the panel angle approaches the reported one.",
  "admin.clip.deliberate3Lead": "Geometric panel on the right.",
  "admin.clip.deliberate3Body": "Recorded to the session log, not assumed.",
  "admin.clip.assetsHeading": "Each asset carries its own operating point",
  "admin.clip.assetDuration": "Duration",
  "admin.clip.assetOperating": "Operating point",
  "admin.clip.asset1Title": "Complex Social excerpt",
  "admin.clip.asset1Duration": "16.75 s",
  "admin.clip.asset1Status": "Shipped",
  "admin.clip.asset1Operating": "No operational precedent",
  "admin.clip.asset1Note":
    "One of five public sample video scenes. That is why validatedProtocol is false and the 69% threshold is withheld.",
  "admin.clip.asset2Title": "Original 62.22-second GeoPref",
  "admin.clip.asset2Duration": "62.22 s",
  "admin.clip.asset2Status": "Requested",
  "admin.clip.asset2Operating": "Sensitivity 17% · specificity 98%",
  "admin.clip.asset2Note":
    "Wen et al. 2022, n=1,863, ages 12–48 months. This is the test the 69% threshold was actually validated on.",
  "admin.clip.asset3Title": "90-second Complex Social",
  "admin.clip.asset3Duration": "90 s",
  "admin.clip.asset3Status": "Requested",
  "admin.clip.asset3Operating": "Sensitivity 18% · specificity 97%",
  "admin.clip.asset3Note":
    "Moore et al. 2018, AUC 0.74. The 69% threshold is carried over as-is for consistency, not re-optimised.",
  "admin.clip.limitTitle": "Why the 69% threshold is withheld",
  "admin.clip.limitBody1":
    "That threshold was derived on a 62.22-second protocol and carried to a 90-second one. What ships is a 16.75-second excerpt of both — one fifth the length of the published protocol, with no operational precedent of its own. That is why ",
  "admin.clip.limitBody2":
    " is false, the threshold is withheld in the field, and a session reports the measured percentage while stating that its protocol was abbreviated. Demonstration mode applies it once, under a banner declaring itself a demonstration.",

  // --- Vector scene ----------------------------------------------------
  "admin.scene.title": "The vector scene is designed for screening, not entertainment",
  "admin.scene.lead":
    "Every second, object, and movement in the scene has a methodological reason. Stimulus {version}.",
  "admin.scene.status": "{seconds} seconds",
  "admin.scene.mDuration": "Total duration",
  "admin.scene.mDurationValue": "{seconds} seconds",
  "admin.scene.mDurationNote": "Without a speaker, the name-call block does not run",
  "admin.scene.mTrials": "Scored trials",
  "admin.scene.mTrialsNote": "4 cue types × left and right",
  "admin.scene.mPreCue": "Pre-cue epoch",
  "admin.scene.mPreCueValue": "1.7 seconds",
  "admin.scene.mPreCueNote": "No directional information whatsoever",
  "admin.scene.mResponse": "Response window",
  "admin.scene.mResponseValue": "3.3 seconds",
  "admin.scene.mResponseNote": "Gaze-following latency < 1.5 seconds",
  "admin.scene.trialHeading": "Structure of one trial · 5 seconds",
  "admin.scene.stripTitle": "One trial, drawn to its own timing",
  "admin.scene.stripNote":
    "The width of each block is proportional to its duration. Cue onset separates the genuinely neutral pre-cue epoch from the window counted as a response.",
  "admin.scene.stripFootnote":
    "All three numbers in this strip are read from the protocol module, not retyped on this page.",
  "admin.scene.bandRest": "Rest",
  "admin.scene.bandOstensive": "Ostensive signal",
  "admin.scene.bandResponse": "Response window",
  "admin.scene.secondsUnit": "{value} s",
  "admin.scene.markerOstensive": "{value} s · ostensive",
  "admin.scene.markerCue": "{value} s · directional cue",
  "admin.scene.tl1Time": "0.0–1.2 s",
  "admin.scene.tl1Title": "Rest",
  "admin.scene.tl1Note":
    "The model looks down at the table. Hands below the table edge, no direction at all.",
  "admin.scene.tl2Time": "1.2 s",
  "admin.scene.tl2Title": "Ostensive signal",
  "admin.scene.tl2Note":
    "Head lifts, eye contact, eyebrows raise, a smile. An invitation before any cue.",
  "admin.scene.tl3Time": "1.7 s",
  "admin.scene.tl3Title": "Directional cue",
  "admin.scene.tl3Note":
    "The face returns to neutral. The eyes move first, the head follows, the hand last.",
  "admin.scene.tl4Time": "1.7–5.0 s",
  "admin.scene.tl4Title": "Response window",
  "admin.scene.tl4Note":
    "The scene freezes. All gaze in this period is counted as the response.",
  "admin.scene.whyOstensive": "Why an ostensive signal has to come first",
  "admin.scene.whyOstensiveBody":
    "Young children follow gaze mainly after receiving a communicative signal — eye contact, raised eyebrows, a greeting. Without that invitation, a child who does not follow the gaze has not necessarily shown anything; they may simply not have felt invited.",
  "admin.scene.whyVector": "Why vectors, not a video recording",
  "admin.scene.whyVectorBody":
    "The scene is drawn as SVG and animated with CSS. Cue onset therefore lands on exactly the millisecond the protocol declares, on every tablet, without drifting because of dropped frames or a different decoder. The asset is small, runs fully offline, and carries none of the licensing or privacy problems of a recorded actor.",
  "admin.scene.designSource": "Design source",
  "admin.scene.designSourceBody1Pre": "The trial structure follows the ",
  "admin.scene.designSourceEm": "responding joint attention",
  "admin.scene.designSourceBody1Post":
    " paradigm used with toddlers: a female model sits behind a table with two identical objects, first looking down, then meeting the camera and greeting, then turning her head towards one object while staying still and neutral in expression.",
  "admin.scene.designSourceBody2Pre": "The supplementary video for that paradigm (Billeci et al.) is kept in the repository at ",
  "admin.scene.designSourceBody2Post": " and was used as a direct reference when composing the scene sequence.",
  "admin.scene.construct": "The construct being measured",
  "admin.scene.constructBody":
    "A reduced response to invitations to share attention is one of the earliest-appearing and most consistently reported behavioural differences in children with ASD. Cilia et al. found a pointing gesture accompanied by head orientation to be the strongest target cue — that is what is replicated here.",
  "admin.scene.omittedHeading": "What is deliberately left out of the scene",
  "admin.scene.limitTitle": "Claim limits on the stimulus design",
  "admin.scene.limitBody":
    "A well-grounded design does not make its output a diagnosis. This battery is not GeoPref and is not a clinically validated instrument; its status is a testable research stimulus. Its validity is decided by Gate C, not by the quality of the design on this page. Any change to the scene or its timing must raise the stimulus version, because older results are no longer comparable.",

  // --- Chart primitives ------------------------------------------------
  "chart.threshold": "Threshold {value}",
  "chart.donutAria": "Composition: {parts}",
  "chart.donutPart": "{label} {value}%",
  "chart.matrixReferred": "Referred",
  "chart.matrixNotReferred": "Not referred",
  "chart.matrixTarget": "Target",
  "chart.matrixNotTarget": "Not a target",
  "chart.matrixCaught": "caught",
  "chart.matrixMissed": "missed",
  "chart.matrixWrong": "wrong referral",
  "chart.matrixCorrect": "correctly not referred",
  "chart.ppvAria":
    "Positive predictive value falls from {high} at a prevalence of {highPrev} to {low} at a prevalence of {lowPrev}.",
  "chart.ppvAxis": "prevalence",
  "chart.ppvRead": "PPV at a prevalence of {prevalence}",
  "chart.ppvCursor": "cursor position",
  "chart.ppvCurrent": "current scenario",
  "chart.frameAria":
    "Two panels occupy {share}% of the 640 by 360 frame; the rest is a black box.",
  "chart.frameUsed": "640 × 360 · {share}% used",
  "chart.subtenseAria":
    "The shipped panel subtends {shippedW} by {shippedH} degrees, against {refW} by {refH} degrees in the published protocol.",
  "chart.bandTitle": "{label}: {from}–{to} s",
  "chart.trialEnd": "{value} s",

  // --- Design choices --------------------------------------------------
  "admin.choice1": "Two identical objects",
  "admin.choice1Body":
    "Different objects let a child simply prefer one of them. Identical ones leave the social cue as the only discriminator.",
  "admin.choice2": "The objects never move",
  "admin.choice2Body":
    "Movement draws gaze reflexively. Still objects ensure that what is measured is the response to the invitation.",
  "admin.choice3": "A genuinely neutral pre-cue",
  "admin.choice3Body":
    "The model looks down, hands below the table. There is no left-right information before onset, so the pre-cue baseline is legitimate.",
  "admin.choice4": "Dark pupils on light sclera",
  "admin.choice4Body":
    "The usual eye contrast polarity carries the gaze-following effect; reversed polarity is far weaker. Enforced by a contract test, not a style preference.",
  "admin.choice5": "The eyes genuinely move",
  "admin.choice5Body":
    "The eyeballs shift 16 px at onset, a 240 ms transition delayed by 50 ms — the eyes leave before the head and hand, the way a human cue does.",
  "admin.choice6": "Ostensive first, direction second",
  "admin.choice6Body":
    "Infants follow gaze after a communicative signal, not after an animation that merely attracts attention.",
  "admin.choice7": "The cue is a state change",
  "admin.choice7Body":
    "A looping animation becomes a movement source in its own right. Here the cue is a single pose change on the millisecond the protocol declares.",
  "admin.choice8": "The cue block is silent",
  "admin.choice8Body":
    "The directional trials are deliberately mute so that what is measured is gaze alone. Response to name is measured in its own block.",
  "admin.choice9": "Order is counterbalanced per session",
  "admin.choice9Body":
    "A fixed left-right order lets a child who is merely scanning score like a child who is genuinely following. The order is randomised from the session id, not chosen by the operator.",
  "admin.choice10": "The only idle motion is breathing and blinking",
  "admin.choice10Body":
    "A frozen face reads as dead and loses attention. Blinks and breathing are symmetrical and centred, so they do not pull gaze to one side.",
};
