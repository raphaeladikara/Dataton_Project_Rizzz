import type { GeoprefResult } from "../geopref/score";
import type { JointAttentionProfile } from "../inference/jointAttention";

export type SessionOutcomeKind =
  | "RULE_IN_GEOMETRIC"
  | "MEASURED_NO_RULE_IN"
  | "MEASURED_PROTOCOL_ABBREVIATED"
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

  if (input.geopref.outcome === "MEASURED_PROTOCOL_ABBREVIATED") {
    return {
      ...base, kind: "MEASURED_PROTOCOL_ABBREVIATED",
      headline: `${geometric}% waktu pada pola geometrik, ${social}% pada adegan sosial`,
      summaryLine: `${cueLine(input.jointAttention)} Klip yang tersedia lebih pendek daripada protokol 60/90 detik, jadi ambang 69% belum berlaku.`,
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
