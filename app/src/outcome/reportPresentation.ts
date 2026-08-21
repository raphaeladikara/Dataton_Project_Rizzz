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
  sourceKind: ReportSourceKind;
  demonstrationMode: boolean;
  recommendsFollowUp: boolean;
  emitsReferral: boolean;
  fieldTitle: string;
  sessionHeadline: string;
  sessionSummary: string;
  validityMessage?: string;
};

export type ReportPresentation = {
  pageTitle: string;
  sections: [
    ReportPresentationSection,
    ReportPresentationSection,
    ReportPresentationSection,
    ReportPresentationSection,
  ];
  demoBanner: string | null;
};

export type ReportSourceKind = "live" | "recorded_replay" | "synthetic_preview";

const DEMONSTRATION_BANNER =
  "Peragaan dengan peserta dewasa dan klip pendek. Ini bukan penilaian klinis dan tidak mengeluarkan rujukan.";

/**
 * Builds only the caregiver-facing reading layer. Measurements, statistical
 * detail, decision lanes, and provenance remain separate in the practitioner
 * disclosure; this function never changes or recomputes an outcome.
 */
export function buildReportPresentation(input: ReportPresentationInput): ReportPresentation {
  const followUpShown = input.emitsReferral || input.recommendsFollowUp;
  const fieldSummary = input.sessionHeadline === input.fieldTitle
    ? input.sessionSummary
    : `${input.sessionHeadline}. ${input.sessionSummary}`;
  const whatHappened = !input.qualityPassed
    ? {
        title: input.sourceKind === "synthetic_preview"
          ? "Pratinjau sintetis tidak dapat digunakan."
          : "Rekaman tidak dapat digunakan.",
        body: "Pemeriksaan mutu menahan sesi ini sebelum hasil dibuat. Rincian kondisi yang perlu diperbaiki ada pada bagian berikutnya.",
      }
    : input.demonstrationMode
      ? {
        title: "Arsitektur respons berhasil diperagakan.",
        body: followUpShown
          ? "Sistem memperagakan jalur pemeriksaan lanjutan ketika kedua sinyal yang dapat dinilai bergerak ke arah yang ditentukan aturan."
          : "Sistem memperagakan jalur tanpa arahan pemeriksaan ketika aturan tidak terpenuhi.",
        }
      : input.sourceKind === "synthetic_preview"
        ? {
            title: "Pratinjau sintetis selesai.",
            body: "Alur laporan selesai tanpa video, wajah, atau rekaman peserta.",
          }
        : { title: input.fieldTitle, body: fieldSummary };

  const recordingStatus = input.sourceKind === "synthetic_preview"
    ? input.qualityPassed
      ? {
          label: "Pratinjau sintetis selesai",
          title: "Tidak ada rekaman peserta.",
          body: "Titik tatapan dibangkitkan untuk memperlihatkan alur antarmuka. Tidak ada video, wajah, atau rekaman peserta pada pratinjau ini.",
        }
      : {
          label: "Pratinjau sintetis tidak dapat digunakan",
          title: "Hasil pratinjau ditahan.",
          body: input.validityMessage ?? "Data pratinjau belum cukup baik untuk menghasilkan pengukuran yang dapat dibaca.",
        }
    : input.qualityPassed
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

  const nextSteps = !input.qualityPassed
    ? "Perbaiki posisi wajah, cahaya, dan jarak tablet, lalu ulangi sesi saat peserta nyaman. Hasil yang ditahan bukan hasil risiko."
    : input.demonstrationMode
      ? followUpShown
        ? "Respons arsitektur untuk pola produksi sudah terlihat. Jalankan kontrol biasa setelahnya, lalu kembali ke Panduan & demo."
        : "Respons arsitektur untuk kontrol biasa sudah terlihat. Bandingkan dengan pola produksi, lalu kembali ke Panduan & demo."
      : followUpShown
          ? "Bawa ringkasan ini bersama hasil SDIDTK atau M-CHAT-R/F kepada kader, Puskesmas, atau dokter anak. Tenaga kesehatan menentukan apakah pemeriksaan lanjutan diperlukan."
          : "Lanjutkan skrining perkembangan rutin dengan SDIDTK atau M-CHAT-R/F. Bila ada kekhawatiran, bawa ringkasan ini kepada kader, Puskesmas, atau dokter anak.";

  return {
    pageTitle: !input.qualityPassed
      ? input.demonstrationMode ? "Laporan peragaan — sesi ditahan" : "Laporan sesi ditahan"
      : input.demonstrationMode
        ? "Laporan peragaan arsitektur"
        : input.sourceKind === "synthetic_preview"
          ? "Laporan pratinjau sintetis"
          : "Laporan hasil pengukuran",
    sections: [
      { id: "what_happened", label: "Apa yang terjadi", ...whatHappened },
      { id: "recording_status", ...recordingStatus },
      {
        id: "next_steps",
        label: "Langkah berikutnya",
        title: !input.qualityPassed
          ? "Ulangi hanya setelah kondisi diperbaiki."
          : input.demonstrationMode
            ? "Bandingkan dua respons peragaan."
            : "Tetap gunakan skrining perkembangan yang tervalidasi.",
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
