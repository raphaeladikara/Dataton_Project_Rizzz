import type { Point } from "../domain/types";

export type RawGazePoint = Point & { confidence?: number };

export type GazePipelineDiagnostics = {
  inputSamples: number;
  finiteSamples: number;
  rejectedBounds: number;
  rejectedJump: number;
  /**
   * Share of accepted samples the calibration mapped onto or past a screen
   * edge, so the clamp below is the only reason they carry a coordinate at all.
   * A saturated sample says the mapping ran out of range, not that the
   * participant looked at the edge, and every AOI in the atlas starts well
   * inside the screen — so a session full of them measures nothing while
   * looking complete.
   */
  saturatedSamples: number;
  segments: number;
  outputSamples: number;
  longestGapMs: number;
  medianIntervalMs: number;
  phaseCounts: Record<string, number>;
};

export type ProcessedGaze = { points: Point[]; diagnostics: GazePipelineDiagnostics };

export const DEFAULT_GAZE_CONFIG = {
  maxGapMs: 180,
  maxJump: 0.65,
  maxBoundsMargin: 0.12,
  smoothingAlpha: 0.42,
  resampleMs: 50,
};

function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function processGazeSamples(
  input: RawGazePoint[],
  config: typeof DEFAULT_GAZE_CONFIG = DEFAULT_GAZE_CONFIG,
): ProcessedGaze {
  const ordered = [...input].sort((a, b) => a.t - b.t);
  let rejectedBounds = 0;
  let rejectedJump = 0;
  let saturatedSamples = 0;
  const finite = ordered.filter((point) => Number.isFinite(point.t) && Number.isFinite(point.x) && Number.isFinite(point.y));
  const bounded = finite.filter((point) => {
    const accepted = point.x >= -config.maxBoundsMargin && point.x <= 1 + config.maxBoundsMargin && point.y >= -config.maxBoundsMargin && point.y <= 1 + config.maxBoundsMargin;
    if (!accepted) rejectedBounds += 1;
    return accepted;
  });
  const intervals = bounded.slice(1).map((point, index) => point.t - bounded[index].t).filter((value) => value >= 0);
  const rawSegments: RawGazePoint[][] = [];
  let active: RawGazePoint[] = [];
  let longestGapMs = 0;
  for (const point of bounded) {
    const previous = active.at(-1);
    if (previous) {
      const gap = point.t - previous.t;
      longestGapMs = Math.max(longestGapMs, gap);
      const jump = Math.hypot(point.x - previous.x, point.y - previous.y);
      const phaseChanged = point.phase !== previous.phase;
      const epochChanged = point.epoch !== previous.epoch;
      if (gap > config.maxGapMs || phaseChanged || epochChanged) {
        if (active.length) rawSegments.push(active);
        active = [];
      } else if (jump > config.maxJump) {
        rejectedJump += 1;
        continue;
      }
    }
    if (point.x <= 0 || point.x >= 1 || point.y <= 0 || point.y >= 1) saturatedSamples += 1;
    active.push({ ...point, x: Math.max(0, Math.min(1, point.x)), y: Math.max(0, Math.min(1, point.y)) });
  }
  if (active.length) rawSegments.push(active);

  const output: Point[] = [];
  rawSegments.forEach((segment, segmentIndex) => {
    if (!segment.length) return;
    const smoothed: Point[] = [];
    segment.forEach((point, index) => {
      const previous = smoothed.at(-1);
      smoothed.push(index === 0 || !previous ? { t: point.t, x: point.x, y: point.y, segment: segmentIndex, phase: point.phase, epoch: point.epoch } : {
        t: point.t,
        x: config.smoothingAlpha * point.x + (1 - config.smoothingAlpha) * previous.x,
        y: config.smoothingAlpha * point.y + (1 - config.smoothingAlpha) * previous.y,
        segment: segmentIndex,
        phase: point.phase,
        epoch: point.epoch,
      });
    });
    if (smoothed.length === 1) {
      output.push(smoothed[0]);
      return;
    }
    let cursor = 0;
    for (let t = smoothed[0].t; t <= smoothed.at(-1)!.t; t += config.resampleMs) {
      while (cursor + 1 < smoothed.length && smoothed[cursor + 1].t < t) cursor += 1;
      const left = smoothed[cursor];
      const right = smoothed[Math.min(cursor + 1, smoothed.length - 1)];
      const ratio = right.t === left.t ? 0 : (t - left.t) / (right.t - left.t);
      output.push({
        t,
        x: left.x + (right.x - left.x) * ratio,
        y: left.y + (right.y - left.y) * ratio,
        segment: segmentIndex,
        phase: left.phase,
        epoch: left.epoch,
      });
    }
  });

  return {
    points: output,
    diagnostics: {
      inputSamples: input.length,
      finiteSamples: finite.length,
      rejectedBounds,
      rejectedJump,
      saturatedSamples,
      segments: rawSegments.length,
      outputSamples: output.length,
      longestGapMs,
      medianIntervalMs: median(intervals),
      phaseCounts: output.reduce<Record<string, number>>((counts, point) => {
        const phase = point.phase ?? "unassigned";
        counts[phase] = (counts[phase] ?? 0) + 1;
        return counts;
      }, {}),
    },
  };
}
