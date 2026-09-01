import type {
  QuestionContentQuestionTypeTemplate,
  QuestionContentSerializedDraft,
} from "@yungu-fed/question-editor";

import type {
  PaperEditorDraft,
  PaperQuestionDraft,
} from "../PaperEditor/types";

export interface AnalysisQuestionView {
  content: QuestionContentSerializedDraft;
  displayNumber: string;
  questionId: number;
  score?: number;
}

export interface AnalysisQuestionCatalog {
  questionTypeTemplates: QuestionContentQuestionTypeTemplate[];
  findQuestion: (questionId: number) => AnalysisQuestionView | undefined;
  requireQuestion: (questionId: number) => AnalysisQuestionView;
}

const collectQuestionViews = (
  question: PaperQuestionDraft,
  displayNumber: string,
  questionsById: Map<number, AnalysisQuestionView>,
): void => {
  if (question.questionId !== null && question.content !== null) {
    questionsById.set(question.questionId, {
      content: question.content,
      displayNumber,
      questionId: question.questionId,
      score: question.score,
    });
  }
  for (const [index, child] of question.children.entries())
    collectQuestionViews(child, `${displayNumber}.${index + 1}`, questionsById);
};

/**
 * 将 PaperEditor 的权威 V2 草稿索引为分析页面共享的逐题视图。
 * @param draft
 */
export const createAnalysisQuestionCatalog = (
  draft: PaperEditorDraft,
): AnalysisQuestionCatalog => {
  const questionsById = new Map<number, AnalysisQuestionView>();
  let rootNumber = 1;
  for (const module of draft.modules)
    for (const question of module.questions) {
      collectQuestionViews(question, String(rootNumber), questionsById);
      rootNumber += 1;
    }

  return {
    questionTypeTemplates: draft.questionTypeTemplates,
    findQuestion: (questionId: number) => questionsById.get(questionId),
    requireQuestion: (questionId: number) => {
      const question = questionsById.get(questionId);
      if (!question) {
        throw new Error(`V2 分析题目不存在：questionId=${questionId}`);
      }
      return question;
    },
  };
};
