import { stringify } from "qs";

import request from "../utils/request";

const PROMPT_URL = "/api/exam-paper-ocr/task/prompts";
const ANALYSIS_TASK_URL = "/api/exam-paper-ocr/task/question-analysis";
const QUALITY_TASK_URL = "/api/exam-paper-ocr/task/question-quality-check";

const postJson = (url, parameters) =>
  request(url, {
    method: "POST",
    body: {
      ...parameters,
    },
  });

/**
 * @param {object} parameters
 * @returns {Promise<object>}
 */
export async function queryQuestionTaskPrompts(parameters) {
  return request(`${PROMPT_URL}?${stringify(parameters)}`);
}

/**
 * @param {object} parameters
 * @returns {Promise<object>}
 */
export async function saveQuestionTaskPrompts(parameters) {
  return postJson(PROMPT_URL, parameters);
}

/**
 * @param {object} parameters
 * @returns {Promise<object>}
 */
export async function submitQuestionAnalysisTasks(parameters) {
  return postJson(`${ANALYSIS_TASK_URL}/submit`, parameters);
}

/**
 * @param {object} parameters
 * @returns {Promise<object>}
 */
export async function queryQuestionAnalysisTasks(parameters) {
  return postJson(`${ANALYSIS_TASK_URL}/query`, parameters);
}

/**
 * @param {object} parameters
 * @returns {Promise<object>}
 */
export async function cancelQuestionAnalysisTasks(parameters) {
  return postJson(`${ANALYSIS_TASK_URL}/cancel`, parameters);
}

/**
 * @param {object} parameters
 * @returns {Promise<object>}
 */
export async function submitQuestionQualityCheckTasks(parameters) {
  return postJson(`${QUALITY_TASK_URL}/submit`, parameters);
}

/**
 * @param {object} parameters
 * @returns {Promise<object>}
 */
export async function queryQuestionQualityCheckTasks(parameters) {
  return postJson(`${QUALITY_TASK_URL}/query`, parameters);
}

/**
 * @param {object} parameters
 * @returns {Promise<object>}
 */
export async function cancelQuestionQualityCheckTasks(parameters) {
  return postJson(`${QUALITY_TASK_URL}/cancel`, parameters);
}
