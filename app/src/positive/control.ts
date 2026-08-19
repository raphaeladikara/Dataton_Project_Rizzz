import type { GeoprefOutcome } from "../geopref/score";
import { nameCallTimeline, type StimulusPhase } from "../stimulus/protocol";
import {
  buildReferralRecommendation,
  type ReferralInput,
  type ReferralRecommendation,
  type ReferralSignalId,
  type SignalStatus,
} from "../outcome/referralRecommendation";

/**
 * The positive control (docs/kontrol_positif.md).
 *
 * Adults produce the three decision patterns on purpose so we can show the
 * instrument responds to them at all. It proves responsiveness, never accuracy,
 * and never says anything about the adult who sat for it.
 */
export type PositiveControlCondition = "biasa" | "produksi";

export type PositiveControlMeta = {
  condition: PositiveControlCondition;
  attempt: number;
  /**
   * Whether a speaker placed behind the participant delivered the name calls.
   *
   * Two declared modes rather than one inferred from whether a name was typed.
   * Absent on sessions recorded before the flag existed, which is why it reads
   * as false here and as "not declared" in the log checker: those recordings
   * cannot say which rig they used.
   */
  speakerBehind?: boolean;
};

/**
 * Three tries per participant per condition, then the participant is recorded
 * as unassessable. Going further turns a positive control into result picking.
 */
export const MAX_POSITIVE_CONTROL_ATTEMPTS = 3;

export function positiveControlBlockers(
  meta: PositiveControlMeta,
  session: { callName: string } = { callName: "" },
): string[] {
  if (!Number.isInteger(meta.attempt) || meta.attempt < 1) {
    return ["Nomor percobaan harus 1, 2, atau 3"];
  }
  if (meta.attempt > MAX_POSITIVE_CONTROL_ATTEMPTS) {
    return [`Percobaan maksimal ${MAX_POSITIVE_CONTROL_ATTEMPTS} per peserta per kondisi`];
  }
  // The name only matters once a speaker is declared. Without one no call is
  // delivered at all, so an empty field is the correct state rather than a
  // missing one — and never a reason to stop a session at a Posyandu table.
  if (meta.speakerBehind && !session.callName.trim()) {
    return ["Speaker dipakai tetapi nama panggilan belum diisi"];
  }
  return [];
}

/**
 * One canonical name per recording, derived rather than typed. The condition is
 * the axis the whole analysis contrasts, so a mistyped filename is a silently
 * wrong result.
 */
export function positiveControlFileName(participantId: string, meta: PositiveControlMeta): string {
  const slug = participantId.trim().toLowerCase().replace(/[\s_]+/g, "-").replace(/[^a-z0-9-]/g, "");
  return `${slug}-${meta.condition}-${meta.attempt}.json`;
}

/**
 * The calls this session should deliver.
 *
 * Empty without a declared speaker: the published paradigm needs the voice to
 * come from outside the participant's field of view, so a call played through
 * the tablet measures nothing and is better not delivered than delivered and
 * misread. Anchored to the battery clock, because the frame trace is stamped
 * from the start of the battery while the raw offsets are phase-relative.
 */
export function sessionNameCalls(
  meta: Pick<PositiveControlMeta, "speakerBehind"> | null,
  phases: readonly StimulusPhase[],
): { index: number; offsetMs: number }[] {
  return meta?.speakerBehind ? [...nameCallTimeline(phases)] : [];
}

export type PositiveControlSummary = {
  condition: PositiveControlCondition;
  attempt: number;
  signals: { id: ReferralSignalId; status: SignalStatus }[];
  geoprefOutcome: GeoprefOutcome | null;
  /** Whether the composite rule would fire on these signals. */
  compositeWouldFire: boolean;
  /** Never. An adult producing a pattern on request is not a referral. */
  emitsReferral: false;
  scope: "instrument_response_adult_produced_pattern";
};

export function summarizePositiveControl(input: {
  meta: PositiveControlMeta;
  referral: ReferralRecommendation;
  geoprefOutcome: GeoprefOutcome | null;
}): PositiveControlSummary {
  return {
    condition: input.meta.condition,
    attempt: input.meta.attempt,
    signals: input.referral.signals.map((item) => ({ id: item.id, status: item.status })),
    geoprefOutcome: input.geoprefOutcome,
    compositeWouldFire: input.referral.recommendsFollowUp,
    emitsReferral: false,
    scope: "instrument_response_adult_produced_pattern",
  };
}

/**
 * The block written into the audit log at the end of a session.
 *
 * Takes the session's own products rather than anything read off component
 * state: the audit is committed inside the same call that captures the points,
 * so the memos feeding the report still describe the session that had not
 * started yet. Reading those yields three unassessable signals and a null
 * outcome for every session ever recorded.
 */
export function positiveControlFromSession(input: {
  meta: PositiveControlMeta;
  geopref: ReferralInput["geopref"];
  jointAttention: ReferralInput["jointAttention"];
}): PositiveControlSummary {
  return summarizePositiveControl({
    meta: input.meta,
    referral: buildReferralRecommendation({
      geopref: input.geopref,
      jointAttention: input.jointAttention,
    }),
    geoprefOutcome: input.geopref?.outcome ?? null,
  });
}

export type StimulusIntroCopy = {
  audience: string;
  task: string;
  detail: string;
  steps: string[];
};

/**
 * What the participant reads before the battery starts.
 *
 * A positive control gets a screen that names no task. Condition 1 is only
 * "menonton biasa" while the participant does not know the directional cues are
 * being measured, and condition 2 asks them to withhold the exact response the
 * Gate A screen asks for. The instructions arrive from the operator's script
 * instead, which is the only place they can differ per condition.
 */
export function stimulusIntroCopy(input: {
  engineering: boolean;
  positiveControl: PositiveControlMeta | null;
  gateB?: boolean;
}): StimulusIntroCopy {
  if (input.positiveControl) {
    return {
      audience: "Peserta dewasa · kontrol positif",
      task: "Duduk santai dan lihat layar.",
      detail: "Instruksi untuk sesi ini sudah disampaikan operator secara lisan. Tidak ada yang perlu diklik.",
      steps: ["Duduk santai", "Lihat layar", "Tanpa klik"],
    };
  }
  if (input.engineering) {
    return {
      audience: `Peserta dewasa · ${input.gateB ? "Gate B" : "Gate A"}`,
      task: "Ikuti petunjuk sosial di layar.",
      detail: "Amati wajah, lalu ikuti arah mata, kepala, atau tangan ke benda yang dituju. Tidak perlu mengklik.",
      steps: ["Lihat wajah", "Ikuti arah cue", "Tanpa klik"],
    };
  }
  return {
    audience: "Instruksi untuk pengasuh",
    task: "Tugas anak hanya menonton.",
    detail: "Posisikan anak dengan nyaman dan biarkan responsnya alami. Jangan menyebut sisi layar, warna, atau meminta anak melihat ke arah tertentu.",
    steps: ["Duduk nyaman", "Biarkan menonton", "Tanpa mengarahkan"],
  };
}
