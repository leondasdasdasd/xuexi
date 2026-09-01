import { TreeSelect } from "antd";

import { trans } from "../../utils/i18n";
import {
  isChoiceQuestionType,
  normalizeIdList,
  normalizeIdValue,
  normalizeRichTextHtml,
  QUESTION_TYPE_ANSWER,
  QUESTION_TYPE_COMBINATION,
  QUESTION_TYPE_MULTIPLE_VOTE,
  QUESTION_TYPE_OPTIONS,
  QUESTION_TYPE_SINGLE_VOTE,
  toArray,
} from "./questionEntryModel";

export const { SHOW_PARENT } = TreeSelect;
export const PLEASE_CHOOSE_LABEL = trans("global.pleaseChoose", "请选择");
export const MIN_OPTION_COUNT = 2;
export const CHILD_TYPE_OPTIONS = QUESTION_TYPE_OPTIONS.filter(
  (item) =>
    ![
      QUESTION_TYPE_COMBINATION,
      QUESTION_TYPE_SINGLE_VOTE,
      QUESTION_TYPE_MULTIPLE_VOTE,
    ].includes(Number(item.value)),
);

export const getArrayItem = (items, index) =>
  (Array.isArray(items) ? items : []).slice(index, index + 1).shift();

const flattenTree = (list) =>
  toArray(list).flatMap((item) => [
    item,
    ...flattenTree(item && item.children),
  ]);

export const getTreeLabelsByValues = (treeData, values) => {
  const valueSet = normalizeIdList(values);

  return flattenTree(treeData)
    .filter((item) => {
      const id = normalizeIdValue(item && item.value);
      return id !== undefined && valueSet.includes(id);
    })
    .map((item) => item.title);
};

export const getPathLabel = (path) =>
  path.length > 0
    ? trans("questionEntry.subQuestionPathLabel", "子题 {$index}", {
        index: path.at(-1) + 1,
      })
    : trans("questionEntry.currentQuestionPathLabel", "当前题");

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
    ? trans("questionEntry.choiceAnswerTip", "点击左侧圆点或勾选框设置答案")
    : "";

const getBlankAnswerValue = (answer) =>
  answer && answer.content !== undefined ? String(answer.content).trim() : "";

export const getBlankAnswerValues = (answers) =>
  toArray(answers)
    .map((answer) => getBlankAnswerValue(answer))
    .filter((answer) => !!normalizeRichTextHtml(answer));
