jest.mock("jspdf/dist/jspdf.umd.min", () => ({
  jsPDF: jest.fn(),
}));

import {
  buildOriginalVolumePdf,
  downloadOriginalVolumePdf,
} from "./originalVolumePdf";

const TEST_PDF_FILE_NAME = "期末测验-一班-原卷.pdf";

/**
 * 创建可观察调用顺序的 PDF 假对象。
 * @param {object} options 保留参数位，便于满足项目测试函数签名规则。
 * @returns {object} PDF 假对象和调用记录。
 */
function createFakePdf(options = {}) {
  const calls = options.calls || [];
  const pdf = {
    internal: {
      pageSize: {
        getWidth: (unit) => 210 + String(unit || "").length * 0,
        getHeight: (unit) => 297 + String(unit || "").length * 0,
      },
    },
    addImage: jest.fn((dataUrl, format, x, y, width, height) => {
      calls.push(`image:${dataUrl}:${format}:${x}:${y}:${width}:${height}`);
    }),
    addPage: jest.fn((format) => {
      calls.push(`page:${format || "default"}`);
    }),
    save: jest.fn((fileName) => {
      calls.push(`save:${fileName}`);
    }),
  };
  return { pdf, calls };
}

describe("前端原卷 PDF 导出", () => {
  it("按学生列表和原卷图片顺序生成 PDF 页面", async () => {
    const { pdf, calls } = createFakePdf();
    const result = await buildOriginalVolumePdf({
      examName: "期末测验",
      groupName: "一班",
      studentList: [
        { studentUserId: undefined, studentName: "共 2 人" },
        {
          studentUserId: 1001,
          studentName: "张三",
          studentExamPaperUrl: ["https://example.com/1.jpg"],
        },
        {
          studentUserId: 1002,
          studentName: "李四",
          studentExamPaperUrl: [
            "https://example.com/2.jpg",
            "https://example.com/3.jpg",
          ],
        },
      ],
      createPdf: (options) => {
        expect(options).toBeUndefined();
        return pdf;
      },
      loadImage: jest
        .fn()
        .mockResolvedValueOnce({
          dataUrl: "image-1",
          width: 100,
          height: 200,
        })
        .mockResolvedValueOnce({
          dataUrl: "image-2",
          width: 100,
          height: 100,
        })
        .mockResolvedValueOnce({
          dataUrl: "image-3",
          width: 200,
          height: 100,
        }),
    });

    expect(result.fileName).toBe(TEST_PDF_FILE_NAME);
    expect(calls).toEqual([
      "image:image-1:JPEG:30.75:0:148.5:297",
      "page:default",
      "image:image-2:JPEG:0:43.5:210:210",
      "page:default",
      "image:image-3:JPEG:0:96:210:105",
    ]);
  });

  it("任意图片读取失败时提示具体学生和页码", async () => {
    await expect(
      buildOriginalVolumePdf({
        examName: "期末测验",
        groupName: "一班",
        studentList: [
          {
            studentUserId: 1001,
            studentName: "张三",
            studentExamPaperUrl: ["https://example.com/1.jpg"],
          },
        ],
        createPdf: (options) => createFakePdf(options).pdf,
        loadImage: jest.fn().mockRejectedValue(new Error("CORS blocked")),
      }),
    ).rejects.toThrow("学生【张三】第1张图片读取失败");
  });

  it("下载 PDF 时调用 jsPDF save", () => {
    const { pdf } = createFakePdf();

    downloadOriginalVolumePdf({
      pdf,
      fileName: TEST_PDF_FILE_NAME,
    });

    expect(pdf.save).toHaveBeenCalledWith(TEST_PDF_FILE_NAME);
  });
});
