import { stringify } from "qs";

import request from "../utils/request";
import { getMockQuestionTaskResult } from "./mockQuestionTaskResult";

/**
 *
 * @param parameters
 */
export async function queryView(parameters) {
  console.log(parameters, "123");
  return request(`/api/paper/basket/paper?${stringify(parameters)}`);
}
/**
 *
 * @param parameters
 */
export async function queryTestView(parameters) {
  return request(`/api/paper/detail?${stringify(parameters)}`);
}
/**
 *
 * @param parameters
 */
export async function queryStudentTest(parameters) {
  console.log(parameters, "ppp");
  return request(
    `/api/paper/student/exam/before/detail?${stringify(parameters)}`,
  );
}

/**
 *
 * @param parameters
 */
export async function queryModifyAnalysisDimension(parameters) {
  return request(
    `/api/paper/get/qualityIndicator/file?${stringify(parameters)}`,
  );
}

//上传封面图--oss授权地址
/**
 *
 * @param parameters
 */
export async function getOssAssume(parameters) {
  return request(`/api/sts/token?${stringify(parameters)}`);
}
/**
 *
 * @param parameters
 */
export async function queryTable(parameters) {
  return request(
    `/api/trendComparativeAnalysis/studentOverallScoreList?${stringify(parameters)}`,
  );
  // console.log(params, 'pppp')
  // return request("/api/paper/getTable", {
  //   method: "POST",
  //   body: params,
  // })
}

//展示试卷下的维度列表
/**
 *
 * @param parameters
 */
export async function queryDimensionAnalysis(parameters) {
  console.log("msg：", "dimensionAnalysis  接口调用开始");
  return request(`/api/paper/get/dimensionAnalysis?${stringify(parameters)}`);
}

//按学生查看统计分析
/**
 *
 * @param parameters
 */
export async function queryStuAnalysis(parameters) {
  return request(`/api/analysis/stuQuestionAnalysis?${stringify(parameters)}`);
}

//学生分析导出
/**
 *
 * @param parameters
 */
export async function queryStuQuestionAnalysisExport(parameters) {
  return request(
    `/api/analysis/stuQuestionAnalysis/export?${stringify(parameters)}`,
  );
}

/**
 *
 * @param parameters
 */
export async function queryScoreAnalysis(parameters) {
  return request(`/api/analysis/scoreAnalysis?${stringify(parameters)}`);
}
//按试题查看统计分析
/**
 *
 * @param parameters
 */
export async function getQuestionAnalysis(parameters) {
  return request(`/api/analysis/question/angle?${stringify(parameters)}`);
}
/**
 *
 * @param parameters
 */
export async function queryBasket(parameters) {
  return request(`/api/question/basket/list?${stringify(parameters)}`);
}
/**
 *
 * @param parameters
 */
export async function stuStart(parameters) {
  return request(`/api/paper/start/exam?${stringify(parameters)}`);
}
/**
 *
 * @param parameters
 */
export async function updateItem(parameters) {
  return request(`/api/question/details?${stringify(parameters)}`);
}
/**
 *
 * @param parameters
 */
export async function getYear(parameters) {
  return request(`/api/paper/year/list?${stringify(parameters)}`);
}

/**
 *
 * @param parameters
 */
export async function testDelete(parameters) {
  return request(`/api/paper/delete?${stringify(parameters)}`);
}
/**
 *
 * @param parameters
 */
export async function queryIsTest(parameters) {
  return request(`/api/paper/status?${stringify(parameters)}`);
}
/**
 *
 * @param parameters
 */
export async function queryCount(parameters) {
  return request(`/api/question/basket/number/count?${stringify(parameters)}`);
}

/**
 *
 * @param parameters
 */
export async function queryClass(parameters) {
  return request(`/api/exam/groupListByExamId?${stringify(parameters)}`);
}
/**
 *
 * @param parameters
 */
export async function queryDataSource(parameters) {
  return request(`/api/examInfoById?${stringify(parameters)}`);
}

/**
 *
 * @param parameters
 */
export async function queryMobileRadar(parameters) {
  return request(
    `/api/trendComparativeAnalysis/studentOverallScorePhoneList?${stringify(parameters)}`,
  );
}

/**
 *
 * @param parameters
 */
export async function queryWrongQuestion(parameters) {
  return request("/api/exam/getWrongTopic", {
    method: "POST",
    body: parameters,
  });
}
/**
 *
 * @param parameters
 */
export async function queryReductionHistory(parameters) {
  return request(`/api/score/correction/history?${stringify(parameters)}`);
}

/**
 *
 * @param parameters
 */
export async function uploadWorkCard(parameters) {
  return request("/api/word/third/homework/wordHandler", {
    method: "POST",
    body: parameters,
  });
}
/**
 *
 * @param parameters
 */
export async function queryWrongQuestionAnalysis(parameters) {
  return request("/api/exam/study/group", {
    method: "POST",
    body: parameters,
  });
}
/**
 *
 * @param parameters
 */
export async function queryAllSubject(parameters) {
  return request("/api/getCourseList/bySubject", {
    method: "POST",
    body: parameters,
  });
}
/**
 *
 * @param parameters
 */
export async function querySubjectByGrade(parameters) {
  return request("/api/subject/list/byStage", {
    method: "POST",
    body: parameters,
  });
}

/**
 *
 * @param parameters
 */
export async function querySubjectList(parameters) {
  return request("/api/question/subject/list", {
    method: "GET",
    body: parameters,
  });
}
/**
 *
 * @param parameters
 */
export async function queryAllGrade(parameters) {
  return request(`/api/all/grade/list?${stringify(parameters)}`);
}
/**
 *
 * @param parameters
 */
export async function queryGroupResult(parameters) {
  return request(`/api/exam/getStudyGroupResult?${stringify(parameters)}`);
}

/**
 *
 * @param parameters
 */
export async function queryKnowLedgeStu(parameters) {
  console.log("msg：", "qualityIndicatorReportWithStudent 接口调用开始");
  return request(
    `/api/exam/qualityIndicatorReportWithStudent?${stringify(parameters)}`,
  );
}
/**
 *
 * @param parameters
 */
export async function querySaveGroup(parameters) {
  return request("/api/exam/setStudyGroupResult", {
    method: "POST",
    body: parameters,
  });
}

/**
 *
 * @param parameters
 */
export async function queryKnowLedgeTable(parameters) {
  return request(
    `/api/exam/qualityIndicatorReportWithGroup?${stringify(parameters)}`,
  );
}
/**
 *
 * @param parameters
 */
export async function queryScoreSetting(parameters) {
  return request(
    `/api/exam/get/scoreSectionPlanFromAdmin?${stringify(parameters)}`,
  );
}
/**
 *
 * @param parameters
 */
export async function getSettingRateValue(parameters) {
  return request(`/api/config/get?${stringify(parameters)}`);
}
/**
 *
 * @param parameters
 */
export async function getIfAdmin(parameters) {
  return request(
    `/api/exam/get/scoreSectionPlanIsAdmin?${stringify(parameters)}`,
  );
}
//保存三率
/**
 *
 * @param parameters
 */
export async function saveSettingRate(parameters) {
  return request("/api/config/save", {
    method: "POST",
    body: parameters,
  });
}
/**
 *
 * @param parameters
 */
export async function queryStudentScore(parameters) {
  return request(
    `/api/paper/student/exam/after/detail?${stringify(parameters)}`,
  );
}

/**
 *
 * @param parameters
 */
export async function scoreSectionPlan(parameters) {
  return request("/api/exam/save/scoreSectionPlan", {
    method: "POST",
    body: parameters,
  });
}

/**
 *
 * @param parameters
 */
export async function queryPrintingPaper(parameters) {
  return request(`/api/exam/getPrintingPaper?${stringify(parameters)}`);
  // return request("/api/exam/getPrintingPaper", {
  //   method: "POST",
  //   body: params,
  // });
}

/**
 *
 * @param parameters
 */
export async function queryGradeClass(parameters) {
  return request("/api/group/list", {
    method: "POST",
    body: parameters,
  });
}
/**
 *
 * @param parameters
 */
export async function queryStuGrade(parameters) {
  return request(`/api/getGroupsByExam?${stringify(parameters)}`);
}
/**
 *
 * @param parameters
 */
export async function queryScoreSection(parameters) {
  return request(
    `/api/exam/analyseScoreSectionGroupAsRow?${stringify(parameters)}`,
  );
}
/**
 *
 * @param parameters
 */
export async function queryExamType(parameters) {
  return request(`/api/paper/type/list?${stringify(parameters)}`);
}

/**
 *
 * @param parameters
 */
export async function postExam(parameters) {
  return request("/api/word/wordHandler", {
    method: "POST",
    body: parameters,
  });
}

/**
 *
 * @param parameters
 */
export async function uploadStuFile(parameters) {
  return request("/api/paper/exam/submit/student/question/process", {
    method: "POST",
    body: parameters,
  });
}

/**
 *
 * @param parameters
 */
export async function queryScoreSummary1(parameters) {
  return request(`/api/exam/summary/class/student?${stringify(parameters)}`);
}

/**
 *
 * @param parameters
 */
export async function queryScoreSummary(parameters) {
  return request("/api/exam/resultSummary", {
    method: "POST",
    body: parameters,
  });
}

/**
 *
 * @param parameters
 */
export async function queryStuScore(parameters) {
  console.log("jj1");
  return request("/api/exam/resultListByGroup", {
    method: "POST",
    body: parameters,
  });
}
/**
 *
 * @param parameters
 */
export async function queryQuestion(parameters) {
  return request("/api/question/list/show", {
    method: "POST",
    body: parameters,
  });
}

/**
 *
 * @param parameters
 */
export async function updateQuestionKnowlegeOrLevel(parameters) {
  return request("/api/question/updateQuestionKnowlegeOrLevel", {
    method: "POST",
    body: parameters,
  });
}

/**
 *
 * @param parameters
 */
export async function stuSubmitTest(parameters) {
  return request("/api/paper/exam/submit", {
    method: "POST",
    body: parameters,
  });
}
/**
 *
 * @param parameters
 */
export async function queryQuestionScore(parameters) {
  return request("/api/exam/questionScoreAnalyse", {
    method: "POST",
    body: parameters,
  });
}
/**
 *
 * @param parameters
 */
export async function queryScoreRate(parameters) {
  return request("/api/exam/analyseScoreRateSectionGroupAsRow", {
    method: "POST",
    body: parameters,
  });
}
/**
 *
 * @param parameters
 */
export async function queryExam(parameters) {
  return request("/api/examInfoList", {
    method: "POST",
    body: parameters,
  });
}

/**
 *
 * @param parameters
 */
export async function queryStuInfo(parameters) {
  console.log(JSON.stringify(parameters), "asas");
  return request(
    `/api/studnetInfoByIds?studentUserIds=${encodeURIComponent(
      JSON.stringify(parameters.stuList),
    )}&examId=${parameters.examId}`,
  );
}

/**
 *
 * @param parameters
 */
export async function queryExamOptions(parameters) {
  return request(`/api/exam/options?${stringify(parameters)}`);
}
/**
 *
 * @param parameters
 */
export async function getExamCorrection(parameters) {
  return request(`/api/examCorrection/options?${stringify(parameters)}`);
}
/**
 *
 * @param parameters
 */
export async function examCorrection(parameters) {
  return request("/api/batch/update/examCorrection", {
    method: "POST",
    body: parameters,
  });
}
/**
 *
 * @param parameters
 */
export async function getExamType(parameters) {
  return request(`/api/exam/getType?${stringify(parameters)}`);
}
/**
 *
 * @param parameters
 */
export async function getExamRuleData(parameters) {
  return request("/api/examCorrectionList", {
    method: "POST",
    body: parameters,
  });
}
/**
 *
 * @param parameters
 */
export async function updateExamTableData(parameters) {
  return request("/api/update/examCorrection", {
    method: "POST",
    body: parameters,
  });
}
/**
 *
 * @param parameters
 */
export async function deleteQuestion(parameters) {
  return request(`/api/question/delete?${stringify(parameters)}`);
}
/**
 *
 * @param parameters
 */
export async function queryQuestionAnalysis(parameters) {
  return request(`/api/analysis/questionAnalysis?${stringify(parameters)}`);
}
/**
 *
 * @param parameters
 */
export async function queryAnalysis(parameters) {
  return request(`/api/analysis/overallAnalysis?${stringify(parameters)}`);
}
/**
 *
 * @param parameters
 */
export async function itemSave(parameters) {
  return request("/api/evaluation/item/save", {
    method: "POST",
    body: parameters,
  });
}

/**
 *
 * @param parameters
 */
export async function querypersonal(parameters) {
  return request("/api/paper/auto/acquire/question", {
    method: "POST",
    body: parameters,
  });
}
/**
 *
 * @param parameters
 */
export async function submitViewApi(parameters) {
  return request("/api/paper/save/paper", {
    method: "POST",
    body: parameters,
  });
}
/**
 *
 * @param parameters
 */
export async function queryTest(parameters) {
  return request("/api/paper/list", {
    method: "POST",
    body: parameters,
  });
}

/**
 *
 * @param parameters
 */
export async function queryKnowLedgeAnalysis(parameters) {
  return request(`/api/analysis/knowledge/analysis?${stringify(parameters)}`);
}
//按班级查看统计人数
/**
 *
 * @param parameters
 */
export async function getPersonAnalysis(parameters) {
  return request(`/api/analysis/pushStudentInfo?${stringify(parameters)}`);
}

//按学生查看班级答题情况
/**
 *
 * @param parameters
 */
export async function getAnswerRate(parameters) {
  return request(`/api/analysis/answerRate?${stringify(parameters)}`);
}
/**
 *
 * @param parameters
 */
export async function queryViewChart(parameters) {
  return request(`/api/analysis/statistics?${stringify(parameters)}`);
}
/**
 *
 * @param parameters
 */
export async function queryDownloadUrl(parameters) {
  return request(`/api/exam/convert/word/export?${stringify(parameters)}`);
}

//班级列表
/**
 *
 * @param parameters
 */
export async function getClassList(parameters) {
  return request(`/api/analysis/paperGroupNames?${stringify(parameters)}`);
}

// 试卷列表
/**
 *
 * @param parameters
 */
export async function queryPaperList(parameters) {
  return request("/api/paper/get/paperList", {
    method: "POST",
    body: parameters,
  });
}

// 所有学科
/**
 *
 * @param parameters
 */
export async function queryAllTestSubject(parameters) {
  return request(`/api/question/subject/list?${stringify(parameters)}`);
}

// 删除试卷列表
/**
 *
 * @param parameters
 */
export async function queryDeleteTestList(parameters) {
  return request(`/api/paper/delete/byId?${stringify(parameters)}`);
}

// 查询试卷
/**
 *
 * @param parameters
 */
export async function queryInquireTest(parameters) {
  return request(`/api/paper/detail/byId?${stringify(parameters)}`);
}

// 修改试卷
/**
 *
 * @param parameters
 */
export async function queryModifyTest(parameters) {
  return request("/api/paper/update", {
    method: "POST",
    body: parameters,
  });
}

// 历史试卷列表
/**
 *
 * @param parameters
 */
export async function queryhistoryTestList(parameters) {
  return request(`/api/paper/history?${stringify(parameters)}`);
}

//原卷/印刷卷下载
/**
 *
 * @param parameters
 */
export async function queryOriginalVolumeDownload(parameters) {
  return request(`/api/paper/download?${stringify(parameters)}`);
}

//素养指标绑定试卷
/**
 *
 * @param parameters
 */
export async function queryAttainmentTest(parameters) {
  return request(`/api/paper/bind/qualityIndicator?${stringify(parameters)}`);
}

//个性化试题
/**
 *
 * @param parameters
 */
export async function queryIndividuationTest(parameters) {
  return request(`/api/exam/getIndividuationTest?${stringify(parameters)}`);
}

// 当前学期
/**
 *
 * @param parameters
 */
export async function queryCurrentSemester(parameters) {
  return request(`/api/currentTimeToSemester?${stringify(parameters)}`);
}

/**
 *
 * @param parameters
 */
export async function queryCorrection(parameters) {
  console.log("jj2");
  return request("/api/exam/resultListByGroup", {
    method: "POST",
    body: parameters,
  });
}

//不及格人数
/**
 *
 * @param parameters
 */
export async function queryFlunkListByStudent1(parameters) {
  return request(`/api/exam/summary/flunk/student?${stringify(parameters)}`);
}

//不及格人数
/**
 *
 * @param parameters
 */
export async function queryFlunkListByStudent(parameters) {
  return request("/api/exam/resultSummary/flunkListByStudent", {
    method: "POST",
    body: parameters,
  });
}

/**
 *
 * @param parameters
 */
export async function queryType(parameters) {
  return request(`/api/paper/type/list?${stringify(parameters)}`);
}
/**
 *
 * @param parameters
 */
export async function queryTrendStu(parameters) {
  return request(
    `/api/trendComparativeAnalysis/getStudentInfo?${stringify(parameters)}`,
  );
}

/**
 *
 * @param parameters
 */
export async function queryCompareTest(parameters) {
  return request(`/api/paper/type/compareList?${stringify(parameters)}`);
}

//小题班级对比
/**
 *
 * @param parameters
 */
export async function queryGroupContrast(parameters) {
  return request(`/api/exam/question/group/contrast?${stringify(parameters)}`);
}
/**
 *
 * @param parameters
 */
export async function queryTrend(parameters) {
  return request(
    `/api/trendComparativeAnalysis/getTrendAnalysisResult?${stringify(parameters)}`,
  );
  // return request("/api/trendComparativeAnalysis/getTrendAnalysisResult", {
  //   method: "POST",
  //   body: params,
  // });
}
/**
 *
 * @param parameters
 */
export async function queryTrendAnalysisResultNew(parameters) {
  return request(
    `/api/trendComparativeAnalysis/getTrendAnalysisResultNew?${stringify(
      parameters,
    )}`,
  );
}

//作答明细
/**
 *
 * @param parameters
 */
export async function queryAnswerDetails(parameters) {
  return request(
    `/api/exam/question/answer/detail/report?${stringify(parameters)}`,
  );
}

//原卷图片
/**
 *
 * @param parameters
 */
export async function queryStudentOriginal(parameters) {
  return request(`/api/paper/student/original/volume?${stringify(parameters)}`);
}

// 班级分数分层修改
/**
 *
 * @param parameters
 */
export async function queryUpdateStage(parameters) {
  return request("/api/qualityAnalysis/updateStage", {
    method: "POST",
    body: parameters,
  });
}

// 编辑
/**
 *
 * @param parameters
 */
export async function queryEditReport(parameters) {
  return request("/api/qualityAnalysis/editReport", {
    method: "POST",
    body: parameters,
  });
}

//获取锁
/**
 *
 * @param parameters
 */
export async function getLock(parameters) {
  return request("/api/qualityAnalysis/getLock", {
    method: "POST",
    body: {
      ...parameters,
    },
  });
}

//释放锁
/**
 *
 * @param parameters
 */
export async function releaseLock(parameters) {
  return request("/api/qualityAnalysis/releaseLock", {
    method: "POST",
    body: {
      ...parameters,
    },
  });
}

//强行抢锁
/**
 *
 * @param parameters
 */
export async function forceLock(parameters) {
  return request("/api/qualityAnalysis/forcedLock", {
    method: "POST",
    body: {
      ...parameters,
    },
  });
}

//质量分析报告权限
/**
 *
 * @param parameters
 */
export async function identityJudgement(parameters) {
  return request(
    `/api/qualityAnalysis/identityJudgement?${stringify(parameters)}`,
  );
}

// 得分率分析
/**
 *
 * @param parameters
 */
export async function queryScoringRate(parameters) {
  return request(
    `/api/qualityAnalysis/reportPresentation?${stringify(parameters)}`,
  );
}

// 上传回显
/**
 *
 * @param parameters
 */
export async function queryReviewUploadedFile(parameters) {
  return request(
    `/api/qualityAnalysis/reviewUploadedFile?${stringify(parameters)}`,
  );
}

//文件删除
/**
 *
 * @param parameters
 */
export async function deleteUploadedFile(parameters) {
  return request("/api/qualityAnalysis/deleteUploadedFile", {
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
export async function sendAllParent(parameters) {
  return request("/api/exam/sendAallStudentStudySituationForParent", {
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
export async function changeManagement(parameters) {
  return request(`/api/authority/management?${stringify(parameters)}`);
}
/**
 *
 * @param parameters
 */
export async function querySpecial(parameters) {
  return request(`/api/exam/groupScoreAnalyseSpecial?${stringify(parameters)}`);
}
/**
 *
 * @param parameters
 */
export async function queryDownload(parameters) {
  return request(`/api/exam/getStudentReportFile?${stringify(parameters)}`);
}
/**
 *
 * @param parameters
 */
export async function getPaperIndex(parameters) {
  return request(`/api/paper/getPaperIndex?${stringify(parameters)}`);
}
/**
 *
 * @param parameters
 */
export async function getIndexImg(parameters) {
  return request(`/api/paper/getPaperIndexImageList?${stringify(parameters)}`);
}

//文件绑定
/**
 *
 * @param parameters
 */
export async function bindUploadedFile(parameters) {
  return request("/api/qualityAnalysis/bindUploadedFile", {
    method: "POST",
    body: {
      ...parameters,
    },
  });
}

// 排名分析
/**
 *
 * @param parameters
 */
export async function comparativeAnalysis(parameters) {
  return request("/api/trendComparativeAnalysis/getComparativeResult", {
    method: "POST",
    body: {
      ...parameters,
    },
  });
}

// 对比考试
/**
 *
 * @param parameters
 */
export async function examSelect(parameters) {
  return request(
    `/api/trendComparativeAnalysis/examSelect?${stringify(parameters)}`,
  );
}
// 获取配置
/**
 *
 * @param parameters
 */
export async function getConfig(parameters) {
  return request(`/api/config/get?${stringify(parameters)}`);
}

// 保存配置
/**
 *
 * @param parameters
 */
export async function saveConfig(parameters) {
  return request(`/api/config/save`, {
    method: "POST",
    body: {
      ...parameters,
    },
  });
}

// 获取列表数据
/**
 *
 * @param parameters
 */
export async function advanceRetreatAnalysis(parameters) {
  return request(`/api/trendComparativeAnalysis/advanceRetreatAnalysis`, {
    method: "POST",
    body: {
      ...parameters,
    },
  });
}
// 关注
/**
 *
 * @param parameters
 */
export async function attentionStudent(parameters) {
  return request(`/api/trendComparativeAnalysis/attentionStudent`, {
    method: "POST",
    body: {
      ...parameters,
    },
  });
}
// 出错情况
/**
 *
 * @param parameters
 */
export async function classQuestionAnalysis(parameters) {
  return request("/api/exam/question/answer/detail/classQuestionAnalysis", {
    method: "POST",
    body: {
      ...parameters,
    },
  });
}

// 班级下所有学生
/**
 *
 * @param parameters
 */
export async function getGroupStudents(parameters) {
  return request("/api/exam/question/answer/detail/getGroupStudents", {
    method: "POST",
    body: {
      ...parameters,
    },
  });
}

// 导入试卷
/**
 *
 * @param parameters
 */
export async function querySaveUploadPaper(parameters) {
  return request("/api/paper/word/saveUploadPaper", {
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
export async function queryLogUser(parameters) {
  return request(`/get/exam/sys/log/user?${stringify(parameters)}`);
}
// 1.在线查看试卷 + 2.下载打印试卷
/**
 *
 * @param parameters
 */
export async function queryViewOrDownPaper(parameters) {
  return request(`/api/paper/viewOrDownPaper?${stringify(parameters)}`);
}

// 发起线上保存
/**
 *
 * @param parameters
 */
export async function queryResourceCreate(parameters) {
  return request("/api/task/learn/resource/create", {
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
export async function publishStudy(parameters) {
  return queryResourceCreate(parameters);
}

/**
 *
 * @param parameters
 */
export async function removeFileName(parameters) {
  return request("/api/task/learn/resource/fileName", {
    method: "POST",
    body: parameters,
  });
}

/**
 *
 * @param parameters
 */
export async function queryStudyType(parameters) {
  return request(`/api/paper/type/list?${stringify(parameters)}`);
}

/**
 *
 * @param parameters
 */
export async function querySubject(parameters) {
  return querySubjectByGrade(parameters);
}

/**
 *
 * @param parameters
 */
export async function queryAllClass(parameters) {
  return request(`/api/getAllClass?${stringify(parameters)}`);
}

/**
 *
 * @param parameters
 */
export async function queryLabel(parameters) {
  return request(`/api/question/indicator/list?${stringify(parameters)}`);
}

/**
 *
 * @param parameters
 */
export async function findTree(parameters) {
  return request(`/api/question/catalog/tree?${stringify(parameters)}`);
}

/**
 *
 * @param parameters
 */
export async function addRegularLabel(parameters) {
  return request("/api/question/indicator/save", {
    method: "POST",
    body: parameters,
  });
}

/**
 *
 * @param parameters
 */
export async function queryUserInfo(parameters) {
  return request(`/api/user/info?${stringify(parameters)}`);
}

/**
 *
 * @param parameters
 */
export async function queryUpdateAvatar(parameters) {
  return request("/api/user/avatar/update", {
    method: "POST",
    body: parameters,
  });
}

// 评价
/**
 *
 * @param parameters
 */
export async function selectEvaluationCategoryByExample(parameters) {
  return request(
    `/api/capture/selectEvaluationCategoryByExample?${stringify(parameters)}`,
  );
}
/**
 *
 * @param parameters
 */
export async function queryEvaluationItemListByCategoryId(parameters) {
  return request(
    `/api/task/getEvaluationItemListByCategoryId?${stringify(parameters)}`,
  );
}

// 评价选学生
/**
 *
 * @param parameters
 */
export async function queryCriterionList(parameters) {
  return request(
    `/api/task/evaluation/criterion/list?${stringify(parameters)}`,
  );
}

// 选择试卷后的回显
/**
 *
 * @param parameters
 */
export async function queryPaperInfo(parameters) {
  return request(`/api/getPaperInfo?${stringify(parameters)}`);
}

// 根据examId回显 测验表单信息
/**
 *
 * @param parameters
 */
export async function queryExamInfoByExamId(parameters) {
  return request(`/api/getExamInfoByExamId?${stringify(parameters)}`);
}

/**
 *
 * @param parameters
 */
export async function queryTaskPublishDisplay(parameters) {
  return request(`/api/getTaskPublishDisplay?${stringify(parameters)}`);
}

// 测验管理点击删除
/**
 *
 * @param parameters
 */
export async function examDelete(parameters) {
  return request(`/api/exam/delete?${stringify(parameters)}`);
}

// 修改 测验/试卷名称
/**
 *
 * @param parameters
 */
export async function editPaperOrExamName(parameters) {
  return request(`/api/paper/editPaperOrExamName?${stringify(parameters)}`);
}

// 测验学生端
/**
 *
 * @param parameters
 */
export async function postStudentExamList(parameters) {
  return request("/api/student/exam/list", {
    method: "POST",
    body: {
      ...parameters,
    },
  });
}

// 学情分析的主体结构展示
/**
 *
 * @param parameters
 */
export async function queryStudySituationStructure(parameters) {
  return request(
    `/api/exam/get/studySituationStructure?${stringify(parameters)}`,
  );
}

// 预览学情分析展示
/**
 *
 * @param parameters
 */
export async function queryStudySituationByStudentId(parameters) {
  return request(
    `/api/exam/get/studySituationByStudentId?${stringify(parameters)}`,
  );
}

// 我的答卷
/**
 *
 * @param parameters
 */
export async function queryExamPaperResultUrl(parameters) {
  return request(
    `/api/student/exam/getExamPaperResultUrl?${stringify(parameters)}`,
  );
}

// 题目试卷
/**
 *
 * @param parameters
 */
export async function queryExamPaper(parameters) {
  return request(`/api/student/exam/getExamPaper?${stringify(parameters)}`);
}

/**
 *
 * @param parameters
 */
export async function queryExamPaperOcrTaskResult(parameters) {
  if (parameters && parameters.taskId === "mock") {
    return {
      content: getMockQuestionTaskResult(),
      status: true,
    };
  }
  return request(`/api/exam-paper-ocr/task/result?${stringify(parameters)}`);
}

// 学情分析保存
/**
 *
 * @param parameters
 */
export async function querySaveStudySituationStructure(parameters) {
  return request("/api/exam/save/studySituationStructure", {
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
export async function queryGroupAndGradeScoreRate(parameters) {
  return request(
    `/api/qualityAnalysis/getGroupAndGradeScoreRate?${stringify(parameters)}`,
  );
}

/**
 *
 * @param parameters
 */
export async function queryUserByName(parameters) {
  return request(`/api/qualityAnalysis/getUserByName?${stringify(parameters)}`);
}

//回显白名单
/**
 *
 * @param parameters
 */
export async function queryFilterStudentList(parameters) {
  return request(`/api/exam/getFilterStudentList?${stringify(parameters)}`);
}

/**
 *
 * @param parameters
 */
export async function queryFilterStudentListPermissions(parameters) {
  return request(
    `/api/exam/getFilterStudentList/permissions?${stringify(parameters)}`,
  );
}

//保存过滤名单
/**
 *
 * @param parameters
 */
export async function queryFilterStudent(parameters) {
  return request("/api/exam/saveFilterStudent", {
    method: "POST",
    body: {
      ...parameters,
    },
  });
}

// 分析看版
/**
 *
 * @param parameters
 */
export async function queryAnalysisVersion(parameters) {
  return request(`/api/qualityAnalysis/dataBoard?${stringify(parameters)}`);
}

//日志
// 分析看版
/**
 *
 * @param parameters
 */
export async function querySysLog(parameters) {
  return request(`/get/exam/sys/log?${stringify(parameters)}`);
}

/**
 *
 * @param parameters
 */
export async function queryStageUnderIdentity(parameters) {
  return request(
    `/api/qualityAnalysis/getStageUnderIdentity?${stringify(parameters)}`,
  );
}

/**
 *
 * @param parameters
 */
export async function queryRatioDealShow(parameters) {
  return request(`/api/exam/ratioDealShow?${stringify(parameters)}`);
}

/**
 *
 * @param parameters
 */
export async function querySelectAllTutor(parameters) {
  return request(`/api//selectAllTutor?${stringify(parameters)}`);
}

/**
 *
 * @param parameters
 */
export async function queryGroupChanging(parameters) {
  return request(`/api/exam/groupChanging?${stringify(parameters)}`);
}

/**
 *
 * @param parameters
 */
export async function queryEffectPreviewSubmit(parameters) {
  return request("/api/exam/effectPreviewSubmit", {
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
export async function queryRatioDeal(parameters) {
  return request("/api/exam/ratioDeal", {
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
export async function queryScoreSectionPlan(parameters) {
  return request("/api/exam/save/scoreSectionPlan", {
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
export async function queryCalPercentOrFraction(parameters) {
  return request("/api/exam/save/calPercentOrFraction", {
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
export async function queryGetRatioDealShow(parameters) {
  return request("/api/exam/deleteProportion", {
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
export async function queryAllStudentStudySituation(parameters) {
  return request(
    `/api/exam/download/allStudentStudySituation?${stringify(parameters)}`,
  );
  // return request("/api/exam/download/allStudentStudySituation", {
  //   method: "POST",
  //   body: {
  //     ...params,
  //   },
  // });
}
/**
 *
 * @param parameters
 */
export async function queryUploadFile(parameters) {
  return request(`/api/paper/uploadFile?${stringify(parameters)}`);
}
/**
 *
 * @param parameters
 */
export async function queryStudentByExamList(parameters) {
  return request(`/api/analysis/studentByExam?${stringify(parameters)}`);
}
/**
 *
 * @param parameters
 */
export async function queryAllStudentByName(parameters) {
  return request(`/api/getAllStudentByName?${stringify(parameters)}`);
}
/**
 *
 * @param parameters
 */
export async function queryExamLog(parameters) {
  return request(`/api/insert/exam/log?${stringify(parameters)}`);
}
/**
 *
 * @param parameters
 */
export async function queryErrorMsg(parameters) {
  return request(`/api/subject/network/get/error/msg?${stringify(parameters)}`);
}
/**
 *
 * @param parameters
 */
export async function queryKnowledgePointReportWithGroup(parameters) {
  return request(
    `/api/exam/knowledgePointReportWithGroup?${stringify(parameters)}`,
  );
}

/**
 *
 * @param parameters
 */
export async function getScoreDistinguishPlan(parameters) {
  return request(`/api/exam/get/scoreDistinguishPlan?${stringify(parameters)}`);
}

/**
 *
 * @param parameters
 */
export async function singleQuestionAnalysis(parameters) {
  return request("/api/exam/questionAnalysis", {
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
export async function messageLog(parameters) {
  return request(`/api/exam/send/message/log?${stringify(parameters)}`);
}

/**
 *
 * @param parameters
 */
export async function resendMessage(parameters) {
  return request(`/api/exam/resend/message?${stringify(parameters)}`);
}

/**
 *
 * @param parameters
 */
export async function reRevokeMessage(parameters) {
  return request(`/api/exam/reRevoke/message?${stringify(parameters)}`);
}
