import type {
  QuestionContentSerializedDraft,
  QuestionContentSerializedItem,
  QuestionPlayerResponseItem,
} from "@yungu-fed/question-editor";

import { isQuestionPlayerResponseItem } from "../../utils/v2QuestionPlayerResponseAdapter";

export interface AnalysisAnswerSummary {
  canOpenDetail: boolean;
  text: string;
}

type AnswerEnvelope = {
  elementAnswers: QuestionPlayerResponseItem[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const compactText = (value: string): string =>
  value.trim().split(/\s+/).join(" ");

const richContentText = (value: unknown): string => {
  if (!isRecord(value)) return "";
  const text = typeof value.text === "string" ? compactText(value.text) : "";
  const hasImage =
    typeof value.html === "string" && /<img[\s>]/i.test(value.html);
  return [text, hasImage ? "[图片]" : ""].filter(Boolean).join(" ");
};

const optionLabel = (index: number): string =>
  index < 26 ? String.fromCodePoint(65 + index) : String(index + 1);

const stripRepeatedOptionLabel = (content: string, label: string): string => {
  if (content.slice(0, label.length).toUpperCase() !== label.toUpperCase())
    return content;
  const remainder = content.slice(label.length);
  return /^[\s.:、．：]/.test(remainder)
    ? remainder.replace(/^[\s.:、．：]+/, "").trim()
    : content;
};

const choiceSummary = (
  answer: Extract<QuestionPlayerResponseItem, { type: "choice" }>,
  element: QuestionContentSerializedItem | undefined,
): string => {
  const optionIds = answer.answers.optionIds.map(String);
  if (element?.type !== "choice") return optionIds.join("、");

  return optionIds
    .map((optionId) => {
      const index = element.options.findIndex(
        (option) => String(option.id) === optionId,
      );
      if (index < 0) return optionId;
      const option = element.options.find(
        (item) => String(item.id) === optionId,
      );
      if (!option) return optionId;
      const content = option.cells
        .map((cell) => compactText(cell.text))
        .filter(Boolean)
        .join(" / ");
      const label = optionLabel(index);
      const normalizedContent = stripRepeatedOptionLabel(content, label);
      return normalizedContent ? `${label}. ${normalizedContent}` : label;
    })
    .join("；");
};

const blankGroupSummary = (
  answer: Extract<QuestionPlayerResponseItem, { type: "fill" }>,
): string =>
  answer.answers
    .map((item) => richContentText(item.content))
    .filter(Boolean)
    .join("；");

const inlineFillSummary = (
  answer: Extract<QuestionPlayerResponseItem, { type: "inlineFill" }>,
): string =>
  answer.answers
    .map((group) =>
      group.answerPools
        .map((item) => richContentText(item))
        .filter(Boolean)
        .join(" / "),
    )
    .filter(Boolean)
    .join("；");

const orderingSummary = (
  answer: Extract<QuestionPlayerResponseItem, { type: "ordering" }>,
  element: QuestionContentSerializedItem | undefined,
): string => {
  if (element?.type !== "ordering") return answer.answers.join("→");
  return answer.answers
    .map((optionId) => {
      const option = element.sortOptions.find(
        (item) => String(item.id) === String(optionId),
      );
      return option ? richContentText(option.content) : String(optionId);
    })
    .filter(Boolean)
    .join("→");
};

const hasStructuredAnswer = (value: unknown): boolean => {
  if (Array.isArray(value)) return value.length > 0;
  return isRecord(value) && Object.keys(value).length > 0;
};

const summarizeDirectAnswer = (
  answer: QuestionPlayerResponseItem,
  element: QuestionContentSerializedItem | undefined,
): AnalysisAnswerSummary | null => {
  switch (answer.type) {
    case "choice": {
      return { canOpenDetail: false, text: choiceSummary(answer, element) };
    }
    case "textResponse": {
      return { canOpenDetail: true, text: richContentText(answer.answers) };
    }
    case "inlineFill": {
      return { canOpenDetail: true, text: inlineFillSummary(answer) };
    }
    case "fill": {
      return { canOpenDetail: true, text: blankGroupSummary(answer) };
    }
    default: {
      return null;
    }
  }
};

const summarizeShortAnswer = (
  answer: QuestionPlayerResponseItem,
  element: QuestionContentSerializedItem | undefined,
): AnalysisAnswerSummary | null => {
  switch (answer.type) {
    case "wordBuilder": {
      return {
        canOpenDetail: false,
        text: Object.values(answer.answers).filter(Boolean).join("；"),
      };
    }
    case "judgement": {
      return {
        canOpenDetail: false,
        text:
          answer.answers.length === 0 ? "" : answer.answers[0] ? "对" : "错",
      };
    }
    case "ordering": {
      return {
        canOpenDetail: false,
        text: orderingSummary(answer, element),
      };
    }
    default: {
      return null;
    }
  }
};

const summarizeComplexAnswer = (
  answer: QuestionPlayerResponseItem,
): AnalysisAnswerSummary => {
  switch (answer.type) {
    case "textMarker": {
      return {
        canOpenDetail: true,
        text:
          answer.answers.length > 0 ? `已标记 ${answer.answers.length} 处` : "",
      };
    }
    case "classification":
    case "lineConnect":
    case "matching": {
      return {
        canOpenDetail: true,
        text: hasStructuredAnswer(answer.answers) ? "已作答" : "",
      };
    }
    default: {
      return { canOpenDetail: false, text: "" };
    }
  }
};

const summarizeAnswer = (
  answer: QuestionPlayerResponseItem,
  element: QuestionContentSerializedItem | undefined,
): AnalysisAnswerSummary =>
  summarizeDirectAnswer(answer, element) ||
  summarizeShortAnswer(answer, element) ||
  summarizeComplexAnswer(answer);

const parseAnswerEnvelope = (
  answerJson: string | null | undefined,
): AnswerEnvelope | null => {
  if (!answerJson) return null;
  try {
    const parsed: unknown = JSON.parse(answerJson);
    if (
      !isRecord(parsed) ||
      !Array.isArray(parsed.elementAnswers) ||
      !parsed.elementAnswers.every((item) => isQuestionPlayerResponseItem(item))
    )
      return null;
    return parsed as AnswerEnvelope;
  } catch {
    return null;
  }
};

export const formatAnalysisAnswerSummary = (
  answerJson: string | null | undefined,
  question: QuestionContentSerializedDraft,
): AnalysisAnswerSummary => {
  const envelope = parseAnswerEnvelope(answerJson);
  if (!envelope) return { canOpenDetail: false, text: "未作答" };

  const answerElements = question.elements.filter(
    (element) => element.type !== "richText",
  );
  const summaries = envelope.elementAnswers.map((answer, index) =>
    summarizeAnswer(answer, answerElements.at(index)),
  );
  const text = summaries
    .map((summary) => summary.text)
    .filter(Boolean)
    .join("；");

  return {
    canOpenDetail: summaries.some((summary) => summary.canOpenDetail),
    text: text || "未作答",
  };
};
