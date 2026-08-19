import test from "node:test";
import assert from "node:assert/strict";
import { reportBadge } from "../src/outcome/reportBadge";
import type { SessionOutcome } from "../src/outcome/sessionOutcome";

function outcome(over: Partial<SessionOutcome> = {}): SessionOutcome {
  return {
    kind: "MEASURED_PROTOCOL_ABBREVIATED",
    headline: "40% waktu pada pola geometrik, 60% pada adegan sosial",
    summaryLine: "…",
    emitsReferral: false,
    reassures: false,
    claimsDiagnosis: false,
    recordedSession: false,
    ...over,
  };
}

const base = {
  engineeringStudy: false,
  qualityPassed: true,
  demonstrationMode: false,
  recommendsFollowUp: false,
};

test("only a session that emits a referral gets the field referral badge", () => {
  const refer = reportBadge({ ...base, outcome: outcome({ kind: "RULE_IN_GEOMETRIC", emitsReferral: true }) });
  assert.equal(refer.tone, "refer");
  assert.equal(refer.label, "PERIKSA LANJUT");

  // Demonstration mode hard-codes emitsReferral to false, so no demonstration
  // may ever reach the coral tone no matter what the composite rule did.
  for (const recommendsFollowUp of [true, false]) {
    const demo = reportBadge({
      ...base,
      demonstrationMode: true,
      recommendsFollowUp,
      outcome: outcome({ kind: "RULE_IN_DEMONSTRATION" }),
    });
    assert.notEqual(demo.tone, "refer");
    assert.equal(demo.tone, "demonstration");
  }
});

/**
 * The two halves of a stage demonstration used to print the same badge.
 *
 * It read `emitsReferral`, which demonstration mode forces to false, so the run
 * where the composite fired and the run where it did not both printed TERUKUR —
 * the produced pattern and the ordinary viewer, indistinguishable at the only
 * glance most of a room gets, under headlines that said opposite things.
 */
test("a demonstration says which of the two things it is demonstrating", () => {
  const fired = reportBadge({
    ...base, demonstrationMode: true, recommendsFollowUp: true,
    outcome: outcome({ kind: "RULE_IN_DEMONSTRATION" }),
  });
  const quiet = reportBadge({
    ...base, demonstrationMode: true, recommendsFollowUp: false,
    outcome: outcome({ kind: "RULE_IN_DEMONSTRATION" }),
  });
  assert.notEqual(fired.label, quiet.label);
  assert.match(fired.label, /PERAGAAN/);
  assert.match(quiet.label, /PERAGAAN/);
  assert.match(fired.label, /PERIKSA LANJUT/);
  // Not "TIDAK MENYIMPANG": one of two signals can deviate while the rule still
  // does not fire, and the badge is phrased off the rule, not off a count.
  assert.doesNotMatch(quiet.label, /PERIKSA LANJUT/);
  assert.doesNotMatch(quiet.label, /aman|normal/i);
});

test("a withheld recording is never dressed up as a measurement", () => {
  const held = reportBadge({ ...base, outcome: outcome({ kind: "WITHHELD" }) });
  assert.equal(held.tone, "withheld");
  // Even in demonstration mode: nothing was measured, so there is nothing to
  // demonstrate.
  const heldDemo = reportBadge({
    ...base, demonstrationMode: true, recommendsFollowUp: true,
    outcome: outcome({ kind: "WITHHELD" }),
  });
  assert.equal(heldDemo.tone, "withheld");
});

test("an engineering session is badged as research whatever the lanes say", () => {
  const passed = reportBadge({ ...base, engineeringStudy: true, outcome: outcome({ kind: "RULE_IN_GEOMETRIC", emitsReferral: true }) });
  assert.equal(passed.tone, "research");
  assert.match(passed.label, /TANPA SKOR/);
  const failed = reportBadge({ ...base, engineeringStudy: true, qualityPassed: false, outcome: outcome() });
  assert.match(failed.label, /BELUM LULUS/);
});

test("an ordinary field session keeps the plain measured badge", () => {
  const measured = reportBadge({ ...base, outcome: outcome() });
  assert.equal(measured.tone, "monitor");
  assert.equal(measured.label, "TERUKUR");
});

test("no badge label may read as a clean bill of health", () => {
  const labels = [
    reportBadge({ ...base, outcome: outcome() }),
    reportBadge({ ...base, demonstrationMode: true, outcome: outcome({ kind: "RULE_IN_DEMONSTRATION" }) }),
    reportBadge({ ...base, demonstrationMode: true, recommendsFollowUp: true, outcome: outcome({ kind: "RULE_IN_DEMONSTRATION" }) }),
    reportBadge({ ...base, outcome: outcome({ kind: "WITHHELD" }) }),
  ].map((item) => item.label);
  // Whole words: "REKAMAN DITAHAN" contains "aman" and is the opposite of a
  // clean bill of health.
  for (const label of labels) assert.doesNotMatch(label, /\b(aman|sehat|normal|negatif|tidak autis)\b/i);
});
