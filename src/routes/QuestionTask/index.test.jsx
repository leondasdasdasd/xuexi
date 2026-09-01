import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { message, Modal } from "antd";

import { queryExamPaperOcrTaskResult } from "../../services/example";
import {
  queryQuestionAnalysisTasks,
  queryQuestionQualityCheckTasks,
  queryQuestionTaskPrompts,
  saveQuestionTaskPrompts,
  submitQuestionAnalysisTasks,
  submitQuestionQualityCheckTasks,
} from "../../services/questionTaskAiTask";
import { closeFullscreen, openFullscreen } from "../../utils/utils";
import QuestionTask, {
  getClampedRightPaneWidthByRatio,
  getDefaultRightPaneWidth,
} from "./index";
import { saveQuestionTask } from "./persistence/questionTaskSave";
import {
  getHiddenPreviewAffordance,
  getSplitAffordanceByWidth,
  QUESTION_TASK_SPLIT_AFFORDANCE,
  QUESTION_TASK_SPLIT_MODE,
} from "./questionTaskSplitLayout";

const QUESTION_UUID = "question-uuid";
const TASK_ID = 65;
const TASK_ID_TEXT = String(TASK_ID);
const TASK_HASH = `#/testPaperManagement/question_task?taskId=${TASK_ID}`;

jest.mock("../../services/example", () => ({
  queryExamPaperOcrTaskResult: jest.fn(),
}));

jest.mock("uuid", () => ({
  v4: jest.fn(() => "generated-uuid"),
}));

jest.mock("../../services/questionTaskAiTask", () => ({
  cancelQuestionAnalysisTasks: jest.fn(),
  cancelQuestionQualityCheckTasks: jest.fn(),
  queryQuestionAnalysisTasks: jest.fn(),
  queryQuestionQualityCheckTasks: jest.fn(),
  queryQuestionTaskPrompts: jest.fn(),
  saveQuestionTaskPrompts: jest.fn(),
  submitQuestionAnalysisTasks: jest.fn(),
  submitQuestionQualityCheckTasks: jest.fn(),
}));

jest.mock("../../utils/utils", () => {
  const actualModule = jest.requireActual("../../utils/utils");

  return {
    ...actualModule,
    closeFullscreen: jest.fn(),
    openFullscreen: jest.fn(),
  };
});

jest.mock("./persistence/questionTaskSave", () => {
  const actualModule = jest.requireActual("./persistence/questionTaskSave");

  return {
    ...actualModule,
    saveQuestionTask: jest.fn(() => ({
      savedAt: "2026-05-14T08:00:00.000Z",
    })),
  };
});

describe("QuestionTask header actions", () => {
  beforeEach(() => {
    window.globalLange = "zh-CN";
    window.location.hash = "";
    window.g_app = {
      _store: {
        getState: (event) => {
          void event;

          return {
            global: {
              currentUser: {
                userId: "tester",
              },
            },
          };
        },
      },
    };
    queryExamPaperOcrTaskResult.mockResolvedValue({
      content: {},
      status: true,
    });
    queryQuestionTaskPrompts.mockResolvedValue({
      content: {
        prompts: [],
      },
      status: true,
    });
    queryQuestionAnalysisTasks.mockResolvedValue({
      content: {
        items: [],
      },
      status: true,
    });
    queryQuestionQualityCheckTasks.mockResolvedValue({
      content: {
        items: [],
      },
      status: true,
    });
    submitQuestionAnalysisTasks.mockResolvedValue({
      content: {
        items: [],
      },
      status: true,
    });
  });

  afterEach(() => {
    delete window.g_app;
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it("shows the batch AI parsing and quality check actions", () => {
    render(<QuestionTask />);

    expect(
      screen.getByRole("button", {
        name: "AI解析",
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", {
        name: "AI质检",
      }),
    ).toBeVisible();
  });

  it("queries server prompts and AI task status during initialization", async () => {
    window.location.hash = TASK_HASH;
    queryExamPaperOcrTaskResult.mockResolvedValue({
      content: {
        gradeId: 7,
        pages: [
          {
            pageIndex: 0,
            questionList: [
              {
                answer: "A",
                content: "<p>题干</p>",
                questionScore: 5,
                questionSort: 1,
                type: 5,
                uuid: QUESTION_UUID,
              },
            ],
          },
        ],
        subjectId: 2,
        taskId: TASK_ID,
      },
      status: true,
    });

    render(<QuestionTask />);

    await waitFor(() =>
      expect(queryQuestionTaskPrompts).toHaveBeenCalledWith({
        taskId: TASK_ID_TEXT,
      }),
    );
    await waitFor(() =>
      expect(queryQuestionAnalysisTasks).toHaveBeenCalledWith({
        uuids: [QUESTION_UUID],
      }),
    );
    expect(queryQuestionQualityCheckTasks).toHaveBeenCalledWith({
      uuids: [QUESTION_UUID],
    });
  });

  it("shows the paper name from task result in the header", async () => {
    window.location.hash = TASK_HASH;
    queryExamPaperOcrTaskResult.mockResolvedValue({
      content: {
        gradeId: 7,
        paperName: "七年级数学期中测试卷",
        pages: [],
        subjectId: 2,
        taskId: TASK_ID,
      },
      status: true,
    });

    render(<QuestionTask />);

    expect(await screen.findByText("七年级数学期中测试卷")).toBeVisible();
  });

  it("toggles fullscreen from the header button and syncs the status label", async () => {
    window.location.hash = TASK_HASH;
    queryExamPaperOcrTaskResult.mockResolvedValue({
      content: {
        gradeId: 7,
        pages: [
          {
            pageIndex: 0,
            questionList: [
              {
                answer: "A",
                analysis: "<p>解析</p>",
                content: "<p>题干</p>",
                questionScore: 5,
                questionSort: 1,
                type: 1,
                uuid: QUESTION_UUID,
              },
            ],
          },
        ],
        subjectId: 2,
        taskId: TASK_ID,
      },
      status: true,
    });

    render(<QuestionTask />);
    const fullscreenButton = await screen.findByRole("button", {
      name: "进入全屏模式",
    });

    fireEvent.click(fullscreenButton);
    expect(openFullscreen).toHaveBeenCalledTimes(1);

    const fullscreenTarget = openFullscreen.mock.calls[0][0];
    expect(fullscreenTarget).toBeTruthy();
    expect(fullscreenTarget).toBe(screen.getByTestId("question-task-page"));

    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      value: fullscreenTarget,
    });
    fireEvent.click(fullscreenButton);
    expect(closeFullscreen).toHaveBeenCalledTimes(1);
    closeFullscreen.mockClear();

    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      value: fullscreenTarget,
    });
    fireEvent(document, new Event("fullscreenchange"));

    expect(screen.getByRole("button", { name: "退出全屏模式" })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "退出全屏模式" }));
    expect(closeFullscreen).toHaveBeenCalledTimes(1);

    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      value: undefined,
    });
    fireEvent(document, new Event("fullscreenchange"));

    expect(screen.getByRole("button", { name: "进入全屏模式" })).toBeVisible();
    expect(screen.queryByText("题目详情")).not.toBeInTheDocument();
    expect(
      screen.queryByText("当前共", { exact: false }),
    ).not.toBeInTheDocument();
  });

  it("submits quality check from the header action without saving prompts", async () => {
    jest.spyOn(message, "success").mockImplementation(() => {});
    window.location.hash = TASK_HASH;
    queryExamPaperOcrTaskResult.mockResolvedValue({
      content: {
        gradeId: 7,
        pages: [
          {
            pageIndex: 0,
            questionList: [
              {
                answer: "A",
                analysis: "<p>解析</p>",
                content: "<p>题干</p>",
                questionScore: 5,
                questionSort: 1,
                type: 1,
                uuid: QUESTION_UUID,
              },
            ],
          },
        ],
        subjectId: 2,
        taskId: TASK_ID,
      },
      status: true,
    });
    queryQuestionTaskPrompts.mockResolvedValue({
      content: {
        prompts: [
          {
            key: "quality_check",
            prompt: "服务端已保存的质检要求",
          },
        ],
      },
      status: true,
    });
    submitQuestionQualityCheckTasks.mockResolvedValue({
      content: {
        items: [
          {
            found: true,
            qualityResult: {
              conclusion: "未发现明显错误",
              riskItemsMarkdown: "",
              riskLevel: "PASS",
            },
            status: "SUCCEEDED",
            uuid: QUESTION_UUID,
          },
        ],
      },
      status: true,
    });

    render(<QuestionTask />);

    const qualityButton = await screen.findByRole("button", {
      name: "AI质检",
    });
    await waitFor(() => expect(qualityButton).not.toBeDisabled());

    fireEvent.click(qualityButton);

    await waitFor(() =>
      expect(submitQuestionQualityCheckTasks).toHaveBeenCalledWith({
        languageCode: "cn",
        questions: [expect.objectContaining({ uuid: QUESTION_UUID })],
        taskId: TASK_ID_TEXT,
      }),
    );
    expect(saveQuestionTaskPrompts).not.toHaveBeenCalled();
  });

  it("submits AI analysis from the header action without saving prompts", async () => {
    jest.spyOn(message, "success").mockImplementation(() => {});
    window.location.hash = TASK_HASH;
    queryExamPaperOcrTaskResult.mockResolvedValue({
      content: {
        gradeId: 7,
        pages: [
          {
            pageIndex: 0,
            questionList: [
              {
                answer: "A",
                content: "<p>题干</p>",
                questionScore: 5,
                questionSort: 1,
                type: 1,
                uuid: QUESTION_UUID,
              },
            ],
          },
        ],
        subjectId: 2,
        taskId: TASK_ID,
      },
      status: true,
    });

    render(<QuestionTask />);

    const analysisButton =
      await screen.findByTitle("按当前保存规则批量补充缺失答案和解析");
    await waitFor(() => expect(analysisButton).not.toBeDisabled());

    fireEvent.click(analysisButton);

    await waitFor(() =>
      expect(submitQuestionAnalysisTasks).toHaveBeenCalledWith({
        questions: [expect.objectContaining({ uuid: QUESTION_UUID })],
        taskId: TASK_ID_TEXT,
      }),
    );
    expect(saveQuestionTaskPrompts).not.toHaveBeenCalled();
  });

  it("submits paper when only analysis is missing", async () => {
    const confirmSpy = jest
      .spyOn(Modal, "confirm")
      .mockImplementation(() => {});
    jest.spyOn(message, "success").mockImplementation(() => {});
    jest.spyOn(message, "error").mockImplementation(() => {});
    jest.spyOn(window, "close").mockImplementation(() => {});
    window.location.hash = TASK_HASH;
    queryExamPaperOcrTaskResult.mockResolvedValue({
      content: {
        gradeId: 7,
        pages: [
          {
            pageIndex: 0,
            questionList: [
              {
                answer: "A",
                content: "<p>题干</p>",
                questionScore: 5,
                questionSort: 1,
                sectionTitle: "现代文阅读",
                type: 5,
              },
            ],
          },
        ],
        subjectId: 2,
        taskId: TASK_ID,
      },
      status: true,
    });

    render(<QuestionTask />);

    const submitButton = await screen.findByRole("button", {
      name: "提交",
    });
    await waitFor(() => expect(submitButton).not.toBeDisabled());
    saveQuestionTask.mockClear();
    fireEvent.click(submitButton);

    await waitFor(() =>
      expect(confirmSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          okText: "确认并关闭当前页",
          title: "确认提交",
          onOk: expect.any(Function),
        }),
      ),
    );
    expect(saveQuestionTask).not.toHaveBeenCalled();

    await act(async () => {
      await confirmSpy.mock.calls[0][0].onOk();
    });

    await waitFor(() =>
      expect(saveQuestionTask).toHaveBeenCalledWith(
        expect.objectContaining({ taskId: TASK_ID }),
        "submit",
      ),
    );
  });

  it("submits paper when only non-blocking fields are incomplete", async () => {
    const confirmSpy = jest
      .spyOn(Modal, "confirm")
      .mockImplementation(() => {});
    const warningSpy = jest
      .spyOn(Modal, "warning")
      .mockImplementation(({ content }) => {
        render(content);
      });
    jest.spyOn(message, "success").mockImplementation(() => {});
    jest.spyOn(message, "error").mockImplementation(() => {});
    jest.spyOn(window, "close").mockImplementation(() => {});
    window.location.hash = TASK_HASH;
    queryExamPaperOcrTaskResult.mockResolvedValue({
      content: {
        gradeId: 7,
        pages: [
          {
            pageIndex: 0,
            questionList: [
              {
                answer: "A",
                content: "",
                questionScore: 5,
                questionSort: 1,
                sectionTitle: "",
                type: 5,
              },
            ],
          },
        ],
        subjectId: 2,
        taskId: TASK_ID,
      },
      status: true,
    });

    render(<QuestionTask />);

    const submitButton = await screen.findByRole("button", {
      name: "提交",
    });
    await waitFor(() => expect(submitButton).not.toBeDisabled());
    saveQuestionTask.mockClear();
    fireEvent.click(submitButton);

    await waitFor(() =>
      expect(confirmSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          okText: "确认并关闭当前页",
          title: "确认提交",
          onOk: expect.any(Function),
        }),
      ),
    );
    expect(warningSpy).not.toHaveBeenCalled();
    expect(saveQuestionTask).not.toHaveBeenCalled();

    await act(async () => {
      await confirmSpy.mock.calls[0][0].onOk();
    });

    await waitFor(() =>
      expect(saveQuestionTask).toHaveBeenCalledWith(
        expect.objectContaining({ taskId: TASK_ID }),
        "submit",
      ),
    );
  });

  it("does not block submission when only subquestion section titles are empty", async () => {
    const confirmSpy = jest
      .spyOn(Modal, "confirm")
      .mockImplementation(() => {});
    const warningSpy = jest
      .spyOn(Modal, "warning")
      .mockImplementation(() => {});
    jest.spyOn(message, "success").mockImplementation(() => {});
    jest.spyOn(message, "error").mockImplementation(() => {});
    jest.spyOn(window, "close").mockImplementation(() => {});
    window.location.hash = TASK_HASH;
    queryExamPaperOcrTaskResult.mockResolvedValue({
      content: {
        gradeId: 7,
        pages: [
          {
            pageIndex: 0,
            questionList: [
              {
                content: "<p>组合题题干</p>",
                questionScore: 12,
                questionSort: 1,
                sectionTitle: "现代文阅读",
                sonQuestionList: [
                  {
                    analysis: "<p>解析</p>",
                    answer: "A",
                    content: "<p>子题题干</p>",
                    questionScore: 12,
                    sectionTitle: "",
                    type: 5,
                  },
                ],
                type: 6,
              },
            ],
          },
        ],
        subjectId: 2,
        taskId: TASK_ID,
      },
      status: true,
    });

    render(<QuestionTask />);

    const submitButton = await screen.findByRole("button", {
      name: "提交",
    });
    await waitFor(() => expect(submitButton).not.toBeDisabled());
    saveQuestionTask.mockClear();
    fireEvent.click(submitButton);

    await waitFor(() =>
      expect(confirmSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          okText: "确认并关闭当前页",
          title: "确认提交",
          onOk: expect.any(Function),
        }),
      ),
    );
    expect(warningSpy).not.toHaveBeenCalled();
    expect(saveQuestionTask).not.toHaveBeenCalled();

    await act(async () => {
      await confirmSpy.mock.calls[0][0].onOk();
    });

    await waitFor(() =>
      expect(saveQuestionTask).toHaveBeenCalledWith(
        expect.objectContaining({ taskId: TASK_ID }),
        "submit",
      ),
    );
  });

  it("blocks paper submission when a combination subquestion is missing an answer", async () => {
    const confirmSpy = jest
      .spyOn(Modal, "confirm")
      .mockImplementation(() => {});
    const warningSpy = jest
      .spyOn(Modal, "warning")
      .mockImplementation(() => {});
    jest.spyOn(message, "success").mockImplementation(() => {});
    jest.spyOn(message, "error").mockImplementation(() => {});
    window.location.hash = TASK_HASH;
    queryExamPaperOcrTaskResult.mockResolvedValue({
      content: {
        gradeId: 7,
        pages: [
          {
            pageIndex: 0,
            questionList: [
              {
                content: "<p>组合题题干</p>",
                questionScore: "",
                questionSort: 1,
                sectionTitle: "",
                sonQuestionList: [
                  {
                    analysis: "",
                    answer: "",
                    content: "",
                    questionScore: "",
                    sectionTitle: "",
                    type: 5,
                  },
                ],
                type: 6,
              },
            ],
          },
        ],
        subjectId: 2,
        taskId: TASK_ID,
      },
      status: true,
    });

    render(<QuestionTask />);

    const submitButton = await screen.findByRole("button", {
      name: "提交",
    });
    await waitFor(() => expect(submitButton).not.toBeDisabled());
    saveQuestionTask.mockClear();
    fireEvent.click(submitButton);

    await waitFor(() => expect(warningSpy).toHaveBeenCalled());
    const warningConfig = warningSpy.mock.calls[0][0];
    expect(warningConfig.content.props.summary.submitBlockingDetails).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fieldKey: "answer",
          isSubQuestion: true,
          message: "缺少答案",
          questionNumber: "1-1",
        }),
      ]),
    );
    expect(warningConfig.content.props.message).toBe(
      "当前仍缺少答案、分数，无法提交。可结合下方题目概览查看具体题目。",
    );
    expect(screen.queryByText("具体缺失项")).not.toBeInTheDocument();
    expect(screen.queryByText("第1-1小题：缺少答案")).not.toBeInTheDocument();
    expect(saveQuestionTask).not.toHaveBeenCalled();
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it("uses the default Modal confirm close behavior after deleting a question", async () => {
    const confirmSpy = jest
      .spyOn(Modal, "confirm")
      .mockImplementation(() => {});
    window.location.hash = TASK_HASH;
    queryExamPaperOcrTaskResult.mockResolvedValue({
      content: {
        gradeId: 7,
        pages: [
          {
            pageIndex: 0,
            questionList: [
              {
                answer: "A",
                analysis: "<p>解析</p>",
                content: "<p>题干</p>",
                questionScore: 5,
                questionSort: 1,
                type: 5,
              },
            ],
          },
        ],
        subjectId: 2,
        taskId: TASK_ID,
      },
      status: true,
    });

    render(<QuestionTask />);

    const deleteButton = await screen.findByRole("button", {
      name: "删除",
    });
    fireEvent.click(deleteButton);

    expect(confirmSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        onOk: expect.any(Function),
      }),
    );
    expect(confirmSpy.mock.calls[0][0].onOk).toHaveLength(0);
  });

  it("collapses and restores the preview pane from the split handle drag", async () => {
    const getBoundingClientRectSpy = jest
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockImplementation(function mockRect() {
        const className = this.className || "";

        if (String(className).includes("main")) {
          return {
            bottom: 720,
            height: 720,
            left: 0,
            right: 1200,
            top: 0,
            width: 1200,
          };
        }

        return {
          bottom: 0,
          height: 0,
          left: 0,
          right: 0,
          top: 0,
          width: 0,
        };
      });
    window.location.hash = TASK_HASH;
    queryExamPaperOcrTaskResult.mockResolvedValue({
      content: {
        gradeId: 7,
        pages: [
          {
            pageIndex: 0,
            questionList: [
              {
                answer: "A",
                analysis: "<p>解析</p>",
                content: "<p>题干</p>",
                questionScore: 5,
                questionSort: 1,
                type: 5,
                uuid: QUESTION_UUID,
              },
            ],
          },
        ],
        subjectId: 2,
        taskId: TASK_ID,
      },
      status: true,
    });

    render(<QuestionTask />);

    const resizeHandle = await screen.findByRole("button", {
      name: "拖动调整题图和详情宽度",
    });

    fireEvent.mouseDown(resizeHandle, { button: 0, clientX: 700 });
    fireEvent.mouseMove(window, { clientX: -80 });
    fireEvent.mouseUp(window, { clientX: -80 });

    const showImageHandle = await screen.findByRole("button", {
      name: "拖动显示题目图片",
    });
    expect(screen.getByText("显示原图")).toBeVisible();

    fireEvent.mouseDown(showImageHandle, { button: 0, clientX: 0 });
    fireEvent.mouseMove(window, { clientX: 120 });
    fireEvent.mouseUp(window, { clientX: 120 });

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "拖动调整题图和详情宽度" }),
      ).toBeVisible(),
    );

    getBoundingClientRectSpy.mockRestore();
  });

  it("shows split handle copy in English when the page locale is English", async () => {
    window.globalLange = "en";
    window.location.hash = TASK_HASH;
    queryExamPaperOcrTaskResult.mockResolvedValue({
      content: {
        gradeId: 7,
        pages: [
          {
            pageIndex: 0,
            questionList: [
              {
                answer: "A",
                analysis: "<p>Analysis</p>",
                content: "<p>Question</p>",
                questionScore: 5,
                questionSort: 1,
                type: 5,
                uuid: QUESTION_UUID,
              },
            ],
          },
        ],
        subjectId: 2,
        taskId: TASK_ID,
      },
      status: true,
    });

    render(<QuestionTask />);

    const resizeHandle = await screen.findByRole("button", {
      name: "Drag to resize image and details",
    });

    fireEvent.mouseEnter(resizeHandle);

    expect(screen.getByText("Drag")).toBeVisible();
  });

  it("uses ratio-based defaults and drag bounds for the question detail pane", () => {
    expect(getDefaultRightPaneWidth(1800)).toBe(900);
    expect(getClampedRightPaneWidthByRatio(1500, 1800)).toBeCloseTo(1200);
    expect(getClampedRightPaneWidthByRatio(200, 1800)).toBeCloseTo(600);
    expect(
      getSplitAffordanceByWidth({
        containerWidth: 1800,
        nextWidth: 1200,
        splitMode: QUESTION_TASK_SPLIT_MODE.SPLIT,
      }),
    ).toBe(QUESTION_TASK_SPLIT_AFFORDANCE.AT_LIMIT);
    expect(
      getSplitAffordanceByWidth({
        containerWidth: 1800,
        nextWidth: 1272,
        splitMode: QUESTION_TASK_SPLIT_MODE.SPLIT,
      }),
    ).toBe(QUESTION_TASK_SPLIT_AFFORDANCE.HIDE_READY);
    expect(getHiddenPreviewAffordance(96)).toBe(
      QUESTION_TASK_SPLIT_AFFORDANCE.RESTORE_READY,
    );
  });
});
