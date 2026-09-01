/** @jest-environment node */

import { InputNumber, Select } from "antd";
import React from "react";

jest.mock("components/InputQuestion/SingleInput", () => () => null);
jest.mock("../../services/inputQuestion", () => ({
  queryChapter: jest.fn(),
  queryLabel: jest.fn(),
  queryTree: jest.fn(),
}));

import { TwoWayTest } from "./index";
import { buildBlankAssociationStrategy } from "./virtualAssociationGroups";

const createInstance = (questionTypeList) => {
  const instance = new TwoWayTest({
    allGradeList: [],
    dispatch: jest.fn(),
    history: { location: { pathname: "/twoWayTest" } },
  });
  instance.state = {
    ...instance.state,
    childenQuestionNum: 0,
    gradeId: 7,
    prentQuestionNum: 0,
    questionTypeList,
    subjectId: 13,
    type: 1,
  };
  instance.setState = (patch) => {
    instance.state = {
      ...instance.state,
      ...(typeof patch === "function" ? patch(instance.state) : patch),
    };
  };
  return instance;
};

const createBlankPlacement = (blankOrder) => ({
  associationStrategy: buildBlankAssociationStrategy({
    blankId: `blank_${blankOrder}`,
    blankOrder,
  }),
  checked: false,
  questionScore: 1,
});

const findReactElements = (value, predicate, matches = []) => {
  if (Array.isArray(value)) {
    value.forEach((item) => findReactElements(item, predicate, matches));
    return matches;
  }
  if (!React.isValidElement(value)) return matches;
  if (predicate(value)) matches.push(value);
  Object.values(value.props).forEach((propertyValue) =>
    findReactElements(propertyValue, predicate, matches),
  );
  return matches;
};

describe("blank association attribute editing", () => {
  it("updates every editable attribute on a blank follower placement", () => {
    const instance = createInstance([
      { questionList: [createBlankPlacement(1)] },
    ]);

    instance.changeCheckScore(0, 0, 2);
    instance.changePrediction(0, 0, 0.4);
    instance.changeDifficult(0, 0, 3);
    instance.changeSource(0, 0, 2);
    instance.selectTree("chapter", {
      props: { eventKey: 11, titleStr: "第一章" },
    });
    instance.selectTree("knowledge", {
      props: { eventKey: 12, titleStr: "知识点" },
    });
    instance.selectTree("quality", {
      props: { eventKey: 13, titleStr: "素养" },
    });

    expect(instance.state.questionTypeList[0].questionList[0]).toEqual(
      expect.objectContaining({
        chapterId: [11],
        indicatorIds: [13],
        knowledgeIds: [12],
        predictionDifficulty: 0.4,
        questionLevelType: 3,
        questionScore: 2,
        sourceType: 2,
      }),
    );
  });

  it("keeps blank follower structure locked while attributes are editable", () => {
    const instance = createInstance([
      { questionList: [{ questionScore: 1 }, createBlankPlacement(1)] },
    ]);

    instance.onCheckChange(0, 1, { target: { checked: true } });
    instance.delChild(0, 1);

    expect(instance.state.questionTypeList[0].questionList).toHaveLength(2);
    expect(instance.state.questionTypeList[0].questionList[1].checked).toBe(
      false,
    );
  });

  it("renders the seven field capabilities while keeping non-attribute UI locked", () => {
    const blankPlacement = {
      ...createBlankPlacement(1),
      chapterName: ["章节标记"],
      indicatorName: ["素养标记"],
      knowledge: ["知识点标记"],
      predictionDifficulty: 0.37,
      questionLevelType: 3,
      questionScore: 7,
      sourceType: 2,
    };
    const instance = createInstance([
      { moduleName: "填空题", questionList: [blankPlacement] },
    ]);

    const tree = instance.render();
    const editableScalarControls = findReactElements(
      tree,
      (element) =>
        (element.type === InputNumber &&
          [7, 0.37].includes(element.props.value)) ||
        (element.type === Select &&
          ["选择难易", "选择来源"].includes(element.props.placeholder)),
    );
    const editableTreeControls = findReactElements(tree, (element) =>
      ["章节标记", "知识点标记", "素养标记"].includes(element.props.text),
    );
    const lockedCheckboxes = findReactElements(
      tree,
      (element) =>
        element.props.checked === false && element.props.disabled === true,
    );

    expect(editableScalarControls).toHaveLength(4);
    expect(editableTreeControls).toHaveLength(3);
    editableTreeControls.forEach((control) =>
      expect(control.props.handelClick).toEqual(expect.any(Function)),
    );
    expect(lockedCheckboxes.length).toBeGreaterThanOrEqual(1);
    expect(
      instance.isAssociationAttributeEditBlocked(blankPlacement, "checked", {
        requireSelection: false,
      }),
    ).toBe(true);
  });

  it("updates blank child attributes and synchronizes the parent score", () => {
    const instance = createInstance([
      {
        questionList: [
          {
            questionScore: 2,
            sonQuestionList: [createBlankPlacement(0), { questionScore: 1 }],
          },
        ],
      },
    ]);

    instance.changeDescendantField(0, 0, [0], "questionScore", 3);
    instance.changeDescendantField(0, 0, [0], "predictionDifficulty", 0.6);

    const root = instance.state.questionTypeList[0].questionList[0];
    expect(root.questionScore).toBe(4);
    expect(root.sonQuestionList[0]).toEqual(
      expect.objectContaining({
        predictionDifficulty: 0.6,
        questionScore: 3,
      }),
    );
  });
});
