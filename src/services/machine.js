import request from "../utils/request";
// 获取答题卡上传之后的信息
/**
 *
 * @param parameters
 */
export async function examPaperAnswer(parameters) {
  return request("/api/machine/ExamPaperAnswer", {
    method: "POST",
    body: {
      ...parameters,
    },
  });
}
// 创建/编辑 机阅测验
/**
 *
 * @param parameters
 */
export async function machineReading(parameters) {
  return request("/api/create/machine/reading", {
    method: "POST",
    body: {
      ...parameters,
    },
  });
}
// 创建/编辑 机阅测验
/**
 *
 * @param parameters
 */
export async function createAppraise(parameters) {
  return request("/api/create/appraise", {
    method: "POST",
    body: {
      ...parameters,
    },
  });
}

// 关闭成绩同步评价
/**
 * @param {number} examId 测验 ID
 * @returns {Promise<*>} 关闭成绩同步评价结果
 */
export async function closeAppraise(examId) {
  return request("/api/close/appraise", {
    method: "POST",
    body: {
      examId,
    },
  });
}
