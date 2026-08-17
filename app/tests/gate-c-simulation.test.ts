import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_GATE_C_SIMULATION, simulateGateC } from "../src/validation/gateCSimulation";

test("Gate C simulation projects capacity without claiming clinical validation", () => {
  const result = simulateGateC(DEFAULT_GATE_C_SIMULATION);
  assert.equal(result.status, "simulation_only_not_clinical_validation");
  assert.equal(result.assessable, 900);
  assert.equal(result.withheld, 100);
  assert.equal(result.threshold, 0.476);
  assert.ok(Math.abs(result.truePositive - 7.6158) < 1e-8);
  assert.ok(Math.abs(result.falsePositive - 222.75) < 1e-8);
  assert.ok(Math.abs(result.positivePredictiveValue - 0.0330595) < 1e-6);
  assert.ok(Math.abs(result.referralRate - 0.255962) < 1e-6);
  assert.ok(Math.abs(result.referralsPerTruePositive - 30.2484) < 1e-4);
});

test("Gate C simulation clamps impossible operator inputs", () => {
  const result = simulateGateC({ cohortSize: -5, prevalence: 2, technicalCoverage: -1, sensitivity: 3, specificity: -2 });
  assert.equal(result.cohortSize, 1);
  assert.equal(result.prevalence, 1);
  assert.equal(result.technicalCoverage, 0);
  assert.equal(result.assessable, 0);
});
