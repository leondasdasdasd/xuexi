import {
  saveOcrTaskDraft,
  saveOcrTaskQuestions,
} from "../../../services/inputQuestion";
import {
  buildQuestionTaskSaveContext,
  buildVisibleQuestionState,
  normalizeTaskResult,
} from "../domain/questionTaskViewModel";
import {
  buildQuestionTaskSavePayload,
  saveQuestionTask,
} from "./questionTaskSave";
import { toQuestionTaskTransportQuestion } from "../domain/questionTaskTransportAdapter";
import {
  buildSubQuestionSelectionId,
  mergeSelectedQuestionsIntoCombination,
  splitSelectedCombinationQuestion,
} from "../domain/questionTaskStructure";

const ANSWER_PAGE_URL = "https://example.com/answer-1.png";
const ANSWER_MARKDOWN = "## 参考答案\n\n1. A";
const QUESTION_PAGE_URL = "https://example.com/page-1.png";
const QUESTION_WITHOUT_POSITION_CONTENT = "<p>无坐标题干</p>";
const FIRST_QUESTION_CONTENT = "<p>第一题</p>";
const SECOND_QUESTION_CONTENT = "<p>第二题</p>";

jest.mock("../../../services/inputQuestion", () => ({
  saveOcrTaskDraft: jest.fn(() => ({
    content: { saved: "draft" },
    status: true,
  })),
  saveOcrTaskQuestions: jest.fn(() => ({
    content: { saved: "questions" },
    status: true,
  })),
}));

describe("QuestionTask OCR save payload", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.globalLange = "zh-CN";
  });

  it("normalizes backend questionList pages and saves the unified OCR task shape", () => {
    const taskResult = normalizeTaskResult({
      answerPages: [
        {
          imageUrl: ANSWER_PAGE_URL,
          itemStatus: 3,
          pageIndex: 1,
        },
      ],
      answerSheetMarkdown: ANSWER_MARKDOWN,
      answerSheetStatus: 3,
      examPaperId: 10,
      gradeId: 7,
      pages: [
        {
          imageUrl: QUESTION_PAGE_URL,
          itemStatus: 3,
          pageIndex: 0,
          questionList: [
            {
              analysis: "<p>解析</p>",
              analysisTaskErrorMessage: "",
              analysisTaskStatus: "SUCCEEDED",
              answer: "A",
              chapterIds: [13],
              content: "<p>题干</p>",
              indicatorIds: [12],
              knowledgeIds: [11],
              knowledgeValues: ["11-函数"],
              mathNodeIds: [14],
              optionList: [
                {
                  answers: "选项 A",
                  key: "A",
                  knowledgeIds: [15],
                  knowledgeValues: ["15-函数性质"],
                },
              ],
              posList: [
                [
                  { x: 1, y: 2 },
                  { x: 3, y: 4 },
                ],
              ],
              questionId: 9001,
              questionLevel: 2,
              questionScore: 5,
              questionSort: 1,
              qualityCheckResult: {
                conclusion: "整体可用",
                riskItemsMarkdown: "未发现明显错误",
                riskLevel: "PASS",
              },
              qualityCheckTaskErrorMessage: "",
              qualityCheckTaskStatus: "SUCCEEDED",
              sectionNumber: 1,
              sectionTitle: "单项选择题",
              type: 1,
              uuid: "stable-uuid",
            },
          ],
        },
      ],
      status: 3,
      subjectId: 2,
      taskId: 100,
    });
    const visibleState = buildVisibleQuestionState(taskResult.pages);

    const payload = buildQuestionTaskSavePayload(
      buildQuestionTaskSaveContext(taskResult, visibleState.questions),
    );

    expect(payload).toMatchObject({
      answerSheetMarkdown: ANSWER_MARKDOWN,
      answerSheetStatus: 3,
      examPaperId: 10,
      gradeId: 7,
      status: 3,
      subjectId: 2,
      taskId: 100,
    });
    expect(payload.questionList).toBeUndefined();
    expect(payload.pages).toHaveLength(1);
    expect(payload.pages[0]).toMatchObject({
      imageUrl: QUESTION_PAGE_URL,
      itemStatus: 3,
      pageIndex: 0,
    });
    expect(payload.pages[0].questionList[0]).toMatchObject({
      analysis: "<p>解析</p>",
      analysisTaskErrorMessage: "",
      analysisTaskStatus: "SUCCEEDED",
      answer: "A",
      chapterIds: [13],
      content: "<p>题干</p>",
      indicatorIds: [12],
      knowledgeIds: [11],
      knowledgeValues: ["11-函数"],
      mathNodeIds: [14],
      questionId: 9001,
      questionScore: 5,
      questionSort: 1,
      qualityCheckResult: {
        conclusion: "整体可用",
        riskItemsMarkdown: "未发现明显错误",
        riskLevel: "PASS",
      },
      qualityCheckTaskErrorMessage: "",
      qualityCheckTaskStatus: "SUCCEEDED",
      sectionNumber: 1,
      sectionTitle: "单项选择题",
      type: 1,
      uuid: "stable-uuid",
    });
    expect(payload.pages[0].questionList[0].optionList).toEqual([
      {
        answers: "选项 A",
        key: "A",
        knowledgeIds: [15],
        knowledgeValues: ["15-函数性质"],
      },
    ]);
    expect(payload.pages[0].questionList[0].posList).toEqual([
      [
        { x: 1, y: 2 },
        { x: 3, y: 4 },
      ],
    ]);
    expect(payload.answerPages).toEqual([
      {
        errorMessage: "",
        imageUrl: ANSWER_PAGE_URL,
        itemStatus: 3,
        pageIndex: 1,
      },
    ]);
    expect(taskResult.answerPages[0]).toMatchObject({
      imageUrl: ANSWER_PAGE_URL,
      pageNumber: 1,
    });
    expect(taskResult.answerSheetMarkdown).toBe(ANSWER_MARKDOWN);
  });

  it("filters deleted questions and uses visible display order as questionSort", () => {
    const taskResult = {
      gradeId: 7,
      pages: [
        {
          pageIndex: 0,
          questions: [
            {
              content: SECOND_QUESTION_CONTENT,
              deleted: false,
              draftId: "second",
              questionScore: 3,
              sortOrder: 2,
              type: 5,
            },
            {
              content: "<p>已删除</p>",
              deleted: true,
              draftId: "deleted",
              questionScore: 1,
              sortOrder: 1,
              type: 5,
            },
          ],
        },
        {
          pageIndex: 1,
          questions: [
            {
              content: FIRST_QUESTION_CONTENT,
              deleted: false,
              draftId: "first",
              questionScore: 2,
              sortOrder: 0,
              type: 5,
            },
          ],
        },
      ],
      subjectId: 2,
      taskId: 100,
    };
    const visibleState = buildVisibleQuestionState(taskResult.pages);

    const payload = buildQuestionTaskSavePayload(
      buildQuestionTaskSaveContext(taskResult, visibleState.questions),
    );

    expect(payload.pages[0].questionList).toHaveLength(1);
    expect(payload.pages[0].questionList[0]).toMatchObject({
      content: SECOND_QUESTION_CONTENT,
      questionSort: 2,
    });
    expect(payload.pages[1].questionList[0]).toMatchObject({
      content: FIRST_QUESTION_CONTENT,
      questionSort: 1,
    });
  });

  it("keeps section only on top-level combination questions when saving", () => {
    const payload = toQuestionTaskTransportQuestion({
      sectionNumber: 3,
      sectionTitle: "解答题",
      sonQuestionList: [
        {
          answer: "A",
          sectionNumber: 9,
          sectionTitle: "不应透传",
          type: 1,
        },
      ],
      type: 6,
    });

    expect(payload).toMatchObject({
      sectionNumber: 3,
      sectionTitle: "解答题",
      type: 6,
    });
    expect(payload.sonQuestionList[0].sectionNumber).toBeUndefined();
    expect(payload.sonQuestionList[0].sectionTitle).toBeUndefined();
  });

  it("fills the default section title for top-level questions before saving", () => {
    const payload = toQuestionTaskTransportQuestion({
      answer: "A",
      sectionTitle: "   ",
      type: 1,
    });

    expect(payload.sectionTitle).toBe("未分组");
  });

  it("writes both answerRaw and legacy answers for blank questions", () => {
    const payload = toQuestionTaskTransportQuestion({
      gapFillingAnswer: {
        answerRaw: [
          [
            "<p>甲</p>",
            '<p><img src="https://example.com/formula.png?mathUrl=x%5E2" alt="x^2" /></p>',
          ],
        ],
        answers: ["旧字符串"],
        isOrder: true,
      },
      type: 3,
    });

    expect(payload.gapFillingAnswer).toEqual({
      answerRaw: [
        [
          "<p>甲</p>",
          '<p><img src="https://example.com/formula.png?mathUrl=x%5E2" alt="x^2" /></p>',
        ],
      ],
      answers: ["甲&&$$x^2$$"],
      isOrder: true,
    });
  });

  it("saves merged questions only through the new combination question", () => {
    const draftIds = [
      "page-1-child-merged-1",
      "page-2-child-merged-2",
      "page-1-merged-3",
    ];
    const uuidIds = ["merged-uuid-1", "merged-uuid-2", "merged-uuid-3"];
    const taskResult = {
      gradeId: 7,
      pages: [
        {
          pageIndex: 0,
          pageKey: "page-1",
          questions: [
            {
              answer: "A",
              content: FIRST_QUESTION_CONTENT,
              deleted: false,
              draftId: "first",
              questionScore: 2,
              sortOrder: 0,
              type: 1,
            },
          ],
        },
        {
          pageIndex: 1,
          pageKey: "page-2",
          questions: [
            {
              answer: "B",
              content: SECOND_QUESTION_CONTENT,
              deleted: false,
              draftId: "second",
              questionScore: 3,
              sortOrder: 1,
              type: 1,
            },
          ],
        },
      ],
      subjectId: 2,
      taskId: 100,
    };
    const visibleState = buildVisibleQuestionState(taskResult.pages);
    const mergeResult = mergeSelectedQuestionsIntoCombination({
      createDraftId: (pageKey) => `${pageKey}-${draftIds.shift()}`,
      createUuid: (event) => {
        void event;
        return uuidIds.shift();
      },
      getQuestionTypeLabel: (event) => {
        void event;
        return "组合题";
      },
      pages: taskResult.pages,
      selectedQuestionIds: ["first", "second"],
      visibleQuestions: visibleState.questions,
    });
    const nextTaskResult = {
      ...taskResult,
      pages: mergeResult.pages,
    };
    const nextVisibleState = buildVisibleQuestionState(nextTaskResult.pages);

    const payload = buildQuestionTaskSavePayload(
      buildQuestionTaskSaveContext(nextTaskResult, nextVisibleState.questions),
    );

    expect(payload.pages[0].questionList).toHaveLength(1);
    expect(payload.pages[0].questionList[0]).toMatchObject({
      answer: "",
      content: "",
      questionScore: 5,
      type: 6,
    });
    expect(payload.pages[0].questionList[0].sonQuestionList).toEqual([
      expect.objectContaining({
        answer: "A",
        content: FIRST_QUESTION_CONTENT,
        type: 1,
      }),
      expect.objectContaining({
        answer: "B",
        content: SECOND_QUESTION_CONTENT,
        type: 1,
      }),
    ]);
    expect(payload.pages[1].questionList).toEqual([]);
  });

  it("saves selected split subquestions as top-level questions with the parent stem", () => {
    const draftIds = ["page-1-split-1"];
    const uuidIds = ["split-uuid-1"];
    const taskResult = {
      gradeId: 7,
      pages: [
        {
          pageIndex: 0,
          pageKey: "page-1",
          questions: [
            {
              answer: "",
              content: "<p>公共题干不保存到拆出子题</p>",
              deleted: false,
              draftId: "combo",
              questionScore: 5,
              sonQuestionList: [
                {
                  answer: "A",
                  content: FIRST_QUESTION_CONTENT,
                  deleted: false,
                  draftId: "child-1",
                  questionScore: 2,
                  type: 1,
                },
                {
                  answer: "B",
                  content: SECOND_QUESTION_CONTENT,
                  deleted: false,
                  draftId: "child-2",
                  questionScore: 3,
                  type: 1,
                },
              ],
              sortOrder: 0,
              type: 6,
            },
          ],
        },
      ],
      subjectId: 2,
      taskId: 100,
    };
    const visibleState = buildVisibleQuestionState(taskResult.pages);
    const splitResult = splitSelectedCombinationQuestion({
      createDraftId: (pageKey) => `${pageKey}-${draftIds.shift()}`,
      createUuid: (event) => {
        void event;
        return uuidIds.shift();
      },
      getQuestionTypeLabel: (event) => {
        void event;
        return "单选题";
      },
      pages: taskResult.pages,
      selectedQuestionIds: [buildSubQuestionSelectionId("combo", 1)],
      visibleQuestions: visibleState.questions,
    });
    const nextTaskResult = {
      ...taskResult,
      pages: splitResult.pages,
    };
    const nextVisibleState = buildVisibleQuestionState(nextTaskResult.pages);

    const payload = buildQuestionTaskSavePayload(
      buildQuestionTaskSaveContext(nextTaskResult, nextVisibleState.questions),
    );

    expect(payload.pages[0].questionList).toHaveLength(2);
    expect(payload.pages[0].questionList[0]).toMatchObject({
      answer: "B",
      content: `<p>公共题干不保存到拆出子题</p><p><br/></p>${SECOND_QUESTION_CONTENT}`,
      type: 1,
    });
    expect(payload.pages[0].questionList[1]).toMatchObject({
      content: "<p>公共题干不保存到拆出子题</p>",
      questionScore: 2,
      type: 6,
    });
    expect(payload.pages[0].questionList[1].sonQuestionList).toEqual([
      expect.objectContaining({
        answer: "A",
        content: FIRST_QUESTION_CONTENT,
        type: 1,
      }),
    ]);
  });

  it("uses page order before page-local questionSort for the initial detail order", () => {
    const taskResult = normalizeTaskResult({
      gradeId: 7,
      pages: [
        {
          pageIndex: 0,
          questionList: [
            {
              content: "<p>第1题</p>",
              questionSort: 0,
              type: 1,
            },
            {
              content: "<p>第2题</p>",
              questionSort: 1,
              type: 1,
            },
          ],
        },
        {
          pageIndex: 1,
          questionList: [
            {
              content: "<p>第3题</p>",
              questionSort: 0,
              type: 3,
            },
            {
              content: "<p>第4题</p>",
              questionSort: 1,
              type: 5,
            },
          ],
        },
      ],
      subjectId: 2,
      taskId: 100,
    });

    const visibleState = buildVisibleQuestionState(taskResult.pages);

    expect(visibleState.questions.map((question) => question.content)).toEqual([
      "<p>第1题</p>",
      "<p>第2题</p>",
      "<p>第3题</p>",
      "<p>第4题</p>",
    ]);
    expect(
      visibleState.questions.map((question) => question.displayQuestionNumber),
    ).toEqual([1, 2, 3, 4]);
  });

  it("drops OCR placeholder polygon bounds that are too small for image coordinates", () => {
    const taskResult = normalizeTaskResult({
      pages: [
        {
          pageIndex: 0,
          questionList: [
            {
              content: "<p>第23题</p>",
              posList: [
                [
                  { x: 0, y: 0 },
                  { x: 2, y: 0 },
                  { x: 2, y: 1 },
                  { x: 0, y: 1 },
                ],
              ],
              questionSort: 0,
              type: 5,
            },
          ],
        },
      ],
    });

    const visibleState = buildVisibleQuestionState(taskResult.pages);

    expect(visibleState.questions[0].polygonBounds).toBeUndefined();
    expect(visibleState.questions[0].polygon).toBeUndefined();
  });

  it("keeps current recognize results selectable without question coordinates", () => {
    const taskResult = normalizeTaskResult({
      gradeId: 7,
      pages: [
        {
          imageUrl: QUESTION_PAGE_URL,
          pageIndex: 0,
          questionList: [
            {
              content: QUESTION_WITHOUT_POSITION_CONTENT,
              questionSort: 0,
              type: 5,
            },
          ],
        },
      ],
      subjectId: 2,
      taskId: 100,
    });
    const visibleState = buildVisibleQuestionState(taskResult.pages);

    expect(visibleState.pages[0]).toMatchObject({
      pageKey: "page-1",
      pageNumber: 1,
    });
    expect(visibleState.pages[0].questions[0]).toMatchObject({
      content: QUESTION_WITHOUT_POSITION_CONTENT,
      draftId: "page-1-0-0",
    });
    expect(visibleState.questions[0]).toMatchObject({
      content: QUESTION_WITHOUT_POSITION_CONTENT,
      pageKey: "page-1",
      pageNumber: 1,
    });
    expect(visibleState.questions[0].polygonBounds).toBeUndefined();
    expect(visibleState.questions[0].polygon).toBeUndefined();

    const payload = buildQuestionTaskSavePayload(
      buildQuestionTaskSaveContext(taskResult, visibleState.questions),
    );

    expect(payload.pages[0].questionList[0]).toMatchObject({
      content: QUESTION_WITHOUT_POSITION_CONTENT,
      questionSort: 1,
      type: 5,
    });
    expect(payload.pages[0].questionList[0].posList).toEqual([]);
  });

  it("keeps legacy pages.questions save contexts compatible with the unified payload", () => {
    const payload = buildQuestionTaskSavePayload({
      gradeId: 7,
      pages: [
        {
          pageIndex: 0,
          questions: [
            {
              content: "<p>旧上下文题目</p>",
              questionScore: 2,
              type: 5,
            },
          ],
        },
      ],
      subjectId: 2,
      taskId: 100,
    });

    expect(payload.pages[0].questionList[0]).toMatchObject({
      content: "<p>旧上下文题目</p>",
      questionScore: 2,
      type: 5,
    });
  });

  it("saves the latest edited questionScore as backend numeric QuestionData", () => {
    const taskResult = normalizeTaskResult({
      gradeId: 7,
      pages: [
        {
          pageIndex: 0,
          questionList: [
            {
              content: "<p>题干</p>",
              questionScore: 2,
              questionSort: 1,
              type: 5,
            },
          ],
        },
      ],
      subjectId: 2,
      taskId: 100,
    });
    const visibleState = buildVisibleQuestionState([
      {
        ...taskResult.pages[0],
        questions: [
          {
            ...taskResult.pages[0].questions[0],
            questionScore: "6.5",
          },
        ],
      },
    ]);

    const payload = buildQuestionTaskSavePayload(
      buildQuestionTaskSaveContext(
        {
          ...taskResult,
          pages: visibleState.pages,
        },
        visibleState.questions,
      ),
    );

    expect(payload.pages[0].questionList[0]).toMatchObject({
      questionScore: 6.5,
      questionSort: 1,
    });
  });

  it("routes save and submit actions to separate OCR task endpoints", async () => {
    const payload = {
      gradeId: 7,
      pages: [
        {
          questionList: [{ content: "<p>题干</p>", type: 5 }],
        },
      ],
      subjectId: 2,
      taskId: 100,
    };

    await saveQuestionTask(payload, "save");
    await saveQuestionTask(payload, "submit");

    expect(saveOcrTaskDraft).toHaveBeenCalledWith(payload);
    expect(saveOcrTaskQuestions).toHaveBeenCalledWith(payload);
  });
});
