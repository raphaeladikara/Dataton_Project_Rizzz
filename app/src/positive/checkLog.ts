import type { SessionAuditLog } from "../audit/sessionLog";
import { positiveControlFileName, type PositiveControlCondition } from "./control";

/**
 * Quality criteria from docs/kontrol_positif.md, which are stricter than the
 * app's own gate in places. A session may pass the gate and still not be usable
 * for the control.
 */
export const SHEET_LIMITS = {
  calibrationErrorDeg: 3.0,
  faceRate: 0.85,
  gazeDropout: 0.2,
  /**
   * Share of samples the calibration pinned to a screen edge. Not in the
   * original criteria list because nothing measured it: the projection was
   * clamped before any gate could see it, so a session that mapped half its
   * battery off the top of the screen reported a clean 1.4 degrees and an empty
   * reasons array.
   */
  gazeSaturationRate: 0.25,
} as const;

export const SHEET_HEADER =
  "peserta,kondisi,percobaan,perangkat,berkas,galat_kalibrasi_deg,laju_frame_valid,dropout,outcome,sinyal_geopref,sinyal_isyarat,sinyal_nama,komposit_menyala,butir_dijalankan,catatan";

export type PositiveControlCheck = {
  ok: boolean;
  failures: string[];
  warnings: string[];
  /** One line for lembar_sesi.csv, so nobody transcribes numbers by hand. */
  sheetRow: string;
};

type LoggedSummary = {
  condition: PositiveControlCondition;
  attempt: number;
  signals: { id: string; status: string }[];
  geoprefOutcome: string | null;
  compositeWouldFire: boolean;
};

const status = (summary: LoggedSummary | null, id: string) =>
  summary?.signals.find((item) => item.id === id)?.status ?? "-";

const number = (value: number | undefined, digits: number) =>
  typeof value === "number" && Number.isFinite(value) ? value.toFixed(digits) : "-";

/**
 * Sessions that cannot be told apart from each other.
 *
 * Two of the twelve first-condition recordings turned out to be one recording
 * downloaded twice, and three more shared a session id with each other because
 * the id was minted on the consent screen rather than per recording. Neither is
 * visible in a single file, so the check has to see the set.
 */
export function findDuplicateSessions(
  logs: { path: string; log: SessionAuditLog }[],
): { reason: string; paths: string[] }[] {
  const bySessionId = new Map<string, string[]>();
  const byContent = new Map<string, string[]>();
  for (const { path, log } of logs) {
    const id = log.sessionId;
    bySessionId.set(id, [...(bySessionId.get(id) ?? []), path]);
    // Two files carrying the same recording carry the same samples. Comparing
    // the trace itself rather than the whole file means a re-download that
    // picked up one extra audit event still reads as the duplicate it is.
    const points = (log.gaze as { processedPoints?: { t: number; x: number; y: number }[] } | undefined)?.processedPoints ?? [];
    const fingerprint = `${points.length}|${points.slice(0, 24).map((point) => `${point.t}:${point.x.toFixed(6)}:${point.y.toFixed(6)}`).join(",")}`;
    if (points.length) byContent.set(fingerprint, [...(byContent.get(fingerprint) ?? []), path]);
  }
  const findings: { reason: string; paths: string[] }[] = [];
  for (const paths of byContent.values()) {
    if (paths.length > 1) findings.push({ reason: "jejak pandangannya identik: satu rekaman, beberapa berkas", paths });
  }
  const alreadyPaired = new Set(findings.flatMap((finding) => finding.paths.join("|")));
  for (const [id, paths] of bySessionId) {
    if (paths.length > 1 && !alreadyPaired.has(paths.join("|"))) {
      findings.push({ reason: `berbagi sessionId ${id.slice(0, 8)} tetapi isinya berbeda: rekaman berbeda yang tidak dapat dibedakan di log`, paths });
    }
  }
  return findings;
}

export function checkPositiveControlLog(log: SessionAuditLog): PositiveControlCheck {
  const failures: string[] = [];
  const warnings: string[] = [];

  const meta = log.positiveControl ?? null;
  if (!meta) failures.push("Log ini tidak ditandai kontrol positif; jenis sesi tidak dipilih di layar persetujuan.");
  if (log.purpose !== "gate_a_adult") failures.push(`Sesi dijalankan dengan purpose "${log.purpose}", bukan gate_a_adult.`);

  // A frame trace is what the pose signals are read from, and replay never
  // produces one. Its absence means the session was not a camera session.
  const frames = (log.gaze as { frames?: unknown[] } | undefined)?.frames;
  if (log.mode !== "live" || !Array.isArray(frames) || frames.length === 0) {
    failures.push("Tidak ada jejak frame: sesi ini bukan sesi kamera langsung dan tidak dapat dipakai.");
  }

  const calls = log.events.filter((event) => event.type === "stimulus.name_called");
  const silent = calls.filter((event) => (event.data as { spoken?: boolean } | undefined)?.spoken !== true);
  const speaker = meta ? meta.speakerBehind : undefined;

  if (meta && speaker === undefined) {
    warnings.push(
      "Mode speaker tidak dideklarasikan di log ini, jadi tidak dapat dipastikan apakah panggilan nama terukur. Rekaman sebelum penanda ini ada.",
    );
  }
  if (speaker === true && calls.length === 0) {
    // The two must agree or the evidence contradicts itself about its own rig.
    failures.push("Log menyatakan speaker dipakai tetapi tidak ada panggilan nama yang terekam.");
  }
  if (speaker === false && calls.length > 0) {
    failures.push("Log menyatakan speaker tidak dipakai tetapi panggilan nama tetap terekam.");
  }
  // Response to name is quarantined out of the rule in both modes, so a silent
  // call empties a descriptive index rather than invalidating the session.
  if (speaker === true && silent.length) {
    warnings.push(
      `${silent.length} dari ${calls.length} panggilan nama tidak berbunyi, jadi indeks respons nama kosong. Sinyal ini dikarantina, sesi tetap sah.`,
    );
  }
  const nameIndex = (log.gaze as { responseToName?: { callsDelivered?: number; responses?: number } } | undefined)?.responseToName;
  if (speaker === true && nameIndex && (nameIndex.callsDelivered ?? 0) > 0 && nameIndex.responses === 0) {
    warnings.push(
      "Speaker dipakai tetapi tidak ada satu pun tolehan terekam. Periksa penempatan speaker, volumenya, dan apakah ia terlihat peserta.",
    );
  }

  const quality = log.quality;
  if (!quality) {
    failures.push("Log tidak memuat blok quality; sesi tidak selesai sampai pemeriksaan.");
  } else {
    if (quality.calibrationErrorDeg > SHEET_LIMITS.calibrationErrorDeg)
      failures.push(`Galat kalibrasi ${quality.calibrationErrorDeg.toFixed(2)}° melewati batas ${SHEET_LIMITS.calibrationErrorDeg}°.`);
    if (quality.faceRate < SHEET_LIMITS.faceRate)
      failures.push(`Laju frame valid ${quality.faceRate.toFixed(2)} di bawah batas ${SHEET_LIMITS.faceRate}.`);
    if (quality.gazeDropout > SHEET_LIMITS.gazeDropout)
      failures.push(`Dropout gaze ${quality.gazeDropout.toFixed(2)} melewati batas ${SHEET_LIMITS.gazeDropout}.`);
    if (quality.gazeSaturationRate === undefined) {
      warnings.push("Log ini tidak memuat laju saturasi pandangan; direkam sebelum ukuran itu ada, jadi sesi keluar-layar tidak dapat dikesampingkan.");
    } else if (quality.gazeSaturationRate > SHEET_LIMITS.gazeSaturationRate) {
      failures.push(
        `Pandangan menempel di tepi layar pada ${(quality.gazeSaturationRate * 100).toFixed(0)}% sampel; batas ${SHEET_LIMITS.gazeSaturationRate * 100}%. Tidak ada AOI yang dapat terkena, jadi sesi ini tidak mengukur apa pun.`,
      );
    }
  }

  const summary = ((log.assessment as { positiveControl?: LoggedSummary } | undefined)?.positiveControl ?? null);
  if (meta && !summary) {
    failures.push("Blok assessment.positiveControl tidak ada; laporan tidak membaca sesi yang baru berjalan.");
  }

  const counterbalance = (log.gaze as { counterbalance?: { key?: string } } | undefined)?.counterbalance;
  if (!counterbalance) {
    warnings.push(
      "Log tidak mencatat sisi panel maupun urutan isyarat yang dijalankan. Rekaman sebelum penanda ini menurunkannya dari kolom identitas, jadi sesi yang berbagi identitas juga berbagi seluruh counterbalancing-nya.",
    );
  }

  if (log.modelError) warnings.push(`Model skoring tidak dimuat: ${log.modelError} Sesi tetap sah untuk kontrol positif.`);
  if (!/^kp-/i.test(log.profile.childId.trim()))
    warnings.push(`ID peserta "${log.profile.childId}" tidak mengikuti pola KP-xx, jadi nama berkasnya juga tidak.`);

  const cells = [
    log.profile.childId,
    meta?.condition ?? "-",
    meta ? String(meta.attempt) : "-",
    log.profile.site,
    meta ? positiveControlFileName(log.profile.childId, meta) : "-",
    number(quality?.calibrationErrorDeg, 2),
    number(quality?.faceRate, 2),
    number(quality?.gazeDropout, 2),
    summary?.geoprefOutcome ?? "-",
    status(summary, "geometric_preference"),
    status(summary, "cue_following"),
    // Measured and reported, never counted. See QUARANTINED_SIGNALS.
    speaker === true
      ? `dikarantina (${nameIndex?.responses ?? 0}/${nameIndex?.callsDelivered ?? 0})`
      : speaker === false
        ? "tidak_dipakai"
        : "dikarantina",
    summary ? (summary.compositeWouldFire ? "ya" : "tidak") : "-",
    meta?.condition === "produksi" ? "" : "-",
    "",
  ];

  return { ok: failures.length === 0, failures, warnings, sheetRow: cells.join(",") };
}
