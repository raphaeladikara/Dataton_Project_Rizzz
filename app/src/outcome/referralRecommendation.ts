import { isDemonstrationOutcome, type GeoprefOutcome } from "../geopref/score";
import type { JointAttentionVerdict } from "../inference/jointAttention";
import { DEFAULT_LOCALE, type Locale } from "../i18n/locale";

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
 *  - cue following is a within-subject contrast — the child is compared
 *    against itself, inside a single stimulus medium.
 *
 * Four indices are deliberately absent, listed in QUARANTINED_SIGNALS below
 * where the reasons live. All of them stay on the report as descriptive
 * measures; being unfit to decide is not the same as being unfit to report.
 *
 * What survives is a rule where no number is computed across the seam between
 * the two stimulus media: geometric preference is scored entirely inside the
 * video block, cue following entirely inside the vector block.
 *
 * Two signals against a threshold of two means the rule now needs both to
 * deviate, and geometric preference is unassessable while the licensed clip is
 * shorter than the published protocol. The composite therefore cannot fire in
 * the field today. That is the honest state of it, not a defect: the lane is
 * built, its inputs are not all available yet, and lowering the threshold to
 * one would turn a single index into a score.
 *
 * This recommends a follow-up examination. It does not diagnose, and a rule
 * that does not fire is not a clean bill of health.
 */
export const REFERRAL_RULE_VERSION = "neurogaze-referral-rule-v2-name-quarantined";

/**
 * Measured, reported, and kept out of the decision — with the reason attached,
 * so nobody has to guess later whether an omission was principled or an
 * oversight.
 */
export const QUARANTINED_SIGNALS: readonly { id: string; label: string; reason: string }[] = [
  {
    id: "response_to_name",
    label: "Respons terhadap panggilan nama",
    reason:
      "Paradigma terbitnya memanggil dari belakang anak dan mengkode putaran kepala ke arah pemanggil. Neurogaze bicara lewat speaker tablet, jadi suaranya datang dari layar yang sedang ditatap dan tidak ada arah yang harus dicari. Speaker di belakang peserta memulihkannya di lab tetapi tidak realistis di meja Posyandu, sehingga sinyal ini tidak dapat dikumpulkan sebagaimana ia divalidasi.",
  },
  {
    id: "facing_forward",
    label: "Menghadap layar",
    reason: "Membawa AUC preseden tetapi tidak ada ambang yang dapat dipindahkan, jadi menilainya berarti mengarang angka.",
  },
  {
    id: "head_movement",
    label: "Gerak kepala",
    reason: "Sama seperti menghadap layar: ada preseden, tidak ada titik operasi.",
  },
  {
    id: "blink_social",
    label: "Diferensial kedipan",
    reason:
      "Satu-satunya blok non-aktor adalah klip pilihan tontonan, sehingga kontras sosial/non-sosial tercampur penuh dengan medium penyajian; dan jendela 16,75 detik mengkuantisasi laju kedip pada 3,6 per menit, lebih kasar daripada efek yang dicari.",
  },
];

/**
 * How many assessable signals must deviate before the rule fires.
 *
 * Nobody published this number, and it is never presented as a validated
 * cutoff. What it is not is arbitrary: with the two signals that ship, two is
 * the only value that cannot make the composite lane worse than the published
 * operating point it is built on. The derivation is in
 * REFERRAL_THRESHOLD_RATIONALE and needs no new data.
 */
export const REFERRAL_DEVIANT_THRESHOLD = 2;

/** Wen et al. 2022: specificity 0.98, so at most 2 in 100 non-ASD children clear it. */
const GEOPREF_FALSE_POSITIVE_RATE = 0.02;

/**
 * Why two, derived rather than chosen.
 *
 * The composite fires only when every assessable signal deviates, so its
 * false-positive rate is P(A and B). For any two events,
 *
 *     P(A and B) <= min(P(A), P(B))
 *
 * and geometric preference carries a published false-positive rate of 0.02.
 * The composite lane therefore has specificity of at least 98% — a bound, not
 * an estimate, and one that holds whether or not the signals are independent.
 * That matters here, because they are measured on the same child within one
 * session and are certainly not independent.
 *
 * Dropping the threshold to one inverts the inequality:
 *
 *     P(A or B) >= max(P(A), P(B)) >= 0.02
 *
 * so specificity becomes at most 98% and can be far worse, depending entirely
 * on a cue-following false-positive rate nobody has published.
 *
 * There is a second consequence worth stating separately. At a threshold of two
 * the rule cannot fire unless geometric preference deviates, so every referral
 * the composite lane produces is one the published GeoPref lane would also
 * produce. The composite is a strict subset, and its referral load can never
 * exceed the 2.2% that operating point already implies — which is the constraint
 * a practitioner described as the binding one.
 *
 * None of this makes two a validated cutoff. It makes two the only value that
 * cannot degrade a cutoff somebody else validated.
 */
export const REFERRAL_THRESHOLD_RATIONALE = {
  threshold: REFERRAL_DEVIANT_THRESHOLD,
  /** Holds without assuming the signals are conditionally independent. */
  assumesIndependence: false,
  specificityFloor: 1 - GEOPREF_FALSE_POSITIVE_RATE,
  thresholdOneSpecificityCeiling: 1 - GEOPREF_FALSE_POSITIVE_RATE,
  bound: "Spesifisitas lajur komposit sekurang-kurangnya 98%, karena P(A dan B) ≤ min(P(A), P(B)) dan preferensi geometrik membawa laju positif palsu terbit 0,02.",
  subsetOfPublishedLane: true,
  derivation: [
    "Aturan hanya menyala kalau seluruh sinyal yang dapat dinilai menyimpang, jadi laju positif palsunya adalah P(A dan B).",
    "Untuk dua kejadian apa pun, P(A dan B) ≤ min(P(A), P(B)); dengan spesifisitas GeoPref terbit 0,98, batas atas laju positif palsu komposit adalah 0,02.",
    "Menurunkan ambang ke satu membalik pertidaksamaannya menjadi P(A atau B) ≥ maks(P(A), P(B)) ≥ 0,02, sehingga spesifisitasnya paling banter 98% dan bisa jauh lebih buruk.",
    "Pada ambang dua, aturan tidak dapat menyala tanpa GeoPref menyimpang, jadi rujukan lajur ini himpunan bagian dari lajur GeoPref dan bebannya tidak melebihi 2,2%.",
  ],
  stillNotValidated:
    "Ini menjadikan dua sebagai satu-satunya nilai yang tidak dapat memperburuk titik operasi terbit. Ia tidak menjadikannya cutoff yang tervalidasi pada balita; itu tetap Gate C.",
  source: "Wen dkk. 2022, Scientific Reports 12:4253 (spesifisitas 0,98) · docs/model_rujukan.md",
} as const;

export type SignalStatus = "menyimpang" | "normal" | "tidak_dapat_dinilai";

export type ReferralSignalId =
  | "geometric_preference"
  | "cue_following";

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
  geopref: {
    percentGeometric: number | null;
    percentGeometricCi?: readonly [number, number] | null;
    threshold: number;
    outcome: GeoprefOutcome;
  } | null;
  jointAttention: { verdict: JointAttentionVerdict; trialsScored: number; trialsFollowed: number; pValue: number | null } | null;
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

/**
 * Everything this rule can say about a session, in both languages.
 *
 * `SignalStatus` itself stays Indonesian — "menyimpang", "normal",
 * "tidak_dapat_dinilai" are codes the audit log and the contract tests match
 * on, not text anybody reads. What gets translated is the sentence attached to
 * each code.
 */
type ReferralCopy = {
  wen: string;
  rja: string;
  geometricLabel: string;
  cueLabel: string;
  notMeasured: string;
  geoMeasured: (value: string, spread: string) => string;
  geoSpread: (low: string, high: string) => string;
  geoNoDwell: string;
  geoStraddles: (threshold: string) => string;
  geoAbbreviated: string;
  geoDemoCaveat: string;
  geoDeviant: (threshold: string) => string;
  geoNormal: (threshold: string) => string;
  cueTrialsRead: (count: number) => string;
  cueTooFew: string;
  cueFollowed: (followed: number, scored: number) => string;
  cueNormal: string;
  cueIndistinguishable: string;
  cueDeviant: string;
  headlineRefer: (deviant: number, assessable: number) => string;
  headlineNone: string;
  headlinePartialDeviant: (deviant: number) => string;
  headlinePartialClean: string;
  headlineBelowThreshold: (deviant: number, assessable: number, threshold: number) => string;
  headlineNoDeviation: (assessable: number) => string;
};

const COPY: Record<Locale, ReferralCopy> = {
  id: {
    wen: "Wen dkk. 2022, Scientific Reports, n=1.863, usia 12–48 bulan",
    rja: "Paradigma responding joint attention (Billeci dkk. 2019); uji tanda dalam-subjek",
    geometricLabel: "Preferensi geometrik",
    cueLabel: "Mengikuti isyarat arah",
    notMeasured: "tidak terukur",
    geoMeasured: (value, spread) => `${value} waktu pada pola geometrik${spread}`,
    geoSpread: (low, high) => ` (95% CI ${low}–${high})`,
    geoNoDwell: "Waktu tatap pada kedua panel tidak cukup untuk dihitung.",
    geoStraddles: (threshold) =>
      `Selang kepercayaan sesi ini melintasi ambang ${threshold}, jadi angkanya tidak cukup pasti untuk diletakkan di salah satu sisi. Ini batas panjang pengukuran, bukan temuan tentang anak.`,
    geoAbbreviated:
      "Klip yang tersedia lebih pendek daripada protokol terbit, jadi ambang 69% tidak berlaku pada sesi ini.",
    geoDemoCaveat:
      " Ambang diterapkan dalam mode demonstrasi pada klip yang lebih pendek daripada protokol terbit, jadi angka ini tidak sah untuk keputusan apa pun.",
    geoDeviant: (threshold) =>
      `Seluruh selang kepercayaan berada di atas ambang terbit ${threshold}. Pola ini jarang muncul pada anak tanpa ASD (spesifisitas 98%).`,
    geoNormal: (threshold) =>
      `Seluruh selang kepercayaan berada di bawah ambang terbit ${threshold}. Ambang ini melewatkan sebagian besar anak ASD, jadi hasil ini bukan tanda aman.`,
    cueTrialsRead: (count) => `${count} percobaan terbaca`,
    cueTooFew: "Percobaan yang terbaca terlalu sedikit untuk diuji.",
    cueFollowed: (followed, scored) => `${followed} dari ${scored} percobaan`,
    cueNormal:
      "Tatapan ke target sesudah isyarat melebihi pembanding pra-isyarat pada anak yang sama, lebih sering daripada kebetulan.",
    cueIndistinguishable:
      "Arah responsnya benar, tetapi delapan percobaan tidak cukup untuk membuktikannya di atas kebetulan. Ini batas sesi, bukan temuan tentang anak.",
    cueDeviant:
      "Tatapan sesudah isyarat tidak pernah melebihi pembanding pra-isyarat pada anak yang sama, dan target diikuti pada paling banyak separuh percobaan.",
    headlineRefer: (deviant, assessable) =>
      `Disarankan pemeriksaan lanjutan · ${deviant} dari ${assessable} sinyal menyimpang`,
    headlineNone: "Belum ada sinyal yang dapat dinilai pada sesi ini",
    headlinePartialDeviant: (deviant) =>
      `${deviant} sinyal menyimpang, dan sinyal pembandingnya tidak dapat dinilai · belum cukup untuk menyarankan rujukan`,
    headlinePartialClean:
      "Sinyal yang dapat dinilai tidak menyimpang, dan sinyal pembandingnya tidak dapat dinilai",
    headlineBelowThreshold: (deviant, assessable, threshold) =>
      `${deviant} dari ${assessable} sinyal menyimpang · di bawah batas ${threshold} untuk menyarankan rujukan`,
    headlineNoDeviation: (assessable) =>
      `Tidak ada sinyal yang menyimpang · ${assessable} dari ${assessable} sinyal dinilai`,
  },
  en: {
    wen: "Wen et al. 2022, Scientific Reports, n=1,863, ages 12–48 months",
    rja: "Responding joint attention paradigm (Billeci et al. 2019); within-subject sign test",
    geometricLabel: "Geometric preference",
    cueLabel: "Following the directional cue",
    notMeasured: "not measured",
    geoMeasured: (value, spread) => `${value} of gaze time on the geometric pattern${spread}`,
    geoSpread: (low, high) => ` (95% CI ${low}–${high})`,
    geoNoDwell: "Gaze time across the two panels is insufficient to compute.",
    geoStraddles: (threshold) =>
      `This session's confidence interval crosses the ${threshold} threshold, so the figure is not certain enough to place on either side. That is a limit of the measurement's length, not a finding about the child.`,
    geoAbbreviated:
      "The available clip is shorter than the published protocol, so the 69% threshold does not apply to this session.",
    geoDemoCaveat:
      " The threshold was applied in demonstration mode on a clip shorter than the published protocol, so this figure is not valid for any decision.",
    geoDeviant: (threshold) =>
      `The entire confidence interval sits above the published ${threshold} threshold. This pattern is uncommon in children without ASD (specificity 98%).`,
    geoNormal: (threshold) =>
      `The entire confidence interval sits below the published ${threshold} threshold. This threshold misses most children with ASD, so this result is not an all-clear.`,
    cueTrialsRead: (count) => `${count} trials read`,
    cueTooFew: "Too few trials were readable to test.",
    cueFollowed: (followed, scored) => `${followed} of ${scored} trials`,
    cueNormal:
      "Gaze to the target after the cue exceeded the same child's pre-cue baseline more often than chance.",
    cueIndistinguishable:
      "The response points the right way, but eight trials are not enough to establish it above chance. That is a limit of the session, not a finding about the child.",
    cueDeviant:
      "Gaze after the cue never exceeded the same child's pre-cue baseline, and the target was followed on at most half the trials.",
    headlineRefer: (deviant, assessable) =>
      `Follow-up examination recommended · ${deviant} of ${assessable} signals deviant`,
    headlineNone: "No signal is assessable in this session yet",
    headlinePartialDeviant: (deviant) =>
      `${deviant} signal deviant, and its counterpart is not assessable · not enough to recommend a referral`,
    headlinePartialClean:
      "The assessable signal is not deviant, and its counterpart is not assessable",
    headlineBelowThreshold: (deviant, assessable, threshold) =>
      `${deviant} of ${assessable} signals deviant · below the ${threshold}-signal cutoff for recommending a referral`,
    headlineNoDeviation: (assessable) =>
      `No signal is deviant · ${assessable} of ${assessable} signals assessed`,
  },
};

function geometricSignal(geopref: ReferralInput["geopref"], locale: Locale): ReferralSignal {
  const copy = COPY[locale];
  const base = { id: "geometric_preference" as const, label: copy.geometricLabel, source: copy.wen };
  // The 69% cutoff belongs to the published 60–90 s protocol. On a shortened
  // clip the comparison is not the one Wen et al. validated, so the signal is
  // unassessed. Calling it normal would be reading reassurance into a
  // measurement that was never made.
  if (
    !geopref
    || geopref.percentGeometric === null
    || geopref.outcome === "MEASURED_PROTOCOL_ABBREVIATED"
    || geopref.outcome === "MEASURED_INTERVAL_STRADDLES_THRESHOLD"
    || geopref.outcome === "WITHHELD_INSUFFICIENT_LOOKING"
  ) {
    const interval = geopref?.percentGeometricCi;
    return {
      ...base,
      status: "tidak_dapat_dinilai",
      measured: geopref?.percentGeometric === null || !geopref
        ? copy.notMeasured
        : copy.geoMeasured(
            percent(geopref.percentGeometric),
            interval ? copy.geoSpread(percent(interval[0]), percent(interval[1])) : "",
          ),
      reason: !geopref || geopref.percentGeometric === null
        ? copy.geoNoDwell
        : geopref.outcome === "MEASURED_INTERVAL_STRADDLES_THRESHOLD"
          ? copy.geoStraddles(percent(geopref.threshold))
          : copy.geoAbbreviated,
    };
  }
  const interval = geopref.percentGeometricCi ?? null;
  // Deviant means the whole interval sits above the cutoff, not the point
  // estimate alone. Reading a 71% session as deviant while its interval runs
  // from 62 to 79 asserts a difference the measurement cannot carry.
  const deviant = interval ? interval[0] >= geopref.threshold : geopref.percentGeometric >= geopref.threshold;
  const demonstration = isDemonstrationOutcome(geopref.outcome);
  const caveat = demonstration ? copy.geoDemoCaveat : "";
  const spread = interval ? copy.geoSpread(percent(interval[0]), percent(interval[1])) : "";
  return {
    ...base,
    status: deviant ? "menyimpang" : "normal",
    measured: copy.geoMeasured(percent(geopref.percentGeometric), spread),
    reason: (deviant
      ? copy.geoDeviant(percent(geopref.threshold))
      : copy.geoNormal(percent(geopref.threshold))) + caveat,
  };
}

function cueSignal(profile: ReferralInput["jointAttention"], locale: Locale): ReferralSignal {
  const copy = COPY[locale];
  const base = { id: "cue_following" as const, label: copy.cueLabel, source: copy.rja };
  if (!profile || profile.verdict === "WITHHELD_TOO_FEW_TRIALS") {
    return {
      ...base,
      status: "tidak_dapat_dinilai",
      measured: profile ? copy.cueTrialsRead(profile.trialsScored) : copy.notMeasured,
      reason: copy.cueTooFew,
    };
  }
  const followed = copy.cueFollowed(profile.trialsFollowed, profile.trialsScored);
  if (profile.verdict === "FOLLOWS_CUES") {
    return {
      ...base,
      status: "normal",
      measured: followed,
      reason: copy.cueNormal,
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
      reason: copy.cueIndistinguishable,
    };
  }
  return {
    ...base,
    status: "menyimpang",
    measured: followed,
    reason: copy.cueDeviant,
  };
}

/**
 * What the lane says when it cannot reach a recommendation.
 *
 * It used to say one thing — "sinyal yang dapat dinilai terlalu sedikit" —
 * whenever fewer than two signals were assessable, which is every field session
 * while the licensed clip is short. So a child who followed none of the eight
 * cues and a child who followed all eight produced the same sentence, and the
 * one measurement the session did make was thrown away at the headline.
 *
 * The rule is unchanged: two deviant signals, or no recommendation. What
 * changes is that not recommending is no longer the same as not measuring.
 */
function referralHeadline(input: {
  recommendsFollowUp: boolean;
  assessableCount: number;
  deviantCount: number;
  locale: Locale;
}): string {
  const { recommendsFollowUp, assessableCount, deviantCount, locale } = input;
  const copy = COPY[locale];
  if (recommendsFollowUp) {
    return copy.headlineRefer(deviantCount, assessableCount);
  }
  if (assessableCount === 0) return copy.headlineNone;
  if (assessableCount < REFERRAL_DEVIANT_THRESHOLD) {
    return deviantCount > 0
      ? copy.headlinePartialDeviant(deviantCount)
      : copy.headlinePartialClean;
  }
  // Every signal was assessable and the rule still did not fire. "Belum cukup
  // sinyal" is false here, because the session assessed all of them, and this
  // is the branch an ordinary participant lands in on stage — the run whose
  // whole job is to show that the instrument does not simply refer everyone.
  // It has to report the count it measured rather than borrow the sentence
  // written for a session that could only assess one signal. Not deviating is
  // still not reassurance; referralLimit on the report carries that.
  return deviantCount > 0
    ? copy.headlineBelowThreshold(deviantCount, assessableCount, REFERRAL_DEVIANT_THRESHOLD)
    : copy.headlineNoDeviation(assessableCount);
}

export function buildReferralRecommendation(
  input: ReferralInput,
  locale: Locale = DEFAULT_LOCALE,
): ReferralRecommendation {
  const signals: ReferralSignal[] = [
    geometricSignal(input.geopref, locale),
    cueSignal(input.jointAttention, locale),
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
    headline: referralHeadline({ recommendsFollowUp, assessableCount, deviantCount, locale }),
    validatedOnToddlers: false,
    reassures: false,
    thresholdStatus: "design_choice_not_validated_cutoff",
  };
}
