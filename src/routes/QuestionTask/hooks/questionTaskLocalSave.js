import { trans } from "../../../utils/i18n";
import { clearQuestionQualityCheck } from "../models/questionTaskQuestionMutationModel";

export const buildTaskResultAfterLocalSave = ({
  applyLocalSave,
  editingQuestionId,
  getValidMetadataId,
  localSavePayload,
  previousTaskResult,
  syncQuestionMetadataInPages,
  updateQuestionInPages,
}) => {
  if (!previousTaskResult) {
    return previousTaskResult;
  }

  const savedQuestionHolder = {};
  const pagesWithSavedQuestion = updateQuestionInPages(
    previousTaskResult.pages,
    editingQuestionId,
    (question) => {
      savedQuestionHolder.current = clearQuestionQualityCheck(
        applyLocalSave(question, localSavePayload),
      );
      return savedQuestionHolder.current;
    },
  );
  const nextGradeId = getValidMetadataId(
    savedQuestionHolder.current && savedQuestionHolder.current.gradeId,
  );
  const nextSubjectId = getValidMetadataId(
    savedQuestionHolder.current && savedQuestionHolder.current.subjectId,
  );
  const shouldReplaceMetadata =
    nextGradeId !== undefined && nextSubjectId !== undefined;
  const nextPages = shouldReplaceMetadata
    ? syncQuestionMetadataInPages(
        pagesWithSavedQuestion,
        nextGradeId,
        nextSubjectId,
      )
    : pagesWithSavedQuestion;

  return {
    ...previousTaskResult,
    gradeId: shouldReplaceMetadata ? nextGradeId : previousTaskResult.gradeId,
    pages: nextPages,
    subjectId: shouldReplaceMetadata
      ? nextSubjectId
      : previousTaskResult.subjectId,
  };
};

export const getLocalSaveSuccessMessage = (
  nextEditingQuestionId,
  nextEditingDirection,
) => {
  if (!nextEditingQuestionId) {
    return trans(
      "questionTask.currentQuestionSaved",
      "已保存当前题，仍需保存试卷或提交试卷",
    );
  }

  return nextEditingDirection === "previous"
    ? trans(
        "questionTask.currentQuestionSavedAndPrevious",
        "已保存当前题，继续编辑上一题",
      )
    : trans(
        "questionTask.currentQuestionSavedAndNext",
        "已保存当前题，继续编辑下一题",
      );
};
