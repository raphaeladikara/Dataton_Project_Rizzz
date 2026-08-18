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

/**
 * Read an exported audit log into a replayable session.
 *
 * Returns null rather than a half-populated session: a recording without the
 * frame trace would silently reproduce the synthetic replay's empty indices,
 * which is exactly the thing this exists to replace.
 */
export function recordingFromAuditLog(log: unknown, id: string): RecordedSession | null {
  if (!isObject(log)) return null;
  const gaze = isObject(log.gaze) ? log.gaze : null;
  const quality = isObject(log.quality) ? log.quality : null;
  if (!gaze || !quality) return null;

  const capturedPoints = points(gaze.processedPoints);
  const capturedFrames = frames(gaze.frames);
  if (capturedPoints.length < 30 || capturedFrames.length < 30) return null;

  const faceRate = number(quality.faceRate);
  const gazeDropout = number(quality.gazeDropout);
  if (faceRate === null || gazeDropout === null) return null;

  const calibration = isObject(log.calibration) ? log.calibration : null;
  return {
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
  };
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
