import { trans } from "./i18n.js";

export const QUESTION_LEVEL_EASY = 1;
export const QUESTION_LEVEL_NORMAL = 2;
export const QUESTION_LEVEL_DIFFICULT = 3;

export const QUESTION_LEVEL_OPTIONS = [
  { value: QUESTION_LEVEL_EASY, label: trans("global.easy", "简单") },
  { value: QUESTION_LEVEL_NORMAL, label: trans("global.general", "普通") },
  { value: QUESTION_LEVEL_DIFFICULT, label: trans("global.difficult", "困难") },
];

export const getQuestionLevelLabel = (level) => {
  const option = QUESTION_LEVEL_OPTIONS.find(
    (item) => item.value === Number(level),
  );

  return option ? option.label : trans("global.general", "普通");
};
