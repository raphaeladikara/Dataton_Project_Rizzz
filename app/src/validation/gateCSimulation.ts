export type GateCSimulationInput = {
  cohortSize: number;
  prevalence: number;
  technicalCoverage: number;
  sensitivity: number;
  specificity: number;
};

export type GateCSimulation = GateCSimulationInput & {
  status: "simulation_only_not_clinical_validation";
  threshold: 0.476;
  assessable: number;
  withheld: number;
  truePositive: number;
  falseNegative: number;
  trueNegative: number;
  falsePositive: number;
  referralRate: number;
  positivePredictiveValue: number;
  negativePredictiveValue: number;
  referralsPerTruePositive: number;
};

export const DEFAULT_GATE_C_SIMULATION: GateCSimulationInput = {
  cohortSize: 1000,
  prevalence: 0.01,
  technicalCoverage: 0.9,
  sensitivity: 0.8462,
  specificity: 0.75,
};

function bounded(value: number, lower: number, upper: number) {
  return Math.min(upper, Math.max(lower, Number.isFinite(value) ? value : lower));
}

export function simulateGateC(input: GateCSimulationInput): GateCSimulation {
  const cohortSize = Math.round(bounded(input.cohortSize, 1, 1_000_000));
  const prevalence = bounded(input.prevalence, 0, 1);
  const technicalCoverage = bounded(input.technicalCoverage, 0, 1);
  const sensitivity = bounded(input.sensitivity, 0, 1);
  const specificity = bounded(input.specificity, 0, 1);
  const assessable = cohortSize * technicalCoverage;
  const conditionPositive = assessable * prevalence;
  const conditionNegative = assessable - conditionPositive;
  const truePositive = conditionPositive * sensitivity;
  const falseNegative = conditionPositive - truePositive;
  const trueNegative = conditionNegative * specificity;
  const falsePositive = conditionNegative - trueNegative;
  const referred = truePositive + falsePositive;
  const notReferred = trueNegative + falseNegative;

  return {
    status: "simulation_only_not_clinical_validation",
    threshold: 0.476,
    cohortSize,
    prevalence,
    technicalCoverage,
    sensitivity,
    specificity,
    assessable,
    withheld: cohortSize - assessable,
    truePositive,
    falseNegative,
    trueNegative,
    falsePositive,
    referralRate: assessable ? referred / assessable : 0,
    positivePredictiveValue: referred ? truePositive / referred : 0,
    negativePredictiveValue: notReferred ? trueNegative / notReferred : 0,
    referralsPerTruePositive: truePositive ? referred / truePositive : Number.POSITIVE_INFINITY,
  };
}
