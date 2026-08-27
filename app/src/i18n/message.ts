/**
 * Dictionary contract.
 *
 * Indonesian is declared `as const` and is the shape everything else must
 * match. English is annotated `Record<keyof typeof id, string>`, which makes
 * TypeScript reject the file two ways: a key present in Indonesian and missing
 * here fails the Record, and a key invented here and absent there trips the
 * excess-property check on the object literal.
 *
 * That bidirectional check is the whole point. Across roughly eight hundred
 * strings, a dictionary that silently falls back to Indonesian on a missing
 * key produces a screen that is half-translated and looks finished. A
 * dictionary that refuses to compile does not.
 */

export type Vars = Record<string, string | number>;

/**
 * Substitutes `{name}` placeholders. Unmatched placeholders are left standing
 * rather than blanked, so a wrong variable name shows up as `{count}` on the
 * screen instead of disappearing into a plausible-looking sentence.
 */
export function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (whole, name: string) => {
    const value = vars[name];
    return value === undefined ? whole : String(value);
  });
}

/**
 * Indonesian plurals do not inflect, English ones do. Rather than a plural
 * engine for the handful of counted nouns here, the affected strings carry
 * both forms and pick between them at the call site.
 */
export function plural(count: number, one: string, many: string): string {
  return count === 1 ? one : many;
}
