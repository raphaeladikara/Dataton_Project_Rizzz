# Neurogaze

Neurogaze is an offline-first web application for gaze-measurement research related to early ASD screening. Camera processing runs in the browser; raw video is neither uploaded nor stored.

> Neurogaze is not a diagnostic device. Gate A and Gate B validate technical measurement. Live child sessions remain research-only and do not produce an ASD risk score.

## Evidence status

| Gate | Status | Canonical result |
|---|---|---|
| A | **Passed** | 100 sessions, 25 participants, 3 devices; 94% completion, 2.207° median calibration error, 96.4% mean valid-frame rate, 3.6% mean dropout |
| B | **Passed** | 30 simultaneous browser comparisons against WebGazer.js 3.5.3; 27 ready, 3 withheld, 0.040997 median normalized error, 99.7574% mean AOI agreement |
| C | Open | Prospective clinical validation in the target population has not been completed |
| D | Open | Field implementation with Posyandu operators has not been completed |

The raw Gate A/B exports, derived summaries, and SHA-256 manifest are stored in [`research/hasil`](research/hasil). The complete interpretation and acceptance criteria are in [`docs/bukti_gate_a_b.md`](docs/bukti_gate_a_b.md).

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
