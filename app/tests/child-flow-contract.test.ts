import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const stimulusProtocol = readFileSync(new URL("../src/stimulus/protocol.ts", import.meta.url), "utf8");
const sessionCss = readFileSync(new URL("../app/session.css", import.meta.url), "utf8");
const responsiveCss = readFileSync(new URL("../app/responsive.css", import.meta.url), "utf8");
const chromeCss = readFileSync(new URL("../app/chrome.css", import.meta.url), "utf8");
const validationCss = readFileSync(new URL("../app/validation/validation.module.css", import.meta.url), "utf8");
const adminCss = readFileSync(new URL("../app/admin/admin.module.css", import.meta.url), "utf8");
const sw = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");
const adminConsole = readFileSync(new URL("../app/admin/admin-console.tsx", import.meta.url), "utf8");
const heroDevice = readFileSync(new URL("../src/ui/hero-device.tsx", import.meta.url), "utf8");
const gateBPublic = readFileSync(new URL("../public/validation/gate-b-public.json", import.meta.url), "utf8");

function cssRule(source: string, selector: string) {
  const start = source.indexOf(`${selector} {`);
  assert.ok(start >= 0, `missing CSS rule for ${selector}`);
  const end = source.indexOf("}", start);
  assert.ok(end > start, `unterminated CSS rule for ${selector}`);
  return source.slice(start, end + 1);
}

function cssDeclarationsForSelector(source: string, selector: string) {
  const declarations = [...source.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter((match) => match[1].split(",").some((candidate) => candidate.trim() === selector))
    .map((match) => match[2]);
  assert.ok(declarations.length, `missing CSS declarations for ${selector}`);
  return declarations.join("\n");
}

test("admin is reachable from a separate footer control", () => {
  assert.match(page, /className="adminAccess" href="\/admin"/);
  assert.doesNotMatch(page.match(/<nav className="topnav"[\s\S]*?<\/nav>/)?.[0] ?? "", /\/admin/);
});

test("compact primary navigation keeps guide, evidence, and privacy reachable", () => {
  assert.match(page, /aria-expanded=\{mobileNavOpen\}/);
  assert.match(page, /aria-controls="primary-navigation"/);
  assert.match(page, /id="primary-navigation"/);
  for (const label of ["Panduan & demo", "Bukti", "Privasi"])
    assert.match(page, new RegExp(`>${label}<`));
  assert.match(page, /event\.key === "Escape"/);
  assert.match(page, /pointerdown/);
  assert.match(page, /focusNavigationDestination\(document, destinationId\)/);
  for (const destination of ["home-heading", "guide-heading", "evidence", "privacy"])
    assert.match(page, new RegExp(`id="${destination}"`));
  assert.match(chromeCss, /:is\(#home-heading, #guide-heading, #evidence, #privacy\):focus-visible\s*\{[^}]*outline:/);
  assert.doesNotMatch(chromeCss, /@media \(max-width: 1000px\)[\s\S]*?\.topnav\s*\{[^}]*display:\s*none/);
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
  // [\s\S]* rather than /s: the dotAll flag needs an ES2018 target and tsc is on ES2017.
  assert.match(heroDevice, /01 \/ 09|padStart\(2, "0"\)[\s\S]*09/);
  // Derived from CHILD_TARGETS rather than retyped. The illustration went on
  // drawing the four-corner square while the square was the reason live
  // sessions were coming back unscorable.
  assert.match(heroDevice, /CALIBRATION_TARGETS = CHILD_TARGETS\.map/);
  assert.match(heroDevice, /Adegan \{stimulusScene\} dari 10/);
  assert.doesNotMatch(heroDevice, /SCANPATH|heroBoardPath/);
});

test("tutorial can play, pause, replay, mute, and be skipped", () => {
  for (const copy of ["Putar ulang", "Nyalakan suara", "Jeda", "Lewati, saya sudah paham"])
    assert.match(page, new RegExp(copy));
  assert.equal((page.match(/visual: "/g) ?? []).length, 6);
});

test("child calibration has five positions and technical mode is flag-gated", async () => {
  // Both grids live in src/capture/calibrationTargets.ts so their geometry can
  // be asserted as geometry rather than matched out of the page source; the
  // shape they have to keep is in tests/calibration-targets.test.ts.
  const { CHILD_TARGETS } = await import("../src/capture/calibrationTargets");
  assert.equal(CHILD_TARGETS.length, 5);
  assert.match(page, /technicalCalibration.*=== "1"/);
  assert.match(page, /useTechnicalCalibration \? TARGETS : CHILD_TARGETS/);
});

test("stimulus uses paired directional micro-trials and a non-scored ending", async () => {
  const { GEOPREF_PHASE_ID, NAME_CALL_PHASE_ID, STIMULUS_PHASES, sessionStimulusPhases } =
    await import("../src/stimulus/protocol");
  const byId = (id: string) => STIMULUS_PHASES.find((phase) => phase.id === id)!;

  // Four cue kinds, each present as a left/right pair plus one repeat.
  for (const id of ["gaze_left", "gaze_right", "pointing_left", "pointing_right"]) {
    assert.ok(byId(id), `${id} is missing`);
    assert.equal(byId(id).scored, true);
    assert.ok(byId(`${id}_repeat`), `${id}_repeat is missing`);
  }
  assert.equal(byId("positive_ending").scored, false);

  // The preferential-looking and name-call blocks are scored by their own
  // modules, so they must never carry scored: true and never enter the
  // cue-following denominator.
  for (const id of [GEOPREF_PHASE_ID, NAME_CALL_PHASE_ID]) {
    assert.equal(byId(id).target, "none");
    assert.equal(byId(id).scored, false);
  }

  // Fixed anchors. Only the eight directional trials are counterbalanced; the
  // blocks that bracket them stay where the protocol declares them.
  for (const sessionId of ["NG-0001", "NG-0042", "NG-9999"]) {
    const phases = sessionStimulusPhases(sessionId);
    assert.equal(phases[0].id, "baseline");
    assert.equal(phases[1].id, GEOPREF_PHASE_ID);
    assert.equal(phases.at(-2)!.id, NAME_CALL_PHASE_ID);
    assert.equal(phases.at(-1)!.id, "positive_ending");
  }

  // Cue order must never be hardcoded back into a fixed alternating list.
  assert.match(stimulusProtocol, /sessionStimulusPhases/);
  assert.doesNotMatch(sessionCss, /visual-(?:gaze|point)-(?:left|right)\.cue-active[^}]*animation:/);
});

test("the composite lane is reported beside the GeoPref lane, never merged into it", () => {
  const sessionCssText = readFileSync(new URL("../app/session.css", import.meta.url), "utf8");
  // Lane 2 renders as its own section with its own heading, and every signal
  // ships its measured value, its reason, and its literature source.
  assert.match(page, /className="referralLane"/);
  assert.match(page, /referral\.signals\.map/);
  assert.match(page, /referralMeasured/);
  assert.match(page, /referralReason/);
  // It must never be folded into the GeoPref headline or badge.
  assert.doesNotMatch(page, /sessionOutcome\.headline[^\n]*referral\./);
  assert.doesNotMatch(page, /referral\.recommendsFollowUp \? "PERIKSA LANJUT"/);
  // Engineering sessions measure the device, not a child, so no lane at all.
  assert.match(page, /\{!isEngineeringStudy && <section className="referralLane"/);
  // The printed hand-off carries the same per-signal reasoning the screen shows.
  assert.match(page, /<h2>Rekomendasi komposit<\/h2>/);
  // Deviant signals must not borrow the coral used for the published rule-in.
  assert.match(sessionCssText, /\.referralLane\b/);
  assert.match(sessionCssText, /\[data-status="menyimpang"\][^}]*--amber/);
});

test("reports use safe language and hide technical detail by default", () => {
  const outcome = readFileSync(new URL("../src/outcome/sessionOutcome.ts", import.meta.url), "utf8");
  // Headlines are generated per child now, so the wording contract lives in
  // the outcome module rather than as literals in the page.
  assert.match(outcome, /Sesi belum dapat dinilai/);
  assert.match(outcome, /rujuk untuk pemeriksaan perkembangan/);
  assert.doesNotMatch(outcome, /Tidak autis|Positif autisme|anak normal/i);
  assert.doesNotMatch(page, /Tidak autis|Positif autisme|anak normal/i);
  const reportSection = page.match(/\{stage === "report"[\s\S]*?\{stage === "stimulus"/)?.[0] ?? "";
  assert.equal((reportSection.match(/<details/g) ?? []).length, 1);
  assert.match(reportSection, /<details className="reportPractitioner">/);
  assert.doesNotMatch(reportSection, /<details className="reportPractitioner" open/);
  for (const technicalDetail of ["95% CI", "p =", "Model Carette", "Coverage/OOD", "ID sesi"])
    assert.ok(reportSection.indexOf(technicalDetail) > reportSection.indexOf('<details className="reportPractitioner">'));
  assert.match(page, /Rekaman valid, tetapi estimasi tidak dapat dihitung/);
  assert.match(page, /validity\?\.primaryReasonCode && <section className="reportTechnical"/);
  assert.match(page, /qualityPassed: Boolean\(quality\?\.passed && validity\?\.canScore\)/);
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

test("the preferential-looking phase plays the clip, not the vector actor", () => {
  const scene = readFileSync(new URL("../src/ui/stimulus-scene.tsx", import.meta.url), "utf8");
  assert.match(stimulusProtocol, /id: GEOPREF_PHASE_ID[^\n]*visualCue: "geopref"/);
  assert.match(scene, /visualCue === "geopref" && geoprefSource/);
  assert.match(scene, /<video/);
  // Nothing else may share the stage: the measure is which panel is looked at.
  assert.match(scene, /geoprefStage/);
  assert.match(sessionCss, /\.geoprefStage \{[^}]*background: #000/);
  assert.match(page, /geoprefSource=\{geoprefAsset\.path\}/);
});

test("the only automatic referral trigger is the published GeoPref threshold", () => {
  // The badge grew a module of its own when a demonstration needed a tone that
  // was neither the coral of a field referral nor the plain TERUKUR of an
  // ordinary session. The property that has to survive the move: the field
  // referral label is reachable from `emitsReferral` and from nothing else.
  const badge = readFileSync(new URL("../src/outcome/reportBadge.ts", import.meta.url), "utf8");
  assert.match(badge, /if \(input\.outcome\.emitsReferral\) return \{ tone: "refer", label: "PERIKSA LANJUT" \}/);
  assert.equal((badge.match(/label: "PERIKSA LANJUT"/g) ?? []).length, 1);
  assert.match(page, /className=\{`decisionBadge \$\{badge\.tone\}`\}/);
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
  // Pass/open state is carried by the status pill beside each gate heading, so
  // these assert the pill rather than a "Lulus:" prefix inside the heading text.
  assert.match(adminConsole, /Akuisisi stabil pada 100 sesi lintas kondisi/);
  assert.match(adminConsole, /Aliran gaze sejalan dengan referensi WebGazer\.js/);
  assert.match(adminConsole, /Lulus · 100 sesi/);
  assert.match(adminConsole, /Lulus · 27 dari 30/);
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

test("stated session duration is derived from the protocol, never retyped", async () => {
  const { STIMULUS_TOTAL_SECONDS, SCORED_TRIAL_COUNT } = await import("../src/stimulus/protocol");
  // 5 baseline + 16.75 preferential-looking + 8 cue trials x 5 + 13 name calls
  // + 5 ending = 79.75 s.
  assert.equal(STIMULUS_TOTAL_SECONDS, 80);
  assert.equal(SCORED_TRIAL_COUNT, 8);
  // No screen may state a duration as a literal; the operator reading it is
  // deciding whether the child in front of them will sit still for it.
  assert.doesNotMatch(page, /\b(?:66|96) detik\b/);
  assert.doesNotMatch(adminConsole, /\b(?:66|96) detik\b/);
  // The console describes the protocol, so it quotes the full battery. The
  // session screens quote what their own configuration will run, which is 13 s
  // shorter whenever the name call is silent — the same gap that had the UI
  // saying 66 while the battery was 96, only in the other direction.
  assert.match(adminConsole, /STIMULUS_TOTAL_SECONDS/);
  assert.match(page, /stimulusSeconds\(sessionStimulusPhases\(/);
  assert.doesNotMatch(page, /STIMULUS_TOTAL_SECONDS/);
  assert.match(page, /baterai pengukuran \{sessionSeconds\} detik/i);
  assert.match(page, /Total waktu kunjungan juga mencakup persetujuan, penyiapan, dan kalibrasi/);
});

test("admin explains why the stimulus was purpose-built, with sources and limits", () => {
  assert.match(adminConsole, /Adegan vektor dirancang untuk skrining, bukan hiburan/);
  assert.match(adminConsole, /referensi\/stimulus_billeci/);
  assert.match(adminConsole, /doi\.org\/10\.1016\/j\.cub\.2008\.03\.059/);
  assert.match(adminConsole, /doi\.org\/10\.3389\/fpsyg\.2019\.02187/);
  // Duration and version are read from the protocol module, not retyped. The
  // hardcoded assertions this replaces kept passing on 66 seconds and v3 for as
  // long as the shipped battery had been 96 seconds and v4.
  assert.match(adminConsole, /STIMULUS_TOTAL_SECONDS/);
  assert.match(adminConsole, /\{STIMULUS_VERSION\}|STIMULUS_VERSION\]/);
  assert.doesNotMatch(adminConsole, /66 detik|ID-joint-cues-vector-v3/);
  // Design rationale must not be mistaken for clinical validation.
  assert.match(adminConsole, /Batas klaim desain stimulus/);
  assert.match(adminConsole, /bukan instrumen yang sudah tervalidasi secara klinis/);
});

test("admin panel reports the positive control without overclaiming it", () => {
  // The number the section exists to carry: the rule did not fire on anyone who
  // merely watched. Losing it would leave the section describing separation
  // without the specificity half of the story.
  assert.match(adminConsole, /0 \/ 9/);
  assert.match(adminConsole, /Jarak terdekat/);
  // Separation is reported as a margin in the signal's own units, because AUC
  // 1,00 on 15 sessions only says no pair swapped order.
  assert.match(adminConsole, /Kolom yang penting adalah jarak terdekat, bukan AUC/);
  // Adults following a script. No sensitivity, specificity, or accuracy.
  // Matched against whitespace-collapsed source: this sentence sits inside JSX
  // prose, so where the line happens to wrap is formatting, not contract.
  const flowed = adminConsole.replace(/\s+/g, " ");
  assert.match(adminConsole, /Yang data ini tidak tunjukkan/);
  assert.match(flowed, /tidak ada sensitivitas, spesifisitas, atau akurasi/i);
  // Confounds ship with the result rather than being discovered by a reader.
  assert.match(adminConsole, /Panel geometrik selalu di kanan/);
  // The shipped rule cannot fire; only demonstration mode can.
  assert.match(adminConsole, /Mode demonstrasi — bukan rujukan/);
});

test("admin panel verifies the GeoPref clip as a file, not as an asset", () => {
  // Container facts a reader can check against the file itself.
  assert.match(adminConsole, /38576193099bec758837036582b7814a2728c431829e22f9d0e92ffe91fedf2f/);
  assert.match(adminConsole, /Trek audio/);
  // Silence is the protocol, so nobody "fixes" it by adding a soundtrack.
  assert.match(adminConsole, /Jangan menambahkan trek suara/);
  // Each asset carries its own operating point; one test's evidence must not be
  // quoted on another test's measurement.
  assert.match(adminConsole, /Tidak ada preseden operasional/);
  assert.match(adminConsole, /Sensitivitas 17% · spesifisitas 98%/);
  assert.match(adminConsole, /Sensitivitas 18% · spesifisitas 97%/);
  // The reason the cutoff is held in the field.
  assert.match(adminConsole, /Kenapa ambang 69% ditahan/);
  assert.match(adminConsole, /validatedProtocol/);
});

test("admin panel navigation covers every section it renders", () => {
  // A nav entry pointing at a section that no longer exists silently dead-ends,
  // and a section with no nav entry is unreachable from the rail.
  const navIds = [...adminConsole.matchAll(/\{ id: "([a-z-]+)", label: "/g)].map((match) => match[1]);
  const sectionIds = [...adminConsole.matchAll(/<section id="([a-z-]+)"/g)].map((match) => match[1]);
  assert.deepEqual([...navIds].sort(), [...sectionIds].sort());
  assert.ok(navIds.includes("kontrol-positif"));
  assert.ok(navIds.includes("klip-geopref"));
});

test("step numbering has one source, so no screen can disagree with the rail", () => {
  // The fullscreen calibration screen used to say "Langkah 3 dari 6" while the
  // rail said 09 / 09.
  assert.doesNotMatch(page, /Langkah \d+ dari \d+</);
  assert.match(page, /function sessionStepPosition\(stage: Stage\)/);
  assert.match(page, /sessionStepPosition\("calibration"\)\.number/);
});

test("the report can be handed over on paper, not only as audit.json", () => {
  assert.match(page, /className="printSummary"/);
  assert.match(page, /window\.print\(\)/);
  for (const required of ["Batas klaim", "Ambang rujukan 69%", "sensitivitas ambang ini 17%"])
    assert.ok(page.includes(required), `print summary is missing: ${required}`);
  assert.match(page, /className="printDemonstration"/);
  const printCss = sessionCss.slice(sessionCss.indexOf("@media print"));
  const hiddenPrintSelectors = printCss.match(/([\s\S]*?)\{ display: none !important; \}/)?.[1] ?? "";
  assert.doesNotMatch(hiddenPrintSelectors, /\.caregiverReport/);
  assert.match(hiddenPrintSelectors, /\.cardActions/);
  assert.match(hiddenPrintSelectors, /\.reportPractitioner/);
  assert.match(printCss, /\.caregiverReport\s*\{[^}]*display:\s*block/);
  assert.match(printCss, /\.printDemonstration\s*\{[^}]*display:\s*block/);
  assert.match(page, /<p className="printVerdict"[^>]*>\{verdict\.headline\}<\/p>/);
  assert.match(page, /verdict\.reasons\.filter\(\(reason\) => reason\.id === "posterior_odds"\)/);
  assert.match(page, /verdict\.demonstration \? "Respons arsitektur peragaan"/);
});

test("deleting the in-memory audit log requires confirmation", () => {
  assert.match(page, /window\.confirm\(/);
  assert.match(page, /onClick=\{confirmDeleteCurrentAudit\}/);
  assert.doesNotMatch(page, /onClick=\{deleteCurrentAudit\}/);
});

test("mobile evidence and admin controls remain readable and touchable", () => {
  const mobileValidation = validationCss.slice(validationCss.indexOf("@media (max-width: 720px)"));
  for (const selector of [".definition p", ".metrics span", ".metrics small", ".card dt", ".card dd", ".card li", ".nextEvidence p"])
    assert.match(cssDeclarationsForSelector(mobileValidation, selector), /font-size:\s*14px/);
  const mobileReport = sessionCss.slice(sessionCss.indexOf("@media (max-width: 520px)"), sessionCss.indexOf("@media (prefers-reduced-motion: reduce)"));
  for (const selector of [
    ".reportHeader .eyebrow",
    ".reportHeader p",
    ".decisionBadge",
    ".reportNotice p",
    ".observationStatus",
    ".reportPractitioner > summary small",
    ".observationMetrics span",
    ".observationMetrics p",
    ".referralReason",
    ".referralSignals li small",
    ".verdictReasons li small",
  ])
    assert.match(cssDeclarationsForSelector(mobileReport, selector), /font-size:\s*14px/);
  assert.match(cssDeclarationsForSelector(chromeCss.slice(chromeCss.indexOf("@media (max-width: 520px)")), ".presentationStrip small"), /font-size:\s*14px/);
  assert.match(adminCss, /@media \(max-width: 900px\)[\s\S]*?\.navToggle\s*\{[^}]*min-height:\s*44px/);
  assert.match(chromeCss, /\.navMenuButton\s*\{[\s\S]*?min-height:\s*44px/);
});

test("operational report and controls use restrained product styling", () => {
  assert.match(cssRule(sessionCss, ".sessionShell :is(input, select, button, summary)"), /font-family:\s*var\(--font-sans-stack\)/);
  assert.match(cssRule(sessionCss, ".observationMetrics strong"), /font-family:\s*var\(--font-sans-stack\)/);
  assert.match(sessionCss, /select:focus-visible[\s\S]*?summary:focus-visible[\s\S]*?outline:/);
  for (const selector of [
    '.referralLane[data-recommends="true"]',
    '.sessionVerdict[data-tone="follow_up"]',
    '.sessionVerdict[data-tone="no_follow_up"]',
    ".observationAnswer",
    ".decisionRuleGrid article.current",
  ])
    assert.doesNotMatch(cssRule(sessionCss, selector), /gradient|box-shadow/);
  assert.match(cssRule(sessionCss, ".decisionBadge.refer"), /var\(--coral-/);
  assert.doesNotMatch(cssRule(sessionCss, '.reportNotice[data-kind="demonstration"]'), /var\(--coral-/);
  assert.doesNotMatch(cssRule(sessionCss, ".ruleIcon.alert"), /var\(--coral-/);
});

test("every screen change is announced and skippable", () => {
  assert.match(page, /className="skipLink" href="#konten"/);
  assert.match(page, /id="konten"/);
  assert.match(page, /className="srOnly" role="status" aria-live="polite"/);
});

test("the quick demo runs the real pipeline and says what produced the report", () => {
  assert.match(page, /async function startQuickDemo\(options/);
  // It must not stage a fake report: the demo goes through runCalibration and
  // runStimulus like any other session.
  assert.match(page, /await runStimulus\(\{ fast: true \}\)/);
  assert.match(page, /REKAMAN — bukan sesi langsung/);
  assert.match(page, /SIMULASI — bukan sesi langsung/);
});

test("demonstration mode never reaches the child path and never emits a referral", () => {
  // The flag cannot survive a child session: start() recomputes it every time
  // and gates it on replay or the adult purpose, so no argument turns it on for
  // `target_population_research` — the one purpose that means a child is in
  // front of the tablet.
  assert.match(page, /modeChoice === "replay" \|\| purpose === "stage_demo"/);
  // Aimed at the call sites rather than at comments or explanatory copy.
  assert.ok(
    !/start\([^)]*"target_population_research"[^)]*demonstration/i.test(page),
    "the child purpose must never be started with demonstration mode on",
  );
  const replayDemonstrationCalls = [...page.matchAll(/startQuickDemo\(\{([^}]*demonstration: true[^}]*)\}\)/g)];
  assert.ok(replayDemonstrationCalls.length > 0, "a registered replay demonstration should remain available");
  for (const call of replayDemonstrationCalls) {
    assert.match(call[1], /\bentry\b/, "every demonstration replay must name its registered recording");
  }
  assert.doesNotMatch(page, /startQuickDemo\(\{\s*demonstration: true\s*\}\)/);
  // Live stage demonstration runs under its own purpose, from the guide control
  // that names it out loud.
  assert.match(page, /start\("live", scenario, "stage_demo", \{ demonstration: true \}\)/);
  // start() is the only writer. A consent-screen toggle would create a third
  // demo lane and let an ordinary field setup silently change purpose.
  assert.doesNotMatch(page, /function setDemonstration\(/);
  assert.equal((page.match(/setDemonstrationMode\(/g) ?? []).length, 1);
  // The operator-facing banner has to say the threshold was applied on purpose
  // and that the session produces no referral.
  assert.match(page, /MODE DEMONSTRASI/);
  assert.match(page, /demonstrationMode && <div className="reportNotice" data-kind="demonstration"/);
  // It is written into the audit log, so an exported session cannot hide it —
  // and it is written where the log actually exists. Recording it before
  // start() appended the event to the previous session's log, which start()
  // then discarded, so the evidence looked present and was not.
  assert.match(page, /appendAuditEvent\(next, "session\.demonstration_mode"/);
  // The only place the demonstration threshold is applied is the scorer, which
  // marks the outcome so sessionOutcome can force emitsReferral to false.
  const outcome = readFileSync(new URL("../src/outcome/sessionOutcome.ts", import.meta.url), "utf8");
  assert.match(outcome, /isDemonstrationOutcome\(input\.geopref\.outcome\)/);
  // Bound to the first `emitsReferral` after the branch opens rather than to a
  // character window, so adding a sentence of copy cannot quietly stop the
  // assertion from reaching the line it is about.
  const demonstrationBranch = /kind: "RULE_IN_DEMONSTRATION"[\s\S]*?emitsReferral: (true|false)/.exec(outcome);
  assert.ok(demonstrationBranch, "the demonstration branch should exist");
  assert.equal(demonstrationBranch![1], "false");
  // The decision the operator read goes into the log next to the gaze samples
  // and the quality gate, so an exported demonstration is arguable from the
  // file rather than only from whoever was in the room.
  assert.match(page, /quality: nextQuality, gaze, assessment, decision/);
  assert.match(page, /const decision = \{[\s\S]{0,600}?demonstrationMode,/);
});

test("ordinary field setup is blank and contains no demo or research-log opt-in", () => {
  assert.match(
    page,
    /if \(purpose === "target_population_research"\) return \{ childId: "", age: "", site: "", operator: "" \}/,
  );
  for (const example of ["Contoh: NG-0042", "Contoh: 24", "Contoh: Posyandu Melati 3", "Contoh: Kader-07"])
    assert.ok(page.includes(example), `field example must be a placeholder: ${example}`);

  const consentSection = page.match(/\{stage === "consent"[\s\S]*?\{stage === "preparation"/)?.[0] ?? "";
  assert.doesNotMatch(consentSection, /demonstrationField|Peragaan demo|setDemonstration/);
  assert.match(consentSection, /\{isEngineeringStudy && <label className="checkRow optional">[\s\S]*?researchConsent/);

  const reportSection = page.match(/\{stage === "report"[\s\S]*?\{stage === "stimulus"/)?.[0] ?? "";
  assert.match(reportSection, /sessionPurpose === "target_population_research"[\s\S]*?researchConsent/);
  assert.match(reportSection, /Izinkan log teknis pseudonim dipakai untuk riset/);
});

test("field research export is consent-gated and the interactive consent control never prints", () => {
  const calibrationSection = page.match(/\{stage === "calibration"[\s\S]*?\{stage === "sanity"/)?.[0] ?? "";
  assert.match(calibrationSection, /sessionPurpose !== "target_population_research"[\s\S]*?Unduh log analisis/);
  assert.match(page, /disabled=\{!researchConsent\}[\s\S]*?Unduh log analisis riset/);
  assert.match(page, /className="checkRow optional researchExportConsent"/);
  assert.match(sessionCss, /@media print \{[\s\S]*?\.researchExportConsent[\s\S]*?display: none !important/);
});

test("a second failed field calibration offers only a non-research diagnostic export", () => {
  const calibrationSection = page.match(/\{stage === "calibration"[\s\S]*?\{stage === "sanity"/)?.[0] ?? "";
  assert.match(
    calibrationSection,
    /sessionPurpose === "target_population_research" && calibrationAttempts >= 2 && calibrationFailed[\s\S]*?downloadCurrentAudit\("operator_audit"\)[\s\S]*?Unduh log diagnostik/,
  );
  assert.match(
    calibrationSection,
    /calibrationAttempts >= 2 \? \(sessionPurpose === "target_population_research"[\s\S]*?"Hentikan pengulangan\. Unduh log diagnostik lalu akhiri tes\."/,
  );
  assert.doesNotMatch(calibrationSection, /downloadCurrentAudit\("research_analysis"\)/);
});

test("registered replay is loaded before the demonstration session is initialized", () => {
  const quickDemo = page.match(/async function startQuickDemo[\s\S]*?\n  \}/)?.[0] ?? "";
  assert.match(quickDemo, /orchestrateRegisteredReplay/);
  assert.doesNotMatch(quickDemo, /loadFirstRecording/);
  assert.match(page, /demoReplayError[\s\S]*?role="alert"/);
});

test("the child calibration target is a face that stays visible while active", () => {
  assert.match(page, /<CalibrationCharacter active=\{calibrationTarget === index\} \/>/);
  assert.doesNotMatch(page, /calibrationTarget === index \? <i \/> : useTechnicalCalibration \? index \+ 1 : <IconChild/);
});

test("the vector actor keeps the eye properties gaze cueing depends on", () => {
  // Schematic faces do drive gaze following in infancy, but the effect is
  // carried by specific perceptual properties rather than by "a face" in the
  // abstract. Two of them are checkable here, so a restyle cannot quietly
  // remove them:
  //
  //  1. Contrast polarity. Cueing relies on the ordinary pattern of a dark
  //     pupil on a light sclera; reversed polarity elicits distinctly weaker
  //     effects.
  //  2. Visible pupil motion. The cue is the eyes moving, not a face drawn
  //     already looking sideways.
  const hex = (selector: string) => {
    const at = sessionCss.indexOf(`${selector} {`);
    if (at < 0) return undefined;
    return sessionCss.slice(at, sessionCss.indexOf("}", at)).match(/fill:\s*(#[0-9a-fA-F]{6})/)?.[1];
  };
  const luminance = (value: string) => {
    const n = parseInt(value.slice(1), 16);
    return 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255);
  };
  const sclera = hex(".sclera");
  const pupil = hex(".pupil");
  const iris = hex(".iris");
  assert.ok(sclera && pupil && iris, "sclera, iris and pupil must all be explicitly filled");
  assert.ok(
    luminance(sclera!) - luminance(pupil!) > 150,
    `pupil ${pupil} must stay far darker than sclera ${sclera}`,
  );
  assert.ok(luminance(iris!) < luminance(sclera!), "iris must be darker than the sclera");

  // The eyes lead the cue and actually translate; a static sideways drawing
  // would not be the same stimulus.
  assert.match(sessionCss, /\.stimulusScene\.visual-gaze-left\.cue-active \.eyeball[\s\S]{0,120}?translate\(-\d+px/);
  assert.match(sessionCss, /\.stimulusScene\.visual-gaze-right\.cue-active \.eyeball[\s\S]{0,120}?translate\(\d+px/);
  // Eye contact is established in the ostensive epoch, before any direction.
  assert.match(sessionCss, /\.stimulusScene\.ostensive \.eyeball\s*\{[^}]*translate\(0, 0\)/);
});
