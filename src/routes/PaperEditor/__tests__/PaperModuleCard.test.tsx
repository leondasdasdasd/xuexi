import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

import type { PaperModuleDraft, PaperQuestionDraft } from "../types";
import PaperModuleCard from "../components/PaperModuleCard";

jest.mock("../components/QuestionList", () => () => (
  <div data-testid="question-list" />
));

const paperModule = {
  key: "module-1",
  title: "选择题",
  questions: [],
};
const createQuestion = (questionId: number): PaperQuestionDraft => ({
  key: `question-${questionId}`,
  questionId,
  score: 1,
  content: {} as PaperQuestionDraft["content"],
  children: [],
});
const scoredModule: PaperModuleDraft = {
  ...paperModule,
  questions: [createQuestion(1), createQuestion(2)],
};
const secondModule = { ...paperModule, key: "module-2", title: "填空题" };

describe("PaperModuleCard", () => {
  beforeEach(() => {
    Reflect.set(window, "globalLange", "zh-CN");
  });

  it("keeps the display number outside the editable module title", () => {
    const onTitleChange = jest.fn();
    const { rerender } = render(
      <>
        <PaperModuleCard
          editable
          locale="zh-CN"
          module={scoredModule}
          moduleIndex={0}
          onBatchScore={jest.fn()}
          onDeleteQuestion={jest.fn()}
          onEditQuestion={jest.fn()}
          onScoreChange={jest.fn()}
          onTitleChange={onTitleChange}
          templates={[]}
          questionNumberByKey={new Map()}
        />
        <PaperModuleCard
          editable
          locale="zh-CN"
          module={secondModule}
          moduleIndex={1}
          onBatchScore={jest.fn()}
          onDeleteQuestion={jest.fn()}
          onEditQuestion={jest.fn()}
          onScoreChange={jest.fn()}
          onTitleChange={onTitleChange}
          templates={[]}
          questionNumberByKey={new Map()}
        />
      </>,
    );

    expect(screen.getByText("一、")).toBeInTheDocument();
    expect(screen.getByLabelText("一、块标题")).toHaveValue("选择题");
    expect(screen.getByLabelText("二、块标题")).toHaveValue("填空题");
    expect(screen.getAllByTestId("module-stats")[0]).toHaveTextContent(
      "共2题共2分",
    );
    fireEvent.change(screen.getByLabelText("一、块标题"), {
      target: { value: "基础题" },
    });
    expect(onTitleChange).toHaveBeenCalledWith("module-1", "基础题");

    rerender(
      <>
        <PaperModuleCard
          editable
          locale="zh-CN"
          module={secondModule}
          moduleIndex={0}
          onBatchScore={jest.fn()}
          onDeleteQuestion={jest.fn()}
          onEditQuestion={jest.fn()}
          onScoreChange={jest.fn()}
          onTitleChange={onTitleChange}
          templates={[]}
          questionNumberByKey={new Map()}
        />
        <PaperModuleCard
          editable
          locale="zh-CN"
          module={paperModule}
          moduleIndex={1}
          onBatchScore={jest.fn()}
          onDeleteQuestion={jest.fn()}
          onEditQuestion={jest.fn()}
          onScoreChange={jest.fn()}
          onTitleChange={onTitleChange}
          templates={[]}
          questionNumberByKey={new Map()}
        />
      </>,
    );
    expect(screen.getByLabelText("一、块标题")).toHaveValue("填空题");
    expect(screen.getByLabelText("二、块标题")).toHaveValue("选择题");
    expect(screen.getAllByTestId("module-stats")[0]).toHaveTextContent(
      "共0题共0分",
    );
  });

  it("uses Roman display numbers for English", () => {
    Reflect.set(window, "globalLange", "en-US");
    render(
      <PaperModuleCard
        editable
        locale="en-US"
        module={paperModule}
        moduleIndex={3}
        onBatchScore={jest.fn()}
        onDeleteQuestion={jest.fn()}
        onEditQuestion={jest.fn()}
        onScoreChange={jest.fn()}
        onTitleChange={jest.fn()}
        templates={[]}
        questionNumberByKey={new Map()}
      />,
    );

    expect(screen.getByText("IV.")).toBeInTheDocument();
    expect(screen.getByLabelText("Section IV. title")).toHaveValue("选择题");
  });

  it("does not expose the batch score setting in read-only mode", () => {
    render(
      <PaperModuleCard
        editable={false}
        locale="zh-CN"
        module={paperModule}
        moduleIndex={0}
        templates={[]}
        questionNumberByKey={new Map()}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "批量设置分数" }),
    ).not.toBeInTheDocument();
  });
});
