import type { QuestionContentDraft } from "@yungu-fed/question-editor";

export interface QuestionAssetScope {
  chapterIds?: Array<number | string>;
  contentImage?: string;
  enrollmentQuestion?: boolean;
  gradeId?: number;
  indicatorIds?: Array<number | string>;
  knowledgeIds?: Array<number | string>;
  level?: number;
  mathNodeIds?: Array<number | string>;
  outSourceId?: number | string | null;
  outSourceType?: string;
  questionTimeLimit?: number | null;
  sourcePaperId?: number | null;
  subjectId?: number;
  yearPeriodId?: number | null;
}

interface QuestionAssetTypeItem {
  config?: unknown;
  enName?: string;
  name: string;
  type: string;
}

export interface QuestionAssetBusinessQuestionType {
  businessQuestionTypeId: number;
  elements: QuestionAssetTypeItem[];
  enName?: string;
  extras: QuestionAssetTypeItem[];
  globalConfig?: { hasAnswer?: boolean };
  isComposite?: boolean;
  name: string;
}

export interface QuestionAssetGradeWithStage {
  gradeId: number;
  stageId?: number;
}

export interface QuestionAssetEditorState {
  draft?: QuestionContentDraft | null;
  questionTypes: QuestionAssetBusinessQuestionType[];
  resource: QuestionAssetScope;
  selectedTypeId?: number;
}
