import {
  collectRunningQuestionIds,
  collectRunningQuestionUuids,
  isQuestionAiTaskRunning,
} from "./questionTaskRunningState";

describe("QuestionTask running state selectors", () => {
  const questions = [
    {
      analysisTaskStatus: "PENDING",
      draftId: "q-1",
      qualityCheckTaskStatus: undefined,
      uuid: "uuid-1",
    },
    {
      analysisTaskStatus: "SUCCEEDED",
      draftId: "q-2",
      qualityCheckTaskStatus: "PROCESSING",
      uuid: "uuid-2",
    },
    {
      analysisTaskStatus: "FAILED",
      draftId: "q-3",
      qualityCheckTaskStatus: "SUCCEEDED",
      uuid: "uuid-3",
    },
  ];

  it("detects whether a question still has any running AI task", () => {
    expect(isQuestionAiTaskRunning(questions[0])).toBe(true);
    expect(isQuestionAiTaskRunning(questions[1])).toBe(true);
    expect(isQuestionAiTaskRunning(questions[2])).toBe(false);
  });

  it("collects running uuids by task status field", () => {
    expect(
      collectRunningQuestionUuids(questions, "analysisTaskStatus"),
    ).toEqual(["uuid-1"]);
    expect(
      collectRunningQuestionUuids(questions, "qualityCheckTaskStatus"),
    ).toEqual(["uuid-2"]);
  });

  it("collects running question ids across both analysis and quality tasks", () => {
    expect(collectRunningQuestionIds(questions)).toEqual(["q-1", "q-2"]);
  });
});
