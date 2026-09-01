import { useCallback } from "react";
import { message } from "antd";

import { trans } from "../../../utils/i18n";
import { openQuestionSectionInsertConfirm } from "../components/QuestionSectionInsertConfirm";
import { getArrayItem } from "../domain/questionTaskShared";
import {
  buildQuestionSectionInsertPatches,
  buildQuestionSectionInsertPatchesAtStart,
  buildQuestionSectionUpdatePatches,
} from "../domain/questionTaskViewModel";

const RESULT_SELECTION_SOURCE = "result";

export const useQuestionTaskSectionActions = ({
  applyQuestionPatches,
  cannotModifyRunningQuestion,
  getModalContainer,
  selectQuestion,
  visibleQuestions,
}) => {
  const insertSectionAfter = useCallback(
    (questionId) => {
      const targetPatches = buildQuestionSectionInsertPatches(
        visibleQuestions,
        questionId,
      );

      if (targetPatches.length === 0) {
        return;
      }

      const patchedQuestionIds = targetPatches.map((item) => item.draftId);

      if (cannotModifyRunningQuestion([questionId, ...patchedQuestionIds])) {
        return;
      }

      const defaultPatch = getArrayItem(targetPatches, 0)?.patch || {};
      openQuestionSectionInsertConfirm({
        defaultSectionNumber: defaultPatch.sectionNumber,
        getModalContainer,
        onConfirm: ({ sectionNumber, sectionTitle }) => {
          const patches = buildQuestionSectionInsertPatches(
            visibleQuestions,
            questionId,
            {
              sectionNumber,
              sectionTitle,
            },
          );

          applyQuestionPatches(patches);
          selectQuestion(
            getArrayItem(patchedQuestionIds, 0),
            RESULT_SELECTION_SOURCE,
          );
          message.success(
            trans("questionTask.insertSectionSuccess", "已插入新分段"),
          );
        },
      });
    },
    [
      applyQuestionPatches,
      cannotModifyRunningQuestion,
      getModalContainer,
      selectQuestion,
      visibleQuestions,
    ],
  );

  const insertSectionAtStart = useCallback(() => {
    const targetPatches =
      buildQuestionSectionInsertPatchesAtStart(visibleQuestions);

    if (targetPatches.length === 0) {
      return;
    }

    const patchedQuestionIds = targetPatches.map((item) => item.draftId);

    if (cannotModifyRunningQuestion(patchedQuestionIds)) {
      return;
    }

    const defaultPatch = getArrayItem(targetPatches, 0)?.patch || {};
    openQuestionSectionInsertConfirm({
      defaultSectionNumber: defaultPatch.sectionNumber,
      getModalContainer,
      onConfirm: ({ sectionNumber, sectionTitle }) => {
        const patches = buildQuestionSectionInsertPatchesAtStart(
          visibleQuestions,
          {
            sectionNumber,
            sectionTitle,
          },
        );

        applyQuestionPatches(patches);
        selectQuestion(
          getArrayItem(patchedQuestionIds, 0),
          RESULT_SELECTION_SOURCE,
        );
        message.success(
          trans("questionTask.insertSectionSuccess", "已插入新分段"),
        );
      },
    });
  }, [
    applyQuestionPatches,
    cannotModifyRunningQuestion,
    getModalContainer,
    selectQuestion,
    visibleQuestions,
  ]);

  const updateSectionFromQuestion = useCallback(
    (questionId) => {
      const targetQuestion = visibleQuestions.find(
        (question) => question && question.draftId === questionId,
      );

      if (!targetQuestion) {
        return;
      }

      const targetPatches = buildQuestionSectionUpdatePatches(
        visibleQuestions,
        questionId,
        {
          sectionNumber: targetQuestion.sectionNumber || 1,
          sectionTitle: targetQuestion.sectionTitle || "",
        },
      );
      const patchedQuestionIds = targetPatches.map((item) => item.draftId);

      if (
        targetPatches.length === 0 ||
        cannotModifyRunningQuestion(patchedQuestionIds)
      ) {
        return;
      }

      openQuestionSectionInsertConfirm({
        defaultSectionNumber: targetQuestion.sectionNumber || 1,
        defaultSectionTitle: targetQuestion.sectionTitle || "",
        getModalContainer,
        title: trans("questionTask.editSectionModalTitle", "编辑分段"),
        onConfirm: ({ sectionNumber, sectionTitle }) => {
          const patches = buildQuestionSectionUpdatePatches(
            visibleQuestions,
            questionId,
            {
              sectionNumber,
              sectionTitle,
            },
          );

          applyQuestionPatches(patches);
          selectQuestion(questionId, RESULT_SELECTION_SOURCE);
          message.success(
            trans("questionTask.updateSectionSuccess", "已更新分段"),
          );
        },
      });
    },
    [
      applyQuestionPatches,
      cannotModifyRunningQuestion,
      getModalContainer,
      selectQuestion,
      visibleQuestions,
    ],
  );

  return {
    insertSectionAfter,
    insertSectionAtStart,
    updateSectionFromQuestion,
  };
};
