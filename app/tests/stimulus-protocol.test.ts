import assert from "node:assert/strict";
import test from "node:test";
import { GEOPREF_PHASE_ID, NAME_CALL_OFFSETS_MS, NAME_CALL_PHASE_ID, phaseAtElapsed, scoredPhaseTargets, STIMULUS_PHASES, STIMULUS_VERSION } from "../src/stimulus/protocol";

test("research stimulus keeps one visual language across paired directional cues", () => {
  assert.match(STIMULUS_VERSION, /joint-cues-geopref-name-v4/);
  // 96 s: the eight scored micro-trials plus the preferential-looking and
  // name-call blocks. Still well under the ~10 min battery used by the closest
  // tablet precedent (Perochon et al. 2023).
  assert.equal(STIMULUS_PHASES.reduce((sum, phase) => sum + phase.durationMs, 0), 96_000);
  assert.equal(STIMULUS_PHASES.length, 12);
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

test("geopref phase exists, is scored separately, and is long enough", () => {
  const phase = STIMULUS_PHASES.find((item) => item.id === GEOPREF_PHASE_ID);
  assert.ok(phase);
  assert.equal(phase!.target, "none");
  assert.ok(phase!.durationMs >= 16_750);
});

test("name-call phase carries three calls that all fit inside it", () => {
  const phase = STIMULUS_PHASES.find((item) => item.id === NAME_CALL_PHASE_ID);
  assert.ok(phase);
  assert.equal(NAME_CALL_OFFSETS_MS.length, 3);
  // Every call needs its full 2 s response window before the phase ends.
  assert.ok(Math.max(...NAME_CALL_OFFSETS_MS) + 2000 <= phase!.durationMs);
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
