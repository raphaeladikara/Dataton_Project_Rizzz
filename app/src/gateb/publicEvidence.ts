export const GATE_B_PUBLIC_EVIDENCE_SCHEMA = "neurogaze-gate-b-public-evidence-v2";

export type GateBPublicEvidence = {
  schema: typeof GATE_B_PUBLIC_EVIDENCE_SCHEMA;
  status: "gate_b_passed" | "gate_b_not_passed";
  publishedAt: string;
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
  metrics: {
    validPairRate: number;
    retryRate: number;
    medianPairErrorPx: number;
    medianPairErrorNorm: number;
    p90PairMedianErrorPx: number;
    meanAoiAgreement: number;
    primaryAoiAgreementCount: number;
    primaryAoiAgreementRate: number;
    meanFeatureIccA1: number;
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
  source: { summary: string; manifest: string; rawDirectory: string };
  terminology: { headlineMetric: string; diagnosticAccuracyAvailable: false };
};
