import { writeFile } from "node:fs/promises";
import os from "node:os";
import { performance } from "node:perf_hooks";
import type { ModelExport, Point } from "../src/domain/types";
import { infer } from "../src/inference/model";
import { geometryFeatures } from "../src/scanpath/features";
import modelJson from "../public/models/model.json";

const model = modelJson as ModelExport;
const points: Point[] = Array.from({ length: 360 }, (_, index) => ({
  t: index * 33.333,
  x: 0.5 + Math.sin(index * 0.17) * 0.34,
  y: 0.48 + Math.cos(index * 0.11) * 0.27,
}));
const iterations = 250;
const values: number[] = [];

for (let index = 0; index < 20; index += 1)
  infer(model, geometryFeatures(points));
for (let index = 0; index < iterations; index += 1) {
  const started = performance.now();
  infer(model, geometryFeatures(points));
  values.push(performance.now() - started);
}
values.sort((a, b) => a - b);
const percentile = (p: number) => values[Math.floor((values.length - 1) * p)];
const result = {
  measured_at: new Date().toISOString(),
  environment: {
    type: "desktop_reference_not_tablet",
    platform: os.platform(),
    release: os.release(),
    architecture: os.arch(),
    cpu: os.cpus()[0]?.model,
    logical_cores: os.cpus().length,
    node: process.version,
  },
  workload: "360 gaze points -> 640x480 raster -> 13 geometry features -> calibrated LR",
  iterations,
  latency_ms: {
    median: percentile(0.5),
    p90: percentile(0.9),
    p99: percentile(0.99),
    max: values.at(-1),
  },
  tablet_measurement: {
    status: "pending_physical_android_device",
    harness: "The PWA report records performance.now() extraction+inference latency on every run.",
    claim_allowed: false,
  },
};
await writeFile(
  new URL("../../research/hasil/device_benchmark.json", import.meta.url),
  `${JSON.stringify(result, null, 2)}\n`,
);
console.log(result);
