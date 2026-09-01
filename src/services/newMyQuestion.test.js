import request from "../utils/request";
import {
  batchQueryNewMyBusinessQuestionTypes,
  queryEnabledNewMyBusinessQuestionTypes,
  queryNewMyQuestionPage,
} from "./newMyQuestion.js";

jest.mock("../utils/request", () => jest.fn());

const getQuery = (url) =>
  Object.fromEntries(
    (url.split("?")[1] || "").split("&").flatMap((part) => {
      const [key, value] = part.split("=");

      return key
        ? [[decodeURIComponent(key), decodeURIComponent(value || "")]]
        : [];
    }),
  );

describe("new my question v2 service", () => {
  beforeEach(() => {
    request.mockReset();
  });

  it("serializes only v2 question list query fields", async () => {
    request.mockResolvedValue({
      content: {
        items: [{ id: 341 }],
        limit: 10,
        pageNo: 1,
        total: 1,
      },
      ifLogin: true,
      status: true,
    });

    const response = await queryNewMyQuestionPage({
      chapterIds: [7, 8],
      gradeIds: [25],
      include: ["ignored"],
      keyword: "面积",
      knowledgeIds: [101],
      knowlegeIds: [999],
      knowlegeIntersection: true,
      knowlegeMerge: true,
      levels: [2],
      limit: 10,
      pageNo: 1,
      businessQuestionTypeIds: [3],
      questionLevelList: [1],
      questionType: 8,
      subjectIds: [1],
      type: 1,
      year: 2026,
      yearPeriodId: undefined,
    });
    const query = getQuery(request.mock.calls[0][0]);

    expect(request.mock.calls[0][0]).toContain("/api/v2/questions?");
    expect(query).toMatchObject({
      chapterIds: "7,8",
      gradeIds: "25",
      include: "answers,extras",
      keyword: "面积",
      knowledgeIds: "101",
      levels: "2",
      limit: "10",
      pageNo: "1",
      businessQuestionTypeIds: "3",
      subjectIds: "1",
    });
    expect(query).not.toHaveProperty("content");
    expect(query).not.toHaveProperty("questionType");
    expect(query).not.toHaveProperty("questionLevelList");
    expect(query).not.toHaveProperty("knowlegeIds");
    expect(query).not.toHaveProperty("examType");
    expect(query).not.toHaveProperty("year");
    expect(query).not.toHaveProperty("createUserId");
    expect(query).not.toHaveProperty("knowlegeMerge");
    expect(query).not.toHaveProperty("knowlegeIntersection");
    expect(query).not.toHaveProperty("type");
    expect(query).not.toHaveProperty("yearPeriodId");
    expect(response.content).toMatchObject({
      data: [{ id: 341 }],
      limit: 10,
      pageNo: 1,
      total: 1,
    });
  });

  it("选择全部时省略空的筛选参数", async () => {
    request.mockResolvedValue({
      content: { items: [], limit: 10, pageNo: 1, total: 0 },
      ifLogin: true,
      status: true,
    });

    await queryNewMyQuestionPage({
      businessQuestionTypeIds: [],
      gradeIds: [],
      levels: [],
      limit: 10,
      pageNo: 1,
      subjectIds: [1],
    });
    const query = getQuery(request.mock.calls[0][0]);

    expect(query).not.toHaveProperty("businessQuestionTypeIds");
    expect(query).not.toHaveProperty("gradeIds");
    expect(query).not.toHaveProperty("levels");
  });

  it("queries enabled question types and normalizes collection response", async () => {
    request.mockResolvedValue({
      content: {
        items: [
          {
            businessQuestionTypeId: 3,
            isBuiltin: true,
            isComposite: false,
            name: "单选题",
          },
        ],
        missingBusinessQuestionTypeIds: [],
      },
      ifLogin: true,
      status: true,
    });

    const response = await queryEnabledNewMyBusinessQuestionTypes({
      stageId: 2,
      subjectId: 13,
    });

    expect(request).toHaveBeenCalledWith(
      "/api/v2/business-question-types?stageId=2&subjectId=13",
    );
    expect(response).toMatchObject({
      content: [
        {
          businessQuestionTypeId: 3,
          isBuiltin: true,
          isComposite: false,
          name: "单选题",
        },
      ],
      missingBusinessQuestionTypeIds: [],
    });
  });

  it("queries question types by ids and skips empty batches", async () => {
    const emptyResponse = await batchQueryNewMyBusinessQuestionTypes({
      businessQuestionTypeIds: [],
    });

    expect(request).not.toHaveBeenCalled();
    expect(emptyResponse.content).toEqual([]);

    request.mockResolvedValue({
      content: {
        items: [
          { businessQuestionTypeId: 3, isBuiltin: true, isComposite: false },
          { businessQuestionTypeId: 8, isBuiltin: true, isComposite: true },
        ],
        missingBusinessQuestionTypeIds: [],
      },
      ifLogin: true,
      status: true,
    });

    const response = await batchQueryNewMyBusinessQuestionTypes({
      businessQuestionTypeIds: [3, 8, 3],
    });
    expect(request.mock.calls[0][0]).toBe(
      "/api/v2/business-question-types?businessQuestionTypeIds=3&businessQuestionTypeIds=8",
    );
    expect(response.content.map((item) => item.businessQuestionTypeId)).toEqual(
      [3, 8],
    );
  });
});
