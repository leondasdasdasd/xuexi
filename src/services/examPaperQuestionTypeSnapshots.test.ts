/** @jest-environment node */

import {
  collectExamPaperQuestionTypeSnapshots,
  requireExamPaperQuestionTypeSnapshots,
} from "./examPaperQuestionTypeSnapshots";

jest.mock("../utils/i18n", () => ({
  trans: (_key: string, fallback: string) => fallback,
}));

const questionType = (businessQuestionTypeId: number) => ({
  businessQuestionTypeId,
  elements: [],
  extras: [],
  isComposite: false,
  isSubjective: false,
  name: `Frozen ${businessQuestionTypeId}`,
});

interface TestQuestionData {
  businessQuestionTypeId: number;
  children: TestQuestionData[];
  elements: unknown[];
  extras: unknown[];
  id: number;
  version: string;
}

const questionData = (
  businessQuestionTypeId: number,
  children: TestQuestionData[] = [],
): TestQuestionData => ({
  businessQuestionTypeId,
  children,
  elements: [],
  extras: [],
  id: businessQuestionTypeId,
  version: "1",
});

describe("exam paper question type snapshots", () => {
  it("collects nested frozen snapshots once in paper order", () => {
    const leaf = {
      children: [],
      questionData: questionData(101),
      questionTypeData: questionType(101),
    };
    const modules = [
      {
        questionList: [
          {
            children: [leaf],
            questionData: questionData(106, [questionData(101)]),
            questionTypeData: { ...questionType(106), isComposite: true },
          },
          leaf,
        ],
      },
    ];

    expect(
      collectExamPaperQuestionTypeSnapshots(modules).map(
        (snapshot) => snapshot.businessQuestionTypeId,
      ),
    ).toEqual([106, 101]);
    expect(requireExamPaperQuestionTypeSnapshots(modules)).toHaveLength(2);
  });

  it("rejects a frozen paper when questionData has no matching type snapshot", () => {
    const modules = [
      {
        questionList: [
          {
            children: [],
            questionData: questionData(4111),
            questionTypeData: null,
          },
        ],
      },
    ];

    expect(() => requireExamPaperQuestionTypeSnapshots(modules)).toThrow(
      "试卷依赖的业务题型不完整",
    );
  });
});
