import assert from "node:assert/strict";
import test from "node:test";
import {
  buildReferralRecommendation,
  REFERRAL_DEVIANT_THRESHOLD,
  type ReferralInput,
} from "../src/outcome/referralRecommendation";

const followsCues: ReferralInput["jointAttention"] = { verdict: "FOLLOWS_CUES", trialsScored: 8, trialsFollowed: 8, pValue: 0.0039 };
const noCueFollowing: ReferralInput["jointAttention"] = { verdict: "NOT_DISTINGUISHABLE", trialsScored: 8, trialsFollowed: 3, pValue: 0.855 };

const blink = (perMinute: number | null) => ({ blinkCount: 4, blinksPerMinute: perMinute, durationMs: 20_000 });
const nameCalls = (responses: number) => ({
  callsDelivered: 3,
  responses,
  proportion: responses / 3,
  medianLatencyMs: responses ? 700 : null,
  latenciesMs: Array.from({ length: responses }, () => 700),
});

/** Typical viewing: threshold applied and not met, cues followed, blink suppressed socially, name answered. */
const typical: ReferralInput = {
  geopref: { percentGeometric: 0.31, threshold: 0.69, outcome: "NO_GEOMETRIC_PREFERENCE" },
  jointAttention: followsCues,
  blinkSocial: blink(9),
  blinkNonsocial: blink(17),
  responseToName: nameCalls(3),
};

const signal = (input: ReferralInput, id: string) =>
  buildReferralRecommendation(input).signals.find((item) => item.id === id)!;

test("every signal reports a status, what was measured, and where its direction comes from", () => {
  const result = buildReferralRecommendation(typical);
  assert.equal(result.signals.length, 4);
  assert.deepEqual(result.signals.map((item) => item.id), [
    "geometric_preference",
    "cue_following",
    "blink_differential",
    "response_to_name",
  ]);
  for (const item of result.signals) {
    assert.ok(item.source.length > 0, `${item.id} has no source`);
    assert.ok(item.reason.length > 0, `${item.id} has no reason`);
    assert.ok(item.measured.length > 0, `${item.id} reports no measured value`);
  }
});

test("indices without a transferable cutoff never enter the decision", () => {
  // facingForward and headMovement carry precedent AUCs but no published
  // cutoff that transfers, so scoring them would mean inventing a number.
  const ids = buildReferralRecommendation(typical).signals.map((item) => item.id);
  assert.equal(ids.includes("facing_forward" as never), false);
  assert.equal(ids.includes("head_movement" as never), false);
});

test("a shortened protocol leaves the geometric signal unassessed, never normal", () => {
  const abbreviated = signal({ ...typical, geopref: { percentGeometric: 0.82, threshold: 0.69, outcome: "MEASURED_PROTOCOL_ABBREVIATED" } }, "geometric_preference");
  assert.equal(abbreviated.status, "tidak_dapat_dinilai");
  const withheld = signal({ ...typical, geopref: { percentGeometric: null, threshold: 0.69, outcome: "WITHHELD_INSUFFICIENT_LOOKING" } }, "geometric_preference");
  assert.equal(withheld.status, "tidak_dapat_dinilai");
  assert.equal(signal({ ...typical, geopref: null }, "geometric_preference").status, "tidak_dapat_dinilai");
});

test("geometric preference is deviant only at or above the published cutoff", () => {
  assert.equal(signal({ ...typical, geopref: { percentGeometric: 0.69, threshold: 0.69, outcome: "GEOMETRIC_PREFERENCE" } }, "geometric_preference").status, "menyimpang");
  assert.equal(signal({ ...typical, geopref: { percentGeometric: 0.68, threshold: 0.69, outcome: "NO_GEOMETRIC_PREFERENCE" } }, "geometric_preference").status, "normal");
});

test("too few scored trials leaves cue following unassessed", () => {
  const withheldCues = signal({ ...typical, jointAttention: { verdict: "WITHHELD_TOO_FEW_TRIALS", trialsScored: 3, trialsFollowed: 1, pValue: null } }, "cue_following");
  assert.equal(withheldCues.status, "tidak_dapat_dinilai");
  assert.equal(signal({ ...typical, jointAttention: null }, "cue_following").status, "tidak_dapat_dinilai");
});

test("cue following says it failed to demonstrate, not that the child cannot", () => {
  const deviant = signal({ ...typical, jointAttention: noCueFollowing }, "cue_following");
  assert.equal(deviant.status, "menyimpang");
  // Absence of evidence is not evidence of absence, and eight trials cannot
  // reach significance below seven successes. The wording has to carry that.
  assert.match(deviant.reason, /belum|tidak terbukti/i);
  assert.doesNotMatch(deviant.reason, /tidak mampu|tidak bisa mengikuti/i);
});

test("blink differential is deviant when social content stops suppressing blinking", () => {
  assert.equal(signal({ ...typical, blinkSocial: blink(18), blinkNonsocial: blink(12) }, "blink_differential").status, "menyimpang");
  assert.equal(signal({ ...typical, blinkSocial: blink(9), blinkNonsocial: blink(17) }, "blink_differential").status, "normal");
  assert.equal(signal({ ...typical, blinkSocial: blink(null) }, "blink_differential").status, "tidak_dapat_dinilai");
});

test("response to name is deviant at one call or fewer out of three", () => {
  assert.equal(signal({ ...typical, responseToName: nameCalls(0) }, "response_to_name").status, "menyimpang");
  assert.equal(signal({ ...typical, responseToName: nameCalls(1) }, "response_to_name").status, "menyimpang");
  assert.equal(signal({ ...typical, responseToName: nameCalls(2) }, "response_to_name").status, "normal");
  assert.equal(signal({ ...typical, responseToName: { ...nameCalls(0), callsDelivered: 0, proportion: null } }, "response_to_name").status, "tidak_dapat_dinilai");
});

test("typical viewing produces no recommendation", () => {
  const result = buildReferralRecommendation(typical);
  assert.equal(result.deviantCount, 0);
  assert.equal(result.recommendsFollowUp, false);
});

test("one deviant signal is not enough", () => {
  const result = buildReferralRecommendation({ ...typical, responseToName: nameCalls(0) });
  assert.equal(result.deviantCount, 1);
  assert.equal(result.recommendsFollowUp, false);
});

test("two deviant signals recommend follow-up and name which ones", () => {
  const result = buildReferralRecommendation({ ...typical, jointAttention: noCueFollowing, responseToName: nameCalls(0) });
  assert.equal(result.deviantCount, REFERRAL_DEVIANT_THRESHOLD);
  assert.equal(result.recommendsFollowUp, true);
  const deviant = result.signals.filter((item) => item.status === "menyimpang").map((item) => item.id);
  assert.deepEqual(deviant, ["cue_following", "response_to_name"]);
});

test("the produced-pattern condition trips every assessable signal", () => {
  // The positive control: geometric panel held, cues not followed, name not
  // answered, blink rate flat across social and non-social phases.
  const result = buildReferralRecommendation({
    geopref: { percentGeometric: 0.88, threshold: 0.69, outcome: "GEOMETRIC_PREFERENCE" },
    jointAttention: noCueFollowing,
    blinkSocial: blink(16),
    blinkNonsocial: blink(16),
    responseToName: nameCalls(0),
  });
  assert.equal(result.assessableCount, 4);
  assert.equal(result.deviantCount, 4);
  assert.equal(result.recommendsFollowUp, true);
});

test("a recommendation is impossible when fewer than two signals can be assessed", () => {
  const result = buildReferralRecommendation({
    geopref: null,
    jointAttention: { verdict: "WITHHELD_TOO_FEW_TRIALS", trialsScored: 0, trialsFollowed: 0, pValue: null },
    blinkSocial: blink(null),
    blinkNonsocial: blink(null),
    responseToName: nameCalls(0),
  });
  assert.equal(result.assessableCount, 1);
  assert.equal(result.recommendsFollowUp, false);
});

test("the rule never claims validation it does not have, and never reassures", () => {
  for (const input of [typical, { ...typical, responseToName: nameCalls(0), jointAttention: noCueFollowing }]) {
    const result = buildReferralRecommendation(input);
    assert.equal(result.validatedOnToddlers, false);
    assert.equal(result.reassures, false);
    // The count is a design choice justified by referral capacity, not a
    // cutoff anybody validated on toddlers.
    assert.equal(result.thresholdStatus, "design_choice_not_validated_cutoff");
    assert.doesNotMatch(result.headline, /aman|normal|tidak autis|negatif/i);
  }
});

test("a demonstration outcome makes the geometric signal assessable and says why", () => {
  const above = signal({ ...typical, geopref: { percentGeometric: 0.88, threshold: 0.69, outcome: "GEOMETRIC_PREFERENCE_DEMONSTRATION" } }, "geometric_preference");
  assert.equal(above.status, "menyimpang");
  assert.match(above.reason, /demonstrasi/i);
  const below = signal({ ...typical, geopref: { percentGeometric: 0.22, threshold: 0.69, outcome: "NO_GEOMETRIC_PREFERENCE_DEMONSTRATION" } }, "geometric_preference");
  assert.equal(below.status, "normal");
  assert.match(below.reason, /demonstrasi/i);
});
