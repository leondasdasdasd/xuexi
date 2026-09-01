/** @jest-environment node */

import {
  buildQuestionTypeContextKey,
  createEmptyTwoWayQuestion,
  getBusinessQuestionTypeLabel,
  applyModuleQuestionTypeTemplate,
  initializeModuleQuestionTypeTemplate,
  inheritTwoWayQuestionType,
  mapServerQuestionTypesToTwoWayOptions,
  shouldApplyQuestionTypeResponse,
  shouldReuseQuestionTypeRegistry,
} from "./questionTypeRegistry.js";
import { buildQuestionFromPreviousTemplate } from "./virtualAssociationGroups.js";

describe("TwoWayTest question type registry", () => {
  it("maps built-in and custom server types without requiring legacyTypeId", () => {
    expect(
      mapServerQuestionTypesToTwoWayOptions([
        {
          businessQuestionTypeId: 101,
          enName: "Single choice",
          isComposite: false,
          legacyTypeId: 1,
          name: "单选题",
        },
        {
          businessQuestionTypeId: 201,
          enName: "Reading",
          isComposite: true,
          name: "阅读题",
        },
      ]),
    ).toEqual([
      {
        businessQuestionTypeId: 101,
        isComposite: false,
        label: "单选题",
        legacyTypeId: 1,
      },
      {
        businessQuestionTypeId: 201,
        isComposite: true,
        label: "阅读题",
        legacyTypeId: undefined,
      },
    ]);
  });

  it("uses the English server name for the English locale", () => {
    expect(
      mapServerQuestionTypesToTwoWayOptions(
        [
          {
            businessQuestionTypeId: 201,
            enName: "Reading",
            isComposite: true,
            name: "阅读题",
          },
        ],
        "en",
      )[0].label,
    ).toBe("Reading");
  });

  it("matches the displayed question type by business question type id", () => {
    const questionTypes = mapServerQuestionTypesToTwoWayOptions([
      {
        businessQuestionTypeId: 201,
        enName: "Reading",
        isComposite: true,
        name: "阅读题",
      },
    ]);

    expect(getBusinessQuestionTypeLabel(questionTypes, 201)).toBe("阅读题");
    expect(getBusinessQuestionTypeLabel(questionTypes, 6)).toBe("");
  });

  it("creates and inherits authoritative business question types", () => {
    const parent = createEmptyTwoWayQuestion({
      businessQuestionTypeId: 201,
      isComposite: true,
      label: "阅读题",
    });

    expect(inheritTwoWayQuestionType({ questionScore: 2 }, parent)).toEqual(
      expect.objectContaining({
        businessQuestionTypeId: 201,
        isComposite: true,
        questionTypeName: "阅读题",
      }),
    );
  });

  it("keeps a module question type template stable while creating questions", () => {
    const module = initializeModuleQuestionTypeTemplate({
      questionList: [
        {
          businessQuestionTypeId: 201,
          isComposite: true,
          questionTypeName: "阅读题",
          type: 6,
        },
      ],
    });
    module.questionList[0].businessQuestionTypeId = 202;

    expect(
      applyModuleQuestionTypeTemplate({ questionScore: 3 }, module),
    ).toEqual({
      businessQuestionTypeId: 201,
      isComposite: true,
      questionScore: 3,
      questionTypeName: "阅读题",
      type: 6,
    });
  });

  it("combines the last question defaults with the first question type", () => {
    const module = initializeModuleQuestionTypeTemplate({
      questionList: [
        {
          businessQuestionTypeId: 101,
          isComposite: false,
          questionTypeName: "单选题",
          type: 1,
        },
        {
          businessQuestionTypeId: 205,
          predictionDifficulty: 3,
          questionLevelType: 2,
          questionScore: 4,
          sourceType: 1,
          type: 5,
        },
      ],
    });

    expect(
      applyModuleQuestionTypeTemplate(
        buildQuestionFromPreviousTemplate(module.questionList.at(-1)),
        module,
      ),
    ).toEqual({
      businessQuestionTypeId: 101,
      isComposite: false,
      predictionDifficulty: 3,
      questionLevelType: 2,
      questionScore: 4,
      questionTypeName: "单选题",
      sourceType: 1,
      type: 1,
    });
  });

  it("keeps every explicit child question type field", () => {
    expect(
      inheritTwoWayQuestionType(
        {
          businessQuestionTypeId: 202,
          isComposite: false,
          questionTypeName: "子题型",
          type: 2,
        },
        {
          businessQuestionTypeId: 201,
          isComposite: true,
          questionTypeName: "父题型",
          type: 6,
        },
      ),
    ).toEqual({
      businessQuestionTypeId: 202,
      isComposite: false,
      questionTypeName: "子题型",
      type: 2,
    });
  });

  it("uses stage and subject as the request context", () => {
    expect(buildQuestionTypeContextKey({ stageId: 2, subjectId: 14 })).toBe(
      "2:14",
    );
  });

  it("rejects a late response after switching from A to B and back to A", () => {
    expect(
      shouldApplyQuestionTypeResponse({
        currentContextKey: "1:14",
        currentRequestVersion: 3,
        requestContextKey: "2:14",
        requestVersion: 2,
      }),
    ).toBe(false);
  });

  it("reuses a successfully loaded teaching-context registry", () => {
    expect(
      shouldReuseQuestionTypeRegistry({
        loadedContextKey: "2:14",
        loading: false,
        loadError: null,
        requestedContextKey: "2:14",
      }),
    ).toBe(true);
    expect(
      shouldReuseQuestionTypeRegistry({
        loadedContextKey: "2:14",
        loading: false,
        loadError: null,
        requestedContextKey: "3:14",
      }),
    ).toBe(false);
  });
});
