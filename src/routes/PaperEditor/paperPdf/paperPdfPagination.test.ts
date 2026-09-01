import { calculatePaperPdfPageRanges } from "./paperPdfPagination";

describe("试卷 PDF 分页", () => {
  it("在题目跨页时从题目顶部开始下一页", () => {
    expect(
      calculatePaperPdfPageRanges({
        blocks: [
          { bottom: 80, keepWithNext: true, top: 40 },
          { bottom: 240, top: 80 },
          { bottom: 360, top: 240 },
        ],
        contentHeight: 360,
        pageHeight: 300,
      }),
    ).toEqual([
      { end: 240, start: 0 },
      { end: 360, start: 240 },
    ]);
  });

  it("让块标题和第一题一起移到下一页", () => {
    expect(
      calculatePaperPdfPageRanges({
        blocks: [
          { bottom: 250, top: 0 },
          { bottom: 280, keepWithNext: true, top: 250 },
          { bottom: 380, top: 280 },
        ],
        contentHeight: 380,
        pageHeight: 300,
      }),
    ).toEqual([
      { end: 250, start: 0 },
      { end: 380, start: 250 },
    ]);
  });

  it("连续切分超过单页高度的题目且不遗漏内容", () => {
    const ranges = calculatePaperPdfPageRanges({
      blocks: [{ bottom: 720, top: 20 }],
      contentHeight: 720,
      pageHeight: 300,
    });

    expect(ranges).toEqual([
      { end: 300, start: 0 },
      { end: 600, start: 300 },
      { end: 720, start: 600 },
    ]);
    expect(ranges[0].start).toBe(0);
    expect(ranges.at(-1)?.end).toBe(720);
    ranges.slice(1).forEach((range, index) => {
      expect(range.start).toBe(ranges[index].end);
    });
  });
});
