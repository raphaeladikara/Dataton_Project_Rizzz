import assert from "node:assert/strict";
import test from "node:test";
import type { CueFeatureSummary } from "../src/gaze/aoi";
import { summarizeSessionObservations } from "../src/inference/sessionObservations";

test("session observations aggregate the actual directional phases instead of a missing social_face key", () => {
  const summary = {
    phaseSampleCount: { gaze_left: 10, gaze_right: 10, pointing_left: 20, pointing_right: 20 },
    dwellShare: {
      gaze_left: { face: .8 }, gaze_right: { face: .6 }, pointing_left: { face: .2 }, pointing_right: { face: 0 },
    },
    targetResponse: {
      gaze_left: { probability: .2 }, gaze_right: { probability: .4 }, pointing_left: { probability: .5 }, pointing_right: { probability: .7 },
    },
    faceTargetTransitions: 3,
    targetFaceTransitions: 2,
  } as unknown as CueFeatureSummary;
  const result = summarizeSessionObservations(summary)!;
  assert.equal(result.directionalPhaseCount, 4);
  assert.ok(Math.abs(result.faceDwellPercent - 30) < 1e-9);
  assert.ok(Math.abs(result.targetDwellPercent - 50) < 1e-9);
  assert.equal(result.faceTargetTransitions, 3);
});
