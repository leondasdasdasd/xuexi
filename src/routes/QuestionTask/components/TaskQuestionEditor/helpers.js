import { trans } from "../../../../utils/i18n";
import {
  QUESTION_TYPE_ANSWER,
  QUESTION_TYPE_COMBINATION,
  isChoiceQuestionType,
  normalizeIdList,
  normalizeIdValue,
  toArray,
} from "./questionEditorModel";

export const getArrayItem = (items, index) =>
  (Array.isArray(items) ? items : []).slice(index, index + 1).shift();

export const getTreeLabelsByValues = (treeData, values) => {
  const valueSet = normalizeIdList(values);
  const flattenTree = (list) =>
    toArray(list).flatMap((item) => [
      item,
      ...flattenTree(item && item.children),
    ]);

  return flattenTree(treeData)
    .filter((item) => {
      const id = normalizeIdValue(item && item.value);
      return id !== undefined && valueSet.includes(id);
    })
    .map((item) => item.title);
};

export const getPathLabel = (path) =>
  path.length > 0
    ? trans("questionTask.subQuestionPathLabel", "Subquestion {$index}", {
        index: path.at(-1) + 1,
      })
    : trans("questionTask.currentQuestionLabel", "Current Question");

export const getQuestionStemLabel = (type) =>
  Number(type) === QUESTION_TYPE_COMBINATION
    ? trans("singleInput.adminquestionTips1", "主题干描述")
    : trans("singleInput.questionTips1", "题干描述");

export const getAnswerFieldTitle = (type) => {
  if (isChoiceQuestionType(type)) {
    return trans("singleInput.questionTips3", "选项描述");
  }

  if (Number(type) === QUESTION_TYPE_ANSWER) {
    return trans("global.answer", "答案");
  }

  return trans("global.answer", "选项描述");
};

export const getAnswerFieldExtra = (type) =>
  isChoiceQuestionType(type)
    ? trans(
        "questionTask.clickToSetChoiceAnswer",
        "点击左侧圆点或勾选框设置答案",
      )
    : "";

export const getBlankAnswerValue = (answer) =>
  answer && answer.content !== undefined ? String(answer.content).trim() : "";

export const getBlankAnswerValues = (answers) =>
  toArray(answers)
    .map((answer) => getBlankAnswerValue(answer))
    .filter(Boolean);

export const getSectionNumberValue = (question) =>
  question.sectionNumber === undefined || question.sectionNumber === null
    ? undefined
    : Number(question.sectionNumber);

export const updateQuestionAtPath = (question, path, updater) => {
  if (path.length === 0) {
    return updater(question);
  }

  const [childIndex, ...restPath] = path;
  return {
    ...question,
    sonQuestionList: toArray(question.sonQuestionList).map(
      (childQuestion, index) =>
        index === childIndex
          ? updateQuestionAtPath(childQuestion, restPath, updater)
          : childQuestion,
    ),
  };
};
