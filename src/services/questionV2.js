import { stringify } from "qs";

import request from "../utils/request";

const QUESTION_V2_DETAIL_INCLUDE = ["answers", "extras"];

/**
 * 查询 v2 题目资源详情。详情固定携带答案和附加属性，供编辑器完整回填。
 * @param {number|string} id 题目 ID。
 * @returns {Promise<object>} 详情接口响应。
 */
export async function queryQuestionV2Resource(id) {
  return request(
    `/api/v2/questions/${id}?${stringify({
      include: QUESTION_V2_DETAIL_INCLUDE.join(","),
    })}`,
  );
}

/**
 * 创建 v2 题目资源。调用方必须传入后端 QuestionRequest 结构。
 * @param {object} payload v2 QuestionRequest。
 * @returns {Promise<object>} 创建接口响应。
 */
export async function createQuestionV2Resource(payload) {
  return request("/api/v2/questions", {
    body: payload,
    method: "POST",
  });
}

/**
 * 更新 v2 题目资源。题目 ID 只放在路径，body 保持 QuestionRequest 边界。
 * @param {number|string} id 题目 ID。
 * @param {object} payload v2 QuestionRequest。
 * @returns {Promise<object>} 更新接口响应。
 */
export async function updateQuestionV2Resource(id, payload) {
  return request(`/api/v2/questions/${id}`, {
    body: payload,
    method: "PUT",
  });
}

/**
 * 删除 v2 题目资源。
 * @param {number|string} id 题目 ID。
 * @returns {Promise<object>} 删除接口响应。
 */
export async function deleteQuestionV2Resource(id) {
  return request(`/api/v2/questions/${id}`, {
    method: "DELETE",
  });
}

/**
 * 将 v2 题目加入试题篮。
 * @param {object} payload 试题篮绑定参数。
 * @returns {Promise<object>} 绑定接口响应。
 */
export async function bindQuestionV2Basket(payload) {
  return request("/api/v2/question-basket/bind", {
    body: payload,
    method: "POST",
  });
}

/**
 * 将 v2 题目移出试题篮。
 * @param {object} payload 试题篮解绑参数。
 * @returns {Promise<object>} 解绑接口响应。
 */
export async function unbindQuestionV2Basket(payload) {
  return request("/api/v2/question-basket/unbind", {
    body: payload,
    method: "POST",
  });
}

/**
 * 按学科查询当前用户的 v2 试题栏。
 * @param {{subjectId: number|string, enrollmentQuestion?: boolean}} parameters 查询参数。
 * @returns {Promise<object>} v2 试题栏响应。
 */
export async function queryQuestionV2Basket(parameters) {
  return request(
    `/api/v2/question-basket?${stringify({
      enrollmentQuestion: parameters.enrollmentQuestion || false,
      subjectId: parameters.subjectId,
    })}`,
  );
}

/**
 *
 * @param parameters
 */
export async function queryQuestionV2BasketSummary(parameters = {}) {
  return request(
    `/api/v2/question-basket/summary?${stringify({
      enrollmentQuestion: parameters.enrollmentQuestion || false,
    })}`,
  );
}
