import JSZip from "jszip";

import {
  buildOriginalVolumeZip,
  buildOriginalVolumeNoCacheUrl,
  cleanOriginalVolumePathName,
  resolveOriginalVolumeImageSuffix,
} from "./originalVolumeZip";

/**
 * 将 zip Blob 解析为 JSZip 实例，便于断言内部目录和文件。
 * @param {Blob} blob 前端生成的 zip 文件内容。
 * @returns {Promise<JSZip>} 已解析的 zip 实例。
 */
async function loadZipBlob(blob) {
  return JSZip.loadAsync(blob);
}

describe("前端原卷 zip 打包规则", () => {
  it("清理路径名称时保持与服务端非法字符和兜底规则一致", () => {
    const longName = "a".repeat(130);

    expect(cleanOriginalVolumePathName(" 期末:测验*原卷?<>|/\\ ")).toBe(
      "期末_测验_原卷______",
    );
    expect(cleanOriginalVolumePathName("   ")).toBe("未命名");
    expect(cleanOriginalVolumePathName(".")).toBe("未命名");
    expect(cleanOriginalVolumePathName("..")).toBe("未命名");
    expect(cleanOriginalVolumePathName("张三...")).toBe("张三");
    expect(cleanOriginalVolumePathName(longName)).toHaveLength(120);
  });

  it("识别图片后缀时仅保留服务端允许的常见图片类型", () => {
    expect(resolveOriginalVolumeImageSuffix("https://example.com/page.php?x=1")).toBe(
      ".jpg",
    );
    expect(resolveOriginalVolumeImageSuffix("https://example.com/page.WEBP")).toBe(
      ".webp",
    );
  });

  it("读取图片时追加缓存绕过参数且保留原查询参数和 hash", () => {
    expect(
      buildOriginalVolumeNoCacheUrl("https://example.com/page.jpg", "cache 1"),
    ).toBe("https://example.com/page.jpg?_originalVolumeExportNoCache=cache%201");
    expect(
      buildOriginalVolumeNoCacheUrl(
        "https://example.com/page.jpg?Expires=1&Signature=a#view",
        "cache-2",
      ),
    ).toBe(
      "https://example.com/page.jpg?Expires=1&Signature=a&_originalVolumeExportNoCache=cache-2#view",
    );
  });

  it("按测验、班级、学生和页码生成 zip 目录，并跳过首行汇总行", async () => {
    const result = await buildOriginalVolumeZip({
      examName: "期末:测验",
      studentList: [
        {
          studentUserId: undefined,
          studentName: "共 2 人",
        },
        {
          groupId: 10,
          groupName: "一班",
          studentUserId: 1001,
          studentName: "张三",
          studentExamPaperUrl: ["https://example.com/paper/page.PNG?x=1"],
        },
        {
          groupId: 10,
          groupName: "一班",
          studentUserId: 1002,
          studentName: "张三",
          studentExamPaperUrl: ["https://example.com/paper/page.WEBP"],
        },
      ],
      fetchImage: jest.fn().mockResolvedValue(new Blob(["image"])),
    });

    const zip = await loadZipBlob(result.blob);
    const entryNames = Object.keys(zip.files).sort();

    expect(result.fileName).toBe("期末_测验-原卷.zip");
    expect(entryNames).toEqual([
      "期末_测验-原卷/",
      "期末_测验-原卷/一班/",
      "期末_测验-原卷/一班/张三/",
      "期末_测验-原卷/一班/张三/张三—第1张.png",
      "期末_测验-原卷/一班/张三_1002/",
      "期末_测验-原卷/一班/张三_1002/张三_1002—第1张.webp",
    ]);
  });

  it("任意学生图片读取失败时终止 zip 生成并提示具体学生和页码", async () => {
    await expect(
      buildOriginalVolumeZip({
        examName: "期末测验",
        studentList: [
          {
            groupId: 10,
            groupName: "一班",
            studentUserId: 1001,
            studentName: "张三",
            studentExamPaperUrl: ["https://example.com/paper/page.PNG"],
          },
        ],
        fetchImage: jest.fn().mockRejectedValue(new Error("CORS blocked")),
      }),
    ).rejects.toThrow("学生【张三】第1张图片读取失败");
  });
});
