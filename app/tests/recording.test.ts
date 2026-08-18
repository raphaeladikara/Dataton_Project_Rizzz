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

test("an empty manifest yields no recording and no filename guessing", async () => {
  const tried: string[] = [];
  const fetcher = (async (url: string) => {
    tried.push(url);
    return { ok: true, json: async () => ({ recordings: [] }) };
  }) as unknown as typeof fetch;
  assert.equal(await loadFirstRecording("/replay/index.json", fetcher), null);
  assert.deepEqual(tried, ["/replay/index.json"]);
});

test("a missing manifest is not an error", async () => {
  const fetcher = (async () => ({ ok: false, json: async () => ({}) })) as unknown as typeof fetch;
  assert.equal(await loadFirstRecording("/replay/index.json", fetcher), null);
});

test("loading returns the first usable recording listed in the manifest", async () => {
  const fetcher = (async (url: string) => ({
    ok: true,
    json: async () => {
      if (url.endsWith("index.json")) return { recordings: ["broken.json", "session-b.json"] };
      return url.endsWith("broken.json") ? { gaze: {} } : auditLog();
    },
  })) as unknown as typeof fetch;
  const recording = await loadFirstRecording("/replay/index.json", fetcher);
  assert.equal(recording?.id, "session-b.json");
});

test("the shipped manifest is valid and honest about being empty", async () => {
  const { readFileSync } = await import("node:fs");
  const manifest = JSON.parse(
    readFileSync(new URL("../public/replay/index.json", import.meta.url), "utf8"),
  );
  assert.ok(Array.isArray(manifest.recordings));
  assert.match(manifest.note, /simulasi/i);
});
