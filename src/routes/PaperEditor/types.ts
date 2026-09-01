import type {
  QuestionContentQuestionTypeTemplate,
  QuestionContentSerializedDraft,
} from "@yungu-fed/question-editor";

export type {
  ExamPaperDetailResponse,
  ExamPaperModuleResponse,
  ExamPaperQuestionDataResponse,
  ExamPaperQuestionResponse,
} from "../../services/examPaperV2.types";

export interface NamedValueResponse {
  id: number;
  name: string;
}

export interface BasketQuestionDataResponse {
  id?: number;
  businessQuestionTypeId: number;
  version: string;
  elements: unknown;
  extras: unknown;
  children: BasketQuestionDataResponse[];
}

export interface BasketQuestionResponse {
  questionId: number;
  type: number;
  businessQuestionTypeId: number;
  questionLevel?: number;
  knowledgeIds: number[];
  knowledgeValues: NamedValueResponse[];
  chapterIds: number[];
  chapterValues: NamedValueResponse[];
  indicatorIds: number[];
  indicatorValues: NamedValueResponse[];
  children: BasketQuestionResponse[];
  questionData: BasketQuestionDataResponse;
}

export interface BasketModuleResponse {
  moduleName: string;
  moduleQuestionNumber: string;
  moduleType: number;
  businessQuestionTypeId: number;
  questionList: BasketQuestionResponse[];
}

export interface QuestionBasketResponse {
  subjectId: number;
  subjectName: string;
  moduleList: BasketModuleResponse[];
}

export interface PaperQuestionDraft {
  key: string;
  questionId: number | null;
  score?: number;
  content: QuestionContentSerializedDraft | null;
  children: PaperQuestionDraft[];
  questionSnapshotStatus?: "COMPLETE" | "UNASSOCIATED" | "UNRESOLVED";
  questionSnapshotIssueCode?: string | null;
}

export interface PaperModuleDraft {
  key: string;
  title: string;
  questions: PaperQuestionDraft[];
}

export interface MoveCommand {
  oldIndex: number;
  newIndex: number;
}

export interface MoveQuestionCommand {
  sourceModuleKey: string;
  sourceQuestionIndex: number;
  targetModuleKey: string;
  targetQuestionIndex: number;
}

export interface PaperEditorDraft {
  title: string;
  paperType?: number;
  paperId?: number;
  gradeId?: number;
  gradeName?: string;
  subjectId: number;
  subjectName: string;
  modules: PaperModuleDraft[];
  questionTypeTemplates: QuestionContentQuestionTypeTemplate[];
}

export type PaperEditorPageContext =
  | { mode: "create"; subjectId: number }
  | { mode: "edit" | "preview"; paperId: number };

export interface GradeOption {
  gradeId: number;
  name: string;
  stageId?: number;
}

export interface SubjectOption {
  name: string;
  subjectId: number;
}

export interface PaperTypeOption {
  code: number;
  typeName?: string;
  typeEname?: string;
  name?: string;
}

export interface PaperSaveQuestionRequest {
  questionId: number;
  questionScore: number;
  children?: PaperSaveQuestionRequest[];
}

export interface PaperSaveModuleRequest {
  moduleName: string;
  questions: PaperSaveQuestionRequest[];
}

export interface PaperSaveRequest {
  paperId?: number;
  paperTypeCode: number;
  title: string;
  gradeId: number;
  subjectId: number;
  totalScore: number;
  modules: PaperSaveModuleRequest[];
}
