import { isAiTaskRunningStatus } from "../domain/questionTaskShared";

export const isQuestionAiTaskRunning = (question) =>
  !!question &&
  (isAiTaskRunningStatus(question.analysisTaskStatus) ||
    isAiTaskRunningStatus(question.qualityCheckTaskStatus));

export const collectRunningQuestionUuids = (questions, statusField) =>
  (Array.isArray(questions) ? questions : [])
    .filter((question) =>
      isAiTaskRunningStatus(question && question[statusField]),
    )
    .map((question) => question.uuid)
    .filter(Boolean);

export const collectRunningQuestionIds = (questions) =>
  (Array.isArray(questions) ? questions : [])
    .filter((question) => isQuestionAiTaskRunning(question))
    .map((question) => question.draftId)
    .filter(Boolean);
