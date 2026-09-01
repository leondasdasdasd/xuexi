import request from "../utils/request";
import {
  bindQuestionV2Basket,
  createQuestionV2Resource,
  deleteQuestionV2Resource,
  queryQuestionV2Resource,
  queryQuestionV2Basket,
  unbindQuestionV2Basket,
  updateQuestionV2Resource,
} from "./questionV2.js";

jest.mock("../utils/request", () => jest.fn());

describe("question v2 service", () => {
  beforeEach(() => {
    request.mockReset();
  });

  it("creates a v2 question resource with the backend QuestionRequest body", async () => {
    const payload = {
      question: {
        children: [],
        elements: [],
        extras: [],
        businessQuestionTypeId: 3,
        version: "1",
      },
      resource: {
        gradeId: 7,
        subjectId: 2,
      },
    };

    request.mockResolvedValue({
      content: { id: 341 },
      ifLogin: true,
      status: true,
    });

    const response = await createQuestionV2Resource(payload);

    expect(request).toHaveBeenCalledWith("/api/v2/questions", {
      body: payload,
      method: "POST",
    });
    expect(response.content.id).toBe(341);
  });

  it("queries a v2 question detail with editor content includes", async () => {
    request.mockResolvedValue({
      content: { id: 341 },
      ifLogin: true,
      status: true,
    });

    await queryQuestionV2Resource(341);

    expect(request.mock.calls[0][0]).toBe(
      "/api/v2/questions/341?include=answers%2Cextras",
    );
  });

  it("updates and deletes a v2 question resource through REST endpoints", async () => {
    const payload = {
      question: { businessQuestionTypeId: 3 },
      resource: { gradeId: 7, subjectId: 2 },
    };

    await updateQuestionV2Resource(341, payload);
    await deleteQuestionV2Resource(341);

    expect(request).toHaveBeenNthCalledWith(1, "/api/v2/questions/341", {
      body: payload,
      method: "PUT",
    });
    expect(request).toHaveBeenNthCalledWith(2, "/api/v2/questions/341", {
      method: "DELETE",
    });
  });

  it("binds and unbinds v2 question basket entries", async () => {
    const payload = {
      gradeId: 7,
      questionId: 341,
      subjectId: 2,
    };

    await bindQuestionV2Basket(payload);
    await unbindQuestionV2Basket({ questionId: 341 });

    expect(request).toHaveBeenNthCalledWith(1, "/api/v2/question-basket/bind", {
      body: payload,
      method: "POST",
    });
    expect(request).toHaveBeenNthCalledWith(
      2,
      "/api/v2/question-basket/unbind",
      {
        body: { questionId: 341 },
        method: "POST",
      },
    );
  });

  it("queries a v2 question basket by subject", async () => {
    await queryQuestionV2Basket({ subjectId: 2 });

    expect(request).toHaveBeenCalledWith(
      "/api/v2/question-basket?enrollmentQuestion=false&subjectId=2",
    );
  });
});
