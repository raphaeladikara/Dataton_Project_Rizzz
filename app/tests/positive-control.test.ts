import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_POSITIVE_CONTROL_ATTEMPTS,
  positiveControlBlockers,
  positiveControlFileName,
  stimulusIntroCopy,
  summarizePositiveControl,
  type PositiveControlMeta,
} from "../src/positive/control";
import { buildReferralRecommendation, type ReferralInput } from "../src/outcome/referralRecommendation";

const biasa: PositiveControlMeta = { condition: "biasa", attempt: 1 };
const produksi: PositiveControlMeta = { condition: "produksi", attempt: 1 };

/** Condition 1: the participant was told nothing, so nothing deviates. */
const naturalViewing: ReferralInput = {
  geopref: { percentGeometric: 0.31, threshold: 0.69, outcome: "NO_GEOMETRIC_PREFERENCE" },
  jointAttention: { verdict: "FOLLOWS_CUES", trialsScored: 8, trialsFollowed: 8, pValue: 0.0039 },
  responseToName: { callsDelivered: 3, responses: 3, proportion: 1, medianLatencyMs: 700, latenciesMs: [700, 700, 700] },
};

/** Condition 2: all three patterns produced on purpose, per the read-aloud script. */
const producedPattern: ReferralInput = {
  geopref: { percentGeometric: 0.82, threshold: 0.69, outcome: "GEOMETRIC_PREFERENCE" },
  jointAttention: { verdict: "DOES_NOT_FOLLOW", trialsScored: 8, trialsFollowed: 1, pValue: 0.98 },
  responseToName: { callsDelivered: 3, responses: 0, proportion: 0, medianLatencyMs: null, latenciesMs: [] },
};

test("the evidence filename encodes participant, condition, and attempt", () => {
  assert.equal(positiveControlFileName("KP-01", biasa), "kp-01-biasa-1.json");
  assert.equal(positiveControlFileName("KP-02", { condition: "produksi", attempt: 3 }), "kp-02-produksi-3.json");
});

test("a participant code with spaces or stray case still yields one canonical filename", () => {
  assert.equal(positiveControlFileName("  Kp 07 ", biasa), "kp-07-biasa-1.json");
});

test("a fourth attempt is refused rather than silently recorded", () => {
  assert.equal(MAX_POSITIVE_CONTROL_ATTEMPTS, 3);
  assert.deepEqual(positiveControlBlockers({ condition: "biasa", attempt: 3 }), []);
  assert.deepEqual(positiveControlBlockers({ condition: "biasa", attempt: 4 }), [
    "Percobaan maksimal 3 per peserta per kondisi",
  ]);
});

test("an attempt that is zero, negative, or fractional is refused", () => {
  for (const attempt of [0, -1, 1.5]) {
    assert.deepEqual(positiveControlBlockers({ condition: "biasa", attempt }), [
      "Nomor percobaan harus 1, 2, atau 3",
    ]);
  }
});

test("the summary carries all three signal statuses so the session sheet can be filled", () => {
  const summary = summarizePositiveControl({
    meta: produksi,
    referral: buildReferralRecommendation(producedPattern),
    geoprefOutcome: "GEOMETRIC_PREFERENCE",
  });
  assert.deepEqual(summary.signals, [
    { id: "geometric_preference", status: "menyimpang" },
    { id: "cue_following", status: "menyimpang" },
    { id: "response_to_name", status: "menyimpang" },
  ]);
  assert.equal(summary.geoprefOutcome, "GEOMETRIC_PREFERENCE");
  assert.equal(summary.condition, "produksi");
  assert.equal(summary.attempt, 1);
});

test("a produced pattern makes the composite rule fire, and that is reported as rule response", () => {
  const summary = summarizePositiveControl({
    meta: produksi,
    referral: buildReferralRecommendation(producedPattern),
    geoprefOutcome: "GEOMETRIC_PREFERENCE",
  });
  assert.equal(summary.compositeWouldFire, true);
});

test("natural viewing leaves the composite rule silent", () => {
  const summary = summarizePositiveControl({
    meta: biasa,
    referral: buildReferralRecommendation(naturalViewing),
    geoprefOutcome: "NO_GEOMETRIC_PREFERENCE",
  });
  assert.equal(summary.compositeWouldFire, false);
  assert.deepEqual(summary.signals.map((item) => item.status), ["normal", "normal", "normal"]);
});

test("a firing composite on an adult never becomes a referral", () => {
  const summary = summarizePositiveControl({
    meta: produksi,
    referral: buildReferralRecommendation(producedPattern),
    geoprefOutcome: "GEOMETRIC_PREFERENCE",
  });
  assert.equal(summary.emitsReferral, false);
  assert.equal(summary.scope, "instrument_response_adult_produced_pattern");
});

/**
 * Condition 1 is only "menonton biasa" while the participant does not know the
 * directional cues are being measured, and condition 2 asks them to withhold
 * exactly the response the Gate A screen asks for. One neutral screen serves
 * both; a screen that names the task serves neither.
 */
test("a positive control session shows a stimulus intro that names no task", () => {
  for (const meta of [biasa, produksi]) {
    const copy = stimulusIntroCopy({ engineering: true, positiveControl: meta });
    const text = [copy.audience, copy.task, copy.detail, ...copy.steps].join(" ").toLowerCase();
    for (const leak of ["ikuti", "arah", "geometris", "panel", "tunjuk", "nama", "menoleh", "cue"]) {
      assert.ok(!text.includes(leak), `positive control intro leaks "${leak}": ${text}`);
    }
  }
});

test("the positive control intro points the participant at the operator's spoken script", () => {
  const copy = stimulusIntroCopy({ engineering: true, positiveControl: biasa });
  assert.match(copy.detail.toLowerCase(), /operator/);
});

test("plain Gate A keeps the cue-following instructions it was written for", () => {
  const copy = stimulusIntroCopy({ engineering: true, positiveControl: null });
  assert.match(copy.task.toLowerCase(), /ikuti/);
});

test("the child lane is untouched by the positive control branch", () => {
  const copy = stimulusIntroCopy({ engineering: false, positiveControl: null });
  assert.match(copy.audience.toLowerCase(), /pengasuh/);
  assert.equal(copy.steps.length, 3);
});
