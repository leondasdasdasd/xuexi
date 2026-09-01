/** @jest-environment node */

import type {
  ExamPaperDetailResponse,
  ExamPaperQuestionResponse,
} from "../../../services/examPaperV2.types";
import {
  applyExamPreviewResultToPaper,
  mapExamPaperV2ToTeacherTrialView,
  mapStudentExamResultToView,
  mapStudentPaperV2ToExamPaperView,
  mapTeacherStudentExamResultToPaperView,
} from "../mappers";

jest.mock("@yungu-fed/question-editor", () => ({
  createEmptyQuestionPlayerResponse: (content: {
    children: object[];
    id: number;
    questionTypeKey: number;
    version: "1";
  }) => ({
    children: content.children.map(() => ({
      children: [],
      elementAnswers: [],
    })),
    elementAnswers: [],
    id: content.id,
    questionTypeKey: content.questionTypeKey,
    version: content.version,
  }),
  createQuestionPreviewDraft: (content: object) => content,
  normalizeRichTextContent: (value: unknown) => value,
}));
jest.mock("../../../utils/i18n", () => ({
  trans: (_key: string, fallback: string) => fallback,
}));

const question = (
  questionId: number | null,
  questionScore: number | null,
  children: ExamPaperQuestionResponse[] = [],
): ExamPaperQuestionResponse => ({
  businessQuestionTypeId: 101,
  chapterIds: [],
  children,
  indicatorIds: [],
  knowledgeIds: [],
  questionData:
    questionId === null
      ? null
      : {
          businessQuestionTypeId: 101,
          children: [],
          elements: [],
          extras: [],
          id: questionId,
          version: "1",
        },
  questionId,
  questionScore,
});

const detail = (
  questions: ExamPaperQuestionResponse[],
): ExamPaperDetailResponse => ({
  capabilities: { copy: false, delete: false, update: false },
  content: {
    moduleList: [
      {
        moduleName: "Section",
        moduleQuestionNumber: questions.length,
        moduleScore: 10,
        questionList: questions,
      },
    ],
  },
  gradeId: 1,
  gradeName: "Grade 9",
  id: 42,
  paperTypeCode: 1,
  subjectId: 2,
  title: "Teacher trial",
  totalScore: 10,
});

const questionTypes = [
  {
    businessQuestionTypeId: 101,
    elements: [],
    extras: [],
    globalConfig: { hasAnswer: true },
    isComposite: false,
    name: "Choice",
  },
];

describe("teacher V2 paper mapper", () => {
  it("flattens modules and creates stable in-memory placements", () => {
    const paper = mapExamPaperV2ToTeacherTrialView(
      detail([question(10, 4), question(11, 6, [question(12, 2)])]),
      questionTypes,
      1_786_377_600_000,
    );

    expect(paper).toMatchObject({
      deadlineTimestamp: null,
      dateMetadata: {
        displayText: "2026-08-11",
        kind: "teacher-trial-current-time",
      },
      gradeName: "Grade 9",
      title: "Teacher trial",
      totalScore: "10",
    });
    expect(paper.modules).toHaveLength(1);
    expect(paper.modules[0]).toMatchObject({
      moduleName: "Section",
      moduleQuestionNumber: 2,
      moduleScore: "10",
    });
    expect(paper.modules[0].placements).toHaveLength(2);
    expect(paper.modules[0].placements[0]).toMatchObject({
      order: 1,
      placementId: "exam-question-0-0-10",
      questionId: 10,
      responseVersion: 0,
      score: "4",
    });
    expect(paper.modules[0].placements[1].children[0]).toMatchObject({
      order: 1,
      placementId: "exam-question-0-1-0-12",
      questionId: 12,
      score: "2",
    });
  });

  it("rejects empty and associated placements without V2 content", () => {
    expect(() =>
      mapExamPaperV2ToTeacherTrialView(
        detail([question(null, 1)]),
        questionTypes,
        1_786_377_600_000,
      ),
    ).toThrow("试卷题位数据不完整");

    expect(() =>
      mapExamPaperV2ToTeacherTrialView(
        detail([{ ...question(10, 1), questionData: null }]),
        questionTypes,
        1_786_377_600_000,
      ),
    ).toThrow("试卷题位数据不完整");
  });

  it("hydrates a stored V2 answer envelope for result rendering", () => {
    const answeredQuestion = {
      ...question(10, 4),
      answerJson:
        '{"id":10,"businessQuestionTypeId":101,"version":"1","elementAnswers":[{"type":"choice","answers":{"optionIds":["A"]}}],"children":[]}',
    };

    const paper = mapExamPaperV2ToTeacherTrialView(
      detail([answeredQuestion]),
      questionTypes,
      1_786_377_600_000,
    );

    expect(paper.modules[0].placements[0].response.elementAnswers).toEqual([
      { answers: { optionIds: ["A"] }, type: "choice" },
    ]);
  });

  it("rejects a stored V2 answer whose question identity does not match", () => {
    expect(() =>
      mapExamPaperV2ToTeacherTrialView(
        detail([
          {
            ...question(10, 4),
            answerJson:
              '{"id":11,"businessQuestionTypeId":101,"version":"1","elementAnswers":[],"children":[]}',
          },
        ]),
        questionTypes,
        1_786_377_600_000,
      ),
    ).toThrow("V2 答题结果数据不完整");
  });

  it.each([
    ["null JSON", "null"],
    ["primitive JSON", "1"],
    [
      "invalid children",
      '{"id":10,"businessQuestionTypeId":101,"version":"1","elementAnswers":[],"children":{}}',
    ],
    [
      "invalid element answer",
      '{"id":10,"businessQuestionTypeId":101,"version":"1","elementAnswers":[{"answers":[]}],"children":[]}',
    ],
  ])("rejects %s with the result boundary error", (_case, answerJson) => {
    expect(() =>
      mapExamPaperV2ToTeacherTrialView(
        detail([{ ...question(10, 4), answerJson }]),
        questionTypes,
        1_786_377_600_000,
      ),
    ).toThrow("V2 答题结果数据不完整");
  });

  it("applies the preview grading result to the in-memory paper by question id", () => {
    const paper = mapExamPaperV2ToTeacherTrialView(
      detail([question(10, 1)]),
      questionTypes,
      1_786_377_600_000,
    );
    const gradedQuestion = {
      ...question(10, 1),
      answerJson:
        '{"id":10,"businessQuestionTypeId":101,"version":"1","elementAnswers":[],"children":[]}',
      isCorrect: 1,
      studentScore: 1,
    };

    const gradedPaper = applyExamPreviewResultToPaper(paper, {
      gradeName: "Grade 8",
      moduleList: detail([gradedQuestion]).content.moduleList,
      totalScore: 1,
    });

    expect(gradedPaper.modules[0].placements[0]).toMatchObject({
      isCorrect: 1,
      questionId: 10,
      studentScore: 1,
    });
  });

  it("keeps the total score unavailable while a question is pending", () => {
    expect(
      mapStudentExamResultToView({
        correctQuestionNum: 1,
        errorQuestionNum: 0,
        examPaperDetailResponse: { gradeName: "Grade 8", moduleList: [] },
        examScore: 2,
        pendingQuestionNum: 1,
        studentScore: 1,
      }),
    ).toMatchObject({ pendingCount: 1, totalScore: null });
  });

  it("keeps missing preview results and omitted total scores unavailable", () => {
    const paper = mapExamPaperV2ToTeacherTrialView(
      detail([question(10, 1), question(11, 1)]),
      questionTypes,
      1_786_377_600_000,
    );
    const gradedPaper = applyExamPreviewResultToPaper(paper, {
      gradeName: "Grade 8",
      moduleList: detail([
        { ...question(10, 1), isCorrect: 1, studentScore: 1 },
      ]).content.moduleList,
      totalScore: 2,
    });

    expect(gradedPaper.modules[0].placements[1]).toMatchObject({
      isCorrect: undefined,
      studentScore: undefined,
    });
    expect(
      mapStudentExamResultToView({
        correctQuestionNum: 1,
        errorQuestionNum: 0,
        examPaperDetailResponse: { gradeName: "Grade 8", moduleList: [] },
        examScore: 2,
        pendingQuestionNum: 0,
      }),
    ).toMatchObject({ totalScore: null });
  });

  it("preserves modules and numbers questions continuously across them", () => {
    const firstModule = detail([question(10, 4)]).content.moduleList[0];
    const secondModule = {
      ...detail([question(11, 6)]).content.moduleList[0],
      moduleName: "Written response",
      moduleScore: 6,
    };
    const paper = mapExamPaperV2ToTeacherTrialView(
      {
        ...detail([]),
        content: { moduleList: [firstModule, secondModule] },
      },
      questionTypes,
      1_786_377_600_000,
    );

    expect(paper.modules).toMatchObject([
      {
        moduleName: "Section",
        moduleQuestionNumber: 1,
        moduleScore: "10",
        placements: [{ order: 1, questionId: 10 }],
      },
      {
        moduleName: "Written response",
        moduleQuestionNumber: 1,
        moduleScore: "6",
        placements: [{ order: 2, questionId: 11 }],
      },
    ]);
  });
});

describe("student V2 paper mapper", () => {
  it("maps the student paper without constructing a teacher detail DTO", () => {
    const paper = mapStudentPaperV2ToExamPaperView(
      {
        answerEndTime: "2026-06-24 11:01:53",
        examPaperName: "Student paper",
        gradeName: "Grade 8",
        moduleList: detail([question(10, 4)]).content.moduleList,
        totalScore: 4,
      },
      questionTypes,
      {
        examId: 12,
        gradeName: "Grade 8",
        paperId: 42,
        status: "NOT_STARTED",
        taskPublishId: 33,
        taskPublishTime: "2026-06-24 10:01:53",
      },
    );

    expect(paper).toMatchObject({
      title: "Student paper",
      totalScore: "4",
      gradeName: "Grade 8",
      dateMetadata: {
        displayText: "2026-06-24 10:01:53",
        kind: "student-task-publish-time",
      },
      deadlineTimestamp: Date.UTC(2026, 5, 24, 3, 1, 53),
    });
    expect(paper.modules[0].placements[0]).toMatchObject({
      placementId: "exam-question-0-0-10",
      questionId: 10,
    });
  });

  it.each(["", null])(
    "maps an empty task publish value to empty display text: %p",
    (taskPublishTime) => {
      const paper = mapStudentPaperV2ToExamPaperView(
        {
          gradeName: "Grade 8",
          moduleList: [],
        },
        questionTypes,
        {
          examId: 12,
          gradeName: "Grade 8",
          paperId: 42,
          status: "NOT_STARTED",
          taskPublishId: 33,
          taskPublishTime,
        },
      );

      expect(paper.dateMetadata).toEqual({
        displayText: "",
        kind: "student-task-publish-time",
      });
    },
  );

  it("rejects a non-empty invalid answer deadline", () => {
    expect(() =>
      mapStudentPaperV2ToExamPaperView(
        {
          answerEndTime: "2026-02-29 10:01:53",
          gradeName: "Grade 8",
          moduleList: [],
        },
        questionTypes,
        {
          examId: 12,
          gradeName: "Grade 8",
          paperId: 42,
          status: "NOT_STARTED",
          taskPublishId: 33,
          taskPublishTime: "2026-06-24 10:01:53",
        },
      ),
    ).toThrow("考试截止时间格式不正确");
  });
});

describe("teacher student result mapper", () => {
  it("uses submission metadata and the canonical paper full score", () => {
    const paper = mapTeacherStudentExamResultToPaperView(
      {
        examPaperDetailResponse: {
          contractVersion: "V2",
          gradeName: "Grade 8",
          moduleList: detail([]).content.moduleList,
          title: "Student result",
          totalScore: 10,
        },
        examScore: 10,
        studentId: 7,
        studentScore: 8,
        submittedAt: "2026-06-24 10:01:53",
      },
      questionTypes,
    );

    expect(paper).toMatchObject({
      dateMetadata: {
        displayText: "2026-06-24 10:01:53",
        kind: "teacher-student-submission-time",
      },
      gradeName: "Grade 8",
      title: "Student result",
      totalScore: "10",
    });
  });

  it("maps an empty submission time to empty display text", () => {
    const paper = mapTeacherStudentExamResultToPaperView(
      {
        examPaperDetailResponse: {
          gradeName: "Grade 8",
          moduleList: [],
        },
        studentId: 7,
        submittedAt: null,
      },
      questionTypes,
    );

    expect(paper.dateMetadata.displayText).toBe("");
  });
});
