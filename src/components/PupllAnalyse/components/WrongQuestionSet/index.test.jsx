import { render } from "@testing-library/react";
import React from "react";

import WrongQuestionSet from ".";

const analysisQuestionPreview = jest.fn(() => <div>V2 preview</div>);
const questionShow = jest.fn(() => <div>Recommended question</div>);

jest.mock(
  "../../../../routes/DataAnalysis/components/AnalysisQuestionPreview",
  () => (properties) => analysisQuestionPreview(properties),
);
jest.mock(
  "../../../QuestionShow",
  () => (properties) => questionShow(properties),
);

const catalog = {
  findQuestion: jest.fn(() => ({})),
};

const renderWrongQuestionSet = (question, configData = {}) =>
  render(
    <WrongQuestionSet
      analysisQuestionCatalog={catalog}
      configData={{ hasAnswer: true, ...configData }}
      edit={false}
      spinning={false}
      studySituationByStudentIdList={{
        moduleModelList: [
          {
            modelCode: "WRONG_TOPIC_COLLECTION",
            modelShow: true,
            modelValue: {
              objectModelList: [{ objectContentList: [question] }],
            },
          },
        ],
      }}
    />,
  );

describe("WrongQuestionSet V2 response rendering", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders a persisted root answerJson through the canonical response renderer", () => {
    renderWrongQuestionSet({
      answerJson: '{"version":"1"}',
      questionId: 11674,
      studentAnswer: "legacy answer",
      type: 5,
    });

    expect(analysisQuestionPreview).toHaveBeenCalledWith(
      expect.objectContaining({
        answerJson: '{"version":"1"}',
        catalog,
        mode: "response",
        questionId: 11674,
      }),
    );
  });

  it("renders a persisted child answerJson by the frozen child questionId", () => {
    renderWrongQuestionSet({
      questionId: 9000,
      sonQuestionList: [
        {
          answerJson: '{"version":"1","children":[]}',
          questionId: 9001,
          questionSerialNumber: "1.1",
          studentAnswer: "legacy child answer",
        },
      ],
      type: 6,
    });

    expect(analysisQuestionPreview).toHaveBeenCalledWith(
      expect.objectContaining({
        answerJson: '{"version":"1","children":[]}',
        catalog,
        mode: "response",
        questionId: 9001,
      }),
    );
  });

  it("keeps a recommendation visible when it is outside the frozen paper catalog", () => {
    catalog.findQuestion.mockImplementation(
      (questionId) => questionId !== 7001,
    );
    renderWrongQuestionSet(
      {
        personalityQuestionList: [
          {
            content: "Recommended legacy question",
            questionId: 7001,
          },
        ],
        questionId: 11675,
        type: 1,
      },
      { hasPersonalizedPractice: true },
    );

    expect(questionShow).toHaveBeenCalledWith(
      expect.objectContaining({
        question: expect.objectContaining({ questionId: 7001 }),
      }),
    );
  });
});
