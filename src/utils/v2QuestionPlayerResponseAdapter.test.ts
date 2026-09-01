/** @jest-environment node */

import type { QuestionPlayerResponse } from "@yungu-fed/question-editor";

import { mapV2AnswerJsonToQuestionPlayerResponse } from "./v2QuestionPlayerResponseAdapter";

const emptyResponse: QuestionPlayerResponse = {
  children: [],
  elementAnswers: [{ answers: [], type: "fill" }],
  id: 7,
  questionTypeKey: 1,
  version: "1",
};

const answerJson = (elementAnswers: unknown[]) =>
  JSON.stringify({
    businessQuestionTypeId: 1,
    children: [],
    elementAnswers,
    id: 7,
    version: "1",
  });

describe("mapV2AnswerJsonToQuestionPlayerResponse", () => {
  it("accepts the question-editor 0.4 fill response contract", () => {
    const response = mapV2AnswerJsonToQuestionPlayerResponse(
      answerJson([
        {
          answers: [
            {
              blankId: "B1",
              content: { html: "42", json: [], text: "42" },
            },
          ],
          type: "fill",
        },
      ]),
      emptyResponse,
    );

    expect(response.elementAnswers).toEqual([
      {
        answers: [
          {
            blankId: "B1",
            content: { html: "42", json: [], text: "42" },
          },
        ],
        type: "fill",
      },
    ]);
  });

  it("rejects the question-editor 0.3 fill response contract", () => {
    expect(() =>
      mapV2AnswerJsonToQuestionPlayerResponse(
        answerJson([
          {
            answers: [
              {
                answerPools: [{ html: "42", json: [], text: "42" }],
                blankIds: ["B1"],
              },
            ],
            type: "fill",
          },
        ]),
        emptyResponse,
      ),
    ).toThrow();
  });
});
