import {
  getIndexedOptionKey,
  OPTION_KEYS,
} from "../../../utils/questionOptionDisplay";

export const DEFAULT_OPTION_COUNT = 4;
export const DEFAULT_MANUAL_OPTION_KEYS = OPTION_KEYS.slice(
  0,
  DEFAULT_OPTION_COUNT,
);
export const OPTION_INDEX_OFFSET = 1;

export const QUESTION_TYPE_FREE_COMBINATION = 0;
export const QUESTION_TYPE_CHOICE = 1;
export const QUESTION_TYPE_MULTIPLE_CHOICE = 2;
export const QUESTION_TYPE_BLANK = 3;
export const QUESTION_TYPE_JUDGE = 4;
export const QUESTION_TYPE_ANSWER = 5;
export const QUESTION_TYPE_COMBINATION = 6;
export const QUESTION_TYPE_SINGLE_VOTE = 7;
export const QUESTION_TYPE_MULTIPLE_VOTE = 8;

export const DEFAULT_QUESTION_TYPE = QUESTION_TYPE_ANSWER;

export const OPTION_BASED_QUESTION_TYPES = [
  QUESTION_TYPE_CHOICE,
  QUESTION_TYPE_MULTIPLE_CHOICE,
  QUESTION_TYPE_SINGLE_VOTE,
  QUESTION_TYPE_MULTIPLE_VOTE,
];
export const REQUIRED_CHOICE_ANSWER_TYPES = [
  QUESTION_TYPE_CHOICE,
  QUESTION_TYPE_MULTIPLE_CHOICE,
];
export const AI_TASK_STATUS_RUNNING = new Set(["PENDING", "PROCESSING"]);

const CHOICE_QUESTION_TYPE_SET = new Set(OPTION_BASED_QUESTION_TYPES);
const REQUIRED_CHOICE_ANSWER_TYPE_SET = new Set(REQUIRED_CHOICE_ANSWER_TYPES);

export const getArrayItem = (items, index) =>
  (Array.isArray(items) ? items : []).slice(index, index + 1).shift();

export const toArray = (value) =>
  Array.isArray(value) ? value.filter(Boolean) : value ? [value] : [];

export const getOneBasedIndex = (index) =>
  Number(index || 0) + OPTION_INDEX_OFFSET;

export const getOptionKey = (index) => getIndexedOptionKey(index);

export const isQuestionType = (value, expectedType) =>
  Number(value) === expectedType;

export const isChoiceQuestionType = (type) =>
  CHOICE_QUESTION_TYPE_SET.has(Number(type));

export const isRequiredChoiceAnswerType = (type) =>
  REQUIRED_CHOICE_ANSWER_TYPE_SET.has(Number(type));

export const isCombinationQuestionType = (type) =>
  isQuestionType(type, QUESTION_TYPE_COMBINATION);

export const isBlankQuestionType = (type) =>
  isQuestionType(type, QUESTION_TYPE_BLANK);

export const isJudgeQuestionType = (type) =>
  isQuestionType(type, QUESTION_TYPE_JUDGE);

export const isOptionBasedQuestionType = (type) => isChoiceQuestionType(type);

export const isAiTaskRunningStatus = (status) =>
  AI_TASK_STATUS_RUNNING.has(status);

// 题号展示是页面内的统一领域规则：优先显式编号，其次 display sort，最后按当前位置回退。
export const getQuestionDisplayNumber = (
  question,
  index = 0,
  { fallbackToIndex = true } = {},
) => {
  if (question && question.displayQuestionNumber) {
    return question.displayQuestionNumber;
  }

  if (question && question.displayQuestionSort !== undefined) {
    return getOneBasedIndex(question.displayQuestionSort);
  }

  return fallbackToIndex ? getOneBasedIndex(index) : "";
};

export { QUESTION_LEVEL_NORMAL as DEFAULT_QUESTION_LEVEL } from "../../../utils/questionDifficulty.js";
export { OPTION_KEYS } from "../../../utils/questionOptionDisplay";
