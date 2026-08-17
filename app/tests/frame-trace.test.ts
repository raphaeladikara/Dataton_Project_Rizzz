import assert from "node:assert/strict";
import test from "node:test";
import { createFrameTrace, framesInPhases } from "../src/capture/frameTrace";

test("trace records one sample per frame with pose and eye opening", () => {
  const trace = createFrameTrace();
  trace.record({ t: 0, phase: "baseline", faceDetected: true, accepted: true, reason: "ok", eyeOpen: 0.09, yaw: 0.02, pitch: -0.01, rollDeg: 1.4 });
  trace.record({ t: 33, phase: "baseline", faceDetected: false, accepted: false, reason: "landmarks", eyeOpen: 0, yaw: 0, pitch: 0, rollDeg: 0 });
  assert.equal(trace.samples().length, 2);
  assert.equal(trace.samples()[0].eyeOpen, 0.09);
  assert.equal(trace.samples()[1].faceDetected, false);
});

test("frames can be selected by phase for per-phase indices", () => {
  const trace = createFrameTrace();
  ["a", "a", "b"].forEach((phase, index) => trace.record({
    t: index * 33, phase, faceDetected: true, accepted: true, reason: "ok", eyeOpen: 0.08, yaw: 0, pitch: 0, rollDeg: 0,
  }));
  assert.equal(framesInPhases(trace.samples(), ["a"]).length, 2);
  assert.equal(framesInPhases(trace.samples(), ["a", "b"]).length, 3);
});

test("trace resets between sessions so indices never mix children", () => {
  const trace = createFrameTrace();
  trace.record({ t: 0, phase: "a", faceDetected: true, accepted: true, reason: "ok", eyeOpen: 0.08, yaw: 0, pitch: 0, rollDeg: 0 });
  trace.reset();
  assert.equal(trace.samples().length, 0);
});
