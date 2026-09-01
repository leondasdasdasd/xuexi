import get from "lodash/get";
import set from "lodash/set";

import {
  buildBlankAnswerDraftGroups,
  buildQuestionEditorDraft,
  getSubQuestionScoreSumText,
  isEditableTarget,
} from "./pageEditorData";

export const MIN_BLANK_COUNT = 1;
export const DUAL_COLUMN_COUNT = 2;

export const getArrayItem = (items, index) =>
  (Array.isArray(items) ? items : []).slice(index, index + 1).shift();

export const getDraftById = (draftMap, draftId) => get(draftMap, [draftId]);

export const setDraftById = (draftMap, draftId, draft) =>
  set({ ...draftMap }, [draftId], draft);

export const setDraftFieldValue = (draft, field, value) =>
  set({ ...draft }, [field], value);

export const getBlankCountByKey = (blankCountMap, blankKey) =>
  get(blankCountMap, [blankKey]) || MIN_BLANK_COUNT;

export const setBlankCountByKey = (blankCountMap, blankKey, value) =>
  set({ ...blankCountMap }, [blankKey], value);

export const getQuestionDraftForEdit = (draftMap, question) =>
  getDraftById(draftMap, question.draftId) ||
  buildQuestionEditorDraft(question);

export const replaceSubQuestionDraft = (
  subQuestionDrafts,
  subQuestionIndex,
  patch,
) =>
  (Array.isArray(subQuestionDrafts) ? subQuestionDrafts : []).map(
    (subQuestionDraft, currentIndex) =>
      currentIndex === subQuestionIndex
        ? {
            ...subQuestionDraft,
            ...patch,
          }
        : subQuestionDraft,
  );

export const buildCombinationDraftWithScoreSum = (
  questionDraft,
  subQuestionDrafts,
) => ({
  ...questionDraft,
  scoreText: getSubQuestionScoreSumText(subQuestionDrafts),
  subQuestionDrafts,
});

export const getSubQuestionDraft = (
  questionDraft,
  subQuestion,
  subQuestionIndex,
) =>
  getArrayItem(
    questionDraft && questionDraft.subQuestionDrafts,
    subQuestionIndex,
  ) || buildQuestionEditorDraft(subQuestion);

export const getDraftAnswerText = (draft, subQuestionIndex) =>
  Number.isFinite(Number(subQuestionIndex))
    ? (getArrayItem((draft || {}).subQuestionDrafts, subQuestionIndex) || {})
        .answerText
    : (draft || {}).answerText;

export const removeAnswerAtIndex = (answers, answerIndex) =>
  answers.filter((item, currentIndex) => {
    void item;
    return currentIndex !== answerIndex;
  });

export const getDraftBlankAnswerGroups = (draft, subQuestionIndex) =>
  Number.isFinite(Number(subQuestionIndex))
    ? (getArrayItem((draft || {}).subQuestionDrafts, subQuestionIndex) || {})
        .blankAnswerGroups || buildBlankAnswerDraftGroups()
    : (draft || {}).blankAnswerGroups || buildBlankAnswerDraftGroups();

export const buildDraftWithAnswerText = (
  draft,
  subQuestionIndex,
  answerText,
) => {
  if (Number.isFinite(Number(subQuestionIndex))) {
    return {
      ...draft,
      subQuestionDrafts: replaceSubQuestionDraft(
        draft && draft.subQuestionDrafts,
        subQuestionIndex,
        { answerText },
      ),
    };
  }

  return {
    ...draft,
    answerText,
  };
};

export const buildDraftWithBlankAnswerGroups = (
  draft,
  subQuestionIndex,
  blankAnswerGroups,
) => {
  if (Number.isFinite(Number(subQuestionIndex))) {
    return {
      ...draft,
      subQuestionDrafts: replaceSubQuestionDraft(
        draft && draft.subQuestionDrafts,
        subQuestionIndex,
        { blankAnswerGroups },
      ),
    };
  }

  return {
    ...draft,
    blankAnswerGroups,
  };
};

export const getQuestionSelectHandler =
  (onQuestionSelect, draftId) => (event) => {
    if (isEditableTarget(event.target)) {
      return;
    }

    onQuestionSelect(draftId, "result");
  };

export const getQuestionSelectKeyDownHandler =
  (onQuestionSelect, draftId) => (event) => {
    if (isEditableTarget(event.target)) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onQuestionSelect(draftId, "result");
    }
  };

export const countAnswerSections = (sections, index = 0, totalCount = 0) => {
  if (index >= sections.length) {
    return totalCount;
  }

  const section = getArrayItem(sections, index) || {};
  return countAnswerSections(
    sections,
    index + 1,
    totalCount + section.totalCount,
  );
};

export const buildSectionScoreDraftMap = (
  currentDraftMap,
  sectionQuestions,
  value,
  index = 0,
) => {
  const normalizedQuestions = Array.isArray(sectionQuestions)
    ? sectionQuestions
    : [];

  if (index >= normalizedQuestions.length) {
    return currentDraftMap;
  }

  const question = getArrayItem(normalizedQuestions, index);
  const nextDraftMap = setDraftById(currentDraftMap, question.draftId, {
    ...getQuestionDraftForEdit(currentDraftMap, question),
    scoreText: value,
  });

  return buildSectionScoreDraftMap(
    nextDraftMap,
    normalizedQuestions,
    value,
    index + 1,
  );
};
