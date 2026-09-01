import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import * as api from "../../../services/explicitExam";
import StudentExamSessionPage from "../pages/StudentExamSessionPage";

jest.mock("../../../services/explicitExam");
jest.mock(
  "../components/StudentExamSessionView",
  () =>
    ({
      contextError,
      onBack,
      onSubmit,
      paper,
      phase,
    }: {
      contextError?: Error;
      onBack: () => void;
      onSubmit: () => void;
      paper?: {
        dateMetadata: { displayText: string };
        deadlineTimestamp: number | null;
        gradeName: string;
        title: string;
      };
      phase: string;
    }) => (
      <div>
        <button onClick={onBack} type="button">
          back
        </button>
        <button onClick={onSubmit} type="button">
          submit
        </button>
        {contextError
          ? "error-view"
          : phase === "ready"
            ? "ready-view"
            : `${phase}-view`}
        {paper ? (
          <span data-testid="paper-metadata">{JSON.stringify(paper)}</span>
        ) : null}
      </div>
    ),
);
jest.mock("../../../utils/i18n", () => ({
  trans: (_key: string, fallback: string) => fallback,
}));

describe("StudentExamSessionPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    jest.mocked(api.loadStudentPaperAnswerSource).mockResolvedValue({
      paper: {
        contractVersion: "V2",
        gradeName: "Grade 8",
        moduleList: [],
        paperAvailability: "READY",
        title: "Student exam",
        totalScore: 10,
      },
      questionTypes: [],
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("closes the current tab when returning from the answer page", async () => {
    const close = jest.spyOn(window, "close").mockImplementation(() => {});
    const push = jest.fn();
    jest.mocked(api.getStudentExamEntry).mockResolvedValue({
      examId: 12,
      gradeName: "Grade 8",
      paperId: 99,
      status: "NOT_STARTED",
      taskPublishId: 33,
      taskPublishTime: "2026-08-11T09:30:00+08:00",
    });

    render(
      <StudentExamSessionPage
        history={{ push }}
        match={{ params: { examId: "12", taskPublishId: "33" } }}
      />,
    );

    await waitFor(() =>
      expect(screen.getByText("ready-view")).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: "back" }));

    expect(close).toHaveBeenCalledTimes(1);
    expect(push).not.toHaveBeenCalled();
  });

  it("uses entry status as the implemented lifecycle boundary", async () => {
    jest.mocked(api.getStudentExamEntry).mockResolvedValue({
      examId: 12,
      gradeName: "Grade 8",
      paperId: 99,
      status: "NOT_STARTED",
      taskPublishId: 33,
      taskPublishTime: "2026-08-11T09:30:00+08:00",
    });
    render(
      <StudentExamSessionPage
        history={{ push: jest.fn() }}
        match={{ params: { examId: "12", taskPublishId: "33" } }}
      />,
    );
    await waitFor(() =>
      expect(screen.getByText("ready-view")).toBeInTheDocument(),
    );
    expect(api.getStudentExamEntry).toHaveBeenCalledWith(12, 33);
  });

  it("maps the legacy GMT+8 answer deadline before rendering", async () => {
    jest.mocked(api.getStudentExamEntry).mockResolvedValue({
      examId: 12,
      gradeName: "Grade 8",
      paperId: 99,
      status: "NOT_STARTED",
      taskPublishId: 33,
      taskPublishTime: "2026-06-24 10:01:53",
    });
    jest.mocked(api.loadStudentPaperAnswerSource).mockResolvedValue({
      paper: {
        answerEndTime: "2026-06-24 11:01:53",
        gradeName: "Grade 8",
        moduleList: [],
        paperAvailability: "READY",
      },
      questionTypes: [],
    });

    render(
      <StudentExamSessionPage
        match={{ params: { examId: "12", taskPublishId: "33" } }}
      />,
    );

    expect(await screen.findByText("ready-view")).toBeInTheDocument();
    expect(screen.getByTestId("paper-metadata")).toHaveTextContent(
      String(Date.UTC(2026, 5, 24, 3, 1, 53)),
    );
  });

  it("shows an error for a non-empty invalid answer deadline", async () => {
    jest.mocked(api.getStudentExamEntry).mockResolvedValue({
      examId: 12,
      gradeName: "Grade 8",
      paperId: 99,
      status: "NOT_STARTED",
      taskPublishId: 33,
      taskPublishTime: "2026-06-24 10:01:53",
    });
    jest.mocked(api.loadStudentPaperAnswerSource).mockResolvedValue({
      paper: {
        answerEndTime: "2026-02-29 10:01:53",
        gradeName: "Grade 8",
        moduleList: [],
        paperAvailability: "READY",
      },
      questionTypes: [],
    });

    render(
      <StudentExamSessionPage
        match={{ params: { examId: "12", taskPublishId: "33" } }}
      />,
    );

    expect(await screen.findByText("error-view")).toBeInTheDocument();
  });

  it("opens the answer workspace without starting or submitting an unavailable paper", async () => {
    jest.mocked(api.getStudentExamEntry).mockResolvedValue({
      examId: 12,
      gradeName: "Grade 8",
      paperId: 99,
      status: "IN_PROGRESS",
      taskPublishId: 33,
      taskPublishTime: "2026-08-11T09:30:00+08:00",
    });
    jest.mocked(api.loadStudentPaperAnswerSource).mockResolvedValue({
      paper: {
        contractVersion: "V2",
        gradeName: "Grade 8",
        moduleList: [],
        paperAvailability: "UNAVAILABLE",
        paperIssueCode: "QUESTION_UNASSOCIATED",
        title: "Damaged V2 exam",
        totalScore: 1,
      },
      questionTypes: [],
    });

    render(
      <StudentExamSessionPage
        history={{ push: jest.fn() }}
        match={{ params: { examId: "12", taskPublishId: "33" } }}
      />,
    );

    expect(await screen.findByText("unavailable-view")).toBeInTheDocument();
    expect(screen.getByTestId("paper-metadata")).toHaveTextContent(
      "Damaged V2 exam",
    );
    expect(api.startStudentExam).not.toHaveBeenCalled();
    expect(api.submitStudentExam).not.toHaveBeenCalled();
  });

  it("restores answers without replacing authoritative entry metadata", async () => {
    window.localStorage.setItem(
      "v2-exam-draft:12:33",
      JSON.stringify({
        answers: [],
        version: 1,
      }),
    );
    jest.mocked(api.getStudentExamEntry).mockResolvedValue({
      examId: 12,
      gradeName: "Grade 8",
      paperId: 99,
      status: "NOT_STARTED",
      taskPublishId: 33,
      taskPublishTime: "2026-08-11T09:30:00+08:00",
    });

    render(
      <StudentExamSessionPage
        history={{ push: jest.fn() }}
        match={{ params: { examId: "12", taskPublishId: "33" } }}
      />,
    );

    await waitFor(() =>
      expect(screen.getByText("ready-view")).toBeInTheDocument(),
    );
    expect(screen.getByTestId("paper-metadata")).toHaveTextContent("Grade 8");
    expect(screen.getByTestId("paper-metadata")).toHaveTextContent(
      "Student exam",
    );
    expect(screen.getByTestId("paper-metadata")).not.toHaveTextContent(
      "Stale grade",
    );
  });

  it("rejects an invalid examId before requesting entry", async () => {
    render(
      <StudentExamSessionPage
        history={{ push: jest.fn() }}
        match={{ params: {} }}
      />,
    );
    expect(await screen.findByText("error-view")).toBeInTheDocument();
    expect(api.getStudentExamEntry).not.toHaveBeenCalled();
  });

  it("loads the V2 result directly for an already submitted exam", async () => {
    jest.mocked(api.getStudentExamEntry).mockResolvedValue({
      examId: 12,
      gradeName: "Grade 8",
      paperId: 99,
      status: "SUBMITTED",
      taskPublishId: 33,
      taskPublishTime: "2026-08-11T09:30:00+08:00",
    });
    jest.mocked(api.loadStudentExamResultSource).mockResolvedValue({
      questionTypes: [],
      result: {
        examPaperDetailResponse: {
          contractVersion: "V2",
          gradeName: "Grade 8",
          moduleList: [],
          title: "Submitted exam",
          totalScore: 10,
        },
        examScore: 10,
        submittedAt: "2026-08-11T09:30:00+08:00",
        studentId: 7,
        studentScore: 8,
      },
    });

    render(
      <StudentExamSessionPage
        match={{ params: { examId: "12", taskPublishId: "33" } }}
      />,
    );

    expect(await screen.findByText("result-view")).toBeInTheDocument();
    expect(api.loadStudentExamResultSource).toHaveBeenCalledWith(12);
  });

  it("keeps the authoritative taskPublishId when checking a failed submission", async () => {
    const push = jest.fn();
    jest
      .mocked(api.getStudentExamEntry)
      .mockResolvedValueOnce({
        examId: 12,
        gradeName: "Grade 8",
        paperId: 99,
        status: "IN_PROGRESS",
        taskPublishId: 33,
        taskPublishTime: "2026-08-11T09:30:00+08:00",
      })
      .mockResolvedValueOnce({
        examId: 12,
        gradeName: "Grade 8",
        paperId: 99,
        status: "SUBMITTED",
        taskPublishId: 33,
        taskPublishTime: "2026-08-11T09:30:00+08:00",
      });
    jest.mocked(api.submitStudentExam).mockRejectedValue(new Error("timeout"));

    render(
      <StudentExamSessionPage
        history={{ push }}
        match={{ params: { examId: "12", taskPublishId: "33" } }}
      />,
    );

    expect(await screen.findByText("answering-view")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "submit" }));

    await waitFor(() => {
      expect(api.getStudentExamEntry).toHaveBeenNthCalledWith(2, 12, 33);
    });
    expect(push).toHaveBeenCalledWith("/student/exams/12/result");
  });
});
