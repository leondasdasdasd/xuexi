import type {
  QuestionContentDraft,
  QuestionContentQuestionTypeTemplate,
} from "@yungu-fed/question-editor";

import type { QuestionAssetBusinessQuestionType } from "./questionAssetEditorTypes";

export function createQuestionAssetEditorDraft(
  questionType: QuestionAssetBusinessQuestionType,
): QuestionContentDraft;

export function getDefaultQuestionAssetTypeId(
  questionTypes: QuestionAssetBusinessQuestionType[],
): number | undefined;

export function getQuestionAssetTypeById(
  questionTypes: QuestionAssetBusinessQuestionType[],
  typeId?: number,
): QuestionAssetBusinessQuestionType | undefined;

export function createQuestionAssetQuestionTypeTemplates(
  questionTypes: QuestionAssetBusinessQuestionType[],
): QuestionContentQuestionTypeTemplate[];
