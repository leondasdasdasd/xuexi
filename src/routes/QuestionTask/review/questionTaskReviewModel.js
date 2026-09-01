import { trans } from "../../../utils/i18n";

const QUESTION_REVIEW_STATUS = {
  BLOCKED: "blocked",
  COMPLETE: "complete",
  MISSING_ANALYSIS: "missingAnalysis",
  MISSING_ANSWER: "missingAnswer",
  MISSING_BOTH: "missingBoth",
  MISSING_SCORE: "missingScore",
};

const QUESTION_REVIEW_ISSUE_CODE = {
  INVALID_SCORE: "invalidScore",
  MISSING_ANALYSIS: "missingAnalysis",
  MISSING_ANSWER: "missingAnswer",
  MISSING_OPTIONS: "missingOptions",
  MISSING_SCORE: "missingScore",
  MISSING_SECTION_TITLE: "missingSectionTitle",
  MISSING_STEM: "missingStem",
  MISSING_SUB_QUESTION: "missingSubQuestion",
};

const ISSUE_FIELD_KEY_MATCHERS = [
  [QUESTION_REVIEW_ISSUE_CODE.MISSING_SECTION_TITLE, "缺少大题标题"],
  [QUESTION_REVIEW_ISSUE_CODE.MISSING_STEM, "缺少题干"],
  [QUESTION_REVIEW_ISSUE_CODE.MISSING_OPTIONS, "选项未补齐"],
  [QUESTION_REVIEW_ISSUE_CODE.MISSING_ANSWER, "缺少答案"],
  [QUESTION_REVIEW_ISSUE_CODE.MISSING_ANALYSIS, "缺少解析"],
  [QUESTION_REVIEW_ISSUE_CODE.MISSING_SUB_QUESTION, "缺少子题"],
  [QUESTION_REVIEW_ISSUE_CODE.INVALID_SCORE, "分数格式不正确"],
  [QUESTION_REVIEW_ISSUE_CODE.MISSING_SCORE, "未设置分数"],
];
const ISSUE_PREFIX_OFFSET = 2;
const ISSUE_PRESENTATION_BY_CODE = {
  [QUESTION_REVIEW_ISSUE_CODE.MISSING_SECTION_TITLE]: {
    fieldKey: "sectionTitle",
    label: "大题标题",
    labelKey: "questionTask.reviewFieldLabelSectionTitle",
    messageFallback: "缺少大题标题",
    messageKey: "questionTask.reviewMissingSectionTitleText",
  },
  [QUESTION_REVIEW_ISSUE_CODE.MISSING_STEM]: {
    fieldKey: "content",
    label: "题干",
    labelKey: "questionTask.reviewFieldLabelStem",
    messageFallback: "缺少题干",
    messageKey: "questionTask.reviewMissingStemText",
  },
  [QUESTION_REVIEW_ISSUE_CODE.MISSING_OPTIONS]: {
    fieldKey: "options",
    label: "选项",
    labelKey: "questionTask.reviewFieldLabelOptions",
    messageFallback: "选项未补齐",
    messageKey: "questionTask.reviewMissingOptionsText",
  },
  [QUESTION_REVIEW_ISSUE_CODE.MISSING_ANSWER]: {
    fieldKey: "answer",
    label: "答案",
    labelKey: "questionTask.reviewFieldLabelAnswer",
    messageFallback: "缺少答案",
    messageKey: "questionTask.reviewMissingAnswerText",
  },
  [QUESTION_REVIEW_ISSUE_CODE.MISSING_ANALYSIS]: {
    fieldKey: "analysis",
    label: "解析",
    labelKey: "questionTask.reviewFieldLabelAnalysis",
    messageFallback: "缺少解析",
    messageKey: "questionTask.reviewMissingAnalysisText",
  },
  [QUESTION_REVIEW_ISSUE_CODE.MISSING_SUB_QUESTION]: {
    fieldKey: "subQuestions",
    label: "子题",
    labelKey: "questionTask.reviewFieldLabelSubQuestions",
    messageFallback: "缺少子题",
    messageKey: "questionTask.reviewMissingSubQuestionText",
  },
  [QUESTION_REVIEW_ISSUE_CODE.MISSING_SCORE]: {
    fieldKey: "score",
    label: "分数",
    labelKey: "questionTask.reviewFieldLabelScore",
    messageFallback: "未设置分数",
    messageKey: "questionTask.reviewMissingScoreText",
  },
  [QUESTION_REVIEW_ISSUE_CODE.INVALID_SCORE]: {
    fieldKey: "score",
    label: "分数",
    labelKey: "questionTask.reviewFieldLabelScore",
    messageFallback: "分数格式不正确",
    messageKey: "questionTask.reviewInvalidScoreText",
  },
};

const ISSUE_PRESENTATION_LIST = Object.values(ISSUE_PRESENTATION_BY_CODE);

const getIssuePresentationByFieldKey = (fieldKey) =>
  ISSUE_PRESENTATION_LIST.find(
    (presentation) => presentation.fieldKey === fieldKey,
  );

export const createQuestionReviewIssue = ({
  code,
  isSubQuestion = false,
  questionNumber,
}) => ({
  code,
  isSubQuestion,
  questionNumber: String(questionNumber || ""),
});

const isStructuredIssue = (issue) =>
  issue && typeof issue === "object" && issue.code;

const getIssueCode = (issue) => {
  if (isStructuredIssue(issue)) {
    return issue.code;
  }

  const text = String(issue || "");
  const matchedEntry = ISSUE_FIELD_KEY_MATCHERS.find(([, matcher]) =>
    text.includes(matcher),
  );

  return matchedEntry ? matchedEntry[0] : "";
};

const containsIssueCode = (issues, code) =>
  (Array.isArray(issues) ? issues : []).some(
    (issue) => getIssueCode(issue) === code,
  );

const hasScoreIssue = (issues) =>
  (Array.isArray(issues) ? issues : []).some((issue) =>
    [
      QUESTION_REVIEW_ISSUE_CODE.MISSING_SCORE,
      QUESTION_REVIEW_ISSUE_CODE.INVALID_SCORE,
    ].includes(getIssueCode(issue)),
  );

const hasIssueFieldKey = (issues, fieldKey) =>
  (Array.isArray(issues) ? issues : []).some(
    (issue) => issue?.fieldKey === fieldKey,
  );

const getBlockingReviewStatus = (submitBlockingIssues) =>
  hasScoreIssue(submitBlockingIssues) &&
  !containsIssueCode(
    submitBlockingIssues,
    QUESTION_REVIEW_ISSUE_CODE.MISSING_ANSWER,
  ) &&
  !containsIssueCode(
    submitBlockingIssues,
    QUESTION_REVIEW_ISSUE_CODE.MISSING_ANALYSIS,
  )
    ? QUESTION_REVIEW_STATUS.MISSING_SCORE
    : QUESTION_REVIEW_STATUS.BLOCKED;

const getWarningReviewStatus = (issues) => {
  const hasMissingAnswer = containsIssueCode(
    issues,
    QUESTION_REVIEW_ISSUE_CODE.MISSING_ANSWER,
  );
  const hasMissingAnalysis = containsIssueCode(
    issues,
    QUESTION_REVIEW_ISSUE_CODE.MISSING_ANALYSIS,
  );

  if (hasMissingAnswer && hasMissingAnalysis) {
    return QUESTION_REVIEW_STATUS.MISSING_BOTH;
  }
  if (hasMissingAnswer) {
    return QUESTION_REVIEW_STATUS.MISSING_ANSWER;
  }
  if (hasMissingAnalysis) {
    return QUESTION_REVIEW_STATUS.MISSING_ANALYSIS;
  }
  if (hasScoreIssue(issues)) {
    return QUESTION_REVIEW_STATUS.MISSING_SCORE;
  }

  return QUESTION_REVIEW_STATUS.COMPLETE;
};

export const getSubmitBlockingFieldLabels = (issues) => {
  const normalizedIssues = Array.isArray(issues) ? issues : [];
  const labels = [];
  const appendFieldLabel = (fieldKey) => {
    const presentation = getIssuePresentationByFieldKey(fieldKey);

    if (presentation) {
      labels.push(trans(presentation.labelKey, presentation.label));
    }
  };

  if (
    containsIssueCode(
      normalizedIssues,
      QUESTION_REVIEW_ISSUE_CODE.MISSING_STEM,
    ) ||
    hasIssueFieldKey(normalizedIssues, "content")
  ) {
    appendFieldLabel("content");
  }
  if (
    containsIssueCode(
      normalizedIssues,
      QUESTION_REVIEW_ISSUE_CODE.MISSING_OPTIONS,
    ) ||
    hasIssueFieldKey(normalizedIssues, "options")
  ) {
    appendFieldLabel("options");
  }
  if (
    containsIssueCode(
      normalizedIssues,
      QUESTION_REVIEW_ISSUE_CODE.MISSING_ANSWER,
    ) ||
    hasIssueFieldKey(normalizedIssues, "answer")
  ) {
    appendFieldLabel("answer");
  }
  if (
    hasScoreIssue(normalizedIssues) ||
    hasIssueFieldKey(normalizedIssues, "score")
  ) {
    appendFieldLabel("score");
  }
  if (
    containsIssueCode(
      normalizedIssues,
      QUESTION_REVIEW_ISSUE_CODE.MISSING_SUB_QUESTION,
    ) ||
    hasIssueFieldKey(normalizedIssues, "subQuestions")
  ) {
    appendFieldLabel("subQuestions");
  }
  if (
    containsIssueCode(
      normalizedIssues,
      QUESTION_REVIEW_ISSUE_CODE.MISSING_SECTION_TITLE,
    ) ||
    hasIssueFieldKey(normalizedIssues, "sectionTitle")
  ) {
    appendFieldLabel("sectionTitle");
  }

  return labels;
};

const getIssueMessageText = (issue) => {
  const code = getIssueCode(issue);
  const presentation = ISSUE_PRESENTATION_BY_CODE[code];

  return presentation
    ? trans(presentation.messageKey, presentation.messageFallback)
    : String(issue || "");
};

const getIssueUnitText = (issue) =>
  issue?.isSubQuestion
    ? trans("questionTask.reviewSubQuestionUnit", "小题")
    : trans("questionTask.reviewQuestionUnit", "题");

const formatIssueWithQuestion = (issue) =>
  trans(
    "questionTask.reviewIssueDetailLine",
    "第{$questionNumber}{$unit}：{$message}",
    {
      message: getIssueMessageText(issue),
      questionNumber: issue.questionNumber,
      unit: getIssueUnitText(issue),
    },
  );

const getNumberedIssueUnit = (trimmedText) => {
  const smallQuestionIndex = trimmedText.indexOf("小题");
  const questionIndex = trimmedText.indexOf("题");

  if (smallQuestionIndex >= 0 && smallQuestionIndex <= questionIndex) {
    return { unit: "小题", unitIndex: smallQuestionIndex };
  }

  return questionIndex >= 0
    ? { unit: "题", unitIndex: questionIndex }
    : { unit: "", unitIndex: -1 };
};

const parseNumberedIssue = (issue) => {
  if (isStructuredIssue(issue)) {
    return {
      code: issue.code,
      isSubQuestion: Boolean(issue.isSubQuestion),
      message: getIssueMessageText(issue),
      number: issue.questionNumber,
      unit: getIssueUnitText(issue),
    };
  }

  const text = String(issue || "");
  const trimmedText = text.startsWith("第 ")
    ? text.slice(ISSUE_PREFIX_OFFSET)
    : "";
  const { unit, unitIndex } = getNumberedIssueUnit(trimmedText);
  const message =
    unitIndex >= 0 ? trimmedText.slice(unitIndex + unit.length) : "";
  const number = unitIndex >= 0 ? trimmedText.slice(0, unitIndex).trim() : "";

  return number && unit && message
    ? {
        code: getIssueCode(issue),
        isSubQuestion: unit === "小题",
        message,
        number,
        unit,
      }
    : false;
};

const appendIssueGroup = (groupedIssues, groupedIssueMap, issue) => {
  const parsedIssue = parseNumberedIssue(issue);

  if (!parsedIssue) {
    return {
      groupedIssueMap,
      groupedIssues: [...groupedIssues, issue],
    };
  }

  const issueKey = `${parsedIssue.isSubQuestion ? "subQuestion" : "question"}${
    parsedIssue.code || parsedIssue.message
  }`;
  const currentGroup = groupedIssueMap.get(issueKey) || {
    isSubQuestion: parsedIssue.isSubQuestion,
    message: parsedIssue.message,
    numbers: [],
    unit: parsedIssue.unit,
  };
  const nextGroup = {
    ...currentGroup,
    numbers: currentGroup.numbers.includes(parsedIssue.number)
      ? currentGroup.numbers
      : [...currentGroup.numbers, parsedIssue.number],
  };
  const nextIssueMap = new Map(groupedIssueMap).set(issueKey, nextGroup);

  return {
    groupedIssueMap: nextIssueMap,
    groupedIssues: groupedIssueMap.has(issueKey)
      ? groupedIssues.map((groupedIssue) =>
          groupedIssue === currentGroup ? nextGroup : groupedIssue,
        )
      : [...groupedIssues, nextGroup],
  };
};

const buildIssueGroups = (
  issues,
  index = 0,
  groupedIssues = [],
  groupedIssueMap = new Map(),
) => {
  const normalizedIssues = Array.isArray(issues) ? issues : [];

  if (index >= normalizedIssues.length) {
    return groupedIssues;
  }

  const nextGroupState = appendIssueGroup(
    groupedIssues,
    groupedIssueMap,
    normalizedIssues[index],
  );

  return buildIssueGroups(
    normalizedIssues,
    index + 1,
    nextGroupState.groupedIssues,
    nextGroupState.groupedIssueMap,
  );
};

export const summarizeIssueMessages = (issues) =>
  buildIssueGroups(issues).map((item) => {
    if (typeof item === "string") {
      return item;
    }

    const questionNumbers = item.numbers.join(
      trans("questionTask.reviewListSeparator", "、"),
    );

    return item.isSubQuestion
      ? trans(
          "questionTask.reviewSubQuestionIssueSummaryLine",
          "第 {$questionNumbers} 小题{$message}",
          {
            message: item.message,
            questionNumbers,
          },
        )
      : trans(
          "questionTask.reviewQuestionIssueSummaryLine",
          "第 {$questionNumbers} 题{$message}",
          {
            message: item.message,
            questionNumbers,
          },
        );
  });

const getIssueFieldKey = (message) => {
  const code = getIssueCode(message);
  const presentation = ISSUE_PRESENTATION_BY_CODE[code];

  return presentation ? presentation.fieldKey : "unknown";
};

const buildIssueDetail = (issue) => {
  const parsedIssue = parseNumberedIssue(issue);

  if (!parsedIssue) {
    return {
      fieldKey: getIssueFieldKey(issue),
      isSubQuestion: false,
      message: String(issue || ""),
      questionNumber: "",
      unit: "",
    };
  }

  return {
    fieldKey: getIssueFieldKey(issue),
    isSubQuestion: parsedIssue.isSubQuestion,
    message: parsedIssue.message,
    questionNumber: parsedIssue.number,
    unit: parsedIssue.unit,
  };
};

export const buildIssueDetails = (issues, index = 0, details = []) => {
  const normalizedIssues = Array.isArray(issues) ? issues : [];

  if (index >= normalizedIssues.length) {
    return details;
  }

  const nextDetail = buildIssueDetail(normalizedIssues[index]);
  const detailKey = `${nextDetail.questionNumber}-${nextDetail.fieldKey}-${nextDetail.message}`;

  return buildIssueDetails(
    normalizedIssues,
    index + 1,
    details.some(
      (detail) =>
        `${detail.questionNumber}-${detail.fieldKey}-${detail.message}` ===
        detailKey,
    )
      ? details
      : [...details, nextDetail],
  );
};

export const getQuestionReviewStatus = (validation) => {
  const submitBlockingIssues = validation?.submitBlockingIssues || [];
  const saveWarningIssues = validation?.saveWarningIssues || [];

  if (submitBlockingIssues.length > 0) {
    return getBlockingReviewStatus(submitBlockingIssues);
  }

  return getWarningReviewStatus(saveWarningIssues);
};

export { QUESTION_REVIEW_ISSUE_CODE, QUESTION_REVIEW_STATUS };
