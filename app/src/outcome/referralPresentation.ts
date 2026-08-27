import type { ReferralRecommendation } from "./referralRecommendation";
import { DEFAULT_LOCALE, type Locale } from "../i18n/locale";

export type CompositeLaneHeadlineInput = Pick<
  ReferralRecommendation,
  "headline" | "recommendsFollowUp" | "assessableCount" | "deviantCount"
> & {
  demonstrationMode: boolean;
};

const COPY: Record<Locale, {
  followUp: (deviant: number, assessable: number) => string;
  noneAssessable: string;
  noDeviation: (assessable: number) => string;
  belowThreshold: (deviant: number, assessable: number) => string;
}> = {
  id: {
    followUp: (deviant, assessable) =>
      `Pola “disarankan pemeriksaan lanjutan” berhasil diperagakan · ${deviant} dari ${assessable} sinyal menyimpang`,
    noneAssessable: "Pola “belum ada sinyal yang dapat dinilai” berhasil diperagakan",
    noDeviation: (assessable) =>
      `Pola “tidak ada sinyal yang menyimpang” berhasil diperagakan · ${assessable} dari ${assessable} sinyal dinilai`,
    belowThreshold: (deviant, assessable) =>
      `Pola “di bawah batas rekomendasi” berhasil diperagakan · ${deviant} dari ${assessable} sinyal menyimpang`,
  },
  en: {
    followUp: (deviant, assessable) =>
      `The “follow-up examination recommended” pattern was demonstrated · ${deviant} of ${assessable} signals deviant`,
    noneAssessable: "The “no assessable signal yet” pattern was demonstrated",
    noDeviation: (assessable) =>
      `The “no signal deviant” pattern was demonstrated · ${assessable} of ${assessable} signals assessed`,
    belowThreshold: (deviant, assessable) =>
      `The “below the recommendation cutoff” pattern was demonstrated · ${deviant} of ${assessable} signals deviant`,
  },
};

/**
 * Keeps the composite rule's stored outcome intact while making a stage
 * demonstration unmistakable as a simulation on screen and on paper.
 *
 * On a field session this returns the rule's own headline untouched, which is
 * already in the caller's language — `buildReferralRecommendation` produced it.
 */
export function compositeLaneHeadline(
  input: CompositeLaneHeadlineInput,
  locale: Locale = DEFAULT_LOCALE,
): string {
  if (!input.demonstrationMode) return input.headline;
  const copy = COPY[locale];

  if (input.recommendsFollowUp) {
    return copy.followUp(input.deviantCount, input.assessableCount);
  }

  if (input.assessableCount === 0) {
    return copy.noneAssessable;
  }

  if (input.deviantCount === 0) {
    return copy.noDeviation(input.assessableCount);
  }

  return copy.belowThreshold(input.deviantCount, input.assessableCount);
}
