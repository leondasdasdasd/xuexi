import type {
  QuestionContentDraft,
  QuestionContentQuestionTypeTemplate,
  QuestionContentSerializedDraft,
  QuestionPlayerResponse,
} from "@yungu-fed/question-editor";
import {
  createEmptyQuestionPlayerResponse,
  createQuestionPreviewDraft,
} from "@yungu-fed/question-editor";

import { requireExamPaperQuestionTypeSnapshots } from "../../services/examPaperQuestionTypeSnapshots";
import type { ExamPaperQuestionResponse } from "../../services/examPaperV2.types";
import type {
  TeacherMarkingQuestionDto,
  TeacherStudentResultDto,
} from "../../services/explicitExam.types";
import type { V2MarkingSheet } from "../../services/v2OnlineMarking";
import { createQuestionContentSerializedDraftFromV2Question } from "../../utils/questionContentV2EditorAdapter";
import { createQuestionEditorQuestionTypeTemplates } from "../../utils/questionTypeEditorAdapter";
import { mapV2AnswerJsonToQuestionPlayerResponse } from "../../utils/v2QuestionPlayerResponseAdapter";

export type V2CorrectionQuestion = {
  content: QuestionContentDraft;
  isCorrect: number | null;
  questionId: number;
  questionScore: number;
  questionSerialNumber: string;
  response: QuestionPlayerResponse;
  resultId: number;
  studentScore: number | null;
  tags: number[];
  teacherAnnotation: string | null;
};

export type V2CorrectionBlock = {
  key: string;
  label: string;
  questions: V2CorrectionQuestion[];
};

export type V2CorrectionSource = {
  blocks: V2CorrectionBlock[];
  questionTypeTemplates: QuestionContentQuestionTypeTemplate[];
  studentId: number;
  studentName: string;
};

type V2MarkingSubmissionQuestion = Pick<
  V2CorrectionQuestion,
  "questionId" | "resultId" | "studentScore" | "tags" | "teacherAnnotation"
>;

const requireV2ManualScore = (score: number | null): number => {
  if (!Number.isSafeInteger(score) || Number(score) < 0) {
    throw new Error("V2批改分数必须为非负整数");
  }
  return Number(score);
};

const nullableNumber = (value: number | null | undefined): number | null =>
  value === undefined ? null : value;

const correctionQuestionScore = (
  question: ExamPaperQuestionResponse,
  result: TeacherMarkingQuestionDto,
): number => Number(result.questionScore ?? question.questionScore ?? 0);

const correctionQuestionSerialNumber = (
  questionId: number,
  result: TeacherMarkingQuestionDto,
): string => result.questionSerialNumber || String(questionId);

const mapCorrectionQuestion = (
  question: ExamPaperQuestionResponse,
  result: TeacherMarkingQuestionDto,
  templates: QuestionContentQuestionTypeTemplate[],
): V2CorrectionQuestion => {
  if (question.questionId === null || question.questionData === null) {
    throw new Error("V2批改题目缺少冻结questionData");
  }
  const serialized = createQuestionContentSerializedDraftFromV2Question(
    question.questionData,
  ) as QuestionContentSerializedDraft;
  const content = createQuestionPreviewDraft(serialized, templates);
  if (!content)
    throw new Error(`V2批改题目无法渲染：questionId=${question.questionId}`);
  const empty = createEmptyQuestionPlayerResponse(content, templates);
  return {
    content,
    isCorrect: nullableNumber(result.isCorrect),
    questionId: question.questionId,
    questionScore: correctionQuestionScore(question, result),
    questionSerialNumber: correctionQuestionSerialNumber(
      question.questionId,
      result,
    ),
    response: mapV2AnswerJsonToQuestionPlayerResponse(result.answerJson, empty),
    resultId: result.id,
    studentScore: nullableNumber(result.studentScore),
    tags: result.tags || [],
    teacherAnnotation: result.teacherAnnotation ?? null,
  };
};

const subjectivePersistedLeaves = (
  root: ExamPaperQuestionResponse,
  resultsByQuestionId: Map<number, TeacherMarkingQuestionDto>,
  templates: QuestionContentQuestionTypeTemplate[],
): V2CorrectionQuestion[] => {
  if (root.children.length > 0) {
    return root.children.flatMap((child) =>
      subjectivePersistedLeaves(child, resultsByQuestionId, templates),
    );
  }
  if (
    root.questionTypeData?.isSubjective !== true ||
    root.questionId === null
  ) {
    return [];
  }
  const result = resultsByQuestionId.get(root.questionId);
  return result ? [mapCorrectionQuestion(root, result, templates)] : [];
};

export const mapV2StudentResultToCorrectionSource = (
  result: TeacherStudentResultDto,
): V2CorrectionSource => {
  const roots = result.examPaperDetailResponse.moduleList.flatMap(
    (module) => module.questionList,
  );
  const templates = createQuestionEditorQuestionTypeTemplates(
    requireExamPaperQuestionTypeSnapshots(
      result.examPaperDetailResponse.moduleList,
    ),
  ) as QuestionContentQuestionTypeTemplate[];
  const resultsByQuestionId = new Map(
    result.questionOnlineMarkingItemList.map((item) => [item.questionId, item]),
  );
  const blocks = roots.flatMap((root, index) => {
    const questions = subjectivePersistedLeaves(
      root,
      resultsByQuestionId,
      templates,
    );
    if (questions.length === 0) return [];
    const key = questions.map((question) => question.questionId).join(",");
    return [
      {
        key,
        label: questions[0].questionSerialNumber || String(index + 1),
        questions,
      },
    ];
  });
  return {
    blocks,
    questionTypeTemplates: templates,
    studentId: result.studentId,
    studentName:
      result.studentName || result.studentEnName || String(result.studentId),
  };
};

export const createV2MarkingSubmission = (
  questions: V2MarkingSubmissionQuestion[],
) => ({
  questionResults: questions.map((question) => ({
    questionId: question.questionId,
    resultId: question.resultId,
    studentScore: requireV2ManualScore(question.studentScore),
    tags: question.tags,
    teacherAnnotation: question.teacherAnnotation,
  })),
});

export const summarizeV2MarkingProgress = (
  sheets: V2MarkingSheet[],
  questionIds: Set<number>,
): { allNum: number; checkNum: number } => {
  const selectedResults = sheets.flatMap((sheet) =>
    sheet.questionResults.filter(
      (result) => questionIds.size === 0 || questionIds.has(result.questionId),
    ),
  );
  return {
    allNum: selectedResults.length,
    checkNum: selectedResults.filter((result) => result.status !== 0).length,
  };
};
