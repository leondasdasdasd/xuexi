import { stringify } from "qs";

import request from "../utils/request";

// 学段科目列表
/**
 *
 * @param parameters
 */
export async function stageSubjectList(parameters) {
  return request("/api/question/stageSubject/list?" + stringify(parameters));
}

// 获取教学版本和年级信息
/**
 *
 * @param parameters
 */
export async function teachingMaterialAndGradeList(parameters) {
  return request(
    "/api/question/teachingMaterialAndGrade/list?" + stringify(parameters),
  );
}

// 获取题库创建人
/**
 *
 * @param parameters
 */
export async function questionCreateList(parameters) {
  return request("/api/question/create/list?" + stringify(parameters));
}

// 获取题库创建人
/**
 *
 * @param parameters
 */
export async function subjectListByGrades(parameters) {
  return request(
    "/api/question/subject/list/byGrades?" + stringify(parameters),
  );
}
