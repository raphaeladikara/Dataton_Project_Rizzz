import type { CueFeatureSummary } from "../gaze/aoi";
import { STIMULUS_PHASES } from "../stimulus/protocol";

export type SessionObservations = {
  directionalPhaseCount: number;
  faceDwellPercent: number;
  targetDwellPercent: number;
  faceTargetTransitions: number;
  targetFaceTransitions: number;
};

const DIRECTIONAL_PHASES = STIMULUS_PHASES
  .filter((phase) => phase.scored && (phase.target === "left" || phase.target === "right"))
  .map((phase) => phase.id);

export function summarizeSessionObservations(summary: CueFeatureSummary | null): SessionObservations | null {
  if (!summary) return null;
  const phases = DIRECTIONAL_PHASES.filter((id) => summary.dwellShare[id] && summary.targetResponse[id]);
  if (!phases.length) return null;
  const totalSamples = phases.reduce((sum, id) => sum + (summary.phaseSampleCount[id] ?? 0), 0);
  const weighted = (value: (id: string) => number) => totalSamples > 0
    ? phases.reduce((sum, id) => sum + value(id) * (summary.phaseSampleCount[id] ?? 0), 0) / totalSamples
    : phases.reduce((sum, id) => sum + value(id), 0) / phases.length;
  return {
    directionalPhaseCount: phases.length,
    faceDwellPercent: weighted((id) => summary.dwellShare[id]?.face ?? 0) * 100,
    targetDwellPercent: weighted((id) => summary.targetResponse[id]?.probability ?? 0) * 100,
    faceTargetTransitions: summary.faceTargetTransitions,
    targetFaceTransitions: summary.targetFaceTransitions,
  };
}
