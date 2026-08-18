# Neurogaze — product context

## Register

Product. The operator is mid-task with a child in front of them, often standing at a
Posyandu table with limited time. Design serves the measurement; it never performs.

## What it is

An offline-first PWA that measures a toddler's attention patterns on an ordinary
Android tablet and reports what was measured. It runs an 80-second battery:
a preferential-looking block, eight joint-attention micro-trials in a counterbalanced
order, and three name calls. All camera processing happens on device. Raw video and
landmarks are never stored.

## Who uses it

- **Kader Posyandu** — community health volunteers, not clinicians, often not
  confident with unfamiliar software. They operate the session and hand the result
  to a health worker. They are the primary user and the hardest constraint.
- **Caregiver** — sits with the child, reads the result, decides whether to act.
  May be anxious. Wording carries real weight here.
- **Puskesmas staff / paediatrician** — receives the result alongside SDIDTK or
  M-CHAT-R/F and makes the actual referral decision.
- **Researcher / auditor** — reads the technical panel and the exported audit log.

## What it must never do

It is not a diagnostic device. Two lanes reach the report and they are never merged.

The first is the published GeoPref threshold of 69% geometric fixation (Wen et al.
2022, n=1863, 12–48 months, 98% specificity) — the only cutoff in the system we did
not choose ourselves, which is exactly why it stays separable.

The second is a composite recommendation: a readable rule over three signals that need
no toddler norm — the published GeoPref cutoff, plus cue following and response to
name, both of which compare the child against itself. It recommends a follow-up
examination, carries its reasoning per signal, and states that it is not validated on
toddlers. It is not a score and never becomes one.

Deviant means measured, never merely undemonstrated. A cue-following result that
points the right way without reaching significance is unassessed, because eight
trials cannot clear p < 0.05 below seven successes and reading that as a deficit
would be absence of evidence dressed up as evidence.

Everything else on the report is descriptive measurement with no validated cutoff. No
result on either lane may read as reassurance — the published test misses most
autistic children by design, and the interface has to say so plainly.

## Design principles

1. **The withheld state is a first-class outcome, not an error.** Published toddler
   webcam attrition is 42% (Steffan et al. 2024). Refusing to produce a number is
   the system working, and it should look that way — never like a failure.
2. **Never leave the operator guessing.** A disabled control that doesn't say why is
   a failure. A child is waiting; there is no time to hunt for the missing field.
3. **Numbers carry their provenance.** Every index on the report shows where its
   reference value comes from, so nobody mistakes a descriptive measure for a
   validated one.
4. **The child-facing screen is not the operator screen.** During measurement,
   nothing competes with the stimulus: no chrome, no operator affordances.
5. **Two surface worlds, consistently.** Paper for reading and deciding, Instrument
   (dark) for capturing. A screen belongs to one or the other, never both.

## Anti-references

- Consumer health apps that gamify a clinical measure (streaks, scores, badges).
- Dashboards that lead with a big hero metric and supporting stats.
- Anything that renders an ASD probability as a gauge, dial, or traffic light.
- Medical software whose density assumes a trained clinician at a desktop.

## Constraints

- **No child is recorded by this team before ethics approval.** No toddler, no autistic
  child, not for training and not for a demo. Parental consent is not valid without an
  ethics review; five institutions were approached and all five declined. Everything
  labelled in the decision path comes from data other researchers published under an
  open licence. See [`docs/etika_perekaman.md`](docs/etika_perekaman.md).
- Mid-range Android tablets, ~26–30 fps front camera, frequently offline.
- Indonesian only. Copy is read aloud to caregivers, so it must be plain-spoken.
- Must remain operable in poor lighting and with the tablet on a stand.
