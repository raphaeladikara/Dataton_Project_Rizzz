import { DEFAULT_LOCALE, type Locale } from "../i18n/locale";

const COPY: Record<Locale, {
  technicalPass: string;
  technicalFail: string;
  refer: string;
  withheld: string;
  demoRefer: string;
  demoNoRefer: string;
  measured: string;
}> = {
  id: {
    technicalPass: "LULUS TEKNIS · TANPA SKOR",
    technicalFail: "BELUM LULUS · TANPA SKOR",
    refer: "PERIKSA LANJUT",
    withheld: "REKAMAN DITAHAN",
    demoRefer: "PERAGAAN · PERIKSA LANJUT",
    demoNoRefer: "PERAGAAN · TANPA REKOMENDASI",
    measured: "TERUKUR",
  },
  en: {
    technicalPass: "TECHNICAL PASS · NO SCORE",
    technicalFail: "NOT PASSED · NO SCORE",
    refer: "EXAMINE FURTHER",
    withheld: "RECORDING WITHHELD",
    demoRefer: "DEMONSTRATION · EXAMINE FURTHER",
    demoNoRefer: "DEMONSTRATION · NO RECOMMENDATION",
    measured: "MEASURED",
  },
};
import type { SessionOutcome } from "./sessionOutcome";

export type ReportBadgeTone = "research" | "refer" | "withheld" | "demonstration" | "monitor";

/**
 * The one line of the report that gets read from across a room.
 *
 * It used to be driven by `emitsReferral` alone. Demonstration mode hard-codes
 * that to false, so a stage session whose composite rule fired printed TERUKUR
 * — the same badge an ordinary session prints — directly above a headline
 * saying a follow-up was suggested. The two halves of a stage demonstration,
 * the produced pattern and the ordinary viewer, were indistinguishable at the
 * only glance most of the audience gets.
 *
 * The demonstration tone stays out of coral, for the same reason
 * `.demonstrationBanner` is slate: a demonstration must not be mistakable at a
 * glance for the field outcome it is imitating. What changes is that it now
 * says which of the two it is demonstrating.
 */
export function reportBadge(input: {
  engineeringStudy: boolean;
  qualityPassed: boolean;
  outcome: SessionOutcome;
  demonstrationMode: boolean;
  recommendsFollowUp: boolean;
}, locale: Locale = DEFAULT_LOCALE): { tone: ReportBadgeTone; label: string } {
  const copy = COPY[locale];
  if (input.engineeringStudy) {
    return {
      tone: "research",
      label: copy[input.qualityPassed ? "technicalPass" : "technicalFail"],
    };
  }
  // A real referral, which only a validated protocol can produce.
  if (input.outcome.emitsReferral) return { tone: "refer", label: copy.refer };
  if (input.outcome.kind === "WITHHELD") return { tone: "withheld", label: copy.withheld };
  if (input.demonstrationMode) {
    // Phrased off the composite rule rather than off a signal count, so the
    // label stays true when one of two signals deviates and the rule still
    // does not fire.
    return input.recommendsFollowUp
      ? { tone: "demonstration", label: copy.demoRefer }
      : { tone: "demonstration", label: copy.demoNoRefer };
  }
  return { tone: "monitor", label: copy.measured };
}
