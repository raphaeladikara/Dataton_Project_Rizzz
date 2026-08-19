import type { Point } from "../domain/types";
import { classifyGeoprefAoi, projectGeoprefAoi, type GeoprefSide } from "./protocol";

/** Wen et al. 2022, Scientific Reports: >=69% geometric fixation, n=1863, 12-48 months. */
export const GEOPREF_THRESHOLD = 0.69;
export const MIN_AOI_COVERAGE = 0.5;
export const MIN_VALID_SAMPLES = 60;
const MAX_DWELL_INTERVAL_MS = 180;

export type GeoprefOutcome =
  | "GEOMETRIC_PREFERENCE"
  | "NO_GEOMETRIC_PREFERENCE"
  | "MEASURED_PROTOCOL_ABBREVIATED"
  /**
   * Demonstration only. The published threshold is applied to a clip shorter
   * than the protocol it was derived on, so the comparison is not the one Wen
   * et al. validated. These two exist so the full report can be shown on stage
   * without the shipped rule-in outcome ever becoming reachable on a shortened
   * protocol; sessionOutcome hard-codes emitsReferral to false for them.
   */
  | "GEOMETRIC_PREFERENCE_DEMONSTRATION"
  | "NO_GEOMETRIC_PREFERENCE_DEMONSTRATION"
  /**
   * Enough looking to produce a percentage, not enough to place it on one side
   * of the cutoff. Distinct from WITHHELD: the session measured something and
   * reports it, and only the comparison against 69% is refused.
   */
  | "MEASURED_INTERVAL_STRADDLES_THRESHOLD"
  | "WITHHELD_INSUFFICIENT_LOOKING";

export function isDemonstrationOutcome(outcome: GeoprefOutcome): boolean {
  return outcome === "GEOMETRIC_PREFERENCE_DEMONSTRATION" || outcome === "NO_GEOMETRIC_PREFERENCE_DEMONSTRATION";
}

/**
 * Width of the resampling block, in milliseconds.
 *
 * Resampling individual gaze samples would report an interval several times too
 * tight, because samples inside one fixation are not independent observations.
 * Resampling contiguous dwell runs fails the other way, and fails on exactly
 * the case that matters: a participant who holds one panel for the whole clip
 * produces two runs, and resampling two runs yields [0, 1]. A fixed window ties
 * the block count to the clip's duration rather than to the participant's
 * behaviour, so the interval narrows when the protocol gets longer, which is
 * the property the held threshold needs.
 *
 * One second sits above the fixation durations this battery produces and gives
 * 17 blocks on the 16.75 s excerpt.
 */
export const GEOPREF_CI_WINDOW_MS = 1000;
export const GEOPREF_CI_REPLICATIONS = 2000;
/** Fixed so the same recording reports the same interval on every replay. */
export const GEOPREF_CI_SEED = 20260819;

export type GeoprefResult = {
  percentGeometric: number | null;
  /**
   * 95% moving-block bootstrap interval on percentGeometric.
   *
   * The published cutoff is compared against this rather than against the point
   * estimate. A 16.75 s excerpt carries enough sampling error that a session
   * measuring 71% cannot be distinguished from one measuring 67%, and calling
   * the first deviant while calling the second normal reads a difference the
   * measurement cannot support. The same reasoning already governs cue
   * following, where a non-significant sign test is unassessed rather than
   * counted as a deficit.
   */
  percentGeometricCi: readonly [number, number] | null;
  percentSocial: number | null;
  geometricDwellMs: number;
  socialDwellMs: number;
  validSamples: number;
  totalSamples: number;
  aoiCoverage: number;
  threshold: number;
  outcome: GeoprefOutcome;
  /** Always false. GeoPref has 65% NPV; a negative carries no reassurance. */
  rulesOutAsd: false;
};

/** Deterministic LCG, so an interval is a property of the recording. */
function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

/**
 * Percent geometric resampled over fixed-width windows of the clip.
 *
 * Returns null when there are too few windows for the interval to mean
 * anything; the caller then reports the point estimate without one, and the
 * referral rule treats the signal as unassessable rather than guessing.
 */
export function bootstrapGeoprefCi(
  windows: readonly (readonly [number, number])[],
  replications: number = GEOPREF_CI_REPLICATIONS,
  seed: number = GEOPREF_CI_SEED,
): readonly [number, number] | null {
  if (windows.length < 4) return null;
  const next = seededRandom(seed);
  const draws: number[] = [];
  for (let rep = 0; rep < replications; rep += 1) {
    let geometric = 0;
    let social = 0;
    for (let index = 0; index < windows.length; index += 1) {
      const [g, s] = windows[Math.floor(next() * windows.length)];
      geometric += g;
      social += s;
    }
    if (geometric + social > 0) draws.push(geometric / (geometric + social));
  }
  if (draws.length < replications / 2) return null;
  draws.sort((a, b) => a - b);
  return [draws[Math.floor(0.025 * draws.length)], draws[Math.ceil(0.975 * draws.length) - 1]];
}

export function scoreGeopref(
  points: Point[],
  layout: {
    geometricSide: GeoprefSide;
    socialSide: GeoprefSide;
    validatedProtocol: boolean;
    /**
     * Stage demonstration. Applies the threshold on a shortened protocol so the
     * complete report can be shown, and marks the outcome so it can never be
     * read as, or turn into, a real referral. Ignored once the protocol is
     * validated, because then the real path already applies the threshold.
     */
    demonstrationMode?: boolean;
    /** Stage width / height. The clip is letterboxed, so the AOIs move with it. */
    viewportAspect?: number;
  },
): GeoprefResult {
  const aoiBoxes = projectGeoprefAoi(layout.viewportAspect ?? 640 / 360);
  const dwellMs: Record<"left" | "right", number> = { left: 0, right: 0 };
  // Same dwell, bucketed by elapsed window, so the interval resamples stretches
  // of the clip rather than individual samples.
  const windowDwell = new Map<number, [number, number]>();
  const startedAt = points.length ? points[0].t : 0;
  let validSamples = 0;
  points.forEach((point, index) => {
    const aoi = classifyGeoprefAoi(point, aoiBoxes);
    if (aoi === "outside") return;
    validSamples += 1;
    const next = points[index + 1];
    const interval = next ? Math.max(0, Math.min(MAX_DWELL_INTERVAL_MS, next.t - point.t)) : 50;
    dwellMs[aoi] += interval;
    const bucket = Math.floor((point.t - startedAt) / GEOPREF_CI_WINDOW_MS);
    const entry = windowDwell.get(bucket) ?? [0, 0];
    if (aoi === layout.geometricSide) entry[0] += interval;
    else entry[1] += interval;
    windowDwell.set(bucket, entry);
  });

  const geometricDwellMs = dwellMs[layout.geometricSide];
  const socialDwellMs = dwellMs[layout.socialSide];
  const totalDwellMs = geometricDwellMs + socialDwellMs;
  const totalSamples = points.length;
  const aoiCoverage = totalSamples ? validSamples / totalSamples : 0;

  if (validSamples < MIN_VALID_SAMPLES || aoiCoverage < MIN_AOI_COVERAGE || totalDwellMs <= 0) {
    return {
      percentGeometric: null, percentGeometricCi: null, percentSocial: null, geometricDwellMs, socialDwellMs,
      validSamples, totalSamples, aoiCoverage, threshold: GEOPREF_THRESHOLD,
      outcome: "WITHHELD_INSUFFICIENT_LOOKING", rulesOutAsd: false,
    };
  }

  const percentGeometric = geometricDwellMs / totalDwellMs;
  const percentGeometricCi = bootstrapGeoprefCi(
    [...windowDwell.keys()].sort((a, b) => a - b).map((key) => windowDwell.get(key) as [number, number]),
  );
  // The threshold is compared against the interval, not the point estimate: a
  // session whose interval straddles 69% has not measured a preference either
  // way. Without an interval there is nothing to compare, so the outcome falls
  // through to the same place a straddling one does.
  const abovethreshold = percentGeometricCi !== null && percentGeometricCi[0] >= GEOPREF_THRESHOLD;
  const belowThreshold = percentGeometricCi !== null && percentGeometricCi[1] < GEOPREF_THRESHOLD;
  const resolved = abovethreshold || belowThreshold;
  const outcome: GeoprefOutcome = !resolved
    ? "MEASURED_INTERVAL_STRADDLES_THRESHOLD"
    : layout.validatedProtocol
      ? abovethreshold
        ? "GEOMETRIC_PREFERENCE"
        : "NO_GEOMETRIC_PREFERENCE"
      : layout.demonstrationMode
        ? abovethreshold
          ? "GEOMETRIC_PREFERENCE_DEMONSTRATION"
          : "NO_GEOMETRIC_PREFERENCE_DEMONSTRATION"
        : "MEASURED_PROTOCOL_ABBREVIATED";

  return {
    percentGeometric, percentGeometricCi, percentSocial: 1 - percentGeometric, geometricDwellMs, socialDwellMs,
    validSamples, totalSamples, aoiCoverage, threshold: GEOPREF_THRESHOLD, outcome, rulesOutAsd: false,
  };
}
