import type { CueFeatureSummary } from "../gaze/aoi";
import { STIMULUS_PHASES } from "../stimulus/protocol";

export const MIN_SCORED_TRIALS = 5;

export type JointAttentionVerdict = "FOLLOWS_CUES" | "NOT_DISTINGUISHABLE" | "WITHHELD_TOO_FEW_TRIALS";

export type JointAttentionProfile = {
  trialsScored: number;
  trialsFollowed: number;
  medianLiftPoints: number | null;
  medianLatencyMs: number | null;
  faceToTargetTransitions: number;
  pValue: number | null;
  verdict: JointAttentionVerdict;
};

const DIRECTIONAL_PHASES = STIMULUS_PHASES
  .filter((phase) => phase.scored && (phase.target === "left" || phase.target === "right"))
  .map((phase) => phase.id);

function binomialCoefficient(n: number, k: number): number {
  let result = 1;
  for (let index = 1; index <= k; index += 1) result = (result * (n - k + index)) / index;
  return result;
}

/** One-sided exact binomial tail under p = 0.5: P(X >= successes). */
export function signTestPValue(successes: number, trials: number): number {
  if (trials <= 0) return 1;
  let tail = 0;
  for (let k = successes; k <= trials; k += 1) tail += binomialCoefficient(trials, k);
  return tail / 2 ** trials;
}

function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

/**
 * Compares the child against itself: whether post-cue target looking exceeds
 * the same trial's pre-cue baseline. Being a within-session contrast, it needs
 * no normative reference and survives any between-instrument scaling.
 */
export function summarizeJointAttention(summary: CueFeatureSummary | null): JointAttentionProfile | null {
  if (!summary) return null;
  const responses = DIRECTIONAL_PHASES
    .map((id) => summary.targetResponse[id])
    .filter((response) => response && response.targetLift !== null);
  const lifts = responses.map((response) => response.targetLift as number);
  const latencies = responses.map((response) => response.latencyMs).filter((value): value is number => value !== null);
  const trialsScored = lifts.length;
  const trialsFollowed = lifts.filter((lift) => lift > 0).length;
  const medianLift = median(lifts);

  if (trialsScored < MIN_SCORED_TRIALS) {
    return {
      trialsScored, trialsFollowed,
      medianLiftPoints: medianLift === null ? null : medianLift * 100,
      medianLatencyMs: median(latencies),
      faceToTargetTransitions: summary.faceTargetTransitions,
      pValue: null, verdict: "WITHHELD_TOO_FEW_TRIALS",
    };
  }

  const pValue = signTestPValue(trialsFollowed, trialsScored);
  return {
    trialsScored, trialsFollowed,
    medianLiftPoints: medianLift === null ? null : medianLift * 100,
    medianLatencyMs: median(latencies),
    faceToTargetTransitions: summary.faceTargetTransitions,
    pValue, verdict: pValue < 0.05 ? "FOLLOWS_CUES" : "NOT_DISTINGUISHABLE",
  };
}
