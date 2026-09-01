const readPositiveId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : undefined;
};

/**
 * 将录题范围编码为 QuestionAssetInput 唯一新增路由。
 * @param {{gradeId: number|string, subjectId: number|string}} scope 当前年级和学科。
 * @returns {string} 题目录入页路径。
 */
export const buildQuestionAssetInputCreatePath = ({ gradeId, subjectId }) => {
  const query = new URLSearchParams({
    gradeId: String(gradeId),
    subjectId: String(subjectId),
  });
  return `/questionAssetInput?${query.toString()}`;
};

/**
 * 将 QuestionAssetInput 查询参数收口为录题范围。
 * @param {Record<string, unknown>} query 页面查询参数。
 * @returns {{gradeId: number, subjectId: number}|undefined} 完整有效的录题范围。
 */
export const parseQuestionAssetInputCreateScope = (query) => {
  const gradeId = readPositiveId(query.gradeId);
  const subjectId = readPositiveId(query.subjectId);
  return gradeId && subjectId ? { gradeId, subjectId } : undefined;
};
