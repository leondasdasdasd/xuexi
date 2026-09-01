import React from "react";
import PropTypes from "prop-types";

import { trans } from "../../../utils/i18n";
import { buildSubQuestionSelectionId } from "../domain/questionTaskStructure";
import { getQuestionNumber } from "./QuestionCardContent";

import styles from "./QuestionCardsView.module.less";

const QUESTION_SELECTION_BUTTON_CLASS_NAME =
  styles["question-selection-button"];
const QUESTION_SELECTION_PRIMARY_BUTTON_CLASS_NAME = `${QUESTION_SELECTION_BUTTON_CLASS_NAME} ${styles["question-selection-button-primary"]}`;
const INSERT_SLOT_POSITION_BETWEEN = "between";
const INSERT_SLOT_POSITION_END = "end";
const INSERT_SLOT_POSITION_START = "start";
const BUTTON_TYPE = "button";
const QUESTION_INSERT_BUTTON_CLASS_NAME = styles["question-insert-button"];

export const renderInsertSlot = ({
  onInsertAtEnd,
  onInsertAtStart,
  onQuestionDuplicateAfter,
  onQuestionInsertAfter,
  onQuestionSectionInsertAfter,
  onQuestionSectionInsertAtStart,
  position,
  questionId = "",
  readOnly,
  sectionQuestionId = "",
}) => {
  const insertSlotReadOnly = readOnly;
  const canInsertSection =
    (position === INSERT_SLOT_POSITION_BETWEEN && sectionQuestionId) ||
    position === INSERT_SLOT_POSITION_START;

  return (
    <div
      className={`${styles["question-insert-slot"]} ${
        insertSlotReadOnly ? styles["question-insert-slot-read-only"] : ""
      }`}
    >
      <div className={styles["question-insert-line"]} />
      <div className={styles["question-insert-actions"]}>
        <button
          type={BUTTON_TYPE}
          disabled={insertSlotReadOnly}
          className={QUESTION_INSERT_BUTTON_CLASS_NAME}
          onClick={(event) => {
            event.stopPropagation();
            if (position === INSERT_SLOT_POSITION_START) {
              onInsertAtStart();
            } else if (position === INSERT_SLOT_POSITION_END) {
              onInsertAtEnd();
            } else {
              onQuestionInsertAfter(questionId);
            }
          }}
        >
          {trans("questionTask.insertQuestion", "新增")}
        </button>
        {position === INSERT_SLOT_POSITION_BETWEEN && (
          <button
            type={BUTTON_TYPE}
            disabled={insertSlotReadOnly}
            className={QUESTION_INSERT_BUTTON_CLASS_NAME}
            onClick={(event) => {
              event.stopPropagation();
              onQuestionDuplicateAfter(questionId);
            }}
          >
            {trans("questionTask.duplicateQuestion", "复制")}
          </button>
        )}
        {(position === INSERT_SLOT_POSITION_START ||
          position === INSERT_SLOT_POSITION_BETWEEN) && (
          <button
            type={BUTTON_TYPE}
            disabled={insertSlotReadOnly || !canInsertSection}
            className={QUESTION_INSERT_BUTTON_CLASS_NAME}
            onClick={(event) => {
              event.stopPropagation();
              if (position === INSERT_SLOT_POSITION_START) {
                onQuestionSectionInsertAtStart();
              } else {
                onQuestionSectionInsertAfter(questionId);
              }
            }}
          >
            {trans("questionTask.insertSection", "分段")}
          </button>
        )}
      </div>
    </div>
  );
};

export const renderSelectionToolbar = ({
  canMergeSelectedQuestions,
  canSplitSelectedQuestion,
  onQuestionSelectionClear,
  onSelectedQuestionMerge,
  onSelectedQuestionSplit,
  selectedCount,
}) => {
  if (selectedCount === 0) {
    return false;
  }

  return (
    <div className={styles["question-selection-toolbar"]}>
      <span className={styles["question-selection-count"]}>
        {trans("questionTask.selectedQuestionCount", "{$count} selected", {
          count: selectedCount,
        })}
      </span>
      <div className={styles["question-selection-actions"]}>
        <button
          className={QUESTION_SELECTION_PRIMARY_BUTTON_CLASS_NAME}
          disabled={!canMergeSelectedQuestions}
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onSelectedQuestionMerge();
          }}
        >
          {trans("questionTask.mergeSelectedQuestions", "Merge as Group")}
        </button>
        <button
          className={QUESTION_SELECTION_BUTTON_CLASS_NAME}
          disabled={!canSplitSelectedQuestion}
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onSelectedQuestionSplit();
          }}
        >
          {trans("questionTask.splitSelectedCombination", "Split Group")}
        </button>
        <button
          className={QUESTION_SELECTION_BUTTON_CLASS_NAME}
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onQuestionSelectionClear();
          }}
        >
          {trans("questionTask.clearQuestionSelection", "Clear Selection")}
        </button>
      </div>
    </div>
  );
};

export const renderSelectionControl = ({
  disabled,
  label,
  onQuestionSelectionChange,
  selected,
  selectionId,
}) => (
  <span
    data-question-card-interactive="true"
    data-testid={`question-selection-control-${selectionId}`}
    className={`${styles["question-selection-control"]} ${
      selected ? styles["question-selection-control-selected"] : ""
    } ${disabled ? styles["question-selection-control-disabled"] : ""}`}
  >
    <input
      aria-label={label}
      checked={selected}
      disabled={disabled}
      type="checkbox"
      onClick={(event) => event.stopPropagation()}
      onChange={(event) =>
        onQuestionSelectionChange(selectionId, event.target.checked)
      }
      onKeyDown={(event) => event.stopPropagation()}
    />
    <span />
  </span>
);

export const renderQuestionSelectionControl = ({
  isQuestionReadOnly,
  onQuestionSelectionChange,
  question,
  selectedQuestionIdSet,
}) =>
  renderSelectionControl({
    disabled: isQuestionReadOnly(question.draftId),
    label: trans("questionTask.selectQuestion", "Select question {$number}", {
      number: getQuestionNumber(question),
    }),
    onQuestionSelectionChange,
    selected: selectedQuestionIdSet.has(question.draftId),
    selectionId: question.draftId,
  });

export const createSubQuestionSelectionControlRenderer =
  ({
    isQuestionReadOnly,
    onQuestionSelectionChange,
    question,
    selectedQuestionIdSet,
  }) =>
  (subQuestion, subQuestionIndex) => {
    void subQuestion;

    return renderSelectionControl({
      disabled: isQuestionReadOnly(question.draftId),
      label: trans(
        "questionTask.selectSubQuestion",
        "Select question {$number}-{$subNumber}",
        {
          number: getQuestionNumber(question),
          subNumber: subQuestionIndex + 1,
        },
      ),
      onQuestionSelectionChange,
      selected: selectedQuestionIdSet.has(
        buildSubQuestionSelectionId(question.draftId, subQuestionIndex),
      ),
      selectionId: buildSubQuestionSelectionId(
        question.draftId,
        subQuestionIndex,
      ),
    });
  };

renderInsertSlot.propTypes = {
  onInsertAtEnd: PropTypes.func.isRequired,
  onInsertAtStart: PropTypes.func.isRequired,
  onQuestionDuplicateAfter: PropTypes.func.isRequired,
  onQuestionInsertAfter: PropTypes.func.isRequired,
  onQuestionSectionInsertAfter: PropTypes.func.isRequired,
  onQuestionSectionInsertAtStart: PropTypes.func.isRequired,
  position: PropTypes.oneOf([
    INSERT_SLOT_POSITION_START,
    INSERT_SLOT_POSITION_BETWEEN,
    INSERT_SLOT_POSITION_END,
  ]).isRequired,
  questionId: PropTypes.string,
  readOnly: PropTypes.bool.isRequired,
  sectionQuestionId: PropTypes.string,
};

renderInsertSlot.defaultProps = {
  questionId: "",
  sectionQuestionId: "",
};

renderSelectionToolbar.propTypes = {
  canMergeSelectedQuestions: PropTypes.bool.isRequired,
  canSplitSelectedQuestion: PropTypes.bool.isRequired,
  onQuestionSelectionClear: PropTypes.func.isRequired,
  onSelectedQuestionMerge: PropTypes.func.isRequired,
  onSelectedQuestionSplit: PropTypes.func.isRequired,
  selectedCount: PropTypes.number.isRequired,
};

renderSelectionControl.propTypes = {
  disabled: PropTypes.bool.isRequired,
  label: PropTypes.string.isRequired,
  onQuestionSelectionChange: PropTypes.func.isRequired,
  selected: PropTypes.bool.isRequired,
  selectionId: PropTypes.string.isRequired,
};
