import assert from "node:assert/strict";
import test from "node:test";
import { loadFirstRecording, recordingFromAuditLog } from "../src/replay/recording";

const frame = (index: number) => ({
  t: index * 33.3,
  phase: "social_face",
  faceDetected: true,
  accepted: true,
  reason: "ok",
  eyeOpen: 0.28,
  yaw: 0.04,
  pitch: -0.02,
  rollDeg: 1.4,
});

const point = (index: number) => ({ t: index * 33.3, x: 0.5, y: 0.5, phase: "social_face" });

function auditLog(overrides: Record<string, unknown> = {}) {
  return {
    sessionId: "NG-LOG-1",
    createdAt: "2026-08-18T02:00:00.000Z",
    quality: { faceRate: 0.93, gazeDropout: 0.06, brightness: 0.6, calibrationErrorDeg: 2.1 },
    calibration: { validationErrorDeg: 2.4 },
    gaze: {
      processedPoints: Array.from({ length: 60 }, (_, index) => point(index)),
      frames: Array.from({ length: 60 }, (_, index) => frame(index)),
    },
    ...overrides,
  };
}

test("an exported live log becomes a replayable session", () => {
  const recording = recordingFromAuditLog(auditLog(), "session-a.json");
  assert.ok(recording);
  assert.equal(recording.points.length, 60);
  assert.equal(recording.frames.length, 60);
  assert.equal(recording.faceRate, 0.93);
  assert.equal(recording.calibrationErrorDeg, 2.4);
  assert.equal(recording.label, "NG-LOG-1");
});

test("a log without the frame trace is rejected instead of half-loaded", () => {
  // This is the whole point: a recording missing frames would reproduce the
  // synthetic replay's empty indices while claiming to be a real session.
  const log = auditLog();
  (log.gaze as Record<string, unknown>).frames = [];
  assert.equal(recordingFromAuditLog(log, "x"), null);
});

test("a log with too few gaze points is rejected", () => {
  const log = auditLog();
  (log.gaze as Record<string, unknown>).processedPoints = [point(0), point(1)];
  assert.equal(recordingFromAuditLog(log, "x"), null);
});

test("malformed input never throws", () => {
  for (const value of [null, undefined, 42, "log", {}, { gaze: 1 }, { gaze: {}, quality: {} }])
    assert.equal(recordingFromAuditLog(value, "x"), null);
});

test("loading falls through missing recordings and returns null when none exist", async () => {
  const tried: string[] = [];
  const fetcher = (async (url: string) => {
    tried.push(url);
    return { ok: false, json: async () => ({}) };
  }) as unknown as typeof fetch;
  assert.equal(await loadFirstRecording(["/replay/a.json", "/replay/b.json"], fetcher), null);
  assert.deepEqual(tried, ["/replay/a.json", "/replay/b.json"]);
});

test("loading returns the first usable recording", async () => {
  const fetcher = (async (url: string) => ({
    ok: true,
    json: async () => (url.endsWith("a.json") ? { gaze: {} } : auditLog()),
  })) as unknown as typeof fetch;
  const recording = await loadFirstRecording(["/replay/a.json", "/replay/b.json"], fetcher);
  assert.equal(recording?.id, "b.json");
});
