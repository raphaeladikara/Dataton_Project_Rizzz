/**
 * Regressions for the defects the positive-control recordings exposed, none of
 * which showed up as an error at the time: the recordings looked clean, passed
 * every gate, and reported nothing.
 */
import assert from "node:assert/strict";
import test from "node:test";

import { applyCalibration, type Calibration } from "../src/capture/faceLandmarker";
import { processGazeSamples } from "../src/gaze/pipeline";
import { evaluateQuality } from "../src/quality/gate";
import { renewSessionIdentity, type SessionAuditLog } from "../src/audit/sessionLog";
import { geoprefLayout } from "../src/geopref/protocol";
import { inspectAuditLog } from "../src/replay/recording";
import { summarizeJointAttention } from "../src/inference/jointAttention";
import type { CueFeatureSummary } from "../src/gaze/aoi";

const linear: Calibration = { x: [0, 1, 0], y: [0, 0, 1], errorDeg: 0 };

test("calibration reports where gaze actually landed, including off the screen", () => {
  // Clamping here made the three guards downstream blind at once: calibration
  // error measured against an in-screen target, the off-screen rate, and the
  // pipeline's own bounds rejection.
  const above = applyCalibration(linear, { u: 0.5, v: -0.4 });
  assert.ok(above.y < 0, `expected a negative projection, got ${above.y}`);
  const right = applyCalibration(linear, { u: 1.35, v: 0.5 });
  assert.ok(right.x > 1, `expected a projection past the right edge, got ${right.x}`);
});

test("samples pinned to a screen edge are counted, not silently clamped away", () => {
  const samples = Array.from({ length: 40 }, (_, index) => ({
    t: index * 50,
    x: 0.5,
    // Half the run maps above the top of the screen.
    y: index < 20 ? -0.06 : 0.5,
    phase: "baseline",
  }));
  const { diagnostics } = processGazeSamples(samples);
  assert.equal(diagnostics.saturatedSamples, 20);
});

test("a session the calibration maps off screen is withheld rather than scored", () => {
  const base = {
    faceRate: 1,
    gazeDropout: 0.02,
    calibrationErrorDeg: 1.4,
    calibrationLimitDeg: 3,
    brightness: 0.5,
    sampleCount: 1500,
    coverage: 1,
    phaseCoverage: 1,
  };
  assert.equal(evaluateQuality({ ...base, gazeSaturationRate: 0.1 }).passed, true);
  const held = evaluateQuality({ ...base, gazeSaturationRate: 0.4 });
  assert.equal(held.passed, false);
  assert.match(held.reasons.join(" "), /tepi layar/);
});

test("a second recording gets its own identity, and its own counterbalancing with it", () => {
  const first = {
    schemaVersion: 3,
    sessionId: "11111111-1111-4111-8111-111111111111",
    createdAt: "2026-08-19T11:17:28.139Z",
    events: [],
  } as unknown as SessionAuditLog;
  const second = renewSessionIdentity(first);
  assert.notEqual(second.sessionId, first.sessionId);
  assert.notEqual(second.createdAt, first.createdAt);
  // Everything else about the consented session survives.
  assert.equal(second.schemaVersion, first.schemaVersion);
  // Over many recordings the panel side has to move. Keyed on an operator-typed
  // identity it did not: 24 recordings ran the same side and the same cue order.
  const sides = new Set(
    Array.from({ length: 40 }, () => geoprefLayout(renewSessionIdentity(first).sessionId).geometricSide),
  );
  assert.equal(sides.size, 2);
});

const PHASES = [
  "gaze_left", "gaze_right", "pointing_left", "pointing_right",
  "gaze_left_repeat", "gaze_right_repeat", "pointing_left_repeat", "pointing_right_repeat",
] as const;

function summary(build: (phase: string, index: number) => {
  probability: number;
  preCueProbability: number;
  faceAtCue: boolean;
}): CueFeatureSummary {
  const targetResponse: CueFeatureSummary["targetResponse"] = {};
  PHASES.forEach((phase, index) => {
    const trial = build(phase, index);
    targetResponse[phase] = {
      target: phase.includes("left") ? "left" : "right",
      probability: trial.probability,
      latencyMs: trial.probability > 0 ? 900 : null,
      preCueProbability: trial.preCueProbability,
      targetLift: trial.probability - trial.preCueProbability,
      faceAtCue: trial.faceAtCue,
    };
  });
  return {
    schemaVersion: 3,
    aoiVersion: "test",
    sampleCount: 800,
    expectedPhaseCount: 8,
    adequatePhaseCount: 8,
    phaseCoverage: 1,
    phaseSampleCount: {},
    occupancy: {},
    dwellShare: {},
    epochSampleCount: {},
    targetResponse,
    faceTargetTransitions: 0,
    targetFaceTransitions: 0,
  };
}

test("watching the model and then moving nowhere is a finding, not an absence", () => {
  // The deliberately-produced pattern: the participant attends the cue and
  // holds the centre. Every trial ties at lift = 0, so the sign test cannot
  // speak, and this used to come back NOT_DISTINGUISHABLE on all 12 sessions.
  const profile = summarizeJointAttention(
    summary(() => ({ probability: 0, preCueProbability: 0, faceAtCue: true })),
  );
  assert.equal(profile?.verdict, "DOES_NOT_FOLLOW");
  assert.equal(profile?.attendedAtCue, 8);
  assert.equal(profile?.trialsEnteringTarget, 0);
});

test("a floor without attendance stays indeterminate", () => {
  // Same flat trace, but nothing says the cue was ever seen — which is what a
  // vertical calibration offset looks like. Not following and never having
  // looked are different claims and only one of them is supported here.
  const profile = summarizeJointAttention(
    summary(() => ({ probability: 0, preCueProbability: 0, faceAtCue: false })),
  );
  assert.equal(profile?.verdict, "NOT_DISTINGUISHABLE");
});

test("following the cues still reads as following", () => {
  const profile = summarizeJointAttention(
    summary((_, index) => ({
      probability: index === 7 ? 0 : 0.6,
      preCueProbability: 0.05,
      faceAtCue: true,
    })),
  );
  assert.equal(profile?.verdict, "FOLLOWS_CUES");
});

test("a replayed recording is scored against the panel it was recorded with", () => {
  // Drawing a fresh key at replay time draws a fresh side, and the same
  // recording came back 81% geometric on one run and 19% on the next — the
  // complement, from scoring the other panel of the same clip.
  const base = {
    gaze: {
      processedPoints: Array.from({ length: 60 }, (_, index) => ({ t: index * 50, x: 0.5, y: 0.5 })),
      frames: Array.from({ length: 60 }, (_, index) => ({ t: index * 50, phase: "baseline", eyeOpen: 0.3 })),
    },
    quality: { faceRate: 1, gazeDropout: 0.02, brightness: 0.5 },
    profile: { childId: "GA-20260819-01" },
    sessionId: "11111111-1111-4111-8111-111111111111",
  };
  const legacy = inspectAuditLog(base, "sesi-biasa.json");
  assert.ok(legacy.ok);
  // Older logs never wrote the key down, so it comes from the field the
  // renderer read at the time — identity, uniform value and all.
  assert.equal(legacy.recording.counterbalanceKey, "GA-20260819-01");
  assert.equal(geoprefLayout(legacy.recording.counterbalanceKey).geometricSide, "right");

  const current = inspectAuditLog(
    { ...base, gaze: { ...base.gaze, counterbalance: { key: "KP-02" } } },
    "sesi-produksi.json",
  );
  assert.ok(current.ok);
  assert.equal(current.recording.counterbalanceKey, "KP-02");
  assert.equal(geoprefLayout(current.recording.counterbalanceKey).geometricSide, "left");
});

test("the legacy model's distribution guard does not withhold measurements it has no bearing on", () => {
  // The guard decides whether the Carette model's output may be read. It used
  // to reach the quality gate, which withheld the entire report — including
  // preferential looking and cue following, which are read off AOIs and owe
  // that feature space nothing. The first real recording registered for the
  // demo came back as a camera failure because of it.
  const withGuardFlags = evaluateQuality({
    faceRate: 1,
    gazeDropout: 0.02,
    calibrationErrorDeg: 0.8,
    calibrationLimitDeg: 3,
    brightness: 0.5,
    sampleCount: 1500,
    coverage: 1,
    phaseCoverage: 1,
    gazeSaturationRate: 0.01,
    oodMaxRobustZ: 13.9,
  });
  assert.equal(withGuardFlags.passed, true, "sesi kamera yang sah tidak boleh gagal karena model warisan");
});
