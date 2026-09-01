export const PAPER_TITLE_MAX_LENGTH = 59;
export const PAPER_TITLE_LENGTH_LIMIT_MESSAGE_KEY = "paper.title.lengthLimit";

// 后端标题长度以完整试卷标题校验，前端在提交边界使用同一规则提前拦截。
export const getPaperTitleLength = (title) => (title || "").trim().length;

export const isPaperTitleTooLong = (title) =>
  getPaperTitleLength(title) > PAPER_TITLE_MAX_LENGTH;
