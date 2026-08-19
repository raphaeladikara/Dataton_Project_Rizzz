import assert from "node:assert/strict";
import test from "node:test";
import { appendAuditEvent, auditFilename, createSessionAudit, serializeAuditLog } from "../src/audit/sessionLog";

test("audit log is versioned, pseudonymous, and never claims to store raw media", () => {
  const initial = createSessionAudit({
    appVersion: "test",
    stimulusVersion: "test-stimulus",
    mode: "live",
    purpose: "gate_a_adult",
    profile: { childId: "NG / 42", age: "24", site: "test", operator: "K-1" },
    researchConsent: false,
  });
  const log = appendAuditEvent(initial, "calibration.failed", { code: "RANGE_X" }, "error");
  assert.equal(log.schemaVersion, 3);
  assert.equal(log.privacy.rawMediaStored, false);
  assert.equal(log.privacy.retention, "until_tab_closed");
  assert.equal(log.privacy.operatorCanDelete, true);
  assert.match(auditFilename(log), /^neurogaze-audit-NG-42-/);
  assert.match(serializeAuditLog(log), /calibration\.failed/);
});

test("adult Gate A sessions keep an empty age as null instead of zero months", () => {
  const log = createSessionAudit({
    appVersion: "test", stimulusVersion: "test", mode: "live", purpose: "gate_a_adult",
    profile: { childId: "GA-01", age: "", site: "pilot", operator: "operator" }, researchConsent: true,
  });
  assert.equal(log.profile.ageMonths, null);
});

test("a positive control session carries its condition and attempt in the log", () => {
  const log = createSessionAudit({
    appVersion: "test", stimulusVersion: "test", mode: "live", purpose: "gate_a_adult",
    profile: { childId: "KP-01", age: "", site: "Lab", operator: "RA" }, researchConsent: true,
    positiveControl: { condition: "produksi", attempt: 2 },
    viewingGeometry: { screenWidthMm: 0, screenHeightMm: 0, viewingDistanceMm: 500, deviceId: "tab-a", referenceDevice: "-" },
  });
  assert.deepEqual(log.positiveControl, { condition: "produksi", attempt: 2 });
  assert.equal(log.viewingGeometry?.viewingDistanceMm, 500);
});

test("the export filename of a positive control session is the evidence filename the protocol expects", () => {
  const log = createSessionAudit({
    appVersion: "test", stimulusVersion: "test", mode: "live", purpose: "gate_a_adult",
    profile: { childId: "KP-01", age: "", site: "Lab", operator: "RA" }, researchConsent: true,
    positiveControl: { condition: "biasa", attempt: 1 },
  });
  assert.equal(auditFilename(log), "kp-01-biasa-1.json");
});

test("a session without a positive control keeps the generic audit filename", () => {
  const log = createSessionAudit({
    appVersion: "test", stimulusVersion: "test", mode: "live", purpose: "gate_a_adult",
    profile: { childId: "GA-01", age: "", site: "pilot", operator: "operator" }, researchConsent: true,
  });
  assert.equal(log.positiveControl, undefined);
  assert.match(auditFilename(log), /^neurogaze-audit-GA-01-/);
});

/**
 * A missing scoring model no longer holds the session, so nothing on screen
 * announces it any more. The log has to, or the next occurrence is as
 * undiagnosable as the first one was.
 */
test("a session recorded without a scoring model says so in the log", () => {
  const log = createSessionAudit({
    appVersion: "test", stimulusVersion: "test", mode: "live", purpose: "gate_a_adult",
    profile: { childId: "KP-01", age: "", site: "Lab", operator: "RA" }, researchConsent: true,
    modelError: "Model tidak tersedia",
  });
  assert.equal(log.modelVersion, undefined);
  assert.equal(log.modelError, "Model tidak tersedia");
});

test("a session with a model loaded carries no model error", () => {
  const log = createSessionAudit({
    appVersion: "test", stimulusVersion: "test", mode: "live", purpose: "gate_a_adult",
    profile: { childId: "KP-01", age: "", site: "Lab", operator: "RA" }, researchConsent: true,
    modelVersion: "neurogaze-gaze-lr-1.0.0",
  });
  assert.equal(log.modelError, undefined);
  assert.equal(log.modelVersion, "neurogaze-gaze-lr-1.0.0");
});
