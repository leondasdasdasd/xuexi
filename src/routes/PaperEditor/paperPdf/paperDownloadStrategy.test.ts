import { resolvePaperDownloadTarget } from "./paperDownloadStrategy";

describe("试卷下载分支决策", () => {
  it.each([
    {
      expected: "browser-pdf",
      input: {
        hasStructuredContent: true,
        uploadFileEditable: false,
        uploadFileExist: 1,
      },
      scenario: "存在结构化题目",
    },
    {
      expected: "browser-pdf",
      input: { uploadFileEditable: false, uploadFileExist: 0 },
      scenario: "没有上传原件",
    },
    {
      expected: "browser-pdf",
      input: { uploadFileEditable: true, uploadFileExist: 1 },
      scenario: "上传原件已转为可编辑试卷",
    },
    {
      expected: "source-file",
      input: { uploadFileEditable: false, uploadFileExist: 1 },
      scenario: "仅有不可编辑上传原件",
    },
    {
      expected: "unavailable",
      input: { uploadFileEditable: false, uploadFileExist: undefined },
      scenario: "试卷来源未知",
    },
  ])("$scenario 时选择 $expected", ({ expected, input }) => {
    expect(resolvePaperDownloadTarget(input)).toBe(expected);
  });
});
