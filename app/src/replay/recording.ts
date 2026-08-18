import type { FrameSample } from "../capture/frameTrace";
import type { Point } from "../domain/types";

/**
 * A previously captured live session, replayed instead of regenerated.
 *
 * The synthetic scenarios in scenarios.ts produce gaze points from an LCG and
 * never populate the frame trace, so four of the six layer-B indices come out
 * empty and the outcome is withheld. A recording carries the per-frame pose and
 * eye-opening trace the live path exported, so the report it produces is the
 * report that session actually produced.
 */
export type RecordedSession = {
  id: string;
  label: string;
  capturedAt: string;
  points: Point[];
  frames: FrameSample[];
  faceRate: number;
  gazeDropout: number;
  brightness: number;
  calibrationErrorDeg: number;
};

type Unknown = Record<string, unknown>;

function isObject(value: unknown): value is Unknown {
  return typeof value === "object" && value !== null;
}

function number(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function points(value: unknown): Point[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is Point =>
    isObject(item) && number(item.t) !== null && number(item.x) !== null && number(item.y) !== null);
}

function frames(value: unknown): FrameSample[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is FrameSample =>
    isObject(item) && number(item.t) !== null && typeof item.phase === "string" && number(item.eyeOpen) !== null);
}

export const MIN_RECORDED_POINTS = 30;
export const MIN_RECORDED_FRAMES = 30;

/** Accepted, or refused with the one sentence that says what to fix. */
export type RecordingInspection =
  | { ok: true; recording: RecordedSession }
  | { ok: false; reason: string };

/**
 * Read an exported audit log into a replayable session, and say why not.
 *
 * The refusal reasons exist because the failure that matters here is silent:
 * a log exported from a replay session parses perfectly and carries no frame
 * trace, so it would reproduce the synthetic path's empty indices while
 * claiming to be a recording. Whoever registers a file needs to be told that
 * before the demo, not after.
 */
export function inspectAuditLog(log: unknown, id: string): RecordingInspection {
  if (!isObject(log)) return { ok: false, reason: "Berkas ini bukan objek JSON log audit." };
  const gaze = isObject(log.gaze) ? log.gaze : null;
  const quality = isObject(log.quality) ? log.quality : null;
  if (!gaze) return { ok: false, reason: "Log tidak punya blok `gaze`." };
  if (!quality) return { ok: false, reason: "Log tidak punya blok `quality`." };

  const capturedPoints = points(gaze.processedPoints);
  const capturedFrames = frames(gaze.frames);
  if (capturedPoints.length < MIN_RECORDED_POINTS)
    return {
      ok: false,
      reason: `Hanya ${capturedPoints.length} titik pandangan terbaca, minimal ${MIN_RECORDED_POINTS}.`,
    };
  if (capturedFrames.length < MIN_RECORDED_FRAMES)
    return {
      ok: false,
      reason:
        `Hanya ${capturedFrames.length} frame terbaca, minimal ${MIN_RECORDED_FRAMES}. ` +
        "Log tanpa jejak frame biasanya berasal dari sesi replay, bukan sesi kamera langsung.",
    };

  const faceRate = number(quality.faceRate);
  const gazeDropout = number(quality.gazeDropout);
  if (faceRate === null) return { ok: false, reason: "`quality.faceRate` bukan angka." };
  if (gazeDropout === null) return { ok: false, reason: "`quality.gazeDropout` bukan angka." };

  const calibration = isObject(log.calibration) ? log.calibration : null;
  return {
    ok: true,
    recording: {
      id,
      label: typeof log.sessionId === "string" ? log.sessionId : id,
      capturedAt: typeof log.createdAt === "string" ? log.createdAt : "",
      points: capturedPoints,
      frames: capturedFrames,
      faceRate,
      gazeDropout,
      brightness: number(quality.brightness) ?? 0.55,
      calibrationErrorDeg:
        number(calibration?.validationErrorDeg) ?? number(quality.calibrationErrorDeg) ?? 2.2,
    },
  };
}

/**
 * Read an exported audit log into a replayable session.
 *
 * Returns null rather than a half-populated session. Callers that can show a
 * person what went wrong should use inspectAuditLog instead.
 */
export function recordingFromAuditLog(log: unknown, id: string): RecordedSession | null {
  const inspection = inspectAuditLog(log, id);
  return inspection.ok ? inspection.recording : null;
}

/**
 * Recordings are registered in app/public/replay/index.json.
 *
 * A manifest rather than a probe list: guessing filenames means a 404 in the
 * console on every demo, and an operator reading the console should only see
 * things that are actually wrong.
 */
export const RECORDING_MANIFEST_URL = "/replay/index.json";

export async function loadFirstRecording(
  manifestUrl: string = RECORDING_MANIFEST_URL,
  fetcher: typeof fetch = fetch,
): Promise<RecordedSession | null> {
  let files: string[] = [];
  try {
    const response = await fetcher(manifestUrl, { cache: "no-store" });
    if (!response.ok) return null;
    const manifest: unknown = await response.json();
    const listed = isObject(manifest) ? manifest.recordings : null;
    files = Array.isArray(listed) ? listed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return null;
  }

  for (const file of files) {
    const url = file.startsWith("/") ? file : `/replay/${file}`;
    try {
      const response = await fetcher(url, { cache: "no-store" });
      if (!response.ok) continue;
      const recording = recordingFromAuditLog(await response.json(), url.split("/").pop() ?? url);
      if (recording) return recording;
    } catch {
      // A listed file that will not parse is a broken recording, not a reason
      // to abandon the rest of the manifest.
    }
  }
  return null;
}
