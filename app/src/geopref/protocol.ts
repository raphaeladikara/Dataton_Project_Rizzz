import type { Point } from "../domain/types";

export const GEOPREF_AOI_VERSION = "neurogaze-geopref-aoi-v2.0.0";

/**
 * The region of the source frame that actually carries stimulus.
 *
 * Panel bounds were measured from the clip rather than assumed: sampling the
 * 640x360 frame at t = 1, 4, 8, 12 and 15 s gives identical luminance runs
 * every time, x 129-316 and 324-513, y 120-242, with pure black everywhere
 * else. The asset is a supplementary illustration from Moore et al. 2018, not a
 * presentation master, so the panels sit inside a wide black surround and take
 * up only 19.8% of the frame area.
 *
 * Rendering the frame whole put each panel at roughly 7.6 x 4.9 degrees on a
 * 10.5" tablet at 50 cm, against the 12.9 x 9.1 degrees Moore et al. report.
 * Cropping the surround away costs no pixels of content and brings the
 * presentation back to the published angular size; geoprefPanelDegrees exists
 * so that claim stays measurable instead of becoming a comment nobody rechecks.
 */
export const GEOPREF_CONTENT_CROP = {
  x0: 129 / 640,
  x1: 513 / 640,
  y0: 120 / 360,
  y1: 242 / 360,
} as const;

const CROP_WIDTH_PX = 513 - 129;
const CROP_HEIGHT_PX = 242 - 120;

/**
 * AOIs in CROP coordinates: 0 is the left edge of the presentation, 1 the
 * right. Gaze arrives in viewport coordinates, so projectGeoprefAoi maps them
 * through the crop's letterbox inside the stage first.
 */
export const GEOPREF_FRAME_AOI = {
  left: { x0: (129 - 129) / CROP_WIDTH_PX, x1: (316 - 129) / CROP_WIDTH_PX, y0: 0, y1: 1 },
  right: { x0: (324 - 129) / CROP_WIDTH_PX, x1: (513 - 129) / CROP_WIDTH_PX, y0: 0, y1: 1 },
} as const;

/** The cropped presentation's aspect, not the source frame's. */
export const GEOPREF_VIDEO_ASPECT = CROP_WIDTH_PX / CROP_HEIGHT_PX;

/**
 * Visual angle one panel subtends, so the geometry can be checked against
 * Moore et al. 2018 (12.9 deg horizontal, 9.1 deg vertical at 60 cm) for a
 * given device and viewing distance rather than assumed to match.
 */
export function geoprefPanelDegrees(input: {
  stageWidthMm: number;
  stageHeightMm: number;
  viewingDistanceMm: number;
}): { horizontal: number; vertical: number } {
  const stageAspect = input.stageWidthMm / input.stageHeightMm;
  const fitsToWidth = stageAspect <= GEOPREF_VIDEO_ASPECT;
  const renderedWidthMm = fitsToWidth ? input.stageWidthMm : input.stageHeightMm * GEOPREF_VIDEO_ASPECT;
  const renderedHeightMm = fitsToWidth ? input.stageWidthMm / GEOPREF_VIDEO_ASPECT : input.stageHeightMm;
  const panelWidthMm = renderedWidthMm * (GEOPREF_FRAME_AOI.left.x1 - GEOPREF_FRAME_AOI.left.x0);
  const panelHeightMm = renderedHeightMm * (GEOPREF_FRAME_AOI.left.y1 - GEOPREF_FRAME_AOI.left.y0);
  const degrees = (sizeMm: number) => (2 * Math.atan(sizeMm / 2 / input.viewingDistanceMm) * 180) / Math.PI;
  return { horizontal: degrees(panelWidthMm), vertical: degrees(panelHeightMm) };
}

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
 * Anything counterbalanced per session derives from this, so the assignment
 * cannot correlate with the child and the operator cannot pick it. The
 * stimulus module reuses it to counterbalance the directional cue order.
 */
export function sessionHash(sessionId: string): number {
  let hash = 0;
  for (let index = 0; index < sessionId.length; index += 1) {
    hash = (hash * 31 + sessionId.charCodeAt(index)) >>> 0;
  }
  return hash;
}

/**
 * Side assignment must not correlate with anything about the child, so it is
 * derived from the pseudonymous session id rather than chosen by the operator.
 */
export function geoprefLayout(sessionId: string): { geometricSide: GeoprefSide; socialSide: GeoprefSide } {
  const geometricSide: GeoprefSide = sessionHash(sessionId) % 2 === 0 ? "left" : "right";
  return { geometricSide, socialSide: geometricSide === "left" ? "right" : "left" };
}

/** The asset is fixed, so the side is counterbalanced by mirroring the frame. */
export function geoprefNeedsMirror(geometricSide: GeoprefSide): boolean {
  return geometricSide !== GEOPREF_SOURCE_GEOMETRIC_SIDE;
}
