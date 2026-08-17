import assert from "node:assert/strict";
import test from "node:test";
import { responseToNameIndex, type NameCall } from "../src/phenotype/responseToName";
import type { FrameSample } from "../src/capture/frameTrace";

const frame = (t: number, yaw: number): FrameSample => ({
  t, phase: "name_call", faceDetected: true, accepted: true, reason: "ok",
  eyeOpen: 0.09, yaw, pitch: 0, rollDeg: 0,
});

const calls: NameCall[] = [
  { index: 0, offsetMs: 1000 },
  { index: 1, offsetMs: 5000 },
  { index: 2, offsetMs: 9000 },
];

test("a head turn inside the response window counts as a response", () => {
  const frames: FrameSample[] = [];
  for (let t = 0; t <= 12000; t += 33) {
    const turning = (t > 1400 && t < 2200) || (t > 5300 && t < 6100);
    frames.push(frame(t, turning ? 0.45 : 0.01));
  }
  const index = responseToNameIndex(frames, calls);
  assert.equal(index.callsDelivered, 3);
  assert.equal(index.responses, 2);
  assert.ok(Math.abs(index.proportion! - 2 / 3) < 1e-9);
  assert.ok(index.medianLatencyMs! > 300 && index.medianLatencyMs! < 500);
});

test("a turn after the window closes does not count", () => {
  const frames: FrameSample[] = [];
  for (let t = 0; t <= 4000; t += 33) frames.push(frame(t, t > 3500 ? 0.5 : 0.01));
  const index = responseToNameIndex(frames, [{ index: 0, offsetMs: 1000 }]);
  assert.equal(index.responses, 0);
  assert.equal(index.medianLatencyMs, null);
});

test("a head already turned before the call is not scored as a response", () => {
  const frames: FrameSample[] = [];
  for (let t = 0; t <= 4000; t += 33) frames.push(frame(t, 0.5));
  assert.equal(responseToNameIndex(frames, [{ index: 0, offsetMs: 1000 }]).responses, 0);
});

test("no calls delivered yields nulls, not zero", () => {
  const index = responseToNameIndex([frame(0, 0)], []);
  assert.equal(index.proportion, null);
  assert.equal(index.callsDelivered, 0);
});
