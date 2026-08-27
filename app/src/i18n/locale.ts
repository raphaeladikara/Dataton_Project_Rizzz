/**
 * Two languages, one default. Indonesian is the source of truth: every string
 * in the dictionary is authored in Indonesian first and translated second,
 * because the people this product is built for — kader Posyandu, orang tua —
 * read Indonesian. English exists so a reviewer who does not can audit the
 * same screens.
 */
export type Locale = "id" | "en";

export const LOCALES: readonly Locale[] = ["id", "en"] as const;

export const DEFAULT_LOCALE: Locale = "id";

/** Survives reloads and works offline, which rules out anything server-side. */
export const LOCALE_STORAGE_KEY = "neurogaze.locale";

export function isLocale(value: unknown): value is Locale {
  return value === "id" || value === "en";
}

/** What the toggle prints on each segment. Never translated — a language
 *  switch that renames itself is a language switch nobody can find. */
export const LOCALE_LABEL: Record<Locale, string> = {
  id: "ID",
  en: "EN",
};

export const LOCALE_NAME: Record<Locale, string> = {
  id: "Bahasa Indonesia",
  en: "English",
};

/** For toLocaleDateString / toLocaleString. */
export const BCP47: Record<Locale, string> = {
  id: "id-ID",
  en: "en-GB",
};
