import { trans } from "../utils/i18n";

export const QUESTION_TASK_AI_MODELS = [
  { label: "通义千问", value: "qwen" },
  { label: "豆包", value: "doubao" },
  { label: "Gemini 3", value: "gemini-3" },
];

export const QUESTION_TASK_ANALYSIS_EXAMPLE_FIELDS = [
  {
    key: "choice",
    label: trans("questionTask.aiAnalysisChoiceExampleLabel", "选择题"),
    placeholder: trans(
      "questionTask.aiAnalysisExamplePlaceholder",
      "请填写该题型期望的输出要求和样例",
    ),
    types: [1, 2],
  },
  {
    key: "blank",
    label: trans("questionTask.aiAnalysisBlankExampleLabel", "填空题"),
    placeholder: trans(
      "questionTask.aiAnalysisExamplePlaceholder",
      "请填写该题型期望的输出要求和样例",
    ),
    types: [3],
  },
  {
    key: "answer",
    label: trans("questionTask.aiAnalysisAnswerExampleLabel", "问答题"),
    placeholder: trans(
      "questionTask.aiAnalysisExamplePlaceholder",
      "请填写该题型期望的输出要求和样例",
    ),
    types: [5],
  },
  {
    key: "judge",
    label: trans("questionTask.aiAnalysisJudgeExampleLabel", "判断题"),
    placeholder: trans(
      "questionTask.aiAnalysisExamplePlaceholder",
      "请填写该题型期望的输出要求和样例",
    ),
    types: [4],
  },
];

export const AI_EDIT_FIELD_OPTIONS = [
  { label: trans("questionTask.stem", "题干"), value: "content" },
  { label: trans("questionTask.options", "选项"), value: "optionList" },
  { label: trans("global.answer", "答案"), value: "answer" },
  {
    label: trans("questionTask.answerAnalysisTextTitle", "答案解析"),
    value: "analysis",
  },
  { label: trans("global.hardValue", "难度"), value: "questionLevel" },
];

export const DEFAULT_BATCH_ANALYSIS_PROMPT = trans(
  "questionTask.defaultBatchAnalysisPrompt",
  "请为缺少答案或解析的题目补充参考答案和解析。答案应准确、简洁，解析应便于教师快速复核；已有答案或解析的字段不要覆盖。",
);
export const DEFAULT_BATCH_QUALITY_CHECK_PROMPT = trans(
  "questionTask.defaultBatchQualityPrompt",
  "请按正式出版级标准，对每道题进行通用质检。请同时检查题干、选项、答案、解析、分数、格式、错别字、语义准确性、逻辑一致性，以及答案与解析是否匹配。请输出明确的风险等级（质检通过/低风险/高风险）、错误类型、质检结果和简洁修改建议。",
);
export const DEFAULT_SINGLE_QUESTION_PROMPT = trans(
  "questionTask.defaultSingleQuestionPrompt",
  "请根据我的要求，只返回需要修改的字段，不要重写整道题。优先保持原题结构稳定，必要时补充或优化答案解析。",
);
export const QUALITY_CHECK_STATUS = {
  HIGH: "high",
  LOW: "low",
  PASS: "pass",
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const stripHtml = (value) =>
  String(value || "")
    .replaceAll(/<[^>]*>/g, "")
    .trim();
const escapeHtml = (value) =>
  String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const getNormalizedTypeExamples = (typeExamples) =>
  QUESTION_TASK_ANALYSIS_EXAMPLE_FIELDS.reduce((result, field) => {
    const value = stripHtml(typeExamples && typeExamples[field.key]);

    if (value) {
      result[field.key] = value;
    }

    return result;
  }, {});

const getQuestionText = (question) =>
  stripHtml(question && question.content) || "当前题目";
const summarizePrompt = (prompt) =>
  stripHtml(prompt).slice(0, 80) || "按当前要求优化";
const normalizeAnswerText = (value) => stripHtml(value);

const getQuestionAnswerText = (question) => {
  if (Number(question && question.type) === 6) {
    return (
      Array.isArray(question && question.sonQuestionList)
        ? question.sonQuestionList
        : []
    )
      .map(getQuestionAnswerText)
      .filter(Boolean)
      .join("；");
  }

  if (
    Number(question && question.type) === 3 &&
    question &&
    question.gapFillingAnswer &&
    Array.isArray(question.gapFillingAnswer.answers)
  ) {
    return question.gapFillingAnswer.answers.join("；");
  }

  if (Number(question && question.type) === 4) {
    if (question.answer === "true" || question.answer === true) {
      return "正确";
    }
    if (question.answer === "false" || question.answer === false) {
      return "错误";
    }
  }

  return question && question.answer !== undefined && question.answer !== null
    ? String(question.answer)
    : "";
};

const inferSingleQuestionFields = (prompt) => {
  const normalizedPrompt = stripHtml(prompt).toLowerCase();
  const fields = [];

  if (/题干|题目内容|内容|stem|content/.test(normalizedPrompt)) {
    fields.push("content");
  }

  if (/选项|option/.test(normalizedPrompt)) {
    fields.push("optionList");
  }

  if (/答案|answer/.test(normalizedPrompt)) {
    fields.push("answer");
  }

  if (/解析|讲解|分析|analysis/.test(normalizedPrompt)) {
    fields.push("analysis");
  }

  if (/难度|等级|questionlevel/.test(normalizedPrompt)) {
    fields.push("questionLevel");
  }

  return fields.length > 0
    ? fields
    : ["content", "optionList", "answer", "analysis"];
};

const getQuestionExampleContext = (question, typeExamples) => {
  const normalizedTypeExamples = getNormalizedTypeExamples(typeExamples);

  if (Object.keys(normalizedTypeExamples).length === 0) {
    return "";
  }

  const matchedFieldKeys = QUESTION_TASK_ANALYSIS_EXAMPLE_FIELDS.reduce(
    (result, field) => {
      if (field.types.includes(Number(question && question.type))) {
        result.push(field.key);
      }
      return result;
    },
    [],
  );

  if (Number(question && question.type) === 6) {
    for (const subQuestion of Array.isArray(
      question && question.sonQuestionList,
    )
      ? question.sonQuestionList
      : []) {
      const matchedField = QUESTION_TASK_ANALYSIS_EXAMPLE_FIELDS.find((field) =>
        field.types.includes(Number(subQuestion && subQuestion.type)),
      );

      if (matchedField && !matchedFieldKeys.includes(matchedField.key)) {
        matchedFieldKeys.push(matchedField.key);
      }
    }
  }

  const exampleTexts = matchedFieldKeys
    .filter((key) => normalizedTypeExamples[key])
    .map((key) => {
      const field = QUESTION_TASK_ANALYSIS_EXAMPLE_FIELDS.find(
        (item) => item.key === key,
      );

      return `${field ? `${field.label}答案/解析要求与示例` : key}：${normalizedTypeExamples[key]}`;
    });

  return exampleTexts.join("；");
};

const buildMockAnalysis = (question, model, prompt, typeExamples) => {
  const exampleContext = getQuestionExampleContext(question, typeExamples);
  const hasCustomRequirement = !!stripHtml(prompt);

  return (
    `<p><strong>AI补充解析：</strong>先读取题干关键信息，再结合答案进行推导。本题可从“${escapeHtml(getQuestionText(question).slice(0, 28))}”入手，按条件逐步计算或判断，最终得到答案。</p>` +
    (exampleContext ? `<p>本题解析已结合当前题型的预设要求生成。</p>` : "") +
    (hasCustomRequirement ? `<p>本题解析已结合额外要求进行补充。</p>` : "") +
    `<p>本次解析由 ${escapeHtml(model)} 生成。</p>`
  );
};

const hasAnalysis = (question) => !!stripHtml(question && question.analysis);
const hasAnswer = (question) =>
  !!normalizeAnswerText(getQuestionAnswerText(question));
const hasOptionAnswers = (question) =>
  ![1, 2, 7, 8].includes(Number(question && question.type)) ||
  (Array.isArray(question && question.optionList) &&
    question.optionList.length > 0 &&
    question.optionList.every(
      (option) => !!stripHtml(option && option.answers),
    ));

const getFirstOptionKey = (question) => {
  const firstOption = Array.isArray(question && question.optionList)
    ? question.optionList[0]
    : null;

  return (firstOption && firstOption.key) || "A";
};

const buildMockAnswerPatch = (question) => {
  const type = Number(question && question.type);

  if (type === 3) {
    return {
      gapFillingAnswer: {
        ...(question && question.gapFillingAnswer),
        answers: ["AI待确认答案"],
        isOrder:
          question && question.gapFillingAnswer
            ? !!question.gapFillingAnswer.isOrder
            : false,
      },
    };
  }

  if (type === 4) {
    return {
      answer: "true",
    };
  }

  if ([1, 2, 7, 8].includes(type)) {
    return {
      answer: getFirstOptionKey(question),
    };
  }

  return {
    answer: "见解析",
  };
};

const buildSingleQuestionContentPatch = (question, prompt) => {
  const promptSummary = summarizePrompt(prompt);
  const questionText = getQuestionText(question);

  return (
    `<p><strong>AI修正题干：</strong>${escapeHtml(questionText.slice(0, 36))}。</p>` +
    `<p>请结合题目条件，判断最符合要求的一项。<em>修改依据：${escapeHtml(promptSummary)}</em></p>`
  );
};

const buildSingleQuestionOptionPatch = (question, prompt) => {
  const promptSummary = summarizePrompt(prompt);
  const currentOptions = Array.isArray(question && question.optionList)
    ? question.optionList
    : [];

  if (currentOptions.length === 0) {
    return [
      { key: "A", answers: `AI补充选项：${promptSummary}` },
      { key: "B", answers: "保留原题条件，但调整为更清晰的干扰项" },
      { key: "C", answers: "新增用于区分概念理解的选项" },
    ];
  }

  const nextOptions = currentOptions.map((option, optionIndex) => {
    if (optionIndex === 0) {
      return {
        ...option,
        answers: `AI修正选项：保留核心概念，删除原选项中容易误导的表述。`,
      };
    }

    if (optionIndex === currentOptions.length - 1) {
      return {
        ...option,
        answers: `AI改写干扰项：与题干条件相关，但不是最佳答案。`,
      };
    }

    return {
      ...option,
      answers: option && option.answers ? option.answers : "",
    };
  });

  return nextOptions.concat({
    key: "E",
    answers: `AI新增选项：${promptSummary}`,
  });
};

const buildSingleQuestionAnswerPatch = (question) => {
  const type = Number(question && question.type);
  const currentAnswerText = normalizeAnswerText(
    getQuestionAnswerText(question),
  );

  if (type === 3) {
    const currentAnswers =
      question &&
      question.gapFillingAnswer &&
      Array.isArray(question.gapFillingAnswer.answers)
        ? question.gapFillingAnswer.answers
        : [];

    return {
      gapFillingAnswer: {
        ...(question && question.gapFillingAnswer),
        answers:
          currentAnswers.length > 0
            ? currentAnswers.map((answer, answerIndex) =>
                answerIndex === 0 && stripHtml(answer)
                  ? `AI修正答案：${answer}`
                  : answer || "AI待确认答案",
              )
            : ["AI修正答案"],
        isOrder:
          question && question.gapFillingAnswer
            ? !!question.gapFillingAnswer.isOrder
            : false,
      },
    };
  }

  if (type === 4) {
    return {
      answer:
        question && (question.answer === "true" || question.answer === true)
          ? "false"
          : "true",
    };
  }

  if ([1, 2, 7, 8].includes(type)) {
    const optionKeys = (
      Array.isArray(question && question.optionList) ? question.optionList : []
    )
      .map((option) => option && option.key)
      .filter(Boolean);
    const nextAnswer =
      optionKeys.find((key) => key !== currentAnswerText) ||
      (currentAnswerText === "A" ? "B" : "A");

    return {
      answer: nextAnswer,
    };
  }

  return {
    answer: currentAnswerText
      ? `AI修正答案：${currentAnswerText}`
      : "AI修正答案：见解析",
  };
};

const buildSingleQuestionLevelPatch = (question) => {
  const currentLevel = Number(question && question.questionLevel) || 2;

  return {
    questionLevel: currentLevel >= 5 ? 4 : currentLevel + 1,
  };
};

const hasBatchSupplementTarget = (question) => {
  if (!question) {
    return false;
  }

  if (Number(question.type) === 6) {
    return (
      !hasAnalysis(question) ||
      (Array.isArray(question.sonQuestionList)
        ? question.sonQuestionList
        : []
      ).some(
        (subQuestion) => !hasAnswer(subQuestion) || !hasAnalysis(subQuestion),
      )
    );
  }

  return !hasAnswer(question) || !hasAnalysis(question);
};

const buildSupplementPatch = (question, model, prompt, typeExamples) => {
  if (Number(question && question.type) === 6) {
    const patch = {};

    if (!hasAnalysis(question)) {
      patch.analysis = buildMockAnalysis(question, model, prompt, typeExamples);
    }

    const currentSubQuestions = Array.isArray(
      question && question.sonQuestionList,
    )
      ? question.sonQuestionList
      : [];
    const nextSubQuestions = currentSubQuestions.map((subQuestion) => {
      const subQuestionPatch = buildSupplementPatch(
        subQuestion,
        model,
        prompt,
        typeExamples,
      );

      return Object.keys(subQuestionPatch).length > 0
        ? { ...subQuestion, ...subQuestionPatch }
        : subQuestion;
    });

    if (
      JSON.stringify(nextSubQuestions) !== JSON.stringify(currentSubQuestions)
    ) {
      patch.sonQuestionList = nextSubQuestions;
    }

    return patch;
  }

  const patch = {};

  if (!hasAnswer(question)) {
    Object.assign(patch, buildMockAnswerPatch(question));
  }

  if (!hasAnalysis(question)) {
    patch.analysis = buildMockAnalysis(question, model, prompt, typeExamples);
  }

  return patch;
};

/**
 *
 * @param root0
 * @param root0.questions
 * @param root0.model
 * @param root0.prompt
 * @param root0.typeExamples
 */
export async function batchSupplementQuestionAnalysis({
  questions,
  model,
  prompt,
  typeExamples,
}) {
  await wait(500);

  return {
    patches: (Array.isArray(questions) ? questions : [])
      .filter(hasBatchSupplementTarget)
      .map((question) => ({
        draftId: question.draftId,
        patch: buildSupplementPatch(question, model, prompt, typeExamples),
      }))
      .filter((item) => Object.keys(item.patch).length),
  };
}

const createQualityIssue = ({
  type,
  level,
  result,
  suggestion,
  location = "",
}) => ({
  level,
  location,
  result,
  suggestion,
  type,
});

const collectQuestionQualityIssues = (question, location = "") => {
  const issues = [];
  const questionText = getQuestionText(question);
  const questionAnalysis = stripHtml(question && question.analysis);
  const normalizedLocation = location ? `${location}` : "";
  const issueLocationPrefix = normalizedLocation ? `${normalizedLocation}` : "";

  if (!stripHtml(question && question.content)) {
    issues.push(
      createQualityIssue({
        level: QUALITY_CHECK_STATUS.HIGH,
        location: issueLocationPrefix,
        result: "题干为空，题目不可直接使用。",
        suggestion: "请补全题干后再进入后续流程。",
        type: "题干缺失",
      }),
    );
  }

  if (!hasOptionAnswers(question)) {
    issues.push(
      createQualityIssue({
        level: QUALITY_CHECK_STATUS.HIGH,
        location: issueLocationPrefix,
        result: "选项题存在缺失或空选项。",
        suggestion: "请补齐全部选项，并检查选项文案是否完整。",
        type: "选项缺失",
      }),
    );
  }

  if (!hasAnswer(question)) {
    issues.push(
      createQualityIssue({
        level: QUALITY_CHECK_STATUS.HIGH,
        location: issueLocationPrefix,
        result: "缺少标准答案，无法用于后续核对或批改。",
        suggestion: "请补充标准答案，或重新匹配答案卷。",
        type: "答案缺失",
      }),
    );
  }

  if (!hasAnalysis(question)) {
    issues.push(
      createQualityIssue({
        level: QUALITY_CHECK_STATUS.HIGH,
        location: issueLocationPrefix,
        result: "缺少解析，教师无法快速复核题目正确性。",
        suggestion: "请补充结构化解析，说明推导或判断依据。",
        type: "解析缺失",
      }),
    );
  }

  if (/。。|，，|；；|、、/.test(`${questionText}${questionAnalysis}`)) {
    issues.push(
      createQualityIssue({
        level: QUALITY_CHECK_STATUS.LOW,
        location: issueLocationPrefix,
        result: "文本中存在重复标点或明显格式噪声。",
        suggestion: "请统一清理标点、空格与格式噪声。",
        type: "格式问题",
      }),
    );
  }

  if (Number(question && question.type) === 6) {
    const subQuestions = Array.isArray(question && question.sonQuestionList)
      ? question.sonQuestionList
      : [];

    if (subQuestions.length === 0) {
      issues.push(
        createQualityIssue({
          level: QUALITY_CHECK_STATUS.HIGH,
          location: issueLocationPrefix,
          result: "组合题缺少子题，结构不完整。",
          suggestion: "请补齐组合题的子题内容、答案和解析。",
          type: "组合题结构",
        }),
      );
    }

    for (const [index, subQuestion] of subQuestions.entries()) {
      issues.push(
        ...collectQuestionQualityIssues(subQuestion, `第 ${index + 1} 小题`),
      );
    }
  }

  return issues;
};

const getQualityStatusMeta = (issues) => {
  const normalizedIssues = Array.isArray(issues) ? issues : [];

  if (
    normalizedIssues.some((item) => item.level === QUALITY_CHECK_STATUS.HIGH)
  ) {
    return {
      label: "高风险",
      resultLabel: "建议优先人工确认后再继续使用",
      status: QUALITY_CHECK_STATUS.HIGH,
    };
  }

  if (normalizedIssues.length > 0) {
    return {
      label: "低风险",
      resultLabel: "整体可用，但建议快速复核细节",
      status: QUALITY_CHECK_STATUS.LOW,
    };
  }

  return {
    label: "质检通过",
    resultLabel: "未发现明显错误，可进入下一步",
    status: QUALITY_CHECK_STATUS.PASS,
  };
};

const extractFormulaList = (question) => {
  const text = `${getQuestionText(question)} ${stripHtml(question && question.analysis)}`;

  if (/x²|x\^2|二次函数|方程|根/.test(text)) {
    return ["x^2-5x+6=0"];
  }

  if (/概率|面积比|比值/.test(text)) {
    return ["P(A)=\\frac{\\text{符合条件的结果数}}{\\text{全部结果数}}"];
  }

  return [];
};

const buildQualityReportMarkdown = ({ issues, statusMeta }) => {
  const riskLines =
    issues.length > 0
      ? issues
          .map(
            (issue, index) =>
              `${index + 1}. 错误类型：${issue.type}\n   ${issue.location ? `位置：${issue.location}\n   ` : ""}问题：${issue.result}`,
          )
          .join("\n")
      : "1. 未发现明显错误。";

  return [
    "### 质检结果",
    `- ${statusMeta.label}`,
    "",
    "### 风险项",
    riskLines,
    "",
    `> 质检结论：${statusMeta.resultLabel}`,
  ].join("\n");
};

const buildQualityCheckPatch = ({ prompt, question }) => {
  const issues = collectQuestionQualityIssues(question);
  const statusMeta = getQualityStatusMeta(issues);

  return {
    aiQualityCheck: {
      checkedAt: new Date().toISOString(),
      issueCount: issues.length,
      issueTypes: [...new Set(issues.map((item) => item.type))],
      issues,
      label: statusMeta.label,
      promptSummary: summarizePrompt(prompt),
      reportMarkdown: buildQualityReportMarkdown({
        issues,
        statusMeta,
      }),
      resultLabel: statusMeta.resultLabel,
      status: statusMeta.status,
      formulaList: extractFormulaList(question),
    },
  };
};

/**
 *
 * @param root0
 * @param root0.questions
 * @param root0.prompt
 */
export async function batchQualityCheckQuestions({ questions, prompt }) {
  await wait(800);

  const patches = (Array.isArray(questions) ? questions : []).map(
    (question) => ({
      draftId: question.draftId,
      patch: buildQualityCheckPatch({
        prompt,
        question,
      }),
    }),
  );

  const summary = patches.reduce(
    (result, item) => {
      const status = item.patch?.aiQualityCheck?.status;

      if (status === QUALITY_CHECK_STATUS.HIGH) {
        result.highRiskCount += 1;
      } else if (status === QUALITY_CHECK_STATUS.LOW) {
        result.lowRiskCount += 1;
      } else {
        result.passCount += 1;
      }

      return result;
    },
    {
      highRiskCount: 0,
      lowRiskCount: 0,
      passCount: 0,
    },
  );

  return {
    patches,
    summary,
  };
}

/**
 *
 * @param root0
 * @param root0.question
 * @param root0.model
 * @param root0.prompt
 * @param root0.targetFields
 */
export async function enhanceSingleQuestionFields({
  question,
  model,
  prompt,
  targetFields,
}) {
  await wait(500);

  const fields =
    Array.isArray(targetFields) && targetFields.length > 0
      ? targetFields
      : inferSingleQuestionFields(prompt);
  const patch = {};

  if (Number(question && question.type) === 6) {
    if (fields.includes("content")) {
      patch.content = buildSingleQuestionContentPatch(question, prompt);
    }

    if (fields.includes("analysis")) {
      patch.analysis = buildMockAnalysis(question, model, prompt);
    }

    if (fields.includes("questionLevel")) {
      Object.assign(patch, buildSingleQuestionLevelPatch(question));
    }

    const currentSubQuestions = Array.isArray(
      question && question.sonQuestionList,
    )
      ? question.sonQuestionList
      : [];
    const nextSubQuestions = currentSubQuestions.map((subQuestion) => {
      const subQuestionPatch = {};

      if (fields.includes("content")) {
        subQuestionPatch.content = buildSingleQuestionContentPatch(
          subQuestion,
          prompt,
        );
      }

      if (fields.includes("optionList")) {
        subQuestionPatch.optionList = buildSingleQuestionOptionPatch(
          subQuestion,
          prompt,
        );
      }

      if (fields.includes("answer")) {
        Object.assign(
          subQuestionPatch,
          buildSingleQuestionAnswerPatch(subQuestion),
        );
      }

      if (fields.includes("analysis")) {
        subQuestionPatch.analysis = buildMockAnalysis(
          subQuestion,
          model,
          prompt,
        );
      }

      if (fields.includes("questionLevel")) {
        Object.assign(
          subQuestionPatch,
          buildSingleQuestionLevelPatch(subQuestion),
        );
      }

      return Object.keys(subQuestionPatch).length > 0
        ? { ...subQuestion, ...subQuestionPatch }
        : subQuestion;
    });

    if (
      JSON.stringify(nextSubQuestions) !== JSON.stringify(currentSubQuestions)
    ) {
      patch.sonQuestionList = nextSubQuestions;
    }

    return {
      draftId: question.draftId,
      patch,
    };
  }

  if (fields.includes("content")) {
    patch.content = buildSingleQuestionContentPatch(question, prompt);
  }

  if (fields.includes("optionList")) {
    patch.optionList = buildSingleQuestionOptionPatch(question, prompt);
  }

  if (fields.includes("answer")) {
    Object.assign(patch, buildSingleQuestionAnswerPatch(question));
  }

  if (fields.includes("analysis")) {
    patch.analysis = buildMockAnalysis(question, model, prompt);
  }

  if (fields.includes("questionLevel")) {
    Object.assign(patch, buildSingleQuestionLevelPatch(question));
  }

  return {
    draftId: question.draftId,
    patch,
  };
}
