/** @jest-environment node */

import {
  buildQuestionNumber,
  buildQuestionPositionKey,
  flattenQuestionDescendants,
  getQuestionAtPath,
  hasQuestionChildren,
  removeQuestionAtPath,
  setQuestionTreeLeafScores,
  synchronizeQuestionTreeScores,
  updateQuestionFieldAtPath,
} from "./questionPosition.js";

describe("question position", () => {
  it("builds unique keys for question slots without question ids", () => {
    expect([
      buildQuestionPositionKey(0, 0),
      buildQuestionPositionKey(0, 1),
      buildQuestionPositionKey(1, 0),
    ]).toEqual(["0-0", "0-1", "1-0"]);
  });

  it("locates and numbers arbitrarily deep placements by path", () => {
    const questions = [
      {
        questionId: 1,
        sonQuestionList: [
          {
            questionId: 2,
            sonQuestionList: [{ questionId: 3 }],
          },
        ],
      },
    ];

    expect(getQuestionAtPath(questions, [0, 0, 0]).questionId).toBe(3);
    expect(buildQuestionNumber(3, [0, 0])).toBe("3.1.1");
    expect(flattenQuestionDescendants(questions[0].sonQuestionList)).toEqual([
      { question: questions[0].sonQuestionList[0], questionPath: [0] },
      {
        question: questions[0].sonQuestionList[0].sonQuestionList[0],
        questionPath: [0, 0],
      },
    ]);
  });

  it("removes only the placement at the requested deep path", () => {
    const questions = [
      {
        questionId: 1,
        sonQuestionList: [
          {
            questionId: 2,
            sonQuestionList: [{ questionId: 3 }, { questionId: 4 }],
          },
        ],
      },
    ];

    const nextQuestions = removeQuestionAtPath(questions, [0, 0, 0]);

    expect(getQuestionAtPath(nextQuestions, [0, 0, 0]).questionId).toBe(4);
    expect(getQuestionAtPath(questions, [0, 0, 0]).questionId).toBe(3);
  });

  it("updates a deep score and synchronizes its placement ancestors", () => {
    const questions = [
      {
        questionScore: 1,
        sonQuestionList: [
          { questionScore: 1, sonQuestionList: [{ questionScore: 1 }] },
        ],
      },
    ];

    const nextQuestions = updateQuestionFieldAtPath(
      questions,
      [0, 0, 0],
      "questionScore",
      3,
    );

    expect(getQuestionAtPath(nextQuestions, [0, 0, 0]).questionScore).toBe(3);
    expect(getQuestionAtPath(nextQuestions, [0, 0]).questionScore).toBe(3);
    expect(nextQuestions[0].questionScore).toBe(3);
  });

  it("treats only questions with non-empty child lists as score groups", () => {
    expect(
      hasQuestionChildren({ sonQuestionList: [{ questionScore: 1 }] }),
    ).toBe(true);
    expect(hasQuestionChildren({ sonQuestionList: [] })).toBe(false);
    expect(hasQuestionChildren({})).toBe(false);
  });

  it("keeps group scores derived from nested leaf scores", () => {
    const question = synchronizeQuestionTreeScores({
      questionScore: 99,
      sonQuestionList: [
        { questionScore: 2 },
        {
          questionScore: 99,
          sonQuestionList: [{ questionScore: 3 }, { questionScore: 4 }],
        },
      ],
    });

    expect(question.questionScore).toBe(9);
    expect(question.sonQuestionList[1].questionScore).toBe(7);
    expect(question.sonQuestionScores).toEqual([
      { index: 0, score: 2 },
      { index: 1, score: 7 },
    ]);
  });

  it.each([null, []])(
    "keeps a leaf score when stale child score metadata is %p",
    (sonQuestionScores) => {
      const question = synchronizeQuestionTreeScores({
        questionScore: 3.5,
        sonQuestionList: null,
        sonQuestionScores,
      });

      expect(question.questionScore).toBe(3.5);
      expect(question).not.toHaveProperty("sonQuestionScores");
    },
  );

  it("sets every leaf score and recalculates nested groups", () => {
    const question = setQuestionTreeLeafScores(
      {
        questionScore: 99,
        sonQuestionList: [
          { questionScore: 1 },
          { sonQuestionList: [{ questionScore: 2 }, { questionScore: 3 }] },
        ],
      },
      5,
    );

    expect(question.questionScore).toBe(15);
    expect(question.sonQuestionList[0].questionScore).toBe(5);
    expect(question.sonQuestionList[1].questionScore).toBe(10);
  });

  it("rejects direct score updates on group questions", () => {
    const questions = [
      {
        questionScore: 2,
        sonQuestionList: [{ questionScore: 2 }],
      },
    ];

    expect(updateQuestionFieldAtPath(questions, [0], "questionScore", 9)).toBe(
      questions,
    );
  });

  it("clears derived group score metadata after deleting the last child", () => {
    const questions = [
      {
        questionScore: 4,
        sonQuestionList: [{ questionScore: 4 }],
        sonQuestionScores: [{ index: 0, score: 4 }],
      },
    ];

    const nextQuestions = removeQuestionAtPath(questions, [0, 0]);

    expect(nextQuestions[0].sonQuestionList).toBeNull();
    expect(nextQuestions[0].questionScore).toBeNull();
    expect(nextQuestions[0]).not.toHaveProperty("sonQuestionScores");
  });
});
