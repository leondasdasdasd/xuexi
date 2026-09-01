import { stringify } from "qs";

import request from "../utils/request";

//获取我的课程列表
/**
 *
 * @param parameters
 */
export async function getCourseList(parameters) {
  return request(`/api/task/my/courses?${stringify(parameters)}`);
}

//获取对应课程下某个单元的学习活动
/**
 *
 * @param parameters
 */
export async function getActivityList(parameters) {
  return request(`/api/task/unit/list?${stringify(parameters)}`);
}

/**
 *
 * @param parameters
 */
export async function getIfShow(parameters) {
  return request(`/api/isSubjective?${stringify(parameters)}`);
}
//获取所有的老师
/**
 *
 * @param parameters
 */
export async function getAllTeachers(parameters) {
  return request(`/api/task/all/teachers?${stringify(parameters)}`);
}

//获取班级列表和班级下的教师、学生列表
/**
 *
 * @param parameters
 */
export async function getGroupList(parameters) {
  return request(`/api/task/list/group?${stringify(parameters)}`);
}

// 日课下的学生
/**
 *
 * @param parameters
 */
export async function queryCourseStudents(parameters) {
  return request(`/api/getCourseStudents?${stringify(parameters)}`);
}

//创建学习单
/**
 *
 * @param parameters
 */
export async function create(parameters) {
  return request("/api/task/learn/resource/create", {
    method: "POST",
    body: {
      ...parameters,
    },
  });
}

//发布
/**
 *
 * @param parameters
 */
export async function release(parameters) {
  return request("/api/task/create/resource/publish", {
    method: "POST",
    body: {
      ...parameters,
    },
  });
}
