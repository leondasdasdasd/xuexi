import { buildTargetLineMatrix, parseQualityBenchmarkImport } from "./index";

describe("校内外对比粘贴解析", () => {
  it("兼容聊天中复制出来的空格分隔和粘连表头成绩宽表", () => {
    const text = `学校  考试人数        总分平均分      总分及格率      总分良好率      总分优秀率      语文平均分      语文及格率      语文良好率      语文优秀率数学平均分      数学及格率      数学良好率      数学优秀率
实验中学      423     610.5   80.74   65.2    24.23   93.12   96.21   78.3    21.8    82.85   74.17   60.4    20.38
华辰学校      456     625.3   83.84   68.1    29.49   93.98   96.26   80.1    22.2    88.65   81.98   66.5    33.85
区平均        5196    598.2   78      61.3    18      87.62   89.09   70.2    10.79   71.85   59.61   48.2    11.82`;

    const result = parseQualityBenchmarkImport(text, "score");

    expect(result.scoreRows).toHaveLength(9);
    expect(result.targetRows).toHaveLength(0);
    expect(result.notice).toContain("已识别 9 条平均成绩数据");
    expect(result.scoreRows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          schoolName: "实验中学",
          subjectName: "总分",
          studentCount: 423,
          avgScore: 610.5,
          passRate: 80.74,
          goodRate: 65.2,
          excellentRate: 24.23,
        }),
        expect.objectContaining({
          schoolName: "实验中学",
          subjectName: "数学",
          avgScore: 82.85,
          excellentRate: 20.38,
        }),
      ]),
    );
  });

  it("兼容被复制工具换成多行表头的成绩宽表", () => {
    const text = `学校  考试人数  总分平均分  总分及格率  总分良好率  总分优秀率  语文平均分  语文及格率  语文良好率  语文优秀率
数学平均分  数学及格率  数学良好率  数学优秀率  英语平均分  英语及格率  英语良好率  英语优秀率
实验中学  423  610.5  80.74  65.2  24.23  93.12  96.21  78.3  21.8  82.85  74.17  60.4  20.38  94.6  86.2  70.5  32.4
华辰学校  456  625.3  83.84  68.1  29.49  93.98  96.26  80.1  22.2  88.65  81.98  66.5  33.85  98.2  89.4  73.1  38.6`;

    const result = parseQualityBenchmarkImport(text, "score");

    expect(result.scoreRows).toHaveLength(8);
    expect(result.scoreRows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          schoolName: "实验中学",
          subjectName: "数学",
          avgScore: 82.85,
          excellentRate: 20.38,
        }),
        expect.objectContaining({
          schoolName: "华辰学校",
          subjectName: "英语",
          avgScore: 98.2,
          excellentRate: 38.6,
        }),
      ]),
    );
  });

  it("兼容空格分隔的总分上线宽表", () => {
    const text = `学校  考试人数   730  720  710
实验中学  423  2  5  17
华辰学校  456  3  9  30`;

    const result = parseQualityBenchmarkImport(text, "target");

    expect(result.targetRows).toHaveLength(6);
    expect(result.scoreRows).toHaveLength(0);
    expect(result.notice).toContain("已识别 6 条总分上线数据");
    expect(result.targetRows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          schoolName: "实验中学",
          studentCount: 423,
          targetScore: 730,
          onlineCount: 2,
        }),
        expect.objectContaining({
          schoolName: "华辰学校",
          studentCount: 456,
          targetScore: 710,
          onlineCount: 30,
        }),
      ]),
    );
  });

  it("总分上线宽表支持 0 和 1 这类低分数线", () => {
    const text = `学校  考试人数   1  0
实验中学  423  126  180
华辰学校  456  151  211`;

    const result = parseQualityBenchmarkImport(text, "target");

    expect(result.targetRows).toHaveLength(4);
    expect(result.targetRows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          schoolName: "实验中学",
          targetScore: 1,
          onlineCount: 126,
        }),
        expect.objectContaining({
          schoolName: "华辰学校",
          targetScore: 0,
          onlineCount: 211,
        }),
      ]),
    );
  });

  it("总分上线宽表只有一个目标线列时也能识别", () => {
    const text = `学校  考试人数   610
实验中学  423  126`;

    const result = parseQualityBenchmarkImport(text, "target");

    expect(result.targetRows).toHaveLength(1);
    expect(result.targetRows[0]).toEqual(
      expect.objectContaining({
        schoolName: "实验中学",
        studentCount: 423,
        targetScore: 610,
        onlineCount: 126,
      }),
    );
  });

  it("总分上线外校平均不展示考试人数小数，并四舍五入上线人数", () => {
    const result = buildTargetLineMatrix([], [
      {
        schoolName: "实验中学",
        studentCount: 423,
        targetScore: 700,
        onlineCount: 34,
        onlineRate: 8.04,
      },
      {
        schoolName: "华辰学校",
        studentCount: 456,
        targetScore: 700,
        onlineCount: 49,
        onlineRate: 10.75,
      },
    ]);
    const averageRow = result.rows.find((row) => row.schoolName === "外校平均");

    expect(averageRow.studentCount).toBeUndefined();
    expect(averageRow.targetMap[700].studentCount).toBeUndefined();
    expect(averageRow.targetMap[700].onlineCount).toBe(42);
    expect(averageRow.targetMap[700].onlineRate).toBeCloseTo(9.395);
  });

  it("没有用户录入的目标线时不展示默认写死分数线", () => {
    const result = buildTargetLineMatrix([], []);

    expect(result.targetScores).toEqual([]);
    expect(result.rows).toEqual([]);
  });

  it("总分上线只展示用户导入或保存的目标线", () => {
    const result = buildTargetLineMatrix([], [
      {
        schoolName: "实验中学",
        studentCount: 423,
        targetScore: 650,
        onlineCount: 88,
      },
      {
        schoolName: "华辰学校",
        studentCount: 456,
        targetScore: 600,
        onlineCount: 156,
      },
    ]);

    expect(result.targetScores).toEqual([650, 600]);
  });

  it("导入类型不匹配时给出可理解的失败原因", () => {
    const text = `学校  考试人数   730  720  710
实验中学  423  2  5  17`;

    const result = parseQualityBenchmarkImport(text, "score");

    expect(result.scoreRows).toHaveLength(0);
    expect(result.notice).toContain("当前选择的是平均成绩导入");
    expect(result.notice).toContain("总分上线表");
  });

  it("成绩表有表头但数字无效时提示检查分数和比例", () => {
    const text = `学校,考试人数,总分平均分,总分及格率
实验中学,423,abc,xyz`;

    const result = parseQualityBenchmarkImport(text, "score");

    expect(result.scoreRows).toHaveLength(0);
    expect(result.notice).toContain("没有有效成绩行");
    expect(result.notice).toContain("数字");
  });

  it("缺少良好率时不根据及格率和优秀率推算", () => {
    const text = `学校,考试人数,总分平均分,总分及格率,总分优秀率
实验中学,423,610.5,80.74,24.23`;

    const result = parseQualityBenchmarkImport(text, "score");

    expect(result.scoreRows).toEqual([
      expect.objectContaining({
        schoolName: "实验中学",
        subjectName: "总分",
        avgScore: 610.5,
        passRate: 80.74,
        goodRate: undefined,
        excellentRate: 24.23,
      }),
    ]);
  });

  it("总分上线表有表头但数字无效时提示检查目标线和上线人数", () => {
    const text = `学校,考试人数,目标线,上线人数
实验中学,423,abc,xyz`;

    const result = parseQualityBenchmarkImport(text, "target");

    expect(result.targetRows).toHaveLength(0);
    expect(result.notice).toContain("没有有效上线行");
    expect(result.notice).toContain("数字");
  });
});
