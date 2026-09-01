import {
  createQuestionListPayload,
  isValidQuestionTypeGradeFilter,
  reconcileSavedTeachingContext,
  resolveStageSubjectSelection,
  resolveTeachingSelection,
} from "./questionListQueryContext";
import { normalizeV2QuestionListQueryContext } from "./questionListQuerySession";

const baseQueryContext = normalizeV2QuestionListQueryContext({
  businessQuestionTypeIds: [3],
  chapterGradeId: 25,
  chapterIds: ["chapter-1"],
  gradeIds: [25],
  keyword: "面积",
  knowledgeIds: ["knowledge-1"],
  knowledgeMultiple: false,
  levels: [2],
  limit: 50,
  pageNo: 4,
  stageId: 2,
  subjectId: 13,
  tabKey: 1,
  teachingMaterialId: 7,
});

describe("V2 question list query context", () => {
  it("题型筛选要求唯一年级", () => {
    expect(isValidQuestionTypeGradeFilter([3], [25])).toBe(true);
    expect(isValidQuestionTypeGradeFilter([], [])).toBe(true);
    expect(isValidQuestionTypeGradeFilter([3], [])).toBe(false);
    expect(isValidQuestionTypeGradeFilter([3], [25, 26])).toBe(false);
  });

  it("rejects a question type query without the current view grade", () => {
    expect(() =>
      createQuestionListPayload({
        ...baseQueryContext,
        gradeIds: [],
        tabKey: 2,
      }),
    ).toThrow("Invalid question type and grade filter");
  });

  it("maps chapter queries without leaking inactive knowledge fields", () => {
    expect(createQuestionListPayload(baseQueryContext)).toEqual({
      businessQuestionTypeIds: [3],
      chapterIds: ["chapter-1"],
      gradeIds: [25],
      keyword: "面积",
      levels: [2],
      limit: 50,
      pageNo: 4,
      subjectIds: [13],
    });
  });

  it("maps knowledge queries with the current filters", () => {
    expect(
      createQuestionListPayload({
        ...baseQueryContext,
        tabKey: 2,
      }),
    ).toEqual({
      businessQuestionTypeIds: [3],
      gradeIds: [25],
      keyword: "面积",
      knowledgeIds: ["knowledge-1"],
      levels: [2],
      limit: 50,
      pageNo: 4,
      subjectIds: [13],
    });
  });

  it("resolves saved ids against current teaching catalogs", () => {
    const stages = [
      { stageId: 2, subjectList: [{ id: 13 }] },
      { stageId: 3, subjectList: [{ id: 14 }] },
    ];
    const stageSelection = resolveStageSubjectSelection(
      stages,
      baseQueryContext,
    );
    const teachingSelection = resolveTeachingSelection(
      {
        gradeList: [{ gradeId: 24 }, { gradeId: 25 }],
        teachingList: [{ id: 6 }, { id: 7 }],
      },
      baseQueryContext,
    );

    expect(stageSelection).toEqual({
      canRestoreTeachingContext: true,
      stage: stages[0],
      subject: stages[0].subjectList[0],
    });
    expect(teachingSelection).toEqual({
      chapterIds: ["chapter-1"],
      grade: { gradeId: 25 },
      gradeIds: [25],
      teachingMaterial: { id: 7 },
    });
  });

  it("clears dependent fields when the saved teaching context is unavailable", () => {
    const reconciled = reconcileSavedTeachingContext(
      baseQueryContext,
      { stageId: 3, subjectList: [{ id: 14 }] },
      { id: 14 },
      false,
    );

    expect(reconciled).toMatchObject({
      businessQuestionTypeIds: [],
      chapterIds: [],
      gradeIds: [],
      knowledgeIds: [],
      pageNo: 1,
      stageId: 3,
      subjectId: 14,
    });
    expect(reconciled?.chapterGradeId).toBeUndefined();
    expect(reconciled?.teachingMaterialId).toBeUndefined();

    expect(
      resolveTeachingSelection(
        {
          gradeList: [{ gradeId: 26 }, { gradeId: 25 }],
          teachingList: [{ id: 8 }, { id: 7 }],
        },
        reconciled,
      ),
    ).toMatchObject({
      chapterIds: [],
      grade: { gradeId: 26 },
      teachingMaterial: { id: 8 },
    });
  });
});
