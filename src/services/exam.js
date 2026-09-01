import { stringify } from "qs";

import request from "../utils/request";
// 成绩汇总报告班级汇总
/**
 *
 * @param parameters
 */
export async function classSummary(parameters) {
  return request(`/api/exam/summary/class/summary`, {
    method: "POST",
    body: {
      ...parameters,
    },
  });
}
// 成绩汇总报告班级三率
/**
 *
 * @param parameters
 */
export async function classRate(parameters) {
  return request(`/api/exam/summary/class/rate`, {
    method: "POST",
    body: {
      ...parameters,
    },
  });
}
// 成绩汇总报告列表
/**
 *
 * @param parameters
 */
export async function summaryList(parameters) {
  return request(`/api/exam/summary/List`, {
    method: "POST",
    body: {
      ...parameters,
    },
  });
}
// 成绩汇总报告详情
/**
 *
 * @param parameters
 */
export async function summaryDetail(parameters) {
  return request(`/api/exam/summary/detail?${stringify(parameters)}`);
}

// 创建更新成绩汇总报告
/**
 *
 * @param parameters
 */
export async function summaryCreatOrUpdate(parameters) {
  return request("/api/exam/summary/creatOrUpdate", {
    method: "POST",
    body: {
      ...parameters,
    },
  });
}

// 创建更新成绩汇总报告
/**
 *
 * @param parameters
 */
export async function summaryClassStudentOne(parameters) {
  return request(`/api/exam/summary/class/studentOne?${stringify(parameters)}`);
}

// 学生成绩汇总看板
/**
 *
 * @param parameters
 */
export async function studentSummaryDashboard(parameters = {}) {
  const { summaryReportIds, ...restParameters } = parameters;
  const baseQuery = stringify(restParameters);
  // 后端使用 @RequestParam List<Long> 接收，这里必须传重复参数，避免 qs 默认下标格式绑定失败。
  const summaryReportQuery = Array.isArray(summaryReportIds)
    ? summaryReportIds
        .map((id) => `summaryReportIds=${encodeURIComponent(id)}`)
        .join("&")
    : "";
  const query = [baseQuery, summaryReportQuery].filter(Boolean).join("&");
  return request(`/api/exam/summary/student/summary-dashboard?${query}`);
}

/**
 *
 * @param parameters
 */
export async function reportConfigGet(parameters) {
  return request(`/api/config/reportConfig/get?${stringify(parameters)}`);
}

/**
 *
 * @param parameters
 */
export async function examInfoListByGrade(parameters) {
  return request("/api/examInfoListByGrade", {
    method: "POST",
    body: parameters,
  });
}

/**
 *
 * @param parameters
 */
export async function supplementParallelPapers(parameters) {
  return request(
    `/api/subject/network/supplement/parallelPapers?${stringify(parameters)}`,
  );
}

/**
 *
 * @param parameters
 */
export async function getExamModule(parameters) {
  return request(`/api/school/config/getExamModule?${stringify(parameters)}`);
}

/**
 *
 * @param parameters
 */
export async function missStudentList(parameters) {
  return request(`/api/exam/summary/missStudentList?${stringify(parameters)}`);
}

/**
 *
 * @param parameters
 */
export async function summaryDelete(parameters) {
  return request(`/api/exam/summary/delete?${stringify(parameters)}`);
}
/**
 *
 * @param parameters
 */
export async function summaryOpenFlag(parameters) {
  return request(`/api/exam/summary/openFlag?${stringify(parameters)}`);
}

/**
 *
 * @param parameters
 */
export async function summaryGetStudentList(parameters) {
  return request(`/api/exam/summary/getStudentList?${stringify(parameters)}`);
}
/**
 *
 * @param parameters
 */
export async function summarySendMessage(parameters) {
  return request("/api/exam/summary/sendMessage", {
    method: "POST",
    body: parameters,
  });
}

/**
 *
 * @param parameters
 */
export async function accomplishmentReportWithGroup(parameters) {
  return request(
    `/api/exam/accomplishmentReportWithGroup?${stringify(parameters)}`,
  );
}

/**
 *
 * @param parameters
 */
export async function accomplishmentReportWithStudent(parameters) {
  return request(
    `/api/exam/accomplishmentReportWithStudent?${stringify(parameters)}`,
  );
}

/**
 *
 * @param parameters
 */
export async function questionLevelDetail(parameters) {
  return request(
    `/api/exam/accomplishmentReportWithGroup/questionLevelDetail?${stringify(parameters)}`,
  );
}

/**
 *
 * @param parameters
 */
export async function getPaperLevelData(parameters) {
  return request(`/api/paper/getPaperLevelData?${stringify(parameters)}`);
}

/**
 *
 * @param parameters
 */
export async function summaryFrontAnalysis(parameters) {
  return request(`/api/exam/summary/front/analysis?${stringify(parameters)}`);
}

/**
 *
 * @param parameters
 */
export async function summaryCreateSystem(parameters) {
  return request(`/api/exam/summary/create/system?${stringify(parameters)}`);
}

// 查询参与成绩汇总考试的班级列表
/**
 *
 * @param parameters
 */
export async function paperGroupNames(parameters) {
  return request(`/api/exam/summary/paperGroupNames?${stringify(parameters)}`);
}

// 获取指定班级下学生信息（指定班级为空，则查询所有学生）
/**
 *
 * @param parameters
 */
export async function getStudentInfo(parameters) {
  return request(`/api/exam/summary/getStudentInfo?${stringify(parameters)}`);
}

// 指定学生学情分析报告预览
/**
 *
 * @param parameters
 */
export async function getStudySituationByStudentId(parameters) {
  return request(
    `/api/exam/summary/get/studySituationByStudentId?${stringify(parameters)}`,
  );
}

// 获取ai报告的表单参数
/**
 *
 * @param parameters
 */
export async function getStudentSummaryScoresAIParams(parameters) {
  return request(
    `/api/exam/AI/getStudentSummaryScoresAIParams?${stringify(parameters)}`,
  );
}
// 获取ai预生成报告内容
/**
 *
 * @param parameters
 */
export async function getStudentSummaryScoresResult(parameters) {
  return request(
    `/api/exam/AI/getStudentSummaryScoresResult?${stringify(parameters)}`,
  );
}

/**
 *
 * @param parameters
 */
export async function getStudentPerformanceReportResult(parameters) {
  return request(
    `/api/exam/AI/getStudentPerformanceReportResult?${stringify(parameters)}`,
  );
}

/**
 *
 * @param parameters
 */
export async function getStudentPerformanceReportAIParams(parameters) {
  return request(
    `/api/exam/AI/getStudentPerformanceReportAIParams?${stringify(parameters)}`,
  );
}

/**
 *
 * @param parameters
 */
export async function summaryContrastList(parameters) {
  return request("/api/exam/summary/contrast/list", {
    method: "POST",
    body: parameters,
  });
}

/**
 *
 * @param parameters
 */
export async function saveStudySituationStructure(parameters) {
  return request("/api/exam/summary/save/studySituationStructure", {
    method: "POST",
    body: parameters,
  });
}

/**
 *
 * @param parameters
 */
export async function groupScoreAnalyse(parameters) {
  return request(`/api/exam/groupScoreAnalyse?${stringify(parameters)}`);
}

/**
 *
 * @param parameters
 */
export async function updateStudySituation(parameters) {
  return request("/api/exam/updateStudySituation", {
    method: "POST",
    body: parameters,
  });
}
/**
 *
 * @param parameters
 */
export async function studySituationPermission(parameters) {
  return request(
    `/api/exam/studySituation/permission?${stringify(parameters)}`,
  );
}

/**
 *
 * @param parameters
 */
export async function summaryUpdateAiAnalyse(parameters) {
  return request(`/api/exam/summary/updateAiAnalyse?${stringify(parameters)}`);
}

/**
 *
 * @param parameters
 */
export async function checkUserAuthority(parameters) {
  return request(`/api/exam/checkUserAuthority?${stringify(parameters)}`);
}
