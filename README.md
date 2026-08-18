# Neurogaze

Neurogaze is an offline-first web application for gaze-measurement research related to early ASD screening. Camera processing runs in the browser; raw video is neither uploaded nor stored.

> Neurogaze is not a diagnostic device. It is a rule-in instrument: a positive result is informative, a negative result is not reassurance.

## What a session produces

A 96-second battery measures three things and reports them separately.

| Layer | What it is | Can it trigger a referral? |
|---|---|---|
| **A — GeoPref** | Percent geometric fixation against the published 69% cutoff (Wen et al. 2022, n=1863, ages 12–49 months, sensitivity 17%, **specificity 98%**) | **Yes** — the only automatic trigger |
| **B — Behavioural profile** | Facing-forward, head movement, blink rate, response to name, cue following with a within-session sign test | No. Descriptive, read alongside SDIDTK/M-CHAT |
| **C — Combined model** | Not built. Weights need labelled toddlers | Not yet |

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

GeoPref currently runs on a 16.75-second CC BY clip rather than the full published
stimulus, so `validatedProtocol` is false and the 69% cutoff is **held**: the session
reports the measured percentage and says the protocol was abbreviated. The access
request for the full stimulus is in
[`docs/provenance/permintaan_stimulus_ucsd.md`](docs/provenance/permintaan_stimulus_ucsd.md).

The reasoning behind these decisions is recorded in
[`docs/keputusan_ilmiah.md`](docs/keputusan_ilmiah.md).

### Known gaps

- Replay still plays synthetic points unless a recorded session is dropped into
  `app/public/replay/`, so the behavioural indices are empty on the fallback path
  and the demo report is withheld. The loader and the export both exist.
- The Gate B known-target block (nine targets, absolute accuracy for both streams)
  is implemented on the analysis side but no session has recorded one yet.
- No toddler appears in any evidence in this repository.

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
