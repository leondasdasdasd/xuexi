import {
  appendPaperModule,
  appendPaperQuestionFromAsset,
  appendPaperQuestionsFromLibrary,
  collectBasketBusinessQuestionTypeIds,
  collectMissingPaperQuestionScores,
  createPaperEditorDraft,
  createPaperSaveRequest,
  getModuleScore,
  getPaperTotalScore,
  movePaperQuestion,
  movePaperModule,
  removePaperQuestion,
  removePaperModule,
  replacePaperQuestionFromAsset,
  setLeafQuestionScore,
  setPaperModuleLeafScores,
  updatePaperGrade,
  updatePaperSubject,
  updateModuleTitle,
  validatePaperEditorDraft,
} from "../paperEditorModel";
import type { PaperQuestionAssetResult } from "../questionAssetPaperAdapter";
import type { BasketQuestionResponse, QuestionBasketResponse } from "../types";

jest.mock("@yungu-fed/question-editor", () => ({
  normalizeRichTextContent: (value: unknown) => value,
}));

const question = (
  questionId: number,
  businessQuestionTypeId: number,
  children: BasketQuestionResponse[] = [],
  type = children.length > 0 ? 6 : 1,
): BasketQuestionResponse => ({
  questionId,
  type,
  businessQuestionTypeId,
  knowledgeIds: [],
  knowledgeValues: [],
  chapterIds: [],
  chapterValues: [],
  indicatorIds: [],
  indicatorValues: [],
  children,
  questionData: {
    id: questionId,
    businessQuestionTypeId,
    version: "1",
    elements: [],
    extras: [],
    children: children.map((child) => child.questionData),
  },
});

const assetResult = (
  questionId: number,
  questionTypeKey = 101,
): PaperQuestionAssetResult => ({
  question: {
    key: `question-${questionId}`,
    questionId,
    content: {
      id: questionId,
      questionTypeKey,
      version: "1",
      elements: [],
      extras: [],
      children: [],
    },
    children: [],
  },
  questionTypeTemplates: [
    {
      label: `题型${questionTypeKey}`,
      questionTypeKey,
      structure: {
        elements: [],
        extras: [],
        hasAnswer: true,
        isComposite: false,
      },
    },
  ],
});

const basket = (): QuestionBasketResponse => ({
  subjectId: 2,
  subjectName: "数学",
  moduleList: [
    {
      moduleName: "选择题",
      moduleQuestionNumber: "2",
      moduleType: 0,
      businessQuestionTypeId: 101,
      questionList: [question(1, 101), question(2, 101)],
    },
    {
      moduleName: "复合题",
      moduleQuestionNumber: "1",
      moduleType: 0,
      businessQuestionTypeId: 106,
      questionList: [question(3, 106, [question(31, 101), question(32, 102)])],
    },
  ],
});

const questionTypes = [101, 102, 106].map((businessQuestionTypeId) => ({
  businessQuestionTypeId,
  name: `题型${businessQuestionTypeId}`,
  elements: [],
  extras: [],
  globalConfig: { hasAnswer: true },
}));

const draftWithSelectedGrade = () =>
  updatePaperGrade(createPaperEditorDraft(basket(), questionTypes), {
    gradeId: 7,
    name: "七年级",
  });

describe("paper editor model", () => {
  it("maps the complete v2 basket tree and collects all question types", () => {
    const response = basket();
    const draft = createPaperEditorDraft(response, questionTypes, "zh-CN");

    expect(collectBasketBusinessQuestionTypeIds(response)).toEqual([
      101, 106, 102,
    ]);
    expect(draft.modules.map((module) => module.title)).toEqual([
      "选择题",
      "复合题",
    ]);
    expect(draft).not.toHaveProperty("gradeId");
    expect(draft).not.toHaveProperty("gradeName");
    expect(draft.modules[1].questions[0].content).toMatchObject({
      id: 3,
      questionTypeKey: 106,
      children: [
        { id: 31, questionTypeKey: 101 },
        { id: 32, questionTypeKey: 102 },
      ],
    });
  });

  it("leaves grade empty until the user selects one", () => {
    const draft = createPaperEditorDraft(basket(), questionTypes);

    expect(draft).not.toHaveProperty("gradeId");
    expect(draft).not.toHaveProperty("gradeName");

    const updated = updatePaperGrade(draft, {
      gradeId: 8,
      name: "八年级",
    });
    expect(updated).toMatchObject({ gradeId: 8, gradeName: "八年级" });
    expect(updated.modules).toBe(draft.modules);
  });

  it("updates the paper subject without changing its questions", () => {
    const draft = createPaperEditorDraft(basket(), questionTypes);
    const updated = updatePaperSubject(draft, {
      name: "英语",
      subjectId: 3,
    });

    expect(updated).toMatchObject({ subjectId: 3, subjectName: "英语" });
    expect(updated.modules).toBe(draft.modules);
    expect(createPaperSaveRequest({ ...updated, paperType: 1 }).subjectId).toBe(
      3,
    );
  });

  it("updates titles and supports module and within-module ordering", () => {
    const draft = createPaperEditorDraft(basket(), questionTypes);
    const renamed = updateModuleTitle(draft, draft.modules[0].key, "基础题");
    const movedQuestions = movePaperQuestion(renamed, {
      sourceModuleKey: renamed.modules[0].key,
      sourceQuestionIndex: 0,
      targetModuleKey: renamed.modules[0].key,
      targetQuestionIndex: 1,
    });
    const movedModules = movePaperModule(movedQuestions, 0, 1);

    expect(movedModules.modules[0].title).toBe("复合题");
    expect(movedModules.modules[1].title).toBe("基础题");
    expect(
      movedModules.modules[1].questions.map((item) => item.questionId),
    ).toEqual([2, 1]);
  });

  it("moves a question across modules and preserves the empty source module", () => {
    const draft = createPaperEditorDraft(basket(), questionTypes);
    const compositeQuestion = draft.modules[1].questions[0];
    const moved = movePaperQuestion(draft, {
      sourceModuleKey: draft.modules[1].key,
      sourceQuestionIndex: 0,
      targetModuleKey: draft.modules[0].key,
      targetQuestionIndex: 1,
    });

    expect(moved.modules).toHaveLength(2);
    expect(moved.modules[0].questions.map((item) => item.questionId)).toEqual([
      1, 3, 2,
    ]);
    expect(moved.modules[0].questions[1]).toBe(compositeQuestion);
    expect(moved.modules[1].questions).toEqual([]);
  });

  it("inserts cross-module questions at the beginning and end", () => {
    const draft = createPaperEditorDraft(basket(), questionTypes);
    const movedToBeginning = movePaperQuestion(draft, {
      sourceModuleKey: draft.modules[0].key,
      sourceQuestionIndex: 1,
      targetModuleKey: draft.modules[1].key,
      targetQuestionIndex: 0,
    });
    expect(
      movedToBeginning.modules[1].questions.map((item) => item.questionId),
    ).toEqual([2, 3]);

    const movedToEnd = movePaperQuestion(draft, {
      sourceModuleKey: draft.modules[0].key,
      sourceQuestionIndex: 1,
      targetModuleKey: draft.modules[1].key,
      targetQuestionIndex: 1,
    });
    expect(
      movedToEnd.modules[1].questions.map((item) => item.questionId),
    ).toEqual([3, 2]);
  });

  it("keeps the draft unchanged for invalid question moves", () => {
    const draft = createPaperEditorDraft(basket(), questionTypes);

    expect(
      movePaperQuestion(draft, {
        sourceModuleKey: "missing-module",
        sourceQuestionIndex: 0,
        targetModuleKey: draft.modules[0].key,
        targetQuestionIndex: 0,
      }),
    ).toBe(draft);
  });

  it("uses leaf scores as the only source for composite and aggregate scores", () => {
    let draft = draftWithSelectedGrade();
    draft = { ...draft, title: "期中练习", paperType: 1 };
    draft = setLeafQuestionScore(draft, "question-1", 2);
    draft = setLeafQuestionScore(draft, "question-2", 3);
    draft = setLeafQuestionScore(draft, "question-31", 4);
    draft = setLeafQuestionScore(draft, "question-32", 5);

    expect(getModuleScore(draft.modules[1])).toBe(9);
    expect(getPaperTotalScore(draft)).toBe(14);
    expect(validatePaperEditorDraft(draft)).toBeUndefined();

    const request = createPaperSaveRequest(draft);
    expect(request.totalScore).toBe(14);
    expect(request.modules[1]).toMatchObject({
      moduleName: "复合题",
      questions: [
        {
          questionId: 3,
          questionScore: 9,
          children: [
            { questionId: 31, questionScore: 4 },
            { questionId: 32, questionScore: 5 },
          ],
        },
      ],
    });
    expect(request).not.toHaveProperty("modules.1.questions.0.sonQuestionList");
  });

  it("keeps decimal score totals at one-decimal precision", () => {
    let draft = draftWithSelectedGrade();
    draft = { ...draft, title: "小数分值练习", paperType: 1 };
    draft = setLeafQuestionScore(draft, "question-1", 0.1);
    draft = setLeafQuestionScore(draft, "question-2", 0.2);
    draft = setLeafQuestionScore(draft, "question-31", 1.5);
    draft = setLeafQuestionScore(draft, "question-32", 2);

    expect(getModuleScore(draft.modules[0])).toBe(0.3);
    expect(getModuleScore(draft.modules[1])).toBe(3.5);
    expect(getPaperTotalScore(draft)).toBe(3.8);
    expect(validatePaperEditorDraft(draft)).toBeUndefined();
    expect(createPaperSaveRequest(draft)).toMatchObject({
      totalScore: 3.8,
      modules: [
        { questions: [{ questionScore: 0.1 }, { questionScore: 0.2 }] },
        {
          questions: [{ questionScore: 3.5 }],
        },
      ],
    });
  });

  it("serializes nested composite questions with children recursively", () => {
    const response = basket();
    response.moduleList[1].questionList = [
      question(3, 106, [question(31, 106, [question(311, 101)])]),
    ];
    let draft = createPaperEditorDraft(response, questionTypes);
    draft = { ...draft, title: "嵌套组合题", paperType: 1 };
    draft = setLeafQuestionScore(draft, "question-311", 6);

    const savedQuestion = createPaperSaveRequest(draft).modules[1].questions[0];

    expect(savedQuestion).toEqual({
      questionId: 3,
      questionScore: 6,
      children: [
        {
          questionId: 31,
          questionScore: 6,
          children: [{ questionId: 311, questionScore: 6 }],
        },
      ],
    });
    expect(JSON.stringify(savedQuestion)).not.toContain("sonQuestionList");
  });

  it("batch fills only missing leaf scores inside the selected module", () => {
    let draft = createPaperEditorDraft(basket(), questionTypes);
    draft = setLeafQuestionScore(draft, "question-1", 2);

    const updated = setPaperModuleLeafScores(
      draft,
      draft.modules[0].key,
      3,
      "missing-only",
    );

    expect(updated.modules[0].questions.map((item) => item.score)).toEqual([
      2, 3,
    ]);
    expect(updated.modules[1].questions[0].children).toEqual(
      draft.modules[1].questions[0].children,
    );
  });

  it("batch overwrites every nested leaf and recalculates aggregate scores", () => {
    let draft = createPaperEditorDraft(basket(), questionTypes);
    draft = setLeafQuestionScore(draft, "question-31", 1);
    draft = setLeafQuestionScore(draft, "question-32", 2);

    const updated = setPaperModuleLeafScores(
      draft,
      draft.modules[1].key,
      4,
      "overwrite-all",
    );

    expect(
      updated.modules[1].questions[0].children.map((item) => item.score),
    ).toEqual([4, 4]);
    expect(getModuleScore(updated.modules[1])).toBe(8);
    expect(getPaperTotalScore(updated)).toBe(8);
  });

  it("collects missing scores with whole-paper numbers and leaf paths", () => {
    let draft = createPaperEditorDraft(basket(), questionTypes);
    draft = setLeafQuestionScore(draft, "question-2", 2);
    draft = setLeafQuestionScore(draft, "question-31", 3);

    expect(collectMissingPaperQuestionScores(draft)).toEqual([
      {
        leafQuestionKey: "question-1",
        moduleKey: draft.modules[0].key,
        path: [],
        questionKey: "question-1",
        questionNumber: 1,
      },
      {
        leafQuestionKey: "question-32",
        moduleKey: draft.modules[1].key,
        path: [2],
        questionKey: "question-3",
        questionNumber: 3,
      },
    ]);
  });

  it("validates required scores and preserves modules after deleting the last question", () => {
    let draft = draftWithSelectedGrade();
    draft = { ...draft, title: "练习", paperType: 1 };
    expect(validatePaperEditorDraft(draft)).toMatchObject({
      code: "missingScore",
    });

    draft = removePaperQuestion(draft, "question-3");
    expect(draft.modules).toHaveLength(2);
    expect(draft.modules[0].questions).toHaveLength(2);
    expect(draft.modules[1].questions).toEqual([]);
    expect(validatePaperEditorDraft(draft)).toBe("emptyModule");
  });

  it("creates and explicitly removes an empty module", () => {
    const draft = createPaperEditorDraft(basket(), questionTypes);
    const updated = appendPaperModule(draft);
    const addedModule = updated.modules.at(-1)!;

    expect(addedModule).toEqual({
      key: "module-new-3",
      questions: [],
      title: "",
    });
    expect(removePaperModule(updated, addedModule.key).modules).toEqual(
      draft.modules,
    );
  });

  it.each([0, -0.1, 1.25])("rejects an invalid leaf score of %s", (score) => {
    let draft = draftWithSelectedGrade();
    draft = { ...draft, title: "练习", paperType: 1 };
    draft = setLeafQuestionScore(draft, "question-1", score);
    draft = setLeafQuestionScore(draft, "question-2", 1);
    draft = setLeafQuestionScore(draft, "question-31", 1);
    draft = setLeafQuestionScore(draft, "question-32", 1);

    expect(validatePaperEditorDraft(draft)).toMatchObject({
      code: "missingScore",
    });
  });

  it("requires a selected grade and saves the latest selection", () => {
    let draft = createPaperEditorDraft(basket(), questionTypes);
    draft = {
      ...draft,
      gradeId: undefined,
      gradeName: undefined,
      paperType: 1,
      title: "练习",
    };

    expect(validatePaperEditorDraft(draft)).toBe("missingGrade");

    const updated = updatePaperGrade(draft, {
      gradeId: 8,
      name: "八年级",
    });
    expect(createPaperSaveRequest(updated).gradeId).toBe(8);
  });

  it("requires a score for every leaf regardless of question type", () => {
    const response = basket();
    response.moduleList[0].questionList[0] = question(1, 101, [], 7);
    let draft = updatePaperGrade(
      createPaperEditorDraft(response, questionTypes),
      { gradeId: 7, name: "七年级" },
    );
    draft = { ...draft, title: "练习", paperType: 1 };
    draft = setLeafQuestionScore(draft, "question-2", 2);
    draft = setLeafQuestionScore(draft, "question-31", 3);
    draft = setLeafQuestionScore(draft, "question-32", 4);

    expect(validatePaperEditorDraft(draft)).toMatchObject({
      code: "missingScore",
    });
    draft = setLeafQuestionScore(draft, "question-1", 1);
    expect(validatePaperEditorDraft(draft)).toBeUndefined();
    expect(createPaperSaveRequest(draft)).toMatchObject({
      modules: [
        { questions: expect.any(Array) },
        { questions: expect.any(Array) },
      ],
    });
    expect(createPaperSaveRequest(draft)).not.toHaveProperty(
      "questionTypeNumberModels",
    );
  });

  it("includes the saved paper id on subsequent saves", () => {
    let draft = createPaperEditorDraft(basket(), questionTypes);
    draft = { ...draft, title: "练习", paperType: 1, paperId: 99 };
    draft = setLeafQuestionScore(draft, "question-1", 1);
    draft = setLeafQuestionScore(draft, "question-2", 1);
    draft = setLeafQuestionScore(draft, "question-31", 1);
    draft = setLeafQuestionScore(draft, "question-32", 1);

    expect(createPaperSaveRequest(draft).paperId).toBe(99);
  });

  it("blocks saving while an unassociated placement remains", () => {
    const draft = {
      ...draftWithSelectedGrade(),
      paperType: 1,
      title: "练习",
    };
    draft.modules[0].questions.push({
      children: [],
      content: null,
      key: "empty-placement-0-1",
      questionId: null,
      score: 1,
    });

    expect(validatePaperEditorDraft(draft)).toBe("emptyPlacement");
  });

  it("replaces edited question content while preserving its score", () => {
    let draft = createPaperEditorDraft(basket(), questionTypes);
    draft = setLeafQuestionScore(draft, "question-1", 4);

    const updated = replacePaperQuestionFromAsset(draft, 1, assetResult(1));

    expect(updated.modules[0].questions[0]).toMatchObject({
      questionId: 1,
      score: 4,
    });
  });

  it("creates a question type module for every newly entered question", () => {
    const draft = createPaperEditorDraft(basket(), questionTypes);
    const updated = appendPaperQuestionFromAsset(draft, assetResult(99, 999));
    const finalModule = updated.modules.at(-1)!;

    expect(updated.modules).toHaveLength(draft.modules.length + 1);
    expect(finalModule).toMatchObject({
      key: "module-999-question-99",
      title: "题型999",
      questions: [expect.objectContaining({ questionId: 99 })],
    });
    expect(draft.modules.at(-1)?.questions).not.toEqual(finalModule.questions);
    expect(updated.questionTypeTemplates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ questionTypeKey: 999 }),
      ]),
    );
  });

  it("creates another module when the same question type already exists", () => {
    const draft = createPaperEditorDraft(basket(), questionTypes);
    const updated = appendPaperQuestionFromAsset(draft, assetResult(99, 101));

    expect(updated.modules).toHaveLength(draft.modules.length + 1);
    expect(updated.modules.at(-1)).toMatchObject({
      title: "题型101",
      questions: [expect.objectContaining({ questionId: 99 })],
    });
  });

  it("creates the first module from the saved question type", () => {
    const draft = {
      ...createPaperEditorDraft(basket(), questionTypes),
      modules: [],
    };
    const updated = appendPaperQuestionFromAsset(draft, assetResult(99, 101));

    expect(updated.modules).toEqual([
      expect.objectContaining({
        title: "题型101",
        questions: [expect.objectContaining({ questionId: 99 })],
      }),
    ]);
  });

  it("rejects a new question without exactly one matching type template", () => {
    const draft = createPaperEditorDraft(basket(), questionTypes);
    const missingTemplateResult = assetResult(99, 999);
    missingTemplateResult.questionTypeTemplates = [];
    const duplicateTemplateResult = assetResult(100, 999);
    duplicateTemplateResult.questionTypeTemplates.push(
      duplicateTemplateResult.questionTypeTemplates[0],
    );

    expect(() =>
      appendPaperQuestionFromAsset(draft, missingTemplateResult),
    ).toThrow();
    expect(() =>
      appendPaperQuestionFromAsset(draft, duplicateTemplateResult),
    ).toThrow();
    expect(draft.modules).toHaveLength(2);
  });

  it("appends library questions to the requested module in selection order", () => {
    const draft = createPaperEditorDraft(basket(), questionTypes);
    const results = [assetResult(99, 101), assetResult(100, 101)];
    const updated = appendPaperQuestionsFromLibrary(
      draft,
      draft.modules[0].key,
      results,
    );

    expect(updated.modules[0].questions.map((item) => item.questionId)).toEqual(
      [1, 2, 99, 100],
    );
    expect(updated.modules[1].questions).toHaveLength(1);
  });

  it("allows mixed question types but rejects duplicate library questions", () => {
    const draft = createPaperEditorDraft(basket(), questionTypes);

    const mixed = appendPaperQuestionsFromLibrary(draft, draft.modules[0].key, [
      assetResult(99, 102),
    ]);
    expect(mixed.modules[0].questions.at(-1)?.content?.questionTypeKey).toBe(
      102,
    );

    expect(() =>
      appendPaperQuestionsFromLibrary(draft, draft.modules[0].key, [
        assetResult(1, 101),
      ]),
    ).toThrow();
    expect(draft.modules[0].questions).toHaveLength(2);
  });
});
