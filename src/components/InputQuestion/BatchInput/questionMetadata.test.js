import { attachParsedQuestionMetadata } from "./questionMetadata";

describe("batch question metadata", () => {
  it("maps parsed per-question metadata to backend field names", () => {
    const questionList = [
      {
        analysis: "无",
        chapter: "第一章",
        indicator: "核心素养",
        knowledge: "函数",
      },
    ];

    expect(attachParsedQuestionMetadata(questionList)).toBe(questionList);
    expect(questionList[0]).toMatchObject({
      analysis: "无",
      chapterNames: "第一章",
      indicatorNames: "核心素养",
      knowledgeNames: "函数",
    });
  });

  it("keeps empty input unchanged", () => {
    expect(attachParsedQuestionMetadata()).toEqual([]);
    expect(attachParsedQuestionMetadata(null)).toBeNull();
  });
});
