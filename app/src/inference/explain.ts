import type { ModelExport } from "../domain/types";

export type ParticipantReference = {
  schemaVersion: 1;
  status: "legacy_descriptive_not_toddler_norm";
  records: number;
  participants: number;
  quantileLevels: number[];
  features: Record<string, number[]>;
};

export type FeatureEvidence = {
  feature: string;
  label: string;
  value: number;
  percentile: number | null;
  contribution: number;
  direction: "raises_demo_score" | "lowers_demo_score";
};

const FEATURE_LABELS: Record<string, string> = {
  ink_frac: "jejak raster aktif",
  centroid_x: "pusat horizontal",
  centroid_y: "pusat vertikal",
  std_x: "dispersi horizontal",
  std_y: "dispersi vertikal",
  span_x: "rentang horizontal",
  span_y: "rentang vertikal",
  radial_mean: "radius sebaran",
  radial_std: "variasi radius",
  grid_entropy: "entropi area",
  n_active_cells: "cakupan grid",
  bbox_fill: "kepadatan area",
  aspect_ratio: "rasio bentang",
};

export function validateParticipantReference(
  candidate: unknown,
): asserts candidate is ParticipantReference {
  if (!candidate || typeof candidate !== "object") throw new Error("Referensi partisipan tidak valid.");
  const reference = candidate as ParticipantReference;
  const levels = reference.quantileLevels;
  if (
    reference.schemaVersion !== 1 ||
    reference.status !== "legacy_descriptive_not_toddler_norm" ||
    reference.records !== 547 ||
    reference.participants !== 54 ||
    !Array.isArray(levels) ||
    levels.length < 3 ||
    levels.some((value, index) => !Number.isFinite(value) || (index > 0 && value < levels[index - 1])) ||
    !reference.features ||
    Object.values(reference.features).some(
      (values) => !Array.isArray(values) || values.length !== levels.length || values.some((value) => !Number.isFinite(value)),
    )
  ) {
    throw new Error("Referensi partisipan tidak lengkap atau tidak kompatibel.");
  }
}

export function percentileFromQuantiles(
  value: number,
  levels: number[],
  quantiles: number[],
): number | null {
  if (!Number.isFinite(value) || levels.length !== quantiles.length || levels.length < 2) return null;
  if (value <= quantiles[0]) return levels[0];
  if (value >= quantiles.at(-1)!) return levels.at(-1)!;
  for (let index = 1; index < quantiles.length; index += 1) {
    if (value > quantiles[index]) continue;
    const lowerValue = quantiles[index - 1];
    const upperValue = quantiles[index];
    const fraction = upperValue === lowerValue ? 0.5 : (value - lowerValue) / (upperValue - lowerValue);
    return levels[index - 1] + fraction * (levels[index] - levels[index - 1]);
  }
  return null;
}

export function explainInference(
  model: ModelExport,
  features: Record<string, number>,
  reference: ParticipantReference | null,
  limit = 3,
): FeatureEvidence[] {
  return model.feature_order
    .map((feature, index) => {
      const value = features[feature];
      const standardized = (value - model.scaler.mean[index]) / model.scaler.scale[index];
      const contribution = standardized * model.classifier.coef[index];
      const quantiles = reference?.features[feature];
      return {
        feature,
        label: FEATURE_LABELS[feature] ?? feature,
        value,
        percentile: reference && quantiles
          ? percentileFromQuantiles(value, reference.quantileLevels, quantiles)
          : null,
        contribution,
        direction: contribution >= 0 ? "raises_demo_score" as const : "lowers_demo_score" as const,
      };
    })
    .filter((item) => Number.isFinite(item.value) && Number.isFinite(item.contribution))
    .sort((left, right) => Math.abs(right.contribution) - Math.abs(left.contribution))
    .slice(0, limit);
}
