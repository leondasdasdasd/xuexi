import { createAntTreeSelectOptionsFromInputQuestionTree } from "./inputQuestionTreeSelectAdapter.js";

describe("input question tree select adapter", () => {
  it("maps inputQuestion tree DTOs to Ant TreeSelect options recursively", () => {
    expect(
      createAntTreeSelectOptionsFromInputQuestionTree([
        {
          children: [{ id: "11", name: "一元一次方程" }],
          id: 10,
          name: "方程",
        },
      ]),
    ).toEqual([
      {
        children: [
          {
            children: [],
            key: 11,
            title: "一元一次方程",
            value: 11,
          },
        ],
        key: 10,
        title: "方程",
        value: 10,
      },
    ]);
  });
});
