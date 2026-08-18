export const GATE_B_PUBLIC_EVIDENCE_SCHEMA = "neurogaze-gate-b-public-evidence-v3";

export type GateBPublicEvidence = {
  schema: typeof GATE_B_PUBLIC_EVIDENCE_SCHEMA;
  status: "gate_b_passed" | "gate_b_not_passed";
  publishedAt: string;
  /** The only absolute accuracy the project owns: Gate A, held-out targets, adults. */
  headline: {
    metric: "known_target_median_error_deg";
    valueDeg: number;
    p90Deg: number;
    sessions: number;
    population: string;
    definition: string;
    why: string;
    source: string;
  };
  comparator: { label: string; medianErrorDeg: number; source: string; note: string };
  toddlerReference: { claim: string; source: string; attritionRate: number; attritionNote: string };
  study: {
    title: string;
    protocolVersion: string;
    population: string;
    reference: { library: string; version: string; listenerContract: string; coordinateSpace: string };
    acquisitionMode: string;
    nPairsTotal: number;
    nPairsReady: number;
    nPairsWithheld: number;
  };
  agreement: {
    validPairRate: number;
    retryRate: number;
    medianPairErrorPx: number;
    medianPairErrorNorm: number;
    p90PairMedianErrorPx: number;
    meanAoiAgreement: number;
    meanAoiAgreementRecomputed: number;
    pairsWithAoiClassificationDelta: number;
    primaryAoiAgreementCount: number;
    primaryAoiAgreementRate: number;
    meanFeatureIccA1: number;
    aoiBoxWidthShare: number;
    saturationNote: string;
  };
  featureAgreement: {
    nFeatures: number;
    primaryMetric: "bland_altman_limits_of_agreement";
    meanIccA1: number;
    iccRange: { min: number; max: number };
    iccCaveat: string;
    examples: {
      feature: string;
      iccA1: number;
      blandAltmanMeanDifference: number;
      blandAltmanLower95: number;
      blandAltmanUpper95: number;
      reading: string;
    }[];
  };
  thresholds: {
    minimumPairs: number;
    minimumValidPairRate: number;
    maximumMedianErrorNorm: number;
    minimumMeanAoiAgreement: number;
    minimumPrimaryAoiAgreementRate: number;
  };
  conclusion: string;
  limitations: string[];
  source: {
    summary: string;
    gateASummary: string;
    manifest: string;
    rawDirectory: string;
    generator: string;
  };
  terminology: {
    headlineMetric: string;
    agreementMetric: string;
    diagnosticAccuracyAvailable: false;
  };
};
