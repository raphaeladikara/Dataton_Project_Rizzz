/**
 * The quality gate, the session report, and the stimulus screen.
 *
 * This is the surface where wording does the most work. The report has to
 * distinguish three things a reader will otherwise collapse into one: a
 * session that was withheld, a session that was measured but triggered no
 * guidance, and a session that did. "Bukan tanda aman" — not an all-clear —
 * appears in several of these strings on purpose, and every English rendering
 * keeps it. Translating it into something reassuring would be a safety
 * regression, not a style choice.
 */
export const id = {
  // --- Quality gate ----------------------------------------------------
  "quality.eyebrow": "Pemeriksaan kualitas",
  "quality.title.passed": "Rekaman selesai diperiksa.",
  "quality.title.retry": "Satu bagian perlu diulang.",
  "quality.title.failed": "Tes belum dapat dinilai.",
  "quality.lead.passed": "Rekaman cukup baik untuk melanjutkan ke laporan.",
  "quality.lead.fallback":
    "Kami belum mendapatkan rekaman yang cukup baik untuk memberikan hasil.",
  "quality.summaryAria": "Ringkasan kualitas sesi",
  "quality.face": "Wajah",
  "quality.faceGood": "Terbaca dengan baik",
  "quality.faceBad": "Perlu diulang",
  "quality.direction": "Arah pandangan",
  "quality.directionBad": "Belum terbaca",
  "quality.directionOk": "Sudah diperiksa",
  "quality.phases": "Bagian tes",
  "quality.phasesRetry": "Satu bagian perlu diulang",
  "quality.phasesOk": "Cukup lengkap",
  "quality.phasesBad": "Belum cukup",
  "quality.techSummary": "Detail teknis untuk petugas",
  "quality.metricFace": "Wajah/mata terdeteksi",
  "quality.metricDropout": "Sampel tatapan hilang",
  "quality.metricCalibration": "Galat kalibrasi · batas {limit}°",
  "quality.metricBrightness": "Pencahayaan",
  "quality.metricSamples": "Sampel scanpath",
  "quality.metricSegments": "Segmen/gap terpanjang",
  "quality.metricCoverage": "Cakupan fitur",
  "quality.metricCoverageNone": "referensi belum ada",
  "quality.metricReferenceLive": "Kecocokan referensi lama",
  "quality.metricReferenceReplay": "Kesesuaian fitur",
  "quality.metricReferenceIn": "dalam referensi",
  "quality.metricReferenceOut": "{count} fitur berbeda",
  "quality.metricNotAssessed": "tidak dinilai",
  "quality.metricPhaseCoverage": "Cakupan fase stimulus",
  "quality.metricLatency": "Ekstraksi + inferensi",
  "quality.gatePassed": "Rekaman dapat digunakan",
  "quality.gateRetry": "Ulangi bagian yang terganggu",
  "quality.gateHeld": "Hasil ditahan",
  "quality.gateBodyField":
    "Rekaman siap ditinjau sebagai observasi deskriptif tanpa arahan rujukan otomatis.",
  "quality.gateBodyLive": "Catatan teknis siap diaudit.",
  "quality.gateBodyReplay": "Lanjutkan untuk melihat laporan demo.",
  "quality.gateBodyFallback": "Perbaiki posisi dan coba lagi.",
  "quality.retryPhase": "Ulangi bagian",
  "quality.retrySession": "Ulangi sesi",
  "quality.openReport": "Buka laporan",
  "quality.openHeldReport": "Lihat laporan ditahan",

  // --- Report header ---------------------------------------------------
  "report.eyebrow": "Laporan sesi · {id}",
  "report.title.gateBPassed": "Rekaman tablet Gate B siap dibandingkan",
  "report.title.gateBHeld": "Rekaman tablet Gate B ditahan",
  "report.title.gateAPassed": "Sesi uji Gate A lulus",
  "report.title.gateAHeld": "Sesi uji Gate A perlu diulang",
  "report.metaGateA": "Peserta dewasa · Gate A engineering",
  "report.metaAgeMonths": "{age} bulan",
  "report.practitionerSummary": "Detail untuk tenaga kesehatan dan auditor",
  "report.practitionerHint":
    "Indeks, selang kepercayaan, p-value, jalur keputusan, status model, dan metadata teknis",

  // --- Verdict ---------------------------------------------------------
  "report.verdictDemo": "Respons arsitektur peragaan",
  "report.verdictBasis": "Dasar kesimpulan · {lane}",
  "report.verdictLaneFollowUp": "disarankan pemeriksaan lanjutan",
  "report.verdictLaneNone": "tanpa rekomendasi pemeriksaan",
  "report.signalDeviant": "Menyimpang",
  "report.signalNormal": "Sesuai harapan",
  "report.signalUnassessable": "Tidak dapat dinilai",

  // --- Measurement lane ------------------------------------------------
  "report.measuredKicker": "Angka yang diukur sesi ini",
  "report.samplesInArea": "{count} sampel dalam area",
  "report.notMeasured": "Belum terukur",
  "report.notDiagnosis": "Bukan diagnosis",
  "report.indicesAria": "Indeks perilaku sesi",
  "report.indexGeometric": "Pola geometrik",
  "report.indexGeometricCi":
    "95% CI {low}–{high}%. Titik operasi terbit 69% hanya dibandingkan dalam mode demonstrasi; lajur lapangan menahannya (Wen dkk., 2022; n=1.863, spesifisitas 98%).",
  "report.indexGeometricHeld":
    "Titik operasi terbit 69% ditahan pada klip lapangan 16,75 detik (Wen dkk., 2022; n=1.863, spesifisitas 98%).",
  "report.indexCue": "Isyarat diikuti",
  "report.indexCueNone": "Belum cukup percobaan.",
  "report.indexCueP": "Uji tanda p = {p}.",
  "report.indexFacing": "Menghadap layar",
  "report.indexFacingNote": "Padanan indeks ber-AUC 0,838 pada preseden tablet.",
  "report.indexHead": "Gerak kepala",
  "report.indexHeadNote": "Padanan indeks ber-AUC 0,864, tertinggi pada preseden.",
  "report.indexName": "Respons nama",
  "report.indexNameNone": "Belum terukur.",
  "report.indexNameMedian": "Median {ms} ms.",
  "report.indexBlink": "Laju kedip",
  "report.indexBlinkNote": "Saat adegan sosial.",
  "report.indexBlinkUnit": "{value}/mnt",
  "report.sceneNumbers": "Lihat angka tiap adegan",
  "report.sceneOnTarget": "{percent}% pada target",
  "report.sceneUnread": "tidak terbaca",
  "report.sceneFaceNa": "wajah n/a",
  "report.sceneFace": "{percent}% pada wajah",
  "report.sceneLatency": " · respons awal {ms} ms",
  "report.sceneNote":
    "Persentase ini adalah porsi waktu tatapan, bukan probabilitas ASD dan bukan nilai benar/salah.",

  // --- Referral lane ---------------------------------------------------
  "report.referralKicker": "Jalur kedua · aturan komposit",
  "report.referralExplainer":
    "{countWord} sinyal yang dapat dinilai tanpa data pembanding balita: satu memakai ambang terbit, {restWord} membandingkan anak dengan dirinya sendiri. Batas {threshold} sinyal adalah pilihan desain, bukan ambang tervalidasi.",
  "report.referralLimit":
    "Rekomendasi ini bukan diagnosis dan tidak menggantikan ambang GeoPref. Arah tiap sinyal diambil dari literatur, tetapi aturan gabungannya belum divalidasi pada balita. Hasil yang tidak memicu rekomendasi tetap bukan tanda aman.",

  // --- How to read -----------------------------------------------------
  "report.howToRead": "Cara membaca hasil ini",
  "report.whyFollowUp": "Kenapa hasil ini perlu ditindaklanjuti?",
  "report.whyNotSafe": "Kenapa hasil ini belum berarti aman?",
  "report.whyEmits":
    "Preferensi kuat pada pola geometrik jarang muncul pada anak tanpa ASD: spesifisitasnya 98 persen pada 1.863 balita usia 12 sampai 49 bulan. Bawa hasil ini ke kader atau Puskesmas bersama SDIDTK.",
  "report.whyDemo":
    "Kedua sinyal yang dapat dinilai sama-sama menyimpang. Seluruh selang kepercayaan waktu tatap pada pola geometrik berada di atas ambang 69 persen, dan pola itu jarang muncul pada anak tanpa ASD: spesifisitasnya 98 persen pada 1.863 balita. Isyarat arah diikuti pada {trials} percobaan, dibandingkan terhadap peserta yang sama sebelum isyarat diberikan. Beginilah sesi lapangan akan terbaca bila stimulus penuh tersedia. Sesi ini peragaan, jadi tidak ada rujukan yang dikeluarkan dan hasilnya tidak dibawa ke layanan kesehatan.",
  "report.whyDemoTrials": "{followed} dari {scored}",
  "report.whyDemoTrialsFallback": "sebagian kecil",
  "report.whyBelow":
    "Ambang rujukan otomatis dirancang untuk memastikan hasil positif, bukan menyingkirkan ASD. Sensitivitasnya hanya 17 persen, jadi sebagian besar anak ASD tidak terdeteksi di sini. Indeks lain di atas adalah pengukuran deskriptif yang belum punya ambang tervalidasi; skrining perkembangan rutin tetap diperlukan.",

  // --- Decision rules legend -------------------------------------------
  "report.rulesKicker": "Cara membaca status",
  "report.rulesHeading": "Kapan sistem memberi arahan?",
  "report.ruleHeldLabel": "Data kurang",
  "report.ruleHeldTitle": "Sesi ditahan",
  "report.ruleHeldBody":
    "Wajah sering hilang, kalibrasi gagal, atau bagian tes tidak lengkap. Tidak ada hasil yang dikeluarkan.",
  "report.ruleMeasuredLabel": "Di bawah ambang",
  "report.ruleMeasuredTitle": "Terukur, tanpa arahan rujukan",
  "report.ruleMeasuredBody":
    "Pola geometrik di bawah 69 persen. Bukan tanda aman: tes ini melewatkan sebagian besar anak ASD.",
  "report.ruleReferLabel": "Di atas ambang",
  "report.ruleReferTitle": "Disarankan pemeriksaan lanjutan",
  "report.ruleReferBody":
    "Pola geometrik 69 persen ke atas. Spesifisitas 98 persen pada 1.863 balita usia 12 sampai 49 bulan.",
  "report.nextKicker": "Langkah berikutnya",
  "report.nextHeading": "Gunakan instrumen skrining perkembangan yang tervalidasi.",
  "report.nextBody":
    "Bila ada kekhawatiran, bawa ringkasan observasi ini bersama hasil SDIDTK atau M-CHAT-R/F kepada kader, Puskesmas, atau dokter anak. Keputusan pemeriksaan lanjutan berasal dari penilaian tersebut, bukan dari skor kamera ini.",

  // --- Engineering panel -----------------------------------------------
  "report.engKicker": "Kesimpulan sesi",
  "report.engPassed": "Kamera, kalibrasi, dan rekaman stimulus berhasil.",
  "report.engFailed": "Satu atau lebih pemeriksaan teknis belum berhasil.",
  "report.engPassedBody":
    "Aplikasi berhasil merekam tatapan pada perangkat ini dan seluruh fase memiliki data yang cukup. Sesi ini lulus uji teknis, tetapi tidak menilai ASD atau perkembangan peserta.",
  "report.engCamera": "Kamera",
  "report.engFramesRead": "{percent}% bingkai terbaca",
  "report.engNoDropout": "tanpa sampel hilang",
  "report.engDropout": "{percent}% sampel hilang",
  "report.engCalibration": "Kalibrasi",
  "report.engPass": "lulus",
  "report.engFail": "belum lulus",
  "report.engCalibrationLimit": "Batas sesi ≤{limit}°",
  "report.engCalibrationValidation": " · validasi {value}°",
  "report.engStimulus": "Stimulus",
  "report.engPhaseCoverage": "{percent}% fase tercakup",
  "report.engPhaseDetail": "{samples} sampel · {adequate}/{expected} fase terukur",
  "report.ladderAria": "Status gerbang validasi",
  "report.ladderTabletReady": "siap",
  "report.ladderTabletHeld": "ditahan",
  "report.ladderTablet": "Rekaman tablet · {state}",
  "report.ladderTabletNote": "Ini hanya menilai kelayakan sinyal pasangan saat ini.",
  "report.ladderPair": "Perbandingan pasangan · menunggu",
  "report.ladderPairNote": "Gabungkan aliran Neurogaze dan WebGazer dalam analisis Gate B.",
  "report.ladderGateAPass": "Gate A · sesi memenuhi batas",
  "report.ladderGateAFail": "Gate A · belum memenuhi batas",
  "report.ladderGateANote": "Engineering perangkat pada peserta dewasa.",
  "report.ladderGateB": "Gate B · lulus",
  "report.ladderGateBNote":
    "Agreement terhadap WebGazer.js memenuhi seluruh kriteria yang tercatat.",
  "report.ladderGateC": "Gate C · terkunci",
  "report.ladderGateCNote":
    "Validasi prospektif balita baru dimulai setelah Gate B lulus dan etik tersedia.",
  "report.engNextGateB":
    "Simpan kedua aliran browser dengan pair ID, stimulus, AOI, dan origin waktu yang sama. Status studi ditentukan dari seluruh kohort, bukan satu pasangan.",
  "report.engNextGateA":
    "Unduh log JSON, ulangi Gate A pada perangkat fisik yang dituju, lalu bandingkan presisi, dropout, FPS, latensi, baterai, dan panas perangkat. Jangan aktifkan skor kamera dari hasil ini.",

  // --- Positive control readout ----------------------------------------
  "report.controlTitle": "Respons instrumen · kontrol positif",
  "report.controlMeta": "Kondisi {condition} · percobaan {attempt}",
  "report.controlOrdinary": "1 · menonton biasa",
  "report.controlProduced": "2 · pola diproduksi",
  "report.controlCopy": "Salin ke lembar sesi",
  "report.controlQuarantined": "dikarantina ({responses}/{calls})",
  "report.controlUnused": "tidak_dipakai",
  "report.controlYes": "ya",
  "report.controlNo": "tidak",
  "report.controlNoteLead": "Ini status respons alat ukur, bukan penilaian atas peserta.",
  "report.controlNoteBody":
    "Peserta memproduksi polanya atas permintaan, jadi “komposit menyala” berarti aturannya bergerak seperti yang diharapkan — bukan bahwa peserta perlu diperiksa. Sesi ini tidak mengeluarkan rujukan.",

  // --- Cue readout -----------------------------------------------------
  "report.cueTitle": "Respons selama stimulus",
  "report.cueHint": "Deskriptif, bukan lulus/gagal",
  "report.cueTag": "Tidak masuk skor",
  "report.cuePostCue": "{percent}% target pasca-cue",
  "report.cueLatencyNa": "latensi n/a",
  "report.cueLatency": "{ms} ms",
  "report.cueLift": " · perubahan {sign}{points} poin",
  "report.cueNote":
    "Persentase dan latensi dihitung setelah onset cue, terpisah dari lead-in netral. Ini bukan probabilitas ASD dan bukan nilai “benar”. Respons alami anak boleh berbeda; pada Gate A dewasa, bagian ini hanya mengecek apakah stimulus dan AOI dapat dipahami.",

  // --- Technical detail ------------------------------------------------
  "report.techTitle": "Detail teknis dan privasi",
  "report.techCarette": "Model Carette",
  "report.techCaretteRejected": "ditolak OOD — tidak dipakai",
  "report.techOutOfRange": "Fitur di luar rentang",
  "report.techNone": "tidak ada",
  "report.techCoverage": "Coverage/OOD",
  "report.techCoverageValue": "{percent}% / {verdict}",
  "report.techFlag": "flag",
  "report.techStimulus": "Stimulus",
  "report.techLatency": "Waktu proses",
  "report.techAoi": "AOI/fase",
  "report.techBattery": "Baterai awal",
  "report.techBatteryNa": "API tidak tersedia",
  "report.techThermal": "Thermal",
  "report.techThermalNa": "API browser tidak tersedia",
  "report.techSessionId": "ID sesi",
  "report.techMedia": "Video mentah/titik wajah",
  "report.techMediaValue": "tidak disimpan",

  // --- Withheld panel --------------------------------------------------
  "report.modelMissingKicker": "Model tidak tersedia",
  "report.modelMissingTitle": "Rekaman valid, tetapi estimasi tidak dapat dihitung",
  "report.modelMissingBody":
    "Kamera, kalibrasi, dan seluruh fase stimulus berhasil direkam. Pemeriksaan kualitas lulus, tetapi model lokal atau format fitur tidak tersedia sehingga sistem menahan hasil.",
  "report.captureQuality": "Pemeriksaan kualitas",
  "report.capturePassed": "Lulus",
  "report.captureQualityDetail": "{face}% wajah · {dropout}% sampel hilang",
  "report.capturePhases": "{adequate}/{expected} fase",
  "report.captureSamples": "{count} sampel valid",
  "report.captureEstimate": "Estimasi",
  "report.captureHeld": "Ditahan",
  "report.captureCheckModel": "Periksa model lokal",
  "report.modelMissingNext":
    "Unduh catatan audit, lalu periksa aset model dan kecocokan format fitur sebelum mengulang sesi.",
  "report.techSessionSummary": "Ringkasan teknis sesi",
  "report.techStatusLabel": "Status:",
  "report.techStatusValue": "VALID · pemeriksaan kualitas lulus.",
  "report.techCalibrationLabel": "Kalibrasi:",
  "report.techModelLabel": "Model:",
  "report.techModelFallback": "inferensi tidak menghasilkan nilai",
  "report.heldKicker": "Hasil ditahan",
  "report.heldTitle": "Tes belum dapat dinilai",
  "report.heldBody":
    "Kami belum mendapatkan rekaman tatapan yang cukup baik untuk memberikan hasil. Ini bukan hasil risiko anak.",
  "report.heldWhatNow": "Apa yang bisa dilakukan?",
  "report.heldStep1": "Pastikan wajah terlihat penuh dan tablet sejajar wajah.",
  "report.heldStep2": "Hindari pantulan cahaya pada kacamata.",
  "report.heldStep3": "Biarkan anak melihat layar tanpa diarahkan.",
  "report.heldStep4": "Ulangi tes saat anak lebih tenang.",
  "report.heldDetail": "Lihat detail untuk petugas",
  "report.heldMainIssue": "Masalah utama:",
  "report.heldStages": "Tahap:",
  "report.heldAdvice": "Saran:",

  // --- Research lane ---------------------------------------------------
  "report.researchKicker": "Panel riset · bukan bagian dari keputusan",
  "report.researchHeading": "Model scanpath dan penjaga distribusi",
  "report.researchLead":
    "Regresi logistik 13 fitur (AUC tingkat anak 0,823 pada 54 anak Carette) dikirim ke perangkat dan dijalankan setiap sesi. Penjaga out-of-distribution memutuskan apakah keluarannya boleh dibaca. Fitur geometrinya mengkodekan tata letak stimulus asal, jadi batas keputusannya tidak berpindah ke stimulus ini — penolakan di bawah adalah rancangan, bukan kegagalan.",
  "report.researchModel": "Model",
  "report.researchModelNone": "tidak dimuat",
  "report.researchModelNote": "13 fitur geometri, kalibrasi Platt",
  "report.researchGuard": "Putusan penjaga",
  "report.researchGuardPass": "Dalam rentang",
  "report.researchGuardReject": "Ditolak",
  "report.researchGuardNone": "Tidak dinilai",
  "report.researchGuardNote": "{count} fitur ditandai · cakupan {coverage}%",
  "report.researchGuardNoRef": "Referensi OOD belum dimuat",
  "report.researchOutput": "Keluaran model",
  "report.researchOutputHeld": "ditahan",
  "report.researchOutputNote":
    "Hanya untuk panel ini; tidak ada jalur kode yang memakainya untuk memutuskan",
  "report.researchOutputRejected": "Penjaga menolak, jadi angkanya tidak ditampilkan",
  "report.researchDistance": "Jarak terjauh",
  "report.researchDistanceZ": "{value} z",
  "report.researchDistanceNote": "Robust-z terhadap median referensi",
  "report.researchMahalanobis": "Mahalanobis {value}",
  "report.gateReasons": "Gerbang mutu menahan sesi ini",
  "report.oodTitle": "Lihat jarak tiap fitur terhadap kohort referensi",
  "report.oodAria": "Jarak tiap fitur terhadap kohort referensi",
  "report.oodFeature": "Fitur",
  "report.oodSession": "Sesi ini",
  "report.oodMedian": "Median referensi",
  "report.oodRobustZ": "Robust-z",
  "report.oodStatus": "Status",
  "report.oodNotComputed": "tidak terhitung",
  "report.oodOutside": "di luar rentang",
  "report.oodInside": "di dalam rentang",
  "report.oodNote":
    "Robust-z adalah jarak terhadap median kohort Carette dibagi skala MAD-nya. Angka besar berarti sesi ini menghasilkan nilai fitur yang tidak pernah ditemui model saat dilatih.",

  // --- Printable sheet -------------------------------------------------
  "print.title": "Neurogaze — Ringkasan sesi",
  "print.childId": "ID anak",
  "print.age": "Usia",
  "print.site": "Lokasi",
  "print.operator": "Operator",
  "print.time": "Waktu",
  "print.source": "Sumber sesi",
  "print.sourceLive": "Sesi kamera langsung",
  "print.sourceRecording": "Rekaman {label}",
  "print.sourceSynthetic": "Pratinjau sintetis, tanpa rekaman peserta",
  "print.appVersion": "Versi aplikasi",
  "print.disclaimer":
    "Bukan alat diagnosis. Dibaca bersama SDIDTK atau M-CHAT-R/F oleh tenaga kesehatan.",
  "print.conclusion": "Kesimpulan",
  "print.measurementSummary": "Ringkasan pengukuran",
  "print.autoReferral": "Arahan rujukan otomatis:",
  "print.autoReferralYes": "Ya — disarankan pemeriksaan lanjutan.",
  "print.autoReferralNo": "Tidak.",
  "print.compositeHeading": "Rekomendasi komposit",
  "print.compositeNote":
    "Aturan ini memakai {threshold} sinyal menyimpang sebagai batas. Batas itu pilihan desain, bukan ambang tervalidasi, dan aturan gabungannya belum diuji pada balita. Hasil yang tidak memicu rekomendasi bukan tanda aman.",
  "print.measuredHeading": "Angka yang diukur",
  "print.rowGeometric": "Pola geometrik",
  "print.rowGeometricNote":
    "Titik operasi terbit 69% ditahan pada lajur lapangan; hanya mode demonstrasi membandingkannya terhadap selang (Wen dkk. 2022)",
  "print.rowCue": "Isyarat arah diikuti",
  "print.rowDescriptive": "Deskriptif, tanpa ambang tervalidasi",
  "print.rowFacing": "Menghadap layar",
  "print.rowFacingNote": "Padanan indeks AUC 0,838 pada preseden tablet",
  "print.rowHead": "Gerak kepala",
  "print.rowHeadNote": "Padanan indeks AUC 0,864 pada preseden tablet",
  "print.rowName": "Respons nama",
  "print.rowBlink": "Laju kedip (sosial)",
  "print.rowQuality": "Mutu rekaman",
  "print.rowQualityPassed": "Lulus",
  "print.rowQualityHeld": "Ditahan",
  "print.rowQualityNote": "{face}% wajah terbaca · galat kalibrasi {error}°",
  "print.limitsHeading": "Batas klaim",
  "print.limit1":
    "Ini bukan diagnosis. Rujukan otomatis balita ditahan karena klip 16,75 detik tidak mereplikasi protokol penuh; indeks lain bersifat deskriptif.",
  "print.limit2":
    "Hasil di bawah ambang bukan tanda aman: sensitivitas ambang ini 17%, jadi sebagian besar anak ASD tidak terdeteksi.",
  "print.limit3": "Indeks perilaku belum punya ambang tervalidasi untuk balita Indonesia.",
  "print.limit4": "Keputusan rujukan tetap milik tenaga kesehatan, bukan aplikasi ini.",
  "print.caregiverAria": "Ringkasan untuk orang tua dan pendamping",
  "print.demoLead": "MODE DEMONSTRASI — bukan hasil sesi lapangan.",
  "print.demoThreshold":
    "Ambang 69% sengaja diterapkan untuk memperlihatkan respons arsitektur; angkanya tidak sah untuk keputusan apa pun.",
  "print.signature":
    "Tanda tangan operator: ____________________  ·  Diterima oleh: ____________________",

  // --- Report actions --------------------------------------------------
  "report.researchExportLead": "Izinkan log teknis pseudonim dipakai untuk riset.",
  "report.researchExportBody":
    "Pilihan ini tidak memengaruhi laporan layanan. Berikan izin hanya sebelum log diekspor untuk analisis; video dan titik wajah tetap tidak disimpan.",
  "report.backToAdmin": "Kembali ke konsol admin",
  "report.done": "Selesai",
  "report.downloadResearchLog": "Unduh log analisis riset",
  "report.downloadAuditLog": "Unduh log audit JSON",
  "report.printSummary": "Cetak ringkasan",
  "report.deleteLog": "Hapus log dari memori",
  "report.restart": "Ulangi sesi",

  // --- Stimulus --------------------------------------------------------
  "stimulus.headerAdult": "Uji peserta dewasa",
  "stimulus.headerChild": "Anak cukup menonton",
  "stimulus.headerReady": "siap",
  "stimulus.resume": "Lanjutkan",
  "stimulus.pause": "Jeda",
  "stimulus.stopAria": "Hentikan stimulus",
  "stimulus.stop": "Hentikan",
  "stimulus.mirrorAria": "Cermin panggung",
  "stimulus.canvasAria": "Adegan perhatian bersama dengan wajah dan dua mainan",
  "stimulus.stepsAria": "Ringkasan tugas",
  "stimulus.noteAdult":
    "Baterai pengukuran berlangsung {seconds} detik. Selama pengukuran, layar hanya menampilkan adegan; jaga kepala relatif diam dan tidak perlu mengklik.",
  "stimulus.noteChild":
    "Baterai pengukuran berlangsung {seconds} detik, dibuka dengan satu klip pendek lalu adegan bergambar. Hentikan bila anak tidak nyaman.",
  "stimulus.mediaLoading": "Menyiapkan video stimulus…",
  "stimulus.mediaFailed": "Video stimulus belum siap",
  "stimulus.startReplay": "Saya paham · mulai demo",
  "stimulus.startAdult": "Saya paham · mulai pengukuran",
  "stimulus.startChild": "Mulai tes",
  "stimulus.hideNote":
    "Setelah tombol mulai ditekan, semua petunjuk menghilang agar tidak ikut menarik tatapan.",
} as const;

export const en: Record<keyof typeof id, string> = {
  // --- Quality gate ----------------------------------------------------
  "quality.eyebrow": "Quality check",
  "quality.title.passed": "The recording has been checked.",
  "quality.title.retry": "One section needs repeating.",
  "quality.title.failed": "The test cannot be assessed yet.",
  "quality.lead.passed": "The recording is good enough to continue to the report.",
  "quality.lead.fallback":
    "We did not get a recording good enough to produce a result.",
  "quality.summaryAria": "Session quality summary",
  "quality.face": "Face",
  "quality.faceGood": "Read clearly",
  "quality.faceBad": "Needs repeating",
  "quality.direction": "Gaze direction",
  "quality.directionBad": "Not readable yet",
  "quality.directionOk": "Checked",
  "quality.phases": "Test sections",
  "quality.phasesRetry": "One section needs repeating",
  "quality.phasesOk": "Sufficiently complete",
  "quality.phasesBad": "Not sufficient",
  "quality.techSummary": "Technical detail for the operator",
  "quality.metricFace": "Face/eyes detected",
  "quality.metricDropout": "Gaze samples lost",
  "quality.metricCalibration": "Calibration error · limit {limit}°",
  "quality.metricBrightness": "Lighting",
  "quality.metricSamples": "Scanpath samples",
  "quality.metricSegments": "Segments/longest gap",
  "quality.metricCoverage": "Feature coverage",
  "quality.metricCoverageNone": "no reference available",
  "quality.metricReferenceLive": "Match to legacy reference",
  "quality.metricReferenceReplay": "Feature conformity",
  "quality.metricReferenceIn": "within reference",
  "quality.metricReferenceOut": "{count} features differ",
  "quality.metricNotAssessed": "not assessed",
  "quality.metricPhaseCoverage": "Stimulus phase coverage",
  "quality.metricLatency": "Extraction + inference",
  "quality.gatePassed": "Recording is usable",
  "quality.gateRetry": "Repeat the disrupted section",
  "quality.gateHeld": "Result withheld",
  "quality.gateBodyField":
    "The recording is ready to be reviewed as a descriptive observation, with no automatic referral guidance.",
  "quality.gateBodyLive": "The technical record is ready for audit.",
  "quality.gateBodyReplay": "Continue to view the demo report.",
  "quality.gateBodyFallback": "Correct the framing and try again.",
  "quality.retryPhase": "Repeat section",
  "quality.retrySession": "Repeat session",
  "quality.openReport": "Open the report",
  "quality.openHeldReport": "View the withheld report",

  // --- Report header ---------------------------------------------------
  "report.eyebrow": "Session report · {id}",
  "report.title.gateBPassed": "Gate B tablet recording ready for comparison",
  "report.title.gateBHeld": "Gate B tablet recording withheld",
  "report.title.gateAPassed": "Gate A test session passed",
  "report.title.gateAHeld": "Gate A test session needs repeating",
  "report.metaGateA": "Adult participant · Gate A engineering",
  "report.metaAgeMonths": "{age} months",
  "report.practitionerSummary": "Detail for health workers and auditors",
  "report.practitionerHint":
    "Indices, confidence intervals, p-values, decision lanes, model status, and technical metadata",

  // --- Verdict ---------------------------------------------------------
  "report.verdictDemo": "Demonstrated architecture response",
  "report.verdictBasis": "Basis for the conclusion · {lane}",
  "report.verdictLaneFollowUp": "follow-up examination recommended",
  "report.verdictLaneNone": "no examination recommended",
  "report.signalDeviant": "Deviant",
  "report.signalNormal": "As expected",
  "report.signalUnassessable": "Not assessable",

  // --- Measurement lane ------------------------------------------------
  "report.measuredKicker": "What this session measured",
  "report.samplesInArea": "{count} samples inside the area",
  "report.notMeasured": "Not measured",
  "report.notDiagnosis": "Not a diagnosis",
  "report.indicesAria": "Session behavioural indices",
  "report.indexGeometric": "Geometric pattern",
  "report.indexGeometricCi":
    "95% CI {low}–{high}%. The published 69% operating point is compared only in demonstration mode; the field lane withholds it (Wen et al., 2022; n=1,863, specificity 98%).",
  "report.indexGeometricHeld":
    "The published 69% operating point is withheld on the 16.75-second field clip (Wen et al., 2022; n=1,863, specificity 98%).",
  "report.indexCue": "Cues followed",
  "report.indexCueNone": "Not enough trials yet.",
  "report.indexCueP": "Sign test p = {p}.",
  "report.indexFacing": "Facing the screen",
  "report.indexFacingNote": "The matching index has AUC 0.838 in the tablet precedent.",
  "report.indexHead": "Head movement",
  "report.indexHeadNote": "The matching index has AUC 0.864, the highest in the precedent.",
  "report.indexName": "Response to name",
  "report.indexNameNone": "Not measured.",
  "report.indexNameMedian": "Median {ms} ms.",
  "report.indexBlink": "Blink rate",
  "report.indexBlinkNote": "During the social scene.",
  "report.indexBlinkUnit": "{value}/min",
  "report.sceneNumbers": "View the numbers for each scene",
  "report.sceneOnTarget": "{percent}% on target",
  "report.sceneUnread": "not readable",
  "report.sceneFaceNa": "face n/a",
  "report.sceneFace": "{percent}% on the face",
  "report.sceneLatency": " · first response {ms} ms",
  "report.sceneNote":
    "These percentages are shares of gaze time — not ASD probabilities, and not right-or-wrong scores.",

  // --- Referral lane ---------------------------------------------------
  "report.referralKicker": "Second lane · composite rule",
  "report.referralExplainer":
    "{countWord} signals assessable without toddler comparison data: one uses a published threshold, {restWord} compare the child against themselves. The {threshold}-signal cutoff is a design choice, not a validated threshold.",
  "report.referralLimit":
    "This recommendation is not a diagnosis and does not replace the GeoPref threshold. The direction of each signal is taken from the literature, but the combined rule has not been validated in toddlers. A result that triggers no recommendation is still not an all-clear.",

  // --- How to read -----------------------------------------------------
  "report.howToRead": "How to read this result",
  "report.whyFollowUp": "Why does this result need following up?",
  "report.whyNotSafe": "Why does this result not mean all-clear?",
  "report.whyEmits":
    "A strong preference for geometric patterns is uncommon in children without ASD: specificity is 98 percent across 1,863 toddlers aged 12 to 49 months. Take this result to a kader or Puskesmas together with SDIDTK.",
  "report.whyDemo":
    "Both assessable signals are deviant. The entire confidence interval for gaze time on the geometric pattern sits above the 69 percent threshold, and that pattern is uncommon in children without ASD: specificity is 98 percent across 1,863 toddlers. Directional cues were followed on {trials} trials, compared against the same participant before the cue was given. This is how a field session would read if the full stimulus were available. This session is a demonstration, so no referral is issued and the result is not taken to a health service.",
  "report.whyDemoTrials": "{followed} of {scored}",
  "report.whyDemoTrialsFallback": "a small number of",
  "report.whyBelow":
    "The automatic referral threshold is designed to make positives certain, not to rule ASD out. Its sensitivity is only 17 percent, so most children with ASD are not detected here. The other indices above are descriptive measurements with no validated threshold; routine developmental screening is still required.",

  // --- Decision rules legend -------------------------------------------
  "report.rulesKicker": "How to read the status",
  "report.rulesHeading": "When does the system give guidance?",
  "report.ruleHeldLabel": "Insufficient data",
  "report.ruleHeldTitle": "Session withheld",
  "report.ruleHeldBody":
    "The face was often lost, calibration failed, or test sections were incomplete. No result is issued.",
  "report.ruleMeasuredLabel": "Below threshold",
  "report.ruleMeasuredTitle": "Measured, no referral guidance",
  "report.ruleMeasuredBody":
    "Geometric pattern below 69 percent. Not an all-clear: this test misses most children with ASD.",
  "report.ruleReferLabel": "Above threshold",
  "report.ruleReferTitle": "Follow-up examination recommended",
  "report.ruleReferBody":
    "Geometric pattern at 69 percent or above. Specificity 98 percent across 1,863 toddlers aged 12 to 49 months.",
  "report.nextKicker": "Next steps",
  "report.nextHeading": "Use a validated developmental screening instrument.",
  "report.nextBody":
    "If there is any concern, take this observation summary along with SDIDTK or M-CHAT-R/F results to a kader, Puskesmas, or paediatrician. The decision to examine further comes from that assessment, not from this camera score.",

  // --- Engineering panel -----------------------------------------------
  "report.engKicker": "Session conclusion",
  "report.engPassed": "Camera, calibration, and stimulus recording succeeded.",
  "report.engFailed": "One or more technical checks did not succeed.",
  "report.engPassedBody":
    "The app successfully recorded gaze on this device and every phase has sufficient data. This session passes the technical test, but does not assess ASD or the participant's development.",
  "report.engCamera": "Camera",
  "report.engFramesRead": "{percent}% of frames read",
  "report.engNoDropout": "no samples lost",
  "report.engDropout": "{percent}% of samples lost",
  "report.engCalibration": "Calibration",
  "report.engPass": "passed",
  "report.engFail": "not passed",
  "report.engCalibrationLimit": "Session limit ≤{limit}°",
  "report.engCalibrationValidation": " · validation {value}°",
  "report.engStimulus": "Stimulus",
  "report.engPhaseCoverage": "{percent}% of phases covered",
  "report.engPhaseDetail": "{samples} samples · {adequate}/{expected} phases measured",
  "report.ladderAria": "Validation gate status",
  "report.ladderTabletReady": "ready",
  "report.ladderTabletHeld": "withheld",
  "report.ladderTablet": "Tablet recording · {state}",
  "report.ladderTabletNote": "This assesses only the signal viability of the current pair.",
  "report.ladderPair": "Pair comparison · pending",
  "report.ladderPairNote": "Combine the Neurogaze and WebGazer streams in the Gate B analysis.",
  "report.ladderGateAPass": "Gate A · session meets the limits",
  "report.ladderGateAFail": "Gate A · limits not met",
  "report.ladderGateANote": "Device engineering with adult participants.",
  "report.ladderGateB": "Gate B · passed",
  "report.ladderGateBNote":
    "Agreement against WebGazer.js meets every recorded criterion.",
  "report.ladderGateC": "Gate C · locked",
  "report.ladderGateCNote":
    "Prospective toddler validation begins only after Gate B passes and ethics approval is in place.",
  "report.engNextGateB":
    "Save both browser streams with the same pair ID, stimulus, AOI, and time origin. Study status is determined from the whole cohort, not a single pair.",
  "report.engNextGateA":
    "Download the JSON log, repeat Gate A on the target physical device, then compare precision, dropout, FPS, latency, battery, and device heat. Do not enable camera scoring on the strength of this result.",

  // --- Positive control readout ----------------------------------------
  "report.controlTitle": "Instrument response · positive control",
  "report.controlMeta": "Condition {condition} · attempt {attempt}",
  "report.controlOrdinary": "1 · ordinary viewing",
  "report.controlProduced": "2 · produced pattern",
  "report.controlCopy": "Copy to the session sheet",
  "report.controlQuarantined": "quarantined ({responses}/{calls})",
  "report.controlUnused": "not_used",
  "report.controlYes": "yes",
  "report.controlNo": "no",
  "report.controlNoteLead":
    "This is the measuring instrument's response status, not an assessment of the participant.",
  "report.controlNoteBody":
    "The participant produced the pattern on request, so “composite fired” means the rule moved as expected — not that the participant needs examining. This session issues no referral.",

  // --- Cue readout -----------------------------------------------------
  "report.cueTitle": "Response during the stimulus",
  "report.cueHint": "Descriptive, not pass/fail",
  "report.cueTag": "Not part of the score",
  "report.cuePostCue": "{percent}% on target post-cue",
  "report.cueLatencyNa": "latency n/a",
  "report.cueLatency": "{ms} ms",
  "report.cueLift": " · change {sign}{points} points",
  "report.cueNote":
    "Percentages and latencies are computed after cue onset, separately from the neutral lead-in. These are not ASD probabilities and not “correct” scores. A child's natural response may differ; in Gate A adult sessions this section only checks whether the stimulus and AOI are legible.",

  // --- Technical detail ------------------------------------------------
  "report.techTitle": "Technical detail and privacy",
  "report.techCarette": "Carette model",
  "report.techCaretteRejected": "OOD-rejected — not used",
  "report.techOutOfRange": "Features out of range",
  "report.techNone": "none",
  "report.techCoverage": "Coverage/OOD",
  "report.techCoverageValue": "{percent}% / {verdict}",
  "report.techFlag": "flagged",
  "report.techStimulus": "Stimulus",
  "report.techLatency": "Processing time",
  "report.techAoi": "AOI/phases",
  "report.techBattery": "Battery at start",
  "report.techBatteryNa": "API unavailable",
  "report.techThermal": "Thermal",
  "report.techThermalNa": "Browser API unavailable",
  "report.techSessionId": "Session ID",
  "report.techMedia": "Raw video/face points",
  "report.techMediaValue": "not stored",

  // --- Withheld panel --------------------------------------------------
  "report.modelMissingKicker": "Model unavailable",
  "report.modelMissingTitle": "Recording is valid, but the estimate cannot be computed",
  "report.modelMissingBody":
    "The camera, calibration, and every stimulus phase were recorded successfully. The quality check passed, but the local model or the feature format is unavailable, so the system withholds the result.",
  "report.captureQuality": "Quality check",
  "report.capturePassed": "Passed",
  "report.captureQualityDetail": "{face}% face · {dropout}% samples lost",
  "report.capturePhases": "{adequate}/{expected} phases",
  "report.captureSamples": "{count} valid samples",
  "report.captureEstimate": "Estimate",
  "report.captureHeld": "Withheld",
  "report.captureCheckModel": "Check the local model",
  "report.modelMissingNext":
    "Download the audit record, then check the model assets and feature-format compatibility before repeating the session.",
  "report.techSessionSummary": "Session technical summary",
  "report.techStatusLabel": "Status:",
  "report.techStatusValue": "VALID · quality check passed.",
  "report.techCalibrationLabel": "Calibration:",
  "report.techModelLabel": "Model:",
  "report.techModelFallback": "inference produced no value",
  "report.heldKicker": "Result withheld",
  "report.heldTitle": "The test cannot be assessed yet",
  "report.heldBody":
    "We did not get a gaze recording good enough to produce a result. This is not a risk finding about the child.",
  "report.heldWhatNow": "What can be done?",
  "report.heldStep1": "Make sure the whole face is visible and the tablet is level with it.",
  "report.heldStep2": "Avoid reflections on glasses.",
  "report.heldStep3": "Let the child look at the screen without being directed.",
  "report.heldStep4": "Repeat the test when the child is calmer.",
  "report.heldDetail": "View detail for the operator",
  "report.heldMainIssue": "Main issue:",
  "report.heldStages": "Stage:",
  "report.heldAdvice": "Advice:",

  // --- Research lane ---------------------------------------------------
  "report.researchKicker": "Research panel · not part of the decision",
  "report.researchHeading": "Scanpath model and distribution guard",
  "report.researchLead":
    "A 13-feature logistic regression (child-level AUC 0.823 across 54 Carette children) ships to the device and runs every session. An out-of-distribution guard decides whether its output may be read. Its geometry features encode the layout of the original stimulus, so its decision boundary does not transfer to this stimulus — the rejection below is by design, not a failure.",
  "report.researchModel": "Model",
  "report.researchModelNone": "not loaded",
  "report.researchModelNote": "13 geometry features, Platt calibration",
  "report.researchGuard": "Guard verdict",
  "report.researchGuardPass": "Within range",
  "report.researchGuardReject": "Rejected",
  "report.researchGuardNone": "Not assessed",
  "report.researchGuardNote": "{count} features flagged · coverage {coverage}%",
  "report.researchGuardNoRef": "OOD reference not loaded",
  "report.researchOutput": "Model output",
  "report.researchOutputHeld": "withheld",
  "report.researchOutputNote":
    "For this panel only; no code path uses it to decide anything",
  "report.researchOutputRejected": "The guard rejected it, so the number is not shown",
  "report.researchDistance": "Furthest distance",
  "report.researchDistanceZ": "{value} z",
  "report.researchDistanceNote": "Robust-z against the reference median",
  "report.researchMahalanobis": "Mahalanobis {value}",
  "report.gateReasons": "The quality gate withheld this session",
  "report.oodTitle": "View each feature's distance from the reference cohort",
  "report.oodAria": "Distance of each feature from the reference cohort",
  "report.oodFeature": "Feature",
  "report.oodSession": "This session",
  "report.oodMedian": "Reference median",
  "report.oodRobustZ": "Robust-z",
  "report.oodStatus": "Status",
  "report.oodNotComputed": "not computed",
  "report.oodOutside": "out of range",
  "report.oodInside": "within range",
  "report.oodNote":
    "Robust-z is the distance from the Carette cohort median divided by its MAD scale. A large number means this session produced a feature value the model never encountered during training.",

  // --- Printable sheet -------------------------------------------------
  "print.title": "Neurogaze — Session summary",
  "print.childId": "Child ID",
  "print.age": "Age",
  "print.site": "Location",
  "print.operator": "Operator",
  "print.time": "Time",
  "print.source": "Session source",
  "print.sourceLive": "Live camera session",
  "print.sourceRecording": "Recording {label}",
  "print.sourceSynthetic": "Synthetic preview, no participant recording",
  "print.appVersion": "App version",
  "print.disclaimer":
    "Not a diagnostic tool. To be read alongside SDIDTK or M-CHAT-R/F by a health worker.",
  "print.conclusion": "Conclusion",
  "print.measurementSummary": "Measurement summary",
  "print.autoReferral": "Automatic referral guidance:",
  "print.autoReferralYes": "Yes — follow-up examination recommended.",
  "print.autoReferralNo": "No.",
  "print.compositeHeading": "Composite recommendation",
  "print.compositeNote":
    "This rule uses {threshold} deviant signals as its cutoff. That cutoff is a design choice, not a validated threshold, and the combined rule has not been tested in toddlers. A result that triggers no recommendation is not an all-clear.",
  "print.measuredHeading": "Measured values",
  "print.rowGeometric": "Geometric pattern",
  "print.rowGeometricNote":
    "The published 69% operating point is withheld on the field lane; only demonstration mode compares it against the interval (Wen et al. 2022)",
  "print.rowCue": "Directional cues followed",
  "print.rowDescriptive": "Descriptive, no validated threshold",
  "print.rowFacing": "Facing the screen",
  "print.rowFacingNote": "Matching index AUC 0.838 in the tablet precedent",
  "print.rowHead": "Head movement",
  "print.rowHeadNote": "Matching index AUC 0.864 in the tablet precedent",
  "print.rowName": "Response to name",
  "print.rowBlink": "Blink rate (social)",
  "print.rowQuality": "Recording quality",
  "print.rowQualityPassed": "Passed",
  "print.rowQualityHeld": "Withheld",
  "print.rowQualityNote": "{face}% of face read · calibration error {error}°",
  "print.limitsHeading": "Claim limits",
  "print.limit1":
    "This is not a diagnosis. Automatic toddler referral is withheld because a 16.75-second clip does not replicate the full protocol; the other indices are descriptive.",
  "print.limit2":
    "A below-threshold result is not an all-clear: this threshold's sensitivity is 17%, so most children with ASD are not detected.",
  "print.limit3":
    "The behavioural indices have no validated threshold for Indonesian toddlers.",
  "print.limit4":
    "The referral decision remains the health worker's, not this application's.",
  "print.caregiverAria": "Summary for parents and the accompanying adult",
  "print.demoLead": "DEMONSTRATION MODE — not a field session result.",
  "print.demoThreshold":
    "The 69% threshold was applied deliberately to show the architecture's response; the number is not valid for any decision.",
  "print.signature":
    "Operator signature: ____________________  ·  Received by: ____________________",

  // --- Report actions --------------------------------------------------
  "report.researchExportLead":
    "Permit the pseudonymous technical log to be used for research.",
  "report.researchExportBody":
    "This choice does not affect the service report. Grant it only before the log is exported for analysis; video and face points are still never stored.",
  "report.backToAdmin": "Back to the admin console",
  "report.done": "Done",
  "report.downloadResearchLog": "Download research analysis log",
  "report.downloadAuditLog": "Download JSON audit log",
  "report.printSummary": "Print the summary",
  "report.deleteLog": "Delete the log from memory",
  "report.restart": "Repeat session",

  // --- Stimulus --------------------------------------------------------
  "stimulus.headerAdult": "Adult participant test",
  "stimulus.headerChild": "The child only needs to watch",
  "stimulus.headerReady": "ready",
  "stimulus.resume": "Resume",
  "stimulus.pause": "Pause",
  "stimulus.stopAria": "Stop the stimulus",
  "stimulus.stop": "Stop",
  "stimulus.mirrorAria": "Stage mirror",
  "stimulus.canvasAria": "Joint attention scene with a face and two toys",
  "stimulus.stepsAria": "Task summary",
  "stimulus.noteAdult":
    "The measurement battery runs for {seconds} seconds. During measurement the screen shows only the scene; keep your head relatively still, and there is nothing to click.",
  "stimulus.noteChild":
    "The measurement battery runs for {seconds} seconds, opening with one short clip and then an illustrated scene. Stop if the child is uncomfortable.",
  "stimulus.mediaLoading": "Preparing the stimulus video…",
  "stimulus.mediaFailed": "The stimulus video is not ready",
  "stimulus.startReplay": "Understood · start the demo",
  "stimulus.startAdult": "Understood · start the measurement",
  "stimulus.startChild": "Start the test",
  "stimulus.hideNote":
    "Once the start button is pressed every prompt disappears, so nothing on screen competes for the child's gaze.",
};
