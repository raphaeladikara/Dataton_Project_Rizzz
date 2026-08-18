import type { Point } from "../domain/types";
import { classifyGeoprefAoi, projectGeoprefAoi, type GeoprefSide } from "./protocol";

/** Wen et al. 2022, Molecular Autism: >=69% geometric fixation, n=1863, 12-49 months. */
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
  | "WITHHELD_INSUFFICIENT_LOOKING";

export function isDemonstrationOutcome(outcome: GeoprefOutcome): boolean {
  return outcome === "GEOMETRIC_PREFERENCE_DEMONSTRATION" || outcome === "NO_GEOMETRIC_PREFERENCE_DEMONSTRATION";
}

export type GeoprefResult = {
  percentGeometric: number | null;
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
  let validSamples = 0;
  points.forEach((point, index) => {
    const aoi = classifyGeoprefAoi(point, aoiBoxes);
    if (aoi === "outside") return;
    validSamples += 1;
    const next = points[index + 1];
    dwellMs[aoi] += next ? Math.max(0, Math.min(MAX_DWELL_INTERVAL_MS, next.t - point.t)) : 50;
  });

  const geometricDwellMs = dwellMs[layout.geometricSide];
  const socialDwellMs = dwellMs[layout.socialSide];
  const totalDwellMs = geometricDwellMs + socialDwellMs;
  const totalSamples = points.length;
  const aoiCoverage = totalSamples ? validSamples / totalSamples : 0;

  if (validSamples < MIN_VALID_SAMPLES || aoiCoverage < MIN_AOI_COVERAGE || totalDwellMs <= 0) {
    return {
      percentGeometric: null, percentSocial: null, geometricDwellMs, socialDwellMs,
      validSamples, totalSamples, aoiCoverage, threshold: GEOPREF_THRESHOLD,
      outcome: "WITHHELD_INSUFFICIENT_LOOKING", rulesOutAsd: false,
    };
  }

  const percentGeometric = geometricDwellMs / totalDwellMs;
  const abovethreshold = percentGeometric >= GEOPREF_THRESHOLD;
  const outcome: GeoprefOutcome = layout.validatedProtocol
    ? abovethreshold
      ? "GEOMETRIC_PREFERENCE"
      : "NO_GEOMETRIC_PREFERENCE"
    : layout.demonstrationMode
      ? abovethreshold
        ? "GEOMETRIC_PREFERENCE_DEMONSTRATION"
        : "NO_GEOMETRIC_PREFERENCE_DEMONSTRATION"
      : "MEASURED_PROTOCOL_ABBREVIATED";

  return {
    percentGeometric, percentSocial: 1 - percentGeometric, geometricDwellMs, socialDwellMs,
    validSamples, totalSamples, aoiCoverage, threshold: GEOPREF_THRESHOLD, outcome, rulesOutAsd: false,
  };
}
