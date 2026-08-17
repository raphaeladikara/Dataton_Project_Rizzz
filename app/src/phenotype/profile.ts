import { framesInPhases, type FrameSample } from "../capture/frameTrace";
import { blinkIndex, type BlinkIndex } from "./blink";
import { facingForwardIndex, type FacingForwardIndex } from "./facingForward";
import { headMovementIndex, type HeadMovementIndex } from "./headMovement";
import { responseToNameIndex, type NameCall, type ResponseToNameIndex } from "./responseToName";

export const PHENOTYPE_SCHEMA_VERSION = "neurogaze-phenotype-v1";

const SOURCE = "Perochon et al. 2023, Nature Medicine, doi:10.1038/s41591-023-02574-3";

export type IndexProvenance = { precedentAuc: number | null; source: string };

export type PhenotypeProfile = {
  schemaVersion: typeof PHENOTYPE_SCHEMA_VERSION;
  facingForward: FacingForwardIndex;
  headMovement: HeadMovementIndex;
  blinkSocial: BlinkIndex;
  blinkNonsocial: BlinkIndex;
  responseToName: ResponseToNameIndex;
  provenance: Record<string, IndexProvenance>;
  /** Always null. Combining indices needs weights fitted on labelled toddlers. */
  combinedScore: null;
  combinationRuleStatus: "not_fitted_requires_gate_c";
};

export function buildPhenotypeProfile(input: {
  frames: FrameSample[];
  nameCalls: NameCall[];
  socialPhases: string[];
  nonsocialPhases: string[];
}): PhenotypeProfile {
  return {
    schemaVersion: PHENOTYPE_SCHEMA_VERSION,
    facingForward: facingForwardIndex(input.frames),
    headMovement: headMovementIndex(input.frames),
    blinkSocial: blinkIndex(framesInPhases(input.frames, input.socialPhases)),
    blinkNonsocial: blinkIndex(framesInPhases(input.frames, input.nonsocialPhases)),
    responseToName: responseToNameIndex(input.frames, input.nameCalls),
    provenance: {
      headMovement: { precedentAuc: 0.864, source: SOURCE },
      facingForward: { precedentAuc: 0.838, source: SOURCE },
      blink: { precedentAuc: null, source: SOURCE },
      responseToName: { precedentAuc: 0.658, source: SOURCE },
    },
    combinedScore: null,
    combinationRuleStatus: "not_fitted_requires_gate_c",
  };
}
