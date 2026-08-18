import type { CueFeatureSummary } from "../gaze/aoi";
import { STIMULUS_PHASES } from "../stimulus/protocol";

export const MIN_SCORED_TRIALS = 5;

/**
 * `NOT_DISTINGUISHABLE` and `DOES_NOT_FOLLOW` are different findings and must not
 * be collapsed. With eight trials a one-sided sign test cannot reach p < 0.05
 * below seven successes, so a child who followed six of eight cues fails
 * significance while having followed most of them. Reading that as evidence of
 * not following is the absence-of-evidence fallacy, and it used to reach the
 * referral rule directly.
 */
export type JointAttentionVerdict =
  | "FOLLOWS_CUES"
  | "NOT_DISTINGUISHABLE"
  | "DOES_NOT_FOLLOW"
  | "WITHHELD_TOO_FEW_TRIALS";

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
    pValue, verdict: cueVerdict(pValue, medianLift, trialsFollowed, trialsScored),
  };
}

/**
 * Three findings, not two.
 *
 *  - significant                          → the child followed, demonstrably;
 *  - not significant but the lift is up   → the direction is right and the
 *    session simply cannot carry the evidence — indeterminate, not deviant;
 *  - lift strictly below zero on a minority of trials → post-cue looking sat
 *    under the same trial's own pre-cue baseline, which is a measurement of not
 *    following rather than a failure to measure following.
 *
 * Both comparisons are strict. A median lift of exactly zero on four of eight
 * trials is chance, and chance is inconclusive: it is the case the session was
 * too short to resolve, not a finding about the child.
 */
function cueVerdict(
  pValue: number,
  medianLift: number | null,
  trialsFollowed: number,
  trialsScored: number,
): JointAttentionVerdict {
  if (pValue < 0.05) return "FOLLOWS_CUES";
  if (medianLift !== null && medianLift < 0 && trialsFollowed * 2 < trialsScored) return "DOES_NOT_FOLLOW";
  return "NOT_DISTINGUISHABLE";
}
