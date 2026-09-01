import type { QuestionContentQuestionTypeTemplate } from "@yungu-fed/question-editor";

import { trans } from "../../utils/i18n";
import { createQuestionAssetQuestionTypeTemplates } from "../QuestionAssetInput/questionAssetContentAdapter";
import type { QuestionAssetBusinessQuestionType } from "../QuestionAssetInput/questionAssetEditorTypes";
import { createPaperQuestionContentDraft } from "./paperQuestionContentAdapter";
import type { PaperQuestionDraft } from "./types";

interface QuestionAssetNode {
  id?: number;
  businessQuestionTypeId: number;
  version: string;
  elements: unknown;
  extras: unknown;
  children: QuestionAssetNode[];
}

export interface QuestionAssetSavedResource {
  question: QuestionAssetNode;
}

export interface PaperQuestionAssetResult {
  question: PaperQuestionDraft;
  questionTypeTemplates: QuestionContentQuestionTypeTemplate[];
}

const createPaperQuestion = (
  question: QuestionAssetNode,
): PaperQuestionDraft => {
  if (!question.id) {
    throw new Error(trans("paperEditor.questionIdMissing", "题目 ID 缺失"));
  }
  return {
    children: question.children.map((child) => createPaperQuestion(child)),
    content: createPaperQuestionContentDraft({ questionData: question }),
    key: `question-${question.id}`,
    questionId: question.id,
  };
};

/**
 * 将题目录入保存结果集中转换为 PaperEditor 自有草稿契约。
 * @param {QuestionAssetSavedResource} resource 题目录入返回的权威资源。
 * @param {QuestionAssetBusinessQuestionType[]} questionTypes 保存时使用的题型定义。
 * @returns {PaperQuestionAssetResult} PaperEditor 可消费的题目与题型模板。
 */
export const createPaperQuestionAssetResult = (
  resource: QuestionAssetSavedResource,
  questionTypes: QuestionAssetBusinessQuestionType[],
): PaperQuestionAssetResult => ({
  question: createPaperQuestion(resource.question),
  questionTypeTemplates:
    createQuestionAssetQuestionTypeTemplates(questionTypes),
});
