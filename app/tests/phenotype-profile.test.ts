import assert from "node:assert/strict";
import test from "node:test";
import { buildPhenotypeProfile, PHENOTYPE_SCHEMA_VERSION } from "../src/phenotype/profile";
import type { FrameSample } from "../src/capture/frameTrace";

const frames: FrameSample[] = Array.from({ length: 300 }, (_, i) => ({
  t: i * 33, phase: i < 150 ? "social" : "nonsocial", faceDetected: true, accepted: true,
  reason: "ok" as const, eyeOpen: i % 50 < 3 ? 0.01 : 0.09,
  yaw: Math.sin(i * 0.3) * 0.15, pitch: 0, rollDeg: 0,
}));

test("profile carries every index and no combined score", () => {
  const profile = buildPhenotypeProfile({ frames, nameCalls: [], socialPhases: ["social"], nonsocialPhases: ["nonsocial"] });
  assert.equal(profile.schemaVersion, PHENOTYPE_SCHEMA_VERSION);
  assert.ok(profile.facingForward.proportion !== null);
  assert.ok(profile.headMovement.rangePerSecond !== null);
  assert.ok(profile.blinkSocial.blinkCount >= 0);
  assert.equal(profile.combinedScore, null);
  assert.equal(profile.combinationRuleStatus, "not_fitted_requires_gate_c");
});

test("blink rate is reported separately for social and nonsocial contexts", () => {
  const profile = buildPhenotypeProfile({ frames, nameCalls: [], socialPhases: ["social"], nonsocialPhases: ["nonsocial"] });
  assert.notEqual(profile.blinkSocial.durationMs, 0);
  assert.notEqual(profile.blinkNonsocial.durationMs, 0);
});

test("every index cites the precedent AUC so the report can show provenance", () => {
  const profile = buildPhenotypeProfile({ frames, nameCalls: [], socialPhases: ["social"], nonsocialPhases: ["nonsocial"] });
  assert.equal(profile.provenance.headMovement.precedentAuc, 0.864);
  assert.equal(profile.provenance.facingForward.precedentAuc, 0.838);
  assert.ok(profile.provenance.headMovement.source.includes("Perochon"));
});

test("an empty trace still returns a well-formed profile with null indices", () => {
  const profile = buildPhenotypeProfile({ frames: [], nameCalls: [], socialPhases: ["social"], nonsocialPhases: ["nonsocial"] });
  assert.equal(profile.facingForward.proportion, null);
  assert.equal(profile.headMovement.rangePerSecond, null);
  assert.equal(profile.combinedScore, null);
});
