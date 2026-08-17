# Neurogaze repository notes

## Scoring architecture

Three layers. Do not blur them.

- **A — GeoPref.** The only automatic referral trigger. Percent geometric fixation
  against the published 69% cutoff (Wen et al. 2022, *Molecular Autism*, n=1863,
  ages 12–49 months, sensitivity 17%, specificity 98%, PPV 81%, NPV 65%).
  Implemented in `app/src/geopref/`.
- **B — Multi-index profile.** Descriptive only, no combined score. Facing-forward,
  head movement, blink rate, response to name, cue following. Modelled on the index
  family in Perochon et al. 2023, *Nature Medicine* (SenseToKnow: tablet front
  camera, 17–36 months, AUC 0.90, sensitivity 87.8%, specificity 80.8%).
  Implemented in `app/src/phenotype/`.
- **C — Gate C.** Not built. Fitting weights across the layer-B indices needs
  labelled toddlers. The target performance is layer B's precedent, not a guess.

## Current evidence

- [2026-08-17] Gate A is canonical at `research/hasil/gate_a`: 100 browser sessions,
  25 participants, 3 devices, 94 passed, median calibration error 2.207°, mean
  valid-frame rate 96.4%, mean gaze dropout 3.6%. The 94 passing sessions also carry
  `validationErrorDeg` against known targets: median 2.36°, p90 3.58°.
- [2026-08-17] Gate B is canonical at `research/hasil/gate_b`: 30 simultaneous
  browser comparisons against WebGazer.js 3.5.3, 27 ready, 3 withheld, median
  normalized error 0.040997, mean AOI agreement 0.997574, decision `PASSED`.
- [2026-08-17] `research/hasil/evidence_manifest.json` records byte sizes and
  SHA-256 hashes for all 130 raw Gate A/B files.
- [2026-08-17] Gate A and Gate B validate technical measurement only.

## Working rules

- Treat raw files under `research/hasil/gate_a/sesi` and
  `research/hasil/gate_b/pasangan` as immutable evidence.
- Regenerate summaries and verify hashes with
  `python research/gate_evidence_repository.py --rebuild --verify`.
- **The Carette LR must never drive a decision.** Its geometric features encode
  where that study's stimulus content sat on screen, so the boundary does not
  transfer to a different stimulus — on top of the age and 250 Hz vs 30 fps gaps.
  It runs only to feed the OOD-gated research panel. Keep it: it is the basis of
  the paper's evaluation evidence and the only end-to-end parity proof.
- **Never combine the layer-B indices into a score.** `combinedScore` is typed
  `null` and `combinationRuleStatus` is a literal for exactly this reason.
- **A below-threshold GeoPref result is not reassurance.** NPV is 65%. Copy and
  types both enforce it (`reassures: false`); do not weaken either.
- Gate B compares against WebGazer.js, which is the method ManyBabies validated for
  toddlers aged 18–27 months (Steffan et al. 2024, *Infancy*, N=125, 16 labs). Cite
  that when justifying the reference. Absolute accuracy may only be quoted from the
  known-target block, never from stream-to-stream agreement.
- The child's given name is transient: it exists in a ref for speech synthesis and
  must never reach `profile`, the audit log, or disk.
- Keep public copy, paper claims, and documentation aligned with the canonical
  summaries and with `docs/keputusan_ilmiah.md` once written.
- Before declaring a release complete, run the checks in `docs/verifikasi.md`.

## Known gaps

- Replay still generates synthetic points and does not populate the frame trace, so
  layer-B indices are empty in replay. Recording three adult sessions into
  `app/public/replay/` replaces it; the audit export already carries what is needed.
- `research/hasil/gate_c_simulation.json` still assumes CNN performance for a model
  that cannot run on the target device.
- `research/hasil/model.json` ships only the sensitivity-0.9 operating point. The
  Youden point lives in the paper but not in the artifact.
