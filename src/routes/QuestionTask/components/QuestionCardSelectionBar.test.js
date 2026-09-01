import { fireEvent, render, screen } from "@testing-library/react";
import { renderInsertSlot } from "./QuestionCardSelectionBar";

const noop = (event) => {
  void event;
};

const renderQuestionInsertSlot = (properties = {}) =>
  render(
    renderInsertSlot({
      onInsertAtEnd: noop,
      onInsertAtStart: noop,
      onQuestionDuplicateAfter: noop,
      onQuestionInsertAfter: noop,
      onQuestionSectionInsertAfter: noop,
      onQuestionSectionInsertAtStart: noop,
      position: "between",
      questionId: "question-1",
      readOnly: false,
      sectionQuestionId: "question-2",
      ...properties,
    }),
  );

describe("QuestionCardSelectionBar", () => {
  beforeEach(() => {
    window.globalLange = "zh-CN";
  });

  it("shows a section insert action between questions", () => {
    const handleQuestionSectionInsertAfter = jest.fn();

    renderQuestionInsertSlot({
      onQuestionSectionInsertAfter: handleQuestionSectionInsertAfter,
    });

    fireEvent.click(screen.getByRole("button", { name: "分段" }));

    expect(handleQuestionSectionInsertAfter).toHaveBeenCalledWith("question-1");
  });

  it("shows section insertion before the first question without copy action", () => {
    const handleQuestionSectionInsertAtStart = jest.fn();

    renderQuestionInsertSlot({
      onQuestionSectionInsertAtStart: handleQuestionSectionInsertAtStart,
      position: "start",
      questionId: "",
      sectionQuestionId: "",
    });

    expect(screen.getByRole("button", { name: "新增" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "分段" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "复制" }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "分段" }));

    expect(handleQuestionSectionInsertAtStart).toHaveBeenCalledTimes(1);
  });

  it("keeps the end slot as question insertion only", () => {
    renderQuestionInsertSlot({
      position: "end",
      questionId: "",
      sectionQuestionId: "",
    });

    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "新增" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "分段" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "复制" }),
    ).not.toBeInTheDocument();
  });
});
