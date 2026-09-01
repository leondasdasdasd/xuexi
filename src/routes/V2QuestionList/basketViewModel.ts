interface NewMyQuestionBasketSubject {
  subjectQuestionNum?: number | null;
}

/**
 * 题篮列表是页面展示与总数的权威数据源，避免独立计数接口与列表口径分叉。
 * @param {NewMyQuestionBasketSubject[]} basketList 按学科聚合的题篮列表。
 * @returns {number} 当前页面可展示的题目总数。
 */
export const getNewMyQuestionBasketCount = (
  basketList: NewMyQuestionBasketSubject[] = [],
): number =>
  basketList.reduce(
    (total, subject) => total + (subject.subjectQuestionNum || 0),
    0,
  );
