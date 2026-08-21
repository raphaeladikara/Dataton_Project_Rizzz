import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

import { buildComparisonView } from "../src/outcome/comparisonView";
import type { GateBPublicEvidence } from "../src/gateb/publicEvidence";

const evidence = JSON.parse(
  readFileSync(new URL("../public/validation/gate-b-public.json", import.meta.url), "utf8"),
) as GateBPublicEvidence;

test("the comparison reads the published evidence rather than recomputing it", () => {
  const view = buildComparisonView(evidence);
  const control = evidence.positiveControl;

  assert.equal(view.participants, control.participants);
  assert.equal(view.sessionsRecorded, control.sessions.recorded);
  assert.equal(view.sessionsQualityPass, control.sessions.qualityPass);
  assert.equal(view.signals.length, control.signals.length);
  assert.equal(view.source, control.source);
});

test("both columns carry their full denominators, not only the passing ones", () => {
  const [ordinary, produced] = buildComparisonView(evidence).columns;

  assert.equal(ordinary.id, "ordinary");
  assert.equal(produced.id, "produced");
  for (const column of [ordinary, produced]) {
    assert.ok(column.recorded >= column.usable, "recorded must include the sessions quality withheld");
    assert.ok(column.usable >= column.ruleFired);
    assert.match(column.outcome, new RegExp(`${column.ruleFired} dari ${column.usable}`));
  }
  // Half the produced-pattern sessions fall at the quality gate. Showing only
  // the survivors would be the one number on this screen that flatters us.
  assert.ok(produced.recorded > produced.usable);
});

test("scope is stated before any number and names what the screen is not", () => {
  const view = buildComparisonView(evidence);

  assert.match(view.scopeBanner, /dewasa/i);
  assert.match(view.scopeBanner, /bukan sensitivitas|tidak ada sensitivitas/i);
  assert.match(view.scopeBanner, /tidak mengeluarkan rujukan/i);
  assert.ok(view.notClaimed.length >= 3);
  assert.ok(view.notClaimed.some((line) => /autisme/i.test(line)));
  assert.ok(view.notClaimed.some((line) => /balita/i.test(line)));
});

test("the gap is what the screen sells, and the note says why AUC is not", () => {
  const view = buildComparisonView(evidence);

  assert.match(view.gapNote, /jarak terdekat/i);
  assert.match(view.gapNote, /AUC 1,00/);
  for (const signal of view.signals) {
    assert.ok(signal.nearestGap.length > 0);
    assert.ok(signal.label.length > 0);
    assert.ok(signal.meaning.length > 0, `${signal.id} needs a plain-language meaning`);
  }
});

test("every published signal is given a direction so the columns can be read", () => {
  const view = buildComparisonView(evidence);
  const byId = new Map(view.signals.map((signal) => [signal.id, signal]));

  assert.equal(byId.get("geometric_preference")?.direction, "higher_in_produced");
  assert.equal(byId.get("cue_following")?.direction, "higher_in_ordinary");
  assert.equal(byId.get("centre_hold_spread")?.direction, "higher_in_ordinary");
});

test("a gap is formatted as a distance, never as a score", () => {
  const view = buildComparisonView(evidence);
  const byId = new Map(view.signals.map((signal) => [signal.id, signal]));

  // "4 dari 8" for a gap of four trials reads as a result. It is a distance.
  assert.match(byId.get("cue_following")!.nearestGap, /percobaan/);
  assert.doesNotMatch(byId.get("cue_following")!.nearestGap, /dari 8/);
  assert.match(byId.get("geometric_preference")!.nearestGap, /poin persen/);
});
