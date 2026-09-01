import {
  cannotCreateAnnotationOnExistingArea,
  validateDraftRectangle,
} from "./annotationGeometry";

/** @typedef {import("./annotationGeometry").EditorPoint} EditorPoint */
/** @typedef {import("./annotationGeometry").EditorPolygon} EditorPolygon */

/**
 * Rules for deciding whether a new rectangle can start from the current pointer.
 * @param {{
 *   allowOverlap?: boolean,
 *   annotations: EditorPolygon[],
 *   point: EditorPoint | null,
 *   readOnly?: boolean
 * }} params
 * @returns {{ canStart: boolean, reason: "ok" | "read_only" | "invalid_point" | "inside_annotation" }}
 */
export const evaluateDraftStart = ({
  allowOverlap,
  annotations,
  point,
  readOnly,
}) => {
  if (!point) {
    return { canStart: false, reason: "invalid_point" };
  }

  if (readOnly) {
    return { canStart: false, reason: "read_only" };
  }

  if (
    !allowOverlap &&
    cannotCreateAnnotationOnExistingArea(point, annotations)
  ) {
    return { canStart: false, reason: "inside_annotation" };
  }

  return { canStart: true, reason: "ok" };
};

/**
 * Rules for deciding whether the current pointer should be treated as blocked.
 * @param {{
 *   allowOverlap?: boolean,
 *   annotations: EditorPolygon[],
 *   point: EditorPoint | null
 * }} params
 * @returns {boolean}
 */
export const shouldBlockPointerForCreation = ({
  allowOverlap,
  annotations,
  point,
}) => !allowOverlap && cannotCreateAnnotationOnExistingArea(point, annotations);

/**
 * Rules for deciding whether the draft rectangle can be committed.
 * @param {{
 *   allowOverlap?: boolean,
 *   annotations: EditorPolygon[],
 *   draftPoints: EditorPoint[] | null | undefined
 * }} params
 * @returns {{ canCommit: boolean, reason: string }}
 */
export const evaluateDraftCommit = ({
  allowOverlap,
  annotations,
  draftPoints,
}) => {
  if (!draftPoints) {
    return { canCommit: false, reason: "missing_draft" };
  }

  const validation = validateDraftRectangle(
    draftPoints,
    annotations,
    allowOverlap,
  );

  return {
    canCommit: validation.isValid,
    reason: validation.reason,
  };
};
