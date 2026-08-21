import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const moduleUrl = new URL("../src/ui/mediaReadiness.ts", import.meta.url);

async function readinessModule() {
  assert.equal(existsSync(moduleUrl), true, "media readiness module must exist");
  return import("../src/ui/mediaReadiness");
}

test("media readiness exposes every explicit playback state", async () => {
  const { MEDIA_READINESS_STATES } = await readinessModule();
  assert.deepEqual(MEDIA_READINESS_STATES, [
    "loading",
    "ready",
    "playing",
    "failed",
    "timed_out",
    "interrupted",
  ]);
});

test("canplay and playing open separate readiness gates", async () => {
  const { initialMediaReadiness, transitionMediaReadiness, canStartTimedScoring } = await readinessModule();
  const loading = initialMediaReadiness();
  const ready = transitionMediaReadiness(loading, "can_play");
  const playing = transitionMediaReadiness(ready, "playing");

  assert.equal(loading.status, "loading");
  assert.equal(ready.status, "ready");
  assert.equal(canStartTimedScoring(loading), false);
  assert.equal(canStartTimedScoring(ready), false);
  assert.equal(playing.status, "playing");
  assert.equal(canStartTimedScoring(playing), true);
});

test("a paused or buffering clip closes the scoring gate until playing fires again", async () => {
  const { initialMediaReadiness, transitionMediaReadiness, canStartTimedScoring, canCaptureTimedMedia } = await readinessModule();
  const playing = transitionMediaReadiness(
    transitionMediaReadiness(initialMediaReadiness(), "can_play"),
    "playing",
  );
  const waiting = transitionMediaReadiness(playing, "waiting");
  assert.equal(waiting.status, "loading");
  assert.equal(canStartTimedScoring(waiting), false);
  assert.equal(canStartTimedScoring(transitionMediaReadiness(waiting, "playing")), true);
  assert.equal(canCaptureTimedMedia(playing, { paused: true, ended: false, readyState: 4 }), false);
  assert.equal(canCaptureTimedMedia(playing, { paused: false, ended: true, readyState: 4 }), false);
  assert.equal(canCaptureTimedMedia(playing, { paused: false, ended: false, readyState: 1 }), false);
  assert.equal(canCaptureTimedMedia(playing, { paused: false, ended: false, readyState: 4 }), true);

  const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
  const pauseHandler = page.match(/function toggleStimulusPause\(\)[\s\S]*?\n  \}/)?.[0] ?? "";
  assert.match(pauseHandler, /transitionMedia\("waiting"\)/);
});

test("failure, timeout, and hidden-page interruption are terminal and never score", async () => {
  const { initialMediaReadiness, transitionMediaReadiness, canStartTimedScoring } = await readinessModule();
  const terminalEvents = ["error", "timeout", "interrupt"] as const;
  const expected = ["failed", "timed_out", "interrupted"];

  terminalEvents.forEach((event, index) => {
    const stopped = transitionMediaReadiness(initialMediaReadiness(), event);
    assert.equal(stopped.status, expected[index]);
    assert.equal(canStartTimedScoring(stopped), false);
    assert.equal(transitionMediaReadiness(stopped, "can_play"), stopped);
    assert.equal(transitionMediaReadiness(stopped, "playing"), stopped);
  });
});

test("every terminal media state has stable audit data and Indonesian recovery copy", async () => {
  const { mediaFailure } = await readinessModule();

  for (const status of ["failed", "timed_out", "interrupted"] as const) {
    const failure = mediaFailure(status);
    assert.match(failure.reason, /^GEOPREF_MEDIA_[A-Z_]+$/);
    assert.match(failure.userMessage, /Hasil tidak dibuat/);
    assert.match(failure.operatorAction, /mulai sesi baru/i);
    assert.doesNotMatch(`${failure.userMessage} ${failure.operatorAction}`, /AbortError|NotAllowedError|MEDIA_ERR|DOMException/);
  }
});

test("GeoPref is pre-mounted and both live and replay use the same playback callbacks", () => {
  const scene = readFileSync(new URL("../src/ui/stimulus-scene.tsx", import.meta.url), "utf8");
  const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(scene, /hidden=\{!geoprefActive\}/);
  assert.match(scene, /onCanPlay=\{onGeoprefCanPlay\}/);
  assert.match(scene, /onPlaying=\{onGeoprefPlaying\}/);
  assert.match(scene, /onError=\{onGeoprefError\}/);
  assert.match(scene, /key=\{geoprefMediaKey\}/);
  assert.match(page, /canStartTimedScoring/);
  assert.match(page, /visibilitychange/);
  assert.match(page, /MEDIA_READY_TIMEOUT_MS/);
  assert.match(page, /stimulus\.media_withheld/);
  assert.match(page, /gaze: undefined, assessment: undefined, decision: undefined/);
  assert.match(page, /generation !== mediaGenerationRef\.current/);
  assert.match(page, /transitionMediaGeneration\("timeout", generation\)/);
  assert.match(page, /transitionMediaGeneration\("error", generation\)/);
  assert.match(page, /runId !== stimulusRunIdRef\.current\) return Promise\.resolve\(\{ status: "interrupted" \}\)/);
  assert.ok(
    (page.match(/stopIfMediaTerminated\(runId\)/g) ?? []).length >= 3,
    "both loops and the post-loop scoring boundary must check terminal media",
  );
  assert.ok(
    (page.match(/state\.phase\.id === GEOPREF_PHASE_ID && !geoprefCaptureReady\(\)/g) ?? []).length >= 2,
    "replay must gate GeoPref both before and after each displayed step",
  );
  const livePlaybackGate = page.match(/const phaseState = phaseAtElapsed\(elapsed, runPhases\)!;[\s\S]*?const nextPhaseIndex/)?.[0] ?? "";
  const revealIndex = livePlaybackGate.indexOf("setStimulusPhase(phaseState.phase)");
  const playIndex = livePlaybackGate.indexOf("ensureGeoprefPlaying()");
  assert.ok(
    revealIndex >= 0 && revealIndex < playIndex,
    "the GeoPref stage must be visible before playback is requested",
  );
  assert.doesNotMatch(page, /mode === "replay"[^\n]+mediaReadiness/);
});
