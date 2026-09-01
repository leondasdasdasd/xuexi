import {
  QUESTION_TYPE_BLANK,
  QUESTION_TYPE_CHOICE,
} from "../domain/questionTaskShared";
import {
  applyQuestionOrderToPages,
  buildQuestionOrderAfterInsert,
  clearQuestionQualityCheck,
  createManualDraftId,
  reorderQuestionIds,
} from "./questionTaskQuestionMutationModel";

describe("QuestionTask question mutation model", () => {
  it("creates stable manual draft ids with the page key prefix", () => {
    expect(createManualDraftId("page-2")).toMatch(/^page-2-manual-/);
  });

  it("clears quality-check state recursively for subquestions", () => {
    const result = clearQuestionQualityCheck({
      aiQualityCheck: { status: "high" },
      qualityCheckResult: { reportMarkdown: "bad" },
      qualityCheckTaskErrorMessage: "error",
      qualityCheckTaskStatus: "FAILED",
      sonQuestionList: [
        {
          aiQualityCheck: { status: "low" },
          qualityCheckResult: { reportMarkdown: "child" },
          qualityCheckTaskErrorMessage: "child-error",
          qualityCheckTaskStatus: "FAILED",
        },
      ],
    });

    expect(result).toMatchObject({
      aiQualityCheck: undefined,
      qualityCheckResult: undefined,
      qualityCheckTaskErrorMessage: "",
      qualityCheckTaskStatus: undefined,
    });
    expect(result.sonQuestionList[0]).toMatchObject({
      aiQualityCheck: undefined,
      qualityCheckResult: undefined,
      qualityCheckTaskErrorMessage: "",
      qualityCheckTaskStatus: undefined,
    });
  });

  it("reorders question ids around the target position", () => {
    expect(reorderQuestionIds(["q1", "q2", "q3"], "q1", "q3", "after")).toEqual(
      ["q2", "q3", "q1"],
    );
    expect(
      reorderQuestionIds(["q1", "q2", "q3"], "q3", "q1", "before"),
    ).toEqual(["q3", "q1", "q2"]);
  });

  it("keeps the original order when reorder input is invalid", () => {
    expect(reorderQuestionIds(["q1", "q2"], "q9", "q2")).toEqual(["q1", "q2"]);
  });

  it("inserts a new id before or after the anchor question", () => {
    expect(
      buildQuestionOrderAfterInsert(["q1", "q2"], "q1", "q-new", "before"),
    ).toEqual(["q-new", "q1", "q2"]);
    expect(
      buildQuestionOrderAfterInsert(["q1", "q2"], "q1", "q-new", "after"),
    ).toEqual(["q1", "q-new", "q2"]);
  });

  it("applies ordered sort numbers across pages while preserving page shape", () => {
    const result = applyQuestionOrderToPages(
      [
        {
          pageIndex: 0,
          questions: [
            { draftId: "q1", sortOrder: 8, type: QUESTION_TYPE_CHOICE },
            { draftId: "q2", sortOrder: 9, type: QUESTION_TYPE_BLANK },
          ],
        },
        {
          pageIndex: 1,
          questions: [
            { draftId: "q3", sortOrder: 7, type: QUESTION_TYPE_CHOICE },
          ],
        },
      ],
      ["q3", "q1", "q2"],
    );

    expect(result[0].questions.map((question) => question.sortOrder)).toEqual([
      1, 2,
    ]);
    expect(result[1].questions.map((question) => question.sortOrder)).toEqual([
      0,
    ]);
  });
});
