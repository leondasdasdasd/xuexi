import {
  cloneQuestionForInsert,
  createQuestionForInsert,
} from "../domain/questionTaskInsertModel";

const MANUAL_DRAFT_ID_RADIX = 36;
const MANUAL_DRAFT_ID_START = 2;
const MANUAL_DRAFT_ID_END = 8;

export const createManualDraftId = (pageKey) =>
  `${pageKey || "page"}-manual-${Date.now()}-${Math.random().toString(MANUAL_DRAFT_ID_RADIX).slice(MANUAL_DRAFT_ID_START, MANUAL_DRAFT_ID_END)}`;

export const clearQuestionQualityCheck = (question) => ({
  ...question,
  aiQualityCheck: undefined,
  qualityCheckResult: undefined,
  qualityCheckTaskErrorMessage: "",
  qualityCheckTaskStatus: undefined,
  sonQuestionList: Array.isArray(question && question.sonQuestionList)
    ? question.sonQuestionList.map((subQuestion) =>
        clearQuestionQualityCheck(subQuestion),
      )
    : [],
});

export const CLEAR_QUESTION_QUALITY_CHECK_PATCH = {
  aiQualityCheck: undefined,
  qualityCheckResult: undefined,
  qualityCheckTaskErrorMessage: "",
  qualityCheckTaskStatus: undefined,
};

export const buildClearQuestionQualityCheckPatch = (event) => {
  void event;

  return {
    ...CLEAR_QUESTION_QUALITY_CHECK_PATCH,
  };
};

const reindexPageQuestions = (questions) =>
  (Array.isArray(questions) ? questions : []).map((question, index) => ({
    ...question,
    sourceQuestionSort: index,
  }));

const collectQuestionIdsFromPages = (
  pages,
  pageIndex = 0,
  questionIds = [],
) => {
  const normalizedPages = Array.isArray(pages) ? pages : [];

  if (pageIndex >= normalizedPages.length) {
    return questionIds;
  }

  const page = normalizedPages[pageIndex];
  const pageQuestionIds = (
    Array.isArray(page && page.questions) ? page.questions : []
  )
    .map((question) => question && question.draftId)
    .filter(Boolean);

  return collectQuestionIdsFromPages(normalizedPages, pageIndex + 1, [
    ...questionIds,
    ...pageQuestionIds,
  ]);
};

const buildQuestionOrderMap = (questionIds) =>
  new Map(
    (Array.isArray(questionIds) ? questionIds : []).map((questionId, index) => [
      questionId,
      index,
    ]),
  );

const cannotReorderQuestionIds = (
  nextQuestionIds,
  draggingQuestionId,
  targetQuestionId,
) =>
  !draggingQuestionId ||
  !targetQuestionId ||
  draggingQuestionId === targetQuestionId ||
  !nextQuestionIds.includes(draggingQuestionId) ||
  !nextQuestionIds.includes(targetQuestionId);

export const reorderQuestionIds = (
  questionIds,
  draggingQuestionId,
  targetQuestionId,
  position = "after",
) => {
  const nextQuestionIds = (
    Array.isArray(questionIds) ? questionIds : []
  ).filter(Boolean);

  if (
    cannotReorderQuestionIds(
      nextQuestionIds,
      draggingQuestionId,
      targetQuestionId,
    )
  ) {
    return nextQuestionIds;
  }

  const filteredQuestionIds = nextQuestionIds.filter(
    (questionId) => questionId !== draggingQuestionId,
  );
  const targetIndex = filteredQuestionIds.indexOf(targetQuestionId);

  if (targetIndex === -1) {
    return nextQuestionIds;
  }

  filteredQuestionIds.splice(
    position === "before" ? targetIndex : targetIndex + 1,
    0,
    draggingQuestionId,
  );

  return filteredQuestionIds;
};

export const applyQuestionOrderToPages = (pages, orderedQuestionIds) => {
  const currentQuestionIds = collectQuestionIdsFromPages(pages);
  const nextOrderedQuestionIds = [
    ...new Set([
      ...(Array.isArray(orderedQuestionIds) ? orderedQuestionIds : []).filter(
        Boolean,
      ),
      ...currentQuestionIds,
    ]),
  ];
  const questionOrderMap = buildQuestionOrderMap(nextOrderedQuestionIds);

  return (Array.isArray(pages) ? pages : []).map((page) => ({
    ...page,
    questions: (Array.isArray(page && page.questions)
      ? page.questions
      : []
    ).map((question, index) => ({
      ...question,
      sortOrder:
        question && question.draftId && questionOrderMap.has(question.draftId)
          ? questionOrderMap.get(question.draftId)
          : Number.isFinite(Number(question && question.sortOrder))
            ? Number(question.sortOrder)
            : index,
    })),
  }));
};

export const applyQuestionPatchItemsToTaskResult = (taskResult, patches) => {
  const patchMap = new Map(
    (Array.isArray(patches) ? patches : [])
      .filter((item) => item && item.draftId && item.patch)
      .map((item) => [item.draftId, item.patch]),
  );

  if (!taskResult || patchMap.size === 0) {
    return taskResult;
  }

  return {
    ...taskResult,
    pages: (Array.isArray(taskResult.pages) ? taskResult.pages : []).map(
      (page) => ({
        ...page,
        questions: (Array.isArray(page.questions) ? page.questions : []).map(
          (question) =>
            patchMap.has(question.draftId)
              ? { ...question, ...patchMap.get(question.draftId) }
              : question,
        ),
      }),
    ),
  };
};

export const findQuestionPage = (pages, questionId) =>
  (Array.isArray(pages) ? pages : []).find((page) =>
    (Array.isArray(page.questions) ? page.questions : []).some(
      (question) => question.draftId === questionId,
    ),
  );

export const buildQuestionOrderAfterInsert = (
  currentQuestionOrder,
  questionId,
  insertedQuestionId,
  position,
) => {
  const targetQuestionIndex = currentQuestionOrder.indexOf(questionId);

  if (targetQuestionIndex === -1) {
    return [...currentQuestionOrder, insertedQuestionId];
  }

  const insertIndex =
    position === "before" ? targetQuestionIndex : targetQuestionIndex + 1;

  return [
    ...currentQuestionOrder.slice(0, insertIndex),
    insertedQuestionId,
    ...currentQuestionOrder.slice(insertIndex),
  ];
};

const buildInsertedQuestion = ({
  anchorQuestion,
  cloneArrayField,
  createUuid,
  getQuestionLevelLabel,
  getQuestionTypeLabel,
  insertedQuestionId,
  isOptionBasedQuestion,
  mode,
  pageIndex,
}) => {
  const baseQuestion =
    mode === "duplicate"
      ? cloneQuestionForInsert({
          createUuid,
          getQuestionTypeLabel,
          question: anchorQuestion,
        })
      : createQuestionForInsert({
          cloneArrayField,
          createUuid,
          getQuestionLevelLabel,
          getQuestionTypeLabel,
          isOptionBasedQuestion,
          question: anchorQuestion,
        });

  return {
    ...baseQuestion,
    draftId: insertedQuestionId,
    pageIndex,
  };
};

const insertQuestionIntoPage = ({
  cloneArrayField,
  createUuid,
  getQuestionLevelLabel,
  getQuestionTypeLabel,
  insertedQuestionId,
  isOptionBasedQuestion,
  mode,
  page,
  position,
  questionId,
}) => {
  const currentQuestions = Array.isArray(page.questions) ? page.questions : [];
  const questionIndex = currentQuestions.findIndex(
    (question) => question.draftId === questionId,
  );

  if (questionIndex === -1) {
    return page;
  }

  const insertIndex = position === "before" ? questionIndex : questionIndex + 1;
  const nextQuestion = buildInsertedQuestion({
    anchorQuestion: currentQuestions[questionIndex],
    cloneArrayField,
    createUuid,
    getQuestionLevelLabel,
    getQuestionTypeLabel,
    insertedQuestionId,
    isOptionBasedQuestion,
    mode,
    pageIndex: page.pageIndex,
  });

  return {
    ...page,
    questions: reindexPageQuestions([
      ...currentQuestions.slice(0, insertIndex),
      nextQuestion,
      ...currentQuestions.slice(insertIndex),
    ]),
  };
};

export const insertQuestionIntoTaskResult = ({
  cloneArrayField,
  createUuid,
  getQuestionLevelLabel,
  getQuestionTypeLabel,
  insertedQuestionId,
  isOptionBasedQuestion,
  mode,
  nextQuestionOrder,
  position,
  previousTaskResult,
  questionId,
}) => ({
  ...previousTaskResult,
  pages: applyQuestionOrderToPages(
    previousTaskResult.pages.map((page) =>
      insertQuestionIntoPage({
        cloneArrayField,
        createUuid,
        getQuestionLevelLabel,
        getQuestionTypeLabel,
        insertedQuestionId,
        isOptionBasedQuestion,
        mode,
        page,
        position,
        questionId,
      }),
    ),
    nextQuestionOrder,
  ),
});
