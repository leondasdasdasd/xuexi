import React from "react";
import { Button } from "antd";

import { trans } from "../../../utils/i18n";

import styles from "../index.module.less";

interface Props {
  available: boolean;
  visible: boolean;
  onToggle: () => void;
}

/**
 * 渲染题目答案详情切换入口，仅在预览数据可用时开放。
 * @param {Props} properties 答案切换属性。
 * @returns {React.ReactElement|null} 答案切换按钮或空节点。
 */
function QuestionAnswerToggleButton({
  available,
  visible,
  onToggle,
}: Props): React.ReactElement | null {
  if (!available) return null;
  return (
    <Button
      aria-pressed={visible}
      className={styles["question-action-button"]}
      type="link"
      onClick={onToggle}
    >
      {visible
        ? trans("paperEditor.hideAnswer", "隐藏答案")
        : trans("paperEditor.showAnswer", "查看答案")}
    </Button>
  );
}

export default QuestionAnswerToggleButton;
