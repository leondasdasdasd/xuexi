import { fireEvent, render, screen } from "@testing-library/react";

import * as api from "../../../services/explicitExam";
import StudentExamResultPage from "../pages/StudentExamResultPage";

jest.mock("../../../services/explicitExam");
jest.mock(
  "../components/ExamResultView",
  () =>
    ({ onBack, paper }: { onBack: () => void; paper: object }) => (
      <div>
        <button onClick={onBack} type="button">
          back
        </button>
        {JSON.stringify(paper)}
      </div>
    ),
);
jest.mock("../../../utils/i18n", () => ({
  trans: (_key: string, fallback: string) => fallback,
}));

describe("StudentExamResultPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(api.loadStudentExamResultSource).mockResolvedValue({
      questionTypes: [],
      result: {
        examPaperDetailResponse: {
          contractVersion: "V2",
          gradeName: "Grade 8",
          moduleList: [],
          title: "Result paper",
          totalScore: 10,
        },
        examScore: 10,
        submittedAt: "2026-08-11T09:30:00+08:00",
        studentId: 7,
        studentScore: 8,
      },
    });
    jest.mocked(api.getStudentExamEntry).mockResolvedValue({
      examId: 12,
      gradeName: "Grade 8",
      paperId: 99,
      status: "SUBMITTED",
      taskPublishId: 33,
      taskPublishTime: "2026-08-11T09:30:00+08:00",
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("loads the recorded task entry as result metadata", async () => {
    render(<StudentExamResultPage match={{ params: { examId: "12" } }} />);

    expect(
      await screen.findByText(/student-task-publish-time/),
    ).toHaveTextContent(/Grade 8/);
    expect(api.getStudentExamEntry).toHaveBeenCalledWith(12);
    expect(
      jest.mocked(api.loadStudentExamResultSource).mock.invocationCallOrder[0],
    ).toBeLessThan(
      jest.mocked(api.getStudentExamEntry).mock.invocationCallOrder[0],
    );
  });

  it("closes the current tab when returning from the result page", async () => {
    const close = jest.spyOn(window, "close").mockImplementation(() => {});

    render(<StudentExamResultPage match={{ params: { examId: "12" } }} />);

    fireEvent.click(await screen.findByRole("button", { name: "back" }));

    expect(close).toHaveBeenCalledTimes(1);
  });
});
