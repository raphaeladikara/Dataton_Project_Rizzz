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
| **B2 — Composite recommendation** | A readable rule over the signals that need no toddler norm: the published GeoPref cutoff, plus one within-subject contrast (cue following). Response to name is quarantined — its paradigm needs a caller behind the child, which a tablet speaker cannot provide | Recommends a follow-up examination. Not validated on toddlers, and reported beside Layer A rather than merged into it. Cannot fire while the licensed GeoPref clip is shorter than the published protocol |
| **C — Combined weighted model** | Being replaced rather than built. No toddler will be recorded by this team before ethics approval, so the layer is assembled from published operating points and weights fitted on an openly licensed labelled dataset instead | Not yet |

The published cutoff is compared against the session's 95% confidence interval rather
than against its point estimate. A session measuring 71% on a 16.75-second excerpt
cannot be told apart from one measuring 67%, so an interval that straddles 69% leaves
the signal unassessed — the same standard cue following has always been held to, where
a non-significant sign test is unassessed rather than counted as a deficit. The
estimator, the two that failed before it, and the operating characteristics against the
old point rule are in
[`docs/ambang_selang_kepercayaan.md`](docs/ambang_selang_kepercayaan.md).

Layer B2 exists because the combining layer was empty and the product could therefore
recommend nothing. It is not a fitted score: `combinedScore` is still `null` and no
code path can fill it. The one invented parameter, how many signals must deviate, is
typed as `design_choice_not_validated_cutoff` and says so on screen and on paper.

That parameter is to be withdrawn rather than defended, and the replacement is designed
rather than built. **It is not in the code yet, and nothing below should be read as
shipped.** The design: a sum of log likelihood ratios whose every term carries a
citation, with any signal that has no published operating point — and any signal the
session could not assess — contributing LR = 1 and therefore moving nothing. A second,
independent layer would fit the relative weighting between signals on 59 labelled
children from an openly licensed published dataset (Cilia et al. 2022, CC BY 4.0),
because no child is recorded by this team; that dataset has not been downloaded. What
would transfer is the relative weighting, not the operating point. The design, the four
audits that gate it, and the criteria for rejecting it outright are in
[`docs/model_rujukan.md`](docs/model_rujukan.md).

What ships today is still `REFERRAL_DEVIANT_THRESHOLD = 2` in
[`app/src/outcome/referralRecommendation.ts`](app/src/outcome/referralRecommendation.ts),
typed `design_choice_not_validated_cutoff` and labelled as such on screen.

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

The strongest evidence here is not the gate table. It is the positive control: 12
consenting adults, 23 sessions, three devices, recorded 19 August 2026 through the
shipped application. All three decision signals separate the two behavioural conditions
with no session of one overlapping the other, and the composite rule fires on **0 of 9**
ordinary-viewing sessions. It is also the first evidence in this project whose chain is
complete from camera to number, which is why it leads.
[`research/hasil/kontrol_positif/README.md`](research/hasil/kontrol_positif/README.md)
carries the numbers, the confounds, and the nine defects the recordings exposed.

What it does not show is anything about autism: the participants are adults following a
script, so there is no sensitivity, specificity, or accuracy in it.

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

**One link in the Gate A/B chain cannot be checked from inside this repository.** The
sessions were run and are photographed, but the recording harness lived outside the
repository and is gone, and the shipped export path does not write files that round the
way these do. The summaries are still an honest function of the raw files and the hashes
still verify; what rests on the data owner's word is that the raw files came from a
camera. Stated in full, with the checks a sceptical reader would run, in
[`docs/provenance/harness_gate_a_b.md`](docs/provenance/harness_gate_a_b.md). The
positive control is the first evidence collected under the rule that closes this gap.

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

- Replay plays two real recordings, one per positive-control condition, registered
  from `research/hasil/kontrol_positif/sesi/` and each carrying the label of the
  condition it recorded. Before that it played a synthetic Lissajous path that the OOD
  guard correctly flagged and the quality gate correctly refused to score, which meant
  the demo report was withheld every time and no run of it ever carried real numbers.
  Registration refuses a log with no frame trace, so a replay export cannot be
  registered as a recording:
  `npm run replay:register -- <audit-log.json> --as session-a.json --label "Menonton biasa"`.
  Both demo controls used to load whichever recording was listed first, so the control
  that applies the threshold replayed the ordinary-viewing session while a presenter
  could describe the other one over it. There is now one control per registered
  recording, named after its condition.
- The pipeline separates two behavioural conditions, and that is now measured rather
  than assumed. Twelve consenting adults recorded 23 sessions on 19 August 2026, half
  watching ordinarily and half producing the pattern on instruction; both decision
  signals separate the conditions with no session of one overlapping the other, and
  the composite rule fires on 0 of 9 ordinary-viewing sessions. Numbers, confounds and
  the six defects the recordings exposed:
  [`research/hasil/kontrol_positif/README.md`](research/hasil/kontrol_positif/README.md).
  What it does not show is anything about autism — the participants are adults
  following a script, so there is no sensitivity, specificity, or accuracy in it.
- The composite rule as shipped fires on no session under any behaviour, and cannot:
  it needs two deviant signals and geometric preference stays unassessable while the
  licensed clip is shorter than the protocol its 69% cutoff came from. The table above
  applies that cutoff in demonstration mode, purely so the question "does the rule
  respond" has an answer. Removing that block is Kunci 1 in
  [`docs/jalur_rujukan.md`](docs/jalur_rujukan.md), not a code change.
- The Gate B known-target block (nine targets, absolute accuracy for both streams)
  is implemented on the analysis side but no session has recorded one yet.
- No toddler appears in any evidence in this repository, and none will before ethics
  approval. This is not a claim that research with autistic children is unethical —
  every threshold this system uses came from studies that recorded them, with the
  permissions they held. It is that a toddler cannot consent, so someone else decides
  on their behalf, and the structure that supervises that decision is an ethics review.
  We do not have one. Five institutions were approached and all five declined, which was
  the right call at this stage of evidence. The constraint, what it rules out, what is
  permitted instead, and the answers to the questions a panel will ask are in
  [`docs/etika_perekaman.md`](docs/etika_perekaman.md).

- No practitioner interview has been recorded yet. It is the only primary research that
  would touch the Indonesian context — every other number here is borrowed from
  English-language literature on other populations. The protocol, the questions, and the
  rule that keeps them from being unfalsifiable are in
  [`docs/wawancara_praktisi.md`](docs/wawancara_praktisi.md).

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
