import assert from "node:assert/strict";
import test from "node:test";
import { classifyAoi, cueFeatures } from "../src/gaze/aoi";
import { assessFeatureOod, type OodReference } from "../src/quality/ood";

test("AOI classifier and cue response preserve phase semantics", () => {
  assert.equal(classifyAoi({ x: 0.5, y: 0.3 }), "face");
  assert.equal(classifyAoi({ x: 0.16, y: 0.6 }), "target_left");
  const summary = cueFeatures([
    { t: 0, x: 0.5, y: 0.3, phase: "eye_cue_left" },
    { t: 50, x: 0.16, y: 0.6, phase: "eye_cue_left" },
  ], { eye_cue_left: "left" });
  assert.equal(summary.faceTargetTransitions, 1);
  assert.equal(summary.targetResponse.eye_cue_left.latencyMs, 50);
  assert.equal(summary.targetResponse.eye_cue_left.probability, 0.5);
  assert.equal(summary.phaseCoverage, 0);
});

test("cue coverage requires enough samples in every expected phase", () => {
  const points = Array.from({ length: 8 }, (_, index) => ({
    t: index * 50,
    x: 0.16,
    y: 0.6,
    phase: "pointing_left",
  }));
  const summary = cueFeatures(points, { pointing_left: "left", pointing_right: "right" });
  assert.equal(summary.adequatePhaseCount, 1);
  assert.equal(summary.expectedPhaseCount, 2);
  assert.equal(summary.phaseCoverage, 0.5);
  assert.equal(summary.phaseSampleCount.pointing_right, 0);
});

test("cue response separates neutral lead-in from post-cue target looking", () => {
  const points = [
    ...Array.from({ length: 8 }, (_, index) => ({ t: index * 50, x: 0.5, y: 0.3, phase: "gaze_left", epoch: "pre_cue" as const })),
    ...Array.from({ length: 8 }, (_, index) => ({ t: 400 + index * 50, x: index === 0 ? 0.5 : 0.16, y: index === 0 ? 0.3 : 0.6, phase: "gaze_left", epoch: "post_cue" as const })),
  ];
  const response = cueFeatures(points, { gaze_left: "left" }).targetResponse.gaze_left;
  assert.equal(response.preCueProbability, 0);
  assert.equal(response.probability, 0.875);
  assert.equal(response.targetLift, 0.875);
  assert.equal(response.latencyMs, 50);
  assert.equal(response.faceAtCue, true);
});

test("epoch-aware coverage requires both lead-in and post-cue samples", () => {
  const preOnly = Array.from({ length: 12 }, (_, index) => ({
    t: index * 50,
    x: 0.5,
    y: 0.3,
    phase: "gaze_left",
    epoch: "pre_cue" as const,
  }));
  assert.equal(cueFeatures(preOnly, { gaze_left: "left" }).phaseCoverage, 0);
});

test("center-only social phase does not require a nonexistent pre-cue epoch", () => {
  const socialFace = Array.from({ length: 8 }, (_, index) => ({
    t: index * 50,
    x: 0.5,
    y: 0.3,
    phase: "social_face",
    epoch: "post_cue" as const,
  }));
  const summary = cueFeatures(socialFace, { social_face: "center" });
  assert.equal(summary.adequatePhaseCount, 1);
  assert.equal(summary.phaseCoverage, 1);
});

test("OOD assessment reports coverage and offending feature", () => {
  const reference: OodReference = {
    schemaVersion: 1,
    featureSchemaHash: "test",
    rule: { robustZMax: 5, outsideQuantileIsFlag: true },
    features: { ink_frac: { median: 0.1, madScale: 0.02, lower: 0.02, upper: 0.2 } },
  };
  assert.equal(assessFeatureOod({ ink_frac: 0.11 }, reference).passed, true);
  const shifted = assessFeatureOod({ ink_frac: 0.5 }, reference);
  assert.equal(shifted.passed, false);
  assert.deepEqual(shifted.flaggedFeatures, ["ink_frac"]);
});
