import type {
  QuestionContentQuestionTypeTemplate,
  QuestionContentSerializedDraft,
} from "@yungu-fed/question-editor";

import { createQuestionContentSerializedDraftFromV2Question } from "../../utils/questionContentV2EditorAdapter";
import { collectQuestionContentBusinessQuestionTypeIds } from "../../utils/questionContentV2Tree";
import { createQuestionEditorQuestionTypeTemplates } from "../../utils/questionTypeEditorAdapter";

interface PaperQuestionContentDataSource {
  id?: number;
  businessQuestionTypeId: number;
  version: string;
  elements: unknown;
  extras: unknown;
  children: PaperQuestionContentDataSource[];
}

interface PaperQuestionContentSource {
  questionData: PaperQuestionContentDataSource;
}

interface PaperQuestionModuleSource {
  questionList: Array<{
    questionData: PaperQuestionContentDataSource | null;
  }>;
}

const createQuestionContentNode = (
  question: PaperQuestionContentDataSource,
): object => ({
  id: question.id,
  businessQuestionTypeId: question.businessQuestionTypeId,
  version: question.version,
  elements: question.elements,
  extras: question.extras,
  children: question.children.map((child) => createQuestionContentNode(child)),
});

/**
 * 将任意 V2 试卷题目源转换为 question-editor 序列化内容。
 * @param {PaperQuestionContentSource} question V2 题目内容源。
 * @returns {QuestionContentSerializedDraft} question-editor 序列化内容。
 */
export const createPaperQuestionContentDraft = (
  question: PaperQuestionContentSource,
): QuestionContentSerializedDraft =>
  createQuestionContentSerializedDraftFromV2Question(
    createQuestionContentNode(question.questionData),
  ) as QuestionContentSerializedDraft;

/**
 * 从任意 V2 试卷模块树中收集去重题型 ID。
 * @param {PaperQuestionModuleSource[]} modules V2 试卷模块。
 * @returns {number[]} 去重后的题型 ID。
 */
export const collectPaperBusinessQuestionTypeIds = (
  modules: PaperQuestionModuleSource[],
): number[] =>
  collectQuestionContentBusinessQuestionTypeIds(
    modules.flatMap((module) =>
      module.questionList.flatMap((question) =>
        question.questionData ? [question.questionData] : [],
      ),
    ),
  );

/**
 * 统一创建 PaperEditor 使用的 question-editor 题型模板。
 * @param {object[]} questionTypes 题型源数据。
 * @param {string} [locale] 渲染语言。
 * @returns {QuestionContentQuestionTypeTemplate[]} 题型模板。
 */
export const createPaperQuestionTypeTemplates = (
  questionTypes: object[],
  locale?: string,
): QuestionContentQuestionTypeTemplate[] =>
  createQuestionEditorQuestionTypeTemplates(questionTypes, {
    locale,
  }) as QuestionContentQuestionTypeTemplate[];
