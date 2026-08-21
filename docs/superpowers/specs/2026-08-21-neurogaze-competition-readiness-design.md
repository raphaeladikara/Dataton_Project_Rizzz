# NeuroGaze Competition Readiness Design

## Objective

Raise NeuroGaze's competition score without inventing toddler clinical evidence. The
release must present a working measurement, refusal, and reporting architecture; use
an adult positive-control demonstration to prove end-to-end responsiveness; and keep
all toddler-facing referral claims gated behind an ethics-approved prospective study.

The primary public positioning changes from “a validated triage product that already
refers children” to “an on-device attention measurement and governed-AI architecture
being prepared for clinical validation.” Demonstration mode may show the referral
rule firing on a consenting adult, but must never imply that the adult has ASD or that
the result is clinically valid.

## Product Contract

NeuroGaze has two visibly and technically separate lanes.

### Field observation

- Entry point: `Mulai observasi kamera`.
- Purpose: `target_population_research`.
- Audience: caregiver and Posyandu operator.
- Output: measured attention profile, data-quality status, and a plain-language next
  step.
- The shortened GeoPref clip cannot activate the published 69% referral threshold.
- No control in this flow may change the session into `stage_demo`.
- A below-threshold or unavailable result must never be described as reassurance.

### Adult architecture demonstration

- Entry point: `Panduan & demo` → `Peragakan · kamera langsung` or a labelled
  registered recording.
- Purpose: `stage_demo` or `demo_replay`.
- Audience: consenting adult participant and competition judges.
- The 69% comparison may run only to demonstrate the shape and responsiveness of the
  full execution chain.
- The result headline must say that a follow-up pattern was demonstrated, not that the
  participant should be referred.
- The banner must state that the operating point comes from a full toddler protocol,
  while this demonstration uses a shortened clip and an adult participant.
- `emitsReferral` remains false and the audit log records demonstration mode.

## Responsible-AI Framing

The absence of toddler training data is a governance decision, not a hidden failure.
The product must explain that recording children and connecting sessions to clinical
labels requires an ethics-capable partner, informed permission, a blinded clinical
reference, privacy-preserving linkage, and prospective validation.

The approved message is:

> We completed and instrumented the technical chain before asking children to carry
> research risk. Adult positive control establishes that the instrument responds.
> Clinical validity remains gated behind an ethics-approved prospective study.

The product and pitch must not say that only a signature or administrative approval is
missing. They must not imply that ethical review is a formality.

## UX Design

### Consent

- Remove the demonstration switch from field consent.
- Field consent contains only pseudonymous session identity, optional name-calling,
  and service consent.
- Research-log permission moves to the report/export area after the operator can see
  what the log contains. Gate A/B administrative capture may retain its research
  contract where required by its protocol.
- Empty field sessions start with empty IDs, site, operator, and age. Examples appear
  only as placeholders or help text.
- Continue is blocked until required identity and service-consent fields are valid.

### Navigation

- Tablet and mobile layouts retain labelled access to `Panduan & demo`, `Bukti`, and
  `Privasi` through a compact navigation control.
- Touch targets remain at least 44×44 CSS pixels.
- Navigation must work with keyboard and screen reader and expose expanded state.

### Reports

- The default report is the caregiver layer:
  1. what happened;
  2. whether the recording was usable;
  3. what to do next;
  4. why the result is not reassurance or diagnosis.
- Practitioner and auditor detail moves behind one disclosure containing all indices,
  confidence intervals, p-values, provenance, OOD status, and technical metadata.
- Demonstration reports use the same hierarchy but lead with “architecture response
  demonstrated” and a persistent non-clinical banner.
- Print output preserves both the caregiver summary and the demonstration disclaimer.

### Visual system

- Preserve NeuroGaze teal and the paper/instrument distinction.
- Reduce decorative serif use, gradients, glass-like surfaces, excessive rounding,
  tracked eyebrows, numbered marketing scaffolds, and staged page-load motion on the
  operational path.
- Use the sans family for controls, labels, reports, consent, and evidence surfaces.
- Retain the display face only for limited brand-level headings.
- Field screens prioritize familiar controls and state clarity over visual novelty.
- All remaining motion communicates state and respects reduced-motion preferences.

### Duration language

- Replace unqualified “67 detik” with “baterai pengukuran 67 detik”.
- Explain that total visit time also includes consent, setup, and calibration.
- The pitch may call the live positive-control measurement 67 seconds only when the
  setup time is separately acknowledged.

## Reliability Design

### Stimulus readiness

- Preload the GeoPref video before the timed battery begins.
- The timed GeoPref phase cannot start until the media element reports a playable
  state and emits `playing`.
- Loading, ready, playing, failed, and timed-out states are explicit.
- A media failure cannot silently produce scored frames. It yields a withheld result
  with a localized recovery instruction and an audit event.
- Replay and live modes follow the same readiness contract.

### Offline readiness

- Precache the GeoPref MP4 together with the model, WASM runtime, and core shell.
- “Siap luring” is derived from service-worker control and verified availability of
  the critical assets, not from `navigator.onLine` alone.
- The UI distinguishes `online`, `menyiapkan luring`, `siap luring`, and `aset luring
  belum lengkap`.
- Offline navigation caches each route without overwriting the root route with the
  last visited page.
- Cache version changes whenever a critical asset or cache policy changes.

### Camera and interruption recovery

- Map permission denied, no device, device busy, insecure context, and timeout errors
  to concise Indonesian recovery messages.
- Preserve existing stream cleanup guarantees and `audio: false`.
- An interrupted or backgrounded stimulus is paused or withheld rather than timed
  through invisibly.

### Security headers

- Retain camera self-only permissions, microphone denial, frame denial, MIME sniffing
  protection, COOP, and referrer policy.
- Add HSTS for production and a restrictive CSP that still permits Next.js, local
  MediaPipe/WASM, workers, blob media, and self-hosted assets.
- Disable the framework-identifying response header.

## Maintainability Boundaries

The release does not attempt a full rewrite of the 3,000-line page or 2,700-line CSS
file. It extracts only responsibilities touched by this work:

- offline readiness state and service-worker messaging;
- stimulus media readiness;
- session-purpose entry controls;
- caregiver/practitioner report sections.

Each extracted unit receives focused tests. Unrelated stimulus scoring and canonical
evidence logic remain untouched.

## Model and Evidence Corrections

### Public claims

- Replace “diagnosis in Indonesia averages 56 months” with a cross-country diagnostic
  delay claim and correct its citation.
- Describe the Carette regression as a participant-grouped source-domain proof of
  principle that is rejected for current sessions, not a clinically validated model.
- Do not call 2.36° an exact absolute-accuracy estimate. Explain that the legacy
  conversion lacked recorded viewing distance.
- Describe 69.4% versus 1.6% as median relative feature drift under temporal
  decimation, not a 42× improvement in classifier accuracy.
- Gate B remains agreement against a reference implementation, not ground truth.

### Positive control

Every main summary must report all relevant denominators:

- 23 distinct sessions recorded;
- 15 passed quality;
- 9 of 11 ordinary sessions passed quality;
- 6 of 12 produced-pattern sessions passed quality;
- demonstration rule fired in 4 of 6 usable produced-pattern sessions;
- demonstration rule fired in 0 of 9 usable ordinary sessions.

The conclusion is limited to adult manipulation-check and end-to-end instrument
responsiveness. It says nothing about ASD sensitivity, specificity, or diagnosis.

### Impact and economics

- Software distribution has near-zero marginal cost; healthcare operation does not.
- Per-session device amortization remains a transparent planning scenario.
- Cost per case found moves out of the primary claim and is labelled conditional on
  reproducing the published full-protocol GeoPref operating point.
- Kader time, training, support, printing, stands, retries, maintenance, and clinical
  follow-up are named as unmeasured costs.

### Readiness matrix

Add one canonical matrix used by the web evidence page, README, pitch, and paper:

| Capability | Status | Evidence |
|---|---|---|
| On-device measurement chain | Ready for engineering demonstration | Browser pipeline, parity tests, Gate A/B |
| Adult end-to-end responsivity | Demonstrated | Positive control |
| Automatic toddler referral | Withheld | Shortened stimulus; no clinical validation |
| Kader usability | Not tested | First field-usability study pending |
| Indonesian toddler validity | Not tested | Ethics-approved Gate C required |

## Pitch Content

The ten-minute-plus pitch keeps one full live adult positive-control demonstration.
The presenter says before starting that it is an adult manipulation check and after
the result that it demonstrates architecture responsiveness, not ASD.

The narrative order is:

1. cross-country diagnostic delay and the Indonesian measurement gap;
2. what the product can do today;
3. live adult positive control;
4. interpretation and boundary of the demonstration;
5. four-part AI architecture: measurement, selection, robustness, governance;
6. evidence/readiness ladder;
7. conditional impact and distribution economics;
8. ethics-approved clinical roadmap and explicit partner ask.

The deck is not redesigned in this release. Its source outline and speaker script are
updated to the corrected claims. The existing PPTX may be regenerated later.

## Test Strategy

Implementation follows test-first changes.

- Contract tests prove `target_population_research` has no demonstration control and
  only guide/demo controls can create `stage_demo`.
- Consent tests prove real-session defaults are empty and research consent is absent
  from ordinary field setup.
- Media-readiness tests prove the phase timer cannot start before `playing`, and that
  failure/timeout produces a withheld state.
- Offline tests prove the stimulus is precached and readiness is asset-based.
- Accessibility tests or source contracts cover mobile navigation labels, expanded
  state, and disclosure hierarchy.
- Evidence tests lock the complete positive-control denominators and prohibited
  claims.
- Existing Python, frontend, parity, audit, replay, build, lint, TypeScript, evidence
  hash, and dependency-audit checks remain green.

## Completion Criteria

The work is complete when:

1. field and demonstration entry paths cannot be confused;
2. the timed stimulus cannot run on unloaded media;
3. “Siap luring” means critical assets are actually available offline;
4. the default report is understandable without technical statistics;
5. every public claim matches the canonical evidence and current product behavior;
6. the adult live demo can visibly trigger the demonstration outcome while remaining
   non-clinical and non-referring;
7. all required verification commands pass;
8. the final handoff reports the corrected score estimate and remaining evidence gaps.
