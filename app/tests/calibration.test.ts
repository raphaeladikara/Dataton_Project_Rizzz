import assert from "node:assert/strict";
import test from "node:test";
import { applyCalibration, eyeMeasurement, eyeSignal, fitCalibration, type CalibrationSample } from "../src/capture/faceLandmarker";

const targets = [
  [0.12, 0.14], [0.5, 0.14], [0.88, 0.14],
  [0.12, 0.5], [0.5, 0.5], [0.88, 0.5],
  [0.12, 0.86], [0.5, 0.86], [0.88, 0.86],
] as const;

function signal(x: number, y: number, jitter = 0) {
  return { u: 0.34 + 0.12 * x + jitter, v: 0.47 + 0.06 * y - jitter / 2 };
}

test("9-point calibration trains on the full grid and uses the center step for drift correction", () => {
  const samples: CalibrationSample[] = [];
  targets.forEach(([x, y], targetIndex) => {
    for (let index = 0; index < 10; index += 1) {
      samples.push({ signal: signal(x, y, (index - 4.5) * 0.00005), target: { x, y }, targetIndex, phase: "train" });
    }
  });
  for (let index = 0; index < 12; index += 1) {
    samples.push({ signal: signal(0.5, 0.5, (index - 5.5) * 0.00005), target: { x: 0.5, y: 0.5 }, targetIndex: 9, phase: "validation" });
  }
  const calibration = fitCalibration(samples);
  const center = applyCalibration(calibration, signal(0.5, 0.5));
  assert.equal(calibration.diagnostics?.trainingTargets, 9);
  assert.ok(calibration.errorDeg < 0.5);
  assert.ok((calibration.diagnostics?.gridMedianErrorDeg ?? 1) < 0.5);
  assert.ok(Math.abs(center.x - 0.5) < 0.01);
  assert.ok(Math.abs(center.y - 0.5) < 0.01);
});

test("center step corrects session drift without cross-coupling gaze axes", () => {
  const samples: CalibrationSample[] = [];
  targets.forEach(([x, y], targetIndex) => {
    for (let index = 0; index < 12; index += 1) {
      samples.push({ signal: signal(x, y, (index - 5.5) * 0.00004), target: { x, y }, targetIndex, phase: "train" });
    }
  });
  for (let index = 0; index < 16; index += 1) {
    const base = signal(0.5, 0.5, (index - 7.5) * 0.00004);
    samples.push({ signal: { u: base.u + 0.018, v: base.v - 0.012 }, target: { x: 0.5, y: 0.5 }, targetIndex: 9, phase: "validation" });
  }
  const calibration = fitCalibration(samples);
  const center = applyCalibration(calibration, { u: signal(0.5, 0.5).u + 0.018, v: signal(0.5, 0.5).v - 0.012 });
  assert.ok((calibration.diagnostics?.centerDriftDeg ?? 0) > 5);
  assert.ok(calibration.errorDeg < 0.5);
  assert.ok(Math.abs(center.x - 0.5) < 0.01);
  assert.ok(Math.abs(center.y - 0.5) < 0.01);
  assert.equal(calibration.x[2], 0);
  assert.equal(calibration.y[1], 0);
});

test("calibration reports an actionable error when gaze signal has no range", () => {
  const samples: CalibrationSample[] = [];
  targets.forEach(([x, y], targetIndex) => {
    for (let index = 0; index < 8; index += 1) samples.push({ signal: { u: 0.5, v: 0.5 }, target: { x, y }, targetIndex, phase: "train" });
  });
  for (let index = 0; index < 10; index += 1) samples.push({ signal: { u: 0.5, v: 0.5 }, target: { x: 0.5, y: 0.5 }, targetIndex: 9, phase: "validation" });
  assert.throws(() => fitCalibration(samples), /CALIBRATION_RANGE_X/);
});

test("piecewise axis mapping absorbs ordinary nonlinear iris response without relaxing the error gate", () => {
  const samples: CalibrationSample[] = [];
  const nonlinear = (x: number, y: number) => ({
    u: 0.35 + 0.09 * x + 0.05 * x * x,
    v: 0.44 + 0.045 * y + 0.035 * y * y,
  });
  targets.forEach(([x, y], targetIndex) => {
    for (let index = 0; index < 12; index += 1) {
      const base = nonlinear(x, y);
      const jitter = (index - 5.5) * 0.00002;
      samples.push({ signal: { u: base.u + jitter, v: base.v - jitter }, target: { x, y }, targetIndex, phase: "train" });
    }
  });
  for (let index = 0; index < 12; index += 1) {
    const base = nonlinear(0.5, 0.5);
    samples.push({ signal: base, target: { x: 0.5, y: 0.5 }, targetIndex: 9, phase: "validation" });
  }
  const calibration = fitCalibration(samples);
  assert.equal(calibration.curveX?.length, 3);
  assert.equal(calibration.curveY?.length, 3);
  assert.ok(calibration.errorDeg < 0.5);
});

test("calibration rejects a target whose accepted iris landmarks are still unstable", () => {
  const samples: CalibrationSample[] = [];
  targets.forEach(([x, y], targetIndex) => {
    for (let index = 0; index < 10; index += 1) samples.push({ signal: signal(x, y), target: { x, y }, targetIndex, phase: "train" });
  });
  for (let index = 0; index < 10; index += 1) samples.push({ signal: signal(0.5, 0.5), target: { x: 0.5, y: 0.5 }, targetIndex: 9, phase: "validation" });
  const diagnostics = targets.map((_, targetIndex) => ({
    targetIndex, phase: "train" as const, attempted: 20, accepted: 16,
    rejectedNoFace: 0, rejectedEye: 0, rejectedPose: 0,
    dispersionU: 0.003, dispersionV: targetIndex === 6 ? 0.017 : 0.003,
  }));
  assert.throws(() => fitCalibration(samples, diagnostics), /CALIBRATION_STABILITY.*titik 7/);
});

test("eye-local iris signal is not distorted by changing eyelid opening", () => {
  const landmarks = Array.from({ length: 478 }, () => ({ x: 0, y: 0, z: 0, visibility: 1 }));
  Object.assign(landmarks[33], { x: 0.2, y: 0.3 });
  Object.assign(landmarks[133], { x: 0.4, y: 0.3 });
  Object.assign(landmarks[468], { x: 0.3, y: 0.32 });
  Object.assign(landmarks[362], { x: 0.6, y: 0.3 });
  Object.assign(landmarks[263], { x: 0.8, y: 0.3 });
  Object.assign(landmarks[473], { x: 0.7, y: 0.32 });
  Object.assign(landmarks[159], { x: 0.3, y: 0.27 });
  Object.assign(landmarks[145], { x: 0.3, y: 0.34 });
  Object.assign(landmarks[386], { x: 0.7, y: 0.27 });
  Object.assign(landmarks[374], { x: 0.7, y: 0.34 });
  const open = eyeSignal(landmarks);
  Object.assign(landmarks[159], { y: 0.295 });
  Object.assign(landmarks[145], { y: 0.325 });
  Object.assign(landmarks[386], { y: 0.295 });
  Object.assign(landmarks[374], { y: 0.325 });
  const squinting = eyeSignal(landmarks);
  assert.deepEqual(squinting, open);
  assert.ok(Math.abs((open?.u ?? 0) - 0.5) < 1e-8);
  assert.ok(Math.abs((open?.v ?? 0) - 0.1) < 1e-8);
});

test("measurement rejects an iris landmark that falls outside its eye", () => {
  const landmarks = Array.from({ length: 478 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility: 1 }));
  Object.assign(landmarks[33], { x: 0.2, y: 0.3 });
  Object.assign(landmarks[133], { x: 0.4, y: 0.3 });
  Object.assign(landmarks[468], { x: 0.62, y: 0.3 });
  Object.assign(landmarks[362], { x: 0.6, y: 0.3 });
  Object.assign(landmarks[263], { x: 0.8, y: 0.3 });
  Object.assign(landmarks[473], { x: 0.7, y: 0.3 });
  Object.assign(landmarks[159], { x: 0.3, y: 0.27 });
  Object.assign(landmarks[145], { x: 0.3, y: 0.34 });
  Object.assign(landmarks[386], { x: 0.7, y: 0.27 });
  Object.assign(landmarks[374], { x: 0.7, y: 0.34 });
  Object.assign(landmarks[234], { x: 0.1, y: 0.5 });
  Object.assign(landmarks[454], { x: 0.9, y: 0.5 });
  Object.assign(landmarks[10], { x: 0.5, y: 0.1 });
  Object.assign(landmarks[152], { x: 0.5, y: 0.9 });
  Object.assign(landmarks[1], { x: 0.5, y: 0.5 });
  const measurement = eyeMeasurement(landmarks);
  assert.equal(measurement.accepted, false);
  assert.equal(measurement.reason, "iris");
});
