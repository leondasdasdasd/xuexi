import React from "react";
import PropTypes from "prop-types";

import { trans } from "../../../utils/i18n";
import {
  getArrayItem,
  OPTION_INDEX_OFFSET,
} from "../domain/questionTaskShared";
import { renderQuestionSelectionControl } from "./QuestionCardSelectionBar";
import {
  renderDragHandle,
  renderQualityBadge,
  renderTaskStatusBadge,
} from "./QuestionCardStatusUI";

import styles from "./QuestionCardsView.module.less";

const HIDDEN_NEXT_VERSION_AI_ACTION_STYLE = { display: "none" };
const ACTION_BUTTON_CLASS_NAME = styles["action-button"];
const ACTION_BUTTON_READ_ONLY_CLASS_NAME = styles["action-button-read-only"];
const REVIEW_STATUS_CLASS_NAME_REGISTRY = {
  blocked: styles["question-review-status-pending"],
  complete: styles["question-review-status-complete"],
  missingAnalysis: styles["question-review-status-warning"],
  missingAnswer: styles["question-review-status-error"],
  missingBoth: styles["question-review-status-error"],
  missingScore: styles["question-review-status-warning"],
};

const getAdjacentQuestion = (questions, index, direction) =>
  direction === "up"
    ? getArrayItem(questions, index - OPTION_INDEX_OFFSET)
    : getArrayItem(questions, index + OPTION_INDEX_OFFSET);

const canMoveQuestion = ({
  direction,
  index,
  isQuestionLocked,
  questionReadOnly,
  questions,
}) => {
  const adjacentQuestion = getAdjacentQuestion(questions, index, direction);
  const isWithinRange =
    direction === "up"
      ? index > 0
      : index < questions.length - OPTION_INDEX_OFFSET;

  return (
    isWithinRange &&
    !questionReadOnly &&
    !isQuestionLocked(adjacentQuestion && adjacentQuestion.draftId)
  );
};

const getActionButtonClassName = (disabled, extraClassName = "") =>
  `${ACTION_BUTTON_CLASS_NAME} ${extraClassName} ${
    disabled ? ACTION_BUTTON_READ_ONLY_CLASS_NAME : ""
  }`;

const stopPropagation = (event) => {
  event.stopPropagation();
};

const QuestionMoveButton = ({
  direction,
  disabled,
  label,
  onQuestionMove,
  question,
  questionIndex,
}) => (
  <button
    type="button"
    aria-label={label}
    disabled={disabled}
    className={getActionButtonClassName(disabled, styles["action-icon-button"])}
    title={label}
    onClick={(event) =>
      onQuestionMove(question, questionIndex, direction, event)
    }
  >
    {direction === "up" ? "↑" : "↓"}
  </button>
);

const QuestionActionButton = ({
  children,
  className,
  disabled,
  onClick,
  style,
}) => (
  <button
    type="button"
    disabled={disabled}
    className={getActionButtonClassName(disabled, className)}
    style={style}
    onClick={onClick}
  >
    {children}
  </button>
);

const QuestionReviewStatusBadge = ({ reviewStatus }) =>
  reviewStatus ? (
    <span
      className={`${styles["question-review-status-badge"]} ${
        REVIEW_STATUS_CLASS_NAME_REGISTRY[reviewStatus.status] ||
        styles["question-review-status-pending"]
      }`}
      title={reviewStatus.statusLabel}
    >
      {reviewStatus.statusShortLabel || reviewStatus.statusLabel}
    </span>
  ) : (
    false
  );

const QuestionCardHeaderActions = ({
  isQuestionLocked,
  isQuestionReadOnly,
  onCancelQuestionAnalysis,
  onCancelQuestionQualityCheck,
  onDragEnd,
  onDragStart,
  onQuestionAiEnhance,
  onQuestionDelete,
  onQuestionEdit,
  onQuestionMove,
  onQuestionSelectionChange,
  onToggleQualityReport,
  question,
  questionIndex,
  reviewStatus,
  questions,
  selectedQuestionIdSet,
}) => {
  const questionReadOnly = isQuestionReadOnly(question.draftId);
  const canMoveUp = canMoveQuestion({
    direction: "up",
    index: questionIndex,
    isQuestionLocked,
    questionReadOnly,
    questions,
  });
  const canMoveDown = canMoveQuestion({
    direction: "down",
    index: questionIndex,
    isQuestionLocked,
    questionReadOnly,
    questions,
  });

  return (
    <div className={styles["question-card-header"]}>
      <div className={styles["question-card-meta"]}>
        {renderQuestionSelectionControl({
          isQuestionReadOnly,
          onQuestionSelectionChange,
          question,
          selectedQuestionIdSet,
        })}
        {renderDragHandle({
          isQuestionReadOnly,
          onDragEnd,
          onDragStart,
          questionId: question.draftId,
        })}
        <span className={styles["question-type"]}>{question.typeLabel}</span>
        <QuestionReviewStatusBadge reviewStatus={reviewStatus} />
        {renderTaskStatusBadge({
          cancelLabel: trans("questionTask.cancelAiAnalysis", "取消解析"),
          label: trans("questionTask.aiAnalysisRunning", "解析中"),
          onCancel: onCancelQuestionAnalysis,
          questionId: question.draftId,
          status: question.analysisTaskStatus,
        })}
        {renderTaskStatusBadge({
          cancelLabel: trans("questionTask.cancelAiQualityCheck", "取消质检"),
          label: trans("questionTask.aiQualityCheckRunning", "质检中"),
          onCancel: onCancelQuestionQualityCheck,
          questionId: question.draftId,
          status: question.qualityCheckTaskStatus,
        })}
        {renderQualityBadge({
          onToggleQualityReport,
          question,
        })}
      </div>
      <div
        className={styles["question-card-actions"]}
        data-question-card-interactive="true"
      >
        <QuestionMoveButton
          direction="up"
          disabled={!canMoveUp}
          label={trans("global.moveUp", "上移")}
          onQuestionMove={onQuestionMove}
          question={question}
          questionIndex={questionIndex}
        />
        <QuestionMoveButton
          direction="down"
          disabled={!canMoveDown}
          label={trans("global.moveDown", "下移")}
          onQuestionMove={onQuestionMove}
          question={question}
          questionIndex={questionIndex}
        />
        <QuestionActionButton
          disabled={questionReadOnly}
          style={HIDDEN_NEXT_VERSION_AI_ACTION_STYLE}
          onClick={(event) => {
            stopPropagation(event);
            onQuestionAiEnhance(question.draftId);
          }}
        >
          {trans("questionTask.aiModify", "AI修改")}
        </QuestionActionButton>
        <QuestionActionButton
          disabled={questionReadOnly}
          onClick={(event) => {
            stopPropagation(event);
            onQuestionEdit(question.draftId);
          }}
        >
          {trans("global.edit", "编辑")}
        </QuestionActionButton>
        <QuestionActionButton
          className={styles["delete-button"]}
          disabled={questionReadOnly}
          onClick={(event) => {
            stopPropagation(event);
            onQuestionDelete(question.draftId);
          }}
        >
          {trans("global.delete", "删除")}
        </QuestionActionButton>
      </div>
    </div>
  );
};

const noop = (event) => {
  void event;
};

QuestionMoveButton.propTypes = {
  direction: PropTypes.oneOf(["up", "down"]).isRequired,
  disabled: PropTypes.bool.isRequired,
  label: PropTypes.string.isRequired,
  onQuestionMove: PropTypes.func.isRequired,
  question: PropTypes.shape({
    draftId: PropTypes.string.isRequired,
  }).isRequired,
  questionIndex: PropTypes.number.isRequired,
};

QuestionActionButton.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  disabled: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  style: PropTypes.object,
};

QuestionActionButton.defaultProps = {
  className: "",
  style: undefined,
};

QuestionReviewStatusBadge.propTypes = {
  reviewStatus: PropTypes.shape({
    status: PropTypes.string,
    statusLabel: PropTypes.string,
    statusShortLabel: PropTypes.string,
  }),
};

QuestionReviewStatusBadge.defaultProps = {
  reviewStatus: undefined,
};

QuestionCardHeaderActions.propTypes = {
  isQuestionLocked: PropTypes.func.isRequired,
  isQuestionReadOnly: PropTypes.func.isRequired,
  onCancelQuestionAnalysis: PropTypes.func,
  onCancelQuestionQualityCheck: PropTypes.func,
  onDragEnd: PropTypes.func.isRequired,
  onDragStart: PropTypes.func.isRequired,
  onQuestionAiEnhance: PropTypes.func.isRequired,
  onQuestionDelete: PropTypes.func.isRequired,
  onQuestionEdit: PropTypes.func.isRequired,
  onQuestionMove: PropTypes.func.isRequired,
  onQuestionSelectionChange: PropTypes.func,
  onToggleQualityReport: PropTypes.func.isRequired,
  question: PropTypes.shape({
    analysisTaskStatus: PropTypes.string,
    draftId: PropTypes.string.isRequired,
    qualityCheckTaskStatus: PropTypes.string,
    typeLabel: PropTypes.string,
  }).isRequired,
  questionIndex: PropTypes.number.isRequired,
  reviewStatus: PropTypes.shape({
    status: PropTypes.string,
    statusLabel: PropTypes.string,
    statusShortLabel: PropTypes.string,
  }),
  questions: PropTypes.arrayOf(PropTypes.object).isRequired,
  selectedQuestionIdSet: PropTypes.instanceOf(Set).isRequired,
};

QuestionCardHeaderActions.defaultProps = {
  onCancelQuestionAnalysis: noop,
  onCancelQuestionQualityCheck: noop,
  onQuestionSelectionChange: noop,
  reviewStatus: undefined,
};

export default QuestionCardHeaderActions;
