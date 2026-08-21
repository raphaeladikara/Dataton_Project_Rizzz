import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

import { buildStageMirror, type StageMirrorInput } from "../src/ui/stageMirror";

const running: StageMirrorInput = {
  isStageDemo: true,
  running: true,
  paused: false,
  phaseLabel: "Klip pilihan tontonan",
  phaseId: "geopref_preference",
  progress: 50,
  totalSeconds: 67,
  tracking: { accepted: true, eyeOpen: 0.4 },
  cueActive: false,
  ostensiveActive: false,
};

test("the mirror does not exist outside a stage demonstration", () => {
  assert.equal(buildStageMirror({ ...running, isStageDemo: false }), null);
  assert.notEqual(buildStageMirror(running), null);
});

test("the mirror does not exist before or after the battery runs", () => {
  assert.equal(buildStageMirror({ ...running, running: false }), null);
});

test("it narrates the three states a presenter has to be able to explain", () => {
  const tracked = buildStageMirror(running)!;
  const rejected = buildStageMirror({ ...running, tracking: { accepted: false, eyeOpen: 0.3 } })!;
  const absent = buildStageMirror({ ...running, tracking: null })!;

  assert.match(tracked.narration, /terbaca/i);
  // A rejected sample is the governance story in miniature: the system had a
  // face and still refused to turn it into a measurement.
  assert.match(rejected.narration, /ditolak, bukan ditebak/i);
  assert.match(absent.narration, /luar bingkai/i);
  assert.notEqual(tracked.narration, rejected.narration);
  assert.notEqual(rejected.narration, absent.narration);
});

test("pausing says measurement stopped, not that something failed", () => {
  const paused = buildStageMirror({ ...running, paused: true })!;

  assert.match(paused.narration, /dijeda/i);
  assert.match(paused.narration, /berhenti/i);
  assert.equal(paused.rows.find((row) => row.id === "elapsed")?.tone, "waiting");
});

test("elapsed time is derived from progress and never exceeds the battery", () => {
  assert.match(buildStageMirror({ ...running, progress: 0 })!.rows[3].value, /^0 \/ 67 detik$/);
  assert.match(buildStageMirror({ ...running, progress: 100 })!.rows[3].value, /^67 \/ 67 detik$/);
  assert.match(buildStageMirror({ ...running, progress: 140 })!.rows[3].value, /^67 \/ 67 detik$/);
  assert.match(buildStageMirror({ ...running, progress: -20 })!.rows[3].value, /^0 \/ 67 detik$/);
});

test("no row on the mirror is a result", () => {
  const mirror = buildStageMirror({ ...running, cueActive: true })!;

  assert.equal(mirror.rows.length, 4);
  assert.deepEqual(mirror.rows.map((row) => row.id), ["phase", "signal", "cue", "elapsed"]);
  for (const row of mirror.rows) {
    assert.doesNotMatch(row.value, /rujuk|menyimpang|diagnos|persen geometrik/i);
  }
  assert.match(mirror.notice, /tidak ada angka hasil/i);
});

test("the stimulus screen renders the mirror behind isStageDemo and nothing else", () => {
  const source = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
  const usage = source.match(/\{stageMirror && \([\s\S]{0,900}?\)\}/);

  assert.ok(usage, "the stimulus stage must render the mirror from a single guarded expression");
  // The gate belongs in the builder call, so there is exactly one place to
  // check that a field session can never reach it.
  const build = source.match(/buildStageMirror\(\{[\s\S]{0,400}?\}\)/);
  assert.ok(build, "buildStageMirror must be called with an object literal that names its gate");
  assert.match(build[0], /isStageDemo/);
  assert.match(build[0], /running:\s*busy/);
});
