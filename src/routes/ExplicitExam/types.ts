import type {
  QuestionContentDraft,
  QuestionContentQuestionTypeTemplate,
  QuestionPlayerResponse,
} from "@yungu-fed/question-editor";

export * from "../../services/explicitExam.types";

export type StudentAnswerContext = {
  mode: "student-answer";
  examId: number;
  taskPublishId: number;
};

export type StudentResultContext = {
  mode: "student-result";
  examId: number;
};

export type TeacherStudentResultContext = {
  mode: "teacher-student-result";
  examId: number;
  studentId: number;
};

export type TeacherPaperTrialContext = {
  mode: "teacher-paper-trial";
  paperId: number;
};

export type AnswerMode = "continuous" | "single-question";

export type ExamDateMetadata = {
  displayText: string;
  kind:
    | "student-task-publish-time"
    | "teacher-student-submission-time"
    | "teacher-trial-current-time";
};

export type ExamPlacementView = {
  children: ExamPlacementView[];
  content: QuestionContentDraft;
  order: number;
  placementId: string;
  questionId: number;
  response: QuestionPlayerResponse;
  responseVersion: number;
  score: string;
  isCorrect?: number | null;
  studentScore?: number | null;
};

export type ExamPaperModuleView = {
  moduleName: string;
  moduleQuestionNumber: number;
  moduleScore: string;
  order: number;
  placements: ExamPlacementView[];
};

export type ExamPaperView = {
  dateMetadata: ExamDateMetadata;
  deadlineTimestamp: number | null;
  gradeName: string;
  modules: ExamPaperModuleView[];
  questionTypeTemplates: QuestionContentQuestionTypeTemplate[];
  title: string;
  totalScore: string;
};

export type ExamResultView = {
  correctCount: number;
  fullScore: string;
  incorrectCount: number;
  pendingCount: number;
  totalScore: string | null;
};

export type StudentFilterView = { id: number; name: string };
export type GroupFilterView = StudentFilterView & {
  students: StudentFilterView[];
};

export type StudentResultDirectoryView = {
  groups: StudentFilterView[];
  students: StudentFilterView[];
  total: number;
};
