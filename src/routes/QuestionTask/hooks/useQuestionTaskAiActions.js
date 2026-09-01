import { useCallback, useEffect } from "react";
import { message } from "antd";

import { trans } from "../../../utils/i18n";
import {
  AI_REVIEW_DECISION,
  buildQuestionDiffPreviewItems,
  getAiReviewDecision,
  getAiReviewItems,
} from "../ai/questionTaskAiDiffModel";
import {
  cancelQuestionAnalysisTaskByUuid,
  cancelQuestionQualityCheckTaskByUuid,
  submitBatchQuestionAnalysisTasks,
  submitBatchQuestionQualityCheckTasks,
} from "../models/questionTaskAiBatchTaskModel";
import { confirmQuestionTaskAiModal } from "../models/questionTaskAiConfirmModel";
import {
  applySingleAiPreviewState,
  buildSingleAiPreviewPatch,
  canConfirmAiModal,
  canRunSingleAiSend,
  createAiModalState,
  createAiPopoverState,
  getSingleAiPrompt,
  hasQuestionAiSupplementTarget,
  hasSingleAiPatchContent,
  hasSingleAiPreviewFields,
  requestSingleAiPatch,
  resetSingleAiLoading,
  showAiGenerateError,
} from "../models/questionTaskAiTaskModel";
import { isQuestionAiTaskRunning } from "../review/questionTaskRunningState";
import { useQuestionTaskAiPolling } from "./useQuestionTaskAiPolling";

const REVIEW_POPOVER_HALF_DIVISOR = 2;
const REVIEW_POPOVER_WIDTH = 144;
const REVIEW_POPOVER_MARGIN = 16;
const REVIEW_POPOVER_TOP_OFFSET = 10;

export const useQuestionTaskAiActions = ({
  aiModal,
  aiPopoverVisible,
  aiTargetQuestion,
  applyQuestionPatches,
  batchAiSettings,
  batchQualitySettings,
  clamp,
  createEmptyTypeExamples,
  defaultAiModel,
  getQuestionMapItem,
  getTypeExampleValue,
  isBatchToolRunning,
  normalizeBatchAiSettings,
  normalizeBatchQualitySettings,
  questionTypeBlank,
  setAiModal,
  setAiPopover,
  setBatchAiSettings,
  setBatchQualitySettings,
  setBatchToolRunning,
  setTaskResult,
  silentSaveAiTaskState,
  taskId,
  toVisibleQuestionState,
  visibleQuestionMap,
  visibleQuestions,
}) => {
  const { applyAndPersistAiTaskItems } = useQuestionTaskAiPolling({
    questionTypeBlank,
    setTaskResult,
    silentSaveAiTaskState,
    taskId,
    toVisibleQuestionState,
  });

  useEffect(
    (event) => {
      void event;
      if (!aiPopoverVisible) {
        return;
      }

      const hidePopover = (mouseEvent) => {
        if (mouseEvent.target?.closest?.("[data-ai-review-trigger='true']")) {
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
    [aiPopoverVisible, setAiPopover],
  );

  const openBatchAiModal = useCallback(
    (event) => {
      void event;
      setAiPopover(createAiPopoverState());
      setAiModal({
        ...createAiModalState(defaultAiModel, createEmptyTypeExamples),
        batchActionType: "analysis",
        mode: "batch",
        model: defaultAiModel,
        prompt: batchAiSettings.prompt,
        typeExamples: {
          ...batchAiSettings.typeExamples,
        },
        visible: true,
      });
    },
    [
      batchAiSettings,
      createEmptyTypeExamples,
      defaultAiModel,
      setAiModal,
      setAiPopover,
    ],
  );

  const openBatchQualityCheckModal = useCallback(
    (event) => {
      void event;
      setAiPopover(createAiPopoverState());
      setAiModal({
        ...createAiModalState(defaultAiModel, createEmptyTypeExamples),
        batchActionType: "qualityCheck",
        mode: "batch",
        prompt: batchQualitySettings.prompt,
        visible: true,
      });
    },
    [
      batchQualitySettings.prompt,
      createEmptyTypeExamples,
      defaultAiModel,
      setAiModal,
      setAiPopover,
    ],
  );

  const openSingleAiModal = useCallback(
    (questionId) => {
      setAiPopover(createAiPopoverState());
      setAiModal({
        ...createAiModalState(defaultAiModel, createEmptyTypeExamples),
        mode: "single",
        prompt: "",
        questionId,
        targetFields: [],
        visible: true,
      });
    },
    [createEmptyTypeExamples, defaultAiModel, setAiModal, setAiPopover],
  );

  const closeAiModal = useCallback(
    (event) => {
      void event;
      setAiPopover(createAiPopoverState());
      setAiModal(createAiModalState(defaultAiModel, createEmptyTypeExamples));
    },
    [createEmptyTypeExamples, defaultAiModel, setAiModal, setAiPopover],
  );

  const updateAiModal = useCallback(
    (key, value) => {
      setAiPopover(createAiPopoverState());
      setAiModal((previousState) => {
        const shouldResetPreview =
          previousState.mode === "single" && key !== "prompt";
        const resetPatch = shouldResetPreview
          ? {
              activeReviewId: "",
              previewFields: [],
              previewPatch: undefined,
              reviewDecisions: {},
              reviewFuture: [],
              reviewHistory: [],
            }
          : {};

        return Object.assign(
          {},
          previousState,
          resetPatch,
          Object.fromEntries([[key, value]]),
        );
      });
    },
    [setAiModal, setAiPopover],
  );

  const updateAiModalTypeExample = useCallback(
    (key, value) => {
      setAiModal((previousState) => ({
        ...previousState,
        typeExamples: Object.assign(
          {},
          previousState.typeExamples,
          Object.fromEntries([[key, value]]),
        ),
      }));
    },
    [setAiModal],
  );

  const selectAiReviewItem = useCallback(
    (reviewId) => {
      setAiModal((previousState) => ({
        ...previousState,
        activeReviewId: reviewId,
      }));
    },
    [setAiModal],
  );

  const openAiReviewPopover = useCallback(
    (reviewId, currentTarget) => {
      if (!currentTarget) {
        return;
      }

      const rect = currentTarget.getBoundingClientRect();
      const nextLeft = clamp(
        rect.left +
          rect.width / REVIEW_POPOVER_HALF_DIVISOR -
          REVIEW_POPOVER_WIDTH / REVIEW_POPOVER_HALF_DIVISOR,
        REVIEW_POPOVER_MARGIN,
        window.innerWidth - REVIEW_POPOVER_WIDTH - REVIEW_POPOVER_MARGIN,
      );
      const nextTop = Math.max(
        rect.top - REVIEW_POPOVER_TOP_OFFSET,
        REVIEW_POPOVER_MARGIN,
      );

      selectAiReviewItem(reviewId);
      setAiPopover({
        left: nextLeft,
        reviewId,
        top: nextTop,
        visible: true,
      });
    },
    [clamp, selectAiReviewItem, setAiPopover],
  );

  const updateAiReviewDecision = useCallback(
    (reviewId, decision) => {
      setAiPopover(createAiPopoverState());
      setAiModal((previousState) => {
        if (
          getAiReviewDecision(previousState.reviewDecisions, reviewId) ===
          decision
        ) {
          return {
            ...previousState,
            activeReviewId: reviewId,
          };
        }

        return {
          ...previousState,
          activeReviewId: reviewId,
          reviewDecisions: {
            ...previousState.reviewDecisions,
            [reviewId]: decision,
          },
          reviewFuture: [],
          reviewHistory: [
            ...(previousState.reviewHistory || []),
            previousState.reviewDecisions,
          ],
        };
      });
    },
    [setAiModal, setAiPopover],
  );

  const confirmAllAiReviewItems = useCallback(
    (event) => {
      void event;
      setAiPopover(createAiPopoverState());
      setAiModal((previousState) => {
        const nextReviewDecisions = Object.fromEntries(
          getAiReviewItems(previousState.previewFields).map((item) => [
            item.id,
            AI_REVIEW_DECISION.ACCEPTED,
          ]),
        );

        return {
          ...previousState,
          reviewDecisions: nextReviewDecisions,
          reviewFuture: [],
          reviewHistory: [
            ...(previousState.reviewHistory || []),
            previousState.reviewDecisions,
          ],
        };
      });
    },
    [setAiModal, setAiPopover],
  );

  const undoAiReviewDecision = useCallback(
    (event) => {
      void event;
      setAiPopover(createAiPopoverState());
      setAiModal((previousState) => {
        const reviewHistory = Array.isArray(previousState.reviewHistory)
          ? previousState.reviewHistory
          : [];

        if (reviewHistory.length === 0) {
          return previousState;
        }

        const previousReviewDecisions = reviewHistory.at(-1) || {};

        return {
          ...previousState,
          reviewDecisions: previousReviewDecisions,
          reviewFuture: [
            previousState.reviewDecisions,
            ...(previousState.reviewFuture || []),
          ],
          reviewHistory: reviewHistory.slice(0, -1),
        };
      });
    },
    [setAiModal, setAiPopover],
  );

  const redoAiReviewDecision = useCallback(
    (event) => {
      void event;
      setAiPopover(createAiPopoverState());
      setAiModal((previousState) => {
        const reviewFuture = Array.isArray(previousState.reviewFuture)
          ? previousState.reviewFuture
          : [];

        if (reviewFuture.length === 0) {
          return previousState;
        }

        const nextReviewDecisions = reviewFuture[0] || {};

        return {
          ...previousState,
          reviewDecisions: nextReviewDecisions,
          reviewFuture: reviewFuture.slice(1),
          reviewHistory: [
            ...(previousState.reviewHistory || []),
            previousState.reviewDecisions,
          ],
        };
      });
    },
    [setAiModal, setAiPopover],
  );

  const runBatchAiAnalysis = useCallback(
    async ({ model, prompt, typeExamples, closeAfterSuccess = true }) => {
      void model;
      if (isBatchToolRunning) {
        return;
      }
      if (taskId === "mock") {
        message.info(
          trans(
            "questionTask.mockAiTaskUnsupported",
            "当前示例数据不提交 AI 后端任务",
          ),
        );
        return;
      }

      const targetQuestions = visibleQuestions
        .filter((question) => hasQuestionAiSupplementTarget(question))
        .filter((question) => !isQuestionAiTaskRunning(question));

      if (targetQuestions.length === 0) {
        message.info(
          trans(
            "questionTask.noAnalysisTaskTarget",
            "当前没有可提交 AI 解析的题目",
          ),
        );
        return;
      }

      setBatchToolRunning("analysis");

      try {
        const nextBatchAiSettings = normalizeBatchAiSettings({
          model: defaultAiModel,
          prompt,
          typeExamples,
        });
        setBatchAiSettings(nextBatchAiSettings);
        await applyAndPersistAiTaskItems({
          analysisItems: await submitBatchQuestionAnalysisTasks({
            questions: targetQuestions,
            taskId,
          }),
        });
        message.success(
          trans(
            "questionTask.aiAnalysisSubmitted",
            "已提交 {$count} 道题的 AI 解析任务",
            { count: targetQuestions.length },
          ),
        );
        if (closeAfterSuccess) {
          closeAiModal();
        }
      } catch (error) {
        showAiGenerateError(error);
      } finally {
        setBatchToolRunning("");
      }
    },
    [
      applyAndPersistAiTaskItems,
      closeAiModal,
      defaultAiModel,
      isBatchToolRunning,
      normalizeBatchAiSettings,
      setBatchAiSettings,
      setBatchToolRunning,
      taskId,
      visibleQuestions,
    ],
  );

  const runBatchQualityCheck = useCallback(
    async ({ closeAfterSuccess = true } = {}) => {
      if (isBatchToolRunning) {
        return;
      }
      if (taskId === "mock") {
        message.info(
          trans(
            "questionTask.mockAiTaskUnsupported",
            "当前示例数据不提交 AI 后端任务",
          ),
        );
        return;
      }

      const targetQuestions = visibleQuestions.filter(
        (question) => !isQuestionAiTaskRunning(question),
      );

      if (targetQuestions.length === 0) {
        message.info(
          trans(
            "questionTask.noQualityTaskTarget",
            "当前没有可提交 AI 质检的题目",
          ),
        );
        return;
      }

      setBatchToolRunning("qualityCheck");

      try {
        await applyAndPersistAiTaskItems({
          qualityItems: await submitBatchQuestionQualityCheckTasks({
            questions: targetQuestions,
            taskId,
          }),
        });
        message.success(
          trans(
            "questionTask.aiQualitySubmitted",
            "已提交 {$count} 道题的 AI 质检任务",
            { count: targetQuestions.length },
          ),
        );
        if (closeAfterSuccess) {
          closeAiModal();
        }
      } catch (error) {
        showAiGenerateError(error);
      } finally {
        setBatchToolRunning("");
      }
    },
    [
      applyAndPersistAiTaskItems,
      closeAiModal,
      isBatchToolRunning,
      setBatchToolRunning,
      taskId,
      visibleQuestions,
    ],
  );

  const handleSingleAiSend = useCallback(
    async (event) => {
      void event;
      const prompt = getSingleAiPrompt(aiModal);

      if (!canRunSingleAiSend({ aiModal, aiTargetQuestion, prompt })) {
        return;
      }

      setAiPopover(createAiPopoverState());
      setAiModal((previousState) => ({ ...previousState, loading: true }));

      try {
        const response = await requestSingleAiPatch({
          aiModal,
          aiTargetQuestion,
          prompt,
        });
        const responsePatch = response.patch || {};

        if (!hasSingleAiPatchContent(responsePatch, setAiModal)) {
          return;
        }

        const nextPreviewPatch = buildSingleAiPreviewPatch(
          aiModal,
          responsePatch,
        );
        const previewFields = buildQuestionDiffPreviewItems(
          aiTargetQuestion,
          nextPreviewPatch,
        );

        if (!hasSingleAiPreviewFields(previewFields, setAiModal)) {
          return;
        }

        applySingleAiPreviewState(setAiModal, previewFields, nextPreviewPatch);
      } catch (error) {
        message.error(
          (error && error.message) ||
            trans("questionTask.aiGenerateFailed", "AI 生成失败"),
        );
        resetSingleAiLoading(setAiModal);
      }
    },
    [aiModal, aiTargetQuestion, setAiModal, setAiPopover],
  );

  const handleAiConfirm = useCallback(
    async (event) => {
      void event;
      if (!canConfirmAiModal({ aiModal, aiTargetQuestion })) {
        return;
      }

      try {
        await confirmQuestionTaskAiModal({
          aiModal,
          aiTargetQuestion,
          applyQuestionPatches,
          closeAiModal,
          defaultAiModel,
          getTypeExampleValue,
          normalizeBatchAiSettings,
          normalizeBatchQualitySettings,
          setAiModal,
          setBatchAiSettings,
          setBatchQualitySettings,
          taskId,
        });
      } catch (error) {
        showAiGenerateError(error);
        setAiModal((previousState) => ({ ...previousState, loading: false }));
      }
    },
    [
      aiModal,
      aiTargetQuestion,
      applyQuestionPatches,
      closeAiModal,
      defaultAiModel,
      getTypeExampleValue,
      normalizeBatchAiSettings,
      normalizeBatchQualitySettings,
      setAiModal,
      setBatchAiSettings,
      setBatchQualitySettings,
      taskId,
    ],
  );

  const handleCancelQuestionAnalysis = useCallback(
    async (questionId) => {
      const question = getQuestionMapItem(visibleQuestionMap, questionId);

      if (!question || !question.uuid) {
        return;
      }

      try {
        const analysisItems = await cancelQuestionAnalysisTaskByUuid(
          question.uuid,
        );

        await applyAndPersistAiTaskItems({
          analysisItems: analysisItems.some(
            (item) => item.uuid === question.uuid,
          )
            ? analysisItems
            : [
                {
                  errorMessage: "",
                  found: true,
                  status: "CANCELED",
                  uuid: question.uuid,
                },
              ],
        });
        message.success(
          trans("questionTask.aiAnalysisCanceled", "AI 解析任务已取消"),
        );
      } catch (error) {
        message.error(
          (error && error.message) ||
            trans("questionTask.aiCancelFailed", "取消 AI 任务失败"),
        );
      }
    },
    [applyAndPersistAiTaskItems, getQuestionMapItem, visibleQuestionMap],
  );

  const handleCancelQuestionQualityCheck = useCallback(
    async (questionId) => {
      const question = getQuestionMapItem(visibleQuestionMap, questionId);

      if (!question || !question.uuid) {
        return;
      }

      try {
        const qualityItems = await cancelQuestionQualityCheckTaskByUuid(
          question.uuid,
        );

        await applyAndPersistAiTaskItems({
          qualityItems: qualityItems.some((item) => item.uuid === question.uuid)
            ? qualityItems
            : [
                {
                  errorMessage: "",
                  found: true,
                  status: "CANCELED",
                  uuid: question.uuid,
                },
              ],
        });
        message.success(
          trans("questionTask.aiQualityCanceled", "AI 质检任务已取消"),
        );
      } catch (error) {
        message.error(
          (error && error.message) ||
            trans("questionTask.aiCancelFailed", "取消 AI 任务失败"),
        );
      }
    },
    [applyAndPersistAiTaskItems, getQuestionMapItem, visibleQuestionMap],
  );

  return {
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
  };
};
