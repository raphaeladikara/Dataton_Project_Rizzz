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
