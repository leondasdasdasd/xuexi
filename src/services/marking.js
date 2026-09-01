import { stringify } from "qs";

import request from "../utils/request";

// 阅卷主页
/**
 *
 * @param parameters
 */
export async function queryOnlineMarkingPaperList(parameters) {
  return request(`/api/onlineMarking/paperList?${stringify(parameters)}`);
}
// 批改进度
/**
 *
 * @param parameters
 */
export async function queryCheckQuestionList(parameters) {
  return request(
    `/api/onlineMarking/checkQuestionList?${stringify(parameters)}`,
  );
}
// 各状态列表数量
/**
 *
 * @param parameters
 */
export async function queryPaperListNum(parameters) {
  return request(`/api/onlineMarking/paperListNum?${stringify(parameters)}`);
}
// 是否分配过题块
/**
 *
 * @param parameters
 */
export async function queryExamPaperSettingStatus(parameters) {
  return request(
    `/api/onlineMarking/examPaperSettingStatus?${stringify(parameters)}`,
  );
}
// 题目信息
/**
 *
 * @param parameters
 */
export async function queryQuestionList(parameters) {
  return request(`/api/onlineMarking/questionList?${stringify(parameters)}`);
}
//题块保存
/**
 *
 * @param parameters
 */
export async function queryInsertOrUpdate(parameters) {
  return request("/api/onlineMarking/questionModule/insertOrUpdate", {
    method: "POST",
    body: parameters,
  });
}
//设为问题卷
/**
 *
 * @param parameters
 */
export async function querySetStudentPaperQuestion(parameters) {
  return request(
    `/api/onlineMarking/setStudentPaperQuestion?${stringify(parameters)}`,
  );
}
//分配列表
/**
 *
 * @param parameters
 */
export async function queryAllocationList(parameters) {
  return request(
    `/api/onlineMarking/questionAllocation/list?${stringify(parameters)}`,
  );
}
//评分方式
/**
 *
 * @param parameters
 */
export async function queryMarkingType(parameters) {
  return request(`/api/onlineMarking/markingType?${stringify(parameters)}`);
}
//分配方式
/**
 *
 * @param parameters
 */
export async function queryAllocationType(parameters) {
  return request(`/api/onlineMarking/allocationType?${stringify(parameters)}`);
}
//全部教师
/**
 *
 * @param parameters
 */
export async function queryListAllOrgTeachers(parameters) {
  return request(`/course/api/listAllOrgTeachers?${stringify(parameters)}`);
}
//完成分配
/**
 *
 * @param parameters
 */
export async function queryAllocationSettingComplete(parameters) {
  return request("/api/onlineMarking/allocationSetting/complete", {
    method: "POST",
    body: {
      ...parameters,
    },
  });
}
//保存分配
/**
 *
 * @param parameters
 */
export async function queryAllocationSettingSave(parameters) {
  return request("/api/onlineMarking/allocationSetting/save", {
    method: "POST",
    body: {
      ...parameters,
    },
  });
}
//修改分数
/**
 *
 * @param parameters
 */
export async function queryCheckQuestion(parameters) {
  return request("/api/onlineMarking/checkQuestion", {
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
export async function queryQuestionIdOrPiece(parameters) {
  return request(
    `/api/onlineMarking/questionIdOrPiece?${stringify(parameters)}`,
  );
}
//根据题目id，查询对应的答卷信息
/**
 *
 * @param parameters
 */
export async function queryQuestionImage(parameters) {
  return request(`/api/onlineMarking/questionImage?${stringify(parameters)}`);
}
//查看原卷
/**
 *
 * @param parameters
 */
export async function queryStudentExamPaperImage(parameters) {
  return request(
    `/api/onlineMarking/studentExamPaperImage?${stringify(parameters)}`,
  );
}
//上传成绩
/**
 *
 * @param parameters
 */
export async function queryUploadPaperScore(parameters) {
  return request(
    `/api/onlineMarking/uploadPaperScore?${stringify(parameters)}`,
  );
}
//设置学生题目预批状态
/**
 *
 * @param parameters
 */
export async function querySetCheckStatus(parameters) {
  return request(`/api/onlineMarking/setCheckStatus?${stringify(parameters)}`);
}

/**
 *
 * @param parameters
 */
export async function queryRefreshSchedule(parameters) {
  return request(`/api/onlineMarking/refreshSchedule?${stringify(parameters)}`);
}
/**
 *
 * @param parameters
 */
export async function getMeCheckQuestionUser(parameters) {
  return request(
    `/api/onlineMarking/getMeCheckQuestionUser?${stringify(parameters)}`,
  );
}

// 左上角题块接口
/**
 *
 * @param parameters
 */
export async function questionIdOrPieceForResult(parameters) {
  return request(
    `/api/onlineMarking/questionIdOrPieceForResult?${stringify(parameters)}`,
  );
}

// 获取学生列表
/**
 *
 * @param parameters
 */
export async function getMeCheckQuestionUserForResult(parameters) {
  return request(
    `/api/onlineMarking/getMeCheckQuestionUserForResult?${stringify(parameters)}`,
  );
}

// 获取题目信息
/**
 *
 * @param parameters
 */
export async function questionImageForResult(parameters) {
  return request(
    `/api/onlineMarking/questionImageForResult?${stringify(parameters)}`,
  );
}

// 批改学生答案
/**
 *
 * @param parameters
 */
export async function checkQuestionForResult(parameters) {
  return request(`/api/onlineMarking/checkQuestionForResult`, {
    method: "POST",
    body: {
      ...parameters,
    },
  });
}
