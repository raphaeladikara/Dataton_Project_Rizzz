import assert from "node:assert/strict";
import test from "node:test";
import { signTestPValue, summarizeJointAttention } from "../src/inference/jointAttention";
import type { CueFeatureSummary } from "../src/gaze/aoi";

function summaryWithLifts(lifts: (number | null)[]): CueFeatureSummary {
  const ids = ["gaze_left", "gaze_right", "pointing_left", "pointing_right",
    "gaze_left_repeat", "gaze_right_repeat", "pointing_left_repeat", "pointing_right_repeat"];
  const targetResponse: CueFeatureSummary["targetResponse"] = {};
  const phaseSampleCount: Record<string, number> = {};
  ids.forEach((id, index) => {
    phaseSampleCount[id] = 40;
    targetResponse[id] = {
      target: id.includes("left") ? "left" : "right",
      probability: 0.5,
      latencyMs: 600 + index * 20,
      preCueProbability: 0.5 - (lifts[index] ?? 0),
      targetLift: lifts[index],
      faceAtCue: true,
    };
  });
  return {
    schemaVersion: 3, aoiVersion: "test", sampleCount: 320, expectedPhaseCount: 8,
    adequatePhaseCount: 8, phaseCoverage: 1, phaseSampleCount, occupancy: {},
    dwellShare: {}, epochSampleCount: {}, targetResponse,
    faceTargetTransitions: 12, targetFaceTransitions: 9,
  } as unknown as CueFeatureSummary;
}

test("exact sign test matches the binomial tail", () => {
  assert.ok(Math.abs(signTestPValue(8, 8) - 1 / 256) < 1e-12);
  assert.ok(Math.abs(signTestPValue(7, 8) - 9 / 256) < 1e-12);
  assert.equal(signTestPValue(4, 8) > 0.05, true);
});

test("a child who follows most cues yields a reliable-following verdict", () => {
  const profile = summarizeJointAttention(summaryWithLifts([0.3, 0.25, 0.4, 0.2, 0.3, 0.1, 0.35, -0.05]));
  assert.equal(profile!.trialsScored, 8);
  assert.equal(profile!.trialsFollowed, 7);
  assert.equal(profile!.verdict, "FOLLOWS_CUES");
  assert.ok(profile!.pValue! < 0.05);
  assert.equal(profile!.medianLatencyMs, 670);
});

test("chance-level cue following is inconclusive, not a deficit", () => {
  const profile = summarizeJointAttention(summaryWithLifts([0.2, -0.1, 0.15, -0.2, 0.05, -0.3, 0.1, -0.05]));
  assert.equal(profile!.verdict, "NOT_DISTINGUISHABLE");
  assert.ok(profile!.pValue! > 0.05);
});

test("too few scorable trials withholds the profile", () => {
  const profile = summarizeJointAttention(summaryWithLifts([0.3, null, null, null, null, null, null, null]));
  assert.equal(profile!.verdict, "WITHHELD_TOO_FEW_TRIALS");
  assert.equal(profile!.pValue, null);
});

test("a null summary yields a null profile rather than throwing", () => {
  assert.equal(summarizeJointAttention(null), null);
});
