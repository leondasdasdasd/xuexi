import { ensureArray } from "./annotationGeometry";

/** @typedef {import("./annotationGeometry").EditorPolygon} EditorPolygon */
/** @typedef {import("./annotationGeometry").EditorSize} EditorSize */

/**
 * @typedef {{
 *   id: string | number | undefined,
 *   label: string | undefined,
 *   category: string | undefined,
 *   color: string | undefined,
 *   points: { x: number, y: number }[],
 *   ratioPoints: { x: number, y: number }[],
 *   pixelPoints: { x: number, y: number }[]
 * }} EditorPolygonPayload
 */

/**
 * @param {EditorPolygon} annotation
 * @param {EditorSize} naturalSize
 * @returns {EditorPolygonPayload}
 */
export const buildPolygonPayload = (annotation, naturalSize) => {
  const ratioPoints = ensureArray(annotation && annotation.points).map(
    (point) => ({
      x: Number(point.x.toFixed(6)),
      y: Number(point.y.toFixed(6)),
    }),
  );

  return {
    id: annotation.id,
    label: annotation.label,
    category: annotation.category,
    color: annotation.color,
    points: ratioPoints,
    ratioPoints,
    pixelPoints: ratioPoints.map((point) => ({
      x: Math.round(point.x * naturalSize.width),
      y: Math.round(point.y * naturalSize.height),
    })),
  };
};

/**
 * @param {EditorPolygon[]} annotations
 * @param {EditorSize} naturalSize
 * @returns {{ polygons: EditorPolygonPayload[] }}
 */
export const buildEditorSnapshot = (annotations, naturalSize) => ({
  polygons: annotations.map((annotation) =>
    buildPolygonPayload(annotation, naturalSize),
  ),
});

/**
 * @param {EditorPolygon[]} annotations
 * @param {string} reason
 * @param {EditorPolygon | null} polygon
 * @param {EditorSize} naturalSize
 * @returns {{ reason: string, polygon: EditorPolygonPayload | null, polygons: EditorPolygonPayload[] }}
 */
export const buildChangePayload = (
  annotations,
  reason,
  polygon,
  naturalSize,
) => {
  const snapshot = buildEditorSnapshot(annotations, naturalSize);

  return {
    reason,
    polygon: polygon ? buildPolygonPayload(polygon, naturalSize) : null,
    polygons: snapshot.polygons,
  };
};
