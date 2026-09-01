import { render, screen } from "@testing-library/react";
import React from "react";

import AnswerTable from ".";

const analysisQuestionPreview = jest.fn(() => <div>V2 student response</div>);

jest.mock(
  "../../routes/DataAnalysis/components/AnalysisQuestionPreview",
  () => (properties) => analysisQuestionPreview(properties),
);

describe("AnswerTable V2 response rendering", () => {
  beforeEach(() => jest.clearAllMocks());

  it("passes the persisted answerJson to the canonical response renderer", () => {
    const catalog = { requireQuestion: jest.fn() };
    render(
      <AnswerTable
        analysisQuestionCatalog={catalog}
        arrangeKey={0}
        dataList={[
          {
            answerJson: '{"version":"1"}',
            score: "2",
            studentAnswerContent: "<p>legacy answer</p>",
            studentId: 52315,
            studentName: "Student",
          },
        ]}
        questionId={4711}
      />,
    );

    expect(screen.getByText("V2 student response")).toBeInTheDocument();
    expect(analysisQuestionPreview).toHaveBeenCalledWith(
      expect.objectContaining({
        answerJson: '{"version":"1"}',
        catalog,
        mode: "response",
        questionId: 4711,
      }),
    );
    expect(screen.queryByText("legacy answer")).not.toBeInTheDocument();
  });

  it("renders an odd multicolumn response list with stable React keys", () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    render(
      <AnswerTable
        analysisQuestionCatalog={{ requireQuestion: jest.fn() }}
        arrangeKey={1}
        dataList={[
          {
            answerJson: '{"version":"1"}',
            score: "2",
            studentId: 52315,
            studentName: "Student",
          },
        ]}
        questionId={4711}
      />,
    );

    expect(
      consoleError.mock.calls.some(([message]) =>
        String(message).includes('unique "key" prop'),
      ),
    ).toBe(false);
    consoleError.mockRestore();
  });
});
