import React from "react";
import PropTypes from "prop-types";

import { trans } from "../../../utils/i18n";
import { getQuestionLevelLabel } from "../../../utils/questionDifficulty.js";
import {
  AI_REVIEW_DECISION,
  getAiPreviewFieldText,
  getAiReviewDecision,
  getAiReviewItemByField,
} from "../ai/questionTaskAiDiffModel";
import {
  getQuestionDisplayNumber,
  QUESTION_TYPE_COMBINATION,
} from "../domain/questionTaskShared";
import { getQuestionTypeLabel } from "../domain/questionTaskViewModel";

import styles from "./QuestionTaskAiPreview.module.less";

const AI_DIFF_ITEM_CLASS_NAME = styles["ai-diff-item"];
const AI_DIFF_ITEM_RESOLVED_CLASS_NAME = styles["ai-diff-item-resolved"];
const AI_MODAL_DIFF_SUMMARY_DIVIDER = "|";
const AI_MODAL_DIFF_SUMMARY_DIVIDER_CLASS_NAME =
  styles["ai-modal-diff-summary-divider"];

const handleAiDiffKeyDown = (event, reviewId, onDiffClick) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    onDiffClick(reviewId, event.currentTarget);
  }
};

const renderResolvedDiffSegment = (operation, operationIndex, reviewId) => (
  <span
    key={`${reviewId}-${operationIndex}`}
    className={`${AI_DIFF_ITEM_CLASS_NAME} ${AI_DIFF_ITEM_RESOLVED_CLASS_NAME}`}
  >
    {operation.value}
  </span>
);

const renderBeforeDiffSegment = ({
  activeReviewId,
  decision,
  onDiffClick,
  operation,
  operationIndex,
  reviewId,
}) => {
  if (operation.type === "add") {
    return;
  }

  if (decision !== AI_REVIEW_DECISION.PENDING) {
    return renderResolvedDiffSegment(operation, operationIndex, reviewId);
  }

  return (
    <span
      key={`${reviewId}-${operationIndex}`}
      role="button"
      tabIndex={0}
      data-ai-review-trigger="true"
      className={`${AI_DIFF_ITEM_CLASS_NAME} ${styles["ai-diff-item-remove"]} ${
        activeReviewId === reviewId ? styles["ai-diff-item-active"] : ""
      }`}
      onClick={(event) => {
        onDiffClick(reviewId, event.currentTarget);
      }}
      onKeyDown={(event) => {
        handleAiDiffKeyDown(event, reviewId, onDiffClick);
      }}
    >
      {operation.value}
    </span>
  );
};

const renderAfterDiffSegment = ({
  activeReviewId,
  isAccepted,
  isRejected,
  onDiffClick,
  operation,
  operationIndex,
  reviewId,
}) => {
  if (operation.type === "remove") {
    if (!isRejected) {
      return;
    }

    return renderResolvedDiffSegment(operation, operationIndex, reviewId);
  }

  if (isRejected) {
    return;
  }
  const interactiveAttributes = isAccepted
    ? {}
    : {
        onClick: (event) => {
          onDiffClick(reviewId, event.currentTarget);
        },
        onKeyDown: (event) => {
          handleAiDiffKeyDown(event, reviewId, onDiffClick);
        },
        role: "button",
        tabIndex: 0,
        trigger: "true",
      };

  return (
    <span
      key={`${reviewId}-${operationIndex}`}
      className={`${AI_DIFF_ITEM_CLASS_NAME} ${styles["ai-diff-item-add"]} ${
        isAccepted ? AI_DIFF_ITEM_RESOLVED_CLASS_NAME : ""
      } ${activeReviewId === reviewId ? styles["ai-diff-item-active"] : ""}`}
      {...interactiveAttributes}
      data-ai-review-trigger={interactiveAttributes.trigger}
    >
      {operation.value}
    </span>
  );
};

const renderAiInlineDiffSegments = ({
  activeReviewId,
  onDiffClick,
  operations,
  reviewDecisions,
  side,
}) =>
  (Array.isArray(operations) ? operations : []).map(
    (operation, operationIndex) => {
      if (operation.type === "same") {
        return (
          <React.Fragment key={`same-${operationIndex}`}>
            {operation.value}
          </React.Fragment>
        );
      }

      const reviewId = operation.reviewId;
      const decision = getAiReviewDecision(reviewDecisions, reviewId);
      const isAccepted = decision === AI_REVIEW_DECISION.ACCEPTED;
      const isRejected = decision === AI_REVIEW_DECISION.REJECTED;

      return side === "before"
        ? renderBeforeDiffSegment({
            activeReviewId,
            decision,
            onDiffClick,
            operation,
            operationIndex,
            reviewId,
          })
        : renderAfterDiffSegment({
            activeReviewId,
            isAccepted,
            isRejected,
            onDiffClick,
            operation,
            operationIndex,
            reviewId,
          });
    },
  );

const renderAiPreviewFieldValue = ({
  activeReviewId,
  emptyText = "-",
  field,
  onDiffClick,
  previewFields,
  question,
  reviewDecisions,
  side,
  scopeKey = "root",
}) => {
  const reviewItem = getAiReviewItemByField(previewFields, field, scopeKey);

  if (reviewItem && reviewItem.diff) {
    return renderAiInlineDiffSegments({
      activeReviewId,
      onDiffClick,
      operations: reviewItem.diff.operations,
      reviewDecisions,
      side,
    });
  }

  const text = getAiPreviewFieldText(question, field);
  return (
    text || (
      <span className={styles["ai-modal-diff-placeholder"]}>{emptyText}</span>
    )
  );
};

const renderAiDocumentOptionList = (context, optionText) =>
  optionText ? (
    <div className={styles["ai-doc-option-list"]}>
      <div className={styles["ai-doc-plain-text"]}>
        {renderAiPreviewFieldValue({ ...context, field: "optionList" })}
      </div>
    </div>
  ) : (
    false
  );

const renderAiDocumentAnswerLine = (context, answerText) =>
  answerText ? (
    <div className={styles["ai-doc-meta-line"]}>
      <span className={styles["ai-doc-meta-label"]}>
        {trans("questionTask.aiPreviewAnswerLabel", "答案")}:
      </span>
      <span className={styles["ai-doc-meta-value"]}>
        {renderAiPreviewFieldValue({
          ...context,
          emptyText: "",
          field: "answer",
        })}
      </span>
    </div>
  ) : (
    false
  );

const renderAiDocumentAnalysisSection = (context, analysisText) =>
  analysisText ? (
    <div className={styles["ai-doc-section"]}>
      <div className={styles["ai-doc-section-title"]}>
        {trans("questionTask.aiPreviewAnalysisLabel", "解析")}
      </div>
      <div className={styles["ai-doc-plain-text"]}>
        {renderAiPreviewFieldValue({
          ...context,
          emptyText: "",
          field: "analysis",
        })}
      </div>
    </div>
  ) : (
    false
  );

const renderAiDocumentQuestionLine = (context, displayNumber) => (
  <div className={styles["ai-doc-question-line"]}>
    <span className={styles["ai-doc-question-number"]}>{displayNumber}.</span>
    <div className={styles["ai-doc-question-text"]}>
      {renderAiPreviewFieldValue({ ...context, field: "content" })}
    </div>
  </div>
);

const renderAiDocumentSubQuestion = (
  context,
  subQuestion,
  subQuestionIndex,
) => {
  const subQuestionTypeLabel =
    subQuestion.typeLabel || getQuestionTypeLabel(Number(subQuestion.type));
  const subContext = {
    ...context,
    question: subQuestion,
    scopeKey: `sub-${subQuestionIndex}`,
  };

  return (
    <div
      key={`${subQuestion.draftId || subQuestionIndex}-${subQuestionIndex}`}
      className={styles["ai-doc-sub-item"]}
    >
      <div className={styles["ai-doc-sub-header"]}>
        <span className={styles["ai-doc-sub-index"]}>
          {trans("questionTask.aiPreviewSubQuestionLabel", "子题")}{" "}
          {subQuestionIndex + 1}
        </span>
        {subQuestionTypeLabel ? (
          <span className={styles["ai-doc-sub-type-tag"]}>
            {subQuestionTypeLabel}
          </span>
        ) : (
          false
        )}
      </div>
      {renderAiDocumentQuestionLine(subContext, subQuestionIndex + 1)}
      {renderAiDocumentOptionList(
        subContext,
        getAiPreviewFieldText(subQuestion, "optionList"),
      )}
      {renderAiDocumentAnswerLine(
        subContext,
        getAiPreviewFieldText(subQuestion, "answer"),
      )}
      {renderAiDocumentAnalysisSection(
        subContext,
        getAiPreviewFieldText(subQuestion, "analysis"),
      )}
    </div>
  );
};

const renderAiDocumentSubQuestionList = (
  context,
  isCombinationQuestion,
  subQuestionList,
) =>
  isCombinationQuestion && subQuestionList.length > 0 ? (
    <div className={styles["ai-doc-sub-list"]}>
      {subQuestionList.map((subQuestion, subQuestionIndex) =>
        renderAiDocumentSubQuestion(context, subQuestion, subQuestionIndex),
      )}
    </div>
  ) : (
    false
  );

const getQuestionPreviewMeta = (question) => ({
  isCombinationQuestion: Number(question.type) === QUESTION_TYPE_COMBINATION,
  questionLevelLabel:
    question.questionLevelName || getQuestionLevelLabel(question.questionLevel),
  questionTypeLabel:
    question.typeLabel || getQuestionTypeLabel(Number(question.type)),
  subQuestionList: Array.isArray(question.sonQuestionList)
    ? question.sonQuestionList
    : [],
});

const QuestionTaskAiPreviewHeader = ({
  questionLevelLabel,
  questionTypeLabel,
  title,
}) => (
  <div className={styles["ai-doc-header"]}>
    <div className={styles["ai-doc-header-left"]}>
      <span className={styles["ai-doc-tag"]}>{title}</span>
      {questionTypeLabel ? (
        <span className={styles["ai-doc-type-tag"]}>{questionTypeLabel}</span>
      ) : (
        false
      )}
      {questionLevelLabel ? (
        <span className={styles["ai-doc-type-tag"]}>{questionLevelLabel}</span>
      ) : (
        false
      )}
    </div>
  </div>
);

const QuestionTaskAiPreviewBody = ({
  analysisText,
  answerText,
  displayNumber,
  fieldContext,
  footerContent,
  isCombinationQuestion,
  optionText,
  subQuestionList,
}) => (
  <div
    className={`${styles["ai-doc-body"]} ${footerContent ? styles["ai-doc-body-with-footer"] : ""}`}
  >
    {renderAiDocumentQuestionLine(fieldContext, displayNumber)}
    {renderAiDocumentOptionList(fieldContext, optionText)}
    {isCombinationQuestion
      ? false
      : renderAiDocumentAnswerLine(fieldContext, answerText)}
    {renderAiDocumentAnalysisSection(fieldContext, analysisText)}
    {renderAiDocumentSubQuestionList(
      fieldContext,
      isCombinationQuestion,
      subQuestionList,
    )}
  </div>
);

export const QuestionTaskAiPreviewDocument = ({
  activeReviewId,
  footerContent,
  onDiffClick,
  previewFields,
  question,
  reviewDecisions,
  side,
  title,
}) => {
  if (!question) {
    return;
  }

  const displayNumber = getQuestionDisplayNumber(question);
  const previewMeta = getQuestionPreviewMeta(question);
  const answerText = getAiPreviewFieldText(question, "answer");
  const analysisText = getAiPreviewFieldText(question, "analysis");
  const optionText = getAiPreviewFieldText(question, "optionList");
  const fieldContext = {
    activeReviewId,
    onDiffClick,
    previewFields,
    question,
    reviewDecisions,
    side,
  };

  return (
    <div className={styles["ai-doc-panel"]}>
      <QuestionTaskAiPreviewHeader
        questionLevelLabel={previewMeta.questionLevelLabel}
        questionTypeLabel={previewMeta.questionTypeLabel}
        title={title}
      />
      <QuestionTaskAiPreviewBody
        analysisText={analysisText}
        answerText={answerText}
        displayNumber={displayNumber}
        fieldContext={fieldContext}
        footerContent={footerContent}
        isCombinationQuestion={previewMeta.isCombinationQuestion}
        optionText={optionText}
        subQuestionList={previewMeta.subQuestionList}
      />
      {footerContent ? (
        <div className={styles["ai-doc-footer"]}>{footerContent}</div>
      ) : (
        false
      )}
    </div>
  );
};

export const QuestionTaskSingleAiCurrentPreview = ({ view }) => (
  <div className={styles["ai-modal-single-doc-layout"]}>
    <QuestionTaskAiPreviewDocument
      activeReviewId=""
      onDiffClick={view.openAiReviewPopover}
      previewFields={[]}
      question={view.aiTargetQuestion}
      reviewDecisions={{}}
      side="before"
      title={trans("questionTask.aiPreviewCurrentTitle", "当前题目")}
    />
  </div>
);

export const QuestionTaskAiDiffSummary = ({ summary }) => (
  <div className={styles["ai-modal-diff-summary-bar"]}>
    <QuestionTaskAiDiffSummaryItem
      count={summary.totalCount}
      label={trans("questionTask.aiPreviewSummaryTotal", "总变更")}
    />
    <span className={AI_MODAL_DIFF_SUMMARY_DIVIDER_CLASS_NAME}>
      {AI_MODAL_DIFF_SUMMARY_DIVIDER}
    </span>
    <QuestionTaskAiDiffSummaryItem
      className={styles["ai-modal-diff-summary-pending"]}
      count={summary.pendingCount}
      label={trans("questionTask.aiPreviewSummaryPending", "待确认")}
    />
    <span className={AI_MODAL_DIFF_SUMMARY_DIVIDER_CLASS_NAME}>
      {AI_MODAL_DIFF_SUMMARY_DIVIDER}
    </span>
    <QuestionTaskAiDiffSummaryItem
      className={styles["ai-modal-diff-summary-remove"]}
      count={summary.removedCount}
      label={trans("questionTask.aiPreviewSummaryRemoved", "删除")}
    />
    <span className={AI_MODAL_DIFF_SUMMARY_DIVIDER_CLASS_NAME}>
      {AI_MODAL_DIFF_SUMMARY_DIVIDER}
    </span>
    <QuestionTaskAiDiffSummaryItem
      className={styles["ai-modal-diff-summary-add"]}
      count={summary.addedCount}
      label={trans("questionTask.aiPreviewSummaryAdded", "新增")}
    />
  </div>
);

const QuestionTaskAiDiffSummaryItem = ({ className, count, label }) => (
  <span className={className}>
    {label} <strong>{count}</strong>{" "}
    {trans("questionTask.aiPreviewSummaryCountUnit", "处")}
  </span>
);

const QuestionTaskAiDiffFooter = ({
  canRedo,
  canUndo,
  onConfirmAll,
  onRedo,
  onUndo,
}) => (
  <div className={styles["ai-doc-floating-actions"]}>
    <div className={styles["ai-doc-floating-actions-left"]}>
      <button
        type="button"
        className={styles["ai-modal-history-button"]}
        disabled={!canUndo}
        onClick={onUndo}
      >
        {trans("questionTask.aiPreviewUndo", "撤销")}
      </button>
      <button
        type="button"
        className={styles["ai-modal-history-button"]}
        disabled={!canRedo}
        onClick={onRedo}
      >
        {trans("questionTask.aiPreviewRedo", "前进")}
      </button>
    </div>
    <div className={styles["ai-doc-floating-actions-right"]}>
      <button
        type="button"
        className={styles["ai-modal-confirm-all-button"]}
        onClick={onConfirmAll}
      >
        {trans("questionTask.aiPreviewConfirmAll", "一键确认所有变更")}
      </button>
    </div>
  </div>
);

const QuestionTaskAiDiffLegend = (properties) => {
  void properties;
  return (
    <div className={styles["ai-modal-diff-legend"]}>
      <span
        className={`${styles["ai-modal-diff-legend-tag"]} ${styles["ai-modal-diff-legend-remove-tag"]}`}
      >
        {trans("questionTask.aiPreviewLegendRemoveTag", "红色")}
      </span>
      {trans("questionTask.aiPreviewLegendRemoveText", "表示删除内容")}
      <span
        className={`${styles["ai-modal-diff-legend-tag"]} ${styles["ai-modal-diff-legend-add-tag"]}`}
      >
        {trans("questionTask.aiPreviewLegendAddTag", "绿色")}
      </span>
      {trans(
        "questionTask.aiPreviewLegendAddText",
        "表示新增内容，点击高亮内容可确认或拒绝",
      )}
    </div>
  );
};

const QuestionTaskAiDiffPopover = ({
  aiPopoverReference,
  left,
  onUpdateDecision,
  reviewId,
  top,
}) => (
  <div
    ref={aiPopoverReference}
    className={styles["ai-diff-action-popover"]}
    style={{
      left,
      top,
    }}
  >
    <button
      type="button"
      className={styles["ai-modal-diff-secondary-button"]}
      onClick={(clickEvent) => {
        void clickEvent;
        onUpdateDecision(reviewId, AI_REVIEW_DECISION.REJECTED);
      }}
    >
      {trans("questionTask.aiPreviewReject", "拒绝")}
    </button>
    <button
      type="button"
      className={styles["ai-modal-diff-primary-button"]}
      onClick={(clickEvent) => {
        void clickEvent;
        onUpdateDecision(reviewId, AI_REVIEW_DECISION.ACCEPTED);
      }}
    >
      {trans("questionTask.aiPreviewAccept", "确认")}
    </button>
  </div>
);

export const QuestionTaskSingleAiDiffPreview = ({ view }) => (
  <>
    <QuestionTaskAiDiffSummary summary={view.aiPreviewSummary} />
    <div className={styles["ai-modal-doc-layout"]}>
      <QuestionTaskAiPreviewDocument
        activeReviewId={view.aiModal.activeReviewId}
        onDiffClick={view.openAiReviewPopover}
        previewFields={view.aiModal.previewFields}
        question={view.aiTargetQuestion}
        reviewDecisions={view.aiModal.reviewDecisions}
        side="before"
        title={trans("questionTask.aiPreviewOriginalTitle", "原题")}
      />
      <QuestionTaskAiPreviewDocument
        activeReviewId={view.aiModal.activeReviewId}
        footerContent={
          <QuestionTaskAiDiffFooter
            canRedo={view.aiModal.reviewFuture.length > 0}
            canUndo={view.aiModal.reviewHistory.length > 0}
            onConfirmAll={view.confirmAllAiReviewItems}
            onRedo={view.redoAiReviewDecision}
            onUndo={view.undoAiReviewDecision}
          />
        }
        onDiffClick={view.openAiReviewPopover}
        previewFields={view.aiModal.previewFields}
        question={view.aiPreviewQuestion}
        reviewDecisions={view.aiModal.reviewDecisions}
        side="after"
        title={trans("questionTask.aiPreviewPatchedTitle", "AI 修改后")}
      />
    </div>
    <QuestionTaskAiDiffLegend />
    {view.aiPopover.visible ? (
      <QuestionTaskAiDiffPopover
        aiPopoverReference={view.aiPopoverReference}
        left={view.aiPopover.left}
        onUpdateDecision={view.updateAiReviewDecision}
        reviewId={view.aiPopover.reviewId}
        top={view.aiPopover.top}
      />
    ) : (
      false
    )}
  </>
);

QuestionTaskAiPreviewDocument.propTypes = {
  activeReviewId: PropTypes.string,
  footerContent: PropTypes.node,
  onDiffClick: PropTypes.func.isRequired,
  previewFields: PropTypes.arrayOf(PropTypes.object),
  question: PropTypes.object,
  reviewDecisions: PropTypes.object,
  side: PropTypes.oneOf(["before", "after"]).isRequired,
  title: PropTypes.string.isRequired,
};

QuestionTaskAiPreviewDocument.defaultProps = {
  activeReviewId: "",
  previewFields: [],
  reviewDecisions: {},
};

QuestionTaskSingleAiCurrentPreview.propTypes = {
  view: PropTypes.shape({
    aiTargetQuestion: PropTypes.object,
    openAiReviewPopover: PropTypes.func.isRequired,
  }).isRequired,
};

QuestionTaskAiDiffSummary.propTypes = {
  summary: PropTypes.shape({
    addedCount: PropTypes.number,
    pendingCount: PropTypes.number,
    removedCount: PropTypes.number,
    totalCount: PropTypes.number,
  }).isRequired,
};

QuestionTaskAiDiffSummaryItem.propTypes = {
  className: PropTypes.string,
  count: PropTypes.number.isRequired,
  label: PropTypes.string.isRequired,
};

QuestionTaskAiDiffSummaryItem.defaultProps = {
  className: "",
};

QuestionTaskAiDiffFooter.propTypes = {
  canRedo: PropTypes.bool.isRequired,
  canUndo: PropTypes.bool.isRequired,
  onConfirmAll: PropTypes.func.isRequired,
  onRedo: PropTypes.func.isRequired,
  onUndo: PropTypes.func.isRequired,
};

QuestionTaskAiDiffPopover.propTypes = {
  aiPopoverReference: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.any }),
  ]).isRequired,
  left: PropTypes.number.isRequired,
  onUpdateDecision: PropTypes.func.isRequired,
  reviewId: PropTypes.string.isRequired,
  top: PropTypes.number.isRequired,
};

QuestionTaskAiPreviewBody.propTypes = {
  analysisText: PropTypes.string.isRequired,
  answerText: PropTypes.string.isRequired,
  displayNumber: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
    .isRequired,
  fieldContext: PropTypes.object.isRequired,
  footerContent: PropTypes.node,
  isCombinationQuestion: PropTypes.bool.isRequired,
  optionText: PropTypes.string.isRequired,
  subQuestionList: PropTypes.arrayOf(PropTypes.object).isRequired,
};

QuestionTaskAiPreviewHeader.propTypes = {
  questionLevelLabel: PropTypes.string,
  questionTypeLabel: PropTypes.string,
  title: PropTypes.string.isRequired,
};

QuestionTaskAiPreviewHeader.defaultProps = {
  questionLevelLabel: "",
  questionTypeLabel: "",
};

QuestionTaskSingleAiDiffPreview.propTypes = {
  view: PropTypes.shape({
    aiModal: PropTypes.shape({
      activeReviewId: PropTypes.string,
      previewFields: PropTypes.arrayOf(PropTypes.object),
      reviewDecisions: PropTypes.object,
      reviewFuture: PropTypes.arrayOf(PropTypes.object),
      reviewHistory: PropTypes.arrayOf(PropTypes.object),
    }).isRequired,
    aiPopover: PropTypes.shape({
      left: PropTypes.number,
      reviewId: PropTypes.string,
      top: PropTypes.number,
      visible: PropTypes.bool,
    }).isRequired,
    aiPopoverReference: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.shape({ current: PropTypes.any }),
    ]).isRequired,
    aiPreviewQuestion: PropTypes.object,
    aiPreviewSummary: PropTypes.shape({
      addedCount: PropTypes.number,
      pendingCount: PropTypes.number,
      removedCount: PropTypes.number,
      totalCount: PropTypes.number,
    }).isRequired,
    aiTargetQuestion: PropTypes.object,
    confirmAllAiReviewItems: PropTypes.func.isRequired,
    openAiReviewPopover: PropTypes.func.isRequired,
    redoAiReviewDecision: PropTypes.func.isRequired,
    undoAiReviewDecision: PropTypes.func.isRequired,
    updateAiReviewDecision: PropTypes.func.isRequired,
  }).isRequired,
};
