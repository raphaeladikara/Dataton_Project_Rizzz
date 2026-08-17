import type { FrameSample } from "../capture/frameTrace";
import { multiscaleEntropy } from "./entropy";

export const MIN_FRAMES = 30;

export type HeadMovementIndex = {
  /** Mean magnitude of the per-second pose change, in normalised pose units. */
  rangePerSecond: number | null;
  meanAccelerationPerSecond2: number | null;
  complexityByScale: number[];
  framesScored: number;
};

export function headMovementIndex(frames: FrameSample[], scales = 4): HeadMovementIndex {
  const usable = frames.filter((sample) => sample.faceDetected);
  if (usable.length < MIN_FRAMES) {
    return { rangePerSecond: null, meanAccelerationPerSecond2: null, complexityByScale: [], framesScored: usable.length };
  }

  const velocities: number[] = [];
  for (let index = 1; index < usable.length; index += 1) {
    const dtSeconds = Math.max((usable[index].t - usable[index - 1].t) / 1000, 1e-3);
    const dYaw = usable[index].yaw - usable[index - 1].yaw;
    const dPitch = usable[index].pitch - usable[index - 1].pitch;
    velocities.push(Math.hypot(dYaw, dPitch) / dtSeconds);
  }

  const accelerations: number[] = [];
  for (let index = 1; index < velocities.length; index += 1) {
    const dtSeconds = Math.max((usable[index + 1].t - usable[index].t) / 1000, 1e-3);
    accelerations.push(Math.abs(velocities[index] - velocities[index - 1]) / dtSeconds);
  }

  const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);

  return {
    rangePerSecond: mean(velocities),
    meanAccelerationPerSecond2: accelerations.length ? mean(accelerations) : 0,
    complexityByScale: multiscaleEntropy(usable.map((sample) => sample.yaw), scales),
    framesScored: usable.length,
  };
}
