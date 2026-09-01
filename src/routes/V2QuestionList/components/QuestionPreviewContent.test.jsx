import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import QuestionPreviewContent from "../../../components/QuestionPreviewContent.jsx";
import { createBusinessQuestionTypesById } from "../../../utils/questionPreviewAdapter.js";
import { createNewMyQuestionPreviewViewModel } from "../questionPreviewAdapter.js";
import {
  NEW_MY_QUESTION_AGGREGATES,
  NEW_MY_QUESTION_TYPE_RESPONSES,
} from "../questionPreviewAdapter.testFixtures.js";

const mockCreateQuestionPreviewDraft = jest.fn((questionContent) =>
  questionContent ? { preview: questionContent.questionTypeKey } : undefined,
);
const mockQuestionPreview = jest.fn((properties) => (
  <div data-testid="question-preview">
    {properties.showAnswer ? "answer-visible" : "answer-hidden"}
    {properties.showExtraAttributes ? " extras-visible" : " extras-hidden"}
  </div>
));

jest.mock("@yungu-fed/question-editor", () => ({
  createQuestionPreviewDraft: (questionContent, templates) =>
    mockCreateQuestionPreviewDraft(questionContent, templates),
  normalizeRichTextContent: (content) => content,
  QuestionPreview: (properties) => mockQuestionPreview(properties),
}));

const renderMarkup = (element) => renderToStaticMarkup(element);
const businessQuestionTypesById = createBusinessQuestionTypesById(
  NEW_MY_QUESTION_TYPE_RESPONSES,
);

describe("QuestionPreviewContent", () => {
  beforeEach(() => {
    window.globalLange = "en";
    mockCreateQuestionPreviewDraft.mockClear();
    mockQuestionPreview.mockClear();
  });

  it("renders npm QuestionPreview with answers and extra attributes hidden by default", () => {
    const viewModel = createNewMyQuestionPreviewViewModel(
      NEW_MY_QUESTION_AGGREGATES[0],
      businessQuestionTypesById,
    );

    const view = renderMarkup(
      <QuestionPreviewContent
        showAnswerDetails={false}
        viewModel={viewModel}
      />,
    );

    expect(view).toContain("answer-hidden");
    expect(view).toContain("extras-hidden");
    expect(mockQuestionPreview).toHaveBeenCalledWith(
      expect.objectContaining({
        questionTypeTemplates: viewModel.questionTypeTemplates,
        showAnswer: false,
        showExtraAttributes: false,
      }),
    );
  });

  it("passes answer and extra attribute visibility to QuestionPreview", () => {
    const view = renderMarkup(
      <QuestionPreviewContent
        showAnswerDetails
        viewModel={createNewMyQuestionPreviewViewModel(
          NEW_MY_QUESTION_AGGREGATES[2],
          businessQuestionTypesById,
        )}
      />,
    );

    expect(view).toContain("answer-visible");
    expect(view).toContain("extras-visible");
    expect(mockQuestionPreview).toHaveBeenCalledWith(
      expect.objectContaining({
        showAnswer: true,
        showExtraAttributes: true,
      }),
    );
  });

  it("shows a bilingual empty state when preview draft is unavailable", () => {
    const view = renderMarkup(
      <QuestionPreviewContent
        showAnswerDetails={false}
        viewModel={{
          questionContent: undefined,
          questionTypeTemplates: [],
        }}
      />,
    );

    expect(mockQuestionPreview).not.toHaveBeenCalled();
    expect(view).toContain("Question preview is unavailable");
  });
});
