"use client";

import { useSyncExternalStore } from "react";

import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  isLocale,
  type Locale,
} from "./locale";

/**
 * The app ships as a static export, so every page is prerendered in Indonesian.
 * A reader whose stored choice is English therefore has a first paint that
 * disagrees with their preference, and React has to be told about that rather
 * than left to discover it as a hydration mismatch.
 *
 * useSyncExternalStore is the mechanism built for exactly this: it takes a
 * server snapshot (always the default) and a client snapshot (whatever is in
 * storage), hydrates against the former, and re-renders into the latter. The
 * alternative — useState plus an effect — produces the same visible swap but
 * routes it through a render React did not expect, which is where the
 * mismatch warnings come from.
 */

let current: Locale | null = null;
const listeners = new Set<() => void>();

function read(): Locale {
  if (current !== null) return current;
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    current = isLocale(stored) ? stored : DEFAULT_LOCALE;
  } catch {
    // Private browsing, disabled storage, embedded webview. Not worth failing
    // over — the reader just starts in Indonesian and can toggle again.
    current = DEFAULT_LOCALE;
  }
  return current;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): Locale {
  return read();
}

function getServerSnapshot(): Locale {
  return DEFAULT_LOCALE;
}

export function setStoredLocale(locale: Locale): void {
  if (read() === locale) return;
  current = locale;
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Choice still applies for this visit; it just will not outlive the tab.
  }
  // Keeps assistive technology and the :lang() selectors honest.
  if (typeof document !== "undefined") {
    document.documentElement.lang = locale;
  }
  for (const listener of listeners) listener();
}

export function useLocale(): Locale {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Test seam: drops the memoised value so a suite can start from clean state. */
export function resetLocaleCache(): void {
  current = null;
}
