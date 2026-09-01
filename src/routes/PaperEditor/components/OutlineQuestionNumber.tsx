import React from "react";
import { SortableElement } from "react-sortable-hoc";

import { trans } from "../../../utils/i18n";
import { QUESTION_SORT_HANDLE_ATTRIBUTE } from "../outlineQuestionDragStart";

import styles from "../index.module.less";

interface Props {
  number: number;
  onNavigate: () => void;
}

/**
 * 渲染可点击定位、可拖拽排序的右侧题号。
 * @param {Props} properties 题号属性。
 * @returns {React.ReactElement} 可排序题号。
 */
function OutlineQuestionNumber(properties: Props): React.ReactElement {
  const { number, onNavigate } = properties;
  return (
    <button
      aria-label={trans(
        "paperEditor.dragQuestionNumber",
        "拖拽第 {$number} 题调整顺序，点击定位题目",
        { number },
      )}
      className={styles["question-link"]}
      {...{ [QUESTION_SORT_HANDLE_ATTRIBUTE]: "true" }}
      type="button"
      onClick={onNavigate}
    >
      {number}
    </button>
  );
}

export default SortableElement<Props>(OutlineQuestionNumber);
