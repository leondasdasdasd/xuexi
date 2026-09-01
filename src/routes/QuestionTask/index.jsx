import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { message } from "antd";

import { DEFAULT_BATCH_ANALYSIS_PROMPT } from "../../services/questionTaskAi";
import { trans } from "../../utils/i18n";
import {
  buildAiPreviewQuestion,
  buildAiPreviewSummary,
} from "./ai/questionTaskAiDiffModel";
import QuestionTaskHeader from "./components/QuestionTaskHeader";
import {
  QuestionTaskAiModal,
  QuestionTaskContent,
} from "./components/QuestionTaskWorkspace";
import { getArrayItem, QUESTION_TYPE_BLANK } from "./domain/questionTaskShared";
import {
  buildQuestionTaskSaveContext,
  buildVisibleQuestionState,
  getHashQueryValue,
  isQuestionSelectionLocked,
} from "./domain/questionTaskViewModel";
import { useQuestionTaskAiActions } from "./hooks/useQuestionTaskAiActions";
import { useQuestionTaskPageActions } from "./hooks/useQuestionTaskPageActions";
import { useQuestionTaskQuestionActions } from "./hooks/useQuestionTaskQuestionActions";
import {
  createEmptyTypeExamples,
  DEFAULT_AI_MODEL,
  getBatchAiTypeExampleValue,
  normalizeBatchAiSettings,
  normalizeBatchQualitySettings,
} from "./models/questionTaskAiSettingsModel";
import {
  applyInitialQuestionTaskState,
  createAiModalState,
  createAiPopoverState,
  finishQuestionTaskLoading,
  hasQuestionAiSupplementTarget,
  loadInitialQuestionTaskState,
  mergeTaskItemsIntoTaskResult,
  reportInitialQuestionTaskLoadError,
} from "./models/questionTaskAiTaskModel";
import {
  areStringArraysEqual,
  buildSelectableQuestionIdSet,
  formatSavedAt,
  getQuestionMapItem,
  getTaskAnswerFileUrl,
  resolveSavedAtValue,
} from "./models/questionTaskPageStateModel";
import {
  buildQuestionTaskSavePayload,
  saveQuestionTask,
} from "./persistence/questionTaskSave";
import { loadQuestionTaskSongtiFont } from "./questionTaskSongtiFontLoader";
import {
  getClampedRightPaneWidthByRatio,
  getDefaultRightPaneWidth,
} from "./questionTaskSplitLayout";
import {
  buildQuestionTaskAiModalView,
  buildQuestionTaskHeaderView,
  buildQuestionTaskWorkspaceView,
} from "./questionTaskViewModels";
import { buildPaperReviewSummary } from "./review/questionTaskPaperReviewSummary";
import { QUESTION_REVIEW_STATUS } from "./review/questionTaskReviewModel";
import {
  collectRunningQuestionIds,
  collectRunningQuestionUuids,
} from "./review/questionTaskRunningState";

import styles from "./index.module.less";
export {
  getClampedRightPaneWidthByRatio,
  getDefaultRightPaneWidth,
} from "./questionTaskSplitLayout";
const DESKTOP_PREVIEW_WIDTH = 1380;
const AI_BATCH_MODAL_WIDTH = 920;
const QUESTION_CARD_DISPLAY_MODE = {
  PREVIEW: "preview",
  REVIEW: "review",
};
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getFullscreenElement = (event) => {
  void event;

  return (
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  );
};

const QUESTION_REVIEW_STATUS_PRESENTATION_REGISTRY = new Map([
  [
    QUESTION_REVIEW_STATUS.BLOCKED,
    {
      className: styles["question-number-missing-all"],
      label: trans("questionTask.reviewStatusBlocked", "存在提交阻塞项"),
      shortLabel: trans("questionTask.reviewStatusPending", "待补齐"),
    },
  ],
  [
    QUESTION_REVIEW_STATUS.MISSING_BOTH,
    {
      className: styles["question-number-missing-all"],
      label: trans("questionTask.reviewStatusMissingBoth", "缺答案和解析"),
      shortLabel: trans(
        "questionTask.reviewStatusMissingBothShort",
        "缺答案解析",
      ),
    },
  ],
  [
    QUESTION_REVIEW_STATUS.MISSING_ANSWER,
    {
      className: styles["question-number-missing-answer"],
      label: trans("questionTask.reviewStatusMissingAnswer", "缺答案"),
      shortLabel: trans(
        "questionTask.reviewStatusMissingAnswerShort",
        "缺答案",
      ),
    },
  ],
  [
    QUESTION_REVIEW_STATUS.MISSING_ANALYSIS,
    {
      className: styles["question-number-missing-analysis"],
      label: trans("questionTask.reviewStatusMissingAnalysis", "缺解析"),
      shortLabel: trans(
        "questionTask.reviewStatusMissingAnalysisShort",
        "缺解析",
      ),
    },
  ],
  [
    QUESTION_REVIEW_STATUS.MISSING_SCORE,
    {
      className: styles["question-number-missing-score"],
      label: trans("questionTask.reviewStatusMissingScore", "缺分数"),
      shortLabel: trans("questionTask.reviewStatusMissingScoreShort", "缺分数"),
    },
  ],
]);

const COMPLETE_REVIEW_STATUS_PRESENTATION = {
  className: styles["question-number-complete"],
  label: trans("questionTask.reviewStatusComplete", "满足提交条件"),
  shortLabel: trans("questionTask.reviewStatusCompleteShort", "完整"),
};

const getQuestionReviewStatusPresentation = (status) =>
  QUESTION_REVIEW_STATUS_PRESENTATION_REGISTRY.get(status) ||
  COMPLETE_REVIEW_STATUS_PRESENTATION;

const QuestionTask = (properties) => {
  void properties;
  const closeLabel = trans("questionTask.close", "关闭");
  const taskId = getHashQueryValue("taskId");
  const pageReference = useRef();
  const mainReference = useRef();
  const aiTaskStateSaveErrorNotifiedReference = useRef(false);
  const [loading, setLoading] = useState(true);
  const [taskResult, setTaskResult] = useState();
  const [selectedQuestionId, setSelectedQuestionId] = useState("");
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
  const [editingQuestionId, setEditingQuestionId] = useState("");
  const [editingTarget, setEditingTarget] = useState();
  const [focusRequest, setFocusRequest] = useState();
  const [aiModal, setAiModal] = useState(() =>
    createAiModalState(DEFAULT_AI_MODEL, createEmptyTypeExamples),
  );
  const [aiPopover, setAiPopover] = useState(createAiPopoverState);
  const [batchAiSettings, setBatchAiSettings] = useState(() =>
    normalizeBatchAiSettings(),
  );
  const [batchQualitySettings, setBatchQualitySettings] = useState(() =>
    normalizeBatchQualitySettings(),
  );
  const [batchToolRunning, setBatchToolRunning] = useState("");
  const [questionCardDisplayMode, setQuestionCardDisplayMode] = useState(
    QUESTION_CARD_DISPLAY_MODE.PREVIEW,
  );

  useEffect(() => {
    // 题目详情页只在需要时异步注入思源宋，优先使用系统 SimSun 系列。
    loadQuestionTaskSongtiFont().catch((error) => {
      void error;
    });
  }, []);
  const aiPopoverReference = useRef();
  const getModalContainer = useCallback((event) => {
    void event;
    return pageReference.current || document.body;
  }, []);

  useEffect(
    (event) => {
      void event;
      if (!aiPopover.visible) {
        return;
      }

      const hidePopover = (event) => {
        if (
          aiPopoverReference.current &&
          aiPopoverReference.current.contains(event.target)
        ) {
          return;
        }

        if (event.target?.closest?.("[data-ai-review-trigger='true']")) {
          return;
        }

        setAiPopover(createAiPopoverState());
      };

      const hidePopoverOnResize = (resizeEvent) => {
        void resizeEvent;
        setAiPopover(createAiPopoverState());
      };

      document.addEventListener("mousedown", hidePopover);
      window.addEventListener("resize", hidePopoverOnResize);
      window.addEventListener("scroll", hidePopoverOnResize, true);

      return (cleanupEvent) => {
        void cleanupEvent;
        document.removeEventListener("mousedown", hidePopover);
        window.removeEventListener("resize", hidePopoverOnResize);
        window.removeEventListener("scroll", hidePopoverOnResize, true);
      };
    },
    [aiPopover.visible],
  );

  const silentSaveAiTaskState = useCallback(async (nextTaskResult) => {
    if (!nextTaskResult) {
      return;
    }

    try {
      const nextVisibleQuestions = buildVisibleQuestionState(
        nextTaskResult && nextTaskResult.pages,
      ).questions;

      if (nextVisibleQuestions.length === 0) {
        return;
      }

      const payload = buildQuestionTaskSavePayload(
        buildQuestionTaskSaveContext(nextTaskResult, nextVisibleQuestions),
      );
      const saveResult = await saveQuestionTask(payload, "save");
      setLastSavedAt(resolveSavedAtValue(saveResult) || Date.now());
    } catch (error) {
      void error;
      if (!aiTaskStateSaveErrorNotifiedReference.current) {
        aiTaskStateSaveErrorNotifiedReference.current = true;
        message.warning(
          trans(
            "questionTask.aiTaskStateSaveFailed",
            "AI 任务状态自动保存失败，当前页面状态已保留。",
          ),
        );
      }
    }
  }, []);

  useEffect(
    (event) => {
      void event;
      if (!taskId) {
        setLoading(false);
        return;
      }

      const mountState = { mounted: true };

      const load = async (loadEvent) => {
        void loadEvent;
        setLoading(true);

        try {
          const initialTaskState = await loadInitialQuestionTaskState({
            mountState,
            normalizeBatchAiSettings,
            normalizeBatchQualitySettings,
            questionTypeBlank: QUESTION_TYPE_BLANK,
            setBatchAiSettings,
            setBatchQualitySettings,
            taskId,
          });
          applyInitialQuestionTaskState({
            initialTaskState,
            mountState,
            setTaskResult,
            silentSaveAiTaskState,
            taskId,
          });
        } catch (error) {
          reportInitialQuestionTaskLoadError({
            error,
            mountState,
            setTaskResult,
          });
        } finally {
          finishQuestionTaskLoading({ mountState, setLoading });
        }
      };

      load();

      return (cleanupEvent) => {
        void cleanupEvent;
        mountState.mounted = false;
      };
    },
    [silentSaveAiTaskState, taskId],
  );

  const visibleState = useMemo(
    () => buildVisibleQuestionState(taskResult && taskResult.pages),
    [taskResult],
  );
  const visiblePages = visibleState.pages;
  const visibleQuestions = visibleState.questions;
  const isEditSessionActive = isQuestionSelectionLocked(editingQuestionId);
  const editingQuestion = editingQuestionId
    ? getQuestionMapItem(visibleState.questionMap, editingQuestionId)
    : false;
  const aiTargetQuestion = aiModal.questionId
    ? getQuestionMapItem(visibleState.questionMap, aiModal.questionId)
    : false;
  const aiPreviewQuestion = useMemo(
    () => buildAiPreviewQuestion(aiTargetQuestion, aiModal.previewPatch),
    [aiModal.previewPatch, aiTargetQuestion],
  );
  const aiPreviewSummary = useMemo(
    () => buildAiPreviewSummary(aiModal.previewFields, aiModal.reviewDecisions),
    [aiModal.previewFields, aiModal.reviewDecisions],
  );
  const aiSupplementCount = useMemo(
    (event) => {
      void event;
      return visibleQuestions.filter((question) =>
        hasQuestionAiSupplementTarget(question),
      ).length;
    },
    [visibleQuestions],
  );
  const answerFileUrl = useMemo(
    () => getTaskAnswerFileUrl(taskResult),
    [taskResult],
  );
  const answerPages = useMemo(
    () =>
      Array.isArray(taskResult && taskResult.answerPages)
        ? taskResult.answerPages
        : [],
    [taskResult],
  );
  const answerSheetMarkdown = useMemo(
    () => (taskResult && taskResult.answerSheetMarkdown) || "",
    [taskResult],
  );
  const answerTextPages = useMemo(
    () =>
      Array.isArray(taskResult && taskResult.answerTextPages)
        ? taskResult.answerTextPages
        : [],
    [taskResult],
  );
  const paperReviewSummary = useMemo(
    () =>
      buildPaperReviewSummary({
        getQuestionReviewStatusPresentation,
        questions: visibleQuestions,
      }),
    [visibleQuestions],
  );
  const isBatchAnalysisRunning = batchToolRunning === "analysis";
  const isBatchQualityRunning = batchToolRunning === "qualityCheck";
  const isBatchToolRunning = !!batchToolRunning;
  const runningAnalysisUuids = useMemo(
    () => collectRunningQuestionUuids(visibleQuestions, "analysisTaskStatus"),
    [visibleQuestions],
  );
  const runningQualityUuids = useMemo(
    () =>
      collectRunningQuestionUuids(visibleQuestions, "qualityCheckTaskStatus"),
    [visibleQuestions],
  );
  const runningQuestionIds = useMemo(
    () => collectRunningQuestionIds(visibleQuestions),
    [visibleQuestions],
  );
  const runningQuestionIdSet = useMemo(
    () => new Set(runningQuestionIds),
    [runningQuestionIds],
  );
  const selectableQuestionIdSet = useMemo(
    () =>
      buildSelectableQuestionIdSet({
        runningQuestionIdSet,
        visibleQuestions,
      }),
    [runningQuestionIdSet, visibleQuestions],
  );
  const hasRunningAiTask = runningQuestionIds.length > 0;
  const getClampedRightPaneWidth = useCallback(
    (nextWidth, containerWidth) =>
      // 题目详情右栏完全使用比例约束，避免固定像素在宽屏下提前卡住拖拽范围。
      getClampedRightPaneWidthByRatio(nextWidth, containerWidth),
    [],
  );

  useEffect(
    (event) => {
      void event;
      setSelectedQuestionIds((currentQuestionIds) => {
        const nextQuestionIds = editingQuestionId
          ? []
          : currentQuestionIds.filter((questionId) =>
              selectableQuestionIdSet.has(questionId),
            );

        return areStringArraysEqual(currentQuestionIds, nextQuestionIds)
          ? currentQuestionIds
          : nextQuestionIds;
      });
    },
    [editingQuestionId, selectableQuestionIdSet],
  );

  useEffect(
    (event) => {
      void event;
      if (visibleQuestions.length === 0) {
        if (selectedQuestionId) {
          setSelectedQuestionId("");
        }
        return;
      }

      if (
        !selectedQuestionId ||
        !getQuestionMapItem(visibleState.questionMap, selectedQuestionId)
      ) {
        setSelectedQuestionId(getArrayItem(visibleQuestions, 0).draftId);
      }
    },
    [selectedQuestionId, visibleQuestions, visibleState.questionMap],
  );

  const {
    applyQuestionPatches,
    handleLocalSave,
    handleQuestionDelete,
    handleQuestionDeselect,
    handleQuestionEdit,
    handleQuestionReorder,
    handleSubQuestionMove,
    handleQuestionSelect,
    handleQuestionSelectionChange,
    handleQuestionSelectionClear,
    handleReferenceSheetApply,
    handleSelectedQuestionMerge,
    handleSelectedQuestionSplit,
    insertQuestionAtBoundary,
    insertQuestionRelative,
    insertSectionAfter,
    insertSectionAtStart,
    updateSectionFromQuestion,
  } = useQuestionTaskQuestionActions({
    editingQuestionId,
    getModalContainer,
    runningQuestionIdSet,
    selectableQuestionIdSet,
    selectedQuestionId,
    selectedQuestionIds,
    setEditingQuestionId,
    setEditingTarget,
    setFocusRequest,
    setSelectedQuestionId,
    setSelectedQuestionIds,
    setTaskResult,
    taskResult,
    visibleQuestions,
  });
  const {
    handleClose,
    handleResetSplitLayout,
    handleSave,
    handleSplitResizeStart,
    handleSubmit,
    handleToggleFullscreen,
    isPageFullscreen,
    isSaving,
    isSplitResizing,
    lastSavedAt,
    rightPaneWidth,
    savingAction,
    setLastSavedAt,
    setRightPaneWidth,
    splitAffordance,
    splitMode,
  } = useQuestionTaskPageActions({
    editingQuestionId,
    getClampedRightPaneWidth,
    getDefaultRightPaneWidth,
    getFullscreenElement,
    getModalContainer,
    hasRunningAiTask,
    loading,
    mainReference,
    pageReference,
    paperReviewSummary,
    taskResult,
    visibleQuestions,
  });
  const lastSavedAtText = useMemo(
    () => formatSavedAt(lastSavedAt || (taskResult && taskResult.lastSavedAt)),
    [lastSavedAt, taskResult],
  );

  const {
    closeAiModal,
    confirmAllAiReviewItems,
    handleAiConfirm,
    handleCancelQuestionAnalysis,
    handleCancelQuestionQualityCheck,
    handleSingleAiSend,
    openAiReviewPopover,
    openBatchAiModal,
    openBatchQualityCheckModal,
    openSingleAiModal,
    redoAiReviewDecision,
    runBatchAiAnalysis,
    runBatchQualityCheck,
    undoAiReviewDecision,
    updateAiModal,
    updateAiModalTypeExample,
    updateAiReviewDecision,
  } = useQuestionTaskAiActions({
    aiModal,
    aiPopoverVisible: aiPopover.visible,
    aiTargetQuestion,
    applyQuestionPatches,
    batchAiSettings,
    batchQualitySettings,
    clamp,
    createEmptyTypeExamples,
    defaultAiModel: DEFAULT_AI_MODEL,
    getQuestionMapItem,
    getTypeExampleValue: getBatchAiTypeExampleValue,
    isBatchToolRunning,
    normalizeBatchAiSettings,
    normalizeBatchQualitySettings,
    questionTypeBlank: QUESTION_TYPE_BLANK,
    setAiModal,
    setAiPopover,
    setBatchAiSettings,
    setBatchQualitySettings,
    setBatchToolRunning,
    setTaskResult,
    silentSaveAiTaskState,
    taskId,
    toVisibleQuestionState: {
      mergeTaskItemsIntoTaskResult,
      runningAnalysisUuids,
      runningQualityUuids,
    },
    visibleQuestionMap: visibleState.questionMap,
    visibleQuestions,
  });

  const headerView = buildQuestionTaskHeaderView({
    aiSupplementCount,
    batchAiSettings,
    closeLabel,
    defaultAiModel: DEFAULT_AI_MODEL,
    defaultBatchAnalysisPrompt: DEFAULT_BATCH_ANALYSIS_PROMPT,
    handleClose,
    handleSave,
    handleSubmit,
    handleToggleFullscreen,
    hasRunningAiTask,
    isBatchAnalysisRunning,
    isBatchQualityRunning,
    isBatchToolRunning,
    isEditSessionActive,
    isPageFullscreen,
    isSaving,
    lastSavedAtText,
    loading,
    openBatchAiModal,
    openBatchQualityCheckModal,
    questionCardDisplayMode,
    runBatchAiAnalysis,
    runBatchQualityCheck,
    savingAction,
    setQuestionCardDisplayMode,
    paperName: taskResult && taskResult.paperName,
    visibleQuestions,
  });
  const workspaceView = buildQuestionTaskWorkspaceView({
    answerFileUrl,
    answerPages,
    answerSheetMarkdown,
    answerTextPages,
    editingQuestion,
    editingTarget,
    focusRequest,
    handleCancelQuestionAnalysis,
    handleCancelQuestionQualityCheck,
    handleLocalSave,
    handleQuestionDelete,
    handleQuestionDeselect,
    handleQuestionEdit,
    handleQuestionReorder,
    handleQuestionSelect,
    handleQuestionSelectionChange,
    handleQuestionSelectionClear,
    handleReferenceSheetApply,
    handleResetSplitLayout,
    handleSelectedQuestionMerge,
    handleSelectedQuestionSplit,
    handleSplitResizeStart,
    handleSubQuestionMove,
    insertQuestionAtBoundary,
    insertQuestionRelative,
    insertSectionAfter,
    insertSectionAtStart,
    isEditSessionActive,
    isSplitResizing,
    lastSavedAtText,
    loading,
    mainReference,
    openSingleAiModal,
    paperReviewSummary,
    questionCardDisplayMode,
    rightPaneWidth,
    runningQuestionIds,
    savingAction,
    selectedQuestionId,
    selectedQuestionIds,
    setEditingQuestionId,
    setEditingTarget,
    setRightPaneWidth,
    splitAffordance,
    splitMode,
    taskId,
    hasTaskResult: !!taskResult,
    taskResult,
    updateSectionFromQuestion,
    visiblePages,
    visibleQuestions,
  });
  const aiModalView = buildQuestionTaskAiModalView({
    aiModal,
    aiPopover,
    aiPopoverReference,
    aiPreviewQuestion,
    aiPreviewSummary,
    aiTargetQuestion,
    closeAiModal,
    confirmAllAiReviewItems,
    getModalContainer,
    handleAiConfirm,
    handleSingleAiSend,
    openAiReviewPopover,
    redoAiReviewDecision,
    undoAiReviewDecision,
    updateAiModal,
    updateAiModalTypeExample,
    updateAiReviewDecision,
  });

  return (
    <div
      ref={pageReference}
      data-testid="question-task-page"
      className={`${styles["page"]} ${styles["songti-scope"]}`}
    >
      <QuestionTaskHeader view={headerView} />
      <QuestionTaskContent
        getDefaultRightPaneWidth={getDefaultRightPaneWidth}
        view={workspaceView}
      />
      <QuestionTaskAiModal
        aiBatchModalWidth={AI_BATCH_MODAL_WIDTH}
        desktopPreviewWidth={DESKTOP_PREVIEW_WIDTH}
        view={aiModalView}
      />
    </div>
  );
};

export default QuestionTask;
