import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { message } from "antd";

import * as api from "../../../services/explicitExam";
import * as paperApi from "../../../services/examPaperV2";
import TeacherPaperTrialPage from "../pages/TeacherPaperTrialPage";

jest.mock("../../../services/explicitExam");
jest.mock("../../../services/examPaperV2");
jest.mock("@yungu-fed/question-editor", () => {
  const actual = jest.requireActual("@yungu-fed/question-editor");
  return {
    ...actual,
    QuestionPlayer: ({
      onResponseChange,
      response,
    }: {
      onResponseChange: (value: object) => void;
      response: {
        elementAnswers: Array<{ answers?: { optionIds?: string[] } }>;
      };
    }) => (
      <button
        onClick={() =>
          onResponseChange({
            ...response,
            elementAnswers: [{ answers: { optionIds: ["A"] }, type: "choice" }],
          })
        }
      >
        Player{" "}
        {response.elementAnswers[0]?.answers?.optionIds?.join("") || "empty"}
      </button>
    ),
  };
});

const mockedApi = api as jest.Mocked<typeof api>;
const mockedPaperApi = paperApi as jest.Mocked<typeof paperApi>;

const advanceCountdown = () => {
  act(() => jest.advanceTimersByTime(1000));
  act(() => jest.advanceTimersByTime(1000));
  act(() => jest.advanceTimersByTime(1000));
};

const previewPaper = {
  capabilities: { copy: false, delete: false, update: false },
  content: {
    moduleList: [
      {
        moduleName: "Choice",
        moduleQuestionNumber: 2,
        moduleScore: 10,
        questionList: [10, 11].map((questionId) => ({
          businessQuestionTypeId: 1,
          chapterIds: [],
          children: [],
          indicatorIds: [],
          knowledgeIds: [],
          questionData: {
            businessQuestionTypeId: 1,
            children: [],
            elements: [
              {
                answers: { optionIds: [] },
                columns: [],
                options: [],
                type: "choice",
              },
            ],
            extras: [],
            id: questionId,
            version: "1",
          },
          questionId,
          questionScore: 5,
        })),
      },
    ],
  },
  gradeId: 1,
  gradeName: "Grade 9",
  id: 42,
  paperTypeCode: 1,
  subjectId: 2,
  title: "Preview",
  totalScore: 10,
};

const questionTypes = [
  {
    businessQuestionTypeId: 1,
    elements: [
      {
        config: {
          optionLabelStyle: "upperAlpha",
          renderer: "standard",
          selectionType: "single",
        },
        name: "Answer",
        type: "choice",
      },
    ],
    extras: [],
    globalConfig: { hasAnswer: true },
    isComposite: false,
    name: "Choice",
  },
];

describe("TeacherPaperTrialPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedPaperApi.loadExamPaperV2AnswerSource.mockResolvedValue({
      detail: previewPaper,
      questionTypes,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it("uses the student ready, countdown and answer experience", async () => {
    render(<TeacherPaperTrialPage match={{ params: { paperId: "42" } }} />);

    expect(
      await screen.findByRole("heading", { level: 1, name: "Preview" }),
    ).toBeInTheDocument();
    expect(mockedApi.getCurrentUser).not.toHaveBeenCalled();
    expect(mockedPaperApi.loadExamPaperV2AnswerSource).toHaveBeenCalledWith(42);
    jest.useFakeTimers();
    fireEvent.click(
      screen.getByRole("radio", { name: /One question at a time/ }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Start answering" }));
    expect(screen.getByText("3")).toBeInTheDocument();

    advanceCountdown();
    expect(screen.getByText(/Time remaining/)).toBeInTheDocument();
    expect(screen.getByText("Unlimited")).toBeInTheDocument();
    expect(screen.getByText(/Question 1 of 2/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Next question/ }));
    expect(screen.getByText(/Question 2 of 2/)).toBeInTheDocument();
    expect(mockedApi.submitStudentExam).not.toHaveBeenCalled();
  });

  it("renders correct and pending question results returned by preview", async () => {
    const close = jest.spyOn(window, "close").mockImplementation();
    render(<TeacherPaperTrialPage match={{ params: { paperId: "42" } }} />);
    const startButton = await screen.findByRole("button", {
      name: "Start answering",
    });
    jest.useFakeTimers();
    fireEvent.click(startButton);
    advanceCountdown();

    fireEvent.click(
      screen.getAllByRole("button", { name: "Player empty" }).at(0)!,
    );
    expect(
      screen.getByRole("button", { name: "Player A" }),
    ).toBeInTheDocument();
    expect(mockedPaperApi.loadExamPaperV2AnswerSource).toHaveBeenCalledTimes(1);
    mockedApi.submitExamPreview.mockResolvedValue({
      correctQuestionNum: 1,
      errorQuestionNum: 0,
      examPaperDetailResponse: {
        gradeName: "Grade 8",
        moduleList: [
          {
            ...previewPaper.content.moduleList[0],
            questionList: previewPaper.content.moduleList[0].questionList.map(
              (question, index) => ({
                ...question,
                isCorrect: index === 0 ? 1 : 0,
                studentScore: index === 0 ? 5 : null,
              }),
            ),
          },
        ],
      },
      examScore: 10,
      pendingQuestionNum: 1,
      studentScore: null,
    });
    fireEvent.click(screen.getByRole("button", { name: /Finish answering/ }));
    await waitFor(() => expect(mockedApi.submitExamPreview).toHaveBeenCalled());
    const earnedScore = screen.getByText("5", {
      selector: ".result-score-earned",
    });
    expect(earnedScore).toBeInTheDocument();
    expect(earnedScore.closest(".result-score")).toHaveTextContent(/5 \/ 5/);
    expect(screen.getByText("Correct")).toBeInTheDocument();
    expect(screen.getByText("Pending review")).toBeInTheDocument();
    expect(
      within(screen.getByRole("region", { name: "Response result" })).getByText(
        /Score.*Pending review/,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Incorrect.*0 \/ 5/)).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Player A" }),
    ).toBeInTheDocument();
    expect(mockedApi.submitStudentExam).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("shows the backend message when preview submission fails", async () => {
    const submissionError =
      "保存题位作答失败：attemptId=null，placementId=10314，错误码=RESPONSE_SHAPE_INVALID";
    const errorMessage = jest.spyOn(message, "error").mockImplementation();
    render(<TeacherPaperTrialPage match={{ params: { paperId: "42" } }} />);
    const startButton = await screen.findByRole("button", {
      name: "Start answering",
    });
    jest.useFakeTimers();
    fireEvent.click(startButton);
    advanceCountdown();
    await act(async () => Promise.resolve());
    mockedApi.submitExamPreview.mockRejectedValue(new Error(submissionError));

    fireEvent.click(screen.getByRole("button", { name: /Finish answering/ }));

    await waitFor(() => expect(mockedApi.submitExamPreview).toHaveBeenCalled());
    expect(errorMessage).toHaveBeenCalledWith(submissionError);
    expect(
      screen.getByRole("button", { name: /Finish answering/ }),
    ).toBeInTheDocument();
  });

  it("closes the current tab when returning from the ready page", async () => {
    const close = jest.spyOn(window, "close").mockImplementation();
    render(<TeacherPaperTrialPage match={{ params: { paperId: "42" } }} />);
    await screen.findByRole("heading", { level: 1, name: "Preview" });
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("shows teacher trial loading failures", async () => {
    mockedPaperApi.loadExamPaperV2AnswerSource.mockRejectedValue(
      new Error("network"),
    );
    render(<TeacherPaperTrialPage match={{ params: { paperId: "42" } }} />);
    expect(
      await screen.findByText("Unable to load exam content"),
    ).toBeInTheDocument();
    expect(screen.getByText("network")).toBeInTheDocument();
  });
});
