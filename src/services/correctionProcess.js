import { stringify } from "qs";

import request from "../utils/request";
// 管理员代理审核
/**
 *
 * @param parameters
 */
export async function adminAgentAudit(parameters) {
  return request(
    `/api/correctionProcess/admin/agent/audit?${stringify(parameters)}`,
  );
}

// 管理员审核
/**
 *
 * @param parameters
 */
export async function adminAudit(parameters) {
  return request(`/api/correctionProcess/admin/audit?${stringify(parameters)}`);
}

// 管理员重新打开
/**
 *
 * @param parameters
 */
export async function adminReopen(parameters) {
  return request(
    `/api/correctionProcess/admin/reopen?${stringify(parameters)}`,
  );
}

// 是否可以重新打开流程
/**
 *
 * @param parameters
 */
export async function reopenOperation(parameters) {
  return request(
    `/api/correctionProcess/admin/reopen/operation?${stringify(parameters)}`,
  );
}

// 未来可能到达分数订正流程列表
/**
 *
 * @param parameters
 */
export async function correctionProcessList(parameters) {
  return request("/api/correctionProcess/get/possible/correctionProcessList", {
    method: "POST",
    body: {
      ...parameters,
    },
  });
}
