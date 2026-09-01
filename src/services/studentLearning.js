import { stringify } from "qs";

import request from "../utils/request";

// 全部学生
/**
 *
 * @param parameters
 */
export async function queryAllStudents(parameters) {
  return request(`/api/getAllStudents?${stringify(parameters)}`);
}

// 全部学科
/**
 *
 * @param parameters
 */
export async function queryAllSubject(parameters) {
  return request(
    `/api/trendComparativeAnalysis/getFilterSubjectList?${stringify(parameters)}`,
  );
}

// 全部学科
/**
 *
 * @param parameters
 */
export async function queryTeachingOrg(parameters) {
  return request(`/api/getTeachingOrg?${stringify(parameters)}`);
}
