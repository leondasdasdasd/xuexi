import {
  QUESTION_REVIEW_ISSUE_CODE,
  QUESTION_REVIEW_STATUS,
  buildIssueDetails,
  createQuestionReviewIssue,
  getQuestionReviewStatus,
  getSubmitBlockingFieldLabels,
  summarizeIssueMessages,
} from "./questionTaskReviewModel";

const MISSING_SCORE_ISSUE = "第 1 题未设置分数";
const createIssue = (code, questionNumber, isSubQuestion = false) =>
  createQuestionReviewIssue({
    code,
    isSubQuestion,
    questionNumber,
  });

describe("QuestionTask review model", () => {
  beforeEach(() => {
    window.globalLange = "zh-CN";
  });

  afterEach(() => {
    window.globalLange = undefined;
  });

  it("extracts blocking field labels in a stable business order", () => {
    expect(
      getSubmitBlockingFieldLabels([
        "第 1 题缺少答案",
        "第 2 题缺少题干",
        "第 3 题缺少大题标题",
        "第 4 题分数格式不正确",
        "第 5 题缺少子题",
      ]),
    ).toEqual(["题干", "答案", "分数", "子题", "大题标题"]);
  });

  it("summarizes numbered issues into stable display lines", () => {
    expect(
      summarizeIssueMessages([
        "第 1 题缺少答案",
        "第 2 题缺少答案",
        "第 3 小题缺少解析",
      ]),
    ).toEqual(["第 1、2 题缺少答案", "第 3 小题缺少解析"]);
  });

  it("summarizes structured issues without depending on localized display strings", () => {
    expect(
      summarizeIssueMessages([
        createIssue(QUESTION_REVIEW_ISSUE_CODE.MISSING_ANSWER, 1),
        createIssue(QUESTION_REVIEW_ISSUE_CODE.MISSING_ANSWER, 2),
        createIssue(QUESTION_REVIEW_ISSUE_CODE.MISSING_ANALYSIS, "3-1", true),
      ]),
    ).toEqual(["第 1、2 题缺少答案", "第 3-1 小题缺少解析"]);
  });

  it("summarizes structured issues with English question wording", () => {
    window.globalLange = "en";

    expect(
      summarizeIssueMessages([
        createIssue(QUESTION_REVIEW_ISSUE_CODE.MISSING_ANSWER, 1),
        createIssue(QUESTION_REVIEW_ISSUE_CODE.MISSING_ANSWER, 2),
        createIssue(QUESTION_REVIEW_ISSUE_CODE.MISSING_ANALYSIS, "3-1", true),
      ]),
    ).toEqual([
      "Question 1, 2: Missing answer",
      "Subquestion 3-1: Missing analysis",
    ]);
  });

  it("extracts English blocking labels from stable issue details", () => {
    window.globalLange = "en";

    expect(
      getSubmitBlockingFieldLabels([
        {
          fieldKey: "answer",
        },
        {
          fieldKey: "content",
        },
        {
          fieldKey: "score",
        },
      ]),
    ).toEqual(["stem", "answer", "score"]);
  });

  it("builds unique issue details with field keys and sub-question markers", () => {
    expect(
      buildIssueDetails([
        "第 1 题缺少答案",
        "第 1 题缺少答案",
        "第 2 小题缺少解析",
      ]),
    ).toEqual([
      {
        fieldKey: "answer",
        isSubQuestion: false,
        message: "缺少答案",
        questionNumber: "1",
        unit: "题",
      },
      {
        fieldKey: "analysis",
        isSubQuestion: true,
        message: "缺少解析",
        questionNumber: "2",
        unit: "小题",
      },
    ]);
  });

  it("builds stable details from structured issues", () => {
    expect(
      buildIssueDetails([
        createIssue(QUESTION_REVIEW_ISSUE_CODE.MISSING_STEM, 1),
        createIssue(QUESTION_REVIEW_ISSUE_CODE.MISSING_STEM, 1),
        createIssue(QUESTION_REVIEW_ISSUE_CODE.INVALID_SCORE, "2-1", true),
      ]),
    ).toEqual([
      {
        fieldKey: "content",
        isSubQuestion: false,
        message: "缺少题干",
        questionNumber: "1",
        unit: "题",
      },
      {
        fieldKey: "score",
        isSubQuestion: true,
        message: "分数格式不正确",
        questionNumber: "2-1",
        unit: "小题",
      },
    ]);
  });

  it("extracts blocking labels from stable issue details", () => {
    expect(
      getSubmitBlockingFieldLabels([
        {
          fieldKey: "answer",
        },
        {
          fieldKey: "content",
        },
        {
          fieldKey: "score",
        },
      ]),
    ).toEqual(["题干", "答案", "分数"]);
  });

  it("derives question review statuses from blocking and warning issues", () => {
    expect(
      getQuestionReviewStatus({
        saveWarningIssues: [],
        submitBlockingIssues: ["第 1 题缺少答案"],
      }),
    ).toBe(QUESTION_REVIEW_STATUS.BLOCKED);
    expect(
      getQuestionReviewStatus({
        saveWarningIssues: ["第 1 题缺少答案", "第 1 题缺少解析"],
        submitBlockingIssues: [],
      }),
    ).toBe(QUESTION_REVIEW_STATUS.MISSING_BOTH);
    expect(
      getQuestionReviewStatus({
        saveWarningIssues: ["第 1 题缺少答案"],
        submitBlockingIssues: [],
      }),
    ).toBe(QUESTION_REVIEW_STATUS.MISSING_ANSWER);
    expect(
      getQuestionReviewStatus({
        saveWarningIssues: ["第 1 题缺少解析"],
        submitBlockingIssues: [],
      }),
    ).toBe(QUESTION_REVIEW_STATUS.MISSING_ANALYSIS);
    expect(
      getQuestionReviewStatus({
        saveWarningIssues: [],
        submitBlockingIssues: ["第 1 题未设置分数"],
      }),
    ).toBe(QUESTION_REVIEW_STATUS.MISSING_SCORE);
    expect(
      getQuestionReviewStatus({
        saveWarningIssues: [],
        submitBlockingIssues: ["第 1 题分数格式不正确"],
      }),
    ).toBe(QUESTION_REVIEW_STATUS.MISSING_SCORE);
    expect(
      getQuestionReviewStatus({
        saveWarningIssues: [],
        submitBlockingIssues: [MISSING_SCORE_ISSUE, "第 1 题缺少答案"],
      }),
    ).toBe(QUESTION_REVIEW_STATUS.BLOCKED);
    expect(
      getQuestionReviewStatus({
        saveWarningIssues: [MISSING_SCORE_ISSUE],
        submitBlockingIssues: [],
      }),
    ).toBe(QUESTION_REVIEW_STATUS.MISSING_SCORE);
    expect(
      getQuestionReviewStatus({
        saveWarningIssues: [],
        submitBlockingIssues: [
          createIssue(QUESTION_REVIEW_ISSUE_CODE.MISSING_SCORE, 1),
        ],
      }),
    ).toBe(QUESTION_REVIEW_STATUS.MISSING_SCORE);
    expect(
      getQuestionReviewStatus({
        saveWarningIssues: [
          createIssue(QUESTION_REVIEW_ISSUE_CODE.MISSING_ANSWER, 1),
          createIssue(QUESTION_REVIEW_ISSUE_CODE.MISSING_ANALYSIS, 1),
        ],
        submitBlockingIssues: [],
      }),
    ).toBe(QUESTION_REVIEW_STATUS.MISSING_BOTH);
  });
});
