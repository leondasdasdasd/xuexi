/** @jest-environment node */
import {
  ClassOverviewChartRegistry,
  buildAverageChartRows,
  buildBoxPlotRows,
  buildClassOverviewBenchmark,
  buildRateChartRows,
  buildTripleChartRows,
  legacyG2TooltipOptions,
} from "./classOverviewChartModel";

describe("班级成绩概况图表模型", () => {
  it("保留零分并过滤空值和非数字平均分", () => {
    expect(
      buildAverageChartRows([
        { avgScore: 75, gradeAndGroupName: "全年级" },
        { avgScore: null, gradeAndGroupName: "一班" },
        { avgScore: 0, gradeAndGroupName: "二班" },
        { avgScore: "invalid", gradeAndGroupName: "三班" },
      ]),
    ).toEqual([
      {
        className: "二班",
        classScore: 0,
        courseTeacherNames: null,
      },
    ]);
  });

  it("分别规范三分和三率数据，不让部分空指标污染图表", () => {
    const rows = [
      { gradeAndGroupName: "全年级" },
      {
        avgScore: 0,
        gradeAndGroupName: "一班",
        lowRate: "bad",
        maxScore: 100,
        minScore: null,
        outstandingRate: "0%",
        passRate: null,
      },
    ];

    expect(buildTripleChartRows(rows, ["平均分", "最高分", "最低分"])).toEqual([
      {
        className: "一班",
        classScore: 0,
        courseTeacherNames: null,
        scoreName: "平均分",
      },
      {
        className: "一班",
        classScore: 100,
        courseTeacherNames: null,
        scoreName: "最高分",
      },
    ]);
    expect(buildRateChartRows(rows, ["优秀率", "及格率", "低分率"])).toEqual([
      {
        className: "一班",
        classScore: 0,
        courseTeacherNames: null,
        scoreName: "优秀率",
      },
    ]);
  });

  it("集中解析全年级基准，不向组件暴露首行和百分比格式", () => {
    expect(
      buildClassOverviewBenchmark([
        {
          avgScore: "82.5",
          lowRate: "4%",
          maxScore: 100,
          minScore: 48,
          outstandingRate: "36%",
          passRate: "invalid",
        },
      ]),
    ).toEqual({
      averageScore: 82.5,
      lowRate: 4,
      maximumScore: 100,
      minimumScore: 48,
      outstandingRate: 36,
      passRate: null,
    });
  });

  it("只把五数概括完整的箱式图数据交给 ECharts", () => {
    expect(
      buildBoxPlotRows([
        { boxplot: null, gradeAndGroupName: "全年级" },
        {
          boxplot: { min: 0, q1: 20, q2: 40, q3: 60, max: 80 },
          gradeAndGroupName: "一班",
        },
      ]),
    ).toEqual([
      {
        className: "一班",
        classNameEn: "",
        courseTeacherNames: null,
        outlierHigh: [],
        outlierLow: [],
        values: [0, 20, 40, 60, 80],
      },
    ]);
  });

  it("强制关闭旧版 G2 tooltip 十字线", () => {
    expect(legacyG2TooltipOptions({ useHtml: true })).toEqual({
      crosshairs: false,
      useHtml: true,
    });
  });

  it("替换和整体释放图表时销毁旧实例", () => {
    const first = { destroy: jest.fn() };
    const second = { destroy: jest.fn() };
    const boxPlot = { dispose: jest.fn() };
    const registry = new ClassOverviewChartRegistry();

    registry.replace("line", first);
    registry.replace("line", second);
    registry.replace("boxPlot", boxPlot);
    registry.destroyAll();

    expect(first.destroy).toHaveBeenCalledTimes(1);
    expect(second.destroy).toHaveBeenCalledTimes(1);
    expect(boxPlot.dispose).toHaveBeenCalledTimes(1);
  });

  it("由注册表封装图表导出能力和缺失实例处理", () => {
    const downloadImage = jest.fn();
    const registry = new ClassOverviewChartRegistry();
    registry.replace("bar", { downloadImage });
    registry.replace("boxPlot", { dispose: jest.fn() });

    expect(registry.download("bar", "班级成绩柱状图")).toBe(true);
    expect(downloadImage).toHaveBeenCalledWith("班级成绩柱状图");
    expect(registry.download("missing", "不存在的图表")).toBe(false);
    expect(registry.download("boxPlot", "不支持导出的图表")).toBe(false);
  });
});
