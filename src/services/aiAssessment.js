import { stringify } from "qs";

import request from "../utils/request";

//获取班级列表
/**
 *
 * @param parameters
 */
export async function getClassList(parameters) {
  return request(`/api/selectGroupInfoByPlanId?${stringify(parameters)}`);
}

//获取学生列表
/**
 *
 * @param parameters
 */
export async function getStudentList(parameters) {
  return request(
    `/api/selectCourseEvaluationStudentInfo?${stringify(parameters)}`,
  );
}

//获取过程评价数据
/**
 *
 * @param parameters
 */
export async function getProcessEvaluationData(parameters) {
  return request("/api/courseEvaluation/getIntelligenceParameterByParams", {
    method: "POST",
    body: {
      ...parameters,
    },
  });
}

//获取预生成的ai分析
/**
 *
 * @param parameters
 */
export async function getIntelligenceResult(parameters) {
  return request(
    `/api/courseEvaluation/getIntelligenceResult?${stringify(parameters)}`,
  );
}

/**
 *
 * @param parameters
 */
export async function createOrEditAITopic(parameters) {
  return request("/api/createOrEditAITopic", {
    method: "POST",
    body: {
      ...parameters,
    },
  });
}
/**
 *
 * @param parameters
 */
export async function saveAIConversionForTopic(parameters) {
  return request("/api/saveAIConversionForTopic", {
    method: "POST",
    body: {
      ...parameters,
    },
  });
}
// 获取大模型余额
/**
 *
 * @param parameters
 */
export async function getBalance(parameters) {
  return request(`/api/user/balance?${stringify(parameters)}`);
}

// 获取大模型列表
/**
 *
 * @param parameters
 */
export async function getModelList(parameters) {
  return request(`/api/model/list?${stringify(parameters)}`);
}
