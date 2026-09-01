/**
 * @typedef {{ x: number, y: number }} EditorPoint
 * @typedef {{
 *   id?: string | number,
 *   label?: string,
 *   category?: string,
 *   color?: string,
 *   points?: EditorPoint[],
 *   ratioPoints?: EditorPoint[]
 * }} EditorPolygon
 * @typedef {{ value: string, label: string, color: string }} EditorCategory
 * @typedef {{ width: number, height: number }} EditorSize
 * @typedef {{
 *   x: number,
 *   y: number,
 *   width: number,
 *   height: number,
 *   topLeft: EditorPoint
 * }} RectangleMetrics
 */

export const DEFAULT_CATEGORY_COLOR = "#1677ff";
export const CATEGORY_COLOR_PALETTE = [
  "#1677ff",
  "#13c2c2",
  "#52c41a",
  "#faad14",
  "#f5222d",
  "#722ed1",
];

// Avoid accidental clicks creating near-zero rectangles in ratio coordinates.
export const MIN_RECT_SIZE_RATIO = 0.005;
export const DELETE_BUTTON_SIZE = 24;
export const DELETE_BUTTON_OFFSET = 8;
export const RESIZE_HANDLE_SIZE = 10;
export const RESIZE_HIT_STROKE_WIDTH = 16;
export const DRAFT_START_DRAG_THRESHOLD_RATIO = 0.003;

/**
 * @typedef {"left" | "right" | "top" | "bottom"} ResizeEdge
 */

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
export const ensureArray = (value) => (Array.isArray(value) ? value : []);
export const createRectanglePolygonId = () =>
  `rectangle_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

/**
 * @param {string | Partial<EditorCategory> | null | undefined} category
 * @param {number} index
 * @returns {EditorCategory | null}
 */
export const normalizeCategory = (category, index) => {
  if (typeof category === "string") {
    return {
      value: category,
      label: category,
      color: CATEGORY_COLOR_PALETTE[index % CATEGORY_COLOR_PALETTE.length],
    };
  }

  if (!category || !category.value) {
    return null;
  }

  return {
    value: category.value,
    label: category.label || category.value,
    color:
      category.color ||
      CATEGORY_COLOR_PALETTE[index % CATEGORY_COLOR_PALETTE.length],
  };
};

/**
 * @param {Array<string | Partial<EditorCategory>> | null | undefined} categories
 * @returns {EditorCategory[]}
 */
export const normalizeCategories = (categories) =>
  ensureArray(categories).map(normalizeCategory).filter(Boolean);

/**
 * @param {Partial<EditorPoint> | null | undefined} point
 * @param {EditorSize} naturalSize
 * @returns {EditorPoint}
 */
export const normalizePoint = (point, naturalSize) => {
  const safePoint = point || {};
  const nextX = Number(safePoint.x);
  const nextY = Number(safePoint.y);
  const hasNaturalSize = naturalSize.width > 0 && naturalSize.height > 0;
  const isRatioPoint = nextX >= 0 && nextX <= 1 && nextY >= 0 && nextY <= 1;

  if (isRatioPoint || !hasNaturalSize) {
    return {
      x: clamp(Number.isFinite(nextX) ? nextX : 0, 0, 1),
      y: clamp(Number.isFinite(nextY) ? nextY : 0, 0, 1),
    };
  }

  return {
    x: clamp(nextX / naturalSize.width, 0, 1),
    y: clamp(nextY / naturalSize.height, 0, 1),
  };
};

/**
 * @param {EditorPoint[] | null | undefined} points
 * @returns {{ left: number, right: number, top: number, bottom: number } | null}
 */
export const getBounds = (points) => {
  const safePoints = ensureArray(points);

  if (safePoints.length === 0) {
    return null;
  }

  return {
    left: Math.min.apply(
      null,
      safePoints.map((point) => point.x),
    ),
    right: Math.max.apply(
      null,
      safePoints.map((point) => point.x),
    ),
    top: Math.min.apply(
      null,
      safePoints.map((point) => point.y),
    ),
    bottom: Math.max.apply(
      null,
      safePoints.map((point) => point.y),
    ),
  };
};

/**
 * @param {EditorPolygon[] | null | undefined} annotations
 * @param {EditorSize} naturalSize
 * @returns {Required<Pick<EditorPolygon, "id" | "label" | "category" | "color" | "points">>[]}
 */
export const normalizeAnnotations = (annotations, naturalSize) =>
  ensureArray(annotations)
    .map((annotation, index) => {
      const rawPoints =
        annotation && (annotation.points || annotation.ratioPoints);
      const points = ensureArray(rawPoints)
        .map((point) => normalizePoint(point, naturalSize))
        .filter(
          (point) => Number.isFinite(point.x) && Number.isFinite(point.y),
        );

      if (points.length < 3) {
        return null;
      }

      return {
        id: annotation.id || `annotation_${index}`,
        label: annotation.label || "",
        category: annotation.category || "",
        color: annotation.color || "",
        points,
      };
    })
    .filter(Boolean);

/**
 * @param {EditorPoint} startPoint
 * @param {EditorPoint} endPoint
 * @returns {EditorPoint[]}
 */
export const buildRectanglePolygonPoints = (startPoint, endPoint) => {
  const left = Math.min(startPoint.x, endPoint.x);
  const right = Math.max(startPoint.x, endPoint.x);
  const top = Math.min(startPoint.y, endPoint.y);
  const bottom = Math.max(startPoint.y, endPoint.y);

  return [
    { x: left, y: top },
    { x: right, y: top },
    { x: right, y: bottom },
    { x: left, y: bottom },
  ];
};

/**
 * @param {EditorPoint[] | null | undefined} points
 * @returns {boolean}
 */
export const isAxisAlignedRectangle = (points) => {
  const safePoints = ensureArray(points);

  if (safePoints.length !== 4) {
    return false;
  }

  const [topLeft, topRight, bottomRight, bottomLeft] = safePoints;

  return (
    topLeft.x === bottomLeft.x &&
    topRight.x === bottomRight.x &&
    topLeft.y === topRight.y &&
    bottomLeft.y === bottomRight.y &&
    topLeft.x < topRight.x &&
    topLeft.y < bottomLeft.y
  );
};

/**
 * @param {EditorPoint[]} points
 * @param {EditorSize} displaySize
 * @returns {RectangleMetrics | null}
 */
export const getRectangleMetrics = (points, displaySize) => {
  const bounds = getBounds(points);

  if (!bounds) {
    return null;
  }

  return {
    x: bounds.left * displaySize.width,
    y: bounds.top * displaySize.height,
    width: (bounds.right - bounds.left) * displaySize.width,
    height: (bounds.bottom - bounds.top) * displaySize.height,
    topLeft: {
      x: bounds.left * displaySize.width,
      y: bounds.top * displaySize.height,
    },
  };
};

/**
 * @param {EditorPoint | null} point
 * @param {EditorPoint[]} points
 * @returns {boolean}
 */
export const isPointInsideAnnotation = (point, points) => {
  const bounds = getBounds(points);

  if (!point || !bounds) {
    return false;
  }

  return (
    point.x > bounds.left &&
    point.x < bounds.right &&
    point.y > bounds.top &&
    point.y < bounds.bottom
  );
};

/**
 * @param {EditorPoint[]} pointsA
 * @param {EditorPoint[]} pointsB
 * @returns {boolean}
 */
export const isOverlapping = (pointsA, pointsB) => {
  const rectA = getBounds(pointsA);
  const rectB = getBounds(pointsB);

  if (!rectA || !rectB) {
    return false;
  }

  return !(
    rectA.right <= rectB.left ||
    rectA.left >= rectB.right ||
    rectA.bottom <= rectB.top ||
    rectA.top >= rectB.bottom
  );
};

/**
 * @param {EditorPoint[]} draftPoints
 * @returns {boolean}
 */
export const isDraftRectangleTooSmall = (draftPoints) => {
  const bounds = getBounds(draftPoints);

  if (!bounds) {
    return true;
  }

  return (
    bounds.right - bounds.left < MIN_RECT_SIZE_RATIO ||
    bounds.bottom - bounds.top < MIN_RECT_SIZE_RATIO
  );
};

/**
 * @param {EditorPoint[]} draftPoints
 * @param {EditorPolygon[]} annotations
 * @returns {boolean}
 */
export const isDraftRectangleOverlapping = (draftPoints, annotations) =>
  ensureArray(annotations).some((item) =>
    isOverlapping(item.points, draftPoints),
  );

/**
 * @param {EditorPoint | null} point
 * @param {EditorPolygon[]} annotations
 * @returns {boolean}
 */
export const cannotCreateAnnotationOnExistingArea = (point, annotations) =>
  ensureArray(annotations).some((item) =>
    isPointInsideAnnotation(point, item.points),
  );

/**
 * @param {EditorPoint[]} draftPoints
 * @param {EditorPolygon[]} annotations
 * @param {boolean} [allowOverlap]
 * @returns {{ isValid: boolean, reason: string }}
 */
export const validateDraftRectangle = (
  draftPoints,
  annotations,
  allowOverlap,
) => {
  const bounds = getBounds(draftPoints);

  if (!bounds) {
    return { isValid: false, reason: "invalid_bounds" };
  }

  if (isDraftRectangleTooSmall(draftPoints)) {
    return { isValid: false, reason: "too_small" };
  }

  if (!allowOverlap && isDraftRectangleOverlapping(draftPoints, annotations)) {
    return { isValid: false, reason: "overlap" };
  }

  return { isValid: true, reason: "ok" };
};

/**
 * @param {{
 *   activeCategory: string,
 *   categoryMap: Record<string, EditorCategory>,
 *   draftPoints: EditorPoint[]
 * }} params
 * @returns {Required<Pick<EditorPolygon, "id" | "label" | "category" | "color" | "points">>}
 */
export const buildNewAnnotation = ({
  activeCategory,
  categoryMap,
  draftPoints,
}) => {
  const categoryConfig = activeCategory ? categoryMap[activeCategory] : null;

  return {
    id: createRectanglePolygonId(),
    label: categoryConfig ? categoryConfig.label : "",
    category: activeCategory,
    color: categoryConfig ? categoryConfig.color : DEFAULT_CATEGORY_COLOR,
    points: draftPoints,
  };
};

/**
 * @param {RectangleMetrics | null} rectMetrics
 * @returns {{ x: number, y: number }}
 */
export const getDeleteButtonPosition = (rectMetrics) => {
  if (!rectMetrics) {
    return { x: DELETE_BUTTON_OFFSET, y: DELETE_BUTTON_OFFSET };
  }

  return {
    x: Math.max(
      rectMetrics.x + rectMetrics.width - DELETE_BUTTON_SIZE / 2,
      DELETE_BUTTON_OFFSET,
    ),
    y: Math.max(rectMetrics.y - DELETE_BUTTON_SIZE / 2, 4),
  };
};

/**
 * @param {EditorPoint[]} points
 * @returns {{
 *   left: EditorPoint,
 *   right: EditorPoint,
 *   top: EditorPoint,
 *   bottom: EditorPoint
 * } | null}
 */
export const getResizeHandlePositions = (points) => {
  const bounds = getBounds(points);

  if (!bounds) {
    return null;
  }

  const centerX = (bounds.left + bounds.right) / 2;
  const centerY = (bounds.top + bounds.bottom) / 2;

  return {
    left: { x: bounds.left, y: centerY },
    right: { x: bounds.right, y: centerY },
    top: { x: centerX, y: bounds.top },
    bottom: { x: centerX, y: bounds.bottom },
  };
};

/**
 * @param {EditorPoint[] | null | undefined} points
 * @param {ResizeEdge} edge
 * @param {number} nextValue
 * @returns {EditorPoint[] | null}
 */
export const buildResizedRectanglePoints = (points, edge, nextValue) => {
  const bounds = getBounds(points);

  if (!bounds) {
    return null;
  }

  const minWidth = MIN_RECT_SIZE_RATIO;
  const minHeight = MIN_RECT_SIZE_RATIO;
  let left = bounds.left;
  let right = bounds.right;
  let top = bounds.top;
  let bottom = bounds.bottom;

  if (edge === "left") {
    left = clamp(nextValue, 0, right - minWidth);
  }

  if (edge === "right") {
    right = clamp(nextValue, left + minWidth, 1);
  }

  if (edge === "top") {
    top = clamp(nextValue, 0, bottom - minHeight);
  }

  if (edge === "bottom") {
    bottom = clamp(nextValue, top + minHeight, 1);
  }

  return [
    { x: left, y: top },
    { x: right, y: top },
    { x: right, y: bottom },
    { x: left, y: bottom },
  ];
};

/**
 * @param {EditorPoint[] | null | undefined} points
 * @param {EditorPolygon[]} annotations
 * @param {string | number | null | undefined} activeAnnotationId
 * @returns {boolean}
 */
export const isRectangleResizeOverlapping = (
  points,
  annotations,
  activeAnnotationId,
) =>
  ensureArray(annotations)
    .filter((item) => item.id !== activeAnnotationId)
    .some((item) => isOverlapping(item.points, points));

/**
 * @param {EditorPoint | null | undefined} pointA
 * @param {EditorPoint | null | undefined} pointB
 * @returns {number}
 */
export const getPointDistance = (pointA, pointB) => {
  if (!pointA || !pointB) {
    return 0;
  }

  const deltaX = pointA.x - pointB.x;
  const deltaY = pointA.y - pointB.y;

  return Math.hypot(deltaX, deltaY);
};
