import { stringify } from "qs";

import request from "../utils/request";

//订正列表
/**
 *
 * @param parameters
 */
export async function getCorrectionProcessList(parameters) {
  return request("/api/get/correctionProcessList", {
    method: "POST",
    body: parameters,
  });
}

//获取审批信息
/**
 *
 * @param parameters
 */
export async function getcorrectionProcessInfo(parameters) {
  return request(`/api/correctionProcessInfo?${stringify(parameters)}`);
}

//审批
/**
 *
 * @param parameters
 */
export async function toApprove(parameters) {
  return request(`/api/audit/process?${stringify(parameters)}`);
}
/**
 *
 * @param parameters
 */
export async function toApproveNew(parameters) {
  return request(
    `/api/evaluation/audit/scoreCorrectionProcess?${stringify(parameters)}`,
  );
}

//获取试卷列表
/**
 *
 * @param parameters
 */
export async function getExamList(parameters) {
  return request(`/api/examNameList?${stringify(parameters)}`);
}
/**
 *
 * @param parameters
 */
export async function getEvaCorrectionDetail(parameters) {
  return request(
    `/api/evaluation/correctionProcessInfo?${stringify(parameters)}`,
  );
}

//获取题号列表
/**
 *
 * @param parameters
 */
export async function getQuestionList(parameters) {
  return request(`/api/getQuestionId/byExamId?${stringify(parameters)}`);
}

//根据题号回显原答案接口和答案下拉
/**
 *
 * @param parameters
 */
export async function getQuestionAnswer(parameters) {
  return request(`/api/getQuestionAnswer?${stringify(parameters)}`);
}

//根据题号查询参考学生和得分列表
/**
 *
 * @param parameters
 */
export async function getQuestionStudent(parameters) {
  return request(`/api/getStudentQuestionResult?${stringify(parameters)}`);
}

/**
 *
 * @param parameters
 */
export async function queryStuScore(parameters) {
  return request(
    `/api/evaluation/getStudentScoreByStudentIdAndEvaluationTargetId?${stringify(parameters)}`,
  );
}
/**
 *
 * @param parameters
 */
export async function getStageList(parameters) {
  return request(
    `/api/evaluation/getEvaluationCriterionItems?${stringify(parameters)}`,
  );
}

/**
 *
 * @param parameters
 */
export async function submitCorrectEva(parameters) {
  return request("/api/evaluation/scoreCorrectionProcess", {
    method: "POST",
    body: parameters,
  });
}
/**
 *
 * @param parameters
 */
export async function getGroupAndStudent(parameters) {
  return request(
    `/api/evaluation/scoreCorrection/selectGroupAndStudentTreeByCourseId?${stringify(parameters)}`,
  );
}
/**
 *
 * @param parameters
 */
export async function getEvaDetail(parameters) {
  return request(
    `/api/evaluation/getCorrectionFormHeadInformation?${stringify(parameters)}`,
  );
}

// export async function getGroupAndStudent(params) {
//   return request(`/api/selectGroupAndStudentTreeByCourseId?${stringify(params)}`);
// }

//提交创建流程
/**
 *
 * @param parameters
 */
export async function submitCorrect(parameters) {
  return request("/api/commit/correction/process", {
    method: "POST",
    body: parameters,
  });
}

/**
 *
 * @param parameters
 */
export async function getWillRevisedStudent(parameters) {
  return request(
    `/api/evaluation/getFailStudentEvaluationTargetId?${stringify(parameters)}`,
  );
}

//查询成绩对应等级
/**
 *
 * @param parameters
 */
export async function fetchModifiedScore(parameters) {
  return request(
    `/api/evaluation/calculateStudentScore?${stringify(parameters)}`,
  );
}
