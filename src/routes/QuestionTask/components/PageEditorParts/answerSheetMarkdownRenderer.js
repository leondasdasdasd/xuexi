import MarkdownIt from "markdown-it/dist/index.cjs.js";
import katex from "katex";
import texmath from "markdown-it-texmath/texmath.js";

const answerSheetMarkdownRenderer = new MarkdownIt({
  breaks: false,
  html: true,
  linkify: false,
  typographer: false,
}).use(texmath, {
  delimiters: "dollars",
  engine: katex,
  katexOptions: {
    output: "htmlAndMathml",
    throwOnError: false,
    trust: false,
  },
});

// 解析文本预览只接收内部 OCR/解析服务返回内容，这里统一转换成受控 HTML 输出。
export const buildAnswerSheetPreviewHtml = (markdown) =>
  answerSheetMarkdownRenderer.render(String(markdown || "").trim());
