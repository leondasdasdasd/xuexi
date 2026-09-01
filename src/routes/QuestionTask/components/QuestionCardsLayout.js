import {
  getArrayItem,
  OPTION_INDEX_OFFSET,
} from "../domain/questionTaskShared";
import { getQuestionSectionIdentityKey } from "../domain/questionTaskViewModel";

import styles from "./QuestionCardsView.module.less";

export const QUALITY_POPOVER_WIDTH = 360;
export const QUALITY_POPOVER_GAP = 14;
export const QUALITY_POPOVER_MARGIN = 16;
export const QUALITY_ARROW_ANCHOR_OFFSET = 6;
export const QUALITY_ARROW_MIN_TOP = 18;
export const QUALITY_ARROW_BOTTOM_GAP = 24;
export const QUALITY_ANCHOR_MAX_OFFSET = 28;
export const QUALITY_INITIAL_ARROW_TOP = 22;
export const HALF_DIVISOR = 2;

export const clampValue = (value, min, max) =>
  Math.min(Math.max(value, min), max);

export const getCardClassName = ({
  dragOverState,
  draggingQuestionId,
  question,
  readOnly,
  selectedQuestionId,
}) =>
  `${styles["question-card"]} ${
    selectedQuestionId === question.draftId
      ? styles["question-card-active"]
      : ""
  } ${readOnly ? styles["question-card-read-only"] : ""} ${
    draggingQuestionId === question.draftId
      ? styles["question-card-dragging"]
      : ""
  } ${
    dragOverState.questionId === question.draftId &&
    dragOverState.position === "before"
      ? styles["question-card-drop-before"]
      : ""
  } ${
    dragOverState.questionId === question.draftId &&
    dragOverState.position === "after"
      ? styles["question-card-drop-after"]
      : ""
  }`;

export const getDragDropPosition = (event) => {
  const currentTarget = event && event.currentTarget;

  if (
    !currentTarget ||
    typeof currentTarget.getBoundingClientRect !== "function"
  ) {
    return "after";
  }

  const rect = currentTarget.getBoundingClientRect();

  return event.clientY < rect.top + rect.height / HALF_DIVISOR
    ? "before"
    : "after";
};

export const getSubQuestionIndexFromEvent = (event) => {
  const subQuestionNode = event.target?.closest?.(
    "[data-question-card-sub-question-index]",
  );
  const subQuestionIndex = Number(
    subQuestionNode?.getAttribute?.("data-question-card-sub-question-index"),
  );

  return Number.isInteger(subQuestionIndex) ? subQuestionIndex : undefined;
};

export const getSelectedQuestionScrollKey = (
  selectedQuestionId,
  selectedSubQuestionTarget,
) =>
  selectedSubQuestionTarget &&
  selectedSubQuestionTarget.questionId === selectedQuestionId
    ? `${selectedQuestionId}::sub::${selectedSubQuestionTarget.subQuestionIndex}`
    : selectedQuestionId;

export const getSelectedQuestionScrollNode = (
  targetNode,
  selectedQuestionId,
  selectedSubQuestionTarget,
) => {
  if (
    !targetNode ||
    !selectedSubQuestionTarget ||
    selectedSubQuestionTarget.questionId !== selectedQuestionId
  ) {
    return targetNode;
  }

  return (
    targetNode.querySelector(
      `[data-question-card-sub-question-index="${selectedSubQuestionTarget.subQuestionIndex}"]`,
    ) || targetNode
  );
};

export const shouldRenderQuestionSectionHeader = (questions, question, index) =>
  index === 0 ||
  getQuestionSectionIdentityKey(question) !==
    getQuestionSectionIdentityKey(
      getArrayItem(questions, index - OPTION_INDEX_OFFSET),
    );

export const getQuestionSectionDisplayNumber = (questions, index) =>
  (Array.isArray(questions) ? questions : [])
    .slice(0, index + OPTION_INDEX_OFFSET)
    .filter((question, questionIndex) =>
      shouldRenderQuestionSectionHeader(questions, question, questionIndex),
    ).length;
