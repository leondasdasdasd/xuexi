import { stringify } from "qs";

import request from "../utils/request";

const LLM_CONFIG_URL = "/api/exam-paper-ocr/llm-configs";

/**
 * 查询当前用户的整卷 OCR LLM 配置。
 * @param {object} parameters 查询条件，可包含 subjectId、schoolStage 和 businessType。
 * @returns {Promise<object>} 后端标准响应。
 */
export async function queryExamPaperOcrLlmConfigs(parameters = {}) {
  return request(`${LLM_CONFIG_URL}?${stringify(parameters)}`);
}

/**
 * 新增或更新当前用户指定业务、学科、学段的整卷 OCR LLM 配置。
 * @param {object} parameters 保存请求体。
 * @returns {Promise<object>} 后端标准响应。
 */
export async function saveExamPaperOcrLlmConfig(parameters) {
  return request(LLM_CONFIG_URL, {
    method: "POST",
    body: {
      ...parameters,
    },
  });
}
