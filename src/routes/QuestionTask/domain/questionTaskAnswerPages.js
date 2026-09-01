import { trans } from "../../../utils/i18n";
import { getOneBasedIndex } from "./questionTaskShared";

const FIRST_PAGE_NUMBER = 1;

const getRawAnswerTextPages = (content) =>
  content &&
  (content.answerTextPages ||
    content.answerAnalysisTextPages ||
    content.answerParsedPages ||
    content.examAnswerTextPages);

const getRawAnswerText = (content) =>
  content &&
  (content.answerText ||
    content.answerAnalysisText ||
    content.answerParsedText ||
    content.examAnswerText);

const normalizeAnswerTextPage = (page, index) => ({
  pageNumber:
    page && page.pageNumber ? page.pageNumber : getOneBasedIndex(index),
  sections: Array.isArray(page && page.sections) ? page.sections : [],
  title:
    (page && page.title) ||
    trans("questionTask.answerAnalysisTextPageTitle", "答案解析文本 {$index}", {
      index: getOneBasedIndex(index),
    }),
});

const normalizeRawAnswerText = (rawText) => [
  {
    pageNumber: FIRST_PAGE_NUMBER,
    title: trans("questionTask.answerAnalysisTextTitle", "答案解析文本"),
    sections: [
      {
        items: String(rawText)
          .split(/\n+/)
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line, index) => ({
            analysis: line,
            answer: "",
            number: getOneBasedIndex(index),
          })),
        title: trans("questionTask.answerAnalysisSectionTitle", "解析内容"),
      },
    ],
  },
];

export const normalizeAnswerTextPages = (content) => {
  const rawPages = getRawAnswerTextPages(content);

  if (Array.isArray(rawPages)) {
    return rawPages.map((page, index) => normalizeAnswerTextPage(page, index));
  }

  const rawText = getRawAnswerText(content);

  return rawText ? normalizeRawAnswerText(rawText) : [];
};

export const normalizeAnswerPages = (content) =>
  [
    ...(Array.isArray(content && content.answerPages)
      ? content.answerPages
      : []),
  ]
    .sort((left, right) => (left.pageIndex || 0) - (right.pageIndex || 0))
    .map((page, index) => ({
      errorMessage: (page && page.errorMessage) || "",
      imageUrl: (page && page.imageUrl) || "",
      itemStatus: page && page.itemStatus,
      pageIndex: page && page.pageIndex,
      pageKey: `answer-page-${getOneBasedIndex(index)}`,
      pageNumber: getOneBasedIndex(index),
    }));
