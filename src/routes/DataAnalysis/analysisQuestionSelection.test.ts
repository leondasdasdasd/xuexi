import {
  resolveAnalysisQuestionSelection,
  type AnalysisQuestionSource,
} from "./analysisQuestionSelection";

const question = (
  questionId?: number,
  questionSerialNumber?: string,
  children: AnalysisQuestionSource[] = [],
): AnalysisQuestionSource => ({
  questionId,
  questionSerialNumber,
  sonQuestionList: children,
});

describe("resolveAnalysisQuestionSelection", () => {
  it("resolves a leaf question to one canonical request and render identity", () => {
    const source = question(11674, "2");

    expect(resolveAnalysisQuestionSelection(source)).toEqual({
      questionId: 11674,
      questionNo: "2",
      sourceQuestion: source,
    });
  });

  it("resolves a composite position through its first frozen child", () => {
    const child = question(11680, "1.1");
    const source = question(undefined, "1", [child]);

    expect(resolveAnalysisQuestionSelection(source)).toEqual({
      questionId: 11680,
      questionNo: "1.1",
      sourceQuestion: source,
    });
  });

  it("returns null while no valid analysis question is selected", () => {
    expect(resolveAnalysisQuestionSelection(null)).toBeNull();
    expect(resolveAnalysisQuestionSelection({})).toBeNull();
  });
});
