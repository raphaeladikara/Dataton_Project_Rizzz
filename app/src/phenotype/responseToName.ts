import type { FrameSample } from "../capture/frameTrace";

export const RESPONSE_WINDOW_MS = 2000;
/** Below the 0.32 pose-rejection bound so a genuine turn is not filtered out first. */
export const TURN_YAW_THRESHOLD = 0.28;
export const BASELINE_WINDOW_MS = 500;

export type NameCall = { index: number; offsetMs: number };

export type ResponseToNameIndex = {
  /** Calls that could be scored either way. Skipped calls are not among them. */
  callsDelivered: number;
  /**
   * Calls the participant was already turned away for when the name came. They
   * cannot be scored in either direction, so they leave the denominator rather
   * than counting as a non-response — deviant means measured, not merely
   * undemonstrated.
   */
  callsSkipped: number;
  responses: number;
  proportion: number | null;
  medianLatencyMs: number | null;
  latenciesMs: number[];
};

function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function responseToNameIndex(frames: FrameSample[], calls: NameCall[]): ResponseToNameIndex {
  if (!calls.length) {
    return { callsDelivered: 0, callsSkipped: 0, responses: 0, proportion: null, medianLatencyMs: null, latenciesMs: [] };
  }

  const latenciesMs: number[] = [];
  let skipped = 0;
  calls.forEach((call) => {
    const baseline = frames.filter((f) => f.faceDetected && f.t >= call.offsetMs - BASELINE_WINDOW_MS && f.t < call.offsetMs);
    // A child already looking away cannot be scored as turning towards the caller.
    if (baseline.some((f) => Math.abs(f.yaw) >= TURN_YAW_THRESHOLD)) {
      skipped += 1;
      return;
    }

    const window = frames.filter((f) => f.faceDetected && f.t >= call.offsetMs && f.t <= call.offsetMs + RESPONSE_WINDOW_MS);
    const turn = window.find((f) => Math.abs(f.yaw) >= TURN_YAW_THRESHOLD);
    if (turn) latenciesMs.push(turn.t - call.offsetMs);
  });

  const scoreable = calls.length - skipped;
  return {
    callsDelivered: scoreable,
    callsSkipped: skipped,
    responses: latenciesMs.length,
    proportion: scoreable ? latenciesMs.length / scoreable : null,
    medianLatencyMs: median(latenciesMs),
    latenciesMs,
  };
}
