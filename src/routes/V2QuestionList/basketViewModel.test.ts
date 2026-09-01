import { getNewMyQuestionBasketCount } from "./basketViewModel";

describe("newMyQuestion basket view model", () => {
  it("derives the total from the visible basket subjects", () => {
    expect(
      getNewMyQuestionBasketCount([
        { subjectQuestionNum: 1 },
        { subjectQuestionNum: 2 },
      ]),
    ).toBe(3);
  });

  it("returns zero for an empty basket response", () => {
    expect(getNewMyQuestionBasketCount()).toBe(0);
  });
});
