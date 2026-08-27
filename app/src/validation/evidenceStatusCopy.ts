import type { Locale } from "../i18n/locale";
import { GATE_EVIDENCE_STATUS } from "./evidenceStatus";

/**
 * English reading of the gate status block.
 *
 * `GATE_EVIDENCE_STATUS` stays as it is: it is the canonical statement of what
 * each gate has and has not established, several tests assert on it, and it is
 * quoted verbatim in the paper. Keying the translation off the gate id leaves
 * that constant untouched and gives an English reviewer the same four claims.
 */
type GateId = (typeof GATE_EVIDENCE_STATUS.gates)[number]["id"];

type GateCopy = {
  statusLabel: string;
  title: string;
  statement: string;
};

const EN: Record<GateId, GateCopy> = {
  A: {
    statusLabel: "Passed",
    title: "Camera acquisition and gaze direction",
    statement: "Passed technical validation across 100 web app sessions in an adult cohort.",
  },
  B: {
    statusLabel: "Passed",
    title: "Agreement against WebGazer.js",
    statement:
      "Passed the agreement test between the Neurogaze gaze stream and WebGazer.js across simultaneous browser sessions.",
  },
  C: {
    statusLabel: "No prospective test yet",
    title: "Clinical validation in the target population",
    statement:
      "A retrospective model exists, but the clinical claim awaits a prospective toddler cohort with an independent reference outcome.",
  },
  D: {
    statusLabel: "No field test yet",
    title: "Operational feasibility",
    statement:
      "The operational flow is ready to test, but there is no Posyandu implementation study yet.",
  },
};

export function gateCopy(id: GateId, locale: Locale): GateCopy {
  const gate = GATE_EVIDENCE_STATUS.gates.find((item) => item.id === id);
  if (locale === "id" || !gate) {
    return {
      statusLabel: gate?.statusLabel ?? "",
      title: gate?.title ?? id,
      statement: gate?.statement ?? "",
    };
  }
  return EN[id] ?? { statusLabel: gate.statusLabel, title: gate.title, statement: gate.statement };
}
