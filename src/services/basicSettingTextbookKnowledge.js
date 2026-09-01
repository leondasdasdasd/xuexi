import { stringify } from "qs";

import request from "../utils/request";

const BASE_URL = "/api/basic-setting/textbook-knowledge";

/**
 * 查询学校可用学段和学科。
 * @param parameters 查询参数
 * @returns 学段学科接口响应
 */
export async function queryBasicSettingStageSubjects(parameters) {
  return request(
    `/api/knowledge/getStageAndSubjectList?${stringify(parameters)}`,
  );
}

/**
 * 查询指定学段、学科的默认教材版本。
 * @param parameters 查询参数
 * @returns 教材版本接口响应
 */
export async function queryBasicSettingTeachingMaterial(parameters) {
  return request(`/api/knowledge/getTeachingMaterial?${stringify(parameters)}`);
}

/**
 * 查询基础设置教材册列表。
 * @param parameters 查询参数
 * @returns 教材册接口响应
 */
export async function queryTextbookBooks(parameters) {
  return request(`${BASE_URL}/textbook-books?${stringify(parameters)}`);
}

/**
 * 查询基础设置章节树。
 * @param parameters 查询参数
 * @returns 章节树接口响应
 */
export async function queryTextbookChapters(parameters) {
  return request(`${BASE_URL}/chapters?${stringify(parameters)}`);
}

/**
 * 保存基础设置章节节点。
 * @param parameters 保存参数
 * @returns 保存接口响应
 */
export async function saveTextbookChapter(parameters) {
  return request(`${BASE_URL}/chapters/save`, {
    method: "POST",
    body: parameters,
  });
}

/**
 * 删除基础设置章节节点。
 * @param parameters 删除参数
 * @returns 删除接口响应
 */
export async function deleteTextbookChapter(parameters) {
  return request(`${BASE_URL}/chapters/delete?${stringify(parameters)}`);
}

/**
 * 保存基础设置章节同级排序。
 * @param parameters 排序参数
 * @returns 排序接口响应
 */
export async function sortTextbookChapters(parameters) {
  return request(`${BASE_URL}/chapters/sort`, {
    method: "POST",
    body: parameters,
  });
}

/**
 * 查询基础设置知识点树。
 * @param parameters 查询参数
 * @returns 知识点树接口响应
 */
export async function queryBasicSettingKnowledges(parameters) {
  return request(`${BASE_URL}/knowledges?${stringify(parameters)}`);
}

/**
 * 保存基础设置知识点节点。
 * @param parameters 保存参数
 * @returns 保存接口响应
 */
export async function saveBasicSettingKnowledge(parameters) {
  return request(`${BASE_URL}/knowledges/save`, {
    method: "POST",
    body: parameters,
  });
}

/**
 * 删除基础设置知识点节点。
 * @param parameters 删除参数
 * @returns 删除接口响应
 */
export async function deleteBasicSettingKnowledge(parameters) {
  return request(`${BASE_URL}/knowledges/delete?${stringify(parameters)}`);
}

/**
 * 保存基础设置知识点同级排序。
 * @param parameters 排序参数
 * @returns 排序接口响应
 */
export async function sortBasicSettingKnowledges(parameters) {
  return request(`${BASE_URL}/knowledges/sort`, {
    method: "POST",
    body: parameters,
  });
}

/**
 * 保存基础设置章节关联知识点。
 * @param parameters 关系保存参数
 * @returns 保存接口响应
 */
export async function saveChapterKnowledgeRelations(parameters) {
  return request(`${BASE_URL}/chapter-knowledge/save`, {
    method: "POST",
    body: parameters,
  });
}

/**
 * 导入基础设置知识点树。
 * @param parameters 导入参数
 * @returns 导入接口响应
 */
export async function importBasicSettingKnowledges(parameters) {
  const formData = new FormData();
  formData.append("file", parameters.file);
  formData.append("subjectId", parameters.subjectId);
  formData.append("stage", parameters.stage);
  formData.append("sourceType", parameters.sourceType);
  if (parameters.importMode)
    formData.append("importMode", parameters.importMode);
  return request(`${BASE_URL}/knowledges/import`, {
    method: "POST",
    body: formData,
  });
}
