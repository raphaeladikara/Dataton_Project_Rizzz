# Neurogaze repository notes

## Current evidence

- [2026-08-17] Gate A is canonical at `research/hasil/gate_a`: 100 browser sessions, 25 participants, 3 devices, 94 passed, median calibration error 2.207°, mean valid-frame rate 96.4%, and mean gaze dropout 3.6%.
- [2026-08-17] Gate B is canonical at `research/hasil/gate_b`: 30 simultaneous browser comparisons against WebGazer.js 3.5.3, 27 ready, 3 withheld, median normalized error 0.040997, mean AOI agreement 0.997574, and decision `PASSED`.
- [2026-08-17] `research/hasil/evidence_manifest.json` records byte sizes and SHA-256 hashes for all 130 raw Gate A/B files.
- [2026-08-17] Gate A and Gate B validate technical measurement only. Live child sessions do not emit ASD risk scores; clinical claims remain open until Gate C.

## Working rules

- Treat raw files under `research/hasil/gate_a/sesi` and `research/hasil/gate_b/pasangan` as immutable evidence.
- Regenerate summaries and verify hashes with `python research/gate_evidence_repository.py --rebuild --verify`.
- Keep public copy, paper claims, and documentation aligned with the canonical summaries.
- Do not describe Gate B as a hardware eye-tracker comparison. Its recorded reference is WebGazer.js.
- Before declaring a release complete, run the checks documented in `docs/verifikasi.md`.
