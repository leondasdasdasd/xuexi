import React from "react";

import { trans } from "../../utils/i18n";

import icon from "../../icon.module.less";
import styles from "./index.module.less";

interface QuestionPlacementMoveActionsProps {
  canMoveDown: boolean;
  canMoveUp: boolean;
  onMoveDown: () => void;
  onMoveUp: () => void;
}

/**
 * 题位排序仅暴露方向意图，题组原子性由 domain 边界保证。
 * @param {QuestionPlacementMoveActionsProps} properties 题位移动操作属性。
 * @param {boolean} properties.canMoveDown 是否可以下移。
 * @param {boolean} properties.canMoveUp 是否可以上移。
 * @param {() => void} properties.onMoveDown 下移回调。
 * @param {() => void} properties.onMoveUp 上移回调。
 * @returns {React.ReactElement} 可访问的上下移按钮。
 */
function QuestionPlacementMoveActions(
  properties: QuestionPlacementMoveActionsProps,
) {
  const { canMoveDown, canMoveUp, onMoveDown, onMoveUp } = properties;
  return (
    <div className={styles["question-placement-move-actions"]}>
      <button
        aria-label={trans("global.moveUp", "上移")}
        className={`${styles["question-placement-move-button"]} ${icon.iconfont}`}
        disabled={!canMoveUp}
        onClick={(event) => {
          event.stopPropagation();
          onMoveUp();
        }}
        type="button"
      >
        &#xeb0b;
      </button>
      <button
        aria-label={trans("global.moveDown", "下移")}
        className={`${styles["question-placement-move-button"]} ${icon.iconfont}`}
        disabled={!canMoveDown}
        onClick={(event) => {
          event.stopPropagation();
          onMoveDown();
        }}
        type="button"
      >
        &#xeb0a;
      </button>
    </div>
  );
}

export default QuestionPlacementMoveActions;
