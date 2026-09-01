import {
  OPTION_KEYS,
  hasRichTextContent,
  normalizeIdList,
  normalizeRichTextHtml,
  toArray,
} from "./questionEntryShared";

const RANDOM_ID_RADIX = 16;
const RANDOM_ID_START = 2;
const RANDOM_ID_END = 10;

const createEditorId = (prefix) => {
  const randomSuffix = Math.random()
    .toString(RANDOM_ID_RADIX)
    .slice(RANDOM_ID_START, RANDOM_ID_END);
  return `${prefix}-${Date.now()}-${randomSuffix}`;
};

const isEmptyBlankAnswerValue = (value) =>
  value === undefined || (typeof value === "object" && !value);

export const normalizeBlankAnswerContent = (value) =>
  isEmptyBlankAnswerValue(value) ? "" : String(value).trim();

export const createOptionDraft = (index = 0, option = {}) => {
  const key =
    option.key ||
    OPTION_KEYS.slice(index, index + 1).shift() ||
    String(index + 1);
  return {
    editorId: option.editorId || createEditorId("option"),
    key,
    // 保留后端原始选项内容，不在前端剥离 A./B. 等前缀；重复序号由 UI 与数据共同暴露。
    answers: normalizeRichTextHtml(option.answers),
    knowledgeIds: normalizeIdList(option.knowledgeIds),
  };
};

export const createBlankAnswerDraft = (content = "") => ({
  content: normalizeBlankAnswerContent(content),
  editorId: createEditorId("blank-answer"),
});

export const createBlankGroupDraft = (answers = []) => ({
  // 后端可能返回 null 或空富文本，初始化时不生成空答案项，避免 Select 渲染空白标签。
  answers: toArray(answers)
    .map((answer) => createBlankAnswerDraft(answer))
    .filter((answer) => hasRichTextContent(answer.content)),
  editorId: createEditorId("blank-group"),
});

const normalizeBlankGroups = (gapFillingAnswer) => {
  if (
    gapFillingAnswer &&
    Array.isArray(gapFillingAnswer.answerGroups) &&
    gapFillingAnswer.answerGroups.length > 0
  ) {
    return gapFillingAnswer.answerGroups.map((group) => ({
      answers: toArray(group && group.answers)
        .map((answer) =>
          createBlankAnswerDraft(
            typeof answer === "object" ? answer.content : answer,
          ),
        )
        .filter((answer) => hasRichTextContent(answer.content)),
      editorId: (group && group.editorId) || createEditorId("blank-group"),
    }));
  }

  const rawAnswers =
    gapFillingAnswer && Array.isArray(gapFillingAnswer.answers)
      ? gapFillingAnswer.answers
      : [];

  return rawAnswers.length > 0
    ? rawAnswers.map((answer) =>
        createBlankGroupDraft(normalizeBlankAnswerContent(answer).split("&&")),
      )
    : [createBlankGroupDraft()];
};

export const normalizeGapFillingAnswer = (gapFillingAnswer) => ({
  answerGroups: normalizeBlankGroups(gapFillingAnswer),
  isOrder: !!(gapFillingAnswer && gapFillingAnswer.isOrder),
});

export { createEditorId };
