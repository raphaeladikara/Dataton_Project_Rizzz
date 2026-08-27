import { BCP47, DEFAULT_LOCALE, type Locale } from "../i18n/locale";

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

/**
 * Every sentence this module can emit, in both languages.
 *
 * The branching below is written once and reads whichever table the caller
 * asked for. That matters more here than anywhere else in the app: these are
 * the sentences that tell a caregiver whether a result can be trusted, and two
 * copies of that logic is two chances for one language to say something the
 * other does not.
 */
type ReportCopy = {
  demonstrationBanner: string;
  confidenceUsable: string;
  confidenceWithheld: string;
  confidenceSynthetic: string;
  confidenceDemonstration: string;

  noticeLeadDemonstration: string;
  noticeLeadLimit: string;
  noticeDemoThreshold: string;
  noticeDemoNotDiagnosis: string;
  noticeEngineering: string;
  noticeFieldClip: string;
  noticeRecorded: (label: string, when: string) => string;
  noticeSynthetic: string;

  titleHeldDemo: string;
  titleHeld: string;
  titleDemo: string;
  titleSynthetic: string;
  titleMeasured: string;

  labelWhatHappened: string;
  labelNextSteps: string;
  labelResultLimits: string;

  unusableSynthetic: string;
  unusableRecording: string;
  unusableBody: string;
  demoArchitecture: string;
  demoFollowUp: string;
  demoNoFollowUp: string;
  syntheticDone: string;
  syntheticBody: string;

  statusSyntheticOkLabel: string;
  statusSyntheticOkTitle: string;
  statusSyntheticOkBody: string;
  statusSyntheticHeldLabel: string;
  statusSyntheticHeldTitle: string;
  statusSyntheticHeldFallback: string;
  statusUsableLabel: string;
  statusUsableTitle: string;
  statusUsableBody: string;
  statusHeldLabel: string;
  statusHeldTitle: string;
  statusHeldFallback: string;

  nextTitleHeld: string;
  nextTitleDemo: string;
  nextTitleField: string;
  nextHeld: string;
  nextDemoFollowUp: string;
  nextDemoControl: string;
  nextFieldFollowUp: string;
  nextFieldRoutine: string;

  limitsTitle: string;
  limitsBody: string;
};

const COPY: Record<Locale, ReportCopy> = {
  id: {
    demonstrationBanner:
      "Peragaan dengan peserta dewasa dan klip pendek. Ini bukan penilaian klinis dan tidak mengeluarkan rujukan.",
    confidenceUsable:
      "Seberapa yakin: pengukuran ini cukup jelas untuk dibaca, tetapi hanya menggambarkan satu sesi singkat — bukan keseluruhan cara anak ini memperhatikan.",
    confidenceWithheld:
      "Seberapa yakin: belum cukup pasti untuk disimpulkan, jadi tidak ada angka yang dikeluarkan. Sesi yang ditahan bukan hasil yang buruk.",
    confidenceSynthetic:
      "Seberapa yakin: tidak berlaku — tidak ada yang diukur dari seseorang di pratinjau ini.",
    confidenceDemonstration:
      "Seberapa yakin: tidak berlaku untuk siapa pun. Ini peragaan pada orang dewasa dengan klip yang dipersingkat.",

    noticeLeadDemonstration: "MODE DEMONSTRASI.",
    noticeLeadLimit: "Bukan diagnosis ASD.",
    noticeDemoThreshold:
      "Ambang 69% sengaja diterapkan agar bentuk respons arsitektur dapat diperagakan; angkanya tidak sah untuk keputusan apa pun.",
    noticeDemoNotDiagnosis:
      "Bukan diagnosis ASD: ini simulasi pola rujukan pada orang dewasa dan tidak mengeluarkan rujukan.",
    noticeEngineering: "Sesi ini menguji perangkat, bukan perkembangan peserta.",
    noticeFieldClip:
      "Klip lapangan terlalu pendek untuk titik operasi GeoPref terbit, jadi arahan rujukan otomatis ditahan. Indeks lain bersifat deskriptif dan belum punya ambang tervalidasi.",
    noticeRecorded: (label, when) =>
      `Rekaman, bukan sesi langsung: diputar ulang dari sesi ${label}${when}, dan angka di bawah adalah hasil sesi itu.`,
    noticeSynthetic:
      "Simulasi, bukan sesi langsung: titik tatapan dibangkitkan dan bukan direkam, jadi indeks perilaku tetap kosong.",

    titleHeldDemo: "Laporan peragaan — sesi ditahan",
    titleHeld: "Laporan sesi ditahan",
    titleDemo: "Laporan peragaan arsitektur",
    titleSynthetic: "Laporan pratinjau sintetis",
    titleMeasured: "Laporan hasil pengukuran",

    labelWhatHappened: "Apa yang terjadi",
    labelNextSteps: "Langkah berikutnya",
    labelResultLimits: "Batas hasil",

    unusableSynthetic: "Pratinjau sintetis tidak dapat digunakan.",
    unusableRecording: "Rekaman tidak dapat digunakan.",
    unusableBody:
      "Pemeriksaan mutu menahan sesi ini sebelum hasil dibuat. Rincian kondisi yang perlu diperbaiki ada pada bagian berikutnya.",
    demoArchitecture: "Arsitektur respons berhasil diperagakan.",
    demoFollowUp:
      "Sistem memperagakan jalur pemeriksaan lanjutan ketika kedua sinyal yang dapat dinilai bergerak ke arah yang ditentukan aturan.",
    demoNoFollowUp: "Sistem memperagakan jalur tanpa arahan pemeriksaan ketika aturan tidak terpenuhi.",
    syntheticDone: "Pratinjau sintetis selesai.",
    syntheticBody: "Alur laporan selesai tanpa video, wajah, atau rekaman peserta.",

    statusSyntheticOkLabel: "Pratinjau sintetis selesai",
    statusSyntheticOkTitle: "Tidak ada rekaman peserta.",
    statusSyntheticOkBody:
      "Titik tatapan dibangkitkan untuk memperlihatkan alur antarmuka. Tidak ada video, wajah, atau rekaman peserta pada pratinjau ini.",
    statusSyntheticHeldLabel: "Pratinjau sintetis tidak dapat digunakan",
    statusSyntheticHeldTitle: "Hasil pratinjau ditahan.",
    statusSyntheticHeldFallback:
      "Data pratinjau belum cukup baik untuk menghasilkan pengukuran yang dapat dibaca.",
    statusUsableLabel: "Rekaman dapat digunakan",
    statusUsableTitle: "Data sesi cukup untuk dibaca.",
    statusUsableBody:
      "Pemeriksaan wajah, arah pandangan, dan kelengkapan bagian pengukuran memenuhi batas mutu sesi.",
    statusHeldLabel: "Rekaman tidak dapat digunakan",
    statusHeldTitle: "Hasil sesi ditahan.",
    statusHeldFallback:
      "Data sesi belum cukup baik untuk menghasilkan pengukuran yang dapat dibaca.",

    nextTitleHeld: "Ulangi hanya setelah kondisi diperbaiki.",
    nextTitleDemo: "Bandingkan dua respons peragaan.",
    nextTitleField: "Tetap gunakan skrining perkembangan yang tervalidasi.",
    nextHeld:
      "Perbaiki posisi wajah, cahaya, dan jarak tablet, lalu ulangi sesi saat peserta nyaman. Hasil yang ditahan bukan hasil risiko.",
    nextDemoFollowUp:
      "Respons arsitektur untuk pola produksi sudah terlihat. Jalankan kontrol biasa setelahnya, lalu kembali ke Panduan & demo.",
    nextDemoControl:
      "Respons arsitektur untuk kontrol biasa sudah terlihat. Bandingkan dengan pola produksi, lalu kembali ke Panduan & demo.",
    nextFieldFollowUp:
      "Minta kader yang menjalankan sesi ini untuk mendampingi dan menjelaskan ringkasannya kepada keluarga, lalu bawa bersama hasil SDIDTK atau M-CHAT-R/F kepada Puskesmas atau dokter anak. Tenaga kesehatan yang menentukan apakah pemeriksaan lanjutan diperlukan — bukan kertas ini.",
    nextFieldRoutine:
      "Kader yang menjalankan sesi ini yang menjelaskan ringkasannya kepada keluarga; jangan diserahkan tanpa penjelasan. Lanjutkan skrining perkembangan rutin dengan SDIDTK atau M-CHAT-R/F, dan bila ada kekhawatiran bawa ringkasan ini kepada Puskesmas atau dokter anak.",

    limitsTitle: "Hasil ini bukan diagnosis dan bukan penentu tunggal rujukan.",
    limitsBody:
      "Ini bukan diagnosis. Hasil tanpa arahan pemeriksaan bukan tanda aman. Ambang GeoPref memiliki sensitivitas 17%, sedangkan indeks lain masih bersifat deskriptif dan belum memiliki ambang tervalidasi untuk balita Indonesia.",
  },
  en: {
    demonstrationBanner:
      "A demonstration with adult participants and a short clip. This is not a clinical assessment and issues no referral.",
    confidenceUsable:
      "How certain: this measurement is clear enough to read, but it describes one short session only — not the whole of how this child attends.",
    confidenceWithheld:
      "How certain: not certain enough to conclude anything, so no number is issued. A withheld session is not a bad result.",
    confidenceSynthetic:
      "How certain: not applicable — nothing was measured from a person in this preview.",
    confidenceDemonstration:
      "How certain: not applicable to anyone. This is a demonstration on an adult with a shortened clip.",

    noticeLeadDemonstration: "DEMONSTRATION MODE.",
    noticeLeadLimit: "Not an ASD diagnosis.",
    noticeDemoThreshold:
      "The 69% threshold is applied deliberately so the shape of the architecture's response can be demonstrated; the number is not valid for any decision.",
    noticeDemoNotDiagnosis:
      "Not an ASD diagnosis: this is a simulation of the referral pattern on an adult, and it issues no referral.",
    noticeEngineering: "This session tests the device, not the participant's development.",
    noticeFieldClip:
      "The field clip is too short for the published GeoPref operating point, so automatic referral guidance is withheld. The other indices are descriptive and have no validated threshold.",
    noticeRecorded: (label, when) =>
      `A recording, not a live session: replayed from session ${label}${when}, and the figures below are that session's results.`,
    noticeSynthetic:
      "A simulation, not a live session: the gaze points are generated rather than recorded, so the behavioural indices stay empty.",

    titleHeldDemo: "Demonstration report — session withheld",
    titleHeld: "Withheld session report",
    titleDemo: "Architecture demonstration report",
    titleSynthetic: "Synthetic preview report",
    titleMeasured: "Measurement report",

    labelWhatHappened: "What happened",
    labelNextSteps: "Next steps",
    labelResultLimits: "Limits of the result",

    unusableSynthetic: "The synthetic preview is unusable.",
    unusableRecording: "The recording is unusable.",
    unusableBody:
      "The quality check withheld this session before a result was produced. The conditions that need correcting are detailed in the next section.",
    demoArchitecture: "The response architecture was demonstrated successfully.",
    demoFollowUp:
      "The system demonstrated the follow-up examination path when both assessable signals moved in the direction the rule specifies.",
    demoNoFollowUp:
      "The system demonstrated the no-examination-guidance path when the rule was not met.",
    syntheticDone: "The synthetic preview is complete.",
    syntheticBody: "The report flow completed with no video, face, or participant recording.",

    statusSyntheticOkLabel: "Synthetic preview complete",
    statusSyntheticOkTitle: "No participant recording.",
    statusSyntheticOkBody:
      "Gaze points were generated to show the interface flow. There is no video, face, or participant recording in this preview.",
    statusSyntheticHeldLabel: "Synthetic preview unusable",
    statusSyntheticHeldTitle: "The preview result is withheld.",
    statusSyntheticHeldFallback:
      "The preview data is not good enough to produce a readable measurement.",
    statusUsableLabel: "Recording is usable",
    statusUsableTitle: "The session data is sufficient to read.",
    statusUsableBody:
      "The face, gaze direction, and measurement-section completeness checks meet the session quality limits.",
    statusHeldLabel: "Recording is unusable",
    statusHeldTitle: "The session result is withheld.",
    statusHeldFallback:
      "The session data is not good enough to produce a readable measurement.",

    nextTitleHeld: "Repeat only once the conditions have been corrected.",
    nextTitleDemo: "Compare the two demonstration responses.",
    nextTitleField: "Continue using validated developmental screening.",
    nextHeld:
      "Correct the face position, the lighting, and the tablet distance, then repeat the session when the participant is comfortable. A withheld result is not a risk result.",
    nextDemoFollowUp:
      "The architecture's response to the produced pattern is now visible. Run the ordinary control afterwards, then return to Guide & demo.",
    nextDemoControl:
      "The architecture's response to the ordinary control is now visible. Compare it against the produced pattern, then return to Guide & demo.",
    nextFieldFollowUp:
      "Ask the kader who ran this session to sit with the family and explain the summary, then take it together with SDIDTK or M-CHAT-R/F results to a Puskesmas or paediatrician. A health worker decides whether a follow-up examination is needed — not this piece of paper.",
    nextFieldRoutine:
      "The kader who ran this session is the one who explains the summary to the family; do not hand it over without an explanation. Continue routine developmental screening with SDIDTK or M-CHAT-R/F, and if there is any concern take this summary to a Puskesmas or paediatrician.",

    limitsTitle: "This result is not a diagnosis and is not the sole basis for a referral.",
    limitsBody:
      "This is not a diagnosis. A result with no examination guidance is not an all-clear. The GeoPref threshold has a sensitivity of 17%, while the other indices remain descriptive and have no validated threshold for Indonesian toddlers.",
  },
};

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
export function buildReportNotice(
  input: ReportNoticeInput,
  locale: Locale = DEFAULT_LOCALE,
): ReportNotice {
  const copy = COPY[locale];
  const clauses: string[] = [];

  if (input.demonstrationMode) {
    clauses.push(copy.demonstrationBanner);
    clauses.push(copy.noticeDemoThreshold);
    clauses.push(copy.noticeDemoNotDiagnosis);
  } else if (input.isEngineeringStudy) {
    clauses.push(copy.noticeEngineering);
  } else {
    clauses.push(copy.noticeFieldClip);
  }

  if (input.sourceKind === "recorded_replay" && input.recordingLabel) {
    const when = input.recordingCapturedAt
      ? ` (${new Date(input.recordingCapturedAt).toLocaleDateString(BCP47[locale], { dateStyle: "long" })})`
      : "";
    clauses.push(copy.noticeRecorded(input.recordingLabel, when));
  } else if (input.sourceKind === "synthetic_preview") {
    clauses.push(copy.noticeSynthetic);
  }

  return {
    tone: input.demonstrationMode ? "demonstration" : "limit",
    lead: input.demonstrationMode ? copy.noticeLeadDemonstration : copy.noticeLeadLimit,
    body: clauses.join(" "),
  };
}

/**
 * Builds only the caregiver-facing reading layer. Measurements, statistical
 * detail, decision lanes, and provenance remain separate in the practitioner
 * disclosure; this function never changes or recomputes an outcome.
 */
export function buildReportPresentation(
  input: ReportPresentationInput,
  locale: Locale = DEFAULT_LOCALE,
): ReportPresentation {
  const copy = COPY[locale];
  const followUpShown = input.emitsReferral || input.recommendsFollowUp;
  const confidenceStatement = input.demonstrationMode
    ? copy.confidenceDemonstration
    : !input.qualityPassed
      ? copy.confidenceWithheld
      : input.sourceKind === "synthetic_preview"
        ? copy.confidenceSynthetic
        : copy.confidenceUsable;
  const fieldSummary = input.sessionHeadline === input.fieldTitle
    ? input.sessionSummary
    : `${input.sessionHeadline}. ${input.sessionSummary}`;
  const whatHappened = !input.qualityPassed
    ? {
        title: input.sourceKind === "synthetic_preview"
          ? copy.unusableSynthetic
          : copy.unusableRecording,
        body: copy.unusableBody,
      }
    : input.demonstrationMode
      ? {
        title: copy.demoArchitecture,
        body: followUpShown ? copy.demoFollowUp : copy.demoNoFollowUp,
        }
      : input.sourceKind === "synthetic_preview"
        ? {
            title: copy.syntheticDone,
            body: copy.syntheticBody,
          }
        : { title: input.fieldTitle, body: fieldSummary };

  const recordingStatus = input.sourceKind === "synthetic_preview"
    ? input.qualityPassed
      ? {
          label: copy.statusSyntheticOkLabel,
          title: copy.statusSyntheticOkTitle,
          body: `${copy.statusSyntheticOkBody} ${confidenceStatement}`,
        }
      : {
          label: copy.statusSyntheticHeldLabel,
          title: copy.statusSyntheticHeldTitle,
          body: `${input.validityMessage ?? copy.statusSyntheticHeldFallback} ${confidenceStatement}`,
        }
    : input.qualityPassed
    ? {
        label: copy.statusUsableLabel,
        title: copy.statusUsableTitle,
        body: `${copy.statusUsableBody} ${confidenceStatement}`,
      }
    : {
        label: copy.statusHeldLabel,
        title: copy.statusHeldTitle,
        body: `${input.validityMessage ?? copy.statusHeldFallback} ${confidenceStatement}`,
      };

  const nextSteps = !input.qualityPassed
    ? copy.nextHeld
    : input.demonstrationMode
      ? followUpShown ? copy.nextDemoFollowUp : copy.nextDemoControl
      // Naming the purpose without naming the accompanying kader leaves a
      // parent alone with the piece of paper — and that is exactly the waiting
      // anxiety described in block C of the practitioner interview. The kader
      // is named as a person, not as an address.
      : followUpShown
          ? copy.nextFieldFollowUp
          : copy.nextFieldRoutine;

  return {
    pageTitle: !input.qualityPassed
      ? input.demonstrationMode ? copy.titleHeldDemo : copy.titleHeld
      : input.demonstrationMode
        ? copy.titleDemo
        : input.sourceKind === "synthetic_preview"
          ? copy.titleSynthetic
          : copy.titleMeasured,
    sections: [
      { id: "what_happened", label: copy.labelWhatHappened, ...whatHappened },
      { id: "recording_status", ...recordingStatus },
      {
        id: "next_steps",
        label: copy.labelNextSteps,
        title: !input.qualityPassed
          ? copy.nextTitleHeld
          : input.demonstrationMode
            ? copy.nextTitleDemo
            : copy.nextTitleField,
        body: nextSteps,
      },
      {
        id: "result_limits",
        label: copy.labelResultLimits,
        title: copy.limitsTitle,
        body: copy.limitsBody,
      },
    ],
    demoBanner: input.demonstrationMode ? copy.demonstrationBanner : null,
    confidenceStatement,
  };
}
