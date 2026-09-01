import get from "lodash/get";

import { getQuestionLevelLabel } from "../../../utils/questionDifficulty.js";
import {
  DEFAULT_MANUAL_OPTION_KEYS,
  getArrayItem,
  QUESTION_TYPE_BLANK,
  QUESTION_TYPE_JUDGE,
} from "../domain/questionTaskShared";
import {
  getQuestionAnswerText,
  stripQuestionText,
} from "../domain/questionTaskViewModel";

const DIFF_TOKEN_PATTERN = /[\u4E00-\u9FFF]|\w+|\r?\n|[\t ]+|\S/g;

export const AI_REVIEW_DECISION = {
  ACCEPTED: "accepted",
  PENDING: "pending",
  REJECTED: "rejected",
};

const tokenizeDiffText = (value) =>
  String(value || "").match(DIFF_TOKEN_PATTERN) || [];

const getBoundaryPrefixLength = (beforeTokens, afterTokens, index = 0) =>
  index < beforeTokens.length &&
  index < afterTokens.length &&
  getArrayItem(beforeTokens, index) === getArrayItem(afterTokens, index)
    ? getBoundaryPrefixLength(beforeTokens, afterTokens, index + 1)
    : index;

const getBoundarySuffixIndexes = (
  beforeTokens,
  afterTokens,
  prefixLength,
  beforeIndex = beforeTokens.length - 1,
  afterIndex = afterTokens.length - 1,
) =>
  beforeIndex >= prefixLength &&
  afterIndex >= prefixLength &&
  getArrayItem(beforeTokens, beforeIndex) ===
    getArrayItem(afterTokens, afterIndex)
    ? getBoundarySuffixIndexes(
        beforeTokens,
        afterTokens,
        prefixLength,
        beforeIndex - 1,
        afterIndex - 1,
      )
    : { afterIndex, beforeIndex };

const buildBoundaryDiffOperations = (beforeTokens, afterTokens) => {
  const prefixLength = getBoundaryPrefixLength(beforeTokens, afterTokens);
  const suffixIndexes = getBoundarySuffixIndexes(
    beforeTokens,
    afterTokens,
    prefixLength,
  );

  return [
    {
      type: "same",
      value: beforeTokens.slice(0, prefixLength).join(""),
    },
    {
      type: "remove",
      value:
        suffixIndexes.beforeIndex >= prefixLength
          ? beforeTokens
              .slice(prefixLength, suffixIndexes.beforeIndex + 1)
              .join("")
          : "",
    },
    {
      type: "add",
      value:
        suffixIndexes.afterIndex >= prefixLength
          ? afterTokens
              .slice(prefixLength, suffixIndexes.afterIndex + 1)
              .join("")
          : "",
    },
    {
      type: "same",
      value:
        suffixIndexes.beforeIndex < beforeTokens.length - 1
          ? beforeTokens.slice(suffixIndexes.beforeIndex + 1).join("")
          : "",
    },
  ].filter((operation) => operation.value);
};

const buildDiffOperations = (beforeText, afterText) => {
  const beforeTokens = tokenizeDiffText(beforeText);
  const afterTokens = tokenizeDiffText(afterText);

  if (beforeTokens.length === 0 && afterTokens.length === 0) {
    return [];
  }

  if (beforeText === afterText) {
    return [{ type: "same", value: beforeText }];
  }

  return buildBoundaryDiffOperations(beforeTokens, afterTokens);
};

const appendSameDiffOperation = (operation, state) => ({
  ...state,
  afterSegments: [
    ...state.afterSegments,
    { type: "same", value: operation.value },
  ],
  beforeSegments: [
    ...state.beforeSegments,
    { type: "same", value: operation.value },
  ],
  normalizedOperations: [
    ...state.normalizedOperations,
    { type: "same", value: operation.value },
  ],
});

const appendChangeDiffOperation = (operation, reviewId, state) => {
  if (operation.type === "remove") {
    return {
      ...state,
      beforeSegments: [
        ...state.beforeSegments,
        { reviewId, type: "remove", value: operation.value },
      ],
      beforeValue: `${state.beforeValue}${operation.value}`,
      normalizedOperations: [
        ...state.normalizedOperations,
        { reviewId, type: "remove", value: operation.value },
      ],
    };
  }

  if (operation.type === "add") {
    return {
      ...state,
      afterSegments: [
        ...state.afterSegments,
        { reviewId, type: "add", value: operation.value },
      ],
      afterValue: `${state.afterValue}${operation.value}`,
      normalizedOperations: [
        ...state.normalizedOperations,
        { reviewId, type: "add", value: operation.value },
      ],
    };
  }

  return state;
};

const collectDiffChangeGroup = (
  operations,
  operationIndex,
  reviewId,
  state,
) => {
  const operation = getArrayItem(operations, operationIndex);

  if (!operation || operation.type === "same") {
    return {
      operationIndex,
      state,
    };
  }

  return collectDiffChangeGroup(
    operations,
    operationIndex + 1,
    reviewId,
    appendChangeDiffOperation(operation, reviewId, state),
  );
};

const buildTextDiffState = (
  operations,
  reviewIdPrefix,
  operationIndex,
  state,
) => {
  const operation = getArrayItem(operations, operationIndex);

  if (!operation) {
    return state;
  }

  if (operation.type === "same") {
    return buildTextDiffState(
      operations,
      reviewIdPrefix,
      operationIndex + 1,
      appendSameDiffOperation(operation, state),
    );
  }

  const nextReviewIndex = state.reviewIndex + 1;
  const reviewId = `${reviewIdPrefix}-${nextReviewIndex}`;
  const groupResult = collectDiffChangeGroup(
    operations,
    operationIndex,
    reviewId,
    {
      afterSegments: state.afterSegments,
      afterValue: "",
      beforeSegments: state.beforeSegments,
      beforeValue: "",
      normalizedOperations: state.normalizedOperations,
    },
  );
  const nextChangeItem = {
    afterValue: groupResult.state.afterValue,
    beforeValue: groupResult.state.beforeValue,
    hasAddition: !!String(groupResult.state.afterValue || "").trim(),
    hasRemoval: !!String(groupResult.state.beforeValue || "").trim(),
    id: reviewId,
  };

  return buildTextDiffState(
    operations,
    reviewIdPrefix,
    groupResult.operationIndex,
    {
      afterSegments: groupResult.state.afterSegments,
      beforeSegments: groupResult.state.beforeSegments,
      changeItems: [...state.changeItems, nextChangeItem],
      normalizedOperations: groupResult.state.normalizedOperations,
      reviewIndex: nextReviewIndex,
    },
  );
};

export const buildTextDiffResult = (
  beforeText,
  afterText,
  reviewIdPrefix = "single-ai",
) => {
  const operations = buildDiffOperations(beforeText, afterText);
  const state = buildTextDiffState(operations, reviewIdPrefix, 0, {
    afterSegments: [],
    beforeSegments: [],
    changeItems: [],
    normalizedOperations: [],
    reviewIndex: 0,
  });

  return {
    addedCount: state.changeItems.filter((item) => item.hasAddition).length,
    afterSegments: state.afterSegments,
    beforeSegments: state.beforeSegments,
    changeItems: state.changeItems,
    operations: state.normalizedOperations,
    removedCount: state.changeItems.filter((item) => item.hasRemoval).length,
  };
};

export const getAiReviewDecision = (reviewDecisions, reviewId) =>
  get(reviewDecisions, [reviewId]) || AI_REVIEW_DECISION.PENDING;

export const getAiReviewItemByField = (
  previewFields,
  field,
  scopeKey = "root",
) =>
  (Array.isArray(previewFields) ? previewFields : []).find(
    (item) => item.field === field && (item.scopeKey || "root") === scopeKey,
  );

const getAiPreviewCustomFieldText = (question, field) =>
  stripQuestionText(get(question, [field]));

const getAiPreviewOptionListText = (question) =>
  (Array.isArray(question.optionList) ? question.optionList : [])
    .map((option, optionIndex) => {
      const optionKey =
        (option && option.key) ||
        getArrayItem(DEFAULT_MANUAL_OPTION_KEYS, optionIndex) ||
        `${optionIndex + 1}`;
      return `${optionKey}. ${stripQuestionText(option && option.answers) || "-"}`;
    })
    .join("\n");

const AI_PREVIEW_FIELD_TEXT_READERS = new Map([
  ["analysis", (question) => stripQuestionText(question.analysis)],
  ["answer", (question) => stripQuestionText(getQuestionAnswerText(question))],
  ["content", (question) => stripQuestionText(question.content)],
  ["optionList", getAiPreviewOptionListText],
  [
    "questionLevel",
    (question) =>
      question.questionLevelName ||
      getQuestionLevelLabel(question.questionLevel) ||
      "",
  ],
]);

export const getAiPreviewFieldText = (question, field) => {
  if (!question) {
    return "";
  }

  const fieldReader = AI_PREVIEW_FIELD_TEXT_READERS.get(field);
  return fieldReader
    ? fieldReader(question)
    : getAiPreviewCustomFieldText(question, field);
};

export const getAiReviewItems = (previewFields) =>
  (Array.isArray(previewFields) ? previewFields : []).flatMap((item) =>
    Array.isArray(item?.diff?.changeItems)
      ? item.diff.changeItems.map((changeItem) => ({
          ...changeItem,
          field: item.field,
          patchField: item.patchField,
          scopeKey: item.scopeKey || "root",
          subIndex: item.subIndex,
        }))
      : [],
  );

export const getFirstAiReviewId = (previewFields) => {
  const firstReviewItem = getAiReviewItems(previewFields)[0];
  return firstReviewItem ? firstReviewItem.id : "";
};

export const buildAiPreviewSummary = (previewFields, reviewDecisions) => {
  const reviewItems = getAiReviewItems(previewFields);

  return {
    addedCount: reviewItems.filter((item) => item.hasAddition).length,
    pendingCount: reviewItems.filter(
      (item) =>
        getAiReviewDecision(reviewDecisions, item.id) ===
        AI_REVIEW_DECISION.PENDING,
    ).length,
    removedCount: reviewItems.filter((item) => item.hasRemoval).length,
    totalCount: reviewItems.length,
  };
};

export const buildAiPreviewQuestion = (question, patch) => {
  if (!question) {
    return;
  }

  if (!patch || Object.keys(patch).length === 0) {
    return question;
  }

  const nextQuestion = { ...question, ...patch };

  if (
    Object.prototype.hasOwnProperty.call(patch, "questionLevel") &&
    !Object.prototype.hasOwnProperty.call(patch, "questionLevelName")
  ) {
    nextQuestion.questionLevelName = getQuestionLevelLabel(patch.questionLevel);
  }

  if (Array.isArray(nextQuestion.sonQuestionList)) {
    nextQuestion.sonQuestionList = nextQuestion.sonQuestionList.map(
      (subQuestion) => {
        if (
          subQuestion &&
          Object.prototype.hasOwnProperty.call(subQuestion, "questionLevel") &&
          !Object.prototype.hasOwnProperty.call(
            subQuestion,
            "questionLevelName",
          )
        ) {
          return {
            ...subQuestion,
            questionLevelName: getQuestionLevelLabel(subQuestion.questionLevel),
          };
        }

        return subQuestion;
      },
    );
  }

  return nextQuestion;
};

const getQuestionFieldSourceValue = (field, sourceQuestion) => {
  if (field === "answer") {
    if (Number(sourceQuestion && sourceQuestion.type) === QUESTION_TYPE_BLANK) {
      return sourceQuestion && sourceQuestion.gapFillingAnswer;
    }

    return sourceQuestion && sourceQuestion.answer;
  }

  return get(sourceQuestion, [field]);
};

const getBlankAnswerDiffText = (value) =>
  Array.isArray(value && value.answers)
    ? value.answers
        .map((item) => String(item || "").trim())
        .filter(Boolean)
        .join("；")
    : "";

const getJudgeAnswerDiffText = (value) => {
  if (value === true || value === "true") {
    return "正确";
  }
  if (value === false || value === "false") {
    return "错误";
  }
  return stripQuestionText(value);
};

const getAnswerDiffText = (value, sourceQuestion) => {
  const questionType = Number(sourceQuestion && sourceQuestion.type);

  if (questionType === QUESTION_TYPE_BLANK) {
    return getBlankAnswerDiffText(value);
  }

  return questionType === QUESTION_TYPE_JUDGE
    ? getJudgeAnswerDiffText(value)
    : stripQuestionText(value);
};

const QUESTION_DIFF_DISPLAY_READERS = new Map([
  ["analysis", (value) => stripQuestionText(value)],
  ["answer", getAnswerDiffText],
  ["content", (value) => stripQuestionText(value)],
  [
    "optionList",
    (value) => getAiPreviewFieldText({ optionList: value }, "optionList"),
  ],
  ["questionLevel", (value) => getQuestionLevelLabel(value) || ""],
]);

const getQuestionDiffDisplayText = (field, value, sourceQuestion) => {
  const displayReader = QUESTION_DIFF_DISPLAY_READERS.get(field);
  return displayReader
    ? displayReader(value, sourceQuestion)
    : stripQuestionText(value);
};

const buildRootQuestionPatchSource = (patch) =>
  Object.fromEntries(
    Object.keys(patch || {})
      .filter((field) => field !== "sonQuestionList")
      .map((field) => [field, get(patch, [field])]),
  );

export const buildQuestionDiffPreviewItems = (question, patch) => {
  if (!question || !patch || Object.keys(patch).length === 0) {
    return [];
  }

  const supportedFields = new Set([
    "content",
    "optionList",
    "answer",
    "analysis",
    "questionLevel",
  ]);

  const buildPreviewItemsForQuestion = ({
    nextQuestion,
    patchSource,
    reviewIdPrefix,
    scopeKey = "root",
    sourceQuestion,
    subIndex,
  }) =>
    Object.keys(patchSource || {})
      .map((field) => (field === "gapFillingAnswer" ? "answer" : field))
      .filter((field) => supportedFields.has(field))
      .filter(
        (field, fieldIndex, fields) => fields.indexOf(field) === fieldIndex,
      )
      .map((field) => {
        const patchField =
          field === "answer" &&
          Object.prototype.hasOwnProperty.call(patchSource, "gapFillingAnswer")
            ? "gapFillingAnswer"
            : field;
        const before = getQuestionDiffDisplayText(
          field,
          getQuestionFieldSourceValue(field, sourceQuestion),
          sourceQuestion,
        );
        const after = getQuestionDiffDisplayText(
          field,
          getQuestionFieldSourceValue(field, nextQuestion),
          nextQuestion,
        );

        return {
          after,
          before,
          diff: buildTextDiffResult(
            before,
            after,
            `${reviewIdPrefix}-${field}`,
          ),
          field,
          patchField,
          scopeKey,
          subIndex,
        };
      })
      .filter((item) => item.before !== item.after);

  const previewItems = buildPreviewItemsForQuestion({
    nextQuestion: buildAiPreviewQuestion(question, patch),
    patchSource: buildRootQuestionPatchSource(patch),
    reviewIdPrefix: "single-ai-root",
    sourceQuestion: question,
  });

  if (Array.isArray(patch.sonQuestionList)) {
    const sourceSubQuestions = Array.isArray(question.sonQuestionList)
      ? question.sonQuestionList
      : [];

    previewItems.push(
      ...patch.sonQuestionList.flatMap((nextSubQuestion, subIndex) => {
        const sourceSubQuestion = getArrayItem(sourceSubQuestions, subIndex);

        return sourceSubQuestion && nextSubQuestion
          ? buildPreviewItemsForQuestion({
              nextQuestion: nextSubQuestion,
              patchSource: nextSubQuestion,
              reviewIdPrefix: `single-ai-sub-${subIndex}`,
              scopeKey: `sub-${subIndex}`,
              sourceQuestion: sourceSubQuestion,
              subIndex,
            })
          : [];
      }),
    );
  }

  return previewItems;
};
