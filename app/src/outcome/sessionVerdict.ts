import type { PosteriorOdds } from "./posteriorOdds";
import type { ReferralRecommendation } from "./referralRecommendation";
import type { SessionOutcome } from "./sessionOutcome";

/**
 * The one thing a room reads off the report, and the sentence a caregiver
 * repeats afterwards.
 *
 * The report already carried every piece of this — the composite headline, the
 * per-signal reasons, the limits — but spread across three sections and never at
 * the top. What a reader met first was a measurement (`92% waktu pada pola
 * geometrik`), and a measurement is not a decision. So the decision arrived
 * either late or not at all.
 *
 * Two rules govern this block, and they pull against each other on purpose:
 *
 *  1. The headline branches on `recommendsFollowUp` alone. Whether one signal
 *     was assessable or both does not change which of the two sentences appears,
 *     because a headline that hedges is a headline nobody can act on. On the
 *     positive-control recordings, nine of nine ordinary-viewing sessions failed
 *     to recommend a follow-up while only three produced a clean two-of-two
 *     count — branching on the count would have made the instrument look
 *     uncertain about a result it was not uncertain about.
 *  2. Everything the headline dropped reappears below it, in full, with sources.
 *     The nuance is not deleted; it is moved to where it belongs.
 *
 * There is one case with no verdict at all: nothing assessable was measured.
 * Saying "no sign worth following up" about a session that measured nothing
 * would be the reassurance this report exists to refuse.
 */

export type VerdictTone = "follow_up" | "no_follow_up";

export type VerdictReason = {
  id: string;
  label: string;
  /** What this session measured, in words an operator can read aloud. */
  measured: string;
  /** Why that measurement carries the weight it does. */
  body: string;
  /** Where the direction comes from. Never our own data. */
  source: string;
};

export type SessionVerdict = {
  tone: VerdictTone;
  headline: string;
  /** The count, unrounded, for whoever reads past the headline. */
  subline: string;
  reasons: VerdictReason[];
  /** The limit that has to travel with the verdict wherever it is printed. */
  caveat: string;
  /** True on a stage demonstration. False on a field session. */
  demonstration: boolean;
};

export const VERDICT_FOLLOW_UP = "Sebaiknya diperiksa lebih lanjut di Puskesmas atau rumah sakit";
export const VERDICT_NO_FOLLOW_UP = "Tidak ada tanda yang perlu ditindaklanjuti dari sesi ini";

const CAVEAT_FOLLOW_UP =
  "Ini peragaan, bukan rujukan resmi. Ambang 69% sengaja diterapkan pada klip yang lebih pendek "
  + "daripada protokol tempat ambang itu diturunkan, jadi sesi ini tidak mengeluarkan rujukan ke "
  + "sistem layanan dan bukan diagnosis. Bawa hasilnya bersama SDIDTK atau M-CHAT-R/F; keputusan "
  + "pemeriksaan tetap ada pada tenaga kesehatan.";

const CAVEAT_FOLLOW_UP_FIELD =
  "Ini bukan diagnosis. Ambang GeoPref menandai pola yang jarang muncul pada anak tanpa ASD, dan "
  + "itu alasan untuk memeriksa lebih lanjut — bukan kesimpulan. Bawa hasilnya bersama SDIDTK atau "
  + "M-CHAT-R/F; keputusan pemeriksaan tetap ada pada tenaga kesehatan.";

const CAVEAT_NO_FOLLOW_UP =
  "Ini bukan tanda aman. Ambang GeoPref dirancang untuk memastikan hasil positif, bukan untuk "
  + "menyingkirkan ASD: sensitivitasnya 17%, jadi sebagian besar anak ASD tidak tertangkap di sini. "
  + "Skrining perkembangan rutin tetap diperlukan, dan kekhawatiran orang tua tetap alasan yang sah "
  + "untuk memeriksakan anak.";

function subline(referral: ReferralRecommendation): string {
  const { assessableCount, deviantCount, threshold, signals } = referral;
  const unassessable = signals.length - assessableCount;
  if (referral.recommendsFollowUp) {
    return `Lajur komposit menyala · ${deviantCount} dari ${assessableCount} sinyal menyimpang`;
  }
  if (deviantCount > 0) {
    return `${deviantCount} dari ${assessableCount} sinyal menyimpang · di bawah batas ${threshold} sinyal untuk menyarankan rujukan`;
  }
  if (unassessable > 0) {
    return `${assessableCount} sinyal dinilai dan tidak menyimpang · ${unassessable} sinyal tidak dapat dinilai pada sesi ini`;
  }
  return `${assessableCount} dari ${signals.length} sinyal dinilai · tidak ada yang menyimpang`;
}

const formatPercent = (value: number) => `${(value * 100).toFixed(1).replace(".", ",")}%`;

/**
 * The posterior is a reason, not a headline.
 *
 * Seven point nine per cent justifies "have this looked at" and refutes "this is
 * a diagnosis" in the same breath, which is exactly the altitude this block
 * needs. Printing it as the verdict itself would invite reading it as a
 * calibrated probability for this child, and it is not one.
 */
function posteriorReason(posterior: PosteriorOdds): VerdictReason {
  const moved = posterior.terms.filter((term) => term.likelihoodRatio !== 1);
  return {
    id: "posterior_odds",
    label: "Peluang sesudah pengukuran",
    measured: `${formatPercent(posterior.pretestProbability)} → ${formatPercent(posterior.posteriorProbability)}`,
    body: moved.length
      ? `${moved.map((term) => `${term.label} membawa rasio kemungkinan ${term.likelihoodRatio.toString().replace(".", ",")}`).join("; ")}. `
        + `Dipasang pada peluang awal ${formatPercent(posterior.pretestProbability)}, hasilnya `
        + `${formatPercent(posterior.posteriorProbability)} — cukup tinggi untuk membenarkan pemeriksaan lanjutan, `
        + `dan jauh dari cukup untuk menyebutnya kesimpulan. ${posterior.scopeNote}`
      : `Tidak ada sinyal yang membawa titik operasi terbit pada sesi ini, jadi peluangnya tidak bergerak dari ${formatPercent(posterior.pretestProbability)}. ${posterior.scopeNote}`,
    source: posterior.terms.map((term) => term.source).join(" · "),
  };
}

export function buildSessionVerdict(input: {
  referral: ReferralRecommendation;
  outcome: SessionOutcome;
  posterior: PosteriorOdds | null;
  demonstrationMode: boolean;
}): SessionVerdict | null {
  if (input.outcome.kind === "WITHHELD") return null;
  // Nothing was placed against a reference, so there is no verdict to state.
  // The measurements below still print; this block simply does not appear.
  if (input.referral.assessableCount === 0) return null;

  const followUp = input.outcome.emitsReferral || input.referral.recommendsFollowUp;
  const reasons: VerdictReason[] = input.referral.signals.map((signal) => ({
    id: signal.id,
    label: signal.label,
    measured: signal.measured,
    body: signal.reason,
    source: signal.source,
  }));
  if (followUp && input.posterior) reasons.push(posteriorReason(input.posterior));

  return {
    tone: followUp ? "follow_up" : "no_follow_up",
    headline: followUp ? VERDICT_FOLLOW_UP : VERDICT_NO_FOLLOW_UP,
    subline: subline(input.referral),
    reasons,
    caveat: followUp
      ? (input.demonstrationMode ? CAVEAT_FOLLOW_UP : CAVEAT_FOLLOW_UP_FIELD)
      : CAVEAT_NO_FOLLOW_UP,
    demonstration: input.demonstrationMode,
  };
}
