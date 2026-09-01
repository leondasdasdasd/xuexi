import { buildQualityBenchmarkSaveRequest } from "./index";

describe("校内外对比保存范围", () => {
  it("保存三率口径时不提交旧的校外表格数据", () => {
    const request = buildQualityBenchmarkSaveRequest(
      { id: 100 },
      undefined,
      undefined,
      {
        passRate: 60,
        goodRate: 75,
        excellentRate: 85,
      },
      "RATE_THRESHOLD",
    );

    expect(request).toEqual({
      id: 100,
      saveScope: "RATE_THRESHOLD",
      localRateThresholds: {
        passRate: 60,
        goodRate: 75,
        excellentRate: 85,
      },
    });
    expect(request.scoreRows).toBeUndefined();
    expect(request.targetLineRows).toBeUndefined();
  });

  it("保存平均成绩时只提交平均成绩范围", () => {
    const scoreRows = [
      {
        schoolName: "实验中学",
        subjectName: "总分",
        avgScore: 610.5,
      },
    ];

    const request = buildQualityBenchmarkSaveRequest(
      { id: 100 },
      scoreRows,
      undefined,
      undefined,
      "SCORE",
    );

    expect(request).toEqual({
      id: 100,
      saveScope: "SCORE",
      scoreRows,
    });
    expect(request.targetLineRows).toBeUndefined();
    expect(request.localRateThresholds).toBeUndefined();
  });
});
