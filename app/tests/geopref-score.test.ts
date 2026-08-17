import assert from "node:assert/strict";
import test from "node:test";
import { GEOPREF_ASSETS, activeGeoprefAsset } from "../src/geopref/stimulusMeta";
import {
  GEOPREF_FRAME_AOI,
  GEOPREF_SOURCE_GEOMETRIC_SIDE,
  GEOPREF_VIDEO_ASPECT,
  classifyGeoprefAoi,
  geoprefLayout,
  geoprefNeedsMirror,
  projectGeoprefAoi,
} from "../src/geopref/protocol";
import { scoreGeopref, GEOPREF_THRESHOLD } from "../src/geopref/score";

const NATIVE_AOI = projectGeoprefAoi(GEOPREF_VIDEO_ASPECT);

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

test("AOI boxes match the panel bounds measured from the shipped clip", () => {
  // x 129-316 and 324-513, y 120-242 on a 640x360 frame, stable at every
  // timestamp sampled from the asset.
  assert.ok(Math.abs(GEOPREF_FRAME_AOI.left.x0 - 129 / 640) < 1e-9);
  assert.ok(Math.abs(GEOPREF_FRAME_AOI.right.x1 - 513 / 640) < 1e-9);
  assert.ok(GEOPREF_FRAME_AOI.left.x1 < GEOPREF_FRAME_AOI.right.x0, "panels must not overlap");
  // Each panel is ~29% of the frame width, not a whole screen half.
  const width = GEOPREF_FRAME_AOI.left.x1 - GEOPREF_FRAME_AOI.left.x0;
  assert.ok(width > 0.25 && width < 0.33, `panel width ${width}`);
});

test("gaze inside a panel is classified, gaze in the gap or margin is not", () => {
  assert.equal(classifyGeoprefAoi({ x: 0.35, y: 0.5 }, NATIVE_AOI), "left");
  assert.equal(classifyGeoprefAoi({ x: 0.65, y: 0.5 }, NATIVE_AOI), "right");
  // The gap between panels must not count for either side.
  assert.equal(classifyGeoprefAoi({ x: 0.5, y: 0.5 }, NATIVE_AOI), "outside");
  // Black margin above the panels is not a look at anything.
  assert.equal(classifyGeoprefAoi({ x: 0.35, y: 0.05 }, NATIVE_AOI), "outside");
  assert.equal(classifyGeoprefAoi({ x: 0.1, y: 0.5 }, NATIVE_AOI), "outside");
});

test("letterboxing moves the AOIs with the rendered clip", () => {
  const wide = projectGeoprefAoi(2.4);
  const tall = projectGeoprefAoi(1.0);
  // A wider stage pillarboxes the clip, pushing both panels inward.
  assert.ok(wide.left.x0 > NATIVE_AOI.left.x0);
  assert.ok(wide.right.x1 < NATIVE_AOI.right.x1);
  assert.ok(Math.abs(wide.left.y0 - NATIVE_AOI.left.y0) < 1e-9, "height is unchanged when pillarboxed");
  // A taller stage letterboxes it, pushing the panels down from the top.
  assert.ok(tall.left.y0 > NATIVE_AOI.left.y0);
  assert.ok(Math.abs(tall.left.x0 - NATIVE_AOI.left.x0) < 1e-9, "width is unchanged when letterboxed");
});

test("mirroring is required exactly when the wanted side differs from the source", () => {
  assert.equal(GEOPREF_SOURCE_GEOMETRIC_SIDE, "right");
  assert.equal(geoprefNeedsMirror("right"), false);
  assert.equal(geoprefNeedsMirror("left"), true);
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

// 0.35 lands in the left panel, 0.65 in the right, 0.5 in the gap.
const sample = (t: number, x: number) => ({ t, x, y: 0.5 });

test("percent geometric uses only samples inside either panel", () => {
  const points = [
    ...Array.from({ length: 60 }, (_, i) => sample(i * 50, 0.35)),
    ...Array.from({ length: 40 }, (_, i) => sample(3000 + i * 50, 0.65)),
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
  const points = Array.from({ length: 120 }, (_, i) => sample(i * 50, i < 100 ? 0.35 : 0.65));
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
  const points = Array.from({ length: 120 }, (_, i) => sample(i * 50, i < 40 ? 0.35 : 0.65));
  const result = scoreGeopref(points, { geometricSide: "left", socialSide: "right", validatedProtocol: true });
  assert.equal(result.outcome, "NO_GEOMETRIC_PREFERENCE");
  assert.equal(result.rulesOutAsd, false);
});

test("the side assignment actually flips which panel counts as geometric", () => {
  const points = Array.from({ length: 120 }, (_, i) => sample(i * 50, i < 100 ? 0.35 : 0.65));
  const leftGeometric = scoreGeopref(points, { geometricSide: "left", socialSide: "right", validatedProtocol: true });
  const rightGeometric = scoreGeopref(points, { geometricSide: "right", socialSide: "left", validatedProtocol: true });
  assert.ok(Math.abs(leftGeometric.percentGeometric! + rightGeometric.percentGeometric! - 1) < 1e-9);
});
