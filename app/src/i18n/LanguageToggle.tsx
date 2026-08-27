"use client";

import { LOCALES, LOCALE_LABEL, LOCALE_NAME } from "./locale";
import { useT } from "./useT";

/**
 * Two segments, both always visible.
 *
 * A single button that flips between "ID" and "EN" halves the width and
 * doubles the ambiguity: the label is either the current language or the one
 * you would get by pressing it, and no wording settles which. Showing both and
 * marking one pressed removes the question.
 */
export function LanguageToggle({ className = "" }: { className?: string }) {
  const { t, locale, setLocale } = useT();

  return (
    <div
      className={`languageToggle ${className}`.trim()}
      role="group"
      aria-label={t("language.aria")}
    >
      {LOCALES.map((option) => (
        <button
          key={option}
          type="button"
          lang={option}
          className={option === locale ? "active" : ""}
          aria-pressed={option === locale}
          // The full language name in its own language, so a reader who cannot
          // read the current interface can still recognise the target.
          title={LOCALE_NAME[option]}
          onClick={() => setLocale(option)}
        >
          {LOCALE_LABEL[option]}
        </button>
      ))}
    </div>
  );
}
