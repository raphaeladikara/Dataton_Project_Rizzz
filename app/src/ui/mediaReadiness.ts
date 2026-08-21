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
  playback: Readonly<{ paused: boolean; ended: boolean; readyState: number }>,
): boolean {
  return canStartTimedScoring(readiness)
    && !playback.paused
    && !playback.ended
    && playback.readyState >= 2;
}

export function isMediaFailure(status: MediaReadinessStatus): status is MediaFailureStatus {
  return TERMINAL.has(status);
}

export function mediaFailure(status: MediaFailureStatus): {
  reason: `GEOPREF_MEDIA_${string}`;
  userMessage: string;
  operatorAction: string;
} {
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
