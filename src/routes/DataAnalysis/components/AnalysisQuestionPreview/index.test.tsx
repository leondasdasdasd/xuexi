import { render, screen } from "@testing-library/react";
import React from "react";

import type { AnalysisQuestionCatalog } from "../../analysisQuestionCatalog";
import AnalysisQuestionPreview from ".";

const questionPreview = jest.fn((_properties?: unknown) => (
  <div>V2 question</div>
));
const questionPlayer = jest.fn((_properties?: unknown) => (
  <div>V2 response</div>
));

jest.mock("@yungu-fed/question-editor", () => ({
  createEmptyQuestionPlayerResponse: () => ({
    id: 7,
    questionTypeKey: "5",
    elementAnswers: [],
    children: [],
  }),
  createQuestionPreviewDraft: (value: unknown) => value,
  QuestionPlayer: (properties: unknown) => questionPlayer(properties),
  QuestionPreview: (properties: unknown) => questionPreview(properties),
}));

jest.mock("../../../../utils/v2QuestionPlayerResponseAdapter", () => ({
  mapV2AnswerJsonToQuestionPlayerResponse: () => ({
    id: 7,
    questionTypeKey: "5",
    elementAnswers: [{ type: "textResponse", answers: { content: "A" } }],
    children: [],
  }),
}));

const catalog = {
  questionTypeTemplates: [],
  findQuestion: () => ({
    questionId: 7,
    displayNumber: "2.1",
    score: 3,
    content: {
      id: 7,
      version: "1",
      businessQuestionTypeId: 5,
      elements: [],
      extras: [],
      children: [],
    },
  }),
  requireQuestion: () => ({
    questionId: 7,
    displayNumber: "2.1",
    score: 3,
    content: {
      id: 7,
      version: "1",
      businessQuestionTypeId: 5,
      elements: [],
      extras: [],
      children: [],
    },
  }),
} as unknown as AnalysisQuestionCatalog;

describe("AnalysisQuestionPreview", () => {
  beforeEach(() => jest.clearAllMocks());

  it("uses QuestionPreview for the canonical frozen question", () => {
    render(
      <AnalysisQuestionPreview
        catalog={catalog}
        mode="question"
        questionId={7}
      />,
    );

    expect(screen.getByText("V2 question")).toBeInTheDocument();
    expect(questionPreview).toHaveBeenCalledWith(
      expect.objectContaining({ rootQuestionNumber: 2 }),
    );
    expect(questionPlayer).not.toHaveBeenCalled();
  });

  it("uses QuestionPlayer and the shared answerJson mapper for a student response", () => {
    render(
      <AnalysisQuestionPreview
        answerJson='{"version":"1"}'
        catalog={catalog}
        mode="response"
        questionId={7}
        showAnswer
      />,
    );

    expect(screen.getByText("V2 response")).toBeInTheDocument();
    expect(questionPlayer).toHaveBeenCalledWith(
      expect.objectContaining({ disabled: true, showAnswer: true }),
    );
  });

  it("uses QuestionPlayer for an explicitly empty student response", () => {
    render(
      <AnalysisQuestionPreview
        answerJson={undefined}
        catalog={catalog}
        mode="response"
        questionId={7}
      />,
    );

    expect(screen.getByText("V2 response")).toBeInTheDocument();
    expect(questionPlayer).toHaveBeenCalledWith(
      expect.objectContaining({ disabled: true }),
    );
    expect(questionPreview).not.toHaveBeenCalled();
  });

  it("keeps the analysis page mounted when the selected question is absent", () => {
    const missingCatalog = {
      ...catalog,
      findQuestion: () => undefined,
      requireQuestion: () => {
        throw new Error("questionId=99");
      },
    } as unknown as AnalysisQuestionCatalog;

    expect(() =>
      render(
        <AnalysisQuestionPreview
          catalog={missingCatalog}
          mode="question"
          questionId={99}
        />,
      ),
    ).not.toThrow();
    expect(
      screen.getByText("Question preview is unavailable"),
    ).toBeInTheDocument();
    expect(
      screen
        .getByText("Question preview is unavailable")
        .closest("[data-analysis-question-id='99']"),
    ).toBeInTheDocument();
    expect(questionPreview).not.toHaveBeenCalled();
  });
});
