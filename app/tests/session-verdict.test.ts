import assert from "node:assert/strict";
import test from "node:test";
import { buildPosteriorOdds } from "../src/outcome/posteriorOdds";
import { buildReferralRecommendation, type ReferralInput } from "../src/outcome/referralRecommendation";
import { resolveSessionOutcome, type SessionOutcomeInput } from "../src/outcome/sessionOutcome";
import {
  buildSessionVerdict,
  VERDICT_FOLLOW_UP,
  VERDICT_NO_FOLLOW_UP,
} from "../src/outcome/sessionVerdict";
import type { GeoprefResult } from "../src/geopref/score";
import type { JointAttentionProfile } from "../src/inference/jointAttention";

const geopref = (over: Partial<GeoprefResult>): GeoprefResult => ({
  percentGeometric: 0.94, percentGeometricCi: [0.88, 0.98], percentSocial: 0.06,
  geometricDwellMs: 15000, socialDwellMs: 900, validSamples: 420, totalSamples: 470,
  aoiCoverage: 0.89, threshold: 0.69, outcome: "GEOMETRIC_PREFERENCE_DEMONSTRATION", rulesOutAsd: false,
  ...over,
});

const cue = (over: Partial<JointAttentionProfile>): JointAttentionProfile => ({
  trialsScored: 8, trialsFollowed: 0, medianLiftPoints: 0, medianLatencyMs: null,
  faceToTargetTransitions: 0, attendedAtCue: 7, trialsEnteringTarget: 0,
  pValue: 1, verdict: "DOES_NOT_FOLLOW", ...over,
});

function verdictFor(input: {
  geopref: GeoprefResult;
  cue: JointAttentionProfile;
  demonstrationMode?: boolean;
  qualityPassed?: boolean;
}) {
  const outcomeInput: SessionOutcomeInput = {
    mode: "live",
    qualityPassed: input.qualityPassed ?? true,
    validityCanScore: input.qualityPassed ?? true,
    geopref: input.geopref,
    jointAttention: input.cue,
  };
  const referralInput: ReferralInput = {
    geopref: {
      percentGeometric: input.geopref.percentGeometric,
      percentGeometricCi: input.geopref.percentGeometricCi,
      threshold: input.geopref.threshold,
      outcome: input.geopref.outcome,
    },
    jointAttention: {
      verdict: input.cue.verdict,
      trialsScored: input.cue.trialsScored,
      trialsFollowed: input.cue.trialsFollowed,
      pValue: input.cue.pValue,
    },
  };
  const referral = buildReferralRecommendation(referralInput);
  const demonstrationMode = input.demonstrationMode ?? true;
  return buildSessionVerdict({
    referral,
    outcome: resolveSessionOutcome(outcomeInput),
    posterior: buildPosteriorOdds({ signals: referral.signals, thresholdApplied: demonstrationMode }),
    demonstrationMode,
  });
}

test("both signals deviant: the verdict names the place to go, and says it is a demonstration", () => {
  const verdict = verdictFor({ geopref: geopref({}), cue: cue({}) });
  assert.ok(verdict);
  assert.equal(verdict.tone, "follow_up");
  assert.equal(verdict.headline, VERDICT_FOLLOW_UP);
  assert.match(verdict.headline, /Puskesmas|rumah sakit/);
  assert.match(verdict.subline, /2 dari 2 sinyal menyimpang/);
  assert.match(verdict.caveat, /peragaan/i);
  assert.match(verdict.caveat, /bukan rujukan resmi/);
});

test("both signals normal: the verdict is just as short, and refuses to read as an all-clear", () => {
  const verdict = verdictFor({
    geopref: geopref({ percentGeometric: 0.35, percentGeometricCi: [0.27, 0.44], outcome: "NO_GEOMETRIC_PREFERENCE_DEMONSTRATION" }),
    cue: cue({ verdict: "FOLLOWS_CUES", trialsFollowed: 8, trialsEnteringTarget: 8, pValue: 0.0039 }),
  });
  assert.ok(verdict);
  assert.equal(verdict.tone, "no_follow_up");
  assert.equal(verdict.headline, VERDICT_NO_FOLLOW_UP);
  assert.match(verdict.subline, /2 dari 2 sinyal dinilai/);
  assert.match(verdict.caveat, /bukan tanda aman/);
  assert.match(verdict.caveat, /17%/);
});

/**
 * The promise this whole block exists to keep. Six of nine ordinary-viewing
 * sessions in the positive control could assess only one signal, and a headline
 * that changed shape for them would have made the instrument look unsure of a
 * result it was not unsure of.
 */
test("one signal normal and one unassessable still prints the same headline as two normal", () => {
  const verdict = verdictFor({
    geopref: geopref({ percentGeometric: 0.52, percentGeometricCi: [0.44, 0.61], outcome: "MEASURED_INTERVAL_STRADDLES_THRESHOLD" }),
    cue: cue({ verdict: "FOLLOWS_CUES", trialsFollowed: 7, trialsEnteringTarget: 8, pValue: 0.0352 }),
  });
  assert.ok(verdict);
  assert.equal(verdict.tone, "no_follow_up");
  assert.equal(verdict.headline, VERDICT_NO_FOLLOW_UP);
  // The nuance is not deleted — it moves down here, with its reason attached.
  assert.match(verdict.subline, /1 sinyal tidak dapat dinilai/);
  const geometricReason = verdict.reasons.find((item) => item.id === "geometric_preference");
  assert.match(geometricReason!.body, /melintasi ambang/);
});

test("one deviant and one normal stays below the threshold and says so in the subline", () => {
  const verdict = verdictFor({
    geopref: geopref({}),
    cue: cue({ verdict: "FOLLOWS_CUES", trialsFollowed: 8, trialsEnteringTarget: 8, pValue: 0.0039 }),
  });
  assert.ok(verdict);
  assert.equal(verdict.tone, "no_follow_up");
  assert.equal(verdict.headline, VERDICT_NO_FOLLOW_UP);
  assert.match(verdict.subline, /1 dari 2 sinyal menyimpang/);
  assert.match(verdict.subline, /di bawah batas 2/);
});

test("a withheld session gets no verdict at all", () => {
  assert.equal(verdictFor({ geopref: geopref({}), cue: cue({}), qualityPassed: false }), null);
});

/**
 * The field path today. Neither signal can be placed against a reference, so
 * there is nothing to state — and "no sign worth following up" about a session
 * that measured nothing would be exactly the reassurance this report refuses.
 */
test("nothing assessable means no verdict, not a reassuring one", () => {
  const verdict = verdictFor({
    geopref: geopref({ outcome: "MEASURED_PROTOCOL_ABBREVIATED" }),
    cue: cue({ verdict: "NOT_DISTINGUISHABLE", trialsFollowed: 5, trialsEnteringTarget: 6, pValue: 0.363 }),
    demonstrationMode: false,
  });
  assert.equal(verdict, null);
});

test("the follow-up verdict carries the posterior as a reason, never as the headline", () => {
  const verdict = verdictFor({ geopref: geopref({}), cue: cue({}) });
  const posterior = verdict!.reasons.find((item) => item.id === "posterior_odds");
  assert.ok(posterior, "posterior reason missing");
  assert.match(posterior.measured, /1,0% → 7,9%/);
  assert.match(posterior.body, /16,75/);
  assert.ok(!verdict!.headline.includes("7,9"));
});

test("every reason names what was measured and where its direction comes from", () => {
  const verdict = verdictFor({ geopref: geopref({}), cue: cue({}) });
  assert.equal(verdict!.reasons.length, 3);
  for (const reason of verdict!.reasons) {
    assert.ok(reason.measured.length > 0, `${reason.id} reports nothing measured`);
    assert.ok(reason.body.length > 0, `${reason.id} has no body`);
    assert.ok(reason.source.length > 0, `${reason.id} has no source`);
  }
});
