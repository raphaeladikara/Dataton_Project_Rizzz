import { DEFAULT_LOCALE, type Locale } from "../i18n/locale";
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

const COPY: Record<Locale, {
  participantId: string;
  childId: string;
  site: string;
  operator: string;
  consent: string;
  age: (min: number, max: number) => string;
  researchConsent: string;
  bridgeMeta: string;
  pairId: string;
  visitId: string;
  deviceId: string;
  referenceDevice: string;
  screenWidth: string;
  screenHeight: string;
  viewingDistance: string;
}> = {
  id: {
    participantId: "ID peserta pseudonim belum diisi",
    childId: "ID anak pseudonim belum diisi",
    site: "Lokasi layanan belum diisi",
    operator: "ID operator belum diisi",
    consent: "Persetujuan layanan belum dicentang",
    age: (min, max) => `Usia harus antara ${min} dan ${max} bulan`,
    researchConsent: "Persetujuan riset Gate B belum dicentang",
    bridgeMeta: "Metadata pasangan Gate B belum diisi",
    pairId: "ID pasangan belum diisi",
    visitId: "ID kunjungan belum diisi",
    deviceId: "ID perangkat belum diisi",
    referenceDevice: "Perangkat pembanding belum diisi",
    screenWidth: "Lebar layar harus minimal 50 mm",
    screenHeight: "Tinggi layar harus minimal 50 mm",
    viewingDistance: "Jarak pandang harus minimal 200 mm",
  },
  en: {
    participantId: "Pseudonymous participant ID is empty",
    childId: "Pseudonymous child ID is empty",
    site: "Service location is empty",
    operator: "Operator ID is empty",
    consent: "Service consent is not ticked",
    age: (min, max) => `Age must be between ${min} and ${max} months`,
    researchConsent: "Gate B research consent is not ticked",
    bridgeMeta: "Gate B pair metadata is empty",
    pairId: "Pair ID is empty",
    visitId: "Visit ID is empty",
    deviceId: "Device ID is empty",
    referenceDevice: "Reference device is empty",
    screenWidth: "Screen width must be at least 50 mm",
    screenHeight: "Screen height must be at least 50 mm",
    viewingDistance: "Viewing distance must be at least 200 mm",
  },
};

export function consentBlockers(
  input: ConsentInput,
  locale: Locale = DEFAULT_LOCALE,
): string[] {
  const copy = COPY[locale];
  const isEngineering = input.purpose === "gate_a_adult" || input.purpose === "gate_b_bridge";
  // A stage demonstration runs the child flow on a consenting adult, so it
  // wants every gate the real session has except the one that asks the
  // participant to be a toddler. Typing an invented age to get past that field
  // would put a false number in the audit log for the sake of a demo.
  const isAdultParticipant = isEngineering || input.purpose === "stage_demo";
  const blockers: string[] = [];

  if (!input.childId.trim()) {
    blockers.push(isAdultParticipant ? copy.participantId : copy.childId);
  }
  if (!input.site.trim()) blockers.push(copy.site);
  if (!input.operator.trim()) blockers.push(copy.operator);
  if (!input.consented) blockers.push(copy.consent);

  if (!isAdultParticipant) {
    const age = Number(input.ageMonths);
    if (!input.ageMonths.trim() || !Number.isFinite(age) || age < CHILD_AGE_MIN_MONTHS || age > CHILD_AGE_MAX_MONTHS) {
      blockers.push(copy.age(CHILD_AGE_MIN_MONTHS, CHILD_AGE_MAX_MONTHS));
    }
  }

  if (input.purpose === "gate_b_bridge") {
    if (!input.researchConsent) blockers.push(copy.researchConsent);
    const bridge = input.bridge;
    if (!bridge) {
      blockers.push(copy.bridgeMeta);
    } else {
      if (!bridge.pairId.trim()) blockers.push(copy.pairId);
      if (!bridge.visitId.trim()) blockers.push(copy.visitId);
      if (!bridge.deviceId.trim()) blockers.push(copy.deviceId);
      if (!bridge.referenceDevice.trim()) blockers.push(copy.referenceDevice);
      // Viewing geometry converts pixel error into degrees, so a plausible
      // value is required before the pair can be compared at all.
      if (!(bridge.screenWidthMm >= 50)) blockers.push(copy.screenWidth);
      if (!(bridge.screenHeightMm >= 50)) blockers.push(copy.screenHeight);
      if (!(bridge.viewingDistanceMm >= 200)) blockers.push(copy.viewingDistance);
    }
  }

  return blockers;
}
