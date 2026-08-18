import { phaseAtElapsed, type StimulusPhase } from "../stimulus/protocol";
import type { Point, ReplayScenario } from "../domain/types";

export const SCENARIOS: ReplayScenario[] = [
  {
    id: "refer",
    title: "Contoh: pemeriksaan lanjutan",
    description: "Lintasan tatapan menyebar; seluruh pemeriksaan kualitas lulus.",
    calibrationErrorDeg: 2.1,
    faceRate: 0.94,
    gazeDropout: 0.07,
    brightness: 0.58,
    seed: 17,
    pattern: "wide",
  },
  {
    id: "monitor",
    title: "Contoh: pemantauan rutin",
    description: "Lintasan tatapan terpusat; seluruh pemeriksaan kualitas lulus.",
    calibrationErrorDeg: 1.8,
    faceRate: 0.96,
    gazeDropout: 0.05,
    brightness: 0.61,
    seed: 29,
    pattern: "focused",
  },
  {
    id: "withheld",
    title: "Contoh: sesi ditahan",
    description: "Wajah sering hilang sehingga skor tidak dikeluarkan.",
    calibrationErrorDeg: 4.2,
    faceRate: 0.54,
    gazeDropout: 0.31,
    brightness: 0.36,
    seed: 41,
    pattern: "wide",
  },
];

function random(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

export function replayPoints(scenario: ReplayScenario, count = 360): Point[] {
  const next = random(scenario.seed);
  const points: Point[] = [];
  for (let index = 0; index < count; index += 1) {
    const phase = index / 18;
    const focused = scenario.pattern === "focused";
    const radiusX = focused ? 0.09 : 0.38;
    const radiusY = focused ? 0.05 : 0.31;
    const jitter = focused ? 0.015 : 0.05;
    const x = 0.5 + Math.sin(phase * 1.7) * radiusX + (next() - 0.5) * jitter;
    const y = 0.48 + Math.cos(phase * 1.1) * radiusY + (next() - 0.5) * jitter;
    points.push({
      t: index * 33.333,
      x: Math.max(0.02, Math.min(0.98, x)),
      y: Math.max(0.02, Math.min(0.98, y)),
    });
  }
  return points;
}

/**
 * Sample rate for the synthetic fallback, in Hz.
 *
 * Below the ~26-30 fps of the target tablets, so the fallback never looks
 * denser than a real recording, but dense enough that the per-epoch contract in
 * gaze/aoi.ts is satisfied for every scored phase.
 */
export const SYNTHETIC_REPLAY_HZ = 20;

/**
 * Gaze points for the synthetic demo path, laid out on the protocol's own clock.
 *
 * The count used to be a hardcoded 180 frames, which happened to clear the
 * eight-sample post-cue contract while trials were 7 s long. Shortening the
 * trials dropped it under, and the demo began withholding for a reason that had
 * nothing to do with the child or the camera. Deriving the count from the
 * protocol means a future timing change cannot quietly break the demo again.
 */
export function syntheticSessionPoints(
  scenario: ReplayScenario,
  phases: readonly StimulusPhase[],
): Point[] {
  const durationMs = phases.reduce((sum, phase) => sum + phase.durationMs, 0);
  const count = Math.max(180, Math.round((durationMs / 1000) * SYNTHETIC_REPLAY_HZ));
  return replayPoints(scenario, count).map((point, index) => {
    const elapsedMs = (index / Math.max(count - 1, 1)) * Math.max(durationMs - 1, 0);
    const state = phaseAtElapsed(elapsedMs, phases)!;
    return {
      ...point,
      t: elapsedMs,
      phase: state.phase.id,
      epoch: state.cueActive ? ("post_cue" as const) : ("pre_cue" as const),
    };
  });
}
