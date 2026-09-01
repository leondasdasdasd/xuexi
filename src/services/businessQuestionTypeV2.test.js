import request from "../utils/request";
import {
  batchQueryBusinessQuestionTypesV2,
  queryEnabledBusinessQuestionTypesV2,
} from "./businessQuestionTypeV2.js";

jest.mock("../utils/request", () => jest.fn());

const NULL_CONTENT = JSON.parse("null");

describe("question type v2 service", () => {
  beforeEach(() => {
    request.mockReset();
  });

  it("queries enabled v2 question types for a teaching context", async () => {
    request.mockResolvedValue({
      content: {
        items: [
          {
            businessQuestionTypeId: 3,
            isBuiltin: true,
            isComposite: false,
            name: "服务端单选",
          },
        ],
        missingBusinessQuestionTypeIds: [],
      },
      ifLogin: true,
      status: true,
    });

    const response = await queryEnabledBusinessQuestionTypesV2({
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
          name: "服务端单选",
        },
      ],
      missingBusinessQuestionTypeIds: [],
    });
  });

  it("queries v2 question types by ids and skips empty batches", async () => {
    const emptyResponse = await batchQueryBusinessQuestionTypesV2({
      businessQuestionTypeIds: [],
    });

    expect(request).not.toHaveBeenCalled();
    expect(emptyResponse.content).toEqual([]);

    request.mockResolvedValue({
      content: {
        items: [
          { businessQuestionTypeId: 1, isBuiltin: true, isComposite: true },
          { businessQuestionTypeId: 3, isBuiltin: true, isComposite: false },
        ],
        missingBusinessQuestionTypeIds: [],
      },
      ifLogin: true,
      status: true,
    });

    const response = await batchQueryBusinessQuestionTypesV2({
      businessQuestionTypeIds: [1, 3, 3],
    });
    expect(request.mock.calls[0][0]).toBe(
      "/api/v2/business-question-types?businessQuestionTypeIds=1&businessQuestionTypeIds=3",
    );
    expect(response.content.map((item) => item.businessQuestionTypeId)).toEqual(
      [1, 3],
    );
  });

  it("queries question types for a complete teaching context", async () => {
    request.mockResolvedValue({
      content: { items: [], missingBusinessQuestionTypeIds: [] },
      ifLogin: true,
      status: true,
    });

    await queryEnabledBusinessQuestionTypesV2({ stageId: 2, subjectId: 12 });

    expect(request).toHaveBeenCalledWith(
      "/api/v2/business-question-types?stageId=2&subjectId=12",
    );
  });

  it.each([
    ["isBuiltin", { isComposite: false }],
    ["isComposite", { isBuiltin: true }],
    ["isBuiltin", { isBuiltin: "true", isComposite: false }],
    ["isComposite", { isBuiltin: true, isComposite: "false" }],
  ])("rejects an invalid required %s field", async (fieldName, fields) => {
    request.mockResolvedValue({
      content: {
        items: [{ businessQuestionTypeId: 3, ...fields }],
        missingBusinessQuestionTypeIds: [],
      },
      ifLogin: true,
      status: true,
    });

    await expect(
      queryEnabledBusinessQuestionTypesV2({ stageId: 2, subjectId: 13 }),
    ).rejects.toThrow(`业务题型响应字段${fieldName}必须为布尔值`);
  });

  it("rejects a partial teaching context instead of silently dropping it", async () => {
    await expect(
      queryEnabledBusinessQuestionTypesV2({ stageId: 2 }),
    ).rejects.toThrow("stageId和subjectId必须同时提供");
    expect(request).not.toHaveBeenCalled();
  });

  it("rejects an empty teaching context instead of querying all types", async () => {
    await expect(queryEnabledBusinessQuestionTypesV2()).rejects.toThrow(
      "stageId和subjectId必须同时提供",
    );
    expect(request).not.toHaveBeenCalled();
  });

  it("preserves failed responses before collection normalization", async () => {
    request.mockResolvedValue({
      code: 1000,
      content: NULL_CONTENT,
      ifLogin: false,
      message: "请刷新！",
      status: false,
    });

    const response = await queryEnabledBusinessQuestionTypesV2({
      stageId: 2,
      subjectId: 13,
    });

    expect(response).toEqual({
      code: 1000,
      content: NULL_CONTENT,
      ifLogin: false,
      message: "请刷新！",
      status: false,
    });
  });
});
