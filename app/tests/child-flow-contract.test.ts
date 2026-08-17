import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const stimulusProtocol = readFileSync(new URL("../src/stimulus/protocol.ts", import.meta.url), "utf8");
const sessionCss = readFileSync(new URL("../app/session.css", import.meta.url), "utf8");
const responsiveCss = readFileSync(new URL("../app/responsive.css", import.meta.url), "utf8");
const sw = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");
const adminConsole = readFileSync(new URL("../app/admin/admin-console.tsx", import.meta.url), "utf8");
const heroDevice = readFileSync(new URL("../src/ui/hero-device.tsx", import.meta.url), "utf8");
const gateBPublic = readFileSync(new URL("../public/validation/gate-b-public.json", import.meta.url), "utf8");

test("admin is reachable from a separate footer control", () => {
  assert.match(page, /className="adminAccess" href="\/admin"/);
  assert.doesNotMatch(page.match(/<nav className="topnav"[\s\S]*?<\/nav>/)?.[0] ?? "", /\/admin/);
});

test("session follows the required child-first stages", () => {
  const order = ["consent", "preparation", "tutorial", "device", "calibration", "sanity", "stimulus", "quality", "report"];
  let cursor = 0;
  for (const stage of order) {
    const next = page.indexOf(`key: "${stage}"`, cursor);
    assert.ok(next > cursor, `${stage} must follow the preceding stage`);
    cursor = next;
  }
});

test("hero animation mirrors the complete child-first session flow", () => {
  const order = ["consent", "preparation", "tutorial", "device", "calibration", "sanity", "stimulus", "quality", "report"];
  let cursor = heroDevice.indexOf("const FLOW");
  for (const stage of order) {
    const next = heroDevice.indexOf(`key: "${stage}"`, cursor);
    assert.ok(next > cursor, `${stage} is missing or out of order in the hero animation`);
    cursor = next;
  }
  assert.match(heroDevice, /01 \/ 09|padStart\(2, "0"\).*09/s);
  assert.match(heroDevice, /CALIBRATION_TARGETS[\s\S]*?\[82, 82\]/);
  assert.match(heroDevice, /Adegan \{stimulusScene\} dari 10/);
  assert.doesNotMatch(heroDevice, /SCANPATH|heroBoardPath/);
});

test("tutorial can play, pause, replay, mute, and be skipped", () => {
  for (const copy of ["Putar ulang", "Nyalakan suara", "Jeda", "Lewati, saya sudah paham"])
    assert.match(page, new RegExp(copy));
  assert.equal((page.match(/visual: "/g) ?? []).length, 6);
});

test("child calibration has five positions and technical mode is flag-gated", () => {
  const childBlock = page.match(/const CHILD_TARGETS = \[([\s\S]*?)\] as const;/)?.[1] ?? "";
  assert.equal((childBlock.match(/\[0\./g) ?? []).length, 5);
  assert.match(page, /technicalCalibration.*=== "1"/);
  assert.match(page, /useTechnicalCalibration \? TARGETS : CHILD_TARGETS/);
});

test("stimulus uses paired directional micro-trials and a non-scored ending", () => {
  const ids = ["baseline", "gaze_left", "gaze_right", "pointing_left", "pointing_right", "positive_ending"];
  let cursor = stimulusProtocol.indexOf("const STIMULUS_PHASES");
  for (const id of ids) {
    const next = stimulusProtocol.indexOf(`id: "${id}"`, cursor);
    assert.ok(next > cursor, `${id} is out of order`);
    cursor = next;
  }
  assert.match(stimulusProtocol, /id: "positive_ending"[^\n]*scored: false/);
  // The preferential-looking and name-call blocks are scored by their own
  // modules, so they must never carry scored: true and never enter the
  // cue-following denominator.
  assert.match(stimulusProtocol, /id: GEOPREF_PHASE_ID[^\n]*target: "none"[^\n]*scored: false/);
  assert.match(stimulusProtocol, /id: NAME_CALL_PHASE_ID[^\n]*target: "none"[^\n]*scored: false/);
  assert.doesNotMatch(sessionCss, /visual-(?:gaze|point)-(?:left|right)\.cue-active[^}]*animation:/);
});

test("reports use safe language and hide technical detail by default", () => {
  const outcome = readFileSync(new URL("../src/outcome/sessionOutcome.ts", import.meta.url), "utf8");
  // Headlines are generated per child now, so the wording contract lives in
  // the outcome module rather than as literals in the page.
  assert.match(outcome, /Sesi belum dapat dinilai/);
  assert.match(outcome, /rujuk untuk pemeriksaan perkembangan/);
  assert.doesNotMatch(outcome, /Tidak autis|Positif autisme|anak normal/i);
  assert.doesNotMatch(page, /Tidak autis|Positif autisme|anak normal/i);
  assert.match(page, /<details className="reportTechnical">/);
  assert.doesNotMatch(page, /<details className="reportTechnical" open/);
  assert.match(page, /Rekaman valid, tetapi estimasi tidak dapat dihitung/);
  assert.match(page, /validity\?\.primaryReasonCode && <details/);
});

test("stimulus person uses connected sleeves and a single hand silhouette", () => {
  const scene = readFileSync(new URL("../src/ui/stimulus-scene.tsx", import.meta.url), "utf8");
  assert.match(scene, /className="armSleeve"/);
  assert.match(scene, /className="handShape"/);
  assert.doesNotMatch(scene, /className="indexFinger"|className="thumb"|className="handPalm"/);
});

test("stimulus model is rigged at real joints and never fades limbs in", () => {
  const scene = readFileSync(new URL("../src/ui/stimulus-scene.tsx", import.meta.url), "utf8");
  // Both arms are always in the DOM; pointing is a rotation about the shoulder
  // and elbow, not an element that appears out of nowhere.
  assert.match(scene, /className="arm armLeft"/);
  assert.match(scene, /className="arm armRight"/);
  assert.match(scene, /className="forearmGroup forearmLeft"/);
  assert.doesNotMatch(sessionCss, /\.pointingHand\s*\{[^}]*opacity:\s*0/);
  for (const origin of ["326px 456px", "554px 456px", "272px 562px", "608px 562px", "440px 400px"])
    assert.ok(sessionCss.includes(`transform-origin: ${origin}`), `missing joint pivot ${origin}`);
  // Idle life (breathing, blinking) is symmetric and centred so it cannot bias
  // a left/right look; the directional cue itself stays transition-only.
  assert.match(sessionCss, /@keyframes stimulus-blink/);
  assert.match(sessionCss, /@keyframes stimulus-breathe/);
});

test("each trial gives an ostensive signal before the silent directional cue", () => {
  assert.match(stimulusProtocol, /ostensiveOnsetMs/);
  assert.match(sessionCss, /\.stimulusScene\.ostensive \.eyeball/);
  // Resting model looks down and the pupils drop straight: zero horizontal
  // offset, so no left/right information exists before cue onset.
  assert.match(sessionCss, /^\.eyeball \{ transform: translate\(0, \d+px\); \}$/m);
  assert.match(page, /stimulus\.ostensive_started/);
  assert.match(page, /ostensiveActive=\{stimulusOstensiveActive\}/);
});

test("both target objects are identical so object preference cannot explain a look", () => {
  const scene = readFileSync(new URL("../src/ui/stimulus-scene.tsx", import.meta.url), "utf8");
  assert.match(scene, /function TargetToy/);
  assert.match(scene, /<TargetToy side="left" \/>[\s\S]*<TargetToy side="right" \/>/);
  assert.doesNotMatch(scene, /toyCarBody|ballBase/);
});

test("touch, responsive, reduced-motion, and offline contracts remain present", () => {
  assert.match(responsiveCss, /prefers-reduced-motion: reduce/);
  assert.match(sessionCss, /min-height: 44px/);
  assert.match(sessionCss, /@media \(max-width: 820px\)/);
  assert.match(sessionCss, /@media \(max-width: 520px\)/);
  assert.match(sw, /models\/model\.json/);
  assert.match(sw, /face_landmarker\.task/);
});

test("the Carette model never drives a referral and is shown only when in distribution", () => {
  // It may run on live features, but only the OOD guard decides whether the
  // number is even displayed, and only in replay.
  assert.match(page, /const riskIsInterpretable = mode === "replay" && Boolean\(nextOod\?\.passed\)/);
  assert.match(page, /ditolak OOD — tidak dipakai/);
  assert.match(page, /LIVE_MODEL_CONTRACT_MISMATCH/);
  // The referral decision must come from the session outcome module, never
  // from the model score.
  assert.doesNotMatch(page, /risk >= model\.decision/);
  assert.doesNotMatch(page, /features\[[^\]]+\]\s*\|\|\s*0/);
});

test("the only automatic referral trigger is the published GeoPref threshold", () => {
  assert.match(page, /sessionOutcome\.emitsReferral \? "PERIKSA LANJUT"/);
  const outcome = readFileSync(new URL("../src/outcome/sessionOutcome.ts", import.meta.url), "utf8");
  assert.match(outcome, /emitsReferral: true/);
  // Exactly one branch may emit a referral, and it is the GeoPref rule-in one.
  assert.equal((outcome.match(/emitsReferral: true/g) ?? []).length, 1);
  assert.match(outcome, /kind: "RULE_IN_GEOMETRIC"[\s\S]{0,400}emitsReferral: true/);
});

test("a below-threshold result can never be phrased as reassurance", () => {
  const outcome = readFileSync(new URL("../src/outcome/sessionOutcome.ts", import.meta.url), "utf8");
  assert.match(outcome, /reassures: false as const/);
  assert.doesNotMatch(outcome, /reassures: true/);
  assert.match(outcome, /bukan tanda aman/);
});

test("restarting a completed session resets stimulus progress", () => {
  const restartBlock = page.match(/function restart\(\) \{([\s\S]*?)\n  \}/)?.[1] ?? "";
  assert.match(restartBlock, /setProgress\(0\)/);
});

test("admin evidence reports passed A/B and open C/D from repository evidence", () => {
  assert.match(adminConsole, /Gate A dan B telah lulus berdasarkan log webapp/);
  assert.match(adminConsole, /Lulus: akuisisi stabil pada 100 sesi/);
  assert.match(adminConsole, /Lulus: aliran gaze Neurogaze sejalan dengan referensi WebGazer/);
  assert.match(adminConsole, /Lulus · 100 sesi/);
  assert.match(adminConsole, /Lulus · 27 dari 30 pasangan/);
  assert.match(gateBPublic, /"status": "gate_b_passed"/);
  assert.match(gateBPublic, /"nPairsTotal": 30/);
  assert.match(gateBPublic, /"nPairsReady": 27/);
  assert.match(gateBPublic, /"library": "WebGazer\.js"/);
  assert.match(adminConsole, /Validasi prospektif belum dilakukan/);
  assert.doesNotMatch(adminConsole, /Bandingkan tablet dengan eye-tracker/);
  assert.doesNotMatch(adminConsole, /Uji Gate B langsung di admin/);
  assert.match(adminConsole, /figshare\.com\/articles\/dataset\/Visualization_of_Eye-Tracking_Scanpaths/);
  assert.match(adminConsole, /Uji lapangan belum dilakukan/);
  assert.match(adminConsole, /bukan hasil studi/);
  assert.match(adminConsole, /Interpretasi skenario saat ini/);
});

test("admin explains why the stimulus was purpose-built, with sources and limits", () => {
  assert.match(adminConsole, /Stimulus ini dirancang khusus untuk skrining, bukan animasi hiburan/);
  assert.match(adminConsole, /referensi\/stimulus_billeci/);
  assert.match(adminConsole, /doi\.org\/10\.1016\/j\.cub\.2008\.03\.059/);
  assert.match(adminConsole, /doi\.org\/10\.3389\/fpsyg\.2019\.02187/);
  // The stated protocol numbers must match the shipped protocol.
  assert.match(adminConsole, /66 detik/);
  assert.match(adminConsole, /ID-joint-cues-vector-v3/);
  // Design rationale must not be mistaken for clinical validation.
  assert.match(adminConsole, /Batas klaim desain stimulus/);
  assert.match(adminConsole, /bukan instrumen yang sudah tervalidasi secara klinis/);
});
