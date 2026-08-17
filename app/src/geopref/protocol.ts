import type { Point } from "../domain/types";

export const GEOPREF_AOI_VERSION = "neurogaze-geopref-aoi-v1.0.0";

/**
 * Two side-by-side panels. Wen et al. 2022 used 525x363 px rectangles on a
 * 1920x1080 stimulus; these normalised bounds preserve that aspect and the
 * central gap between panels.
 */
export const GEOPREF_AOI = {
  left: { x0: 0.05, x1: 0.46, y0: 0.16, y1: 0.84 },
  right: { x0: 0.54, x1: 0.95, y0: 0.16, y1: 0.84 },
} as const;

export type GeoprefAoi = "left" | "right" | "outside";
export type GeoprefSide = "left" | "right";

export function classifyGeoprefAoi(point: Pick<Point, "x" | "y">): GeoprefAoi {
  for (const name of ["left", "right"] as const) {
    const box = GEOPREF_AOI[name];
    if (point.x >= box.x0 && point.x <= box.x1 && point.y >= box.y0 && point.y <= box.y1) return name;
  }
  return "outside";
}

/**
 * Side assignment must not correlate with anything about the child, so it is
 * derived from the pseudonymous session id rather than chosen by the operator.
 */
export function geoprefLayout(sessionId: string): { geometricSide: GeoprefSide; socialSide: GeoprefSide } {
  let hash = 0;
  for (let index = 0; index < sessionId.length; index += 1) {
    hash = (hash * 31 + sessionId.charCodeAt(index)) >>> 0;
  }
  const geometricSide: GeoprefSide = hash % 2 === 0 ? "left" : "right";
  return { geometricSide, socialSide: geometricSide === "left" ? "right" : "left" };
}
