import { trans } from "../../../../utils/i18n";
import {
  buildGapFillingAnswerTransport,
  getGapFillingAnswerGroups,
} from "../../domain/questionTaskGapFillingAnswer";
import {
  QUESTION_TYPE_ANSWER,
  QUESTION_TYPE_BLANK,
  QUESTION_TYPE_CHOICE,
  QUESTION_TYPE_COMBINATION,
  QUESTION_TYPE_FREE_COMBINATION,
  QUESTION_TYPE_JUDGE,
  QUESTION_TYPE_MULTIPLE_CHOICE,
  QUESTION_TYPE_MULTIPLE_VOTE as QUESTION_TYPE_OTHER_B,
  QUESTION_TYPE_SINGLE_VOTE as QUESTION_TYPE_OTHER_A,
} from "../../domain/questionTaskShared";
import {
  getQuestionAnswerText,
  getQuestionDisplayNumber,
  getQuestionScoreText,
} from "../../domain/questionTaskViewModel";
export {
  QUESTION_TYPE_ANSWER,
  QUESTION_TYPE_BLANK,
  QUESTION_TYPE_CHOICE,
  QUESTION_TYPE_COMBINATION,
  QUESTION_TYPE_JUDGE,
  QUESTION_TYPE_MULTIPLE_CHOICE,
} from "../../domain/questionTaskShared";

export const MIN_ZOOM = 80;
export const MAX_ZOOM = 180;
export const ZOOM_STEP = 10;
export const ORIGINAL_ZOOM_SCALE = 100;
export const ANSWER_GROUP_SIZE = 5;
export const FIRST_CHOICE_CODE_POINT = 65;
export const ANSWER_SECTION_CONFIG = [
  {
    key: "choice",
    label: trans("global.radio", "选择题"),
    mode: "compact",
    types: [QUESTION_TYPE_CHOICE, QUESTION_TYPE_MULTIPLE_CHOICE],
  },
  {
    key: "blank",
    label: trans("global.pack", "填空题"),
    mode: "detail",
    types: [QUESTION_TYPE_BLANK],
  },
  {
    key: "judge",
    label: trans("global.judge", "判断题"),
    mode: "compact",
    types: [QUESTION_TYPE_JUDGE],
  },
  {
    key: "answer",
    label: trans("global.ask", "解答题"),
    mode: "detail",
    types: [QUESTION_TYPE_ANSWER],
  },
  {
    key: "combination",
    label: trans("global.combination", "组合题"),
    mode: "detail",
    types: [QUESTION_TYPE_COMBINATION],
  },
  {
    key: "other",
    label: trans("global.other", "其他题"),
    mode: "detail",
    types: [
      QUESTION_TYPE_FREE_COMBINATION,
      QUESTION_TYPE_OTHER_A,
      QUESTION_TYPE_OTHER_B,
    ],
  },
];
export const QUESTION_CATEGORY = [
  {
    value: "question",
    label: trans("questionTask.questionBox", "题目框"),
    color: "#1677ff",
  },
];
export const DUAL_COLUMN_EDIT_SECTION_KEYS = ["choice", "judge"];

export const clampZoom = (value) =>
  Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));

export const isEditableTarget = (target) => {
  if (!target) {
    return false;
  }

  const tagName = String(target.tagName || "").toLowerCase();
  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    target.isContentEditable ||
    !!(target.closest && target.closest("[contenteditable='true']"))
  );
};

export const stripHtml = (value) =>
  String(value || "")
    .replaceAll(/<[^>]*>/g, "")
    .trim();

export const getAnswerText = (question) => {
  const answer = getQuestionAnswerText(question);

  if (Array.isArray(answer)) {
    return answer.join("；");
  }

  return stripHtml(answer);
};

export const getAnalysisText = (question) =>
  stripHtml(question && question.analysis);

const hasRichPreviewHtml = (value) =>
  !!stripHtml(value) || /<img\b/i.test(String(value || ""));

const getAnswerHtml = (question) => {
  if (Number(question && question.type) === QUESTION_TYPE_BLANK) {
    return "";
  }

  if (
    question &&
    question.answer !== undefined &&
    question.answer !== null &&
    hasRichPreviewHtml(question.answer)
  ) {
    return String(question.answer).trim();
  }

  return "";
};

const getAnalysisHtml = (question) =>
  hasRichPreviewHtml(question && question.analysis)
    ? String(question.analysis).trim()
    : "";

export const normalizeScoreText = (value) => String(value || "").trim();

export const toQuestionScorePatchValue = (value) => {
  const normalizedValue = normalizeScoreText(value);

  if (!normalizedValue) {
    return "";
  }

  const numericValue = Number(normalizedValue);

  return Number.isFinite(numericValue) ? numericValue : normalizedValue;
};

export const escapeHtml = (value) =>
  String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

export const normalizeEditorText = (value) =>
  String(value || "")
    .replaceAll("\r\n", "\n")
    .trim();

const normalizeAnswerHtml = (value) =>
  String(value || "")
    .replaceAll("\u200B", "")
    .trim();

const normalizeBlankDraftAnswerValue = (value) => normalizeAnswerHtml(value);

export const htmlToEditorText = (value) => {
  const html = String(value || "")
    .replaceAll(/<\/(?:p|div|li|h[1-6])>/gi, "\n")
    .replaceAll(/<br\s*\/?>/gi, "\n");

  if (typeof document === "undefined") {
    return stripHtml(html)
      .replaceAll(/\n{3,}/g, "\n\n")
      .trim();
  }

  const temporaryNode = document.createElement("div");
  temporaryNode.innerHTML = html;

  return String(temporaryNode.textContent || "")
    .replaceAll("\u00A0", " ")
    .replaceAll(/\n{3,}/g, "\n\n")
    .trim();
};

export const textToHtml = (value) => {
  const lines = normalizeEditorText(value)
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.length > 0
    ? lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("")
    : "";
};

export const splitAnswerValues = (value) =>
  normalizeEditorText(value)
    .split(/[\n;；]+/)
    .map((item) => item.trim())
    .filter(Boolean);

const normalizeBlankDraftAnswerList = (answers) => {
  const normalizedAnswers = (Array.isArray(answers) ? answers : []).map(
    (answer) => normalizeBlankDraftAnswerValue(answer),
  );

  return normalizedAnswers.length > 0 ? normalizedAnswers : [""];
};

export const buildBlankAnswerDraftGroups = (gapFillingAnswer) => {
  const answerGroups = getGapFillingAnswerGroups(gapFillingAnswer);

  if (answerGroups.length === 0) {
    return [{ answers: [""] }];
  }

  return answerGroups.map((group) => ({
    answers: normalizeBlankDraftAnswerList(group),
  }));
};

export const normalizeBlankAnswerDraftGroups = (blankAnswerGroups) => {
  const normalizedGroups = (
    Array.isArray(blankAnswerGroups) ? blankAnswerGroups : []
  ).map((group) => ({
    answers: normalizeBlankDraftAnswerList(group && group.answers),
  }));

  return normalizedGroups.length > 0 ? normalizedGroups : [{ answers: [""] }];
};

export const normalizeJudgeAnswer = (value) => {
  const normalizedValue = normalizeEditorText(value);
  const normalizedLowerCase = normalizedValue.toLowerCase();

  if (
    ["正确", "对", "true", "t", "yes", "y", "√"].includes(normalizedValue) ||
    ["true", "t", "yes", "y"].includes(normalizedLowerCase)
  ) {
    return "true";
  }

  if (
    ["错误", "错", "false", "f", "no", "n", "×"].includes(normalizedValue) ||
    ["false", "f", "no", "n"].includes(normalizedLowerCase)
  ) {
    return "false";
  }

  return normalizedValue;
};

const buildBaseQuestionEditorDraft = (question) => ({
  analysisText: htmlToEditorText(question && question.analysis),
  scoreText: getQuestionScoreText(question),
});

const getScoreNumber = (value) => {
  const score = Number(String(value || "").trim());

  return Number.isFinite(score) ? score : 0;
};

const formatScoreText = (value) =>
  Number.isFinite(value)
    ? String(Number.parseFloat(value.toFixed(10))).replace(/\.0$/, "")
    : "";

export const getSubQuestionScoreSumText = (subQuestionDrafts) => {
  const normalizedSubQuestionDrafts = Array.isArray(subQuestionDrafts)
    ? subQuestionDrafts
    : [];

  return normalizedSubQuestionDrafts.length > 0
    ? formatScoreText(
        normalizedSubQuestionDrafts.reduce(
          (total, subQuestionDraft) =>
            total +
            getScoreNumber(subQuestionDraft && subQuestionDraft.scoreText),
          0,
        ),
      )
    : "";
};

const buildCombinationQuestionEditorDraft = (question) => {
  const subQuestionDrafts = (
    Array.isArray(question && question.sonQuestionList)
      ? question.sonQuestionList
      : []
  ).map((subQuestion) => buildQuestionEditorDraft(subQuestion));

  return {
    ...buildBaseQuestionEditorDraft(question),
    // 组合题父题分值只是子题分值的汇总，进入编辑态时即以子题为权威数据源。
    scoreText: getSubQuestionScoreSumText(subQuestionDrafts),
    subQuestionDrafts,
  };
};

const buildBlankQuestionEditorDraft = (question) => ({
  ...buildBaseQuestionEditorDraft(question),
  blankAnswerGroups: buildBlankAnswerDraftGroups(
    question && question.gapFillingAnswer,
  ),
});

const buildDiscreteAnswerQuestionEditorDraft = (question) => ({
  ...buildBaseQuestionEditorDraft(question),
  answerText: getAnswerText(question),
});

const buildDefaultQuestionEditorDraft = (question) => ({
  ...buildBaseQuestionEditorDraft(question),
  answerHtml: normalizeAnswerHtml(question && question.answer),
});

export const buildQuestionEditorDraft = (question) => {
  const type = Number(question && question.type);

  if (type === QUESTION_TYPE_COMBINATION) {
    return buildCombinationQuestionEditorDraft(question);
  }

  if (type === QUESTION_TYPE_BLANK) {
    return buildBlankQuestionEditorDraft(question);
  }

  if (
    type === QUESTION_TYPE_CHOICE ||
    type === QUESTION_TYPE_MULTIPLE_CHOICE ||
    type === QUESTION_TYPE_JUDGE
  ) {
    return buildDiscreteAnswerQuestionEditorDraft(question);
  }

  return buildDefaultQuestionEditorDraft(question);
};

export const getQuestionAnswerDraftField = (question) => {
  const type = Number(question && question.type);

  return type === QUESTION_TYPE_CHOICE ||
    type === QUESTION_TYPE_MULTIPLE_CHOICE ||
    type === QUESTION_TYPE_JUDGE
    ? "answerText"
    : "answerHtml";
};

export const buildReferenceDraftMap = (questions) =>
  Object.fromEntries(
    (Array.isArray(questions) ? questions : []).map((question) => [
      question.draftId,
      buildQuestionEditorDraft(question),
    ]),
  );

export const getAnswerSectionConfig = (questionType) =>
  ANSWER_SECTION_CONFIG.find((section) =>
    section.types.includes(questionType),
  ) || ANSWER_SECTION_CONFIG.at(-1);

const appendOrderedAnswerSection = (
  sections,
  question,
  questionIndex,
  buildSectionItem,
) => {
  const type = Number(question && question.type);
  const previousSection = sections.at(-1);
  const shouldStartSection = !previousSection || previousSection.type !== type;
  const sectionConfig = getAnswerSectionConfig(type);
  const currentSection = shouldStartSection
    ? {
        ...sectionConfig,
        items: [],
        key: `${sectionConfig.key}-${sections.length + 1}`,
        rangeLabel: "",
        sectionTypeKey: sectionConfig.key,
        totalCount: 0,
        type,
      }
    : previousSection;
  const sectionItem = buildSectionItem(question, questionIndex);
  const nextSection = {
    ...currentSection,
    items: [...currentSection.items, sectionItem],
    totalCount: currentSection.totalCount + (sectionItem.unitCount || 1),
  };

  return shouldStartSection
    ? [...sections, nextSection]
    : [...sections.slice(0, -1), nextSection];
};

const buildOrderedAnswerSectionsFromIndex = (
  questions,
  buildSectionItem,
  questionIndex,
  sections,
) =>
  questionIndex >= questions.length
    ? sections
    : buildOrderedAnswerSectionsFromIndex(
        questions,
        buildSectionItem,
        questionIndex + 1,
        appendOrderedAnswerSection(
          sections,
          questions.slice(questionIndex, questionIndex + 1).shift(),
          questionIndex,
          buildSectionItem,
        ),
      );

export const buildOrderedAnswerSections = (questions, buildSectionItem) =>
  buildOrderedAnswerSectionsFromIndex(
    Array.isArray(questions) ? questions : [],
    buildSectionItem,
    0,
    [],
  );

export const buildEditableAnswerSections = (questions) =>
  buildOrderedAnswerSections(questions, (question) => ({
    draftId: question.draftId,
    question,
    unitCount:
      Number(question && question.type) === QUESTION_TYPE_COMBINATION
        ? Math.max(
            (Array.isArray(question && question.sonQuestionList)
              ? question.sonQuestionList
              : []
            ).length,
            1,
          )
        : 1,
  })).map((section) => ({
    ...section,
    rangeLabel: buildRangeLabel(
      section.items.map(({ question }, questionIndex) => ({
        number: getQuestionDisplayNumber(question, questionIndex),
      })),
    ),
  }));

const buildBaseReferencePatch = (question, draft) => {
  const nextAnalysisText = normalizeEditorText(draft.analysisText);
  const currentAnalysisText = htmlToEditorText(question.analysis);
  const currentScoreText = getQuestionScoreText(question);
  const nextScoreText = normalizeScoreText(draft.scoreText);
  const patch = {};

  if (currentAnalysisText !== nextAnalysisText) {
    patch.analysis = textToHtml(nextAnalysisText);
  }

  if (currentScoreText !== nextScoreText) {
    patch.questionScore = toQuestionScorePatchValue(nextScoreText);
  }

  return patch;
};

const buildCombinationReferencePatch = (question, draft) => {
  const patch = buildBaseReferencePatch(question, draft);
  const currentSubQuestions = Array.isArray(question.sonQuestionList)
    ? question.sonQuestionList
    : [];
  const nextSubQuestions = currentSubQuestions.map(
    (subQuestion, subQuestionIndex) => {
      const subQuestionPatch = buildQuestionReferencePatch(
        subQuestion,
        Array.isArray(draft.subQuestionDrafts)
          ? draft.subQuestionDrafts.at(subQuestionIndex)
          : undefined,
      );

      return Object.keys(subQuestionPatch).length > 0
        ? { ...subQuestion, ...subQuestionPatch }
        : subQuestion;
    },
  );

  if (
    JSON.stringify(nextSubQuestions) !== JSON.stringify(currentSubQuestions)
  ) {
    patch.sonQuestionList = nextSubQuestions;
  }

  return patch;
};

const buildBlankReferenceGapFillingAnswer = (answerGroups, isOrder) => {
  const normalizedAnswerGroups = normalizeBlankAnswerDraftGroups(answerGroups);

  return buildGapFillingAnswerTransport({
    answerGroups: normalizedAnswerGroups.map((group) => group.answers),
    isOrder,
  });
};

const buildBlankReferencePatch = (question, draft, patch) => {
  // 批量编辑内部直接维护“空位 -> 可接受答案列表”结构，保存时再统一回写兼容的 transport 形态。
  const currentGapFillingAnswer = buildBlankReferenceGapFillingAnswer(
    buildBlankAnswerDraftGroups(question && question.gapFillingAnswer),
    question?.gapFillingAnswer?.isOrder,
  );
  const nextGapFillingAnswer = buildBlankReferenceGapFillingAnswer(
    draft && draft.blankAnswerGroups,
    question?.gapFillingAnswer?.isOrder,
  );

  if (
    JSON.stringify(currentGapFillingAnswer) !==
    JSON.stringify(nextGapFillingAnswer)
  ) {
    patch.gapFillingAnswer = nextGapFillingAnswer;
  }

  return patch;
};

const getCurrentJudgeAnswer = (question) => {
  if (question.answer === true || question.answer === "true") {
    return "true";
  }

  if (question.answer === false || question.answer === "false") {
    return "false";
  }

  return normalizeEditorText(question.answer);
};

const buildJudgeReferencePatch = (question, draft, patch) => {
  const currentAnswer = getCurrentJudgeAnswer(question);
  const nextAnswer = normalizeJudgeAnswer(draft.answerText);

  if (currentAnswer !== nextAnswer) {
    patch.answer = nextAnswer;
  }

  return patch;
};

const buildDiscreteAnswerReferencePatch = (question, draft, patch) => {
  const currentAnswerText = getAnswerText(question);
  const nextAnswerText = normalizeEditorText(draft.answerText);

  if (currentAnswerText !== nextAnswerText) {
    patch.answer = nextAnswerText;
  }

  return patch;
};

const buildTextAnswerReferencePatch = (question, draft, patch) => {
  const currentAnswerHtml = normalizeAnswerHtml(question.answer);
  const nextAnswerHtml = normalizeAnswerHtml(draft.answerHtml);

  if (currentAnswerHtml !== nextAnswerHtml) {
    patch.answer = nextAnswerHtml;
  }

  return patch;
};

// 批量编辑保存时只回传发生变化的答案、解析和分数字段，避免覆盖题目其他业务状态。
export const buildQuestionReferencePatch = (question, draft) => {
  if (!question || !draft) {
    return {};
  }

  if (Number(question.type) === QUESTION_TYPE_COMBINATION) {
    return buildCombinationReferencePatch(question, draft);
  }

  const patch = buildBaseReferencePatch(question, draft);

  if (Number(question.type) === QUESTION_TYPE_BLANK) {
    return buildBlankReferencePatch(question, draft, patch);
  }

  if (Number(question.type) === QUESTION_TYPE_JUDGE) {
    return buildJudgeReferencePatch(question, draft, patch);
  }

  if (
    Number(question.type) === QUESTION_TYPE_CHOICE ||
    Number(question.type) === QUESTION_TYPE_MULTIPLE_CHOICE
  ) {
    return buildDiscreteAnswerReferencePatch(question, draft, patch);
  }

  return buildTextAnswerReferencePatch(question, draft, patch);
};

export const chunkArray = (items, size) =>
  Array.from(
    {
      length: Math.ceil((Array.isArray(items) ? items : []).length / size),
    },
    (item, groupIndex) =>
      (Array.isArray(items) ? items : []).slice(
        groupIndex * size,
        (groupIndex + 1) * size,
      ),
  );

export const splitItemsIntoColumns = (items, columnCount = 2) => {
  const normalizedItems = Array.isArray(items) ? items : [];

  if (normalizedItems.length === 0 || columnCount <= 1) {
    return [normalizedItems];
  }

  const columnSize = Math.ceil(normalizedItems.length / columnCount);

  return Array.from({ length: columnCount }, (item, columnIndex) =>
    normalizedItems.slice(
      columnIndex * columnSize,
      (columnIndex + 1) * columnSize,
    ),
  ).filter((columnItems) => columnItems.length);
};

export const buildRangeLabel = (items) => {
  if (items.length === 0) {
    return "";
  }

  const numbers = items
    .map((item) => Number(item.number))
    .filter((number) => Number.isFinite(number));

  if (numbers.length === 0) {
    return "";
  }

  const isContinuous = numbers.every((number, index) =>
    index === 0 ? true : number === numbers[index - 1] + 1,
  );

  return isContinuous && numbers.length > 1
    ? `${numbers[0]}-${numbers.at(-1)}`
    : numbers.join("、");
};

export const formatCompactAnswerText = (items) => {
  const answers = items.map((item) => item.answer);
  const isSingleCharAnswers = answers.every((answer) =>
    /^[A-Za-z]$/.test(answer),
  );

  return isSingleCharAnswers ? answers.join("") : answers.join(" / ");
};

export const canUseCompactAnswerRow = (items) =>
  items.every((item) => item.answer) && items.every((item) => !item.analysis);

const hasAnswerPreviewContent = (item) =>
  Boolean(
    item &&
    (item.answer ||
      item.answerHtml ||
      (Array.isArray(item.answerGroups) && item.answerGroups.length > 0) ||
      item.analysis ||
      item.analysisHtml),
  );

const hasCombinationAnswerPreviewContent = (item) =>
  Boolean(
    item &&
    (item.analysis ||
      (Array.isArray(item.subQuestions) ? item.subQuestions : []).some(
        (subQuestion) => hasAnswerPreviewContent(subQuestion),
      )),
  );

const getAnswerPreviewItems = (section) => {
  const items = Array.isArray(section && section.items) ? section.items : [];

  // 参考答案只展示已经识别出的答案/解析；组合题没有父级解析且子题都空时，整题不进入预览。
  return Number(section && section.type) === QUESTION_TYPE_COMBINATION
    ? items.filter((item) => hasCombinationAnswerPreviewContent(item))
    : items.filter((item) => hasAnswerPreviewContent(item));
};

const countAnswerPreviewUnits = (items, index = 0, totalCount = 0) => {
  const normalizedItems = Array.isArray(items) ? items : [];

  if (index >= normalizedItems.length) {
    return totalCount;
  }

  const item = normalizedItems.at(index) || {};

  return countAnswerPreviewUnits(
    normalizedItems,
    index + 1,
    totalCount + (item.unitCount || 1),
  );
};

const buildAnswerSectionGroups = (section, previewItems) =>
  Number(section && section.type) === QUESTION_TYPE_COMBINATION
    ? previewItems.map((item) => ({
        items: [item],
        key: `${section.key}-${item.draftId}`,
        rangeLabel: String(item.number),
      }))
    : chunkArray(previewItems, ANSWER_GROUP_SIZE).map(
        (groupItems, groupIndex) => ({
          items: groupItems,
          key: `${section.key}-${groupIndex + 1}`,
          rangeLabel: buildRangeLabel(groupItems),
        }),
      );

// 参考答案预览以题型连续分段为稳定中间形态，供普通预览和批量编辑共用。
export const buildAnswerSections = (questions) => {
  return buildOrderedAnswerSections(questions, (question, index) => {
    const questionNumber = getQuestionDisplayNumber(question, index);

    if (Number(question && question.type) === QUESTION_TYPE_COMBINATION) {
      const subQuestions = Array.isArray(question && question.sonQuestionList)
        ? question.sonQuestionList
        : [];

      return {
        analysis: getAnalysisText(question),
        analysisHtml: getAnalysisHtml(question),
        content: stripHtml(question && question.content),
        draftId: question.draftId,
        kind: "combination",
        number: questionNumber,
        score: getQuestionScoreText(question),
        subQuestions: subQuestions.map((subQuestion, subQuestionIndex) => ({
          analysis: getAnalysisText(subQuestion),
          analysisHtml: getAnalysisHtml(subQuestion),
          answer: getAnswerText(subQuestion),
          answerGroups: getGapFillingAnswerGroups(
            subQuestion?.gapFillingAnswer,
          ),
          answerHtml: getAnswerHtml(subQuestion),
          number: `${questionNumber}-${subQuestionIndex + 1}`,
          score: getQuestionScoreText(subQuestion),
          type: Number(subQuestion.type),
          typeLabel: subQuestion.typeLabel,
        })),
        type: Number(question.type),
        typeLabel: question.typeLabel,
        unitCount: Math.max(subQuestions.length, 1),
      };
    }

    return {
      analysis: getAnalysisText(question),
      analysisHtml: getAnalysisHtml(question),
      answer: getAnswerText(question),
      answerGroups: getGapFillingAnswerGroups(question?.gapFillingAnswer),
      answerHtml: getAnswerHtml(question),
      draftId: question.draftId,
      kind: "question",
      number: questionNumber,
      score: getQuestionScoreText(question),
      type: Number(question.type),
      typeLabel: question.typeLabel,
      unitCount: 1,
    };
  })
    .map((section) => {
      const previewItems = getAnswerPreviewItems(section);

      return {
        ...section,
        groups: buildAnswerSectionGroups(section, previewItems),
        items: previewItems,
        rangeLabel: buildRangeLabel(previewItems),
        totalCount: countAnswerPreviewUnits(previewItems),
      };
    })
    .filter(
      (section) => Array.isArray(section.groups) && section.groups.length > 0,
    );
};

export const canUsePreviewDualColumnLayout = (section) =>
  !!(
    section &&
    Array.isArray(section.groups) &&
    section.groups.length > 1 &&
    section.groups.every(
      (group) =>
        Array.isArray(group.items) &&
        group.items.every((item) => !item.analysis),
    )
  );

export const getDraftScoreText = (question, draftMap) =>
  draftMap &&
  question &&
  draftMap[question.draftId] &&
  Object.prototype.hasOwnProperty.call(draftMap[question.draftId], "scoreText")
    ? normalizeScoreText(draftMap[question.draftId].scoreText)
    : getQuestionScoreText(question);

export const getSectionUniformScoreText = (items, draftMap) => {
  const scores = (Array.isArray(items) ? items : []).map((question) =>
    getDraftScoreText(question, draftMap),
  );

  if (scores.length === 0 || scores.some((score) => !score)) {
    return "";
  }

  return scores.every((score) => score === scores[0]) ? scores[0] : "";
};

export const buildSectionScorePlaceholder = (items, draftMap) => {
  const scores = (Array.isArray(items) ? items : [])
    .map((question) => getDraftScoreText(question, draftMap))
    .filter(Boolean);

  return scores.length > 0
    ? trans("questionTask.answerSheetMixedScore", "混合")
    : trans("questionTask.answerSheetSameScore", "统一分");
};

export const buildBlankCountKey = (draftId, subQuestionIndex) =>
  Number.isFinite(Number(subQuestionIndex))
    ? `${draftId}__${subQuestionIndex}`
    : draftId;

const buildQuestionBlankCountEntries = (question) => {
  if (Number(question && question.type) === QUESTION_TYPE_BLANK) {
    return [
      [
        buildBlankCountKey(question.draftId),
        buildBlankAnswerDraftGroups(question && question.gapFillingAnswer)
          .length,
      ],
    ];
  }

  if (Number(question && question.type) !== QUESTION_TYPE_COMBINATION) {
    return [];
  }

  return (
    Array.isArray(question.sonQuestionList) ? question.sonQuestionList : []
  )
    .map((subQuestion, subQuestionIndex) =>
      Number(subQuestion && subQuestion.type) === QUESTION_TYPE_BLANK
        ? [
            buildBlankCountKey(question.draftId, subQuestionIndex),
            buildBlankAnswerDraftGroups(
              subQuestion && subQuestion.gapFillingAnswer,
            ).length,
          ]
        : undefined,
    )
    .filter(Boolean);
};

export const buildBlankCountMap = (questions) =>
  Object.fromEntries(
    (Array.isArray(questions) ? questions : []).flatMap((question) =>
      buildQuestionBlankCountEntries(question),
    ),
  );

export const splitDraftAnswerSlots = (value) => {
  const normalizedValue = String(value || "").replaceAll("\r\n", "\n");

  if (!normalizedValue) {
    return [];
  }

  return normalizedValue.split(/[\n;；]/).map((item) => item.trim());
};

export const getChoiceAnswerValues = (value) =>
  [
    ...normalizeEditorText(value)
      .toUpperCase()
      .replaceAll(/[^A-Z]/g, ""),
  ].filter(Boolean);

export const stopPropagation = (event) => {
  event.stopPropagation();
};
