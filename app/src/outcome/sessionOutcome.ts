import { isDemonstrationOutcome, type GeoprefResult } from "../geopref/score";
import type { JointAttentionProfile } from "../inference/jointAttention";

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

function percent(value: number): string {
  return `${Math.round(value * 100)}`;
}

function cueLine(profile: JointAttentionProfile | null): string {
  if (!profile || profile.verdict === "WITHHELD_TOO_FEW_TRIALS") return "Respons isyarat belum cukup terekam.";
  const latency = profile.medianLatencyMs === null ? "" : `, median ${Math.round(profile.medianLatencyMs)} ms`;
  return `Mengikuti ${profile.trialsFollowed} dari ${profile.trialsScored} isyarat arah${latency}.`;
}

export function resolveSessionOutcome(input: SessionOutcomeInput): SessionOutcome {
  const recordedSession = input.mode === "replay";
  const base = { reassures: false as const, claimsDiagnosis: false as const, recordedSession };

  if (!input.qualityPassed || !input.validityCanScore || !input.geopref || input.geopref.percentGeometric === null) {
    return {
      ...base, kind: "WITHHELD",
      headline: "Sesi belum dapat dinilai",
      summaryLine: "Rekaman tidak memenuhi syarat mutu, jadi tidak ada hasil yang dikeluarkan.",
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
      headline: above
        ? `MODE DEMONSTRASI · ${geometric}% waktu pada pola geometrik — di atas ambang 69%`
        : `MODE DEMONSTRASI · ${geometric}% waktu pada pola geometrik, ${social}% pada adegan sosial — di bawah ambang 69%`,
      summaryLine: `${cueLine(input.jointAttention)} Ambang 69% diterapkan pada klip yang lebih pendek daripada protokol terbit, jadi angka ini tidak sah untuk keputusan apa pun dan bukan rujukan.${above
        ? " Bentuk laporan inilah yang akan muncul bila stimulus penuh tersedia."
        : " Berada di bawah ambang juga bukan tanda aman: ambang ini melewatkan sebagian besar anak ASD."}`,
      emitsReferral: false,
    };
  }

  if (input.geopref.outcome === "MEASURED_PROTOCOL_ABBREVIATED") {
    return {
      ...base, kind: "MEASURED_PROTOCOL_ABBREVIATED",
      headline: `${geometric}% waktu pada pola geometrik, ${social}% pada adegan sosial`,
      summaryLine: `${cueLine(input.jointAttention)} Klip yang tersedia lebih pendek daripada protokol 60/90 detik, jadi ambang 69% belum berlaku.`,
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
      headline: `${geometric}% waktu pada pola geometrik, ${social}% pada adegan sosial`,
      summaryLine: `${cueLine(input.jointAttention)} ${interval
        ? `Selang kepercayaannya ${percent(interval[0])}–${percent(interval[1])}% melintasi ambang 69%, jadi sesi ini tidak menempatkan angkanya di salah satu sisi.`
        : "Waktu tatapnya terlalu pendek untuk menghitung selang kepercayaan, jadi ambang 69% tidak diterapkan."} Ini batas panjang pengukuran, bukan temuan tentang anak.`,
      emitsReferral: false,
    };
  }

  if (input.geopref.outcome === "GEOMETRIC_PREFERENCE") {
    return {
      ...base, kind: "RULE_IN_GEOMETRIC",
      headline: `${geometric}% waktu pada pola geometrik — di atas ambang 69%`,
      summaryLine: `${cueLine(input.jointAttention)} Pola ini jarang muncul pada anak tanpa ASD; rujuk untuk pemeriksaan perkembangan.`,
      emitsReferral: true,
    };
  }

  return {
    ...base, kind: "MEASURED_NO_RULE_IN",
    headline: `${geometric}% waktu pada pola geometrik, ${social}% pada adegan sosial`,
    summaryLine: `${cueLine(input.jointAttention)} Di bawah ambang 69%. Ini bukan tanda aman: tes ini melewatkan sebagian besar anak ASD.`,
    emitsReferral: false,
  };
}
