export interface ExamPaperQuestionDataResponse {
  id?: number;
  businessQuestionTypeId: number;
  version: string;
  elements: unknown;
  extras: unknown;
  children: ExamPaperQuestionDataResponse[];
}

export interface ExamPaperQuestionResponse {
  questionSnapshotStatus?: "COMPLETE" | "UNASSOCIATED" | "UNRESOLVED";
  questionSnapshotIssueCode?: string | null;
  answerJson?: string | null;
  associationStrategy?: {
    blankId?: string;
    blankOrder?: number;
    type: string;
  } | null;
  questionId: number | null;
  questionScore: number | null;
  businessQuestionTypeId: number;
  questionLevel?: number;
  contentImage?: string;
  questionTimeLimit?: number;
  isCorrect?: number | null;
  knowledgeIds: number[];
  chapterIds: number[];
  indicatorIds: number[];
  children: ExamPaperQuestionResponse[];
  questionData: ExamPaperQuestionDataResponse | null;
  questionTypeData?: {
    businessQuestionTypeId: number;
    elements: unknown[];
    enName?: string;
    extras: unknown[];
    globalConfig?: { hasAnswer?: boolean };
    isComposite: boolean;
    isSubjective: boolean;
    name?: string;
  } | null;
  studentScore?: number | null;
}

export interface ExamPaperModuleResponse {
  moduleName: string;
  moduleQuestionNumber: number;
  moduleScore: number;
  questionList: ExamPaperQuestionResponse[];
}

export type ExamPaperEditDisabledReasonCode =
  | "PAPER_CONTENT_FROZEN"
  | "PAPER_PERMISSION_REQUIRED"
  | "ENROLLMENT_PAPER_PERMISSION_REQUIRED";

/** V2 试卷详情接口的唯一传输层契约。 */
export interface ExamPaperDetailResponse {
  contractVersion?: string;
  id: number;
  title: string;
  gradeName: string;
  paperTypeCode: number;
  gradeId: number;
  subjectId: number;
  totalScore: number;
  content: {
    moduleList: ExamPaperModuleResponse[];
  };
  capabilities: {
    update: boolean;
    updateDisabledReasonCode?: ExamPaperEditDisabledReasonCode;
    delete: boolean;
    copy: boolean;
  };
}
