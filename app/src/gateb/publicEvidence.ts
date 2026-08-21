export const GATE_B_PUBLIC_EVIDENCE_SCHEMA = "neurogaze-gate-b-public-evidence-v3";

export type GateBPublicEvidence = {
  schema: typeof GATE_B_PUBLIC_EVIDENCE_SCHEMA;
  status: "gate_b_passed" | "gate_b_not_passed";
  publishedAt: string;
  headline: {
    metric: "adult_positive_control";
    title: string;
    summary: string;
    source: string;
  };
  positiveControl: {
    interpretation: "adult_manipulation_check";
    participants: number;
    sessions: { recorded: number; qualityPass: number };
    conditions: {
      ordinary: { recorded: number; usable: number; ruleFired: number };
      produced: { recorded: number; usable: number; ruleFired: number };
    };
    signals: {
      id: string;
      nOrdinary: number;
      nProduced: number;
      medianOrdinary: number;
      medianProduced: number;
      nearestGap: number;
    }[];
    emitsReferral: false;
    boundary: string;
    source: string;
  };
  gateAAccuracy: {
    metric: "legacy_known_target_angle_conversion";
    valueDeg: number;
    p90Deg: number;
    sessions: number;
    population: string;
    definition: string;
    why: string;
    source: string;
  };
  readiness: {
    schema: "neurogaze-readiness-matrix-v1";
    asOf: string;
    clinicalClaimsAvailable: false;
    capabilities: {
      id: string;
      capability: string;
      status: "ready_for_engineering_demo" | "demonstrated" | "withheld" | "not_tested";
      statusLabel: string;
      evidence: string;
      boundary: string;
    }[];
    source: Record<string, string>;
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
