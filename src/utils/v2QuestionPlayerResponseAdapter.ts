import type { QuestionPlayerResponse } from "@yungu-fed/question-editor";

import type { StudentExamSubmissionAnswerDto } from "../services/explicitExam.types";
import { trans } from "./i18n";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isRichContentValue = (value: unknown): boolean =>
  isRecord(value) &&
  typeof value.html === "string" &&
  Array.isArray(value.json) &&
  typeof value.text === "string";

export const isQuestionPlayerResponseItem = (
  value: unknown,
): value is QuestionPlayerResponse["elementAnswers"][number] => {
  if (
    !isRecord(value) ||
    typeof value.type !== "string" ||
    !Object.prototype.hasOwnProperty.call(value, "answers")
  )
    return false;
  if (value.type !== "fill") return true;
  return (
    Array.isArray(value.answers) &&
    value.answers.every(
      (answer) =>
        isRecord(answer) &&
        typeof answer.blankId === "string" &&
        isRichContentValue(answer.content),
    )
  );
};

const isStudentExamAnswer = (
  value: unknown,
): value is StudentExamSubmissionAnswerDto =>
  isRecord(value) &&
  Number.isSafeInteger(value.id) &&
  Number.isSafeInteger(value.businessQuestionTypeId) &&
  value.version === "1" &&
  Array.isArray(value.elementAnswers) &&
  value.elementAnswers.every((item) => isQuestionPlayerResponseItem(item)) &&
  Array.isArray(value.children) &&
  value.children.every((child) => isStudentExamAnswer(child));

const hasMatchingChildIdentities = (
  answer: StudentExamSubmissionAnswerDto,
  empty: QuestionPlayerResponse,
) =>
  answer.children.map((child) => child.id).join(",") ===
  empty.children.map((child) => child.id).join(",");

export const mapV2AnswerJsonToQuestionPlayerResponse = (
  answerJson: string | null | undefined,
  empty: QuestionPlayerResponse,
): QuestionPlayerResponse => {
  if (!answerJson) return empty;
  let parsed: unknown;
  try {
    parsed = JSON.parse(answerJson) as unknown;
  } catch {
    throw new Error(
      trans("explicitExam.invalidResultAnswer", "V2 答题结果数据不完整"),
    );
  }
  if (
    !isStudentExamAnswer(parsed) ||
    parsed.id !== empty.id ||
    parsed.businessQuestionTypeId !== Number(empty.questionTypeKey) ||
    !hasMatchingChildIdentities(parsed, empty)
  ) {
    throw new Error(
      trans("explicitExam.invalidResultAnswer", "V2 答题结果数据不完整"),
    );
  }
  return {
    ...empty,
    elementAnswers: parsed.elementAnswers,
  };
};
