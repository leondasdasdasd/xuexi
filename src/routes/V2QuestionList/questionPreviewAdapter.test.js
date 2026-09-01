import { createQuestionPreviewDraft } from "@yungu-fed/question-editor";

import { createBusinessQuestionTypesById } from "../../utils/questionPreviewAdapter.js";

import {
  collectBusinessQuestionTypeIdsFromAggregates,
  createNewMyQuestionPreviewViewModel,
  createNewMyQuestionTypeFilterOptions,
  normalizeNewMyQuestionAggregateToPreviewDraft,
  updateNewMyQuestionAggregateBasketMembership,
} from "./questionPreviewAdapter.js";
import {
  NEW_MY_QUESTION_AGGREGATES,
  NEW_MY_QUESTION_TYPE_RESPONSES,
} from "./questionPreviewAdapter.testFixtures.js";

const CHOICE_COLUMN_1_ID = "choice-column-1";
const CHOICE_OPTION_3_ID = "choice-option-3";

describe("new my question preview adapter", () => {
  const businessQuestionTypesById = createBusinessQuestionTypesById(
    NEW_MY_QUESTION_TYPE_RESPONSES,
  );

  it("recursively collects unique question type ids from aggregate questions", () => {
    expect(
      collectBusinessQuestionTypeIdsFromAggregates(NEW_MY_QUESTION_AGGREGATES),
    ).toEqual([3, 4, 5, 6, 7, 8, 9]);
  });

  it("maps batch question type responses by id", () => {
    expect(
      createBusinessQuestionTypesById(NEW_MY_QUESTION_TYPE_RESPONSES),
    ).toMatchObject({
      3: {
        isBuiltin: true,
        name: "单选题",
        isComposite: false,
      },
      8: {
        isBuiltin: true,
        name: "组合题",
        isComposite: true,
      },
    });
  });

  it("maps a single choice aggregate with type name, templates, and answer", () => {
    const viewModel = createNewMyQuestionPreviewViewModel(
      NEW_MY_QUESTION_AGGREGATES[0],
      businessQuestionTypesById,
    );

    expect(viewModel.actionItem).toMatchObject({
      id: 341,
      questionTypeDisplayName: "单选题",
    });
    expect(viewModel.questionTypeTemplates[0].structure).toMatchObject({
      elements: [
        { type: "richText" },
        {
          config: {
            renderer: "standard",
            selectionType: "single",
          },
          type: "choice",
        },
      ],
      hasAnswer: true,
    });
    const choiceElement = viewModel.questionContent.elements[1];

    expect(viewModel.questionContent).toMatchObject({
      elements: [
        { type: "richText" },
        {
          answers: { optionIds: [CHOICE_OPTION_3_ID] },
          columns: [{ id: CHOICE_COLUMN_1_ID }],
          type: "choice",
        },
      ],
      extras: [{ type: "solvingProcess" }],
      questionTypeKey: 3,
    });
    expect(choiceElement.options).toHaveLength(4);
    expect(choiceElement.options[2]).toMatchObject({
      cells: [{ html: "<p>C.选项描述</p>" }],
      id: CHOICE_OPTION_3_ID,
    });
  });

  it("normalizes answers from v2 question elements", () => {
    const normalized = normalizeNewMyQuestionAggregateToPreviewDraft(
      NEW_MY_QUESTION_AGGREGATES[0],
    );

    expect(normalized.elements[1]).toMatchObject({
      answers: { optionIds: [CHOICE_OPTION_3_ID] },
      type: "choice",
    });
  });

  it("creates a question-editor preview draft from normalized choice content", () => {
    const viewModel = createNewMyQuestionPreviewViewModel(
      NEW_MY_QUESTION_AGGREGATES[0],
      businessQuestionTypesById,
    );

    expect(() => {
      createQuestionPreviewDraft(
        viewModel.questionContent,
        viewModel.questionTypeTemplates,
      );
    }).not.toThrow();
  });

  it("keeps composite analysis on the material node and child extras recursively", () => {
    const aggregate = {
      ...NEW_MY_QUESTION_AGGREGATES[5],
      question: {
        ...NEW_MY_QUESTION_AGGREGATES[5].question,
        children: [
          {
            ...NEW_MY_QUESTION_AGGREGATES[5].question.children[0],
            children: [
              {
                ...NEW_MY_QUESTION_AGGREGATES[5].question.children[0]
                  .children[0],
                extras: [
                  {
                    content: {
                      html: "子题解析",
                      json: [],
                      text: "子题解析",
                    },
                    type: "solvingProcess",
                  },
                ],
              },
            ],
            extras: [
              {
                content: { html: "材料解析", json: [], text: "材料解析" },
                type: "solvingProcess",
              },
            ],
          },
        ],
        extras: [],
      },
    };

    const normalized = normalizeNewMyQuestionAggregateToPreviewDraft(
      aggregate,
      businessQuestionTypesById,
    );

    expect(normalized.extras).toEqual([]);
    expect(normalized.children[0].extras[0]).toMatchObject({
      content: { html: "<p>材料解析</p>" },
      type: "solvingProcess",
    });
    expect(normalized.children[0].children[0].extras[0]).toMatchObject({
      content: { html: "<p>子题解析</p>" },
      type: "solvingProcess",
    });
  });

  it("rejects bare question nodes instead of adapting historical list data", () => {
    expect(() =>
      normalizeNewMyQuestionAggregateToPreviewDraft(
        NEW_MY_QUESTION_AGGREGATES[0].question,
      ),
    ).toThrow();
  });

  it("preserves v2 extra business content", () => {
    const aggregate = {
      ...NEW_MY_QUESTION_AGGREGATES[0],
      question: {
        ...NEW_MY_QUESTION_AGGREGATES[0].question,
        extras: [
          {
            content: { html: "解析", json: [], text: "解析" },
            type: "solvingProcess",
          },
        ],
      },
    };
    const normalized = normalizeNewMyQuestionAggregateToPreviewDraft(aggregate);

    expect(normalized.extras[0]).toMatchObject({ type: "solvingProcess" });
  });

  it("normalizes table choice, fill, inline fill, judgement, and composite children", () => {
    const tableChoice = createNewMyQuestionPreviewViewModel(
      NEW_MY_QUESTION_AGGREGATES[1],
      businessQuestionTypesById,
    );
    const fill = createNewMyQuestionPreviewViewModel(
      NEW_MY_QUESTION_AGGREGATES[2],
      businessQuestionTypesById,
    );
    const inlineFill = createNewMyQuestionPreviewViewModel(
      NEW_MY_QUESTION_AGGREGATES[3],
      businessQuestionTypesById,
    );
    const judgement = createNewMyQuestionPreviewViewModel(
      NEW_MY_QUESTION_AGGREGATES[4],
      businessQuestionTypesById,
    );
    const composite = createNewMyQuestionPreviewViewModel(
      NEW_MY_QUESTION_AGGREGATES[5],
      businessQuestionTypesById,
    );

    expect(
      tableChoice.questionTypeTemplates[1].structure.elements[1],
    ).toMatchObject({
      config: { renderer: "table" },
      type: "choice",
    });
    const tableChoiceElement = tableChoice.questionContent.elements[1];

    expect(tableChoice.questionContent.elements[1]).toMatchObject({
      answers: { optionIds: ["choice-option-1"] },
      columns: [
        { id: "choice-column-1" },
        { id: "choice-column-2" },
        { id: "choice-column-3" },
      ],
      type: "choice",
    });
    expect(tableChoiceElement.options).toHaveLength(3);
    expect(tableChoiceElement.options[0]).toMatchObject({
      cells: [
        { html: "<p>A</p>" },
        { html: "<p>12 × 8</p>" },
        { html: "<p>96 平方厘米</p>" },
      ],
      id: "choice-option-1",
    });
    expect(fill.questionContent.elements[1]).toMatchObject({
      answers: [{ answerPools: [{ text: "42" }], blankIds: ["blank_0"] }],
      blanks: ["blank_0"],
      type: "fill",
    });
    expect(inlineFill.questionContent.elements[0]).toMatchObject({
      answers: [{ answerPools: [{ text: "3.2 米更长" }] }],
      type: "inlineFill",
    });
    expect(judgement.questionContent.elements[1]).toMatchObject({
      answers: [true],
      type: "judgement",
    });
    expect(composite.questionContent).toMatchObject({
      children: [
        {
          children: [
            {
              elements: [{ type: "richText" }, { type: "choice" }],
              questionTypeKey: 3,
            },
          ],
          elements: [{ type: "richText" }],
          questionTypeKey: 9,
        },
      ],
      elements: [],
      questionTypeKey: 8,
    });
    expect(
      composite.questionTypeTemplates.map((item) => item.questionTypeKey),
    ).toEqual([3, 4, 5, 6, 7, 8, 9]);
  });

  it("leaves a missing recursive question type out of editor templates", () => {
    const viewModel = createNewMyQuestionPreviewViewModel(
      NEW_MY_QUESTION_AGGREGATES[5],
      {
        ...businessQuestionTypesById,
        9: undefined,
      },
    );

    expect(viewModel.questionContent.children[0].questionTypeKey).toBe(9);
    expect(
      viewModel.questionTypeTemplates.map(
        (template) => template.questionTypeKey,
      ),
    ).not.toContain(9);
  });

  it("maps v2 question types to V2QuestionList filter options", () => {
    expect(
      createNewMyQuestionTypeFilterOptions(
        [NEW_MY_QUESTION_TYPE_RESPONSES[0]],
        "en",
      ),
    ).toEqual([
      {
        code: 3,
        typeName: "Single choice",
      },
    ]);
  });

  it("maps basket membership from the v2 aggregate response", () => {
    const viewModel = createNewMyQuestionPreviewViewModel(
      { ...NEW_MY_QUESTION_AGGREGATES[0], inQuestionBasket: true },
      businessQuestionTypesById,
    );

    expect(viewModel.actionItem).toMatchObject({
      id: 341,
      isInQuestionBasket: true,
    });
  });

  it("updates basket membership without changing other aggregate items", () => {
    const aggregates = NEW_MY_QUESTION_AGGREGATES.slice(0, 2);
    const updated = updateNewMyQuestionAggregateBasketMembership(
      aggregates,
      341,
      true,
    );

    expect(updated[0]).toEqual({
      ...aggregates[0],
      inQuestionBasket: true,
    });
    expect(updated[0]).not.toBe(aggregates[0]);
    expect(updated[1]).toBe(aggregates[1]);
  });

  it("maps v2 question response resource fields into action item view model", () => {
    const aggregate = {
      ...NEW_MY_QUESTION_AGGREGATES[0],
      createUserId: 12,
      resource: {
        gradeId: 25,
        level: 2,
        subjectId: 1,
      },
    };
    const viewModel = createNewMyQuestionPreviewViewModel(
      aggregate,
      businessQuestionTypesById,
    );

    expect(viewModel.actionItem).toMatchObject({
      createUserName: "12",
      gradeId: 25,
      gradeName: "25",
      level: 2,
      subjectId: 1,
    });
  });
});
