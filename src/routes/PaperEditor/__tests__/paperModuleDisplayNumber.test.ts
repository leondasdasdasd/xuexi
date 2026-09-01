import { getPaperModuleDisplayNumber } from "../../../common/paperModuleDisplayNumber";

describe("paper module display number", () => {
  it.each([
    [0, "一、"],
    [1, "二、"],
    [9, "十、"],
  ])("formats Chinese module index %i", (moduleIndex, expected) => {
    expect(getPaperModuleDisplayNumber(moduleIndex, "zh-CN")).toBe(expected);
  });

  it.each([
    [0, "I."],
    [3, "IV."],
    [9, "X."],
  ])("formats English module index %i", (moduleIndex, expected) => {
    expect(getPaperModuleDisplayNumber(moduleIndex, "en-US")).toBe(expected);
  });
});
