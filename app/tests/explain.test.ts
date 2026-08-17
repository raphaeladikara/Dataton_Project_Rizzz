import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { explainInference, percentileFromQuantiles, validateParticipantReference } from "../src/inference/explain";
import type { ModelExport } from "../src/domain/types";

test("participant percentile interpolates between anonymized quantiles", () => {
  assert.equal(percentileFromQuantiles(15, [0, 0.5, 1], [10, 20, 30]), 0.25);
  assert.equal(percentileFromQuantiles(5, [0, 0.5, 1], [10, 20, 30]), 0);
  assert.equal(percentileFromQuantiles(35, [0, 0.5, 1], [10, 20, 30]), 1);
});

test("shipped participant reference is anonymized and compatible", () => {
  const reference: unknown = JSON.parse(readFileSync(new URL("../public/models/participant_reference.json", import.meta.url), "utf8"));
  validateParticipantReference(reference);
  assert.equal("participantIds" in (reference as Record<string, unknown>), false);
});

test("explanation ranks absolute linear contributions without changing inference", () => {
  const model = {
    feature_order: ["ink_frac", "span_x"],
    scaler: { mean: [0, 0], scale: [1, 1] },
    classifier: { coef: [2, -1], intercept: 0 },
  } as unknown as ModelExport;
  const evidence = explainInference(model, { ink_frac: 2, span_x: 1 }, null, 2);
  assert.deepEqual(evidence.map((item) => item.feature), ["ink_frac", "span_x"]);
  assert.equal(evidence[0].direction, "raises_demo_score");
  assert.equal(evidence[1].direction, "lowers_demo_score");
});
