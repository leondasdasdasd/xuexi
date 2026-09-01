import fs from "fs";
import path from "path";

import QualityBenchmark from "./components/QualityBenchmark";
import {
  buildAnalysisSummaryDateQuery,
  getHashQueryValue,
} from "./analysisSummary";
import {
  exportQualityBenchmarkXlsx,
  recognizeQualityBenchmarkImage,
} from "../../services/qualityBenchmark";

const projectRoot = path.resolve(process.cwd());

/**
 * 读取项目源码文件，用于验证跨路由接入点是否都完成移植。
 * @param {string} relativePath 相对项目根目录的文件路径。
 * @returns {string} 文件源码内容。
 */
function readSource(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

describe("成绩汇总校内外对比接入", () => {
  it("新增校内外对比组件和识图服务可以被前端构建解析", () => {
    expect(typeof QualityBenchmark).toBe("function");
    expect(typeof recognizeQualityBenchmarkImage).toBe("function");
    expect(typeof exportQualityBenchmarkXlsx).toBe("function");
  });

  it("在成绩汇总分析页接入校内外对比标签和组件", () => {
    const source = readSource("src/routes/NewScoreSummary/analysisSummary.jsx");

    expect(source).toContain("QualityBenchmark");
    expect(source).toContain('key: "qualityBenchmark"');
    expect(source).toContain("校内外对比");
    expect(source).toContain("classSummary(parameters)");
    expect(source).toContain("classRate(parameters)");
  });

  it("不移植校内外对比提交里的 mock 演示明细页路由", () => {
    const source = readSource("src/common/routes.js");

    expect(source).not.toContain('path: "/mockPaperDetail/:id?"');
    expect(source).not.toContain('path: "/mockExamDetail/:id?"');
    expect(source).not.toContain('() => import("../routes/MockPaperDetail")');
    expect(source).not.toContain('() => import("../routes/MockExamDetail")');
  });

  it("不从校内外对比提交移植智学网导入说明弹窗", () => {
    const source = readSource("src/components/ScoreImportModal/index.jsx");

    expect(source).not.toContain("智学网文件上传说明");
    expect(source).not.toContain("renderZhixueGuideModal");
  });

  it("校内外对比数据接入服务端查询和保存接口", () => {
    const serviceSource = readSource("src/services/qualityBenchmark.js");
    const componentSource = readSource(
      "src/routes/NewScoreSummary/components/QualityBenchmark/index.jsx",
    );
    const pageSource = readSource(
      "src/routes/NewScoreSummary/analysisSummary.jsx",
    );

    expect(serviceSource).toContain("queryQualityBenchmark");
    expect(serviceSource).toContain("saveQualityBenchmark");
    expect(serviceSource).toContain("/api/exam/summary/qualityBenchmark");
    expect(serviceSource).toContain("/api/exam/summary/qualityBenchmark/save");
    expect(componentSource).toContain("queryQualityBenchmark");
    expect(componentSource).toContain("saveQualityBenchmark");
    expect(componentSource).toContain("onSummaryReportIdChange");
    expect(pageSource).toContain("handleQualityBenchmarkReportIdChange");
  });

  it("校内外对比导出调用后端生成真实 xlsx 文件", () => {
    const serviceSource = readSource("src/services/qualityBenchmark.js");
    const componentSource = readSource(
      "src/routes/NewScoreSummary/components/QualityBenchmark/index.jsx",
    );

    expect(serviceSource).toContain("exportQualityBenchmarkXlsx");
    expect(serviceSource).toContain(
      "/api/exam/summary/qualityBenchmark/export",
    );
    expect(componentSource).toContain("exportRowsToXlsx");
    expect(componentSource).toContain("exportQualityBenchmarkXlsx");
    expect(componentSource).not.toContain("exportRowsToExcel");
    expect(componentSource).not.toContain("application/vnd.ms-excel");
  });

  it("总分上线分数线由用户录入或导入，不使用前端固定默认线", () => {
    const componentSource = readSource(
      "src/routes/NewScoreSummary/components/QualityBenchmark/index.jsx",
    );

    expect(componentSource).toContain("新增分数线");
    expect(componentSource).toContain("addDraftTargetScore");
    expect(componentSource).not.toContain("DEFAULT_TARGET_LINES");
    expect(componentSource).not.toContain("targetScore: 700");
  });

  it("校内外对比导入输入框提供完整示例和本场考试分数线提示", () => {
    const componentSource = readSource(
      "src/routes/NewScoreSummary/components/QualityBenchmark/index.jsx",
    );
    const chineseMessages = readSource("src/i18n/zh-CN.js");
    const englishMessages = readSource("src/i18n/en.js");

    expect(componentSource).toContain(
      "qualityBenchmark.scoreImportPlaceholder",
    );
    expect(chineseMessages).toContain("总分平均分");
    expect(chineseMessages).toContain("英语优秀率");
    expect(chineseMessages).toContain("实验中学\\t423\\t610.5");
    expect(chineseMessages).toContain("分数线必须使用本场考试实际口径");
    expect(chineseMessages).toContain('"如：650"');
    expect(englishMessages).toContain('"e.g. 650"');
  });

  it("成绩汇总分析页读取 date 参数时保留 AES 加密串中的加号", () => {
    window.location.hash =
      "#/newScoreSummary/analysisSummary/classAnalysis?date=abc+def/ghi=&tab=1";

    expect(getHashQueryValue("date")).toBe("abc+def/ghi=");
  });

  it("成绩汇总分析页兼容读取已经编码过的 date 参数", () => {
    window.location.hash =
      "#/newScoreSummary/analysisSummary/classAnalysis?date=abc%2Bdef%2Fghi%3D";

    expect(getHashQueryValue("date")).toBe("abc+def/ghi=");
  });

  it("成绩汇总分析页写入 date 参数时先编码，避免加密串被浏览器查询解析改写", () => {
    expect(buildAnalysisSummaryDateQuery("abc+def/ghi=")).toBe(
      "date=abc%2Bdef%2Fghi%3D",
    );
  });
});
