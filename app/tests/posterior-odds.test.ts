import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPosteriorOdds,
  DEFAULT_PRETEST_PROBABILITY,
  GEOPREF_LR_POSITIVE,
} from "../src/outcome/posteriorOdds";
import { buildReferralRecommendation, type ReferralInput } from "../src/outcome/referralRecommendation";

const signalsFor = (input: ReferralInput) => buildReferralRecommendation(input).signals;

/** Produced pattern on stage: the whole interval sits above the published cutoff. */
const geometricDeviant: ReferralInput = {
  geopref: {
    percentGeometric: 0.94,
    percentGeometricCi: [0.88, 0.98],
    threshold: 0.69,
    outcome: "GEOMETRIC_PREFERENCE_DEMONSTRATION",
  },
  jointAttention: { verdict: "DOES_NOT_FOLLOW", trialsScored: 8, trialsFollowed: 0, pValue: 1 },
};

/** Ordinary viewing: interval entirely below the cutoff, cues followed. */
const geometricNormal: ReferralInput = {
  geopref: {
    percentGeometric: 0.35,
    percentGeometricCi: [0.27, 0.44],
    threshold: 0.69,
    outcome: "NO_GEOMETRIC_PREFERENCE_DEMONSTRATION",
  },
  jointAttention: { verdict: "FOLLOWS_CUES", trialsScored: 8, trialsFollowed: 8, pValue: 0.0039 },
};

/** The shipped field session: the clip is short, so the cutoff does not apply. */
const geometricUnassessable: ReferralInput = {
  geopref: {
    percentGeometric: 0.94,
    percentGeometricCi: [0.88, 0.98],
    threshold: 0.69,
    outcome: "MEASURED_PROTOCOL_ABBREVIATED",
  },
  jointAttention: { verdict: "DOES_NOT_FOLLOW", trialsScored: 8, trialsFollowed: 0, pValue: 1 },
};

test("a deviant geometric signal lifts 1% pre-test to the 7,9% the design note predicts", () => {
  const result = buildPosteriorOdds({ signals: signalsFor(geometricDeviant), thresholdApplied: true });
  assert.ok(result);
  assert.equal(result.pretestProbability, DEFAULT_PRETEST_PROBABILITY);
  assert.ok(
    Math.abs(result.posteriorProbability - 0.079) < 0.001,
    `expected ~0,079, got ${result.posteriorProbability}`,
  );
});

test("cue following carries no published operating point, so its ratio is exactly 1", () => {
  const result = buildPosteriorOdds({ signals: signalsFor(geometricDeviant), thresholdApplied: true });
  const cue = result!.terms.find((term) => term.id === "cue_following");
  assert.equal(cue?.likelihoodRatio, 1);
  const geometric = result!.terms.find((term) => term.id === "geometric_preference");
  assert.equal(geometric?.likelihoodRatio, GEOPREF_LR_POSITIVE);
});

/**
 * The one that matters most on stage. A negative GeoPref has 65% NPV, and a
 * layer that dropped the posterior towards zero here would be manufacturing the
 * reassurance the whole report refuses to give.
 */
test("a normal geometric signal barely moves the posterior downwards", () => {
  const result = buildPosteriorOdds({ signals: signalsFor(geometricNormal), thresholdApplied: true });
  assert.ok(result);
  assert.ok(result.posteriorProbability < DEFAULT_PRETEST_PROBABILITY);
  assert.ok(
    result.posteriorProbability > 0.008,
    `a negative must not read as ruling out ASD, got ${result.posteriorProbability}`,
  );
});

test("an unassessable signal moves nothing, so the posterior stays at the prevalence", () => {
  const signals = signalsFor(geometricUnassessable);
  const result = buildPosteriorOdds({ signals, thresholdApplied: true });
  assert.ok(result);
  assert.ok(Math.abs(result.posteriorProbability - DEFAULT_PRETEST_PROBABILITY) < 1e-9);
  for (const term of result.terms) assert.equal(term.likelihoodRatio, 1);
});

test("without the threshold applied there is no posterior at all", () => {
  assert.equal(buildPosteriorOdds({ signals: signalsFor(geometricUnassessable), thresholdApplied: false }), null);
});

test("a pre-test probability supplied by the health worker replaces the prevalence", () => {
  const result = buildPosteriorOdds({
    signals: signalsFor(geometricDeviant),
    thresholdApplied: true,
    pretestProbability: 0.1,
  });
  assert.ok(result);
  assert.ok(Math.abs(result.posteriorProbability - 0.486) < 0.002, `got ${result.posteriorProbability}`);
});

test("every term names where its ratio comes from and why", () => {
  const result = buildPosteriorOdds({ signals: signalsFor(geometricDeviant), thresholdApplied: true });
  for (const term of result!.terms) {
    assert.ok(term.source.length > 0, `${term.id} has no source`);
    assert.ok(term.note.length > 0, `${term.id} has no note`);
  }
  assert.equal(result!.assumesConditionalIndependence, true);
  assert.ok(result!.scopeNote.includes("16,75"));
});
