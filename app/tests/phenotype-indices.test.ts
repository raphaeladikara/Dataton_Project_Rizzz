import assert from "node:assert/strict";
import test from "node:test";
import { blinkIndex } from "../src/phenotype/blink";
import { facingForwardIndex } from "../src/phenotype/facingForward";
import { headMovementIndex } from "../src/phenotype/headMovement";
import type { FrameSample } from "../src/capture/frameTrace";

const frame = (over: Partial<FrameSample> = {}): FrameSample => ({
  t: 0, phase: "baseline", faceDetected: true, accepted: true, reason: "ok",
  eyeOpen: 0.09, yaw: 0.02, pitch: -0.01, rollDeg: 1.2, ...over,
});

test("a fully attentive recording scores 1", () => {
  const frames = Array.from({ length: 100 }, (_, i) => frame({ t: i * 33 }));
  const index = facingForwardIndex(frames);
  assert.equal(index.proportion, 1);
  assert.equal(index.framesScored, 100);
});

test("undetected faces, closed eyes and turned heads all lower the index", () => {
  const frames = [
    ...Array.from({ length: 50 }, (_, i) => frame({ t: i * 33 })),
    ...Array.from({ length: 20 }, (_, i) => frame({ t: (50 + i) * 33, faceDetected: false })),
    ...Array.from({ length: 20 }, (_, i) => frame({ t: (70 + i) * 33, eyeOpen: 0.01 })),
    ...Array.from({ length: 10 }, (_, i) => frame({ t: (90 + i) * 33, yaw: 0.9 })),
  ];
  assert.equal(facingForwardIndex(frames).proportion, 0.5);
});

test("longest continuous attentive run is reported alongside the proportion", () => {
  const frames = [
    ...Array.from({ length: 30 }, (_, i) => frame({ t: i * 33 })),
    frame({ t: 30 * 33, faceDetected: false }),
    ...Array.from({ length: 60 }, (_, i) => frame({ t: (31 + i) * 33 })),
  ];
  // 60 frames span 59 intervals: t runs from 31*33 to 90*33.
  assert.equal(facingForwardIndex(frames).longestRunMs, 59 * 33);
});

test("an empty trace yields a null index rather than a fabricated zero", () => {
  assert.equal(facingForwardIndex([]).proportion, null);
});

test("a still head yields near-zero rate and acceleration", () => {
  const frames = Array.from({ length: 120 }, (_, i) => frame({ t: i * 33 }));
  const index = headMovementIndex(frames);
  assert.ok(index.rangePerSecond! < 0.01);
  assert.ok(index.meanAccelerationPerSecond2! < 0.01);
});

test("a moving head yields a higher rate than a still one", () => {
  const still = Array.from({ length: 120 }, (_, i) => frame({ t: i * 33 }));
  const moving = Array.from({ length: 120 }, (_, i) => frame({ t: i * 33, yaw: Math.sin(i * 0.4) * 0.25, pitch: Math.cos(i * 0.3) * 0.2 }));
  assert.ok(headMovementIndex(moving).rangePerSecond! > headMovementIndex(still).rangePerSecond!);
});

test("complexity is reported per scale and is finite", () => {
  const frames = Array.from({ length: 240 }, (_, i) => frame({
    t: i * 33, yaw: Math.sin(i * 0.31) * 0.2 + Math.sin(i * 1.7) * 0.05, pitch: Math.cos(i * 0.22) * 0.15,
  }));
  const index = headMovementIndex(frames);
  assert.equal(index.complexityByScale.length, 4);
  assert.ok(index.complexityByScale.every(Number.isFinite));
});

test("frames without a detected face are excluded, not treated as zero pose", () => {
  const frames = [
    ...Array.from({ length: 60 }, (_, i) => frame({ t: i * 33, yaw: 0.2 })),
    ...Array.from({ length: 60 }, (_, i) => frame({ t: (60 + i) * 33, faceDetected: false, yaw: 0 })),
  ];
  assert.equal(headMovementIndex(frames).framesScored, 60);
});

test("too few usable frames yields nulls rather than invented numbers", () => {
  assert.equal(headMovementIndex([frame()]).rangePerSecond, null);
});

test("blinks are counted as closed-then-open transitions, not as closed frames", () => {
  const frames = Array.from({ length: 300 }, (_, i) => frame({
    t: i * 33, eyeOpen: i % 50 < 3 ? 0.01 : 0.09,
  }));
  const index = blinkIndex(frames);
  assert.equal(index.blinkCount, 6);
  assert.ok(Math.abs(index.blinksPerMinute! - 6 / ((299 * 33) / 60000)) < 0.5);
});

test("a recording with no closure reports zero blinks, not null", () => {
  const frames = Array.from({ length: 120 }, (_, i) => frame({ t: i * 33 }));
  assert.equal(blinkIndex(frames).blinkCount, 0);
});

test("frames without a face never open or close a blink", () => {
  const frames = [
    frame({ t: 0, eyeOpen: 0.09 }),
    frame({ t: 33, faceDetected: false, eyeOpen: 0 }),
    frame({ t: 66, eyeOpen: 0.09 }),
  ];
  assert.equal(blinkIndex(frames).blinkCount, 0);
});
