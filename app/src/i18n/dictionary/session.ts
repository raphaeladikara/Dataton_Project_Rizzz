/**
 * The session itself: consent, child preparation, tutorial, device check,
 * calibration, sanity check, stimulus, and the quality gate.
 *
 * Several strings here vary by session purpose — a Gate A device audit, a Gate
 * B WebGazer bridge, a stage demonstration, and an ordinary field session ask
 * for consent to four different things. The variants are separate keys rather
 * than one string with a slot, because the sentences differ in more than a
 * noun and a translator needs to see each one whole.
 */
export const id = {
  // --- Consent ---------------------------------------------------------
  "consent.step": "Langkah 1",
  "consent.purpose.gateB": "Gate B WebGazer",
  "consent.purpose.gateA": "Gate A engineering",
  "consent.purpose.stageDemo": "peragaan panggung",
  "consent.purpose.field": "profil pseudonim",
  "consent.title.gateB": "Siapkan satu sesi pembanding WebGazer.",
  "consent.title.gateA": "Siapkan satu sesi uji perangkat.",
  "consent.title.stageDemo": "Siapkan peragaan panggung.",
  "consent.title.field": "Persetujuan sebelum pengukuran.",
  "consent.lead.gateB":
    "Gunakan ID pseudonim dan ID pasangan yang sama pada dua aliran browser. Sesi ini mengukur agreement, bukan ASD.",
  "consent.lead.gateA":
    "Gunakan peserta dewasa dan ID pseudonim. Sesi ini hanya mengukur kinerja kamera, bukan ASD.",
  "consent.lead.stageDemo":
    "Peserta dewasa yang menyetujui untuk dirinya sendiri. Alur, kalibrasi, dan gerbangnya sama persis dengan sesi Posyandu; bedanya ambang 69% diterapkan supaya bentuk laporannya terlihat, dan sesinya tetap tidak mengeluarkan rujukan.",
  "consent.lead.field": "Jangan masukkan nama lengkap, NIK, alamat, atau foto identitas.",

  "consent.field.participantId": "ID peserta pseudonim",
  "consent.field.childId": "ID anak pseudonim",
  "consent.field.childIdPlaceholder": "Contoh: NG-0042",
  "consent.field.sessionKind": "Jenis sesi",
  "consent.field.age": "Usia (bulan)",
  "consent.field.agePlaceholder": "Contoh: 24",
  "consent.field.site": "Lokasi layanan",
  "consent.field.sitePlaceholder": "Contoh: Posyandu Melati 3",
  "consent.field.operator": "ID operator",
  "consent.field.operatorPlaceholder": "Contoh: Kader-07",
  "consent.field.attempt": "Percobaan ke-",
  "consent.field.attemptHint":
    "Maksimal {max} per peserta per kondisi. Sesudah itu peserta dicatat tidak dapat dinilai.",
  "consent.field.speakerBehind": "Pakai speaker di belakang peserta",
  "consent.field.speakerBehindHint":
    "Tanpa ini panggilan nama tidak dibunyikan sama sekali dan indeksnya dicatat tidak terukur. Sinyalnya dikarantina dari aturan komposit di kedua mode.",
  "consent.field.viewingDistance": "Jarak mata–layar (mm)",
  "consent.field.viewingDistanceHint": "Diukur sekali dengan meteran, bukan ditaksir.",

  "consent.option.engineering": "Dewasa · validasi engineering",
  "consent.option.controlOrdinary": "Kontrol positif · kondisi 1 menonton biasa",
  "consent.option.controlProduced": "Kontrol positif · kondisi 2 pola diproduksi",

  "consent.bridge.aria": "Metadata pasangan Gate B",
  "consent.bridge.title": "Kontrak pasangan",
  "consent.bridge.hint": "Nilai ini harus identik pada aliran Neurogaze dan WebGazer.",
  "consent.bridge.tag": "Gate B · riset",
  "consent.bridge.reference": "Referensi",
  "consent.bridge.acquisition": "Metode akuisisi",
  "consent.bridge.acquisitionValue": "Aliran browser simultan",
  "consent.bridge.order": "Urutan",
  "consent.bridge.orderValue": "Simultan",
  "consent.bridge.screenWidth": "Lebar layar (mm)",
  "consent.bridge.screenHeight": "Tinggi layar (mm)",

  "consent.name.participant": "peserta",
  "consent.name.child": "anak",
  "consent.name.toggleLead": "Panggil nama {who} lewat tablet.",
  "consent.name.toggleBody":
    "Biarkan mati bila Anda ingin memanggil sendiri; panggilan lalu dicatat sebagai tidak dibunyikan, bukan sebagai {who} yang tidak menoleh.",
  "consent.name.inputLabel": "Nama panggilan {who}",
  "consent.name.inputPlaceholder": "Untuk dipanggil saat tes",
  "consent.name.inputHintBase": "Tidak disimpan, tidak masuk log, hilang saat sesi selesai.",
  "consent.name.inputHintControl":
    "Dipakai untuk membunyikan panggilan lewat speaker; hasilnya tetap indeks deskriptif, bukan sinyal keputusan.",
  "consent.name.inputHintField": "Nama hanya hidup di memori selama sesi berjalan.",

  "consent.agree.participant": "Persetujuan peserta diberikan.",
  "consent.agree.service": "Persetujuan layanan diberikan.",
  "consent.agree.gateB":
    "Peserta menyetujui perekaman dua aliran gaze browser dan dapat menghentikan studi kapan saja.",
  "consent.agree.gateA":
    "Peserta memahami bahwa sesi hanya mengaudit perangkat dan dapat dihentikan kapan saja.",
  "consent.agree.stageDemo":
    "Peserta dewasa menyetujui untuk dirinya sendiri, memahami bahwa ini peragaan dan bukan penilaian atas dirinya, dan dapat berhenti kapan saja.",
  "consent.agree.field":
    "Pengasuh memahami bahwa Neurogaze bukan diagnosis dan persetujuan dapat ditarik.",
  "consent.research.requiredLead": "Wajib untuk Gate B:",
  "consent.research.optionalLead": "Opsional:",
  "consent.research.gateB":
    "izinkan ekspor koordinat gaze bersih bertimestamp. Video dan landmark wajah tetap tidak disimpan.",
  "consent.research.other":
    "tandai log teknis pseudonim sebagai layak dipakai untuk riset. Log hanya berada di memori sampai operator mengunduhnya.",
  "consent.blockers": "Lengkapi dulu: {issues}",
  "consent.next.device": "Lanjut periksa perangkat",
  "consent.next.demo": "Lanjut peragaan",
  "consent.next.child": "Lanjut persiapan anak",

  // --- Preparation -----------------------------------------------------
  "prep.eyebrow": "Persiapan anak",
  "prep.title": "Buat anak nyaman sebelum mulai.",
  "prep.lead": "Tidak perlu meminta anak menatap titik atau memberi jawaban tertentu.",
  "prep.step1": "Dudukkan anak dengan nyaman",
  "prep.step1Hint": "Boleh di pangkuan orang tua selama wajah tetap terlihat.",
  "prep.step2": "Letakkan tablet sejajar wajah",
  "prep.step2Hint": "Gunakan penyangga agar layar tidak banyak bergerak.",
  "prep.step3": "Biarkan respons berlangsung alami",
  "prep.step3Hint": "Jangan menunjuk, menyebut warna, atau mengarahkan pandangan.",
  "prep.step4": "Berhenti bila anak tidak nyaman",
  "prep.step4Hint": "Tes dapat diulang di lain waktu.",
  "prep.next": "Lihat tutorial singkat",

  // --- Tutorial --------------------------------------------------------
  "tutorial.eyebrow": "Panduan · 24 detik",
  "tutorial.title": "Siapkan anak dengan tenang.",
  "tutorial.lead": "Panduan ini untuk pendamping. Anak cukup duduk nyaman.",

  // --- Device check ----------------------------------------------------
  "device.eyebrow": "Pemeriksaan kamera dan posisi",
  "device.title.replay": "Siapkan demo tanpa kamera.",
  "device.title.live": "Posisikan wajah di dalam kotak.",
  "device.lead.replay": "Replay memakai data contoh untuk memperlihatkan alur lengkap.",
  "device.lead.live":
    "Sejajarkan tablet dengan wajah anak. Sistem akan memberi petunjuk sederhana bila posisi belum pas.",
  "device.previewAria": "Pratinjau kamera depan",
  "device.status.passed": "Siap",
  "device.status.failed": "Perlu diperbaiki",
  "device.status.checking": "Memeriksa",
  "device.status.idle": "Menunggu",
  "device.introTitle": "Selesaikan yang ditandai merah",
  "device.introHint": "Sistem akan mengecek ulang setelah posisi diperbaiki.",
  "device.checkFace": "Wajah terlihat",
  "device.checkFaceHint": "Wajah terdeteksi tanpa menampilkan koordinat mata",
  "device.checkFaceUnchecked": "Belum diperiksa",
  "device.checkFaceOk": "Terlihat",
  "device.checkFaceBad": "Atur posisi",
  "device.checkLight": "Pencahayaan cukup",
  "device.checkLightHint": "Hindari cahaya kuat dari belakang",
  "device.checkLightOk": "Cukup",
  "device.checkLightBad": "Perbaiki cahaya",
  "device.checkDistance": "Posisi sudah pas",
  "device.checkDistanceHint": "Geser tablet lebih dekat atau jauh bila diminta",
  "device.checkDistanceNear": "Lebih dekat",
  "device.checkDistanceFar": "Lebih jauh",
  "device.checkDistanceOk": "Sudah pas",
  "device.checkFacing": "Anak menghadap layar",
  "device.checkFacingHint": "Pastikan wajah tidak tertutup",
  "device.checkFacingOk": "Siap",
  "device.checkFacingBad": "Arahkan ke layar",
  "device.checking": "Memeriksa…",
  "device.runCheck": "Jalankan pemeriksaan",
  "device.startCalibration": "Mulai kalibrasi",
  "device.techSummary": "Detail teknis untuk operator",
  "device.tech.mode": "Mode",
  "device.tech.modeGateB": "Gate B berpasangan · tanpa skor",
  "device.tech.modeGateA": "Gate A dewasa · tanpa skor",
  "device.tech.modeLive": "Riset kamera · tanpa skor",
  "device.tech.modeReplay": "Simulasi tetap",
  "device.tech.landmarks": "Lokalisasi wajah/iris",
  "device.tech.landmarksValue": "MediaPipe Face Landmarker · 478 landmark · CPU lokal",
  "device.tech.iris": "Validasi iris",
  "device.tech.irisValue": "indeks pusat 468/473 · di dalam mata · konsisten binokular",
  "device.tech.overlay": "Overlay kamera",
  "device.tech.overlayValue": "crop `cover` + mirror dikoreksi terhadap resolusi asli",
  "device.tech.replayModel": "Model replay",
  "device.tech.loading": "Memuat…",
  "device.tech.liveClassification": "Klasifikasi langsung",
  "device.tech.liveClassificationValue": "dinonaktifkan; model lama hanya digunakan untuk replay",
  "device.tech.camera": "Kamera",
  "device.tech.faceCoverage": "Cakupan wajah",

  // --- Tracking overlay copy -------------------------------------------
  "tracking.noFace": "Wajah belum terbaca",
  "tracking.noFaceHint": "Hadapkan wajah ke kamera dan pastikan tidak terhalang.",
  "tracking.blink": "Mata sedang tertutup",
  "tracking.blinkHint": "Tunggu mata terbuka; tidak perlu menatap kamera.",
  "tracking.pose": "Kepala terlalu miring",
  "tracking.poseHint": "Tegakkan kepala dan hadapkan wajah ke layar.",
  "tracking.iris": "Posisi iris tidak konsisten",
  "tracking.irisHint": "Buka kedua mata, kurangi pantulan kacamata, dan hadapkan wajah lurus.",
  "tracking.unclear": "Mata belum terbaca jelas",
  "tracking.unclearHint": "Kurangi pantulan pada kacamata atau tambah cahaya dari depan.",
  "tracking.ok": "Landmark iris terbaca",
  "tracking.okHint": "Penanda hijau menunjukkan deteksi iris; akurasinya diuji pada kalibrasi.",

  // --- Calibration -----------------------------------------------------
  "calib.step": "Langkah {number} dari {total}",
  "calib.hudTitle": "Kalibrasi layar penuh",
  "calib.finalCheck": "Pengecekan terakhir",
  "calib.position": "Posisi {index} dari {total}",
  "calib.stable": "Sudah terbaca",
  "calib.waiting": "Tunggu sebentar",
  "calib.hudHint": "Anak cukup melihat gambar",
  "calib.exit": "Keluar",
  "calib.previewAria": "Pratinjau mata sebelum kalibrasi",
  "calib.eyebrow": "Kalibrasi ramah anak",
  "calib.title.technical": "Kalibrasi teknis untuk pengujian.",
  "calib.title.child": "Ayo lihat gambar-gambar lucu!",
  "calib.lead.technical":
    "Mode sembilan titik ini hanya tersedia untuk developer dan studi engineering.",
  "calib.lead.child": "Tidak perlu menyentuh layar. Cukup biarkan anak menonton.",
  "calib.brief1": "Apa yang terjadi?",
  "calib.brief1Technical": "Sembilan titik muncul untuk pengujian teknis.",
  "calib.brief1Child": "Satu karakter muncul otomatis di lima posisi.",
  "calib.brief2": "Apa tugas anak?",
  "calib.brief2Body":
    "Cukup menonton. Jangan menunjuk atau meminta anak melihat ke arah tertentu.",
  "calib.brief3": "Kapan selesai?",
  "calib.brief3Body": "Sistem berpindah otomatis setelah pandangan cukup terbaca.",
  "calib.truth.gateB": "Ini perekaman agreement Gate B terhadap WebGazer.",
  "calib.truth.gateA": "Ini hanya untuk peserta dewasa Gate A.",
  "calib.truth.engineeringBody":
    "Kalibrasi 9 titik belum tervalidasi untuk anak 16–30 bulan dan tidak boleh dipakai pada anak sebelum protokol pasif serta persetujuan etik tersedia.",
  "calib.truth.simLead": "Ini simulasi dengan hasil yang selalu sama.",
  "calib.truth.simBody": "Hasilnya tidak mengukur kemampuan perangkat atau peserta nyata.",
  "calib.glassesHint":
    "Bila berkacamata, hindari pantulan jendela atau lampu tepat di depan lensa.",
  "calib.start": "Mulai {what}",
  "calib.startTechnical": "9 titik teknis",
  "calib.startChild": "5 gambar",
  "calib.driftLabel": "KOREKSI DRIFT · TATAP TENGAH",
  "calib.resultReady": "Siap digunakan",
  "calib.resultNotReady": "Belum terbaca",
  "calib.resultReadyHint": "Kalibrasi cukup untuk dilanjutkan",
  "calib.resultNotReadyHint": "Mari coba lagi",
  "calib.limitReached": "Batas percobaan tercapai",
  "calib.whyFailed": "Kenapa belum berhasil",
  "calib.stopResearch": "Hentikan pengulangan. Unduh log diagnostik lalu akhiri tes.",
  "calib.stopOther": "Hentikan pengulangan. Unduh log analisis lalu akhiri tes.",
  "calib.retryOnce": "Ulangi sekali",
  "calib.techSummary": "Detail teknis kalibrasi",
  "calib.diagnosticsAria": "Diagnostik kalibrasi",
  "calib.metricCoverage": "Cakupan titik",
  "calib.metricSamples": "Sampel grid/pusat",
  "calib.metricRange": "Rentang sinyal X/Y",
  "calib.metricRmse": "RMSE training",
  "calib.metricGridError": "Median galat grid · batas {limit}°",
  "calib.metricDrift": "Drift pusat dikoreksi",
  "calib.downloadAnalysis": "Unduh log analisis",
  "calib.downloadDiagnostic": "Unduh log diagnostik",
  "calib.endTest": "Akhiri tes",
  "calib.next": "Periksa arah pandangan",
  "calib.fromRecording": "Memakai kalibrasi dari rekaman {label}.",
  "calib.replayDefault": "Replay memakai kalibrasi deterministik bawaan.",
  "calib.notReady": "Kamera atau model wajah belum siap. Ulangi pemeriksaan perangkat.",
  "calib.retryStatus": "Belum terbaca, mari coba lagi.",
  "calib.readyStatus": "Siap digunakan.",

  // --- Calibration recovery advice -------------------------------------
  "calibFix.stability": "Landmark iris bergerak saat tatapan diam",
  "calibFix.stabilityAction":
    "Miringkan sumber cahaya atau kacamata sedikit agar pantulan berkurang, lalu jaga kepala tetap saat tiap titik dikumpulkan.",
  "calibFix.rangeY": "Gerakan mata atas–bawah belum terbaca",
  "calibFix.rangeYAction":
    "Naikkan kamera sejajar mata. Saat titik bergerak, ikuti dengan mata—bukan dengan kepala.",
  "calibFix.rangeX": "Gerakan mata kiri–kanan belum terbaca",
  "calibFix.rangeXAction":
    "Dekatkan perangkat sedikit dan pastikan mata mengikuti titik sampai ke sisi layar.",
  "calibFix.coverage": "Beberapa titik kehilangan mata",
  "calibFix.coverageAction":
    "Pastikan wajah tidak keluar dari bingkai. Lepaskan benda yang menutupi mata lalu ulangi.",
  "calibFix.pose": "Kepala terlalu banyak bergerak",
  "calibFix.poseAction":
    "Gunakan dudukan perangkat dan minta peserta menggerakkan mata saja.",
  "calibFix.rmse": "Pemetaan gaze belum cocok untuk sesi ini",
  "calibFix.rmseAction":
    "Ini bukan kesalahan peserta. Ulangi paling banyak satu kali; bila tetap gagal, lanjutkan hanya sebagai uji sinyal tanpa skor atau hentikan sesi.",
  "calibFix.generic": "Kalibrasi belum cukup akurat",
  "calibFix.genericAction":
    "Jaga jarak 40–50 cm, sejajarkan kamera dengan mata, lalu ulangi satu kali.",

  // --- Sanity check ----------------------------------------------------
  "sanity.eyebrow": "Pengecekan singkat setelah kalibrasi",
  "sanity.title.blocked": "Tes belum dapat dilanjutkan",
  "sanity.title.failed": "Arah pandangan belum terbaca",
  "sanity.title.ready": "Mari lihat satu gambar lagi.",
  "sanity.lead.blocked":
    "Sistem belum dapat membaca arah pandangan dengan cukup baik. Hasil tidak akan dibuat agar tidak menyesatkan.",
  "sanity.lead.failed":
    "Kamera dapat melihat mata, tetapi belum dapat menentukan bagian layar yang sedang dilihat.",
  "sanity.lead.ready":
    "Karakter akan muncul di kiri, tengah, lalu kanan. Anak cukup menonton seperti biasa.",
  "sanity.characterAria": "Karakter di {side}",
  "sanity.side.left": "kiri",
  "sanity.side.right": "kanan",
  "sanity.side.center": "tengah",
  "sanity.passedLabel": "Arah pandangan terbaca",
  "sanity.readyLabel": "Siap memeriksa tiga posisi",
  "sanity.noticeBlocked": "Hasil tidak akan dibuat",
  "sanity.noticeRetry": "Mari perbaiki lalu coba lagi",
  "sanity.noticeBody":
    "Pastikan wajah lurus, kamera sejajar mata, dan tidak ada pantulan kuat pada kacamata. Ini bukan hasil risiko anak.",
  "sanity.checking": "Memeriksa…",
  "sanity.retryCalibration": "Ulangi kalibrasi",
  "sanity.start": "Mulai pengecekan",
  "sanity.backToDevice": "Kembali ke pemeriksaan posisi",
  "sanity.next": "Lanjut ke stimulus",

  // --- Progress rail ---------------------------------------------------
  "rail.current": "Langkah saat ini",
  "rail.next": "Berikutnya: {label}",
  "rail.last": "Tahap terakhir",
  "rail.consent": "Persetujuan",
  "rail.consentHint": "Izin orang tua",
  "rail.preparation": "Persiapan",
  "rail.preparationHint": "Anak nyaman",
  "rail.tutorial": "Tutorial",
  "rail.tutorialHint": "Panduan singkat",
  "rail.device": "Posisi",
  "rail.deviceHint": "Kamera dan cahaya",
  "rail.calibration": "Kalibrasi",
  "rail.calibrationHint": "5 gambar menarik",
  "rail.sanity": "Cek arah",
  "rail.sanityHint": "Kiri, tengah, kanan",
  "rail.stimulus": "Stimulus",
  "rail.stimulusHint": "Adegan perhatian",
  "rail.quality": "Pemeriksaan",
  "rail.qualityHint": "Kualitas rekaman",
  "rail.report": "Laporan",
  "rail.reportHint": "Kesimpulan & tindakan",

  /* --- Operational status -----------------------------------------------
     These are held in component state while a screen is open, so they are
     stored as keys rather than as finished sentences. Storing the sentence
     would freeze it in whichever language was active when the check ran, and
     the status line would then sit there in the wrong language until the next
     check overwrote it. */
  "device.msgUnchecked": "Belum diperiksa",
  "device.msgLoading": "Memuat pemeriksaan wajah lokal…",
  "device.msgReady": "Kamera siap. Wajah dan kedua mata terbaca dengan pencahayaan yang cukup.",
  "device.msgUnstable":
    "Posisi belum stabil. Ikuti petunjuk yang ditandai merah lalu periksa lagi.",
  "device.msgReplayReady": "Replay lokal siap · aset model tersedia · tanpa unggah media",
  "device.msgCameraLost": "Kamera terputus. Ulangi pemeriksaan perangkat.",
  "device.failFaceLost": "Wajah sering hilang dari kamera.",
  "device.failTooDark": "Wajah terlalu gelap; tambah cahaya dari depan.",
  "device.failTooBright":
    "Cahaya terlalu terang; hindari lampu atau jendela tepat di belakang kamera.",
  "device.failTooFar": "Wajah terlalu jauh; dekatkan hingga berada di dalam bingkai.",
  "device.failTooClose": "Wajah terlalu dekat; mundur sedikit dari kamera.",
  "device.failLowRes": "Resolusi kamera terlalu rendah.",
  "device.panelNotReady": "Panel kamera belum siap.",

  "camera.permission_denied":
    "Izin kamera ditolak. Buka izin kamera untuk situs ini di pengaturan browser, lalu coba lagi.",
  "camera.camera_not_found":
    "Kamera tidak ditemukan. Sambungkan atau aktifkan kamera depan, lalu coba lagi.",
  "camera.camera_busy":
    "Kamera sedang dipakai aplikasi lain. Tutup aplikasi atau tab yang memakai kamera, lalu coba lagi.",
  "camera.insecure_context":
    "Kamera memerlukan HTTPS atau http://localhost. Buka halaman ini melalui koneksi HTTPS, lalu coba lagi.",
  "camera.unsupported_browser":
    "Browser atau WebView ini tidak mendukung akses kamera. Buka halaman di Chrome, Edge, atau Safari versi terbaru, lalu coba lagi.",
  "camera.unsupported_constraints":
    "Kemampuan kamera tidak memenuhi kebutuhan resolusi sesi ini. Pilih kamera lain atau periksa pengaturan resolusi perangkat, lalu coba lagi.",
  "camera.request_timeout":
    "Kamera tidak merespons dalam 12 detik. Periksa izin dan koneksi kamera, lalu coba lagi.",
  "camera.request_interrupted":
    "Permintaan kamera terhenti sebelum selesai. Coba lagi; jika berulang, muat ulang halaman.",
  "camera.unknown":
    "Kamera belum dapat dibuka. Periksa izin kamera, tutup aplikasi lain yang memakai kamera, lalu coba lagi.",

  "model.unavailable": "Model tidak tersedia",
  "model.loadFailed": "Model lokal gagal dimuat.",
  "model.notLoadedAtStart": "Model lokal belum selesai dimuat saat sesi dimulai.",

  "confirm.deleteLog":
    "Hapus log sesi ini dari memori? Tindakan ini tidak dapat dibatalkan.",
} as const;

export const en: Record<keyof typeof id, string> = {
  // --- Consent ---------------------------------------------------------
  "consent.step": "Step 1",
  "consent.purpose.gateB": "Gate B WebGazer",
  "consent.purpose.gateA": "Gate A engineering",
  "consent.purpose.stageDemo": "stage demonstration",
  "consent.purpose.field": "pseudonymous profile",
  "consent.title.gateB": "Set up one WebGazer comparison session.",
  "consent.title.gateA": "Set up one device test session.",
  "consent.title.stageDemo": "Set up the stage demonstration.",
  "consent.title.field": "Consent before measurement.",
  "consent.lead.gateB":
    "Use the same pseudonymous ID and pair ID on both browser streams. This session measures agreement, not ASD.",
  "consent.lead.gateA":
    "Use an adult participant and a pseudonymous ID. This session measures camera performance only, not ASD.",
  "consent.lead.stageDemo":
    "An adult participant consenting for themselves. The flow, calibration, and gate are identical to a Posyandu session; the difference is that the 69% threshold is applied so the report's shape becomes visible, and the session still issues no referral.",
  "consent.lead.field": "Do not enter a full name, national ID number, address, or identity photo.",

  "consent.field.participantId": "Pseudonymous participant ID",
  "consent.field.childId": "Pseudonymous child ID",
  "consent.field.childIdPlaceholder": "e.g. NG-0042",
  "consent.field.sessionKind": "Session type",
  "consent.field.age": "Age (months)",
  "consent.field.agePlaceholder": "e.g. 24",
  "consent.field.site": "Service location",
  "consent.field.sitePlaceholder": "e.g. Posyandu Melati 3",
  "consent.field.operator": "Operator ID",
  "consent.field.operatorPlaceholder": "e.g. Kader-07",
  "consent.field.attempt": "Attempt number",
  "consent.field.attemptHint":
    "At most {max} per participant per condition. Beyond that the participant is recorded as not assessable.",
  "consent.field.speakerBehind": "Speaker placed behind the participant",
  "consent.field.speakerBehindHint":
    "Without this the name call is never played and its index is recorded as not measured. The signal is quarantined from the composite rule in both modes.",
  "consent.field.viewingDistance": "Eye-to-screen distance (mm)",
  "consent.field.viewingDistanceHint": "Measured once with a tape, not estimated.",

  "consent.option.engineering": "Adult · engineering validation",
  "consent.option.controlOrdinary": "Positive control · condition 1, ordinary viewing",
  "consent.option.controlProduced": "Positive control · condition 2, produced pattern",

  "consent.bridge.aria": "Gate B pair metadata",
  "consent.bridge.title": "Pair contract",
  "consent.bridge.hint": "These values must be identical on the Neurogaze and WebGazer streams.",
  "consent.bridge.tag": "Gate B · research",
  "consent.bridge.reference": "Reference",
  "consent.bridge.acquisition": "Acquisition method",
  "consent.bridge.acquisitionValue": "Simultaneous browser streams",
  "consent.bridge.order": "Order",
  "consent.bridge.orderValue": "Simultaneous",
  "consent.bridge.screenWidth": "Screen width (mm)",
  "consent.bridge.screenHeight": "Screen height (mm)",

  "consent.name.participant": "the participant",
  "consent.name.child": "the child",
  "consent.name.toggleLead": "Call {who} by name through the tablet.",
  "consent.name.toggleBody":
    "Leave it off if you would rather call out yourself; the call is then recorded as not played, rather than as {who} failing to turn.",
  "consent.name.inputLabel": "Name to call {who} by",
  "consent.name.inputPlaceholder": "Used to call during the test",
  "consent.name.inputHintBase":
    "Not stored, never logged, discarded when the session ends.",
  "consent.name.inputHintControl":
    "Used to play the call through the speaker; the outcome remains a descriptive index, not a decision signal.",
  "consent.name.inputHintField": "The name lives in memory only while the session runs.",

  "consent.agree.participant": "Participant consent given.",
  "consent.agree.service": "Service consent given.",
  "consent.agree.gateB":
    "The participant consents to recording two browser gaze streams and may end the study at any time.",
  "consent.agree.gateA":
    "The participant understands that this session audits the device only and can be stopped at any time.",
  "consent.agree.stageDemo":
    "The adult participant consents for themselves, understands this is a demonstration and not an assessment of them, and may stop at any time.",
  "consent.agree.field":
    "The caregiver understands that Neurogaze is not a diagnosis and that consent can be withdrawn.",
  "consent.research.requiredLead": "Required for Gate B:",
  "consent.research.optionalLead": "Optional:",
  "consent.research.gateB":
    "permit export of clean timestamped gaze coordinates. Video and facial landmarks are still never stored.",
  "consent.research.other":
    "mark the pseudonymous technical log as usable for research. The log stays in memory until the operator downloads it.",
  "consent.blockers": "Complete these first: {issues}",
  "consent.next.device": "Continue to device check",
  "consent.next.demo": "Continue to demonstration",
  "consent.next.child": "Continue to child preparation",

  // --- Preparation -----------------------------------------------------
  "prep.eyebrow": "Preparing the child",
  "prep.title": "Settle the child before starting.",
  "prep.lead": "There is no need to ask the child to look at a dot or give any particular answer.",
  "prep.step1": "Seat the child comfortably",
  "prep.step1Hint": "A parent's lap is fine as long as the face stays visible.",
  "prep.step2": "Place the tablet level with the face",
  "prep.step2Hint": "Use a stand so the screen does not move much.",
  "prep.step3": "Let responses happen naturally",
  "prep.step3Hint": "Do not point, name colours, or direct their gaze.",
  "prep.step4": "Stop if the child is uncomfortable",
  "prep.step4Hint": "The test can be repeated another time.",
  "prep.next": "Watch the short tutorial",

  // --- Tutorial --------------------------------------------------------
  "tutorial.eyebrow": "Guide · 24 seconds",
  "tutorial.title": "Get the child settled calmly.",
  "tutorial.lead": "This guide is for the accompanying adult. The child only needs to sit comfortably.",

  // --- Device check ----------------------------------------------------
  "device.eyebrow": "Camera and framing check",
  "device.title.replay": "Set up the demo without a camera.",
  "device.title.live": "Position the face inside the box.",
  "device.lead.replay": "Replay uses sample data to show the complete flow.",
  "device.lead.live":
    "Line the tablet up with the child's face. The system gives simple prompts when the framing is off.",
  "device.previewAria": "Front camera preview",
  "device.status.passed": "Ready",
  "device.status.failed": "Needs fixing",
  "device.status.checking": "Checking",
  "device.status.idle": "Waiting",
  "device.introTitle": "Resolve anything marked red",
  "device.introHint": "The system re-checks once the framing is corrected.",
  "device.checkFace": "Face visible",
  "device.checkFaceHint": "Face detected without exposing eye coordinates",
  "device.checkFaceUnchecked": "Not yet checked",
  "device.checkFaceOk": "Visible",
  "device.checkFaceBad": "Adjust framing",
  "device.checkLight": "Enough light",
  "device.checkLightHint": "Avoid strong light from behind",
  "device.checkLightOk": "Sufficient",
  "device.checkLightBad": "Fix the lighting",
  "device.checkDistance": "Distance is right",
  "device.checkDistanceHint": "Move the tablet closer or further when prompted",
  "device.checkDistanceNear": "Move closer",
  "device.checkDistanceFar": "Move further",
  "device.checkDistanceOk": "Just right",
  "device.checkFacing": "Child facing the screen",
  "device.checkFacingHint": "Make sure the face is not covered",
  "device.checkFacingOk": "Ready",
  "device.checkFacingBad": "Turn towards the screen",
  "device.checking": "Checking…",
  "device.runCheck": "Run the check",
  "device.startCalibration": "Start calibration",
  "device.techSummary": "Technical detail for the operator",
  "device.tech.mode": "Mode",
  "device.tech.modeGateB": "Gate B paired · no score",
  "device.tech.modeGateA": "Gate A adult · no score",
  "device.tech.modeLive": "Camera research · no score",
  "device.tech.modeReplay": "Fixed simulation",
  "device.tech.landmarks": "Face/iris localisation",
  "device.tech.landmarksValue": "MediaPipe Face Landmarker · 478 landmarks · local CPU",
  "device.tech.iris": "Iris validation",
  "device.tech.irisValue": "centre indices 468/473 · inside the eye · binocularly consistent",
  "device.tech.overlay": "Camera overlay",
  "device.tech.overlayValue": "`cover` crop + mirror corrected against native resolution",
  "device.tech.replayModel": "Replay model",
  "device.tech.loading": "Loading…",
  "device.tech.liveClassification": "Live classification",
  "device.tech.liveClassificationValue": "disabled; the legacy model is used for replay only",
  "device.tech.camera": "Camera",
  "device.tech.faceCoverage": "Face coverage",

  // --- Tracking overlay copy -------------------------------------------
  "tracking.noFace": "No face detected yet",
  "tracking.noFaceHint": "Face the camera and make sure nothing is blocking the view.",
  "tracking.blink": "Eyes are closed",
  "tracking.blinkHint": "Wait for the eyes to open; there is no need to stare at the camera.",
  "tracking.pose": "Head tilted too far",
  "tracking.poseHint": "Straighten the head and face the screen.",
  "tracking.iris": "Iris position is inconsistent",
  "tracking.irisHint": "Open both eyes, reduce glare on glasses, and face straight ahead.",
  "tracking.unclear": "Eyes not clearly readable",
  "tracking.unclearHint": "Reduce glare on glasses or add light from the front.",
  "tracking.ok": "Iris landmarks detected",
  "tracking.okHint":
    "The green markers show iris detection; its accuracy is tested during calibration.",

  // --- Calibration -----------------------------------------------------
  "calib.step": "Step {number} of {total}",
  "calib.hudTitle": "Full-screen calibration",
  "calib.finalCheck": "Final check",
  "calib.position": "Position {index} of {total}",
  "calib.stable": "Reading acquired",
  "calib.waiting": "Hold on a moment",
  "calib.hudHint": "The child only needs to look at the picture",
  "calib.exit": "Exit",
  "calib.previewAria": "Eye preview before calibration",
  "calib.eyebrow": "Child-friendly calibration",
  "calib.title.technical": "Technical calibration for testing.",
  "calib.title.child": "Let's look at some fun pictures!",
  "calib.lead.technical":
    "This nine-point mode is available only to developers and engineering studies.",
  "calib.lead.child": "No need to touch the screen. Just let the child watch.",
  "calib.brief1": "What happens?",
  "calib.brief1Technical": "Nine points appear for technical testing.",
  "calib.brief1Child": "One character appears automatically in five positions.",
  "calib.brief2": "What does the child do?",
  "calib.brief2Body":
    "Just watch. Do not point or ask the child to look in any particular direction.",
  "calib.brief3": "When is it done?",
  "calib.brief3Body": "The system moves on automatically once the gaze reads clearly enough.",
  "calib.truth.gateB": "This is a Gate B agreement recording against WebGazer.",
  "calib.truth.gateA": "This is for Gate A adult participants only.",
  "calib.truth.engineeringBody":
    "Nine-point calibration is not validated for children aged 16–30 months and must not be used on a child before a passive protocol and ethics approval are in place.",
  "calib.truth.simLead": "This is a simulation with a fixed outcome.",
  "calib.truth.simBody":
    "The result does not measure the capability of the device or of any real participant.",
  "calib.glassesHint":
    "If glasses are worn, avoid reflections from a window or a lamp directly in front of the lens.",
  "calib.start": "Start {what}",
  "calib.startTechnical": "9 technical points",
  "calib.startChild": "5 pictures",
  "calib.driftLabel": "DRIFT CORRECTION · LOOK AT CENTRE",
  "calib.resultReady": "Ready to use",
  "calib.resultNotReady": "Not readable yet",
  "calib.resultReadyHint": "Calibration is good enough to continue",
  "calib.resultNotReadyHint": "Let's try again",
  "calib.limitReached": "Attempt limit reached",
  "calib.whyFailed": "Why it did not work",
  "calib.stopResearch": "Stop repeating. Download the diagnostic log, then end the test.",
  "calib.stopOther": "Stop repeating. Download the analysis log, then end the test.",
  "calib.retryOnce": "Retry once",
  "calib.techSummary": "Calibration technical detail",
  "calib.diagnosticsAria": "Calibration diagnostics",
  "calib.metricCoverage": "Point coverage",
  "calib.metricSamples": "Grid/centre samples",
  "calib.metricRange": "Signal range X/Y",
  "calib.metricRmse": "Training RMSE",
  "calib.metricGridError": "Median grid error · limit {limit}°",
  "calib.metricDrift": "Centre drift corrected",
  "calib.downloadAnalysis": "Download analysis log",
  "calib.downloadDiagnostic": "Download diagnostic log",
  "calib.endTest": "End the test",
  "calib.next": "Check gaze direction",
  "calib.fromRecording": "Using the calibration from recording {label}.",
  "calib.replayDefault": "Replay uses the built-in deterministic calibration.",
  "calib.notReady": "The camera or face model is not ready. Repeat the device check.",
  "calib.retryStatus": "Not readable yet — let's try again.",
  "calib.readyStatus": "Ready to use.",

  // --- Calibration recovery advice -------------------------------------
  "calibFix.stability": "Iris landmarks move while the gaze is still",
  "calibFix.stabilityAction":
    "Angle the light source or the glasses slightly to cut the reflection, then keep the head still while each point is collected.",
  "calibFix.rangeY": "Up-and-down eye movement is not reading",
  "calibFix.rangeYAction":
    "Raise the camera to eye level. When the point moves, follow it with the eyes — not the head.",
  "calibFix.rangeX": "Left-and-right eye movement is not reading",
  "calibFix.rangeXAction":
    "Move the device slightly closer and make sure the eyes follow the point all the way to the edge of the screen.",
  "calibFix.coverage": "Several points lost the eyes",
  "calibFix.coverageAction":
    "Make sure the face stays inside the frame. Remove anything covering the eyes, then repeat.",
  "calibFix.pose": "The head moved too much",
  "calibFix.poseAction":
    "Use a device stand and ask the participant to move only their eyes.",
  "calibFix.rmse": "The gaze mapping does not fit this session",
  "calibFix.rmseAction":
    "This is not the participant's fault. Repeat at most once; if it still fails, continue only as a signal test with no score, or end the session.",
  "calibFix.generic": "Calibration is not accurate enough",
  "calibFix.genericAction":
    "Keep 40–50 cm of distance, line the camera up with the eyes, then repeat once.",

  // --- Sanity check ----------------------------------------------------
  "sanity.eyebrow": "Quick check after calibration",
  "sanity.title.blocked": "The test cannot continue yet",
  "sanity.title.failed": "Gaze direction is not readable yet",
  "sanity.title.ready": "Let's look at one more picture.",
  "sanity.lead.blocked":
    "The system cannot yet read gaze direction well enough. No result will be produced, so that nothing misleading is reported.",
  "sanity.lead.failed":
    "The camera can see the eyes, but cannot yet determine which part of the screen is being looked at.",
  "sanity.lead.ready":
    "A character will appear on the left, then the centre, then the right. The child just watches as usual.",
  "sanity.characterAria": "Character on the {side}",
  "sanity.side.left": "left",
  "sanity.side.right": "right",
  "sanity.side.center": "centre",
  "sanity.passedLabel": "Gaze direction is readable",
  "sanity.readyLabel": "Ready to check three positions",
  "sanity.noticeBlocked": "No result will be produced",
  "sanity.noticeRetry": "Let's fix this and try again",
  "sanity.noticeBody":
    "Make sure the face is straight, the camera is level with the eyes, and there is no strong reflection on any glasses. This is not a risk result for the child.",
  "sanity.checking": "Checking…",
  "sanity.retryCalibration": "Repeat calibration",
  "sanity.start": "Start the check",
  "sanity.backToDevice": "Back to the framing check",
  "sanity.next": "Continue to stimulus",

  // --- Progress rail ---------------------------------------------------
  "rail.current": "Current step",
  "rail.next": "Next: {label}",
  "rail.last": "Final stage",
  "rail.consent": "Consent",
  "rail.consentHint": "Parental permission",
  "rail.preparation": "Preparation",
  "rail.preparationHint": "Settling the child",
  "rail.tutorial": "Tutorial",
  "rail.tutorialHint": "Short briefing",
  "rail.device": "Framing",
  "rail.deviceHint": "Camera and light",
  "rail.calibration": "Calibration",
  "rail.calibrationHint": "5 engaging pictures",
  "rail.sanity": "Direction check",
  "rail.sanityHint": "Left, centre, right",
  "rail.stimulus": "Stimulus",
  "rail.stimulusHint": "Attention scene",
  "rail.quality": "Quality check",
  "rail.qualityHint": "Recording quality",
  "rail.report": "Report",
  "rail.reportHint": "Conclusion & action",

  // --- Operational status ----------------------------------------------
  "device.msgUnchecked": "Not yet checked",
  "device.msgLoading": "Loading the local face check…",
  "device.msgReady": "Camera ready. The face and both eyes read clearly, with enough light.",
  "device.msgUnstable":
    "The framing is not stable yet. Follow the prompts marked red, then check again.",
  "device.msgReplayReady": "Local replay ready · model assets present · no media upload",
  "device.msgCameraLost": "The camera disconnected. Repeat the device check.",
  "device.failFaceLost": "The face is frequently lost by the camera.",
  "device.failTooDark": "The face is too dark; add light from the front.",
  "device.failTooBright":
    "The light is too strong; avoid a lamp or window directly behind the camera.",
  "device.failTooFar": "The face is too far away; move closer until it fills the frame.",
  "device.failTooClose": "The face is too close; move back slightly from the camera.",
  "device.failLowRes": "The camera resolution is too low.",
  "device.panelNotReady": "The camera panel is not ready.",

  "camera.permission_denied":
    "Camera permission was denied. Allow camera access for this site in your browser settings, then try again.",
  "camera.camera_not_found":
    "No camera found. Connect or enable a front-facing camera, then try again.",
  "camera.camera_busy":
    "The camera is in use by another application. Close any app or tab using it, then try again.",
  "camera.insecure_context":
    "The camera requires HTTPS or http://localhost. Open this page over an HTTPS connection, then try again.",
  "camera.unsupported_browser":
    "This browser or WebView does not support camera access. Open the page in a recent version of Chrome, Edge, or Safari, then try again.",
  "camera.unsupported_constraints":
    "The camera cannot meet this session's resolution requirement. Choose a different camera or check the device's resolution settings, then try again.",
  "camera.request_timeout":
    "The camera did not respond within 12 seconds. Check camera permissions and connection, then try again.",
  "camera.request_interrupted":
    "The camera request stopped before it finished. Try again; if it keeps happening, reload the page.",
  "camera.unknown":
    "The camera could not be opened. Check camera permissions, close other apps using the camera, then try again.",

  "model.unavailable": "Model unavailable",
  "model.loadFailed": "The local model failed to load.",
  "model.notLoadedAtStart": "The local model had not finished loading when the session started.",

  "confirm.deleteLog":
    "Delete this session's log from memory? This cannot be undone.",
};
