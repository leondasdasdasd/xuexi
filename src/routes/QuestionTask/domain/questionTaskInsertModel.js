import { QUESTION_LEVEL_NORMAL } from "../../../utils/questionDifficulty.js";
import {
  DEFAULT_MANUAL_OPTION_KEYS,
  QUESTION_TYPE_ANSWER,
  QUESTION_TYPE_BLANK,
} from "./questionTaskShared";

export const clearQuestionAiTaskState = (question) => ({
  ...question,
  aiQualityCheck: undefined,
  analysisTaskErrorMessage: "",
  analysisTaskStatus: undefined,
  qualityCheckResult: undefined,
  qualityCheckTaskErrorMessage: "",
  qualityCheckTaskStatus: undefined,
  sonQuestionList: Array.isArray(question && question.sonQuestionList)
    ? question.sonQuestionList.map((subQuestion) =>
        clearQuestionAiTaskState(subQuestion),
      )
    : [],
});

export const assignFreshQuestionUuids = (question, createUuid) =>
  question
    ? {
        ...question,
        sonQuestionList: Array.isArray(question.sonQuestionList)
          ? question.sonQuestionList.map((subQuestion) =>
              assignFreshQuestionUuids(subQuestion, createUuid),
            )
          : [],
        uuid: createUuid(),
      }
    : question;

const cloneOptionList = (optionList) =>
  (Array.isArray(optionList) ? optionList : []).map((option) => ({
    ...option,
  }));

const cloneSubQuestionList = (sonQuestionList) =>
  (Array.isArray(sonQuestionList) ? sonQuestionList : []).map(
    (subQuestion) => ({
      ...subQuestion,
      optionList: cloneOptionList(subQuestion.optionList),
      polygon: undefined,
      polygonBounds: undefined,
      posList: [],
      questionId: undefined,
    }),
  );

const buildEmptyOptionList = (type, isOptionBasedQuestion) =>
  isOptionBasedQuestion({ type })
    ? DEFAULT_MANUAL_OPTION_KEYS.map((key) => ({ answers: "", key }))
    : [];

const buildBaseInsertMetadata = (baseQuestion, cloneArrayField) => ({
  chapterIds: cloneArrayField(baseQuestion, "chapterIds"),
  chapterLabels: cloneArrayField(baseQuestion, "chapterLabels"),
  chapterSelections: cloneArrayField(baseQuestion, "chapterSelections"),
  indicatorIds: cloneArrayField(baseQuestion, "indicatorIds"),
  indicatorLabels: cloneArrayField(baseQuestion, "indicatorLabels"),
  knowledgeIds: cloneArrayField(baseQuestion, "knowledgeIds"),
  knowledgeLabels: cloneArrayField(baseQuestion, "knowledgeLabels"),
  knowledgeSelections: cloneArrayField(baseQuestion, "knowledgeSelections"),
});

const buildBaseInsertSection = (baseQuestion) => ({
  sectionNumber:
    baseQuestion.sectionNumber === undefined ||
    baseQuestion.sectionNumber === null
      ? undefined
      : Number(baseQuestion.sectionNumber),
  sectionTitle: baseQuestion.sectionTitle || "",
});

// 插题草稿在进入页面态前统一清空 AI 结果、定位信息和后端主键，避免复制旧边界状态。
export const cloneQuestionForInsert = ({
  createUuid,
  getQuestionTypeLabel,
  question,
}) => {
  const sourceQuestion = clearQuestionAiTaskState(
    question ? JSON.parse(JSON.stringify(question)) : {},
  );
  const type = Number(sourceQuestion.type) || QUESTION_TYPE_ANSWER;

  return assignFreshQuestionUuids(
    {
      ...sourceQuestion,
      deleted: false,
      draftId: "",
      optionList: cloneOptionList(sourceQuestion.optionList),
      polygon: undefined,
      polygonBounds: undefined,
      posList: [],
      questionId: undefined,
      sectionNumber: sourceQuestion.sectionNumber,
      sectionTitle: sourceQuestion.sectionTitle || "",
      sonQuestionList: cloneSubQuestionList(sourceQuestion.sonQuestionList),
      type,
      typeLabel: getQuestionTypeLabel(type),
    },
    createUuid,
  );
};

export const createQuestionForInsert = ({
  cloneArrayField,
  createUuid,
  getQuestionLevelLabel,
  getQuestionTypeLabel,
  isOptionBasedQuestion,
  question,
}) => {
  const baseQuestion = question || {};
  const type = Number(baseQuestion.type) || QUESTION_TYPE_ANSWER;
  const questionLevel =
    Number(baseQuestion.questionLevel) || QUESTION_LEVEL_NORMAL;

  return assignFreshQuestionUuids(
    {
      analysis: "",
      analysisTaskErrorMessage: "",
      analysisTaskStatus: undefined,
      answer: type === QUESTION_TYPE_BLANK ? undefined : "",
      aiQualityCheck: undefined,
      ...buildBaseInsertMetadata(baseQuestion, cloneArrayField),
      content: "",
      deleted: false,
      draftId: "",
      gapFillingAnswer:
        type === QUESTION_TYPE_BLANK
          ? { answers: [""], isOrder: false }
          : undefined,
      optionList: buildEmptyOptionList(type, isOptionBasedQuestion),
      pageIndex: baseQuestion.pageIndex,
      polygon: undefined,
      polygonBounds: undefined,
      posList: [],
      qualityCheckResult: undefined,
      qualityCheckTaskErrorMessage: "",
      qualityCheckTaskStatus: undefined,
      questionId: undefined,
      questionLevel,
      questionLevelName: getQuestionLevelLabel(questionLevel),
      questionScore: "",
      ...buildBaseInsertSection(baseQuestion),
      sonQuestionList: [],
      sourceQuestionSort: baseQuestion.sourceQuestionSort,
      type,
      typeLabel: getQuestionTypeLabel(type),
    },
    createUuid,
  );
};
