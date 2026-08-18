import { isDemonstrationOutcome, type GeoprefOutcome } from "../geopref/score";
import type { JointAttentionVerdict } from "../inference/jointAttention";
import type { ResponseToNameIndex } from "../phenotype/responseToName";

/**
 * The composite follow-up rule.
 *
 * Perochon et al. 2023 reach their combined performance by fitting weights on
 * 475 labelled toddlers. We have none, and their weights cannot be
 * reconstructed from the reported AUCs, so a fitted score here would be
 * invention. The way out is not to guess weights but to score only signals
 * that can be read without a population norm:
 *
 *  - geometric preference has a published external cutoff;
 *  - cue following and response to name are within-subject contrasts — the
 *    child is compared against itself, inside a single stimulus medium.
 *
 * Three indices are deliberately absent. facingForward and headMovement carry
 * precedent AUCs but no transferable cutoff, so scoring them would mean making
 * a number up. The blink differential is out for two independent reasons: the
 * only non-actor block in the battery is the preferential-looking clip, so the
 * social/non-social contrast is fully confounded with rendering medium (vector
 * against real video), and a 16.75 s window quantises blink rate at 3.6 per
 * minute, which is coarser than the effect being looked for. All three stay on
 * the report as descriptive measures.
 *
 * What survives is a rule where no number is computed across the seam between
 * the two stimulus media: geometric preference is scored entirely inside the
 * video block, cue following and response to name entirely inside the vector
 * block.
 *
 * This recommends a follow-up examination. It does not diagnose, and a rule
 * that does not fire is not a clean bill of health.
 */
export const REFERRAL_RULE_VERSION = "neurogaze-referral-rule-v1";

/**
 * How many assessable signals must deviate before the rule fires.
 *
 * This is the one number in the rule that nobody published. It is a design
 * choice, justified the same way the GeoPref operating point was: by what the
 * resulting referral rate does to a real Posyandu queue. It is never presented
 * as a validated cutoff.
 */
export const REFERRAL_DEVIANT_THRESHOLD = 2;

export type SignalStatus = "menyimpang" | "normal" | "tidak_dapat_dinilai";

export type ReferralSignalId =
  | "geometric_preference"
  | "cue_following"
  | "response_to_name";

export type ReferralSignal = {
  id: ReferralSignalId;
  label: string;
  status: SignalStatus;
  /** What the session actually measured, in words the operator can read aloud. */
  measured: string;
  /** Why that measurement carries this status. */
  reason: string;
  /** Where the direction of the signal comes from. Never our own data. */
  source: string;
};

export type ReferralInput = {
  geopref: { percentGeometric: number | null; threshold: number; outcome: GeoprefOutcome } | null;
  jointAttention: { verdict: JointAttentionVerdict; trialsScored: number; trialsFollowed: number; pValue: number | null } | null;
  responseToName: ResponseToNameIndex | null;
};

export type ReferralRecommendation = {
  schemaVersion: typeof REFERRAL_RULE_VERSION;
  signals: ReferralSignal[];
  assessableCount: number;
  deviantCount: number;
  threshold: typeof REFERRAL_DEVIANT_THRESHOLD;
  recommendsFollowUp: boolean;
  headline: string;
  /** Always false. The components are literature-grounded; the rule is not fitted on toddlers. */
  validatedOnToddlers: false;
  /** Always false. Not firing means nothing was found, not that nothing is there. */
  reassures: false;
  thresholdStatus: "design_choice_not_validated_cutoff";
};

const percent = (value: number) => `${Math.round(value * 100)}%`;

const WEN = "Wen dkk. 2022, Scientific Reports, n=1.863, usia 12–48 bulan";
const RJA = "Paradigma responding joint attention (Billeci dkk. 2019); uji tanda dalam-subjek";
const NADIG = "Nadig dkk. 2007; Perochon dkk. 2023, Nature Medicine";

function geometricSignal(geopref: ReferralInput["geopref"]): ReferralSignal {
  const base = { id: "geometric_preference" as const, label: "Preferensi geometrik", source: WEN };
  // The 69% cutoff belongs to the published 60–90 s protocol. On a shortened
  // clip the comparison is not the one Wen et al. validated, so the signal is
  // unassessed. Calling it normal would be reading reassurance into a
  // measurement that was never made.
  if (!geopref || geopref.percentGeometric === null || geopref.outcome === "MEASURED_PROTOCOL_ABBREVIATED" || geopref.outcome === "WITHHELD_INSUFFICIENT_LOOKING") {
    return {
      ...base,
      status: "tidak_dapat_dinilai",
      measured: geopref?.percentGeometric === null || !geopref ? "tidak terukur" : `${percent(geopref.percentGeometric)} waktu pada pola geometrik`,
      reason: !geopref || geopref.percentGeometric === null
        ? "Waktu tatap pada kedua panel tidak cukup untuk dihitung."
        : "Klip yang tersedia lebih pendek daripada protokol terbit, jadi ambang 69% tidak berlaku pada sesi ini.",
    };
  }
  const deviant = geopref.percentGeometric >= geopref.threshold;
  const demonstration = isDemonstrationOutcome(geopref.outcome);
  const caveat = demonstration
    ? " Ambang diterapkan dalam mode demonstrasi pada klip yang lebih pendek daripada protokol terbit, jadi angka ini tidak sah untuk keputusan apa pun."
    : "";
  return {
    ...base,
    status: deviant ? "menyimpang" : "normal",
    measured: `${percent(geopref.percentGeometric)} waktu pada pola geometrik`,
    reason: (deviant
      ? `Di atas ambang terbit ${percent(geopref.threshold)}. Pola ini jarang muncul pada anak tanpa ASD (spesifisitas 98%).`
      : `Di bawah ambang terbit ${percent(geopref.threshold)}. Ambang ini melewatkan sebagian besar anak ASD, jadi hasil ini bukan tanda aman.`) + caveat,
  };
}

function cueSignal(profile: ReferralInput["jointAttention"]): ReferralSignal {
  const base = { id: "cue_following" as const, label: "Mengikuti isyarat arah", source: RJA };
  if (!profile || profile.verdict === "WITHHELD_TOO_FEW_TRIALS") {
    return {
      ...base,
      status: "tidak_dapat_dinilai",
      measured: profile ? `${profile.trialsScored} percobaan terbaca` : "tidak terukur",
      reason: "Percobaan yang terbaca terlalu sedikit untuk diuji.",
    };
  }
  const followed = `${profile.trialsFollowed} dari ${profile.trialsScored} percobaan`;
  if (profile.verdict === "FOLLOWS_CUES") {
    return {
      ...base,
      status: "normal",
      measured: followed,
      reason: "Tatapan ke target sesudah isyarat melebihi pembanding pra-isyarat pada anak yang sama, lebih sering daripada kebetulan.",
    };
  }
  // Eight trials cannot reach p < 0,05 below seven successes. Counting that as a
  // deviation would read absence of evidence as evidence of absence, so a
  // non-significant result whose lift still points upward is unassessed here.
  if (profile.verdict === "NOT_DISTINGUISHABLE") {
    return {
      ...base,
      status: "tidak_dapat_dinilai",
      measured: followed,
      reason: "Arah responsnya benar, tetapi delapan percobaan tidak cukup untuk membuktikannya di atas kebetulan. Ini batas sesi, bukan temuan tentang anak.",
    };
  }
  return {
    ...base,
    status: "menyimpang",
    measured: followed,
    reason: "Tatapan sesudah isyarat tidak pernah melebihi pembanding pra-isyarat pada anak yang sama, dan target diikuti pada paling banyak separuh percobaan.",
  };
}

function nameSignal(index: ResponseToNameIndex | null): ReferralSignal {
  const base = { id: "response_to_name" as const, label: "Respons terhadap panggilan nama", source: NADIG };
  if (!index || index.callsDelivered === 0 || index.proportion === null) {
    return { ...base, status: "tidak_dapat_dinilai", measured: "tidak terukur", reason: "Tidak ada panggilan yang terekam lengkap dengan jejak pose." };
  }
  const measured = `menoleh pada ${index.responses} dari ${index.callsDelivered} panggilan`;
  const deviant = index.responses <= 1;
  return {
    ...base,
    status: deviant ? "menyimpang" : "normal",
    measured,
    reason: deviant
      ? "Putaran kepala ke arah panggilan terekam paling banyak sekali."
      : "Putaran kepala ke arah panggilan terekam pada mayoritas panggilan.",
  };
}

export function buildReferralRecommendation(input: ReferralInput): ReferralRecommendation {
  const signals: ReferralSignal[] = [
    geometricSignal(input.geopref),
    cueSignal(input.jointAttention),
    nameSignal(input.responseToName),
  ];
  const assessableCount = signals.filter((item) => item.status !== "tidak_dapat_dinilai").length;
  const deviantCount = signals.filter((item) => item.status === "menyimpang").length;
  const recommendsFollowUp = assessableCount >= REFERRAL_DEVIANT_THRESHOLD && deviantCount >= REFERRAL_DEVIANT_THRESHOLD;

  return {
    schemaVersion: REFERRAL_RULE_VERSION,
    signals,
    assessableCount,
    deviantCount,
    threshold: REFERRAL_DEVIANT_THRESHOLD,
    recommendsFollowUp,
    headline: recommendsFollowUp
      ? `Disarankan pemeriksaan lanjutan · ${deviantCount} dari ${assessableCount} sinyal menyimpang`
      : assessableCount < REFERRAL_DEVIANT_THRESHOLD
        ? "Sinyal yang dapat dinilai terlalu sedikit untuk menyusun rekomendasi"
        : `Belum cukup sinyal untuk menyarankan rujukan · ${deviantCount} dari ${assessableCount} menyimpang`,
    validatedOnToddlers: false,
    reassures: false,
    thresholdStatus: "design_choice_not_validated_cutoff",
  };
}
