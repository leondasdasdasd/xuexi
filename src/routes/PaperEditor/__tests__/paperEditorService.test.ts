import request from "../../../utils/request";
import {
  getPaperEditorDisplayError,
  loadPaperEditorDetailSource,
  loadPaperEditorSource,
  queryPaperTypeOptions,
  savePaperEditorDraft,
} from "../paperEditorService";
import type { PaperSaveRequest } from "../types";

jest.mock("../../../utils/request", () => jest.fn());
jest.mock("../../../utils/utils", () => ({ loginRedirect: jest.fn() }));

const requestMock = request as unknown as jest.Mock;

describe("paper editor service", () => {
  beforeEach(() => requestMock.mockReset());

  it("loads the existing paper type list", async () => {
    requestMock.mockResolvedValue({ content: [], ifLogin: true, status: true });

    await queryPaperTypeOptions();

    expect(requestMock).toHaveBeenCalledWith("/api/paper/type/list?type=0");
  });

  it("loads the basket before querying every nested business question type", async () => {
    requestMock
      .mockResolvedValueOnce({
        content: {
          subjectId: 2,
          subjectName: "数学",
          moduleList: [
            {
              questionList: [
                {
                  businessQuestionTypeId: 101,
                  children: [
                    {
                      businessQuestionTypeId: 102,
                      children: [],
                      questionData: {
                        businessQuestionTypeId: 102,
                        children: [],
                        elements: [],
                        extras: [],
                        id: 102,
                        version: "1",
                      },
                    },
                  ],
                  questionData: {
                    businessQuestionTypeId: 101,
                    children: [
                      {
                        businessQuestionTypeId: 102,
                        children: [],
                        elements: [],
                        extras: [],
                        id: 102,
                        version: "1",
                      },
                    ],
                    elements: [],
                    extras: [],
                    id: 101,
                    version: "1",
                  },
                },
              ],
            },
          ],
        },
        ifLogin: true,
        status: true,
      })
      .mockResolvedValueOnce({
        content: [{ code: 1, typeName: "课堂小测" }],
        ifLogin: true,
        status: true,
      })
      .mockResolvedValueOnce({
        content: [
          { gradeId: 7, name: "七年级" },
          { gradeId: 8, name: "八年级" },
        ],
        ifLogin: true,
        status: true,
      })
      .mockResolvedValueOnce({
        content: [
          { id: 2, name: "数学" },
          { id: 3, name: "英语" },
        ],
        ifLogin: true,
        status: true,
      })
      .mockResolvedValueOnce({
        content: {
          items: [
            {
              businessQuestionTypeId: 101,
              isBuiltin: false,
              isComposite: false,
            },
          ],
          missingBusinessQuestionTypeIds: [],
        },
        ifLogin: true,
        status: true,
      });

    const source = await loadPaperEditorSource(2);

    expect(requestMock.mock.calls[0][0]).toBe(
      "/api/v2/question-basket?enrollmentQuestion=false&subjectId=2",
    );
    expect(requestMock.mock.calls[2][0]).toBe("/api/question/newGrade/list?");
    expect(requestMock.mock.calls[3][0]).toBe("/api/question/subject/list?");
    expect(requestMock.mock.calls[4][0]).toContain(
      "businessQuestionTypeIds=101&businessQuestionTypeIds=102",
    );
    expect(requestMock.mock.calls[4][0]).not.toContain("gradeId");
    expect(requestMock.mock.calls[4][0]).not.toContain("subjectId");
    expect(source.grades).toEqual([
      { gradeId: 7, name: "七年级" },
      { gradeId: 8, name: "八年级" },
    ]);
    expect(source.subjects).toEqual([
      { subjectId: 2, name: "数学" },
      { subjectId: 3, name: "英语" },
    ]);
    expect(source.paperTypes).toEqual([{ code: 1, typeName: "课堂小测" }]);
    expect(source.questionTypes).toEqual([
      {
        businessQuestionTypeId: 101,
        isBuiltin: false,
        isComposite: false,
      },
    ]);
  });

  it("keeps login redirects silent at the page boundary", async () => {
    requestMock.mockResolvedValue({
      content: null,
      ifLogin: false,
      status: false,
    });

    let caughtError: unknown;
    try {
      await savePaperEditorDraft({} as PaperSaveRequest);
    } catch (error) {
      caughtError = error;
    }

    expect(getPaperEditorDisplayError(caughtError, "fallback")).toBeUndefined();
  });

  it("loads the v2 paper detail and all boundary options", async () => {
    requestMock
      .mockResolvedValueOnce({
        content: {
          id: 99,
          content: {
            moduleList: [
              {
                questionList: [
                  {
                    businessQuestionTypeId: 1,
                    children: [
                      {
                        businessQuestionTypeId: 101,
                        children: [],
                        questionData: {
                          businessQuestionTypeId: 101,
                          children: [],
                          elements: [],
                          extras: [],
                          id: 101,
                          version: "1",
                        },
                        questionTypeData: {
                          businessQuestionTypeId: 101,
                          elements: [],
                          extras: [],
                          isComposite: false,
                          isSubjective: false,
                          name: "Frozen leaf",
                        },
                      },
                    ],
                    questionData: {
                      businessQuestionTypeId: 106,
                      children: [
                        {
                          businessQuestionTypeId: 101,
                          children: [],
                          elements: [],
                          extras: [],
                          id: 101,
                          version: "1",
                        },
                      ],
                      elements: [],
                      extras: [],
                      id: 106,
                      version: "1",
                    },
                    questionTypeData: {
                      businessQuestionTypeId: 106,
                      elements: [],
                      extras: [],
                      isComposite: true,
                      isSubjective: false,
                      name: "Frozen composite",
                    },
                  },
                ],
              },
            ],
          },
        },
        ifLogin: true,
        status: true,
      })
      .mockResolvedValueOnce({
        content: [{ code: 1, typeName: "课堂小测" }],
        ifLogin: true,
        status: true,
      })
      .mockResolvedValueOnce({
        content: [{ gradeId: 7, name: "七年级" }],
        ifLogin: true,
        status: true,
      })
      .mockResolvedValueOnce({
        content: [{ id: 2, name: "数学" }],
        ifLogin: true,
        status: true,
      });

    const source = await loadPaperEditorDetailSource(99);

    expect(requestMock.mock.calls[0][0]).toBe("/api/v2/exam-papers/99");
    expect(requestMock).toHaveBeenCalledTimes(4);
    expect(source).toMatchObject({
      detail: { id: 99 },
      grades: [{ gradeId: 7, name: "七年级" }],
      questionTypes: [
        { businessQuestionTypeId: 106, name: "Frozen composite" },
        { businessQuestionTypeId: 101, name: "Frozen leaf" },
      ],
      subjects: [{ subjectId: 2, name: "数学" }],
    });
  });

  it("sends the authoritative paper save request", async () => {
    const payload: PaperSaveRequest = {
      paperTypeCode: 1,
      title: "期中练习",
      gradeId: 7,
      subjectId: 2,
      totalScore: 10,
      modules: [],
    };

    requestMock.mockResolvedValue({
      content: { id: 99 },
      ifLogin: true,
      status: true,
    });

    const paperId = await savePaperEditorDraft(payload);

    expect(requestMock).toHaveBeenCalledWith("/api/v2/exam-papers", {
      body: payload,
      method: "POST",
    });
    expect(paperId).toBe(99);
  });

  it("updates an existing paper through the v2 boundary", async () => {
    const payload: PaperSaveRequest = {
      paperId: 99,
      paperTypeCode: 1,
      title: "期中练习",
      gradeId: 7,
      subjectId: 2,
      totalScore: 10,
      modules: [],
    };
    requestMock.mockResolvedValue({
      content: { id: 99 },
      ifLogin: true,
      status: true,
    });

    await savePaperEditorDraft(payload);

    expect(requestMock).toHaveBeenCalledWith("/api/v2/exam-papers/99", {
      body: {
        paperTypeCode: 1,
        title: "期中练习",
        gradeId: 7,
        subjectId: 2,
        totalScore: 10,
        modules: [],
      },
      method: "PUT",
    });
  });
});
