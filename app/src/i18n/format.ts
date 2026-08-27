/**
 * Locale-aware number formatting.
 *
 * The report was written with `.toFixed(n).replace(".", ",")` at roughly two
 * dozen call sites — correct for Indonesian, wrong the moment the page is read
 * in English, where "0,823" is either a typo or a number a thousand times too
 * large. Intl already knows both conventions, so the separator stops being
 * something the call site decides.
 */

/** Fixed decimal places, separator chosen by locale. */
export function decimal(value: number, digits: number, bcp47: string): string {
  return value.toLocaleString(bcp47, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/** Whole percent, no unit — the surrounding copy supplies the sign. */
export function percent(value: number, bcp47: string): string {
  return Math.round(value * 100).toLocaleString(bcp47);
}
