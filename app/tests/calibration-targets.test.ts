import assert from "node:assert/strict";
import test from "node:test";
import { CHILD_TARGETS, TECHNICAL_TARGETS } from "../src/capture/calibrationTargets";
import { applyCalibration, fitCalibration, type CalibrationSample } from "../src/capture/faceLandmarker";

test("every off-center child calibration target moves exactly one axis", () => {
  // The shipped grid was centre plus four corners, so every point carrying
  // vertical information also sat at a horizontal extreme and the vertical
  // curve was fitted entirely from diagonal excursions. Corners are also where
  // a participant turns their head instead of their eyes, and the head is what
  // the iris signal is measured against — so the corners that were supposed to
  // buy the widest signal bought the narrowest. Measured across the recordings
  // in public/replay against the stage-demo audit: signalRangeU 0.170-0.173 on
  // the nine-point grid versus 0.094 on this one, signalRangeV 0.079-0.105
  // versus 0.054. Roughly half the signal on both axes, so roughly double the
  // gain applied to everything downstream.
  const offCentre = CHILD_TARGETS.filter(([x, y]) => x !== 0.5 || y !== 0.5);
  assert.equal(CHILD_TARGETS.length, 5, "a toddler grid stays at five targets");
  assert.equal(offCentre.length, 4);
  for (const [x, y] of offCentre) {
    assert.notEqual(x !== 0.5, y !== 0.5, `target ${x},${y} moves both axes at once`);
  }
});

test("both grids still span three distinct positions per axis", () => {
  // axisCurve() builds its piecewise curve only when an axis carries exactly
  // three distinct target values, and falls back to a plain linear fit without
  // saying so otherwise.
  for (const grid of [CHILD_TARGETS, TECHNICAL_TARGETS]) {
    assert.equal(new Set(grid.map(([x]) => x)).size, 3);
    assert.equal(new Set(grid.map(([, y]) => y)).size, 3);
  }
});

const eye = (perUnitU: number, perUnitV: number) =>
  (x: number, y: number, jitter = 0) => ({ u: 0.34 + perUnitU * x + jitter, v: 0.47 + perUnitV * y - jitter / 2 });

function fitGrid(grid: readonly (readonly [number, number])[], signal = eye(0.12, 0.06)) {
  const samples: CalibrationSample[] = [];
  grid.forEach(([x, y], targetIndex) => {
    for (let index = 0; index < 16; index += 1)
      samples.push({ signal: signal(x, y, (index - 7.5) * 0.00004), target: { x, y }, targetIndex, phase: "train" });
  });
  for (let index = 0; index < 16; index += 1)
    samples.push({ signal: signal(0.5, 0.5, (index - 7.5) * 0.00004), target: { x: 0.5, y: 0.5 }, targetIndex: grid.length, phase: "validation" });
  return fitCalibration(samples, [], { minimumTrainingTargets: grid.length, minimumTrainingSamples: 25 });
}

test("calibration reports the screen span each unit of eye signal has to cover", () => {
  const diagnostics = fitGrid(CHILD_TARGETS).diagnostics!;
  // The grid spans 0.64 of the screen per axis and the simulated eye moves
  // 0.12 of signal per unit of screen x, so one unit of u buys 1/0.12 of
  // screen. Same arithmetic vertically.
  assert.ok(Math.abs(diagnostics.screenSpanPerUnitU - 1 / 0.12) < 0.5);
  assert.ok(Math.abs(diagnostics.screenSpanPerUnitV - 1 / 0.06) < 0.5);
});

test("in-sample error cannot tell a steep mapping from a stable one, so the gain is reported beside it", () => {
  // This is why the stage-demo session was allowed to run. Its calibration
  // reported 1.35 deg against 1.09 and 1.17 for the two recordings that
  // worked — indistinguishable — and then put 78% of its samples off screen.
  // gridMedianErrorDeg is measured at the very points the curve interpolates,
  // so it is near zero however steep the mapping is; only the gain separates
  // them, and only the gain is knowable before the session runs.
  const stable = fitGrid(CHILD_TARGETS, eye(0.12, 0.06));
  const steep = fitGrid(CHILD_TARGETS, eye(0.03, 0.015));
  assert.ok(Math.abs(stable.diagnostics!.gridMedianErrorDeg - steep.diagnostics!.gridMedianErrorDeg) < 0.1);
  assert.ok(steep.diagnostics!.screenSpanPerUnitV > stable.diagnostics!.screenSpanPerUnitV * 3);
});

test("a well-conditioned child grid still maps the centre where it belongs", () => {
  const centre = applyCalibration(fitGrid(CHILD_TARGETS), eye(0.12, 0.06)(0.5, 0.5));
  assert.ok(Math.abs(centre.x - 0.5) < 0.01);
  assert.ok(Math.abs(centre.y - 0.5) < 0.01);
});
