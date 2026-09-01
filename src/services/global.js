import fetch from "dva/fetch";
import { stringify } from "qs";

import request from "../utils/request";

/**
 *
 * @param contentDisposition
 * @param defaultFileName
 */
function getDownloadFileName(
  contentDisposition,
  defaultFileName = "多学科导入模板.xlsx",
) {
  if (!contentDisposition) {
    return defaultFileName;
  }
  const utf8Match = contentDisposition.match(/filename\*=utf-8''([^;]+)/i);
  const normalMatch = contentDisposition.match(/filename=([^;]+)/i);
  const fileName = utf8Match ? utf8Match[1] : normalMatch ? normalMatch[1] : "";

  if (!fileName) {
    return defaultFileName;
  }

  try {
    return decodeURIComponent(fileName.replaceAll(/["']/g, ""));
  } catch {
    return fileName.replaceAll(/["']/g, "");
  }
}

/**
 *
 * @param parameters
 */
export async function getCurrentUser(parameters) {
  return request(`/api/currentUser?${stringify(parameters)}`);
}

/**
 *
 * @param value
 * @param fallback
 */
function cleanDownloadFilePart(value, fallback) {
  const text = String(value || "")
    .trim()
    .replaceAll(/\s+/g, "");
  const cleanText = text.replaceAll(/["*/:<>?[\\\]|]/g, "").slice(0, 80);
  return cleanText || fallback;
}

/**
 *
 * @param parameters
 */
function getScoreImportTemplateFileName(parameters = {}) {
  const examName = cleanDownloadFilePart(parameters.examName, "成绩导入");
  const examTime = cleanDownloadFilePart(
    parameters.examTime || parameters.examDate,
    "",
  );
  const suffix = parameters.importMode === "append" ? "_原始成绩" : "";
  return `${examName}${examTime ? `_${examTime}` : ""}${suffix}.xlsx`;
}

//切换语言
/**
 *
 * @param parameters
 */
export async function queryLang(parameters) {
  return request("/api/set_language", {
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
export async function queryNoticeList(parameters) {
  return request(`/api/messageCenter/page?${stringify(parameters)}`);
}
/**
 *
 * @param parameters
 */
export async function queryStage(parameters) {
  return request(`/api/question/stage/list?${stringify(parameters)}`);
}

/**
 *
 * @param parameters
 */
export async function addToBasket(parameters) {
  return request(`/api/question/basket/add?${stringify(parameters)}`);
}
/**
 *
 * @param parameters
 */
export async function querySubject(parameters) {
  return request(`/api/question/subject/list?${stringify(parameters)}`);
}

/**
 *
 * @param parameters
 */
export async function cancelToBasket(parameters) {
  return request(`/api/question/basket/unbind?${stringify(parameters)}`);
}
/**
 *
 * @param parameters
 */
export async function queryGrade(parameters) {
  return request(`/api/question/grade/list?${stringify(parameters)}`);
}
/**
 *
 * @param parameters
 */
export async function queryType(parameters) {
  return request(`/api/question/type/list?${stringify(parameters)}`);
}
/**
 *
 */
export async function queryNoticeNumber() {
  return request(`/api/messageCenter/count`);
}

//消息标为已读
/**
 *
 * @param parameters
 */
export async function queryNoticeRead(parameters) {
  return request("/api/messageCenter/read", {
    method: "POST",
    body: {
      ...parameters,
    },
  });
}

//富文本上传文件
/**
 *
 * @param object
 */
export async function richerUploadFile(object) {
  const formData = new FormData();
  formData.append("files", object, object.name);
  return request("/api/upload_file", {
    method: "POST",
    body: formData,
  });
}

// 上传试卷
/**
 *
 * @param object
 */
export async function uploadFileWord(object) {
  const formData = new FormData();
  formData.append("files", object, object.name);
  return request("/api/word/upload_analysis_word", {
    method: "POST",
    body: formData,
  });
}

/**
 *
 * @param parameters
 */
export async function queryRankList(parameters) {
  return request(
    `/api/exam/analyseRankGroupAsRow/getRankList?${stringify(parameters)}`,
  );
}

/**
 *
 * @param parameters
 */
export async function queryScoreByRank(parameters) {
  return request(
    `/api/exam/analyseRankGroupAsRow/getScoreByRank?${stringify(parameters)}`,
  );
}

/**
 *
 * @param parameters
 */
export async function querySaveRankList(parameters) {
  return request(
    `/api/exam/analyseRankGroupAsRow/saveRankList?${stringify(parameters)}`,
  );
}

/**
 *
 * @param parameters
 */
export async function queryAnalyseRankGroupAsRow(parameters) {
  return request(`/api/exam/analyseRankGroupAsRow?${stringify(parameters)}`);
}

/**
 *
 * @param parameters
 */
export async function queryFocusQuestionList(parameters) {
  return request(`/api/exam/get/getFocusQuestionList?${stringify(parameters)}`);
}

/**
 *
 * @param parameters
 */
export async function queryStudentList(parameters) {
  return request(`/api/exam/getStudentList?${stringify(parameters)}`);
}

/**
 *
 * @param parameters
 */
export async function queryAbsentAdminInfoList(parameters) {
  return request(`/api/absentAdminInfoList?${stringify(parameters)}`);
}

/**
 *
 * @param parameters
 */
export async function queryAbsentInfoList(parameters) {
  return request(`/api/absentInfoList?${stringify(parameters)}`);
}

/**
 *
 * @param parameters
 */
export async function queryStudySituationStructureByStudentId(parameters) {
  return request("/api/exam/save/studySituationStructureByStudentId", {
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
export async function queryAbsentManage(parameters) {
  return request("/api/absentManage", {
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
export async function queryGradeList(parameters) {
  return request(`/api/all/gradeList?${stringify(parameters)}`);
}

/**
 *
 * @param parameters
 */
export async function queryNameList(parameters) {
  return request(`/api/exam/nameList?${stringify(parameters)}`);
}
/**
 *
 * @param parameters
 */
export async function queryKnowledgeQuestionList(parameters) {
  return request(
    `/api/trendComparativeAnalysis/knowledgeQuestionList?${stringify(parameters)}`,
  );
}
/**
 *
 * @param parameters
 */
export async function queryErrorQuestionList(parameters) {
  return request(
    `/api/trendComparativeAnalysis/errorQuestionList?${stringify(parameters)}`,
  );
}
/**
 *
 * @param parameters
 */
export async function queryStudentGroupList(parameters) {
  return request(`/api/exam/studentGroupList?${stringify(parameters)}`);
}
/**
 *
 * @param parameters
 */
export async function queryPersonalizedList(parameters) {
  return request(
    `/api/trendComparativeAnalysis/student/personalized/question/list?${stringify(
      parameters,
    )}`,
  );
}
/**
 *
 * @param parameters
 */
export async function queryFindUserCaptureCount(parameters) {
  return request(`/api/exam/studentList?${stringify(parameters)}`);
}
/**
 *
 * @param parameters
 */
export async function queryKnowledgeErrorQuestionList(parameters) {
  return request(
    `/api/trendComparativeAnalysis/knowledgeErrorQuestionList?${stringify(
      parameters,
    )}`,
  );
}
/**
 *
 * @param parameters
 */
export async function queryStudentGroupListAndStudentList(parameters) {
  return request(
    `/api/exam/search/studentGroupListAndStudentList?${stringify(parameters)}`,
  );
}

/**
 *
 * @param parameters
 */
export async function queryListIds(parameters) {
  return request(`/api/question/list/ids?${stringify(parameters)}`);
}

/**
 *
 * @param parameters
 */
export async function queryAllWrongQuestionVersion(parameters) {
  return request(
    `/api/exam/teacher/getAllWrongQuestionVersion?${stringify(parameters)}`,
  );
}
/**
 *
 * @param parameters
 */
export async function queryStuAllWrongQuestionVersion(parameters) {
  return request(
    `/api/exam/student/getWrongQuestionVersion?${stringify(parameters)}`,
  );
}
/**
 *
 * @param parameters
 */
export async function queryExportErrorQuestionList(parameters) {
  return request(
    `/api/trendComparativeAnalysis/export/errorQuestionList?${stringify(
      parameters,
    )}`,
  );
}
/**
 *
 * @param parameters
 */
export async function queryDeleteWrongQuestionVersion(parameters) {
  return request(
    `/api/exam/teacher/deleteWrongQuestionVersion?${stringify(parameters)}`,
  );
}
/**
 *
 * @param parameters
 */
export async function queryChangewrongquestionCorrectness(parameters) {
  return request(
    `/api/exam/student/changewrongquestionCorrectness?${stringify(parameters)}`,
  );
}
/**
 *
 * @param parameters
 */
export async function queryWrongQuestionVersionDetail(parameters) {
  return request(
    `/api/exam/wrongQuestionVersionDetail?${stringify(parameters)}`,
  );
}
/**
 *
 * @param parameters
 */
export async function queryPushedStudentList(parameters) {
  return request(
    `/api/exam/wrongQuestionVersion/studentList?${stringify(parameters)}`,
  );
}
/**
 *
 * @param parameters
 */
export async function queryTotalScore(parameters) {
  return request(`/api/exam/import/totalScore?${stringify(parameters)}`);
}
/**
 *
 * @param parameters
 */
export async function importTotalScoreBySubject(parameters) {
  return request(`api/exam/import/importTotalScoreBySubject`, {
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
export async function downloadTotalScoreBySubjectTemplate(parameters) {
  const response = await fetch(
    `/api/exam/exportTotalScoreBySubjectTepmlate?${stringify(parameters)}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const result = await response.json();
    return {
      success: false,
      message: result.message || "",
      result,
    };
  }

  if (!response.ok) {
    const errorText = await response.text();
    return {
      success: false,
      message: errorText || "",
    };
  }

  const blob = await response.blob();
  return {
    success: true,
    blob,
    fileName: getDownloadFileName(response.headers.get("content-disposition")),
  };
}

/**
 *
 * @param parameters
 */
export async function downloadScoreImportTemplate(parameters) {
  const response = await fetch(
    `/api/exam/import/score/template?${stringify(parameters)}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const result = await response.json();
    return {
      success: false,
      message: result.message || "",
      result,
    };
  }

  if (!response.ok) {
    const errorText = await response.text();
    return {
      success: false,
      message: errorText || "",
    };
  }

  const blob = await response.blob();
  return {
    success: true,
    blob,
    fileName: getDownloadFileName(
      response.headers.get("content-disposition"),
      getScoreImportTemplateFileName(parameters),
    ),
  };
}

/**
 *
 * @param parameters
 */
export async function queryScoreImportAppendOptions(parameters) {
  return request(
    `/api/exam/import/score/append/options?${stringify(parameters)}`,
  );
}

/**
 * 查询当前教师在当前学校下保存的成绩导入学科课程预设。
 * @param {object} params 配置查询参数，必须包含配置类型 type。
 * @param parameters
 * @returns {Promise<object>} 后端通用配置接口响应。
 */
export async function queryScoreImportSubjectPreset(parameters) {
  return request(`/api/config/get?${stringify(parameters)}`);
}

/**
 * 保存当前教师在当前学校下的成绩导入学科课程预设。
 * @param {object} params 配置保存参数，包含 type 和 JSON 字符串 config。
 * @param parameters
 * @returns {Promise<object>} 后端通用配置接口响应。
 */
export async function saveScoreImportSubjectPreset(parameters) {
  return request("/api/config/save", {
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
export async function previewScoreImport(parameters) {
  return request("/api/exam/import/score/preview", {
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
export async function confirmScoreImport(parameters) {
  return request("/api/exam/import/score/confirm", {
    method: "POST",
    body: {
      ...parameters,
    },
  });
}

/**
 * 确认导入智学网原始成绩文件。
 * @param {object} parameters 确认导入参数。
 * @returns {Promise<object>} 后端确认导入响应。
 */
export async function confirmZhixueScoreImport(parameters) {
  return request("/api/exam/import/score/zhixue/confirm", {
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
export async function previewZhixueScoreImport(parameters) {
  return request("/api/exam/import/score/zhixue/preview", {
    method: "POST",
    body: {
      ...parameters,
    },
  });
}

export const previewXuekeScoreImport = previewZhixueScoreImport;

/**
 *
 * @param parameters
 */
export async function queryUniformExaminationScore(parameters) {
  return request(
    `/api/exam/import/uniformExaminationScore?${stringify(parameters)}`,
  );
}
/**
 *
 * @param parameters
 */
export async function queryWrongQuestionVersion(parameters) {
  return request("/api/exam/student/saveWrongQuestionVersion", {
    method: "POST",
    body: {
      ...parameters,
    },
  });
}
/**
 *
 */
export async function thisSemester() {
  return request("/api/exam/thisSemester");
}
/**
 *
 * @param parameters
 */
export async function questionView(parameters) {
  return request("/api/exam/update/questionView", {
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
export async function goodAnswerQuestion(parameters) {
  return request("/api/exam/update/goodAnswerQuestion", {
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
export async function typicalAnswerQuestion(parameters) {
  return request("/api/exam/update/typicalAnswerQuestion", {
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
export async function questionAnalysisPaperModuleAndRate(parameters) {
  return request("/api/exam/questionAnalysisPaperModuleAndRate", {
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
export async function answerQuestionRemark(parameters) {
  return request("/api/exam/update/answerQuestionRemark", {
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
export async function getStudentStudySituationConfig(parameters) {
  return request(
    `/api/exam/get/studentStudySituationConfig?${stringify(parameters)}`,
  );
}

/**
 *
 * @param parameters
 */
export async function saveStudentStudySituationConfig(parameters) {
  return request("/api/exam/save/studentStudySituationConfig", {
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
export async function readingDetail(parameters) {
  return request(`/api/exam/family/reading/detail?${stringify(parameters)}`);
}

/**
 *
 * @param parameters
 */
export async function readingStatistics(parameters) {
  return request(`/api/exam/reading/statistics?${stringify(parameters)}`);
}

/**
 *
 * @param parameters
 */
export async function dingDingRead(parameters) {
  return request(`/api/messageCenter/dingDing/read?${stringify(parameters)}`);
}
/**
 *
 * @param parameters
 */
export async function getExamConfig(parameters) {
  return request(`/api/school/config/getExamConfig`);
}

/**
 *
 * @param parameters
 */
export async function getStudentPaperResult(parameters) {
  return request(
    `/api/print/code/getStudentPaperResult?${stringify(parameters)}`,
  );
}
/**
 *
 * @param parameters
 */
export async function getStudentLisByPrint(parameters) {
  return request(`/api/print/code/getStudentList?${stringify(parameters)}`);
}
/**
 *
 * @param parameters
 */
export async function canLoadExamResult(parameters) {
  return request(`/api/print/code/canLoadExamResult?${stringify(parameters)}`);
}
/**
 *
 * @param parameters
 */
export async function openExamPape(parameters) {
  return request(`/api/print/code/openExamPaper?${stringify(parameters)}`);
}
/**
 *
 * @param parameters
 */
export async function closeExam(parameters) {
  return request(`/api/print/code/closeExam?${stringify(parameters)}`);
}
/**
 *
 * @param parameters
 */
export async function printCodeClassList(parameters) {
  return request(`/api/print/code/classList?${stringify(parameters)}`);
}

/**
 *
 * @param parameters
 */
export async function updateQuestionChapter(parameters) {
  return request("/api/question/updateQuestionChapter", {
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
export async function updateQuestionIndicator(parameters) {
  return request("/api/question/updateQuestionIndicator", {
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
export async function checkPermission(parameters) {
  return request(`/api/check/permission?${stringify(parameters)}`);
}
