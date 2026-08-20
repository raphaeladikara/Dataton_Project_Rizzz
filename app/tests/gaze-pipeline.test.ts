import assert from "node:assert/strict";
import test from "node:test";
import { processGazeSamples } from "../src/gaze/pipeline";
import { rasterizeScanpath } from "../src/scanpath/features";

test("gaze pipeline breaks long gaps, rejects impossible jumps, and resamples", () => {
  const result = processGazeSamples([
    { t: 0, x: 0.1, y: 0.2 },
    { t: 50, x: 0.12, y: 0.21 },
    { t: 100, x: 0.95, y: 0.95 },
    { t: 400, x: 0.7, y: 0.7 },
    { t: 450, x: 0.72, y: 0.71 },
  ]);
  assert.equal(result.diagnostics.rejectedJump, 1);
  assert.equal(result.diagnostics.segments, 2);
  assert.ok(result.points.every((point) => point.x >= 0 && point.x <= 1));
});

test("rasterizer does not draw a line across segment gaps", () => {
  const disconnected = rasterizeScanpath([
    { t: 0, x: 0.1, y: 0.1, segment: 0 },
    { t: 500, x: 0.9, y: 0.9, segment: 1 },
  ]);
  const ink = disconnected.reduce((sum, value) => sum + value, 0);
  assert.ok(ink < 40, `expected only two marked neighborhoods, got ${ink}`);
});

test("gaze pipeline creates a new segment when stimulus phase changes", () => {
  const result = processGazeSamples([
    { t: 0, x: 0.5, y: 0.3, phase: "baseline" },
    { t: 50, x: 0.51, y: 0.3, phase: "baseline" },
    { t: 100, x: 0.2, y: 0.6, phase: "cue_left" },
    { t: 150, x: 0.21, y: 0.6, phase: "cue_left" },
  ]);
  assert.equal(result.diagnostics.segments, 2);
  assert.ok(result.diagnostics.phaseCounts.baseline > 0);
  assert.ok(result.diagnostics.phaseCounts.cue_left > 0);
});

test("bounds rejection records which axis ran out of range", () => {
  // A whole session can be discarded because one axis of the calibration was
  // too steep, and the diagnostics said only "rejectedBounds: 1172" — enough
  // to know the session died, not enough to know that every one of its x
  // coordinates was fine. Without the split the next recording is the only
  // way to find out, and it costs another eighty seconds.
  const samples = [
    { t: 0, x: 0.5, y: 0.5 },
    { t: 50, x: 0.5, y: -0.4 },
    { t: 100, x: 0.5, y: 1.6 },
    { t: 150, x: 1.9, y: 0.5 },
    { t: 200, x: 2.2, y: -0.9 },
  ];
  const { diagnostics } = processGazeSamples(samples);
  assert.equal(diagnostics.rejectedBounds, 4);
  assert.equal(diagnostics.rejectedBoundsY, 3, "three samples left the vertical range");
  assert.equal(diagnostics.rejectedBoundsX, 2, "two samples left the horizontal range");
});
