import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { message, Modal } from "antd";

import { queryExamPaperOcrTaskResult } from "../../services/example";
import QuestionTask from "./index";
import { saveQuestionTask } from "./persistence/questionTaskSave";

const TASK_ID = 65;
const TASK_HASH = `#/testPaperManagement/question_task?taskId=${TASK_ID}`;

jest.mock("../../services/example", () => ({
  queryExamPaperOcrTaskResult: jest.fn(),
}));

jest.mock("./persistence/questionTaskSave", () => {
  const actualModule = jest.requireActual("./persistence/questionTaskSave");

  return {
    ...actualModule,
    saveQuestionTask: jest.fn(() => ({
      savedAt: "2026-05-14T08:00:00.000Z",
    })),
  };
});

describe("QuestionTask submit validation", () => {
  beforeEach(() => {
    window.globalLange = "zh-CN";
    window.location.hash = TASK_HASH;
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
    jest.spyOn(message, "success").mockImplementation(() => {});
    jest.spyOn(message, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    delete window.g_app;
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it("blocks paper submission when a question score is missing", async () => {
    const confirmSpy = jest
      .spyOn(Modal, "confirm")
      .mockImplementation(() => {});
    const warningSpy = jest
      .spyOn(Modal, "warning")
      .mockImplementation(() => {});

    queryExamPaperOcrTaskResult.mockResolvedValue({
      content: {
        gradeId: 7,
        pages: [
          {
            pageIndex: 0,
            questionList: [
              {
                analysis: "<p>解析</p>",
                answer: "A",
                content: "<p>题干</p>",
                questionScore: "",
                questionSort: 1,
                sectionTitle: "选择题",
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

    await waitFor(() => expect(warningSpy).toHaveBeenCalled());
    const warningConfig = warningSpy.mock.calls[0][0];
    expect(warningConfig.content.props.summary.submitBlockingDetails).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fieldKey: "score",
          isSubQuestion: false,
          message: "未设置分数",
          questionNumber: "1",
        }),
      ]),
    );
    expect(warningConfig.content.props.message).toBe(
      "当前仍缺少分数，无法提交。可结合下方题目概览查看具体题目。",
    );
    expect(saveQuestionTask).not.toHaveBeenCalled();
    expect(confirmSpy).not.toHaveBeenCalled();
  });
});
