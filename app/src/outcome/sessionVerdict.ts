import type { PosteriorOdds } from "./posteriorOdds";
import type { ReferralRecommendation } from "./referralRecommendation";
import type { SessionOutcome } from "./sessionOutcome";
import { BCP47, DEFAULT_LOCALE, type Locale } from "../i18n/locale";

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

/**
 * Every sentence the verdict block can print, in both languages.
 *
 * The two exported constants above keep their Indonesian values because the
 * contract tests match on them by name; the tables below are what the rendered
 * verdict actually reads from.
 */
type VerdictCopy = {
  followUp: string;
  noFollowUp: string;
  demoFollowUp: string;
  demoNoFollowUp: string;
  caveatFollowUpField: string;
  caveatNoFollowUp: string;
  caveatDemonstration: string;
  posteriorLabel: string;
  posteriorLabelDemo: string;
  likelihoodTerm: (label: string, ratio: string) => string;
  demoMoved: (terms: string, pretest: string, posterior: string, scope: string) => string;
  demoUnmoved: (pretest: string, scope: string) => string;
  fieldMoved: (terms: string, pretest: string, posterior: string, scope: string) => string;
  fieldUnmoved: (pretest: string, scope: string) => string;
  sublineFired: (deviant: number, assessable: number) => string;
  sublineBelow: (deviant: number, assessable: number, threshold: number) => string;
  sublinePartial: (assessable: number, unassessable: number) => string;
  sublineClean: (assessable: number, total: number) => string;
  demoSublineFired: (deviant: number, assessable: number) => string;
  demoSublineDeviant: (deviant: number, assessable: number) => string;
  demoSublinePartial: (assessable: number, unassessable: number) => string;
  demoSublineClean: (assessable: number, total: number) => string;
};

const COPY: Record<Locale, VerdictCopy> = {
  id: {
    followUp: VERDICT_FOLLOW_UP,
    noFollowUp: VERDICT_NO_FOLLOW_UP,
    demoFollowUp: "Arsitektur menampilkan respons pola produksi",
    demoNoFollowUp: "Arsitektur menampilkan respons kontrol biasa",
    caveatFollowUpField:
      "Ini bukan diagnosis. Ambang GeoPref menandai pola yang jarang muncul pada anak tanpa ASD, dan "
      + "itu alasan untuk memeriksa lebih lanjut — bukan kesimpulan. Bawa hasilnya bersama SDIDTK atau "
      + "M-CHAT-R/F; keputusan pemeriksaan tetap ada pada tenaga kesehatan.",
    caveatNoFollowUp:
      "Ini bukan tanda aman. Ambang GeoPref dirancang untuk memastikan hasil positif, bukan untuk "
      + "menyingkirkan ASD: sensitivitasnya 17%, jadi sebagian besar anak ASD tidak tertangkap di sini. "
      + "Skrining perkembangan rutin tetap diperlukan, dan kekhawatiran orang tua tetap alasan yang sah "
      + "untuk memeriksakan anak.",
    caveatDemonstration:
      "Peragaan ini memakai peserta dewasa dan klip pendek. Angka dan status di atas hanya "
      + "menunjukkan respons arsitektur; keduanya bukan hasil klinis.",
    posteriorLabel: "Peluang sesudah pengukuran",
    posteriorLabelDemo: "Respons perhitungan",
    likelihoodTerm: (label, ratio) => `${label} membawa rasio kemungkinan ${ratio}`,
    demoMoved: (terms, pretest, posterior, scope) =>
      `${terms}. Dengan nilai awal ${pretest}, arsitektur menghasilkan ${posterior}. `
      + `Perhitungan ini hanya menunjukkan jalur hitung pada peragaan. ${scope}`,
    demoUnmoved: (pretest, scope) =>
      `Tidak ada sinyal yang mengubah nilai awal ${pretest} pada peragaan ini. ${scope}`,
    fieldMoved: (terms, pretest, posterior, scope) =>
      `${terms}. Dipasang pada peluang awal ${pretest}, hasilnya `
      + `${posterior} — cukup tinggi untuk membenarkan pemeriksaan lanjutan, `
      + `dan jauh dari cukup untuk menyebutnya kesimpulan. ${scope}`,
    fieldUnmoved: (pretest, scope) =>
      `Tidak ada sinyal yang membawa titik operasi terbit pada sesi ini, jadi peluangnya tidak bergerak dari ${pretest}. ${scope}`,
    sublineFired: (deviant, assessable) =>
      `Lajur komposit menyala · ${deviant} dari ${assessable} sinyal menyimpang`,
    sublineBelow: (deviant, assessable, threshold) =>
      `${deviant} dari ${assessable} sinyal menyimpang · di bawah batas ${threshold} sinyal untuk menyarankan rujukan`,
    sublinePartial: (assessable, unassessable) =>
      `${assessable} sinyal dinilai dan tidak menyimpang · ${unassessable} sinyal tidak dapat dinilai pada sesi ini`,
    sublineClean: (assessable, total) =>
      `${assessable} dari ${total} sinyal dinilai · tidak ada yang menyimpang`,
    demoSublineFired: (deviant, assessable) =>
      `Respons arsitektur pola produksi · ${deviant} dari ${assessable} sinyal menyimpang`,
    demoSublineDeviant: (deviant, assessable) =>
      `Respons arsitektur kontrol biasa · ${deviant} dari ${assessable} sinyal menyimpang`,
    demoSublinePartial: (assessable, unassessable) =>
      `Respons arsitektur kontrol biasa · ${assessable} sinyal dinilai dan ${unassessable} sinyal tidak dapat dinilai`,
    demoSublineClean: (assessable, total) =>
      `Respons arsitektur kontrol biasa · ${assessable} dari ${total} sinyal dinilai`,
  },
  en: {
    followUp: "This is worth having looked at further at a Puskesmas or hospital",
    noFollowUp: "No sign from this session needs following up",
    demoFollowUp: "The architecture shows its produced-pattern response",
    demoNoFollowUp: "The architecture shows its ordinary-control response",
    caveatFollowUpField:
      "This is not a diagnosis. The GeoPref threshold marks a pattern that is uncommon in children "
      + "without ASD, and that is a reason to look further — not a conclusion. Take the result "
      + "together with SDIDTK or M-CHAT-R/F; the examination decision remains a health worker's.",
    caveatNoFollowUp:
      "This is not an all-clear. The GeoPref threshold is designed to make positives certain, not to "
      + "rule ASD out: its sensitivity is 17%, so most children with ASD are not caught here. Routine "
      + "developmental screening is still required, and a parent's concern remains a legitimate "
      + "reason to have a child seen.",
    caveatDemonstration:
      "This demonstration uses an adult participant and a short clip. The figures and status above "
      + "show the architecture's response only; neither is a clinical result.",
    posteriorLabel: "Probability after measurement",
    posteriorLabelDemo: "Computation response",
    likelihoodTerm: (label, ratio) => `${label} carries a likelihood ratio of ${ratio}`,
    demoMoved: (terms, pretest, posterior, scope) =>
      `${terms}. Starting from ${pretest}, the architecture produces ${posterior}. `
      + `This computation only shows the calculation path in a demonstration. ${scope}`,
    demoUnmoved: (pretest, scope) =>
      `No signal moved the starting value of ${pretest} in this demonstration. ${scope}`,
    fieldMoved: (terms, pretest, posterior, scope) =>
      `${terms}. Applied to a pre-test probability of ${pretest}, the result is `
      + `${posterior} — high enough to justify a follow-up examination, `
      + `and nowhere near high enough to call it a conclusion. ${scope}`,
    fieldUnmoved: (pretest, scope) =>
      `No signal carried a published operating point in this session, so the probability does not move from ${pretest}. ${scope}`,
    sublineFired: (deviant, assessable) =>
      `The composite lane fired · ${deviant} of ${assessable} signals deviant`,
    sublineBelow: (deviant, assessable, threshold) =>
      `${deviant} of ${assessable} signals deviant · below the ${threshold}-signal cutoff for recommending a referral`,
    sublinePartial: (assessable, unassessable) =>
      `${assessable} signals assessed and not deviant · ${unassessable} signals not assessable in this session`,
    sublineClean: (assessable, total) =>
      `${assessable} of ${total} signals assessed · none deviant`,
    demoSublineFired: (deviant, assessable) =>
      `Produced-pattern architecture response · ${deviant} of ${assessable} signals deviant`,
    demoSublineDeviant: (deviant, assessable) =>
      `Ordinary-control architecture response · ${deviant} of ${assessable} signals deviant`,
    demoSublinePartial: (assessable, unassessable) =>
      `Ordinary-control architecture response · ${assessable} signals assessed and ${unassessable} not assessable`,
    demoSublineClean: (assessable, total) =>
      `Ordinary-control architecture response · ${assessable} of ${total} signals assessed`,
  },
};

function subline(referral: ReferralRecommendation, locale: Locale): string {
  const copy = COPY[locale];
  const { assessableCount, deviantCount, threshold, signals } = referral;
  const unassessable = signals.length - assessableCount;
  if (referral.recommendsFollowUp) return copy.sublineFired(deviantCount, assessableCount);
  if (deviantCount > 0) return copy.sublineBelow(deviantCount, assessableCount, threshold);
  if (unassessable > 0) return copy.sublinePartial(assessableCount, unassessable);
  return copy.sublineClean(assessableCount, signals.length);
}

function demonstrationSubline(referral: ReferralRecommendation, locale: Locale): string {
  const copy = COPY[locale];
  const { assessableCount, deviantCount, signals } = referral;
  const unassessable = signals.length - assessableCount;
  if (referral.recommendsFollowUp) return copy.demoSublineFired(deviantCount, assessableCount);
  if (deviantCount > 0) return copy.demoSublineDeviant(deviantCount, assessableCount);
  if (unassessable > 0) return copy.demoSublinePartial(assessableCount, unassessable);
  return copy.demoSublineClean(assessableCount, signals.length);
}

const formatPercent = (value: number, locale: Locale) =>
  `${(value * 100).toLocaleString(BCP47[locale], { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;

/**
 * The posterior is a reason, not a headline.
 *
 * Seven point nine per cent justifies "have this looked at" and refutes "this is
 * a diagnosis" in the same breath, which is exactly the altitude this block
 * needs. Printing it as the verdict itself would invite reading it as a
 * calibrated probability for this child, and it is not one.
 */
function posteriorReason(
  posterior: PosteriorOdds,
  demonstrationMode: boolean,
  locale: Locale,
): VerdictReason {
  const copy = COPY[locale];
  const moved = posterior.terms.filter((term) => term.likelihoodRatio !== 1);
  const terms = moved
    .map((term) => copy.likelihoodTerm(
      term.label,
      term.likelihoodRatio.toLocaleString(BCP47[locale]),
    ))
    .join("; ");
  const pretest = formatPercent(posterior.pretestProbability, locale);
  const after = formatPercent(posterior.posteriorProbability, locale);
  return {
    id: "posterior_odds",
    label: demonstrationMode ? copy.posteriorLabelDemo : copy.posteriorLabel,
    measured: `${pretest} → ${after}`,
    body: demonstrationMode
      ? moved.length
        ? copy.demoMoved(terms, pretest, after, posterior.scopeNote)
        : copy.demoUnmoved(pretest, posterior.scopeNote)
      : moved.length
        ? copy.fieldMoved(terms, pretest, after, posterior.scopeNote)
        : copy.fieldUnmoved(pretest, posterior.scopeNote),
    source: posterior.terms.map((term) => term.source).join(" · "),
  };
}

export function buildSessionVerdict(input: {
  referral: ReferralRecommendation;
  outcome: SessionOutcome;
  posterior: PosteriorOdds | null;
  demonstrationMode: boolean;
}, locale: Locale = DEFAULT_LOCALE): SessionVerdict | null {
  const copy = COPY[locale];
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
  if (followUp && input.posterior) reasons.push(posteriorReason(input.posterior, input.demonstrationMode, locale));

  const headline = input.demonstrationMode
    ? followUp ? copy.demoFollowUp : copy.demoNoFollowUp
    : followUp ? copy.followUp : copy.noFollowUp;

  return {
    tone: followUp ? "follow_up" : "no_follow_up",
    headline,
    subline: input.demonstrationMode
      ? demonstrationSubline(input.referral, locale)
      : subline(input.referral, locale),
    reasons,
    caveat: input.demonstrationMode
      ? copy.caveatDemonstration
      : followUp
        ? copy.caveatFollowUpField
        : copy.caveatNoFollowUp,
    demonstration: input.demonstrationMode,
  };
}
