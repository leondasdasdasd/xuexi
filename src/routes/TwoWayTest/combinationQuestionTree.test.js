/** @jest-environment node */

import {
  buildCombinationLeafAssociationPlan,
  buildLeafAssociationStrategy,
  collectCombinationLeafQuestions,
} from "./combinationQuestionTree";

describe("combinationQuestionTree", () => {
  it("collects leaves from an uneven recursive tree in server order", () => {
    const root = {
      id: 1,
      children: [
        { id: 2, children: [] },
        {
          id: 3,
          children: [
            { id: 4, children: [] },
            { id: 5, children: [{ id: 6, children: [] }] },
          ],
        },
      ],
    };

    expect(collectCombinationLeafQuestions(root)).toEqual([
      { nodePath: [1, 2], question: root.children[0] },
      { nodePath: [1, 3, 4], question: root.children[1].children[0] },
      {
        nodePath: [1, 3, 5, 6],
        question: root.children[1].children[1].children[0],
      },
    ]);
  });

  it("rejects a tree when any node lacks a stable id", () => {
    expect(
      collectCombinationLeafQuestions({
        id: 1,
        children: [{ children: [] }],
      }),
    ).toBeNull();
  });

  it("builds the leaf association contract", () => {
    expect(
      buildLeafAssociationStrategy({
        nodePath: [1, 3, 5],
        questionId: 5,
      }),
    ).toEqual({
      nodePath: [1, 3, 5],
      type: "leaf",
    });
  });

  it("rejects a path that does not end at the associated leaf", () => {
    expect(
      buildLeafAssociationStrategy({
        nodePath: [1, 3, 5],
        questionId: 6,
      }),
    ).toBeNull();
  });

  it("rejects a path containing a non-positive question id", () => {
    expect(
      buildLeafAssociationStrategy({
        nodePath: [1, 0, 5],
        questionId: 5,
      }),
    ).toBeNull();
  });

  it("rejects the whole association plan before changing any target", () => {
    const target = { questionId: 88 };
    const questionTypeList = [{ questionList: [target] }];

    expect(
      buildCombinationLeafAssociationPlan({
        leaves: [{ nodePath: [1, 3], question: { id: 4 } }],
        questionTypeList,
        targetOptions: [{ moduleIndex: 0, questionIndex: 0 }],
      }),
    ).toBeNull();
    expect(target).toEqual({ questionId: 88 });
  });

  it("builds a complete plan for every valid leaf", () => {
    const target = {};

    expect(
      buildCombinationLeafAssociationPlan({
        leaves: [{ nodePath: [1, 3, 4], question: { id: 4 } }],
        questionTypeList: [{ questionList: [target] }],
        targetOptions: [{ moduleIndex: 0, questionIndex: 0 }],
      }),
    ).toEqual([
      {
        leafQuestion: { id: 4 },
        leafQuestionId: 4,
        strategy: { nodePath: [1, 3, 4], type: "leaf" },
        target,
      },
    ]);
  });
});
