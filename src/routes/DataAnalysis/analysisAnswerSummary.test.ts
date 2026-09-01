import type { QuestionContentSerializedDraft } from "@yungu-fed/question-editor";

import { formatAnalysisAnswerSummary } from "./analysisAnswerSummary";

const question = (elements: unknown[]): QuestionContentSerializedDraft =>
  ({ elements }) as QuestionContentSerializedDraft;

describe("formatAnalysisAnswerSummary", () => {
  it("将选择结果转成选项标识和内容", () => {
    const result = formatAnalysisAnswerSummary(
      JSON.stringify({
        elementAnswers: [
          { type: "choice", answers: { optionIds: ["option-b"] } },
        ],
      }),
      question([
        {
          type: "choice",
          columns: [],
          options: [
            { id: "option-a", cells: [{ text: "选项 A" }] },
            { id: "option-b", cells: [{ text: "选项 B" }] },
          ],
        },
      ]),
    );

    expect(result).toEqual({ canOpenDetail: false, text: "B. 选项 B" });
  });

  it("选项内容已带标识时不重复展示", () => {
    const result = formatAnalysisAnswerSummary(
      JSON.stringify({
        elementAnswers: [
          { type: "choice", answers: { optionIds: ["option-b"] } },
        ],
      }),
      question([
        {
          type: "choice",
          columns: [],
          options: [
            { id: "option-a", cells: [{ text: "A. 选项 A" }] },
            { id: "option-b", cells: [{ text: "B．选项 B" }] },
          ],
        },
      ]),
    );

    expect(result).toEqual({ canOpenDetail: false, text: "B. 选项 B" });
  });

  it("提取主观题纯文本摘要并允许查看详情", () => {
    const result = formatAnalysisAnswerSummary(
      JSON.stringify({
        elementAnswers: [
          {
            type: "textResponse",
            answers: {
              html: "<p>答案 <strong>内容</strong></p>",
              text: "答案  内容",
            },
          },
        ],
      }),
      question([{ type: "textResponse" }]),
    );

    expect(result).toEqual({ canOpenDetail: true, text: "答案 内容" });
  });

  it("按空位顺序组合填空题答案", () => {
    const result = formatAnalysisAnswerSummary(
      JSON.stringify({
        elementAnswers: [
          {
            type: "fill",
            answers: [
              {
                blankId: "blank-1",
                content: { html: "第一空", json: [], text: "第一空" },
              },
              {
                blankId: "blank-2",
                content: { html: "第二空", json: [], text: "第二空" },
              },
            ],
          },
        ],
      }),
      question([{ type: "fill" }]),
    );

    expect(result).toEqual({
      canOpenDetail: true,
      text: "第一空；第二空",
    });
  });

  it("拒绝旧版填空题作答结构", () => {
    const result = formatAnalysisAnswerSummary(
      JSON.stringify({
        elementAnswers: [
          {
            type: "fill",
            answers: [
              { answerPools: [{ text: "第一空" }], blankIds: ["blank-1"] },
            ],
          },
        ],
      }),
      question([{ type: "fill" }]),
    );

    expect(result).toEqual({ canOpenDetail: false, text: "未作答" });
  });

  it("对纯图片主观题给出稳定摘要", () => {
    const result = formatAnalysisAnswerSummary(
      JSON.stringify({
        elementAnswers: [
          {
            type: "textResponse",
            answers: { html: '<p><img src="answer.png" /></p>', text: "" },
          },
        ],
      }),
      question([{ type: "textResponse" }]),
    );

    expect(result).toEqual({ canOpenDetail: true, text: "[图片]" });
  });

  it("空答案保持未作答语义", () => {
    expect(
      formatAnalysisAnswerSummary(
        JSON.stringify({ elementAnswers: [] }),
        question([{ type: "textResponse" }]),
      ),
    ).toEqual({ canOpenDetail: false, text: "未作答" });
  });
});
