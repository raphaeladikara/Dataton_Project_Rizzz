import assert from "node:assert/strict";
import test from "node:test";
import { checkPositiveControlLog } from "../src/positive/checkLog";
import type { SessionAuditLog } from "../src/audit/sessionLog";

const base = (over: Record<string, unknown> = {}) => ({
  schemaVersion: 3,
  sessionId: "s-1",
  createdAt: new Date().toISOString(),
  appVersion: "test",
  stimulusVersion: "ID-geopref-first-joint-cues-name-v5",
  mode: "live",
  purpose: "gate_a_adult",
  profile: { childId: "KP-01", ageMonths: null, site: "tab-a", operator: "RA" },
  privacy: {} as never,
  environment: {} as never,
  positiveControl: { condition: "biasa", attempt: 1 },
  quality: { faceRate: 0.96, gazeDropout: 0.04, calibrationErrorDeg: 2.1, passed: true, reasons: [] },
  gaze: { frames: [{ t: 0 }] },
  assessment: {
    positiveControl: {
      condition: "biasa", attempt: 1,
      signals: [
        { id: "geometric_preference", status: "tidak_dapat_dinilai" },
        { id: "cue_following", status: "normal" },
        { id: "response_to_name", status: "normal" },
      ],
      geoprefOutcome: "MEASURED_PROTOCOL_ABBREVIATED",
      compositeWouldFire: false,
    },
  },
  events: [
    { atMs: 1, type: "stimulus.name_called", level: "info", data: { callIndex: 0, spoken: true } },
    { atMs: 2, type: "stimulus.name_called", level: "info", data: { callIndex: 1, spoken: true } },
    { atMs: 3, type: "stimulus.name_called", level: "info", data: { callIndex: 2, spoken: true } },
  ],
  ...over,
}) as unknown as SessionAuditLog;

test("a clean condition-1 session passes every check", () => {
  const result = checkPositiveControlLog(base());
  assert.deepEqual(result.failures, []);
  assert.equal(result.ok, true);
});

test("a silent name call fails outright", () => {
  const result = checkPositiveControlLog(base({
    events: [{ atMs: 1, type: "stimulus.name_called", level: "info", data: { callIndex: 0, spoken: false } }],
  }));
  assert.equal(result.ok, false);
  assert.ok(result.failures.some((line) => /tidak berbunyi/.test(line)), result.failures.join("; "));
});

/**
 * The check that catches a speaker still sitting in front of the participant.
 * An adult told to respond naturally turns towards a voice behind them; nobody
 * turns towards one coming out of the screen they are already watching.
 */
test("condition 1 with no response to name warns about speaker placement", () => {
  const log = base();
  (log.assessment as never as { positiveControl: { signals: { id: string; status: string }[] } })
    .positiveControl.signals[2].status = "menyimpang";
  const result = checkPositiveControlLog(log);
  assert.ok(result.warnings.some((line) => /speaker/i.test(line)), result.warnings.join("; "));
});

test("condition 2 with no response to name is expected, not warned about", () => {
  const log = base({ positiveControl: { condition: "produksi", attempt: 1 } });
  const assessment = log.assessment as never as { positiveControl: { condition: string; signals: { id: string; status: string }[] } };
  assessment.positiveControl.condition = "produksi";
  assessment.positiveControl.signals[2].status = "menyimpang";
  const result = checkPositiveControlLog(log);
  assert.deepEqual(result.warnings.filter((line) => /speaker/i.test(line)), []);
});

test("a session below a quality threshold fails and names the threshold", () => {
  const result = checkPositiveControlLog(base({
    quality: { faceRate: 0.61, gazeDropout: 0.34, calibrationErrorDeg: 4.8, passed: false, reasons: ["x"] },
  }));
  assert.equal(result.ok, false);
  assert.ok(result.failures.some((line) => /kalibrasi/i.test(line)));
  assert.ok(result.failures.some((line) => /laju frame/i.test(line)));
  assert.ok(result.failures.some((line) => /dropout/i.test(line)));
});

test("a replay log is refused because it carries no frame trace", () => {
  const result = checkPositiveControlLog(base({ mode: "replay", gaze: {} }));
  assert.equal(result.ok, false);
  assert.ok(result.failures.some((line) => /jejak frame/i.test(line)));
});

test("the session sheet row is emitted ready to paste", () => {
  const result = checkPositiveControlLog(base());
  const cells = result.sheetRow.split(",");
  assert.equal(cells[0], "KP-01");
  assert.equal(cells[1], "biasa");
  assert.equal(cells[2], "1");
  assert.equal(cells[4], "kp-01-biasa-1.json");
  assert.equal(cells[8], "MEASURED_PROTOCOL_ABBREVIATED");
  assert.equal(cells[12], "tidak");
});
