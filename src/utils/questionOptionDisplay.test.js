import {
  getIndexedOptionKey,
  getQuestionOptionDisplayKey,
} from "./questionOptionDisplay";

describe("questionOptionDisplay", () => {
  it("uses the backend option key as the display key", () => {
    expect(getQuestionOptionDisplayKey({ key: "D" }, 0)).toBe("D");
  });

  it("falls back to indexed option keys when backend key is missing", () => {
    expect(getQuestionOptionDisplayKey({}, 0)).toBe("A");
    expect(getQuestionOptionDisplayKey({}, 3)).toBe("D");
  });

  it("keeps numeric overflow aligned with indexed option keys", () => {
    expect(getIndexedOptionKey(26)).toBe("27");
    expect(getQuestionOptionDisplayKey({}, 26)).toBe("27");
  });
});
