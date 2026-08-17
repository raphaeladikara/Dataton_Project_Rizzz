import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import type { ModelExport, Point } from "../src/domain/types";
import { infer, validateModel } from "../src/inference/model";
import { evaluateQuality } from "../src/quality/gate";
import { geometryFeatures } from "../src/scanpath/features";

const root = new URL("../", import.meta.url);

test("Python and TypeScript feature/model parity", async () => {
  const [fixture, model] = await Promise.all([
    readFile(new URL("tests/fixtures/parity.json", root), "utf8").then(JSON.parse),
    readFile(new URL("public/models/model.json", root), "utf8").then(JSON.parse),
  ]) as [{ points: Point[]; features: Record<string, number>; probability: number }, ModelExport];
  const actual = geometryFeatures(fixture.points);
  validateModel(model);
  for (const [name, expected] of Object.entries(fixture.features)) {
    assert.ok(Math.abs(actual[name] - expected) < 1e-12, `${name}: ${actual[name]} != ${expected}`);
  }
  assert.ok(Math.abs(infer(model, actual) - fixture.probability) < 1e-12);
});

test("quality gate abstains instead of returning a normal result", () => {
  const quality = evaluateQuality({
    faceRate: 0.54,
    gazeDropout: 0.31,
    calibrationErrorDeg: 4.2,
    brightness: 0.36,
    sampleCount: 180,
  });
  assert.equal(quality.passed, false);
  assert.ok(quality.reasons.some((reason) => reason.includes("ambang 85%")));
});

test("quality gate rejects sessions with too few gaze samples", () => {
  const quality = evaluateQuality({
    faceRate: 0.95,
    gazeDropout: 0.05,
    calibrationErrorDeg: 2.1,
    brightness: 0.5,
    sampleCount: 70,
  });
  assert.equal(quality.passed, false);
  assert.ok(quality.reasons.some((reason) => reason.includes("minimal 100")));
});

test("model validation rejects incompatible exports", () => {
  assert.throws(
    () => validateModel({ schema_version: 1, feature_set: "geometri", feature_order: [] }),
    /tidak lengkap|tidak kompatibel/,
  );
});
