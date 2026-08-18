export type OodReference = {
  schemaVersion: 1;
  featureSchemaHash: string;
  rule: { robustZMax?: number; outsideQuantileIsFlag: boolean; minimumOutsideFeatures?: number; calibration?: string };
  multivariate?: { featureOrder: string[]; precision: number[][]; distanceMax: number };
  features: Record<string, { median: number; madScale: number; lower: number; upper: number }>;
};

/**
 * Per-feature distance from the reference cohort, worst first.
 *
 * The guard used to report only which features it flagged, which makes the
 * refusal an assertion. Carrying the distance turns it into something a reader
 * can check: this is the feature, this is the session's value, this is the
 * reference median, this is how many robust deviations apart they are.
 */
export type OodFeatureDistance = {
  name: string;
  value: number | null;
  median: number;
  /** null when the session never produced the feature. */
  robustZ: number | null;
  outside: boolean;
};

export type OodAssessment = {
  passed: boolean;
  coverage: number;
  maxRobustZ: number;
  multivariateDistance?: number;
  flaggedFeatures: string[];
  missingFeatures: string[];
  featureDistance: OodFeatureDistance[];
};

export function assessFeatureOod(features: Record<string, number>, reference: OodReference): OodAssessment {
  const names = Object.keys(reference.features);
  const missingFeatures = names.filter((name) => !Number.isFinite(features[name]));
  const robustZ = names.filter((name) => !missingFeatures.includes(name)).map((name) => {
    const spec = reference.features[name];
    return { name, z: Math.abs(features[name] - spec.median) / Math.max(spec.madScale, 1e-9), outside: features[name] < spec.lower || features[name] > spec.upper };
  });
  const severe = reference.rule.robustZMax === undefined ? [] : robustZ.filter((item) => item.z > reference.rule.robustZMax!);
  const outside = robustZ.filter((item) => item.outside);
  const includeOutside = reference.rule.outsideQuantileIsFlag && outside.length >= (reference.rule.minimumOutsideFeatures ?? 1);
  let multivariateDistance: number | undefined;
  let multivariateFailed = false;
  if (reference.multivariate) {
    const vector = reference.multivariate.featureOrder.map((name) => {
      const spec = reference.features[name];
      return Number.isFinite(features[name]) ? (features[name] - spec.median) / Math.max(spec.madScale, 1e-9) : 0;
    });
    multivariateDistance = vector.reduce((sum, left, row) => sum + left * reference.multivariate!.precision[row].reduce((inner, weight, column) => inner + weight * vector[column], 0), 0);
    multivariateFailed = multivariateDistance > reference.multivariate.distanceMax;
  }
  const explanatory = multivariateFailed ? [...robustZ].sort((a, b) => b.z - a.z).slice(0, 3) : [];
  const flaggedFeatures = [...new Set([...severe, ...(includeOutside ? outside : []), ...explanatory].map((item) => item.name))];
  const measured = new Map(robustZ.map((item) => [item.name, item]));
  const featureDistance: OodFeatureDistance[] = names
    .map((name) => {
      const entry = measured.get(name);
      return {
        name,
        value: entry ? features[name] : null,
        median: reference.features[name].median,
        robustZ: entry ? entry.z : null,
        outside: entry ? entry.outside : false,
      };
    })
    // Missing features sort last: an absent feature is a coverage problem, not
    // a distance one, and missingFeatures already names it.
    .sort((left, right) => (right.robustZ ?? -1) - (left.robustZ ?? -1));
  return {
    passed: missingFeatures.length === 0 && flaggedFeatures.length === 0 && !multivariateFailed,
    coverage: names.length ? (names.length - missingFeatures.length) / names.length : 0,
    maxRobustZ: robustZ.length ? Math.max(...robustZ.map((item) => item.z)) : Infinity,
    multivariateDistance,
    flaggedFeatures,
    missingFeatures,
    featureDistance,
  };
}
