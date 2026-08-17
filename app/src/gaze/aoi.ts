import type { Point } from "../domain/types";

export const AOI_VERSION = "neurogaze-aoi-v3.1.0";

export const AOI_ATLAS = {
  face: { x0: 0.36, x1: 0.64, y0: 0.14, y1: 0.58 },
  target_left: { x0: 0.04, x1: 0.32, y0: 0.38, y1: 0.82 },
  target_right: { x0: 0.68, x1: 0.96, y0: 0.38, y1: 0.82 },
} as const;

export type AoiName = keyof typeof AOI_ATLAS | "background";

export type CueFeatureSummary = {
  schemaVersion: 3;
  aoiVersion: string;
  sampleCount: number;
  expectedPhaseCount: number;
  adequatePhaseCount: number;
  phaseCoverage: number;
  phaseSampleCount: Record<string, number>;
  occupancy: Record<string, Record<AoiName, number>>;
  dwellShare: Record<string, Record<AoiName, number>>;
  epochSampleCount: Record<string, { preCue: number; postCue: number }>;
  targetResponse: Record<string, {
    target: "left" | "right";
    probability: number;
    latencyMs: number | null;
    preCueProbability: number | null;
    targetLift: number | null;
    faceAtCue: boolean | null;
  }>;
  faceTargetTransitions: number;
  targetFaceTransitions: number;
};

const MIN_PHASE_SAMPLES = 8;
const MAX_DWELL_INTERVAL_MS = 180;

export function classifyAoi(point: Pick<Point, "x" | "y">): AoiName {
  for (const [name, box] of Object.entries(AOI_ATLAS) as [keyof typeof AOI_ATLAS, (typeof AOI_ATLAS)[keyof typeof AOI_ATLAS]][]) {
    if (point.x >= box.x0 && point.x <= box.x1 && point.y >= box.y0 && point.y <= box.y1) return name;
  }
  return "background";
}

export function cueFeatures(
  points: Point[],
  targets: Record<string, "left" | "right" | "center">,
): CueFeatureSummary {
  const byPhase = new Map<string, Point[]>();
  points.forEach((point) => {
    const phase = point.phase ?? "unassigned";
    byPhase.set(phase, [...(byPhase.get(phase) ?? []), point]);
  });
  const occupancy: CueFeatureSummary["occupancy"] = {};
  const dwellShare: CueFeatureSummary["dwellShare"] = {};
  const targetResponse: CueFeatureSummary["targetResponse"] = {};
  const phaseSampleCount: Record<string, number> = {};
  const epochSampleCount: CueFeatureSummary["epochSampleCount"] = {};
  let faceTargetTransitions = 0;
  let targetFaceTransitions = 0;
  for (const phase of Object.keys(targets)) {
    const phasePoints = byPhase.get(phase) ?? [];
    phaseSampleCount[phase] = phasePoints.length;
    const preCuePoints = phasePoints.filter((point) => point.epoch === "pre_cue");
    const postCuePoints = phasePoints.filter((point) => point.epoch !== "pre_cue");
    epochSampleCount[phase] = { preCue: preCuePoints.length, postCue: postCuePoints.length };
    const counts: Record<AoiName, number> = { face: 0, target_left: 0, target_right: 0, background: 0 };
    const labels = phasePoints.map(classifyAoi);
    labels.forEach((label) => { counts[label] += 1; });
    const denominator = Math.max(phasePoints.length, 1);
    occupancy[phase] = Object.fromEntries(Object.entries(counts).map(([key, value]) => [key, value / denominator])) as Record<AoiName, number>;
    const dwellMs: Record<AoiName, number> = { face: 0, target_left: 0, target_right: 0, background: 0 };
    phasePoints.forEach((point, index) => {
      const next = phasePoints[index + 1];
      const interval = next ? Math.max(0, Math.min(MAX_DWELL_INTERVAL_MS, next.t - point.t)) : 50;
      dwellMs[labels[index]] += interval;
    });
    const totalDwell = Math.max(Object.values(dwellMs).reduce((sum, value) => sum + value, 0), 1);
    dwellShare[phase] = Object.fromEntries(Object.entries(dwellMs).map(([key, value]) => [key, value / totalDwell])) as Record<AoiName, number>;
    labels.slice(1).forEach((label, index) => {
      const previous = labels[index];
      if (previous === "face" && (label === "target_left" || label === "target_right")) faceTargetTransitions += 1;
      if ((previous === "target_left" || previous === "target_right") && label === "face") targetFaceTransitions += 1;
    });
    const target = targets[phase];
    if (target === "left" || target === "right") {
      const targetAoi: AoiName = target === "left" ? "target_left" : "target_right";
      const postLabels = postCuePoints.map(classifyAoi);
      const postTargetCount = postLabels.filter((label) => label === targetAoi).length;
      const postProbability = postTargetCount / Math.max(postCuePoints.length, 1);
      const preLabels = preCuePoints.map(classifyAoi);
      const preProbability = preCuePoints.length
        ? preLabels.filter((label) => label === targetAoi).length / preCuePoints.length
        : null;
      const first = postLabels.findIndex((label) => label === targetAoi);
      targetResponse[phase] = {
        target,
        probability: postProbability,
        latencyMs: first < 0 ? null : postCuePoints[first].t - postCuePoints[0].t,
        preCueProbability: preProbability,
        targetLift: preProbability === null ? null : postProbability - preProbability,
        faceAtCue: preCuePoints.length ? classifyAoi(preCuePoints.at(-1)!) === "face" : null,
      };
    }
  }
  const expectedPhaseCount = Object.keys(targets).length;
  const adequatePhaseCount = Object.keys(targets).filter((phase) => {
    const epochs = epochSampleCount[phase];
    const target = targets[phase];
    // Center-only observation phases (for example social_face) begin at cue
    // onset and therefore have no neutral lead-in by design. Only directional
    // cue trials need both pre-cue and post-cue samples.
    if (target === "center") return phaseSampleCount[phase] >= MIN_PHASE_SAMPLES;
    const hasEpochContract = (epochs?.preCue ?? 0) > 0 || byPhase.get(phase)?.some((point) => point.epoch === "post_cue");
    return hasEpochContract
      ? epochs.preCue >= 4 && epochs.postCue >= MIN_PHASE_SAMPLES
      : phaseSampleCount[phase] >= MIN_PHASE_SAMPLES;
  }).length;
  return {
    schemaVersion: 3,
    aoiVersion: AOI_VERSION,
    sampleCount: points.length,
    expectedPhaseCount,
    adequatePhaseCount,
    phaseCoverage: adequatePhaseCount / Math.max(expectedPhaseCount, 1),
    phaseSampleCount,
    epochSampleCount,
    occupancy,
    dwellShare,
    targetResponse,
    faceTargetTransitions,
    targetFaceTransitions,
  };
}
