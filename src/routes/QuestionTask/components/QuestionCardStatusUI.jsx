import React from "react";
import { Icon } from "antd";
import PropTypes from "prop-types";
import ReactMarkdown from "react-markdown";

import { trans } from "../../../utils/i18n";
import { isAiTaskRunningStatus } from "../domain/questionTaskShared";
import {
  getQualityLabel,
  getQualityStatusClassName,
} from "./QuestionCardContent";

import styles from "./QuestionCardsView.module.less";

export const renderTaskStatusBadge = ({
  cancelLabel,
  label,
  onCancel,
  questionId,
  status,
}) =>
  isAiTaskRunningStatus(status) && (
    <span className={styles["question-ai-task-badge"]}>
      <Icon type="loading" />
      <span>{label}</span>
      <button
        type="button"
        className={styles["question-ai-task-cancel-button"]}
        onClick={(event) => {
          event.stopPropagation();
          onCancel(questionId);
        }}
      >
        {cancelLabel}
      </button>
    </span>
  );

export const renderQualityBadge = ({ onToggleQualityReport, question }) => {
  const qualityCheck = question && question.aiQualityCheck;

  return (
    qualityCheck && (
      <button
        type="button"
        data-quality-report-trigger="true"
        className={`${styles["question-quality-badge"]} ${getQualityStatusClassName(
          qualityCheck,
        )}`}
        onClick={(event) => onToggleQualityReport(question, event)}
      >
        <Icon type="star" />
        <span>{getQualityLabel(qualityCheck)}</span>
      </button>
    )
  );
};

export const renderQualityReport = ({
  openedQualityReportId,
  qualityPopoverPosition,
  qualityPopoverReference,
  question,
}) => {
  const qualityCheck = question && question.aiQualityCheck;

  if (!qualityCheck || openedQualityReportId !== question.draftId) {
    return false;
  }

  return (
    <div
      ref={qualityPopoverReference}
      className={styles["question-quality-floating-card"]}
      style={
        qualityPopoverPosition
          ? {
              left: qualityPopoverPosition.left,
              top: qualityPopoverPosition.top,
            }
          : undefined
      }
    >
      <div
        className={styles["question-quality-floating-arrow"]}
        style={
          qualityPopoverPosition &&
          qualityPopoverPosition.arrowTop !== undefined
            ? { top: qualityPopoverPosition.arrowTop }
            : undefined
        }
      />
      <div className={styles["question-quality-report"]}>
        <div className={styles["question-quality-report-header"]}>
          <div
            className={`${styles["question-quality-badge"]} ${getQualityStatusClassName(
              qualityCheck,
            )}`}
          >
            <Icon type="star" />
            <span>{getQualityLabel(qualityCheck)}</span>
          </div>
          <div className={styles["question-quality-result"]}>
            {qualityCheck.resultLabel}
          </div>
        </div>
        {qualityCheck.reportMarkdown && (
          <div className={styles["question-quality-markdown"]}>
            <ReactMarkdown source={qualityCheck.reportMarkdown} />
          </div>
        )}
      </div>
    </div>
  );
};

export const renderDragHandle = ({
  isQuestionReadOnly,
  onDragEnd,
  onDragStart,
  questionId,
}) =>
  !isQuestionReadOnly(questionId) && (
    <button
      type="button"
      draggable
      aria-label={trans("questionTask.dragReorder", "拖动排序")}
      className={styles["question-drag-handle"]}
      title={trans("questionTask.dragReorder", "拖动排序")}
      onClick={(event) => event.stopPropagation()}
      onDragEnd={onDragEnd}
      onDragStart={(event) => onDragStart(questionId, event)}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <Icon type="menu" />
    </button>
  );

renderTaskStatusBadge.propTypes = {
  cancelLabel: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  onCancel: PropTypes.func.isRequired,
  questionId: PropTypes.string.isRequired,
  status: PropTypes.string,
};

renderTaskStatusBadge.defaultProps = {
  status: "",
};
