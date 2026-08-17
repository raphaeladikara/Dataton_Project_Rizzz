import assert from "node:assert/strict";
import test from "node:test";
import { projectCoverPoint, projectCoverRect } from "../src/capture/videoProjection";

test("cover projection includes horizontal crop before mirroring camera landmarks", () => {
  const source = { width: 1280, height: 720 };
  const viewport = { width: 600, height: 800 };
  const point = projectCoverPoint({ x: 0.4, y: 0.5 }, source, viewport, true);
  assert.ok(Math.abs(point.x - 442.2222) < 0.001);
  assert.equal(point.y, 400);
  assert.notEqual(Math.round(point.x), 360, "naive normalized projection would pull the iris toward the center");
});

test("cover projection preserves a mirrored face rectangle after cropping", () => {
  const rect = projectCoverRect(
    { x: 0.25, y: 0.2, width: 0.5, height: 0.6 },
    { width: 1280, height: 720 },
    { width: 600, height: 800 },
  );
  assert.ok(Math.abs(rect.left + 55.5556) < 0.001);
  assert.ok(Math.abs(rect.width - 711.1111) < 0.001);
  assert.equal(rect.top, 160);
  assert.equal(rect.height, 480);
});

test("contain-like source ratio needs no crop and still mirrors", () => {
  const point = projectCoverPoint(
    { x: 0.2, y: 0.3 },
    { width: 640, height: 480 },
    { width: 800, height: 600 },
  );
  assert.equal(point.x, 640);
  assert.equal(point.y, 180);
});
