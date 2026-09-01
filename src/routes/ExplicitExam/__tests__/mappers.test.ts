/** @jest-environment node */

import type {
  QuestionContentDraft,
  QuestionPlayerResponse,
} from "@yungu-fed/question-editor";

import {
  mapPaperToSubmissionAnswers,
  mapStudentExamResultToStudentFilterView,
  mapTeacherExamStudentDirectoryToView,
} from "../mappers";
import type { ExamPlacementView } from "../types";

const rich = (text: string) => ({ html: text, json: [], text });

const content = {
  children: [],
  elements: [
    { content: rich("Stem"), id: "legacy-element-id", type: "richText" },
    { options: [], type: "choice" },
    { answers: [], blanks: ["B1"], type: "fill" },
    {
      answers: [],
      blanks: ["B2"],
      candidateOptions: [{ content: rich("Paris"), optionId: "O2" }],
      content: rich("City"),
      type: "inlineFill",
    },
    {
      answers: {},
      blanks: ["B3"],
      candidateOptions: [],
      content: rich("Word"),
      type: "wordBuilder",
    },
    { answers: [], type: "judgement" },
    { answers: {}, cards: [], categories: [], type: "classification" },
    { answers: {}, columns: [], type: "lineConnect" },
    { answers: {}, columns: [], type: "matching" },
    { answers: [], sortOptions: [], type: "ordering" },
    { answers: [], content: rich("Mark"), markers: [], type: "textMarker" },
    { type: "textResponse" },
  ],
  extras: [],
  id: 1,
  questionTypeKey: 1,
  version: "1",
} as unknown as QuestionContentDraft;

const playerResponse: QuestionPlayerResponse = {
  children: [],
  id: 1,
  elementAnswers: [
    { answers: { optionIds: ["O1"] }, type: "choice" },
    {
      answers: [{ blankId: "B1", content: rich("42") }],
      type: "fill",
    },
    {
      answers: [{ answerPools: [rich("Paris")], blankIds: ["B2"] }],
      type: "inlineFill",
    },
    { answers: { B3: "cat" }, type: "wordBuilder" },
    { answers: [true], type: "judgement" },
    { answers: { I1: "C1" }, type: "classification" },
    { answers: { I1: ["I2"] }, type: "lineConnect" },
    { answers: { I3: ["I4"] }, type: "matching" },
    { answers: ["O2", "O1"], type: "ordering" },
    { answers: ["M1"], type: "textMarker" },
    { answers: rich("Essay"), type: "textResponse" },
  ],
  questionTypeKey: 1,
  version: "1",
};

describe("V2 exam response mapper", () => {
  it("maps directory DTOs with normalized English locales and fallbacks", () => {
    expect(
      mapTeacherExamStudentDirectoryToView(
        {
          groups: [
            {
              groupEnName: "Class 3",
              groupId: 3,
              groupName: "三班",
            },
          ],
          limit: 20,
          pageNo: 1,
          students: [
            {
              groupId: 3,
              studentId: 8,
              studentName: "艾达",
            },
          ],
          total: 1,
        },
        "en",
      ),
    ).toEqual({
      groups: [{ id: 3, name: "Class 3" }],
      students: [{ id: 8, name: "艾达" }],
      total: 1,
    });
  });

  it("maps the selected result to the same localized student view", () => {
    expect(
      mapStudentExamResultToStudentFilterView(
        {
          answerTime: 0,
          correctQuestionNum: 0,
          errorQuestionNum: 0,
          examPaperDetailResponse: {} as never,
          examScore: 0,
          halfQuestionNum: 0,
          noAnswerQuestionNum: 0,
          openAnswer: true,
          openScore: true,
          pendingQuestionNum: 0,
          studentEnName: "Ada",
          studentId: 8,
          studentName: "艾达",
          studentScore: 0,
          submittedAt: 1,
          totalQuestionNum: 0,
        },
        "en",
      ),
    ).toEqual({ id: 8, name: "Ada" });
  });

  it("serializes the complete placement through the implemented submission boundary", () => {
    const placement: ExamPlacementView = {
      children: [],
      content,
      order: 1,
      placementId: "P1",
      questionId: 7,
      response: { ...playerResponse, id: 7 },
      responseVersion: 0,
      score: "10",
    };
    const answers = mapPaperToSubmissionAnswers({
      dateMetadata: {
        displayText: "2026-08-11",
        kind: "student-task-publish-time",
      },
      deadlineTimestamp: null,
      gradeName: "Grade 8",
      modules: [
        {
          moduleName: "Choice",
          moduleQuestionNumber: 1,
          moduleScore: "10",
          order: 1,
          placements: [placement],
        },
      ],
      questionTypeTemplates: [],
      title: "Paper",
      totalScore: "10",
    });
    expect(answers).toEqual([
      {
        businessQuestionTypeId: 1,
        children: [],
        elementAnswers: playerResponse.elementAnswers,
        id: 7,
        version: "1",
      },
    ]);
    expect(answers[0]).not.toHaveProperty("answerJson");
    expect(answers[0]).not.toHaveProperty("questionBankId");
  });

  it("submits composite questions by their top-level question id", () => {
    const child: ExamPlacementView = {
      children: [],
      content,
      order: 1,
      placementId: "child",
      questionId: 8,
      response: { ...playerResponse, id: 8 },
      responseVersion: 0,
      score: "5",
    };
    const parent: ExamPlacementView = {
      ...child,
      children: [child],
      placementId: "parent",
      questionId: 7,
      response: {
        ...playerResponse,
        children: [{ ...playerResponse, id: 8 }],
        id: 7,
      },
      score: "10",
    };
    const answers = mapPaperToSubmissionAnswers({
      dateMetadata: {
        displayText: "2026-08-11",
        kind: "student-task-publish-time",
      },
      deadlineTimestamp: null,
      gradeName: "Grade 8",
      modules: [
        {
          moduleName: "Composite",
          moduleQuestionNumber: 1,
          moduleScore: "10",
          order: 1,
          placements: [parent],
        },
      ],
      questionTypeTemplates: [],
      title: "Composite paper",
      totalScore: "10",
    });

    expect(answers).toHaveLength(1);
    expect(answers[0]).toMatchObject({ id: 7, version: "1" });
    expect(answers[0].children).toEqual([
      expect.objectContaining({
        children: [],
        elementAnswers: playerResponse.elementAnswers,
        id: 8,
        version: "1",
      }),
    ]);
  });

  it("keeps an unanswered question in the complete submission tree", () => {
    const unansweredResponse: QuestionPlayerResponse = {
      children: [],
      elementAnswers: [],
      id: 7,
      questionTypeKey: 1,
      version: "1",
    };

    expect(
      mapPaperToSubmissionAnswers({
        dateMetadata: {
          displayText: "2026-08-11",
          kind: "student-task-publish-time",
        },
        deadlineTimestamp: null,
        gradeName: "Grade 8",
        modules: [
          {
            moduleName: "Material",
            moduleQuestionNumber: 1,
            moduleScore: "0",
            order: 1,
            placements: [
              {
                children: [],
                content: { ...content, elements: [] },
                order: 1,
                placementId: "P1",
                questionId: 7,
                response: unansweredResponse,
                responseVersion: 0,
                score: "0",
              },
            ],
          },
        ],
        questionTypeTemplates: [],
        title: "Paper",
        totalScore: "0",
      }),
    ).toEqual([
      {
        businessQuestionTypeId: 1,
        children: [],
        elementAnswers: [],
        id: 7,
        version: "1",
      },
    ]);
  });

  it("rejects a response whose identity does not match its frozen placement", () => {
    const placement: ExamPlacementView = {
      children: [],
      content,
      order: 1,
      placementId: "P1",
      questionId: 7,
      response: playerResponse,
      responseVersion: 0,
      score: "10",
    };

    expect(() =>
      mapPaperToSubmissionAnswers({
        dateMetadata: {
          displayText: "2026-08-11",
          kind: "student-task-publish-time",
        },
        deadlineTimestamp: null,
        gradeName: "Grade 8",
        modules: [
          {
            moduleName: "Choice",
            moduleQuestionNumber: 1,
            moduleScore: "10",
            order: 1,
            placements: [placement],
          },
        ],
        questionTypeTemplates: [],
        title: "Paper",
        totalScore: "10",
      }),
    ).toThrow("The response data is incomplete");
  });

  it("rejects an invalid business question type before submission", () => {
    const placement: ExamPlacementView = {
      children: [],
      content,
      order: 1,
      placementId: "P1",
      questionId: 7,
      response: { ...playerResponse, id: 7, questionTypeKey: Number.NaN },
      responseVersion: 0,
      score: "10",
    };

    expect(() =>
      mapPaperToSubmissionAnswers({
        dateMetadata: {
          displayText: "2026-08-11",
          kind: "student-task-publish-time",
        },
        deadlineTimestamp: null,
        gradeName: "Grade 8",
        modules: [
          {
            moduleName: "Choice",
            moduleQuestionNumber: 1,
            moduleScore: "10",
            order: 1,
            placements: [placement],
          },
        ],
        questionTypeTemplates: [],
        title: "Paper",
        totalScore: "10",
      }),
    ).toThrow("The response data is incomplete");
  });
});
