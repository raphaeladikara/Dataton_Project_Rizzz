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
  positiveControl: { condition: "biasa", attempt: 1, speakerBehind: true },
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

/**
 * Response to name is quarantined out of the rule, so a silent call no longer
 * invalidates a session — it only empties a descriptive index. Refusing the
 * session over it would block collection for a number that decides nothing.
 */
test("a silent name call warns but no longer fails the session", () => {
  const result = checkPositiveControlLog(base({
    events: [{ atMs: 1, type: "stimulus.name_called", level: "info", data: { callIndex: 0, spoken: false } }],
  }));
  assert.equal(result.ok, true);
  assert.ok(result.warnings.some((line) => /tidak berbunyi/.test(line)), result.warnings.join("; "));
});

test("the quarantined signal is recorded with what it measured, never as a verdict", () => {
  const result = checkPositiveControlLog(base({
    gaze: { frames: [{ t: 0 }], responseToName: { callsDelivered: 3, callsSkipped: 0, responses: 2 } },
  }));
  assert.equal(result.sheetRow.split(",")[11], "dikarantina (2/3)");
  assert.deepEqual(result.warnings.filter((line) => /penempatan speaker/i.test(line)), []);
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

test("a session without a declared speaker expects no calls and says so in the sheet", () => {
  const result = checkPositiveControlLog(base({
    positiveControl: { condition: "biasa", attempt: 1, speakerBehind: false },
    events: [],
  }));
  assert.deepEqual(result.failures, []);
  assert.equal(result.sheetRow.split(",")[11], "tidak_dipakai");
  assert.deepEqual(result.warnings.filter((line) => /panggilan/i.test(line)), []);
});

test("declaring a speaker but delivering no calls is a contradiction the checker catches", () => {
  const result = checkPositiveControlLog(base({
    positiveControl: { condition: "biasa", attempt: 1, speakerBehind: true },
    events: [],
  }));
  assert.equal(result.ok, false);
  assert.ok(result.failures.some((line) => /speaker/i.test(line)), result.failures.join("; "));
});

/**
 * With a speaker declared, a session where nobody ever turned is the signature
 * of a speaker that is misplaced, too quiet, or in front of the participant.
 */
test("a declared speaker with no head turn at all warns about the rig", () => {
  const result = checkPositiveControlLog(base({
    positiveControl: { condition: "biasa", attempt: 1, speakerBehind: true },
    gaze: { frames: [{ t: 0 }], responseToName: { callsDelivered: 3, callsSkipped: 0, responses: 0 } },
  }));
  assert.ok(result.warnings.some((line) => /speaker/i.test(line)), result.warnings.join("; "));
});

test("logs recorded before the mode existed are flagged as undeclared, not assumed", () => {
  const result = checkPositiveControlLog(base({ positiveControl: { condition: "biasa", attempt: 1 } }));
  assert.ok(result.warnings.some((line) => /tidak dideklarasikan/i.test(line)), result.warnings.join("; "));
});
