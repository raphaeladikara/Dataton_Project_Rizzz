import { sessionHash } from "../geopref/protocol";

export type StimulusTarget = "left" | "right" | "center" | "none";

export type StimulusPhase = {
  id: string;
  label: string;
  durationMs: number;
  /** Model lifts its head, makes eye contact, and smiles. Precedes every cue. */
  ostensiveOnsetMs: number;
  cueOnsetMs: number;
  cue: string;
  target: StimulusTarget;
  visualCue: "attention" | "gaze-left" | "gaze-right" | "point-left" | "point-right" | "ending" | "geopref";
  scored: boolean;
};

export const STIMULUS_VERSION = "ID-geopref-first-joint-cues-name-v5";

/** Preferential-looking block, scored by src/geopref/score.ts. */
export const GEOPREF_PHASE_ID = "geopref_preference";
export const NAME_CALL_PHASE_ID = "name_call";
/** Three calls at fixed offsets within the name-call phase, per Perochon et al. 2023. */
export const NAME_CALL_OFFSETS_MS = [2000, 6000, 10000];

// Trial structure follows the responding-joint-attention paradigm in
// `referensi/stimulus_billeci`: the model rests looking down at the table, then
// gives an ostensive signal (head up, eye contact, smile), then delivers a
// silent directional cue with a neutral face. The pre-cue epoch therefore
// carries no left/right information at all, so analysis can separate
// spontaneous looking from cue-driven looking.
//
// 5 s per trial, not 7. Responding-joint-attention latencies sit well under
// 2 s, so a 3.3 s response window is already generous, and the 16 s saved come
// straight off the part of the battery a toddler is least likely to sit through.
const TRIAL_MS = 5000;
const TRIAL_OSTENSIVE_MS = 1200;
const TRIAL_CUE_MS = 1700;

const BASELINE: StimulusPhase = { id: "baseline", label: "Perhatian awal", durationMs: 5000, ostensiveOnsetMs: 0, cueOnsetMs: 0, cue: "central_attention", target: "center", visualCue: "attention", scored: false };

// Preferential looking. Scored by src/geopref/score.ts against the published
// 69% geometric-fixation cutoff rather than by the cue-following logic, so
// target is "none" and scored is false here.
//
// It runs second, immediately after baseline, because it carries the only
// externally published threshold in the system. Running it last meant it
// landed after 61 s of intense social engagement, which both fatigues the
// child and primes social attention — a bias that pushes geometric preference
// down, against the direction the rule-in depends on.
//
// Duration matches the shipped clip exactly. A longer phase makes the video
// loop, and the replayed opening frames land in the dwell score.
const GEOPREF: StimulusPhase = { id: GEOPREF_PHASE_ID, label: "Pilihan tontonan", durationMs: 16_750, ostensiveOnsetMs: 0, cueOnsetMs: 0, cue: "preferential_looking", target: "none", visualCue: "geopref", scored: false };

// Response to name. Audio plays from the tablet speaker at
// NAME_CALL_OFFSETS_MS; the head turn is measured from the pose trace, so no
// synchronized off-screen caller is required.
const NAME_CALL: StimulusPhase = { id: NAME_CALL_PHASE_ID, label: "Panggilan nama", durationMs: 13_000, ostensiveOnsetMs: 0, cueOnsetMs: 0, cue: "response_to_name", target: "none", visualCue: "attention", scored: false };

const POSITIVE_ENDING: StimulusPhase = { id: "positive_ending", label: "Penutup menyenangkan", durationMs: 5000, ostensiveOnsetMs: 0, cueOnsetMs: 0, cue: "positive_ending", target: "center", visualCue: "ending", scored: false };

const trial = (id: string, label: string, cue: string, target: "left" | "right", visualCue: StimulusPhase["visualCue"]): StimulusPhase =>
  ({ id, label, durationMs: TRIAL_MS, ostensiveOnsetMs: TRIAL_OSTENSIVE_MS, cueOnsetMs: TRIAL_CUE_MS, cue, target, visualCue, scored: true });

/** Declaration order. The order a session actually runs comes from sessionStimulusPhases. */
const DIRECTIONAL_TRIALS: readonly StimulusPhase[] = [
  trial("gaze_left", "Arah mata dan kepala kiri", "eyes_head_left", "left", "gaze-left"),
  trial("gaze_right", "Arah mata dan kepala kanan", "eyes_head_right", "right", "gaze-right"),
  trial("pointing_left", "Menunjuk kiri", "eyes_head_point_left", "left", "point-left"),
  trial("pointing_right", "Menunjuk kanan", "eyes_head_point_right", "right", "point-right"),
  trial("gaze_left_repeat", "Arah mata dan kepala kiri · ulangan", "eyes_head_left", "left", "gaze-left"),
  trial("gaze_right_repeat", "Arah mata dan kepala kanan · ulangan", "eyes_head_right", "right", "gaze-right"),
  trial("pointing_left_repeat", "Menunjuk kiri · ulangan", "eyes_head_point_left", "left", "point-left"),
  trial("pointing_right_repeat", "Menunjuk kanan · ulangan", "eyes_head_point_right", "right", "point-right"),
] as const;

export const STIMULUS_PHASES: readonly StimulusPhase[] = [BASELINE, GEOPREF, ...DIRECTIONAL_TRIALS, NAME_CALL, POSITIVE_ENDING] as const;

/**
 * Derived, never written by hand.
 *
 * The battery grew from 66 to 96 seconds when the preferential-looking and
 * name-call phases landed, and the operator-facing copy kept quoting 66 —
 * a kader deciding whether a child will sit still was being told half a minute
 * less than the session actually runs. Anything that states the duration reads
 * it from here.
 */
export const STIMULUS_TOTAL_MS = STIMULUS_PHASES.reduce((total, phase) => total + phase.durationMs, 0);
export const STIMULUS_TOTAL_SECONDS = Math.round(STIMULUS_TOTAL_MS / 1000);
export const SCORED_TRIAL_COUNT = STIMULUS_PHASES.filter((phase) => phase.scored).length;

type Side = "left" | "right";

/**
 * Every arrangement of four left and four right cues with no side repeated
 * three times running.
 *
 * The shipped order was left, right, left, right, ... for every session, which
 * is a confound rather than a cosmetic problem: a toddler who simply scans side
 * to side scores as following every cue, and the sign test in
 * inference/jointAttention.ts cannot tell that apart from real cue following,
 * because the cue sequence itself alternates. Counterbalancing breaks the tie.
 * The run-length cap keeps a session from drifting into one side long enough to
 * read as a side bias instead of a sequence.
 */
function buildSideSequences(): ReadonlyArray<readonly Side[]> {
  const sequences: Array<readonly Side[]> = [];
  const walk = (accumulated: Side[], leftLeft: number, rightLeft: number) => {
    if (accumulated.length === DIRECTIONAL_TRIALS.length) {
      sequences.push([...accumulated]);
      return;
    }
    for (const side of ["left", "right"] as const) {
      const remaining = side === "left" ? leftLeft : rightLeft;
      if (remaining === 0) continue;
      const size = accumulated.length;
      if (size >= 2 && accumulated[size - 1] === side && accumulated[size - 2] === side) continue;
      accumulated.push(side);
      walk(accumulated, side === "left" ? leftLeft - 1 : leftLeft, side === "right" ? rightLeft - 1 : rightLeft);
      accumulated.pop();
    }
  };
  walk([], DIRECTIONAL_TRIALS.filter((phase) => phase.target === "left").length, DIRECTIONAL_TRIALS.filter((phase) => phase.target === "right").length);
  return sequences;
}

const SIDE_SEQUENCES = buildSideSequences();

function pseudoRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

function shuffled<T>(items: readonly T[], next: () => number): T[] {
  const output = [...items];
  for (let index = output.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(next() * (index + 1));
    [output[index], output[swap]] = [output[swap], output[index]];
  }
  return output;
}

/**
 * The phase order this session runs, counterbalanced from the pseudonymous
 * session id so it is deterministic, auditable from the log, and not something
 * the operator can choose. Baseline, preferential looking, name call, and the
 * ending stay fixed; only the eight directional trials move.
 */
export function sessionStimulusPhases(
  sessionId: string,
  options: {
    /**
     * False when no speaker was declared behind the participant. The calls are
     * then never sounded, and the phase reduces to thirteen seconds of a bare
     * centre dot: nothing to look at, nothing measured, and long enough for a
     * toddler to leave the chair over. Dropping it is not a protocol change —
     * a silent name call was never a name call — but a spoken session and a
     * silent one now differ in length, so anything quoting a duration has to
     * read it off the returned list rather than off STIMULUS_TOTAL_MS.
     */
    nameCallsDelivered?: boolean;
  } = {},
): readonly StimulusPhase[] {
  const next = pseudoRandom(sessionHash(sessionId));
  const sequence = SIDE_SEQUENCES[Math.floor(next() * SIDE_SEQUENCES.length)];
  const left = shuffled(DIRECTIONAL_TRIALS.filter((phase) => phase.target === "left"), next);
  const right = shuffled(DIRECTIONAL_TRIALS.filter((phase) => phase.target === "right"), next);
  let leftIndex = 0;
  let rightIndex = 0;
  const ordered = sequence.map((side) => (side === "left" ? left[leftIndex++] : right[rightIndex++]));
  // The counterbalanced draw happens before the name call is considered, so a
  // silent session and a spoken one with the same id run the same cue order.
  const nameCall = options.nameCallsDelivered === false ? [] : [NAME_CALL];
  return [BASELINE, GEOPREF, ...ordered, ...nameCall, POSITIVE_ENDING];
}

/** Whole seconds a given phase list runs for. The only duration anything quotes. */
export function stimulusSeconds(phases: readonly StimulusPhase[] = STIMULUS_PHASES) {
  return Math.round(phases.reduce((total, phase) => total + phase.durationMs, 0) / 1000);
}

export function phaseAtElapsed(elapsedMs: number, phases: readonly StimulusPhase[] = STIMULUS_PHASES) {
  let startMs = 0;
  for (let index = 0; index < phases.length; index += 1) {
    const phase = phases[index];
    const endMs = startMs + phase.durationMs;
    if (elapsedMs < endMs || index === phases.length - 1) {
      const phaseElapsedMs = Math.max(0, elapsedMs - startMs);
      return { phase, index, phaseStartMs: startMs, phaseElapsedMs, cueActive: phaseElapsedMs >= phase.cueOnsetMs, ostensiveActive: phaseElapsedMs >= phase.ostensiveOnsetMs };
    }
    startMs = endMs;
  }
  return null;
}

/**
 * When each name call lands, measured from the start of the battery.
 *
 * NAME_CALL_OFFSETS_MS are offsets inside the name-call phase, while the frame
 * trace is stamped from the start of the whole battery. Anything comparing the
 * two needs this to put them on one clock. The cue order is counterbalanced per
 * session, so the phase does not start at a fixed time and the session's own
 * phase list has to be passed in.
 */
export function nameCallTimeline(phases: readonly StimulusPhase[] = STIMULUS_PHASES) {
  // A session that drops the phase has no calls to place. Falling through the
  // loop instead would stamp all three past the end of the battery, where the
  // pose trace has nothing to match them against and three calls that were
  // never sounded would score as three missed responses.
  if (!phases.some((phase) => phase.id === NAME_CALL_PHASE_ID)) return [];
  let startMs = 0;
  for (const phase of phases) {
    if (phase.id === NAME_CALL_PHASE_ID) break;
    startMs += phase.durationMs;
  }
  return NAME_CALL_OFFSETS_MS.map((offsetMs, index) => ({ index, offsetMs: startMs + offsetMs }));
}

export function scoredPhaseTargets(phases: readonly StimulusPhase[] = STIMULUS_PHASES) {
  return Object.fromEntries(phases.filter((phase) => phase.scored && phase.target !== "none").map((phase) => [phase.id, phase.target])) as Record<string, "left" | "right" | "center">;
}
