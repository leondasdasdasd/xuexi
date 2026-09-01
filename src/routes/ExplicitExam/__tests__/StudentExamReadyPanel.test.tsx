import { fireEvent, render, screen } from "@testing-library/react";

import StudentExamReadyPanel from "../components/StudentExamReadyPanel";
import type { ExamPaperView } from "../types";

const paper: ExamPaperView = {
  dateMetadata: {
    displayText: "2026-06-24 10:01:53",
    kind: "student-task-publish-time",
  },
  deadlineTimestamp: null,
  gradeName: "Grade 8",
  modules: [],
  questionTypeTemplates: [],
  title: "Mathematics 22",
  totalScore: "2.0",
};

describe("StudentExamReadyPanel", () => {
  it("shows unlimited duration and switches answer mode", () => {
    const onModeChange = jest.fn();
    render(
      <StudentExamReadyPanel
        mode="continuous"
        onBack={jest.fn()}
        onModeChange={onModeChange}
        onStart={jest.fn()}
        paper={paper}
      />,
    );
    expect(screen.getAllByText("Unlimited").length).toBeGreaterThan(0);
    expect(screen.getByText(/Grade.*Grade 8/)).toBeInTheDocument();
    expect(screen.getByText("2026-06-24 10:01:53")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: /One question/ }));
    expect(onModeChange).toHaveBeenCalledWith("single-question");
  });

  it("keeps the ready page as the vertical scrolling container", () => {
    const { container } = render(
      <StudentExamReadyPanel
        mode="continuous"
        onBack={jest.fn()}
        onModeChange={jest.fn()}
        onStart={jest.fn()}
        paper={paper}
      />,
    );

    expect(container.querySelector("main")).toHaveClass("ready-page");
  });

  it("treats a zero deadline timestamp as a configured server deadline", () => {
    render(
      <StudentExamReadyPanel
        mode="continuous"
        onBack={jest.fn()}
        onModeChange={jest.fn()}
        onStart={jest.fn()}
        paper={{ ...paper, deadlineTimestamp: 0 }}
      />,
    );

    expect(
      screen.getAllByText("The answering deadline is based on server time"),
    ).toHaveLength(2);
    expect(screen.queryByText("Unlimited")).not.toBeInTheDocument();
  });
});
