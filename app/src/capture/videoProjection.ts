export type NormalizedPoint = { x: number; y: number };
export type PixelPoint = { x: number; y: number };
export type SourceSize = { width: number; height: number };

export function projectCoverPoint(
  point: NormalizedPoint,
  source: SourceSize,
  viewport: SourceSize,
  mirrored = true,
): PixelPoint {
  if (source.width <= 0 || source.height <= 0 || viewport.width <= 0 || viewport.height <= 0) {
    return { x: 0, y: 0 };
  }
  const scale = Math.max(viewport.width / source.width, viewport.height / source.height);
  const renderedWidth = source.width * scale;
  const renderedHeight = source.height * scale;
  const cropX = (renderedWidth - viewport.width) / 2;
  const cropY = (renderedHeight - viewport.height) / 2;
  return {
    x: renderedWidth * (mirrored ? 1 - point.x : point.x) - cropX,
    y: renderedHeight * point.y - cropY,
  };
}

export function projectCoverRect(
  rect: { x: number; y: number; width: number; height: number },
  source: SourceSize,
  viewport: SourceSize,
  mirrored = true,
) {
  const first = projectCoverPoint({ x: rect.x, y: rect.y }, source, viewport, mirrored);
  const second = projectCoverPoint({ x: rect.x + rect.width, y: rect.y + rect.height }, source, viewport, mirrored);
  return {
    left: Math.min(first.x, second.x),
    top: Math.min(first.y, second.y),
    width: Math.abs(second.x - first.x),
    height: Math.abs(second.y - first.y),
  };
}
