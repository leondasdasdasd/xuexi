import type { PaperQuestionDraft } from "./types";

export interface LeafQuestionScoreField {
  path: number[];
  question: PaperQuestionDraft;
}

/**
 * 将组合题递归展平为可展示的叶子题分值字段。
 * @param {PaperQuestionDraft} question 当前题目。
 * @param {number[]} [path] 当前层级路径。
 * @returns {LeafQuestionScoreField[]} 叶子题分值字段。
 */
export const collectLeafQuestionScoreFields = (
  question: PaperQuestionDraft,
  path: number[] = [],
): LeafQuestionScoreField[] =>
  question.children.length === 0
    ? [{ path, question }]
    : question.children.flatMap((child, index) =>
        collectLeafQuestionScoreFields(child, [...path, index + 1]),
      );
