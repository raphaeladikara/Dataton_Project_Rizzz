import type { FrameSample } from "../capture/frameTrace";
import { ATTENTIVE_BOUNDS } from "./facingForward";

export type BlinkIndex = {
  blinkCount: number;
  blinksPerMinute: number | null;
  durationMs: number;
};

export function blinkIndex(frames: FrameSample[], closedBelow = ATTENTIVE_BOUNDS.minEyeOpen): BlinkIndex {
  if (frames.length < 2) return { blinkCount: 0, blinksPerMinute: null, durationMs: 0 };

  let blinkCount = 0;
  let closed = false;
  frames.forEach((sample) => {
    if (!sample.faceDetected) return;
    const isClosed = sample.eyeOpen < closedBelow;
    if (isClosed && !closed) closed = true;
    if (!isClosed && closed) { blinkCount += 1; closed = false; }
  });

  const durationMs = frames.at(-1)!.t - frames[0].t;
  return {
    blinkCount,
    blinksPerMinute: durationMs > 0 ? blinkCount / (durationMs / 60000) : null,
    durationMs,
  };
}
