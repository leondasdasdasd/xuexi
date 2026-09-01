import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

import QuestionScoreFields from "../components/QuestionScoreFields";

jest.mock("../../../utils/i18n", () => ({
  trans: (_key: string, fallback: string, values?: Record<string, string>) =>
    Object.entries(values || {}).reduce(
      (text, [key, value]) => text.replace(`{$${key}}`, value),
      fallback,
    ),
}));
jest.mock("antd", () => ({
  InputNumber: (properties: {
    "aria-label": string;
    disabled: boolean;
    onChange: (value: number | null) => void;
    step: number;
    value?: number;
  }) => (
    <input
      aria-label={properties["aria-label"]}
      disabled={properties.disabled}
      step={properties.step}
      type="number"
      value={properties.value || ""}
      onChange={(event) =>
        properties.onChange(
          event.target.value === "" ? null : Number(event.target.value),
        )
      }
    />
  ),
}));

const leafQuestion = {
  key: "question-1",
  questionId: 1,
  score: 2,
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

describe("QuestionScoreFields", () => {
  it("edits the leaf score through the leaf question key", () => {
    const onScoreChange = jest.fn();
    render(
      <QuestionScoreFields
        onScoreChange={onScoreChange}
        question={leafQuestion}
      />,
    );

    fireEvent.change(screen.getByLabelText("题目分值"), {
      target: { value: "1.5" },
    });

    expect(onScoreChange).toHaveBeenCalledWith("question-1", 1.5);
    expect(screen.getByLabelText("题目分值")).toHaveAttribute("step", "0.1");
  });

  it("accepts integers and clears values with more than one decimal place", () => {
    const onScoreChange = jest.fn();
    render(
      <QuestionScoreFields
        onScoreChange={onScoreChange}
        question={leafQuestion}
      />,
    );
    const input = screen.getByLabelText("题目分值");

    fireEvent.change(input, { target: { value: "3" } });
    fireEvent.change(input, { target: { value: "1.25" } });

    expect(onScoreChange).toHaveBeenCalledTimes(2);
    expect(onScoreChange).toHaveBeenCalledWith("question-1", 3);
    expect(onScoreChange).toHaveBeenLastCalledWith("question-1");
  });

  it("clears the leaf score when InputNumber returns null", () => {
    const onScoreChange = jest.fn();
    render(
      <QuestionScoreFields
        onScoreChange={onScoreChange}
        question={leafQuestion}
      />,
    );

    fireEvent.change(screen.getByLabelText("题目分值"), {
      target: { value: "" },
    });

    expect(onScoreChange).toHaveBeenCalledWith("question-1");
  });

  it("shows a composite total and identifies scores by leaf path", () => {
    render(
      <QuestionScoreFields
        onScoreChange={jest.fn()}
        question={{
          ...leafQuestion,
          key: "question-parent",
          questionId: 10,
          score: undefined,
          children: [
            leafQuestion,
            {
              ...leafQuestion,
              key: "question-2",
              children: [{ ...leafQuestion, key: "question-2-1", score: 3 }],
              score: undefined,
            },
          ],
        }}
      />,
    );

    expect(screen.getByText(/5/)).toBeInTheDocument();
    expect(screen.getByLabelText("第 1 小题分值")).toBeInTheDocument();
    expect(screen.getByLabelText("第 2.1 小题分值")).toBeInTheDocument();
    expect(screen.getAllByText(/复合题总分/)).toHaveLength(1);
  });

  it("keeps every valid leaf score editable regardless of question type", () => {
    render(
      <QuestionScoreFields
        onScoreChange={jest.fn()}
        question={{
          ...leafQuestion,
          content: { ...leafQuestion.content, questionTypeKey: 7 },
          score: undefined,
        }}
      />,
    );

    expect(screen.getByLabelText("题目分值")).toBeEnabled();
  });
});
