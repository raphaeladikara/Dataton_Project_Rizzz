# Neurogaze

Neurogaze is an offline-first web application for gaze-measurement research related to early ASD screening. Camera processing runs in the browser; raw video is neither uploaded nor stored.

> Neurogaze is not a diagnostic device. It is a rule-in instrument: a positive result is informative, a negative result is not reassurance.

## What a session produces

An 80-second battery measures three things and reports them separately. Preferential
looking runs second, right after the opening attention block, because it carries the
only externally published threshold in the system and should not be measured on a
tired, socially primed child.

| Layer | What it is | Can it trigger a referral? |
|---|---|---|
| **A — GeoPref** | Percent geometric fixation against the published 69% cutoff (Wen et al. 2022, n=1863, ages 12–48 months, sensitivity 17%, **specificity 98%**) | **Yes** — the only trigger with an external threshold |
| **B — Behavioural profile** | Facing-forward, head movement, blink rate, response to name, cue following with a within-session sign test | No. Descriptive, read alongside SDIDTK/M-CHAT |
| **B2 — Composite recommendation** | A readable rule over three signals that need no toddler norm: the published GeoPref cutoff, plus two within-subject contrasts (cue following, response to name) | Recommends a follow-up examination. Not validated on toddlers, and reported beside Layer A rather than merged into it |
| **C — Combined weighted model** | Being replaced rather than built. No toddler will be recorded by this team before ethics approval, so the layer is assembled from published operating points and weights fitted on an openly licensed labelled dataset instead | Not yet |

Layer B2 exists because the combining layer was empty and the product could therefore
recommend nothing. It is not a fitted score: `combinedScore` is still `null` and no
code path can fill it. The one invented parameter, how many signals must deviate, is
typed as `design_choice_not_validated_cutoff` and says so on screen and on paper.

That parameter is being withdrawn rather than defended. Its replacement is a sum of
log likelihood ratios whose every term carries a citation, with any signal that has no
published operating point — and any signal the session could not assess — contributing
LR = 1 and therefore moving nothing. The relative weighting between signals is fitted
on 59 labelled children from an openly licensed published dataset (Cilia et al. 2022,
CC BY 4.0), because no child is recorded by this team. What transfers is the relative
weighting, not the operating point. The design, the four audits that gate it, and the
criteria for rejecting it outright are in [`docs/model_rujukan.md`](docs/model_rujukan.md).

Three indices are deliberately excluded from the rule. Facing-forward and head movement
carry precedent AUCs but no transferable cutoff, so scoring them would mean inventing a
number. The blink differential is out for a different reason: the only non-actor block
in the battery is the preferential-looking clip, so a social/non-social blink contrast
is fully confounded with rendering medium — hand-drawn vector against real video — and a
16.75 s window quantises blink rate in steps of 3.6 per minute, which counting noise
dominates. All three stay on the report as descriptive measures.

**No measurement crosses the medium boundary.** The session runs two visual worlds: a
published video clip and a vector actor. GeoPref is scored entirely inside the clip;
cue following compares post-cue against pre-cue within the same vector trial; response
to name is event detection inside the vector block. Nothing is computed across the seam
between them, which is why the mixed presentation does not put a confound into any
decision signal.

Layer A misses most autistic children by design, and the interface says so. Its value
is the opposite of a questionnaire's: a positive result is worth acting on. Layer B's
index family follows Perochon et al. 2023 (*Nature Medicine*), which reached
sensitivity 87.8% / specificity 80.8% on the same hardware class — that is the Gate C
target, not a claim about this system today.

The bundled Carette logistic regression does not participate. Its geometric features
encode where that study's stimulus sat on screen, so its decision boundary does not
transfer. It runs only behind an out-of-distribution guard in the research panel.

## Evidence status

| Gate | Status | Canonical result |
|---|---|---|
| A | **Passed** | 100 sessions, 25 participants, 3 devices; 94% completion, 2.207° median calibration error, 96.4% mean valid-frame rate, 3.6% mean dropout |
| B | **Passed** | 30 simultaneous browser comparisons against WebGazer.js 3.5.3; 27 ready, 3 withheld, 0.040997 median normalized error, 99.7118% mean AOI agreement recomputed from raw coordinates |
| C | Open | Prospective clinical validation in the target population has not been completed. Target: sensitivity 88% / specificity 81%, from Perochon et al. 2023 |
| D | Open | Field implementation with Posyandu operators has not been completed |

Gate B's reference is WebGazer.js, the method ManyBabies validated for toddlers aged
18–27 months (Steffan et al. 2024, *Infancy*, N=125 across 16 labs). Absolute accuracy
comes from Gate A's known calibration targets: median 2.36°, p90 3.58° across 94
sessions, against WebGazer's published 4.17° (Papoutsaki et al. 2016).

The raw Gate A/B exports, derived summaries, and SHA-256 manifest are stored in [`research/hasil`](research/hasil). The complete interpretation and acceptance criteria are in [`docs/bukti_gate_a_b.md`](docs/bukti_gate_a_b.md).

Every published pair metric is rederived from the raw coordinates by
[`research/recompute_gate_b.py`](research/recompute_gate_b.py). Distances reproduce to
0.001 px; AOI agreement does not, on 4 of 27 pairs, and the difference is published in
`gate_b_summary.json` rather than reconciled away.

### What a live session outputs

A completed camera session produces a per-child report: the GeoPref percentage, the
five behavioural indices with their precedent AUCs, and an explicit outcome —
rule-in, measured without rule-in, protocol abbreviated, or withheld. The report can
be printed as a one-page hand-off for the Puskesmas. The audit log stays in memory
until the operator exports or deletes it.

### What the preferential-looking block actually plays

The 69% cutoff has been applied to two different tests, and they do not share a
precedent. Wen et al. 2022 (*Scientific Reports* 12:4253) validated it at scale on the
**original 62.22-second GeoPref** — n=1863, ages 12–48 months, sensitivity 17%,
specificity 98%. Moore et al. 2018 carried the same cutoff to the **90-second Complex
Social GeoPref** for consistency rather than re-optimising it, reporting sensitivity
18%, specificity 97%, AUC 0.74 on a much smaller sample. Each asset in
[`app/src/geopref/stimulusMeta.ts`](app/src/geopref/stimulusMeta.ts) carries its own
operating point so one test's evidence cannot be quoted on another test's measurement.

What ships is neither: a **16.75-second excerpt** — one of five scenes — of the Complex
Social example video published as Additional file 2 of Moore et al. 2018. So
`validatedProtocol` is false, the cutoff is **held**, and the session reports the
measured percentage while saying the protocol was abbreviated. The access request for a
full stimulus is in
[`docs/provenance/permintaan_stimulus_ucsd.md`](docs/provenance/permintaan_stimulus_ucsd.md).

Two properties of the asset are deliberate, not defects:

- **It is silent.** The Moore et al. methods state there was no audio; both GeoPref
  variants are presented without sound. Do not add a soundtrack.
- **It is letterboxed.** The panels occupy only 19.8% of the 640×360 frame, the rest is
  black, because the file is a supplementary illustration rather than a presentation
  master. Played whole, each panel subtended roughly 7.6° × 4.9° on a target tablet
  against the 12.9° × 9.1° Moore et al. report, so the app crops the surround away.
  `geoprefPanelDegrees()` makes that geometry checkable per device instead of asserted.

Container facts are verifiable: one video track, **zero audio tracks**, avc1, 502
frames, SHA-256 pinned in
[`app/public/stimuli/geopref-social-geometric-ccby.json`](app/public/stimuli/geopref-social-geometric-ccby.json).

The reasoning behind these decisions is recorded in
[`docs/keputusan_ilmiah.md`](docs/keputusan_ilmiah.md).

### Known gaps

- Replay still plays synthetic points until a recorded session is registered, and the
  demo report is withheld. The synthetic scanpath is genuinely out of distribution, so
  the OOD guard flags it and the quality gate refuses to score — the report now names
  the offending features instead of only saying no. Registering one real session is
  what fixes this: `npm run replay:register -- <audit-log.json> --as session-a.json`,
  which refuses a log that carries no frame trace instead of registering a recording
  that would reproduce the synthetic path's empty indices.
- Because of that, the composite recommendation and the demonstration report have
  been verified by contract and unit tests but never seen rendering with real numbers.
  The positive-control protocol that produces those recordings is in
  [`docs/kontrol_positif.md`](docs/kontrol_positif.md).
- Nothing in this repository demonstrates that the pipeline can separate two
  behavioural conditions. Gate A shows accuracy, Gate B shows agreement; neither shows
  discriminative response. That is what the positive control is for.
- The Gate B known-target block (nine targets, absolute accuracy for both streams)
  is implemented on the analysis side but no session has recorded one yet.
- No toddler appears in any evidence in this repository, and none will before ethics
  approval. Recording a child requires parental consent, and parental consent is not
  valid without an ethics review that states what is being asked; recording an autistic
  child requires more than that again. Five institutions were approached and all five
  declined, which was the right call at this stage of evidence. The constraint, what it
  rules out, what is permitted instead, and the answers to the questions a panel will
  ask are in [`docs/etika_perekaman.md`](docs/etika_perekaman.md).

## Run the application

On Windows, from the repository root:

```powershell
.\start.bat
```

For frontend development:

```powershell
cd app
npm ci
npm run dev
```

Browser camera access requires HTTPS or localhost. For Vercel, use `app` as the project root directory.

## Verify the project

```powershell
.\.venv\Scripts\python.exe research\gate_evidence_repository.py --rebuild --verify
.\.venv\Scripts\python.exe -m pytest -q
cd app
npm test
npm run lint
```

See [`docs/verifikasi.md`](docs/verifikasi.md) for the complete release checklist.

## Repository map

- `app/`: Next.js PWA, browser pipeline, and frontend tests.
- `research/`: analysis code, notebooks, model evaluation, and canonical evidence.
- `notebook/`: final Kaggle notebooks and supporting experiments.
- `paper/`: LaTeX source and final paper PDF.
- `docs/`: evidence interpretation, protocols, operator guidance, and verification.
- `huggingface/`: model card and exported tabular model artifacts.
