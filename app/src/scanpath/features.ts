import type { Point } from "../domain/types";

export const FEATURE_ORDER = [
  "ink_frac",
  "centroid_x",
  "centroid_y",
  "std_x",
  "std_y",
  "span_x",
  "span_y",
  "radial_mean",
  "radial_std",
  "grid_entropy",
  "n_active_cells",
  "bbox_fill",
  "aspect_ratio",
] as const;

const WIDTH = 640;
const HEIGHT = 480;
const GRID = 8;

function mark(mask: Uint8Array, x: number, y: number) {
  for (let oy = -1; oy <= 1; oy += 1) {
    for (let ox = -1; ox <= 1; ox += 1) {
      const px = Math.max(0, Math.min(WIDTH - 1, x + ox));
      const py = Math.max(0, Math.min(HEIGHT - 1, y + oy));
      mask[py * WIDTH + px] = 1;
    }
  }
}

export function rasterizeScanpath(points: Point[]): Uint8Array {
  const mask = new Uint8Array(WIDTH * HEIGHT);
  if (!points.length) return mask;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const x1 = Math.round(current.x * (WIDTH - 1));
    const y1 = Math.round(current.y * (HEIGHT - 1));
    if (index === 0) {
      mark(mask, x1, y1);
      continue;
    }
    const previous = points[index - 1];
    if (
      (current.segment !== undefined && previous.segment !== undefined && current.segment !== previous.segment) ||
      current.t - previous.t > 180
    ) {
      mark(mask, x1, y1);
      continue;
    }
    const x0 = Math.round(previous.x * (WIDTH - 1));
    const y0 = Math.round(previous.y * (HEIGHT - 1));
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let step = 0; step <= steps; step += 1) {
      mark(
        mask,
        Math.round(x0 + ((x1 - x0) * step) / steps),
        Math.round(y0 + ((y1 - y0) * step) / steps),
      );
    }
  }
  return mask;
}

function mean(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values: number[], center: number) {
  return Math.sqrt(
    values.reduce((sum, value) => sum + (value - center) ** 2, 0) /
      values.length,
  );
}

export function geometryFeatures(points: Point[]): Record<string, number> {
  const mask = rasterizeScanpath(points);
  const xs: number[] = [];
  const ys: number[] = [];
  for (let index = 0; index < mask.length; index += 1) {
    if (!mask[index]) continue;
    xs.push((index % WIDTH) / WIDTH);
    ys.push(Math.floor(index / WIDTH) / HEIGHT);
  }
  const inkFrac = xs.length / (WIDTH * HEIGHT);
  if (xs.length < 5) {
    return Object.fromEntries(FEATURE_ORDER.map((name) => [name, name === "ink_frac" ? inkFrac : 0]));
  }
  const centroidX = mean(xs);
  const centroidY = mean(ys);
  const stdX = standardDeviation(xs, centroidX);
  const stdY = standardDeviation(ys, centroidY);
  const spanX = Math.max(...xs) - Math.min(...xs);
  const spanY = Math.max(...ys) - Math.min(...ys);
  const radial = xs.map((x, index) =>
    Math.hypot(x - centroidX, ys[index] - centroidY),
  );
  const radialMean = mean(radial);
  const radialStd = standardDeviation(radial, radialMean);
  const cells = new Array(GRID * GRID).fill(0);
  xs.forEach((x, index) => {
    const gx = Math.min(GRID - 1, Math.floor(x * GRID));
    const gy = Math.min(GRID - 1, Math.floor(ys[index] * GRID));
    cells[gy * GRID + gx] += 1;
  });
  let entropy = 0;
  cells.forEach((count) => {
    if (!count) return;
    const probability = count / xs.length;
    entropy -= probability * Math.log(probability);
  });
  entropy /= Math.log(GRID * GRID);
  return {
    ink_frac: inkFrac,
    centroid_x: centroidX,
    centroid_y: centroidY,
    std_x: stdX,
    std_y: stdY,
    span_x: spanX,
    span_y: spanY,
    radial_mean: radialMean,
    radial_std: radialStd,
    grid_entropy: entropy,
    n_active_cells: cells.filter(Boolean).length / (GRID * GRID),
    bbox_fill: inkFrac / Math.max(spanX * spanY, 1e-9),
    aspect_ratio: spanX / Math.max(spanY, 1e-9),
  };
}
