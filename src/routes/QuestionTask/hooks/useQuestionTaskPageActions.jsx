import React, { useCallback, useEffect, useRef, useState } from "react";
import { message, Modal } from "antd";

import { trans } from "../../../utils/i18n";
import { closeFullscreen, openFullscreen } from "../../../utils/utils";
import SaveReviewContent from "../components/SaveReviewContent";
import { buildQuestionTaskSaveContext } from "../domain/questionTaskViewModel";
import { resolveSavedAtValue } from "../models/questionTaskPageStateModel";
import {
  buildQuestionTaskSavePayload,
  saveQuestionTask,
} from "../persistence/questionTaskSave";
import {
  getHiddenPreviewAffordance,
  getSplitAffordanceByWidth,
  QUESTION_TASK_SPLIT_AFFORDANCE,
  QUESTION_TASK_SPLIT_MODE,
  shouldHidePreviewByWidth,
  shouldRestoreHiddenPreview,
} from "../questionTaskSplitLayout";
import { getSubmitBlockingFieldLabels } from "../review/questionTaskReviewModel";

const SUBMIT_BLOCKING_MODAL_WIDTH = 760;
const DEFAULT_DESKTOP_PREVIEW_WIDTH = 1380;
const SUBMIT_CONFIRM_MODAL_WIDTH = 760;

const closeQuestionTask = (event) => {
  void event;
  window.close();
  window.location.hash = "/testPaperManagement";
};

const showSaveMessage = (currentMessage) => {
  if (
    currentMessage ===
    trans("questionTask.noPendingQuestionToSave", "暂无待保存的题目")
  ) {
    message.info(currentMessage);
    return;
  }

  message.error(currentMessage);
};

export const useQuestionTaskPageActions = ({
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
}) => {
  const [savingAction, setSavingAction] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState("");
  const [rightPaneWidth, setRightPaneWidth] = useState(
    getDefaultRightPaneWidth(
      window.innerWidth || DEFAULT_DESKTOP_PREVIEW_WIDTH,
    ),
  );
  const [splitMode, setSplitMode] = useState(QUESTION_TASK_SPLIT_MODE.SPLIT);
  const [splitAffordance, setSplitAffordance] = useState(
    QUESTION_TASK_SPLIT_AFFORDANCE.IDLE,
  );
  const [isSplitResizing, setIsSplitResizing] = useState(false);
  const [isPageFullscreen, setIsPageFullscreen] = useState(false);
  const hasInitializedRightPaneWidthReference = useRef(false);
  const lastExpandedRightPaneWidthReference = useRef(
    getDefaultRightPaneWidth(
      window.innerWidth || DEFAULT_DESKTOP_PREVIEW_WIDTH,
    ),
  );
  const getFullscreenTarget = useCallback(
    () => pageReference.current || mainReference.current,
    [mainReference, pageReference],
  );

  useEffect(
    (event) => {
      void event;
      const handleFullscreenChange = (changeEvent) => {
        void changeEvent;
        const fullscreenElement = getFullscreenElement();
        const fullscreenTarget = getFullscreenTarget();

        setIsPageFullscreen(
          !!(
            fullscreenElement &&
            fullscreenTarget &&
            (fullscreenElement === fullscreenTarget ||
              fullscreenTarget.contains(fullscreenElement) ||
              fullscreenElement.contains(fullscreenTarget))
          ),
        );
      };

      document.addEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange,
      );
      document.addEventListener("mozfullscreenchange", handleFullscreenChange);
      document.addEventListener("fullscreenchange", handleFullscreenChange);
      document.addEventListener("msfullscreenchange", handleFullscreenChange);

      return (cleanupEvent) => {
        void cleanupEvent;
        document.removeEventListener(
          "webkitfullscreenchange",
          handleFullscreenChange,
        );
        document.removeEventListener(
          "mozfullscreenchange",
          handleFullscreenChange,
        );
        document.removeEventListener(
          "fullscreenchange",
          handleFullscreenChange,
        );
        document.removeEventListener(
          "msfullscreenchange",
          handleFullscreenChange,
        );
      };
    },
    [getFullscreenElement, getFullscreenTarget],
  );

  useEffect((event) => {
    void event;
    return (cleanupEvent) => {
      void cleanupEvent;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, []);

  useEffect(
    (event) => {
      void event;
      const handleWindowResize = (resizeEvent) => {
        void resizeEvent;
        if (!mainReference.current) {
          return;
        }

        const mainRect = mainReference.current.getBoundingClientRect();
        if (!hasInitializedRightPaneWidthReference.current) {
          hasInitializedRightPaneWidthReference.current = true;
          setRightPaneWidth(
            getClampedRightPaneWidth(
              getDefaultRightPaneWidth(mainRect.width),
              mainRect.width,
            ),
          );
          return;
        }

        setRightPaneWidth((currentWidth) =>
          splitMode === QUESTION_TASK_SPLIT_MODE.PREVIEW_HIDDEN
            ? mainRect.width
            : getClampedRightPaneWidth(currentWidth, mainRect.width),
        );
      };

      window.addEventListener("resize", handleWindowResize);
      handleWindowResize();

      return (cleanupEvent) => {
        void cleanupEvent;
        window.removeEventListener("resize", handleWindowResize);
      };
    },
    [
      getClampedRightPaneWidth,
      getDefaultRightPaneWidth,
      mainReference,
      splitMode,
    ],
  );

  const handleClose = useCallback(
    (event) => {
      void event;
      if (!editingQuestionId) {
        closeQuestionTask();
        return;
      }

      Modal.confirm({
        cancelText: trans("global.cancel", "取消"),
        content: trans(
          "questionTask.closeConfirmContent",
          "当前正在编辑题目，未保存的修改将丢失。确认关闭吗？",
        ),
        getContainer: getModalContainer,
        okText: trans("global.ok", "确认"),
        title: trans("questionTask.closeConfirmTitle", "确认关闭当前页面？"),
        onOk: closeQuestionTask,
      });
    },
    [editingQuestionId, getModalContainer],
  );

  const handleToggleFullscreen = useCallback(
    (event) => {
      void event;
      const fullscreenTarget = getFullscreenTarget();

      if (!fullscreenTarget) {
        return;
      }

      // 退出全屏以浏览器实时状态为准，避免 fullscreenchange 延迟导致按钮再次触发进入全屏。
      if (getFullscreenElement()) {
        closeFullscreen();
        return;
      }

      openFullscreen(fullscreenTarget);
    },
    [getFullscreenElement, getFullscreenTarget],
  );

  const handleSplitResizeStart = useCallback(
    (event) => {
      if (event.button !== 0 || !mainReference.current) {
        return;
      }

      event.preventDefault();

      const mainRect = mainReference.current.getBoundingClientRect();
      const currentSplitMode = splitMode;
      const dragStartClientX = event.clientX;
      setIsSplitResizing(true);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      const handleMouseMove = (moveEvent) => {
        // 左侧图片区隐藏后，只跟踪“拖出多少”来判断是否恢复，不提前改动主布局。
        if (currentSplitMode === QUESTION_TASK_SPLIT_MODE.PREVIEW_HIDDEN) {
          const revealedWidth = Math.max(
            0,
            moveEvent.clientX - dragStartClientX,
          );
          setSplitAffordance(getHiddenPreviewAffordance(revealedWidth));
          return;
        }

        const nextRightPaneWidth = mainRect.right - moveEvent.clientX;
        setRightPaneWidth(
          getClampedRightPaneWidth(nextRightPaneWidth, mainRect.width),
        );
        setSplitAffordance(
          getSplitAffordanceByWidth({
            containerWidth: mainRect.width,
            nextWidth: nextRightPaneWidth,
            splitMode: currentSplitMode,
          }),
        );
      };
      const handleMouseUp = (mouseUpEvent) => {
        // 释放时统一完成状态切换，避免拖拽过程中频繁进入/退出折叠态导致布局抖动。
        if (currentSplitMode === QUESTION_TASK_SPLIT_MODE.PREVIEW_HIDDEN) {
          const revealedWidth = Math.max(
            0,
            mouseUpEvent.clientX - dragStartClientX,
          );
          if (shouldRestoreHiddenPreview(revealedWidth)) {
            setSplitMode(QUESTION_TASK_SPLIT_MODE.SPLIT);
            setRightPaneWidth((currentWidth) =>
              getClampedRightPaneWidth(
                lastExpandedRightPaneWidthReference.current || currentWidth,
                mainRect.width,
              ),
            );
          }
        } else {
          const releaseWidth = mainRect.right - mouseUpEvent.clientX;
          if (shouldHidePreviewByWidth(releaseWidth, mainRect.width)) {
            setSplitMode(QUESTION_TASK_SPLIT_MODE.PREVIEW_HIDDEN);
            setRightPaneWidth(mainRect.width);
          }
        }

        setIsSplitResizing(false);
        setSplitAffordance(QUESTION_TASK_SPLIT_AFFORDANCE.IDLE);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [getClampedRightPaneWidth, mainReference, splitMode],
  );

  const handleResetSplitLayout = useCallback(
    (event) => {
      void event;
      if (!mainReference.current) {
        return;
      }

      const mainRect = mainReference.current.getBoundingClientRect();
      const nextWidth = getClampedRightPaneWidth(
        lastExpandedRightPaneWidthReference.current ||
          getDefaultRightPaneWidth(mainRect.width),
        mainRect.width,
      );

      setSplitMode(QUESTION_TASK_SPLIT_MODE.SPLIT);
      setSplitAffordance(QUESTION_TASK_SPLIT_AFFORDANCE.IDLE);
      setRightPaneWidth(nextWidth);
    },
    [getClampedRightPaneWidth, getDefaultRightPaneWidth, mainReference],
  );

  const buildSavePayload = useCallback(
    (event) => {
      void event;
      try {
        return buildQuestionTaskSavePayload(
          buildQuestionTaskSaveContext(taskResult, visibleQuestions),
        );
      } catch (error) {
        const currentMessage =
          (error && error.message) ||
          trans("questionTask.saveFailed", "保存失败");
        showSaveMessage(currentMessage);
        return;
      }
    },
    [taskResult, visibleQuestions],
  );

  const executePaperSave = useCallback(async (payload, action) => {
    setSavingAction(action);

    try {
      const saveResult = await saveQuestionTask(payload, action);
      setLastSavedAt(resolveSavedAtValue(saveResult) || Date.now());
      if (action === "submit") {
        message.success(trans("questionTask.submitSuccess", "试卷已提交"));
        closeQuestionTask();
      } else {
        message.success(
          trans("questionTask.saveSuccess", "试卷已保存，可继续编辑或稍后提交"),
        );
      }
    } catch (error) {
      const currentMessage =
        (error && error.message) ||
        trans("questionTask.saveFailed", "保存失败");
      showSaveMessage(currentMessage);
    } finally {
      setSavingAction("");
    }
  }, []);

  const isSaving = !!savingAction;

  useEffect(
    (event) => {
      void event;
      if (splitMode !== QUESTION_TASK_SPLIT_MODE.SPLIT) {
        return;
      }

      lastExpandedRightPaneWidthReference.current = rightPaneWidth;
    },
    [rightPaneWidth, splitMode],
  );

  const handleSave = useCallback(
    async (event) => {
      void event;
      if (isSaving || loading) {
        return;
      }
      if (editingQuestionId) {
        message.info(
          trans(
            "questionTask.finishEditingBeforeSave",
            "请先完成当前题目编辑后再保存",
          ),
        );
        return;
      }

      const payload = buildSavePayload();

      if (!payload) {
        return;
      }

      await executePaperSave(payload, "save");
    },
    [buildSavePayload, editingQuestionId, executePaperSave, isSaving, loading],
  );

  const handleSubmit = useCallback(
    async (event) => {
      void event;
      if (isSaving || loading) {
        return;
      }

      if (editingQuestionId) {
        message.info(
          trans(
            "questionTask.finishEditingBeforeSave",
            "请先完成当前题目编辑后再保存",
          ),
        );
        return;
      }

      if (hasRunningAiTask) {
        message.info(
          trans(
            "questionTask.aiTaskRunningSubmitBlock",
            "存在进行中的 AI 任务，暂不能提交试卷。请先等待任务结束或取消任务。",
          ),
        );
        return;
      }

      const payload = buildSavePayload();

      if (!payload) {
        return;
      }

      if (paperReviewSummary.submitBlockingDetails.length > 0) {
        const blockingFieldLabels = getSubmitBlockingFieldLabels(
          paperReviewSummary.submitBlockingDetails,
        );
        const blockingMessage =
          blockingFieldLabels.length > 0
            ? trans(
                "questionTask.reviewBlockingMessage",
                "当前仍缺少{$fields}，无法提交。可结合下方题目概览查看具体题目。",
                {
                  fields: blockingFieldLabels.join(
                    trans("questionTask.reviewListSeparator", "、"),
                  ),
                },
              )
            : trans(
                "questionTask.reviewBlockingMessageFallback",
                "当前仍有基础录题信息未补齐，暂无法提交。可结合下方题目概览查看具体题目。",
              );

        Modal.warning({
          content: (
            <SaveReviewContent
              message={blockingMessage}
              summary={paperReviewSummary}
              title={trans("questionTask.reviewBlockingTitle", "暂不能提交")}
            />
          ),
          getContainer: getModalContainer,
          okText: trans("questionTask.reviewBlockingOk", "我知道了"),
          title: trans("questionTask.reviewBlockingTitle", "暂不能提交"),
          width: SUBMIT_BLOCKING_MODAL_WIDTH,
        });
        return;
      }

      // 提交前在同一份试卷概览上做最终确认，避免用户通过校验后误触直接关闭页面。
      Modal.confirm({
        cancelText: trans("global.cancel", "取消"),
        content: (
          <SaveReviewContent
            message={trans(
              "questionTask.submitConfirmMessage",
              "校验已通过，确认提交后将关闭当前页面。",
            )}
            summary={paperReviewSummary}
            title={trans("questionTask.submitConfirmTitle", "确认提交")}
          />
        ),
        getContainer: getModalContainer,
        okText: trans("questionTask.submitConfirmOk", "确认并关闭当前页"),
        title: trans("questionTask.submitConfirmTitle", "确认提交"),
        width: SUBMIT_CONFIRM_MODAL_WIDTH,
        onOk: async (modalArguments = []) => {
          void modalArguments;
          await executePaperSave(payload, "submit");
        },
      });
    },
    [
      buildSavePayload,
      editingQuestionId,
      executePaperSave,
      getModalContainer,
      hasRunningAiTask,
      isSaving,
      loading,
      paperReviewSummary,
    ],
  );

  return {
    handleClose,
    handleSave,
    handleSplitResizeStart,
    handleResetSplitLayout,
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
  };
};
