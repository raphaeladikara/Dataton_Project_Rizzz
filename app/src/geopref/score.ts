import type { Point } from "../domain/types";
import { classifyGeoprefAoi, type GeoprefSide } from "./protocol";

/** Wen et al. 2022, Molecular Autism: >=69% geometric fixation, n=1863, 12-49 months. */
export const GEOPREF_THRESHOLD = 0.69;
export const MIN_AOI_COVERAGE = 0.5;
export const MIN_VALID_SAMPLES = 60;
const MAX_DWELL_INTERVAL_MS = 180;

export type GeoprefOutcome =
  | "GEOMETRIC_PREFERENCE"
  | "NO_GEOMETRIC_PREFERENCE"
  | "MEASURED_PROTOCOL_ABBREVIATED"
  | "WITHHELD_INSUFFICIENT_LOOKING";

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
  layout: { geometricSide: GeoprefSide; socialSide: GeoprefSide; validatedProtocol: boolean },
): GeoprefResult {
  const dwellMs: Record<"left" | "right", number> = { left: 0, right: 0 };
  let validSamples = 0;
  points.forEach((point, index) => {
    const aoi = classifyGeoprefAoi(point);
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
  const outcome: GeoprefOutcome = !layout.validatedProtocol
    ? "MEASURED_PROTOCOL_ABBREVIATED"
    : percentGeometric >= GEOPREF_THRESHOLD
      ? "GEOMETRIC_PREFERENCE"
      : "NO_GEOMETRIC_PREFERENCE";

  return {
    percentGeometric, percentSocial: 1 - percentGeometric, geometricDwellMs, socialDwellMs,
    validSamples, totalSamples, aoiCoverage, threshold: GEOPREF_THRESHOLD, outcome, rulesOutAsd: false,
  };
}
