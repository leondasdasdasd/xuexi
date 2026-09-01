import request from "../utils/request";
import { analyzeQualityBenchmarkText } from "./qualityBenchmark";

jest.mock("../utils/request", () => jest.fn());

afterEach(() => {
  jest.clearAllMocks();
});

describe("校内外对比文本 AI 解析服务", () => {
  it("调用文本分析接口并要求返回校内外对比结构化 JSON", async () => {
    request.mockResolvedValue({
      success: true,
      status: 1,
      content: {
        analysisJson: {
          scoreRows: [
            {
              schoolName: "实验中学",
              subjectName: "总分",
              studentCount: 423,
              avgScore: 610.5,
            },
          ],
          targetLineRows: [],
          warnings: [],
        },
      },
    });

    const result = await analyzeQualityBenchmarkText({
      inputText: "学校 考试人数 总分平均分\n实验中学 423 610.5",
      importScope: "score",
      examName: "本次考试",
      gradeName: "九年级",
    });

    expect(request).toHaveBeenCalledWith(
      "https://ai.yungu.org/center/api/file-services/textAnalysis",
      {
        method: "POST",
        body: expect.objectContaining({
          inputText: "学校\t考试人数\t总分平均分\n实验中学\t423\t610.5",
          analysisType: "qualityBenchmarkTextImport",
          forceAnalysis: false,
          model: "qwen3-max",
        }),
      },
    );
    const requestBody = request.mock.calls[0][1].body;
    expect(requestBody.analysisInstruction).toContain("本次考试");
    expect(requestBody.analysisInstruction).toContain("九年级");
    expect(requestBody.analysisInstruction).toContain("完整性原则");
    expect(requestBody.analysisInstruction).toContain("记录拆分");
    expect(requestBody.jsonSchema.properties.scoreRows.type).toBe("array");
    expect(requestBody.jsonSchema.properties.targetLineRows.type).toBe("array");
    expect(requestBody.jsonSchema.properties.targetLineRows.maxItems).toBe(0);
    expect(requestBody.jsonSchema.properties.scoreRows.items.required).toEqual([
      "schoolName",
      "subjectName",
      "studentCount",
      "avgScore",
      "passRate",
      "goodRate",
      "excellentRate",
    ]);
    expect(requestBody.jsonSchema.required).toEqual([
      "scoreRows",
      "targetLineRows",
      "warnings",
    ]);
    expect(result.scoreRows).toHaveLength(1);
    expect(result.targetLineRows).toHaveLength(0);
  });

  it("接口只返回 analysisText 字符串时也能解析 JSON", async () => {
    request.mockResolvedValue({
      success: true,
      status: 1,
      content: {
        analysisText:
          "{\"scoreRows\":[],\"targetLineRows\":[{\"schoolName\":\"实验中学\",\"studentCount\":423,\"targetScore\":610,\"onlineCount\":126}],\"warnings\":[]}",
      },
    });

    const result = await analyzeQualityBenchmarkText({
      inputText: "学校 考试人数 610\n实验中学 423 126",
      importScope: "target",
    });

    expect(result.targetLineRows).toEqual([
      expect.objectContaining({
        schoolName: "实验中学",
        studentCount: 423,
        targetScore: 610,
        onlineCount: 126,
      }),
    ]);
  });

  it("分数线 AI 解析使用强约束提示词和 Schema", async () => {
    request.mockResolvedValue({
      success: true,
      status: 1,
      content: {
        analysisJson: {
          scoreRows: [],
          targetLineRows: [],
          warnings: [],
        },
      },
    });

    await analyzeQualityBenchmarkText({
      inputText:
        "学校  考试人数  650分  600分  550分\n实验中学  423  88  156  238",
      importScope: "target",
    });

    const requestBody = request.mock.calls[0][1].body;
    expect(requestBody.inputText).toBe(
      "学校\t考试人数\t650分\t600分\t550分\n实验中学\t423\t88\t156\t238",
    );
    expect(requestBody.analysisInstruction).toContain("分数线宽表");
    expect(requestBody.analysisInstruction).toContain("剔除可能存在的“分”等单位");
    expect(requestBody.analysisInstruction).toContain("保留4位小数");
    expect(requestBody.jsonSchema.properties.scoreRows.maxItems).toBe(0);
    expect(requestBody.jsonSchema.properties.targetLineRows.items.required).toEqual([
      "schoolName",
      "studentCount",
      "targetScore",
      "onlineCount",
      "onlineRate",
    ]);
  });

  it("提交 AI 前将空格对齐的宽表规范化为 Tab 分隔文本", async () => {
    request.mockResolvedValue({
      success: true,
      status: 1,
      content: {
        analysisJson: {
          scoreRows: [],
          targetLineRows: [],
          warnings: [],
        },
      },
    });

    await analyzeQualityBenchmarkText({
      inputText:
        "  学校  考试人数        总分平均分      总分及格率\n  实验中学      423     610.5   80.74",
      importScope: "score",
    });

    const requestBody = request.mock.calls[0][1].body;
    expect(requestBody.inputText).toBe(
      "学校\t考试人数\t总分平均分\t总分及格率\n实验中学\t423\t610.5\t80.74",
    );
    expect(requestBody.analysisInstruction).toContain("Tab");
  });

  it("接口失败时抛出后端返回的错误信息", async () => {
    request.mockResolvedValue({
      success: false,
      status: 2,
      message: "AI product is not configured for current school",
      content: undefined,
    });

    await expect(
      analyzeQualityBenchmarkText({
        inputText: "学校 考试人数 总分平均分",
        importScope: "score",
      }),
    ).rejects.toThrow("AI product is not configured for current school");
  });
});
