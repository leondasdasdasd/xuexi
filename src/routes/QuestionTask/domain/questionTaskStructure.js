import { QUESTION_LEVEL_NORMAL } from "../../../utils/questionDifficulty.js";
import {
  DEFAULT_QUESTION_TYPE,
  getArrayItem,
  isCombinationQuestionType,
  QUESTION_TYPE_COMBINATION,
} from "./questionTaskShared";

const MIN_CREATE_COMBINATION_QUESTION_COUNT = 2;
const SUB_QUESTION_SELECTION_SEPARATOR = "::sub::";
const SELECTION_ITEM_TYPE_QUESTION = "question";
const SELECTION_ITEM_TYPE_SUB_QUESTION = "subQuestion";
const STRUCTURE_ERROR = {
  APPEND_NEEDS_STANDALONE: {
    defaultMessage:
      "Select at least one non-group question to add to the group.",
    errorKey: "questionTask.structureAppendNeedsStandalone",
    errorMessage: "请选择至少 1 道非组合题追加到组合题",
  },
  MERGE_NEEDS_STANDALONE: {
    defaultMessage:
      "Select at least two non-group questions to create a group.",
    errorKey: "questionTask.structureMergeNeedsStandalone",
    errorMessage: "请选择至少 2 道非组合题合并为组合题",
  },
  MULTIPLE_COMBINATIONS: {
    defaultMessage: "Select only one group question when merging.",
    errorKey: "questionTask.structureMultipleCombinations",
    errorMessage: "一次只能选择一个组合题参与合并",
  },
  MERGE_SUB_QUESTIONS_UNSUPPORTED: {
    defaultMessage: "Subquestion selections can only be split.",
    errorKey: "questionTask.structureMergeSubQuestionsUnsupported",
    errorMessage: "选中的小题仅支持拆分，不能参与合并",
  },
  SPLIT_EMPTY: {
    defaultMessage: "This group has no subquestions to split.",
    errorKey: "questionTask.structureSplitEmpty",
    errorMessage: "当前组合题没有可拆分的子题",
  },
  SPLIT_NEEDS_COMBINATION: {
    defaultMessage:
      "Select one group question or subquestions in one group to split.",
    errorKey: "questionTask.structureSplitNeedsCombination",
    errorMessage: "请选择 1 道组合题或同一道组合题内的小题进行拆分",
  },
  SPLIT_SUB_QUESTIONS_ONE_PARENT: {
    defaultMessage: "Select subquestions from one group at a time.",
    errorKey: "questionTask.structureSplitSubQuestionsOneParent",
    errorMessage: "一次只能拆分同一道组合题内的小题",
  },
};

const toQuestionList = (questions) =>
  Array.isArray(questions) ? questions : [];

const isCombinationQuestion = (question) =>
  isCombinationQuestionType(question && question.type);

const isSelectedQuestion = (selectedQuestionIdSet, question) =>
  !!question && selectedQuestionIdSet.has(question.draftId);

export const buildSubQuestionSelectionId = (questionId, subQuestionIndex) =>
  `${questionId}${SUB_QUESTION_SELECTION_SEPARATOR}${subQuestionIndex}`;

export const parseSubQuestionSelectionId = (selectionId) => {
  const id = String(selectionId || "");
  const separatorIndex = id.lastIndexOf(SUB_QUESTION_SELECTION_SEPARATOR);

  if (separatorIndex < 0) {
    return;
  }

  const parentQuestionId = id.slice(0, separatorIndex);
  const subQuestionIndexText = id.slice(
    separatorIndex + SUB_QUESTION_SELECTION_SEPARATOR.length,
  );
  const subQuestionIndex = Number(subQuestionIndexText);

  if (
    !parentQuestionId ||
    !Number.isInteger(subQuestionIndex) ||
    subQuestionIndex < 0
  ) {
    return;
  }

  return {
    parentQuestionId,
    subQuestionIndex,
  };
};

const cloneQuestion = (question) =>
  question ? JSON.parse(JSON.stringify(question)) : {};

const isValidQuestionId = (questionId) => !!questionId;

const getPageKey = (page) => (page && page.pageKey) || "page";

const getQuestionPageIndex = (pages, questionId) =>
  (Array.isArray(pages) ? pages : []).findIndex((page) =>
    toQuestionList(page && page.questions).some(
      (question) => question.draftId === questionId,
    ),
  );

const getQuestionPage = (pages, questionId) =>
  getArrayItem(pages, getQuestionPageIndex(pages, questionId));

const getQuestionPageKey = (pages, questionId) =>
  getPageKey(getQuestionPage(pages, questionId));

const flattenQuestions = (pages) =>
  (Array.isArray(pages) ? pages : []).flatMap((page) =>
    toQuestionList(page && page.questions),
  );

const buildQuestionMap = (pages) =>
  new Map(
    flattenQuestions(pages)
      .filter((question) => question && question.draftId)
      .map((question) => [question.draftId, question]),
  );

const getVisibleOrderedQuestions = (pages, visibleQuestions) => {
  const questionMap = buildQuestionMap(pages);

  return toQuestionList(visibleQuestions)
    .map((question) => questionMap.get(question && question.draftId))
    .filter(Boolean);
};

const getSelectedVisibleQuestions = (pages, visibleQuestions, selectedIds) => {
  const selectedQuestionIdSet = new Set(
    (Array.isArray(selectedIds) ? selectedIds : []).filter((questionId) =>
      isValidQuestionId(questionId),
    ),
  );

  return getVisibleOrderedQuestions(pages, visibleQuestions).filter(
    (question) => isSelectedQuestion(selectedQuestionIdSet, question),
  );
};

const createQuestionSelectionItem = (question) => ({
  question,
  questionId: question && question.draftId,
  selectionId: question && question.draftId,
  selectionType: SELECTION_ITEM_TYPE_QUESTION,
});

const createSubQuestionSelectionItem = ({
  parentQuestion,
  subQuestion,
  subQuestionIndex,
}) => ({
  parentQuestion,
  parentQuestionId: parentQuestion && parentQuestion.draftId,
  question: subQuestion,
  selectionId: buildSubQuestionSelectionId(
    parentQuestion && parentQuestion.draftId,
    subQuestionIndex,
  ),
  selectionType: SELECTION_ITEM_TYPE_SUB_QUESTION,
  subQuestionIndex,
});

const getQuestionSelectionItems = (questions) =>
  toQuestionList(questions).flatMap((question) => [
    createQuestionSelectionItem(question),
    ...toQuestionList(question && question.sonQuestionList).map(
      (subQuestion, subQuestionIndex) =>
        createSubQuestionSelectionItem({
          parentQuestion: question,
          subQuestion,
          subQuestionIndex,
        }),
    ),
  ]);

const normalizeSelectionItems = (items) =>
  toQuestionList(items)
    .map((item) =>
      item && item.selectionType ? item : createQuestionSelectionItem(item),
    )
    .filter((item) => item && item.question);

const isSubQuestionSelectionItem = (item) =>
  item && item.selectionType === SELECTION_ITEM_TYPE_SUB_QUESTION;

const getTopLevelSelectionItems = (items) =>
  normalizeSelectionItems(items).filter(
    (item) => !isSubQuestionSelectionItem(item),
  );

const getSubQuestionSelectionItems = (items) =>
  normalizeSelectionItems(items).filter((item) =>
    isSubQuestionSelectionItem(item),
  );

export const getSelectedQuestionSelectionItems = ({
  pages,
  selectedQuestionIds,
  visibleQuestions,
}) => {
  const selectedQuestionIdSet = new Set(
    (Array.isArray(selectedQuestionIds) ? selectedQuestionIds : []).filter(
      (questionId) => isValidQuestionId(questionId),
    ),
  );
  const visibleOrderedQuestions = Array.isArray(pages)
    ? getVisibleOrderedQuestions(pages, visibleQuestions)
    : toQuestionList(visibleQuestions);

  return getQuestionSelectionItems(visibleOrderedQuestions).filter((item) =>
    selectedQuestionIdSet.has(item.selectionId),
  );
};

const clearTransformedQuestionTaskState = (question) => ({
  ...question,
  aiQualityCheck: undefined,
  analysisTaskErrorMessage: "",
  analysisTaskStatus: undefined,
  qualityCheckResult: undefined,
  qualityCheckTaskErrorMessage: "",
  qualityCheckTaskStatus: undefined,
});

const clearQuestionPositionState = (question) => ({
  ...question,
  displayQuestionNumber: undefined,
  displayQuestionSort: undefined,
  pageIndex: undefined,
  polygon: undefined,
  polygonBounds: undefined,
  posList: [],
  sortOrder: undefined,
  sourceQuestionSort: undefined,
});

const normalizeChildQuestion = ({
  createDraftId,
  createUuid,
  pageKey,
  question,
}) => {
  const clonedQuestion = clearQuestionPositionState(
    clearTransformedQuestionTaskState(cloneQuestion(question)),
  );

  // 题目进入 sonQuestionList 后不再沿用顶层题目的持久化身份，避免保存时出现父子重复引用。
  return {
    ...clonedQuestion,
    deleted: false,
    draftId: createDraftId(`${pageKey}-child`),
    questionId: undefined,
    sonQuestionList: [],
    uuid: createUuid(),
  };
};

const normalizeTopLevelQuestion = ({
  createDraftId,
  createUuid,
  getQuestionTypeLabel,
  page,
  question,
}) => {
  const clonedQuestion = clearQuestionPositionState(
    clearTransformedQuestionTaskState(cloneQuestion(question)),
  );
  const type = Number(clonedQuestion.type) || DEFAULT_QUESTION_TYPE;

  return {
    ...clonedQuestion,
    deleted: false,
    draftId: createDraftId(getPageKey(page)),
    pageIndex: page && page.pageIndex,
    questionId: undefined,
    sonQuestionList: [],
    typeLabel:
      clonedQuestion.typeLabel ||
      (typeof getQuestionTypeLabel === "function"
        ? getQuestionTypeLabel(type)
        : clonedQuestion.typeLabel),
    uuid: createUuid(),
  };
};

const normalizeQuestionContent = (content) =>
  typeof content === "string" ? content.trim() : "";

const mergeSplitQuestionContent = (parentContent, childContent) => {
  const normalizedParentContent = normalizeQuestionContent(parentContent);
  const normalizedChildContent = normalizeQuestionContent(childContent);

  if (!normalizedParentContent) {
    return normalizedChildContent;
  }

  if (!normalizedChildContent) {
    return normalizedParentContent;
  }

  // 拆分后需要把主题干保留到拆出的子题题干里，并显式插入一个空段落作为视觉空行。
  return `${normalizedParentContent}<p><br/></p>${normalizedChildContent}`;
};

const getNumericScore = (question) => {
  const score = Number(question && question.questionScore);

  return Number.isFinite(score) ? score : undefined;
};

const getCombinedQuestionScore = (questions) => {
  const scores = toQuestionList(questions).map((question) =>
    getNumericScore(question),
  );

  return scores.length > 0 && scores.every((score) => score !== undefined)
    ? scores.reduce((total, score) => total + score, 0)
    : "";
};

const getQuestionArrayValue = (value) => (Array.isArray(value) ? value : []);

const getChapterMetadata = (question) => ({
  chapterIds: getQuestionArrayValue(question && question.chapterIds),
  chapterLabels: getQuestionArrayValue(question && question.chapterLabels),
  chapterSelections: getQuestionArrayValue(
    question && question.chapterSelections,
  ),
});

const getKnowledgeMetadata = (question) => ({
  knowledgeIds: getQuestionArrayValue(question && question.knowledgeIds),
  knowledgeLabels: getQuestionArrayValue(question && question.knowledgeLabels),
  knowledgeSelections: getQuestionArrayValue(
    question && question.knowledgeSelections,
  ),
});

const getIndicatorMetadata = (question) => ({
  indicatorIds: getQuestionArrayValue(question && question.indicatorIds),
  indicatorLabels: getQuestionArrayValue(question && question.indicatorLabels),
});

const getBaseQuestionMetadata = (question) => ({
  ...getChapterMetadata(question),
  gradeId: question && question.gradeId,
  ...getIndicatorMetadata(question),
  ...getKnowledgeMetadata(question),
  mathNodeIds: getQuestionArrayValue(question && question.mathNodeIds),
  subjectId: question && question.subjectId,
});

const createCombinationQuestion = ({
  anchorPage,
  childQuestions,
  createDraftId,
  createUuid,
  getQuestionTypeLabel,
}) => {
  const firstChildQuestion = getArrayItem(childQuestions, 0) || {};
  const pageKey = getPageKey(anchorPage);

  return clearTransformedQuestionTaskState({
    analysis: "",
    answer: "",
    content: "",
    deleted: false,
    draftId: createDraftId(pageKey),
    ...getBaseQuestionMetadata(firstChildQuestion),
    optionKnowledgeSelections: [],
    optionList: [],
    pageIndex: anchorPage && anchorPage.pageIndex,
    posList: [],
    questionId: undefined,
    questionLevel:
      Number(firstChildQuestion.questionLevel) || QUESTION_LEVEL_NORMAL,
    questionLevelName: firstChildQuestion.questionLevelName || "",
    questionScore: getCombinedQuestionScore(childQuestions),
    sectionNumber: firstChildQuestion.sectionNumber,
    sectionTitle: firstChildQuestion.sectionTitle || "",
    sonQuestionList: childQuestions,
    type: QUESTION_TYPE_COMBINATION,
    typeLabel:
      typeof getQuestionTypeLabel === "function"
        ? getQuestionTypeLabel(QUESTION_TYPE_COMBINATION)
        : "组合题",
    uuid: createUuid(),
  });
};

const markQuestionDeleted = (question) =>
  question
    ? {
        ...question,
        deleted: true,
      }
    : question;

const replaceQuestion = (pages, questionId, updater) =>
  (Array.isArray(pages) ? pages : []).map((page) => ({
    ...page,
    questions: toQuestionList(page && page.questions).map((question) =>
      question && question.draftId === questionId
        ? updater(question)
        : question,
    ),
  }));

const insertQuestionBefore = (pages, targetQuestionId, insertedQuestions) =>
  (Array.isArray(pages) ? pages : []).map((page) => ({
    ...page,
    questions: toQuestionList(page && page.questions).flatMap((question) =>
      question && question.draftId === targetQuestionId
        ? [...insertedQuestions, question]
        : [question],
    ),
  }));

const applyVisibleQuestionOrder = (pages, orderedQuestionIds) => {
  const orderMap = new Map(
    (Array.isArray(orderedQuestionIds) ? orderedQuestionIds : []).map(
      (questionId, index) => [questionId, index],
    ),
  );

  return (Array.isArray(pages) ? pages : []).map((page) => ({
    ...page,
    questions: toQuestionList(page && page.questions).map((question, index) => {
      const sortOrder = orderMap.get(question && question.draftId);

      return {
        ...question,
        sourceQuestionSort: index,
        ...(sortOrder === undefined || question.deleted ? {} : { sortOrder }),
      };
    }),
  }));
};

const getOrderAfterCreateMerge = ({
  combinationQuestion,
  firstSelectedQuestionId,
  selectedQuestionIdSet,
  visibleOrderedQuestions,
}) =>
  visibleOrderedQuestions.flatMap((question) => {
    if (!selectedQuestionIdSet.has(question.draftId)) {
      return [question.draftId];
    }

    return question.draftId === firstSelectedQuestionId
      ? [combinationQuestion.draftId]
      : [];
  });

const getOrderAfterAppendMerge = ({
  selectedStandaloneQuestionIdSet,
  visibleOrderedQuestions,
}) =>
  visibleOrderedQuestions
    .filter(
      (question) => !selectedStandaloneQuestionIdSet.has(question.draftId),
    )
    .map((question) => question.draftId);

const getOrderAfterSplit = ({
  childQuestions,
  combinationQuestionId,
  keepCombinationQuestion,
  visibleOrderedQuestions,
}) =>
  visibleOrderedQuestions.flatMap((question) =>
    question.draftId === combinationQuestionId
      ? [
          ...childQuestions.map((childQuestion) => childQuestion.draftId),
          ...(keepCombinationQuestion ? [combinationQuestionId] : []),
        ]
      : [question.draftId],
  );

const getMergeValidationError = (selectedItems) => {
  const normalizedSelectedItems = normalizeSelectionItems(selectedItems);

  if (getSubQuestionSelectionItems(normalizedSelectedItems).length > 0) {
    return STRUCTURE_ERROR.MERGE_SUB_QUESTIONS_UNSUPPORTED;
  }

  const selectedQuestions = getTopLevelSelectionItems(
    normalizedSelectedItems,
  ).map((item) => item.question);
  const combinationQuestions = selectedQuestions.filter((question) =>
    isCombinationQuestion(question),
  );
  const standaloneQuestions = selectedQuestions.filter(
    (question) => !isCombinationQuestion(question),
  );

  if (combinationQuestions.length > 1) {
    return STRUCTURE_ERROR.MULTIPLE_COMBINATIONS;
  }

  if (combinationQuestions.length === 1 && standaloneQuestions.length === 0) {
    return STRUCTURE_ERROR.APPEND_NEEDS_STANDALONE;
  }

  if (
    combinationQuestions.length === 0 &&
    standaloneQuestions.length < MIN_CREATE_COMBINATION_QUESTION_COUNT
  ) {
    return STRUCTURE_ERROR.MERGE_NEEDS_STANDALONE;
  }

  return false;
};

export const canMergeQuestionSelection = (questions) =>
  !getMergeValidationError(questions);

const getSplitValidationError = (selectedItems) => {
  const normalizedSelectedItems = normalizeSelectionItems(selectedItems);
  const topLevelItems = getTopLevelSelectionItems(normalizedSelectedItems);
  const subQuestionItems = getSubQuestionSelectionItems(
    normalizedSelectedItems,
  );

  if (
    topLevelItems.length === 1 &&
    subQuestionItems.length === 0 &&
    isCombinationQuestion(getArrayItem(topLevelItems, 0).question)
  ) {
    return false;
  }

  if (topLevelItems.length === 0 && subQuestionItems.length > 0) {
    const parentQuestionIds = new Set(
      subQuestionItems.map((item) => item.parentQuestionId),
    );

    return parentQuestionIds.size === 1
      ? false
      : STRUCTURE_ERROR.SPLIT_SUB_QUESTIONS_ONE_PARENT;
  }

  return STRUCTURE_ERROR.SPLIT_NEEDS_COMBINATION;
};

export const canSplitQuestionSelection = (questions) =>
  !getSplitValidationError(questions);

export const mergeSelectedQuestionsIntoCombination = ({
  createDraftId,
  createUuid,
  getQuestionTypeLabel,
  pages,
  selectedQuestionIds,
  visibleQuestions,
}) => {
  const visibleOrderedQuestions = getVisibleOrderedQuestions(
    pages,
    visibleQuestions,
  );
  const selectedItems = getSelectedQuestionSelectionItems({
    pages,
    selectedQuestionIds,
    visibleQuestions,
  });
  const validationError = getMergeValidationError(selectedItems);

  if (validationError) {
    return {
      ...validationError,
      ok: false,
    };
  }

  const selectedQuestions = getTopLevelSelectionItems(selectedItems).map(
    (item) => item.question,
  );
  const combinationQuestion = selectedQuestions.find((question) =>
    isCombinationQuestion(question),
  );
  const standaloneQuestions = selectedQuestions.filter(
    (question) => !isCombinationQuestion(question),
  );
  const selectedStandaloneQuestionIdSet = new Set(
    standaloneQuestions.map((question) => question.draftId),
  );

  if (combinationQuestion) {
    const combinationPageKey = getQuestionPageKey(
      pages,
      combinationQuestion.draftId,
    );
    const childQuestions = standaloneQuestions.map((question) =>
      normalizeChildQuestion({
        createDraftId,
        createUuid,
        pageKey: getQuestionPageKey(pages, question.draftId),
        question,
      }),
    );
    const pagesWithUpdatedCombination = replaceQuestion(
      pages,
      combinationQuestion.draftId,
      (question) =>
        clearTransformedQuestionTaskState({
          ...question,
          sonQuestionList: [
            ...toQuestionList(question && question.sonQuestionList),
            ...childQuestions,
          ],
        }),
    );
    const pagesWithDeletedSources = pagesWithUpdatedCombination.map((page) => ({
      ...page,
      questions: toQuestionList(page && page.questions).map((question) =>
        selectedStandaloneQuestionIdSet.has(question && question.draftId)
          ? markQuestionDeleted(question)
          : question,
      ),
    }));

    return {
      focusQuestionId: combinationQuestion.draftId,
      mode: "append",
      ok: true,
      pages: applyVisibleQuestionOrder(
        pagesWithDeletedSources,
        getOrderAfterAppendMerge({
          selectedStandaloneQuestionIdSet,
          visibleOrderedQuestions,
        }),
      ),
      pageKey: combinationPageKey,
    };
  }

  const firstSelectedQuestion = getArrayItem(standaloneQuestions, 0);
  const anchorPage = getQuestionPage(pages, firstSelectedQuestion.draftId);
  const selectedQuestionIdSet = new Set(
    standaloneQuestions.map((question) => question.draftId),
  );
  const childQuestions = standaloneQuestions.map((question) =>
    normalizeChildQuestion({
      createDraftId,
      createUuid,
      pageKey: getQuestionPageKey(pages, question.draftId),
      question,
    }),
  );
  const nextCombinationQuestion = createCombinationQuestion({
    anchorPage,
    childQuestions,
    createDraftId,
    createUuid,
    getQuestionTypeLabel,
  });
  const pagesWithCombination = insertQuestionBefore(
    pages,
    firstSelectedQuestion.draftId,
    [nextCombinationQuestion],
  ).map((page) => ({
    ...page,
    questions: toQuestionList(page && page.questions).map((question) =>
      selectedQuestionIdSet.has(question && question.draftId)
        ? markQuestionDeleted(question)
        : question,
    ),
  }));

  return {
    focusQuestionId: nextCombinationQuestion.draftId,
    mode: "create",
    ok: true,
    pages: applyVisibleQuestionOrder(
      pagesWithCombination,
      getOrderAfterCreateMerge({
        combinationQuestion: nextCombinationQuestion,
        firstSelectedQuestionId: firstSelectedQuestion.draftId,
        selectedQuestionIdSet,
        visibleOrderedQuestions,
      }),
    ),
  };
};

export const splitSelectedCombinationQuestion = ({
  createDraftId,
  createUuid,
  getQuestionTypeLabel,
  pages,
  selectedQuestionIds,
  visibleQuestions,
}) => {
  const selectedItems = getSelectedQuestionSelectionItems({
    pages,
    selectedQuestionIds,
    visibleQuestions,
  });
  const validationError = getSplitValidationError(selectedItems);

  if (validationError) {
    return {
      ...validationError,
      ok: false,
    };
  }

  const subQuestionItems = getSubQuestionSelectionItems(selectedItems);
  const topLevelCombinationItem = getArrayItem(
    getTopLevelSelectionItems(selectedItems),
    0,
  );
  const combinationQuestion =
    subQuestionItems.length > 0
      ? getArrayItem(subQuestionItems, 0).parentQuestion
      : topLevelCombinationItem.question;
  const childSourceQuestions = toQuestionList(
    combinationQuestion.sonQuestionList,
  );
  const selectedSubQuestionIndexSet =
    subQuestionItems.length > 0
      ? new Set(subQuestionItems.map((item) => item.subQuestionIndex))
      : false;
  const splitSourceQuestions = selectedSubQuestionIndexSet
    ? childSourceQuestions.filter((childQuestion, childQuestionIndex) => {
        void childQuestion;

        return selectedSubQuestionIndexSet.has(childQuestionIndex);
      })
    : childSourceQuestions;
  const remainingChildQuestions = selectedSubQuestionIndexSet
    ? childSourceQuestions.filter((childQuestion, childQuestionIndex) => {
        void childQuestion;

        return !selectedSubQuestionIndexSet.has(childQuestionIndex);
      })
    : [];

  if (splitSourceQuestions.length === 0) {
    return {
      ...STRUCTURE_ERROR.SPLIT_EMPTY,
      ok: false,
    };
  }

  const anchorPage = getQuestionPage(pages, combinationQuestion.draftId);
  const childQuestions = splitSourceQuestions.map((childQuestion) =>
    normalizeTopLevelQuestion({
      createDraftId,
      createUuid,
      getQuestionTypeLabel,
      page: anchorPage,
      // 子题拆回顶层后沿用原组合题 section，避免拆分后出现新的未分组题目。
      question: {
        ...childQuestion,
        content: mergeSplitQuestionContent(
          combinationQuestion.content,
          childQuestion.content,
        ),
        sectionNumber: combinationQuestion.sectionNumber,
        sectionTitle: combinationQuestion.sectionTitle,
      },
    }),
  );
  const shouldDeleteCombination = remainingChildQuestions.length === 0;
  const visibleOrderedQuestions = getVisibleOrderedQuestions(
    pages,
    visibleQuestions,
  );
  const updateCombinationAfterSplit = (question) => {
    if (!question || question.draftId !== combinationQuestion.draftId) {
      return question;
    }

    if (shouldDeleteCombination) {
      return markQuestionDeleted(question);
    }

    return clearTransformedQuestionTaskState({
      ...question,
      questionScore: getCombinedQuestionScore(remainingChildQuestions),
      sonQuestionList: remainingChildQuestions,
    });
  };
  const pagesWithChildren = insertQuestionBefore(
    pages,
    combinationQuestion.draftId,
    childQuestions,
  ).map((page) => ({
    ...page,
    questions: toQuestionList(page && page.questions).map((question) =>
      updateCombinationAfterSplit(question),
    ),
  }));

  return {
    focusQuestionId: getArrayItem(childQuestions, 0).draftId,
    mode: "split",
    ok: true,
    pages: applyVisibleQuestionOrder(
      pagesWithChildren,
      getOrderAfterSplit({
        childQuestions,
        combinationQuestionId: combinationQuestion.draftId,
        keepCombinationQuestion: !shouldDeleteCombination,
        visibleOrderedQuestions,
      }),
    ),
  };
};

export const getSelectedQuestions = ({
  pages,
  selectedQuestionIds,
  visibleQuestions,
}) => getSelectedVisibleQuestions(pages, visibleQuestions, selectedQuestionIds);
