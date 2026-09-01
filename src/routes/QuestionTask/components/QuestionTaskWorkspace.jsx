import React, { useMemo } from "react";
import { Icon, Input, Modal, Spin } from "antd";
import get from "lodash/get";
import PropTypes from "prop-types";

import { QUESTION_TASK_ANALYSIS_EXAMPLE_FIELDS } from "../../../services/questionTaskAi";
import { trans } from "../../../utils/i18n";
import {
  buildEditQuestion,
  getQuestionSourcePageImageAssets,
} from "../domain/questionTaskViewModel";
import {
  QUESTION_TASK_SPLIT_AFFORDANCE,
  QUESTION_TASK_SPLIT_MODE,
} from "../questionTaskSplitLayout";
import PageEditor from "./PageEditor";
import QuestionCards from "./QuestionCards";
import QuestionRecognitionOverview from "./QuestionRecognitionOverview";
import {
  QuestionTaskSingleAiCurrentPreview,
  QuestionTaskSingleAiDiffPreview,
} from "./QuestionTaskAiPreview";
import TaskQuestionEditor from "./TaskQuestionEditor";

import styles from "./QuestionTaskWorkspace.module.less";

const { TextArea } = Input;
const AI_MODAL_BATCH_SECTION_CLASS_NAME = styles["ai-modal-batch-section"];
const AI_MODAL_BATCH_SECTION_HEADER_CLASS_NAME =
  styles["ai-modal-batch-section-header"];
const AI_MODAL_BATCH_SECTION_TITLE_CLASS_NAME =
  styles["ai-modal-batch-section-title"];
const AI_MODAL_TEXTAREA_CLASS_NAME = styles["ai-modal-textarea"];
const AI_MODAL_BATCH_SECTION_HINT_CLASS_NAME =
  styles["ai-modal-batch-section-hint"];
const AI_MODAL_BATCH_SECTION_BODY_CLASS_NAME =
  styles["ai-modal-batch-section-body"];
const AI_MODAL_BATCH_ACTION_REGISTRY = new Map([
  [
    "analysis",
    {
      renderForm: (view) => <QuestionTaskAnalysisModalForm view={view} />,
      title: (event) => {
        void event;

        return trans("questionTask.aiAnalysisModalTitle", "AI解析设置");
      },
    },
  ],
  [
    "qualityCheck",
    {
      renderForm: (view) => <QuestionTaskQualityModalForm view={view} />,
      title: (event) => {
        void event;

        return trans("questionTask.aiQualityModalTitle", "AI质检设置");
      },
    },
  ],
]);

const AI_MODAL_MODE_REGISTRY = new Map([
  [
    "batch",
    {
      getOkText: (event) => {
        void event;

        return trans("questionTask.aiBatchModalSave", "保存设置");
      },
      getStyle: (event) => {
        void event;

        return { top: 24 };
      },
      getWidth: ({ aiBatchModalWidth }) => aiBatchModalWidth,
      getWrapClassName: (event) => {
        void event;

        return styles["ai-batch-modal-wrap"];
      },
      renderContent: (view) =>
        getAiModalBatchActionConfig(view).renderForm(view),
      title: (aiModal) => getAiModalBatchActionConfig({ aiModal }).title(),
    },
  ],
  [
    "single",
    {
      getOkText: (event) => {
        void event;

        return trans("questionTask.aiSingleModalApply", "应用已确认");
      },
      getStyle: (event) => {
        void event;

        return { top: 14 };
      },
      getWidth: ({ desktopPreviewWidth }) => desktopPreviewWidth,
      getWrapClassName: (event) => {
        void event;

        return styles["ai-single-modal-wrap"];
      },
      renderContent: (view) => <QuestionTaskSingleAiModal view={view} />,
      title: (event) => {
        void event;

        return trans("questionTask.aiSingleModalTitle", "单题 AI 修改");
      },
    },
  ],
]);

const getAiModalBatchActionConfig = (view) =>
  AI_MODAL_BATCH_ACTION_REGISTRY.get(view.aiModal.batchActionType) ||
  AI_MODAL_BATCH_ACTION_REGISTRY.get("analysis");

const getAiModalModeConfig = (mode) =>
  AI_MODAL_MODE_REGISTRY.get(mode) || AI_MODAL_MODE_REGISTRY.get("single");

const getSingleAiSendButtonText = (loading) =>
  loading
    ? trans("questionTask.aiSingleSending", "发送中")
    : trans("questionTask.aiSingleSend", "发送修改");

const getSplitHandleLabel = (splitMode) =>
  splitMode === QUESTION_TASK_SPLIT_MODE.PREVIEW_HIDDEN
    ? trans("questionTask.showImageDragHandle", "拖动显示题目图片")
    : trans(
        "questionTask.dragResizeImageAndDetailHandle",
        "拖动调整题图和详情宽度",
      );

const getSplitHandleHintText = (view) => {
  if (view.splitMode === QUESTION_TASK_SPLIT_MODE.PREVIEW_HIDDEN) {
    return trans("questionTask.showImageHandle", "显示原图");
  }

  if (view.splitAffordance === QUESTION_TASK_SPLIT_AFFORDANCE.HIDE_READY) {
    return trans("questionTask.hideImageHandle", "松手收起题图");
  }

  if (view.splitAffordance === QUESTION_TASK_SPLIT_AFFORDANCE.AT_LIMIT) {
    return trans("questionTask.keepDraggingToHideImage", "继续拖动可收起");
  }

  return trans("questionTask.resizeHandleHint", "调整宽度");
};

const getSplitHandleHintClassName = (view) =>
  `${styles["split-resize-handle-hint-bubble"]} ${
    view.splitMode === QUESTION_TASK_SPLIT_MODE.PREVIEW_HIDDEN
      ? styles["split-resize-handle-hint-bubble-visible"]
      : ""
  } ${
    view.splitAffordance === QUESTION_TASK_SPLIT_AFFORDANCE.HIDE_READY ||
    view.splitAffordance === QUESTION_TASK_SPLIT_AFFORDANCE.AT_LIMIT ||
    view.splitAffordance === QUESTION_TASK_SPLIT_AFFORDANCE.RESTORE_READY ||
    view.isSplitResizing
      ? styles["split-resize-handle-hint-bubble-visible"]
      : ""
  }`;

const getSplitHandleClassName = (view) =>
  `${styles["split-resize-handle"]} ${
    view.splitMode === QUESTION_TASK_SPLIT_MODE.PREVIEW_HIDDEN
      ? styles["split-resize-handle-hidden"]
      : ""
  } ${
    view.splitAffordance === QUESTION_TASK_SPLIT_AFFORDANCE.HIDE_READY ||
    view.splitAffordance === QUESTION_TASK_SPLIT_AFFORDANCE.RESTORE_READY
      ? styles["split-resize-handle-ready"]
      : ""
  } ${view.isSplitResizing ? styles["split-resize-handle-active"] : ""}`;

const getEditingQuestionIndex = (view) =>
  view.editingQuestion
    ? view.visibleQuestions.findIndex(
        (question) => question.draftId === view.editingQuestion.draftId,
      )
    : -1;

const getNextEditableQuestion = (view) => {
  const editingQuestionIndex = getEditingQuestionIndex(view);
  const lockedQuestionIdSet = new Set(view.runningQuestionIds || []);

  return editingQuestionIndex >= 0
    ? view.visibleQuestions
        .slice(editingQuestionIndex + 1)
        .find((question) => !lockedQuestionIdSet.has(question.draftId))
    : undefined;
};

const getPreviousEditableQuestion = (view) => {
  const editingQuestionIndex = getEditingQuestionIndex(view);
  const lockedQuestionIdSet = new Set(view.runningQuestionIds || []);

  return editingQuestionIndex >= 0
    ? view.visibleQuestions
        .slice(0, editingQuestionIndex)
        .reverse()
        .find((question) => !lockedQuestionIdSet.has(question.draftId))
    : undefined;
};

const buildReviewStatusByQuestionId = (paperReviewSummary) =>
  new Map(
    (paperReviewSummary?.groups || []).flatMap((group) =>
      (group.items || []).map((item) => [item.draftId, item]),
    ),
  );

const QuestionTaskContentBody = ({ getDefaultRightPaneWidth, view }) => {
  if (!view.taskId) {
    return (
      <div className={styles["empty-page"]}>
        {trans("questionTask.missingTaskId", "缺少 taskId 参数")}
      </div>
    );
  }

  return !view.hasTaskResult || view.visiblePages.length === 0 ? (
    <div className={styles["empty-page"]}>
      {trans("questionTask.emptyOcrResult", "暂无可展示的 OCR 结果")}
    </div>
  ) : (
    <QuestionTaskWorkspace
      getDefaultRightPaneWidth={getDefaultRightPaneWidth}
      view={view}
    />
  );
};

export const QuestionTaskContent = ({ getDefaultRightPaneWidth, view }) => (
  <div className={styles["content"]}>
    <Spin spinning={view.loading} wrapperClassName={styles["spin-wrap"]}>
      <QuestionTaskContentBody
        getDefaultRightPaneWidth={getDefaultRightPaneWidth}
        view={view}
      />
    </Spin>
  </div>
);

const QuestionTaskWorkspace = ({ getDefaultRightPaneWidth, view }) => (
  <div
    ref={view.mainReference}
    className={`${styles["main"]} ${
      view.splitMode === QUESTION_TASK_SPLIT_MODE.PREVIEW_HIDDEN
        ? styles["main-preview-hidden"]
        : ""
    } ${view.isSplitResizing ? styles["main-resizing"] : ""} ${
      view.splitAffordance === QUESTION_TASK_SPLIT_AFFORDANCE.AT_LIMIT
        ? styles["main-split-at-limit"]
        : ""
    } ${
      view.splitAffordance === QUESTION_TASK_SPLIT_AFFORDANCE.HIDE_READY
        ? styles["main-split-hide-ready"]
        : ""
    } ${
      view.splitAffordance === QUESTION_TASK_SPLIT_AFFORDANCE.RESTORE_READY
        ? styles["main-split-restore-ready"]
        : ""
    }`}
    style={{
      "--question-task-right-pane-width": `${view.rightPaneWidth}px`,
    }}
  >
    <QuestionRecognitionOverview
      onQuestionSelect={view.handleQuestionSelect}
      reviewSummary={view.paperReviewSummary}
      selectedQuestionId={view.selectedQuestionId}
    />
    <QuestionTaskLeftPane view={view} />
    <QuestionTaskSplitHandle
      getDefaultRightPaneWidth={getDefaultRightPaneWidth}
      view={view}
    />
    <QuestionTaskRightPane view={view} />
    {view.editingQuestion ? <QuestionTaskDrawer view={view} /> : false}
  </div>
);

const QuestionTaskLeftPane = ({ view }) => (
  <div
    className={`${styles["left-pane"]} ${
      view.splitMode === QUESTION_TASK_SPLIT_MODE.PREVIEW_HIDDEN
        ? styles["left-pane-hidden"]
        : ""
    }`}
  >
    <div className={styles["preview-card"]}>
      <PageEditor
        answerFileUrl={view.answerFileUrl}
        answerPages={view.answerPages}
        answerSheetMarkdown={view.answerSheetMarkdown}
        answerTextPages={view.answerTextPages}
        isQuestionSelectionLocked={view.isEditSessionActive}
        focusRequest={view.focusRequest}
        onApplyReferenceEdits={view.handleReferenceSheetApply}
        onQuestionSelect={view.handleQuestionSelect}
        pages={view.visiblePages}
        questions={view.visibleQuestions}
        selectedQuestionId={view.selectedQuestionId}
      />
    </div>
  </div>
);

const QuestionTaskSplitHandle = ({ getDefaultRightPaneWidth, view }) => {
  const isPreviewHidden =
    view.splitMode === QUESTION_TASK_SPLIT_MODE.PREVIEW_HIDDEN;
  const handleLabel = getSplitHandleLabel(view.splitMode);
  const hintText = getSplitHandleHintText(view);

  return (
    <button
      aria-label={handleLabel}
      className={getSplitHandleClassName(view)}
      title={handleLabel}
      type="button"
      onDoubleClick={(doubleClickEvent) => {
        void doubleClickEvent;
        if (isPreviewHidden) {
          view.handleResetSplitLayout();
          return;
        }

        view.setRightPaneWidth(
          getDefaultRightPaneWidth(
            view.mainReference.current?.clientWidth || 0,
          ),
        );
      }}
      onMouseDown={view.handleSplitResizeStart}
    >
      <span className={styles["split-resize-handle-rail"]}>
        <span className={styles["split-resize-handle-chevron-up"]} />
        <span className={styles["split-resize-handle-grip"]} />
        <span className={styles["split-resize-handle-chevron-down"]} />
      </span>
      <span className={getSplitHandleHintClassName(view)}>
        {isPreviewHidden ? (
          <Icon
            type="picture"
            className={styles["split-resize-handle-hint-icon"]}
          />
        ) : (
          false
        )}
        {hintText}
      </span>
    </button>
  );
};

const QuestionTaskRightPane = ({ view }) => {
  const reviewStatusByQuestionId = useMemo(
    () => buildReviewStatusByQuestionId(view.paperReviewSummary),
    [view.paperReviewSummary],
  );

  return (
    <div
      className={`${styles["right-pane"]} ${
        view.splitMode === QUESTION_TASK_SPLIT_MODE.PREVIEW_HIDDEN
          ? styles["right-pane-expanded"]
          : ""
      }`}
    >
      <div className={`${styles["card"]} ${styles["question-cards-pane"]}`}>
        <QuestionCards
          displayMode={view.questionCardDisplayMode}
          lockedQuestionIds={view.runningQuestionIds}
          onCancelQuestionAnalysis={view.handleCancelQuestionAnalysis}
          onCancelQuestionQualityCheck={view.handleCancelQuestionQualityCheck}
          onInsertAtEnd={(insertEvent) => {
            void insertEvent;
            view.insertQuestionAtBoundary("after");
          }}
          onInsertAtStart={(insertEvent) => {
            void insertEvent;
            view.insertQuestionAtBoundary("before");
          }}
          onQuestionAiEnhance={view.openSingleAiModal}
          onQuestionDelete={view.handleQuestionDelete}
          onQuestionDeselect={view.handleQuestionDeselect}
          onQuestionDuplicateAfter={(questionId) =>
            view.insertQuestionRelative(questionId, "duplicate")
          }
          onQuestionEdit={view.handleQuestionEdit}
          onQuestionInsertAfter={(questionId) =>
            view.insertQuestionRelative(questionId, "create")
          }
          onQuestionReorder={view.handleQuestionReorder}
          onSubQuestionMove={view.handleSubQuestionMove}
          onQuestionSectionInsertAfter={view.insertSectionAfter}
          onQuestionSectionInsertAtStart={view.insertSectionAtStart}
          onQuestionSectionUpdate={view.updateSectionFromQuestion}
          onQuestionSelect={view.handleQuestionSelect}
          onQuestionSelectionChange={view.handleQuestionSelectionChange}
          onQuestionSelectionClear={view.handleQuestionSelectionClear}
          onSelectedQuestionMerge={view.handleSelectedQuestionMerge}
          onSelectedQuestionSplit={view.handleSelectedQuestionSplit}
          questions={view.visibleQuestions}
          readOnly={view.isEditSessionActive}
          reviewStatusByQuestionId={reviewStatusByQuestionId}
          selectedQuestionId={view.selectedQuestionId}
          selectedQuestionIds={view.selectedQuestionIds}
        />
      </div>
    </div>
  );
};

const QuestionTaskDrawer = ({ view }) => {
  const editingQuestionIndex = getEditingQuestionIndex(view);
  const nextEditableQuestion = getNextEditableQuestion(view);
  const previousEditableQuestion = getPreviousEditableQuestion(view);
  const getNavigationTargetQuestion = (direction) =>
    direction === "previous" ? previousEditableQuestion : nextEditableQuestion;

  return (
    <div
      className={`${styles["drawer-pane"]} ${
        view.splitMode === QUESTION_TASK_SPLIT_MODE.PREVIEW_HIDDEN
          ? styles["drawer-pane-expanded"]
          : ""
      }`}
    >
      <div className={styles["drawer-card"]}>
        <TaskQuestionEditor
          editQuestion={buildEditQuestion(
            view.editingQuestion,
            view.editorTaskContext,
          )}
          hasNextQuestion={!!nextEditableQuestion}
          hasPreviousQuestion={!!previousEditableQuestion}
          onCancel={(cancelEvent) => {
            void cancelEvent;
            view.setEditingTarget();
            view.setEditingQuestionId("");
          }}
          onLocalSave={view.handleLocalSave}
          onSaveAndNext={(localSavePayload) => {
            if (!nextEditableQuestion) {
              return;
            }

            view.handleLocalSave(localSavePayload, {
              nextEditingQuestionId: nextEditableQuestion.draftId,
            });
          }}
          onNavigateQuestion={(direction, localSavePayload) => {
            const targetQuestion = getNavigationTargetQuestion(direction);

            if (!targetQuestion) {
              return;
            }

            view.handleLocalSave(localSavePayload, {
              nextEditingDirection: direction,
              nextEditingQuestionId: targetQuestion.draftId,
            });
          }}
          questionPosition={editingQuestionIndex + 1}
          sourceImageAssets={getQuestionSourcePageImageAssets(
            view.editingQuestion,
            view.editorTaskContext,
          )}
          targetSubQuestionIndex={view.editingTarget?.subQuestionIndex}
          totalQuestionCount={view.visibleQuestions.length}
        />
      </div>
    </div>
  );
};

const QuestionTaskQualityModalForm = ({ view }) => (
  <div className={styles["ai-modal-batch-form"]}>
    <section className={AI_MODAL_BATCH_SECTION_CLASS_NAME}>
      <div className={AI_MODAL_BATCH_SECTION_HEADER_CLASS_NAME}>
        <div className={AI_MODAL_BATCH_SECTION_TITLE_CLASS_NAME}>
          {trans("questionTask.aiQualityPromptTitle", "质检提示词")}
        </div>
      </div>
      <TextArea
        autosize={{ minRows: 6, maxRows: 12 }}
        className={AI_MODAL_TEXTAREA_CLASS_NAME}
        onChange={(event) => view.updateAiModal("prompt", event.target.value)}
        placeholder={trans(
          "questionTask.aiQualityPromptPlaceholder",
          "请输入通用质检要求",
        )}
        value={view.aiModal.prompt}
      />
    </section>
  </div>
);

const QuestionTaskAnalysisModalForm = ({ view }) => (
  <div className={styles["ai-modal-batch-form"]}>
    <section className={AI_MODAL_BATCH_SECTION_CLASS_NAME}>
      <div className={AI_MODAL_BATCH_SECTION_HEADER_CLASS_NAME}>
        <div className={AI_MODAL_BATCH_SECTION_TITLE_CLASS_NAME}>
          {trans("questionTask.aiAnalysisExamplesTitle", "题型示例区")}
        </div>
        <div className={AI_MODAL_BATCH_SECTION_HINT_CLASS_NAME}>
          {trans(
            "questionTask.aiAnalysisExamplesHint",
            "输入期望输出的解析的样式和要求",
          )}
        </div>
      </div>
      <div className={AI_MODAL_BATCH_SECTION_BODY_CLASS_NAME}>
        {QUESTION_TASK_ANALYSIS_EXAMPLE_FIELDS.map((field) => (
          <div key={field.key} className={styles["ai-modal-inline-field"]}>
            <label className={styles["ai-modal-inline-label"]}>
              {field.label}
            </label>
            <TextArea
              autosize={{ minRows: 2, maxRows: 6 }}
              className={AI_MODAL_TEXTAREA_CLASS_NAME}
              onChange={(event) =>
                view.updateAiModalTypeExample(field.key, event.target.value)
              }
              placeholder={field.placeholder}
              value={get(view.aiModal.typeExamples, [field.key])}
            />
          </div>
        ))}
      </div>
    </section>
    <section className={AI_MODAL_BATCH_SECTION_CLASS_NAME}>
      <div className={AI_MODAL_BATCH_SECTION_HEADER_CLASS_NAME}>
        <div className={AI_MODAL_BATCH_SECTION_TITLE_CLASS_NAME}>
          {trans("questionTask.aiAnalysisOtherRequirementsTitle", "其他要求")}
        </div>
      </div>
      <TextArea
        autosize={{ minRows: 2, maxRows: 6 }}
        className={AI_MODAL_TEXTAREA_CLASS_NAME}
        onChange={(event) => view.updateAiModal("prompt", event.target.value)}
        placeholder={trans(
          "questionTask.aiAnalysisOtherRequirementsPlaceholder",
          "请填写其他要求，例如答案格式、解析步骤要求、是否保留简写",
        )}
        value={view.aiModal.prompt}
      />
    </section>
  </div>
);

const QuestionTaskSingleAiChat = ({ view }) => (
  <section
    className={`${styles["ai-modal-section"]} ${styles["ai-modal-single-section"]} ${styles["ai-modal-single-chat-section"]}`}
  >
    <div className={styles["ai-modal-chat-bar"]}>
      <Input
        className={styles["ai-modal-chat-input"]}
        disabled={view.aiModal.loading}
        onChange={(event) => view.updateAiModal("prompt", event.target.value)}
        onPressEnter={view.handleSingleAiSend}
        placeholder={trans(
          "questionTask.aiSingleChatPlaceholder",
          "输入修改要求，回车或点击发送。可连续发送多次。",
        )}
        value={view.aiModal.prompt}
      />
      <button
        type="button"
        className={styles["ai-modal-chat-send-button"]}
        disabled={view.aiModal.loading}
        onClick={view.handleSingleAiSend}
      >
        {getSingleAiSendButtonText(view.aiModal.loading)}
      </button>
    </div>
  </section>
);

const QuestionTaskSingleAiModal = ({ view }) => (
  <>
    <section className={styles["ai-modal-preview-section"]}>
      {view.aiModal.previewFields.length > 0 ? (
        <QuestionTaskSingleAiDiffPreview view={view} />
      ) : (
        <QuestionTaskSingleAiCurrentPreview view={view} />
      )}
    </section>
    <QuestionTaskSingleAiChat view={view} />
  </>
);

export const QuestionTaskAiModal = ({
  aiBatchModalWidth,
  desktopPreviewWidth,
  view,
}) => {
  const modeConfig = getAiModalModeConfig(view.aiModal.mode);

  return (
    <Modal
      cancelText={trans("global.cancel", "取消")}
      confirmLoading={view.aiModal.loading}
      destroyOnClose
      getContainer={view.getModalContainer}
      okText={modeConfig.getOkText(view.aiModal)}
      onCancel={view.closeAiModal}
      onOk={view.handleAiConfirm}
      style={modeConfig.getStyle(view.aiModal)}
      title={modeConfig.title(view.aiModal)}
      visible={view.aiModal.visible}
      width={modeConfig.getWidth({ aiBatchModalWidth, desktopPreviewWidth })}
      wrapClassName={modeConfig.getWrapClassName(view.aiModal)}
    >
      <div className={styles["ai-modal-form"]}>
        {modeConfig.renderContent(view)}
      </div>
    </Modal>
  );
};

QuestionTaskAiModal.propTypes = {
  aiBatchModalWidth: PropTypes.number.isRequired,
  desktopPreviewWidth: PropTypes.number.isRequired,
  view: PropTypes.any.isRequired,
};

QuestionTaskAnalysisModalForm.propTypes = { view: PropTypes.any.isRequired };
QuestionTaskContent.propTypes = {
  getDefaultRightPaneWidth: PropTypes.func.isRequired,
  view: PropTypes.any.isRequired,
};
QuestionTaskContentBody.propTypes = {
  getDefaultRightPaneWidth: PropTypes.func.isRequired,
  view: PropTypes.any.isRequired,
};
QuestionTaskDrawer.propTypes = { view: PropTypes.any.isRequired };
QuestionTaskLeftPane.propTypes = { view: PropTypes.any.isRequired };
QuestionTaskQualityModalForm.propTypes = { view: PropTypes.any.isRequired };
QuestionTaskRightPane.propTypes = { view: PropTypes.any.isRequired };
QuestionTaskSingleAiChat.propTypes = { view: PropTypes.any.isRequired };
QuestionTaskSingleAiModal.propTypes = { view: PropTypes.any.isRequired };
QuestionTaskSplitHandle.propTypes = {
  getDefaultRightPaneWidth: PropTypes.func.isRequired,
  view: PropTypes.any.isRequired,
};
QuestionTaskWorkspace.propTypes = {
  getDefaultRightPaneWidth: PropTypes.func.isRequired,
  view: PropTypes.any.isRequired,
};
