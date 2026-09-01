import { message } from "antd";
import type { Ref } from "react";
import ReactDOM from "react-dom";

import { loadPaperDetailViewModel } from "../paperDetailViewModel";
import { downloadExamPaperPdf } from "./examPaperPdfDownload";
import { renderExamPaperPdf } from "./examPaperPdfRenderer";

let mockIncludePendingImage = false;

jest.mock("../paperDetailViewModel", () => ({
  ...jest.requireActual("../paperDetailViewModel"),
  loadPaperDetailViewModel: jest.fn(),
}));
jest.mock("./examPaperPdfRenderer", () => ({
  createExamPaperPdfPageRanges: jest.fn(() => [{ end: 100, start: 0 }]),
  renderExamPaperPdf: jest.fn(),
}));
jest.mock(
  "./PaperPdfRenderSurface",
  () =>
    function MockPaperPdfRenderSurface(properties: {
      rootRef?: Ref<HTMLElement>;
    }) {
      return (
        <div ref={properties.rootRef as Ref<HTMLDivElement>}>
          试卷正文
          {mockIncludePendingImage ? (
            <img
              alt="待加载题图"
              ref={(image) => {
                if (image) {
                  Object.defineProperty(image, "complete", { value: false });
                }
              }}
            />
          ) : null}
        </div>
      );
    },
);

const loadPaperDetailViewModelMock = loadPaperDetailViewModel as jest.Mock;
const renderExamPaperPdfMock = renderExamPaperPdf as jest.Mock;
const originalDocumentFonts = Reflect.get(document, "fonts");
const paperDetailViewModel = {
  draft: {
    modules: [],
    questionTypeTemplates: [],
    subjectId: 2,
    subjectName: "数学",
    title: "期末/试卷",
  },
  grades: [],
  paperTypes: [],
  subjects: [],
  updateAllowed: true,
};

describe("统一试卷 PDF 下载入口", () => {
  beforeEach(() => {
    mockIncludePendingImage = false;
    Reflect.set(window, "globalLange", "zh-CN");
    jest.spyOn(message, "loading").mockReturnValue(jest.fn() as never);
    jest.spyOn(message, "success").mockImplementation(jest.fn());
    jest.spyOn(message, "error").mockImplementation(jest.fn());
    jest.spyOn(message, "info").mockImplementation(jest.fn());
    loadPaperDetailViewModelMock.mockResolvedValue(paperDetailViewModel);
    renderExamPaperPdfMock.mockResolvedValue({ save: jest.fn() });
  });

  afterEach(() => {
    document
      .querySelectorAll("[data-exam-paper-pdf-host]")
      .forEach((node) => node.remove());
    if (originalDocumentFonts === undefined) {
      Reflect.deleteProperty(document, "fonts");
    } else {
      Reflect.set(document, "fonts", originalDocumentFonts);
    }
    jest.useRealTimers();
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it("加载共享 V2 视图、生成文件并清理临时渲染节点", async () => {
    const result = await downloadExamPaperPdf({ paperId: "11721" });

    expect(loadPaperDetailViewModelMock).toHaveBeenCalledWith(11_721, "zh-CN");
    expect(renderExamPaperPdfMock).toHaveBeenCalledWith(
      expect.objectContaining({
        contentElement: expect.any(HTMLElement),
      }),
    );
    const pdf = await renderExamPaperPdfMock.mock.results[0].value;
    expect(pdf.save).toHaveBeenCalledWith("期末_试卷.pdf");
    expect(document.querySelector("[data-exam-paper-pdf-host]")).toBeNull();
    expect(result).toBe("downloaded");
  });

  it("生成失败时不下载并清理临时渲染节点", async () => {
    renderExamPaperPdfMock.mockRejectedValueOnce(new Error("canvas failed"));

    const result = await downloadExamPaperPdf({ paperId: 11_721 });

    expect(message.error).toHaveBeenCalledWith("试卷 PDF 生成失败");
    expect(document.querySelector("[data-exam-paper-pdf-host]")).toBeNull();
    expect(result).toBe("failed");

    expect(await downloadExamPaperPdf({ paperId: 11_721 })).toBe("downloaded");
  });

  it("客户端生成失败时不向英文用户暴露内部错误", async () => {
    Reflect.set(window, "globalLange", "en-US");
    renderExamPaperPdfMock.mockRejectedValueOnce(
      new Error("internal canvas implementation detail"),
    );

    expect(await downloadExamPaperPdf({ paperId: 11_721 })).toBe("failed");

    expect(message.error).toHaveBeenCalledWith(
      "Unable to generate the paper PDF",
    );
    expect(message.error).not.toHaveBeenCalledWith(
      "internal canvas implementation detail",
    );
  });

  it("详情加载失败时保留业务错误文案", async () => {
    loadPaperDetailViewModelMock.mockRejectedValueOnce(new Error("试卷不存在"));

    expect(await downloadExamPaperPdf({ paperId: 11_721 })).toBe("failed");

    expect(message.error).toHaveBeenCalledWith("试卷不存在");
  });

  it("拒绝无效试卷参数且不加载详情", async () => {
    expect(await downloadExamPaperPdf({ paperId: "invalid" })).toBe("failed");

    expect(message.error).toHaveBeenCalledWith("试卷参数无效");
    expect(loadPaperDetailViewModelMock).not.toHaveBeenCalled();
  });

  it("同一试卷生成期间返回 busy", async () => {
    let resolveDetail: (value: typeof paperDetailViewModel) => void = () =>
      undefined;
    loadPaperDetailViewModelMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveDetail = resolve;
        }),
    );

    const firstDownload = downloadExamPaperPdf({ paperId: 11_722 });

    expect(await downloadExamPaperPdf({ paperId: 11_722 })).toBe("busy");
    expect(message.info).toHaveBeenCalledWith("试卷 PDF 正在生成，请稍候");
    resolveDetail(paperDetailViewModel);
    expect(await firstDownload).toBe("downloaded");
  });

  it("React 挂载失败时清理临时节点并释放锁", async () => {
    jest.spyOn(ReactDOM, "render").mockImplementationOnce(() => {
      throw new Error("render failed");
    });

    expect(await downloadExamPaperPdf({ paperId: 11_723 })).toBe("failed");
    expect(document.querySelector("[data-exam-paper-pdf-host]")).toBeNull();

    expect(await downloadExamPaperPdf({ paperId: 11_723 })).toBe("downloaded");
  });

  it("资源等待超时后清理临时节点并允许重试", async () => {
    jest.useFakeTimers();
    Reflect.set(document, "fonts", {
      ready: new Promise(() => undefined),
    });

    const pendingDownload = downloadExamPaperPdf({ paperId: 11_724 });
    for (
      let attempt = 0;
      attempt < 10 && jest.getTimerCount() === 0;
      attempt++
    ) {
      await Promise.resolve();
    }
    expect(document.querySelector("[data-exam-paper-pdf-host]")).not.toBeNull();
    expect(jest.getTimerCount()).toBe(1);

    await jest.advanceTimersByTimeAsync(15_000);
    const result = await pendingDownload;

    expect(result).toBe("failed");
    expect(document.querySelector("[data-exam-paper-pdf-host]")).toBeNull();

    Reflect.set(document, "fonts", { ready: Promise.resolve() });
    jest.useRealTimers();
    expect(await downloadExamPaperPdf({ paperId: 11_724 })).toBe("downloaded");
  });

  it("图片等待超时后移除资源监听器", async () => {
    jest.useFakeTimers();
    mockIncludePendingImage = true;
    Reflect.set(document, "fonts", { ready: Promise.resolve() });

    const pendingDownload = downloadExamPaperPdf({ paperId: 11_725 });
    for (
      let attempt = 0;
      attempt < 10 && jest.getTimerCount() === 0;
      attempt++
    ) {
      await Promise.resolve();
    }
    const image = document.querySelector<HTMLImageElement>("img");
    expect(image).not.toBeNull();
    const removeListener = jest.spyOn(image!, "removeEventListener");

    await jest.advanceTimersByTimeAsync(15_000);

    expect(await pendingDownload).toBe("failed");
    expect(removeListener).toHaveBeenCalledWith("load", expect.any(Function));
    expect(removeListener).toHaveBeenCalledWith("error", expect.any(Function));
    expect(document.querySelector("[data-exam-paper-pdf-host]")).toBeNull();
  });
});
