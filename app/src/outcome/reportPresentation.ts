export type ReportSectionId =
  | "what_happened"
  | "recording_status"
  | "next_steps"
  | "result_limits";

export type ReportPresentationSection = {
  id: ReportSectionId;
  label: string;
  title: string;
  body: string;
};

export type ReportPresentationInput = {
  qualityPassed: boolean;
  demonstrationMode: boolean;
  recommendsFollowUp: boolean;
  emitsReferral: boolean;
  sessionHeadline: string;
  sessionSummary: string;
  validityMessage?: string;
};

export type ReportPresentation = {
  sections: [
    ReportPresentationSection,
    ReportPresentationSection,
    ReportPresentationSection,
    ReportPresentationSection,
  ];
  demoBanner: string | null;
};

const DEMONSTRATION_BANNER =
  "Peragaan dengan peserta dewasa dan klip pendek. Ini bukan penilaian klinis dan tidak mengeluarkan rujukan.";

/**
 * Builds only the caregiver-facing reading layer. Measurements, statistical
 * detail, decision lanes, and provenance remain separate in the practitioner
 * disclosure; this function never changes or recomputes an outcome.
 */
export function buildReportPresentation(input: ReportPresentationInput): ReportPresentation {
  const followUpShown = input.emitsReferral || input.recommendsFollowUp;
  const whatHappened = input.demonstrationMode
    ? {
        title: "Arsitektur respons berhasil diperagakan.",
        body: followUpShown
          ? "Sistem memperagakan jalur pemeriksaan lanjutan ketika kedua sinyal yang dapat dinilai bergerak ke arah yang ditentukan aturan."
          : "Sistem memperagakan jalur tanpa arahan pemeriksaan ketika aturan tidak terpenuhi.",
      }
    : { title: input.sessionHeadline, body: input.sessionSummary };

  const recordingStatus = input.qualityPassed
    ? {
        label: "Rekaman dapat digunakan",
        title: "Data sesi cukup untuk dibaca.",
        body: "Pemeriksaan wajah, arah pandangan, dan kelengkapan bagian pengukuran memenuhi batas mutu sesi.",
      }
    : {
        label: "Rekaman tidak dapat digunakan",
        title: "Hasil sesi ditahan.",
        body: input.validityMessage ?? "Data sesi belum cukup baik untuk menghasilkan pengukuran yang dapat dibaca.",
      };

  const nextSteps = input.qualityPassed
    ? followUpShown
      ? "Bawa ringkasan ini bersama hasil SDIDTK atau M-CHAT-R/F kepada kader, Puskesmas, atau dokter anak. Tenaga kesehatan menentukan apakah pemeriksaan lanjutan diperlukan."
      : "Lanjutkan skrining perkembangan rutin dengan SDIDTK atau M-CHAT-R/F. Bila ada kekhawatiran, bawa ringkasan ini kepada kader, Puskesmas, atau dokter anak."
    : "Perbaiki posisi wajah, cahaya, dan jarak tablet, lalu ulangi sesi saat peserta nyaman. Hasil yang ditahan bukan hasil risiko.";

  return {
    sections: [
      { id: "what_happened", label: "Apa yang terjadi", ...whatHappened },
      { id: "recording_status", ...recordingStatus },
      {
        id: "next_steps",
        label: "Langkah berikutnya",
        title: input.qualityPassed ? "Tetap gunakan skrining perkembangan yang tervalidasi." : "Ulangi hanya setelah kondisi diperbaiki.",
        body: nextSteps,
      },
      {
        id: "result_limits",
        label: "Batas hasil",
        title: "Hasil ini bukan diagnosis dan bukan penentu tunggal rujukan.",
        body: "Ini bukan diagnosis. Hasil tanpa arahan pemeriksaan bukan tanda aman. Ambang GeoPref memiliki sensitivitas 17%, sedangkan indeks lain masih bersifat deskriptif dan belum memiliki ambang tervalidasi untuk balita Indonesia.",
      },
    ],
    demoBanner: input.demonstrationMode ? DEMONSTRATION_BANNER : null,
  };
}
