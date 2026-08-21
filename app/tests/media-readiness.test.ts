import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const moduleUrl = new URL("../src/ui/mediaReadiness.ts", import.meta.url);

async function readinessModule() {
  assert.equal(existsSync(moduleUrl), true, "media readiness module must exist");
  return import("../src/ui/mediaReadiness");
}

function createFakeClock() {
  let now = 0;
  let nextId = 1;
  const tasks = new Map<number, { at: number; callback: () => void }>();
  return {
    clock: {
      setTimeout(callback: () => void, delayMs: number) {
        const id = nextId++;
        tasks.set(id, { at: now + delayMs, callback });
        return id;
      },
      clearTimeout(id: unknown) {
        tasks.delete(id as number);
      },
    },
    advanceBy(delayMs: number) {
      now += delayMs;
      const due = [...tasks.entries()]
        .filter(([, task]) => task.at <= now)
        .sort((left, right) => left[1].at - right[1].at);
      due.forEach(([id, task]) => {
        if (!tasks.delete(id)) return;
        task.callback();
      });
    },
    pendingCount() {
      return tasks.size;
    },
  };
}

function createFakeVisibility() {
  const listeners = new Set<() => void>();
  return {
    hidden: false,
    addEventListener(type: "visibilitychange", listener: () => void) {
      assert.equal(type, "visibilitychange");
      listeners.add(listener);
    },
    removeEventListener(type: "visibilitychange", listener: () => void) {
      assert.equal(type, "visibilitychange");
      listeners.delete(listener);
    },
    setHidden(hidden: boolean) {
      this.hidden = hidden;
      listeners.forEach((listener) => listener());
    },
    listenerCount() {
      return listeners.size;
    },
  };
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

test("the real orchestration gate holds live and replay progress until playing", async () => {
  const { createMediaReadinessController } = await readinessModule();
  const fakeClock = createFakeClock();
  const controller = createMediaReadinessController({ clock: fakeClock.clock });
  const playable = { paused: false, ended: false, readyState: 4 };

  const ready = controller.waitUntil(["ready", "playing"]);
  const generation = controller.generation();
  controller.event("can_play", generation);
  assert.equal((await ready).status, "ready");

  for (const mode of ["live", "replay"] as const) {
    assert.equal(controller.canAdvance(mode, playable), false, `${mode} must not start on canplay`);
  }

  const playing = controller.waitUntil(["playing"]);
  controller.event("playing", generation);
  assert.equal((await playing).status, "playing");
  for (const mode of ["live", "replay"] as const) {
    assert.equal(controller.canAdvance(mode, playable), true, `${mode} may start after playing`);
  }
  assert.equal(fakeClock.pendingCount(), 0);
});

test("error, timeout, and hidden-page interruption withhold through one callback", async () => {
  const { createMediaReadinessController, MEDIA_READY_TIMEOUT_MS } = await readinessModule();

  for (const trigger of ["error", "timeout", "visibility"] as const) {
    const fakeClock = createFakeClock();
    const visibility = createFakeVisibility();
    const withheld: Array<{ reason: string; operatorAction: string }> = [];
    const controller = createMediaReadinessController({
      clock: fakeClock.clock,
      onWithhold: (failure) => withheld.push(failure),
    });
    const disconnect = controller.connectVisibility(visibility);
    const waiting = controller.waitUntil(["playing"]);

    if (trigger === "error") controller.event("error", controller.generation());
    if (trigger === "timeout") fakeClock.advanceBy(MEDIA_READY_TIMEOUT_MS);
    if (trigger === "visibility") visibility.setHidden(true);

    const result = await waiting;
    assert.equal(controller.canAdvance("live", { paused: false, ended: false, readyState: 4 }), false);
    assert.equal(withheld.length, 1);
    assert.match(withheld[0].reason, /^GEOPREF_MEDIA_(FAILED|TIMED_OUT|INTERRUPTED)$/);
    assert.match(withheld[0].operatorAction, /mulai sesi baru/i);
    assert.equal(result.status, trigger === "error" ? "failed" : trigger === "timeout" ? "timed_out" : "interrupted");
    disconnect();
    controller.dispose();
  }
});

test("a page hidden before listener attachment interrupts immediately and cannot resume", async () => {
  const { createMediaReadinessController } = await readinessModule();
  const fakeClock = createFakeClock();
  const visibility = createFakeVisibility();
  visibility.setHidden(true);
  const withheld: string[] = [];
  const controller = createMediaReadinessController({
    clock: fakeClock.clock,
    onWithhold: (failure) => withheld.push(failure.reason),
  });
  const waiting = controller.waitUntil(["playing"]);

  controller.connectVisibility(visibility);
  assert.equal(controller.snapshot().status, "interrupted");
  assert.equal((await waiting).status, "interrupted");
  assert.deepEqual(withheld, ["GEOPREF_MEDIA_INTERRUPTED"]);

  visibility.setHidden(false);
  controller.event("playing", controller.generation());
  assert.equal(controller.snapshot().status, "interrupted");
  assert.equal(controller.canAdvance("live", { paused: false, ended: false, readyState: 4 }), false);
  assert.deepEqual(withheld, ["GEOPREF_MEDIA_INTERRUPTED"]);
});

test("a directional-only retry bypasses failed GeoPref media while a full run is withheld", async () => {
  const { createMediaReadinessController, MEDIA_READY_TIMEOUT_MS } = await readinessModule();
  const fakeClock = createFakeClock();
  const retryWithheld: string[] = [];
  const retryController = createMediaReadinessController({
    clock: fakeClock.clock,
    onWithhold: (failure) => retryWithheld.push(failure.reason),
  });
  retryController.event("error", retryController.generation());

  const directionalRetry = await retryController.prepareRun(false, ["ready", "playing"]);
  assert.equal(directionalRetry, null);
  assert.equal(retryController.blockingFailure(), null);
  assert.deepEqual(retryWithheld, []);

  const fullWithheld: string[] = [];
  const fullController = createMediaReadinessController({
    clock: fakeClock.clock,
    onWithhold: (failure) => fullWithheld.push(failure.reason),
  });
  const fullRun = fullController.prepareRun(true, ["ready", "playing"]);
  fakeClock.advanceBy(MEDIA_READY_TIMEOUT_MS);
  assert.equal((await fullRun)?.status, "timed_out");
  assert.equal(fullController.blockingFailure(), "timed_out");
  assert.deepEqual(fullWithheld, ["GEOPREF_MEDIA_TIMED_OUT"]);
});

test("a directional-only retry still stops when the page is hidden", async () => {
  const { createMediaReadinessController } = await readinessModule();
  const visibility = createFakeVisibility();
  const withheld: string[] = [];
  const controller = createMediaReadinessController({
    onWithhold: (failure) => withheld.push(failure.reason),
  });
  controller.connectVisibility(visibility);
  controller.event("error", controller.generation());

  const directionalRetry = await controller.prepareRun(false, ["ready", "playing"]);
  assert.equal(directionalRetry, null);
  assert.equal(controller.blockingFailure(), null);
  assert.deepEqual(withheld, []);

  visibility.setHidden(true);
  assert.equal(controller.snapshot().status, "interrupted");
  assert.equal(controller.blockingFailure(), "interrupted");
  assert.deepEqual(withheld, ["GEOPREF_MEDIA_INTERRUPTED"]);

  visibility.setHidden(false);
  controller.event("playing", controller.generation());
  assert.equal(controller.snapshot().status, "interrupted");
  assert.equal(controller.blockingFailure(), "interrupted");
});

test("reset and dispose cancel timers, listeners, waiters, and late media events", async () => {
  const { createMediaReadinessController, MEDIA_READY_TIMEOUT_MS } = await readinessModule();
  const fakeClock = createFakeClock();
  const visibility = createFakeVisibility();
  const withheld: string[] = [];
  const controller = createMediaReadinessController({
    clock: fakeClock.clock,
    onWithhold: (failure) => withheld.push(failure.reason),
  });
  controller.connectVisibility(visibility);
  const staleGeneration = controller.generation();
  let rejectStalePlay: (reason?: unknown) => void = () => undefined;
  const staleWait = controller.requestPlaying(
    () => new Promise<void>((_resolve, reject) => { rejectStalePlay = reject; }),
    staleGeneration,
  );

  const freshGeneration = controller.reset();
  assert.equal((await staleWait).status, "interrupted");
  assert.notEqual(freshGeneration, staleGeneration);
  rejectStalePlay(new Error("late failure from replaced media"));
  await Promise.resolve();
  controller.event("playing", staleGeneration);
  fakeClock.advanceBy(MEDIA_READY_TIMEOUT_MS);
  assert.equal(controller.snapshot().status, "loading");
  assert.deepEqual(withheld, []);

  const freshWait = controller.waitUntil(["playing"]);
  controller.event("can_play", freshGeneration);
  assert.equal(controller.snapshot().status, "ready");
  controller.event("playing", freshGeneration);
  assert.equal((await freshWait).status, "playing");

  controller.dispose();
  controller.event("error", freshGeneration);
  visibility.setHidden(true);
  fakeClock.advanceBy(MEDIA_READY_TIMEOUT_MS);
  assert.equal(controller.snapshot().status, "playing");
  assert.equal(visibility.listenerCount(), 0);
  assert.equal(fakeClock.pendingCount(), 0);
  assert.deepEqual(withheld, []);
});

test("the playing deadline is armed before a browser play promise can stall", async () => {
  const { createMediaReadinessController, MEDIA_READY_TIMEOUT_MS } = await readinessModule();
  const fakeClock = createFakeClock();
  const withheld: string[] = [];
  const controller = createMediaReadinessController({
    clock: fakeClock.clock,
    onWithhold: (failure) => withheld.push(failure.reason),
  });
  const neverPlays = new Promise<void>(() => undefined);

  const playing = controller.requestPlaying(() => neverPlays, controller.generation());
  assert.equal(fakeClock.pendingCount(), 1, "deadline must exist while play() is still pending");
  fakeClock.advanceBy(MEDIA_READY_TIMEOUT_MS);

  assert.equal((await playing).status, "timed_out");
  assert.deepEqual(withheld, ["GEOPREF_MEDIA_TIMED_OUT"]);
});

test("the stimulus page mounts browser callbacks into the behavioral controller", () => {
  const scene = readFileSync(new URL("../src/ui/stimulus-scene.tsx", import.meta.url), "utf8");
  const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(scene, /hidden=\{!geoprefActive\}/);
  assert.match(scene, /onCanPlay=\{onGeoprefCanPlay\}/);
  assert.match(scene, /onPlaying=\{onGeoprefPlaying\}/);
  assert.match(scene, /onError=\{onGeoprefError\}/);
  assert.match(scene, /key=\{geoprefMediaKey\}/);
  assert.match(page, /createMediaReadinessController/);
  assert.match(page, /mediaController\(\)\.prepareRun\(includesGeopref,/);
  assert.match(page, /mediaController\(\)\.canAdvance\(mode,/);
  assert.match(page, /mediaController\(\)\.connectVisibility\(document\)/);
  assert.match(page, /mediaController\(\)\.reset\(\)/);
  assert.match(page, /mediaController\(\)\.requestPlaying/);
  assert.match(page, /mediaControllerRef\.current\?\.dispose\(\)/);
  assert.match(page, /stimulus\.media_withheld/);
  assert.match(page, /gaze: undefined, assessment: undefined, decision: undefined/);
  const timedStartGate = page.indexOf("if (includesGeopref && !await ensureGeoprefPlaying()) return;");
  const includesGeoprefIndex = page.indexOf("const includesGeopref = runPhases.some");
  const prepareRunIndex = page.indexOf("mediaController().prepareRun(includesGeopref,");
  assert.ok(includesGeoprefIndex >= 0, "run media requirement must be derived from the actual retry phase set");
  assert.ok(prepareRunIndex >= 0, "run preparation call must remain present");
  assert.ok(includesGeoprefIndex < prepareRunIndex, "partial retry phases must be known before media preparation");
  assert.ok(timedStartGate >= 0, "a baseline-first battery must preflight actual playback before its clock starts");
  const liveClockIndex = page.indexOf("const startedAt = performance.now();", timedStartGate);
  const replayProgressIndex = page.indexOf("setProgress(Math.round((index / totalFrames) * 100));", timedStartGate);
  assert.ok(liveClockIndex >= 0, "live clock start must remain present");
  assert.ok(replayProgressIndex >= 0, "replay progress update must remain present");
  assert.ok(timedStartGate < liveClockIndex);
  assert.ok(timedStartGate < replayProgressIndex);
  const replayStep = page.slice(
    page.indexOf("for (let index = 0; index < totalFrames; index += 6)"),
    page.indexOf("await pause(stepPause)"),
  );
  const replayGateIndex = replayStep.indexOf("ensureGeoprefPlaying()");
  const replayStepProgressIndex = replayStep.indexOf("setProgress(");
  assert.ok(replayGateIndex >= 0, "replay step must retain its playback gate");
  assert.ok(replayStepProgressIndex >= 0, "replay step must retain its progress update");
  assert.ok(replayGateIndex < replayStepProgressIndex, "replay progress must remain still while media is paused or buffering");
});

test("a run started while the page is already hidden interrupts instead of timing out", async () => {
  // The page attaches `connectVisibility(document)` on mount, long before a
  // session starts. If the operator switches away in between, no
  // `visibilitychange` fires when the run begins, so the run must consult the
  // current visibility itself rather than sit out the load deadline.
  const { createMediaReadinessController } = await readinessModule();
  const fakeClock = createFakeClock();
  const visibility = createFakeVisibility();
  const withheld: Array<{ reason: string; operatorAction: string }> = [];
  const controller = createMediaReadinessController({
    clock: fakeClock.clock,
    onWithhold: (failure) => withheld.push(failure),
  });

  controller.connectVisibility(visibility);
  visibility.setHidden(true);
  assert.equal(controller.snapshot().status, "loading", "an idle controller must not withhold");

  const prepared = await controller.prepareRun(true, ["ready", "playing"]);

  assert.equal(prepared?.status, "interrupted");
  assert.deepEqual(withheld.map((failure) => failure.reason), ["GEOPREF_MEDIA_INTERRUPTED"]);
  assert.match(withheld[0].operatorAction, /layar tetap terbuka/i);
  assert.equal(fakeClock.pendingCount(), 0, "the load deadline must not outlive an interrupted run");
  assert.equal(controller.blockingFailure(), "interrupted");
  controller.dispose();
});

test("a run started on a visible page still honours the load deadline", async () => {
  const { createMediaReadinessController, MEDIA_READY_TIMEOUT_MS } = await readinessModule();
  const fakeClock = createFakeClock();
  const visibility = createFakeVisibility();
  const withheld: string[] = [];
  const controller = createMediaReadinessController({
    clock: fakeClock.clock,
    onWithhold: (failure) => withheld.push(failure.reason),
  });

  controller.connectVisibility(visibility);
  const prepared = controller.prepareRun(true, ["ready", "playing"]);
  fakeClock.advanceBy(MEDIA_READY_TIMEOUT_MS);

  assert.equal((await prepared)?.status, "timed_out");
  assert.deepEqual(withheld, ["GEOPREF_MEDIA_TIMED_OUT"]);
  controller.dispose();
});

test("a directional-only retry on a hidden page is still withheld", async () => {
  // A retry that skips GeoPref does not need the clip, but a page the operator
  // has left cannot be measured either way.
  const { createMediaReadinessController } = await readinessModule();
  const fakeClock = createFakeClock();
  const visibility = createFakeVisibility();
  const withheld: string[] = [];
  const controller = createMediaReadinessController({
    clock: fakeClock.clock,
    onWithhold: (failure) => withheld.push(failure.reason),
  });

  controller.connectVisibility(visibility);
  visibility.setHidden(true);
  await controller.prepareRun(false, ["ready", "playing"]);

  assert.equal(controller.blockingFailure(), "interrupted");
  assert.deepEqual(withheld, ["GEOPREF_MEDIA_INTERRUPTED"]);
  controller.dispose();
});

test("a run consults the visibility source it is handed, before any listener is attached", async () => {
  // `connectVisibility` is a stimulus-stage effect, so it has not run yet when
  // `runStimulus` prepares the clip. The run therefore has to be given the
  // document directly, or a session started on a hidden tab spends the whole
  // load deadline and then blames the video file.
  const { createMediaReadinessController } = await readinessModule();
  const fakeClock = createFakeClock();
  const visibility = createFakeVisibility();
  visibility.setHidden(true);
  const withheld: string[] = [];
  const controller = createMediaReadinessController({
    clock: fakeClock.clock,
    onWithhold: (failure) => withheld.push(failure.reason),
  });

  const prepared = await controller.prepareRun(true, ["ready", "playing"], visibility);

  assert.equal(prepared?.status, "interrupted");
  assert.deepEqual(withheld, ["GEOPREF_MEDIA_INTERRUPTED"]);
  assert.equal(fakeClock.pendingCount(), 0);
  controller.dispose();
});

test("a visible source handed to the run does not pre-empt normal preparation", async () => {
  const { createMediaReadinessController } = await readinessModule();
  const fakeClock = createFakeClock();
  const visibility = createFakeVisibility();
  const controller = createMediaReadinessController({ clock: fakeClock.clock });

  const prepared = controller.prepareRun(true, ["ready", "playing"], visibility);
  controller.event("can_play", controller.generation());

  assert.equal((await prepared)?.status, "ready");
  controller.dispose();
});

test("the stimulus page hands the document to run preparation", async () => {
  const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /prepareRun\(includesGeopref, \["ready", "playing"\], visibilitySource\(\)\)/);
  assert.match(page, /function visibilitySource\(\)/);
});

test("a disposed controller reports an interrupted run whether or not the page is hidden", async () => {
  // `waitUntil` already refuses a disposed controller. The visibility
  // shortcut in `prepareRun` must not become a way around that guard.
  const { createMediaReadinessController } = await readinessModule();

  for (const hidden of [true, false]) {
    const fakeClock = createFakeClock();
    const visibility = createFakeVisibility();
    visibility.setHidden(hidden);
    const withheld: string[] = [];
    const controller = createMediaReadinessController({
      clock: fakeClock.clock,
      onWithhold: (failure) => withheld.push(failure.reason),
    });
    controller.dispose();

    const prepared = await controller.prepareRun(true, ["ready", "playing"], visibility);

    assert.equal(prepared?.status, "interrupted", `hidden=${hidden}`);
    assert.deepEqual(withheld, [], "a disposed controller must not emit a withhold callback");
    assert.equal(fakeClock.pendingCount(), 0);
  }
});

test("the one-click demonstration mounts the stimulus stage before it runs the battery", async () => {
  // The GeoPref <video> only exists while `stage === "stimulus"`, and the media
  // gate now waits for that element to report canplay. The guided demo calls
  // runStimulus from an effect rather than from the stimulus screen's own
  // button, so it has to put the session on that stage itself. Without this the
  // element never mounts, the gate waits out its deadline, and every registered
  // replay ends as "Video stimulus terlalu lama dimuat".
  const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
  const scene = readFileSync(new URL("../src/ui/stimulus-scene.tsx", import.meta.url), "utf8");

  assert.match(scene, /geoprefSource && <div/, "the clip must stay conditional on the stimulus scene rendering");
  assert.match(page, /stage === "stimulus" && \(/, "the stimulus scene must remain stage-gated");

  const demoEffect = page.match(/if \(demoRun === "idle"[\s\S]*?\}, \[demoRun, calibration, quality, model, busy\]\);/)?.[0] ?? "";
  assert.ok(demoEffect, "the guided demonstration effect must remain present");

  const stageCall = demoEffect.indexOf('setStage("stimulus")');
  const runCall = demoEffect.indexOf("runStimulus({ fast: true })");
  assert.ok(stageCall >= 0, "the guided demonstration must mount the stimulus stage itself");
  assert.ok(runCall >= 0, "the guided demonstration must still run the real battery");
  assert.ok(stageCall < runCall, "the stage has to be mounted before the battery is prepared");
});
