import assert from "node:assert/strict";
import test from "node:test";
import { phaseAtElapsed, scoredPhaseTargets, STIMULUS_PHASES, STIMULUS_VERSION } from "../src/stimulus/protocol";

test("research stimulus keeps one visual language across paired directional cues", () => {
  assert.match(STIMULUS_VERSION, /joint-cues-vector-v3/);
  // Toddler tolerance caps the battery at roughly a minute while all eight
  // scored micro-trials are kept for per-child reliability.
  assert.equal(STIMULUS_PHASES.reduce((sum, phase) => sum + phase.durationMs, 0), 66_000);
  assert.equal(STIMULUS_PHASES.length, 10);
  assert.equal(STIMULUS_PHASES.filter((phase) => phase.scored).length, 8);
  assert.equal(STIMULUS_PHASES.some((phase) => String(phase.visualCue).includes("video")), false);
  for (const id of ["gaze_left", "gaze_right", "pointing_left", "pointing_right"]) {
    const phase = STIMULUS_PHASES.find((candidate) => candidate.id === id)!;
    assert.ok(phase.cueOnsetMs >= 900);
    assert.ok(phase.durationMs - phase.cueOnsetMs >= 3000);
    // The ostensive signal must land inside the pre-cue epoch so eye contact
    // is established before any directional information appears.
    assert.ok(phase.ostensiveOnsetMs > 0);
    assert.ok(phase.ostensiveOnsetMs < phase.cueOnsetMs);
  }
  assert.deepEqual(scoredPhaseTargets(), {
    gaze_left: "left",
    gaze_right: "right",
    pointing_left: "left",
    pointing_right: "right",
    gaze_left_repeat: "left",
    gaze_right_repeat: "right",
    pointing_left_repeat: "left",
    pointing_right_repeat: "right",
  });
});

test("phase clock changes epoch exactly at the declared cue onset", () => {
  const gazeLeft = STIMULUS_PHASES.find((phase) => phase.id === "gaze_left")!;
  const gazeLeftStart = STIMULUS_PHASES.slice(0, STIMULUS_PHASES.indexOf(gazeLeft)).reduce((sum, phase) => sum + phase.durationMs, 0);
  assert.equal(phaseAtElapsed(gazeLeftStart + gazeLeft.cueOnsetMs - 1)?.cueActive, false);
  assert.equal(phaseAtElapsed(gazeLeftStart + gazeLeft.cueOnsetMs)?.cueActive, true);
  assert.equal(phaseAtElapsed(gazeLeftStart + gazeLeft.ostensiveOnsetMs - 1)?.ostensiveActive, false);
  assert.equal(phaseAtElapsed(gazeLeftStart + gazeLeft.ostensiveOnsetMs)?.ostensiveActive, true);
  assert.equal(phaseAtElapsed(gazeLeftStart + gazeLeft.ostensiveOnsetMs)?.cueActive, false);
});
