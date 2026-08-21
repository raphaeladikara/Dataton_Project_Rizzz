import type { ReferralRecommendation } from "./referralRecommendation";

export type CompositeLaneHeadlineInput = Pick<
  ReferralRecommendation,
  "headline" | "recommendsFollowUp" | "assessableCount" | "deviantCount"
> & {
  demonstrationMode: boolean;
};

/**
 * Keeps the composite rule's stored outcome intact while making a stage
 * demonstration unmistakable as a simulation on screen and on paper.
 */
export function compositeLaneHeadline(input: CompositeLaneHeadlineInput): string {
  if (!input.demonstrationMode) return input.headline;

  if (input.recommendsFollowUp) {
    return `Pola “disarankan pemeriksaan lanjutan” berhasil diperagakan · ${input.deviantCount} dari ${input.assessableCount} sinyal menyimpang`;
  }

  if (input.assessableCount === 0) {
    return "Pola “belum ada sinyal yang dapat dinilai” berhasil diperagakan";
  }

  if (input.deviantCount === 0) {
    return `Pola “tidak ada sinyal yang menyimpang” berhasil diperagakan · ${input.assessableCount} dari ${input.assessableCount} sinyal dinilai`;
  }

  return `Pola “di bawah batas rekomendasi” berhasil diperagakan · ${input.deviantCount} dari ${input.assessableCount} sinyal menyimpang`;
}
