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
  if (!calls.length) {
    failures.push("Tidak ada panggilan nama yang terekam sama sekali.");
  } else if (silent.length) {
    failures.push(
      `${silent.length} dari ${calls.length} panggilan nama tidak berbunyi. Isi kolom nama panggilan dan periksa volume.`,
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
  }

  const summary = ((log.assessment as { positiveControl?: LoggedSummary } | undefined)?.positiveControl ?? null);
  if (meta && !summary) {
    failures.push("Blok assessment.positiveControl tidak ada; laporan tidak membaca sesi yang baru berjalan.");
  }

  const nameStatus = status(summary, "response_to_name");
  // The check that catches a speaker still sitting in front of the participant.
  // An adult told to respond naturally turns towards a voice behind them; nobody
  // turns towards one coming out of the screen they are already watching.
  if (meta?.condition === "biasa" && nameStatus === "menyimpang" && !silent.length) {
    warnings.push(
      "Kondisi 1 tetapi tidak ada tolehan ke panggilan nama. Periksa penempatan speaker: ia harus di belakang peserta dan tidak terlihat.",
    );
  }
  if (meta?.condition === "produksi" && nameStatus === "normal") {
    warnings.push("Kondisi 2 tetapi peserta tetap menoleh saat dipanggil. Butir ketiga naskah kemungkinan tidak dijalankan.");
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
    nameStatus,
    summary ? (summary.compositeWouldFire ? "ya" : "tidak") : "-",
    meta?.condition === "produksi" ? "" : "-",
    "",
  ];

  return { ok: failures.length === 0, failures, warnings, sheetRow: cells.join(",") };
}
