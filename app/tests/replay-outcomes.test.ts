import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import type { ModelExport } from "../src/domain/types";
import { infer } from "../src/inference/model";
import { evaluateQuality } from "../src/quality/gate";
import { assessFeatureOod, type OodReference } from "../src/quality/ood";
import { SCENARIOS, replayPoints } from "../src/replay/scenarios";
import { geometryFeatures } from "../src/scanpath/features";

const model = JSON.parse(
  readFileSync(new URL("../public/models/model.json", import.meta.url), "utf8"),
) as ModelExport;
const oodReference = JSON.parse(
  readFileSync(new URL("../public/models/ood_reference.json", import.meta.url), "utf8"),
) as OodReference;

test("replay fixtures deterministically cover refer, monitor, and withheld outcomes", () => {
  const outcomes = Object.fromEntries(
    SCENARIOS.map((scenario) => {
      const points = replayPoints(scenario, 180);
      const features = geometryFeatures(points);
      const ood = assessFeatureOod(features, oodReference);
      const quality = evaluateQuality({
        faceRate: scenario.faceRate,
        gazeDropout: scenario.gazeDropout,
        calibrationErrorDeg: scenario.calibrationErrorDeg,
        brightness: scenario.brightness,
        sampleCount: points.length,
        coverage: ood.coverage,
        oodMaxRobustZ: ood.maxRobustZ,
        oodFlaggedFeatures: ood.flaggedFeatures,
      });
      const risk = quality.passed ? infer(model, features) : null;
      const outcome = !quality.passed || risk === null
        ? "withheld"
        : risk >= model.decision.refer_if_probability_gte
          ? "refer"
          : "monitor";
      return [scenario.id, outcome];
    }),
  );

  assert.deepEqual(outcomes, {
    refer: "refer",
    monitor: "monitor",
    withheld: "withheld",
  });
});

test("quality gate withholds an otherwise valid session when a stimulus phase is missing", () => {
  const quality = evaluateQuality({
    faceRate: 0.95,
    gazeDropout: 0.05,
    calibrationErrorDeg: 2,
    brightness: 0.5,
    sampleCount: 180,
    coverage: 1,
    phaseCoverage: 0.875,
  });
  assert.equal(quality.passed, false);
  assert.match(quality.reasons.join(" "), /Cakupan fase stimulus 88%/);
});

test("adult Gate A applies its pre-specified 3 degree calibration limit", () => {
  const quality = evaluateQuality({
    faceRate: 1,
    gazeDropout: 0,
    calibrationErrorDeg: 3.09,
    calibrationLimitDeg: 3,
    brightness: 0.65,
    sampleCount: 318,
    coverage: 1,
    phaseCoverage: 1,
  });
  assert.equal(quality.passed, false);
  assert.match(quality.reasons.join(" "), /Galat kalibrasi 3.1°; batas 3°/);
});
