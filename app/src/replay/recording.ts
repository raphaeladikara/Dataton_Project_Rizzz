import { DEFAULT_LOCALE, type Locale } from "../i18n/locale";
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
  /**
   * The key the recording's counterbalanced choices came from.
   *
   * Replay has to score the panel the participant was actually shown. Drawing a
   * fresh key at replay time draws a fresh side, so the same recording came back
   * as 81% geometric on one run and 19% on the next — the complement, from
   * scoring the other panel. Newer logs carry the key outright; older ones are
   * reproduced from the field their renderer read at the time.
   */
  counterbalanceKey: string;
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
  const counterbalance = isObject(gaze.counterbalance) ? gaze.counterbalance : null;
  const profile = isObject(log.profile) ? log.profile : null;
  const recordedKey =
    (typeof counterbalance?.key === "string" && counterbalance.key)
    // Recordings from before the key was written down: the renderer read the
    // identity field, so that field is the key, uniform value and all.
    || (typeof profile?.childId === "string" && profile.childId)
    || (typeof log.sessionId === "string" && log.sessionId)
    || id;
  return {
    ok: true,
    recording: {
      id,
      counterbalanceKey: recordedKey,
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

/**
 * One registered recording, as the manifest describes it.
 *
 * The label exists because the demo needs to name the condition out loud. Two
 * recordings that differ only by filename read as interchangeable on stage,
 * and they are not: one is a person watching ordinarily and the other is a
 * person producing the pattern on instruction. Picking the wrong one and
 * narrating the other is the single easiest way to mislead a room by accident.
 */
export type RecordingEntry = {
  file: string;
  label: string;
  /** Free text. `biasa` and `produksi` are what the positive control uses. */
  condition?: string;
};

/** Filename without extension, hyphens opened up: `sesi-produksi.json` -> `Sesi produksi`. */
function labelFromFile(file: string): string {
  const base = (file.split("/").pop() ?? file).replace(/\.json$/i, "").replaceAll(/[-_]+/g, " ").trim();
  return base ? base.charAt(0).toUpperCase() + base.slice(1) : file;
}

/**
 * Manifest entries are a filename or an object carrying its label.
 *
 * Both forms stay valid on purpose: every manifest written before labels
 * existed still loads, and a registration that only knows the filename does
 * not have to invent a label to be well-formed.
 */
export function normaliseRecordingEntries(listed: unknown): RecordingEntry[] {
  if (!Array.isArray(listed)) return [];
  const entries: RecordingEntry[] = [];
  for (const item of listed) {
    if (typeof item === "string" && item) {
      entries.push({ file: item, label: labelFromFile(item) });
      continue;
    }
    if (isObject(item) && typeof item.file === "string" && item.file) {
      entries.push({
        file: item.file,
        label: typeof item.label === "string" && item.label ? item.label : labelFromFile(item.file),
        ...(typeof item.condition === "string" && item.condition ? { condition: item.condition } : {}),
      });
    }
  }
  return entries;
}

/** What the manifest lists, without reading any of the recordings themselves. */
export async function loadRecordingManifest(
  manifestUrl: string = RECORDING_MANIFEST_URL,
  fetcher: typeof fetch = fetch,
): Promise<RecordingEntry[]> {
  try {
    const response = await fetcher(manifestUrl, { cache: "no-store" });
    if (!response.ok) return [];
    const manifest: unknown = await response.json();
    return normaliseRecordingEntries(isObject(manifest) ? manifest.recordings : null);
  } catch {
    return [];
  }
}

/** Read one registered recording by filename. */
export async function loadRecording(
  file: string,
  fetcher: typeof fetch = fetch,
): Promise<RecordedSession | null> {
  const url = file.startsWith("/") ? file : `/replay/${file}`;
  try {
    const response = await fetcher(url, { cache: "no-store" });
    if (!response.ok) return null;
    return recordingFromAuditLog(await response.json(), url.split("/").pop() ?? url);
  } catch {
    return null;
  }
}

export type RegisteredReplayOrchestration =
  | { ok: true; recording: RecordedSession }
  | { ok: false; message: string };

/**
 * A registered demonstration may initialize only after its named recording is
 * loaded and validated. Null is a hard stop here; it never crosses into the
 * replay pipeline where null deliberately means "use synthetic points" for the
 * three ordinary preview scenarios.
 */
const LOAD_FAILED: Record<Locale, (label: string) => string> = {
  id: (label) => `Rekaman terdaftar “${label}” tidak dapat dimuat. Periksa berkas replay lalu coba lagi.`,
  en: (label) => `The registered recording “${label}” could not be loaded. Check the replay file, then try again.`,
};

export async function orchestrateRegisteredReplay(
  entry: RecordingEntry,
  initialize: (recording: RecordedSession) => void,
  fetcher: typeof fetch = fetch,
  locale: Locale = DEFAULT_LOCALE,
): Promise<RegisteredReplayOrchestration> {
  const recording = await loadRecording(entry.file, fetcher);
  if (!recording) {
    return {
      ok: false,
      message: LOAD_FAILED[locale](entry.label),
    };
  }
  initialize(recording);
  return { ok: true, recording };
}

export async function loadFirstRecording(
  manifestUrl: string = RECORDING_MANIFEST_URL,
  fetcher: typeof fetch = fetch,
): Promise<RecordedSession | null> {
  const entries = await loadRecordingManifest(manifestUrl, fetcher);
  for (const entry of entries) {
    // A listed file that will not parse is a broken recording, not a reason to
    // abandon the rest of the manifest.
    const recording = await loadRecording(entry.file, fetcher);
    if (recording) return recording;
  }
  return null;
}
