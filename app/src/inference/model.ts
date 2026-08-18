import type { ModelExport } from "../domain/types";

export function validateModel(model: unknown): asserts model is ModelExport {
  if (!model || typeof model !== "object") throw new Error("Format model tidak valid.");
  const candidate = model as ModelExport;
  const size = candidate.feature_order?.length;
  if (
    candidate.schema_version !== 1 ||
    candidate.feature_set !== "geometri" ||
    !candidate.model_version ||
    size !== 13 ||
    candidate.scaler?.mean?.length !== size ||
    candidate.scaler?.scale?.length !== size ||
    candidate.classifier?.coef?.length !== size ||
    !candidate.scaler.scale.every((value) => Number.isFinite(value) && value > 0) ||
    !Number.isFinite(candidate.classifier.intercept) ||
    !Number.isFinite(candidate.calibrator?.coef) ||
    !Number.isFinite(candidate.calibrator?.intercept) ||
    !Number.isFinite(candidate.decision?.refer_if_probability_gte)
  ) {
    throw new Error("Model lokal tidak lengkap atau tidak kompatibel.");
  }
  const active = candidate.decision.operating_points?.[candidate.decision.default_operating_point];
  if (!active || !Number.isFinite(active.threshold)) {
    throw new Error(
      `Model tidak memuat operating point "${candidate.decision.default_operating_point}".`,
    );
  }
  if (active.threshold !== candidate.decision.refer_if_probability_gte) {
    throw new Error("Ambang model tidak cocok dengan operating point yang dipilih.");
  }
}

function sigmoid(value: number) {
  if (value >= 0) return 1 / (1 + Math.exp(-value));
  const exp = Math.exp(value);
  return exp / (1 + exp);
}

export function infer(
  model: ModelExport,
  features: Record<string, number>,
): number {
  const values = model.feature_order.map((name) => features[name]);
  if (values.some((value) => !Number.isFinite(value))) {
    throw new Error("Fitur inferensi tidak lengkap atau tidak valid.");
  }
  const standardized = values.map(
    (value, index) =>
      (value - model.scaler.mean[index]) / model.scaler.scale[index],
  );
  const score =
    standardized.reduce(
      (sum, value, index) => sum + value * model.classifier.coef[index],
      model.classifier.intercept,
    );
  const raw = Math.min(
    1 - model.calibrator.epsilon,
    Math.max(model.calibrator.epsilon, sigmoid(score)),
  );
  const logit = Math.log(raw / (1 - raw));
  return sigmoid(
    model.calibrator.coef * logit + model.calibrator.intercept,
  );
}
