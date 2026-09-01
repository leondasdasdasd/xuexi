import { trans } from "../../utils/i18n";

export const OPTION_KEYS = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];
export const ZERO_WIDTH_SPACE = "\u200B";
export const DEFAULT_OPTION_COUNT = 4;
export const MIN_OPTION_COUNT = 2;
export const MAX_OPTION_COUNT = 10;
export const QUESTION_TYPE_CHOICE = 1;
export const QUESTION_TYPE_MULTIPLE_CHOICE = 2;
export const QUESTION_TYPE_BLANK = 3;
export const QUESTION_TYPE_JUDGE = 4;
export const QUESTION_TYPE_ANSWER = 5;
export const QUESTION_TYPE_COMBINATION = 6;
export const QUESTION_TYPE_SINGLE_VOTE = 7;
export const QUESTION_TYPE_MULTIPLE_VOTE = 8;

const CHOICE_QUESTION_TYPES = new Set([
  QUESTION_TYPE_CHOICE,
  QUESTION_TYPE_MULTIPLE_CHOICE,
  QUESTION_TYPE_SINGLE_VOTE,
  QUESTION_TYPE_MULTIPLE_VOTE,
]);
const REQUIRED_CHOICE_ANSWER_TYPES = new Set([
  QUESTION_TYPE_CHOICE,
  QUESTION_TYPE_MULTIPLE_CHOICE,
]);

export const QUESTION_TYPE_OPTIONS = [
  { value: QUESTION_TYPE_CHOICE, label: trans("global.radio", "单选题") },
  {
    value: QUESTION_TYPE_MULTIPLE_CHOICE,
    label: trans("global.check", "多选题"),
  },
  { value: QUESTION_TYPE_BLANK, label: trans("global.pack", "填空题") },
  { value: QUESTION_TYPE_JUDGE, label: trans("global.judge", "判断题") },
  { value: QUESTION_TYPE_ANSWER, label: trans("global.ask", "问答题") },
  {
    value: QUESTION_TYPE_COMBINATION,
    label: trans("global.combination", "组合题"),
  },
  {
    value: QUESTION_TYPE_SINGLE_VOTE,
    label: trans("global.singleVote", "单选投票题"),
  },
  {
    value: QUESTION_TYPE_MULTIPLE_VOTE,
    label: trans("global.multipleVote", "多选投票题"),
  },
];

export const toArray = (value) => {
  if (Array.isArray(value)) {
    return value.filter((item) => item !== undefined);
  }
  if (value === undefined || value === "") {
    return [];
  }
  return [value];
};

const hasRichMediaContent = (value) => /<img\b/i.test(String(value || ""));

export const normalizeRichTextHtml = (value) => {
  const html = String(value || "")
    .replaceAll(ZERO_WIDTH_SPACE, "")
    .trim();
  if (!html) {
    return "";
  }

  const visibleText = html
    .replaceAll(/<[^>]*>/g, "")
    .replaceAll("&nbsp;", "")
    .trim();
  return visibleText || hasRichMediaContent(html) ? html : "";
};

export const stripRichText = (value) =>
  String(value || "")
    .replaceAll(/<[^>]*>/g, "")
    .replaceAll("&nbsp;", " ")
    .trim();

export const hasRichTextContent = (value) =>
  !!stripRichText(value) || hasRichMediaContent(value);

export const normalizeIdValue = (value) => {
  if (
    value === undefined ||
    value === "" ||
    (typeof value === "object" && !value)
  ) {
    return;
  }

  const text = String(value).trim();
  if (!text) {
    return;
  }

  const lastPart = text.split("-").pop();
  const id = Number(/^\d+$/.test(lastPart) ? lastPart : text);

  if (Number.isFinite(id)) {
    return id;
  }
};

export const normalizeIdList = (value) =>
  [...new Set(toArray(value).map((item) => normalizeIdValue(item)))].filter(
    (item) => item !== undefined,
  );

export const normalizeSelectionValues = (values) => {
  const source = values.find((value) => toArray(value).length > 0);

  return toArray(source)
    .map((item) =>
      item === undefined || (typeof item === "object" && !item)
        ? undefined
        : String(item).trim(),
    )
    .filter(Boolean);
};

export const getQuestionTypeLabel = (type) => {
  const option = QUESTION_TYPE_OPTIONS.find(
    (item) => item.value === Number(type),
  );
  return option ? option.label : trans("global.ask", "问答题");
};

export const isChoiceQuestionType = (type) =>
  CHOICE_QUESTION_TYPES.has(Number(type));

export const isRequiredChoiceAnswerType = (type) =>
  REQUIRED_CHOICE_ANSWER_TYPES.has(Number(type));
