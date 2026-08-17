import assert from "node:assert/strict";
import test from "node:test";
import { GEOPREF_ASSETS, activeGeoprefAsset } from "../src/geopref/stimulusMeta";
import { GEOPREF_AOI, classifyGeoprefAoi, geoprefLayout } from "../src/geopref/protocol";
import { scoreGeopref, GEOPREF_THRESHOLD } from "../src/geopref/score";

test("abbreviated CC BY clip cannot license the published 69% threshold", () => {
  const asset = GEOPREF_ASSETS.ccbyExcerpt;
  assert.equal(asset.validatedProtocol, false);
  assert.equal(asset.durationSeconds, 16.75);
  assert.equal(asset.license, "CC BY 4.0");
});

test("full UCSD protocol asset licenses the published threshold", () => {
  assert.equal(GEOPREF_ASSETS.ucsdComplexSocial.validatedProtocol, true);
  assert.equal(GEOPREF_ASSETS.ucsdComplexSocial.durationSeconds, 90);
});

test("active asset defaults to the excerpt until the full protocol is present", () => {
  assert.equal(activeGeoprefAsset().id, "ccbyExcerpt");
});

test("geopref AOIs occupy left and right halves without overlapping", () => {
  assert.ok(GEOPREF_AOI.left.x1 <= GEOPREF_AOI.right.x0);
  assert.equal(classifyGeoprefAoi({ x: 0.2, y: 0.5 }), "left");
  assert.equal(classifyGeoprefAoi({ x: 0.8, y: 0.5 }), "right");
  assert.equal(classifyGeoprefAoi({ x: 0.5, y: 0.5 }), "outside");
  assert.equal(classifyGeoprefAoi({ x: 0.2, y: 0.02 }), "outside");
});

test("layout is deterministic and always assigns opposite sides", () => {
  const first = geoprefLayout("NG-0001");
  assert.deepEqual(first, geoprefLayout("NG-0001"));
  assert.notEqual(first.geometricSide, first.socialSide);
  // Verified against the reference hash: "NG-0001" -> 2581516181 (odd) -> right.
  assert.equal(first.geometricSide, "right");
  assert.equal(geoprefLayout("NG-0002").geometricSide, "left");
});

test("layout counterbalances across a run of session ids", () => {
  const ids = Array.from({ length: 40 }, (_, i) => `NG-${String(i).padStart(4, "0")}`);
  const left = ids.filter((id) => geoprefLayout(id).geometricSide === "left").length;
  assert.ok(left >= 15 && left <= 25, `expected a near-even split, got ${left}/40 left`);
});

const sample = (t: number, x: number) => ({ t, x, y: 0.5 });

test("percent geometric uses only samples inside either panel", () => {
  const points = [
    ...Array.from({ length: 60 }, (_, i) => sample(i * 50, 0.2)),
    ...Array.from({ length: 40 }, (_, i) => sample(3000 + i * 50, 0.8)),
    ...Array.from({ length: 50 }, (_, i) => sample(5000 + i * 50, 0.5)),
  ];
  const result = scoreGeopref(points, { geometricSide: "left", socialSide: "right", validatedProtocol: true });
  assert.equal(result.validSamples, 100);
  assert.ok(Math.abs(result.percentGeometric! - 0.6) < 0.01);
  assert.equal(result.aoiCoverage, 100 / 150);
});

test("threshold is the published 69% cutoff", () => {
  assert.equal(GEOPREF_THRESHOLD, 0.69);
});

test("a strong geometric preference is ruled in only under the validated protocol", () => {
  const points = Array.from({ length: 120 }, (_, i) => sample(i * 50, i < 100 ? 0.2 : 0.8));
  const validated = scoreGeopref(points, { geometricSide: "left", socialSide: "right", validatedProtocol: true });
  assert.equal(validated.outcome, "GEOMETRIC_PREFERENCE");
  const excerpt = scoreGeopref(points, { geometricSide: "left", socialSide: "right", validatedProtocol: false });
  assert.equal(excerpt.outcome, "MEASURED_PROTOCOL_ABBREVIATED");
  assert.equal(excerpt.percentGeometric, validated.percentGeometric);
});

test("insufficient AOI coverage withholds any outcome", () => {
  const points = Array.from({ length: 100 }, (_, i) => sample(i * 50, 0.5));
  const result = scoreGeopref(points, { geometricSide: "left", socialSide: "right", validatedProtocol: true });
  assert.equal(result.outcome, "WITHHELD_INSUFFICIENT_LOOKING");
  assert.equal(result.percentGeometric, null);
});

test("below-threshold looking is explicitly not a negative screen", () => {
  const points = Array.from({ length: 120 }, (_, i) => sample(i * 50, i < 40 ? 0.2 : 0.8));
  const result = scoreGeopref(points, { geometricSide: "left", socialSide: "right", validatedProtocol: true });
  assert.equal(result.outcome, "NO_GEOMETRIC_PREFERENCE");
  assert.equal(result.rulesOutAsd, false);
});

test("the side assignment actually flips which panel counts as geometric", () => {
  const points = Array.from({ length: 120 }, (_, i) => sample(i * 50, i < 100 ? 0.2 : 0.8));
  const leftGeometric = scoreGeopref(points, { geometricSide: "left", socialSide: "right", validatedProtocol: true });
  const rightGeometric = scoreGeopref(points, { geometricSide: "right", socialSide: "left", validatedProtocol: true });
  assert.ok(Math.abs(leftGeometric.percentGeometric! + rightGeometric.percentGeometric! - 1) < 1e-9);
});
