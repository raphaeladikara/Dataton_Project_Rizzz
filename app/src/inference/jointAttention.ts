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
  /** Trials where the participant was in the face AOI as the cue was delivered. */
  attendedAtCue: number;
  /** Trials whose post-cue window entered the cued target AOI at all. */
  trialsEnteringTarget: number;
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
      attendedAtCue: responses.filter((response) => response.faceAtCue === true).length,
      trialsEnteringTarget: responses.filter((response) => response.probability > 0).length,
      pValue: null, verdict: "WITHHELD_TOO_FEW_TRIALS",
    };
  }

  const pValue = signTestPValue(trialsFollowed, trialsScored);
  // Attendance and floor are counted from the same trials the sign test uses,
  // so the floor criterion below can never be evaluated on a different set.
  const attendedAtCue = responses.filter((response) => response.faceAtCue === true).length;
  const trialsEnteringTarget = responses.filter((response) => response.probability > 0).length;
  return {
    trialsScored, trialsFollowed,
    medianLiftPoints: medianLift === null ? null : medianLift * 100,
    medianLatencyMs: median(latencies),
    faceToTargetTransitions: summary.faceTargetTransitions,
    attendedAtCue,
    trialsEnteringTarget,
    pValue,
    verdict: cueVerdict({ pValue, medianLift, trialsFollowed, trialsScored, attendedAtCue, trialsEnteringTarget }),
  };
}

/**
 * How much of the battery has to show the participant looking at the model when
 * the cue lands before a floor reading counts as a finding rather than an
 * absence. Three of eight trials is not enough to say someone saw the cue and
 * declined it.
 */
export const MIN_ATTENDED_SHARE = 0.6;
/** Trials allowed to enter the target at all before the floor no longer holds. */
export const MAX_TRIALS_ENTERING_TARGET = 1;

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
function cueVerdict(input: {
  pValue: number;
  medianLift: number | null;
  trialsFollowed: number;
  trialsScored: number;
  attendedAtCue: number;
  trialsEnteringTarget: number;
}): JointAttentionVerdict {
  if (input.pValue < 0.05) return "FOLLOWS_CUES";
  if (input.medianLift !== null && input.medianLift < 0 && input.trialsFollowed * 2 < input.trialsScored) return "DOES_NOT_FOLLOW";
  // The floor.
  //
  // A participant who never enters either target AOI scores lift = 0 on every
  // trial, because post-cue and pre-cue looking are both zero. The lift test
  // above reads that as a tie and calls it indeterminate — so the strongest
  // possible non-following, someone who watched the model and then moved
  // nowhere, was the one pattern the rule could not report. Twelve of twelve
  // deliberately-produced sessions in the positive control landed here.
  //
  // This is a criterion, not a test, and it is written that way on purpose: a
  // sign test needs non-tied trials and there are none. What makes it a finding
  // rather than an absence is the precondition — the participant has to have
  // been looking at the model when the cue was delivered, in most trials. Fail
  // that and the session says nothing about cue following, only that the cue
  // was probably never seen, and the verdict stays indeterminate below.
  if (
    input.trialsEnteringTarget <= MAX_TRIALS_ENTERING_TARGET
    && input.attendedAtCue >= Math.ceil(input.trialsScored * MIN_ATTENDED_SHARE)
  ) return "DOES_NOT_FOLLOW";
  return "NOT_DISTINGUISHABLE";
}
