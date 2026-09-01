import get from "lodash/get";

import { trans } from "../../../utils/i18n";
import { getQuestionLevelLabel } from "../../../utils/questionDifficulty.js";
import { buildQuestionAiQualityCheck } from "../ai/questionTaskAiQualityModel";
import {
  normalizeAnswerPages,
  normalizeAnswerTextPages,
} from "./questionTaskAnswerPages";
import { getGapFillingAnswerGroups } from "./questionTaskGapFillingAnswer";
import { normalizePageRecognizedImages } from "./questionTaskPageImages";
import {
  buildQuestionSectionPatch,
  getNormalizedQuestionScore,
  hasQuestionRichTextContent,
} from "./questionTaskQuestionMeta";
import {
  DEFAULT_QUESTION_LEVEL,
  DEFAULT_QUESTION_TYPE,
  getOneBasedIndex,
  getOptionKey,
  OPTION_BASED_QUESTION_TYPES,
  QUESTION_TYPE_ANSWER,
  QUESTION_TYPE_BLANK as FILL_BLANK_QUESTION_TYPE,
  QUESTION_TYPE_CHOICE,
  QUESTION_TYPE_COMBINATION as COMBINATION_QUESTION_TYPE,
  QUESTION_TYPE_FREE_COMBINATION,
  QUESTION_TYPE_JUDGE as JUDGE_QUESTION_TYPE,
  QUESTION_TYPE_MULTIPLE_CHOICE,
  QUESTION_TYPE_MULTIPLE_VOTE,
  QUESTION_TYPE_SINGLE_VOTE,
  toArray,
} from "./questionTaskShared";
export { getQuestionSourcePageImageAssets } from "./questionTaskPageImages";
export {
  buildQuestionSectionInsertPatches,
  buildQuestionSectionInsertPatchesAtStart,
  buildQuestionSectionPatch,
  buildQuestionSectionUpdatePatches,
  getInheritedSectionPatch,
  getQuestionAnswerText,
  getQuestionDisplayNumber,
  getQuestionScoreText,
  getQuestionSectionDisplayLabel,
  getQuestionSectionIdentityKey,
  hasQuestionAnalysis,
  hasQuestionAnswer,
  hasQuestionRichTextContent,
  parseQuestionScoreState,
  stripQuestionText,
} from "./questionTaskQuestionMeta";
export { OPTION_BASED_QUESTION_TYPES } from "./questionTaskShared";

const MIN_VALID_POLYGON_SPAN = 10;
const getObjectValue = (object, key) => get(object, [key]);
const QUESTION_TYPE_LABEL_MAP = {
  [QUESTION_TYPE_FREE_COMBINATION]: trans(
    "global.freeCombination",
    "自由组合题型",
  ),
  [QUESTION_TYPE_CHOICE]: trans("global.radio", "单选题"),
  [QUESTION_TYPE_MULTIPLE_CHOICE]: trans("global.check", "多选题"),
  [FILL_BLANK_QUESTION_TYPE]: trans("global.pack", "填空题"),
  [JUDGE_QUESTION_TYPE]: trans("global.judge", "判断题"),
  [QUESTION_TYPE_ANSWER]: trans("global.ask", "问答题"),
  [COMBINATION_QUESTION_TYPE]: trans("global.combination", "组合题"),
  [QUESTION_TYPE_SINGLE_VOTE]: trans("global.singleVote", "单选投票题"),
  [QUESTION_TYPE_MULTIPLE_VOTE]: trans("global.multipleVote", "多选投票题"),
};

const normalizeIdList = (value) =>
  toArray(value)
    .map(Number)
    .filter((item) => Number.isFinite(item));

const normalizeOptionList = (optionList) =>
  (Array.isArray(optionList) ? optionList : []).map((option, index) => ({
    answers: String(option && option.answers ? option.answers : ""),
    knowledgeIds: normalizeIdList(option && option.knowledgeIds),
    knowledgeValues: toArray(option && option.knowledgeValues),
    key: (option && option.key) || getOptionKey(index),
  }));

const normalizeOptionKnowledgeSelections = (
  optionKnowledgeSelections,
  normalizedOptionList,
) =>
  Array.isArray(optionKnowledgeSelections) &&
  optionKnowledgeSelections.length > 0
    ? optionKnowledgeSelections.map((selection) =>
        Array.isArray(selection) ? selection.filter(Boolean) : [],
      )
    : normalizedOptionList.map((option) =>
        Array.isArray(option && option.knowledgeIds) ? option.knowledgeIds : [],
      );

const hasGapFillingAnswerPayload = (gapFillingAnswer) =>
  Array.isArray(gapFillingAnswer && gapFillingAnswer.answers) ||
  Array.isArray(gapFillingAnswer && gapFillingAnswer.answerRaw);

const getNormalizedLegacyGapAnswers = (gapFillingAnswer, answerGroups) =>
  gapFillingAnswer && Array.isArray(gapFillingAnswer.answers)
    ? gapFillingAnswer.answers
    : answerGroups.map((group) => group.join("&&")).filter(Boolean);

const normalizeGapFillingAnswer = (gapFillingAnswer) => {
  const answerGroups = getGapFillingAnswerGroups(gapFillingAnswer);

  if (
    answerGroups.length === 0 &&
    !hasGapFillingAnswerPayload(gapFillingAnswer)
  ) {
    return;
  }

  return {
    ...gapFillingAnswer,
    answerRaw: answerGroups,
    answers: getNormalizedLegacyGapAnswers(gapFillingAnswer, answerGroups),
    isOrder: !!(gapFillingAnswer && gapFillingAnswer.isOrder),
  };
};

export { buildQuestionAiQualityCheck } from "../ai/questionTaskAiQualityModel";

export const getValidMetadataId = (value) => {
  const id = Number(value);

  return Number.isFinite(id) && id > 0 ? id : undefined;
};

export const getHashQueryValue = (key) => {
  const hash = window.location.hash || "";
  const query = hash.split("?")[1] || "";
  const matchedPair = query
    .split("&")
    .map((item) => item.split("="))
    .find(([queryKey]) => decodeURIComponent(queryKey || "") === key);

  return matchedPair ? decodeURIComponent(matchedPair[1] || "") : "";
};

export const getQuestionTypeLabel = (type) =>
  getObjectValue(QUESTION_TYPE_LABEL_MAP, type) ||
  (type === QUESTION_TYPE_FREE_COMBINATION
    ? getObjectValue(QUESTION_TYPE_LABEL_MAP, type)
    : `类型${type}`);

const getDefinedValue = (values) =>
  values.find((value) => value !== undefined && value !== null);

export const isOptionBasedQuestion = (question) =>
  OPTION_BASED_QUESTION_TYPES.includes(Number(question && question.type));

export const hasQuestionOptions = (question) => {
  if (!isOptionBasedQuestion(question)) {
    return true;
  }

  const optionList = Array.isArray(question && question.optionList)
    ? question.optionList
    : [];

  return (
    optionList.length > 0 &&
    optionList.every((option) =>
      hasQuestionRichTextContent(option && option.answers),
    )
  );
};

const getBounds = (posList) => {
  const points = (Array.isArray(posList) ? posList : []).flatMap((polygon) =>
    (Array.isArray(polygon) ? polygon : [])
      .filter(
        (point) =>
          Number.isFinite(Number(point && point.x)) &&
          Number.isFinite(Number(point && point.y)),
      )
      .map((point) => ({ x: Number(point.x), y: Number(point.y) })),
  );

  if (points.length === 0) {
    return;
  }

  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);

  const bounds = {
    bottom: Math.max(...ys),
    left: Math.min(...xs),
    right: Math.max(...xs),
    top: Math.min(...ys),
  };

  // OCR 偶发返回 0/1/2/3 这类网格占位坐标，不是图片像素坐标，不能当作题目框线展示。
  return bounds.right - bounds.left >= MIN_VALID_POLYGON_SPAN &&
    bounds.bottom - bounds.top >= MIN_VALID_POLYGON_SPAN
    ? bounds
    : undefined;
};

const getNormalizedQuestionType = (question) =>
  Number.isFinite(Number(question && question.type))
    ? Number(question.type)
    : DEFAULT_QUESTION_TYPE;

const getNormalizedQuestionLevel = (question) =>
  Number.isFinite(Number(question && question.questionLevel))
    ? Number(question.questionLevel)
    : DEFAULT_QUESTION_LEVEL;

const buildQuestionKnowledgeState = (question) => {
  const source = question || {};

  return {
    chapterIds: normalizeIdList(source.chapterIds),
    chapterLabels: toArray(source.chapterLabels),
    chapterSelections: toArray(source.chapterSelections),
    indicatorIds: normalizeIdList(source.indicatorIds),
    indicatorLabels: toArray(source.indicatorLabels),
    knowledgeIds: normalizeIdList(source.knowledgeIds),
    knowledgeLabels: toArray(source.knowledgeLabels),
    knowledgeSelections: toArray(source.knowledgeSelections),
    knowledgeValues: toArray(source.knowledgeValues),
    mathNodeIds: normalizeIdList(source.mathNodeIds),
  };
};

const buildQuestionPositionState = (question, extraState) => {
  const source = question || {};

  return {
    endPageIndex: source.endPageIndex,
    endPageNumber: source.endPageNumber,
    pageIndex: getDefinedValue([extraState.pageIndex, source.pageIndex]),
    pageNumber: getDefinedValue([extraState.pageNumber, source.pageNumber]),
    pageIndexes: source.pageIndexes,
    pageIndexList: source.pageIndexList,
    pageNumbers: source.pageNumbers,
    polygonBounds: extraState.polygonBounds || source.polygonBounds,
    posList:
      extraState.posList ||
      (Array.isArray(source.posList) ? source.posList : []),
    sourcePageIndexes: source.sourcePageIndexes,
    sourcePageNumbers: source.sourcePageNumbers,
    startPageIndex: source.startPageIndex,
    startPageNumber: source.startPageNumber,
  };
};

const buildQuestionIdentityState = (question, extraState) => ({
  draftId: extraState.draftId || (question && question.draftId) || "",
  questionId:
    question && Number.isFinite(Number(question.questionId))
      ? Number(question.questionId)
      : undefined,
  uuid: (question && question.uuid) || "",
});

const buildQuestionSortState = (question, extraState) => ({
  sortOrder: Number.isFinite(Number(question && question.sortOrder))
    ? Number(question.sortOrder)
    : extraState.sortOrder,
  sourceQuestionSort:
    extraState.sourceQuestionSort === undefined
      ? question && question.sourceQuestionSort
      : extraState.sourceQuestionSort,
});

const getQuestionAiQualityCheck = (question) =>
  buildQuestionAiQualityCheck(
    question && question.qualityCheckResult,
    question && question.aiQualityCheck,
  );

const getQuestionAnswerValue = (question) => {
  if (!question || question.answer === undefined) {
    return "";
  }

  return question.answer;
};

const cloneQualityCheckResult = (question) =>
  question.qualityCheckResult
    ? {
        ...question.qualityCheckResult,
      }
    : undefined;

const getQuestionLevelName = (question, questionLevel) =>
  (question && question.questionLevelName) ||
  getQuestionLevelLabel(questionLevel);

const normalizeChildQuestionDrafts = (source) =>
  (Array.isArray(source.sonQuestionList) ? source.sonQuestionList : []).map(
    (childQuestion) => ({
      ...normalizeQuestionDraft(childQuestion),
      sectionNumber: undefined,
      sectionTitle: "",
    }),
  );

const buildQuestionAiTaskState = (source) => ({
  aiQualityCheck: getQuestionAiQualityCheck(source),
  analysisTaskErrorMessage: source.analysisTaskErrorMessage || "",
  analysisTaskStatus: source.analysisTaskStatus,
  qualityCheckResult: cloneQualityCheckResult(source),
  qualityCheckTaskErrorMessage: source.qualityCheckTaskErrorMessage || "",
  qualityCheckTaskStatus: source.qualityCheckTaskStatus,
});

const normalizeQuestionDraft = (question, extraState = {}) => {
  const source = question || {};
  const type = getNormalizedQuestionType(question);
  const questionLevel = getNormalizedQuestionLevel(question);
  const normalizedOptionList = normalizeOptionList(source.optionList);

  return {
    analysis: source.analysis || "",
    answer: getQuestionAnswerValue(source),
    ...buildQuestionIdentityState(question, extraState),
    ...buildQuestionAiTaskState(source),
    ...buildQuestionKnowledgeState(question),
    ...buildQuestionPositionState(question, extraState),
    ...buildQuestionSectionPatch(question),
    ...buildQuestionSortState(question, extraState),
    content: source.content || "",
    deleted: !!source.deleted,
    gapFillingAnswer: normalizeGapFillingAnswer(source.gapFillingAnswer),
    gradeId: getValidMetadataId(source.gradeId),
    optionList: normalizedOptionList,
    optionKnowledgeSelections: normalizeOptionKnowledgeSelections(
      source.optionKnowledgeSelections,
      normalizedOptionList,
    ),
    questionLevel,
    questionLevelName: getQuestionLevelName(question, questionLevel),
    questionScore: getNormalizedQuestionScore(question),
    sonQuestionList: normalizeChildQuestionDrafts(source),
    subjectId: getValidMetadataId(source.subjectId),
    type,
    typeLabel: getQuestionTypeLabel(type),
  };
};

const normalizeQuestion = (
  question,
  index,
  pageKey,
  sortOrder,
  pageState = {},
) => {
  const sourceQuestionSort = Number.isFinite(
    Number(question && question.questionSort),
  )
    ? Number(question.questionSort)
    : index;

  return normalizeQuestionDraft(question, {
    draftId: `${pageKey}-${sourceQuestionSort}-${index}`,
    pageIndex: pageState.pageIndex,
    pageNumber: pageState.pageNumber,
    polygonBounds: getBounds(question && question.posList),
    posList: Array.isArray(question && question.posList)
      ? question.posList
      : [],
    sortOrder: Number.isFinite(Number(question && question.sortOrder))
      ? Number(question.sortOrder)
      : sortOrder,
    sourceQuestionSort,
  });
};

const getPageQuestionList = (page) => {
  if (Array.isArray(page && page.questionList)) {
    return page.questionList;
  }
  if (Array.isArray(page && page.questions)) {
    return page.questions;
  }
  return [];
};

const normalizeTaskPage = (page, index, pageOffset) => {
  const pageKey = `page-${getOneBasedIndex(index)}`;
  const pageState = {
    pageIndex: page && page.pageIndex,
    pageKey,
    pageNumber: getOneBasedIndex(index),
  };

  return {
    errorMessage: (page && page.errorMessage) || "",
    imageUrl: (page && page.imageUrl) || "",
    itemStatus: page && page.itemStatus,
    pageIndex: pageState.pageIndex,
    pageKey,
    pageNumber: pageState.pageNumber,
    recognizedImages: normalizePageRecognizedImages(page, pageState),
    questions: getPageQuestionList(page).map((question, questionIndex) => {
      const nextSortOrder = pageOffset + questionIndex;
      const normalizedQuestion = normalizeQuestion(
        question,
        questionIndex,
        pageKey,
        nextSortOrder,
        pageState,
      );

      return {
        ...normalizedQuestion,
        sortOrder: nextSortOrder,
      };
    }),
  };
};

const getTaskResultValue = (content, keys) => {
  const matchedKey = keys.find(
    (key) =>
      getObjectValue(content, key) !== undefined &&
      getObjectValue(content, key) !== "",
  );

  return matchedKey ? getObjectValue(content, matchedKey) : undefined;
};

const normalizeTaskPages = (content) =>
  [...(Array.isArray(content && content.pages) ? content.pages : [])]
    .sort((left, right) => (left.pageIndex || 0) - (right.pageIndex || 0))
    .map((page, index, sortedPages) => {
      const pageOffset = sortedPages
        .slice(0, index)
        .flatMap((previousPage) => getPageQuestionList(previousPage)).length;

      return normalizeTaskPage(page, index, pageOffset);
    });

export const normalizeTaskResult = (content) => {
  const source = content || {};
  const normalizedPages = normalizeTaskPages(content);

  return {
    answerFileId: getTaskResultValue(content, [
      "answerFileId",
      "examAnswerFileId",
      "answerUploadFileId",
      "examAnswerUploadFileId",
    ]),
    answerFileUrl: getTaskResultValue(content, [
      "answerFileUrl",
      "examAnswerFileUrl",
      "answerPreviewUrl",
      "examAnswerPreviewUrl",
    ]),
    // 后端解析卷新增独立图片和 markdown 字段，前端统一收敛后再交给左侧解析 tab 展示。
    answerPages: normalizeAnswerPages(content),
    answerSheetErrorMessage: source.answerSheetErrorMessage || "",
    answerSheetMarkdown: source.answerSheetMarkdown || "",
    answerSheetStatus: source.answerSheetStatus,
    answerTextPages: normalizeAnswerTextPages(content),
    examPaperId: source.examPaperId,
    gradeId: getValidMetadataId(source.gradeId),
    lastSavedAt: getTaskResultValue(content, [
      "lastSavedAt",
      "updateTime",
      "updatedAt",
      "saveTime",
      "gmtModified",
      "modifiedTime",
      "modifyTime",
      "modifiedAt",
    ]),
    pages: normalizedPages,
    paperName: source.paperName || "",
    status: source.status,
    subjectId: getValidMetadataId(source.subjectId),
    taskId: source.taskId,
  };
};

const buildPolygon = (question) =>
  question && question.polygonBounds
    ? {
        category: "question",
        id: question.draftId,
        label: `${question.displayQuestionSort + 1}. ${question.typeLabel}`,
        points: [
          { x: question.polygonBounds.left, y: question.polygonBounds.top },
          { x: question.polygonBounds.right, y: question.polygonBounds.top },
          { x: question.polygonBounds.right, y: question.polygonBounds.bottom },
          { x: question.polygonBounds.left, y: question.polygonBounds.bottom },
        ],
      }
    : undefined;

const getVisibleQuestionSortOrder = (question) =>
  Number.isFinite(Number(question && question.sortOrder))
    ? Number(question.sortOrder)
    : Number(question && question._fallbackSortOrder);

const compareVisibleQuestions = (left, right) => {
  const sortDiff =
    getVisibleQuestionSortOrder(left) - getVisibleQuestionSortOrder(right);

  if (sortDiff !== 0) {
    return sortDiff;
  }

  const pageDiff =
    Number(left && left.pageIndex) - Number(right && right.pageIndex);

  if (pageDiff !== 0) {
    return pageDiff;
  }

  return (
    Number(left && left.sourceQuestionSort) -
    Number(right && right.sourceQuestionSort)
  );
};

export const buildVisibleQuestionState = (pages) => {
  const visiblePagesBase = (Array.isArray(pages) ? pages : []).map((page) => ({
    ...page,
    questions: (Array.isArray(page.questions) ? page.questions : []).filter(
      (question) => !question.deleted,
    ),
  }));
  const rawVisibleQuestions = visiblePagesBase.flatMap((page, pageIndex) => {
    const previousQuestionCount = visiblePagesBase
      .slice(0, pageIndex)
      .flatMap((previousPage) => previousPage.questions).length;

    return page.questions.map((question, questionIndex) => ({
      ...question,
      pageKey: page.pageKey,
      pageNumber: page.pageNumber,
      _fallbackSortOrder: previousQuestionCount + questionIndex,
    }));
  });
  const sortedVisibleQuestions = [...rawVisibleQuestions].sort(
    compareVisibleQuestions,
  );
  const displayOrderMap = Object.fromEntries(
    sortedVisibleQuestions.map((question, index) => [question.draftId, index]),
  );
  const visiblePages = visiblePagesBase.map((page) => ({
    ...page,
    questions: page.questions.map((question) => {
      const displayQuestionSort = displayOrderMap[question.draftId];
      const nextQuestion = {
        ...question,
        displayQuestionSort,
        displayQuestionNumber: displayQuestionSort + 1,
      };

      nextQuestion.polygon = buildPolygon(nextQuestion);
      return nextQuestion;
    }),
  }));
  const visibleQuestions = sortedVisibleQuestions.map((question) => {
    const displayQuestionSort = displayOrderMap[question.draftId];

    return {
      ...question,
      displayQuestionSort,
      displayQuestionNumber: displayQuestionSort + 1,
    };
  });

  return {
    pages: visiblePages,
    questionMap: Object.fromEntries(
      visibleQuestions.map((question) => [question.draftId, question]),
    ),
    questions: visibleQuestions,
  };
};

export const isQuestionSelectionLocked = (editingQuestionId) =>
  !!editingQuestionId;

export const canSelectQuestion = (editingQuestionId, questionId) =>
  !editingQuestionId || editingQuestionId === questionId;

export const getResolvedQuestionMetadata = (question, taskResult) => ({
  gradeId:
    getValidMetadataId(question && question.gradeId) ||
    getValidMetadataId(taskResult && taskResult.gradeId),
  subjectId:
    getValidMetadataId(question && question.subjectId) ||
    getValidMetadataId(taskResult && taskResult.subjectId),
});

const buildEditQuestionDraft = (question) => {
  const normalizedOptionList = normalizeOptionList(question.optionList);

  return {
    ...question,
    chapterLabels: question.chapterLabels || [],
    chapterSelections: question.chapterSelections || [],
    indicatorIds: question.indicatorIds || [],
    indicatorLabels: question.indicatorLabels || [],
    knowledgeLabels: question.knowledgeLabels || [],
    knowledgeSelections: question.knowledgeSelections || [],
    optionList: normalizedOptionList,
    optionKnowledgeSelections: normalizeOptionKnowledgeSelections(
      question.optionKnowledgeSelections,
      normalizedOptionList,
    ),
    questionLevelName:
      question.questionLevelName ||
      getQuestionLevelLabel(question.questionLevel),
  };
};

export const buildEditQuestion = (question, taskResult) => ({
  ...buildEditQuestionDraft(question),
  ...getResolvedQuestionMetadata(question, taskResult),
  sonQuestionList: (Array.isArray(question.sonQuestionList)
    ? question.sonQuestionList
    : []
  ).map((childQuestion) => buildEditQuestion(childQuestion, taskResult)),
});

export const applyLocalSave = (question, localSavePayload) =>
  normalizeQuestionDraft(
    {
      ...question,
      ...(localSavePayload && localSavePayload.draft),
      questionId:
        (localSavePayload &&
          localSavePayload.draft &&
          localSavePayload.draft.questionId) ||
        question.questionId ||
        undefined,
    },
    {
      draftId: question.draftId,
      polygonBounds: question.polygonBounds,
      posList: question.posList,
      sourceQuestionSort: question.sourceQuestionSort,
    },
  );

export const updateQuestionInPages = (pages, questionId, updater) =>
  (Array.isArray(pages) ? pages : []).map((page) => ({
    ...page,
    questions: (Array.isArray(page.questions) ? page.questions : []).map(
      (question) =>
        question.draftId === questionId ? updater(question) : question,
    ),
  }));

const syncQuestionMetadata = (question, gradeId, subjectId) => {
  if (!question || question.deleted) {
    return question;
  }

  return {
    ...question,
    gradeId,
    subjectId,
    sonQuestionList: (Array.isArray(question.sonQuestionList)
      ? question.sonQuestionList
      : []
    ).map((childQuestion) =>
      syncQuestionMetadata(childQuestion, gradeId, subjectId),
    ),
  };
};

export const syncQuestionMetadataInPages = (pages, gradeId, subjectId) =>
  (Array.isArray(pages) ? pages : []).map((page) => ({
    ...page,
    questions: (Array.isArray(page.questions) ? page.questions : []).map(
      (question) => syncQuestionMetadata(question, gradeId, subjectId),
    ),
  }));

export const markQuestionDeleted = (pages, questionId) =>
  updateQuestionInPages(pages, questionId, (question) => ({
    ...question,
    deleted: true,
  }));

const getSavableQuestions = (questions) =>
  (Array.isArray(questions) ? questions : []).filter(
    (question) => !question.deleted,
  );

const getQuestionSortValue = (question, fallback) => {
  if (Number.isFinite(Number(question && question.displayQuestionSort))) {
    return Number(question.displayQuestionSort) + 1;
  }
  if (Number.isFinite(Number(question && question.sortOrder))) {
    return Number(question.sortOrder) + 1;
  }
  return fallback;
};

const buildQuestionSortMap = (questions) =>
  new Map(
    getSavableQuestions(questions)
      .filter((question) => question && question.draftId)
      .map((question, index) => [
        question.draftId,
        getQuestionSortValue(question, getOneBasedIndex(index)),
      ]),
  );

const flattenPageQuestions = (pages) =>
  pages.flatMap((page) =>
    Array.isArray(page.questions) ? page.questions : [],
  );

const applyQuestionSortForSave = (question, index, questionSortMap) => {
  const questionSort =
    question && question.draftId
      ? questionSortMap.get(question.draftId)
      : undefined;

  return {
    ...question,
    questionSort: questionSort || getOneBasedIndex(index),
  };
};

const buildSavePageContext = (page, questionSortMap) => ({
  errorMessage: (page && page.errorMessage) || "",
  imageUrl: (page && page.imageUrl) || "",
  itemStatus: page && page.itemStatus,
  pageIndex: page && page.pageIndex,
  questionList: getSavableQuestions(page && page.questions).map(
    (question, index) =>
      applyQuestionSortForSave(question, index, questionSortMap),
  ),
});

const getSaveContextQuestions = (questions, pages) =>
  Array.isArray(questions) && questions.length > 0
    ? questions
    : flattenPageQuestions(pages);

export const buildQuestionTaskSaveContext = (taskResult, questions) => {
  const source = taskResult || {};
  const pages = Array.isArray(source.pages) ? source.pages : [];
  const fallbackQuestions = getSaveContextQuestions(questions, pages);
  const questionSortMap = buildQuestionSortMap(fallbackQuestions);

  // 保存草稿必须保留页结构，拖拽后的全卷顺序通过题目 questionSort 传给后端。
  return {
    answerPages: Array.isArray(source.answerPages) ? source.answerPages : [],
    answerSheetErrorMessage: source.answerSheetErrorMessage || "",
    answerSheetMarkdown: source.answerSheetMarkdown || "",
    answerSheetStatus: source.answerSheetStatus,
    examPaperId: source.examPaperId,
    gradeId: getValidMetadataId(source.gradeId),
    pages: pages.map((page) => buildSavePageContext(page, questionSortMap)),
    questionList: getSavableQuestions(fallbackQuestions),
    status: source.status,
    subjectId: getValidMetadataId(source.subjectId),
    taskId: source.taskId,
  };
};
