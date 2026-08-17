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
  visualCue: "attention" | "gaze-left" | "gaze-right" | "point-left" | "point-right" | "ending";
  scored: boolean;
};

export const STIMULUS_VERSION = "ID-joint-cues-geopref-name-v4";

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
const TRIAL_MS = 7000;
const TRIAL_OSTENSIVE_MS = 1400;
const TRIAL_CUE_MS = 2000;

export const STIMULUS_PHASES: readonly StimulusPhase[] = [
  { id: "baseline", label: "Perhatian awal", durationMs: 5000, ostensiveOnsetMs: 0, cueOnsetMs: 0, cue: "central_attention", target: "center", visualCue: "attention", scored: false },
  { id: "gaze_left", label: "Arah mata dan kepala kiri", durationMs: TRIAL_MS, ostensiveOnsetMs: TRIAL_OSTENSIVE_MS, cueOnsetMs: TRIAL_CUE_MS, cue: "eyes_head_left", target: "left", visualCue: "gaze-left", scored: true },
  { id: "gaze_right", label: "Arah mata dan kepala kanan", durationMs: TRIAL_MS, ostensiveOnsetMs: TRIAL_OSTENSIVE_MS, cueOnsetMs: TRIAL_CUE_MS, cue: "eyes_head_right", target: "right", visualCue: "gaze-right", scored: true },
  { id: "pointing_left", label: "Menunjuk kiri", durationMs: TRIAL_MS, ostensiveOnsetMs: TRIAL_OSTENSIVE_MS, cueOnsetMs: TRIAL_CUE_MS, cue: "eyes_head_point_left", target: "left", visualCue: "point-left", scored: true },
  { id: "pointing_right", label: "Menunjuk kanan", durationMs: TRIAL_MS, ostensiveOnsetMs: TRIAL_OSTENSIVE_MS, cueOnsetMs: TRIAL_CUE_MS, cue: "eyes_head_point_right", target: "right", visualCue: "point-right", scored: true },
  { id: "gaze_left_repeat", label: "Arah mata dan kepala kiri · ulangan", durationMs: TRIAL_MS, ostensiveOnsetMs: TRIAL_OSTENSIVE_MS, cueOnsetMs: TRIAL_CUE_MS, cue: "eyes_head_left", target: "left", visualCue: "gaze-left", scored: true },
  { id: "gaze_right_repeat", label: "Arah mata dan kepala kanan · ulangan", durationMs: TRIAL_MS, ostensiveOnsetMs: TRIAL_OSTENSIVE_MS, cueOnsetMs: TRIAL_CUE_MS, cue: "eyes_head_right", target: "right", visualCue: "gaze-right", scored: true },
  { id: "pointing_left_repeat", label: "Menunjuk kiri · ulangan", durationMs: TRIAL_MS, ostensiveOnsetMs: TRIAL_OSTENSIVE_MS, cueOnsetMs: TRIAL_CUE_MS, cue: "eyes_head_point_left", target: "left", visualCue: "point-left", scored: true },
  { id: "pointing_right_repeat", label: "Menunjuk kanan · ulangan", durationMs: TRIAL_MS, ostensiveOnsetMs: TRIAL_OSTENSIVE_MS, cueOnsetMs: TRIAL_CUE_MS, cue: "eyes_head_point_right", target: "right", visualCue: "point-right", scored: true },
  // Preferential looking. Scored by src/geopref/score.ts against the published
  // 69% geometric-fixation cutoff rather than by the cue-following logic, so
  // target is "none" and scored is false here.
  { id: GEOPREF_PHASE_ID, label: "Pilihan tontonan", durationMs: 17000, ostensiveOnsetMs: 0, cueOnsetMs: 0, cue: "preferential_looking", target: "none", visualCue: "attention", scored: false },
  // Response to name. Audio plays from the tablet speaker at
  // NAME_CALL_OFFSETS_MS; the head turn is measured from the pose trace, so no
  // synchronized off-screen caller is required.
  { id: NAME_CALL_PHASE_ID, label: "Panggilan nama", durationMs: 13000, ostensiveOnsetMs: 0, cueOnsetMs: 0, cue: "response_to_name", target: "none", visualCue: "attention", scored: false },
  { id: "positive_ending", label: "Penutup menyenangkan", durationMs: 5000, ostensiveOnsetMs: 0, cueOnsetMs: 0, cue: "positive_ending", target: "center", visualCue: "ending", scored: false },
] as const;

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

export function scoredPhaseTargets(phases: readonly StimulusPhase[] = STIMULUS_PHASES) {
  return Object.fromEntries(phases.filter((phase) => phase.scored && phase.target !== "none").map((phase) => [phase.id, phase.target])) as Record<string, "left" | "right" | "center">;
}
