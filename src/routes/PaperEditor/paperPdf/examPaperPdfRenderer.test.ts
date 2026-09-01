import {
  A4_HEIGHT_MM,
  A4_WIDTH_MM,
  PAPER_MARGIN_MM,
  renderExamPaperPdf,
} from "./examPaperPdfRenderer";

const createContentElement = () => {
  const element = document.createElement("main");
  Object.defineProperty(element, "scrollHeight", { value: 720 });
  Object.defineProperty(element, "scrollWidth", { value: 680 });
  element.getBoundingClientRect = jest.fn(() => ({
    bottom: 720,
    height: 720,
    left: 0,
    right: 680,
    toJSON: jest.fn(),
    top: 0,
    width: 680,
    x: 0,
    y: 0,
  }));
  return element;
};

describe("试卷 PDF A4 渲染", () => {
  it("按真实 A4 尺寸逐页截图并写入 PDF", async () => {
    const originalRootFontSize = document.documentElement.style.fontSize;
    document.documentElement.style.fontSize = "16px";
    const contentElement = createContentElement();
    const canvases = [300, 300, 120].map((height, index) => ({
      height,
      toDataURL: jest.fn(() => `page-${index + 1}`),
      width: 680,
    }));
    const captureElement = jest
      .fn()
      .mockResolvedValueOnce(canvases[0])
      .mockResolvedValueOnce(canvases[1])
      .mockResolvedValueOnce(canvases[2]);
    const pdf = {
      addImage: jest.fn(),
      addPage: jest.fn(),
      save: jest.fn(),
    };
    const createPdf = jest.fn(() => pdf);

    const result = await renderExamPaperPdf({
      captureElement,
      contentElement,
      createPdf,
      pageRanges: [
        { end: 300, start: 0 },
        { end: 600, start: 300 },
        { end: 720, start: 600 },
      ],
    });

    expect(createPdf).toHaveBeenCalledWith({
      compress: true,
      format: "a4",
      orientation: "portrait",
      unit: "mm",
    });
    expect(captureElement).toHaveBeenNthCalledWith(
      2,
      contentElement,
      expect.objectContaining({
        height: 300,
        width: 680,
        x: 0,
        y: 300,
      }),
    );
    const secondCaptureOptions = captureElement.mock.calls[1][1];
    expect(secondCaptureOptions).not.toHaveProperty("windowHeight");
    expect(secondCaptureOptions).not.toHaveProperty("windowWidth");
    const clonedDocument = document.implementation.createHTMLDocument();
    clonedDocument.documentElement.style.fontSize = "17px";
    secondCaptureOptions.onclone(clonedDocument);
    expect(clonedDocument.documentElement.style.fontSize).toBe("16px");
    expect(pdf.addPage).toHaveBeenCalledTimes(2);
    expect(pdf.addImage).toHaveBeenNthCalledWith(
      1,
      "page-1",
      "JPEG",
      PAPER_MARGIN_MM,
      PAPER_MARGIN_MM,
      A4_WIDTH_MM - PAPER_MARGIN_MM * 2,
      expect.any(Number),
      undefined,
      "FAST",
    );
    expect(result).toBe(pdf);
    expect(A4_WIDTH_MM).toBe(210);
    expect(A4_HEIGHT_MM).toBe(297);
    document.documentElement.style.fontSize = originalRootFontSize;
  });
});
