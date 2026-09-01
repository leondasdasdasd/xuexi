import { DEFAULT_CATEGORY_COLOR } from "./annotationGeometry";

const WHITE_UNDERLAY = "rgba(255, 255, 255, 0.96)";

const toRgb = (color) => {
  const hex = (color || "").replace("#", "");

  if (hex.length === 3) {
    return hex.split("").map((item) => Number.parseInt(`${item}${item}`, 16));
  }

  if (hex.length === 6) {
    return [0, 2, 4].map((index) =>
      Number.parseInt(hex.slice(index, index + 2), 16),
    );
  }

  return null;
};

const toRgba = (color, alpha) => {
  const rgb = toRgb(color);

  return rgb ? `rgba(${rgb.join(",")}, ${alpha})` : color;
};

const getAnnotationColor = (annotation, categoryMap) => {
  const categoryConfig = annotation.category
    ? categoryMap[annotation.category]
    : null;

  return (
    annotation.color ||
    (categoryConfig && categoryConfig.color) ||
    DEFAULT_CATEGORY_COLOR
  );
};

/**
 * @typedef {{
 *   labelStyle: Record<string, any>,
 *   polygonStyle: Record<string, any>,
 *   resizeColor: string,
 *   underlayStyle: Record<string, any> | null
 * }} EditorAnnotationRenderStyle
 */

/**
 * @param {import("./annotationGeometry").EditorPolygon} annotation
 * @param {Record<string, import("./annotationGeometry").EditorCategory>} categoryMap
 * @param {{ isSelected?: boolean }} [options]
 * @returns {EditorAnnotationRenderStyle}
 */
export const buildAnnotationRenderStyle = (
  annotation,
  categoryMap,
  { isSelected = false } = {},
) => {
  const color = getAnnotationColor(annotation, categoryMap);
  const stroke = toRgba(color, isSelected ? 1 : 0.72);

  return {
    polygonStyle: {
      cursor: "pointer",
      fill: toRgba(color, isSelected ? 0.14 : 0.04),
      stroke,
      strokeLinejoin: "round",
      strokeWidth: isSelected ? 3 : 2,
    },
    labelStyle: {
      fill: stroke,
      pointerEvents: "none",
      userSelect: "none",
      WebkitUserSelect: "none",
    },
    resizeColor: stroke,
    underlayStyle: isSelected
      ? {
          fill: "none",
          pointerEvents: "none",
          stroke: WHITE_UNDERLAY,
          strokeLinejoin: "round",
          strokeWidth: 5,
        }
      : null,
  };
};
