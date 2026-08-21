import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const evidence = JSON.parse(readFileSync(new URL("../public/validation/gate-b-public.json", import.meta.url), "utf8"));
const summary = JSON.parse(readFileSync(new URL("../../research/hasil/gate_b/gate_b_summary.json", import.meta.url), "utf8"));
const gateA = JSON.parse(readFileSync(new URL("../../research/hasil/gate_a/gate_a_summary.json", import.meta.url), "utf8"));
const page = readFileSync(new URL("../app/validation/page.tsx", import.meta.url), "utf8");

test("published Gate B snapshot matches the canonical WebGazer cohort", () => {
  assert.equal(evidence.schema, "neurogaze-gate-b-public-evidence-v3");
  assert.equal(evidence.status, "gate_b_passed");
  assert.equal(evidence.study.reference.library, "WebGazer.js");
  assert.equal(evidence.study.nPairsTotal, summary.nPairsTotal);
  assert.equal(evidence.study.nPairsReady, summary.nPairsReady);
  assert.equal(evidence.study.nPairsWithheld, summary.nPairsWithheld);
  assert.equal(evidence.agreement.medianPairErrorNorm, summary.medianOfPairMedianErrorNorm);
  assert.equal(evidence.agreement.meanAoiAgreement, summary.meanAoiAgreement);
  assert.equal(evidence.agreement.meanAoiAgreementRecomputed, summary.recomputation.meanAoiAgreementRecomputed);
  assert.deepEqual(evidence.thresholds, summary.acceptanceCriteria);
  assert.equal(evidence.terminology.diagnosticAccuracyAvailable, false);
  assert.equal(summary.decision, "PASSED");
});

test("the headline is the adult positive control and Gate A stays bounded", () => {
  assert.equal(evidence.headline.metric, "adult_positive_control");
  assert.equal(evidence.gateAAccuracy.valueDeg, gateA.knownTargetValidation.medianErrorDeg);
  assert.equal(evidence.gateAAccuracy.p90Deg, gateA.knownTargetValidation.p90ErrorDeg);
  assert.equal(evidence.gateAAccuracy.sessions, gateA.knownTargetValidation.sessions);
  // The old page led with mean AOI agreement. That number is geometrically
  // saturated, so it must never be the headline again.
  assert.doesNotMatch(page.split("</h1>")[0], /meanAoiAgreement/);
  assert.match(page, /positiveControl\.sessions\.recorded/);
});

test("public evidence carries complete positive-control and readiness denominators", () => {
  assert.deepEqual(evidence.positiveControl.sessions, { recorded: 23, qualityPass: 15 });
  assert.deepEqual(evidence.positiveControl.conditions.ordinary, { recorded: 11, usable: 9, ruleFired: 0 });
  assert.deepEqual(evidence.positiveControl.conditions.produced, { recorded: 12, usable: 6, ruleFired: 4 });
  assert.equal(evidence.positiveControl.emitsReferral, false);
  assert.deepEqual(evidence.positiveControl.signals.map((signal: { nearestGap: number }) => signal.nearestGap), [
    0.15989812775330392,
    4,
    0.008447514032818182,
  ]);
  assert.equal(evidence.readiness.schema, "neurogaze-readiness-matrix-v1");
  assert.equal(evidence.readiness.clinicalClaimsAvailable, false);
});

test("the saturated agreement figure ships with the reason it is saturated", () => {
  assert.match(evidence.agreement.saturationNote, /28%/);
  assert.match(evidence.agreement.saturationNote, /bukan bukti akurasi/);
  assert.equal(evidence.featureAgreement.primaryMetric, "bland_altman_limits_of_agreement");
  assert.match(evidence.featureAgreement.iccCaveat, /rasio varians/);
  assert.ok(evidence.featureAgreement.examples.length >= 3);
  for (const example of evidence.featureAgreement.examples) {
    assert.ok(example.blandAltmanUpper95 > example.blandAltmanLower95, example.feature);
    assert.equal(example.iccA1, summary.featureAgreement[example.feature].iccA1);
  }
});

test("the comparator and the toddler reference are attributed", () => {
  assert.match(evidence.comparator.source, /Papoutsaki/);
  assert.match(evidence.comparator.note, /bukan hasil uji tanding/);
  assert.match(evidence.toddlerReference.source, /Steffan/);
  assert.equal(evidence.toddlerReference.attritionRate, 0.42);
});

test("published Gate B snapshot names its source and evidence boundary", () => {
  assert.equal(evidence.source.summary, "research/hasil/gate_b/gate_b_summary.json");
  assert.equal(evidence.source.gateASummary, "research/hasil/gate_a/gate_a_summary.json");
  assert.equal(evidence.source.manifest, "research/hasil/evidence_manifest.json");
  assert.equal(evidence.source.generator, "research/export_public_evidence.py");
  assert.match(evidence.conclusion, /Gate B/i);
  assert.match(evidence.limitations.join(" "), /bukan .*akurasi diagnosis ASD/i);
  assert.match(evidence.limitations.join(" "), /dewasa/i);
});
