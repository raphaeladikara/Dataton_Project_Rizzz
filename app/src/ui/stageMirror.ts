import { DEFAULT_LOCALE, type Locale } from "../i18n/locale";
/**
 * The presenter-facing mirror, alive only during a stage demonstration.
 *
 * The battery runs 67 seconds and the product rule is that nothing competes
 * with the stimulus on the child's screen — no chrome, no operator affordances.
 * That rule is right for a Posyandu table and wrong for a stage, where 67
 * silent seconds is a ninth of a ten minute pitch spent watching a video and
 * the audience has no way to tell the system is doing anything at all.
 *
 * `stage_demo` is not a field session: the participant is a consenting adult,
 * the threshold is applied under a banner, and `emitsReferral` is hard-coded
 * false. So the mirror lives there and only there. `isStageDemo` is the single
 * gate, and stage-mirror.test.ts holds it shut for every other purpose.
 *
 * It reads state the run already keeps. Nothing here samples the camera, writes
 * to the audit log, or changes a measurement.
 */

export type StageMirrorInput = {
  /** The one gate. Any other purpose returns null. */
  isStageDemo: boolean;
  /** Only while the battery is actually running. */
  running: boolean;
  paused: boolean;
  phaseLabel: string | null;
  phaseId: string | null;
  /** 0-100, the same value the progress bar reads. */
  progress: number;
  totalSeconds: number;
  /** Null when no face is in frame this instant. */
  tracking: { accepted: boolean; eyeOpen: number } | null;
  cueActive: boolean;
  ostensiveActive: boolean;
};

export type StageMirrorRow = {
  id: "phase" | "signal" | "cue" | "elapsed";
  label: string;
  value: string;
  /** Drives emphasis only. Never a measurement. */
  tone: "live" | "waiting" | "lost";
};

export type StageMirror = {
  /** What the presenter can say out loud right now. */
  narration: string;
  rows: [StageMirrorRow, StageMirrorRow, StageMirrorRow, StageMirrorRow];
  /** Printed on the strip so the surface can never be mistaken for a result. */
  notice: string;
};

const COPY: Record<Locale, {
  notice: string;
  cueActive: string;
  cueOstensive: string;
  cueNone: string;
  paused: string;
  faceLost: string;
  recording: (phase: string) => string;
  thisSection: string;
  gazeUnclear: string;
  labelPhase: string;
  labelSignal: string;
  labelCue: string;
  labelElapsed: string;
  phasePreparing: string;
  signalLost: string;
  signalRead: string;
  signalUnread: string;
  elapsed: (seconds: number, total: number) => string;
}> = {
  id: {
    notice: "Cermin panggung · tidak ada angka hasil di sini, dan layar peserta tidak menampilkannya.",
    cueActive: "isyarat arah aktif",
    cueOstensive: "kontak mata pembuka",
    cueNone: "belum ada isyarat",
    paused: "Dijeda. Pengukuran berhenti; tidak ada sampel yang diambil selama jeda.",
    faceLost: "Wajah sedang di luar bingkai. Sampel pada detik-detik ini tidak masuk hitungan.",
    recording: (phase) => `Sedang merekam ${phase}. Arah pandangan terbaca dan tersimpan sebagai sampel.`,
    thisSection: "bagian ini",
    gazeUnclear: "Wajah terlihat, tetapi arah pandangan belum cukup jelas untuk dipakai. Sampelnya ditolak, bukan ditebak.",
    labelPhase: "Bagian",
    labelSignal: "Arah pandangan",
    labelCue: "Isyarat",
    labelElapsed: "Berjalan",
    phasePreparing: "bersiap",
    signalLost: "wajah di luar bingkai",
    signalRead: "terbaca",
    signalUnread: "belum terbaca",
    elapsed: (seconds, total) => `${seconds} / ${total} detik`,
  },
  en: {
    notice: "Stage mirror · no result figures here, and the participant's screen does not show them.",
    cueActive: "directional cue active",
    cueOstensive: "opening eye contact",
    cueNone: "no cue yet",
    paused: "Paused. Measurement has stopped; no samples are taken while paused.",
    faceLost: "The face is out of frame. Samples during these seconds do not count.",
    recording: (phase) => `Recording ${phase}. Gaze direction is reading and being stored as samples.`,
    thisSection: "this section",
    gazeUnclear: "The face is visible, but the gaze direction is not clear enough to use. Those samples are rejected, not guessed.",
    labelPhase: "Section",
    labelSignal: "Gaze direction",
    labelCue: "Cue",
    labelElapsed: "Elapsed",
    phasePreparing: "getting ready",
    signalLost: "face out of frame",
    signalRead: "reading",
    signalUnread: "not reading yet",
    elapsed: (seconds, total) => `${seconds} / ${total} seconds`,
  },
};

function elapsedSeconds(progress: number, totalSeconds: number): number {
  const clamped = Math.min(100, Math.max(0, progress));
  return Math.round((clamped / 100) * totalSeconds);
}

export function buildStageMirror(
  input: StageMirrorInput,
  locale: Locale = DEFAULT_LOCALE,
): StageMirror | null {
  if (!input.isStageDemo || !input.running) return null;
  const copy = COPY[locale];

  const seconds = elapsedSeconds(input.progress, input.totalSeconds);
  const tracked = input.tracking?.accepted === true;
  const cue = input.cueActive
    ? copy.cueActive
    : input.ostensiveActive
      ? copy.cueOstensive
      : copy.cueNone;

  const narration = input.paused
    ? copy.paused
    : !input.tracking
      ? copy.faceLost
      : tracked
        ? copy.recording(input.phaseLabel ?? copy.thisSection)
        : copy.gazeUnclear;

  return {
    narration,
    rows: [
      {
        id: "phase",
        label: copy.labelPhase,
        value: input.phaseLabel ?? copy.phasePreparing,
        tone: input.paused ? "waiting" : "live",
      },
      {
        id: "signal",
        label: copy.labelSignal,
        value: !input.tracking ? copy.signalLost : tracked ? copy.signalRead : copy.signalUnread,
        tone: !input.tracking ? "lost" : tracked ? "live" : "waiting",
      },
      { id: "cue", label: copy.labelCue, value: cue, tone: input.cueActive ? "live" : "waiting" },
      {
        id: "elapsed",
        label: copy.labelElapsed,
        value: copy.elapsed(seconds, input.totalSeconds),
        tone: input.paused ? "waiting" : "live",
      },
    ],
    notice: copy.notice,
  };
}
