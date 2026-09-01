import React from "react";

import { trans } from "../../utils/i18n";

import styles from "./index.module.less";

export type AnswerDetailsVisibilityByQuestionId = Record<string, boolean>;

interface CandidateAnswerDetailsActionProps {
  visible: boolean;
  onToggle: () => void;
}

/**
 * 按稳定题目 ID 切换候选题答案与附加属性的展示状态。
 * @param {AnswerDetailsVisibilityByQuestionId} visibilityByQuestionId 各候选题当前的展示状态。
 * @param {string | number} questionId 候选题的稳定业务 ID。
 * @returns {AnswerDetailsVisibilityByQuestionId} 仅切换指定题目后的新状态。
 */
export const toggleAnswerDetailsVisibility = (
  visibilityByQuestionId: AnswerDetailsVisibilityByQuestionId,
  questionId: string | number,
): AnswerDetailsVisibilityByQuestionId => ({
  ...visibilityByQuestionId,
  [String(questionId)]: !visibilityByQuestionId[String(questionId)],
});

/**
 * 候选题答案与附加属性的固定文案切换入口。
 * @param {CandidateAnswerDetailsActionProps} properties 操作入口属性。
 * @param {boolean} properties.visible 当前题目是否展示答案与附加属性。
 * @param {() => void} properties.onToggle 切换当前题目展示状态的回调。
 * @returns {React.ReactElement} 可通过键盘和指针操作的按钮。
 */
function CandidateAnswerDetailsAction({
  visible,
  onToggle,
}: CandidateAnswerDetailsActionProps) {
  return (
    <button
      aria-pressed={visible}
      className={`${styles.viewResolution} ${styles.cursor} ${styles["answer-details-button"]} ${
        visible ? styles["answer-details-active"] : ""
      }`}
      onClick={onToggle}
      type="button"
    >
      <i aria-hidden="true" className={styles.iconfont}>
        &#xe631;
      </i>
      {trans("twoWayTest.answerDetails", "答案/附加属性")}
    </button>
  );
}

export default CandidateAnswerDetailsAction;
