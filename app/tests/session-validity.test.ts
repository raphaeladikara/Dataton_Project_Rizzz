import assert from "node:assert/strict";
import test from "node:test";
import { evaluateSessionValidity, phaseAssessment, type SessionValidityInput } from "../src/quality/sessionValidity";

const phases = ["baseline", "social_face", "social_choice", "gaze_cue", "pointing", "nonsocial", "name_call_1", "name_call_2"]
  .map((id) => phaseAssessment(id, 12));

function valid(overrides: Partial<SessionValidityInput> = {}): SessionValidityInput {
  return {
    sessionComplete: true,
    cameraInterrupted: false,
    orientationChanged: false,
    calibrationPassed: true,
    featureContractMatches: true,
    timestampsSynchronized: true,
    faceRate: 0.96,
    gazeDropout: 0.04,
    poseRejectedRate: 0.02,
    offScreenRate: 0.08,
    gazeMovement: 0.32,
    rawIrisMovement: 0.08,
    stationaryJumpRate: 0.01,
    sanity: { completed: true, leftMedianX: 0.22, centerMedianX: 0.5, rightMedianX: 0.78, stable: true },
    phases,
    ...overrides,
  };
}

test("valid session is the only state allowed to score", () => {
  assert.equal(evaluateSessionValidity(valid()).canScore, true);
});

test("iris moves while screen gaze is frozen -> HELD", () => {
  const result = evaluateSessionValidity(valid({ rawIrisMovement: 0.08, gazeMovement: 0.002 }));
  assert.equal(result.primaryReasonCode, "GAZE_FROZEN");
  assert.equal(result.canScore, false);
});

test("left/right mirror mismatch is detected", () => {
  const result = evaluateSessionValidity(valid({ sanity: { completed: true, leftMedianX: 0.78, centerMedianX: 0.5, rightMedianX: 0.22, stable: true } }));
  assert.equal(result.primaryReasonCode, "DIRECTION_REVERSED");
});

test("center lock is detected", () => {
  const result = evaluateSessionValidity(valid({ sanity: { completed: true, leftMedianX: 0.48, centerMedianX: 0.5, rightMedianX: 0.52, stable: true } }));
  assert.equal(result.primaryReasonCode, "CENTER_LOCK");
});

test("random jumps while target is still are rejected", () => {
  assert.equal(evaluateSessionValidity(valid({ stationaryJumpRate: 0.3 })).primaryReasonCode, "GAZE_RANDOM_JUMPS");
});

test("camera interruption invalidates the session", () => {
  assert.equal(evaluateSessionValidity(valid({ cameraInterrupted: true })).primaryReasonCode, "CAMERA_STREAM_INTERRUPTED");
});

test("orientation change invalidates calibration", () => {
  assert.equal(evaluateSessionValidity(valid({ orientationChanged: true })).canScore, false);
});

test("too many invalid phases prevent scoring", () => {
  const broken = phases.map((phase, index) => index < 3 ? phase : { ...phase, status: "invalid" as const });
  assert.equal(evaluateSessionValidity(valid({ phases: broken })).primaryReasonCode, "INSUFFICIENT_VALID_PHASES");
});

test("one interrupted phase requests partial retry", () => {
  const partial = phases.map((phase, index) => index === 3 ? { ...phase, status: "invalid" as const } : phase);
  assert.equal(evaluateSessionValidity(valid({ phases: partial })).outcome, "RETRY_STAGE");
});

test("behavioral non-response with valid recording is not a technical error", () => {
  const result = evaluateSessionValidity(valid());
  assert.equal(result.primaryReasonCode, null);
  assert.equal(result.outcome, "VALID");
});

test("missing features are never filled with zero", () => {
  const result = evaluateSessionValidity(valid({ missingFeatures: ["span_x"] }));
  assert.equal(result.primaryReasonCode, "FEATURE_CONTRACT_MISMATCH");
  assert.deepEqual(result.debugEvidence.missingFeatures, ["span_x"]);
});

test("phase desynchronization blocks scoring", () => {
  assert.equal(evaluateSessionValidity(valid({ timestampsSynchronized: false })).primaryReasonCode, "PHASE_DESYNC");
});

test("held copy is plain-language and identifies non-result", () => {
  const result = evaluateSessionValidity(valid({ calibrationPassed: false }));
  assert.match(result.userMessage, /bukan hasil risiko anak/i);
  assert.doesNotMatch(result.userMessage, /RMSE|degree|derajat/i);
});

/**
 * A session with no scoring model has no feature contract to violate. Holding it
 * as a system fault reports "Terjadi masalah pada aplikasi" over a recording
 * that is entirely fine, and it does so on Gate A too — a lane that never
 * scores and therefore never needed the model in the first place.
 */
test("a session with no scoring model loaded is not held as a feature contract mismatch", () => {
  const result = evaluateSessionValidity(valid({
    scoringModelAvailable: false,
    featureContractMatches: false,
    missingFeatures: ["model"],
  }));
  assert.equal(result.primaryReasonCode, null);
  assert.equal(result.canScore, true);
});

test("a loaded model with a broken feature still fails the contract", () => {
  const result = evaluateSessionValidity(valid({
    scoringModelAvailable: true,
    featureContractMatches: false,
    missingFeatures: ["span_x"],
  }));
  assert.equal(result.primaryReasonCode, "FEATURE_CONTRACT_MISMATCH");
  assert.equal(result.canScore, false);
});

test("a phase starved of samples is not reported as a clock desync", () => {
  const sparse = phaseAssessment("gaze_left", 3);
  assert.equal(sparse.status, "degraded");
  // `timestampsComplete` and `synchronized` are claims about the clock, and
  // phaseAssessment is never handed one. A phase can be starved of samples
  // with a perfectly monotone clock — which is what happens when the
  // calibration maps the session off screen — and answering "desync" here
  // sends the operator to repeat the stimulus while the calibration that
  // caused it is carried into the retry unchanged.
  assert.equal(sparse.timestampsComplete, true);
  assert.equal(sparse.synchronized, true);
});

test("a session the calibration mapped off screen says so, and sends the operator back to calibration", () => {
  // Taken from neurogaze-audit-PERAGA-20260820-01: offScreenRate 0.78, every
  // scored phase starved, clocks monotone throughout, calibration passed at
  // 1.35 deg. It was reported as PHASE_DESYNC -> "Ulangi stimulus", so three
  // consecutive retries reused the mapping that was the actual fault.
  const starved = ["gaze_left", "gaze_right", "pointing_left", "pointing_right",
    "gaze_left_repeat", "gaze_right_repeat", "pointing_left_repeat", "pointing_right_repeat"]
    .map((id, index) => phaseAssessment(id, index === 5 ? 17 : 3));
  const result = evaluateSessionValidity(valid({ offScreenRate: 0.777, phases: starved }));
  assert.equal(result.primaryReasonCode, "OFF_SCREEN_DOMINANT");
  assert.match(result.operatorAction, /kalibrasi/i);
});

test("a genuine clock desync is still reported as one", () => {
  const result = evaluateSessionValidity(valid({ timestampsSynchronized: false }));
  assert.equal(result.primaryReasonCode, "PHASE_DESYNC");
});
