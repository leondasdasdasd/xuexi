import get from "lodash/get";

import { getQuestionLevelLabel } from "../../../utils/questionDifficulty.js";
import {
  DEFAULT_MANUAL_OPTION_KEYS,
  getArrayItem,
  QUESTION_TYPE_JUDGE,
} from "../domain/questionTaskShared";
import {
  AI_REVIEW_DECISION,
  getAiReviewDecision,
} from "./questionTaskAiDiffModel";

const OPTION_PREFIX_WITH_SEPARATOR_OFFSET = 2;
const OPTION_PREFIX_ONLY_OFFSET = 1;

const buildAiOptionListByText = (question, text) => {
  const sourceOptionMap = new Map(
    (Array.isArray(question?.optionList) ? question.optionList : [])
      .filter((option) => option && option.key)
      .map((option) => [String(option.key).toUpperCase(), option]),
  );

  return String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const firstCharacter = line.slice(0, 1);
      const hasLetterPrefix = /^[A-Za-z]$/.test(firstCharacter);
      const separatorOffset =
        hasLetterPrefix &&
        /^[.:\u3001：]$/.test(
          line.slice(
            OPTION_PREFIX_ONLY_OFFSET,
            OPTION_PREFIX_WITH_SEPARATOR_OFFSET,
          ),
        )
          ? OPTION_PREFIX_WITH_SEPARATOR_OFFSET
          : OPTION_PREFIX_ONLY_OFFSET;
      const optionKey = hasLetterPrefix
        ? firstCharacter.toUpperCase()
        : getArrayItem(DEFAULT_MANUAL_OPTION_KEYS, index) || `${index + 1}`;
      const sourceOption = sourceOptionMap.get(optionKey) || {};
      const answerText = hasLetterPrefix
        ? line.slice(separatorOffset).trim()
        : line;

      return {
        ...sourceOption,
        answers: answerText,
        key: optionKey,
      };
    });
};

const buildAiAnswerPatchValue = (question, patchField, text) => {
  const normalizedText = String(text || "").trim();

  if (patchField === "gapFillingAnswer") {
    return {
      ...question?.gapFillingAnswer,
      answers: normalizedText
        ? normalizedText
            .split(/[;；]+/)
            .map((item) => item.trim())
            .filter(Boolean)
        : [""],
    };
  }

  if (Number(question?.type) === QUESTION_TYPE_JUDGE) {
    if (normalizedText === "正确") {
      return "true";
    }
    if (normalizedText === "错误") {
      return "false";
    }
  }

  return normalizedText;
};

const shouldIncludeAcceptedAiOperation = (operation, reviewDecisions) => {
  if (operation.type === "same") {
    return true;
  }

  const isAccepted =
    getAiReviewDecision(reviewDecisions, operation.reviewId) ===
    AI_REVIEW_DECISION.ACCEPTED;

  return operation.type === "add" ? isAccepted : !isAccepted;
};

const buildAcceptedAiTextValue = (
  operations,
  reviewDecisions,
  index = 0,
  value = "",
) => {
  const normalizedOperations = Array.isArray(operations) ? operations : [];
  const operation = getArrayItem(normalizedOperations, index);

  if (!operation) {
    return value;
  }

  return buildAcceptedAiTextValue(
    normalizedOperations,
    reviewDecisions,
    index + 1,
    shouldIncludeAcceptedAiOperation(operation, reviewDecisions)
      ? `${value}${operation.value}`
      : value,
  );
};

const buildAcceptedAiFieldValue = ({
  item,
  patchField,
  patchValue,
  question,
  reviewDecisions,
  isFullyAccepted,
}) => {
  if (isFullyAccepted) {
    return patchValue;
  }

  if (item.field === "content" || item.field === "analysis") {
    return buildAcceptedAiTextValue(item.diff.operations, reviewDecisions);
  }

  if (item.field === "optionList") {
    return buildAiOptionListByText(
      question,
      buildAcceptedAiTextValue(item.diff.operations, reviewDecisions),
    );
  }

  if (item.field === "answer") {
    return buildAiAnswerPatchValue(
      question,
      patchField,
      buildAcceptedAiTextValue(item.diff.operations, reviewDecisions),
    );
  }

  return patchValue;
};

const hasAcceptedAiChanges = (changeItems, reviewDecisions) =>
  changeItems.filter(
    (changeItem) =>
      getAiReviewDecision(reviewDecisions, changeItem.id) ===
      AI_REVIEW_DECISION.ACCEPTED,
  );

const replaceSubQuestionAtIndex = (subQuestions, subIndex, patchEntry) =>
  (Array.isArray(subQuestions) ? subQuestions : []).map((subQuestion, index) =>
    index === subIndex
      ? Object.assign({}, subQuestion || {}, Object.fromEntries([patchEntry]))
      : subQuestion,
  );

const appendAcceptedQuestionLevelName = (entries, item, patchContainer) =>
  item.field === "questionLevel"
    ? [
        ...entries,
        [
          "questionLevelName",
          patchContainer.questionLevelName ||
            getQuestionLevelLabel(patchContainer.questionLevel),
        ],
      ]
    : entries;

const continueAcceptedAiPatchState = (state) =>
  buildAcceptedAiPatchState({
    ...state,
    index: state.index + 1,
  });

const getAcceptedAiPatchContainers = ({ item, previewPatch, question }) => {
  const isSubQuestionItem = (item.scopeKey || "root") !== "root";

  return {
    isSubQuestionItem,
    patchContainer: isSubQuestionItem
      ? getArrayItem(
          previewPatch && previewPatch.sonQuestionList,
          item.subIndex,
        )
      : previewPatch,
    sourceQuestion: isSubQuestionItem
      ? getArrayItem(question && question.sonQuestionList, item.subIndex)
      : question,
  };
};

const applyAcceptedAiPatchValue = ({
  acceptedChanges,
  changeItems,
  containers,
  item,
  patchField,
  reviewDecisions,
  rootEntries,
  subQuestionList,
}) => {
  const acceptedValue = buildAcceptedAiFieldValue({
    isFullyAccepted: acceptedChanges.length === changeItems.length,
    item,
    patchField,
    patchValue: get(containers.patchContainer, [patchField]),
    question: containers.sourceQuestion,
    reviewDecisions,
  });

  return {
    rootEntries: containers.isSubQuestionItem
      ? rootEntries
      : appendAcceptedQuestionLevelName(
          [...rootEntries, [patchField, acceptedValue]],
          item,
          containers.patchContainer,
        ),
    subQuestionList: containers.isSubQuestionItem
      ? replaceSubQuestionAtIndex(subQuestionList, item.subIndex, [
          patchField,
          acceptedValue,
        ])
      : subQuestionList,
  };
};

const cloneAcceptedSubQuestionList = (question) =>
  JSON.parse(
    JSON.stringify(
      Array.isArray(question && question.sonQuestionList)
        ? question.sonQuestionList
        : [],
    ),
  );

const buildAcceptedAiPatchStateForItem = (state, item) => {
  const changeItems = Array.isArray(item?.diff?.changeItems)
    ? item.diff.changeItems
    : [];
  const acceptedChanges = hasAcceptedAiChanges(
    changeItems,
    state.reviewDecisions,
  );

  if (acceptedChanges.length === 0) {
    return continueAcceptedAiPatchState(state);
  }

  const patchField = item.patchField || item.field;
  const containers = getAcceptedAiPatchContainers({
    item,
    previewPatch: state.previewPatch,
    question: state.question,
  });

  if (
    !containers.patchContainer ||
    !Object.prototype.hasOwnProperty.call(containers.patchContainer, patchField)
  ) {
    return continueAcceptedAiPatchState(state);
  }

  const initialSubQuestionList =
    containers.isSubQuestionItem && !state.subQuestionList
      ? cloneAcceptedSubQuestionList(state.question)
      : state.subQuestionList;
  const nextState = applyAcceptedAiPatchValue({
    acceptedChanges,
    changeItems,
    containers,
    item,
    patchField,
    reviewDecisions: state.reviewDecisions,
    rootEntries: state.rootEntries,
    subQuestionList: initialSubQuestionList,
  });

  return buildAcceptedAiPatchState({
    ...state,
    index: state.index + 1,
    rootEntries: nextState.rootEntries,
    subQuestionList: nextState.subQuestionList,
  });
};

const buildAcceptedAiPatchState = ({
  index = 0,
  previewFields,
  previewPatch,
  question,
  reviewDecisions,
  rootEntries = [],
  subQuestionList,
}) => {
  const item = getArrayItem(previewFields, index);

  if (!item) {
    return { rootEntries, subQuestionList };
  }

  const state = {
    index,
    previewFields,
    previewPatch,
    question,
    reviewDecisions,
    rootEntries,
    subQuestionList,
  };

  return buildAcceptedAiPatchStateForItem(state, item);
};

export const buildAcceptedAiPreviewPatch = ({
  previewFields,
  previewPatch,
  question,
  reviewDecisions,
}) => {
  const state = buildAcceptedAiPatchState({
    previewFields: Array.isArray(previewFields) ? previewFields : [],
    previewPatch,
    question,
    reviewDecisions,
  });
  const rootEntries = state.subQuestionList
    ? [...state.rootEntries, ["sonQuestionList", state.subQuestionList]]
    : state.rootEntries;

  return Object.fromEntries(rootEntries);
};
