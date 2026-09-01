import {
  buildSubQuestionSelectionId,
  mergeSelectedQuestionsIntoCombination,
  splitSelectedCombinationQuestion,
} from "./questionTaskStructure";

const FIRST_SPLIT_DRAFT_ID = "page-1-generated-1";
const SECOND_SPLIT_DRAFT_ID = "page-1-generated-2";

const createIdFactory = (event) => {
  void event;
  const state = { index: 0 };

  return (prefix = "draft") => {
    state.index += 1;
    return `${prefix}-generated-${state.index}`;
  };
};

const createUuidFactory = (event) => {
  void event;
  const state = { index: 0 };

  return (uuidEvent) => {
    void uuidEvent;
    state.index += 1;
    return `uuid-generated-${state.index}`;
  };
};

const createQuestion = (draftId, patch = {}) => ({
  analysis: `<p>${draftId} 解析</p>`,
  answer: "A",
  content: `<p>${draftId} 题干</p>`,
  deleted: false,
  draftId,
  optionList: [],
  questionId: Number(draftId.replaceAll(/\D/g, "")) || undefined,
  questionLevel: 2,
  questionScore: 2,
  sortOrder: 0,
  type: 5,
  typeLabel: "问答题",
  uuid: `${draftId}-uuid`,
  ...patch,
});

const createPage = (pageKey, questions) => ({
  pageIndex: Number(pageKey.replaceAll(/\D/g, "")) || 0,
  pageKey,
  questions,
});

const getVisibleQuestions = (pages) =>
  pages
    .flatMap((page) => page.questions)
    .filter((question) => !question.deleted);

const getQuestionTypeLabel = (type) =>
  Number(type) === 6 ? "组合题" : "问答题";

describe("QuestionTask structure transforms", () => {
  it("merges non-combination questions from any page into one combination question", () => {
    const pages = [
      createPage("page-1", [
        createQuestion("q1", { sortOrder: 0 }),
        createQuestion("q2", { sortOrder: 1 }),
      ]),
      createPage("page-2", [createQuestion("q3", { sortOrder: 2 })]),
    ];

    const result = mergeSelectedQuestionsIntoCombination({
      createDraftId: createIdFactory(),
      createUuid: createUuidFactory(),
      getQuestionTypeLabel,
      pages,
      selectedQuestionIds: ["q3", "q1"],
      visibleQuestions: getVisibleQuestions(pages),
    });

    expect(result.ok).toBe(true);
    expect(result.mode).toBe("create");
    expect(result.focusQuestionId).toBe("page-1-generated-3");

    const nextQuestions = result.pages.flatMap((page) => page.questions);
    const combinationQuestion = nextQuestions.find(
      (question) => question.draftId === result.focusQuestionId,
    );

    expect(combinationQuestion).toMatchObject({
      content: "",
      questionId: undefined,
      type: 6,
      typeLabel: "组合题",
    });
    expect(
      combinationQuestion.sonQuestionList.map((item) => item.content),
    ).toEqual(["<p>q1 题干</p>", "<p>q3 题干</p>"]);
    expect(
      nextQuestions
        .filter((question) => ["q1", "q3"].includes(question.draftId))
        .every((question) => question.deleted),
    ).toBe(true);
  });

  it("appends selected non-combination questions to the selected combination question", () => {
    const combinationQuestion = createQuestion("combo", {
      answer: "",
      content: "<p>公共题干</p>",
      sonQuestionList: [createQuestion("child-1", { questionId: undefined })],
      type: 6,
      typeLabel: "组合题",
    });
    const pages = [
      createPage("page-1", [
        createQuestion("q1", { sortOrder: 0 }),
        combinationQuestion,
      ]),
      createPage("page-2", [createQuestion("q3", { sortOrder: 2 })]),
    ];

    const result = mergeSelectedQuestionsIntoCombination({
      createDraftId: createIdFactory(),
      createUuid: createUuidFactory(),
      getQuestionTypeLabel,
      pages,
      selectedQuestionIds: ["combo", "q3", "q1"],
      visibleQuestions: getVisibleQuestions(pages),
    });

    expect(result.ok).toBe(true);
    expect(result.mode).toBe("append");
    expect(result.focusQuestionId).toBe("combo");

    const nextCombinationQuestion = result.pages
      .flatMap((page) => page.questions)
      .find((question) => question.draftId === "combo");

    expect(nextCombinationQuestion.content).toBe("<p>公共题干</p>");
    expect(
      nextCombinationQuestion.sonQuestionList.map((item) => item.content),
    ).toEqual(["<p>child-1 题干</p>", "<p>q1 题干</p>", "<p>q3 题干</p>"]);
  });

  it("rejects merging more than one combination question", () => {
    const pages = [
      createPage("page-1", [
        createQuestion("combo-1", { type: 6 }),
        createQuestion("combo-2", { type: 6 }),
        createQuestion("q1"),
      ]),
    ];

    const result = mergeSelectedQuestionsIntoCombination({
      createDraftId: createIdFactory(),
      createUuid: createUuidFactory(),
      getQuestionTypeLabel,
      pages,
      selectedQuestionIds: ["combo-1", "combo-2", "q1"],
      visibleQuestions: getVisibleQuestions(pages),
    });

    expect(result.ok).toBe(false);
    expect(result.errorMessage).toBe("一次只能选择一个组合题参与合并");
  });

  it("splits one combination question into top-level questions and prefixes the parent stem", () => {
    const pages = [
      createPage("page-1", [
        createQuestion("combo", {
          content: "<p>拆分后应丢弃的公共题干</p>",
          sonQuestionList: [
            createQuestion("child-1", { content: "<p>子题 1</p>" }),
            createQuestion("child-2", { content: "<p>子题 2</p>" }),
          ],
          type: 6,
          typeLabel: "组合题",
        }),
        createQuestion("q3", { sortOrder: 1 }),
      ]),
    ];

    const result = splitSelectedCombinationQuestion({
      createDraftId: createIdFactory(),
      createUuid: createUuidFactory(),
      getQuestionTypeLabel,
      pages,
      selectedQuestionIds: ["combo"],
      visibleQuestions: getVisibleQuestions(pages),
    });

    expect(result.ok).toBe(true);
    expect(result.mode).toBe("split");

    const nextQuestions = result.pages.flatMap((page) => page.questions);
    const splitQuestions = nextQuestions.filter((question) =>
      [FIRST_SPLIT_DRAFT_ID, SECOND_SPLIT_DRAFT_ID].includes(question.draftId),
    );

    expect(
      nextQuestions.find((question) => question.draftId === "combo").deleted,
    ).toBe(true);
    expect(splitQuestions.map((question) => question.content)).toEqual([
      "<p>拆分后应丢弃的公共题干</p><p><br/></p><p>子题 1</p>",
      "<p>拆分后应丢弃的公共题干</p><p><br/></p><p>子题 2</p>",
    ]);
    expect(
      splitQuestions.every((question) =>
        question.content.includes("拆分后应丢弃的公共题干"),
      ),
    ).toBe(true);
  });

  it("splits selected subquestions and keeps unselected subquestions in the combination", () => {
    const pages = [
      createPage("page-1", [
        createQuestion("combo", {
          content: "<p>拆分后应丢弃的公共题干</p>",
          questionScore: 12,
          sonQuestionList: [
            createQuestion("child-1", {
              content: "<p>保留在组合题的小题</p>",
              questionScore: 4,
            }),
            createQuestion("child-2", {
              content: "<p>拆出的子题 2</p>",
              questionScore: 5,
            }),
            createQuestion("child-3", {
              content: "<p>拆出的子题 3</p>",
              questionScore: 3,
            }),
          ],
          type: 6,
          typeLabel: "组合题",
        }),
        createQuestion("q4", { sortOrder: 1 }),
      ]),
    ];

    const result = splitSelectedCombinationQuestion({
      createDraftId: createIdFactory(),
      createUuid: createUuidFactory(),
      getQuestionTypeLabel,
      pages,
      selectedQuestionIds: [
        buildSubQuestionSelectionId("combo", 1),
        buildSubQuestionSelectionId("combo", 2),
      ],
      visibleQuestions: getVisibleQuestions(pages),
    });

    expect(result.ok).toBe(true);
    expect(result.mode).toBe("split");

    const nextQuestions = result.pages.flatMap((page) => page.questions);
    const nextCombinationQuestion = nextQuestions.find(
      (question) => question.draftId === "combo",
    );
    const splitQuestions = nextQuestions.filter((question) =>
      [FIRST_SPLIT_DRAFT_ID, SECOND_SPLIT_DRAFT_ID].includes(question.draftId),
    );

    expect(nextCombinationQuestion.deleted).toBe(false);
    expect(nextCombinationQuestion.questionScore).toBe(4);
    expect(
      nextCombinationQuestion.sonQuestionList.map(
        (question) => question.content,
      ),
    ).toEqual(["<p>保留在组合题的小题</p>"]);
    expect(splitQuestions.map((question) => question.content)).toEqual([
      "<p>拆分后应丢弃的公共题干</p><p><br/></p><p>拆出的子题 2</p>",
      "<p>拆分后应丢弃的公共题干</p><p><br/></p><p>拆出的子题 3</p>",
    ]);
    expect(
      nextCombinationQuestion.sonQuestionList.some((question) =>
        question.content.includes("拆分后应丢弃的公共题干"),
      ),
    ).toBe(false);
  });

  it("falls back to whichever stem exists when splitting", () => {
    const pages = [
      createPage("page-1", [
        createQuestion("combo", {
          content: "",
          sonQuestionList: [
            createQuestion("child-1", { content: "<p>只有子题题干</p>" }),
            createQuestion("child-2", { content: "" }),
          ],
          type: 6,
          typeLabel: "组合题",
        }),
      ]),
    ];

    const result = splitSelectedCombinationQuestion({
      createDraftId: createIdFactory(),
      createUuid: createUuidFactory(),
      getQuestionTypeLabel,
      pages,
      selectedQuestionIds: ["combo"],
      visibleQuestions: getVisibleQuestions(pages),
    });

    const splitQuestions = result.pages
      .flatMap((page) => page.questions)
      .filter((question) =>
        [FIRST_SPLIT_DRAFT_ID, SECOND_SPLIT_DRAFT_ID].includes(
          question.draftId,
        ),
      );

    expect(splitQuestions.map((question) => question.content)).toEqual([
      "<p>只有子题题干</p>",
      "",
    ]);
  });
});
