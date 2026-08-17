import type { FrameSample } from "../capture/frameTrace";

/** Same bounds the capture stage already enforces in faceLandmarker.ts:144-146. */
export const ATTENTIVE_BOUNDS = { minEyeOpen: 0.045, maxYaw: 0.32, maxPitch: 0.38, maxRollDeg: 20 };

export type FacingForwardIndex = {
  proportion: number | null;
  framesScored: number;
  longestRunMs: number;
};

export function isAttentive(frame: FrameSample): boolean {
  return frame.faceDetected
    && frame.eyeOpen >= ATTENTIVE_BOUNDS.minEyeOpen
    && Math.abs(frame.yaw) <= ATTENTIVE_BOUNDS.maxYaw
    && Math.abs(frame.pitch) <= ATTENTIVE_BOUNDS.maxPitch
    && Math.abs(frame.rollDeg) <= ATTENTIVE_BOUNDS.maxRollDeg;
}

export function facingForwardIndex(frames: FrameSample[]): FacingForwardIndex {
  if (!frames.length) return { proportion: null, framesScored: 0, longestRunMs: 0 };

  let attentive = 0;
  let longestRunMs = 0;
  let runStartT: number | null = null;
  let lastT = frames[0].t;

  frames.forEach((frame) => {
    if (isAttentive(frame)) {
      attentive += 1;
      if (runStartT === null) runStartT = frame.t;
      lastT = frame.t;
    } else if (runStartT !== null) {
      longestRunMs = Math.max(longestRunMs, lastT - runStartT);
      runStartT = null;
    }
  });
  if (runStartT !== null) longestRunMs = Math.max(longestRunMs, lastT - runStartT);

  return { proportion: attentive / frames.length, framesScored: frames.length, longestRunMs };
}
