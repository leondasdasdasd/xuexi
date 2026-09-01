import type { PaperEditorDraft } from "./types";

type PaperQuestionOrder = Pick<PaperEditorDraft, "modules">;

/**
 * 按整张试卷的当前顺序生成连续题号，展示编号不进入草稿或保存协议。
 * @param {PaperQuestionOrder} draft 试卷草稿。
 * @returns {ReadonlyMap<string, number>} 稳定题目 key 到一基题号的映射。
 */
export const createPaperQuestionDisplayNumbers = (
  draft: PaperQuestionOrder,
): ReadonlyMap<string, number> => {
  const entries = draft.modules.flatMap((module) =>
    module.questions.map((question) => question.key),
  );
  return new Map(entries.map((questionKey, index) => [questionKey, index + 1]));
};
