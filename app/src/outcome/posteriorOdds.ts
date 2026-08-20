import type { ReferralSignal, ReferralSignalId } from "./referralRecommendation";

/**
 * Layer 1 of the referral model: likelihood ratios instead of counting.
 *
 * Counting deviant signals says every signal is equally informative, and that
 * claim has no source behind it. Geometric preference carries a published
 * operating point; cue following does not. Multiplying likelihood ratios lets
 * the one signal that has a number do the work, and lets the other say nothing
 * — which is what "no published operating point" actually means.
 *
 * The design, the extraction work still outstanding, and the limits that have to
 * be printed alongside the number live in docs/model_rujukan.md.
 */

/** Wen et al. 2022, Scientific Reports 12:4253, n=1863, 12-48 months: sens 0.17, spec 0.98. */
export const GEOPREF_LR_POSITIVE = 8.5;
export const GEOPREF_LR_NEGATIVE = 0.85;
export const GEOPREF_LR_SOURCE = "Wen dkk. 2022, Scientific Reports 12:4253, n=1.863, usia 12–48 bulan (sens 0,17 · spec 0,98)";

/**
 * Pre-test probability when nothing else is known.
 *
 * In the field the honest starting point is the SDIDTK or M-CHAT result already
 * in the health worker's hand, not a population prevalence. This is the fallback
 * for a session run without one, and it is the conservative choice: a higher
 * pre-test probability would only make the posterior look stronger.
 */
export const DEFAULT_PRETEST_PROBABILITY = 0.01;

export type PosteriorTerm = {
  id: ReferralSignalId;
  label: string;
  likelihoodRatio: number;
  source: string;
  /** Why this signal carries the ratio it does. Present on every term. */
  note: string;
};

export type PosteriorOdds = {
  pretestProbability: number;
  posteriorProbability: number;
  terms: PosteriorTerm[];
  /**
   * Always true, and always a defect. The signals are measured on one child
   * within one session, so they are not conditionally independent and the
   * product overstates confidence. Reported rather than corrected, because the
   * damping factor would itself be invented.
   */
  assumesConditionalIndependence: true;
  /** Printed next to the number, every time it appears. */
  scopeNote: string;
};

const SCOPE_NOTE =
  "Rasio kemungkinan ini diukur Wen dkk. pada GeoPref 62,22 detik dengan eye-tracker lab. "
  + "Neurogaze menjalankan cuplikan 16,75 detik lewat kamera tablet, jadi titik operasinya "
  + "berpindah populasi dan angkanya berlaku sebagai ilustrasi besaran, bukan sebagai peluang "
  + "yang terkalibrasi untuk anak ini. Perkaliannya juga mengandaikan sinyal saling bebas, "
  + "padahal keduanya diukur pada anak yang sama.";

/**
 * The rule that keeps this honest: a signal with no published operating point
 * gets LR = 1 and moves nothing. So does a signal the session could not assess.
 * Neither is a defect to patch — both are the layer refusing to invent a number.
 */
function likelihoodRatio(signal: ReferralSignal): PosteriorTerm {
  if (signal.id === "geometric_preference") {
    if (signal.status === "menyimpang") {
      return {
        id: signal.id, label: signal.label, likelihoodRatio: GEOPREF_LR_POSITIVE, source: GEOPREF_LR_SOURCE,
        note: "Di atas ambang terbit. Pola ini muncul pada 2 dari 100 anak tanpa ASD, jadi menemukannya menaikkan peluang delapan setengah kali lipat.",
      };
    }
    if (signal.status === "normal") {
      return {
        id: signal.id, label: signal.label, likelihoodRatio: GEOPREF_LR_NEGATIVE, source: GEOPREF_LR_SOURCE,
        note: "Di bawah ambang terbit. Ambang ini hanya menangkap 17 dari 100 anak ASD, jadi tidak menemukannya nyaris tidak menurunkan peluang — 0,85, bukan mendekati nol.",
      };
    }
    return {
      id: signal.id, label: signal.label, likelihoodRatio: 1, source: GEOPREF_LR_SOURCE,
      note: "Tidak dapat dinilai pada sesi ini, jadi ia tidak menggerakkan peluang sama sekali.",
    };
  }
  return {
    id: signal.id, label: signal.label, likelihoodRatio: 1, source: "Belum ada titik operasi terbit",
    note: "Paradigmanya melaporkan perbedaan antar kelompok, bukan sensitivitas dan spesifisitas, jadi tidak ada rasio yang bisa dipasang. Sinyalnya tetap dilaporkan, tetapi tidak menggerakkan peluang.",
  };
}

/**
 * Returns null unless the threshold was actually applied to this session.
 *
 * On the shipped field path the licensed clip is shorter than the protocol the
 * cutoff was derived on, geometric preference is unassessable, and every term
 * would be 1 — a posterior identical to the prevalence, dressed up as a result.
 * Withholding it is the same behaviour the rest of the report already has.
 */
export function buildPosteriorOdds(input: {
  signals: readonly ReferralSignal[];
  /** True when validatedProtocol holds, or in a stage demonstration. */
  thresholdApplied: boolean;
  pretestProbability?: number;
}): PosteriorOdds | null {
  if (!input.thresholdApplied) return null;
  const pretestProbability = input.pretestProbability ?? DEFAULT_PRETEST_PROBABILITY;
  if (pretestProbability <= 0 || pretestProbability >= 1) return null;

  const terms = input.signals.map(likelihoodRatio);
  const pretestOdds = pretestProbability / (1 - pretestProbability);
  const posteriorOdds = terms.reduce((odds, term) => odds * term.likelihoodRatio, pretestOdds);

  return {
    pretestProbability,
    posteriorProbability: posteriorOdds / (1 + posteriorOdds),
    terms,
    assumesConditionalIndependence: true,
    scopeNote: SCOPE_NOTE,
  };
}
