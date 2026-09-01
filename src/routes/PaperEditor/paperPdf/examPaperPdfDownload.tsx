import React from "react";
import { message } from "antd";
import ReactDOM from "react-dom";

import { locale, trans } from "../../../utils/i18n";
import {
  getPaperDetailDisplayError,
  loadPaperDetailViewModel,
} from "../paperDetailViewModel";
import {
  createExamPaperPdfPageRanges,
  renderExamPaperPdf,
} from "./examPaperPdfRenderer";
import PaperPdfRenderSurface from "./PaperPdfRenderSurface";

export interface ExamPaperPdfDownloadRequest {
  paperId: number | string;
}

export type ExamPaperPdfDownloadStatus = "busy" | "downloaded" | "failed";

const activePaperIds = new Set<number>();
const INVALID_FILE_NAME_CHARACTER = /["*/:<>?\\|]/g;
const PAPER_PDF_ASSET_TIMEOUT_MS = 15_000;

const normalizePaperId = (value: number | string): number | undefined => {
  const paperId = Number(value);
  return Number.isInteger(paperId) && paperId > 0 ? paperId : undefined;
};

const getPaperLocale = (): "en-US" | "zh-CN" =>
  locale() === "en" ? "en-US" : "zh-CN";

const buildPaperPdfFileName = (title: string, paperId: number): string => {
  const cleanTitle = [...title]
    .map((character) => (character.codePointAt(0)! < 32 ? "_" : character))
    .join("")
    .split(INVALID_FILE_NAME_CHARACTER)
    .join("_")
    .trim();
  const fallbackTitle = `试卷-${paperId}`;
  return `${cleanTitle || fallbackTitle}.pdf`;
};

const waitForAnimationFrame = () =>
  new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));

const createPaperAssetTimeoutError = () =>
  new Error("试卷资源加载超时，请稍后重试");

const waitForImage = async (
  image: HTMLImageElement,
  signal: AbortSignal,
): Promise<void> => {
  if (!image.complete) {
    await new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        image.removeEventListener("load", handleLoad);
        image.removeEventListener("error", handleError);
        signal.removeEventListener("abort", handleAbort);
      };
      const handleLoad = () => {
        cleanup();
        resolve();
      };
      const handleError = () => {
        cleanup();
        reject(new Error("试卷图片加载失败"));
      };
      const handleAbort = () => {
        cleanup();
        reject(createPaperAssetTimeoutError());
      };
      image.addEventListener("load", handleLoad, { once: true });
      image.addEventListener("error", handleError, { once: true });
      signal.addEventListener("abort", handleAbort, { once: true });
      if (signal.aborted) handleAbort();
    });
  }
  if (signal.aborted) throw createPaperAssetTimeoutError();
  if (image.naturalWidth === 0) throw new Error("试卷图片加载失败");
  if (image.decode) await image.decode();
};

const waitForPaperPdfAssetReadiness = async (
  contentElement: HTMLElement,
  signal: AbortSignal,
): Promise<void> => {
  const fontSet = Reflect.get(document, "fonts") as
    | { ready?: Promise<unknown> }
    | undefined;
  if (fontSet?.ready) await fontSet.ready;
  await Promise.all(
    [...contentElement.querySelectorAll("img")].map((image) =>
      waitForImage(image, signal),
    ),
  );
  await waitForAnimationFrame();
  await waitForAnimationFrame();
};

const waitForPaperPdfAssets = async (
  contentElement: HTMLElement,
): Promise<void> => {
  const controller = new AbortController();
  let timeoutId: number | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timeoutId = window.setTimeout(() => {
      controller.abort();
      reject(createPaperAssetTimeoutError());
    }, PAPER_PDF_ASSET_TIMEOUT_MS);
  });
  try {
    await Promise.race([
      waitForPaperPdfAssetReadiness(contentElement, controller.signal),
      timeout,
    ]);
  } finally {
    if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    controller.abort();
  }
};

const mountPaperPdfSurface = async (
  viewModel: Awaited<ReturnType<typeof loadPaperDetailViewModel>>,
  paperLocale: "en-US" | "zh-CN",
) => {
  const host = document.createElement("div");
  const rootRef = React.createRef<HTMLElement>();
  host.dataset.examPaperPdfHost = "true";
  document.body.append(host);
  const remove = () => {
    ReactDOM.unmountComponentAtNode(host);
    host.remove();
  };
  try {
    await new Promise<void>((resolve) => {
      ReactDOM.render(
        <PaperPdfRenderSurface
          draft={viewModel.draft}
          locale={paperLocale}
          rootRef={rootRef}
        />,
        host,
        resolve,
      );
    });
    const contentElement = rootRef.current;
    if (!(contentElement instanceof HTMLElement)) {
      throw new TypeError("试卷 PDF 渲染节点缺失");
    }
    return { contentElement, remove };
  } catch (error) {
    remove();
    throw error;
  }
};

/**
 * 加载结构化试卷并在浏览器中生成、下载 A4 PDF。
 * @param {ExamPaperPdfDownloadRequest} request 需要导出的试卷标识。
 * @returns {Promise<ExamPaperPdfDownloadStatus>} 可观察的下载结果状态。
 */
export const downloadExamPaperPdf = async (
  request: ExamPaperPdfDownloadRequest,
): Promise<ExamPaperPdfDownloadStatus> => {
  const paperId = normalizePaperId(request.paperId);
  if (!paperId) {
    message.error(trans("paperPdf.invalidPaper", "试卷参数无效"));
    return "failed";
  }
  if (activePaperIds.has(paperId)) {
    message.info(trans("paperPdf.busy", "试卷 PDF 正在生成，请稍候"));
    return "busy";
  }

  activePaperIds.add(paperId);
  const hideLoading = message.loading(
    trans("paperPdf.processing", "正在生成试卷 PDF……"),
    0,
  );
  let mountedSurface:
    | Awaited<ReturnType<typeof mountPaperPdfSurface>>
    | undefined;
  try {
    const paperLocale = getPaperLocale();
    let viewModel: Awaited<ReturnType<typeof loadPaperDetailViewModel>>;
    try {
      viewModel = await loadPaperDetailViewModel(paperId, paperLocale);
    } catch (error) {
      hideLoading();
      const displayError = getPaperDetailDisplayError(
        error,
        trans("paperPdf.failed", "试卷 PDF 生成失败"),
      );
      if (displayError) message.error(displayError);
      return "failed";
    }
    mountedSurface = await mountPaperPdfSurface(viewModel, paperLocale);
    await waitForPaperPdfAssets(mountedSurface.contentElement);
    const pageRanges = createExamPaperPdfPageRanges(
      mountedSurface.contentElement,
    );
    const pdf = await renderExamPaperPdf({
      contentElement: mountedSurface.contentElement,
      pageRanges,
    });
    pdf.save(buildPaperPdfFileName(viewModel.draft.title, paperId));
    hideLoading();
    message.success(trans("paperPdf.success", "试卷 PDF 已生成"));
    return "downloaded";
  } catch {
    hideLoading();
    message.error(trans("paperPdf.failed", "试卷 PDF 生成失败"));
    return "failed";
  } finally {
    mountedSurface?.remove();
    activePaperIds.delete(paperId);
  }
};
