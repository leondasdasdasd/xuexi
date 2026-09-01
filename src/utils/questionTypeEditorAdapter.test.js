import {
  createQuestionEditorContentStructure,
  createQuestionEditorQuestionTypeTemplates,
} from "./questionTypeEditorAdapter.js";

const questionType = (overrides = {}) => ({
  elements: [
    {
      config: {
        backendFlag: "preserved",
      },
      enName: "Inline fill",
      name: "行内填空",
      type: "inlineFill",
    },
  ],
  enName: "Poll",
  extras: [],
  globalConfig: { hasAnswer: false },
  businessQuestionTypeId: 8,
  isBuiltin: false,
  name: "投票题",
  isComposite: false,
  ...overrides,
});

describe("question type editor adapter", () => {
  it("maps backend structure config without local defaults", () => {
    expect(createQuestionEditorContentStructure(questionType())).toEqual({
      elements: [
        {
          config: {
            backendFlag: "preserved",
          },
          name: "行内填空",
          type: "inlineFill",
        },
      ],
      extras: [],
      hasAnswer: false,
      isComposite: false,
    });
    expect(
      createQuestionEditorContentStructure(questionType()),
    ).not.toHaveProperty("isBuiltin");
  });

  it("keeps question type ids as the editor template key", () => {
    expect(createQuestionEditorQuestionTypeTemplates([questionType()])).toEqual(
      [
        {
          label: "投票题",
          questionTypeKey: 8,
          structure: expect.objectContaining({ hasAnswer: false }),
        },
      ],
    );
  });

  it("passes incomplete and unknown config through to the editor", () => {
    const config = {
      judgementMode: "legacy-mode",
      renderer: "custom-renderer",
    };
    const structure = createQuestionEditorContentStructure(
      questionType({
        elements: [{ config, name: "自定义元素", type: "customElement" }],
        globalConfig: {},
      }),
    );

    expect(structure).toMatchObject({
      elements: [{ config, name: "自定义元素", type: "customElement" }],
      hasAnswer: undefined,
    });
  });

  it("does not enforce composite structure rules in the adapter", () => {
    const structure = createQuestionEditorContentStructure(
      questionType({
        extras: [
          { enName: "Analysis", name: "解析", type: "customAnalysis" },
          { enName: "Analysis copy", name: "解析副本", type: "customAnalysis" },
        ],
        globalConfig: { hasAnswer: false },
        isComposite: true,
      }),
    );

    expect(structure).toMatchObject({
      elements: [{ type: "inlineFill" }],
      extras: [
        { name: "解析", type: "customAnalysis" },
        { name: "解析副本", type: "customAnalysis" },
      ],
      hasAnswer: false,
      isComposite: true,
    });
  });

  it("preserves malformed collection fields for the editor boundary", () => {
    const structure = createQuestionEditorContentStructure(
      questionType({ elements: "invalid-elements", extras: undefined }),
    );

    expect(structure.elements).toBe("invalid-elements");
    expect(structure.extras).toBeUndefined();
  });

  it("localizes mapped names without validating their presence", () => {
    const structure = createQuestionEditorContentStructure(
      questionType({
        elements: [{ config: {}, enName: "", name: "", type: "richText" }],
        extras: [{ enName: "Solution", name: "解析", type: "solvingProcess" }],
      }),
      { locale: "en" },
    );

    expect(structure.elements[0].name).toBe("");
    expect(structure.extras[0].name).toBe("Solution");
  });
});
