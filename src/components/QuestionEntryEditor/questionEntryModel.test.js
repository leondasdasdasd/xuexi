import {
  QUESTION_TYPE_ANSWER,
  QUESTION_TYPE_BLANK,
  QUESTION_TYPE_CHOICE,
  QUESTION_TYPE_COMBINATION,
  QUESTION_TYPE_JUDGE,
  QUESTION_TYPE_MULTIPLE_CHOICE,
  QUESTION_TYPE_MULTIPLE_VOTE,
  QUESTION_TYPE_SINGLE_VOTE,
  addOptionToQuestionDraft,
  buildQuestionEditorLocalSavePayload,
  buildQuestionEntrySavePayload,
  createBlankAnswerDraft,
  createEmptyQuestionDraft,
  createQuestionEditorDraft,
  removeOptionFromQuestionDraft,
  resetQuestionDraftByType,
  toggleQuestionOptionAnswer,
  validateQuestionEditorDraft,
} from "./questionEntryModel";

const QUESTION_CONTENT = "<p>题干</p>";
const CHAPTER_SELECTION_VALUE = "章节-zhangjie-11";
const INDICATOR_SELECTION_VALUE = "素养-suyang-30";
const KNOWLEDGE_SELECTION_VALUE = "知识点-zhishidian-20";

const withRequiredMeta = (question) => ({
  gradeId: 7,
  subjectId: 2,
  ...question,
});

describe("QuestionEntryEditor model", () => {
  it("creates drafts for all supported question types", () => {
    const supportedTypes = [
      QUESTION_TYPE_CHOICE,
      QUESTION_TYPE_MULTIPLE_CHOICE,
      QUESTION_TYPE_BLANK,
      QUESTION_TYPE_JUDGE,
      QUESTION_TYPE_ANSWER,
      QUESTION_TYPE_COMBINATION,
      QUESTION_TYPE_SINGLE_VOTE,
      QUESTION_TYPE_MULTIPLE_VOTE,
    ];

    expect(
      supportedTypes.map((type) => createEmptyQuestionDraft(type).type),
    ).toEqual(supportedTypes);
  });

  it("normalizes edit question data for display", () => {
    const draft = createQuestionEditorDraft({
      answer: "BA",
      chapterIds: [11],
      chapterValues: [CHAPTER_SELECTION_VALUE],
      content: QUESTION_CONTENT,
      gradeId: "7",
      indicatorValues: [INDICATOR_SELECTION_VALUE],
      knowledgeValues: [KNOWLEDGE_SELECTION_VALUE],
      optionList: [
        { answers: "A.<p>甲</p>", key: "A" },
        { answers: "B.<p>乙</p>", key: "B" },
      ],
      questionId: 123,
      subjectId: "2",
      type: QUESTION_TYPE_MULTIPLE_CHOICE,
    });

    expect(draft.answer).toBe("AB");
    expect(draft.optionList[0].answers).toBe("A.<p>甲</p>");
    expect(draft.questionId).toBe(123);
    expect(draft.chapterIds).toEqual([11]);
    expect(draft.chapterSelections).toEqual([CHAPTER_SELECTION_VALUE]);
    expect(draft.indicatorIds).toEqual([30]);
    expect(draft.indicatorSelections).toEqual([INDICATOR_SELECTION_VALUE]);
    expect(draft.knowledgeIds).toEqual([20]);
    expect(draft.knowledgeSelections).toEqual([KNOWLEDGE_SELECTION_VALUE]);
  });

  it("resets type-specific fields when changing question type", () => {
    const choiceDraft = createEmptyQuestionDraft(QUESTION_TYPE_CHOICE);
    const blankDraft = resetQuestionDraftByType(
      {
        ...choiceDraft,
        answer: "A",
        content: QUESTION_CONTENT,
      },
      QUESTION_TYPE_BLANK,
    );

    expect(blankDraft.type).toBe(QUESTION_TYPE_BLANK);
    expect(blankDraft.answer).toBeUndefined();
    expect(blankDraft.optionList).toEqual([]);
  });

  it("keeps option keys and answer mapping stable when options change", () => {
    const draft = {
      ...withRequiredMeta(createEmptyQuestionDraft(QUESTION_TYPE_CHOICE)),
      answer: "B",
      content: QUESTION_CONTENT,
      optionList: [
        {
          ...createEmptyQuestionDraft(QUESTION_TYPE_CHOICE).optionList[0],
          answers: "<p>甲</p>",
        },
        {
          ...createEmptyQuestionDraft(QUESTION_TYPE_CHOICE).optionList[1],
          answers: "<p>乙</p>",
        },
      ],
    };

    const addedDraft = addOptionToQuestionDraft(draft);
    const removedDraft = removeOptionFromQuestionDraft(addedDraft, 0);

    expect(addedDraft.optionList).toHaveLength(3);
    expect(removedDraft.optionList[0].key).toBe("A");
    expect(removedDraft.answer).toBe("A");
  });

  it("validates required choice answers but not vote answers", () => {
    const choiceDraft = withRequiredMeta({
      ...createEmptyQuestionDraft(QUESTION_TYPE_CHOICE),
      content: QUESTION_CONTENT,
      optionList: [
        { answers: "<p>A</p>", key: "A" },
        { answers: "<p>B</p>", key: "B" },
      ],
    });
    const voteDraft = {
      ...choiceDraft,
      type: QUESTION_TYPE_SINGLE_VOTE,
    };

    expect(validateQuestionEditorDraft(choiceDraft)).toContain(
      "请设置题目答案",
    );
    expect(validateQuestionEditorDraft(voteDraft)).toBe("");
  });

  it("serializes blank answers and filters empty wrappers", () => {
    const draft = withRequiredMeta({
      ...createEmptyQuestionDraft(QUESTION_TYPE_BLANK),
      content: QUESTION_CONTENT,
      gapFillingAnswer: {
        answerGroups: [
          {
            answers: [
              createBlankAnswerDraft("<p>&nbsp;</p>"),
              createBlankAnswerDraft("<p>甲</p>"),
              createBlankAnswerDraft("<p>乙</p>"),
            ],
          },
        ],
        isOrder: true,
      },
    });
    const payload = buildQuestionEditorLocalSavePayload(draft);

    expect(payload.draft.gapFillingAnswer).toEqual({
      answers: ["<p>甲</p>&&<p>乙</p>"],
      isOrder: true,
    });
  });

  it("serializes combination children", () => {
    const childDraft = toggleQuestionOptionAnswer(
      {
        ...createEmptyQuestionDraft(QUESTION_TYPE_CHOICE),
        content: "<p>子题</p>",
        optionList: [
          { answers: "<p>A</p>", key: "A" },
          { answers: "<p>B</p>", key: "B" },
        ],
      },
      "A",
      true,
    );
    const draft = withRequiredMeta({
      ...createEmptyQuestionDraft(QUESTION_TYPE_COMBINATION),
      content: QUESTION_CONTENT,
      sonQuestionList: [childDraft],
    });
    const payload = buildQuestionEditorLocalSavePayload(draft);

    expect(payload.draft.sonQuestionList).toHaveLength(1);
    expect(payload.draft.sonQuestionList[0].answer).toBe("A");
  });

  it("builds the API save payload with root metadata", () => {
    const draft = withRequiredMeta({
      ...createEmptyQuestionDraft(QUESTION_TYPE_JUDGE),
      answer: true,
      chapterSelections: ["章节-zhangjie-10"],
      chapterLabels: ["章节"],
      content: QUESTION_CONTENT,
      indicatorSelections: [INDICATOR_SELECTION_VALUE],
      knowledgeSelections: [KNOWLEDGE_SELECTION_VALUE],
    });
    const payload = buildQuestionEntrySavePayload(draft);

    expect(payload).toMatchObject({
      chapterIds: [10],
      chapterValues: ["章节-zhangjie-10"],
      gradeId: 7,
      indicatorIds: [30],
      knowledgeIds: [20],
      knowledgeValues: [KNOWLEDGE_SELECTION_VALUE],
      subjectId: 2,
    });
    expect(payload.questionList[0]).toMatchObject({
      answer: true,
      content: QUESTION_CONTENT,
      type: QUESTION_TYPE_JUDGE,
    });
  });

  it("keeps essay answers as rich text html", () => {
    const payload = buildQuestionEditorLocalSavePayload(
      withRequiredMeta({
        ...createEmptyQuestionDraft(QUESTION_TYPE_ANSWER),
        answer: "<p>答案</p>",
        content: QUESTION_CONTENT,
      }),
    );

    expect(payload.draft.answer).toBe("<p>答案</p>");
  });
});
