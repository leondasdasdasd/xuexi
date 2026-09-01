import { fireEvent, render, screen } from "@testing-library/react";

import ExamResultView from "../components/ExamResultView";
import type { ExamPaperView } from "../types";

const setLocale = (locale: string) => {
  (window as Window & { globalLange?: string }).globalLange = locale;
};

jest.mock("@yungu-fed/question-editor", () => ({
  QuestionPlayer: () => <div>Question player</div>,
}));

const paper = {
  dateMetadata: {
    displayText: "2026-08-11",
    kind: "student-task-publish-time",
  },
  gradeName: "八年级",
  modules: [
    {
      moduleName: "选择题",
      moduleQuestionNumber: 1,
      moduleScore: "1",
      order: 1,
      placements: [
        {
          children: [],
          content: { elements: [] },
          order: 1,
          placementId: "P1",
          questionId: 1,
          response: { children: [], elementAnswers: [] },
          score: "1",
        },
      ],
    },
  ],
  questionTypeTemplates: [],
  title: "试卷",
  totalScore: "1",
} as unknown as ExamPaperView;

const result = {
  correctCount: 1,
  fullScore: "1",
  incorrectCount: 0,
  pendingCount: 0,
  totalScore: "1",
};
const onBack = jest.fn();

describe("ExamResultView", () => {
  beforeEach(() => setLocale("zh-CN"));

  afterEach(() => {
    jest.clearAllMocks();
    setLocale("zh-CN");
  });

  it("renders localized result labels without hardcoded bilingual text", () => {
    render(
      <ExamResultView
        onBack={onBack}
        paper={paper}
        result={result}
        showAnswer
      />,
    );

    expect(
      screen.getByRole("heading", { name: "试卷结构" }),
    ).toBeInTheDocument();
    const resultHeader = screen.getByRole("button", {
      name: "返回",
    }).nextElementSibling;
    expect(resultHeader).toHaveTextContent(/年级.*八年级/);
    expect(resultHeader).toHaveTextContent("2026-08-11");
    expect(screen.queryByText("Questions")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "1" })).toBeInTheDocument();
  });

  it("renders English labels without Chinese text in English locale", () => {
    setLocale("en");
    render(
      <ExamResultView
        onBack={onBack}
        paper={paper}
        result={result}
        showAnswer
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Paper structure" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "1" })).toBeInTheDocument();
    expect(screen.queryByText("题目导航")).not.toBeInTheDocument();
  });

  it("scrolls to a result question without changing the route hash", () => {
    const scrollIntoView = jest.fn();
    document.body.innerHTML = '<div id="exam-placement-P1"></div>';
    document.getElementById("exam-placement-P1")!.scrollIntoView =
      scrollIntoView;

    render(
      <ExamResultView
        onBack={onBack}
        paper={paper}
        result={result}
        showAnswer
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "1" }));

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
    expect(window.location.hash).toBe("");
  });

  it("delegates result navigation to the page boundary", () => {
    render(
      <ExamResultView
        onBack={onBack}
        paper={paper}
        result={result}
        showAnswer
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "返回" }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
