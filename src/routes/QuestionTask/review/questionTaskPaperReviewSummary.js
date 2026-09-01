import {
  getArrayItem,
  QUESTION_TYPE_COMBINATION,
} from "../domain/questionTaskShared";
import {
  getQuestionDisplayNumber,
  getQuestionSectionDisplayLabel,
  hasQuestionAnalysis,
  hasQuestionAnswer,
  hasQuestionOptions,
  hasQuestionRichTextContent,
  isOptionBasedQuestion,
  parseQuestionScoreState,
} from "../domain/questionTaskViewModel";
import {
  buildIssueDetails,
  createQuestionReviewIssue,
  getQuestionReviewStatus,
  QUESTION_REVIEW_ISSUE_CODE,
  summarizeIssueMessages,
} from "./questionTaskReviewModel";

const getReviewIssueUniqueKey = (issue) =>
  issue && typeof issue === "object"
    ? `${issue.code}-${issue.questionNumber}-${issue.isSubQuestion}`
    : String(issue || "");

const appendUniqueIssue = (issues, issue) => {
  const issueKey = getReviewIssueUniqueKey(issue);
  const hasIssue = issues.some(
    (currentIssue) => getReviewIssueUniqueKey(currentIssue) === issueKey,
  );

  if (!hasIssue) {
    issues.push(issue);
  }
};

const createValidationIssue = ({ code, isSubQuestion, questionNumber }) =>
  createQuestionReviewIssue({
    code,
    isSubQuestion,
    questionNumber,
  });

const collectChildValidationList = (
  subQuestions,
  questionNumber,
  subQuestionIndex = 0,
  validations = [],
) => {
  const normalizedSubQuestions = Array.isArray(subQuestions)
    ? subQuestions
    : [];

  if (subQuestionIndex >= normalizedSubQuestions.length) {
    return validations;
  }

  return collectChildValidationList(
    normalizedSubQuestions,
    questionNumber,
    subQuestionIndex + 1,
    [
      ...validations,
      collectQuestionValidation(
        getArrayItem(normalizedSubQuestions, subQuestionIndex),
        `${questionNumber}-${subQuestionIndex + 1}`,
        true,
      ),
    ],
  );
};

const mergeValidationIssues = (
  validationList,
  field,
  index = 0,
  issues = [],
) => {
  if (index >= validationList.length) {
    return issues;
  }

  return mergeValidationIssues(validationList, field, index + 1, [
    ...issues,
    ...(getArrayItem(validationList, index)?.[field] || []),
  ]);
};

const sumValidationField = (
  validationList,
  field,
  index = 0,
  totalValue = 0,
) => {
  if (index >= validationList.length) {
    return totalValue;
  }

  return sumValidationField(
    validationList,
    field,
    index + 1,
    totalValue + (Number(getArrayItem(validationList, index)?.[field]) || 0),
  );
};

const appendQuestionScoreIssues = ({
  isSubQuestion,
  questionNumber,
  saveWarningIssues,
  submitBlockingIssues,
  scoreState,
}) => {
  if (scoreState.missing) {
    const issue = createValidationIssue({
      code: QUESTION_REVIEW_ISSUE_CODE.MISSING_SCORE,
      isSubQuestion,
      questionNumber,
    });

    appendUniqueIssue(saveWarningIssues, issue);
    appendUniqueIssue(submitBlockingIssues, issue);
    return;
  }

  if (scoreState.invalid) {
    const issue = createValidationIssue({
      code: QUESTION_REVIEW_ISSUE_CODE.INVALID_SCORE,
      isSubQuestion,
      questionNumber,
    });

    appendUniqueIssue(saveWarningIssues, issue);
    appendUniqueIssue(submitBlockingIssues, issue);
  }
};

const appendBaseQuestionIssues = ({
  isSubQuestion,
  question,
  questionNumber,
  saveWarningIssues,
  scoreState,
  submitBlockingIssues,
}) => {
  if (!hasQuestionRichTextContent(question?.content)) {
    appendUniqueIssue(
      saveWarningIssues,
      createValidationIssue({
        code: QUESTION_REVIEW_ISSUE_CODE.MISSING_STEM,
        isSubQuestion,
        questionNumber,
      }),
    );
  }

  appendQuestionScoreIssues({
    isSubQuestion,
    questionNumber,
    saveWarningIssues,
    scoreState,
    submitBlockingIssues,
  });

  if (!isSubQuestion && !String(question?.sectionTitle || "").trim()) {
    appendUniqueIssue(
      saveWarningIssues,
      createValidationIssue({
        code: QUESTION_REVIEW_ISSUE_CODE.MISSING_SECTION_TITLE,
        isSubQuestion,
        questionNumber,
      }),
    );
  }
};

const collectCombinationQuestionValidation = ({
  question,
  questionNumber,
  saveWarningIssues,
  scoreState,
  submitBlockingIssues,
}) => {
  const subQuestions = Array.isArray(question?.sonQuestionList)
    ? question.sonQuestionList
    : [];

  if (subQuestions.length === 0) {
    appendUniqueIssue(
      saveWarningIssues,
      createValidationIssue({
        code: QUESTION_REVIEW_ISSUE_CODE.MISSING_SUB_QUESTION,
        questionNumber,
      }),
    );
  }

  const childValidationList = collectChildValidationList(
    subQuestions,
    questionNumber,
  );
  const childScoreTotal = sumValidationField(childValidationList, "scoreTotal");

  return {
    saveWarningIssues: [
      ...saveWarningIssues,
      ...mergeValidationIssues(childValidationList, "saveWarningIssues"),
    ],
    scoreTotal:
      !scoreState.missing && !scoreState.invalid
        ? scoreState.value
        : childScoreTotal,
    subQuestionCount:
      subQuestions.length +
      sumValidationField(childValidationList, "subQuestionCount"),
    submitBlockingIssues: [
      ...submitBlockingIssues,
      ...mergeValidationIssues(childValidationList, "submitBlockingIssues"),
    ],
  };
};

const appendStandaloneQuestionIssues = ({
  isSubQuestion,
  question,
  questionNumber,
  saveWarningIssues,
  submitBlockingIssues,
}) => {
  if (isOptionBasedQuestion(question) && !hasQuestionOptions(question)) {
    appendUniqueIssue(
      saveWarningIssues,
      createValidationIssue({
        code: QUESTION_REVIEW_ISSUE_CODE.MISSING_OPTIONS,
        isSubQuestion,
        questionNumber,
      }),
    );
  }

  if (!hasQuestionAnswer(question)) {
    const issue = createValidationIssue({
      code: QUESTION_REVIEW_ISSUE_CODE.MISSING_ANSWER,
      isSubQuestion,
      questionNumber,
    });
    appendUniqueIssue(saveWarningIssues, issue);
    appendUniqueIssue(submitBlockingIssues, issue);
  }

  if (!hasQuestionAnalysis(question)) {
    appendUniqueIssue(
      saveWarningIssues,
      createValidationIssue({
        code: QUESTION_REVIEW_ISSUE_CODE.MISSING_ANALYSIS,
        isSubQuestion,
        questionNumber,
      }),
    );
  }
};

const collectQuestionValidation = (
  question,
  questionNumber,
  isSubQuestion = false,
) => {
  const saveWarningIssues = [];
  const submitBlockingIssues = [];
  const scoreState = parseQuestionScoreState(question);
  const questionType = Number(question?.type);

  appendBaseQuestionIssues({
    isSubQuestion,
    question,
    questionNumber,
    saveWarningIssues,
    scoreState,
    submitBlockingIssues,
  });

  if (questionType === QUESTION_TYPE_COMBINATION) {
    return collectCombinationQuestionValidation({
      question,
      questionNumber,
      saveWarningIssues,
      scoreState,
      submitBlockingIssues,
    });
  }

  appendStandaloneQuestionIssues({
    isSubQuestion,
    question,
    questionNumber,
    saveWarningIssues,
    submitBlockingIssues,
  });

  return {
    saveWarningIssues,
    scoreTotal:
      !scoreState.missing && !scoreState.invalid ? scoreState.value : 0,
    subQuestionCount: 0,
    submitBlockingIssues,
  };
};

const appendUniqueIssues = (issues, nextIssues, index = 0) => {
  const normalizedIssues = Array.isArray(nextIssues) ? nextIssues : [];

  if (index >= normalizedIssues.length) {
    return issues;
  }

  const issue = getArrayItem(normalizedIssues, index);
  const issueKey = getReviewIssueUniqueKey(issue);
  return appendUniqueIssues(
    issues.some(
      (currentIssue) => getReviewIssueUniqueKey(currentIssue) === issueKey,
    )
      ? issues
      : [...issues, issue],
    normalizedIssues,
    index + 1,
  );
};

const appendQuestionToSectionGroup = (groups, question, index, item) => {
  const sectionKey = `${question?.sectionNumber || ""}-${question?.sectionTitle || ""}`;
  const previousGroup = groups.at(-1);

  if (previousGroup && previousGroup.sectionKey === sectionKey) {
    return [
      ...groups.slice(0, -1),
      {
        ...previousGroup,
        items: [...previousGroup.items, item],
      },
    ];
  }

  return [
    ...groups,
    {
      items: [item],
      key: `section-${index + 1}`,
      label: getQuestionSectionDisplayLabel(question),
      sectionKey,
    },
  ];
};

const buildPaperReviewSummaryState = (
  questions,
  groups,
  getQuestionReviewStatusPresentation,
  index = 0,
  state,
) => {
  const currentState = state || {
    completedCount: 0,
    saveWarningIssues: [],
    subQuestionCount: 0,
    submitBlockingIssues: [],
    totalScore: 0,
  };

  if (index >= questions.length) {
    return {
      ...currentState,
      groups,
    };
  }

  const question = getArrayItem(questions, index);
  const questionNumber = getQuestionDisplayNumber(question, index);
  const validation = collectQuestionValidation(question, questionNumber);
  const status = getQuestionReviewStatus(validation);
  const statusPresentation = getQuestionReviewStatusPresentation(status);

  return buildPaperReviewSummaryState(
    questions,
    appendQuestionToSectionGroup(groups, question, index, {
      draftId: question?.draftId,
      number: questionNumber,
      status,
      statusClassName: statusPresentation.className,
      statusLabel: statusPresentation.label,
      statusShortLabel: statusPresentation.shortLabel,
    }),
    getQuestionReviewStatusPresentation,
    index + 1,
    {
      completedCount:
        currentState.completedCount + (status === "complete" ? 1 : 0),
      saveWarningIssues: appendUniqueIssues(
        currentState.saveWarningIssues,
        validation.saveWarningIssues,
      ),
      subQuestionCount:
        currentState.subQuestionCount + validation.subQuestionCount,
      submitBlockingIssues: appendUniqueIssues(
        currentState.submitBlockingIssues,
        validation.submitBlockingIssues,
      ),
      totalScore: currentState.totalScore + validation.scoreTotal,
    },
  );
};

export const buildPaperReviewSummary = ({
  getQuestionReviewStatusPresentation,
  questions,
}) => {
  const normalizedQuestions = Array.isArray(questions) ? questions : [];
  const summaryState = buildPaperReviewSummaryState(
    normalizedQuestions,
    [],
    getQuestionReviewStatusPresentation,
  );

  return {
    bigQuestionCount: normalizedQuestions.length,
    completedCount: summaryState.completedCount,
    groups: summaryState.groups.filter((group) => group.items.length),
    isFullyComplete: summaryState.saveWarningIssues.length === 0,
    saveWarningDetails: buildIssueDetails(summaryState.saveWarningIssues),
    saveWarningIssues: summarizeIssueMessages(summaryState.saveWarningIssues),
    subQuestionCount: summaryState.subQuestionCount,
    submitBlockingDetails: buildIssueDetails(summaryState.submitBlockingIssues),
    submitBlockingIssues: summarizeIssueMessages(
      summaryState.submitBlockingIssues,
    ),
    totalScore: summaryState.totalScore,
  };
};
