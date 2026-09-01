import { createAntTreeSelectOptionsFromInputQuestionTree } from "../../utils/inputQuestionTreeSelectAdapter.js";
import { getQuestionTypeLocalizedName } from "../../utils/questionTypeEditorAdapter.js";

export const createQuestionAssetTypeOptions = (questionTypes = []) =>
  questionTypes.map((questionType) => ({
    label: getQuestionTypeLocalizedName(questionType),
    value: questionType.businessQuestionTypeId,
  }));

export const createQuestionAssetGradeOptions = (allGradeList) =>
  allGradeList.map((item) => ({
    label: item.name,
    value: item.gradeId,
  }));

export const createQuestionAssetSubjectOptions = (subjectList) =>
  subjectList.map((item) => ({
    label: item.name,
    value: item.id,
  }));

export const createQuestionAssetTreeOptions = (treeData) =>
  createAntTreeSelectOptionsFromInputQuestionTree(treeData);
