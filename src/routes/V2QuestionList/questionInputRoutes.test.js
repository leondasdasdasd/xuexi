import {
  NEW_MY_QUESTION_INPUT_ROUTE_ITEMS,
  buildNewMyQuestionInputPath,
  buildNewMyQuestionPaperEditorPath,
} from "./questionInputRoutes.js";

describe("new my question input routes", () => {
  it("only keeps the v2 question asset input in the new question bank", () => {
    expect(
      NEW_MY_QUESTION_INPUT_ROUTE_ITEMS.map((item) => item.pathName),
    ).toEqual(["questionAssetInput"]);
  });

  it("builds the empty-state create route without an edit id", () => {
    expect(
      NEW_MY_QUESTION_INPUT_ROUTE_ITEMS.map((item) =>
        buildNewMyQuestionInputPath(item),
      ),
    ).toEqual(["/questionAssetInput"]);
  });

  it("builds the edit input route with the question id", () => {
    expect(
      buildNewMyQuestionInputPath(NEW_MY_QUESTION_INPUT_ROUTE_ITEMS[0], 341),
    ).toBe("/questionAssetInput/341");
  });

  it("builds the v2 paper editor route from the basket subject", () => {
    expect(buildNewMyQuestionPaperEditorPath(2)).toBe(
      "/paperEditor?subjectId=2",
    );
  });
});
