import {
  normalizeV2QuestionListQueryContext,
  parseV2QuestionListQuerySession,
  readV2QuestionListQuerySession,
  saveV2QuestionListQuerySession,
  serializeV2QuestionListQuerySession,
  V2_QUESTION_LIST_QUERY_SESSION_KEY,
  type V2QuestionListQueryStorage,
} from "./questionListQuerySession";

const completeQueryContext = normalizeV2QuestionListQueryContext({
  businessQuestionTypeIds: [3, 8],
  chapterGradeId: 25,
  chapterIds: ["chapter-1", 2],
  gradeIds: [25],
  keyword: "面积",
  knowledgeIds: [101, "knowledge-2"],
  knowledgeMultiple: true,
  levels: [2, 3],
  limit: 50,
  pageNo: 4,
  stageId: 2,
  subjectId: 13,
  tabKey: 2,
  teachingMaterialId: 7,
});

describe("V2 question list query session", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("round-trips the complete query context", () => {
    expect(
      parseV2QuestionListQuerySession(
        serializeV2QuestionListQuerySession(completeQueryContext),
      ),
    ).toEqual(completeQueryContext);
  });

  it("normalizes invalid fields independently", () => {
    expect(
      normalizeV2QuestionListQueryContext({
        businessQuestionTypeIds: [3, 3, -1, "bad"],
        chapterIds: ["", " chapter-1 ", null],
        gradeIds: "25",
        keyword: 12,
        knowledgeMultiple: true,
        levels: [1, 4, "2"],
        limit: 0,
        pageNo: -2,
        stageId: "2",
        tabKey: 7,
      }),
    ).toEqual({
      businessQuestionTypeIds: [3],
      chapterGradeId: undefined,
      chapterIds: ["chapter-1"],
      gradeIds: [],
      keyword: "",
      knowledgeIds: [],
      knowledgeMultiple: true,
      levels: [1, 2],
      limit: 10,
      pageNo: 1,
      stageId: 2,
      subjectId: undefined,
      tabKey: 1,
      teachingMaterialId: undefined,
    });
  });

  it("rejects non-primitive values that JavaScript could coerce to ids", () => {
    expect(
      normalizeV2QuestionListQueryContext({
        businessQuestionTypeIds: [true, [3]],
        chapterGradeId: true,
        gradeIds: [[25]],
        levels: [true, [2]],
        limit: [50],
        pageNo: [4],
        stageId: true,
        subjectId: [13],
        teachingMaterialId: [7],
      }),
    ).toMatchObject({
      businessQuestionTypeIds: [],
      chapterGradeId: undefined,
      gradeIds: [],
      levels: [],
      limit: 10,
      pageNo: 1,
      stageId: undefined,
      subjectId: undefined,
      teachingMaterialId: undefined,
    });
  });

  it.each(["not-json", '{"version":1,"query":{}}'])(
    "clears unreadable session data: %s",
    (storedValue) => {
      window.sessionStorage.setItem(
        V2_QUESTION_LIST_QUERY_SESSION_KEY,
        storedValue,
      );

      expect(readV2QuestionListQuerySession()).toBeUndefined();
      expect(
        window.sessionStorage.getItem(V2_QUESTION_LIST_QUERY_SESSION_KEY),
      ).toBeNull();
    },
  );

  it("rejects a current session with an invalid question type and grade filter", () => {
    expect(
      parseV2QuestionListQuerySession(
        JSON.stringify({
          query: {
            businessQuestionTypeIds: [3],
            gradeIds: [],
            tabKey: 2,
          },
          version: 2,
        }),
      ),
    ).toBeUndefined();
  });

  it("reads data saved in the current browser tab", () => {
    expect(saveV2QuestionListQuerySession(completeQueryContext)).toBe(true);
    expect(readV2QuestionListQuerySession()).toEqual(completeQueryContext);
  });

  it("keeps storage failures outside the page query flow", () => {
    const unavailableStorage: V2QuestionListQueryStorage = {
      getItem: () => {
        throw new Error("unavailable");
      },
      removeItem: jest.fn(),
      setItem: () => {
        throw new Error("unavailable");
      },
    };

    expect(readV2QuestionListQuerySession(unavailableStorage)).toBeUndefined();
    expect(
      saveV2QuestionListQuerySession(completeQueryContext, unavailableStorage),
    ).toBe(false);
  });
});
