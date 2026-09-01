/** @jest-environment node */
import request from "../../../utils/request";
import { batchQueryBusinessQuestionTypesV2 } from "../../../services/businessQuestionTypeV2";
import {
  configureAndPublishExamV2,
  getStudentExamEntry,
  getStudentPaper,
  getTeacherExamStudents,
  getTeacherStudentExamResult,
  loadStudentExamResultSource,
  loadStudentPaperAnswerSource,
  startStudentExam,
  submitExamPreview,
  submitStudentExam,
} from "../../../services/explicitExam";

jest.mock("../../../utils/request", () => jest.fn());
jest.mock("../../../utils/utils", () => ({ loginRedirect: jest.fn() }));
jest.mock("../../../services/businessQuestionTypeV2", () => ({
  batchQueryBusinessQuestionTypesV2: jest.fn(),
}));

const requestMock = request as jest.MockedFunction<typeof request>;
const resolveRequest = (value: unknown) =>
  (requestMock as unknown as jest.Mock).mockResolvedValue(value);

describe("explicit exam V2 API", () => {
  beforeEach(() => requestMock.mockReset());

  it("uses the implemented student lifecycle resources", async () => {
    resolveRequest({
      content: {
        examId: 12,
        gradeName: "Grade 8",
        paperId: 99,
        status: "NOT_STARTED",
        taskPublishId: 33,
        taskPublishTime: "2026-08-11T09:30:00+08:00",
      },
      ifLogin: true,
      status: true,
    });
    await getStudentExamEntry(12, 33);
    expect(requestMock).toHaveBeenCalledWith(
      "/api/v2/exams/12/student-entry?taskPublishId=33",
      undefined,
      undefined,
      undefined,
    );

    resolveRequest({ content: "started", ifLogin: true, status: true });
    await startStudentExam(12, 33);
    expect(requestMock).toHaveBeenLastCalledWith(
      "/api/v2/exams/12/student-start?taskPublishId=33",
      { method: "POST" },
      undefined,
      undefined,
    );

    resolveRequest({
      content: { moduleList: [], paperAvailability: "READY" },
      ifLogin: true,
      status: true,
    });
    await getStudentPaper(12);
    expect(requestMock).toHaveBeenLastCalledWith(
      "/api/v2/exams/12/student-paper",
      undefined,
      undefined,
      undefined,
    );
  });

  it("does not load question types for an unavailable paper", async () => {
    resolveRequest({
      content: {
        contractVersion: "V2",
        gradeName: "Grade 6",
        moduleList: [],
        paperAvailability: "UNAVAILABLE",
        paperIssueCode: "QUESTION_UNASSOCIATED",
        title: "Unavailable exam",
        totalScore: 1,
      },
      ifLogin: true,
      status: true,
    });

    await expect(loadStudentPaperAnswerSource(2044)).resolves.toEqual(
      expect.objectContaining({ questionTypes: [] }),
    );
    expect(batchQueryBusinessQuestionTypesV2).not.toHaveBeenCalled();
  });

  it("normalizes the student entry transport shape without leaking extra fields", async () => {
    resolveRequest({
      content: {
        endTime: null,
        examId: 12,
        gradeName: "Grade 8",
        paperId: 99,
        startTime: "2026-06-24 10:01:53",
        status: "IN_PROGRESS",
        studentScore: 8,
        taskPublishId: 33,
        taskPublishTime: "2026-08-11T09:30:00+08:00",
        transportInternalField: "must not escape",
      },
      ifLogin: true,
      status: true,
    });

    await expect(getStudentExamEntry(12, 33)).resolves.toEqual({
      endTime: null,
      examId: 12,
      gradeName: "Grade 8",
      paperId: 99,
      startTime: Date.UTC(2026, 5, 24, 2, 1, 53),
      status: "IN_PROGRESS",
      studentScore: 8,
      taskPublishId: 33,
      taskPublishTime: "2026-08-11T09:30:00+08:00",
    });
  });

  it.each(["", null])(
    "preserves an empty task publish display value: %p",
    async (taskPublishTime) => {
      resolveRequest({
        content: {
          examId: 12,
          gradeName: "Grade 8",
          paperId: 99,
          status: "NOT_STARTED",
          taskPublishId: 33,
          taskPublishTime,
        },
        ifLogin: true,
        status: true,
      });

      await expect(getStudentExamEntry(12, 33)).resolves.toMatchObject({
        taskPublishTime,
      });
    },
  );

  it.each([
    ["startTime", { unexpected: true }],
    ["startTime", ""],
    ["endTime", false],
    ["studentScore", "8"],
  ])(
    "rejects an invalid optional student entry field: %s",
    async (field, invalidValue) => {
      resolveRequest({
        content: {
          examId: 12,
          gradeName: "Grade 8",
          paperId: 99,
          status: "IN_PROGRESS",
          taskPublishId: 33,
          taskPublishTime: "2026-08-11T09:30:00+08:00",
          [field]: invalidValue,
        },
        ifLogin: true,
        status: true,
      });

      await expect(getStudentExamEntry(12, 33)).rejects.toThrow();
    },
  );

  it("submits complete answers to preview and student endpoints", async () => {
    const answers = [
      {
        businessQuestionTypeId: 3,
        children: [],
        elementAnswers: [],
        id: 7,
        version: "1" as const,
      },
    ];
    resolveRequest({ content: {}, ifLogin: true, status: true });
    await submitExamPreview(9, answers);
    expect(requestMock).toHaveBeenLastCalledWith(
      "/api/v2/exam-previews/submission",
      {
        method: "POST",
        body: { answers, paperId: 9, type: 0 },
      },
      undefined,
      undefined,
    );
    await submitStudentExam(12, answers, true);
    expect(requestMock).toHaveBeenLastCalledWith(
      "/api/v2/exams/12/student-submission",
      {
        method: "POST",
        body: {
          answers,
          autoSubmit: true,
          type: 0,
        },
      },
      undefined,
      undefined,
    );
  });

  it("loads the teacher student result resource", async () => {
    resolveRequest({ content: {}, ifLogin: true, status: true });
    await getTeacherStudentExamResult(12, 8);
    expect(requestMock).toHaveBeenCalledWith(
      "/api/v2/exams/12/students/8/result",
      undefined,
      undefined,
      undefined,
    );
  });

  it("loads a filtered page of submitted students", async () => {
    resolveRequest({ content: {}, ifLogin: true, status: true });
    await getTeacherExamStudents(12, {
      groupId: 3,
      keyword: "Ada",
      limit: 20,
      pageNo: 2,
    });
    expect(requestMock).toHaveBeenCalledWith(
      "/api/v2/exams/12/students?groupId=3&keyword=Ada&limit=20&pageNo=2",
      undefined,
      undefined,
      undefined,
    );
  });

  it("loads a V2 student result with the required question type snapshot", async () => {
    resolveRequest({
      content: {
        examPaperDetailResponse: {
          contractVersion: "V2",
          moduleList: [],
        },
      },
      ifLogin: true,
      status: true,
    });
    jest.mocked(batchQueryBusinessQuestionTypesV2).mockResolvedValue({
      content: [],
      ifLogin: true,
      missingBusinessQuestionTypeIds: [],
      status: true,
    });

    const source = await loadStudentExamResultSource(12);

    expect(source.result.examPaperDetailResponse.contractVersion).toBe("V2");
  });

  it("configures authority and publishes only the selected student list", async () => {
    (requestMock as unknown as jest.Mock)
      .mockResolvedValueOnce({ content: {}, ifLogin: true, status: true })
      .mockResolvedValueOnce({ content: {}, ifLogin: true, status: true });
    await configureAndPublishExamV2({
      examId: 12,
      open: true,
      publicationBody: {
        resourceRequestList: [
          {
            deadTime: null,
            evaluationItemId: null,
            examPaperId: 7,
            expectTime: 0,
            groupId: null,
            ifTiming: 0,
            lessonId: null,
            publishTime: null,
            studentList: [
              { groupId: 20, id: 1 },
              { groupId: 20, id: 2 },
            ],
            taskId: 10,
          },
        ],
      },
    });
    expect(requestMock).toHaveBeenNthCalledWith(
      1,
      "/api/v2/exams/12/authority",
      { method: "PUT", body: { open: true } },
      undefined,
      undefined,
    );
    expect(requestMock).toHaveBeenLastCalledWith(
      "/api/v2/exams/12/publications",
      {
        method: "POST",
        body: {
          resourceRequestList: [
            {
              deadTime: null,
              evaluationItemId: null,
              examPaperId: 7,
              expectTime: 0,
              groupId: null,
              ifTiming: 0,
              lessonId: null,
              publishTime: null,
              studentList: [
                { groupId: 20, id: 1 },
                { groupId: 20, id: 2 },
              ],
              taskId: 10,
            },
          ],
        },
      },
      undefined,
      undefined,
    );
    expect(requestMock).toHaveBeenCalledTimes(2);
    expect(requestMock).not.toHaveBeenCalledWith(
      expect.stringContaining("filtered-students"),
      expect.anything(),
      expect.anything(),
      expect.anything(),
    );
  });
});
