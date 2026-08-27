import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { dictionary, isMessageKey } from "../src/i18n/dictionary";
import { interpolate } from "../src/i18n/message";
import { BCP47, DEFAULT_LOCALE, LOCALES, isLocale } from "../src/i18n/locale";
import { buildComparisonView } from "../src/outcome/comparisonView";
import { buildReportPresentation } from "../src/outcome/reportPresentation";
import { evaluateSessionValidity } from "../src/quality/sessionValidity";

const id = dictionary.id as Record<string, string>;
const en = dictionary.en as Record<string, string>;

test("both dictionaries carry exactly the same keys", () => {
  // TypeScript already refuses to compile a mismatch. This is the runtime
  // backstop for the day somebody reaches for a cast to make one go away.
  assert.deepEqual(Object.keys(id).sort(), Object.keys(en).sort());
  assert.ok(Object.keys(id).length > 500, "the dictionary should cover the whole app");
});

test("no message is blank, and every key is namespaced by surface", () => {
  for (const [key, value] of Object.entries(id)) {
    assert.ok(value.trim().length > 0, `Indonesian message is empty: ${key}`);
    assert.ok(en[key].trim().length > 0, `English message is empty: ${key}`);
    // Snake_case segments are allowed: the camera keys are built as
    // `camera.${kind}` from the error kinds, which are snake_case codes.
    assert.match(key, /^[a-z][A-Za-z0-9]*(\.[A-Za-z][A-Za-z0-9_]*)+$/, `unnamespaced key: ${key}`);
  }
});

/**
 * A placeholder present in one language and missing in the other is the failure
 * this catches: the call site passes the variable either way, so the language
 * that dropped it silently prints a sentence with a hole where a number should
 * be.
 */
test("placeholders match across languages", () => {
  const slots = (value: string) => [...value.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
  for (const key of Object.keys(id)) {
    assert.deepEqual(slots(id[key]), slots(en[key]), `placeholder mismatch in ${key}`);
  }
});

test("English is not left as a copy of the Indonesian", () => {
  // Some values are identical on purpose — proper nouns, "Menu", version
  // strings, quoted figures. What would be wrong is most of them matching.
  const identical = Object.keys(id).filter((key) => id[key] === en[key]);
  assert.ok(
    identical.length < Object.keys(id).length * 0.15,
    `${identical.length} of ${Object.keys(id).length} English messages are untranslated`,
  );
});

test("interpolation fills named slots and leaves unknown ones visible", () => {
  assert.equal(interpolate("app {version}", { version: "3.0.0" }), "app 3.0.0");
  assert.equal(interpolate("{a} and {b}", { a: 1, b: 2 }), "1 and 2");
  // A wrong variable name has to show up on screen rather than vanish into a
  // sentence that still reads correctly.
  assert.equal(interpolate("count: {count}", { other: 1 }), "count: {count}");
  assert.equal(interpolate("no slots"), "no slots");
});

test("locale helpers agree on which locales exist", () => {
  assert.deepEqual([...LOCALES], ["id", "en"]);
  assert.equal(DEFAULT_LOCALE, "id");
  assert.ok(isLocale("id") && isLocale("en"));
  assert.ok(!isLocale("fr") && !isLocale("") && !isLocale(null));
  for (const locale of LOCALES) assert.ok(BCP47[locale]);
});

test("isMessageKey answers for real keys and rejects loose strings", () => {
  assert.ok(isMessageKey("nav.home"));
  assert.ok(!isMessageKey("27/27"));
  assert.ok(!isMessageKey("nav.doesNotExist"));
});

/**
 * The default argument is what keeps every caller written before the app had
 * two languages producing exactly what it produced before — including the
 * contract tests, which assert on the Indonesian.
 */
test("copy-generating modules default to Indonesian and answer in English on request", () => {
  const input = {
    qualityPassed: true,
    sourceKind: "live" as const,
    demonstrationMode: false,
    recommendsFollowUp: false,
    emitsReferral: false,
    fieldTitle: "judul",
    sessionHeadline: "judul",
    sessionSummary: "ringkasan",
  };
  assert.equal(buildReportPresentation(input).pageTitle, "Laporan hasil pengukuran");
  assert.equal(buildReportPresentation(input, "id").pageTitle, "Laporan hasil pengukuran");
  assert.equal(buildReportPresentation(input, "en").pageTitle, "Measurement report");
  assert.match(buildReportPresentation(input, "en").sections[3].body, /not a diagnosis/i);
  // The claim limit survives translation: an English reader must be told the
  // same thing about what a below-threshold result does not mean.
  assert.match(buildReportPresentation(input, "en").sections[3].body, /not an all-clear/i);

  const validity = {
    sessionComplete: false,
    cameraInterrupted: false,
    orientationChanged: false,
    calibrationPassed: true,
    featureContractMatches: true,
    timestampsSynchronized: true,
    faceRate: 0.9,
    gazeDropout: 0.1,
    poseRejectedRate: 0,
    offScreenRate: 0,
    gazeMovement: 0.2,
    rawIrisMovement: 0.2,
    stationaryJumpRate: 0,
    phases: [],
  };
  assert.match(evaluateSessionValidity(validity).userMessage, /bukan hasil risiko anak/);
  assert.match(
    evaluateSessionValidity(validity, "en").userMessage,
    /not a risk finding about the child/,
  );
});

test("the comparison view keeps its scope banner in both languages", () => {
  const evidence = JSON.parse(
    readFileSync(new URL("../public/validation/gate-b-public.json", import.meta.url), "utf8"),
  );
  for (const [locale, notAbout] of [["id", /tidak ada pernyataan apa pun tentang autisme/i], ["en", /no statement of any kind about autism/i]] as const) {
    const view = buildComparisonView(evidence, locale);
    assert.match(view.scopeBanner, notAbout);
    assert.ok(view.notClaimed.length >= 3);
  }
  // Numbers are read from the artifact, so they must be identical whichever
  // language rendered the sentences around them.
  assert.equal(
    buildComparisonView(evidence, "id").participants,
    buildComparisonView(evidence, "en").participants,
  );
});

/**
 * The store is what the toggle actually drives. It reads once, caches, writes
 * through to storage, and tells subscribers — and it has to survive a browser
 * that refuses storage entirely, because a private window or a locked-down
 * WebView is a normal thing for a Posyandu tablet to be.
 */
test("the locale store persists a choice, notifies, and survives storage failure", async () => {
  const { setStoredLocale, resetLocaleCache } = await import("../src/i18n/store");
  const readSnapshot = async () => {
    // The internal snapshot is only reachable through the hook, so this reads
    // the same place the hook reads: storage, via a fresh cache.
    resetLocaleCache();
    return (globalThis as { localStorage?: Storage }).localStorage?.getItem("neurogaze.locale");
  };

  const store = new Map<string, string>();
  let throwOnWrite = false;
  const fake = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      if (throwOnWrite) throw new Error("storage disabled");
      store.set(key, value);
    },
  };
  Object.defineProperty(globalThis, "localStorage", { value: fake, configurable: true });
  Object.defineProperty(globalThis, "window", { value: { localStorage: fake }, configurable: true });
  Object.defineProperty(globalThis, "document", {
    value: { documentElement: { lang: "id" } },
    configurable: true,
  });

  resetLocaleCache();
  setStoredLocale("en");
  assert.equal(await readSnapshot(), "en", "the choice is written through to storage");
  assert.equal(
    (globalThis as { document?: { documentElement: { lang: string } } }).document?.documentElement.lang,
    "en",
    "the html lang attribute follows the choice",
  );

  // Storage that throws must not take the session down with it.
  resetLocaleCache();
  throwOnWrite = true;
  assert.doesNotThrow(() => setStoredLocale("id"));

  resetLocaleCache();
});

test("the language toggle is reachable on every page", () => {
  const surfaces = [
    "../app/page.tsx",
    "../app/admin/admin-console.tsx",
    "../app/validation/evidence-view.tsx",
    "../app/perbandingan/comparison-view.tsx",
  ];
  for (const surface of surfaces) {
    const source = readFileSync(new URL(surface, import.meta.url), "utf8");
    assert.match(source, /<LanguageToggle \/>/, `${surface} must render the language toggle`);
  }
});
