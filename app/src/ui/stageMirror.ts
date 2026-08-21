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

const NOTICE = "Cermin panggung · tidak ada angka hasil di sini, dan layar peserta tidak menampilkannya.";

function elapsedSeconds(progress: number, totalSeconds: number): number {
  const clamped = Math.min(100, Math.max(0, progress));
  return Math.round((clamped / 100) * totalSeconds);
}

export function buildStageMirror(input: StageMirrorInput): StageMirror | null {
  if (!input.isStageDemo || !input.running) return null;

  const seconds = elapsedSeconds(input.progress, input.totalSeconds);
  const tracked = input.tracking?.accepted === true;
  const cue = input.cueActive
    ? "isyarat arah aktif"
    : input.ostensiveActive
      ? "kontak mata pembuka"
      : "belum ada isyarat";

  const narration = input.paused
    ? "Dijeda. Pengukuran berhenti; tidak ada sampel yang diambil selama jeda."
    : !input.tracking
      ? "Wajah sedang di luar bingkai. Sampel pada detik-detik ini tidak masuk hitungan."
      : tracked
        ? `Sedang merekam ${input.phaseLabel ?? "bagian ini"}. Arah pandangan terbaca dan tersimpan sebagai sampel.`
        : "Wajah terlihat, tetapi arah pandangan belum cukup jelas untuk dipakai. Sampelnya ditolak, bukan ditebak.";

  return {
    narration,
    rows: [
      {
        id: "phase",
        label: "Bagian",
        value: input.phaseLabel ?? "bersiap",
        tone: input.paused ? "waiting" : "live",
      },
      {
        id: "signal",
        label: "Arah pandangan",
        value: !input.tracking ? "wajah di luar bingkai" : tracked ? "terbaca" : "belum terbaca",
        tone: !input.tracking ? "lost" : tracked ? "live" : "waiting",
      },
      { id: "cue", label: "Isyarat", value: cue, tone: input.cueActive ? "live" : "waiting" },
      {
        id: "elapsed",
        label: "Berjalan",
        value: `${seconds} / ${input.totalSeconds} detik`,
        tone: input.paused ? "waiting" : "live",
      },
    ],
    notice: NOTICE,
  };
}
