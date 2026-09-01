import type { PaperEditorPageContext } from "./types";

const PAPER_EDITOR_ROUTE_PATH = "/paperEditor";

const readPositiveQueryId = (value: unknown): number | undefined => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
};

/**
 * 将路由查询参数收口为页面唯一的加载上下文。
 * @param {Record<string, unknown>} query 路由查询参数。
 * @returns {PaperEditorPageContext|undefined} 合法的页面上下文，参数组合无效时返回 undefined。
 */
export const parsePaperEditorPageContext = (
  query: Record<string, unknown>,
): PaperEditorPageContext | undefined => {
  if (query.mode === undefined) {
    const subjectId = readPositiveQueryId(query.subjectId);
    return subjectId ? { mode: "create", subjectId } : undefined;
  }
  if (query.mode !== "edit" && query.mode !== "preview") return undefined;
  const paperId = readPositiveQueryId(query.paperId);
  return paperId ? { mode: query.mode, paperId } : undefined;
};

export const parsePaperEditorSearch = (
  search: string,
): PaperEditorPageContext | undefined =>
  parsePaperEditorPageContext(Object.fromEntries(new URLSearchParams(search)));

/**
 * 由页面上下文边界统一生成试卷编辑路径，保持入口与解析契约一致。
 * @param {number} paperId 试卷标识。
 * @returns {string} 当前应用内的试卷编辑路径。
 */
export const buildPaperEditorEditPath = (paperId: number): string =>
  `${PAPER_EDITOR_ROUTE_PATH}?mode=edit&paperId=${encodeURIComponent(paperId)}`;

/**
 * 由页面上下文边界统一生成只读试卷详情路径。
 * @param {number} paperId 试卷标识。
 * @returns {string} 当前应用内的只读试卷详情路径。
 */
export const buildPaperEditorPreviewPath = (paperId: number): string =>
  `${PAPER_EDITOR_ROUTE_PATH}?mode=preview&paperId=${encodeURIComponent(paperId)}`;
