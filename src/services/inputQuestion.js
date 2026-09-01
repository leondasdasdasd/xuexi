import { stringify } from "qs";

import { installBatchInputPasteImageHandler } from "../components/InputQuestion/BatchInput/pasteImages";
import request from "../utils/request";

//题目批量添加
/**
 *
 * @param parameters
 */
export async function importQuestion(parameters) {
  return request("/api/question/insert/batch", {
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
export async function saveOcrTaskQuestions(parameters) {
  return request("/api/exam-paper-ocr/task/question/batch-save", {
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
export async function saveOcrTaskDraft(parameters) {
  return request("/api/exam-paper-ocr/task/draft/save", {
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
export async function queryEditQuestion(parameters) {
  return request(`/api/questionBankId?${stringify(parameters)}`);
}
//获取全部年级
/**
 *
 * @param parameters
 */
export async function getAllGradeList(parameters) {
  return request(`/api/question/newGrade/list?${stringify(parameters)}`);
}

//获取学段列表
/**
 *
 * @param parameters
 */
export async function getSectionList(parameters) {
  return request(`/api/question/stage/list?${stringify(parameters)}`);
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
export async function queryTree(parameters) {
  console.log("params", parameters);
  return request(`/api/question/knowledge/list?${stringify(parameters)}`);
}
/**
 *
 * @param parameters
 */
export async function queryChapter(parameters) {
  console.log("params", parameters);
  return request(`/api/question/chapter/list?${stringify(parameters)}`);
}

/**
 *
 * @param parameters
 */
export async function uploadIndexing(parameters) {
  return request("/api/paper/upload/paper/index ", {
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
export async function saveEditQuestion(parameters) {
  return request("/api/question/save", {
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
export async function queryAdmin(parameters) {
  return request(
    `/api/paper/getUseOptionKnowledgeWhiteList?${stringify(parameters)}`,
  );
}

//获取年级列表
/**
 *
 * @param parameters
 */
export async function getGradeList(parameters) {
  return request(`/api/question/grade/list?${stringify(parameters)}`);
}

//获取学科列表
/**
 *
 * @param parameters
 */
export async function getSubjectList(parameters) {
  return request(`/api/question/subject/list?${stringify(parameters)}`);
}

//公式转为图片
/**
 *
 * @param parameters
 */
export async function mathToImage(parameters) {
  return request("/api/question/formula/picture", {
    method: "POST",
    body: {
      ...parameters,
    },
  });
}

//题目批量添加到试题篮
/**
 *
 * @param parameters
 */
export async function importQuestionBasket(parameters) {
  return request("/api/question/insert/batch/basket", {
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
export async function listRecommendation(parameters) {
  return request("/api/question/list/recommendation", {
    method: "POST",
    body: {
      ...parameters,
    },
  });
}

/**
 *
 * @param file
 */
export async function uploadImportImage(file) {
  const formData = new FormData();
  formData.append("files", file, file.name);
  return request("/api/upload_file", {
    method: "POST",
    body: formData,
  });
}

installBatchInputPasteImageHandler(uploadImportImage);

/**
 *
 * @param parameters
 */
export async function recognizeQuestionsByHtml(parameters) {
  return request("/api/conversationByBlock", {
    method: "POST",
    body: {
      ...parameters,
    },
  });
}
