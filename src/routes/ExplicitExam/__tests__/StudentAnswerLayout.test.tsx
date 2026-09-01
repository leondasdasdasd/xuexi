import { fireEvent, render, screen } from "@testing-library/react";

import StudentAnswerPaper from "../components/StudentAnswerPaper";
import StudentAnswerToolbar from "../components/StudentAnswerToolbar";
import StudentExamExperience from "../components/StudentExamExperience";
import type { ExamPaperView } from "../types";

jest.mock("@yungu-fed/question-editor", () => ({
  QuestionPlayer: ({
    onResponseChange,
    rootQuestionNumber,
  }: {
    onResponseChange: (value: object) => void;
    rootQuestionNumber: number;
  }) => (
    <button
      data-root-question-number={rootQuestionNumber}
      onClick={() => onResponseChange({ children: [], elementAnswers: [] })}
    >
      Player
    </button>
  ),
}));

const paper = {
  dateMetadata: {
    displayText: "2026-08-11",
    kind: "student-task-publish-time",
  },
  deadlineTimestamp: Date.now() + 10_000,
  gradeName: "Grade 8",
  modules: [
    {
      moduleName: "Choice questions",
      moduleQuestionNumber: 1,
      moduleScore: "5.0",
      order: 1,
      placements: [
        {
          children: [],
          content: {},
          order: 1,
          placementId: "P1",
          questionId: 1,
          response: { children: [], elementAnswers: [] },
          responseVersion: 0,
          score: "5.0",
        },
      ],
    },
  ],
  questionTypeTemplates: [],
  title: "V2 exam",
  totalScore: "5.0",
} as unknown as ExamPaperView;

describe("student V2 answer layout", () => {
  it("uses QuestionPlayer as the single interaction component", () => {
    const onResponseChange = jest.fn();
    render(
      <StudentAnswerPaper
        answerMode="continuous"
        onResponseChange={onResponseChange}
        onSingleQuestionIndexChange={jest.fn()}
        onSubmit={jest.fn()}
        paper={paper}
        singleQuestionIndex={0}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Player" }));
    expect(screen.getByRole("button", { name: "Player" })).toHaveAttribute(
      "data-root-question-number",
      "1",
    );
    expect(onResponseChange).toHaveBeenCalledWith(
      "P1",
      expect.objectContaining({ elementAnswers: [] }),
    );
  });

  it("hides the question score and divider in single-question mode", () => {
    const { container } = render(
      <StudentAnswerPaper
        answerMode="single-question"
        onResponseChange={jest.fn()}
        onSingleQuestionIndexChange={jest.fn()}
        onSubmit={jest.fn()}
        paper={paper}
        singleQuestionIndex={0}
      />,
    );

    expect(container.querySelector(".question-score")).not.toBeInTheDocument();
  });

  it("keeps the question score and divider in continuous mode", () => {
    const { container } = render(
      <StudentAnswerPaper
        answerMode="continuous"
        onResponseChange={jest.fn()}
        onSingleQuestionIndexChange={jest.fn()}
        onSubmit={jest.fn()}
        paper={paper}
        singleQuestionIndex={0}
      />,
    );

    expect(container.querySelector(".question-score")).toBeInTheDocument();
  });

  it("keeps the full-paper module number in single-question mode", () => {
    const twoModulePaper = {
      ...paper,
      modules: [
        ...paper.modules,
        {
          ...paper.modules[0],
          moduleName: "Written response",
          order: 2,
          placements: [
            {
              ...paper.modules[0].placements[0],
              order: 2,
              placementId: "P2",
            },
          ],
        },
      ],
    };

    render(
      <StudentAnswerPaper
        answerMode="single-question"
        onResponseChange={jest.fn()}
        onSingleQuestionIndexChange={jest.fn()}
        onSubmit={jest.fn()}
        paper={twoModulePaper}
        singleQuestionIndex={1}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "二、 Written response" }),
    ).toBeInTheDocument();
  });

  it("keeps long entry metadata and primary actions in the answer toolbar", () => {
    const longGradePaper = {
      ...paper,
      gradeName: "International Baccalaureate Middle Years Programme Grade 8",
    };

    render(
      <StudentAnswerToolbar
        answerMode="single-question"
        deadline={null}
        onBack={jest.fn()}
        onDeadlineExpire={jest.fn()}
        onModeChange={jest.fn()}
        onSubmit={jest.fn()}
        paper={longGradePaper}
        unavailable={false}
      />,
    );

    expect(
      screen.getByText(/International Baccalaureate Middle Years Programme/),
    ).toBeInTheDocument();
    expect(screen.getByText("2026-08-11")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Switch to continuous answering/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Finish answering/ }),
    ).toBeInTheDocument();
  });

  it("expires a configured zero deadline instead of treating it as unlimited", () => {
    const onDeadlineExpire = jest.fn();
    render(
      <StudentAnswerToolbar
        answerMode="continuous"
        deadline={0}
        onBack={jest.fn()}
        onDeadlineExpire={onDeadlineExpire}
        onModeChange={jest.fn()}
        onSubmit={jest.fn()}
        paper={paper}
        unavailable={false}
      />,
    );

    expect(screen.getByText("00:00:00")).toBeInTheDocument();
    expect(screen.queryByText("Unlimited")).not.toBeInTheDocument();
    expect(onDeadlineExpire).toHaveBeenCalledTimes(1);
  });

  it("shows the answer workspace empty state and disables actions for an unavailable paper", () => {
    render(
      <StudentExamExperience
        answerMode="continuous"
        deadline={Date.now() + 10_000}
        onBack={jest.fn()}
        onDeadlineExpire={jest.fn()}
        onModeChange={jest.fn()}
        onResponseChange={jest.fn()}
        onSingleQuestionIndexChange={jest.fn()}
        onSubmit={jest.fn()}
        paper={{ ...paper, modules: [] }}
        phase="unavailable"
        singleQuestionIndex={0}
      />,
    );

    expect(
      screen.getByText("No questions available to answer"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Finish answering/ }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /Switch to one question at a time/ }),
    ).toBeDisabled();
    expect(screen.queryByText(/Remaining time/)).not.toBeInTheDocument();
  });
});
