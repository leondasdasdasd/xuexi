import {
  BATCH_PASTE_IMAGE_LIMITS,
  BATCH_PASTE_IMAGE_MESSAGES,
  prepareBatchPasteHtml,
} from "./pasteImages";

const createClipboardData = ({
  files = [],
  html = "",
  items = [],
  text = "",
}) => ({
  files,
  getData: (type) => {
    if (type === "text/html") {
      return html;
    }

    if (type === "text/plain") {
      return text;
    }

    return "";
  },
  items,
});

const TINY_PNG_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=";

describe("BatchInput paste images", () => {
  it("uploads a data image and replaces it with a preview url", async () => {
    const uploadImage = jest.fn().mockResolvedValue({
      content: [{ fileId: 123 }],
      status: true,
    });
    const clipboardData = createClipboardData({
      html: `<p>1.题目</p><img src="${TINY_PNG_DATA_URL}" alt="chart"><p>答案Answer：A</p>`,
    });

    const result = await prepareBatchPasteHtml(clipboardData, uploadImage);

    expect(result.handled).toBe(true);
    expect(uploadImage).toHaveBeenCalledTimes(1);
    expect(result.html).toContain('/api/preview_file?id=123"');
    expect(result.html).not.toContain("data:image/png");
  });

  it("rejects a data image larger than 10MB", async () => {
    const oversizeDataUrl = `data:image/png,${"a".repeat(
      BATCH_PASTE_IMAGE_LIMITS.maxSize + 1,
    )}`;
    const clipboardData = createClipboardData({
      html: `<p>1.题目</p><img src="${oversizeDataUrl}">`,
    });

    await expect(
      prepareBatchPasteHtml(clipboardData, jest.fn()),
    ).rejects.toThrow(BATCH_PASTE_IMAGE_MESSAGES.sizeExceeded);
  });

  it("rejects more than 10 pasted images", async () => {
    const html = Array.from(
      { length: BATCH_PASTE_IMAGE_LIMITS.maxCount + 1 },
      () => `<img src="${TINY_PNG_DATA_URL}">`,
    ).join("");

    await expect(
      prepareBatchPasteHtml(createClipboardData({ html }), jest.fn()),
    ).rejects.toThrow(BATCH_PASTE_IMAGE_MESSAGES.countExceeded);
  });

  it("keeps mixed text and image positions when replacing pasted images", async () => {
    const uploadImage = jest
      .fn()
      .mockResolvedValueOnce({ content: [{ fileId: "first" }], status: true })
      .mockResolvedValueOnce({ content: [{ fileId: "second" }], status: true });
    const clipboardData = createClipboardData({
      html: `<p>before</p><img src="${TINY_PNG_DATA_URL}"><p>middle</p><img src="${TINY_PNG_DATA_URL}"><p>after</p>`,
    });

    const result = await prepareBatchPasteHtml(clipboardData, uploadImage);
    const beforeIndex = result.html.indexOf("before");
    const firstImageIndex = result.html.indexOf("/api/preview_file?id=first");
    const middleIndex = result.html.indexOf("middle");
    const secondImageIndex = result.html.indexOf("/api/preview_file?id=second");
    const afterIndex = result.html.indexOf("after");

    expect(beforeIndex).toBeLessThan(firstImageIndex);
    expect(firstImageIndex).toBeLessThan(middleIndex);
    expect(middleIndex).toBeLessThan(secondImageIndex);
    expect(secondImageIndex).toBeLessThan(afterIndex);
  });

  it("does not return insertable html when uploading fails", async () => {
    const uploadImage = jest
      .fn()
      .mockResolvedValue({ err: new Error("failed") });
    const clipboardData = createClipboardData({
      html: `<p>1.题目</p><img src="${TINY_PNG_DATA_URL}">`,
    });

    await expect(
      prepareBatchPasteHtml(clipboardData, uploadImage),
    ).rejects.toThrow(BATCH_PASTE_IMAGE_MESSAGES.uploadFailed);
  });
});
