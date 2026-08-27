"use client";

import { useCallback, useMemo } from "react";

import { dictionary, type MessageKey } from "./dictionary";
import { interpolate, type Vars } from "./message";
import { BCP47, type Locale } from "./locale";
import { setStoredLocale, useLocale } from "./store";

export type Translate = (key: MessageKey, vars?: Vars) => string;

export type Translation = {
  t: Translate;
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** For Intl calls — dates, numbers, lists. */
  bcp47: string;
};

export function useT(): Translation {
  const locale = useLocale();

  const t = useCallback<Translate>(
    (key, vars) => interpolate(dictionary[locale][key], vars),
    [locale],
  );

  return useMemo(
    () => ({ t, locale, setLocale: setStoredLocale, bcp47: BCP47[locale] }),
    [t, locale],
  );
}

/**
 * Outside React — the pure modules under `src/` take a locale argument rather
 * than reaching for a hook, so this is what they use when they need a shared
 * chrome string rather than one of their own.
 */
export function translate(locale: Locale, key: MessageKey, vars?: Vars): string {
  return interpolate(dictionary[locale][key], vars);
}
