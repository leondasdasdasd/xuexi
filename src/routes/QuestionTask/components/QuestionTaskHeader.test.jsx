import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import QuestionTaskHeader from "./QuestionTaskHeader";

const noop = (event) => {
  void event;
};

const createView = (overrides = {}) => ({
  aiSupplementCount: 0,
  batchAiSettings: {},
  closeLabel: "关闭",
  defaultAiModel: "mock-model",
  defaultBatchAnalysisPrompt: "",
  handleClose: noop,
  handleSave: noop,
  handleSubmit: noop,
  handleToggleFullscreen: noop,
  hasRunningAiTask: false,
  isBatchAnalysisRunning: false,
  isBatchQualityRunning: false,
  isBatchToolRunning: false,
  isEditSessionActive: false,
  isPageFullscreen: false,
  isSaving: false,
  lastSavedAtText: "未保存",
  loading: false,
  openBatchAiModal: noop,
  openBatchQualityCheckModal: noop,
  paperName: "测试试卷",
  questionCardDisplayMode: "preview",
  runBatchAiAnalysis: noop,
  runBatchQualityCheck: noop,
  savingAction: "",
  setQuestionCardDisplayMode: noop,
  visibleQuestions: [{}],
  ...overrides,
});

describe("QuestionTaskHeader display mode", () => {
  beforeEach(() => {
    window.globalLange = "zh-CN";
  });

  it("switches the question card display mode from the header", () => {
    const setQuestionCardDisplayMode = jest.fn();

    render(
      <QuestionTaskHeader view={createView({ setQuestionCardDisplayMode })} />,
    );

    expect(screen.getByRole("button", { name: "预览" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    fireEvent.click(screen.getByRole("button", { name: "检阅" }));

    expect(setQuestionCardDisplayMode).toHaveBeenCalledWith("review");
  });
});
