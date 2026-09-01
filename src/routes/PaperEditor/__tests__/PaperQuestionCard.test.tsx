import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

import {
  createQuestionPreviewDraft,
  QuestionPreview,
} from "@yungu-fed/question-editor";
import PaperQuestionCard from "../components/PaperQuestionCard";
import QuestionScoreFields from "../components/QuestionScoreFields";

jest.mock("@yungu-fed/question-editor", () => ({
  createQuestionPreviewDraft: jest.fn(() => ({ id: 1 })),
  QuestionPreview: jest.fn(() => <div data-testid="question-preview" />),
}));
jest.mock("../components/QuestionScoreFields", () =>
  jest.fn(() => <div data-testid="question-score" />),
);

describe("PaperQuestionCard", () => {
  const question = {
    key: "question-1",
    questionId: 1,
    content: {
      id: 1,
      questionTypeKey: 101,
      version: "1",
      elements: [],
      extras: [],
      children: [],
    },
    children: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    Reflect.set(window, "globalLange", "zh-CN");
    (createQuestionPreviewDraft as jest.Mock).mockReturnValue({ id: 1 });
  });

  it("places the number beside the preview and actions below it", () => {
    const onDeleteQuestion = jest.fn();
    const onEditQuestion = jest.fn();
    render(
      <PaperQuestionCard
        editable
        locale="zh-CN"
        number={1}
        onDeleteQuestion={onDeleteQuestion}
        onEditQuestion={onEditQuestion}
        onScoreChange={jest.fn()}
        question={question}
        templates={[]}
      />,
    );

    const body = screen.getByTestId("question-body");
    const actions = screen.getByTestId("question-actions");
    expect(body).toContainElement(screen.getByText("1."));
    expect(body).toContainElement(screen.getByTestId("question-preview"));
    expect(body.nextElementSibling).toBe(actions);
    expect(actions).toContainElement(screen.getByTestId("question-score"));

    fireEvent.click(screen.getByRole("button", { name: "删除" }));
    fireEvent.click(screen.getByText(/^确\s*定$/u));
    expect(onDeleteQuestion).toHaveBeenCalledWith("question-1");
    fireEvent.click(screen.getByRole("button", { name: "编辑" }));
    expect(onEditQuestion).toHaveBeenCalledWith(1);

    const previewProperties = (QuestionPreview as jest.Mock).mock.calls[0][0];
    expect(previewProperties).toHaveProperty("rootQuestionNumber", 1);
    expect(previewProperties).toHaveProperty("showAnswer", false);
    expect(previewProperties).toHaveProperty("showExtraAttributes", false);

    fireEvent.click(screen.getByRole("button", { name: "查看答案" }));
    const visiblePreviewProperties = (QuestionPreview as jest.Mock).mock
      .calls[1][0];
    expect(visiblePreviewProperties).toHaveProperty("showAnswer", true);
    expect(visiblePreviewProperties).toHaveProperty(
      "showExtraAttributes",
      true,
    );
    expect(screen.getByRole("button", { name: "隐藏答案" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    fireEvent.click(screen.getByRole("button", { name: "隐藏答案" }));
    const hiddenPreviewProperties = (QuestionPreview as jest.Mock).mock
      .calls[2][0];
    expect(hiddenPreviewProperties).toHaveProperty("showAnswer", false);
    expect(hiddenPreviewProperties).toHaveProperty(
      "showExtraAttributes",
      false,
    );
  });

  it("keeps the number beside the unavailable preview state", () => {
    (createQuestionPreviewDraft as jest.Mock).mockReturnValueOnce(undefined);
    render(
      <PaperQuestionCard
        editable
        locale="zh-CN"
        number={2}
        onDeleteQuestion={jest.fn()}
        onEditQuestion={jest.fn()}
        onScoreChange={jest.fn()}
        question={question}
        templates={[]}
      />,
    );

    const body = screen.getByTestId("question-body");
    expect(body).toContainElement(screen.getByText("2."));
    expect(body).toContainElement(screen.getByText("题目内容暂不可预览"));
    expect(
      screen.queryByRole("button", { name: "查看答案" }),
    ).not.toBeInTheDocument();
  });

  it("renders an empty placement without entering the question preview", () => {
    render(
      <PaperQuestionCard
        editable={false}
        locale="zh-CN"
        number={2}
        question={{
          ...question,
          content: null,
          key: "empty-placement-0-1",
          questionId: null,
        }}
        templates={[]}
      />,
    );

    expect(screen.getByText("2.")).toBeInTheDocument();
    expect(screen.getByText("未关联题位")).toBeInTheDocument();
    expect(createQuestionPreviewDraft).not.toHaveBeenCalled();
    expect(QuestionPreview).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("button", { name: "查看答案" }),
    ).not.toBeInTheDocument();
  });

  it("keeps unresolved questions deletable and disables editing", () => {
    const onDeleteQuestion = jest.fn();
    const onEditQuestion = jest.fn();
    render(
      <PaperQuestionCard
        editable
        locale="zh-CN"
        number={2}
        onDeleteQuestion={onDeleteQuestion}
        onEditQuestion={onEditQuestion}
        onScoreChange={jest.fn()}
        question={{
          ...question,
          content: null,
          key: "unresolved-question-1",
          questionId: 1,
          questionSnapshotStatus: "UNRESOLVED",
        }}
        templates={[]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "删除" }));
    fireEvent.click(screen.getByText(/^确\s*定$/u));
    expect(onDeleteQuestion).toHaveBeenCalledWith("unresolved-question-1");
    expect(screen.getByRole("button", { name: "编辑" })).toBeDisabled();
    expect(onEditQuestion).not.toHaveBeenCalled();
  });

  it("keeps the composite score entry in the bottom actions", () => {
    const compositeQuestion = {
      ...question,
      children: [
        {
          ...question,
          key: "question-1-1",
          questionId: 11,
        },
      ],
    };
    render(
      <PaperQuestionCard
        editable
        locale="zh-CN"
        number={1}
        onDeleteQuestion={jest.fn()}
        onEditQuestion={jest.fn()}
        onScoreChange={jest.fn()}
        question={compositeQuestion}
        templates={[]}
      />,
    );

    const scoreProperties = (QuestionScoreFields as jest.Mock).mock.calls[0][0];
    expect(screen.getByTestId("question-actions")).toContainElement(
      screen.getByTestId("question-score"),
    );
    expect(screen.getByTestId("question-score").parentElement).toHaveClass(
      "composite-question-score",
    );
    expect(scoreProperties.question).toBe(compositeQuestion);
    expect(scoreProperties).not.toHaveProperty("disabled");
  });

  it("renders scores as text without edit actions in read-only mode", () => {
    render(
      <PaperQuestionCard
        editable={false}
        locale="zh-CN"
        number={1}
        question={{ ...question, score: 5 }}
        templates={[]}
      />,
    );

    expect(screen.getByText("题目分值: 5")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "删除" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("question-actions")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "查看答案" }),
    ).toBeInTheDocument();
  });

  it("keeps answer visibility independent between questions", () => {
    render(
      <>
        <PaperQuestionCard
          editable={false}
          locale="zh-CN"
          number={1}
          question={question}
          templates={[]}
        />
        <PaperQuestionCard
          editable={false}
          locale="zh-CN"
          number={2}
          question={{ ...question, key: "question-2", questionId: 2 }}
          templates={[]}
        />
      </>,
    );

    fireEvent.click(screen.getAllByRole("button", { name: "查看答案" })[0]);

    expect(screen.getAllByRole("button", { name: "隐藏答案" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "查看答案" })).toHaveLength(1);
  });

  it("renders every composite leaf score in read-only mode", () => {
    render(
      <PaperQuestionCard
        editable={false}
        locale="en-US"
        number={1}
        question={{
          ...question,
          children: [
            { ...question, key: "question-11", questionId: 11, score: 4 },
            { ...question, key: "question-12", questionId: 12, score: 6 },
          ],
        }}
        templates={[]}
      />,
    );

    expect(screen.getByText("小题 1:4")).toHaveClass("readonly-score-item");
    expect(screen.getByText("小题 2:6")).toHaveClass("readonly-score-item");
    expect(screen.getByText("复合题总分: 10")).toBeInTheDocument();
  });
});
