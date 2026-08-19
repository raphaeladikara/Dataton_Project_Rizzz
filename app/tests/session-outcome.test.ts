import assert from "node:assert/strict";
import test from "node:test";
import { resolveSessionOutcome } from "../src/outcome/sessionOutcome";

const baseInput = {
  mode: "live" as const,
  qualityPassed: true,
  validityCanScore: true,
  geopref: {
    percentGeometric: 0.82, percentGeometricCi: [0.74, 0.89] as readonly [number, number],
    percentSocial: 0.18, geometricDwellMs: 8200, socialDwellMs: 1800,
    validSamples: 200, totalSamples: 260, aoiCoverage: 0.77, threshold: 0.69,
    outcome: "GEOMETRIC_PREFERENCE" as const, rulesOutAsd: false as const,
  },
  jointAttention: {
    trialsScored: 8, trialsFollowed: 7, medianLiftPoints: 24, medianLatencyMs: 660,
    faceToTargetTransitions: 12, attendedAtCue: 6, trialsEnteringTarget: 7, pValue: 0.035, verdict: "FOLLOWS_CUES" as const,
  },
};

test("a validated geometric preference produces a rule-in referral", () => {
  const outcome = resolveSessionOutcome(baseInput);
  assert.equal(outcome.kind, "RULE_IN_GEOMETRIC");
  assert.equal(outcome.emitsReferral, true);
  assert.equal(outcome.claimsDiagnosis, false);
  assert.ok(outcome.headline.includes("82"));
});

test("below-threshold geometric looking never reads as reassurance", () => {
  const outcome = resolveSessionOutcome({
    ...baseInput,
    geopref: { ...baseInput.geopref, percentGeometric: 0.41, percentSocial: 0.59, outcome: "NO_GEOMETRIC_PREFERENCE" },
  });
  assert.equal(outcome.kind, "MEASURED_NO_RULE_IN");
  assert.equal(outcome.emitsReferral, false);
  assert.equal(outcome.reassures, false);
  assert.ok(outcome.headline.includes("41"));
});

test("an abbreviated protocol reports the percentage but never classifies", () => {
  const outcome = resolveSessionOutcome({
    ...baseInput,
    geopref: { ...baseInput.geopref, outcome: "MEASURED_PROTOCOL_ABBREVIATED" },
  });
  assert.equal(outcome.kind, "MEASURED_PROTOCOL_ABBREVIATED");
  assert.equal(outcome.emitsReferral, false);
  assert.ok(outcome.summaryLine.includes("69%"));
});

test("quality failure overrides every measurement", () => {
  const outcome = resolveSessionOutcome({ ...baseInput, qualityPassed: false });
  assert.equal(outcome.kind, "WITHHELD");
  assert.equal(outcome.emitsReferral, false);
});

test("an invalid session cannot emit a referral even when quality passed", () => {
  const outcome = resolveSessionOutcome({ ...baseInput, validityCanScore: false });
  assert.equal(outcome.kind, "WITHHELD");
  assert.equal(outcome.emitsReferral, false);
});

test("two different children yield two different headlines", () => {
  const first = resolveSessionOutcome(baseInput);
  const second = resolveSessionOutcome({
    ...baseInput,
    geopref: { ...baseInput.geopref, percentGeometric: 0.34, outcome: "NO_GEOMETRIC_PREFERENCE" },
    jointAttention: { ...baseInput.jointAttention, trialsFollowed: 4, pValue: 0.637, verdict: "NOT_DISTINGUISHABLE" },
  });
  assert.notEqual(first.headline, second.headline);
  assert.notEqual(first.summaryLine, second.summaryLine);
});

test("replay mode is labelled as recorded, never as live measurement", () => {
  assert.equal(resolveSessionOutcome({ ...baseInput, mode: "replay" }).recordedSession, true);
  assert.equal(resolveSessionOutcome(baseInput).recordedSession, false);
});

test("no outcome may ever claim a diagnosis or reassure", () => {
  const cases = [
    baseInput,
    { ...baseInput, qualityPassed: false },
    { ...baseInput, geopref: { ...baseInput.geopref, percentGeometric: 0.1, outcome: "NO_GEOMETRIC_PREFERENCE" as const } },
    { ...baseInput, geopref: null },
  ];
  cases.forEach((input) => {
    const outcome = resolveSessionOutcome(input);
    assert.equal(outcome.claimsDiagnosis, false);
    assert.equal(outcome.reassures, false);
  });
});

test("a demonstration rule-in shows the full report but never emits a referral", () => {
  const outcome = resolveSessionOutcome({
    ...baseInput,
    geopref: { ...baseInput.geopref, outcome: "GEOMETRIC_PREFERENCE_DEMONSTRATION" },
  });
  assert.equal(outcome.kind, "RULE_IN_DEMONSTRATION");
  assert.equal(outcome.emitsReferral, false);
  assert.equal(outcome.reassures, false);
  assert.equal(outcome.claimsDiagnosis, false);
  assert.match(outcome.headline, /demonstrasi/i);
  assert.match(outcome.summaryLine, /tidak berlaku|bukan rujukan|tidak sah/i);
});

test("a below-threshold demonstration is also marked and also inert", () => {
  const outcome = resolveSessionOutcome({
    ...baseInput,
    geopref: { ...baseInput.geopref, percentGeometric: 0.4, outcome: "NO_GEOMETRIC_PREFERENCE_DEMONSTRATION" },
  });
  assert.equal(outcome.kind, "RULE_IN_DEMONSTRATION");
  assert.equal(outcome.emitsReferral, false);
  assert.match(outcome.headline, /demonstrasi/i);
});

test("only a validated protocol can ever set emitsReferral", () => {
  const outcomes = [
    "GEOMETRIC_PREFERENCE",
    "NO_GEOMETRIC_PREFERENCE",
    "MEASURED_PROTOCOL_ABBREVIATED",
    "GEOMETRIC_PREFERENCE_DEMONSTRATION",
    "NO_GEOMETRIC_PREFERENCE_DEMONSTRATION",
  ] as const;
  outcomes.forEach((geoprefOutcome) => {
    const outcome = resolveSessionOutcome({ ...baseInput, geopref: { ...baseInput.geopref, outcome: geoprefOutcome } });
    if (outcome.emitsReferral) assert.equal(geoprefOutcome, "GEOMETRIC_PREFERENCE");
    assert.equal(outcome.reassures, false);
    assert.equal(outcome.claimsDiagnosis, false);
  });
});

/**
 * Below-threshold demonstrations used to print a bare percentage.
 *
 * The above-threshold branch said "— di atas ambang 69%" and the below one said
 * nothing at all, so the run that shows an ordinary participant landing under
 * the cutoff — the half of a stage demonstration that proves the instrument
 * responds to what it sees rather than referring everyone — produced a headline
 * that read as a measurement with no verdict attached.
 */
test("a below-threshold demonstration places the number under the cutoff", () => {
  const above = resolveSessionOutcome({
    ...baseInput,
    geopref: { ...baseInput.geopref, percentGeometric: 0.97, outcome: "GEOMETRIC_PREFERENCE_DEMONSTRATION" },
  });
  const below = resolveSessionOutcome({
    ...baseInput,
    geopref: { ...baseInput.geopref, percentGeometric: 0.34, outcome: "NO_GEOMETRIC_PREFERENCE_DEMONSTRATION" },
  });

  assert.match(above.headline, /di atas ambang 69%/);
  assert.match(below.headline, /di bawah ambang 69%/);
  assert.notEqual(above.headline, below.headline);
  // Both stay inert and both stay marked.
  assert.equal(above.emitsReferral, false);
  assert.equal(below.emitsReferral, false);
  assert.match(below.headline, /MODE DEMONSTRASI/);
  // Landing under the cutoff is not a clean bill of health, and the branch that
  // says so is the one an ordinary participant sees.
  assert.match(below.summaryLine, /bukan tanda aman/);
  assert.equal(below.reassures, false);
});
