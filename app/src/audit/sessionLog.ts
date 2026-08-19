import type { DeviceDiagnostics, Quality } from "../domain/types";
import type { CalibrationDiagnostics } from "../capture/faceLandmarker";
import type { GateBStudyMeta } from "../gateb/studyMeta";
import { positiveControlFileName, type PositiveControlMeta } from "../positive/control";

export type AuditEvent = {
  atMs: number;
  type: string;
  level: "info" | "warning" | "error";
  data?: Record<string, unknown>;
};

export type SessionAuditLog = {
  schemaVersion: 3;
  sessionId: string;
  createdAt: string;
  appVersion: string;
  stimulusVersion: string;
  mode: "replay" | "live";
  purpose: "demo_replay" | "gate_a_adult" | "gate_b_bridge" | "target_population_research";
  profile: { childId: string; ageMonths: number | null; site: string; operator: string };
  privacy: {
    rawMediaStored: false;
    rawLandmarksStored: false;
    derivedGazeExported: boolean;
    researchConsent: boolean;
    storage: "memory_only" | "download_by_operator";
    retention: "until_tab_closed" | "operator_export";
    operatorCanDelete: true;
  };
  environment: {
    userAgent: string;
    viewport: { width: number; height: number; devicePixelRatio: number };
    onlineAtStart: boolean;
    reducedMotion: boolean;
  };
  modelVersion?: string;
  /**
   * Why no scoring model was loaded, when none was. A missing model no longer
   * holds the session, so nothing on screen announces it; this line is the only
   * trace it leaves.
   */
  modelError?: string;
  study?: GateBStudyMeta;
  /**
   * Present only on positive-control sessions. The condition is the axis the
   * whole analysis contrasts, so it rides inside the evidence rather than in a
   * filename an operator types by hand.
   */
  positiveControl?: PositiveControlMeta;
  /** Needed to express Gate B error in degrees rather than pixels. */
  viewingGeometry?: ViewingGeometry;
  device?: DeviceDiagnostics;
  calibration?: CalibrationDiagnostics;
  quality?: Quality;
  gaze?: Record<string, unknown>;
  assessment?: Record<string, unknown>;
  events: AuditEvent[];
};

export type ViewingGeometry = {
  screenWidthMm: number;
  screenHeightMm: number;
  viewingDistanceMm: number;
  deviceId: string;
  referenceDevice: string;
};

export function createSessionAudit(input: {
  appVersion: string;
  stimulusVersion: string;
  mode: "replay" | "live";
  purpose: SessionAuditLog["purpose"];
  profile: { childId: string; age: string; site: string; operator: string };
  researchConsent: boolean;
  modelVersion?: string;
  modelError?: string;
  study?: GateBStudyMeta;
  positiveControl?: PositiveControlMeta;
  viewingGeometry?: ViewingGeometry;
}): SessionAuditLog {
  const sessionId = globalThis.crypto?.randomUUID?.() ?? `ng-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const ageText = input.profile.age.trim();
  return {
    schemaVersion: 3,
    sessionId,
    createdAt: new Date().toISOString(),
    appVersion: input.appVersion,
    stimulusVersion: input.stimulusVersion,
    mode: input.mode,
    purpose: input.purpose,
    profile: {
      childId: input.profile.childId.trim(),
      ageMonths: ageText !== "" && Number.isFinite(Number(ageText)) ? Number(ageText) : null,
      site: input.profile.site.trim(),
      operator: input.profile.operator.trim(),
    },
    privacy: {
      rawMediaStored: false,
      rawLandmarksStored: false,
      derivedGazeExported: input.purpose === "gate_b_bridge",
      researchConsent: input.researchConsent,
      storage: "memory_only",
      retention: "until_tab_closed",
      operatorCanDelete: true,
    },
    environment: {
      userAgent: typeof navigator === "undefined" ? "server" : navigator.userAgent,
      viewport: {
        width: typeof window === "undefined" ? 0 : window.innerWidth,
        height: typeof window === "undefined" ? 0 : window.innerHeight,
        devicePixelRatio: typeof window === "undefined" ? 1 : window.devicePixelRatio,
      },
      onlineAtStart: typeof navigator === "undefined" ? true : navigator.onLine,
      reducedMotion: typeof window === "undefined" ? false : window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    },
    modelVersion: input.modelVersion,
    ...(input.modelError ? { modelError: input.modelError } : {}),
    ...(input.study ? { study: input.study } : {}),
    ...(input.positiveControl ? { positiveControl: input.positiveControl } : {}),
    ...(input.viewingGeometry ? { viewingGeometry: input.viewingGeometry } : {}),
    events: [{ atMs: 0, type: "session.created", level: "info" }],
  };
}

export function appendAuditEvent(
  log: SessionAuditLog,
  type: string,
  data?: Record<string, unknown>,
  level: AuditEvent["level"] = "info",
): SessionAuditLog {
  const elapsed = Math.max(0, Date.now() - new Date(log.createdAt).getTime());
  return { ...log, events: [...log.events, { atMs: elapsed, type, level, ...(data ? { data } : {}) }] };
}

export function serializeAuditLog(log: SessionAuditLog): string {
  return `${JSON.stringify(log, null, 2)}\n`;
}

export function auditFilename(log: SessionAuditLog): string {
  // A positive control is filed by participant, condition, and attempt, so the
  // name the operator saves is already the name the protocol asks for.
  if (log.positiveControl) return positiveControlFileName(log.profile.childId, log.positiveControl);
  const safeChild = log.profile.childId.replace(/[^a-z0-9_-]+/gi, "-").slice(0, 32) || "anonymous";
  return `neurogaze-audit-${safeChild}-${log.sessionId.slice(0, 8)}.json`;
}

export function downloadAuditLog(log: SessionAuditLog): void {
  const downloadable: SessionAuditLog = {
    ...log,
    privacy: { ...log.privacy, storage: "download_by_operator", retention: "operator_export" },
  };
  const url = URL.createObjectURL(new Blob([serializeAuditLog(downloadable)], { type: "application/json" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = auditFilename(downloadable);
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
