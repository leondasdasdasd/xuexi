import { useCallback } from "react";
import { message, Modal } from "antd";
import get from "lodash/get";
import { v4 as uuidv4 } from "uuid";

import { trans } from "../../../utils/i18n";
import { getQuestionLevelLabel } from "../../../utils/questionDifficulty.js";
import {
  getArrayItem,
  OPTION_INDEX_OFFSET,
} from "../domain/questionTaskShared";
import {
  buildSubQuestionSelectionId,
  getSelectedQuestionSelectionItems,
  mergeSelectedQuestionsIntoCombination,
  parseSubQuestionSelectionId,
  splitSelectedCombinationQuestion,
} from "../domain/questionTaskStructure";
import {
  applyLocalSave,
  buildQuestionSectionPatch,
  canSelectQuestion,
  getInheritedSectionPatch,
  getQuestionTypeLabel,
  getValidMetadataId,
  isOptionBasedQuestion,
  markQuestionDeleted,
  syncQuestionMetadataInPages,
  updateQuestionInPages,
} from "../domain/questionTaskViewModel";
import {
  applyQuestionOrderToPages,
  applyQuestionPatchItemsToTaskResult,
  buildClearQuestionQualityCheckPatch,
  buildQuestionOrderAfterInsert,
  createManualDraftId,
  findQuestionPage,
  insertQuestionIntoTaskResult,
  reorderQuestionIds,
} from "../models/questionTaskQuestionMutationModel";
import {
  buildTaskResultAfterLocalSave,
  getLocalSaveSuccessMessage,
} from "./questionTaskLocalSave";
import { useQuestionTaskSectionActions } from "./useQuestionTaskSectionActions";

const RESULT_SELECTION_SOURCE = "result";
const cloneArrayField = (source, field) =>
  Array.isArray(get(source, [field])) ? [...get(source, [field])] : [];

const getMoveTargetIndex = (index, direction) =>
  direction === "up"
    ? index - OPTION_INDEX_OFFSET
    : index + OPTION_INDEX_OFFSET;

const moveArrayItem = (items, fromIndex, toIndex) => {
  const nextItems = [...items];
  const [movedItem] = nextItems.splice(fromIndex, OPTION_INDEX_OFFSET);

  nextItems.splice(toIndex, 0, movedItem);
  return nextItems;
};

const remapMovedSubQuestionSelectionId = ({
  fromIndex,
  parentQuestionId,
  selectionId,
  toIndex,
}) => {
  const parsedSelection = parseSubQuestionSelectionId(selectionId);

  if (
    !parsedSelection ||
    parsedSelection.parentQuestionId !== parentQuestionId
  ) {
    return selectionId;
  }

  if (parsedSelection.subQuestionIndex === fromIndex) {
    return buildSubQuestionSelectionId(parentQuestionId, toIndex);
  }

  if (parsedSelection.subQuestionIndex === toIndex) {
    return buildSubQuestionSelectionId(parentQuestionId, fromIndex);
  }

  return selectionId;
};

const getInsertQuestionSuccessMessage = (mode, position) =>
  mode === "create"
    ? position === "before"
      ? trans("questionTask.insertBeforeSuccess", "已在当前题前新增一题")
      : trans("questionTask.insertAfterSuccess", "已在当前题后新增一题")
    : trans("questionTask.duplicateQuestionSuccess", "已复制上一题到当前位置");

export const useQuestionTaskQuestionActions = ({
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
}) => {
  const selectQuestion = useCallback(
    (questionId, source = RESULT_SELECTION_SOURCE) => {
      if (source === RESULT_SELECTION_SOURCE) {
        setFocusRequest((currentRequest) => ({
          questionId,
          source,
          token: ((currentRequest && currentRequest.token) || 0) + 1,
        }));
      }
      setSelectedQuestionId((currentQuestionId) =>
        currentQuestionId === questionId ? currentQuestionId : questionId,
      );
    },
    [setFocusRequest, setSelectedQuestionId],
  );

  const isQuestionRunningLocked = useCallback(
    (questionId) => runningQuestionIdSet.has(questionId),
    [runningQuestionIdSet],
  );

  const cannotModifyRunningQuestion = useCallback(
    (questionIds) => {
      const targetQuestionIds = Array.isArray(questionIds)
        ? questionIds
        : [questionIds];

      if (
        targetQuestionIds.some((questionId) =>
          isQuestionRunningLocked(questionId),
        )
      ) {
        message.info(
          trans(
            "questionTask.aiTaskRunningLock",
            "当前题目正在 AI 任务处理中，暂不支持编辑、删除、复制或拖拽。",
          ),
        );
        return true;
      }

      return false;
    },
    [isQuestionRunningLocked],
  );

  const handleQuestionSelect = useCallback(
    (questionId, source = RESULT_SELECTION_SOURCE) => {
      if (!canSelectQuestion(editingQuestionId, questionId)) {
        return;
      }
      selectQuestion(questionId, source);
    },
    [editingQuestionId, selectQuestion],
  );

  const handleQuestionDeselect = useCallback(() => {
    if (editingQuestionId) {
      return;
    }

    setSelectedQuestionId("");
  }, [editingQuestionId, setSelectedQuestionId]);

  const handleQuestionSelectionChange = useCallback(
    (questionId, checked) => {
      if (
        editingQuestionId ||
        !selectableQuestionIdSet.has(questionId) ||
        isQuestionRunningLocked(questionId)
      ) {
        return;
      }

      setSelectedQuestionIds((currentQuestionIds) => {
        if (checked) {
          return currentQuestionIds.includes(questionId)
            ? currentQuestionIds
            : [...currentQuestionIds, questionId];
        }

        return currentQuestionIds.filter(
          (currentQuestionId) => currentQuestionId !== questionId,
        );
      });
    },
    [
      editingQuestionId,
      isQuestionRunningLocked,
      selectableQuestionIdSet,
      setSelectedQuestionIds,
    ],
  );

  const handleQuestionSelectionClear = useCallback(
    (event) => {
      void event;
      setSelectedQuestionIds([]);
    },
    [setSelectedQuestionIds],
  );

  const handleQuestionEdit = useCallback(
    (questionId, options = {}) => {
      if (cannotModifyRunningQuestion([questionId])) {
        return;
      }

      selectQuestion(questionId, RESULT_SELECTION_SOURCE);
      setEditingTarget(
        options && Number.isInteger(options.subQuestionIndex)
          ? { subQuestionIndex: options.subQuestionIndex }
          : undefined,
      );
      setEditingQuestionId(questionId);
    },
    [
      cannotModifyRunningQuestion,
      selectQuestion,
      setEditingQuestionId,
      setEditingTarget,
    ],
  );

  const insertQuestionRelative = useCallback(
    (questionId, mode = "create", position = "after") => {
      if (!taskResult) {
        return;
      }
      if (cannotModifyRunningQuestion([questionId])) {
        return;
      }

      const targetPage = findQuestionPage(taskResult.pages, questionId);

      if (!targetPage) {
        return;
      }

      const insertedQuestionId = createManualDraftId(targetPage.pageKey);
      const currentQuestionOrder = visibleQuestions.map(
        (question) => question.draftId,
      );
      const nextQuestionOrder = buildQuestionOrderAfterInsert(
        currentQuestionOrder,
        questionId,
        insertedQuestionId,
        position,
      );

      setTaskResult((previousTaskResult) => {
        if (!previousTaskResult) {
          return previousTaskResult;
        }

        return insertQuestionIntoTaskResult({
          cloneArrayField,
          createUuid: uuidv4,
          getQuestionLevelLabel,
          getQuestionTypeLabel,
          insertedQuestionId,
          isOptionBasedQuestion,
          mode,
          nextQuestionOrder,
          position,
          previousTaskResult,
          questionId,
        });
      });

      selectQuestion(insertedQuestionId, RESULT_SELECTION_SOURCE);
      message.success(getInsertQuestionSuccessMessage(mode, position));
      setEditingTarget();
      setEditingQuestionId(insertedQuestionId);
    },
    [
      cannotModifyRunningQuestion,
      selectQuestion,
      setEditingQuestionId,
      setEditingTarget,
      setTaskResult,
      taskResult,
      visibleQuestions,
    ],
  );

  const insertQuestionAtBoundary = useCallback(
    (position) => {
      if (visibleQuestions.length === 0) {
        return;
      }

      const targetQuestion =
        position === "before" ? visibleQuestions[0] : visibleQuestions.at(-1);

      insertQuestionRelative(targetQuestion.draftId, "create", position);
    },
    [insertQuestionRelative, visibleQuestions],
  );

  const handleLocalSave = useCallback(
    (localSavePayload, options = {}) => {
      if (!editingQuestionId) {
        return;
      }
      if (cannotModifyRunningQuestion([editingQuestionId])) {
        return;
      }

      const nextEditingQuestionId =
        options && typeof options.nextEditingQuestionId === "string"
          ? options.nextEditingQuestionId
          : "";
      const nextEditingDirection =
        options && options.nextEditingDirection === "previous"
          ? "previous"
          : "next";

      setTaskResult((previousTaskResult) =>
        buildTaskResultAfterLocalSave({
          applyLocalSave,
          editingQuestionId,
          getValidMetadataId,
          localSavePayload,
          previousTaskResult,
          syncQuestionMetadataInPages,
          updateQuestionInPages,
        }),
      );
      setEditingQuestionId(nextEditingQuestionId);
      setEditingTarget();
      if (nextEditingQuestionId) {
        selectQuestion(nextEditingQuestionId, RESULT_SELECTION_SOURCE);
      }
      message.success(
        getLocalSaveSuccessMessage(nextEditingQuestionId, nextEditingDirection),
      );
    },
    [
      cannotModifyRunningQuestion,
      editingQuestionId,
      selectQuestion,
      setEditingQuestionId,
      setEditingTarget,
      setTaskResult,
    ],
  );

  const applyQuestionPatches = useCallback(
    (patches) => {
      setTaskResult((previousTaskResult) =>
        applyQuestionPatchItemsToTaskResult(previousTaskResult, patches),
      );
    },
    [setTaskResult],
  );

  const {
    insertSectionAfter,
    insertSectionAtStart,
    updateSectionFromQuestion,
  } = useQuestionTaskSectionActions({
    applyQuestionPatches,
    cannotModifyRunningQuestion,
    getModalContainer,
    selectQuestion,
    visibleQuestions,
  });

  const handleQuestionReorder = useCallback(
    (draggingQuestionId, targetQuestionId, position = "after") => {
      if (!taskResult) {
        return;
      }
      if (cannotModifyRunningQuestion([draggingQuestionId, targetQuestionId])) {
        return;
      }

      const currentQuestionOrder = visibleQuestions.map(
        (question) => question.draftId,
      );
      const nextQuestionOrder = reorderQuestionIds(
        currentQuestionOrder,
        draggingQuestionId,
        targetQuestionId,
        position,
      );
      const visibleQuestionMap = new Map(
        visibleQuestions.map((question) => [question.draftId, question]),
      );
      const nextVisibleQuestions = nextQuestionOrder
        .map((questionId) => visibleQuestionMap.get(questionId))
        .filter(Boolean);
      const inheritedSectionPatch = getInheritedSectionPatch(
        nextVisibleQuestions,
        draggingQuestionId,
      );

      if (
        nextQuestionOrder.length !== currentQuestionOrder.length ||
        nextQuestionOrder.every(
          (questionId, index) =>
            questionId === getArrayItem(currentQuestionOrder, index),
        )
      ) {
        return;
      }

      setTaskResult((previousTaskResult) =>
        previousTaskResult
          ? {
              ...previousTaskResult,
              pages: updateQuestionInPages(
                applyQuestionOrderToPages(
                  previousTaskResult.pages,
                  nextQuestionOrder,
                ),
                draggingQuestionId,
                (question) => ({
                  ...question,
                  ...inheritedSectionPatch,
                }),
              ),
            }
          : previousTaskResult,
      );
      selectQuestion(draggingQuestionId, RESULT_SELECTION_SOURCE);
      message.success(trans("questionTask.reorderSuccess", "已调整题目顺序"));
    },
    [
      cannotModifyRunningQuestion,
      selectQuestion,
      setTaskResult,
      taskResult,
      visibleQuestions,
    ],
  );

  const handleSubQuestionMove = useCallback(
    (parentQuestionId, subQuestionIndex, direction) => {
      if (!taskResult) {
        return;
      }
      if (cannotModifyRunningQuestion([parentQuestionId])) {
        return;
      }

      const parentQuestion = visibleQuestions.find(
        (question) => question && question.draftId === parentQuestionId,
      );
      const subQuestions = Array.isArray(parentQuestion?.sonQuestionList)
        ? parentQuestion.sonQuestionList
        : [];
      const targetIndex = getMoveTargetIndex(subQuestionIndex, direction);

      if (
        !Number.isInteger(subQuestionIndex) ||
        targetIndex < 0 ||
        targetIndex >= subQuestions.length
      ) {
        return;
      }

      setTaskResult((previousTaskResult) =>
        previousTaskResult
          ? {
              ...previousTaskResult,
              pages: updateQuestionInPages(
                previousTaskResult.pages,
                parentQuestionId,
                (question) => ({
                  ...question,
                  // 子题移动仅交换当前组合题内部顺序，避免影响顶层题和分段归属。
                  sonQuestionList: moveArrayItem(
                    Array.isArray(question.sonQuestionList)
                      ? question.sonQuestionList
                      : [],
                    subQuestionIndex,
                    targetIndex,
                  ),
                }),
              ),
            }
          : previousTaskResult,
      );
      setSelectedQuestionIds((currentQuestionIds) =>
        currentQuestionIds.map((selectionId) =>
          remapMovedSubQuestionSelectionId({
            fromIndex: subQuestionIndex,
            parentQuestionId,
            selectionId,
            toIndex: targetIndex,
          }),
        ),
      );
      selectQuestion(parentQuestionId, RESULT_SELECTION_SOURCE);
      message.success(
        trans("questionTask.subQuestionReorderSuccess", "已调整小题顺序"),
      );
    },
    [
      cannotModifyRunningQuestion,
      selectQuestion,
      setSelectedQuestionIds,
      setTaskResult,
      taskResult,
      visibleQuestions,
    ],
  );

  const handleSelectedQuestionMerge = useCallback(() => {
    if (!taskResult) {
      return;
    }
    if (cannotModifyRunningQuestion(selectedQuestionIds)) {
      return;
    }

    const mergeResult = mergeSelectedQuestionsIntoCombination({
      createDraftId: createManualDraftId,
      createUuid: uuidv4,
      getQuestionTypeLabel,
      pages: taskResult.pages,
      selectedQuestionIds,
      visibleQuestions,
    });

    if (!mergeResult.ok) {
      message.info(trans(mergeResult.errorKey, mergeResult.defaultMessage));
      return;
    }

    const mergedSectionPatch =
      mergeResult.mode === "create"
        ? buildQuestionSectionPatch(
            visibleQuestions.find((question) =>
              selectedQuestionIds.includes(question.draftId),
            ),
          )
        : false;

    setTaskResult({
      ...taskResult,
      pages: mergedSectionPatch
        ? updateQuestionInPages(
            mergeResult.pages,
            mergeResult.focusQuestionId,
            (question) => ({
              ...question,
              ...mergedSectionPatch,
            }),
          )
        : mergeResult.pages,
    });
    setSelectedQuestionIds([]);
    selectQuestion(mergeResult.focusQuestionId, RESULT_SELECTION_SOURCE);

    if (mergeResult.mode === "create") {
      setEditingTarget();
      setEditingQuestionId(mergeResult.focusQuestionId);
      message.success(
        trans(
          "questionTask.mergeCreateSuccess",
          "Questions merged into a group. Add the shared stem before submitting.",
        ),
      );
      return;
    }

    message.success(
      trans("questionTask.mergeAppendSuccess", "Questions added to the group."),
    );
  }, [
    cannotModifyRunningQuestion,
    selectQuestion,
    selectedQuestionIds,
    setEditingQuestionId,
    setEditingTarget,
    setSelectedQuestionIds,
    setTaskResult,
    taskResult,
    visibleQuestions,
  ]);

  const handleSelectedQuestionSplit = useCallback(() => {
    if (!taskResult) {
      return;
    }
    if (cannotModifyRunningQuestion(selectedQuestionIds)) {
      return;
    }

    const splitResult = splitSelectedCombinationQuestion({
      createDraftId: createManualDraftId,
      createUuid: uuidv4,
      getQuestionTypeLabel,
      pages: taskResult.pages,
      selectedQuestionIds,
      visibleQuestions,
    });

    if (!splitResult.ok) {
      message.info(trans(splitResult.errorKey, splitResult.defaultMessage));
      return;
    }

    const splitSourceQuestion =
      getSelectedQuestionSelectionItems({
        pages: taskResult.pages,
        selectedQuestionIds,
        visibleQuestions,
      }).find((item) => item.parentQuestion)?.parentQuestion ||
      visibleQuestions.find((question) =>
        selectedQuestionIds.includes(question.draftId),
      );
    const splitSectionPatch = buildQuestionSectionPatch(splitSourceQuestion);
    const previousQuestionIdSet = new Set(
      visibleQuestions.map((question) => question.draftId),
    );
    const splitInsertedQuestionIdSet = new Set(
      splitResult.pages.flatMap((page) =>
        (Array.isArray(page.questions) ? page.questions : [])
          .map((question) => question && question.draftId)
          .filter(
            (questionId) =>
              questionId && !previousQuestionIdSet.has(questionId),
          ),
      ),
    );

    setTaskResult({
      ...taskResult,
      pages: splitResult.pages.map((page) => ({
        ...page,
        questions: (Array.isArray(page.questions) ? page.questions : []).map(
          (question) =>
            splitInsertedQuestionIdSet.has(question && question.draftId)
              ? {
                  ...question,
                  ...splitSectionPatch,
                }
              : question,
        ),
      })),
    });
    setSelectedQuestionIds([]);
    selectQuestion(splitResult.focusQuestionId, RESULT_SELECTION_SOURCE);
    message.success(
      trans("questionTask.splitCombinationSuccess", "Group question split."),
    );
  }, [
    cannotModifyRunningQuestion,
    selectQuestion,
    selectedQuestionIds,
    setSelectedQuestionIds,
    setTaskResult,
    taskResult,
    visibleQuestions,
  ]);

  const handleReferenceSheetApply = useCallback(
    (patches) => {
      if (!Array.isArray(patches) || patches.length === 0) {
        message.info(
          trans(
            "questionTask.referenceApplyEmpty",
            "未检测到参考答案或解析修改",
          ),
        );
        return;
      }

      applyQuestionPatches(
        patches.map((item) => ({
          ...item,
          patch: {
            ...item.patch,
            ...buildClearQuestionQualityCheckPatch(),
          },
        })),
      );
      message.success(
        trans(
          "questionTask.referenceApplySaved",
          "已保存 {$count} 道题答案，仍需保存试卷或提交试卷",
          { count: patches.length },
        ),
      );
    },
    [applyQuestionPatches],
  );

  const handleQuestionDelete = useCallback(
    (questionId) => {
      if (cannotModifyRunningQuestion([questionId])) {
        return;
      }

      Modal.confirm({
        cancelText: trans("global.cancel", "取消"),
        content: trans(
          "questionTask.deleteContent",
          "删除后仅在当前页面生效，刷新页面会恢复原始 OCR 结果。",
        ),
        getContainer: getModalContainer,
        okText: trans("global.delete", "删除"),
        okType: "danger",
        title: trans("questionTask.deleteTitle", "确认删除这道题目？"),
        onOk: (modalArguments = []) => {
          void modalArguments;
          const currentQuestionIndex = visibleQuestions.findIndex(
            (question) => question.draftId === questionId,
          );
          const nextSelectedQuestion =
            getArrayItem(visibleQuestions, currentQuestionIndex + 1) ||
            getArrayItem(visibleQuestions, currentQuestionIndex - 1) ||
            undefined;

          setTaskResult((previousTaskResult) =>
            previousTaskResult
              ? {
                  ...previousTaskResult,
                  pages: markQuestionDeleted(
                    previousTaskResult.pages,
                    questionId,
                  ),
                }
              : previousTaskResult,
          );
          if (editingQuestionId === questionId) {
            setEditingQuestionId("");
          }
          if (selectedQuestionId === questionId) {
            if (nextSelectedQuestion) {
              setSelectedQuestionId(nextSelectedQuestion.draftId);
            } else {
              setSelectedQuestionId("");
            }
          }
        },
      });
    },
    [
      cannotModifyRunningQuestion,
      editingQuestionId,
      getModalContainer,
      selectedQuestionId,
      setEditingQuestionId,
      setSelectedQuestionId,
      setTaskResult,
      visibleQuestions,
    ],
  );

  return {
    applyQuestionPatches,
    cannotModifyRunningQuestion,
    handleLocalSave,
    handleQuestionDelete,
    handleQuestionEdit,
    handleQuestionReorder,
    handleSubQuestionMove,
    handleQuestionDeselect,
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
    isQuestionRunningLocked,
    selectQuestion,
    updateSectionFromQuestion,
  };
};
