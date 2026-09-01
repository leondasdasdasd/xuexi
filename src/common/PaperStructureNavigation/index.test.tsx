import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

import PaperStructureNavigation from ".";

describe("PaperStructureNavigation", () => {
  it("renders the paper-detail hierarchy and selects only question numbers", () => {
    const onQuestionSelect = jest.fn();
    render(
      <PaperStructureNavigation
        activeQuestionKey="Q2"
        modules={[
          {
            key: "M1",
            name: "Choice questions",
            order: 1,
            questionCount: 2,
            questions: [
              { key: "Q1", number: 1 },
              { key: "Q2", number: 2 },
            ],
            score: "10",
          },
        ]}
        onQuestionSelect={onQuestionSelect}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Paper structure" }),
    ).toBeInTheDocument();
    expect(screen.getByText("1. Choice questions")).toBeInTheDocument();
    expect(screen.getByText("(10 points)")).toBeInTheDocument();
    expect(screen.getByText("2 questions")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "2" })).toHaveAttribute(
      "aria-current",
      "true",
    );

    fireEvent.click(screen.getByRole("button", { name: "1" }));
    expect(onQuestionSelect).toHaveBeenCalledWith({ key: "Q1", number: 1 });
  });

  it("uses the localized fallback for an untitled module", () => {
    render(
      <PaperStructureNavigation
        modules={[
          {
            key: "M1",
            name: "",
            order: 1,
            questionCount: 0,
            questions: [],
            score: "0",
          },
        ]}
        onQuestionSelect={jest.fn()}
      />,
    );

    expect(screen.getByText("1. Untitled section")).toBeInTheDocument();
  });
});
