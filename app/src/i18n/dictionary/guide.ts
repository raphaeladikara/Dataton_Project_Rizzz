/**
 * Operator guide and the demo shelf that lives under it.
 *
 * The demo copy carries a specific burden: it has to keep a presenter from
 * narrating an ordinary-viewing recording as the produced-pattern condition.
 * Wherever the Indonesian names a condition explicitly, the English does too.
 */
export const id = {
  "guide.eyebrow": "Panduan operator · mulai dari sini",
  "guide.heading": "Ikuti satu langkah pada satu waktu.",
  "guide.lead":
    "Tonton panduan singkat ini sebelum mendampingi anak. Anak tidak perlu melihat atau mengikuti instruksinya.",

  "guide.essentialsAria": "Tiga aturan pendamping",
  "guide.essential1Label": "POSISI",
  "guide.essential1Title": "Nyaman dan sejajar",
  "guide.essential1Body": "Tablet stabil, cahaya dari depan, jarak 40–50 cm.",
  "guide.essential2Label": "SELAMA TES",
  "guide.essential2Title": "Biarkan melihat sendiri",
  "guide.essential2Body": "Jangan menunjuk layar atau menyebut arah.",
  "guide.essential3Label": "KENYAMANAN",
  "guide.essential3Title": "Boleh berhenti kapan saja",
  "guide.essential3Body": "Jeda bila anak lelah, gelisah, atau ingin berpaling.",

  "guide.technicalSummary": "Petunjuk teknis untuk operator",
  "guide.technical1Lead": "Hanya ada satu sesi.",
  "guide.technical1Body":
    "Observasi kamera adalah alur yang dipakai di Posyandu. Demo di halaman ini menjalankan kode yang sama; yang berbeda hanya asal pandangannya — rekaman, simulasi, atau kamera.",
  "guide.technical2Lead": "Alur anak memakai lima pemancing perhatian pasif",
  "guide.technical2Body": ", bukan kalibrasi sembilan titik. Hasil ditahan jika kualitas sinyal tidak cukup.",
  "guide.technical3Lead": "Berhenti setelah dua kalibrasi gagal",
  "guide.technical3Body":
    " dan unduh log auditnya. Mengulang terus-menerus melelahkan anak dan tidak memperbaiki sinyalnya.",
  "guide.technical4Lead": "Baca status sebelum angka.",
  "guide.technical4Body":
    "“Ditahan” berarti data belum cukup; status ini tidak menilai perkembangan anak.",

  "guide.demoPill": "Demo tanpa kamera",
  "guide.demoHeading": "Pratinjau tiga keadaan laporan.",
  "guide.demoLead":
    "Simulasi dengan hasil tetap untuk menguji alur, bahasa rekomendasi, dan keputusan yang ditahan. Ketiganya memakai kode yang sama dengan sesi sungguhan dan dijalani langkah demi langkah dari layar persetujuan; yang berbeda hanya dari mana pandangannya datang.",

  "guide.scenario.refer": "Pemeriksaan lanjutan",
  "guide.scenario.referHint": "Pemeriksaan kualitas lulus · arahan rujuk",
  "guide.scenario.monitor": "Pemantauan rutin",
  "guide.scenario.monitorHint": "Pemeriksaan kualitas lulus · pantau rutin",
  "guide.scenario.withheld": "Sesi ditahan",
  "guide.scenario.withheldHint": "Mutu tidak cukup · skor ditahan",
  "guide.scenario.open": "Telusuri alur",

  "guide.asideTitle": "Perlu melihat bentuk laporan rujukan?",
  "guide.asideBody":
    "Klip yang tersedia lebih pendek daripada protokol terbit, jadi ambang GeoPref 69% ditahan di ketiga demo di atas. Dua jalur berikut menerapkannya sekali supaya tata letak laporan rujukan terlihat — sesinya tetap tidak mengeluarkan rujukan, dan laporannya membawa banner mode demonstrasi.",
  "guide.replayTitle": "Putar rekaman",
  "guide.replayBody":
    "Sesi kamera sungguhan dari kontrol positif. Laporannya menyebut kondisi mana yang diputar.",
  "guide.replayAction": "Putar · {label}",
  "guide.liveTitle": "Kamera langsung",
  "guide.liveBody1":
    "Sesi sungguhan untuk peserta dewasa, dengan kamera, kalibrasi, dan gerbang mutu yang sama. Hanya di sini “Disarankan pemeriksaan lanjutan” bisa muncul di depan penonton — dan hanya di sini pula kebalikannya, karena orang dewasa yang mengikuti adegan sosial dan isyarat arah keluar tanpa rekomendasi.",
  "guide.liveBody2":
    "Jalankan dua orang berturut-turut supaya terlihat alat ini membedakan, bukan merujuk semua orang. Tidak tersedia pada jalur anak.",
  "guide.liveAction": "Mulai peragaan kamera",

  // --- Tutorial film ---------------------------------------------------
  "film.aria": "Video panduan animasi Neurogaze",
  "film.subtitleAria": "Subtitle tutorial",
  "film.chapterAria": "Buka panduan {number}",
  "film.title": "Panduan pendamping",
  "film.meta": "24 detik · dapat diputar tanpa internet",
  "film.soundOn": "Nyalakan suara",
  "film.soundOff": "Matikan suara",
  "film.pause": "Jeda",
  "film.play": "Putar",
  "film.replay": "Putar ulang",
  "film.skip": "Lewati, saya sudah paham",
  "film.continue": "Anak sudah nyaman · lanjutkan",
  "film.frame1Tag": "01 · POSISI",
  "film.frame1Title": "Duduk nyaman, layar sejajar wajah.",
  "film.frame1Body": "Letakkan tablet pada dudukan, sekitar satu lengan dari anak.",
  "film.frame2Tag": "02 · KAMERA",
  "film.frame2Title": "Pastikan wajah masuk bingkai.",
  "film.frame2Body": "Tidak perlu mendekat. Wajah cukup terlihat penuh dan tidak tertutup.",
  "film.frame3Tag": "03 · TANPA ARAHAN",
  "film.frame3Title": "Biarkan tatapan anak alami.",
  "film.frame3Body": "Jangan menunjuk layar atau menyebut arah dan warna.",
  "film.frame4Tag": "04 · MENONTON",
  "film.frame4Title": "Anak cukup menonton.",
  "film.frame4Body": "Gambar akan bergerak sendiri. Tidak ada jawaban benar atau salah.",
  "film.frame5Tag": "05 · ISTIRAHAT",
  "film.frame5Title": "Jeda bila anak tidak nyaman.",
  "film.frame5Body": "Sesi boleh dihentikan. Kenyamanan anak selalu lebih penting.",
  "film.frame6Tag": "06 · SIAP",
  "film.frame6Title": "Sudah siap? Mulai saat anak tenang.",
  "film.frame6Body": "Video diproses di perangkat dan tidak disimpan.",
} as const;

export const en: Record<keyof typeof id, string> = {
  "guide.eyebrow": "Operator guide · start here",
  "guide.heading": "Take one step at a time.",
  "guide.lead":
    "Watch this short guide before you sit down with the child. The child does not need to watch it or follow any of it.",

  "guide.essentialsAria": "Three rules for the accompanying adult",
  "guide.essential1Label": "POSITION",
  "guide.essential1Title": "Comfortable and level",
  "guide.essential1Body": "Steady tablet, light from the front, 40–50 cm away.",
  "guide.essential2Label": "DURING THE TEST",
  "guide.essential2Title": "Let them look on their own",
  "guide.essential2Body": "Do not point at the screen or call out directions.",
  "guide.essential3Label": "COMFORT",
  "guide.essential3Title": "Stopping is always allowed",
  "guide.essential3Body": "Pause if the child is tired, restless, or wants to look away.",

  "guide.technicalSummary": "Technical notes for the operator",
  "guide.technical1Lead": "There is only one session.",
  "guide.technical1Body":
    "Camera observation is the flow used at Posyandu. The demos on this page run the same code; the only difference is where the gaze comes from — a recording, a simulation, or the camera.",
  "guide.technical2Lead": "The child flow uses five passive attention cues",
  "guide.technical2Body":
    ", not a nine-point calibration. Results are withheld when signal quality is insufficient.",
  "guide.technical3Lead": "Stop after two failed calibrations",
  "guide.technical3Body":
    " and download the audit log. Repeating past that tires the child and does not improve the signal.",
  "guide.technical4Lead": "Read the status before the number.",
  "guide.technical4Body":
    "“Withheld” means the data is not sufficient; the status is not a judgement about the child's development.",

  "guide.demoPill": "Demo without a camera",
  "guide.demoHeading": "Preview the three report states.",
  "guide.demoLead":
    "Fixed-outcome simulations for exercising the flow, the wording of recommendations, and the withheld decision. All three run the same code as a real session and are stepped through from the consent screen; only the origin of the gaze differs.",

  "guide.scenario.refer": "Follow-up examination",
  "guide.scenario.referHint": "Quality check passed · referral guidance",
  "guide.scenario.monitor": "Routine monitoring",
  "guide.scenario.monitorHint": "Quality check passed · routine monitoring",
  "guide.scenario.withheld": "Session withheld",
  "guide.scenario.withheldHint": "Insufficient quality · score withheld",
  "guide.scenario.open": "Walk the flow",

  "guide.asideTitle": "Need to see the shape of a referral report?",
  "guide.asideBody":
    "The available clips are shorter than the published protocol, so the 69% GeoPref threshold is withheld in all three demos above. The two paths below apply it once so the referral report layout becomes visible — the session still issues no referral, and the report carries a demonstration-mode banner.",
  "guide.replayTitle": "Play a recording",
  "guide.replayBody":
    "A real camera session from the positive control. The report names which condition is being played.",
  "guide.replayAction": "Play · {label}",
  "guide.liveTitle": "Live camera",
  "guide.liveBody1":
    "A real session with an adult participant, using the same camera, calibration, and quality gate. This is the only place “Follow-up examination recommended” can appear in front of an audience — and equally the only place the opposite can, because an adult who follows the social scene and the directional cue comes out with no recommendation.",
  "guide.liveBody2":
    "Run two people back to back so it is visible that the instrument discriminates rather than referring everyone. Not available on the child path.",
  "guide.liveAction": "Start camera demonstration",

  // --- Tutorial film ---------------------------------------------------
  "film.aria": "Neurogaze animated guide video",
  "film.subtitleAria": "Tutorial subtitle",
  "film.chapterAria": "Open guide step {number}",
  "film.title": "Guide for the accompanying adult",
  "film.meta": "24 seconds · plays without internet",
  "film.soundOn": "Turn sound on",
  "film.soundOff": "Turn sound off",
  "film.pause": "Pause",
  "film.play": "Play",
  "film.replay": "Play again",
  "film.skip": "Skip, I understand",
  "film.continue": "The child is settled · continue",
  "film.frame1Tag": "01 · POSITION",
  "film.frame1Title": "Sit comfortably, screen level with the face.",
  "film.frame1Body": "Put the tablet on a stand, about an arm's length from the child.",
  "film.frame2Tag": "02 · CAMERA",
  "film.frame2Title": "Make sure the face is in frame.",
  "film.frame2Body":
    "No need to move closer. The whole face just has to be visible and unobstructed.",
  "film.frame3Tag": "03 · NO PROMPTING",
  "film.frame3Title": "Let the child's gaze be natural.",
  "film.frame3Body": "Do not point at the screen or call out directions and colours.",
  "film.frame4Tag": "04 · WATCHING",
  "film.frame4Title": "The child only needs to watch.",
  "film.frame4Body": "The pictures move on their own. There is no right or wrong answer.",
  "film.frame5Tag": "05 · REST",
  "film.frame5Title": "Pause if the child is uncomfortable.",
  "film.frame5Body":
    "The session can be stopped. The child's comfort always matters more.",
  "film.frame6Tag": "06 · READY",
  "film.frame6Title": "Ready? Start when the child is calm.",
  "film.frame6Body": "Video is processed on the device and never stored.",
};
