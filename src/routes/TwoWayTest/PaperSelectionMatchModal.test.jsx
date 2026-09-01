import React from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { message } from "antd";

import { queryPaperList } from "../../services/example";
import {
  applyExamStructureMatch,
  queryExamStructureMatchDetail,
  queryExamStructurePaperSummary,
} from "../../services/examStructureMatch";
import { paperCanEdit } from "../../services/paper";
import PaperSelectionMatchModal, {
  getApplyErrorMessage,
  getApplyErrorMessages,
  buildSelectableStandardQuestionOptions,
  buildMatchesFromRows,
  resolveEditLockForApply,
} from "./PaperSelectionMatchModal";

jest.mock("../../services/example", () => ({
  queryPaperList: jest.fn(),
}));

jest.mock("../../services/examStructureMatch", () => ({
  applyExamStructureMatch: jest.fn(),
  queryExamStructureMatchDetail: jest.fn(),
  queryExamStructurePaperSummary: jest.fn(),
  saveExamStructureMatchDraft: jest.fn(),
  startExamStructureAiMatch: jest.fn(),
}));

jest.mock("../../services/paper", () => ({
  paperCanEdit: jest.fn(),
}));

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

const targetRecord = {
  examTypeName: "模拟考试",
  gradeName: "八年级",
  paperId: 11_252,
  subjectName: "数学",
  title: "八年级数学题目结构",
};

const targetSummary = {
  moduleCount: 1,
  paperId: 11_252,
  questionCount: 1,
  title: "八年级数学题目结构",
  totalScore: 1,
};

const standardSummary = {
  moduleCount: 1,
  paperId: 11_239,
  questionCount: 1,
  title: "八年级数学标准卷",
  totalScore: 1,
};

const matchDetailContent = {
  examPaperSummary: targetSummary,
  found: true,
  matchRecordId: 9,
  rows: [
    {
      examQuestion: {
        questionKey: "exam-1",
        questionNo: "1",
        questionType: "单选题",
        score: 1,
      },
      reason: "结构一致",
      reviewTags: ["需复核"],
      rowKey: "row-1",
      selectedStandardQuestionKey: "standard-1",
    },
  ],
  standardPaperSummary: standardSummary,
  standardQuestionOptions: [
    {
      questionId: 1001,
      questionKey: "standard-1",
      questionNo: "1",
      questionType: "单选题",
      score: 1,
    },
  ],
  statistics: {
    targetCount: 1,
  },
};

const mockLoadedMatchModal = () => {
  queryExamStructureMatchDetail.mockResolvedValue({
    content: matchDetailContent,
    status: true,
  });
  queryExamStructurePaperSummary.mockResolvedValue({
    content: {
      paperSummary: targetSummary,
    },
    status: true,
  });
  queryPaperList.mockResolvedValue({
    content: {
      examList: [
        {
          examTypeName: "模拟考试",
          gradeName: "八年级",
          paperId: 11_239,
          subjectName: "数学",
          title: "八年级数学标准卷",
        },
      ],
    },
    status: true,
  });
};

beforeEach(() => {
  window.globalLange = "zh-CN";
});

afterEach(() => {
  message.destroy();
  cleanup();
  jest.clearAllMocks();
  window.sessionStorage.clear();
});

describe("PaperSelectionMatchModal helpers", () => {
  it("builds backend matches from UI rows and selected standard options", () => {
    const matches = buildMatchesFromRows(
      [
        {
          blankId: null,
          confidence: 0.95,
          examQuestion: {
            parentQuestionId: null,
            parentQuestionKey: null,
            questionId: null,
            questionKey: "m0-q0",
          },
          mappingType: "EXACT",
          reason: "结构一致",
          selectedStandardQuestionKey: "m0-q1",
        },
      ],
      {
        "m0-q1": {
          parentQuestionId: null,
          parentQuestionKey: null,
          questionId: 1001,
          questionKey: "m0-q1",
        },
      },
    );

    expect(matches).toEqual([
      {
        blankId: null,
        clearExisting: false,
        confidence: 0.95,
        exam: {
          parentQuestionId: null,
          parentQuestionKey: null,
          questionId: null,
          questionKey: "m0-q0",
        },
        mappingType: "EXACT",
        mode: "single",
        reason: "结构一致",
        sourceFragmentIndex: null,
        sourceGroupKey: "m0-q1",
        standard: {
          parentQuestionId: null,
          parentQuestionKey: null,
          questionId: 1001,
          questionKey: "m0-q1",
        },
        targetFragmentIndex: 0,
        targetGroupKey: "m0-q0",
      },
    ]);
  });

  it("builds selectable blank segment options for fill blank questions", () => {
    const options = buildSelectableStandardQuestionOptions([
      {
        blankIds: ["blank_a", "blank_b"],
        label: "1",
        questionId: 300,
        questionKey: "m0-q0",
        questionType: "填空题",
        sourceGroupKey: "m0-q0",
      },
    ]);

    expect(options.map((option) => option.selectableQuestionKey)).toEqual([
      "m0-q0",
      "m0-q0#blank:blank_a",
      "m0-q0#blank:blank_b",
    ]);
    expect(options[1]).toEqual(
      expect.objectContaining({
        blankId: "blank_a",
        blankOrder: 0,
        mappingType: "BLANK_SPLIT",
        questionKey: "m0-q0",
        sourceFragmentIndex: 0,
      }),
    );
  });

  it("builds BLANK_SPLIT matches from selected blank segment options", () => {
    const matches = buildMatchesFromRows(
      [
        {
          blankId: "blank_b",
          blankOrder: 1,
          examQuestion: {
            parentQuestionId: null,
            parentQuestionKey: "m0-q1",
            questionId: null,
            questionKey: "m0-q1-s1",
          },
          selectedStandardQuestionKey: "m0-q0",
        },
      ],
      {
        "m0-q0#blank:blank_b": {
          blankId: "blank_b",
          blankOrder: 1,
          mappingType: "BLANK_SPLIT",
          parentQuestionId: null,
          parentQuestionKey: null,
          questionId: 300,
          questionKey: "m0-q0",
          sourceFragmentIndex: 1,
          sourceGroupKey: "m0-q0",
        },
      },
    );

    expect(matches[0]).toEqual(
      expect.objectContaining({
        blankId: "blank_b",
        mappingType: "BLANK_SPLIT",
        mode: "blank-compatible",
        sourceFragmentIndex: 1,
        sourceGroupKey: "m0-q0",
        standard: expect.objectContaining({
          questionId: 300,
          questionKey: "m0-q0",
        }),
      }),
    );
  });

  it("builds SUBQUESTION matches from selected combination child options", () => {
    const matches = buildMatchesFromRows(
      [
        {
          examQuestion: {
            questionId: null,
            questionKey: "m0-q1",
          },
          selectedStandardQuestionKey: "m0-q0-s1",
        },
      ],
      {
        "m0-q0-s1": {
          parentQuestionId: 200,
          parentQuestionKey: "m0-q0",
          questionId: 202,
          questionKey: "m0-q0-s1",
          sourceFragmentIndex: 1,
          sourceGroupKey: "m0-q0",
        },
      },
    );

    expect(matches[0]).toEqual(
      expect.objectContaining({
        blankId: null,
        mappingType: "SUBQUESTION",
        mode: "parent-child",
        sourceFragmentIndex: 1,
        standard: expect.objectContaining({
          parentQuestionId: 200,
          parentQuestionKey: "m0-q0",
          questionId: 202,
          questionKey: "m0-q0-s1",
        }),
      }),
    );
  });

  it("builds PARENT_BIND matches from selected combination parent options", () => {
    const matches = buildMatchesFromRows(
      [
        {
          examQuestion: {
            questionId: null,
            questionKey: "m0-q1",
          },
          selectedStandardQuestionKey: "m0-q0",
        },
      ],
      {
        "m0-q0": {
          parentQuestionId: null,
          parentQuestionKey: null,
          questionId: 200,
          questionKey: "m0-q0",
          questionType: "组合题",
          sourceFragmentIndex: 0,
          sourceGroupKey: "m0-q0",
        },
      },
    );

    expect(matches[0]).toEqual(
      expect.objectContaining({
        mappingType: "PARENT_BIND",
        mode: "parent-child",
        standard: expect.objectContaining({
          questionId: 200,
          questionKey: "m0-q0",
        }),
      }),
    );
  });

  it("keeps unmatched rows so backend can clear existing links", () => {
    expect(
      buildMatchesFromRows([
        {
          reason: "清空",
          examQuestion: {
            questionId: 888,
            questionKey: "m0-q0",
          },
          selectedStandardQuestionKey: undefined,
        },
      ]),
    ).toEqual([
      {
        blankId: null,
        clearExisting: true,
        confidence: undefined,
        exam: {
          parentQuestionId: null,
          parentQuestionKey: null,
          questionId: 888,
          questionKey: "m0-q0",
        },
        mappingType: "UNMATCHED",
        mode: "unmatched",
        reason: "清空",
        sourceFragmentIndex: null,
        sourceGroupKey: null,
        standard: null,
        targetFragmentIndex: 0,
        targetGroupKey: "m0-q0",
      },
    ]);
  });

  it("uses backend apply errors before generic failed message", () => {
    const response = {
      content: {
        errors: ["考试侧试卷未获得编辑锁", "考试侧试卷编辑锁不属于当前页面"],
      },
      message: "请求参数格式错误",
      status: false,
    };

    expect(getApplyErrorMessage(response)).toBe(
      "考试侧试卷未获得编辑锁；考试侧试卷编辑锁不属于当前页面",
    );
    expect(getApplyErrorMessages(response)).toEqual([
      "考试侧试卷未获得编辑锁",
      "考试侧试卷编辑锁不属于当前页面",
    ]);
  });

  for (const type of [2, 3, 4]) {
    it(`does not acquire lock or apply directly for conflict type ${type} before confirm`, async () => {
      let confirmConfig;
      const paperCanEditRequest = jest.fn().mockResolvedValue({
        content: {
          currentUserName: "张三",
          type,
        },
        status: true,
      });

      const resultPromise = resolveEditLockForApply({
        confirm: (config) => {
          confirmConfig = config;
        },
        paperCanEditRequest,
        paperId: 11_239,
        showError: jest.fn(),
        tabId: "tab-1",
      });
      await flushPromises();

      expect(confirmConfig).toBeTruthy();
      expect(paperCanEditRequest).toHaveBeenCalledTimes(1);
      expect(paperCanEditRequest).toHaveBeenCalledWith({
        paperId: 11_239,
        query: true,
        tabId: "tab-1",
      });

      confirmConfig.onCancel();
      await expect(resultPromise).resolves.toBe(false);
      expect(paperCanEditRequest).toHaveBeenCalledTimes(1);
    });
  }

  for (const type of [2, 3, 4]) {
    it(`acquires edit lock after confirming conflict type ${type}`, async () => {
      let confirmConfig;
      const paperCanEditRequest = jest
        .fn()
        .mockResolvedValueOnce({
          content: {
            currentUserName: "张三",
            type,
          },
          status: true,
        })
        .mockResolvedValueOnce({
          content: {
            type: 6,
          },
          status: true,
        });

      const resultPromise = resolveEditLockForApply({
        confirm: (config) => {
          confirmConfig = config;
        },
        paperCanEditRequest,
        paperId: 11_239,
        showError: jest.fn(),
        tabId: "tab-1",
      });
      await flushPromises();
      confirmConfig.onOk();

      await expect(resultPromise).resolves.toBe(true);
      expect(paperCanEditRequest).toHaveBeenCalledTimes(2);
      expect(paperCanEditRequest).toHaveBeenLastCalledWith({
        paperId: 11_239,
        query: false,
        tabId: "tab-1",
      });
    });
  }

  for (const type of [5, 6]) {
    it(`allows apply directly for owned lock type ${type}`, async () => {
      const paperCanEditRequest = jest.fn().mockResolvedValue({
        content: {
          type,
        },
        status: true,
      });

      await expect(
        resolveEditLockForApply({
          confirm: jest.fn(),
          paperCanEditRequest,
          paperId: 11_239,
          showError: jest.fn(),
          tabId: "tab-1",
        }),
      ).resolves.toBe(true);

      expect(paperCanEditRequest).toHaveBeenCalledTimes(1);
      expect(paperCanEditRequest).toHaveBeenCalledWith({
        paperId: 11_239,
        query: true,
        tabId: "tab-1",
      });
    });
  }

  it("acquires lock without confirm when no one is editing", async () => {
    const paperCanEditRequest = jest
      .fn()
      .mockResolvedValueOnce({
        content: {
          type: 1,
        },
        status: true,
      })
      .mockResolvedValueOnce({
        content: {
          type: 6,
        },
        status: true,
      });

    await expect(
      resolveEditLockForApply({
        confirm: jest.fn(),
        paperCanEditRequest,
        paperId: 11_239,
        showError: jest.fn(),
        tabId: "tab-1",
      }),
    ).resolves.toBe(true);

    expect(paperCanEditRequest).toHaveBeenLastCalledWith({
      paperId: 11_239,
      query: false,
      tabId: "tab-1",
    });
  });
});

describe("PaperSelectionMatchModal", () => {
  it("shows edit lock confirm and acquires lock before applying conflict result", async () => {
    mockLoadedMatchModal();
    paperCanEdit
      .mockResolvedValueOnce({
        content: {
          currentUserName: "张三",
          type: 3,
        },
        status: true,
      })
      .mockResolvedValueOnce({
        content: {
          type: 6,
        },
        status: true,
      });
    applyExamStructureMatch.mockResolvedValue({
      content: {
        paperId: 11_252,
      },
      status: true,
    });
    const onCancel = jest.fn();
    const onApplied = jest.fn();

    render(
      <PaperSelectionMatchModal
        visible={true}
        targetPaperId={11_252}
        targetRecord={targetRecord}
        onCancel={onCancel}
        onApplied={onApplied}
      />,
    );

    await waitFor(() =>
      expect(screen.getAllByText("1 / 单选题 / 1分").length).toBeGreaterThan(0),
    );
    fireEvent.click(screen.getByText("确认结果"));

    const confirmTitle = await screen.findByText("确认获取编辑权限");
    expect(applyExamStructureMatch).not.toHaveBeenCalled();

    expect(confirmTitle).toBeTruthy();
    fireEvent.click(screen.getByText(/确\s*定|OK/));

    await waitFor(() =>
      expect(applyExamStructureMatch).toHaveBeenCalledTimes(1),
    );
    expect(paperCanEdit).toHaveBeenCalledTimes(2);

    const queryCall = paperCanEdit.mock.calls[0][0];
    const acquireCall = paperCanEdit.mock.calls[1][0];
    expect(queryCall).toMatchObject({
      paperId: 11_252,
      query: true,
    });
    expect(acquireCall).toEqual({
      paperId: 11_252,
      query: false,
      tabId: queryCall.tabId,
    });
    expect(onApplied).toHaveBeenCalledWith({ paperId: 11_252 });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("keeps backend apply errors visible in the modal", async () => {
    mockLoadedMatchModal();
    paperCanEdit.mockResolvedValue({
      content: {
        type: 5,
      },
      status: true,
    });
    applyExamStructureMatch.mockResolvedValue({
      content: {
        errors: ["考试侧试卷未获得编辑锁"],
      },
      message: "请求参数格式错误",
      status: false,
    });
    const onCancel = jest.fn();

    render(
      <PaperSelectionMatchModal
        visible={true}
        targetPaperId={11_252}
        targetRecord={targetRecord}
        onCancel={onCancel}
      />,
    );

    await waitFor(() =>
      expect(screen.getAllByText("1 / 单选题 / 1分").length).toBeGreaterThan(0),
    );
    fireEvent.click(screen.getByText("确认结果"));

    expect(await screen.findByText("确认匹配结果失败")).toBeTruthy();
    expect(screen.getByText("考试侧试卷未获得编辑锁")).toBeTruthy();
    expect(onCancel).not.toHaveBeenCalled();
  });
});
