import type { EyeMeasurement } from "./faceLandmarker";

export type FrameSample = {
  t: number;
  phase: string;
  faceDetected: boolean;
  accepted: boolean;
  reason: EyeMeasurement["reason"];
  eyeOpen: number;
  yaw: number;
  pitch: number;
  rollDeg: number;
};

export type FrameTrace = {
  record: (sample: FrameSample) => void;
  samples: () => FrameSample[];
  reset: () => void;
};

export function createFrameTrace(): FrameTrace {
  let buffer: FrameSample[] = [];
  return {
    record: (sample) => { buffer.push(sample); },
    samples: () => buffer,
    reset: () => { buffer = []; },
  };
}

export function framesInPhases(samples: FrameSample[], phases: string[]): FrameSample[] {
  const wanted = new Set(phases);
  return samples.filter((sample) => wanted.has(sample.phase));
}
