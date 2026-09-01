import request from "../utils/request";

const BASE_URL = "/api/paper/exam-structure-match";

/**
 *
 * @param parameters
 */
export async function queryExamStructureMatchDetail(parameters) {
  return request(`${BASE_URL}/detail`, {
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
export async function startExamStructureAiMatch(parameters) {
  return request(`${BASE_URL}/ai-match`, {
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
export async function saveExamStructureMatchDraft(parameters) {
  return request(`${BASE_URL}/draft`, {
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
export async function applyExamStructureMatch(parameters) {
  return request(`${BASE_URL}/apply`, {
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
export async function queryExamStructurePaperSummary(parameters) {
  return request(`${BASE_URL}/paper-summary`, {
    method: "POST",
    body: {
      ...parameters,
    },
  });
}
