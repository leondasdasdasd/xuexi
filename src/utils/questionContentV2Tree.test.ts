import { collectQuestionContentBusinessQuestionTypeIds } from "./questionContentV2Tree";

describe("question content v2 tree", () => {
  it("collects nested business question type ids once in tree order", () => {
    expect(
      collectQuestionContentBusinessQuestionTypeIds([
        {
          businessQuestionTypeId: 106,
          children: [
            { businessQuestionTypeId: 101, children: [] },
            { businessQuestionTypeId: 102, children: [] },
          ],
        },
        { businessQuestionTypeId: 101, children: [] },
      ]),
    ).toEqual([106, 101, 102]);
  });
});
