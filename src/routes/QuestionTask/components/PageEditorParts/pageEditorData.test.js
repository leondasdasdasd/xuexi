import {
  buildAnswerSections,
  buildBlankAnswerDraftGroups,
  buildBlankCountMap,
  buildQuestionEditorDraft,
  buildQuestionReferencePatch,
  buildReferenceDraftMap,
  normalizeJudgeAnswer,
} from "./pageEditorData";

const COMBINATION_DRAFT_ID = "combination-1";
const NULL_SCORE = JSON.parse("null");

describe("PageEditor answer data flow", () => {
  beforeEach(() => {
    window.globalLange = "zh-CN";
  });

  it("groups answer preview sections by contiguous question type", () => {
    const sections = buildAnswerSections([
      {
        answer: "A",
        draftId: "choice-1",
        questionScore: 2,
        type: 1,
      },
      {
        answer: "BD",
        draftId: "choice-2",
        questionScore: 2,
        type: 2,
      },
      {
        draftId: "blank-1",
        gapFillingAnswer: { answers: ["甲", "乙"], isOrder: true },
        questionScore: 4,
        type: 3,
      },
      {
        analysis: "<p>组合解析</p>",
        content: "<p>材料</p>",
        draftId: COMBINATION_DRAFT_ID,
        questionScore: 6,
        sonQuestionList: [
          {
            answer: true,
            questionScore: 2,
            type: 4,
          },
          {
            gapFillingAnswer: { answers: ["空"], isOrder: false },
            questionScore: 4,
            type: 3,
          },
        ],
        type: 6,
      },
    ]);

    expect(
      sections.map(({ rangeLabel, sectionTypeKey, totalCount }) => ({
        rangeLabel,
        sectionTypeKey,
        totalCount,
      })),
    ).toEqual([
      { rangeLabel: "1", sectionTypeKey: "choice", totalCount: 1 },
      { rangeLabel: "2", sectionTypeKey: "choice", totalCount: 1 },
      { rangeLabel: "3", sectionTypeKey: "blank", totalCount: 1 },
      {
        rangeLabel: "4",
        sectionTypeKey: "combination",
        totalCount: 2,
      },
    ]);
    expect(sections[3].groups[0].items[0].subQuestions).toEqual([
      expect.objectContaining({
        analysis: "",
        answer: "正确",
        number: "4-1",
        score: "2",
        typeLabel: undefined,
      }),
      expect.objectContaining({
        analysis: "",
        answer: "空",
        number: "4-2",
        score: "4",
        typeLabel: undefined,
      }),
    ]);
  });

  it("normalizes empty answer preview score text without hiding zero scores", () => {
    const sections = buildAnswerSections([
      {
        answer: "A",
        draftId: "choice-null",
        questionScore: NULL_SCORE,
        type: 1,
      },
      {
        answer: "B",
        draftId: "choice-null-text",
        questionScore: "null",
        type: 1,
      },
      {
        answer: "C",
        draftId: "choice-undefined-text",
        questionScore: "undefined",
        type: 1,
      },
      {
        answer: "D",
        draftId: "choice-zero",
        questionScore: 0,
        type: 1,
      },
    ]);

    expect(sections[0].groups[0].items.map((item) => item.score)).toEqual([
      "",
      "",
      "",
      "0",
    ]);
  });

  it("hides empty combination questions from answer preview count and range", () => {
    const sections = buildAnswerSections([
      {
        answer: "A",
        draftId: "choice-1",
        questionScore: 2,
        type: 1,
      },
      {
        content: "<p>只有题干</p>",
        draftId: "combination-empty",
        questionScore: 6,
        sonQuestionList: [
          {
            questionScore: 2,
            type: 5,
          },
          {
            analysis: "",
            answer: "",
            questionScore: 4,
            type: 5,
          },
        ],
        type: 6,
      },
      {
        content: "<p>有子题答案</p>",
        draftId: "combination-with-answer",
        questionScore: 4,
        sonQuestionList: [
          {
            answer: "C",
            questionScore: 4,
            type: 1,
          },
        ],
        type: 6,
      },
    ]);

    expect(
      sections.map(({ rangeLabel, sectionTypeKey, totalCount }) => ({
        rangeLabel,
        sectionTypeKey,
        totalCount,
      })),
    ).toEqual([
      { rangeLabel: "1", sectionTypeKey: "choice", totalCount: 1 },
      { rangeLabel: "3", sectionTypeKey: "combination", totalCount: 1 },
    ]);
    expect(sections[1].items.map((item) => item.draftId)).toEqual([
      "combination-with-answer",
    ]);
    expect(sections[1].groups[0].items[0].subQuestions[0]).toEqual(
      expect.objectContaining({
        answer: "C",
        number: "3-1",
      }),
    );
  });

  it("keeps combination questions with parent analysis in answer preview", () => {
    const sections = buildAnswerSections([
      {
        analysis: "<p>组合题总解析</p>",
        draftId: COMBINATION_DRAFT_ID,
        sonQuestionList: [
          {
            questionScore: 2,
            type: 5,
          },
        ],
        type: 6,
      },
    ]);

    expect(sections).toHaveLength(1);
    expect(sections[0].items[0]).toEqual(
      expect.objectContaining({
        analysis: "组合题总解析",
        draftId: COMBINATION_DRAFT_ID,
      }),
    );
  });

  it("builds reference patches from edited blank answers and scores", () => {
    const question = {
      analysis: "<p>旧解析</p>",
      draftId: "blank-1",
      gapFillingAnswer: { answers: ["旧答案"], isOrder: true },
      questionScore: 3,
      type: 3,
    };
    const draft = {
      ...buildQuestionEditorDraft(question),
      analysisText: "新解析",
      blankAnswerGroups: [{ answers: ["新答案"] }, { answers: ["第二空"] }],
      scoreText: "4",
    };

    expect(buildQuestionReferencePatch(question, draft)).toEqual({
      analysis: "<p>新解析</p>",
      gapFillingAnswer: {
        answerRaw: [["新答案"], ["第二空"]],
        answers: ["新答案", "第二空"],
        isOrder: true,
      },
      questionScore: 4,
    });
  });

  it("does not save blank answer placeholder slots as answer changes", () => {
    const question = {
      draftId: "blank-placeholder-slot",
      gapFillingAnswer: { answers: ["旧答案"], isOrder: false },
      questionScore: 3,
      type: 3,
    };
    const draft = {
      ...buildQuestionEditorDraft(question),
      blankAnswerGroups: [{ answers: ["旧答案", ""] }],
    };

    expect(buildQuestionReferencePatch(question, draft)).toEqual({});
  });

  it("writes rich formula html into answerRaw for batch-edited blank formulas", () => {
    const question = {
      draftId: "blank-formula-1",
      gapFillingAnswer: {
        answerRaw: [
          [
            '<p><img src="https://example.com/formula.png?mathUrl=x%5E2" /></p>',
          ],
        ],
        answers: ["$$x^2$$"],
        isOrder: false,
      },
      questionScore: 5,
      type: 3,
    };
    const draft = {
      ...buildQuestionEditorDraft(question),
      blankAnswerGroups: [
        {
          answers: [
            '<p>fwaefwefwe<img src="https://example.com/formula.png?mathUrl=%5Csqrt3" /></p>',
          ],
        },
      ],
    };

    const patch = buildQuestionReferencePatch(question, draft);

    expect(patch.gapFillingAnswer.answers).toEqual(["fwaefwefwe$\\sqrt3$"]);
    expect(patch.gapFillingAnswer.answerRaw).toHaveLength(1);
    expect(patch.gapFillingAnswer.answerRaw[0]).toHaveLength(1);
    expect(patch.gapFillingAnswer.answerRaw[0][0]).toContain("mathUrl=");
    expect(patch.gapFillingAnswer.answerRaw[0][0]).toContain("fwaefwefwe");
  });

  it("keeps formula image html in text-answer drafts without creating a patch", () => {
    const answer =
      '<p>结果为 <img src="https://example.com/formula.png?mathUrl=x%5E2%2B1" /></p>';
    const question = {
      answer,
      draftId: "answer-formula-1",
      questionScore: 5,
      type: 5,
    };
    const draft = buildQuestionEditorDraft(question);

    expect(draft.answerHtml).toBe(answer);
    expect(buildQuestionReferencePatch(question, draft)).toEqual({});
  });

  it("keeps formula image html in blank drafts without creating a patch", () => {
    const answerHtml =
      '<p><img src="https://example.com/formula.png?mathUrl=%5Csqrt%7B3%7D" /></p>';
    const question = {
      draftId: "blank-formula-unchanged",
      gapFillingAnswer: {
        answerRaw: [[answerHtml]],
        answers: ["$$\\sqrt{3}$$"],
        isOrder: false,
      },
      questionScore: 5,
      type: 3,
    };
    const draft = buildQuestionEditorDraft(question);

    expect(draft.blankAnswerGroups).toEqual([{ answers: [answerHtml] }]);
    expect(buildQuestionReferencePatch(question, draft)).toEqual({});
  });

  it("serializes mixed rich text and formulas through the blank transport boundary", () => {
    const question = {
      draftId: "blank-formula-mixed",
      gapFillingAnswer: { answers: ["旧答案"], isOrder: false },
      questionScore: 5,
      type: 3,
    };
    const mixedAnswerHtml =
      '<p><strong>约为</strong> <img src="https://example.com/formula.png?mathUrl=x%5E2" /></p>';
    const patch = buildQuestionReferencePatch(question, {
      ...buildQuestionEditorDraft(question),
      blankAnswerGroups: [{ answers: [mixedAnswerHtml] }],
    });

    expect(patch.gapFillingAnswer.answerRaw).toEqual([[mixedAnswerHtml]]);
    expect(patch.gapFillingAnswer.answers).toEqual(["约为 $x^2$"]);
  });

  it("keeps combination question child patches inside sonQuestionList", () => {
    const question = {
      analysis: "<p>旧总解析</p>",
      draftId: COMBINATION_DRAFT_ID,
      questionScore: 6,
      sonQuestionList: [
        {
          answer: false,
          draftId: "child-1",
          questionScore: 2,
          type: 4,
        },
      ],
      type: 6,
    };
    const draft = {
      ...buildQuestionEditorDraft(question),
      analysisText: "新总解析",
      scoreText: "7",
      subQuestionDrafts: [
        {
          ...buildQuestionEditorDraft(question.sonQuestionList[0]),
          answerText: "正确",
          scoreText: "3",
        },
      ],
    };

    expect(buildQuestionReferencePatch(question, draft)).toEqual({
      analysis: "<p>新总解析</p>",
      questionScore: 7,
      sonQuestionList: [
        {
          answer: "true",
          draftId: "child-1",
          questionScore: 3,
          type: 4,
        },
      ],
    });
  });

  it("uses combination sub-question scores as the initial parent score", () => {
    const question = {
      draftId: COMBINATION_DRAFT_ID,
      questionScore: 20,
      sonQuestionList: [
        {
          answer: "A",
          questionScore: 2,
          type: 1,
        },
        {
          answer: false,
          questionScore: 3,
          type: 4,
        },
        {
          answer: "说明",
          questionScore: 5,
          type: 5,
        },
      ],
      type: 6,
    };
    const draftMap = buildReferenceDraftMap([question]);
    const combinationDraft = Object.values(draftMap).shift();

    expect(combinationDraft.scoreText).toBe("10");
    expect(
      combinationDraft.subQuestionDrafts.map((draft) => draft.scoreText),
    ).toEqual(["2", "3", "5"]);
    expect(buildQuestionReferencePatch(question, combinationDraft)).toEqual({
      questionScore: 10,
    });
  });

  it("derives blank answer slot counts for normal and combination questions", () => {
    expect(
      buildBlankCountMap([
        {
          draftId: "blank-1",
          gapFillingAnswer: { answers: ["甲", "乙"], isOrder: true },
          type: 3,
        },
        {
          draftId: COMBINATION_DRAFT_ID,
          sonQuestionList: [
            {
              gapFillingAnswer: { answers: [], isOrder: false },
              type: 3,
            },
          ],
          type: 6,
        },
      ]),
    ).toEqual({
      "blank-1": 2,
      [`${COMBINATION_DRAFT_ID}__0`]: 1,
    });
  });

  it("upgrades legacy && blank answers into grouped editable drafts", () => {
    expect(
      buildBlankAnswerDraftGroups({
        answers: ["1ffewfef&&123&&321", "第二空&&备选"],
        isOrder: false,
      }),
    ).toEqual([
      { answers: ["1ffewfef", "123", "321"] },
      { answers: ["第二空", "备选"] },
    ]);
  });

  it("normalizes judge answer aliases before saving", () => {
    expect(normalizeJudgeAnswer("对")).toBe("true");
    expect(normalizeJudgeAnswer("FALSE")).toBe("false");
  });
});
