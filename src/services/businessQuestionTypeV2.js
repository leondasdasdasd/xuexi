import { stringify } from "qs";

import request from "../utils/request";

const SUCCESS_RESPONSE = {
  code: 0,
  ifLogin: true,
  message: "成功",
  status: true,
};

/** @typedef {{stageId?: number|string, subjectId?: number|string, businessQuestionTypeIds?: Array<number|string>}} BusinessQuestionTypeQueryParameters */

const isPresent = (value) =>
  value != undefined && value !== null && value !== "";

const toQueryValues = (value) => {
  const values = Array.isArray(value) ? value : [value];

  return [...new Set(values.filter((item) => isPresent(item)).map(String))];
};

const hasPartialTeachingContext = ({ stageId, subjectId } = {}) =>
  isPresent(stageId) !== isPresent(subjectId);

const hasTeachingContext = ({ stageId, subjectId } = {}) =>
  isPresent(stageId) && isPresent(subjectId);

const rejectPartialTeachingContext = async (message) => {
  undefined;
  throw new Error(message);
};

const parseRequiredQuestionTypeBoolean = (
  value,
  fieldName,
  businessQuestionTypeId,
) => {
  if (typeof value !== "boolean") {
    throw new TypeError(
      `业务题型响应字段${fieldName}必须为布尔值，businessQuestionTypeId=${businessQuestionTypeId}`,
    );
  }
  return value;
};

const normalizeBusinessQuestionType = (questionType) => ({
  ...questionType,
  isBuiltin: parseRequiredQuestionTypeBoolean(
    questionType?.isBuiltin,
    "isBuiltin",
    questionType?.businessQuestionTypeId,
  ),
  isComposite: parseRequiredQuestionTypeBoolean(
    questionType?.isComposite,
    "isComposite",
    questionType?.businessQuestionTypeId,
  ),
});

/**
 * @param {BusinessQuestionTypeQueryParameters} [parameters] 查询条件。
 * @returns {string} 序列化后的查询字符串。
 */
const createQuestionTypeQuery = ({
  stageId,
  subjectId,
  businessQuestionTypeIds,
} = {}) => {
  const query = {};
  const hasStageId = isPresent(stageId);
  const hasSubjectId = isPresent(subjectId);
  if (hasStageId && hasSubjectId) {
    query.stageId = stageId;
    query.subjectId = subjectId;
  }
  const normalizedIds = toQueryValues(businessQuestionTypeIds);
  if (normalizedIds.length > 0) {
    query.businessQuestionTypeIds = normalizedIds;
  }
  const serialized = stringify(query, { arrayFormat: "repeat" });
  return serialized ? `?${serialized}` : "";
};

const normalizeQuestionTypeCollectionResponse = (response) => {
  if (response?.err || !response?.ifLogin || !response?.status) {
    return response;
  }

  return {
    ...response,
    content: response.content.items.map((questionType) =>
      normalizeBusinessQuestionType(questionType),
    ),
    missingBusinessQuestionTypeIds:
      response.content.missingBusinessQuestionTypeIds,
  };
};

/**
 * v2 启用题型接口，作为题型列表的唯一服务端入口。
 * @param {BusinessQuestionTypeQueryParameters} [parameters] 查询条件。
 * @returns {Promise<object>} 归一后的题型列表响应。
 */
export async function queryEnabledBusinessQuestionTypesV2(parameters = {}) {
  if (!hasTeachingContext(parameters)) {
    return rejectPartialTeachingContext("stageId和subjectId必须同时提供");
  }
  const response = await request(
    `/api/v2/business-question-types${createQuestionTypeQuery(parameters)}`,
  );

  return normalizeQuestionTypeCollectionResponse(response);
}

/**
 * v2 题型批量查询接口。
 * @param {BusinessQuestionTypeQueryParameters} [parameters] 查询参数。
 * @returns {Promise<object>} 归一后的题型列表响应。
 */
export async function batchQueryBusinessQuestionTypesV2(parameters = {}) {
  if (hasPartialTeachingContext(parameters)) {
    return rejectPartialTeachingContext("stageId和subjectId必须同时提供");
  }
  const businessQuestionTypeIds = toQueryValues(
    parameters.businessQuestionTypeIds,
  );

  if (
    businessQuestionTypeIds.length === 0 &&
    !isPresent(parameters.stageId) &&
    !isPresent(parameters.subjectId)
  ) {
    return {
      ...SUCCESS_RESPONSE,
      content: [],
      missingBusinessQuestionTypeIds: [],
    };
  }

  const response = await request(
    `/api/v2/business-question-types${createQuestionTypeQuery({
      ...parameters,
      businessQuestionTypeIds,
    })}`,
  );

  return normalizeQuestionTypeCollectionResponse(response);
}
