import assert from "node:assert/strict";
import test from "node:test";
import { GEOPREF_ASSETS, activeGeoprefAsset } from "../src/geopref/stimulusMeta";
import {
  GEOPREF_FRAME_AOI,
  GEOPREF_SOURCE_GEOMETRIC_SIDE,
  GEOPREF_VIDEO_ASPECT,
  GEOPREF_CONTENT_CROP,
  geoprefPanelDegrees,
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

test("gaze inside a panel is classified, gaze in the gap or margin is not", () => {
  // Crop coordinates: left panel 0 to 0.487, gap, right panel 0.508 to 1.
  assert.equal(classifyGeoprefAoi({ x: 0.25, y: 0.5 }, NATIVE_AOI), "left");
  assert.equal(classifyGeoprefAoi({ x: 0.75, y: 0.5 }, NATIVE_AOI), "right");
  // The gap between panels must not count for either side.
  assert.equal(classifyGeoprefAoi({ x: 0.4975, y: 0.5 }, NATIVE_AOI), "outside");
  // Once the surround is cropped away the panels reach the presentation edges,
  // so the only dead space left is the stage letterbox around the crop.
  const onSixteenNine = projectGeoprefAoi(16 / 9);
  assert.equal(classifyGeoprefAoi({ x: 0.25, y: 0.05 }, onSixteenNine), "outside");
  assert.equal(classifyGeoprefAoi({ x: 0.25, y: 0.5 }, onSixteenNine), "left");
});

test("letterboxing moves the AOIs with the rendered clip", () => {
  // The crop is 3.15:1, wider than any tablet stage, so a 16:9 stage fits it to
  // width and letterboxes vertically.
  const tabletish = projectGeoprefAoi(16 / 9);
  assert.ok(Math.abs(tabletish.left.x0 - NATIVE_AOI.left.x0) < 1e-9, "width is unchanged when letterboxed");
  assert.ok(tabletish.left.y0 > NATIVE_AOI.left.y0);
  assert.ok(tabletish.left.y1 < NATIVE_AOI.left.y1);
  // A stage wider than the crop pillarboxes instead, pushing panels inward.
  const veryWide = projectGeoprefAoi(4.0);
  assert.ok(veryWide.left.x0 > NATIVE_AOI.left.x0);
  assert.ok(veryWide.right.x1 < NATIVE_AOI.right.x1);
  assert.ok(Math.abs(veryWide.left.y0 - NATIVE_AOI.left.y0) < 1e-9, "height is unchanged when pillarboxed");
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

test("demonstration mode applies the held threshold but marks the outcome as such", () => {
  const points = Array.from({ length: 120 }, (_, index) => ({ t: index * 50, x: 0.66, y: 0.5 }));
  const layout = { geometricSide: "right" as const, socialSide: "left" as const, validatedProtocol: false };
  assert.equal(scoreGeopref(points, layout).outcome, "MEASURED_PROTOCOL_ABBREVIATED");
  assert.equal(scoreGeopref(points, { ...layout, demonstrationMode: true }).outcome, "GEOMETRIC_PREFERENCE_DEMONSTRATION");
});

test("demonstration mode still reports below-threshold looking as its own outcome", () => {
  const points = Array.from({ length: 120 }, (_, index) => ({ t: index * 50, x: 0.34, y: 0.5 }));
  const result = scoreGeopref(points, { geometricSide: "right", socialSide: "left", validatedProtocol: false, demonstrationMode: true });
  assert.equal(result.outcome, "NO_GEOMETRIC_PREFERENCE_DEMONSTRATION");
  assert.equal(result.rulesOutAsd, false);
});

test("demonstration mode changes nothing once the protocol is validated", () => {
  const points = Array.from({ length: 120 }, (_, index) => ({ t: index * 50, x: 0.66, y: 0.5 }));
  const layout = { geometricSide: "right" as const, socialSide: "left" as const, validatedProtocol: true };
  assert.deepEqual(scoreGeopref(points, { ...layout, demonstrationMode: true }), scoreGeopref(points, layout));
});

test("demonstration mode cannot rescue a session with too little looking", () => {
  const points = Array.from({ length: 120 }, (_, index) => ({ t: index * 50, x: 0.02, y: 0.02 }));
  const result = scoreGeopref(points, { geometricSide: "right", socialSide: "left", validatedProtocol: false, demonstrationMode: true });
  assert.equal(result.outcome, "WITHHELD_INSUFFICIENT_LOOKING");
});

test("the black surround is cropped away so the panels are the presentation", () => {
  // The asset is a supplementary illustration: the two panels occupy only
  // x 129-513, y 120-242 of a 640x360 frame and the rest is black. Rendering it
  // whole put the panels at little over half the published visual angle.
  assert.ok(Math.abs(GEOPREF_CONTENT_CROP.x0 - 129 / 640) < 1e-9);
  assert.ok(Math.abs(GEOPREF_CONTENT_CROP.x1 - 513 / 640) < 1e-9);
  assert.ok(Math.abs(GEOPREF_CONTENT_CROP.y0 - 120 / 360) < 1e-9);
  assert.ok(Math.abs(GEOPREF_CONTENT_CROP.y1 - 242 / 360) < 1e-9);
  // Aspect is now the crop's, not the source frame's.
  assert.ok(Math.abs(GEOPREF_VIDEO_ASPECT - 384 / 122) < 1e-9);
});

test("AOI boxes are expressed against the cropped presentation", () => {
  // Left panel starts at the crop edge; right panel ends at it.
  assert.ok(Math.abs(GEOPREF_FRAME_AOI.left.x0) < 1e-9);
  assert.ok(Math.abs(GEOPREF_FRAME_AOI.right.x1 - 1) < 1e-9);
  assert.ok(Math.abs(GEOPREF_FRAME_AOI.left.y0) < 1e-9);
  assert.ok(Math.abs(GEOPREF_FRAME_AOI.left.y1 - 1) < 1e-9);
  assert.ok(GEOPREF_FRAME_AOI.left.x1 < GEOPREF_FRAME_AOI.right.x0, "panels must not overlap");
  // Each panel is now roughly half the presentation width, not 29% of a frame
  // that was mostly black.
  const width = GEOPREF_FRAME_AOI.left.x1 - GEOPREF_FRAME_AOI.left.x0;
  assert.ok(width > 0.45 && width < 0.5, `panel width ${width}`);
});

test("panels subtend close to the published visual angle on a target tablet", () => {
  // Moore et al. 2018: each AOI subtended 12.9 deg horizontally and 9.1 deg
  // vertically at 60 cm. This is the claim that decides whether the stimulus is
  // presented at the size its threshold was derived on, so it is measured here
  // rather than asserted in a comment.
  const tabA8 = geoprefPanelDegrees({ stageWidthMm: 226, stageHeightMm: 141, viewingDistanceMm: 500 });
  assert.ok(Math.abs(tabA8.horizontal - 12.9) < 1.5, `horizontal ${tabA8.horizontal}`);
  assert.ok(Math.abs(tabA8.vertical - 9.1) < 1.5, `vertical ${tabA8.vertical}`);
  // Sitting further back shrinks it, and the helper has to show that.
  const further = geoprefPanelDegrees({ stageWidthMm: 226, stageHeightMm: 141, viewingDistanceMm: 700 });
  assert.ok(further.horizontal < tabA8.horizontal);
});
