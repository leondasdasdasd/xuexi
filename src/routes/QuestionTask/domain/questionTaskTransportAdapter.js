import { QUESTION_LEVEL_NORMAL } from "../../../utils/questionDifficulty.js";
import {
  buildGapFillingAnswerTransport,
  getGapFillingAnswerGroups,
} from "./questionTaskGapFillingAnswer";
import {
  DEFAULT_QUESTION_TYPE,
  getOptionKey,
  OPTION_BASED_QUESTION_TYPES,
  QUESTION_TYPE_BLANK,
  QUESTION_TYPE_COMBINATION,
  toArray,
} from "./questionTaskShared";

const DEFAULT_SECTION_TITLE = "未分组";

const appendUniqueId = (ids, id) => (ids.includes(id) ? ids : [...ids, id]);

const collectUniqueIds = (items, index = 0, ids = []) => {
  if (index >= items.length) {
    return ids;
  }

  const item = items.slice(index, index + 1).shift();
  const rawValue = String(item || "");
  const id = Number(
    /^\d+$/.test(rawValue) ? rawValue : rawValue.split("-").pop(),
  );

  return collectUniqueIds(
    items,
    index + 1,
    Number.isFinite(id) ? appendUniqueId(ids, id) : ids,
  );
};

const normalizeIdListForTransport = (value) =>
  collectUniqueIds(Array.isArray(value) ? value : []);

const getOptionKnowledgeIds = (option, optionKnowledgeSelections, index) => {
  const optionKnowledgeIds = normalizeIdListForTransport(
    option && option.knowledgeIds,
  );

  if (optionKnowledgeIds.length > 0) {
    return optionKnowledgeIds;
  }

  return normalizeIdListForTransport(
    Array.isArray(optionKnowledgeSelections)
      ? optionKnowledgeSelections.slice(index, index + 1).shift()
      : [],
  );
};

const buildOptionListForTransport = (optionList, optionKnowledgeSelections) =>
  (Array.isArray(optionList) ? optionList : []).map((option, index) => {
    const key = (option && option.key) || getOptionKey(index);

    return {
      key,
      answers: (option && option.answers) || "",
      knowledgeIds: getOptionKnowledgeIds(
        option,
        optionKnowledgeSelections,
        index,
      ),
      knowledgeValues: toArray(option && option.knowledgeValues),
    };
  });

const normalizeQuestionScoreForTransport = (value) => {
  if (value === undefined || value === null || String(value).trim() === "") {
    return;
  }

  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : value;
};

const normalizePointListForTransport = (posList) =>
  (Array.isArray(posList) ? posList : []).map((polygon) =>
    (Array.isArray(polygon) ? polygon : [])
      .map((point) => ({
        x: Number(point && point.x),
        y: Number(point && point.y),
      }))
      .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y)),
  );

const getQuestionSortForTransport = (question) => {
  if (Number.isFinite(Number(question && question.questionSort))) {
    return Number(question.questionSort);
  }
  if (Number.isFinite(Number(question && question.displayQuestionSort))) {
    return Number(question.displayQuestionSort) + 1;
  }
  if (Number.isFinite(Number(question && question.sortOrder))) {
    return Number(question.sortOrder) + 1;
  }
};

const getQuestionTypeForTransport = (question) =>
  Number(question && question.type) || DEFAULT_QUESTION_TYPE;

const getListForTransport = (value) => (Array.isArray(value) ? value : []);

const getQuestionOptionListForTransport = (question, type) =>
  OPTION_BASED_QUESTION_TYPES.includes(type)
    ? buildOptionListForTransport(
        question && question.optionList,
        question && question.optionKnowledgeSelections,
      )
    : [];

const buildQuestionIdentityForTransport = (question) =>
  question && question.questionId ? { questionId: question.questionId } : {};

const buildGapFillingAnswerForTransport = (question) => ({
  answer: undefined,
  gapFillingAnswer:
    question && question.gapFillingAnswer
      ? buildGapFillingAnswerTransport({
          answerGroups: getGapFillingAnswerGroups(question.gapFillingAnswer),
          isOrder: question.gapFillingAnswer.isOrder,
        })
      : { answerRaw: [], answers: [], isOrder: false },
});

const buildCombinationAnswerForTransport = (question) => ({
  answer: "",
  sonQuestionList: getListForTransport(
    question && question.sonQuestionList,
  ).map((subQuestion) =>
    toQuestionTaskTransportQuestion(subQuestion, { includeSection: false }),
  ),
});

const buildDefaultAnswerForTransport = (question) => ({
  answer:
    question && question.answer !== undefined && question.answer !== null
      ? question.answer
      : "",
});

const QUESTION_TRANSPORT_TYPE_REGISTRY = new Map([
  [
    QUESTION_TYPE_BLANK,
    {
      buildAnswer: buildGapFillingAnswerForTransport,
    },
  ],
  [
    QUESTION_TYPE_COMBINATION,
    {
      buildAnswer: buildCombinationAnswerForTransport,
    },
  ],
]);

const getQuestionTransportTypeConfig = (type) =>
  QUESTION_TRANSPORT_TYPE_REGISTRY.get(type) || {
    buildAnswer: buildDefaultAnswerForTransport,
  };

const buildQuestionTextFieldsForTransport = (question) => ({
  analysis: (question && question.analysis) || "",
  content: (question && question.content) || "",
});

const buildQuestionSectionFieldsForTransport = (question) => {
  const sectionNumber = Number(question && question.sectionNumber);
  const normalizedSectionTitle = String(
    (question && question.sectionTitle) || "",
  ).trim();

  return {
    sectionNumber: Number.isFinite(sectionNumber) ? sectionNumber : undefined,
    sectionTitle: normalizedSectionTitle || DEFAULT_SECTION_TITLE,
  };
};

const buildQuestionMetadataForTransport = (question) => ({
  chapterIds: getListForTransport(question && question.chapterIds),
  indicatorIds: getListForTransport(question && question.indicatorIds),
  knowledgeIds: getListForTransport(question && question.knowledgeIds),
  knowledgeValues: toArray(question && question.knowledgeValues),
  mathNodeIds: getListForTransport(question && question.mathNodeIds),
});

const buildQuestionAiTaskStateForTransport = (question) => ({
  analysisTaskErrorMessage:
    (question && question.analysisTaskErrorMessage) || "",
  analysisTaskStatus: question && question.analysisTaskStatus,
  qualityCheckResult: question && question.qualityCheckResult,
  qualityCheckTaskErrorMessage:
    (question && question.qualityCheckTaskErrorMessage) || "",
  qualityCheckTaskStatus: question && question.qualityCheckTaskStatus,
});

const buildQuestionScoringForTransport = (question) => ({
  questionLevel:
    Number(question && question.questionLevel) || QUESTION_LEVEL_NORMAL,
  questionLevelName: (question && question.questionLevelName) || "",
  questionScore: normalizeQuestionScoreForTransport(
    question && question.questionScore,
  ),
  questionSort: getQuestionSortForTransport(question),
});

// 网络边界只接收后端统一的 QuestionData 结构，页面内部草稿字段在这里集中翻译。
export const toQuestionTaskTransportQuestion = (
  question,
  { includeSection = true } = {},
) => {
  const type = getQuestionTypeForTransport(question);
  const typeConfig = getQuestionTransportTypeConfig(type);

  return {
    ...buildQuestionTextFieldsForTransport(question),
    ...buildQuestionAiTaskStateForTransport(question),
    ...buildQuestionMetadataForTransport(question),
    ...buildQuestionScoringForTransport(question),
    ...(includeSection ? buildQuestionSectionFieldsForTransport(question) : {}),
    optionList: getQuestionOptionListForTransport(question, type),
    posList: normalizePointListForTransport(question && question.posList),
    type,
    uuid: (question && question.uuid) || undefined,
    ...buildQuestionIdentityForTransport(question),
    ...typeConfig.buildAnswer(question),
  };
};
