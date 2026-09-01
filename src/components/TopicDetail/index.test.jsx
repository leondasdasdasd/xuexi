import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

import { TopicFargment } from ".";
import { classQuestionAnalysis } from "../../services/example";

jest.mock("dva", () => ({
  connect: () => (Component) => Component,
}));

jest.mock("../../services/example", () => ({
  classQuestionAnalysis: jest.fn(),
}));

const mockAnalysisQuestionPreview = jest.fn((properties) => (
  <div
    data-show-answer={String(Boolean(properties.showAnswer))}
    data-testid="analysis-question-preview"
  />
));
jest.mock(
  "../../routes/DataAnalysis/components/AnalysisQuestionPreview",
  () => (properties) => mockAnalysisQuestionPreview(properties),
);

const createQuestion = (questionId, questionSerialNumber, children = []) => ({
  classInstruction: false,
  gradeScoreRate: 50,
  groupGradeAndCompareScoreRate: "0",
  groupScoreRate: 50,
  questionId,
  questionSerialNumber,
  sonQuestionList: children,
});

describe("TopicDetail canonical question selection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    classQuestionAnalysis.mockResolvedValue({ status: true, content: {} });
  });

  it("renders a leaf with an empty child list through its own frozen identity", () => {
    render(
      <TopicFargment
        analysisQuestionCatalog={{ findQuestion: jest.fn() }}
        detailList={[createQuestion(4711, "1", [])]}
        examId={2069}
        groupId={7651}
      />,
    );

    expect(mockAnalysisQuestionPreview).toHaveBeenCalledWith(
      expect.objectContaining({ questionId: 4711 }),
    );
  });

  it("toggles answer details within the existing question preview", () => {
    render(
      <TopicFargment
        analysisQuestionCatalog={{ findQuestion: jest.fn() }}
        detailList={[createQuestion(4711, "1", [])]}
        examId={2069}
        groupId={7651}
      />,
    );

    expect(screen.getAllByTestId("analysis-question-preview")).toHaveLength(1);
    expect(screen.getByTestId("analysis-question-preview")).toHaveAttribute(
      "data-show-answer",
      "false",
    );

    fireEvent.click(screen.getByText(/^(Answer|查看解析)$/));

    expect(screen.getAllByTestId("analysis-question-preview")).toHaveLength(1);
    expect(screen.getByTestId("analysis-question-preview")).toHaveAttribute(
      "data-show-answer",
      "true",
    );

    fireEvent.click(screen.getByText(/^(Answer|查看解析)$/));

    expect(screen.getByTestId("analysis-question-preview")).toHaveAttribute(
      "data-show-answer",
      "false",
    );
  });

  it("hides answer details when switching to student answers", () => {
    render(
      <TopicFargment
        analysisQuestionCatalog={{ findQuestion: jest.fn() }}
        detailList={[createQuestion(4711, "1", [])]}
        examId={2069}
        groupId={7651}
      />,
    );

    fireEvent.click(screen.getByText(/^(Answer|查看解析)$/));
    fireEvent.click(screen.getByText(/Student Answer|学生作答/));

    expect(screen.getAllByTestId("analysis-question-preview")).toHaveLength(1);
    expect(screen.getByTestId("analysis-question-preview")).toHaveAttribute(
      "data-show-answer",
      "false",
    );
    expect(classQuestionAnalysis).toHaveBeenCalledWith(
      expect.objectContaining({ questionId: 4711, questionNo: "1" }),
    );
  });

  it("uses the same first-child identity for composite preview and detail", () => {
    const child = createQuestion(11680, "1.1");
    render(
      <TopicFargment
        analysisQuestionCatalog={{ findQuestion: jest.fn() }}
        detailList={[createQuestion(undefined, "1", [child])]}
        examId={2069}
        groupId={7651}
      />,
    );

    fireEvent.click(screen.getByText(/Student Answer|学生作答/));

    expect(mockAnalysisQuestionPreview).toHaveBeenCalledWith(
      expect.objectContaining({ questionId: 11680 }),
    );
    expect(classQuestionAnalysis).toHaveBeenCalledWith(
      expect.objectContaining({ questionId: 11680, questionNo: "1.1" }),
    );
  });
});
