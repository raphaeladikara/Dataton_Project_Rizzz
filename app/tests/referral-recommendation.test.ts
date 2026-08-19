import assert from "node:assert/strict";
import test from "node:test";
import {
  buildReferralRecommendation,
  QUARANTINED_SIGNALS,
  REFERRAL_DEVIANT_THRESHOLD,
  type ReferralInput,
} from "../src/outcome/referralRecommendation";

const followsCues: ReferralInput["jointAttention"] = { verdict: "FOLLOWS_CUES", trialsScored: 8, trialsFollowed: 8, pValue: 0.0039 };
/** Post-cue looking sat below each trial's own pre-cue baseline: measured, not merely undemonstrated. */
const noCueFollowing: ReferralInput["jointAttention"] = { verdict: "DOES_NOT_FOLLOW", trialsScored: 8, trialsFollowed: 2, pValue: 0.965 };
/** Followed most cues without reaching significance — the case eight trials cannot resolve. */
const cuesInconclusive: ReferralInput["jointAttention"] = { verdict: "NOT_DISTINGUISHABLE", trialsScored: 8, trialsFollowed: 6, pValue: 0.145 };

/** Typical viewing: threshold applied and not met, cues followed. */
const typical: ReferralInput = {
  geopref: { percentGeometric: 0.31, threshold: 0.69, outcome: "NO_GEOMETRIC_PREFERENCE" },
  jointAttention: followsCues,
};

/** Above the published 69% cutoff on a full-length protocol: the one deviation the rule can still read externally. */
const geometricHeld: ReferralInput["geopref"] = { percentGeometric: 0.88, threshold: 0.69, outcome: "GEOMETRIC_PREFERENCE" };

const signal = (input: ReferralInput, id: string) =>
  buildReferralRecommendation(input).signals.find((item) => item.id === id)!;

test("every signal reports a status, what was measured, and where its direction comes from", () => {
  const result = buildReferralRecommendation(typical);
  assert.equal(result.signals.length, 2);
  assert.deepEqual(result.signals.map((item) => item.id), [
    "geometric_preference",
    "cue_following",
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

test("the blink differential is not a decision signal", () => {
  // Two independent reasons. The only non-actor block in the battery is the
  // preferential-looking clip, so a social/non-social blink contrast is fully
  // confounded with rendering medium: hand-drawn vector against real video.
  // And a 16.75 s window quantises blink rate at 3.6 per minute, so the
  // comparison is dominated by counting noise before content matters at all.
  const ids = buildReferralRecommendation(typical).signals.map((item) => item.id);
  assert.equal(ids.includes("blink_differential" as never), false);
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

test("failing to demonstrate cue following is not the same finding as not following", () => {
  // Eight trials cannot reach p < 0,05 below seven successes, so a child who
  // followed six of eight fails significance while having followed most of
  // them. Counting that as a deviation reads absence of evidence as evidence
  // of absence, and it used to reach the rule directly.
  const inconclusive = signal({ ...typical, jointAttention: cuesInconclusive }, "cue_following");
  assert.equal(inconclusive.status, "tidak_dapat_dinilai");

  // Deviant is reserved for post-cue looking that sat below the trial's own
  // pre-cue baseline, which is a measurement rather than a missing one.
  const deviant = signal({ ...typical, jointAttention: noCueFollowing }, "cue_following");
  assert.equal(deviant.status, "menyimpang");
  assert.doesNotMatch(deviant.reason, /tidak mampu|tidak bisa mengikuti/i);
});

test("an inconclusive cue signal cannot be the second deviation that triggers a referral", () => {
  const result = buildReferralRecommendation({ geopref: geometricHeld, jointAttention: cuesInconclusive });
  assert.equal(result.deviantCount, 1);
  assert.equal(result.recommendsFollowUp, false);
});

test("typical viewing produces no recommendation", () => {
  const result = buildReferralRecommendation(typical);
  assert.equal(result.deviantCount, 0);
  assert.equal(result.recommendsFollowUp, false);
});

test("one deviant signal is not enough", () => {
  const result = buildReferralRecommendation({ geopref: geometricHeld, jointAttention: followsCues });
  assert.equal(result.deviantCount, 1);
  assert.equal(result.recommendsFollowUp, false);
});

test("two deviant signals recommend follow-up and name which ones", () => {
  const result = buildReferralRecommendation({ geopref: geometricHeld, jointAttention: noCueFollowing });
  assert.equal(result.deviantCount, REFERRAL_DEVIANT_THRESHOLD);
  assert.equal(result.recommendsFollowUp, true);
  const deviant = result.signals.filter((item) => item.status === "menyimpang").map((item) => item.id);
  assert.deepEqual(deviant, ["geometric_preference", "cue_following"]);
});

test("the produced-pattern condition trips every assessable signal", () => {
  // The positive control's produced pattern, on the two signals the rule still
  // counts: geometric panel held and cues deliberately not followed.
  const result = buildReferralRecommendation({
    geopref: { percentGeometric: 0.88, threshold: 0.69, outcome: "GEOMETRIC_PREFERENCE" },
    jointAttention: noCueFollowing,
  });
  assert.equal(result.assessableCount, 2);
  assert.equal(result.deviantCount, 2);
  assert.equal(result.recommendsFollowUp, true);
});

test("a recommendation is impossible when fewer than two signals can be assessed", () => {
  const result = buildReferralRecommendation({ geopref: null, jointAttention: noCueFollowing });
  assert.equal(result.assessableCount, 1);
  assert.equal(result.recommendsFollowUp, false);
});

test("the rule never claims validation it does not have, and never reassures", () => {
  for (const input of [typical, { geopref: geometricHeld, jointAttention: noCueFollowing }]) {
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

/**
 * Response to name is quarantined, not deleted.
 *
 * The published paradigm calls the name from behind the child and codes an
 * orienting head turn. Neurogaze speaks through the tablet, so the voice arrives
 * from the screen the child is already watching and there is nothing to turn
 * towards. A rear speaker restores it in a lab and is not realistic on a
 * Posyandu table, so the signal cannot be collected the way it was validated.
 * It stays on the report as a descriptive index and stays out of the rule.
 */
test("response to name is not one of the signals the rule counts", () => {
  const result = buildReferralRecommendation(typical);
  // The id union no longer contains it either, so this is enforced at compile
  // time as well — a future signal cannot be slipped back in by accident.
  assert.deepEqual(result.signals.map((item) => item.id), ["geometric_preference", "cue_following"]);
});

test("the quarantine is recorded with its reason rather than left implicit", () => {
  const entry = QUARANTINED_SIGNALS.find((item) => item.id === "response_to_name");
  assert.ok(entry, "response_to_name should be listed as quarantined");
  assert.match(entry!.reason.toLowerCase(), /belakang|posyandu/);
});

/**
 * With two signals left and the threshold still at two, the rule needs both to
 * deviate, and geometric preference is unassessable on the shortened clip. The
 * composite therefore cannot fire until a full-length licensed clip exists —
 * deliberate, and better stated than discovered.
 */
test("two remaining signals mean the rule needs both, and says so when it cannot", () => {
  const abbreviated = buildReferralRecommendation({
    geopref: { percentGeometric: 0.42, threshold: 0.69, outcome: "MEASURED_PROTOCOL_ABBREVIATED" },
    jointAttention: noCueFollowing,
  });
  assert.equal(abbreviated.assessableCount, 1);
  assert.equal(abbreviated.recommendsFollowUp, false);
  // One assessable signal can never reach the threshold of two, and the
  // headline has to say that it is the missing comparison holding the
  // recommendation back rather than something the child did.
  assert.match(abbreviated.headline.toLowerCase(), /tidak dapat dinilai/);
  assert.match(abbreviated.headline.toLowerCase(), /belum cukup untuk menyarankan rujukan/);
});

/**
 * The safety property the stage demo depends on, and the one a field session
 * depends on far more: a session whose measured percentage sits just over the
 * cutoff must not count as deviant. Before the interval existed, 71% and 94%
 * were the same verdict, and the first of those is inside the noise of a
 * 16.75 s excerpt.
 */
test("a percentage just over the cutoff is unassessable, not deviant", () => {
  const recommendation = buildReferralRecommendation({
    geopref: {
      percentGeometric: 0.71,
      percentGeometricCi: [0.62, 0.79],
      threshold: 0.69,
      outcome: "MEASURED_INTERVAL_STRADDLES_THRESHOLD",
    },
    jointAttention: { verdict: "DOES_NOT_FOLLOW", trialsScored: 8, trialsFollowed: 0, pValue: 1 },
  });
  const geometric = recommendation.signals.find((signal) => signal.id === "geometric_preference");
  assert.equal(geometric?.status, "tidak_dapat_dinilai");
  assert.equal(recommendation.recommendsFollowUp, false);
});

test("an interval clear of the cutoff still reaches a recommendation", () => {
  const recommendation = buildReferralRecommendation({
    geopref: {
      percentGeometric: 0.94,
      percentGeometricCi: [0.81, 1],
      threshold: 0.69,
      outcome: "GEOMETRIC_PREFERENCE_DEMONSTRATION",
    },
    jointAttention: { verdict: "DOES_NOT_FOLLOW", trialsScored: 8, trialsFollowed: 0, pValue: 1 },
  });
  assert.equal(recommendation.recommendsFollowUp, true);
  assert.equal(recommendation.deviantCount, 2);
});

test("the measured string carries the interval so the report cannot show a bare point", () => {
  const recommendation = buildReferralRecommendation({
    geopref: {
      percentGeometric: 0.94,
      percentGeometricCi: [0.81, 1],
      threshold: 0.69,
      outcome: "GEOMETRIC_PREFERENCE_DEMONSTRATION",
    },
    jointAttention: { verdict: "DOES_NOT_FOLLOW", trialsScored: 8, trialsFollowed: 0, pValue: 1 },
  });
  const geometric = recommendation.signals.find((signal) => signal.id === "geometric_preference");
  assert.match(geometric?.measured ?? "", /CI/);
});

/**
 * A field session has one assessable signal today, so "cannot recommend" is the
 * only verdict the lane will ever reach. It still has to say what it measured:
 * a child who followed none of eight cues and a child who followed all eight
 * used to produce the identical sentence.
 */
test("not recommending is not the same as not measuring", () => {
  const held = {
    percentGeometric: 0.4,
    percentGeometricCi: [0.28, 0.53] as readonly [number, number],
    threshold: 0.69,
    outcome: "MEASURED_PROTOCOL_ABBREVIATED" as const,
  };
  const deviant = buildReferralRecommendation({
    geopref: held,
    jointAttention: { verdict: "DOES_NOT_FOLLOW", trialsScored: 8, trialsFollowed: 0, pValue: 1 },
  });
  const ordinary = buildReferralRecommendation({
    geopref: held,
    jointAttention: { verdict: "FOLLOWS_CUES", trialsScored: 8, trialsFollowed: 8, pValue: 0.008 },
  });

  assert.equal(deviant.recommendsFollowUp, false);
  assert.equal(ordinary.recommendsFollowUp, false);
  assert.notEqual(deviant.headline, ordinary.headline);
  assert.match(deviant.headline, /menyimpang/);
  assert.match(ordinary.headline, /tidak menyimpang/);
});

test("a session that assessed nothing says so rather than reporting zero deviations", () => {
  const recommendation = buildReferralRecommendation({
    geopref: null,
    jointAttention: { verdict: "WITHHELD_TOO_FEW_TRIALS", trialsScored: 2, trialsFollowed: 1, pValue: null },
  });
  assert.equal(recommendation.assessableCount, 0);
  assert.match(recommendation.headline, /Belum ada sinyal/);
});

/**
 * The other half of a stage demonstration.
 *
 * Everything above tests a session that could only assess one signal, because
 * that is every field session while the licensed clip is short. In a
 * demonstration both signals are assessable, and a participant who follows the
 * cues and watches the social panel deviates on neither — the run whose entire
 * job is to show that the instrument does not simply recommend everyone.
 *
 * That run used to print "Belum cukup sinyal untuk menyarankan rujukan", the
 * sentence written for a session that could not assess its comparison. It was
 * false: the session assessed both signals and both came back clean. On stage
 * it read as the instrument failing rather than as the instrument working.
 */
test("a session that assessed every signal and found none deviant says that, not that it lacked signals", () => {
  const ordinary = buildReferralRecommendation({
    geopref: {
      percentGeometric: 0.34,
      percentGeometricCi: [0.19, 0.51] as readonly [number, number],
      threshold: 0.69,
      outcome: "NO_GEOMETRIC_PREFERENCE_DEMONSTRATION" as const,
    },
    jointAttention: { verdict: "FOLLOWS_CUES", trialsScored: 8, trialsFollowed: 8, pValue: 0.004 },
  });

  assert.equal(ordinary.assessableCount, 2);
  assert.equal(ordinary.deviantCount, 0);
  assert.equal(ordinary.recommendsFollowUp, false);
  assert.doesNotMatch(ordinary.headline, /[Bb]elum cukup sinyal/);
  assert.match(ordinary.headline, /Tidak ada sinyal yang menyimpang/);
  // Reporting a clean sweep is still not reassurance; the report's own limit
  // copy carries that, and the headline must not undo it.
  assert.doesNotMatch(ordinary.headline, /aman|normal|tidak autis|negatif/i);
  assert.equal(ordinary.reassures, false);
});

test("one deviant signal out of two reports the count against the threshold", () => {
  const partial = buildReferralRecommendation({
    geopref: {
      percentGeometric: 0.34,
      percentGeometricCi: [0.19, 0.51] as readonly [number, number],
      threshold: 0.69,
      outcome: "NO_GEOMETRIC_PREFERENCE_DEMONSTRATION" as const,
    },
    jointAttention: { verdict: "DOES_NOT_FOLLOW", trialsScored: 8, trialsFollowed: 0, pValue: 1 },
  });

  assert.equal(partial.assessableCount, 2);
  assert.equal(partial.deviantCount, 1);
  assert.equal(partial.recommendsFollowUp, false);
  // Not the "sinyal pembandingnya tidak dapat dinilai" sentence: the comparison
  // signal was assessed here, and it came back clean.
  assert.doesNotMatch(partial.headline, /tidak dapat dinilai/);
  assert.match(partial.headline, /1 dari 2 sinyal menyimpang/);
  assert.match(partial.headline, /di bawah batas 2/);
});

/**
 * The demonstration a presenter actually runs: produced pattern, then an
 * ordinary viewer, on the same build. The two must not share a headline.
 */
test("the produced pattern and an ordinary viewer reach opposite recommendations", () => {
  const cues = { trialsScored: 8 };
  const produced = buildReferralRecommendation({
    geopref: { percentGeometric: 0.97, percentGeometricCi: [0.93, 1] as readonly [number, number], threshold: 0.69, outcome: "GEOMETRIC_PREFERENCE_DEMONSTRATION" as const },
    jointAttention: { verdict: "DOES_NOT_FOLLOW", trialsFollowed: 0, pValue: 1, ...cues },
  });
  const ordinary = buildReferralRecommendation({
    geopref: { percentGeometric: 0.34, percentGeometricCi: [0.19, 0.51] as readonly [number, number], threshold: 0.69, outcome: "NO_GEOMETRIC_PREFERENCE_DEMONSTRATION" as const },
    jointAttention: { verdict: "FOLLOWS_CUES", trialsFollowed: 8, pValue: 0.004, ...cues },
  });

  assert.equal(produced.recommendsFollowUp, true);
  assert.match(produced.headline, /Disarankan pemeriksaan lanjutan/);
  assert.equal(ordinary.recommendsFollowUp, false);
  assert.notEqual(produced.headline, ordinary.headline);
  // Neither is a validated instrument, and neither says it is.
  for (const item of [produced, ordinary]) {
    assert.equal(item.validatedOnToddlers, false);
    assert.equal(item.thresholdStatus, "design_choice_not_validated_cutoff");
  }
});
