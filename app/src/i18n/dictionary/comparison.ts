/**
 * The side-by-side condition comparison at /perbandingan.
 *
 * Most of this screen's copy is built by `src/outcome/comparisonView.ts`, which
 * carries its own per-locale tables because it also formats the numbers. What
 * lives here is only the surrounding chrome.
 */
export const id = {
  "comparison.kicker": "Respons instrumen · kontrol positif dewasa",
  "comparison.lede":
    "{participants} peserta dewasa · {recorded} sesi direkam · {passed} lulus mutu",
  "comparison.columnsAria": "Dua kondisi berdampingan",
  "comparison.denominator":
    "{recorded} sesi direkam, {usable} dapat dipakai — {withheld} ditahan gerbang mutu",
  "comparison.signalsHeading": "Tiga sinyal yang menentukan",
  "comparison.colSignal": "Sinyal",
  "comparison.colOrdinary": "Menonton biasa",
  "comparison.colProduced": "Pola diproduksi",
  "comparison.colGap": "Jarak terdekat",
  "comparison.notClaimedHeading": "Apa yang layar ini tidak buktikan",
  "comparison.sourceLabel": "Sumber angka:",
  "comparison.back": "Kembali ke Neurogaze",
  "comparison.fullEvidence": "Bukti validasi lengkap",
} as const;

export const en: Record<keyof typeof id, string> = {
  "comparison.kicker": "Instrument response · adult positive control",
  "comparison.lede":
    "{participants} adult participants · {recorded} sessions recorded · {passed} passed quality",
  "comparison.columnsAria": "The two conditions side by side",
  "comparison.denominator":
    "{recorded} sessions recorded, {usable} usable — {withheld} withheld at the quality gate",
  "comparison.signalsHeading": "The three deciding signals",
  "comparison.colSignal": "Signal",
  "comparison.colOrdinary": "Ordinary viewing",
  "comparison.colProduced": "Produced pattern",
  "comparison.colGap": "Closest distance",
  "comparison.notClaimedHeading": "What this screen does not establish",
  "comparison.sourceLabel": "Source of these numbers:",
  "comparison.back": "Back to Neurogaze",
  "comparison.fullEvidence": "Full validation evidence",
};
