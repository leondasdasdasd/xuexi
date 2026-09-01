import type { QuestionPlayerResponse } from "@yungu-fed/question-editor";

import { isQuestionPlayerResponseItem } from "../../utils/v2QuestionPlayerResponseAdapter";
import {
  mapExamPaperModules,
  mapExamPlacementTree,
  selectExamPaperPlacements,
} from "./examPaperView";
import type { ExamPaperView, ExamPlacementView } from "./types";

type StudentExamPlacementAnswerDraft = {
  placementId: string;
  response: QuestionPlayerResponse;
};

export type StudentExamAnswerDraft = {
  answers: StudentExamPlacementAnswerDraft[];
  version: 1;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isQuestionPlayerResponse = (
  value: unknown,
): value is QuestionPlayerResponse =>
  isRecord(value) &&
  value.version === "1" &&
  Array.isArray(value.children) &&
  Array.isArray(value.elementAnswers) &&
  value.elementAnswers.every((item) => isQuestionPlayerResponseItem(item));

export const createStudentExamAnswerDraftKey = (
  examId: number,
  taskPublishId: number,
) => `v2-exam-draft:${examId}:${taskPublishId}`;

export const parseStudentExamAnswerDraftStorageValue = (
  value: string,
): StudentExamAnswerDraft | null => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return null;
  }
  if (
    !isRecord(parsed) ||
    parsed.version !== 1 ||
    !Array.isArray(parsed.answers)
  )
    return null;

  const answers = parsed.answers.flatMap((answer) => {
    if (
      !isRecord(answer) ||
      typeof answer.placementId !== "string" ||
      answer.placementId.length === 0 ||
      !isQuestionPlayerResponse(answer.response)
    ) {
      return [];
    }
    return [
      {
        placementId: answer.placementId,
        response: answer.response,
      },
    ];
  });
  return answers.length === parsed.answers.length
    ? { answers, version: 1 }
    : null;
};

export const mapExamPaperViewToStudentExamAnswerDraft = (
  paper: ExamPaperView,
): StudentExamAnswerDraft => {
  const answers: StudentExamPlacementAnswerDraft[] = [];
  const collectPlacementAnswer = (placement: ExamPlacementView) => {
    answers.push({
      placementId: placement.placementId,
      response: placement.response,
    });
    for (const child of placement.children) collectPlacementAnswer(child);
  };
  for (const placement of selectExamPaperPlacements(paper))
    collectPlacementAnswer(placement);
  return { answers, version: 1 };
};

export const mergeStudentExamAnswerDraftIntoExamPaperView = (
  paper: ExamPaperView,
  draft: StudentExamAnswerDraft,
): ExamPaperView => {
  const responseByPlacementId = new Map(
    draft.answers.map((answer) => [answer.placementId, answer.response]),
  );
  const mergePlacement = (placement: ExamPlacementView): ExamPlacementView =>
    mapExamPlacementTree(placement, (current) => {
      const response =
        responseByPlacementId.get(current.placementId) || current.response;
      return {
        ...current,
        response: {
          ...response,
          // 子题关系始终取服务器试卷，只按稳定题位 ID 恢复答案。
          children: current.children.map((child) => child.response),
        },
      };
    });
  return {
    ...paper,
    modules: mapExamPaperModules(paper, mergePlacement),
  };
};
