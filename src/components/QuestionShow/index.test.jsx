import React from "react";
import { render, screen } from "@testing-library/react";

import QuestionShow from "./index";

const createChoiceQuestion = (patch = {}) => ({
  content: "<p>He _______ two short arms.</p>",
  optionList: [
    { answers: "<p>has</p>", key: "A" },
    { answers: "<p>have</p>", key: "B" },
    { answers: "<p>can</p>", key: "C" },
    { answers: "<p>are</p>", key: "D" },
  ],
  questionId: 1,
  questionScore: 1,
  questionSerialNumber: 1,
  ...patch,
});

describe("QuestionShow", () => {
  it("renders backend option keys before rich text answers", () => {
    render(<QuestionShow question={createChoiceQuestion()} />);

    expect(screen.getByText("A.")).toBeInTheDocument();
    expect(screen.getByText("B.")).toBeInTheDocument();
    expect(screen.getByText("C.")).toBeInTheDocument();
    expect(screen.getByText("D.")).toBeInTheDocument();
    expect(screen.getByText("has")).toBeInTheDocument();
    expect(screen.getByText("have")).toBeInTheDocument();
    expect(screen.getByText("can")).toBeInTheDocument();
    expect(screen.getByText("are")).toBeInTheDocument();
  });

  it("falls back to index based option keys when backend key is missing", () => {
    render(
      <QuestionShow
        question={createChoiceQuestion({
          optionList: [{ answers: "<p>fallback answer</p>" }],
        })}
      />,
    );

    expect(screen.getByText("A.")).toBeInTheDocument();
    expect(screen.getByText("fallback answer")).toBeInTheDocument();
  });

  it("renders option keys for child questions", () => {
    render(
      <QuestionShow
        question={createChoiceQuestion({
          content: "<p>Read and choose.</p>",
          optionList: [],
          sonQuestionList: [
            createChoiceQuestion({
              content: "<p>Her ears ______ big.</p>",
              optionList: [
                { answers: "<p>is</p>", key: "A" },
                { answers: "<p>are</p>", key: "B" },
              ],
              questionId: 2,
              questionSerialNumber: 2,
            }),
          ],
        })}
      />,
    );

    expect(screen.getByText("A.")).toBeInTheDocument();
    expect(screen.getByText("B.")).toBeInTheDocument();
    expect(screen.getByText("is")).toBeInTheDocument();
    expect(screen.getByText("are")).toBeInTheDocument();
  });
});
