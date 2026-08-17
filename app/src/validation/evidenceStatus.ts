export const GATE_EVIDENCE_STATUS = {
  updatedAt: "2026-08-17",
  enablesExperimentalLiveScreening: false,
  gates: [
    {
      id: "A", status: "passed", statusLabel: "Lulus",
      title: "Akuisisi kamera dan arah pandangan",
      statement: "Lulus validasi teknis berdasarkan 100 sesi webapp pada kohort dewasa.",
      knownEvidence: "100 sesi, 25 peserta, 3 perangkat; 94% selesai, galat kalibrasi median 2,207°, frame valid rata-rata 96,4%, dropout 3,6%, dan nol skor risiko dari sesi live.",
    },
    {
      id: "B", status: "passed", statusLabel: "Lulus",
      title: "Agreement terhadap WebGazer.js",
      statement: "Lulus uji agreement aliran gaze Neurogaze terhadap WebGazer.js pada sesi browser simultan.",
      knownEvidence: "30 pasangan; 27 siap dan 3 ditahan; valid pair rate 90%, galat median 44,159 px (0,040997 ternormalisasi), agreement AOI rata-rata 99,7574%, dan agreement AOI utama 100%.",
    },
    {
      id: "C", status: "open", statusLabel: "Belum diuji prospektif",
      title: "Validasi klinis populasi sasaran",
      statement: "Model retrospektif tersedia, tetapi klaim klinis menunggu kohort prospektif balita dengan reference outcome independen.",
      knownEvidence: "Analisis retrospektif tingkat anak tersedia pada dataset Carette; belum ada kohort prospektif balita Neurogaze.",
    },
    {
      id: "D", status: "open", statusLabel: "Belum diuji di lapangan",
      title: "Kelayakan operasional",
      statement: "Alur operasional siap diuji, tetapi belum ada studi implementasi Posyandu.",
      knownEvidence: "Protokol dan perangkat lunak tersedia; data kader, Posyandu, dan sesi lapangan belum tersedia.",
    },
  ],
} as const;
