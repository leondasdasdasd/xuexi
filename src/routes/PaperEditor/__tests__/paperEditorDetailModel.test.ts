/** @jest-environment node */

import { createPaperEditorDraftFromDetail } from "../paperEditorDetailModel";
import { collectPaperBusinessQuestionTypeIds } from "../paperQuestionContentAdapter";
import type {
  ExamPaperDetailResponse,
  ExamPaperQuestionResponse,
} from "../types";

jest.mock("@yungu-fed/question-editor", () => ({
  normalizeRichTextContent: (value: unknown) => value,
}));
jest.mock("../../../utils/i18n", () => ({
  trans: (_key: string, fallback: string) => fallback,
}));

const question = (
  questionId: number,
  businessQuestionTypeId: number,
  questionScore: number | null,
  children: ExamPaperQuestionResponse[] = [],
  contentBusinessQuestionTypeId = businessQuestionTypeId,
): ExamPaperQuestionResponse => ({
  questionId,
  businessQuestionTypeId,
  questionScore,
  knowledgeIds: [],
  chapterIds: [],
  indicatorIds: [],
  children,
  questionData: {
    id: questionId,
    businessQuestionTypeId: contentBusinessQuestionTypeId,
    version: "1",
    elements: [],
    extras: [],
    children: children.flatMap((child) =>
      child.questionData ? [child.questionData] : [],
    ),
  },
});

const detail: ExamPaperDetailResponse = {
  id: 99,
  title: "期中练习",
  gradeName: "七年级",
  paperTypeCode: 1,
  gradeId: 7,
  subjectId: 2,
  totalScore: 10,
  capabilities: { update: true, delete: false, copy: false },
  content: {
    moduleList: [
      {
        moduleName: "复合题",
        moduleQuestionNumber: 1,
        moduleScore: 10,
        questionList: [
          question(
            1,
            1,
            10,
            [question(11, 101, 4.5), question(12, 102, 5.5)],
            106,
          ),
        ],
      },
    ],
  },
};

const questionTypes = [101, 102, 106].map((businessQuestionTypeId) => ({
  businessQuestionTypeId,
  name: `题型${businessQuestionTypeId}`,
  elements: [],
  extras: [],
  globalConfig: { hasAnswer: true },
}));

describe("paper editor detail model", () => {
  it("keeps empty placements without creating question content", () => {
    const emptyPlacement: ExamPaperQuestionResponse = {
      businessQuestionTypeId: 101,
      chapterIds: [],
      children: [],
      indicatorIds: [],
      knowledgeIds: [],
      questionData: null,
      questionId: null,
      questionScore: 1,
    };
    const detailWithEmptyPlacement: ExamPaperDetailResponse = {
      ...detail,
      content: {
        moduleList: [
          {
            moduleName: "单选",
            moduleQuestionNumber: 2,
            moduleScore: 2,
            questionList: [question(1, 101, 1), emptyPlacement],
          },
        ],
      },
    };

    expect(
      collectPaperBusinessQuestionTypeIds(
        detailWithEmptyPlacement.content.moduleList,
      ),
    ).toEqual([101]);

    const draft = createPaperEditorDraftFromDetail(
      detailWithEmptyPlacement,
      questionTypes,
      [{ gradeId: 7, name: "七年级" }],
      [{ subjectId: 2, name: "数学" }],
    );

    expect(draft.modules[0].questions).toHaveLength(2);
    expect(draft.modules[0].questions[1]).toMatchObject({
      content: null,
      key: "empty-placement-0-1",
      questionId: null,
      score: 1,
    });
  });

  it("rejects an associated placement without question content", () => {
    const associatedPlacementWithoutContent: ExamPaperQuestionResponse = {
      businessQuestionTypeId: 101,
      chapterIds: [],
      children: [],
      indicatorIds: [],
      knowledgeIds: [],
      questionData: null,
      questionId: 1,
      questionScore: 1,
    };

    const draft = createPaperEditorDraftFromDetail(
      {
        ...detail,
        content: {
          moduleList: [
            {
              moduleName: "单选",
              moduleQuestionNumber: 1,
              moduleScore: 1,
              questionList: [associatedPlacementWithoutContent],
            },
          ],
        },
      },
      questionTypes,
      [{ gradeId: 7, name: "七年级" }],
      [{ subjectId: 2, name: "数学" }],
    );
    expect(draft.modules[0].questions[0]).toMatchObject({
      questionId: 1,
      content: null,
      questionSnapshotStatus: "UNRESOLVED",
    });
  });

  it("collects nested types and maps the complete detail boundary", () => {
    expect(
      collectPaperBusinessQuestionTypeIds(detail.content.moduleList),
    ).toEqual([106, 101, 102]);

    const draft = createPaperEditorDraftFromDetail(
      detail,
      questionTypes,
      [{ gradeId: 7, name: "七年级" }],
      [{ subjectId: 2, name: "数学" }],
      "zh-CN",
    );

    expect(draft).toMatchObject({
      paperId: 99,
      title: "期中练习",
      paperType: 1,
      gradeId: 7,
      gradeName: "七年级",
      subjectId: 2,
      subjectName: "数学",
    });
    expect(draft.modules[0]).toMatchObject({
      key: "module-0",
      title: "复合题",
    });
    expect(draft.modules[0].questions[0]).toMatchObject({
      questionId: 1,
      score: 10,
      content: {
        id: 1,
        questionTypeKey: 106,
        children: [
          { id: 11, questionTypeKey: 101 },
          { id: 12, questionTypeKey: 102 },
        ],
      },
      children: [{ score: 4.5 }, { score: 5.5 }],
    });
  });

  it("maps non-positive and null leaf scores as editable empty values", () => {
    const draft = createPaperEditorDraftFromDetail(
      {
        ...detail,
        content: {
          moduleList: [
            {
              moduleName: "复合题",
              moduleQuestionNumber: 1,
              moduleScore: 0,
              questionList: [
                question(1, 106, null, [
                  question(11, 101, null),
                  question(12, 102, 0),
                  question(13, 103, -1),
                  question(14, 104, 1.5),
                ]),
              ],
            },
          ],
        },
      },
      questionTypes,
      [{ gradeId: 7, name: "七年级" }],
      [{ subjectId: 2, name: "数学" }],
    );

    expect(draft.modules[0].questions[0].children).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ questionId: 11, score: undefined }),
        expect.objectContaining({ questionId: 12, score: undefined }),
        expect.objectContaining({ questionId: 13, score: undefined }),
        expect.objectContaining({ questionId: 14, score: 1.5 }),
      ]),
    );
  });

  it("renders combination content without inventing placement children", () => {
    const singlePlacementWithCombinationContent: ExamPaperDetailResponse = {
      ...detail,
      content: {
        moduleList: [
          {
            moduleName: "单题位",
            moduleQuestionNumber: 1,
            moduleScore: 1,
            questionList: [
              {
                ...question(11652, 1, 1),
                children: [],
                questionData: {
                  id: 11652,
                  businessQuestionTypeId: 106,
                  version: "1",
                  elements: [],
                  extras: [],
                  children: [
                    {
                      id: 11653,
                      businessQuestionTypeId: 101,
                      version: "1",
                      elements: [],
                      extras: [],
                      children: [],
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
    };

    const draft = createPaperEditorDraftFromDetail(
      singlePlacementWithCombinationContent,
      questionTypes,
      [{ gradeId: 7, name: "七年级" }],
      [{ subjectId: 2, name: "数学" }],
    );

    expect(draft.modules[0].questions[0]).toMatchObject({
      children: [],
      content: {
        questionTypeKey: 106,
        children: [{ id: 11653, questionTypeKey: 101 }],
      },
    });
  });
});
