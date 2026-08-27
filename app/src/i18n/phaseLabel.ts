import type { Locale } from "./locale";

/**
 * Display names for the stimulus phases, keyed by their protocol id.
 *
 * The labels also live in `src/stimulus/protocol.ts`, and they stay there:
 * that module is the protocol definition, its ids and labels are written into
 * the audit log, and the scanpath tests read them. Translating a protocol
 * artifact in place would make the log's contents depend on who was looking at
 * the screen. So the id — which never changes — is what the interface renders
 * from, and this table is the only thing that varies by language.
 *
 * An id with no entry falls back to the protocol's own label, which is
 * Indonesian. That is a visible gap rather than a blank, and a new phase added
 * to the protocol keeps working until someone translates it.
 */
const PHASE_LABELS: Record<Locale, Record<string, string>> = {
  id: {
    baseline: "Perhatian awal",
    geopref_preference: "Pilihan tontonan",
    gaze_left: "Arah mata dan kepala kiri",
    gaze_right: "Arah mata dan kepala kanan",
    pointing_left: "Menunjuk kiri",
    pointing_right: "Menunjuk kanan",
    gaze_left_repeat: "Arah mata dan kepala kiri · ulangan",
    gaze_right_repeat: "Arah mata dan kepala kanan · ulangan",
    pointing_left_repeat: "Menunjuk kiri · ulangan",
    pointing_right_repeat: "Menunjuk kanan · ulangan",
    name_call: "Panggilan nama",
    positive_ending: "Penutup menyenangkan",
  },
  en: {
    baseline: "Initial attention",
    geopref_preference: "Preferential looking",
    gaze_left: "Eye and head direction, left",
    gaze_right: "Eye and head direction, right",
    pointing_left: "Pointing left",
    pointing_right: "Pointing right",
    gaze_left_repeat: "Eye and head direction, left · repeat",
    gaze_right_repeat: "Eye and head direction, right · repeat",
    pointing_left_repeat: "Pointing left · repeat",
    pointing_right_repeat: "Pointing right · repeat",
    name_call: "Name call",
    positive_ending: "Positive ending",
  },
};

export function phaseLabel(id: string, fallback: string, locale: Locale): string {
  return PHASE_LABELS[locale][id] ?? fallback;
}
