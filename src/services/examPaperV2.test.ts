/** @jest-environment node */

import request from "../utils/request";
import { loginRedirect } from "../utils/utils";
import { batchQueryBusinessQuestionTypesV2 } from "./businessQuestionTypeV2";
import {
  getExamPaperV2Detail,
  loadExamPaperV2AnswerSource,
} from "./examPaperV2";

jest.mock("../utils/request", () => jest.fn());
jest.mock("./businessQuestionTypeV2", () => ({
  batchQueryBusinessQuestionTypesV2: jest.fn(),
}));
jest.mock("../utils/i18n", () => ({
  trans: (_key: string, fallback: string) => fallback,
}));
jest.mock("../utils/utils", () => ({ loginRedirect: jest.fn() }));

const requestMock = request as unknown as jest.Mock;
const questionTypeMock = batchQueryBusinessQuestionTypesV2 as jest.Mock;

const detail = {
  capabilities: { copy: false, delete: false, update: false },
  content: {
    moduleList: [
      {
        moduleName: "Section",
        moduleQuestionNumber: 1,
        moduleScore: 5,
        questionList: [
          {
            businessQuestionTypeId: 101,
            chapterIds: [],
            children: [
              {
                businessQuestionTypeId: 101,
                chapterIds: [],
                children: [],
                indicatorIds: [],
                knowledgeIds: [],
                questionData: {
                  businessQuestionTypeId: 101,
                  children: [],
                  elements: [],
                  extras: [],
                  id: 2,
                  version: "1",
                },
                questionId: 2,
                questionScore: 2,
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
            indicatorIds: [],
            knowledgeIds: [],
            questionData: {
              businessQuestionTypeId: 106,
              children: [
                {
                  businessQuestionTypeId: 101,
                  children: [],
                  elements: [],
                  extras: [],
                  version: "1",
                },
              ],
              elements: [],
              extras: [],
              version: "1",
            },
            questionId: 1,
            questionScore: 5,
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
  gradeId: 1,
  id: 42,
  paperTypeCode: 1,
  subjectId: 2,
  title: "Trial",
  totalScore: 5,
};

describe("V2 exam paper service", () => {
  beforeEach(() => {
    requestMock.mockReset();
    questionTypeMock.mockReset();
  });

  it("loads the authoritative answer source from frozen type snapshots", async () => {
    requestMock.mockResolvedValue({
      content: detail,
      ifLogin: true,
      status: true,
    });
    await expect(loadExamPaperV2AnswerSource(42)).resolves.toEqual({
      detail,
      questionTypes: [
        expect.objectContaining({
          businessQuestionTypeId: 106,
          name: "Frozen composite",
        }),
        expect.objectContaining({
          businessQuestionTypeId: 101,
          name: "Frozen leaf",
        }),
      ],
    });
    expect(requestMock).toHaveBeenCalledWith(
      "/api/v2/exam-papers/42",
      undefined,
      undefined,
      undefined,
    );
    expect(questionTypeMock).not.toHaveBeenCalled();
  });

  it("loads a canonical LEGACY paper without selecting another endpoint", async () => {
    const legacyDetail = { ...detail, contractVersion: "LEGACY" };
    requestMock.mockResolvedValue({
      content: legacyDetail,
      ifLogin: true,
      status: true,
    });
    await expect(loadExamPaperV2AnswerSource(42)).resolves.toEqual({
      detail: legacyDetail,
      questionTypes: [
        expect.objectContaining({ businessQuestionTypeId: 106 }),
        expect.objectContaining({ businessQuestionTypeId: 101 }),
      ],
    });
    expect(requestMock).toHaveBeenCalledTimes(1);
    expect(questionTypeMock).not.toHaveBeenCalled();
  });

  it("normalizes the edit-disabled reason from the flat V2 response", async () => {
    requestMock.mockResolvedValue({
      content: {
        editDisabledReasonCode: "PAPER_CONTENT_FROZEN",
        id: 42,
        moduleList: [],
        showEdit: false,
        type: 1,
      },
      ifLogin: true,
      status: true,
    });

    await expect(getExamPaperV2Detail(42)).resolves.toMatchObject({
      capabilities: {
        update: false,
        updateDisabledReasonCode: "PAPER_CONTENT_FROZEN",
      },
    });
  });

  it("rejects missing V2 question type definitions", async () => {
    requestMock.mockResolvedValue({
      content: {
        ...detail,
        content: {
          moduleList: detail.content.moduleList.map((module) => ({
            ...module,
            questionList: module.questionList.map((question) => ({
              ...question,
              questionTypeData: null,
            })),
          })),
        },
      },
      ifLogin: true,
      status: true,
    });
    questionTypeMock.mockResolvedValue({
      content: [{ businessQuestionTypeId: 106 }],
      ifLogin: true,
      missingBusinessQuestionTypeIds: [101],
      status: true,
    });

    await expect(loadExamPaperV2AnswerSource(42)).rejects.toThrow(
      "试卷依赖的业务题型不完整",
    );
    expect(questionTypeMock).not.toHaveBeenCalled();
  });

  it("redirects unauthenticated V2 detail requests at the shared boundary", async () => {
    requestMock.mockResolvedValue({ ifLogin: false, status: false });

    await expect(loadExamPaperV2AnswerSource(42)).rejects.toThrow();
    expect(loginRedirect).toHaveBeenCalledTimes(1);
    expect(questionTypeMock).not.toHaveBeenCalled();
  });
});
