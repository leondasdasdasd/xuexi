import {
  createQuestionAssetContentStructure,
  createQuestionAssetContentStructureByTypeId,
  createQuestionAssetEditorDraft,
  createQuestionAssetEditorDraftByTypeId,
  createQuestionAssetEditorResourceDraftFromV2Resource,
  createQuestionAssetEditorStateFromV2Aggregate,
  createQuestionAssetQuestionTypeTemplates,
  createQuestionAssetV2CreateRequest,
  createQuestionAssetV2ResourceRequestFromEditorResource,
  createQuestionAssetV2UpdateRequest,
  getDefaultQuestionAssetTypeId,
  getQuestionAssetTypeById,
  isQuestionAssetEditorReady,
} from "./questionAssetContentAdapter.js";
import {
  createQuestionAssetGradeOptions,
  createQuestionAssetSubjectOptions,
  createQuestionAssetTreeOptions,
  createQuestionAssetTypeOptions,
} from "./questionAssetInputViewModel.js";
import { getStageIdByGradeId } from "../../utils/teachingContextAdapter.js";
import { QUESTION_ASSET_TYPE_V2_FIXTURES } from "./questionAssetTypeV2.testFixtures.js";

const richContent = (text) => ({ html: text, json: [], text });

describe("question asset content adapter", () => {
  beforeEach(() => {
    window.globalLange = "zh";
  });

  it("maps v2 question types to QuestionContentEditor structure", () => {
    const structures = QUESTION_ASSET_TYPE_V2_FIXTURES.map((type) =>
      createQuestionAssetContentStructure(type),
    );

    expect(structures).toHaveLength(4);
    expect(structures[0]).toMatchObject({
      elements: [],
      isComposite: true,
    });
    expect(structures[1]).toMatchObject({
      hasAnswer: false,
      isComposite: false,
    });
    expect(structures[2].elements[1]).toMatchObject({
      config: {
        renderer: "standard",
        selectionType: "single",
      },
      type: "choice",
    });
    expect(structures[3].elements[0]).toMatchObject({
      config: {
        allowCandidateReuse: false,
        candidateMode: "none",
      },
      type: "inlineFill",
    });
  });

  it("creates editor templates from v2 question types", () => {
    const templates = createQuestionAssetQuestionTypeTemplates(
      QUESTION_ASSET_TYPE_V2_FIXTURES,
    );

    expect(templates.map((item) => item.questionTypeKey)).toEqual([1, 2, 3, 6]);
  });

  it("serializes editor draft into backend v2 create request", () => {
    const questionType = QUESTION_ASSET_TYPE_V2_FIXTURES[2];
    const editorDraft = createQuestionAssetEditorDraft(questionType);
    const draft = {
      ...editorDraft,
      elements: editorDraft.elements.map((element, index) =>
        index === 0 ? { ...element, internalState: "ignored" } : element,
      ),
    };
    const payload = createQuestionAssetV2CreateRequest({
      draft,
      questionTypes: QUESTION_ASSET_TYPE_V2_FIXTURES,
      resource: { gradeId: 7, subjectId: 2 },
    });

    expect(payload).toMatchObject({
      question: {
        businessQuestionTypeId: 3,
      },
      resource: {
        gradeId: 7,
        subjectId: 2,
      },
    });
    expect(payload).not.toHaveProperty("extras");
    expect(payload.question.elements[0]).not.toHaveProperty("elementId");
    expect(payload.question.elements[0]).not.toHaveProperty("internalState");
    expect(payload.question).not.toHaveProperty("id");
    expect(payload.question.elements[0]).not.toHaveProperty("id");
  });

  it("converts editor draft to backend v2 create request", () => {
    const questionType = QUESTION_ASSET_TYPE_V2_FIXTURES[2];
    const childDraft = {
      ...createQuestionAssetEditorDraft(QUESTION_ASSET_TYPE_V2_FIXTURES[3]),
      id: 999,
    };
    const draft = {
      ...createQuestionAssetEditorDraft(questionType),
      children: [childDraft],
      id: 123,
    };
    const request = createQuestionAssetV2CreateRequest({
      draft,
      questionTypes: QUESTION_ASSET_TYPE_V2_FIXTURES,
      resource: { gradeId: 7, subjectId: 2 },
    });

    expect(request).toMatchObject({
      question: {
        children: [
          {
            businessQuestionTypeId: 6,
          },
        ],
        elements: expect.any(Array),
        extras: expect.any(Array),
        businessQuestionTypeId: 3,
        version: "1",
      },
      resource: {
        gradeId: 7,
        subjectId: 2,
      },
    });
    expect(request).not.toHaveProperty("action");
    expect(request).not.toHaveProperty("extras");
    expect(request).not.toHaveProperty("questionType");
    expect(request).not.toHaveProperty("resourceDraft");
    expect(request.question).not.toHaveProperty("id");
    expect(request.question.children[0]).not.toHaveProperty("id");
    expect(request.question.children[0].extras[0]).toMatchObject({
      type: "solvingProcess",
    });
  });

  it("preserves question ids only for backend v2 update requests", () => {
    const questionType = QUESTION_ASSET_TYPE_V2_FIXTURES[2];
    const childDraft = {
      ...createQuestionAssetEditorDraft(QUESTION_ASSET_TYPE_V2_FIXTURES[3]),
      id: 999,
    };
    const draft = {
      ...createQuestionAssetEditorDraft(questionType),
      children: [childDraft],
      id: 123,
    };
    const request = createQuestionAssetV2UpdateRequest({
      draft,
      questionTypes: QUESTION_ASSET_TYPE_V2_FIXTURES,
      resource: {
        gradeId: 7,
        knowledgeIds: [10],
        level: 2,
        stem: "详情派生题干",
        subjectId: 2,
      },
    });

    expect(request.question).toMatchObject({
      children: [{ id: 999, businessQuestionTypeId: 6 }],
      id: 123,
      businessQuestionTypeId: 3,
    });
    expect(request.resource).toEqual({
      gradeId: 7,
      knowledgeIds: [10],
      level: 2,
      subjectId: 2,
    });
    expect(request.resource).not.toHaveProperty("stem");
  });

  it("hydrates and saves unopened nested children against each child template", () => {
    const aggregate = {
      question: {
        children: [
          {
            children: [
              {
                children: [],
                elements: [
                  { content: richContent("子题"), type: "richText" },
                  {
                    answers: { optionIds: ["option-a"] },
                    columns: [
                      {
                        content: richContent(""),
                        id: "column-1",
                      },
                    ],
                    options: [
                      {
                        cells: [richContent("A")],
                        id: "option-a",
                      },
                    ],
                    type: "choice",
                  },
                ],
                extras: [],
                id: 103,
                businessQuestionTypeId: 3,
                version: "1",
              },
            ],
            elements: [{ content: richContent("材料题干"), type: "richText" }],
            extras: [
              {
                content: richContent("材料解析"),
                type: "solvingProcess",
              },
            ],
            id: 102,
            businessQuestionTypeId: 2,
            version: "1",
          },
        ],
        elements: [],
        extras: [],
        id: 101,
        businessQuestionTypeId: 1,
        version: "1",
      },
      resource: { gradeId: 7, subjectId: 2 },
    };
    const editorState = createQuestionAssetEditorStateFromV2Aggregate(
      aggregate,
      QUESTION_ASSET_TYPE_V2_FIXTURES,
    );

    const request = createQuestionAssetV2UpdateRequest({
      draft: editorState.draft,
      questionTypes: QUESTION_ASSET_TYPE_V2_FIXTURES,
      resource: editorState.resource,
    });

    expect(request.question).toMatchObject({
      children: [
        {
          children: [
            {
              elements: [{ type: "richText" }, { type: "choice" }],
              extras: [{ type: "solvingProcess" }, { type: "scoringRule" }],
              id: 103,
              businessQuestionTypeId: 3,
            },
          ],
          id: 102,
          businessQuestionTypeId: 2,
        },
      ],
      id: 101,
      businessQuestionTypeId: 1,
    });
  });

  it("maps editor resource draft to v2 writable resource fields", () => {
    const request = createQuestionAssetV2ResourceRequestFromEditorResource({
      chapterIds: [30],
      gradeId: 7,
      knowledgeIds: [10],
      stem: "详情派生题干",
      subjectId: 2,
      yearPeriodId: 2024,
    });

    expect(request).toEqual({
      chapterIds: [30],
      gradeId: 7,
      knowledgeIds: [10],
      subjectId: 2,
      yearPeriodId: 2024,
    });
    expect(request).not.toHaveProperty("stem");
  });

  it("maps v2 response resource to editor resource draft without response-only fields", () => {
    const draft = createQuestionAssetEditorResourceDraftFromV2Resource({
      gradeId: 7,
      knowledgeIds: [10],
      stem: "详情派生题干",
      subjectId: 2,
    });

    expect(draft).toEqual({
      gradeId: 7,
      knowledgeIds: [10],
      subjectId: 2,
    });
    expect(draft).not.toHaveProperty("stem");
  });

  it("uses the first v2 question type as the default type", () => {
    expect(getDefaultQuestionAssetTypeId(QUESTION_ASSET_TYPE_V2_FIXTURES)).toBe(
      1,
    );
    expect(
      getQuestionAssetTypeById(QUESTION_ASSET_TYPE_V2_FIXTURES, 3),
    ).toMatchObject({
      businessQuestionTypeId: 3,
      name: "服务端单选",
    });
    expect(
      createQuestionAssetContentStructureByTypeId(
        QUESTION_ASSET_TYPE_V2_FIXTURES,
        3,
      ),
    ).toMatchObject({
      elements: expect.any(Array),
    });
    expect(
      createQuestionAssetEditorDraftByTypeId(
        QUESTION_ASSET_TYPE_V2_FIXTURES,
        3,
      ),
    ).toMatchObject({
      questionTypeKey: 3,
    });
  });

  it("maps domain data to page view options", () => {
    expect(
      createQuestionAssetTypeOptions(QUESTION_ASSET_TYPE_V2_FIXTURES)[0],
    ).toEqual({
      label: "服务端组合题",
      value: 1,
    });
    expect(
      createQuestionAssetGradeOptions([{ gradeId: 7, name: "七年级" }]),
    ).toEqual([{ label: "七年级", value: 7 }]);
    expect(getStageIdByGradeId([{ gradeId: 7, stageId: 3 }], 7)).toBe(3);
    expect(
      createQuestionAssetSubjectOptions([{ id: 2, name: "数学" }]),
    ).toEqual([{ label: "数学", value: 2 }]);
    expect(
      createQuestionAssetTreeOptions([
        { children: [{ id: 11, name: "一元一次方程" }], id: 10, name: "方程" },
      ]),
    ).toEqual([
      {
        children: [
          {
            children: [],
            key: 11,
            title: "一元一次方程",
            value: 11,
          },
        ],
        key: 10,
        title: "方程",
        value: 10,
      },
    ]);
  });

  it("handles an empty v2 question type list as an explicit empty state", () => {
    expect(getDefaultQuestionAssetTypeId([])).toBeUndefined();
    expect(createQuestionAssetQuestionTypeTemplates([])).toEqual([]);
    expect(createQuestionAssetTypeOptions([])).toEqual([]);
    expect(createQuestionAssetContentStructureByTypeId([], 3)).toBeUndefined();
    expect(createQuestionAssetEditorDraftByTypeId([], 3)).toBeUndefined();
  });

  it("requires one selected question type to match the editor draft", () => {
    const questionTypes = [{ businessQuestionTypeId: 1 }];
    expect(
      isQuestionAssetEditorReady({
        draft: { questionTypeKey: 1 },
        questionTypes,
        selectedTypeId: 1,
      }),
    ).toBe(true);
    expect(
      isQuestionAssetEditorReady({
        draft: { questionTypeKey: 1 },
        questionTypes: [],
        selectedTypeId: 1,
      }),
    ).toBe(false);
  });
});
