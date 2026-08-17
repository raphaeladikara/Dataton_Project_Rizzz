import type { Quality } from "../domain/types";

export function evaluateQuality(input: Omit<Quality, "reasons" | "passed">): Quality {
  const reasons: string[] = [];
  if (input.faceRate < 0.85)
    reasons.push(`Wajah/mata terdeteksi ${(input.faceRate * 100).toFixed(0)}%; ambang 85%.`);
  if (input.gazeDropout > 0.2)
    reasons.push(`Sampel tatapan yang hilang ${(input.gazeDropout * 100).toFixed(0)}%; batas 20%.`);
  const calibrationLimitDeg = input.calibrationLimitDeg ?? 5;
  if (input.calibrationErrorDeg > calibrationLimitDeg)
    reasons.push(`Galat kalibrasi ${input.calibrationErrorDeg.toFixed(1)}°; batas ${calibrationLimitDeg}°.`);
  if (input.brightness < 0.22)
    reasons.push("Pencahayaan terlalu rendah.");
  if (input.brightness > 0.92)
    reasons.push("Pencahayaan terlalu terang atau wajah terkena silau.");
  if (input.sampleCount < 100)
    reasons.push(`Sampel tatapan ${input.sampleCount}; minimal 100.`);
  if (input.coverage !== undefined && input.coverage < 1)
    reasons.push(`Cakupan fitur ${(input.coverage * 100).toFixed(0)}%; semua fitur wajib tersedia.`);
  if (input.phaseCoverage !== undefined && input.phaseCoverage < 1)
    reasons.push(`Cakupan fase stimulus ${(input.phaseCoverage * 100).toFixed(0)}%; setiap fase perlu minimal 8 sampel.`);
  if (input.oodFlaggedFeatures?.length)
    reasons.push(`Data sesi berada di luar rentang referensi: ${input.oodFlaggedFeatures.join(", ")}.`);
  return { ...input, reasons, passed: reasons.length === 0 };
}
