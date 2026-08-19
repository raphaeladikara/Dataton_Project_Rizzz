import assert from "node:assert/strict";
import test from "node:test";
import { responseToNameIndex, type NameCall } from "../src/phenotype/responseToName";
import { NAME_CALL_OFFSETS_MS, NAME_CALL_PHASE_ID, nameCallTimeline, sessionStimulusPhases } from "../src/stimulus/protocol";
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

/**
 * The frame trace is stamped from the start of the whole battery, but the call
 * offsets are relative to the name-call phase. Comparing them directly looked
 * for head turns at second 2 and 6 — inside the baseline and the preferential
 * looking clip, where the participant sits still watching a video — while the
 * calls themselves happened past second 60. Every session scored zero
 * responses, which reads as deviant and is the signal's whole content.
 */
test("call times are anchored to where the name phase actually sits in the battery", () => {
  const phases = sessionStimulusPhases("KP-01");
  const timeline = nameCallTimeline(phases);
  const nameStart = phases
    .slice(0, phases.findIndex((phase) => phase.id === NAME_CALL_PHASE_ID))
    .reduce((total, phase) => total + phase.durationMs, 0);

  assert.equal(timeline.length, NAME_CALL_OFFSETS_MS.length);
  assert.deepEqual(
    timeline.map((call) => call.offsetMs),
    NAME_CALL_OFFSETS_MS.map((offset) => nameStart + offset),
  );
  assert.ok(nameStart > 30_000, `name phase should sit late in the battery, got ${nameStart}`);
});

test("a turn at the same phase-relative time but in an earlier phase is not a response", () => {
  const phases = sessionStimulusPhases("KP-01");
  const timeline = nameCallTimeline(phases);
  const frames: FrameSample[] = [];
  // Still through the real call, turning only during the early filler where the
  // unanchored offsets used to look.
  for (let t = 0; t <= timeline[0].offsetMs + 4000; t += 33) {
    frames.push(frame(t, t > 2100 && t < 3000 ? 0.5 : 0.01));
  }
  assert.equal(responseToNameIndex(frames, timeline).responses, 0);
});

test("a turn inside the real call window counts once the calls are anchored", () => {
  const phases = sessionStimulusPhases("KP-01");
  const timeline = nameCallTimeline(phases);
  const first = timeline[0].offsetMs;
  const frames: FrameSample[] = [];
  for (let t = 0; t <= first + 4000; t += 33) {
    frames.push(frame(t, t > first + 900 && t < first + 1500 ? 0.5 : 0.01));
  }
  const index = responseToNameIndex(frames, [timeline[0]]);
  assert.equal(index.responses, 1);
});

/**
 * "Deviant means measured, never merely undemonstrated." A call the participant
 * was already turned away for cannot be scored either way, so counting it as a
 * non-response turns an absence of evidence into evidence.
 */
test("a call that cannot be scored leaves the denominator instead of counting against the participant", () => {
  const frames: FrameSample[] = [];
  for (let t = 0; t <= 12000; t += 33) {
    const alreadyTurned = t > 4300 && t < 5200;
    const turning = t > 1300 && t < 2000;
    frames.push(frame(t, alreadyTurned || turning ? 0.5 : 0.01));
  }
  const index = responseToNameIndex(frames, calls);
  assert.equal(index.callsSkipped, 1);
  assert.equal(index.callsDelivered, 2);
  assert.equal(index.responses, 1);
  assert.ok(Math.abs(index.proportion! - 0.5) < 1e-9);
});

test("every call unscorable yields an unassessable index, not a deviant one", () => {
  const frames: FrameSample[] = [];
  for (let t = 0; t <= 12000; t += 33) frames.push(frame(t, 0.5));
  const index = responseToNameIndex(frames, calls);
  assert.equal(index.callsSkipped, 3);
  assert.equal(index.callsDelivered, 0);
  assert.equal(index.proportion, null);
});
