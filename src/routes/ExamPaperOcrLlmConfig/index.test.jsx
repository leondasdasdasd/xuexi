import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { message } from "antd";

import {
  queryExamPaperOcrLlmConfigs,
  saveExamPaperOcrLlmConfig,
} from "../../services/examPaperOcrLlmConfig";
import { getSubjectList } from "../../services/inputQuestion";
import ExamPaperOcrLlmConfig, { formToPayload } from "./index";

jest.mock("../../services/examPaperOcrLlmConfig", () => ({
  queryExamPaperOcrLlmConfigs: jest.fn(),
  saveExamPaperOcrLlmConfig: jest.fn(),
}));

jest.mock("../../services/inputQuestion", () => ({
  getSubjectList: jest.fn(),
}));

const SUBJECTS = [
  {
    id: 1,
    name: "数学",
  },
  {
    id: 2,
    name: "英语",
  },
];

const CONFIGS = [
  {
    businessType: "question_extraction",
    configId: 101,
    enableThinking: false,
    prompt: "题目提示词",
    schoolStage: "general",
    subjectId: 1,
    updatedAt: "2026-05-15T08:00:00.000Z",
  },
  {
    businessType: "answer_extraction",
    configId: 102,
    enableThinking: true,
    prompt: "English answer prompt",
    schoolStage: "senior_high",
    subjectId: 2,
    updatedAt: "2026-05-15T09:00:00.000Z",
  },
];

const SERVICE_DEFAULT_PROMPT = JSON.parse("null");

const successfulResponse = (content) => ({
  content,
  status: true,
});

const renderPage = async (event) => {
  void event;

  const view = render(<ExamPaperOcrLlmConfig />);

  await screen.findAllByText("数学");

  return view;
};

describe("ExamPaperOcrLlmConfig", () => {
  beforeEach(() => {
    window.globalLange = "zh-CN";
    jest.spyOn(message, "error").mockImplementation(() => {});
    jest.spyOn(message, "success").mockImplementation(() => {});
    getSubjectList.mockResolvedValue(successfulResponse(SUBJECTS));
    queryExamPaperOcrLlmConfigs.mockResolvedValue(successfulResponse(CONFIGS));
    saveExamPaperOcrLlmConfig.mockResolvedValue(successfulResponse(CONFIGS[0]));
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it("loads subject options and groups existing LLM configs by business", async () => {
    await renderPage();

    expect(getSubjectList).toHaveBeenCalledWith();
    expect(queryExamPaperOcrLlmConfigs).toHaveBeenCalledWith();
    expect(screen.getAllByText("通用")[0]).toBeVisible();
    expect(screen.getAllByText("题目提取")[0]).toBeVisible();
    expect(screen.getAllByText("答案提取")[0]).toBeVisible();
    expect(screen.getByDisplayValue("题目提示词")).toBeVisible();
  });

  it("fills the edit form when a business config item is selected", async () => {
    await renderPage();

    fireEvent.click(screen.getByText("英语"));

    expect(screen.getByDisplayValue("English answer prompt")).toBeVisible();
    expect(screen.getAllByText("答案提取")[0]).toBeVisible();
  });

  it("saves disabled thinking as false and blank prompt as null", async () => {
    await renderPage();

    fireEvent.change(
      screen.getByPlaceholderText(
        "输入当前业务的自定义提示词；留空则使用识别服务默认提示词。",
      ),
      {
        target: {
          value: "   ",
        },
      },
    );
    fireEvent.click(screen.getByRole("button", { name: "保存" }));

    await waitFor(() =>
      expect(saveExamPaperOcrLlmConfig).toHaveBeenCalledWith({
        businessType: "question_extraction",
        enableThinking: false,
        prompt: SERVICE_DEFAULT_PROMPT,
        schoolStage: "general",
        subjectId: 1,
      }),
    );
  });

  it("builds payload with a custom prompt and enabled thinking", () => {
    expect(
      formToPayload({
        businessType: "answer_extraction",
        enableThinking: true,
        prompt: "Extract answers carefully",
        schoolStage: "senior_high",
        subjectId: 2,
      }),
    ).toEqual({
      businessType: "answer_extraction",
      enableThinking: true,
      prompt: "Extract answers carefully",
      schoolStage: "senior_high",
      subjectId: 2,
    });
  });

  it("does not save when subject is missing", async () => {
    await renderPage();

    fireEvent.click(screen.getByRole("button", { name: "新增" }));
    fireEvent.click(screen.getByRole("button", { name: "保存" }));

    expect(saveExamPaperOcrLlmConfig).not.toHaveBeenCalled();
    expect(message.error).toHaveBeenCalledWith("请先选择学科");
  });
});
