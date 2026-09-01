import { convertToChineseNumber } from "../utils/utils";

const ROMAN_DIGITS: Array<[number, string]> = [
  [1000, "M"],
  [900, "CM"],
  [500, "D"],
  [400, "CD"],
  [100, "C"],
  [90, "XC"],
  [50, "L"],
  [40, "XL"],
  [10, "X"],
  [9, "IX"],
  [5, "V"],
  [4, "IV"],
  [1, "I"],
];

const toRomanNumber = (number: number): string => {
  let remaining = number;
  let result = "";
  for (const [value, digit] of ROMAN_DIGITS) {
    while (remaining >= value) {
      result += digit;
      remaining -= value;
    }
  }
  return result;
};

/**
 * 根据试卷模块顺序生成本地化展示序号。
 * @param {number} moduleIndex 从零开始的模块顺序。
 * @param {"en-US" | "zh-CN"} locale 试卷展示语言。
 * @returns {string} 带本地化分隔符的模块序号。
 */
export const getPaperModuleDisplayNumber = (
  moduleIndex: number,
  locale: "en-US" | "zh-CN",
): string =>
  locale === "en-US"
    ? `${toRomanNumber(moduleIndex + 1)}.`
    : `${convertToChineseNumber(moduleIndex + 1)}、`;
