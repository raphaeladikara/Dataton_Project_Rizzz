import type { Quality } from "../domain/types";
import { DEFAULT_LOCALE, type Locale } from "../i18n/locale";

const COPY: Record<Locale, {
  faceRate: (percent: string) => string;
  dropout: (percent: string) => string;
  calibration: (deg: string, limit: number) => string;
  tooDark: string;
  tooBright: string;
  samples: (count: number) => string;
  coverage: (percent: string) => string;
  saturation: (percent: string) => string;
  phaseCoverage: (percent: string) => string;
  ood: (features: string) => string;
}> = {
  id: {
    faceRate: (percent) => `Wajah/mata terdeteksi ${percent}%; ambang 85%.`,
    dropout: (percent) => `Sampel tatapan yang hilang ${percent}%; batas 20%.`,
    calibration: (deg, limit) => `Galat kalibrasi ${deg}°; batas ${limit}°.`,
    tooDark: "Pencahayaan terlalu rendah.",
    tooBright: "Pencahayaan terlalu terang atau wajah terkena silau.",
    samples: (count) => `Sampel tatapan ${count}; minimal 100.`,
    coverage: (percent) => `Cakupan fitur ${percent}%; semua fitur wajib tersedia.`,
    saturation: (percent) =>
      `Pandangan menempel di tepi layar pada ${percent}% sampel; batas 25%. Kalibrasi memetakan sesi ini keluar layar, jadi tidak ada AOI yang dapat terkena.`,
    phaseCoverage: (percent) =>
      `Cakupan fase stimulus ${percent}%; setiap fase perlu minimal 8 sampel.`,
    ood: (features) => `Data sesi berada di luar rentang referensi: ${features}.`,
  },
  en: {
    faceRate: (percent) => `Face/eyes detected in ${percent}% of frames; threshold 85%.`,
    dropout: (percent) => `${percent}% of gaze samples lost; limit 20%.`,
    calibration: (deg, limit) => `Calibration error ${deg}°; limit ${limit}°.`,
    tooDark: "The lighting is too low.",
    tooBright: "The lighting is too bright, or there is glare on the face.",
    samples: (count) => `${count} gaze samples; minimum 100.`,
    coverage: (percent) => `Feature coverage ${percent}%; every feature is required.`,
    saturation: (percent) =>
      `Gaze stuck to the screen edge on ${percent}% of samples; limit 25%. The calibration maps this session off-screen, so no AOI can be hit.`,
    phaseCoverage: (percent) =>
      `Stimulus phase coverage ${percent}%; each phase needs at least 8 samples.`,
    ood: (features) => `Session data falls outside the reference range: ${features}.`,
  },
};
export function evaluateQuality(
  input: Omit<Quality, "reasons" | "passed">,
  locale: Locale = DEFAULT_LOCALE,
): Quality {
  const reasons: string[] = [];
  const copy = COPY[locale];
  if (input.faceRate < 0.85)
    reasons.push(copy.faceRate((input.faceRate * 100).toFixed(0)));
  if (input.gazeDropout > 0.2)
    reasons.push(copy.dropout((input.gazeDropout * 100).toFixed(0)));
  const calibrationLimitDeg = input.calibrationLimitDeg ?? 5;
  if (input.calibrationErrorDeg > calibrationLimitDeg)
    reasons.push(copy.calibration(input.calibrationErrorDeg.toFixed(1), calibrationLimitDeg));
  if (input.brightness < 0.22)
    reasons.push(copy.tooDark);
  if (input.brightness > 0.92)
    reasons.push(copy.tooBright);
  if (input.sampleCount < 100)
    reasons.push(copy.samples(input.sampleCount));
  if (input.coverage !== undefined && input.coverage < 1)
    reasons.push(copy.coverage((input.coverage * 100).toFixed(0)));
  // Every AOI in the atlas begins at least 0.14 in from the nearest edge, so a
  // sample the calibration pinned to an edge cannot land in one. Below this
  // share the edge samples are plausible looking-away; above it the vertical or
  // horizontal mapping has run out of range and the session measures nothing —
  // which is exactly what it looked like before this gate existed, because the
  // projection was clamped before any gate could see it.
  if (input.gazeSaturationRate !== undefined && input.gazeSaturationRate > 0.25)
    reasons.push(copy.saturation((input.gazeSaturationRate * 100).toFixed(0)));
  if (input.phaseCoverage !== undefined && input.phaseCoverage < 1)
    reasons.push(copy.phaseCoverage((input.phaseCoverage * 100).toFixed(0)));
  if (input.oodFlaggedFeatures?.length)
    reasons.push(copy.ood(input.oodFlaggedFeatures.join(", ")));
  return { ...input, reasons, passed: reasons.length === 0 };
}
