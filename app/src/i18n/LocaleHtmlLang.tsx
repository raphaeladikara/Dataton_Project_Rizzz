"use client";

import { useEffect } from "react";

import { useLocale } from "./store";

/**
 * Keeps `<html lang>` in step with the toggle.
 *
 * The attribute is prerendered as `id` and cannot be anything else at build
 * time, so a reader on English would otherwise have every screen announced by
 * a screen reader with Indonesian pronunciation rules. Renders nothing.
 */
export function LocaleHtmlLang() {
  const locale = useLocale();

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
