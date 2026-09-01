const RIGHT_PANE_RATIO_DIVISOR = 3;
const MIN_RIGHT_PANE_WIDTH_RATIO = 1 / RIGHT_PANE_RATIO_DIVISOR;
const SPLIT_HIDE_TRIGGER_OVERSHOOT = 72;
const HIDDEN_PREVIEW_RESTORE_TRIGGER_WIDTH = 96;
const REVIEW_POPOVER_HALF_DIVISOR = 2;
const DEFAULT_RIGHT_PANE_WIDTH_RATIO = 1 / REVIEW_POPOVER_HALF_DIVISOR;

export const QUESTION_TASK_SPLIT_MODE = {
  SPLIT: "split",
  PREVIEW_HIDDEN: "previewHidden",
};

export const QUESTION_TASK_SPLIT_AFFORDANCE = {
  IDLE: "idle",
  AT_LIMIT: "atLimit",
  HIDE_READY: "hideReady",
  RESTORE_READY: "restoreReady",
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export const getDefaultRightPaneWidth = (containerWidth) =>
  containerWidth * DEFAULT_RIGHT_PANE_WIDTH_RATIO;

export const getRightPaneBoundsByRatio = (containerWidth) => {
  const minWidth = containerWidth * MIN_RIGHT_PANE_WIDTH_RATIO;
  const maxWidth = Math.max(
    minWidth,
    Math.min(containerWidth - minWidth, containerWidth),
  );

  return {
    maxWidth,
    minWidth,
  };
};

export const getClampedRightPaneWidthByRatio = (nextWidth, containerWidth) => {
  const { minWidth, maxWidth } = getRightPaneBoundsByRatio(containerWidth);

  return clamp(nextWidth, minWidth, maxWidth);
};

export const getSplitAffordanceByWidth = ({
  containerWidth,
  nextWidth,
  splitMode,
}) => {
  if (splitMode !== QUESTION_TASK_SPLIT_MODE.SPLIT) {
    return QUESTION_TASK_SPLIT_AFFORDANCE.IDLE;
  }

  const { maxWidth } = getRightPaneBoundsByRatio(containerWidth);
  if (nextWidth >= maxWidth + SPLIT_HIDE_TRIGGER_OVERSHOOT) {
    return QUESTION_TASK_SPLIT_AFFORDANCE.HIDE_READY;
  }

  if (nextWidth >= maxWidth) {
    return QUESTION_TASK_SPLIT_AFFORDANCE.AT_LIMIT;
  }

  return QUESTION_TASK_SPLIT_AFFORDANCE.IDLE;
};

export const shouldHidePreviewByWidth = (nextWidth, containerWidth) =>
  getSplitAffordanceByWidth({
    containerWidth,
    nextWidth,
    splitMode: QUESTION_TASK_SPLIT_MODE.SPLIT,
  }) === QUESTION_TASK_SPLIT_AFFORDANCE.HIDE_READY;

export const getHiddenPreviewAffordance = (revealedWidth) =>
  revealedWidth >= HIDDEN_PREVIEW_RESTORE_TRIGGER_WIDTH
    ? QUESTION_TASK_SPLIT_AFFORDANCE.RESTORE_READY
    : QUESTION_TASK_SPLIT_AFFORDANCE.IDLE;

export const shouldRestoreHiddenPreview = (revealedWidth) =>
  getHiddenPreviewAffordance(revealedWidth) ===
  QUESTION_TASK_SPLIT_AFFORDANCE.RESTORE_READY;
