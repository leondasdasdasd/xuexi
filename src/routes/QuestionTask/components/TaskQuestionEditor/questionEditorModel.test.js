import {
  QUESTION_TYPE_BLANK,
  QUESTION_TYPE_CHOICE,
  buildQuestionEditorLocalSavePayload,
  createEmptyQuestionDraft,
  createQuestionEditorDraft,
  hasRichTextContent,
  validateQuestionEditorDraft,
  validateQuestionEditorMetadata,
} from "./questionEditorModel";

const QUESTION_STEM = "<p>题干</p>";
const EMPTY_PARAGRAPH_HTML = "<p><br /></p>";
const EMPTY_NBSP_HTML = "<p>&nbsp;</p>";
const NULL_GAP_FILLING_ANSWER = JSON.parse("null");
const VALID_BLANK_ANSWER = "甲";
const OPTION_WITH_LETTER_SPACE = "<p>A BBBB</p>";
const OPTION_WITH_LETTER_DOT = "B. BBBB";
const FORMULA_ANSWER_HTML =
  '<p><img src="https://example.com/formula.png?mathUrl=x%5E2" alt="x^2" /></p>';

describe("TaskQuestionEditor blank answer model", () => {
  it("does not create an empty answer item when gapFillingAnswer is null", () => {
    const draft = createQuestionEditorDraft({
      content: QUESTION_STEM,
      gapFillingAnswer: NULL_GAP_FILLING_ANSWER,
      type: QUESTION_TYPE_BLANK,
    });
    const savePayload = buildQuestionEditorLocalSavePayload(draft);

    expect(draft.gapFillingAnswer.answerGroups).toHaveLength(1);
    expect(draft.gapFillingAnswer.answerGroups[0].answers).toEqual([]);
    expect(savePayload.draft.gapFillingAnswer).toEqual({
      answerRaw: [],
      answers: [],
      isOrder: false,
    });
  });

  it("filters empty rich text wrappers when saving blank answers", () => {
    const draft = createQuestionEditorDraft({
      content: QUESTION_STEM,
      gapFillingAnswer: {
        answers: [EMPTY_PARAGRAPH_HTML, EMPTY_NBSP_HTML, VALID_BLANK_ANSWER],
        isOrder: true,
      },
      type: QUESTION_TYPE_BLANK,
    });
    const savePayload = buildQuestionEditorLocalSavePayload(draft);

    expect(savePayload.draft.gapFillingAnswer).toEqual({
      answerRaw: [[VALID_BLANK_ANSWER]],
      answers: [VALID_BLANK_ANSWER],
      isOrder: true,
    });
  });

  it("prefers answerRaw groups and keeps legacy answers in sync", () => {
    const draft = createQuestionEditorDraft({
      content: QUESTION_STEM,
      gapFillingAnswer: {
        answerRaw: [["<p>甲</p>", FORMULA_ANSWER_HTML]],
        answers: ["旧字符串"],
        isOrder: false,
      },
      type: QUESTION_TYPE_BLANK,
    });
    const savePayload = buildQuestionEditorLocalSavePayload(draft);

    expect(
      draft.gapFillingAnswer.answerGroups[0].answers.map(
        (answer) => answer.content,
      ),
    ).toEqual(["<p>甲</p>", FORMULA_ANSWER_HTML]);
    expect(savePayload.draft.gapFillingAnswer).toEqual({
      answerRaw: [["<p>甲</p>", FORMULA_ANSWER_HTML]],
      answers: ["甲&&$$x^2$$"],
      isOrder: false,
    });
  });

  it("validates metadata independently from full question completeness", () => {
    expect(
      validateQuestionEditorMetadata({
        content: "",
        gradeId: 7,
        subjectId: 2,
      }),
    ).toBe("");
    expect(
      validateQuestionEditorMetadata({
        content: QUESTION_STEM,
        gradeId: 7,
      }),
    ).toBe("年级、学科缺一不可哦~");
  });

  it("keeps full editor validation for flows that still need content checks", () => {
    expect(
      validateQuestionEditorDraft({
        content: "",
        gradeId: 7,
        subjectId: 2,
        type: QUESTION_TYPE_BLANK,
      }),
    ).toBe("当前题：请输入题目");
  });

  it("creates canonical default drafts for manual choice questions", () => {
    const draft = createEmptyQuestionDraft(QUESTION_TYPE_CHOICE);

    expect(draft.answer).toBe("");
    expect(draft.questionLevel).toBe(2);
    expect(draft.optionList.map((option) => option.key)).toEqual([
      "A",
      "B",
      "C",
      "D",
    ]);
  });

  it("keeps choice option text exactly instead of stripping option-like prefixes", () => {
    const draft = createQuestionEditorDraft({
      content: QUESTION_STEM,
      optionList: [
        { answers: OPTION_WITH_LETTER_SPACE, key: "A" },
        { answers: OPTION_WITH_LETTER_DOT, key: "B" },
      ],
      type: QUESTION_TYPE_CHOICE,
    });
    const savePayload = buildQuestionEditorLocalSavePayload(draft);

    expect(draft.optionList.map((option) => option.answers)).toEqual([
      OPTION_WITH_LETTER_SPACE,
      OPTION_WITH_LETTER_DOT,
    ]);
    expect(
      savePayload.draft.optionList.map((option) => option.answers),
    ).toEqual([OPTION_WITH_LETTER_SPACE, OPTION_WITH_LETTER_DOT]);
  });

  it("detects meaningful rich text content for compact optional editors", () => {
    expect(hasRichTextContent(EMPTY_PARAGRAPH_HTML)).toBe(false);
    expect(hasRichTextContent(EMPTY_NBSP_HTML)).toBe(false);
    expect(hasRichTextContent("<p>已有解析</p>")).toBe(true);
    expect(hasRichTextContent(FORMULA_ANSWER_HTML)).toBe(true);
  });
});
