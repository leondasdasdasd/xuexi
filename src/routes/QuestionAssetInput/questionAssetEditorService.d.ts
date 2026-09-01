import type {
  QuestionAssetBusinessQuestionType,
  QuestionAssetEditorState,
  QuestionAssetGradeWithStage,
} from "./questionAssetEditorTypes";

interface QuestionAssetTypeQuery {
  stageId?: number;
  subjectId?: number;
}

export function loadQuestionAssetEditState(
  questionId: number | string,
  allGradeList: QuestionAssetGradeWithStage[],
): Promise<QuestionAssetEditorState>;

export function queryQuestionAssetTypes(
  query: QuestionAssetTypeQuery,
): Promise<QuestionAssetBusinessQuestionType[]>;
