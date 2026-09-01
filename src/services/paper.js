import { stringify } from "qs";

import request from "../utils/request";

/**
 *
 * @param parameters
 */
export async function paperEndScan(parameters) {
  return request(`/api/paper/endScan?${stringify(parameters)}`);
}

/**
 *
 * @param parameters
 */
export async function paperStartScan(parameters) {
  return request(`/api/paper/startScan?${stringify(parameters)}`);
}
/**
 *
 * @param parameters
 */
export async function updateQuestionScore(parameters) {
  return request("/api/paper/update/question/score", {
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
export async function saveSegement(parameters) {
  return request("/api/paper/save/segmentation", {
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
export async function saveView(parameters) {
  return request("/api/paper/segmentation/cover", {
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
export async function querySegement(parameters) {
  return request(`/api/paper/segmentation/detail?${stringify(parameters)}`);
}

/**
 *
 * @param parameters
 */
export async function queryTypeList(parameters) {
  return request(`/api/paper/type/list?${stringify(parameters)}`);
}

/**
 *
 * @param parameters
 */
export async function savePaperLevelData(parameters) {
  return request(`/api/paper/savePaperLevelData`, {
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
export async function getPaperPrivateStatus(parameters) {
  return request(`/api/paper/get/paperPrivateStatus?${stringify(parameters)}`);
}

/**
 *
 * @param parameters
 */
export async function updatePaperPrivateStatus(parameters) {
  return request(
    `/api/paper/update/paperPrivateStatus?${stringify(parameters)}`,
    {
      method: "POST",
      body: {},
    },
  );
}

/**
 *
 * @param parameters
 */
export async function paperCopy(parameters) {
  return request(`/api/paper/copy?${stringify(parameters)}`);
}

/**
 *
 * @param parameters
 */
export async function updatePaperFile(parameters) {
  return request(`/api/paper/updatePaperFile`, {
    method: "POST",
    body: parameters,
  });
}

/**
 *
 * @param file
 */
export async function uploadPaperSourceFile(file) {
  const formData = new FormData();
  formData.append("file", file, file.name);
  return request("/api/upload_file", {
    method: "POST",
    body: formData,
  });
}

/**
 *
 * @param parameters
 */
export async function createUploadedPaper(parameters) {
  return request("/api/paper/uploaded-paper/create", {
    method: "POST",
    body: parameters,
  });
}

/**
 *
 * @param parameters
 */
export async function submitExamPaperOcrTask(parameters) {
  return request("/api/exam-paper-ocr/task/submit", {
    method: "POST",
    body: parameters,
  });
}

/**
 *
 * @param parameters
 */
export async function queryLatestExamPaperOcrTask(parameters) {
  return request(`/api/exam-paper-ocr/task/latest?${stringify(parameters)}`);
}

// 细目表编辑抢锁落锁
/**
 *
 * @param parameters
 */
export async function paperCanEdit(parameters) {
  return request(`/api/paper/canEdit?${stringify(parameters)}`);
}
