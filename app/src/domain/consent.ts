import type { SessionAuditLog } from "../audit/sessionLog";

type SessionPurpose = SessionAuditLog["purpose"];

export const CHILD_AGE_MIN_MONTHS = 16;
export const CHILD_AGE_MAX_MONTHS = 30;

export type BridgeConsentInput = {
  pairId: string;
  visitId: string;
  deviceId: string;
  referenceDevice: string;
  screenWidthMm: number;
  screenHeightMm: number;
  viewingDistanceMm: number;
};

export type ConsentInput = {
  purpose: SessionPurpose;
  childId: string;
  ageMonths: string;
  site: string;
  operator: string;
  consented: boolean;
  researchConsent: boolean;
  bridge: BridgeConsentInput | null;
};

/**
 * Every reason the session cannot start yet, phrased for the operator.
 *
 * A kader has a child in front of them and no time to hunt for the field that
 * is holding up a dead button, so the same list drives both the disabled state
 * and the message shown above it. They can never drift apart.
 */
export function consentBlockers(input: ConsentInput): string[] {
  const isEngineering = input.purpose === "gate_a_adult" || input.purpose === "gate_b_bridge";
  // A stage demonstration runs the child flow on a consenting adult, so it
  // wants every gate the real session has except the one that asks the
  // participant to be a toddler. Typing an invented age to get past that field
  // would put a false number in the audit log for the sake of a demo.
  const isAdultParticipant = isEngineering || input.purpose === "stage_demo";
  const blockers: string[] = [];

  if (!input.childId.trim()) {
    blockers.push(isAdultParticipant ? "ID peserta pseudonim belum diisi" : "ID anak pseudonim belum diisi");
  }
  if (!input.site.trim()) blockers.push("Lokasi layanan belum diisi");
  if (!input.operator.trim()) blockers.push("ID operator belum diisi");
  if (!input.consented) blockers.push("Persetujuan layanan belum dicentang");

  if (!isAdultParticipant) {
    const age = Number(input.ageMonths);
    if (!input.ageMonths.trim() || !Number.isFinite(age) || age < CHILD_AGE_MIN_MONTHS || age > CHILD_AGE_MAX_MONTHS) {
      blockers.push(`Usia harus antara ${CHILD_AGE_MIN_MONTHS} dan ${CHILD_AGE_MAX_MONTHS} bulan`);
    }
  }

  if (input.purpose === "gate_b_bridge") {
    if (!input.researchConsent) blockers.push("Persetujuan riset Gate B belum dicentang");
    const bridge = input.bridge;
    if (!bridge) {
      blockers.push("Metadata pasangan Gate B belum diisi");
    } else {
      if (!bridge.pairId.trim()) blockers.push("ID pasangan belum diisi");
      if (!bridge.visitId.trim()) blockers.push("ID kunjungan belum diisi");
      if (!bridge.deviceId.trim()) blockers.push("ID perangkat belum diisi");
      if (!bridge.referenceDevice.trim()) blockers.push("Perangkat pembanding belum diisi");
      // Viewing geometry converts pixel error into degrees, so a plausible
      // value is required before the pair can be compared at all.
      if (!(bridge.screenWidthMm >= 50)) blockers.push("Lebar layar harus minimal 50 mm");
      if (!(bridge.screenHeightMm >= 50)) blockers.push("Tinggi layar harus minimal 50 mm");
      if (!(bridge.viewingDistanceMm >= 200)) blockers.push("Jarak pandang harus minimal 200 mm");
    }
  }

  return blockers;
}
