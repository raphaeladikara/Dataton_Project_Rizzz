export type CalibrationTarget = readonly [number, number];

/**
 * Nine positions plus a centre drift step. Used by the engineering lanes and
 * by `?technicalCalibration=1`, where an adult will sit through all of them.
 */
export const TECHNICAL_TARGETS: readonly CalibrationTarget[] = [
  [0.12, 0.14],
  [0.5, 0.14],
  [0.88, 0.14],
  [0.12, 0.5],
  [0.5, 0.5],
  [0.88, 0.5],
  [0.12, 0.86],
  [0.5, 0.86],
  [0.88, 0.86],
] as const;

/**
 * Five positions for the child flow, arranged as a cross rather than a square.
 *
 * The square — centre plus four corners — is the arrangement that made the
 * stage-demo recordings unusable. Two things go wrong with it at once. Every
 * off-centre target moves both axes, so `axisCurve` fits the vertical curve
 * from four diagonal excursions and never sees a pure up/down look; and a
 * corner is the position a participant is most likely to reach by turning
 * their head, which is exactly the movement the iris signal is measured
 * against, so the points meant to buy the widest signal buy the narrowest.
 *
 * Measured, comparing the two recordings in public/replay against the audit
 * that prompted this: the nine-point grid returned signalRangeU 0.170-0.173
 * and signalRangeV 0.079-0.105; the square returned 0.094 and 0.054. Roughly
 * half the signal on both axes, and therefore roughly double the gain applied
 * to every bit of noise and drift downstream. The session that produced 0.094
 * put 78% of its gaze samples past the edge of the screen.
 *
 * The cross keeps the five targets a toddler will actually sit through, and
 * spends each off-centre one on a single axis.
 */
export const CHILD_TARGETS: readonly CalibrationTarget[] = [
  [0.5, 0.5],
  [0.5, 0.18],
  [0.18, 0.5],
  [0.82, 0.5],
  [0.5, 0.82],
] as const;
