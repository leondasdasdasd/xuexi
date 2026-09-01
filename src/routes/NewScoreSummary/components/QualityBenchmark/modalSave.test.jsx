import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { message } from "antd";
import React from "react";

import {
  analyzeQualityBenchmarkText,
  queryQualityBenchmark,
  saveQualityBenchmark,
} from "../../../../services/qualityBenchmark";
import QualityBenchmark from "./index";

jest.mock("../../../../services/qualityBenchmark", () => ({
  analyzeQualityBenchmarkText: jest.fn(),
  queryQualityBenchmark: jest.fn(),
  recognizeQualityBenchmarkImage: jest.fn(),
  saveQualityBenchmark: jest.fn(),
}));

const baseProperties = {
  gradeId: 7,
  loadingLocalData: false,
  localRateData: [
    {
      excellentRate: 0,
      passRate: 57.14,
      studentTotal: 4,
    },
  ],
  localSummaryData: [
    {
      studentTotal: 4,
      studentTotalScore: 185.25,
    },
  ],
  reportDetail: {
    schoolName: "本校",
  },
  reportId: 100,
  reportType: 1,
  scoreSummary: {
    columnSet: [
      {
        subjectId: "total",
        subjectName: "总分",
        totalScore: 300,
      },
    ],
    studentExamResultSummaryAnalyseRowList: [],
  },
  semesterId: 20_251,
};

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
  jest.restoreAllMocks();
});

describe("校内外对比弹窗保存", () => {
  it("外校平均分和本校分制差异较大时仍直接展示平均分", async () => {
    queryQualityBenchmark.mockResolvedValue({
      status: true,
      content: {
        localRateThresholds: {
          excellentRate: 85,
          goodRate: 75,
          passRate: 60,
        },
        scoreRows: [
          {
            avgScore: 610.5,
            excellentRate: 24.23,
            goodRate: 65.2,
            passRate: 80.74,
            schoolName: "实验中学",
            studentCount: 423,
            subjectName: "总分",
          },
        ],
        summaryReportId: 100,
      },
    });

    render(<QualityBenchmark {...baseProperties} />);

    expect(await screen.findByText("610.50")).toBeInTheDocument();
    expect(screen.queryByText("需校验")).not.toBeInTheDocument();
  });

  it("缺少学校名时只展示一次本校名称", async () => {
    queryQualityBenchmark.mockResolvedValue({
      status: true,
      content: {
        localRateThresholds: {
          excellentRate: 85,
          goodRate: 75,
          passRate: 60,
        },
        summaryReportId: 100,
      },
    });

    render(<QualityBenchmark {...baseProperties} reportDetail={{}} />);

    await screen.findByText("多校对比");

    expect(screen.queryAllByText("光华外国语学校")).toHaveLength(0);
    expect(screen.getAllByText("本校").length).toBeGreaterThan(0);
    expect(
      screen.queryByText("本校", { selector: "em" }),
    ).not.toBeInTheDocument();
  });

  it("点击多校对比弹窗保存按钮后调用保存接口", async () => {
    queryQualityBenchmark.mockResolvedValue({
      status: true,
      content: {
        localRateThresholds: {
          excellentRate: 85,
          goodRate: 75,
          passRate: 60,
        },
        summaryReportId: 100,
      },
    });
    saveQualityBenchmark.mockResolvedValue({
      status: true,
      content: {
        scoreRows: [
          {
            avgScore: 210.5,
            excellentRate: 25,
            goodRate: 50,
            passRate: 75,
            schoolName: "Codex测试学校-平均",
            studentCount: 8,
            subjectName: "总分",
          },
        ],
        summaryReportId: 100,
      },
    });
    jest.spyOn(message, "success").mockImplementation(jest.fn());

    render(<QualityBenchmark {...baseProperties} />);

    fireEvent.click(screen.getAllByText("编辑数据")[0]);
    fireEvent.change(
      screen.getByPlaceholderText(/支持字段：学校名、考试人数/),
      {
        target: {
          value:
            "学校\t考试人数\t总分平均分\t总分及格率\t总分良好率\t总分优秀率\nCodex测试学校-平均\t8\t210.5\t75\t50\t25",
        },
      },
    );
    fireEvent.click(screen.getByText("前端解析"));

    await screen.findByText(/已识别 1 条平均成绩数据/);

    fireEvent.click(screen.getByText("保 存"));

    await waitFor(() =>
      expect(saveQualityBenchmark).toHaveBeenCalledWith({
        id: 100,
        saveScope: "SCORE",
        scoreRows: [
          expect.objectContaining({
            avgScore: 210.5,
            excellentRate: 25,
            goodRate: 50,
            passRate: 75,
            schoolName: "Codex测试学校-平均",
            studentCount: 8,
            subjectName: "总分",
          }),
        ],
      }),
    );
  });

  it("导入弹窗同时支持前端解析和 AI 解析", async () => {
    queryQualityBenchmark.mockResolvedValue({
      status: true,
      content: {
        localRateThresholds: {
          excellentRate: 85,
          goodRate: 75,
          passRate: 60,
        },
        summaryReportId: 100,
      },
    });
    analyzeQualityBenchmarkText.mockResolvedValue({
      scoreRows: [
        {
          avgScore: 610.5,
          excellentRate: 24.23,
          goodRate: 65.2,
          passRate: 80.74,
          schoolName: "实验中学",
          studentCount: 423,
          subjectName: "总分",
        },
      ],
      targetLineRows: [],
      warnings: [],
    });

    render(<QualityBenchmark {...baseProperties} />);

    fireEvent.click(screen.getAllByText("编辑数据")[0]);

    expect(screen.getByText("前端解析")).toBeInTheDocument();
    expect(screen.getByText("AI解析")).toBeInTheDocument();

    fireEvent.change(
      screen.getByPlaceholderText(/支持字段：学校名、考试人数/),
      {
        target: {
          value: "学校 考试人数 总分平均分\n实验中学 423 610.5",
        },
      },
    );
    fireEvent.click(screen.getByText("AI解析"));

    await waitFor(() =>
      expect(analyzeQualityBenchmarkText).toHaveBeenCalledWith({
        examName: "本次考试",
        gradeName: undefined,
        importScope: "score",
        inputText: "学校 考试人数 总分平均分\n实验中学 423 610.5",
      }),
    );
    expect(await screen.findAllByDisplayValue("实验中学")).not.toHaveLength(0);
    expect(screen.getByDisplayValue("610.5")).toBeInTheDocument();
  });

  it("同步总分上线粘贴数据时替换旧草稿目标线", async () => {
    queryQualityBenchmark.mockResolvedValue({
      status: true,
      content: {
        localRateThresholds: {
          excellentRate: 85,
          goodRate: 75,
          passRate: 60,
        },
        summaryReportId: 100,
        targetLineRows: [
          {
            onlineCount: 12,
            schoolName: "历史学校",
            studentCount: 100,
            targetScore: 670,
          },
        ],
      },
    });
    saveQualityBenchmark.mockResolvedValue({
      status: true,
      content: {
        summaryReportId: 100,
        targetLineRows: [],
      },
    });
    jest.spyOn(message, "success").mockImplementation(jest.fn());

    render(<QualityBenchmark {...baseProperties} />);

    await screen.findByText("670");
    fireEvent.click(screen.getAllByText("编辑数据")[1]);
    fireEvent.change(screen.getByPlaceholderText(/可粘贴总分上线表/), {
      target: {
        value: "学校\t考试人数\t610\n实验中学\t423\t126",
      },
    });
    fireEvent.click(screen.getByText("前端解析"));

    await screen.findByText(/已识别 1 条总分上线数据/);

    fireEvent.click(screen.getByText("保 存"));

    await waitFor(() => expect(saveQualityBenchmark).toHaveBeenCalled());

    const request = saveQualityBenchmark.mock.calls[0][0];
    expect(request.saveScope).toBe("TARGET_LINE");
    expect(request.targetLineRows).toHaveLength(1);
    expect(request.targetLineRows[0]).toEqual(
      expect.objectContaining({
        schoolName: "实验中学",
        studentCount: 423,
        targetScore: 610,
        onlineCount: 126,
      }),
    );
    expect(request.targetLineRows.some((row) => row.targetScore === 670)).toBe(
      false,
    );
  });
});
