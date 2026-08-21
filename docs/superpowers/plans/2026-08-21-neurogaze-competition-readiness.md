# NeuroGaze Competition Readiness Implementation Plan

> **For Codex:** Execute continuously with subagent-driven development, test-driven development, spec review, and code-quality review. Preserve canonical raw evidence and the untracked `deck/` workspace.

**Goal:** Turn NeuroGaze into a judge-ready engineering and responsible-AI demonstration without claiming toddler clinical validity that has not been earned.

**Architecture:** Keep the existing three evidence layers and session-purpose union. Extract small, testable contracts for offline readiness, media readiness, and report presentation while leaving scoring math and immutable evidence untouched. The field path remains a non-referring observation; only explicit guide/demo entry points may demonstrate the rule on a consenting adult.

**Tech stack:** Next.js 16, React 19, TypeScript, service worker Cache API, Node test runner, Python evidence generators, CSS modules/global CSS.

---

## Task 1: Lock the field/demo and consent contracts

**Files:**
- Modify: `app/tests/child-flow-contract.test.ts`
- Modify: `app/tests/consent-blockers.test.ts`
- Modify: `app/src/domain/consent.ts`
- Modify: `app/app/page.tsx`

**Step 1: Write failing contract tests**

Change the child-flow contract so it rejects a demonstration checkbox in the ordinary consent section, proves only `stage_demo`/replay entry points set demonstration mode, proves target-population defaults are empty, and proves research-log consent is not rendered in ordinary field setup. Extend consent tests so field continuation requires pseudonymous ID, age, site, operator, and service consent but not research consent.

**Step 2: Run focused tests and confirm RED**

Run: `npx tsx --test tests/child-flow-contract.test.ts tests/consent-blockers.test.ts`
Expected: failures identify the existing demo switch, example defaults, and mixed research consent.

**Step 3: Implement the minimum contract change**

Remove `setDemonstration` and the field consent toggle; preserve the explicit guide/demo start. Initialize target-population metadata with empty strings and examples as placeholders. Render research permission only at report/export time, while retaining Gate A/B administrative research requirements. Keep the given name transient.

**Step 4: Run focused tests and confirm GREEN**

Run the same focused test command and inspect 0 failures.

## Task 2: Gate GeoPref timing on media readiness

**Files:**
- Create: `app/src/ui/mediaReadiness.ts`
- Create: `app/tests/media-readiness.test.ts`
- Modify: `app/src/ui/stimulus-scene.tsx`
- Modify: `app/app/page.tsx`
- Modify: `app/src/audit/sessionLog.ts` only if an event type contract requires it

**Step 1: Write failing state-machine tests**

Test `loading -> ready -> playing`, prohibit timed start before `playing`, and make `error`, timeout, or hidden-page interruption terminal withheld reasons with Indonesian recovery copy.

**Step 2: Run focused test and confirm RED**

Run: `npx tsx --test tests/media-readiness.test.ts`
Expected: module missing or readiness transitions absent.

**Step 3: Implement readiness contract and integrate it**

Pre-mount/preload the GeoPref media before its timed phase. Add `onCanPlay`, `onPlaying`, `onError`, and an explicit timeout. Pause battery advancement until actual playback. On media failure or visibility interruption, stop scoring, record an audit event, and route to a withheld quality/report state with a retry instruction. Live and replay use the same contract.

**Step 4: Run media, stimulus, audit, and outcome tests**

Run: `npx tsx --test tests/media-readiness.test.ts tests/stimulus-protocol.test.ts tests/audit-log.test.ts tests/session-outcome.test.ts`

## Task 3: Make offline readiness truthful

**Files:**
- Create: `app/src/offline/readiness.ts`
- Create: `app/tests/offline-readiness.test.ts`
- Modify: `app/tests/offline.test.mjs`
- Modify: `app/public/sw.js`
- Modify: `app/app/page.tsx`

**Step 1: Write failing tests**

Require the GeoPref MP4 in the critical precache, require route-specific navigation keys, and test UI state derivation for `online`, `preparing`, `ready`, and `incomplete` based on service-worker control plus verified critical assets—not `navigator.onLine` alone.

**Step 2: Run focused tests and confirm RED**

Run: `node --test tests/offline.test.mjs && npx tsx --test tests/offline-readiness.test.ts`

**Step 3: Implement cache verification**

Bump the cache version; precache `/stimuli/geopref-social-geometric-ccby.mp4`; cache navigations by pathname and fall back to the requested route or root; add a service-worker message that verifies every critical URL. Register/wait for controller state in React and render the four localized states.

**Step 4: Run focused tests and confirm GREEN**

Run the same two commands and inspect 0 failures.

## Task 4: Simplify operational UX and layer the report

**Files:**
- Modify: `app/tests/child-flow-contract.test.ts`
- Create: `app/tests/report-presentation.test.ts`
- Create: `app/src/outcome/reportPresentation.ts`
- Modify: `app/app/page.tsx`
- Modify: `app/app/responsive.css`
- Modify: `app/app/session.css`
- Modify: `app/app/base.css`
- Modify: `app/app/home.css`
- Modify: `app/app/chrome.css`

**Step 1: Write failing source/domain tests**

Require a labelled compact nav with `aria-expanded`, 44px targets, a caregiver summary ordered as what happened / usability / next action / limitation, and one practitioner/auditor disclosure containing statistics and provenance. Lock “baterai pengukuran 67 detik” and reject unqualified duration claims on public surfaces.

**Step 2: Run focused tests and confirm RED**

Run: `npx tsx --test tests/child-flow-contract.test.ts tests/report-presentation.test.ts`

**Step 3: Implement progressive disclosure and restrained styling**

Add the compact tablet/mobile menu without hiding help/evidence/privacy. Build report presentation text in a pure module, render the caregiver layer first, and move all indices, intervals, p-values, decision lanes, OOD, and provenance under one disclosure. Preserve demonstration banner in screen and print. Reduce gradients, glass, oversized serif, pills, rounded nesting, tracked eyebrows, and ornamental entrance motion on operational screens; keep teal identity, focus visibility, reduced motion, and readable 14px+ mobile text.

**Step 4: Run focused tests and inspect responsive source contracts**

Run the focused test command and `npm run lint`.

## Task 5: Localize camera failures and harden response headers

**Files:**
- Create: `app/src/capture/cameraError.ts`
- Create: `app/tests/camera-error.test.ts`
- Create: `app/tests/security-headers.test.mjs`
- Modify: `app/app/page.tsx`
- Modify: `app/next.config.ts`

**Step 1: Write failing tests**

Cover permission denied, no camera, device busy, insecure context, timeout, and unknown camera errors. Require `poweredByHeader: false`, production HSTS, and a CSP covering default/script/style/img/font/connect/media/worker sources while preserving camera self-only and microphone denial.

**Step 2: Run focused tests and confirm RED**

Run: `node --test tests/security-headers.test.mjs && npx tsx --test tests/camera-error.test.ts`

**Step 3: Implement minimum safe changes**

Map browser exceptions to concise Indonesian recovery instructions without exposing raw exception strings. Tighten headers for self-hosted Next/MediaPipe/WASM/blob workers and media. Do not add backend/auth claims or attack surfaces.

**Step 4: Run focused tests, lint, and production build**

Run focused tests, `npm run lint`, and `npm run build`.

## Task 6: Align evidence, model, impact, and pitch claims

**Files:**
- Create: `docs/readiness_matrix.md`
- Create or modify: `research/export_readiness_matrix.py`
- Create: `research/tests/test_public_claims.py` or extend the existing claim-validation suite
- Modify: `research/export_public_evidence.py`
- Modify: `README.md`
- Modify: `docs/README.md`
- Modify: `docs/arah_pitch.md`
- Modify: `docs/pitch_10_menit.md`
- Modify: `docs/skenario_panggung.md`
- Modify: `docs/dampak_dan_adopsi.md`
- Modify: `docs/bingkai_ai.md`
- Modify: `docs/keputusan_ilmiah.md`
- Modify: `paper/sumber/paper_final.tex`
- Modify: `deck/build-deck.js` only for claim/source points; do not redesign or regenerate the deck

**Step 1: Write failing evidence/claim tests**

Lock the readiness matrix and positive-control denominators: 23 recorded, 15 quality-pass, 9/11 ordinary usable, 6/12 produced usable, rule 0/9 ordinary and 4/6 produced. Reject claims that localize 56 months to Indonesia, call Carette clinically validated, call 2.36 degrees exact, describe drift as 42x classifier accuracy, call Gate B ground truth, or present cost-per-case as observed NeuroGaze performance.

**Step 2: Run focused Python/Node tests and confirm RED**

Run the claim validator and positive-control tests.

**Step 3: Correct every main public surface**

Lead with the adult manipulation check and governance architecture. State that the field threshold is withheld because the shipped clip is shorter than the published full protocol. Present economics as a conditional scenario and name unmeasured operating costs. Replace “one approval away” language with the actual ethics/clinical partner requirements. Keep automatic toddler referral and kader usability explicitly untested.

**Step 4: Regenerate only derived public evidence**

Run the relevant generators. Never edit canonical raw Gate A/B/positive-control sessions. Verify exact public outputs and canonical hashes.

**Step 5: Run evidence verification**

Run Python tests, `python research/gate_evidence_repository.py --rebuild --verify`, and frontend evidence tests.

## Task 7: Humanize and visually verify public-facing copy

**Files:**
- Modify only human-readable strings in files already touched by Tasks 1–6
- Do not alter machine keys, enum values, citations, raw evidence, generated artifacts, or test contracts without updating their tests

**Step 1: Scan AI-writing density**

Run the ai-paraphrase scanner with `-AllText -Summary`, then inspect high-severity hits in touched UI/docs. Classify definitive artifacts, genuinely padded promotional prose, and false positives.

**Step 2: Rewrite only real human-facing problems**

Replace vague praise with exact evidence, remove repetitive triples and closing summaries, and keep the Indonesian operational voice direct. Do not flatten necessary scientific formality.

**Step 3: Re-scan and diff every rewrite**

Confirm claim meaning, denominators, citations, paths, and machine-readable values remain unchanged.

**Step 4: Browser QA**

Run the app and inspect desktop, tablet, and mobile field/demo/report paths. Verify keyboard navigation, focus, nav disclosure, offline states, long text, camera error recovery, print disclaimer, and no console errors. Capture replacement screenshots only if a registered real recording can produce the current report honestly.

## Task 8: Independent review and release verification

**Files:**
- Modify only defects found by review
- Update: `docs/verifikasi.md` if new required checks are missing

**Step 1: Spec-compliance review**

Review every completion criterion against the design spec and actual diff. Fix omissions, then re-review.

**Step 2: Code-quality and security review**

Review maintainability, race conditions, cleanup, accessibility, CSP compatibility, and genuine security issues. Fix important findings and re-review.

**Step 3: Run fresh full verification**

From `app/`: `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run replay:check`, `npm audit --json`, and `npm audit --omit=dev --json`.

From repo root: Python test suite, evidence rebuild/hash verification, public evidence regeneration checks, positive-control analysis/check, and paper-source claim checks documented in `docs/verifikasi.md`.

**Step 4: Review repository state**

Inspect `git status --short`, `git diff --check`, and scoped diff. Preserve untracked/user-owned deck outputs and do not stage unrelated files.

**Step 5: Final competition handoff**

Report exactly what changed across UX, reliability, model/evidence, responsible AI, impact, and pitch. Include fresh verification counts, honest remaining gaps, and a rubric table with old versus new estimated scores and the evidence for each increase.
