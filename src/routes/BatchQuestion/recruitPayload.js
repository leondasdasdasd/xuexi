/**
 * 招生题库保存和查询是两个后端边界：保存接口负责写入招生标记，查询接口负责按招生标记过滤。
 * @param {object} payload 原始请求参数
 * @param {boolean} shouldAppend 是否需要补充招生保存标记
 * @returns {object} 合并招生保存标记后的请求参数
 */
export const withRecruitQuestionSaveFlag = (payload = {}, shouldAppend) => {
  if (!shouldAppend) {
    return payload;
  }

  return {
    ...payload,
    saveZhaoShengQuestion: true,
  };
};

/**
 * @param {object} payload 原始请求参数
 * @param {boolean} shouldAppend 是否需要补充招生查询标记
 * @returns {object} 合并招生查询标记后的请求参数
 */
export const withRecruitQuestionQueryFlag = (payload = {}, shouldAppend) => {
  if (!shouldAppend) {
    return payload;
  }

  return {
    ...payload,
    queryZhaoShengQuestion: true,
  };
};
