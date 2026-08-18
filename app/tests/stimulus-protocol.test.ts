import assert from "node:assert/strict";
import test from "node:test";
import {
  GEOPREF_PHASE_ID,
  NAME_CALL_OFFSETS_MS,
  NAME_CALL_PHASE_ID,
  phaseAtElapsed,
  scoredPhaseTargets,
  sessionStimulusPhases,
  STIMULUS_PHASES,
  STIMULUS_TOTAL_MS,
  STIMULUS_VERSION,
} from "../src/stimulus/protocol";
import { GEOPREF_ASSETS } from "../src/geopref/stimulusMeta";

const DIRECTIONAL = (phases: readonly { target: string }[]) =>
  phases.filter((phase) => phase.target === "left" || phase.target === "right");

const SAMPLE_IDS = Array.from({ length: 200 }, (_, index) => `NG-${1000 + index}`);

test("research stimulus keeps one visual language across paired directional cues", () => {
  assert.match(STIMULUS_VERSION, /geopref-first-joint-cues-name-v5/);
  // 5 s baseline + 16.75 s preferential looking + 8 x 5 s cue trials +
  // 13 s name calls + 5 s ending. Still far under the ~10 min battery used by
  // the closest tablet precedent (Perochon et al. 2023).
  assert.equal(STIMULUS_TOTAL_MS, 79_750);
  assert.equal(STIMULUS_PHASES.length, 12);
  assert.equal(STIMULUS_PHASES.filter((phase) => phase.scored).length, 8);
  assert.equal(STIMULUS_PHASES.some((phase) => String(phase.visualCue).includes("video")), false);
  for (const id of ["gaze_left", "gaze_right", "pointing_left", "pointing_right"]) {
    const phase = STIMULUS_PHASES.find((candidate) => candidate.id === id)!;
    assert.equal(phase.durationMs, 5000);
    assert.ok(phase.cueOnsetMs >= 900);
    // Responding-joint-attention latencies sit well under 2 s, so a 3.3 s
    // response window is generous rather than tight.
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

test("preferential looking runs before the cue block, while attention is freshest", () => {
  const geoprefIndex = STIMULUS_PHASES.findIndex((phase) => phase.id === GEOPREF_PHASE_ID);
  const firstCueIndex = STIMULUS_PHASES.findIndex((phase) => phase.scored);
  assert.ok(geoprefIndex >= 0);
  assert.ok(firstCueIndex >= 0);
  // GeoPref carries the only externally published threshold in the system.
  // Running it after 60 s of intense social engagement both fatigues the child
  // and primes social attention, which biases geometric preference downward.
  assert.ok(geoprefIndex < firstCueIndex);
  assert.equal(STIMULUS_PHASES[0].id, "baseline");
  assert.equal(STIMULUS_PHASES[1].id, GEOPREF_PHASE_ID);
});

test("geopref phase is exactly as long as the clip it plays", () => {
  const phase = STIMULUS_PHASES.find((item) => item.id === GEOPREF_PHASE_ID);
  assert.ok(phase);
  assert.equal(phase!.target, "none");
  // A phase longer than the asset makes the video loop, and the replayed
  // opening frames land in the dwell score.
  assert.equal(phase!.durationMs, GEOPREF_ASSETS.ccbyExcerpt.durationSeconds * 1000);
});

test("name-call phase carries three calls that all fit inside it", () => {
  const phase = STIMULUS_PHASES.find((item) => item.id === NAME_CALL_PHASE_ID);
  assert.ok(phase);
  assert.equal(NAME_CALL_OFFSETS_MS.length, 3);
  // Every call needs its full 2 s response window before the phase ends.
  assert.ok(Math.max(...NAME_CALL_OFFSETS_MS) + 2000 <= phase!.durationMs);
});

test("session cue order keeps the same eight trials and stays left/right balanced", () => {
  for (const sessionId of SAMPLE_IDS) {
    const phases = sessionStimulusPhases(sessionId);
    assert.equal(phases.length, STIMULUS_PHASES.length);
    assert.deepEqual(
      [...phases].map((phase) => phase.id).sort(),
      [...STIMULUS_PHASES].map((phase) => phase.id).sort(),
    );
    const sides = DIRECTIONAL(phases).map((phase) => phase.target);
    assert.equal(sides.length, 8);
    assert.equal(sides.filter((side) => side === "left").length, 4);
    assert.equal(sides.filter((side) => side === "right").length, 4);
  }
});

test("no session ever runs three cues to the same side in a row", () => {
  for (const sessionId of SAMPLE_IDS) {
    const sides = DIRECTIONAL(sessionStimulusPhases(sessionId)).map((phase) => phase.target);
    for (let index = 2; index < sides.length; index += 1) {
      assert.notEqual(
        `${sides[index - 2]}${sides[index - 1]}${sides[index]}`,
        `${sides[index]}${sides[index]}${sides[index]}`,
        `three ${sides[index]} cues in a row for ${sessionId}`,
      );
    }
  }
});

test("cue order is counterbalanced rather than strictly alternating", () => {
  // The shipped order was left, right, left, right, ... every session. A child
  // who simply scans side to side scores as following every cue, and the sign
  // test cannot tell that apart from real cue following, because the cue
  // sequence itself alternates. Counterbalancing is what breaks the tie.
  const alternating = SAMPLE_IDS.filter((sessionId) => {
    const sides = DIRECTIONAL(sessionStimulusPhases(sessionId)).map((phase) => phase.target);
    return sides.every((side, index) => index === 0 || side !== sides[index - 1]);
  });
  assert.ok(
    alternating.length < SAMPLE_IDS.length / 4,
    `${alternating.length}/${SAMPLE_IDS.length} sessions still strictly alternate`,
  );
});

test("cue order is deterministic per session and differs across sessions", () => {
  const order = (sessionId: string) => sessionStimulusPhases(sessionId).map((phase) => phase.id).join(",");
  assert.equal(order("NG-0042"), order("NG-0042"));
  const distinct = new Set(SAMPLE_IDS.map(order));
  // Operators must not be able to pick the order, and two children must not
  // reliably get the same one.
  assert.ok(distinct.size > 20, `only ${distinct.size} distinct orders across ${SAMPLE_IDS.length} sessions`);
});

test("session ordering leaves total duration and phase boundaries intact", () => {
  for (const sessionId of ["NG-0001", "NG-0042", ""]) {
    const phases = sessionStimulusPhases(sessionId);
    assert.equal(phases.reduce((sum, phase) => sum + phase.durationMs, 0), STIMULUS_TOTAL_MS);
    assert.equal(phases[0].id, "baseline");
    assert.equal(phases[1].id, GEOPREF_PHASE_ID);
    assert.equal(phases.at(-1)!.id, "positive_ending");
    assert.equal(phases.at(-2)!.id, NAME_CALL_PHASE_ID);
  }
});

test("phase clock changes epoch exactly at the declared cue onset", () => {
  const phases = sessionStimulusPhases("NG-0042");
  const gazeLeft = phases.find((phase) => phase.id === "gaze_left")!;
  const gazeLeftStart = phases.slice(0, phases.indexOf(gazeLeft)).reduce((sum, phase) => sum + phase.durationMs, 0);
  const at = (offset: number) => phaseAtElapsed(gazeLeftStart + offset, phases);
  assert.equal(at(gazeLeft.cueOnsetMs - 1)?.cueActive, false);
  assert.equal(at(gazeLeft.cueOnsetMs)?.cueActive, true);
  assert.equal(at(gazeLeft.ostensiveOnsetMs - 1)?.ostensiveActive, false);
  assert.equal(at(gazeLeft.ostensiveOnsetMs)?.ostensiveActive, true);
  assert.equal(at(gazeLeft.ostensiveOnsetMs)?.cueActive, false);
  assert.equal(at(0)?.phase.id, "gaze_left");
});
