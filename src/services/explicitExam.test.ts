/** @jest-environment node */

import request from "../utils/request";
import { batchQueryBusinessQuestionTypesV2 } from "./businessQuestionTypeV2";
import {
  loadStudentExamResultSource,
  loadStudentPaperAnswerSource,
} from "./explicitExam";
import type { StudentExamPaperDto } from "./explicitExam.types";

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
const unreadablePaperIssue: StudentExamPaperDto["paperIssueCode"] =
  "PAPER_SNAPSHOT_UNREADABLE";

const legacyPaper = {
  contractVersion: "LEGACY",
  gradeName: "Grade 6",
  moduleList: [
    {
      moduleName: "Section",
      moduleQuestionNumber: 1,
      moduleScore: 4,
      questionList: [
        {
          businessQuestionTypeId: 5,
          chapterIds: [],
          children: [],
          indicatorIds: [],
          knowledgeIds: [],
          questionData: {
            businessQuestionTypeId: 5,
            children: [],
            elements: [],
            extras: [],
            id: 31,
            version: "1",
          },
          questionId: 31,
          questionScore: 4,
          questionTypeData: {
            businessQuestionTypeId: 5,
            elements: [],
            extras: [],
            isComposite: false,
            isSubjective: false,
            name: "Frozen legacy type",
          },
        },
      ],
    },
  ],
  paperAvailability: "READY",
  paperId: 60,
  title: "Legacy paper",
  totalScore: 4,
} as const;

beforeEach(() => {
  requestMock.mockReset();
  questionTypeMock.mockReset();
  questionTypeMock.mockResolvedValue({
    content: [{ businessQuestionTypeId: 5 }],
    ifLogin: true,
    missingBusinessQuestionTypeIds: [],
    status: true,
  });
});

it("keeps the unreadable snapshot issue in the student paper contract", () => {
  expect(unreadablePaperIssue).toBe("PAPER_SNAPSHOT_UNREADABLE");
});

it("loads a servable LEGACY paper through the unified student resource", async () => {
  requestMock.mockResolvedValue({
    content: legacyPaper,
    ifLogin: true,
    status: true,
  });

  await expect(loadStudentPaperAnswerSource(10)).resolves.toEqual({
    paper: legacyPaper,
    questionTypes: [
      expect.objectContaining({
        businessQuestionTypeId: 5,
        name: "Frozen legacy type",
      }),
    ],
  });
  expect(questionTypeMock).not.toHaveBeenCalled();
});

it("loads a servable LEGACY result through the unified student resource", async () => {
  const result = {
    examPaperDetailResponse: legacyPaper,
    studentId: 20,
    submittedAt: 1,
  };
  requestMock.mockResolvedValue({
    content: result,
    ifLogin: true,
    status: true,
  });

  await expect(loadStudentExamResultSource(10)).resolves.toEqual({
    questionTypes: [
      expect.objectContaining({
        businessQuestionTypeId: 5,
        name: "Frozen legacy type",
      }),
    ],
    result,
  });
  expect(questionTypeMock).not.toHaveBeenCalled();
});

it("keeps an unavailable result local without querying question types", async () => {
  const unavailableResult = {
    examPaperDetailResponse: {
      contractVersion: "V2",
      gradeName: "Grade 6",
      moduleList: [],
      paperAvailability: "UNAVAILABLE",
      paperIssueCode: "PAPER_SNAPSHOT_UNREADABLE",
      paperId: 60,
    },
    studentId: 20,
    submittedAt: 1,
  } as const;
  requestMock.mockResolvedValue({
    content: unavailableResult,
    ifLogin: true,
    status: true,
  });
  questionTypeMock.mockRejectedValue(
    new Error("question type service unavailable"),
  );

  await expect(loadStudentExamResultSource(10)).resolves.toEqual({
    questionTypes: [],
    result: unavailableResult,
  });
  expect(questionTypeMock).not.toHaveBeenCalled();
});
