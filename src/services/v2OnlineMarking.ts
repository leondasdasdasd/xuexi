import request from "../utils/request";
import { getTeacherStudentResult, unwrapExamApiResponse } from "./explicitExam";
import type {
  ApiResponse,
  TeacherStudentResultDto,
} from "./explicitExam.types";

export type V2MarkingSheetQuestion = {
  answerJson: string;
  questionId: number;
  questionScore: number;
  resultId: number;
  status: number;
  studentScore: number | null;
};

export type V2MarkingSheet = {
  examId: number;
  pending: boolean;
  questionResults: V2MarkingSheetQuestion[];
  studentEnName?: string | null;
  studentId: number;
  studentName?: string | null;
};

export type V2MarkingSubmission = {
  questionResults: Array<{
    questionId: number;
    resultId: number;
    studentScore: number | null;
    tags: number[];
    teacherAnnotation: string | null;
  }>;
};

export const loadV2MarkingSheets = async (
  examId: number,
): Promise<V2MarkingSheet[]> =>
  unwrapExamApiResponse(
    (await request(
      `/api/v2/exams/${examId}/marking-sheets`,
      void 0,
      void 0,
      void 0,
    )) as ApiResponse<V2MarkingSheet[]>,
  );

export const loadV2MarkingStudentResult = (
  examId: number,
  studentId: number,
): Promise<TeacherStudentResultDto> =>
  getTeacherStudentResult(examId, studentId);

export const saveV2MarkingResults = async (
  examId: number,
  studentId: number,
  body: V2MarkingSubmission,
): Promise<void> => {
  unwrapExamApiResponse(
    (await request(
      `/api/v2/exams/${examId}/students/${studentId}/marking-results`,
      { body, method: "PUT" },
      void 0,
      void 0,
    )) as ApiResponse<unknown>,
  );
};
