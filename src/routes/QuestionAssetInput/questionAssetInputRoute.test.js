/** @jest-environment node */

import {
  buildQuestionAssetInputCreatePath,
  parseQuestionAssetInputCreateScope,
} from "./questionAssetInputRoute.js";

describe("question asset input route", () => {
  it("builds a create path from the current teaching scope", () => {
    expect(
      buildQuestionAssetInputCreatePath({ gradeId: 7, subjectId: 13 }),
    ).toBe("/questionAssetInput?gradeId=7&subjectId=13");
  });

  it("parses a complete positive teaching scope", () => {
    expect(
      parseQuestionAssetInputCreateScope({ gradeId: "7", subjectId: "13" }),
    ).toEqual({ gradeId: 7, subjectId: 13 });
  });

  it.each([
    {},
    { gradeId: "7" },
    { gradeId: "0", subjectId: "13" },
    { gradeId: "bad", subjectId: "13" },
  ])("rejects an incomplete or invalid teaching scope", (query) => {
    expect(parseQuestionAssetInputCreateScope(query)).toBeUndefined();
  });
});
