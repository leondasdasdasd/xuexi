/** @jest-environment node */

import { buildLeafAssociationStrategy } from "./combinationQuestionTree.js";
import {
  buildQuestionPlacementUnits,
  ASSOCIATION_STRATEGY_TYPES,
  BLANK_ASSOCIATION_NUMBERING_MODE,
  buildAssociationStrategy,
  buildBlankAssociationStrategy,
  buildBlankAssociationTargetLabels,
  buildBlankSubquestionAssociationPatch,
  canEditBlankAssociationField,
  buildClearAssociatedChildrenPatch,
  buildCombinationQuestionAssociationPatch,
  buildQuestionFromPreviousTemplate,
  buildQuestionAssociationStrategy,
  buildVirtualAssociationPlan,
  formatDecimalDisplay,
  getCombinationChildDisplayLabel,
  getLeafAssociationSourceId,
  getDefaultBlankAssociationNumberingMode,
  getQuestionAssociationIds,
  getAssociationStrategyLabel,
  getQuestionFillBlankParts,
  hasAssociatedQuestionInResizeRemovedRange,
  hasEditableBlankAssociationAttributes,
  isAssociationFollowerQuestion,
  isValidModuleQuestionCount,
  moveQuestionPlacementUnit,
  normalizeExamSideSonQuestions,
  normalizeSaveSonQuestion,
  removeBlankSplitAssociationGroup,
  removeCombinationSplitAssociationGroup,
  resizeExamSideSonQuestions,
  sanitizeAssociationPayloadQuestion,
} from "./virtualAssociationGroups";

describe("virtualAssociationGroups", () => {
  describe("question placement unit ordering", () => {
    const blank = (sourceId, blankOrder, label) => ({
      associationSourceSnapshot: { questionId: sourceId },
      associationStrategy: {
        blankId: `${sourceId}-${blankOrder}`,
        blankOrder,
        type: ASSOCIATION_STRATEGY_TYPES.blank,
      },
      label,
    });

    it("moves ordinary placements without mutating the input", () => {
      const questions = [{ label: "A" }, { label: "B" }, { label: "C" }];

      const result = moveQuestionPlacementUnit(questions, 1, "up");

      expect(result.questionList.map(({ label }) => label)).toEqual([
        "B",
        "A",
        "C",
      ]);
      expect(result.indexMap).toEqual([1, 0, 2]);
      expect(questions.map(({ label }) => label)).toEqual(["A", "B", "C"]);
      expect(result.questionList).not.toBe(questions);
    });

    it("keeps boundary placements unchanged", () => {
      const questions = [{ label: "A" }, { label: "B" }];

      expect(moveQuestionPlacementUnit(questions, 0, "up").moved).toBe(false);
      expect(moveQuestionPlacementUnit(questions, 1, "down").moved).toBe(false);
    });

    it("moves a consecutive blank group as one unit", () => {
      const questions = [
        { label: "A" },
        blank(10, 0, "B0"),
        blank(10, 1, "B1"),
        blank(10, 2, "B2"),
        { label: "C" },
      ];

      expect(buildQuestionPlacementUnits(questions)).toEqual([
        { end: 0, start: 0 },
        { end: 3, start: 1 },
        { end: 4, start: 4 },
      ]);
      expect(
        moveQuestionPlacementUnit(questions, 1, "down").questionList.map(
          ({ label }) => label,
        ),
      ).toEqual(["A", "C", "B0", "B1", "B2"]);
    });

    it("moves an ordinary placement across a complete blank group", () => {
      const questions = [
        { label: "A" },
        blank(10, 0, "B0"),
        blank(10, 1, "B1"),
        { label: "C" },
      ];

      expect(
        moveQuestionPlacementUnit(questions, 3, "up").questionList.map(
          ({ label }) => label,
        ),
      ).toEqual(["A", "C", "B0", "B1"]);
      expect(moveQuestionPlacementUnit(questions, 2, "up").moved).toBe(false);
    });

    it("separates adjacent blank groups from different sources", () => {
      const questions = [blank(10, 0, "A"), blank(11, 1, "B")];

      expect(buildQuestionPlacementUnits(questions)).toEqual([
        { end: 0, start: 0 },
        { end: 1, start: 1 },
      ]);
    });
  });

  it("allows a current single question to carry multiple source combination children", () => {
    const plan = buildVirtualAssociationPlan({
      sourceQuestion: {
        content: "<p>阅读短文</p>",
        questionId: 10,
        questionSort: 10,
        type: 6,
        sonQuestionList: [
          { questionId: 101, questionScore: 5, type: 5 },
          { questionId: 102, questionScore: 5, type: 5 },
        ],
      },
      sourceQuestionLabel: "10",
      targetQuestion: {
        questionId: 11,
        questionScore: 10,
        type: 5,
      },
      targetQuestionLabel: "11",
    });

    expect(plan).toEqual(
      expect.objectContaining({
        availableModes: [{ value: "single" }, { value: "parent-child" }],
        mode: "parent-child",
        modeLabel: "parent-child",
        previewPairs: [
          { sourceLabel: "10-1", targetLabel: "11" },
          { sourceLabel: "10-2", targetLabel: "11" },
        ],
      }),
    );
    expect(plan.note).toBe(
      "已关联原卷组合题第 10 题。原卷有 2 个小问，当前第 11 题保持一个题号；错题打印使用组合题题干和已挂小问。",
    );
  });

  it("reads ordered blank identities from the V2 fill element", () => {
    const parts = getQuestionFillBlankParts({
      questionData: {
        elements: [
          {
            answers: [{ answerPools: [], blankIds: ["blank_b"] }],
            blanks: ["blank_a", "blank_b"],
            type: "fill",
          },
        ],
      },
    });

    expect(parts).toEqual([
      { blankId: "blank_a", blankOrder: 0, label: "1" },
      { blankId: "blank_b", blankOrder: 1, label: "2" },
    ]);
  });

  it("rejects duplicate V2 blank identities", () => {
    expect(() =>
      getQuestionFillBlankParts({
        questionData: {
          elements: [{ blanks: ["blank_a", "blank_a"], type: "fill" }],
        },
      }),
    ).toThrow("Fill blank IDs must be non-empty and unique");
  });

  it("builds target labels for both blank association numbering modes", () => {
    expect(
      buildBlankAssociationTargetLabels({
        blankCount: 3,
        numberingMode: BLANK_ASSOCIATION_NUMBERING_MODE.continuous,
        startNo: 8,
      }),
    ).toEqual(["8", "9", "10"]);

    expect(
      buildBlankAssociationTargetLabels({
        blankCount: 3,
        numberingMode: BLANK_ASSOCIATION_NUMBERING_MODE.subquestion,
        startNo: 8,
      }),
    ).toEqual(["8.1", "8.2", "8.3"]);
  });

  it("uses subquestion numbering by default when the current target already has children", () => {
    expect(
      getDefaultBlankAssociationNumberingMode({
        sonQuestionList: [{ questionScore: 1 }, { questionScore: 1 }],
      }),
    ).toBe(BLANK_ASSOCIATION_NUMBERING_MODE.subquestion);

    expect(getDefaultBlankAssociationNumberingMode({})).toBe(
      BLANK_ASSOCIATION_NUMBERING_MODE.continuous,
    );
  });

  it("binds the fill blank question to the parent when blanks map to subquestions", () => {
    const patch = buildBlankSubquestionAssociationPatch({
      blankParts: [
        { blankId: "blank_a", label: "空1" },
        { blankId: "blank_b", label: "空2" },
      ],
      childQuestions: [
        { indicatorName: ["素养A"], questionScore: 1, type: 1 },
        { questionScore: 1, type: 1 },
      ],
      questionType: 1,
      sourceQuestionId: 900,
    });

    expect(patch).toEqual({
      associationStrategy: null,
      questionId: 900,
      questionScore: 2,
      sonQuestionList: [
        {
          associationStrategy: buildBlankAssociationStrategy({
            blankId: "blank_a",
            blankOrder: 0,
          }),
          indicatorName: ["素养A"],
          questionId: 900,
          questionScore: 1,
          type: 1,
        },
        {
          associationStrategy: buildBlankAssociationStrategy({
            blankId: "blank_b",
            blankOrder: 1,
          }),
          indicatorName: [],
          questionId: 900,
          questionScore: 1,
          type: 1,
        },
      ],
      sonQuestionScores: [
        { index: 0, score: 1 },
        { index: 1, score: 1 },
      ],
    });
  });

  it("builds minimal association strategy labels", () => {
    const leafStrategy = buildLeafAssociationStrategy({
      nodePath: [900, 901, 902],
      questionId: 902,
    });
    expect(leafStrategy).toEqual({
      nodePath: [900, 901, 902],
      type: ASSOCIATION_STRATEGY_TYPES.leaf,
    });
    expect(
      getAssociationStrategyLabel(
        buildAssociationStrategy(ASSOCIATION_STRATEGY_TYPES.group, 0),
      ),
    ).toBe("组1");
    expect(getAssociationStrategyLabel(leafStrategy)).toBe("Leaf question");
    expect(
      getAssociationStrategyLabel(
        buildBlankAssociationStrategy({ blankId: "blank_c", blankOrder: 2 }),
      ),
    ).toBe("空3");
  });

  it("only marks combination as group when explicitly binding as single", () => {
    expect(buildQuestionAssociationStrategy({ type: 6 })).toBeNull();
    expect(
      buildQuestionAssociationStrategy(
        { type: 6 },
        { bindCombinationAsSingle: true },
      ),
    ).toEqual(buildAssociationStrategy(ASSOCIATION_STRATEGY_TYPES.group, 0));
  });

  it("brings combination children back when adding a combination question normally", () => {
    const patch = buildCombinationQuestionAssociationPatch({
      children: [
        {
          businessQuestionTypeId: 5,
          chapterValues: ["10-三角形"],
          children: [],
          indicatorValues: ["20-推理能力"],
          knowledgeValues: ["30-余弦定理"],
          questionId: 101,
          questionScore: 3,
          type: 5,
        },
        {
          businessQuestionTypeId: 6,
          children: [
            {
              businessQuestionTypeId: 5,
              children: [],
              questionId: 103,
              questionScore: 5,
              type: 5,
            },
          ],
          questionId: 102,
          type: 6,
        },
      ],
      questionScore: 8,
      type: 6,
    });

    expect(patch).toEqual({
      questionScore: 8,
      sonQuestionList: [
        {
          businessQuestionTypeId: 5,
          chapterName: ["三角形"],
          chapterValues: ["10-三角形"],
          checked: false,
          indicatorName: ["推理能力"],
          indicatorValues: ["20-推理能力"],
          knowledge: ["余弦定理"],
          knowledgeValues: ["30-余弦定理"],
          questionId: 101,
          questionScore: 3,
          sonQuestionList: [],
          sonQuestionScores: [],
          type: 5,
        },
        {
          businessQuestionTypeId: 6,
          chapterName: [],
          checked: false,
          indicatorName: [],
          knowledge: [],
          questionId: 102,
          questionScore: 5,
          sonQuestionList: [
            {
              businessQuestionTypeId: 5,
              chapterName: [],
              checked: false,
              indicatorName: [],
              knowledge: [],
              questionId: 103,
              questionScore: 5,
              sonQuestionList: [],
              sonQuestionScores: [],
              type: 5,
            },
          ],
          sonQuestionScores: [{ index: 0, score: 5 }],
          type: 6,
        },
      ],
      sonQuestionScores: [
        { index: 0, score: 3 },
        { index: 1, score: 5 },
      ],
    });
  });

  it("clears children copied from an associated combination question", () => {
    expect(buildClearAssociatedChildrenPatch()).toEqual({
      sonQuestionList: null,
      sonQuestionScores: null,
    });
  });

  it("builds stable combination child display labels", () => {
    expect(getCombinationChildDisplayLabel(0)).toBe("叶1");
    expect(getCombinationChildDisplayLabel(1)).toBe("叶2");
  });

  it("locks only fill-blank follower rows", () => {
    expect(
      isAssociationFollowerQuestion({
        associationStrategy: buildBlankAssociationStrategy({
          blankId: "blank_1",
          blankOrder: 1,
        }),
      }),
    ).toBe(true);
    expect(
      isAssociationFollowerQuestion({
        associationStrategy: buildLeafAssociationStrategy({
          nodePath: [900, 901],
          questionId: 901,
        }),
      }),
    ).toBe(false);
    expect(
      isAssociationFollowerQuestion({
        associationStrategy: buildLeafAssociationStrategy({
          nodePath: [900, 902],
          questionId: 902,
        }),
      }),
    ).toBe(false);
    expect(isAssociationFollowerQuestion({ questionId: 100 })).toBe(false);
    expect(
      isAssociationFollowerQuestion({
        associationStrategy: buildBlankAssociationStrategy({
          blankId: "blank_0",
          blankOrder: 0,
        }),
      }),
    ).toBe(false);
    expect(
      isAssociationFollowerQuestion(
        {
          associationStrategy: buildBlankAssociationStrategy({
            blankId: "blank_0",
            blankOrder: 0,
          }),
        },
        { includeFirstBlank: true },
      ),
    ).toBe(true);
    expect(
      isAssociationFollowerQuestion({
        associationStrategy: buildAssociationStrategy(
          ASSOCIATION_STRATEGY_TYPES.group,
          0,
        ),
      }),
    ).toBe(false);
  });

  it("allows only declared attributes on every blank association position", () => {
    const firstBlank = {
      associationStrategy: buildBlankAssociationStrategy({
        blankId: "blank_0",
        blankOrder: 0,
      }),
    };
    const followingBlank = {
      associationStrategy: buildBlankAssociationStrategy({
        blankId: "blank_1",
        blankOrder: 1,
      }),
    };

    expect(hasEditableBlankAssociationAttributes(firstBlank)).toBe(true);
    expect(hasEditableBlankAssociationAttributes(followingBlank)).toBe(true);
    for (const fieldName of [
      "chapterId",
      "indicatorIds",
      "knowledgeIds",
      "predictionDifficulty",
      "questionLevelType",
      "questionScore",
      "sourceType",
    ]) {
      expect(canEditBlankAssociationField(followingBlank, fieldName)).toBe(
        true,
      );
    }
    expect(canEditBlankAssociationField(followingBlank, "checked")).toBe(false);
    expect(
      hasEditableBlankAssociationAttributes({
        associationStrategy: buildAssociationStrategy(
          ASSOCIATION_STRATEGY_TYPES.group,
          1,
        ),
      }),
    ).toBe(false);
  });

  it("builds a default question when increasing count from zero", () => {
    expect(buildQuestionFromPreviousTemplate()).toEqual({
      questionLevelType: undefined,
      predictionDifficulty: undefined,
      questionScore: 1,
      sourceType: undefined,
      type: undefined,
    });
  });

  it("copies editable defaults from the previous question when increasing count", () => {
    expect(
      buildQuestionFromPreviousTemplate({
        predictionDifficulty: 2,
        questionLevelType: 3,
        questionScore: 4,
        sourceType: 5,
        type: 6,
      }),
    ).toEqual({
      predictionDifficulty: 2,
      questionLevelType: 3,
      questionScore: 4,
      sourceType: 5,
      type: 6,
    });
  });

  it("uses the last question type instead of a parent question type", () => {
    expect(
      buildQuestionFromPreviousTemplate(
        {
          questionScore: 4,
          type: 6,
        },
        1,
      ),
    ).toEqual({
      predictionDifficulty: undefined,
      questionLevelType: undefined,
      questionScore: 4,
      sourceType: undefined,
      type: 6,
    });
  });

  it("copies the last question type for every appended question", () => {
    const lastQuestion = {
      predictionDifficulty: 2,
      questionLevelType: 3,
      questionScore: 4,
      sourceType: 5,
      type: 6,
    };

    expect(
      Array.from({ length: 3 }, () =>
        buildQuestionFromPreviousTemplate(lastQuestion),
      ),
    ).toEqual([
      {
        predictionDifficulty: 2,
        questionLevelType: 3,
        questionScore: 4,
        sourceType: 5,
        type: 6,
      },
      {
        predictionDifficulty: 2,
        questionLevelType: 3,
        questionScore: 4,
        sourceType: 5,
        type: 6,
      },
      {
        predictionDifficulty: 2,
        questionLevelType: 3,
        questionScore: 4,
        sourceType: 5,
        type: 6,
      },
    ]);
  });

  it("validates module question count before resizing", () => {
    expect(isValidModuleQuestionCount(0)).toBe(false);
    expect(isValidModuleQuestionCount("")).toBe(false);
    expect(isValidModuleQuestionCount("invalid")).toBe(false);
    expect(isValidModuleQuestionCount(true)).toBe(false);
    expect(isValidModuleQuestionCount(1)).toBe(true);
    expect(isValidModuleQuestionCount(2)).toBe(true);
  });

  it("inherits parent type when increasing exam-side subquestion count", () => {
    const sonQuestions = [{ questionScore: 1, type: 1 }, { questionScore: 2 }];

    expect(
      resizeExamSideSonQuestions({
        parentType: 1,
        sonQuestions,
        targetCount: 5,
      }),
    ).toEqual([
      { questionScore: 1, type: 1 },
      { questionScore: 2, type: 1 },
      { questionScore: 0, type: 1 },
      { questionScore: 0, type: 1 },
      { questionScore: 0, type: 1 },
    ]);
  });

  it("truncates exam-side subquestions without changing remaining values", () => {
    const sonQuestions = [
      { questionScore: 1, type: 1 },
      { questionScore: 2, type: 1 },
      { questionScore: 3, type: 1 },
    ];

    expect(
      resizeExamSideSonQuestions({
        parentType: 1,
        sonQuestions,
        targetCount: 2,
      }),
    ).toEqual([
      { questionScore: 1, type: 1 },
      { questionScore: 2, type: 1 },
    ]);
  });

  it("fills missing exam-side subquestion type before saving", () => {
    expect(
      normalizeExamSideSonQuestions(
        [{ questionScore: 1 }, { questionScore: 2, type: 2 }],
        1,
      ),
    ).toEqual([
      { questionScore: 1, type: 1 },
      { questionScore: 2, type: 2 },
    ]);
  });

  it("does not create score field for appended exam-side subquestions", () => {
    const sonQuestions = resizeExamSideSonQuestions({
      parentType: 1,
      sonQuestions: [],
      targetCount: 1,
    });

    expect(sonQuestions[0]).toEqual({ questionScore: 0, type: 1 });
    expect(sonQuestions[0]).not.toHaveProperty("score");
  });

  it("formats decimal display without crashing on empty values", () => {
    expect(formatDecimalDisplay(null)).toBe("");
    expect(formatDecimalDisplay()).toBe("");
    expect(formatDecimalDisplay("")).toBe("");
    expect(formatDecimalDisplay(1)).toBe("1.00");
    expect(formatDecimalDisplay(0.5)).toBe("0.50");
    expect(formatDecimalDisplay(0.25)).toBe("0.25");
  });

  it("removes all split children from the same source combination when one child is deleted", () => {
    const sourceCombination = { questionId: 900 };
    const questionTypeList = [
      {
        questionList: [
          {
            associationSourceSnapshot: sourceCombination,
            associationStrategy: buildLeafAssociationStrategy({
              nodePath: [900, 901],
              questionId: 901,
            }),
            questionId: 901,
          },
          {
            associationSourceSnapshot: sourceCombination,
            associationStrategy: buildLeafAssociationStrategy({
              nodePath: [900, 902],
              questionId: 902,
            }),
            questionId: 902,
          },
          {
            associationSourceSnapshot: sourceCombination,
            associationStrategy: buildAssociationStrategy(
              ASSOCIATION_STRATEGY_TYPES.group,
              0,
            ),
            questionId: 900,
          },
          {
            questionId: 1000,
          },
        ],
        questionNum: 4,
      },
    ];

    const nextQuestionTypeList = removeCombinationSplitAssociationGroup(
      questionTypeList,
      questionTypeList[0].questionList[0],
      {
        moduleIndex: 0,
        questionIndex: 0,
      },
    );

    expect(nextQuestionTypeList[0].questionList).toEqual([
      {
        associationSourceSnapshot: sourceCombination,
        associationStrategy: buildAssociationStrategy(
          ASSOCIATION_STRATEGY_TYPES.group,
          0,
        ),
        questionId: 900,
      },
      {
        questionId: 1000,
      },
    ]);
    expect(nextQuestionTypeList[0].questionNum).toBe(2);
  });

  it("uses the nodePath root to remove reloaded leaf associations", () => {
    const questionTypeList = [
      {
        questionList: [
          {
            associationSourceSnapshot: { questionId: 901 },
            associationStrategy: buildLeafAssociationStrategy({
              nodePath: [900, 901],
              questionId: 901,
            }),
            questionId: 901,
          },
          {
            associationStrategy: buildLeafAssociationStrategy({
              nodePath: [900, 902],
              questionId: 902,
            }),
            questionId: 902,
          },
          {
            questionId: 1000,
          },
        ],
        questionNum: 3,
      },
    ];

    expect(
      getLeafAssociationSourceId(questionTypeList[0].questionList[0]),
    ).toBe(900);
    expect(
      getQuestionAssociationIds(questionTypeList[0].questionList[0]),
    ).toEqual([900]);

    const nextQuestionTypeList = removeCombinationSplitAssociationGroup(
      questionTypeList,
      questionTypeList[0].questionList[0],
      {
        moduleIndex: 0,
        questionIndex: 0,
      },
    );

    expect(nextQuestionTypeList[0].questionList).toEqual([
      {
        questionId: 1000,
      },
    ]);
    expect(nextQuestionTypeList[0].questionNum).toBe(1);
  });

  it("removes all split blank rows from the same fill blank source when one blank row is deleted", () => {
    const sourceFillBlank = { questionId: 900 };
    const questionTypeList = [
      {
        questionList: [
          {
            associationSourceSnapshot: sourceFillBlank,
            associationStrategy: buildBlankAssociationStrategy({
              blankId: "blank_0",
              blankOrder: 0,
            }),
            questionId: 900,
          },
          {
            associationSourceSnapshot: sourceFillBlank,
            associationStrategy: buildBlankAssociationStrategy({
              blankId: "blank_1",
              blankOrder: 1,
            }),
            questionId: 900,
          },
          {
            associationSourceSnapshot: sourceFillBlank,
            associationStrategy: buildBlankAssociationStrategy({
              blankId: "blank_2",
              blankOrder: 2,
            }),
            questionId: 900,
          },
          {
            questionId: 1000,
          },
        ],
        questionNum: 4,
      },
    ];

    const nextQuestionTypeList = removeBlankSplitAssociationGroup(
      questionTypeList,
      questionTypeList[0].questionList[0],
      {
        moduleIndex: 0,
        questionIndex: 0,
      },
    );

    expect(nextQuestionTypeList[0].questionList).toEqual([
      {
        questionId: 1000,
      },
    ]);
    expect(nextQuestionTypeList[0].questionNum).toBe(1);
  });

  it("removes a contiguous split blank sequence when the shared source snapshot is missing", () => {
    const questionTypeList = [
      {
        questionList: [
          {
            associationStrategy: buildBlankAssociationStrategy({
              blankId: "blank_0",
              blankOrder: 0,
            }),
            questionId: 900,
          },
          {
            associationStrategy: buildBlankAssociationStrategy({
              blankId: "blank_1",
              blankOrder: 1,
            }),
            questionId: 900,
          },
          {
            associationStrategy: buildBlankAssociationStrategy({
              blankId: "blank_2",
              blankOrder: 2,
            }),
            questionId: 900,
          },
          {
            questionId: 1000,
          },
        ],
        questionNum: 4,
      },
    ];

    const nextQuestionTypeList = removeBlankSplitAssociationGroup(
      questionTypeList,
      questionTypeList[0].questionList[1],
      {
        moduleIndex: 0,
        questionIndex: 1,
      },
    );

    expect(nextQuestionTypeList[0].questionList).toEqual([
      {
        questionId: 1000,
      },
    ]);
    expect(nextQuestionTypeList[0].questionNum).toBe(1);
  });

  it("blocks shrinking question count when removed tail contains associated questions", () => {
    const questionList = [
      { type: 1 },
      { type: 1 },
      { type: 1 },
      {
        associationStrategy: buildLeafAssociationStrategy({
          nodePath: [900, 901],
          questionId: 901,
        }),
        questionId: 901,
      },
      {
        associationStrategy: buildLeafAssociationStrategy({
          nodePath: [900, 902],
          questionId: 902,
        }),
        questionId: 902,
      },
    ];

    expect(hasAssociatedQuestionInResizeRemovedRange(questionList, 4)).toBe(
      true,
    );
    expect(hasAssociatedQuestionInResizeRemovedRange(questionList, 3)).toBe(
      true,
    );
    expect(hasAssociatedQuestionInResizeRemovedRange(questionList, 5)).toBe(
      false,
    );
  });

  it("removes stale association fields before saving", () => {
    const question = sanitizeAssociationPayloadQuestion({
      associationCompatibility: { mode: "parent-child" },
      associationList: [100],
      associationSourceSnapshot: { questionId: 100 },
      associationStrategy: buildBlankAssociationStrategy({
        blankId: "blank_0",
        blankOrder: 0,
      }),
      blankSplitAssociation: { blankIndex: 0 },
      combinationSplitAssociation: { childQuestionIndex: 0 },
      questionId: 100,
      sourceLabel: "1-1",
      sourceQuestionId: 100,
      sonQuestionList: [
        {
          associationList: [100],
          questionId: 100,
          sourceQuestionId: 100,
          version: 1,
        },
      ],
      version: 1,
      virtualAssociation: { mode: "blank-compatible" },
    });

    expect(question).toEqual({
      associationStrategy: {
        blankId: "blank_0",
        blankOrder: 0,
        type: "blank",
      },
      questionId: 100,
      sonQuestionList: [{ questionId: 100 }],
    });
  });

  it("normalizes saved son questions with questionId", () => {
    expect(
      normalizeSaveSonQuestion({
        id: 101,
        indicatorName: [],
        questionScore: 5,
      }),
    ).toEqual({
      id: 101,
      indicatorName: [],
      questionId: 101,
      questionScore: 5,
    });

    expect(
      normalizeSaveSonQuestion({
        id: 102,
        questionId: 202,
        questionScore: 6,
      }),
    ).toEqual({
      id: 102,
      questionId: 202,
      questionScore: 6,
    });
  });

  it("uses V2 fill elements to build blank-compatible association plans", () => {
    const plan = buildVirtualAssociationPlan({
      sourceQuestion: {
        content: "<p>请填写 _____ 和 _____。</p>",
        questionId: 20,
        questionScore: 4,
        questionData: {
          elements: [{ blanks: ["blank_a", "blank_b"], type: "fill" }],
        },
        type: 3,
      },
      sourceQuestionLabel: "20",
      targetQuestion: {
        questionId: 21,
        questionScore: 4,
        sonQuestionList: [
          { questionId: 211, questionScore: 2, type: 3 },
          { questionId: 212, questionScore: 2, type: 3 },
        ],
        type: 3,
      },
      targetQuestionLabel: "21",
    });

    expect(plan).toEqual(
      expect.objectContaining({
        mode: "blank-compatible",
        modeLabel: "blank-compatible",
        sourceSummary: expect.objectContaining({
          fragmentCount: 2,
          structureKind: "fillBlank",
          structureLabel: "2 个空位",
        }),
      }),
    );
  });
});
