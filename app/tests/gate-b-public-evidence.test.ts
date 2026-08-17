import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const evidence = JSON.parse(readFileSync(new URL("../public/validation/gate-b-public.json", import.meta.url), "utf8"));
const summary = JSON.parse(readFileSync(new URL("../../research/hasil/gate_b/gate_b_summary.json", import.meta.url), "utf8"));

test("published Gate B snapshot matches the canonical WebGazer cohort", () => {
  assert.equal(evidence.schema, "neurogaze-gate-b-public-evidence-v2");
  assert.equal(evidence.status, "gate_b_passed");
  assert.equal(evidence.study.reference.library, "WebGazer.js");
  assert.equal(evidence.study.nPairsTotal, 30);
  assert.equal(evidence.study.nPairsReady, 27);
  assert.equal(evidence.study.nPairsWithheld, 3);
  assert.equal(evidence.metrics.medianPairErrorNorm, 0.040997);
  assert.equal(evidence.metrics.meanAoiAgreement, 0.997574);
  assert.equal(evidence.metrics.primaryAoiAgreementRate, 1);
  assert.equal(evidence.thresholds.maximumMedianErrorNorm, 0.05);
  assert.equal(evidence.terminology.diagnosticAccuracyAvailable, false);
  assert.equal(evidence.study.nPairsTotal, summary.nPairsTotal);
  assert.equal(evidence.study.nPairsReady, summary.nPairsReady);
  assert.equal(evidence.metrics.medianPairErrorNorm, summary.medianOfPairMedianErrorNorm);
  assert.equal(evidence.metrics.meanAoiAgreement, summary.meanAoiAgreement);
  assert.deepEqual(evidence.thresholds, summary.acceptanceCriteria);
  assert.equal(summary.decision, "PASSED");
});

test("published Gate B snapshot names its source and evidence boundary", () => {
  assert.equal(evidence.source.summary, "research/hasil/gate_b/gate_b_summary.json");
  assert.equal(evidence.source.manifest, "research/hasil/evidence_manifest.json");
  assert.match(evidence.conclusion, /WebGazer/i);
  assert.match(evidence.limitations.join(" "), /bukan .*akurasi diagnosis ASD/i);
});
