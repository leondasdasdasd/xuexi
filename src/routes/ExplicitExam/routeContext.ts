import type {
  StudentAnswerContext,
  StudentResultContext,
  TeacherPaperTrialContext,
  TeacherStudentResultContext,
} from "./types";

export class InvalidExamRouteError extends Error {}

// 在路由入口拒绝非正整数，避免业务层重新猜测通用 id 在不同场景中的含义。
const parsePositiveId = (value: string | undefined, name: string): number => {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new InvalidExamRouteError(`${name} must be a positive integer`);
  }
  return parsed;
};

export const parseStudentAnswerContext = (parameters: {
  examId?: string;
  taskPublishId?: string;
}): StudentAnswerContext => ({
  mode: "student-answer",
  examId: parsePositiveId(parameters.examId, "examId"),
  taskPublishId: parsePositiveId(parameters.taskPublishId, "taskPublishId"),
});

export const parseStudentResultContext = (parameters: {
  examId?: string;
}): StudentResultContext => ({
  mode: "student-result" as const,
  examId: parsePositiveId(parameters.examId, "examId"),
});

export const parseTeacherStudentResultContext = (parameters: {
  examId?: string;
  studentId?: string;
}): TeacherStudentResultContext => ({
  mode: "teacher-student-result",
  examId: parsePositiveId(parameters.examId, "examId"),
  studentId: parsePositiveId(parameters.studentId, "studentId"),
});

export const parseTeacherPaperTrialContext = (parameters: {
  paperId?: string;
}): TeacherPaperTrialContext => ({
  mode: "teacher-paper-trial",
  paperId: parsePositiveId(parameters.paperId, "paperId"),
});
