import { isDemonstrationOutcome, type GeoprefResult } from "../geopref/score";
import type { JointAttentionProfile } from "../inference/jointAttention";
import { DEFAULT_LOCALE, type Locale } from "../i18n/locale";

export type SessionOutcomeKind =
  | "RULE_IN_GEOMETRIC"
  | "MEASURED_NO_RULE_IN"
  | "MEASURED_PROTOCOL_ABBREVIATED"
  /** Enough looking to report a percentage, not enough to place it against the cutoff. */
  | "MEASURED_INTERVAL_STRADDLES_THRESHOLD"
  /** Stage demonstration of the full report shape. Structurally inert. */
  | "RULE_IN_DEMONSTRATION"
  | "WITHHELD";

export type SessionOutcome = {
  kind: SessionOutcomeKind;
  headline: string;
  summaryLine: string;
  emitsReferral: boolean;
  /** A negative GeoPref carries 65% NPV, so nothing here may read as reassurance. */
  reassures: false;
  claimsDiagnosis: false;
  recordedSession: boolean;
};

export type SessionOutcomeInput = {
  mode: "live" | "replay";
  qualityPassed: boolean;
  validityCanScore: boolean;
  geopref: GeoprefResult | null;
  jointAttention: JointAttentionProfile | null;
};


/**
 * Every sentence this resolver can print, in both languages. The branching
 * below is written once and reads whichever table the caller asked for.
 */
type OutcomeCopy = {
  cueNotRecorded: string;
  cueLatency: (ms: number) => string;
  cueFollowed: (followed: number, scored: number, latency: string) => string;
  withheldHeadline: string;
  withheldSummary: string;
  demoAbove: (geometric: string) => string;
  demoBelow: (geometric: string, social: string) => string;
  demoSummary: (cue: string, tail: string) => string;
  demoTailAbove: string;
  demoTailBelow: string;
  bothPanels: (geometric: string, social: string) => string;
  abbreviatedSummary: (cue: string) => string;
  straddlesInterval: (low: string, high: string) => string;
  straddlesNoInterval: string;
  straddlesSummary: (cue: string, middle: string) => string;
  ruleInHeadline: (geometric: string) => string;
  ruleInSummary: (cue: string) => string;
  noRuleInSummary: (cue: string) => string;
};

const COPY: Record<Locale, OutcomeCopy> = {
  id: {
    cueNotRecorded: "Respons isyarat belum cukup terekam.",
    cueLatency: (ms) => `, median ${ms} ms`,
    cueFollowed: (followed, scored, latency) =>
      `Mengikuti ${followed} dari ${scored} isyarat arah${latency}.`,
    withheldHeadline: "Sesi belum dapat dinilai",
    withheldSummary: "Rekaman tidak memenuhi syarat mutu, jadi tidak ada hasil yang dikeluarkan.",
    demoAbove: (geometric) =>
      `MODE DEMONSTRASI · ${geometric}% waktu pada pola geometrik — di atas ambang 69%`,
    demoBelow: (geometric, social) =>
      `MODE DEMONSTRASI · ${geometric}% waktu pada pola geometrik, ${social}% pada adegan sosial — di bawah ambang 69%`,
    demoSummary: (cue, tail) =>
      `${cue} Ambang 69% diterapkan pada klip yang lebih pendek daripada protokol terbit, jadi angka ini tidak sah untuk keputusan apa pun dan bukan rujukan.${tail}`,
    demoTailAbove: " Bentuk laporan inilah yang akan muncul bila stimulus penuh tersedia.",
    demoTailBelow:
      " Berada di bawah ambang juga bukan tanda aman: ambang ini melewatkan sebagian besar anak ASD.",
    bothPanels: (geometric, social) =>
      `${geometric}% waktu pada pola geometrik, ${social}% pada adegan sosial`,
    abbreviatedSummary: (cue) =>
      `${cue} Klip yang tersedia lebih pendek daripada protokol 60/90 detik, jadi ambang 69% belum berlaku.`,
    straddlesInterval: (low, high) =>
      `Selang kepercayaannya ${low}–${high}% melintasi ambang 69%, jadi sesi ini tidak menempatkan angkanya di salah satu sisi.`,
    straddlesNoInterval:
      "Waktu tatapnya terlalu pendek untuk menghitung selang kepercayaan, jadi ambang 69% tidak diterapkan.",
    straddlesSummary: (cue, middle) =>
      `${cue} ${middle} Ini batas panjang pengukuran, bukan temuan tentang anak.`,
    ruleInHeadline: (geometric) => `${geometric}% waktu pada pola geometrik — di atas ambang 69%`,
    ruleInSummary: (cue) =>
      `${cue} Pola ini jarang muncul pada anak tanpa ASD; rujuk untuk pemeriksaan perkembangan.`,
    noRuleInSummary: (cue) =>
      `${cue} Di bawah ambang 69%. Ini bukan tanda aman: tes ini melewatkan sebagian besar anak ASD.`,
  },
  en: {
    cueNotRecorded: "The cue response was not recorded well enough.",
    cueLatency: (ms) => `, median ${ms} ms`,
    cueFollowed: (followed, scored, latency) =>
      `Followed ${followed} of ${scored} directional cues${latency}.`,
    withheldHeadline: "This session cannot be assessed",
    withheldSummary:
      "The recording does not meet the quality requirements, so no result is issued.",
    demoAbove: (geometric) =>
      `DEMONSTRATION MODE · ${geometric}% of gaze time on the geometric pattern — above the 69% threshold`,
    demoBelow: (geometric, social) =>
      `DEMONSTRATION MODE · ${geometric}% of gaze time on the geometric pattern, ${social}% on the social scene — below the 69% threshold`,
    demoSummary: (cue, tail) =>
      `${cue} The 69% threshold was applied to a clip shorter than the published protocol, so this figure is not valid for any decision and is not a referral.${tail}`,
    demoTailAbove: " This is the shape a report would take if the full stimulus were available.",
    demoTailBelow:
      " Being below the threshold is not an all-clear either: this threshold misses most children with ASD.",
    bothPanels: (geometric, social) =>
      `${geometric}% of gaze time on the geometric pattern, ${social}% on the social scene`,
    abbreviatedSummary: (cue) =>
      `${cue} The available clip is shorter than the 60/90-second protocol, so the 69% threshold does not yet apply.`,
    straddlesInterval: (low, high) =>
      `Its confidence interval, ${low}–${high}%, crosses the 69% threshold, so this session does not place the figure on either side.`,
    straddlesNoInterval:
      "The gaze time is too short to compute a confidence interval, so the 69% threshold was not applied.",
    straddlesSummary: (cue, middle) =>
      `${cue} ${middle} That is a limit of the measurement's length, not a finding about the child.`,
    ruleInHeadline: (geometric) =>
      `${geometric}% of gaze time on the geometric pattern — above the 69% threshold`,
    ruleInSummary: (cue) =>
      `${cue} This pattern is uncommon in children without ASD; refer for a developmental examination.`,
    noRuleInSummary: (cue) =>
      `${cue} Below the 69% threshold. This is not an all-clear: this test misses most children with ASD.`,
  },
};

function cueLine(profile: JointAttentionProfile | null, locale: Locale): string {
  const copy = COPY[locale];
  if (!profile || profile.verdict === "WITHHELD_TOO_FEW_TRIALS") return copy.cueNotRecorded;
  const latency = profile.medianLatencyMs === null
    ? ""
    : copy.cueLatency(Math.round(profile.medianLatencyMs));
  return copy.cueFollowed(profile.trialsFollowed, profile.trialsScored, latency);
}

function percent(value: number): string {
  return `${Math.round(value * 100)}`;
}

export function resolveSessionOutcome(
  input: SessionOutcomeInput,
  locale: Locale = DEFAULT_LOCALE,
): SessionOutcome {
  const copy = COPY[locale];
  const recordedSession = input.mode === "replay";
  const base = { reassures: false as const, claimsDiagnosis: false as const, recordedSession };

  if (!input.qualityPassed || !input.validityCanScore || !input.geopref || input.geopref.percentGeometric === null) {
    return {
      ...base, kind: "WITHHELD",
      headline: copy.withheldHeadline,
      summaryLine: copy.withheldSummary,
      emitsReferral: false,
    };
  }

  const geometric = percent(input.geopref.percentGeometric);
  const social = percent(1 - input.geopref.percentGeometric);

  // The threshold was applied to a clip shorter than the one it was derived on,
  // so this shows what a report looks like and nothing more. emitsReferral is
  // false here by construction, not by configuration.
  if (isDemonstrationOutcome(input.geopref.outcome)) {
    const above = input.geopref.outcome === "GEOMETRIC_PREFERENCE_DEMONSTRATION";
    // Both sides of the cutoff have to read as a placement. A below-threshold
    // demonstration used to print the percentage with no verdict attached, so
    // the run that shows the instrument responding to an ordinary participant
    // — the half of a stage demonstration that proves it does not refer
    // everyone — was the half nobody could read off the headline.
    return {
      ...base, kind: "RULE_IN_DEMONSTRATION",
      headline: above ? copy.demoAbove(geometric) : copy.demoBelow(geometric, social),
      summaryLine: copy.demoSummary(
        cueLine(input.jointAttention, locale),
        above ? copy.demoTailAbove : copy.demoTailBelow,
      ),
      emitsReferral: false,
    };
  }

  if (input.geopref.outcome === "MEASURED_PROTOCOL_ABBREVIATED") {
    return {
      ...base, kind: "MEASURED_PROTOCOL_ABBREVIATED",
      headline: copy.bothPanels(geometric, social),
      summaryLine: copy.abbreviatedSummary(cueLine(input.jointAttention, locale)),
      emitsReferral: false,
    };
  }

  // Measured, but not placeable on either side of the cutoff. It must not fall
  // through to the branch below, which says "di bawah ambang 69%" — a session
  // whose interval straddles the cutoff has not measured itself below it, and
  // reporting that would be the reassurance this whole report refuses to give.
  if (input.geopref.outcome === "MEASURED_INTERVAL_STRADDLES_THRESHOLD") {
    const interval = input.geopref.percentGeometricCi;
    return {
      ...base, kind: "MEASURED_INTERVAL_STRADDLES_THRESHOLD",
      headline: copy.bothPanels(geometric, social),
      summaryLine: copy.straddlesSummary(
        cueLine(input.jointAttention, locale),
        interval
          ? copy.straddlesInterval(percent(interval[0]), percent(interval[1]))
          : copy.straddlesNoInterval,
      ),
      emitsReferral: false,
    };
  }

  if (input.geopref.outcome === "GEOMETRIC_PREFERENCE") {
    return {
      ...base, kind: "RULE_IN_GEOMETRIC",
      headline: copy.ruleInHeadline(geometric),
      summaryLine: copy.ruleInSummary(cueLine(input.jointAttention, locale)),
      emitsReferral: true,
    };
  }

  return {
    ...base, kind: "MEASURED_NO_RULE_IN",
    headline: copy.bothPanels(geometric, social),
    summaryLine: copy.noRuleInSummary(cueLine(input.jointAttention, locale)),
    emitsReferral: false,
  };
}
