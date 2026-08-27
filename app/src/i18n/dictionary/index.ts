import * as admin from "./admin";
import * as common from "./common";
import * as comparison from "./comparison";
import * as guide from "./guide";
import * as home from "./home";
import * as report from "./report";
import * as session from "./session";
import * as validation from "./validation";

import type { Locale } from "../locale";

/**
 * Surfaces are separate files so that a screen's copy can be read in one
 * sitting, and merged here so a call site only ever needs one key.
 *
 * Keys are namespaced by surface (`home.hero.title`), which is what keeps the
 * merge collision-free without a build step to check it.
 */
export const dictionary = {
  id: {
    ...common.id,
    ...home.id,
    ...guide.id,
    ...session.id,
    ...report.id,
    ...admin.id,
    ...validation.id,
    ...comparison.id,
  },
  en: {
    ...common.en,
    ...home.en,
    ...guide.en,
    ...session.en,
    ...report.en,
    ...admin.en,
    ...validation.en,
    ...comparison.en,
  },
} satisfies Record<Locale, Record<string, string>>;

export type MessageKey = keyof typeof dictionary.id;

/**
 * Runtime membership test, for the few places that hold a value which is
 * *either* a message key or a literal already fit to print — a metric cell
 * showing "27/27" has nothing to translate, and inventing a key for it would
 * only add a row to both dictionaries that says the same thing twice.
 */
export function isMessageKey(value: string): value is MessageKey {
  return Object.hasOwn(dictionary.id, value);
}
