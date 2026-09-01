/** @jest-environment node */

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import type {
  BusinessQuestionTypeRegistryItem,
  V2QuestionAggregate,
} from "./segmentationPaperV2Adapter";
import TwoWayQuestionPreview from "./TwoWayQuestionPreview";

const mockCreateQuestionPreviewViewModel = jest.fn(
  (
    _aggregate: V2QuestionAggregate,
    _questionTypes: BusinessQuestionTypeRegistryItem[],
  ) => ({
    questionContent: { questionTypeKey: "question-type-1" },
    questionTypeTemplates: [{ key: "question-type-1" }],
  }),
);

jest.mock("../../utils/questionPreviewAdapter.js", () => ({
  createBusinessQuestionTypesById: (questionTypes: object[]) => questionTypes,
  createQuestionPreviewViewModel: (
    aggregate: V2QuestionAggregate,
    questionTypes: BusinessQuestionTypeRegistryItem[],
  ) => mockCreateQuestionPreviewViewModel(aggregate, questionTypes),
}));

jest.mock(
  "../../components/QuestionPreviewContent",
  () =>
    function MockQuestionPreviewContent(properties: {
      showAnswerDetails: boolean;
    }) {
      return (
        <div>
          {properties.showAnswerDetails ? "answer-visible" : "answer-hidden"}
        </div>
      );
    },
);

const questionTypes: BusinessQuestionTypeRegistryItem[] = [
  { businessQuestionTypeId: 1 },
];

const createAggregate = (
  businessQuestionTypeId: number,
): V2QuestionAggregate => ({
  id: businessQuestionTypeId,
  question: {
    businessQuestionTypeId,
    children: [],
    elements: [],
    id: businessQuestionTypeId,
    version: "1",
  },
});

describe("TwoWayQuestionPreview", () => {
  beforeEach(() => {
    mockCreateQuestionPreviewViewModel.mockClear();
  });

  it.each([
    ["choice", 1],
    ["fill", 3],
    ["composite", 6],
  ])(
    "renders the latest %s aggregate through the shared preview",
    (_type, id) => {
      const aggregate = createAggregate(id);
      const view = renderToStaticMarkup(
        <TwoWayQuestionPreview
          aggregate={aggregate}
          questionTypes={questionTypes}
          showAnswer
        />,
      );

      expect(view).toContain("answer-visible");
      expect(mockCreateQuestionPreviewViewModel).toHaveBeenCalledWith(
        aggregate,
        questionTypes,
      );
    },
  );
});
