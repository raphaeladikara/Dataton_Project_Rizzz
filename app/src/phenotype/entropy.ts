const MIN_LENGTH = 20;
/**
 * Sample entropy is O(n^2). A 66 s session at 30 fps yields ~2000 frames, which
 * would cost millions of comparisons per scale on a Posyandu tablet. Uniformly
 * subsampling to 600 points keeps the estimate stable and the cost bounded.
 */
const MAX_LENGTH = 600;

function subsample(series: number[]): number[] {
  if (series.length <= MAX_LENGTH) return series;
  const stride = series.length / MAX_LENGTH;
  return Array.from({ length: MAX_LENGTH }, (_, index) => series[Math.floor(index * stride)]);
}

function standardDeviation(series: number[]): number {
  if (series.length < 2) return 0;
  const mean = series.reduce((sum, value) => sum + value, 0) / series.length;
  const variance = series.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (series.length - 1);
  return Math.sqrt(variance);
}

/**
 * Richman & Moorman sample entropy with the conventional m = 2 and
 * r = 0.2 * SD. A constant series has no variability to describe, so it is
 * defined as 0 rather than allowed to produce NaN or Infinity.
 */
export function sampleEntropy(input: number[], m = 2, rFactor = 0.2): number {
  if (input.length < MIN_LENGTH) return 0;
  const series = subsample(input);
  const r = rFactor * standardDeviation(series);
  if (r <= 0) return 0;

  const count = (length: number): number => {
    let matches = 0;
    const vectors: number[][] = [];
    for (let i = 0; i + length <= series.length; i += 1) vectors.push(series.slice(i, i + length));
    for (let i = 0; i < vectors.length; i += 1) {
      for (let j = i + 1; j < vectors.length; j += 1) {
        let within = true;
        for (let k = 0; k < length; k += 1) {
          if (Math.abs(vectors[i][k] - vectors[j][k]) > r) { within = false; break; }
        }
        if (within) matches += 1;
      }
    }
    return matches;
  };

  const a = count(m + 1);
  const b = count(m);
  if (b === 0 || a === 0) return 0;
  return -Math.log(a / b);
}

export function coarseGrain(series: number[], scale: number): number[] {
  if (scale <= 1) return [...series];
  const out: number[] = [];
  for (let i = 0; i + scale <= series.length; i += scale) {
    let sum = 0;
    for (let k = 0; k < scale; k += 1) sum += series[i + k];
    out.push(sum / scale);
  }
  return out;
}

export function multiscaleEntropy(series: number[], scales = 4): number[] {
  return Array.from({ length: scales }, (_, index) => sampleEntropy(coarseGrain(series, index + 1)));
}
