import { fireEvent, render, screen } from "@testing-library/react";

import StudentQuestionNavigator from "../components/StudentQuestionNavigator";
import type { ExamPaperView } from "../types";

const paper = {
  modules: [
    {
      moduleName: "Choice",
      moduleQuestionNumber: 2,
      moduleScore: "10",
      order: 1,
      placements: [
        { order: 1, placementId: "P1" },
        { order: 2, placementId: "P2" },
      ],
    },
    {
      moduleName: "",
      moduleQuestionNumber: 1,
      moduleScore: "5",
      order: 2,
      placements: [{ order: 3, placementId: "P3" }],
    },
  ],
} as ExamPaperView;

describe("StudentQuestionNavigator", () => {
  it("scrolls to the question without changing the hash route", () => {
    const scrollIntoView = jest.fn();
    document.body.innerHTML = '<div id="exam-placement-P2"></div>';
    document.getElementById("exam-placement-P2")!.scrollIntoView =
      scrollIntoView;

    render(
      <StudentQuestionNavigator
        answerMode="continuous"
        currentIndex={0}
        onIndexChange={jest.fn()}
        paper={paper}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "2" }));

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
    expect(window.location.hash).toBe("");
    expect(screen.getByRole("button", { name: "1" })).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  it("groups navigation by module and labels an untitled module", () => {
    const onIndexChange = jest.fn();
    render(
      <StudentQuestionNavigator
        answerMode="single-question"
        currentIndex={2}
        onIndexChange={onIndexChange}
        paper={paper}
      />,
    );

    expect(screen.getByText("1. Choice")).toBeInTheDocument();
    expect(screen.getByText("2. Untitled section")).toBeInTheDocument();
    expect(screen.getByText("(10 points)")).toBeInTheDocument();
    expect(screen.getByText("2 questions")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "3" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "3" }));
    expect(onIndexChange).toHaveBeenCalledWith(2);
  });
});
