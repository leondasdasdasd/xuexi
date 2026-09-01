import {
  QUESTION_TYPE_BLANK,
  QUESTION_TYPE_ANSWER,
} from "../domain/questionTaskShared";
import {
  buildBatchAiSettingsFromPromptItems,
  buildBatchQualitySettingsFromPromptItems,
  createAiModalState,
  createAiPopoverState,
  hasQuestionAiSupplementTarget,
  mergeTaskItemsIntoTaskResult,
} from "./questionTaskAiTaskModel";

const normalizeBatchAiSettings = (settings) => ({
  ...settings,
  normalized: "analysis",
});

const normalizeBatchQualitySettings = (settings) => ({
  ...settings,
  normalized: "quality",
});

describe("QuestionTask AI task model", () => {
  it("maps prompt items into canonical batch analysis settings", () => {
    const result = buildBatchAiSettingsFromPromptItems(
      [
        { key: "analysis_extra", prompt: "补充解析要求" },
        { key: "choice", prompt: "选择题示例" },
        { key: "essay", prompt: "问答题示例" },
      ],
      normalizeBatchAiSettings,
    );

    expect(result).toEqual({
      normalized: "analysis",
      prompt: "补充解析要求",
      typeExamples: {
        answer: "问答题示例",
        blank: "",
        choice: "选择题示例",
        judge: "",
        prompt: "补充解析要求",
      },
    });
  });

  it("maps prompt items into canonical batch quality settings", () => {
    const result = buildBatchQualitySettingsFromPromptItems(
      [{ key: "quality_check", prompt: "统一质检要求" }],
      normalizeBatchQualitySettings,
    );

    expect(result).toEqual({
      normalized: "quality",
      prompt: "统一质检要求",
    });
  });

  it("creates default AI modal and popover state from injected factories", () => {
    const modal = createAiModalState("qwen", () => ({
      answer: "A",
      blank: "",
      choice: "",
      judge: "",
      prompt: "",
    }));
    const popover = createAiPopoverState();

    expect(modal).toMatchObject({
      batchActionType: "analysis",
      model: "qwen",
      mode: "batch",
      prompt: "",
      questionId: "",
      visible: false,
    });
    expect(modal.typeExamples.answer).toBe("A");
    expect(popover).toEqual({
      left: 0,
      reviewId: "",
      top: 0,
      visible: false,
    });
  });

  it("detects whether a question still needs AI answer or analysis supplementation", () => {
    expect(
      hasQuestionAiSupplementTarget({
        answer: "A",
        analysis: "完整解析",
      }),
    ).toBe(false);
    expect(
      hasQuestionAiSupplementTarget({
        answer: "",
        analysis: "只有解析",
      }),
    ).toBe(true);
    expect(
      hasQuestionAiSupplementTarget({
        answer: "A",
        analysis: "",
      }),
    ).toBe(true);
  });

  it("merges analysis and quality task items back into the task result", () => {
    const result = mergeTaskItemsIntoTaskResult(
      {
        pages: [
          {
            pageIndex: 0,
            questions: [
              {
                analysis: "",
                answer: "",
                draftId: "q1",
                qualityCheckResult: undefined,
                sonQuestionList: [],
                type: QUESTION_TYPE_ANSWER,
                uuid: "uuid-1",
              },
              {
                analysis: "",
                draftId: "q2",
                gapFillingAnswer: {
                  answers: [""],
                  isOrder: false,
                },
                qualityCheckResult: undefined,
                sonQuestionList: [],
                type: QUESTION_TYPE_BLANK,
                uuid: "uuid-2",
              },
            ],
          },
        ],
      },
      QUESTION_TYPE_BLANK,
      {
        analysisItems: [
          {
            errorMessage: "",
            questionData: {
              analysis: "AI 解析",
              answer: "标准答案",
            },
            status: "SUCCEEDED",
            uuid: "uuid-1",
          },
          {
            errorMessage: "",
            questionData: {
              answer: "空一",
            },
            status: "SUCCEEDED",
            uuid: "uuid-2",
          },
        ],
        qualityItems: [
          {
            errorMessage: "",
            qualityResult: {
              reportMarkdown: "可用",
              resultLabel: "低风险",
              status: "low",
            },
            status: "SUCCEEDED",
            uuid: "uuid-1",
          },
        ],
      },
    );

    expect(result.changed).toBe(true);
    expect(result.taskResult.pages[0].questions[0]).toMatchObject({
      analysis: "AI 解析",
      analysisTaskStatus: "SUCCEEDED",
      answer: "标准答案",
      qualityCheckTaskStatus: "SUCCEEDED",
      qualityCheckResult: {
        reportMarkdown: "可用",
        resultLabel: "低风险",
        status: "low",
      },
    });
    expect(result.taskResult.pages[0].questions[1].gapFillingAnswer).toEqual({
      answers: ["空一"],
      isOrder: false,
    });
  });
});
