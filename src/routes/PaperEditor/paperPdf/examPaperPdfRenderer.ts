import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

import {
  calculatePaperPdfPageRanges,
  type PaperPdfLayoutBlock,
  type PaperPdfPageRange,
} from "./paperPdfPagination";

export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;
export const PAPER_MARGIN_MM = 15;
export const PAPER_CONTENT_WIDTH_MM = A4_WIDTH_MM - PAPER_MARGIN_MM * 2;
export const PAPER_CONTENT_HEIGHT_MM = A4_HEIGHT_MM - PAPER_MARGIN_MM * 2;
const CAPTURE_SCALE = 2;
const JPEG_QUALITY = 0.95;

type PdfWriter = Pick<jsPDF, "addImage" | "addPage" | "save">;

interface CaptureOptions {
  allowTaint: boolean;
  backgroundColor: string;
  height: number;
  imageTimeout: number;
  logging: boolean;
  onclone: (clonedDocument: Document) => void;
  scale: number;
  scrollX: number;
  scrollY: number;
  useCORS: boolean;
  width: number;
  x: number;
  y: number;
}

interface RenderExamPaperPdfInput {
  captureElement?: (
    element: HTMLElement,
    options: CaptureOptions,
  ) => Promise<{ toDataURL: (type: string, quality: number) => string }>;
  contentElement: HTMLElement;
  createPdf?: (configuration: {
    compress: boolean;
    format: "a4";
    orientation: "portrait";
    unit: "mm";
  }) => PdfWriter;
  pageRanges: PaperPdfPageRange[];
}

const createDefaultPdf = (configuration: {
  compress: boolean;
  format: "a4";
  orientation: "portrait";
  unit: "mm";
}): PdfWriter => new jsPDF(configuration);

const getRelativeBlock = (
  element: Element,
  contentTop: number,
  keepWithNext = false,
): PaperPdfLayoutBlock => {
  const bounds = element.getBoundingClientRect();
  return {
    bottom: bounds.bottom - contentTop,
    keepWithNext,
    top: bounds.top - contentTop,
  };
};

/**
 * 根据共享试卷正文的语义元素计算 A4 可用区域分页。
 * @param {HTMLElement} contentElement 已完成浏览器布局的试卷正文。
 * @returns {PaperPdfPageRange[]} 连续覆盖正文的页面区间。
 */
export const createExamPaperPdfPageRanges = (
  contentElement: HTMLElement,
): PaperPdfPageRange[] => {
  const bounds = contentElement.getBoundingClientRect();
  if (bounds.width <= 0) throw new Error("试卷 PDF 渲染宽度无效");

  const pixelsPerMillimeter = bounds.width / PAPER_CONTENT_WIDTH_MM;
  const pageHeight = PAPER_CONTENT_HEIGHT_MM * pixelsPerMillimeter;
  const blocks = [
    ...[...contentElement.querySelectorAll(":scope > h1")].map((element) =>
      getRelativeBlock(element, bounds.top),
    ),
    ...[...contentElement.querySelectorAll("section > header")].map((element) =>
      getRelativeBlock(element, bounds.top, true),
    ),
    ...[...contentElement.querySelectorAll("article")].map((element) =>
      getRelativeBlock(element, bounds.top),
    ),
  ];
  return calculatePaperPdfPageRanges({
    blocks,
    contentHeight: contentElement.scrollHeight,
    pageHeight,
  });
};

/**
 * 将已经完成浏览器布局的试卷正文逐页写入 A4 PDF。
 * @param {RenderExamPaperPdfInput} input 正文 DOM、分页区间及可替换的浏览器边界依赖。
 * @returns {Promise<PdfWriter>} 可由调用方保存的 PDF 实例。
 */
export const renderExamPaperPdf = async (
  input: RenderExamPaperPdfInput,
): Promise<PdfWriter> => {
  const {
    captureElement = html2canvas,
    contentElement,
    createPdf = createDefaultPdf,
    pageRanges,
  } = input;
  if (pageRanges.length === 0) throw new Error("试卷 PDF 没有可渲染内容");

  const contentWidth = contentElement.scrollWidth;
  const pixelsPerMillimeter =
    contentElement.getBoundingClientRect().width / PAPER_CONTENT_WIDTH_MM;
  const sourceDocument = contentElement.ownerDocument;
  const rootFontSize = sourceDocument.defaultView?.getComputedStyle(
    sourceDocument.documentElement,
  ).fontSize;
  const pdf = createPdf({
    compress: true,
    format: "a4",
    orientation: "portrait",
    unit: "mm",
  });

  for (const [index, range] of pageRanges.entries()) {
    const rangeHeight = range.end - range.start;
    const canvas = await captureElement(contentElement, {
      allowTaint: false,
      backgroundColor: "#ffffff",
      height: rangeHeight,
      imageTimeout: 15_000,
      logging: false,
      onclone: (clonedDocument) => {
        if (rootFontSize) {
          clonedDocument.documentElement.style.fontSize = rootFontSize;
        }
      },
      scale: CAPTURE_SCALE,
      scrollX: 0,
      scrollY: 0,
      useCORS: true,
      width: contentWidth,
      x: 0,
      y: range.start,
    });
    if (index > 0) pdf.addPage();
    pdf.addImage(
      canvas.toDataURL("image/jpeg", JPEG_QUALITY),
      "JPEG",
      PAPER_MARGIN_MM,
      PAPER_MARGIN_MM,
      PAPER_CONTENT_WIDTH_MM,
      Math.min(rangeHeight / pixelsPerMillimeter, PAPER_CONTENT_HEIGHT_MM),
      undefined,
      "FAST",
    );
  }
  return pdf;
};
