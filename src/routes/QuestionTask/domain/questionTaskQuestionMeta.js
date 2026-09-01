import { trans } from "../../../utils/i18n";
import {
  getGapFillingAnswerGroups,
  hasGapFillingAnswerContent,
} from "./questionTaskGapFillingAnswer";
import {
  QUESTION_TYPE_BLANK as FILL_BLANK_QUESTION_TYPE,
  QUESTION_TYPE_COMBINATION as COMBINATION_QUESTION_TYPE,
  QUESTION_TYPE_JUDGE as JUDGE_QUESTION_TYPE,
  getArrayItem,
  getQuestionDisplayNumber as getSharedQuestionDisplayNumber,
  getOneBasedIndex,
} from "./questionTaskShared";

const SCORE_FIELD_KEYS = [
  "questionScore",
  "fullScore",
  "score",
  "points",
  "point",
  "questionSettingScore",
];
const EMPTY_SCORE_TEXTS = new Set(["", "null", "undefined"]);
const RICH_MEDIA_CONTENT_PATTERN = /<img\b/i;
const NEXT_QUESTION_OFFSET = 2;
const FIRST_SECTION_NUMBER = 1;
const SECTION_NUMBER_INCREMENT = 1;
const DECIMAL_BASE = 10;
const MAX_TWO_DIGIT_INTEGER = 100;
const SECTION_CHINESE_DIGITS = [
  "零",
  "一",
  "二",
  "三",
  "四",
  "五",
  "六",
  "七",
  "八",
  "九",
];
const SECTION_TEN_TEXT = "十";

const normalizeQuestionScoreText = (value) => {
  if (value === undefined || value === null) {
    return "";
  }

  const scoreText = String(value).trim();

  return EMPTY_SCORE_TEXTS.has(scoreText) ? "" : scoreText;
};

export const stripQuestionText = (value) =>
  String(value || "")
    .replaceAll(/<[^>]*>/g, "")
    .trim();

const hasQuestionRichMediaContent = (value) =>
  RICH_MEDIA_CONTENT_PATTERN.test(String(value || ""));

export const hasQuestionRichTextContent = (value) =>
  // 富文本里的公式会保存成图片标签，校验时需要把图片视为有效内容。
  !!stripQuestionText(value) || hasQuestionRichMediaContent(value);

export const getQuestionDisplayNumber = (question, index = 0) =>
  getSharedQuestionDisplayNumber(question, index);

export const getQuestionScoreText = (question) =>
  question ? normalizeQuestionScoreText(question.questionScore) : "";

export const parseQuestionScoreState = (question) => {
  const text = getQuestionScoreText(question);

  if (!text) {
    return {
      invalid: false,
      missing: true,
      text,
      value: 0,
    };
  }

  const numericValue = Number(text);

  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return {
      invalid: true,
      missing: false,
      text,
      value: 0,
    };
  }

  return {
    invalid: false,
    missing: false,
    text,
    value: numericValue,
  };
};

const normalizeSectionTitle = (value) => String(value || "").trim();

const normalizeSectionNumber = (value) => {
  const sectionNumber = Number(value);

  return Number.isFinite(sectionNumber) ? sectionNumber : undefined;
};

const formatChineseSectionNumber = (value) => {
  const sectionNumber = Number(value);

  if (!Number.isInteger(sectionNumber) || sectionNumber <= 0) {
    return "";
  }

  if (sectionNumber < SECTION_CHINESE_DIGITS.length) {
    return getArrayItem(SECTION_CHINESE_DIGITS, sectionNumber) || "";
  }

  if (sectionNumber < MAX_TWO_DIGIT_INTEGER) {
    const tenCount = Math.floor(sectionNumber / DECIMAL_BASE);
    const unitCount = sectionNumber % DECIMAL_BASE;
    const tenPrefix =
      tenCount === 1
        ? SECTION_TEN_TEXT
        : `${getArrayItem(SECTION_CHINESE_DIGITS, tenCount)}${SECTION_TEN_TEXT}`;

    return unitCount === 0
      ? tenPrefix
      : `${tenPrefix}${getArrayItem(SECTION_CHINESE_DIGITS, unitCount)}`;
  }

  return String(sectionNumber);
};

const buildQuestionSectionState = (question) => ({
  sectionNumber: normalizeSectionNumber(question && question.sectionNumber),
  sectionTitle: normalizeSectionTitle(question && question.sectionTitle),
});

const getQuestionSectionDisplayTitle = (question, sectionTitle) =>
  sectionTitle || normalizeSectionTitle(question && question.typeLabel);

export const getQuestionSectionIdentityKey = (question) => {
  const { sectionNumber, sectionTitle } = buildQuestionSectionState(question);

  if (sectionNumber === undefined && !sectionTitle) {
    return `type::${normalizeSectionTitle(question && question.typeLabel)}`;
  }

  return `${sectionNumber === undefined ? "" : sectionNumber}::${sectionTitle}`;
};

export const getQuestionSectionDisplayLabel = (
  question,
  fallbackSectionNumber,
) => {
  const { sectionNumber, sectionTitle } = buildQuestionSectionState(question);
  const displayTitle = getQuestionSectionDisplayTitle(question, sectionTitle);

  if (!displayTitle) {
    return trans("questionTask.ungroupedSection", "未分组");
  }

  const sectionNumberText = formatChineseSectionNumber(
    sectionNumber === undefined ? fallbackSectionNumber : sectionNumber,
  );

  return sectionNumberText
    ? `${sectionNumberText}、${displayTitle}`
    : displayTitle;
};

export const buildQuestionSectionPatch = (question) => ({
  ...buildQuestionSectionState(question),
});

const getInsertedSectionTitle = (question) =>
  normalizeSectionTitle(question && question.typeLabel) ||
  normalizeSectionTitle(question && question.sectionTitle) ||
  trans("questionTask.ungroupedSection", "未分组");

const getInsertedSectionNumber = (questions, anchorIndex) => {
  const previousSectionNumbers = (Array.isArray(questions) ? questions : [])
    .slice(0, anchorIndex + 1)
    .map((question) => buildQuestionSectionState(question).sectionNumber)
    .filter((sectionNumber) => Number.isFinite(sectionNumber));

  return previousSectionNumbers.length === 0
    ? FIRST_SECTION_NUMBER
    : Math.max(...previousSectionNumbers) + SECTION_NUMBER_INCREMENT;
};

const buildQuestionSectionInsertPatchesFromIndex = ({
  anchorIndex,
  questions,
  sectionPatchOptions = {},
  startIndex,
}) => {
  const orderedQuestions = Array.isArray(questions) ? questions : [];
  const sectionPatch = sectionPatchOptions || {};
  const targetQuestion = getArrayItem(orderedQuestions, startIndex);

  if (!targetQuestion) {
    return [];
  }

  const targetQuestionSectionKey =
    getQuestionSectionIdentityKey(targetQuestion);
  const patch = {
    sectionNumber:
      sectionPatch.sectionNumber === undefined
        ? getInsertedSectionNumber(orderedQuestions, anchorIndex)
        : Number(sectionPatch.sectionNumber),
    sectionTitle:
      sectionPatch.sectionTitle === undefined
        ? getInsertedSectionTitle(targetQuestion)
        : normalizeSectionTitle(sectionPatch.sectionTitle),
  };
  const followingQuestions = orderedQuestions.slice(startIndex);
  const firstDifferentSectionIndex = followingQuestions.findIndex(
    (question) =>
      !question ||
      getQuestionSectionIdentityKey(question) !== targetQuestionSectionKey,
  );
  const sectionQuestions =
    firstDifferentSectionIndex === -1
      ? followingQuestions
      : followingQuestions.slice(0, firstDifferentSectionIndex);

  // 插入分段时，连续沿用同一旧分段的题目应一起进入新分段，避免只切开第一题导致后续题目仍留在旧段。
  return sectionQuestions.map((question) => ({
    draftId: question.draftId,
    patch,
  }));
};

export const buildQuestionSectionInsertPatches = (
  questions,
  anchorQuestionId,
  sectionPatchOptions = {},
) => {
  const orderedQuestions = Array.isArray(questions) ? questions : [];
  const anchorQuestionIndex = orderedQuestions.findIndex(
    (question) => question && question.draftId === anchorQuestionId,
  );

  if (anchorQuestionIndex === -1) {
    return [];
  }

  return buildQuestionSectionInsertPatchesFromIndex({
    anchorIndex: anchorQuestionIndex,
    questions: orderedQuestions,
    sectionPatchOptions,
    startIndex: anchorQuestionIndex + 1,
  });
};

export const buildQuestionSectionInsertPatchesAtStart = (
  questions,
  sectionPatchOptions = {},
) =>
  buildQuestionSectionInsertPatchesFromIndex({
    anchorIndex: -1,
    questions,
    sectionPatchOptions,
    startIndex: 0,
  });

export const buildQuestionSectionUpdatePatches = (
  questions,
  anchorQuestionId,
  sectionPatchOptions = {},
) => {
  const orderedQuestions = Array.isArray(questions) ? questions : [];
  const sectionPatch = sectionPatchOptions || {};
  const anchorQuestionIndex = orderedQuestions.findIndex(
    (question) => question && question.draftId === anchorQuestionId,
  );
  const anchorQuestion = getArrayItem(orderedQuestions, anchorQuestionIndex);

  if (anchorQuestionIndex === -1 || !anchorQuestion) {
    return [];
  }

  const targetSectionKey = getQuestionSectionIdentityKey(anchorQuestion);
  const patch = {
    sectionNumber: Number(sectionPatch.sectionNumber),
    sectionTitle: normalizeSectionTitle(sectionPatch.sectionTitle),
  };

  const followingQuestions = orderedQuestions.slice(anchorQuestionIndex);
  const firstDifferentSectionIndex = followingQuestions.findIndex(
    (question) =>
      !question || getQuestionSectionIdentityKey(question) !== targetSectionKey,
  );
  const sectionQuestions =
    firstDifferentSectionIndex === -1
      ? followingQuestions
      : followingQuestions.slice(0, firstDifferentSectionIndex);

  // 分组标题编辑应作用于当前连续分组，避免同名分组在其他位置被误改。
  return sectionQuestions.map((question) => ({
    draftId: question.draftId,
    patch,
  }));
};

export const getInheritedSectionPatch = (questions, questionId) => {
  const orderedQuestions = Array.isArray(questions) ? questions : [];
  const questionIndex = orderedQuestions.findIndex(
    (question) => question && question.draftId === questionId,
  );

  if (questionIndex === -1) {
    return {};
  }

  const currentQuestion = orderedQuestions.slice(
    questionIndex,
    questionIndex + 1,
  )[0];
  const previousQuestion = orderedQuestions.slice(
    Math.max(questionIndex - 1, 0),
    questionIndex,
  )[0];
  const nextQuestion = orderedQuestions.slice(
    questionIndex + 1,
    questionIndex + NEXT_QUESTION_OFFSET,
  )[0];
  const sourceQuestion = nextQuestion || previousQuestion || currentQuestion;

  return buildQuestionSectionPatch(sourceQuestion);
};

const stringifyQuestionAnswer = (answer) =>
  Array.isArray(answer) ? answer.join("；") : String(answer || "").trim();

const getJudgeQuestionAnswerText = (answer) => {
  if (answer === "true" || answer === true) {
    return "正确";
  }

  if (answer === "false" || answer === false) {
    return "错误";
  }

  return answer || "";
};

const getCombinationQuestionAnswerText = (question) =>
  question.sonQuestionList
    .map((subQuestion, index) => {
      const answerText = stringifyQuestionAnswer(
        getQuestionAnswerText(subQuestion),
      );

      return answerText
        ? `第${getOneBasedIndex(index)}小题：${answerText}`
        : "";
    })
    .filter(Boolean)
    .join("；");

const buildBlankQuestionAnswerText = (question) => {
  if (Array.isArray(question.gapFillingAnswer?.answers)) {
    return question.gapFillingAnswer.answers.join("；");
  }

  return getGapFillingAnswerGroups(question.gapFillingAnswer)
    .map((group) => group.join("&&"))
    .join("；");
};

const hasCombinationQuestionAnswer = (question) => {
  const subQuestions = Array.isArray(question.sonQuestionList)
    ? question.sonQuestionList
    : [];

  return (
    subQuestions.length > 0 &&
    subQuestions.every((subQuestion) => hasQuestionAnswer(subQuestion))
  );
};

const QUESTION_ANSWER_BEHAVIOR_REGISTRY = new Map([
  [
    FILL_BLANK_QUESTION_TYPE,
    {
      getAnswerText: buildBlankQuestionAnswerText,
      hasAnswer: (question) =>
        hasGapFillingAnswerContent(question.gapFillingAnswer),
    },
  ],
  [
    JUDGE_QUESTION_TYPE,
    {
      getAnswerText: (question) => getJudgeQuestionAnswerText(question.answer),
    },
  ],
  [
    COMBINATION_QUESTION_TYPE,
    {
      getAnswerText: (question) =>
        Array.isArray(question.sonQuestionList)
          ? getCombinationQuestionAnswerText(question)
          : "",
      hasAnswer: hasCombinationQuestionAnswer,
    },
  ],
]);

const DEFAULT_QUESTION_ANSWER_BEHAVIOR = {
  getAnswerText: (question) => question.answer || "",
  hasAnswer: (question) =>
    hasQuestionRichTextContent(getQuestionAnswerText(question)),
};

const getQuestionAnswerBehavior = (type) =>
  Object.assign(
    {},
    DEFAULT_QUESTION_ANSWER_BEHAVIOR,
    QUESTION_ANSWER_BEHAVIOR_REGISTRY.get(type),
  );

export const getQuestionAnswerText = (question) => {
  const type = Number(question && question.type);

  return getQuestionAnswerBehavior(type).getAnswerText(question);
};

export const hasQuestionAnswer = (question) => {
  if (!question) {
    return false;
  }

  return getQuestionAnswerBehavior(Number(question.type)).hasAnswer(question);
};

export const hasQuestionAnalysis = (question) => {
  if (!question) {
    return false;
  }

  if (Number(question.type) === COMBINATION_QUESTION_TYPE) {
    const subQuestions = Array.isArray(question.sonQuestionList)
      ? question.sonQuestionList
      : [];

    return (
      subQuestions.length > 0 &&
      subQuestions.every((subQuestion) => hasQuestionAnalysis(subQuestion))
    );
  }

  return hasQuestionRichTextContent(question && question.analysis);
};

const QUESTION_SCORE_FIELD_GETTERS = new Map([
  ["fullScore", (question) => question?.fullScore],
  ["point", (question) => question?.point],
  ["points", (question) => question?.points],
  ["questionScore", (question) => question?.questionScore],
  ["questionSettingScore", (question) => question?.questionSettingScore],
  ["score", (question) => question?.score],
]);

const getQuestionScoreFieldValue = (question, key) =>
  QUESTION_SCORE_FIELD_GETTERS.get(key)
    ? QUESTION_SCORE_FIELD_GETTERS.get(key)(question)
    : undefined;

export const getNormalizedQuestionScore = (question) => {
  const scoreKey = SCORE_FIELD_KEYS.find((key) =>
    normalizeQuestionScoreText(getQuestionScoreFieldValue(question, key)),
  );

  return scoreKey
    ? normalizeQuestionScoreText(getQuestionScoreFieldValue(question, scoreKey))
    : "";
};
