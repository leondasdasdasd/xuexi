import { InputNumber, message } from "antd";
import React from "react";

import {
  createSegmentationPaper,
  updateSegmentationPaper,
} from "../../services/segmentationPaperV2";
import { TwoWayTest } from "./index";
import {
  ASSOCIATION_STRATEGY_TYPES,
  BLANK_ASSOCIATION_NUMBERING_MODE,
  buildAssociationStrategy,
} from "./virtualAssociationGroups";

jest.mock("../../services/inputQuestion", () => ({
  ...jest.requireActual("../../services/inputQuestion"),
  queryChapter: jest.fn().mockResolvedValue({ content: [], status: true }),
  queryTree: jest.fn().mockResolvedValue({ content: [], status: true }),
}));

jest.mock("../../services/segmentationPaperV2", () => ({
  ...jest.requireActual("../../services/segmentationPaperV2"),
  createSegmentationPaper: jest.fn(),
  updateSegmentationPaper: jest.fn(),
}));

const prepareSave = (instance) => {
  instance.state = {
    ...instance.state,
    gradeId: 7,
    subjectId: 13,
    type: 1,
    questionTypeList: [{ moduleName: "单选", questionList: [{ type: 1 }] }],
  };
  instance.renderTotal = () => 1;
  instance.renderNo = () => 1;
  instance.saveSuccess = jest.fn();
};

describe("TwoWayTest automatic save identity and concurrency", () => {
  beforeEach(() => {
    createSegmentationPaper.mockReset();
    updateSegmentationPaper.mockReset();
  });

  it("uses the created paper id for subsequent saves", async () => {
    const instance = createTwoWayTestInstance();
    prepareSave(instance);
    createSegmentationPaper.mockResolvedValue({
      status: true,
      content: { id: 123 },
    });
    updateSegmentationPaper.mockResolvedValue({
      status: true,
      content: { id: 123 },
    });

    await instance.save();
    await instance.save();

    expect(createSegmentationPaper).toHaveBeenCalledTimes(1);
    expect(updateSegmentationPaper).toHaveBeenCalledWith(
      123,
      expect.any(Object),
    );
  });

  it("keeps only one save in flight and runs one queued save", async () => {
    const instance = createTwoWayTestInstance();
    prepareSave(instance);
    let resolveCreate;
    createSegmentationPaper.mockReturnValue(
      new Promise((resolve) => {
        resolveCreate = resolve;
      }),
    );
    updateSegmentationPaper.mockResolvedValue({
      status: true,
      content: { id: 456 },
    });

    const firstSave = instance.save();
    const queuedSave = instance.save();
    expect(createSegmentationPaper).toHaveBeenCalledTimes(1);
    resolveCreate({ status: true, content: { id: 456 } });
    await firstSave;
    await queuedSave;
    await Promise.resolve();

    expect(createSegmentationPaper).toHaveBeenCalledTimes(1);
    expect(updateSegmentationPaper).toHaveBeenCalledTimes(1);
  });

  it("keeps the preview callback when its save is queued", async () => {
    const instance = createTwoWayTestInstance();
    prepareSave(instance);
    let resolveCreate;
    createSegmentationPaper.mockReturnValue(
      new Promise((resolve) => {
        resolveCreate = resolve;
      }),
    );
    updateSegmentationPaper.mockResolvedValue({
      status: true,
      content: { id: 456 },
    });
    const previewCallback = jest.fn();

    const automaticSave = instance.save();
    instance.save(previewCallback);
    resolveCreate({ status: true, content: { id: 456 } });
    await automaticSave;
    await Promise.resolve();
    await Promise.resolve();

    expect(updateSegmentationPaper).toHaveBeenCalledTimes(1);
    expect(previewCallback).toHaveBeenCalledWith(
      expect.objectContaining({
        content: { paperId: 456, saveSuccess: true },
      }),
    );
  });
});

const SOURCE_QUESTION_ID = "source-1";
const SOURCE_COMBINATION_ID = 900;
const SOURCE_COMBINATION_CHILD_ID = 901;

const createTwoWayTestInstance = (unusedArguments = []) => {
  void unusedArguments;

  const instance = new TwoWayTest({
    allGradeList: [
      { gradeId: 7, stageId: 2 },
      { gradeId: 8, stageId: 2 },
      { gradeId: 10, stageId: 3 },
    ],
    dispatch: jest.fn(),
    history: {
      location: {
        pathname: "/twoWayTest",
      },
      push: jest.fn(),
    },
  });

  instance.setState = (patch, callback) => {
    instance.state = {
      ...instance.state,
      ...(typeof patch === "function" ? patch(instance.state) : patch),
    };
    callback?.();
  };
  instance.renderNo = (index, ind) =>
    instance.state.questionTypeList
      .slice(0, index)
      .reduce((total, item) => total + item.questionList.length, 0) +
    ind +
    1;

  return instance;
};

const expectAssociationModalToStayOpenAfterSingleAssociation = (
  unusedArguments = [],
) => {
  void unusedArguments;

  const instance = createTwoWayTestInstance();
  const sourceQuestion = {
    id: SOURCE_COMBINATION_ID,
    sonQuestionList: [{ id: SOURCE_COMBINATION_CHILD_ID }],
    type: 6,
  };

  instance.state = {
    ...instance.state,
    childenQuestionNum: 0,
    modalStatus: true,
    prentQuestionNum: 0,
    questionTypeList: [
      {
        questionList: [
          {
            type: 1,
          },
        ],
      },
    ],
  };
  jest.spyOn(message, "success").mockImplementation((messageArguments = []) => {
    void messageArguments;
  });
  instance.questionNumChange = jest.fn();

  instance.applyCombinationAsSingleAssociation(sourceQuestion);

  expect(instance.state.modalStatus).toBe(true);
  expect(instance.questionNumChange).not.toHaveBeenCalled();
  expect(instance.state.questionTypeList[0].questionList[0]).toEqual(
    expect.objectContaining({
      questionId: SOURCE_COMBINATION_ID,
    }),
  );
};

const createAssociationQuestionList = (count) => [
  {
    questionList: Array.from({ length: count }).map(() => ({
      type: 1,
    })),
  },
];

const createQuestion = (questionId) => ({
  questionId,
  type: 1,
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

describe("TwoWayTest association modal", () => {
  it("opens QuestionAssetInput with the current grade and subject", () => {
    const instance = createTwoWayTestInstance();
    instance.state = {
      ...instance.state,
      gradeId: 7,
      subjectId: 13,
    };

    instance.addQuestion();

    expect(instance.props.history.push).toHaveBeenCalledWith(
      "/questionAssetInput?gradeId=7&subjectId=13",
    );
  });

  it("moves a placement unit within its module and keeps the selected question", () => {
    const instance = createTwoWayTestInstance();
    const questionTypeList = [
      {
        questionList: [
          { label: "A" },
          {
            associationSourceSnapshot: { questionId: 10 },
            associationStrategy: { blankOrder: 0, type: "blank" },
            label: "B0",
          },
          {
            associationSourceSnapshot: { questionId: 10 },
            associationStrategy: { blankOrder: 1, type: "blank" },
            label: "B1",
          },
        ],
      },
      { questionList: [{ label: "other module" }] },
    ];
    instance.state = {
      ...instance.state,
      checkChild: 1,
      checkParent: 0,
      questionTypeList,
    };

    instance.moveQuestionPlacement(0, 1, "up");

    expect(
      instance.state.questionTypeList[0].questionList.map(({ label }) => label),
    ).toEqual(["B0", "B1", "A"]);
    expect(instance.state.questionTypeList[1].questionList).toEqual(
      questionTypeList[1].questionList,
    );
    expect(instance.state.checkChild).toBe(0);
  });

  it("loads candidate question types independently for the selected grade", async () => {
    const instance = createTwoWayTestInstance();
    const candidateQuestionTypes = [
      { businessQuestionTypeId: 12, label: "候选题型" },
    ];
    const enabledQuestionTypes = [
      { businessQuestionTypeId: 8, label: "题位题型" },
    ];
    instance.state = {
      ...instance.state,
      enabledQuestionTypes,
      searchGradeId: 7,
      subjectId: 13,
    };
    instance.fetchQuestionTypeRegistry = jest.fn().mockResolvedValue({
      contextKey: "2:13",
      enabledQuestionTypes: candidateQuestionTypes,
    });

    await instance.loadCandidateQuestionTypes(7);

    expect(instance.fetchQuestionTypeRegistry).toHaveBeenCalledWith({
      stageId: 2,
      subjectId: 13,
    });
    expect(instance.state.candidateQuestionTypes).toEqual(
      candidateQuestionTypes,
    );
    expect(instance.state.enabledQuestionTypes).toBe(enabledQuestionTypes);
  });

  it("reloads candidate question types and resets the selected type when the grade changes", () => {
    const instance = createTwoWayTestInstance();
    instance.getBindableQuestions = jest.fn();
    instance.loadCandidateQuestionTypes = jest.fn();
    instance.state = {
      ...instance.state,
      candidateQuestionTypes: [{ businessQuestionTypeId: 12 }],
      searchGradeId: 7,
      searchQuestionType: 12,
    };

    instance.searchChange("grade", 10);

    expect(instance.state.searchGradeId).toBe(10);
    expect(instance.state.searchQuestionType).toBe(0);
    expect(instance.state.candidateQuestionTypes).toEqual([]);
    expect(instance.getBindableQuestions).toHaveBeenCalledTimes(1);
    expect(instance.loadCandidateQuestionTypes).toHaveBeenCalledWith(10);
  });

  it("renders only concrete grades in the candidate grade filter", () => {
    const instance = createTwoWayTestInstance();
    instance.state = {
      ...instance.state,
      searchGradeId: 7,
    };

    const [candidateGradeSelect] = findReactElements(
      instance.render(),
      (element) =>
        element.props.value === 7 && element.props.style?.width === "100px",
    );
    const gradeOptions = React.Children.toArray(
      candidateGradeSelect.props.children,
    );

    expect(gradeOptions.map((option) => option.props.value)).toEqual([
      7, 8, 10,
    ]);
    expect(gradeOptions.map((option) => option.props.children)).not.toContain(
      "全部年级",
    );
  });

  it("applies only the latest candidate question type response", async () => {
    const instance = createTwoWayTestInstance();
    let resolveFirstRequest;
    let resolveSecondRequest;
    const firstRequest = new Promise((resolve) => {
      resolveFirstRequest = resolve;
    });
    const secondRequest = new Promise((resolve) => {
      resolveSecondRequest = resolve;
    });
    instance.state = {
      ...instance.state,
      searchGradeId: 7,
      subjectId: 13,
    };
    instance.fetchQuestionTypeRegistry = jest
      .fn()
      .mockReturnValueOnce(firstRequest)
      .mockReturnValueOnce(secondRequest);

    const firstLoad = instance.loadCandidateQuestionTypes(7);
    instance.state.searchGradeId = 10;
    const secondLoad = instance.loadCandidateQuestionTypes(10);
    resolveSecondRequest({
      contextKey: "3:13",
      enabledQuestionTypes: [{ businessQuestionTypeId: 10 }],
    });
    await secondLoad;
    resolveFirstRequest({
      contextKey: "2:13",
      enabledQuestionTypes: [{ businessQuestionTypeId: 7 }],
    });
    await firstLoad;

    expect(instance.state.candidateQuestionTypes).toEqual([
      { businessQuestionTypeId: 10 },
    ]);
    expect(instance.state.candidateQuestionTypeContextKey).toBe("3:13");
  });

  it("keeps slot question types when loading candidate question types fails", async () => {
    const instance = createTwoWayTestInstance();
    const enabledQuestionTypes = [{ businessQuestionTypeId: 8 }];
    instance.state = {
      ...instance.state,
      enabledQuestionTypes,
      searchGradeId: 7,
      subjectId: 13,
    };
    instance.fetchQuestionTypeRegistry = jest
      .fn()
      .mockRejectedValue(new Error("request failed"));
    jest.spyOn(message, "error").mockImplementation(() => undefined);

    await instance.loadCandidateQuestionTypes(7);

    expect(instance.state.candidateQuestionTypes).toEqual([]);
    expect(instance.state.candidateQuestionTypeLoadError).toBeTruthy();
    expect(instance.state.enabledQuestionTypes).toBe(enabledQuestionTypes);
    expect(message.error).toHaveBeenCalledTimes(1);
  });

  it("loads candidate question types when opening the association modal", () => {
    const instance = createTwoWayTestInstance();
    instance.getBindableQuestions = jest.fn();
    instance.loadCandidateQuestionTypes = jest.fn();
    instance.state = {
      ...instance.state,
      gradeId: 7,
      questionTypeList: [{ questionList: [{ type: 1 }] }],
      subjectId: 13,
    };

    instance.openJoinQuestionModal(0, 0, [], true);

    expect(instance.state.searchGradeId).toBe(7);
    expect(instance.getBindableQuestions).toHaveBeenCalledTimes(1);
    expect(instance.loadCandidateQuestionTypes).toHaveBeenCalledWith(7);
  });

  beforeEach(() => {
    jest
      .spyOn(message, "success")
      .mockImplementation((messageArguments = []) => {
        void messageArguments;
      });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("keeps the question association modal open after linking a combination as one question", () => {
    expect.hasAssertions();
    expectAssociationModalToStayOpenAfterSingleAssociation();
  });

  it("selects the next unassociated question across later modules", () => {
    const instance = createTwoWayTestInstance();
    instance.questionNumChange = jest.fn();
    instance.state = {
      ...instance.state,
      childenQuestionNum: 1,
      prentQuestionNum: 0,
    };
    const questionTypeList = [
      {
        questionList: [
          createQuestion(SOURCE_QUESTION_ID),
          createQuestion("source-2"),
        ],
      },
      {
        questionList: [createQuestion("source-3"), createQuestion()],
      },
    ];

    instance.selectNextUnassociatedQuestion(questionTypeList, "source-2");

    expect(instance.questionNumChange).toHaveBeenCalledWith(1, 1);
    expect(instance.props.dispatch).not.toHaveBeenCalled();
  });

  it("refreshes the fallback linked question when all following questions are associated", () => {
    const instance = createTwoWayTestInstance();
    instance.questionNumChange = jest.fn();
    instance.state = {
      ...instance.state,
      childenQuestionNum: 1,
      prentQuestionNum: 0,
    };
    const questionTypeList = [
      {
        questionList: [
          createQuestion(SOURCE_QUESTION_ID),
          createQuestion("source-2"),
        ],
      },
      {
        questionList: [createQuestion("source-3")],
      },
    ];

    instance.selectNextUnassociatedQuestion(questionTypeList, "source-2");

    expect(instance.questionNumChange).not.toHaveBeenCalled();
    expect(instance.props.dispatch).toHaveBeenCalledWith({
      payload: {
        questionIds: "source-2",
      },
      type: "global/getListIds",
    });
  });

  it("moves to the next unassociated question after linking a combination as one question", () => {
    const instance = createTwoWayTestInstance();
    instance.questionNumChange = jest.fn();
    instance.state = {
      ...instance.state,
      childenQuestionNum: 0,
      modalStatus: true,
      prentQuestionNum: 0,
      questionTypeList: createAssociationQuestionList(2),
    };

    instance.applyCombinationAsSingleAssociation({
      id: SOURCE_COMBINATION_ID,
      sonQuestionList: [{ id: SOURCE_COMBINATION_CHILD_ID }],
      type: 6,
    });

    expect(instance.state.modalStatus).toBe(true);
    expect(instance.questionNumChange).toHaveBeenCalledWith(0, 1);
  });

  it("keeps the association modal open and moves past a combination range", () => {
    const instance = createTwoWayTestInstance();
    instance.questionNumChange = jest.fn();
    instance.state = {
      ...instance.state,
      childenQuestionNum: 0,
      combinationAssociationEndNo: 2,
      combinationAssociationSource: {
        id: SOURCE_COMBINATION_ID,
        sonQuestionList: [
          { id: SOURCE_COMBINATION_CHILD_ID },
          { id: "source-child-2" },
        ],
        type: 6,
      },
      combinationAssociationVisible: true,
      modalStatus: true,
      prentQuestionNum: 0,
      questionTypeList: createAssociationQuestionList(3),
    };

    instance.applyCombinationAssociation();

    expect(instance.state.modalStatus).toBe(true);
    expect(instance.state.combinationAssociationVisible).toBe(false);
    expect(instance.questionNumChange).toHaveBeenCalledWith(0, 2);
  });

  it("saves manually edited placement scores after leaf association", async () => {
    const instance = createTwoWayTestInstance();
    instance.testId = 77;
    instance.selectNextUnassociatedQuestion = jest.fn();
    instance.saveSuccess = jest.fn();
    instance.state = {
      ...instance.state,
      childenQuestionNum: 0,
      combinationAssociationEndNo: 2,
      combinationAssociationSource: {
        children: [
          {
            businessQuestionTypeId: 1,
            children: [],
            questionId: SOURCE_COMBINATION_CHILD_ID,
            questionScore: 1,
            type: 1,
          },
          {
            businessQuestionTypeId: 1,
            children: [],
            questionId: 902,
            questionScore: 1,
            type: 1,
          },
        ],
        questionId: SOURCE_COMBINATION_ID,
        type: 6,
      },
      gradeId: 7,
      isPreview: false,
      prentQuestionNum: 0,
      questionTypeList: [
        {
          moduleName: "单选题",
          questionList: [
            {
              businessQuestionTypeId: 1,
              chapterIds: [],
              indicatorIds: [],
              knowledgeIds: [],
              questionScore: 2,
              type: 1,
            },
            {
              businessQuestionTypeId: 1,
              chapterIds: [],
              indicatorIds: [],
              knowledgeIds: [],
              questionScore: 3,
              type: 1,
            },
          ],
        },
      ],
      subjectId: 14,
      titleValue: "细目表",
      type: 1,
    };
    updateSegmentationPaper.mockResolvedValueOnce({
      content: { id: 77 },
      status: true,
    });

    instance.applyCombinationAssociation();
    instance.changeCheckScore(0, 0, 2.5);
    instance.changeCheckScore(0, 1, 4.5);
    await instance.save();

    expect(updateSegmentationPaper).toHaveBeenCalledWith(
      77,
      expect.objectContaining({
        modules: [
          expect.objectContaining({
            questions: [
              expect.objectContaining({
                associationStrategy: {
                  nodePath: [
                    SOURCE_COMBINATION_ID,
                    SOURCE_COMBINATION_CHILD_ID,
                  ],
                  type: ASSOCIATION_STRATEGY_TYPES.leaf,
                },
                questionId: SOURCE_COMBINATION_CHILD_ID,
                questionScore: 2.5,
              }),
              expect.objectContaining({
                associationStrategy: {
                  nodePath: [SOURCE_COMBINATION_ID, 902],
                  type: ASSOCIATION_STRATEGY_TYPES.leaf,
                },
                questionId: 902,
                questionScore: 4.5,
              }),
            ],
          }),
        ],
      }),
    );
  });

  it("keeps the association modal open and moves past a blank association range", () => {
    const instance = createTwoWayTestInstance();
    instance.questionNumChange = jest.fn();
    instance.state = {
      ...instance.state,
      blankAssociationEndNo: 2,
      blankAssociationNumberingMode:
        BLANK_ASSOCIATION_NUMBERING_MODE.continuous,
      blankAssociationSource: {
        questionData: {
          elements: [{ blanks: ["blank_a", "blank_b"], type: "fill" }],
        },
        id: "source-blank",
        questionScore: 2,
        type: 3,
      },
      blankAssociationVisible: true,
      childenQuestionNum: 0,
      modalStatus: true,
      prentQuestionNum: 0,
      questionTypeList: createAssociationQuestionList(3),
    };

    instance.applyBlankAssociation();

    expect(instance.state.questionTypeList[0].questionList[0]).toMatchObject({
      associationStrategy: {
        blankId: "blank_a",
        blankOrder: 0,
        type: "blank",
      },
      questionScore: 1,
    });
    expect(instance.state.questionTypeList[0].questionList[1]).toMatchObject({
      associationStrategy: {
        blankId: "blank_b",
        blankOrder: 1,
        type: "blank",
      },
      questionScore: 1,
    });
    expect(instance.state.modalStatus).toBe(true);
    expect(instance.state.blankAssociationVisible).toBe(false);
    expect(instance.questionNumChange).toHaveBeenCalledWith(0, 2);
  });

  it("refreshes the linked question list when there is no next unassociated question", () => {
    const instance = createTwoWayTestInstance();
    instance.questionNumChange = jest.fn();
    instance.state = {
      ...instance.state,
      childenQuestionNum: 0,
      modalStatus: true,
      prentQuestionNum: 0,
      questionTypeList: createAssociationQuestionList(1),
    };

    instance.applyCombinationAsSingleAssociation({
      id: SOURCE_COMBINATION_ID,
      sonQuestionList: [{ id: SOURCE_COMBINATION_CHILD_ID }],
      type: 6,
    });

    expect(instance.questionNumChange).not.toHaveBeenCalled();
    expect(instance.props.dispatch).toHaveBeenCalledWith({
      payload: {
        questionIds: SOURCE_COMBINATION_ID,
      },
      type: "global/getListIds",
    });
  });

  it("renders a quick cancel button next to the linked question view action", () => {
    const instance = createTwoWayTestInstance();
    const children = React.Children.toArray(
      instance.renderAssociationOperationCell(
        { questionId: SOURCE_QUESTION_ID, type: 1 },
        0,
        0,
        false,
      ).props.children,
    );

    expect(children).toHaveLength(2);
    expect(children[1].props.children).toBe("×");
    expect(children[1].props.title).toBe("取消关联");
  });

  it("does not render the quick cancel button for unlinked or locked questions", () => {
    const instance = createTwoWayTestInstance();

    expect(
      React.Children.toArray(
        instance.renderAssociationOperationCell({ type: 1 }, 0, 0, false).props
          .children,
      ),
    ).toHaveLength(1);
    expect(
      instance.renderAssociationOperationCell(
        { questionId: SOURCE_QUESTION_ID, type: 1 },
        0,
        0,
        false,
        true,
      ).props.children,
    ).toBeUndefined();
  });

  it("stops row selection when clicking the quick cancel button", () => {
    const instance = createTwoWayTestInstance();
    instance.cancelQuestionAssociationAt = jest.fn();
    const cancelButton = React.Children.toArray(
      instance.renderAssociationOperationCell(
        { questionId: SOURCE_QUESTION_ID, type: 1 },
        0,
        0,
        false,
      ).props.children,
    )[1];
    const event = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
    };

    cancelButton.props.onClick(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.stopPropagation).toHaveBeenCalled();
    expect(instance.cancelQuestionAssociationAt).toHaveBeenCalledWith(0, 0);
  });

  it("renders a plus action for editable rows without child questions", () => {
    const instance = createTwoWayTestInstance();
    instance.changeIfChild = jest.fn();
    const addAction = React.Children.only(
      instance.renderChildQuestionOperationCell({ type: 1 }, 0, 0, false),
    );
    const event = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
    };

    addAction.props.onClick(event);

    expect(addAction.type).toBe("button");
    expect(addAction.props.children).toBe("\uE759");
    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.stopPropagation).toHaveBeenCalled();
    expect(instance.changeIfChild).toHaveBeenCalledWith(0, 0, 1);
  });

  it("binds the current row when opening child question settings", () => {
    const instance = createTwoWayTestInstance();
    instance.state = {
      ...instance.state,
      checkChild: 9,
      checkParent: 9,
      questionTypeList: [
        {
          questionList: [{ type: 5 }],
        },
      ],
    };

    instance.changeIfChild(0, 0, 1);

    expect(instance.state).toEqual(
      expect.objectContaining({
        checkChild: 0,
        checkParent: 0,
        childVisible: true,
        modalSonQuestionsData: [{ type: 5 }, { type: 5 }],
      }),
    );
  });

  it("renders child count and clear action for rows with child questions", () => {
    const instance = createTwoWayTestInstance();
    const children = React.Children.toArray(
      instance.renderChildQuestionOperationCell(
        {
          sonQuestionList: [{ type: 1 }, { type: 1 }],
          type: 1,
        },
        0,
        0,
        true,
      ).props.children,
    );

    expect(React.Children.toArray(children[0].props.children)).toEqual([
      "子题数",
      2,
    ]);
    expect(children[1].props.children).toBe("×");
    expect(children[1].props.title).toBe("清空子题");
  });

  it("clears child questions without selecting the row", () => {
    const instance = createTwoWayTestInstance();
    instance.changeIfChild = jest.fn();
    const cancelButton = React.Children.toArray(
      instance.renderChildQuestionOperationCell(
        {
          sonQuestionList: [{ type: 1 }, { type: 1 }],
          type: 1,
        },
        0,
        0,
        true,
      ).props.children,
    )[1];
    const event = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
    };

    cancelButton.props.onClick(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.stopPropagation).toHaveBeenCalled();
    expect(instance.changeIfChild).toHaveBeenCalledWith(0, 0, 0);
  });

  it("does not render child add or clear actions for locked rows", () => {
    const instance = createTwoWayTestInstance();
    const children = React.Children.toArray(
      instance.renderChildQuestionOperationCell(
        {
          sonQuestionList: [{ type: 1 }, { type: 1 }],
          type: 1,
        },
        0,
        0,
        false,
        true,
      ).props.children,
    );

    expect(children).toHaveLength(1);
    expect(
      instance.renderChildQuestionOperationCell({ type: 1 }, 0, 0, false, true),
    ).toBeNull();
  });

  it("updates a grandchild placement and recalculates every ancestor score", () => {
    const instance = createTwoWayTestInstance();
    instance.state = {
      ...instance.state,
      questionTypeList: [
        {
          questionList: [
            {
              questionScore: 1,
              sonQuestionList: [
                {
                  questionScore: 1,
                  sonQuestionList: [{ questionScore: 1 }],
                },
              ],
            },
          ],
        },
      ],
    };

    instance.changeDescendantField(0, 0, [0, 0], "questionScore", 3);

    const root = instance.state.questionTypeList[0].questionList[0];
    expect(root.sonQuestionList[0].sonQuestionList[0].questionScore).toBe(3);
    expect(root.sonQuestionList[0].questionScore).toBe(3);
    expect(root.questionScore).toBe(3);
  });

  it("batch sets every editable leaf and recalculates group scores", () => {
    const instance = createTwoWayTestInstance();
    instance.state = {
      ...instance.state,
      questionTypeList: [
        {
          questionList: [
            { questionScore: 1 },
            {
              questionScore: 99,
              sonQuestionList: [
                { questionScore: 2 },
                {
                  questionScore: 99,
                  sonQuestionList: [{ questionScore: 3 }, { questionScore: 4 }],
                },
              ],
            },
          ],
        },
      ],
    };

    instance.batchScore(0, 5);

    const [normalQuestion, combinationQuestion] =
      instance.state.questionTypeList[0].questionList;
    expect(normalQuestion.questionScore).toBe(5);
    expect(combinationQuestion.questionScore).toBe(15);
    expect(combinationQuestion.sonQuestionList[1].questionScore).toBe(10);
    expect(instance.renderAllScore(0)).toBe(20);
  });

  it("synchronizes parent score metadata when child settings are confirmed", () => {
    const instance = createTwoWayTestInstance();
    instance.refreshAssociationPlanForQuestion = jest.fn();
    instance.state = {
      ...instance.state,
      checkChild: 0,
      checkParent: 0,
      modalSonQuestionsData: [{ questionScore: 2 }, { questionScore: 3 }],
      questionTypeList: [
        {
          questionList: [{ questionScore: 99, type: 5 }],
        },
      ],
    };

    instance.sureChild();

    const parent = instance.state.questionTypeList[0].questionList[0];
    expect(parent.questionScore).toBe(5);
    expect(parent.sonQuestionScores).toEqual([
      { index: 0, score: 2 },
      { index: 1, score: 3 },
    ]);
  });

  it("synchronizes parent score metadata when following rows become children", () => {
    const instance = createTwoWayTestInstance();
    instance.refreshAssociationPlanForQuestion = jest.fn();
    instance.state = {
      ...instance.state,
      questionTypeList: [
        {
          questionList: [{ questionScore: 2 }, { questionScore: 3 }],
        },
      ],
    };

    instance.applyCollectFollowingQuestions(0, 0, 2);

    const parent = instance.state.questionTypeList[0].questionList[0];
    expect(parent.questionScore).toBe(5);
    expect(parent.sonQuestionScores).toEqual([
      { index: 0, score: 2 },
      { index: 1, score: 3 },
    ]);
  });

  it("renders score inputs for leaves but not selected group questions", () => {
    const instance = createTwoWayTestInstance();
    instance.state = {
      ...instance.state,
      checkChild: 0,
      checkParent: 0,
      gradeId: 7,
      questionTypeList: [
        {
          moduleName: "组合题",
          questionList: [
            {
              questionScore: 5,
              sonQuestionList: [
                {
                  questionScore: 5,
                  sonQuestionList: [{ questionScore: 2 }, { questionScore: 3 }],
                },
              ],
            },
          ],
        },
      ],
      selectedQuestionPath: [0],
      subjectId: 13,
      type: 1,
    };

    const groupScoreInputs = findReactElements(
      instance.render(),
      (element) =>
        element.type === InputNumber &&
        element.props.max === undefined &&
        element.props.value === 5,
    );
    expect(groupScoreInputs).toHaveLength(0);

    instance.state.selectedQuestionPath = [0, 0];
    const leafScoreInputs = findReactElements(
      instance.render(),
      (element) =>
        element.type === InputNumber &&
        element.props.max === undefined &&
        element.props.value === 2,
    );
    expect(leafScoreInputs).toHaveLength(1);
  });

  it("deletes only the requested grandchild placement", () => {
    const instance = createTwoWayTestInstance();
    instance.refreshAssociationPlanForQuestion = jest.fn();
    instance.state = {
      ...instance.state,
      questionTypeList: [
        {
          questionList: [
            {
              sonQuestionList: [
                {
                  sonQuestionList: [
                    { questionId: 11, questionScore: 1 },
                    { questionId: 12, questionScore: 2 },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    instance.delDescendantQuestion(0, 0, [0, 0]);

    expect(
      instance.state.questionTypeList[0].questionList[0].sonQuestionList[0].sonQuestionList.map(
        (question) => question.questionId,
      ),
    ).toEqual([12]);
  });

  it("clears the old group score after deleting the only direct child", () => {
    const instance = createTwoWayTestInstance();
    instance.refreshAssociationPlanForQuestion = jest.fn();
    instance.state = {
      ...instance.state,
      questionTypeList: [
        {
          questionList: [
            {
              questionScore: 4,
              sonQuestionList: [{ questionScore: 4 }],
              sonQuestionScores: [{ index: 0, score: 4 }],
            },
          ],
        },
      ],
    };

    instance.delDescendantQuestion(0, 0, [0]);

    const root = instance.state.questionTypeList[0].questionList[0];
    expect(root.sonQuestionList).toBeNull();
    expect(root.questionScore).toBeNull();
    expect(root).not.toHaveProperty("sonQuestionScores");
  });

  it("uses the same group-to-leaf transition when clearing all children", () => {
    const instance = createTwoWayTestInstance();
    instance.refreshAssociationPlanForQuestion = jest.fn();
    instance.state = {
      ...instance.state,
      questionTypeList: [
        {
          questionList: [
            {
              questionScore: 5,
              sonQuestionList: [{ questionScore: 2 }, { questionScore: 3 }],
              sonQuestionScores: [
                { index: 0, score: 2 },
                { index: 1, score: 3 },
              ],
            },
          ],
        },
      ],
    };

    instance.changeIfChild(0, 0, 0);

    const root = instance.state.questionTypeList[0].questionList[0];
    expect(root.sonQuestionList).toBeNull();
    expect(root.questionScore).toBeNull();
    expect(root).not.toHaveProperty("sonQuestionScores");
  });

  it("clears linked question data from the row quick cancel path", () => {
    const instance = createTwoWayTestInstance();
    instance.getBindableQuestions = jest.fn();
    instance.state = {
      ...instance.state,
      questionTypeList: [
        {
          questionList: [
            {
              associationCompatibility: { mode: "parent-child" },
              associationList: [SOURCE_QUESTION_ID],
              associationSourceSnapshot: { questionId: SOURCE_QUESTION_ID },
              associationStrategy: buildAssociationStrategy(
                ASSOCIATION_STRATEGY_TYPES.group,
                0,
              ),
              blankSplitAssociation: { index: 0 },
              businessQuestionTypeId: 101,
              chapterId: [2],
              chapterName: ["章节"],
              combinationSplitAssociation: { index: 0 },
              indicatorIds: [3],
              indicatorName: ["素养"],
              knowledge: ["知识点"],
              knowledgeIds: [1],
              personalityQuestions: ["similar-1"],
              questionId: SOURCE_QUESTION_ID,
              questionLevelType: 2,
              questionTypeName: "单选题",
              sonQuestionList: [{ questionId: "child-1" }],
              sonQuestionScores: [{ index: 0, score: 1 }],
              type: 1,
              virtualAssociation: { mode: "single" },
            },
          ],
        },
      ],
    };

    instance.cancelQuestionAssociationAt(0, 0);

    const target = instance.state.questionTypeList[0].questionList[0];
    expect(target).toEqual(
      expect.objectContaining({
        chapterId: [],
        businessQuestionTypeId: 101,
        indicatorIds: [],
        knowledgeIds: [],
        questionTypeName: "单选题",
        type: 1,
      }),
    );
    expect(target.associationSourceSnapshot).toBeNull();
    expect(target.associationStrategy).toBeNull();
    expect(target.chapterName).toBeNull();
    expect(target.indicatorName).toBeNull();
    expect(target.knowledge).toBeNull();
    expect(target.personalityQuestions).toBeNull();
    expect(target.questionId).toBeNull();
    expect(target.questionLevelType).toBeNull();
    expect(target.sonQuestionList).toBeNull();
    expect(target.sonQuestionScores).toBeNull();
    expect(target.virtualAssociation).toBeNull();
    expect(target).not.toHaveProperty("associationCompatibility");
    expect(target).not.toHaveProperty("associationList");
    expect(target).not.toHaveProperty("blankSplitAssociation");
    expect(target).not.toHaveProperty("combinationSplitAssociation");
    expect(instance.props.dispatch).toHaveBeenCalledWith({
      type: "global/clearListIds",
    });
    expect(instance.page).toBe(1);
    expect(instance.getBindableQuestions).toHaveBeenCalled();
  });

  it("clears every question from the same split association group", () => {
    const instance = createTwoWayTestInstance();
    instance.getBindableQuestions = jest.fn();
    instance.state = {
      ...instance.state,
      questionTypeList: [
        {
          questionList: [
            {
              associationStrategy: {
                nodePath: [SOURCE_COMBINATION_ID, SOURCE_COMBINATION_CHILD_ID],
                type: ASSOCIATION_STRATEGY_TYPES.leaf,
              },
              questionId: SOURCE_COMBINATION_CHILD_ID,
              type: 1,
            },
            {
              associationStrategy: {
                nodePath: [SOURCE_COMBINATION_ID, 903],
                type: ASSOCIATION_STRATEGY_TYPES.leaf,
              },
              questionId: 903,
              type: 1,
            },
            {
              questionId: "other-source",
              type: 1,
            },
          ],
        },
      ],
    };

    instance.cancelQuestionAssociationAt(0, 0);

    expect(instance.state.questionTypeList[0].questionList).toEqual([
      expect.objectContaining({
        type: 1,
      }),
      expect.objectContaining({
        type: 1,
      }),
      expect.objectContaining({
        questionId: "other-source",
      }),
    ]);
    expect(
      instance.state.questionTypeList[0].questionList[0].associationStrategy,
    ).toBeNull();
    expect(
      instance.state.questionTypeList[0].questionList[0].questionId,
    ).toBeNull();
    expect(
      instance.state.questionTypeList[0].questionList[1].associationStrategy,
    ).toBeNull();
    expect(
      instance.state.questionTypeList[0].questionList[1].questionId,
    ).toBeNull();
  });
});
