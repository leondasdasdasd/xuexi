/** @jest-environment node */

import React from "react";

jest.mock("components/InputQuestion/SingleInput", () => () => null);
jest.mock("../../services/inputQuestion", () => ({
  queryChapter: jest.fn(),
  queryLabel: jest.fn(),
  queryTree: jest.fn(),
}));

import { TwoWayTest } from "./index";
import QuestionPlacementMoveActions from "./QuestionPlacementMoveActions";
import { buildBlankAssociationStrategy } from "./virtualAssociationGroups";

const findReactElements = (value, predicate, matches = []) => {
  if (Array.isArray(value)) {
    value.forEach((item) => findReactElements(item, predicate, matches));
    return matches;
  }
  if (!React.isValidElement(value)) return matches;
  if (predicate(value)) matches.push(value);
  React.Children.forEach(value.props.children, (child) =>
    findReactElements(child, predicate, matches),
  );
  return matches;
};

const createInstance = (questionList) => {
  const instance = new TwoWayTest({
    allGradeList: [],
    dispatch: jest.fn(),
    history: { location: { pathname: "/twoWayTest" } },
  });
  instance.state = {
    ...instance.state,
    gradeId: 7,
    questionTypeList: [{ moduleName: "填空题", questionList }],
    subjectId: 13,
    type: 1,
  };
  instance.setState = (patch) => {
    instance.state = {
      ...instance.state,
      ...(typeof patch === "function" ? patch(instance.state) : patch),
    };
  };
  instance.renderNo = (moduleIndex, questionIndex) =>
    moduleIndex + questionIndex + 1;
  return instance;
};

const createBlankPlacement = (blankOrder) => ({
  associationSourceSnapshot: { questionId: 10 },
  associationStrategy: buildBlankAssociationStrategy({
    blankId: `blank-${blankOrder}`,
    blankOrder,
  }),
  checked: false,
  label: `blank-${blankOrder}`,
});

describe("TwoWayTest question placement ordering", () => {
  it("renders boundary actions only for movable unit leaders without drag props", () => {
    const instance = createInstance([
      createBlankPlacement(0),
      createBlankPlacement(1),
      { checked: false, label: "ordinary" },
    ]);
    const tree = instance.render();
    const actions = findReactElements(
      tree,
      (element) => element.type === QuestionPlacementMoveActions,
    );
    const legacyDragRows = findReactElements(tree, (element) =>
      [
        "draggable",
        "onDragEnter",
        "onDragLeave",
        "onDragOver",
        "onDragStart",
        "onDrop",
      ].some((propertyName) => propertyName in element.props),
    );

    expect(actions).toHaveLength(2);
    expect(actions[0].props).toMatchObject({
      canMoveDown: true,
      canMoveUp: false,
    });
    expect(actions[1].props).toMatchObject({
      canMoveDown: false,
      canMoveUp: true,
    });
    expect(legacyDragRows).toHaveLength(0);
  });

  it("refreshes the moved module plans and keeps state in save order", () => {
    const instance = createInstance([
      { label: "A" },
      createBlankPlacement(0),
      createBlankPlacement(1),
    ]);
    instance.state.checkChild = 1;
    instance.state.checkParent = 0;
    instance.refreshAssociationPlanForQuestion = jest.fn(
      (question) => question,
    );

    instance.moveQuestionPlacement(0, 1, "up");

    expect(
      instance.state.questionTypeList[0].questionList.map(({ label }) => label),
    ).toEqual(["blank-0", "blank-1", "A"]);
    expect(instance.state.checkChild).toBe(0);
    expect(instance.refreshAssociationPlanForQuestion.mock.calls).toEqual([
      [expect.objectContaining({ label: "blank-0" }), 0, 0],
      [expect.objectContaining({ label: "blank-1" }), 0, 1],
      [expect.objectContaining({ label: "A" }), 0, 2],
    ]);
  });
});
