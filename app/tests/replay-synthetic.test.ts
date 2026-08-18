import assert from "node:assert/strict";
import test from "node:test";
import { SCENARIOS, syntheticSessionPoints } from "../src/replay/scenarios";
import { sessionStimulusPhases } from "../src/stimulus/protocol";
import { cueFeatures } from "../src/gaze/aoi";
import { scoredPhaseTargets } from "../src/stimulus/protocol";

const phases = sessionStimulusPhases("NG-DEMO-01");

test("synthetic replay samples densely enough for every scored phase to be adequate", () => {
  // The count used to be a hardcoded 180, tuned for 7 s trials. Shortening the
  // trials pushed the per-epoch counts under the contract in aoi.ts and the
  // demo started withholding for a reason that had nothing to do with the
  // child. It has to follow the protocol, not a constant.
  const points = syntheticSessionPoints(SCENARIOS[0], phases);
  const summary = cueFeatures(points, scoredPhaseTargets(phases));
  assert.equal(summary.expectedPhaseCount, 8);
  assert.equal(summary.adequatePhaseCount, 8, `phase coverage ${summary.phaseCoverage}`);
  for (const phase of phases.filter((item) => item.scored)) {
    const epochs = summary.epochSampleCount[phase.id];
    assert.ok(epochs.preCue >= 4, `${phase.id} pre-cue ${epochs.preCue}`);
    assert.ok(epochs.postCue >= 8, `${phase.id} post-cue ${epochs.postCue}`);
  }
});

test("synthetic points carry the phase and epoch the protocol says they fall in", () => {
  const points = syntheticSessionPoints(SCENARIOS[0], phases);
  assert.ok(points.length >= 100);
  assert.equal(points.every((point) => typeof point.phase === "string"), true);
  assert.equal(points.every((point) => point.epoch === "pre_cue" || point.epoch === "post_cue"), true);
  // Timestamps must span the real battery, not an arbitrary 180-step clock.
  const durationMs = phases.reduce((sum, phase) => sum + phase.durationMs, 0);
  assert.ok(points.at(-1)!.t <= durationMs);
  assert.ok(points.at(-1)!.t > durationMs * 0.9);
});
