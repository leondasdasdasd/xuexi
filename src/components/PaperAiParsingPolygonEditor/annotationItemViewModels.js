/**
 * @typedef {{
 *   x1: number,
 *   x2: number,
 *   y1: number,
 *   y2: number
 * }} EdgeLine
 */

/**
 * @param {import("./annotationGeometry").RectangleMetrics | null} rectMetrics
 * @returns {Array<{
 *   edge: import("./annotationGeometry").ResizeEdge,
 *   line: EdgeLine
 * }>}
 */
export const buildRectangleEdges = (rectMetrics) => {
  if (!rectMetrics) {
    return [];
  }

  return [
    {
      edge: "top",
      line: {
        x1: rectMetrics.x,
        y1: rectMetrics.y,
        x2: rectMetrics.x + rectMetrics.width,
        y2: rectMetrics.y,
      },
    },
    {
      edge: "right",
      line: {
        x1: rectMetrics.x + rectMetrics.width,
        y1: rectMetrics.y,
        x2: rectMetrics.x + rectMetrics.width,
        y2: rectMetrics.y + rectMetrics.height,
      },
    },
    {
      edge: "bottom",
      line: {
        x1: rectMetrics.x,
        y1: rectMetrics.y + rectMetrics.height,
        x2: rectMetrics.x + rectMetrics.width,
        y2: rectMetrics.y + rectMetrics.height,
      },
    },
    {
      edge: "left",
      line: {
        x1: rectMetrics.x,
        y1: rectMetrics.y,
        x2: rectMetrics.x,
        y2: rectMetrics.y + rectMetrics.height,
      },
    },
  ];
};

/**
 * @param {import("./annotationGeometry").EditorPoint} point
 * @param {import("./annotationGeometry").EditorSize} displaySize
 * @returns {{ x: number, y: number }}
 */
export const toDisplayPoint = (point, displaySize) => ({
  x: point.x * displaySize.width,
  y: point.y * displaySize.height,
});
