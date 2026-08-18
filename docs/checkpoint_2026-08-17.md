# Handoff: NeuroGaze — three-layer measurement rebuild

## Next Session Focus

Resume the approved plan at **Task 26 (quick-demo path)**, finish the remaining UX
tasks (27, 28), then move to **Fase 4 (Gate B)** starting at Task 17.

Plan file: `C:\Users\Raphael Angelo\.claude\plans\oke-bikinin-plannya-secara-recursive-eclipse.md`
(30 tasks, 7 phases, full code in each step).

## Current State

13 commits, since merged into `main`. That branch no longer exists; the repo keeps
only `main`. Working tree clean. All checks green:

- 22 Python tests, 138 TypeScript tests, ESLint clean, `next build` succeeds
- `research/gate_evidence_repository.py --rebuild --verify` passes (130 files)

**Done:** Fase 1 (per-frame trace + phenotype indices), Fase 2 (GeoPref rule-in),
Fase 3 (per-child live report, Carette demoted to OOD-gated research panel),
Fase 6 Task 25 (consent CTA blockers).

**Not done:** Fase 4 (Gate B recompute + known-target accuracy), Fase 5 (Youden
export, four-arm Gate C simulation, provenance pack), Fase 6 Tasks 26-28,
Fase 7 (paper + pitch alignment).

## Key Decisions

- **Carette LR removed from the decision path, kept in the repo.** Its geometric
  features encode where the Carette study's stimulus content sat on screen, so the
  decision boundary does not transfer to a different stimulus — separate from the
  age and 250 Hz vs 30 fps gaps. It still runs and feeds a research panel where the
  OOD guard rejects it; that rejection is a deliberate demo beat. Kept because it
  is the entire basis of the paper's evaluation evidence and the only end-to-end
  numeric parity proof (`app/tests/parity.test.ts`, 1e-12).
- **Three-layer architecture.** A: GeoPref ≥69% is the only automatic referral
  trigger (Wen et al. 2022, n=1863, 12–49 months, sens 17% / spec 98%). B:
  multi-index descriptive profile modelled on SenseToKnow (Perochon et al. 2023,
  *Nature Medicine*, tablet front camera, sens 87.8% / spec 80.8%). C: Gate C
  target taken from that precedent instead of invented.
- **No combined score before Gate C.** `PhenotypeProfile.combinedScore` is typed
  `null` and `combinationRuleStatus` is a literal; combining indices needs weights
  fitted on labelled toddlers, which do not exist yet.
- **A below-threshold result may never read as reassurance.** GeoPref NPV is 65%.
  Enforced by type (`reassures: false`) and by contract test.
- **Child's given name is transient.** Held in a ref for speech synthesis during
  the name-call phase, never copied into `profile`, never written to the audit log.
- **Battery grew 66s → 96s** with the preferential-looking and name-call phases.
  Still far under the ~10 min battery in the precedent, but untested on toddlers.

## Files And Artifacts

- `app/src/capture/frameTrace.ts`: per-frame pose/eyeOpen series. `faceLandmarker.ts:130-132`
  already computed yaw/pitch/roll and threw them away at `:145`; this keeps them.
- `app/src/phenotype/`: `entropy`, `facingForward`, `headMovement`, `blink`,
  `responseToName`, `profile`. Precedent AUCs are recorded in `profile.ts` provenance.
- `app/src/geopref/`: `stimulusMeta` (validatedProtocol gate), `protocol` (measured
  AOIs + letterbox projection + mirror rule), `score` (69% cutoff).
- `app/src/outcome/sessionOutcome.ts`: the only place that decides report wording.
- `app/src/domain/consent.ts`: `consentBlockers`, drives both the disabled state and
  the visible message.
- `app/public/stimuli/geopref-social-geometric-ccby.mp4`: Moore et al. 2018, CC BY 4.0.
  **Panel bounds measured from the asset**: x 129-316 (social) and 324-513 (geometric),
  y 120-242 on a 640x360 frame, stable at t = 1, 4, 8, 12, 15 s.
- `PRODUCT.md`: register, users, five design principles (new this session).
- `AGENTS.md`, `README.md`: updated to match the new architecture.

## Commands And Verification

- Ran: `.venv\Scripts\python.exe -m pytest -q` -> 22 passed
- Ran: `npx tsx --test tests/*.test.ts` (in `app/`) -> 138 passed
- Ran: `npm run lint`, `npm run build` (in `app/`) -> clean, compiled
- Ran: `research\gate_evidence_repository.py --rebuild --verify` -> manifest verified
- Verified in browser: consent blockers render, 6.26:1 contrast, no overflow at 375px
- Verified by pixel analysis: GeoPref AOIs align with the clip's actual panels
- **Not run:** any live-camera session. No camera in this environment; the live
  capture path, name-call speech, and phenotype indices on real frames are unverified
  end to end.

## Suggested Skills

- `impeccable`: Tasks 26-28 are production UI work. `PRODUCT.md` now exists so its
  setup step will not block. Register is **product**.
- `test-driven-development`: every task in the plan is written test-first.
- `verification-before-completion`: before claiming any task done.
- `finishing-a-development-branch`: when wrapping the next branch.

## Risks Or Blockers

- **Replay is still synthetic.** `app/src/replay/scenarios.ts` generates 360 points
  from an LCG (seeds 17/29/41) and never populates the frame trace, so four of six
  indices show "—" and the outcome is WITHHELD in replay. The export machinery is
  ready (`processedPoints` + `frames` land in the audit log on live sessions).
  **Blocked on the user recording 3 adult sessions** and dropping the JSON into
  `app/public/replay/`. This is plan Task 15.
- The replay banner currently says "Simulasi dengan hasil tetap" — correct today.
  It must change when real recordings land.
- Gate C simulation still cites CNN numbers (sens 0.846 / spec 0.75) that belong to
  a model that cannot run on the target device. Plan Task 21 fixes it. A judge can
  find this inconsistency quickly, so it is the highest-value remaining fix.
- `research/hasil/model.json` still ships only the sensitivity-0.9 operating point
  (spec 0.179). The Youden point (0.4985 → sens 0.731 / spec 0.821) exists only in
  `paper/sumber/paper_final.tex:1151`. Plan Task 20.
- Toddler tolerance of the 96s battery is untested.
- Impeccable skill is v3.6.0; v4.1.1 available. User was asked, did not answer.

## Resume Steps

1. `git checkout -b <new-branch>` from `main` (main now contains this work).
2. Read the plan file, Task 26 onward.
3. Task 26: add a "Demo cepat" control on the home screen that fills a sample
   profile, loads a recording, and jumps straight to `stage === "report"`, labelled
   as recorded and not a live session.
4. Task 27: unify step numbering (rail says `09 / 09`, fullscreen says
   `LANGKAH 3 DARI 6`), add a printable report summary, skip link, second aria-live.
5. Task 28: replace the child calibration dot with an animated character.
6. Then Fase 4, starting with Task 17 (`research/recompute_gate_b.py`).
