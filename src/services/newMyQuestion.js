import { stringify } from "qs";

import request from "../utils/request";
import {
  batchQueryBusinessQuestionTypesV2,
  queryEnabledBusinessQuestionTypesV2,
} from "./businessQuestionTypeV2";

const QUESTION_LIST_INCLUDE = ["answers", "extras"];

const isPresent = (value) =>
  value != undefined && value !== null && value !== "";

const toQueryValues = (value) => {
  const values = Array.isArray(value) ? value : [value];

  return [...new Set(values.filter((value) => isPresent(value)).map(String))];
};

const toCsvQueryValue = (value) => {
  const values = toQueryValues(value);

  return values.length > 0 ? values.join(",") : "";
};

const createQuestionListQuery = (parameters = {}) => {
  const query = {
    include: QUESTION_LIST_INCLUDE.join(","),
  };

  const entries = [
    ["subjectIds", toCsvQueryValue(parameters.subjectIds)],
    [
      "businessQuestionTypeIds",
      toCsvQueryValue(parameters.businessQuestionTypeIds),
    ],
    ["gradeIds", toCsvQueryValue(parameters.gradeIds)],
    ["levels", toCsvQueryValue(parameters.levels)],
    ["knowledgeIds", toCsvQueryValue(parameters.knowledgeIds)],
    ["chapterIds", toCsvQueryValue(parameters.chapterIds)],
    ["keyword", parameters.keyword],
    ["pageNo", parameters.pageNo],
    ["limit", parameters.limit],
  ].flatMap(([key, value]) => (isPresent(value) ? [[key, value]] : []));

  return {
    ...query,
    ...Object.fromEntries(entries),
  };
};

const normalizeQuestionPageResponse = (response) => {
  if (response?.err) {
    return response;
  }

  const content = response.content;

  return {
    ...response,
    content: {
      data: content.items,
      limit: content.limit,
      missingIds: content.missingIds,
      pageNo: content.pageNo,
      total: content.total,
    },
  };
};

/**
 * 新版题库 v2 题目列表接口，调用方直接传 v2 查询字段。
 * @param {object} parameters v2 查询参数。
 * @returns {Promise<object>} 页面列表响应。
 */
export async function queryNewMyQuestionPage(parameters = {}) {
  const query = createQuestionListQuery(parameters);
  const response = await request(`/api/v2/questions?${stringify(query)}`);

  return normalizeQuestionPageResponse(response);
}

/**
 * 新版题库 v2 题型批量查询接口。
 * @param {{businessQuestionTypeIds?: number[], stageId?: number, subjectId?: number}} [parameters] 查询参数。
 * @returns {Promise<object>} 题型列表响应。
 */
export async function batchQueryNewMyBusinessQuestionTypes(parameters = {}) {
  return batchQueryBusinessQuestionTypesV2(parameters);
}

/**
 * 新版题库 v2 启用题型接口，用于筛选栏题型选项。
 * @param {{stageId?: number, subjectId?: number}} [parameters] 可选教学上下文。
 * @returns {Promise<object>} 已启用题型列表响应。
 */
export async function queryEnabledNewMyBusinessQuestionTypes(parameters = {}) {
  return queryEnabledBusinessQuestionTypesV2(parameters);
}
