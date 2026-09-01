export const QUESTION_SORT_HANDLE_ATTRIBUTE = "data-question-sort-handle";

/**
 * 仅允许题号按钮启动拖拽，避免 sortable 默认屏蔽原生 button。
 * @param {SortEvent|SortEventWithTag} event 拖拽启动事件。
 * @returns {boolean} 是否取消本次拖拽。
 */
export const shouldCancelQuestionSortStart = (
  event: SortEvent | SortEventWithTag,
): boolean => {
  const target = event.target;
  return !(
    target instanceof Element &&
    target.closest(`[${QUESTION_SORT_HANDLE_ATTRIBUTE}="true"]`)
  );
};
import type { SortEvent, SortEventWithTag } from "react-sortable-hoc";
