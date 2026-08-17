import assert from "node:assert/strict";
import test from "node:test";
import { coarseGrain, multiscaleEntropy, sampleEntropy } from "../src/phenotype/entropy";

test("a perfectly periodic series has near-zero sample entropy", () => {
  const series = Array.from({ length: 200 }, (_, i) => Math.sin(i * Math.PI / 4));
  assert.ok(sampleEntropy(series) < 0.2, `expected low entropy, got ${sampleEntropy(series)}`);
});

test("a varied series has higher entropy than a periodic one", () => {
  const periodic = Array.from({ length: 200 }, (_, i) => Math.sin(i * Math.PI / 4));
  const varied = Array.from({ length: 200 }, (_, i) => Math.sin(i * 0.7) + Math.sin(i * 2.3) * 0.6 + Math.sin(i * 5.1) * 0.3);
  assert.ok(sampleEntropy(varied) > sampleEntropy(periodic));
});

test("a constant series is defined as zero entropy, not NaN", () => {
  assert.equal(sampleEntropy(Array(200).fill(0.5)), 0);
});

test("coarse graining averages non-overlapping windows", () => {
  assert.deepEqual(coarseGrain([1, 3, 5, 7], 2), [2, 6]);
  assert.deepEqual(coarseGrain([1, 2, 3], 1), [1, 2, 3]);
});

test("long series are subsampled so the cost stays bounded on a tablet", () => {
  const long = Array.from({ length: 4000 }, (_, i) => Math.sin(i * 0.13) + Math.sin(i * 0.9) * 0.4);
  const started = Date.now();
  const value = sampleEntropy(long);
  assert.ok(Number.isFinite(value));
  assert.ok(Date.now() - started < 2000, "sample entropy must stay well under 2 s");
});

test("multiscale entropy returns one value per scale and tolerates short series", () => {
  const series = Array.from({ length: 300 }, (_, i) => Math.sin(i * 0.3) + Math.sin(i * 1.7) * 0.4);
  const curve = multiscaleEntropy(series, 4);
  assert.equal(curve.length, 4);
  assert.ok(curve.every((value) => Number.isFinite(value)));
  assert.equal(multiscaleEntropy([1, 2, 3], 4).length, 4);
});
