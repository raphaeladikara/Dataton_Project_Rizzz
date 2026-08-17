import type { Point } from "../domain/types";

export const GEOPREF_AOI_VERSION = "neurogaze-geopref-aoi-v1.1.0";

/**
 * Panel bounds measured from the shipped clip rather than assumed. Sampling the
 * 640x360 frame at t = 1, 4, 8, 12 and 15 s gives identical luminance runs
 * every time: x 129-316 and 324-513, y 120-242. Normalised against the frame,
 * both panels occupy ~29% of the width, matching the 525x363-on-1920x1080
 * rectangles used by Wen et al. 2022.
 *
 * These are FRAME coordinates. Gaze arrives in viewport coordinates, so
 * projectGeoprefAoi maps them through the letterbox first.
 */
export const GEOPREF_FRAME_AOI = {
  left: { x0: 129 / 640, x1: 316 / 640, y0: 120 / 360, y1: 242 / 360 },
  right: { x0: 324 / 640, x1: 513 / 640, y0: 120 / 360, y1: 242 / 360 },
} as const;

export const GEOPREF_VIDEO_ASPECT = 640 / 360;

/** The shipped clip has the social panel on the left and geometric on the right. */
export const GEOPREF_SOURCE_GEOMETRIC_SIDE: GeoprefSide = "right";

export type GeoprefAoi = "left" | "right" | "outside";
export type GeoprefSide = "left" | "right";
export type Box = { x0: number; x1: number; y0: number; y1: number };

/**
 * The clip is rendered with object-fit: contain, so it is letterboxed whenever
 * the stage aspect differs from 16:9. Projecting the frame boxes into viewport
 * space keeps the AOIs glued to the panels on any tablet.
 */
export function projectGeoprefAoi(viewportAspect: number): { left: Box; right: Box } {
  const widthFraction = viewportAspect > GEOPREF_VIDEO_ASPECT ? GEOPREF_VIDEO_ASPECT / viewportAspect : 1;
  const heightFraction = viewportAspect > GEOPREF_VIDEO_ASPECT ? 1 : viewportAspect / GEOPREF_VIDEO_ASPECT;
  const xOffset = (1 - widthFraction) / 2;
  const yOffset = (1 - heightFraction) / 2;
  const project = (box: Box): Box => ({
    x0: xOffset + box.x0 * widthFraction,
    x1: xOffset + box.x1 * widthFraction,
    y0: yOffset + box.y0 * heightFraction,
    y1: yOffset + box.y1 * heightFraction,
  });
  return { left: project(GEOPREF_FRAME_AOI.left), right: project(GEOPREF_FRAME_AOI.right) };
}

export function classifyGeoprefAoi(point: Pick<Point, "x" | "y">, aoi: { left: Box; right: Box }): GeoprefAoi {
  for (const name of ["left", "right"] as const) {
    const box = aoi[name];
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

/** The asset is fixed, so the side is counterbalanced by mirroring the frame. */
export function geoprefNeedsMirror(geometricSide: GeoprefSide): boolean {
  return geometricSide !== GEOPREF_SOURCE_GEOMETRIC_SIDE;
}
