import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";

import * as api from "../../../services/explicitExam";
import TeacherStudentResultPage from "../pages/TeacherStudentResultPage";

jest.mock("../../../services/explicitExam");
jest.mock("../../../utils/i18n", () => ({
  locale: () => "zh-CN",
  trans: (_key: string, fallback: string) => fallback,
}));
jest.mock(
  "../components/ExamResultView",
  () =>
    ({
      headerActions,
      onBack,
      paper,
      showAnswer,
    }: {
      headerActions: React.ReactNode;
      onBack: () => void;
      paper: { dateMetadata: { kind: string }; gradeName: string };
      showAnswer: boolean;
    }) => (
      <div>
        <button onClick={onBack} type="button">
          back
        </button>
        <span data-testid="paper">{JSON.stringify(paper)}</span>
        <span>{showAnswer ? "answers-visible" : "answers-hidden"}</span>
        {headerActions}
      </div>
    ),
);

const resultSource = {
  questionTypes: [],
  result: {
    examPaperDetailResponse: {
      contractVersion: "V2",
      gradeName: "Grade 8",
      moduleList: [],
      title: "Full result paper",
      totalScore: 10,
    },
    examScore: 10,
    studentId: 8,
    studentName: "Ada",
    studentScore: 8,
    submittedAt: "2026-08-11T09:30:00+08:00",
  },
};

describe("TeacherStudentResultPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .mocked(api.getCurrentUser)
      .mockResolvedValue({ currentIdentity: "teacher" });
    jest
      .mocked(api.loadTeacherStudentExamResultSource)
      .mockResolvedValue(resultSource);
    jest.mocked(api.getTeacherExamStudents).mockResolvedValue({
      groups: [{ groupId: 3, groupName: "Class 3" }],
      limit: 20,
      pageNo: 1,
      students: [
        { groupId: 3, studentId: 8, studentName: "Ada" },
        { groupId: 3, studentId: 9, studentName: "Grace" },
      ],
      total: 2,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("closes the current tab when returning from a student result", async () => {
    const close = jest.spyOn(window, "close").mockImplementation(() => {});

    render(
      <TeacherStudentResultPage
        match={{ params: { examId: "12", studentId: "8" } }}
      />,
    );

    fireEvent.click(await screen.findByRole("button", { name: "back" }));

    expect(close).toHaveBeenCalledTimes(1);
  });

  it("renders the shared full result view with teacher answer visibility", async () => {
    render(
      <TeacherStudentResultPage
        match={{ params: { examId: "12", studentId: "8" } }}
      />,
    );

    expect(await screen.findByText("answers-visible")).toBeInTheDocument();
    expect(screen.getByTestId("paper")).toHaveTextContent("Full result paper");
    expect(screen.getByTestId("paper")).toHaveTextContent(
      "teacher-student-submission-time",
    );
    expect(api.loadTeacherStudentExamResultSource).toHaveBeenCalledWith(12, 8);
  });

  it("navigates to the canonical route when a teacher switches students", async () => {
    const push = jest.fn();
    render(
      <TeacherStudentResultPage
        history={{ push }}
        match={{ params: { examId: "12", studentId: "8" } }}
      />,
    );

    await waitFor(() =>
      expect(screen.getByRole("option", { name: "Grace" })).toBeInTheDocument(),
    );
    fireEvent.change(screen.getByLabelText("切换学生"), {
      target: { value: "9" },
    });

    expect(push).toHaveBeenCalledWith("/teacher/exams/12/students/9/result");
  });
});
