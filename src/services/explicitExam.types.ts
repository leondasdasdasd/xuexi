import type { QuestionPlayerResponseItem } from "@yungu-fed/question-editor";

import type { ExamPaperModuleResponse } from "./examPaperV2.types";

export type ApiResponse<T> = {
  code?: number | string;
  content?: T;
  err?: unknown;
  ifLogin?: boolean;
  message?: string;
  status?: boolean;
};

export class ExamApiError extends Error {
  code?: number | string;
  content?: unknown;

  constructor(response: ApiResponse<unknown>) {
    super(response.message || "Request failed");
    this.name = "ExamApiError";
    this.code = response.code;
    this.content = response.content;
  }
}

export type CurrentUser = { currentIdentity?: string; userId?: number };

export type OnlineExamCreationResult = {
  contractVersion: string;
  examId: number;
  taskId: number;
};

export type TaskPublishRequest = {
  resourceRequestList: Array<{
    deadTime: number | string | null;
    evaluationItemId: number | null;
    examPaperId: number;
    expectTime: number;
    groupId: null;
    ifTiming: number;
    lessonId: number | null;
    publishTime: number | string | null;
    studentList: Array<{ groupId: number; id: number }>;
    taskId: number;
  }>;
};

/** 后端学生试卷与结果仍复用旧响应外壳，V2 页面只读取这里声明的窄边界。 */
export type StudentPaperDto = {
  answerEndTime?: number | string | null;
  answerTime?: number | null;
  contractVersion?: string;
  examPaperName?: string;
  gradeName: string;
  id?: number;
  moduleList: ExamPaperModuleResponse[];
  paperAvailability?: "READY" | "UNAVAILABLE";
  paperIssueCode?:
    | "EMPTY_PAPER"
    | "PAPER_SNAPSHOT_UNREADABLE"
    | "QUESTION_UNASSOCIATED"
    | "QUESTION_UNRESOLVED"
    | null;
  paperId?: number;
  title?: string;
  totalScore?: number;
};

export type StudentExamPaperDto = StudentPaperDto & {
  paperAvailability: "READY" | "UNAVAILABLE";
};

export type StudentExamEntryDto = {
  examId: number;
  gradeName: string;
  paperId: number;
  status: "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED";
  taskPublishId: number;
  taskPublishTime: number | string | null;
  startTime?: number | null;
  endTime?: number | null;
  studentScore?: number | null;
};

export type ExamScoredResultDto = {
  answerTime?: number | null;
  correctQuestionNum?: number;
  errorQuestionNum?: number;
  examPaperDetailResponse: StudentPaperDto;
  examScore?: number;
  halfQuestionNum?: number;
  noAnswerQuestionNum?: number;
  openAnswer?: boolean;
  openScore?: boolean;
  pendingQuestionNum?: number;
  studentScore?: number | null;
  totalQuestionNum?: number;
};

export type StudentExamResultDto = ExamScoredResultDto & {
  submittedAt: number | string | null;
  studentId: number;
  studentName?: string;
  studentEnName?: string;
  groupId?: number;
  groupName?: string;
  groupEnName?: string;
};

export type ExamPreviewResultDto = ExamScoredResultDto;

export type V2QuestionResponseDto = {
  businessQuestionTypeId: number;
  children: V2QuestionResponseDto[];
  elementAnswers: QuestionPlayerResponseItem[];
  id: number;
  version: "1";
};

export type StudentExamSubmissionAnswerDto = V2QuestionResponseDto;

export type TeacherMarkingQuestionDto = {
  answerJson?: string | null;
  id: number;
  isCorrect?: number | null;
  questionId: number;
  questionScore?: number | null;
  questionSerialNumber?: string | null;
  studentScore?: number | null;
  teacherAnnotation?: string | null;
  tags?: number[] | null;
};

export type TeacherStudentResultDto = {
  contractVersion?: string;
  examPaperDetailResponse: StudentPaperDto;
  questionOnlineMarkingItemList: TeacherMarkingQuestionDto[];
  studentEnName?: string;
  studentId: number;
  studentName?: string;
  total?: number;
};

export type TeacherExamStudentDto = {
  groupEnName?: string;
  groupId?: number;
  groupName?: string;
  studentEnName?: string;
  studentId: number;
  studentName?: string;
};

export type TeacherExamGroupDto = {
  groupEnName?: string;
  groupId: number;
  groupName?: string;
};

export type TeacherExamStudentDirectoryDto = {
  groups: TeacherExamGroupDto[];
  limit: number;
  pageNo: number;
  students: TeacherExamStudentDto[];
  total: number;
};
