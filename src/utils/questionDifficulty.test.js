import {
  QUESTION_LEVEL_NORMAL,
  QUESTION_LEVEL_OPTIONS,
  getQuestionLevelLabel,
} from "./questionDifficulty.js";

describe("question difficulty", () => {
  it("provides the shared difficulty values and localized labels", () => {
    expect(QUESTION_LEVEL_NORMAL).toBe(2);
    expect(QUESTION_LEVEL_OPTIONS.map((option) => option.value)).toEqual([
      1, 2, 3,
    ]);
    expect(getQuestionLevelLabel(3)).toBe("困难");
  });
});
