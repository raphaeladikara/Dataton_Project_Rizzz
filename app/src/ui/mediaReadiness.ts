export const MEDIA_READINESS_STATES = [
  "loading",
  "ready",
  "playing",
  "failed",
  "timed_out",
  "interrupted",
] as const;

export type MediaReadinessStatus = (typeof MEDIA_READINESS_STATES)[number];
export type MediaReadiness = Readonly<{ status: MediaReadinessStatus }>;
export type MediaReadinessEvent = "can_play" | "playing" | "waiting" | "error" | "timeout" | "interrupt";
export type MediaFailureStatus = Extract<MediaReadinessStatus, "failed" | "timed_out" | "interrupted">;
export type MediaPlaybackMode = "live" | "replay";
export type MediaPlaybackSnapshot = Readonly<{ paused: boolean; ended: boolean; readyState: number }>;

export type MediaFailure = {
  reason: `GEOPREF_MEDIA_${string}`;
  userMessage: string;
  operatorAction: string;
};

export type MediaReadinessClock = {
  setTimeout(callback: () => void, delayMs: number): unknown;
  clearTimeout(handle: unknown): void;
};

export type MediaVisibilitySource = {
  readonly hidden: boolean;
  addEventListener(type: "visibilitychange", listener: () => void): void;
  removeEventListener(type: "visibilitychange", listener: () => void): void;
};

export const MEDIA_READY_TIMEOUT_MS = 10_000;

const TERMINAL = new Set<MediaReadinessStatus>(["failed", "timed_out", "interrupted"]);

export function initialMediaReadiness(): MediaReadiness {
  return { status: "loading" };
}

/**
 * Playback is terminal after any failure. A late `canplay` or `playing` event
 * from the same element therefore cannot revive a session already withheld.
 */
export function transitionMediaReadiness(
  current: MediaReadiness,
  event: MediaReadinessEvent,
): MediaReadiness {
  if (TERMINAL.has(current.status)) return current;
  if (event === "error") return { status: "failed" };
  if (event === "timeout") return { status: "timed_out" };
  if (event === "interrupt") return { status: "interrupted" };
  if (event === "waiting") return { status: "loading" };
  if (event === "playing") return { status: "playing" };
  if (event === "can_play" && current.status === "loading") return { status: "ready" };
  return current;
}

/** A GeoPref frame is eligible for capture only while the browser is playing. */
export function canStartTimedScoring(readiness: MediaReadiness): boolean {
  return readiness.status === "playing";
}

export function canCaptureTimedMedia(
  readiness: MediaReadiness,
  playback: MediaPlaybackSnapshot,
): boolean {
  return canStartTimedScoring(readiness)
    && !playback.paused
    && !playback.ended
    && playback.readyState >= 2;
}

export function isMediaFailure(status: MediaReadinessStatus): status is MediaFailureStatus {
  return TERMINAL.has(status);
}

export function mediaFailure(status: MediaFailureStatus): MediaFailure {
  if (status === "failed") {
    return {
      reason: "GEOPREF_MEDIA_FAILED",
      userMessage: "Video stimulus tidak dapat diputar. Hasil tidak dibuat agar tidak menyesatkan.",
      operatorAction: "Periksa aset video pada perangkat, lalu mulai sesi baru.",
    };
  }
  if (status === "timed_out") {
    return {
      reason: "GEOPREF_MEDIA_TIMED_OUT",
      userMessage: "Video stimulus terlalu lama dimuat. Hasil tidak dibuat agar tidak menyesatkan.",
      operatorAction: "Tutup aplikasi lain yang sedang memutar media, lalu mulai sesi baru.",
    };
  }
  return {
    reason: "GEOPREF_MEDIA_INTERRUPTED",
    userMessage: "Layar sempat ditinggalkan saat stimulus berlangsung. Hasil tidak dibuat agar tidak menyesatkan.",
    operatorAction: "Pastikan layar tetap terbuka selama tes, lalu mulai sesi baru.",
  };
}

type MediaWaiter = {
  accepted: readonly MediaReadinessStatus[];
  generation: number;
  timer: unknown;
  resolve(readiness: MediaReadiness): void;
};

export type MediaReadinessController = {
  snapshot(): MediaReadiness;
  generation(): number;
  event(event: MediaReadinessEvent, generation?: number): MediaReadiness;
  waitUntil(accepted: readonly MediaReadinessStatus[]): Promise<MediaReadiness>;
  requestPlaying(startPlayback: () => Promise<void>, generation?: number): Promise<MediaReadiness>;
  canAdvance(mode: MediaPlaybackMode, playback: MediaPlaybackSnapshot): boolean;
  reset(): number;
  deactivate(): void;
  connectVisibility(source: MediaVisibilitySource): () => void;
  dispose(): void;
};

const systemClock: MediaReadinessClock = {
  setTimeout: (callback, delayMs) => globalThis.setTimeout(callback, delayMs),
  clearTimeout: (handle) => globalThis.clearTimeout(handle as ReturnType<typeof globalThis.setTimeout>),
};

/**
 * Owns the asynchronous boundary between browser media events and a timed
 * GeoPref run. The controller is deliberately independent of React so the
 * exact object used by the page can be driven with a deterministic clock.
 */
export function createMediaReadinessController(options: {
  timeoutMs?: number;
  clock?: MediaReadinessClock;
  onChange?: (readiness: MediaReadiness) => void;
  onWithhold?: (failure: MediaFailure, readiness: MediaReadiness) => void;
} = {}): MediaReadinessController {
  const clock = options.clock ?? systemClock;
  const timeoutMs = options.timeoutMs ?? MEDIA_READY_TIMEOUT_MS;
  const waiters = new Set<MediaWaiter>();
  const visibilityCleanups = new Set<() => void>();
  let readiness = initialMediaReadiness();
  let generation = 0;
  let active = false;
  let terminalNotified = false;
  let disposed = false;

  const settle = (waiter: MediaWaiter, result: MediaReadiness) => {
    if (!waiters.delete(waiter)) return;
    clock.clearTimeout(waiter.timer);
    waiter.resolve(result);
  };

  const notifyTerminal = () => {
    if (!active || terminalNotified || !isMediaFailure(readiness.status)) return;
    terminalNotified = true;
    options.onWithhold?.(mediaFailure(readiness.status), readiness);
  };

  const publish = (next: MediaReadiness) => {
    if (next === readiness) return readiness;
    readiness = next;
    options.onChange?.(readiness);
    [...waiters].forEach((waiter) => {
      if (waiter.generation !== generation) {
        settle(waiter, { status: "interrupted" });
      } else if (waiter.accepted.includes(readiness.status) || isMediaFailure(readiness.status)) {
        settle(waiter, readiness);
      }
    });
    notifyTerminal();
    return readiness;
  };

  const controller: MediaReadinessController = {
    snapshot: () => readiness,
    generation: () => generation,
    event(event, eventGeneration = generation) {
      if (disposed || eventGeneration !== generation) return readiness;
      return publish(transitionMediaReadiness(readiness, event));
    },
    waitUntil(accepted) {
      if (disposed) return Promise.resolve({ status: "interrupted" });
      active = true;
      if (accepted.includes(readiness.status) || isMediaFailure(readiness.status)) {
        notifyTerminal();
        return Promise.resolve(readiness);
      }
      const waiterGeneration = generation;
      return new Promise((resolve) => {
        const waiter: MediaWaiter = {
          accepted,
          generation: waiterGeneration,
          timer: undefined,
          resolve,
        };
        waiters.add(waiter);
        waiter.timer = clock.setTimeout(() => {
          if (disposed || waiterGeneration !== generation) {
            settle(waiter, { status: "interrupted" });
            return;
          }
          controller.event("timeout", waiterGeneration);
        }, timeoutMs);
      });
    },
    requestPlaying(startPlayback, eventGeneration = generation) {
      if (disposed || eventGeneration !== generation) return Promise.resolve({ status: "interrupted" });
      // Register the deadline before calling play(): browsers may leave the
      // returned promise pending until playback actually begins.
      const playing = controller.waitUntil(["playing"]);
      try {
        void startPlayback().catch(() => controller.event("error", eventGeneration));
      } catch {
        controller.event("error", eventGeneration);
      }
      return playing;
    },
    canAdvance(_mode, playback) {
      return !disposed && canCaptureTimedMedia(readiness, playback);
    },
    reset() {
      active = false;
      terminalNotified = false;
      generation += 1;
      [...waiters].forEach((waiter) => settle(waiter, { status: "interrupted" }));
      publish(initialMediaReadiness());
      return generation;
    },
    deactivate() {
      active = false;
      [...waiters].forEach((waiter) => settle(waiter, { status: "interrupted" }));
    },
    connectVisibility(source) {
      if (disposed) return () => undefined;
      let connected = true;
      const interruptWhenHidden = () => {
        if (source.hidden && active) controller.event("interrupt", generation);
      };
      const disconnect = () => {
        if (!connected) return;
        connected = false;
        source.removeEventListener("visibilitychange", interruptWhenHidden);
        visibilityCleanups.delete(disconnect);
      };
      source.addEventListener("visibilitychange", interruptWhenHidden);
      visibilityCleanups.add(disconnect);
      return disconnect;
    },
    dispose() {
      if (disposed) return;
      active = false;
      disposed = true;
      generation += 1;
      [...waiters].forEach((waiter) => settle(waiter, { status: "interrupted" }));
      [...visibilityCleanups].forEach((disconnect) => disconnect());
    },
  };

  return controller;
}
