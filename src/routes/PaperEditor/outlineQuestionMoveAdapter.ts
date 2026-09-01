import type { MoveQuestionCommand, PaperEditorDraft } from "./types";

export interface OutlineQuestionPosition {
  moduleKey: string;
  questionIndex: number;
  questionKey: string;
}

export const createOutlineQuestionPositions = (
  draft: PaperEditorDraft,
): OutlineQuestionPosition[] =>
  draft.modules.flatMap((module) =>
    module.questions.map((question, questionIndex) => ({
      moduleKey: module.key,
      questionIndex,
      questionKey: question.key,
    })),
  );

/**
 * 将拖拽库的展平索引集中转换为领域移动命令。
 * @param {OutlineQuestionPosition[]} positions 当前右侧题号的展平位置。
 * @param {number} oldIndex 拖拽前索引。
 * @param {number} newIndex 拖拽后索引。
 * @returns {MoveQuestionCommand | undefined} 可执行的领域命令；无效或未移动时返回 undefined。
 */
export const createMoveQuestionCommand = (
  positions: OutlineQuestionPosition[],
  oldIndex: number,
  newIndex: number,
): MoveQuestionCommand | undefined => {
  const source = positions.at(oldIndex);
  const target = positions.at(newIndex);
  if (!source || !target || oldIndex === newIndex) return undefined;
  const movesForwardAcrossModules =
    source.moduleKey !== target.moduleKey && newIndex > oldIndex;
  return {
    sourceModuleKey: source.moduleKey,
    sourceQuestionIndex: source.questionIndex,
    targetModuleKey: target.moduleKey,
    targetQuestionIndex:
      target.questionIndex + (movesForwardAcrossModules ? 1 : 0),
  };
};
