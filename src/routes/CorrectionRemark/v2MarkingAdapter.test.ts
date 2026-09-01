/** @jest-environment node */

import {
  createV2MarkingSubmission,
  mapV2StudentResultToCorrectionSource,
  summarizeV2MarkingProgress,
} from "./v2MarkingAdapter";
import type { ExamPaperQuestionResponse } from "../../services/examPaperV2.types";

jest.mock("@yungu-fed/question-editor", () => ({
  createEmptyQuestionPlayerResponse: (content: {
    children: object[];
    id: number;
    questionTypeKey: number;
    version: "1";
  }) => ({
    children: content.children.map(() => ({
      children: [],
      elementAnswers: [],
    })),
    elementAnswers: [],
    id: content.id,
    questionTypeKey: content.questionTypeKey,
    version: content.version,
  }),
  createQuestionPreviewDraft: (content: object) => content,
  normalizeRichTextContent: (value: unknown) => value,
}));

const type = (
  businessQuestionTypeId: number,
  isSubjective: boolean,
  isComposite = false,
) => ({
  businessQuestionTypeId,
  elements: [],
  extras: [],
  globalConfig: { hasAnswer: true },
  isComposite,
  isSubjective,
  name: `Type ${businessQuestionTypeId}`,
});

const question = ({
  children = [],
  id,
  placementTypeId,
  questionTypeId,
  subjective,
}: {
  children?: ExamPaperQuestionResponse[];
  id: number;
  placementTypeId: number;
  questionTypeId: number;
  subjective: boolean;
}): ExamPaperQuestionResponse => ({
  businessQuestionTypeId: placementTypeId,
  chapterIds: [],
  children,
  indicatorIds: [],
  knowledgeIds: [],
  questionData: {
    businessQuestionTypeId: questionTypeId,
    children: [],
    elements: [],
    extras: [],
    id,
    version: "1",
  },
  questionId: id,
  questionScore: 4,
  questionTypeData: type(questionTypeId, subjective, children.length > 0),
});

it.each(["V2", "LEGACY"])(
  "maps persisted subjective leaves from canonical %s question data",
  (contractVersion) => {
    const subjectiveLeaf = question({
      id: 31,
      placementTypeId: 999,
      questionTypeId: 5,
      subjective: true,
    });
    const objectiveLeaf = question({
      id: 32,
      placementTypeId: 5,
      questionTypeId: 1,
      subjective: false,
    });
    const composite = question({
      children: [subjectiveLeaf, objectiveLeaf],
      id: 30,
      placementTypeId: 700,
      questionTypeId: 6,
      subjective: false,
    });
    const answerJson = JSON.stringify({
      businessQuestionTypeId: 5,
      children: [],
      elementAnswers: [{ answers: { text: "student answer" }, type: "text" }],
      id: 31,
      version: "1",
    });

    const source = mapV2StudentResultToCorrectionSource({
      contractVersion,
      examPaperDetailResponse: {
        contractVersion,
        gradeName: "Grade 8",
        moduleList: [
          {
            moduleName: "Composite",
            moduleQuestionNumber: 1,
            moduleScore: 8,
            questionList: [composite],
          },
        ],
        paperId: 99,
        title: "V2 paper",
        totalScore: 8,
      },
      questionOnlineMarkingItemList: [
        {
          answerJson,
          id: 101,
          isCorrect: 0,
          questionId: 31,
          questionScore: 4,
          questionSerialNumber: "1.1",
          studentScore: null,
          tags: [1],
          teacherAnnotation: '{"objects":[]}',
        },
        {
          answerJson: null,
          id: 102,
          isCorrect: 1,
          questionId: 32,
          questionScore: 4,
          questionSerialNumber: "1.2",
          studentScore: 4,
        },
      ],
      studentId: 20,
      studentName: "Ada",
    });

    expect(source.blocks).toHaveLength(1);
    expect(source.blocks[0].questions).toHaveLength(1);
    expect(source.blocks[0].questions[0]).toMatchObject({
      isCorrect: 0,
      questionId: 31,
      resultId: 101,
      studentScore: null,
      tags: [1],
      teacherAnnotation: '{"objects":[]}',
    });
    expect(source.blocks[0].questions[0].response.elementAnswers).toEqual([
      { answers: { text: "student answer" }, type: "text" },
    ]);
  },
);

it("creates the V2 score and annotation submission shape", () => {
  expect(
    createV2MarkingSubmission([
      {
        questionId: 31,
        resultId: 101,
        studentScore: 3,
        tags: [1, 3],
        teacherAnnotation: '{"objects":[{"type":"path"}]}',
      },
    ]),
  ).toEqual({
    questionResults: [
      {
        questionId: 31,
        resultId: 101,
        studentScore: 3,
        tags: [1, 3],
        teacherAnnotation: '{"objects":[{"type":"path"}]}',
      },
    ],
  });
});

it("rejects fractional scores before creating a V2 marking request", () => {
  expect(() =>
    createV2MarkingSubmission([
      {
        questionId: 31,
        resultId: 101,
        studentScore: 1.5,
        tags: [],
        teacherAnnotation: null,
      },
    ]),
  ).toThrow("V2批改分数必须为非负整数");
});

it("counts marking progress only for the selected subjective question block", () => {
  expect(
    summarizeV2MarkingProgress(
      [
        {
          examId: 12,
          pending: false,
          studentId: 8,
          questionResults: [
            {
              answerJson: "{}",
              questionId: 31,
              questionScore: 4,
              resultId: 101,
              status: 1,
              studentScore: 4,
            },
            {
              answerJson: "{}",
              questionId: 32,
              questionScore: 2,
              resultId: 102,
              status: 1,
              studentScore: 2,
            },
          ],
        },
      ],
      new Set([31]),
    ),
  ).toEqual({ allNum: 1, checkNum: 1 });
});
