import {
  createQuestionContentSerializedDraftFromV2Question,
  createQuestionContentV2QuestionFromSerializedDraft,
} from "./questionContentV2EditorAdapter.js";

const node = (elements, extras = []) => ({
  children: [],
  elements,
  extras,
  id: 12,
  businessQuestionTypeId: 3,
  version: "1",
});

const richContent = (text) => ({ html: `<p>${text}</p>`, text });
const CATEGORY_ID = "category-1";
const CLASSIFICATION_ITEM_ID = "item-1";
const LEFT_ITEM_ID = "left-1";
const RIGHT_ITEM_ID = "right-1";
const ORDER_OPTION_1_ID = "option-1";
const ORDER_OPTION_2_ID = "option-2";
const MARKER_ID = "marker-1";
const WORD_BLANK_ID = "blank_0";
const MISSING_OPTION_ID = "missing-option";
const DUPLICATE_COLUMN_ID = "duplicate-column";

/** @type {Array<[string, object, object]>} */
const extendedElementCases = [
  [
    "classification",
    {
      answers: { [CLASSIFICATION_ITEM_ID]: CATEGORY_ID },
      categories: [{ content: richContent("类别"), id: CATEGORY_ID }],
      items: [{ content: richContent("卡片"), id: CLASSIFICATION_ITEM_ID }],
      transportOnly: "ignored",
      type: "classification",
    },
    {
      answers: { [CLASSIFICATION_ITEM_ID]: CATEGORY_ID },
      categories: [{ id: CATEGORY_ID }],
      items: [{ id: CLASSIFICATION_ITEM_ID }],
    },
  ],
  [
    "lineConnect",
    {
      answers: { [LEFT_ITEM_ID]: [RIGHT_ITEM_ID] },
      columns: [
        {
          columnId: "left",
          items: [{ content: richContent("左"), itemId: LEFT_ITEM_ID }],
          labelStyle: "number",
        },
        {
          columnId: "right",
          items: [{ content: richContent("右"), itemId: RIGHT_ITEM_ID }],
          labelStyle: "upperAlpha",
        },
      ],
      type: "lineConnect",
    },
    { answers: { [LEFT_ITEM_ID]: [RIGHT_ITEM_ID] }, type: "lineConnect" },
  ],
  [
    "matching",
    {
      answers: { [LEFT_ITEM_ID]: [RIGHT_ITEM_ID] },
      columns: [
        {
          columnId: "left",
          items: [{ content: richContent("左"), itemId: LEFT_ITEM_ID }],
          labelStyle: "number",
        },
        {
          columnId: "right",
          items: [{ content: richContent("右"), itemId: RIGHT_ITEM_ID }],
          labelStyle: "upperAlpha",
        },
      ],
      type: "matching",
    },
    { answers: { [LEFT_ITEM_ID]: [RIGHT_ITEM_ID] }, type: "matching" },
  ],
  [
    "ordering",
    {
      answers: [ORDER_OPTION_2_ID, ORDER_OPTION_1_ID],
      sortOptions: [
        { content: richContent("第一项"), id: ORDER_OPTION_1_ID },
        { content: richContent("第二项"), id: ORDER_OPTION_2_ID },
      ],
      type: "ordering",
    },
    { answers: [ORDER_OPTION_2_ID, ORDER_OPTION_1_ID], type: "ordering" },
  ],
  [
    "textMarker",
    {
      answers: [MARKER_ID],
      content: richContent("标注文本"),
      markers: [MARKER_ID],
      type: "textMarker",
    },
    { answers: [MARKER_ID], markers: [MARKER_ID], type: "textMarker" },
  ],
  [
    "wordBuilder",
    {
      answers: { [WORD_BLANK_ID]: "answer" },
      blanks: [WORD_BLANK_ID],
      candidateOptions: ["answer", "other"],
      content: richContent("Complete ____"),
      type: "wordBuilder",
    },
    {
      answers: { [WORD_BLANK_ID]: "answer" },
      blanks: [WORD_BLANK_ID],
      candidateOptions: ["answer", "other"],
      type: "wordBuilder",
    },
  ],
];

describe("question content v2 editor adapter", () => {
  it("normalizes omitted empty collections from the V2 transport response", () => {
    expect(
      createQuestionContentSerializedDraftFromV2Question({
        businessQuestionTypeId: 3,
        children: [],
        elements: [],
        id: 12,
        version: "1",
      }),
    ).toEqual({
      children: [],
      elements: [],
      extras: [],
      id: 12,
      questionTypeKey: 3,
      version: "1",
    });
  });

  it("uses the editor rich-text normalizer at the v2 response boundary", () => {
    const serialized = createQuestionContentSerializedDraftFromV2Question(
      node([
        {
          content: { html: "<p><strong>旧题干</strong></p>" },
          databaseId: 99,
          type: "richText",
          version: "1",
        },
      ]),
    );

    expect(serialized.elements[0]).toEqual({
      content: {
        html: "<p><strong>旧题干</strong></p>",
        json: expect.any(Array),
        text: "旧题干",
      },
      databaseId: 99,
      type: "richText",
      version: "1",
    });
    expect(serialized.elements[0].content.json).not.toHaveLength(0);
  });

  it("preserves choice and fill fields while normalizing rich content", () => {
    const serialized = createQuestionContentSerializedDraftFromV2Question(
      node([
        {
          answers: { optionIds: ["option-a"] },
          columns: [
            {
              content: { html: "<p>选项</p>", text: "选项" },
              id: "column-1",
            },
          ],
          options: [
            {
              cells: [{ html: "<p>A</p>", text: "A" }],
              id: "option-a",
            },
          ],
          type: "choice",
          version: "1",
        },
        {
          answers: [
            {
              answerPools: [{ html: "<p>42</p>", text: "42" }],
              blankIds: ["blank_0"],
            },
          ],
          blanks: ["blank_0"],
          type: "fill",
        },
      ]),
    );

    expect(serialized.elements[0]).toMatchObject({
      answers: { optionIds: ["option-a"] },
      columns: [{ id: "column-1" }],
      options: [{ id: "option-a" }],
      type: "choice",
    });
    expect(serialized.elements[0]).toHaveProperty("version", "1");
    expect(serialized.elements[1]).toMatchObject({
      answers: [{ blankIds: ["blank_0"] }],
      blanks: ["blank_0"],
      type: "fill",
    });
  });

  it("maps judgement answers without validating their business value", () => {
    expect(
      createQuestionContentSerializedDraftFromV2Question(
        node([{ answers: [false], type: "judgement" }]),
      ).elements[0],
    ).toEqual({ answers: [false], type: "judgement" });

    expect(
      createQuestionContentSerializedDraftFromV2Question(
        node([{ answers: ["错误"], type: "judgement" }]),
      ).elements[0],
    ).toEqual({ answers: ["错误"], type: "judgement" });
  });

  it("keeps an incomplete choice for the editor to validate", () => {
    const serialized = createQuestionContentSerializedDraftFromV2Question(
      node([
        {
          answers: { optionIds: [MISSING_OPTION_ID, MISSING_OPTION_ID] },
          columns: [
            {
              content: { html: "", json: [], text: "" },
              id: DUPLICATE_COLUMN_ID,
            },
            {
              content: { html: "", json: [], text: "" },
              id: DUPLICATE_COLUMN_ID,
            },
          ],
          transportMetadata: {
            answerPools: [{ text: "不是答案富文本", vendor: "保留" }],
            cells: [{ html: "不是选项富文本", vendor: "保留" }],
            content: { text: "不是内容富文本", vendor: "保留" },
          },
          options: [],
          type: "choice",
        },
      ]),
    );

    expect(serialized.elements[0]).toMatchObject({
      answers: { optionIds: [MISSING_OPTION_ID, MISSING_OPTION_ID] },
      columns: [{ id: DUPLICATE_COLUMN_ID }, { id: DUPLICATE_COLUMN_ID }],
      options: [],
      transportMetadata: {
        answerPools: [{ text: "不是答案富文本", vendor: "保留" }],
        cells: [{ html: "不是选项富文本", vendor: "保留" }],
        content: { text: "不是内容富文本", vendor: "保留" },
      },
      type: "choice",
    });
  });

  it("preserves an ambiguous inline-fill answer for the editor", () => {
    const answer = {
      answerOptionId: "option-a",
      answerPools: [],
      blankId: "blank_0",
    };
    const serialized = createQuestionContentSerializedDraftFromV2Question(
      node([
        {
          answers: [answer],
          blanks: ["blank_0"],
          content: { html: "____", json: [], text: "" },
          type: "inlineFill",
        },
      ]),
    );

    expect(serialized.elements[0].answers).toEqual([answer]);
  });

  it("does not validate element count against the question type", () => {
    expect(
      createQuestionContentSerializedDraftFromV2Question(
        node([
          {
            content: { html: "题干", json: [], text: "题干" },
            type: "richText",
          },
        ]),
      ).elements,
    ).toHaveLength(1);
  });

  it("passes through descendants without requiring a local type template", () => {
    const root = node([]);
    root.children = [
      {
        children: [],
        elements: [],
        extras: [],
        id: 99,
        businessQuestionTypeId: 404,
        version: "1",
      },
    ];
    expect(
      createQuestionContentSerializedDraftFromV2Question(root).children[0]
        .questionTypeKey,
    ).toBe(404);
  });

  it.each(extendedElementCases)(
    "maps the v2 %s shape through both serialized boundaries",
    (_type, element, expected) => {
      const serialized = createQuestionContentSerializedDraftFromV2Question(
        node([element]),
      );
      const request =
        createQuestionContentV2QuestionFromSerializedDraft(serialized);

      expect(serialized.elements[0]).toMatchObject(expected);
      expect(serialized.elements[0].transportOnly).toBe(element.transportOnly);
      expect(request.elements[0]).toEqual(serialized.elements[0]);
    },
  );
});
