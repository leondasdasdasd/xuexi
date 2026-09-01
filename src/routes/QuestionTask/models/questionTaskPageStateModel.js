import { trans } from "../../../utils/i18n";
import { buildSubQuestionSelectionId } from "../domain/questionTaskStructure";
import { getArrayItem } from "../domain/questionTaskShared";

const DATE_PAD_LENGTH = 2;
const SAVED_AT_FIELD_KEYS = [
  "lastSavedAt",
  "updateTime",
  "updatedAt",
  "saveTime",
  "gmtModified",
  "modifiedTime",
  "modifyTime",
  "modifiedAt",
];

const padDatePart = (number) => String(number).padStart(DATE_PAD_LENGTH, "0");

export const areStringArraysEqual = (left, right) =>
  Array.isArray(left) &&
  Array.isArray(right) &&
  left.length === right.length &&
  left.every((item, index) => item === getArrayItem(right, index));

export const getQuestionMapItem = (questionMap, questionId) =>
  questionMap && questionId ? questionMap[questionId] : undefined;

export const resolveSavedAtValue = (value) => {
  if (!value) {
    return "";
  }

  if (typeof value === "object") {
    return SAVED_AT_FIELD_KEYS.map((key) => value[key]).find(Boolean) || "";
  }

  return value;
};

export const formatSavedAt = (value) => {
  if (!value) {
    return trans("questionTask.notSaved", "未保存");
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return trans("questionTask.notSaved", "未保存");
  }

  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())} ${padDatePart(
    date.getHours(),
  )}:${padDatePart(date.getMinutes())}:${padDatePart(date.getSeconds())}`;
};

export const getTaskAnswerFileUrl = (taskResult) => {
  if (!taskResult) {
    return "";
  }

  const directUrl = [
    taskResult.answerFileUrl,
    taskResult.examAnswerFileUrl,
    taskResult.answerPreviewUrl,
    taskResult.examAnswerPreviewUrl,
  ].find(Boolean);

  if (directUrl) {
    return directUrl;
  }

  const fileId = [
    taskResult.answerFileId,
    taskResult.examAnswerFileId,
    taskResult.answerUploadFileId,
    taskResult.examAnswerUploadFileId,
  ].find(Boolean);

  return fileId
    ? `${window.location.origin}/api/preview_file?id=${fileId}`
    : "";
};

export const buildSelectableQuestionIdSet = ({
  runningQuestionIdSet,
  visibleQuestions,
}) =>
  new Set(
    (Array.isArray(visibleQuestions) ? visibleQuestions : []).flatMap(
      (question) => {
        if (!question || runningQuestionIdSet.has(question.draftId)) {
          return [];
        }

        const subQuestionSelectionIds = Array.isArray(question.sonQuestionList)
          ? question.sonQuestionList.map((subQuestion, subQuestionIndex) => {
              void subQuestion;

              return buildSubQuestionSelectionId(
                question.draftId,
                subQuestionIndex,
              );
            })
          : [];

        return [question.draftId, ...subQuestionSelectionIds];
      },
    ),
  );
