export const NEW_MY_QUESTION_INPUT_ROUTE_ITEMS = [
  {
    key: "questionAsset",
    nameKey: "questionAssetInput.title",
    pathName: "questionAssetInput",
    text: "题目录入",
  },
];

export const buildNewMyQuestionInputPath = (routeItem, id) =>
  id ? `/${routeItem.pathName}/${id}` : `/${routeItem.pathName}`;

/**
 * 将新题库当前试题栏学科映射到统一试卷编辑路由。
 * @param {number|string} subjectId 试题栏学科 ID。
 * @returns {string} 新组卷页路径。
 */
export const buildNewMyQuestionPaperEditorPath = (subjectId) =>
  `/paperEditor?subjectId=${encodeURIComponent(subjectId)}`;
