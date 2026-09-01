import {
  AI_TASK_STATUS_RUNNING,
  DEFAULT_MANUAL_OPTION_KEYS,
  QUESTION_TYPE_BLANK,
  QUESTION_TYPE_CHOICE,
  QUESTION_TYPE_COMBINATION,
  QUESTION_TYPE_JUDGE,
  getOptionKey,
  getQuestionDisplayNumber,
  isAiTaskRunningStatus,
  isBlankQuestionType,
  isChoiceQuestionType,
  isCombinationQuestionType,
  isJudgeQuestionType,
} from "./questionTaskShared";

describe("QuestionTask shared domain rules", () => {
  it("derives default manual option keys from the canonical option list", () => {
    expect(DEFAULT_MANUAL_OPTION_KEYS).toEqual(["A", "B", "C", "D"]);
  });

  it("builds stable option keys with alphabet fallback and numeric overflow", () => {
    expect(getOptionKey(0)).toBe("A");
    expect(getOptionKey(3)).toBe("D");
    expect(getOptionKey(26)).toBe("27");
  });

  it("calculates display question numbers with explicit number, sort fallback, and index fallback", () => {
    expect(
      getQuestionDisplayNumber({
        displayQuestionNumber: "8",
        displayQuestionSort: 1,
      }),
    ).toBe("8");
    expect(
      getQuestionDisplayNumber({
        displayQuestionSort: 4,
      }),
    ).toBe(5);
    expect(getQuestionDisplayNumber({}, 2)).toBe(3);
    expect(
      getQuestionDisplayNumber({}, 2, {
        fallbackToIndex: false,
      }),
    ).toBe("");
  });

  it("keeps canonical type predicates aligned with shared constants", () => {
    expect(isChoiceQuestionType(QUESTION_TYPE_CHOICE)).toBe(true);
    expect(isBlankQuestionType(QUESTION_TYPE_BLANK)).toBe(true);
    expect(isJudgeQuestionType(QUESTION_TYPE_JUDGE)).toBe(true);
    expect(isCombinationQuestionType(QUESTION_TYPE_COMBINATION)).toBe(true);
    expect(isChoiceQuestionType(QUESTION_TYPE_COMBINATION)).toBe(false);
  });

  it("exposes one shared AI running status set and predicate", () => {
    expect(AI_TASK_STATUS_RUNNING.has("PENDING")).toBe(true);
    expect(isAiTaskRunningStatus("PROCESSING")).toBe(true);
    expect(isAiTaskRunningStatus("SUCCEEDED")).toBe(false);
  });
});
