/** @jest-environment node */

import type {
  QuestionContentDraft,
  QuestionPlayerResponse,
} from "@yungu-fed/question-editor";

import {
  mapExamPaperViewToStudentExamAnswerDraft,
  mergeStudentExamAnswerDraftIntoExamPaperView,
  parseStudentExamAnswerDraftStorageValue,
} from "../studentExamAnswerDraft";
import type { ExamPaperView, ExamPlacementView } from "../types";

const content = {
  children: [],
  elements: [{ options: [], type: "choice" }],
  extras: [],
  id: 1,
  questionTypeKey: 1,
  version: "1",
} as unknown as QuestionContentDraft;

const response = (selectedOptionIds: string[]): QuestionPlayerResponse => ({
  children: [],
  id: 1,
  elementAnswers: [
    { answers: { optionIds: selectedOptionIds }, type: "choice" },
  ],
  questionTypeKey: 1,
  version: "1",
});

const placement = (
  selectedOptionIds: string[],
  overrides: Partial<ExamPlacementView> = {},
): ExamPlacementView => ({
  children: [],
  content,
  order: 1,
  placementId: "P1",
  questionId: 7,
  response: response(selectedOptionIds),
  responseVersion: 0,
  score: "10",
  ...overrides,
});

const paper = (examPlacement: ExamPlacementView): ExamPaperView => ({
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
      placements: [examPlacement],
    },
  ],
  questionTypeTemplates: [],
  title: "Server paper",
  totalScore: "10",
});

describe("student exam answer draft boundary", () => {
  it("restores only answers while preserving the authoritative server paper", () => {
    const stalePaper = paper(
      placement(["O1"], {
        order: 99,
        questionId: 999,
        score: "999",
      }),
    );
    const storedValue = JSON.stringify({
      ...mapExamPaperViewToStudentExamAnswerDraft(stalePaper),
      gradeName: "Stale grade",
      title: "Stale title",
    });
    const draft = parseStudentExamAnswerDraftStorageValue(storedValue);
    expect(draft).not.toBeNull();

    const restored = mergeStudentExamAnswerDraftIntoExamPaperView(
      paper(placement([])),
      draft!,
    );

    expect(restored).toMatchObject({
      gradeName: "Grade 8",
      title: "Server paper",
      modules: [
        {
          placements: [
            {
              order: 1,
              questionId: 7,
              score: "10",
              response: {
                elementAnswers: [{ answers: { optionIds: ["O1"] } }],
              },
            },
          ],
        },
      ],
    });
  });

  it("rejects the former whole-paper draft shape", () => {
    expect(
      parseStudentExamAnswerDraftStorageValue(
        JSON.stringify({ placements: [placement(["O1"])] }),
      ),
    ).toBeNull();
  });

  it("rejects drafts that use the former fill response contract", () => {
    const storedValue = JSON.stringify({
      answers: [
        {
          placementId: "P1",
          response: {
            children: [],
            elementAnswers: [
              {
                answers: [
                  {
                    answerPools: [{ html: "42", json: [], text: "42" }],
                    blankIds: ["B1"],
                  },
                ],
                type: "fill",
              },
            ],
            id: 7,
            questionTypeKey: 1,
            version: "1",
          },
        },
      ],
      version: 1,
    });

    expect(parseStudentExamAnswerDraftStorageValue(storedValue)).toBeNull();
  });
});
