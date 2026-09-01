export const V2_QUESTION_LIST_QUERY_SESSION_KEY = "v2QuestionList.query.v2";

const QUERY_SESSION_VERSION = 2 as const;

type QueryTreeKey = string;

export interface V2QuestionListQueryContext {
  businessQuestionTypeIds: number[];
  chapterGradeId?: number;
  chapterIds: QueryTreeKey[];
  gradeIds: number[];
  keyword: string;
  knowledgeIds: QueryTreeKey[];
  knowledgeMultiple: boolean;
  levels: number[];
  limit: number;
  pageNo: number;
  stageId?: number;
  subjectId?: number;
  tabKey: 1 | 2;
  teachingMaterialId?: number;
}

type QuestionTypeGradeContext = Pick<
  V2QuestionListQueryContext,
  "chapterGradeId" | "gradeIds" | "tabKey"
>;

/**
 * 按当前目录视图派生题型筛选实际使用的年级。
 * @param {QuestionTypeGradeContext} queryContext 当前页面查询上下文。
 * @returns {number[]} 当前请求使用的年级 ID。
 */
export const getQuestionTypeFilterGradeIds = (
  queryContext: QuestionTypeGradeContext,
): number[] =>
  queryContext.tabKey === 1
    ? queryContext.chapterGradeId
      ? [queryContext.chapterGradeId]
      : []
    : queryContext.gradeIds;

/**
 * 判断题型与年级筛选是否符合后端唯一年级契约。
 * @param {number[]} businessQuestionTypeIds 当前业务题型 ID。
 * @param {number[]} gradeIds 当前请求使用的年级 ID。
 * @returns {boolean} 筛选组合可直接查询时返回 true。
 */
export const isValidQuestionTypeGradeFilter = (
  businessQuestionTypeIds: number[],
  gradeIds: number[],
): boolean => businessQuestionTypeIds.length === 0 || gradeIds.length === 1;

export type V2QuestionListQueryStorage = Pick<
  Storage,
  "getItem" | "removeItem" | "setItem"
>;

const readPositiveInteger = (value: unknown): number | undefined => {
  if (
    typeof value !== "number" &&
    (typeof value !== "string" || value.trim() === "")
  ) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
};

const readPositiveIntegerList = (value: unknown): number[] => {
  if (!Array.isArray(value)) return [];

  const values = value
    .map((item) => readPositiveInteger(item))
    .filter((item): item is number => item !== undefined);
  return [...new Set(values)];
};

const readTreeKeyList = (value: unknown): QueryTreeKey[] => {
  if (!Array.isArray(value)) return [];

  const values = value
    .filter((item) => typeof item === "string" || typeof item === "number")
    .map(String)
    .map((item) => item.trim())
    .filter(Boolean);
  return [...new Set(values)];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * 将不可信的会话数据收口为 V2 题库页面唯一查询上下文。
 * @param {unknown} value 待校验的会话数据。
 * @returns {V2QuestionListQueryContext} 字段已归一化的查询上下文。
 */
export const normalizeV2QuestionListQueryContext = (
  value: unknown,
): V2QuestionListQueryContext => {
  const source = isRecord(value) ? value : {};
  const levelValues = readPositiveIntegerList(source.levels).filter((level) =>
    [1, 2, 3].includes(level),
  );

  return {
    businessQuestionTypeIds: readPositiveIntegerList(
      source.businessQuestionTypeIds,
    ),
    chapterGradeId: readPositiveInteger(source.chapterGradeId),
    chapterIds: readTreeKeyList(source.chapterIds),
    gradeIds: readPositiveIntegerList(source.gradeIds),
    keyword: typeof source.keyword === "string" ? source.keyword : "",
    knowledgeIds: readTreeKeyList(source.knowledgeIds),
    knowledgeMultiple: source.knowledgeMultiple === true,
    levels: levelValues,
    limit: readPositiveInteger(source.limit) || 10,
    pageNo: readPositiveInteger(source.pageNo) || 1,
    stageId: readPositiveInteger(source.stageId),
    subjectId: readPositiveInteger(source.subjectId),
    tabKey: source.tabKey === 2 ? 2 : 1,
    teachingMaterialId: readPositiveInteger(source.teachingMaterialId),
  };
};

/**
 * 将 V2 题库查询上下文编码为版本化会话数据。
 * @param {V2QuestionListQueryContext} queryContext 页面查询上下文。
 * @returns {string} 可写入 sessionStorage 的 JSON。
 */
export const serializeV2QuestionListQuerySession = (
  queryContext: V2QuestionListQueryContext,
): string => {
  const normalizedQueryContext =
    normalizeV2QuestionListQueryContext(queryContext);
  if (
    !isValidQuestionTypeGradeFilter(
      normalizedQueryContext.businessQuestionTypeIds,
      getQuestionTypeFilterGradeIds(normalizedQueryContext),
    )
  ) {
    throw new TypeError("Invalid question type and grade filter");
  }

  return JSON.stringify({
    query: normalizedQueryContext,
    version: QUERY_SESSION_VERSION,
  });
};

/**
 * 解析版本化会话数据，损坏或版本不匹配时返回 undefined。
 * @param {string} value sessionStorage 原始值。
 * @returns {V2QuestionListQueryContext|undefined} 合法查询上下文。
 */
export const parseV2QuestionListQuerySession = (
  value: string,
): V2QuestionListQueryContext | undefined => {
  try {
    const payload: unknown = JSON.parse(value);
    if (!isRecord(payload) || payload.version !== QUERY_SESSION_VERSION) {
      return undefined;
    }
    const queryContext = normalizeV2QuestionListQueryContext(payload.query);
    return isValidQuestionTypeGradeFilter(
      queryContext.businessQuestionTypeIds,
      getQuestionTypeFilterGradeIds(queryContext),
    )
      ? queryContext
      : undefined;
  } catch {
    return undefined;
  }
};

const getBrowserSessionStorage = (): V2QuestionListQueryStorage | undefined => {
  try {
    return typeof window === "undefined" ? undefined : window.sessionStorage;
  } catch {
    return undefined;
  }
};

/**
 * 读取当前标签页保存的 V2 题库查询上下文。
 * @param {V2QuestionListQueryStorage|undefined} storage 会话存储边界。
 * @returns {V2QuestionListQueryContext|undefined} 已保存的查询上下文。
 */
export const readV2QuestionListQuerySession = (
  storage = getBrowserSessionStorage(),
): V2QuestionListQueryContext | undefined => {
  if (!storage) return undefined;

  try {
    const value = storage.getItem(V2_QUESTION_LIST_QUERY_SESSION_KEY);
    if (value === null) return undefined;
    const queryContext = parseV2QuestionListQuerySession(value);
    if (!queryContext) storage.removeItem(V2_QUESTION_LIST_QUERY_SESSION_KEY);
    return queryContext;
  } catch {
    return undefined;
  }
};

/**
 * 保存当前标签页的 V2 题库查询上下文。
 * @param {V2QuestionListQueryContext} queryContext 页面查询上下文。
 * @param {V2QuestionListQueryStorage|undefined} storage 会话存储边界。
 * @returns {boolean} 写入成功时返回 true。
 */
export const saveV2QuestionListQuerySession = (
  queryContext: V2QuestionListQueryContext,
  storage = getBrowserSessionStorage(),
): boolean => {
  if (!storage) return false;

  try {
    storage.setItem(
      V2_QUESTION_LIST_QUERY_SESSION_KEY,
      serializeV2QuestionListQuerySession(queryContext),
    );
    return true;
  } catch {
    return false;
  }
};
