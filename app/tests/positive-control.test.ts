import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_POSITIVE_CONTROL_ATTEMPTS,
  positiveControlBlockers,
  positiveControlFileName,
  positiveControlFromSession,
  sessionNameCalls,
  stimulusIntroCopy,
  summarizePositiveControl,
  type PositiveControlMeta,
} from "../src/positive/control";
import { buildReferralRecommendation, type ReferralInput } from "../src/outcome/referralRecommendation";
import { NAME_CALL_OFFSETS_MS, nameCallTimeline, STIMULUS_PHASES } from "../src/stimulus/protocol";

const biasa: PositiveControlMeta = { condition: "biasa", attempt: 1 };
const produksi: PositiveControlMeta = { condition: "produksi", attempt: 1 };

/** Condition 1: the participant was told nothing, so nothing deviates. */
const naturalViewing: ReferralInput = {
  geopref: { percentGeometric: 0.31, threshold: 0.69, outcome: "NO_GEOMETRIC_PREFERENCE" },
  jointAttention: { verdict: "FOLLOWS_CUES", trialsScored: 8, trialsFollowed: 8, pValue: 0.0039 },
};

/** Condition 2: all three patterns produced on purpose, per the read-aloud script. */
const producedPattern: ReferralInput = {
  geopref: { percentGeometric: 0.82, threshold: 0.69, outcome: "GEOMETRIC_PREFERENCE" },
  jointAttention: { verdict: "DOES_NOT_FOLLOW", trialsScored: 8, trialsFollowed: 1, pValue: 0.98 },
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

test("the summary carries every rule signal so the session sheet can be filled", () => {
  const summary = summarizePositiveControl({
    meta: produksi,
    referral: buildReferralRecommendation(producedPattern),
    geoprefOutcome: "GEOMETRIC_PREFERENCE",
  });
  assert.deepEqual(summary.signals, [
    { id: "geometric_preference", status: "menyimpang" },
    { id: "cue_following", status: "menyimpang" },
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
  assert.deepEqual(summary.signals.map((item) => item.status), ["normal", "normal"]);
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

/**
 * The audit is committed inside the same call that captures the points, before
 * React has recomputed the memos the report reads. Deriving the block from
 * those memos therefore describes the session that had not started yet: every
 * signal unassessable, every outcome null, no matter what the participant did.
 * The block has to be built from the freshly captured session products.
 */
test("the block is built from the session that just ran, not from pre-session state", () => {
  const summary = positiveControlFromSession({
    meta: biasa,
    geopref: { percentGeometric: 0.34, threshold: 0.69, outcome: "NO_GEOMETRIC_PREFERENCE" },
    jointAttention: { verdict: "FOLLOWS_CUES", trialsScored: 8, trialsFollowed: 7, pValue: 0.035 },
  });
  assert.equal(summary.geoprefOutcome, "NO_GEOMETRIC_PREFERENCE");
  assert.deepEqual(summary.signals.map((item) => item.status), ["normal", "normal"]);
});

/**
 * The exact shape a stale read produces. If a real log ever carries this while
 * gaze.processedPoints holds geopref samples, the wiring has regressed.
 */
test("an empty session is the one case that yields only unassessable signals", () => {
  const summary = positiveControlFromSession({
    meta: biasa,
    geopref: null,
    jointAttention: null,
  });
  assert.deepEqual(summary.signals.map((item) => item.status), [
    "tidak_dapat_dinilai", "tidak_dapat_dinilai",
  ]);
  assert.equal(summary.geoprefOutcome, null);
});

/**
 * The name is no longer required. Response to name is quarantined out of the
 * rule, so blocking a session over a field that feeds nothing but a descriptive
 * index would add friction at a Posyandu table for no decision value.
 */
test("a positive control without a name to call is allowed", () => {
  assert.deepEqual(positiveControlBlockers(biasa), []);
});


/**
 * Two declared modes instead of one guessed from whether a name was typed.
 *
 * Without a speaker behind the participant the name call cannot be measured the
 * way it was validated, so it is not delivered at all: no voice, no index, and
 * the log says the mode rather than leaving a reader to infer it from an empty
 * number. With one, the calls go out and the head-turn detector runs.
 */
test("no speaker means no calls are delivered at all", () => {
  assert.deepEqual(sessionNameCalls({ speakerBehind: false }, STIMULUS_PHASES), []);
});

test("a declared speaker delivers every call, anchored to the battery clock", () => {
  const calls = sessionNameCalls({ speakerBehind: true }, STIMULUS_PHASES);
  assert.equal(calls.length, NAME_CALL_OFFSETS_MS.length);
  assert.deepEqual(calls, nameCallTimeline(STIMULUS_PHASES));
});

test("declaring a speaker but giving no name to call is refused", () => {
  assert.deepEqual(
    positiveControlBlockers({ ...biasa, speakerBehind: true }, { callName: "  " }),
    ["Speaker dipakai tetapi nama panggilan belum diisi"],
  );
  assert.deepEqual(positiveControlBlockers({ ...biasa, speakerBehind: true }, { callName: "Rafa" }), []);
});

test("without a speaker the name is irrelevant and never blocks the session", () => {
  assert.deepEqual(positiveControlBlockers({ ...biasa, speakerBehind: false }, { callName: "" }), []);
  assert.deepEqual(positiveControlBlockers(biasa, { callName: "" }), []);
});

/**
 * The mode changes what was collected, never whether the signal counts. It stays
 * out of the rule in both modes; a rear speaker is a lab rig, not a Posyandu one.
 */
test("the speaker mode never puts the signal back into the rule", () => {
  for (const speakerBehind of [true, false]) {
    const summary = positiveControlFromSession({
      meta: { ...produksi, speakerBehind },
      geopref: { percentGeometric: 0.82, threshold: 0.69, outcome: "GEOMETRIC_PREFERENCE" },
      jointAttention: { verdict: "DOES_NOT_FOLLOW", trialsScored: 8, trialsFollowed: 1, pValue: 0.98 },
    });
    assert.deepEqual(summary.signals.map((item) => item.id), ["geometric_preference", "cue_following"]);
  }
});
