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
  /**
   * How certain this measurement is, in words a caregiver reads without opening
   * anything. Asked for by name in the practitioner interview: "harus jelas apa
   * yang terlihat pada anak, seberapa yakin hasil pengukurannya, dan apa langkah
   * berikutnya" — docs/wawancara_praktisi_hasil.md, blok D.
   *
   * The interval and the quality gate were always computed; both sat behind the
   * practitioner disclosure, which is the one part of the report a parent does
   * not open.
   */
  confidenceStatement: string;
};

export type ReportSourceKind = "live" | "recorded_replay" | "synthetic_preview";

const DEMONSTRATION_BANNER =
  "Peragaan dengan peserta dewasa dan klip pendek. Ini bukan penilaian klinis dan tidak mengeluarkan rujukan.";

/**
 * Plain-language certainty, one sentence, no statistics.
 *
 * A caregiver asked whether the number is trustworthy is entitled to an answer
 * before the technical panel, not inside it. These sentences say what the
 * session can and cannot support without quoting an interval.
 */
const CONFIDENCE_USABLE =
  "Seberapa yakin: pengukuran ini cukup jelas untuk dibaca, tetapi hanya menggambarkan satu sesi singkat — bukan keseluruhan cara anak ini memperhatikan.";
const CONFIDENCE_WITHHELD =
  "Seberapa yakin: belum cukup pasti untuk disimpulkan, jadi tidak ada angka yang dikeluarkan. Sesi yang ditahan bukan hasil yang buruk.";
const CONFIDENCE_SYNTHETIC =
  "Seberapa yakin: tidak berlaku — tidak ada yang diukur dari seseorang di pratinjau ini.";
const CONFIDENCE_DEMONSTRATION =
  "Seberapa yakin: tidak berlaku untuk siapa pun. Ini peragaan pada orang dewasa dengan klip yang dipersingkat.";

export type ReportNoticeInput = {
  demonstrationMode: boolean;
  isEngineeringStudy: boolean;
  sourceKind: ReportSourceKind;
  recordingLabel: string | null;
  recordingCapturedAt: string | null;
};

export type ReportNotice = {
  tone: "demonstration" | "limit";
  /** The strongest applicable label, read first. */
  lead: string;
  /** Every remaining clause, in one pass. */
  body: string;
};

/**
 * One notice, not three.
 *
 * The report used to open with three stacked warning cards before a reader
 * reached a single result. Every sentence in them was correct and load-bearing;
 * the stack was not. Three cards of caveat ahead of the conclusion reads as an
 * apology, and it was the first thing anyone saw of the system's output.
 *
 * Nothing is dropped here. The clauses are the same clauses, merged into one
 * block so they are read in one pass instead of three.
 */
export function buildReportNotice(input: ReportNoticeInput): ReportNotice {
  const clauses: string[] = [];

  if (input.demonstrationMode) {
    clauses.push(DEMONSTRATION_BANNER);
    clauses.push(
      "Ambang 69% sengaja diterapkan agar bentuk respons arsitektur dapat diperagakan; angkanya tidak sah untuk keputusan apa pun.");
    clauses.push("Bukan diagnosis ASD: ini simulasi pola rujukan pada orang dewasa dan tidak mengeluarkan rujukan.");
  } else if (input.isEngineeringStudy) {
    clauses.push("Sesi ini menguji perangkat, bukan perkembangan peserta.");
  } else {
    clauses.push(
      "Klip lapangan terlalu pendek untuk titik operasi GeoPref terbit, jadi arahan rujukan otomatis ditahan. Indeks lain bersifat deskriptif dan belum punya ambang tervalidasi.");
  }

  if (input.sourceKind === "recorded_replay" && input.recordingLabel) {
    const when = input.recordingCapturedAt
      ? ` (${new Date(input.recordingCapturedAt).toLocaleDateString("id-ID", { dateStyle: "long" })})`
      : "";
    clauses.push(`Rekaman, bukan sesi langsung: diputar ulang dari sesi ${input.recordingLabel}${when}, dan angka di bawah adalah hasil sesi itu.`);
  } else if (input.sourceKind === "synthetic_preview") {
    clauses.push(
      "Simulasi, bukan sesi langsung: titik tatapan dibangkitkan dan bukan direkam, jadi indeks perilaku tetap kosong.");
  }

  return {
    tone: input.demonstrationMode ? "demonstration" : "limit",
    lead: input.demonstrationMode ? "MODE DEMONSTRASI." : "Bukan diagnosis ASD.",
    body: clauses.join(" "),
  };
}

/**
 * Builds only the caregiver-facing reading layer. Measurements, statistical
 * detail, decision lanes, and provenance remain separate in the practitioner
 * disclosure; this function never changes or recomputes an outcome.
 */
export function buildReportPresentation(input: ReportPresentationInput): ReportPresentation {
  const followUpShown = input.emitsReferral || input.recommendsFollowUp;
  const confidenceStatement = input.demonstrationMode
    ? CONFIDENCE_DEMONSTRATION
    : !input.qualityPassed
      ? CONFIDENCE_WITHHELD
      : input.sourceKind === "synthetic_preview"
        ? CONFIDENCE_SYNTHETIC
        : CONFIDENCE_USABLE;
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
          body: `Titik tatapan dibangkitkan untuk memperlihatkan alur antarmuka. Tidak ada video, wajah, atau rekaman peserta pada pratinjau ini. ${confidenceStatement}`,
        }
      : {
          label: "Pratinjau sintetis tidak dapat digunakan",
          title: "Hasil pratinjau ditahan.",
          body: `${input.validityMessage ?? "Data pratinjau belum cukup baik untuk menghasilkan pengukuran yang dapat dibaca."} ${confidenceStatement}`,
        }
    : input.qualityPassed
    ? {
        label: "Rekaman dapat digunakan",
        title: "Data sesi cukup untuk dibaca.",
        body: `Pemeriksaan wajah, arah pandangan, dan kelengkapan bagian pengukuran memenuhi batas mutu sesi. ${confidenceStatement}`,
      }
    : {
        label: "Rekaman tidak dapat digunakan",
        title: "Hasil sesi ditahan.",
        body: `${input.validityMessage ?? "Data sesi belum cukup baik untuk menghasilkan pengukuran yang dapat dibaca."} ${confidenceStatement}`,
      };

  const nextSteps = !input.qualityPassed
    ? "Perbaiki posisi wajah, cahaya, dan jarak tablet, lalu ulangi sesi saat peserta nyaman. Hasil yang ditahan bukan hasil risiko."
    : input.demonstrationMode
      ? followUpShown
        ? "Respons arsitektur untuk pola produksi sudah terlihat. Jalankan kontrol biasa setelahnya, lalu kembali ke Panduan & demo."
        : "Respons arsitektur untuk kontrol biasa sudah terlihat. Bandingkan dengan pola produksi, lalu kembali ke Panduan & demo."
      // Menyebut tujuan tanpa menyebut pendamping meninggalkan orang tua
      // sendirian dengan kertasnya — dan itu persis kecemasan masa tunggu yang
      // diceritakan di blok C wawancara praktisi. Kader disebut sebagai orang,
      // bukan sebagai alamat.
      : followUpShown
          ? "Minta kader yang menjalankan sesi ini untuk mendampingi dan menjelaskan ringkasannya kepada keluarga, lalu bawa bersama hasil SDIDTK atau M-CHAT-R/F kepada Puskesmas atau dokter anak. Tenaga kesehatan yang menentukan apakah pemeriksaan lanjutan diperlukan — bukan kertas ini."
          : "Kader yang menjalankan sesi ini yang menjelaskan ringkasannya kepada keluarga; jangan diserahkan tanpa penjelasan. Lanjutkan skrining perkembangan rutin dengan SDIDTK atau M-CHAT-R/F, dan bila ada kekhawatiran bawa ringkasan ini kepada Puskesmas atau dokter anak.";

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
    confidenceStatement,
  };
}
