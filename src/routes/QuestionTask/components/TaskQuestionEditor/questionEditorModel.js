import { trans } from "../../../../utils/i18n";
import {
  getQuestionLevelLabel,
  QUESTION_LEVEL_NORMAL,
} from "../../../../utils/questionDifficulty.js";
import {
  buildGapFillingAnswerTransport,
  getGapFillingAnswerGroups,
  hasGapFillingAnswerContent,
} from "../../domain/questionTaskGapFillingAnswer";
import {
  DEFAULT_MANUAL_OPTION_KEYS,
  getOptionKey,
  isChoiceQuestionType as isSharedChoiceQuestionType,
  isRequiredChoiceAnswerType as isSharedRequiredChoiceAnswerType,
  QUESTION_TYPE_ANSWER,
  QUESTION_TYPE_BLANK,
  QUESTION_TYPE_CHOICE,
  QUESTION_TYPE_COMBINATION,
  QUESTION_TYPE_JUDGE,
  QUESTION_TYPE_MULTIPLE_CHOICE,
  QUESTION_TYPE_MULTIPLE_VOTE,
  QUESTION_TYPE_SINGLE_VOTE,
} from "../../domain/questionTaskShared";

export {
  QUESTION_TYPE_ANSWER,
  QUESTION_TYPE_BLANK,
  QUESTION_TYPE_CHOICE,
  QUESTION_TYPE_COMBINATION,
  QUESTION_TYPE_JUDGE,
  QUESTION_TYPE_MULTIPLE_CHOICE,
  QUESTION_TYPE_MULTIPLE_VOTE,
  QUESTION_TYPE_SINGLE_VOTE,
} from "../../domain/questionTaskShared";

const ZERO_WIDTH_SPACE = "\u200B";
const RANDOM_ID_RADIX = 16;
const RANDOM_ID_START = 2;
const RANDOM_ID_END = 10;
const MIN_OPTION_COUNT = 2;
const MAX_OPTION_COUNT = 10;
const DEFAULT_QUESTION_LABEL = trans(
  "questionTask.currentQuestionLabel",
  "当前题",
);
const SET_ANSWER_MESSAGE = trans("singleInput.setAnswer", "请设置题目答案哦~");

export const QUESTION_TYPE_OPTIONS = [
  { value: QUESTION_TYPE_CHOICE, label: trans("global.radio", "单选题") },
  {
    value: QUESTION_TYPE_MULTIPLE_CHOICE,
    label: trans("global.check", "多选题"),
  },
  { value: QUESTION_TYPE_BLANK, label: trans("global.pack", "填空题") },
  { value: QUESTION_TYPE_JUDGE, label: trans("global.judge", "判断题") },
  { value: QUESTION_TYPE_ANSWER, label: trans("global.ask", "问答题") },
  {
    value: QUESTION_TYPE_COMBINATION,
    label: trans("global.combination", "组合题"),
  },
  {
    value: QUESTION_TYPE_SINGLE_VOTE,
    label: trans("global.singleVote", "单选投票题"),
  },
  {
    value: QUESTION_TYPE_MULTIPLE_VOTE,
    label: trans("global.multipleVote", "多选投票题"),
  },
];

const createEditorId = (prefix) => {
  const randomSuffix = Math.random()
    .toString(RANDOM_ID_RADIX)
    .slice(RANDOM_ID_START, RANDOM_ID_END);
  return `${prefix}-${Date.now()}-${randomSuffix}`;
};

export const toArray = (value) => {
  if (Array.isArray(value)) {
    return value.filter((item) => item !== undefined);
  }
  if (value === undefined || value === "") {
    return [];
  }
  return [value];
};

export const normalizeRichTextHtml = (value) => {
  const html = String(value || "")
    .replaceAll(ZERO_WIDTH_SPACE, "")
    .trim();
  if (!html) {
    return "";
  }

  const visibleText = html
    .replaceAll(/<[^>]*>/g, "")
    .replaceAll("&nbsp;", "")
    .trim();
  return visibleText || hasRichMediaContent(html) ? html : "";
};

export const stripRichText = (value) =>
  String(value || "")
    .replaceAll(/<[^>]*>/g, "")
    .replaceAll("&nbsp;", " ")
    .trim();

const hasRichMediaContent = (value) => /<img\b/i.test(String(value || ""));

export const hasRichTextContent = (value) =>
  !!stripRichText(value) || hasRichMediaContent(value);

const isEmptyBlankAnswerValue = (value) =>
  value === undefined || (typeof value === "object" && !value);

const normalizeBlankAnswerContent = (value) =>
  isEmptyBlankAnswerValue(value) ? "" : String(value).trim();

export const normalizeIdValue = (value) => {
  if (
    value === undefined ||
    value === "" ||
    (typeof value === "object" && !value)
  ) {
    return;
  }

  const text = String(value).trim();
  if (!text) {
    return;
  }

  const lastPart = text.split("-").pop();
  const id = Number(/^\d+$/.test(lastPart) ? lastPart : text);

  if (Number.isFinite(id)) {
    return id;
  }
};

export const normalizeIdList = (value) =>
  [...new Set(toArray(value).map((item) => normalizeIdValue(item)))].filter(
    (item) => item !== undefined,
  );

const getQuestionType = (value) => {
  const type = Number(value);
  return QUESTION_TYPE_OPTIONS.some((item) => item.value === type)
    ? type
    : QUESTION_TYPE_ANSWER;
};

export const getQuestionTypeLabel = (type) => {
  const option = QUESTION_TYPE_OPTIONS.find(
    (item) => item.value === Number(type),
  );
  return option ? option.label : trans("global.ask", "问答题");
};

export const isChoiceQuestionType = (type) => isSharedChoiceQuestionType(type);

export const isRequiredChoiceAnswerType = (type) =>
  isSharedRequiredChoiceAnswerType(type);

export const createOptionDraft = (index = 0, option = {}) => {
  const key = option.key || getOptionKey(index);
  return {
    editorId: option.editorId || createEditorId("option"),
    key,
    answers: normalizeRichTextHtml(option.answers),
    knowledgeIds: normalizeIdList(option.knowledgeIds),
  };
};

export const createBlankAnswerDraft = (content = "") => ({
  content: normalizeBlankAnswerContent(content),
  editorId: createEditorId("blank-answer"),
});

export const createBlankGroupDraft = (answers = []) => ({
  // 后端可能返回 null 或空富文本，初始化时不生成空答案项，避免 Select 渲染空白标签。
  answers: toArray(answers)
    .map((answer) => createBlankAnswerDraft(answer))
    .filter((answer) => hasRichTextContent(answer.content)),
  editorId: createEditorId("blank-group"),
});

const normalizeBlankGroups = (gapFillingAnswer) => {
  if (
    gapFillingAnswer &&
    Array.isArray(gapFillingAnswer.answerGroups) &&
    gapFillingAnswer.answerGroups.length > 0
  ) {
    return gapFillingAnswer.answerGroups.map((group) => ({
      answers: toArray(group && group.answers)
        .map((answer) =>
          createBlankAnswerDraft(
            typeof answer === "object" ? answer.content : answer,
          ),
        )
        .filter((answer) => hasRichTextContent(answer.content)),
      editorId: (group && group.editorId) || createEditorId("blank-group"),
    }));
  }

  const rawAnswerGroups = getGapFillingAnswerGroups(gapFillingAnswer);

  return rawAnswerGroups.length > 0
    ? rawAnswerGroups.map((answers) => createBlankGroupDraft(answers))
    : [createBlankGroupDraft()];
};

const normalizeGapFillingAnswer = (gapFillingAnswer) => ({
  answerGroups: normalizeBlankGroups(gapFillingAnswer),
  isOrder: !!(gapFillingAnswer && gapFillingAnswer.isOrder),
});

const normalizeChoiceAnswer = (answer, options, type) => {
  const answerText = String(answer || "").toUpperCase();
  const optionKeys = new Set(options.map((option) => option.key));
  const normalizedAnswer = [...answerText]
    .filter(
      (item, index, list) =>
        optionKeys.has(item) && list.indexOf(item) === index,
    )
    .sort()
    .join("");

  return [QUESTION_TYPE_CHOICE, QUESTION_TYPE_SINGLE_VOTE].includes(
    Number(type),
  )
    ? normalizedAnswer.slice(0, 1)
    : normalizedAnswer;
};

const normalizeQuestionScore = (value) =>
  value === undefined ? "" : String(value);

const normalizeJudgeAnswer = (value) => {
  if (value === true || value === false) {
    return value;
  }

  const text = String(value || "").toLowerCase();
  if (["true", "right", "correct", "对", "正确"].includes(text)) {
    return true;
  }
  if (["false", "wrong", "incorrect", "错", "错误"].includes(text)) {
    return false;
  }

  return "";
};

const getEditorAnswer = (type, question, optionList) => {
  if (type === QUESTION_TYPE_BLANK) {
    return;
  }

  if (type === QUESTION_TYPE_JUDGE) {
    return normalizeJudgeAnswer(question.answer);
  }

  if (isChoiceQuestionType(type)) {
    return normalizeChoiceAnswer(question.answer, optionList, type);
  }

  return question.answer === undefined ? "" : question.answer;
};

const getQuestionEditorId = (question) => {
  if (question.editorId) {
    return question.editorId;
  }

  if (question.draftId) {
    return question.draftId;
  }

  return question.questionId
    ? `question-${question.questionId}`
    : createEditorId("question");
};

const normalizeSelectionIds = (selectionValue, idValue) =>
  normalizeIdList(
    selectionValue && selectionValue.length > 0 ? selectionValue : idValue,
  );

const normalizeEditorOptionList = (type, question) => {
  if (!isChoiceQuestionType(type)) {
    return [];
  }

  const optionList = toArray(question.optionList).map((option, index) =>
    createOptionDraft(index, option),
  );

  return optionList.length > 0
    ? optionList
    : DEFAULT_MANUAL_OPTION_KEYS.map((_, index) => createOptionDraft(index));
};

const getQuestionId = (question) =>
  Number.isFinite(Number(question.questionId))
    ? Number(question.questionId)
    : undefined;

const getChildEditorDrafts = (type, question) =>
  type === QUESTION_TYPE_COMBINATION
    ? toArray(question.sonQuestionList).map((childQuestion) =>
        createQuestionEditorDraft(childQuestion),
      )
    : [];

const resetAsChoiceQuestion = (baseQuestion, type) => {
  const optionList =
    baseQuestion.optionList.length > 0
      ? baseQuestion.optionList
      : DEFAULT_MANUAL_OPTION_KEYS.map((_, index) => createOptionDraft(index));

  return {
    ...baseQuestion,
    answer: normalizeChoiceAnswer(baseQuestion.answer, optionList, type),
    optionList: optionList.map((option, index) => ({
      ...option,
      key: getOptionKey(index) || option.key,
    })),
    sonQuestionList: [],
  };
};

const resetAsBlankQuestion = (baseQuestion) => ({
  ...baseQuestion,
  answer: undefined,
  optionList: [],
  sonQuestionList: [],
});

const resetAsJudgeQuestion = (baseQuestion) => ({
  ...baseQuestion,
  answer: normalizeJudgeAnswer(baseQuestion.answer),
  optionList: [],
  sonQuestionList: [],
});

const resetAsCombinationQuestion = (baseQuestion) => ({
  ...baseQuestion,
  answer: "",
  optionList: [],
  sonQuestionList:
    baseQuestion.sonQuestionList.length > 0
      ? baseQuestion.sonQuestionList
      : [createEmptyQuestionDraft(QUESTION_TYPE_CHOICE)],
});

const resetAsEssayQuestion = (baseQuestion) => ({
  ...baseQuestion,
  answer:
    baseQuestion.answer === undefined
      ? ""
      : normalizeRichTextHtml(baseQuestion.answer),
  optionList: [],
  sonQuestionList: [],
});

export const createEmptyQuestionDraft = (type = QUESTION_TYPE_CHOICE) => {
  const questionType = getQuestionType(type);
  const optionList = isChoiceQuestionType(questionType)
    ? DEFAULT_MANUAL_OPTION_KEYS.map((_, index) => createOptionDraft(index))
    : [];

  return {
    analysis: "",
    answer: questionType === QUESTION_TYPE_BLANK ? undefined : "",
    chapterIds: [],
    chapterLabels: [],
    chapterSelections: [],
    content: "",
    editorId: createEditorId("question"),
    gapFillingAnswer: normalizeGapFillingAnswer(),
    indicatorIds: [],
    indicatorLabels: [],
    knowledgeIds: [],
    knowledgeLabels: [],
    knowledgeSelections: [],
    optionKnowledgeSelections: [],
    optionList,
    questionId: undefined,
    questionLevel: QUESTION_LEVEL_NORMAL,
    questionLevelName: getQuestionLevelLabel(QUESTION_LEVEL_NORMAL),
    questionScore: "",
    sectionNumber: undefined,
    sectionTitle: "",
    sonQuestionList:
      questionType === QUESTION_TYPE_COMBINATION
        ? [createEmptyQuestionDraft(QUESTION_TYPE_CHOICE)]
        : [],
    type: questionType,
  };
};

const normalizeSectionNumber = (value) =>
  value === undefined || value === null ? undefined : Number(value);

const buildSectionDraftFields = (question = {}) => ({
  sectionNumber: normalizeSectionNumber(question.sectionNumber),
  sectionTitle: String(question.sectionTitle || "").trim(),
});

export const createQuestionEditorDraft = (question = {}) => {
  const type = getQuestionType(question.type);
  const normalizedOptionList = normalizeEditorOptionList(type, question);
  const questionLevel = Number(question.questionLevel) || QUESTION_LEVEL_NORMAL;
  const gapFillingAnswer = normalizeGapFillingAnswer(question.gapFillingAnswer);
  const answer = getEditorAnswer(type, question, normalizedOptionList);

  return {
    analysis: normalizeRichTextHtml(question.analysis),
    answer,
    chapterIds: normalizeIdList(question.chapterIds),
    chapterLabels: toArray(question.chapterLabels),
    chapterSelections: normalizeIdList(
      question.chapterSelections && question.chapterSelections.length > 0
        ? question.chapterSelections
        : question.chapterIds,
    ),
    content: normalizeRichTextHtml(question.content),
    draftId: question.draftId || "",
    editorId: getQuestionEditorId(question),
    gapFillingAnswer,
    gradeId: normalizeIdValue(question.gradeId),
    indicatorIds: normalizeIdList(question.indicatorIds),
    indicatorLabels: toArray(question.indicatorLabels),
    knowledgeIds: normalizeIdList(question.knowledgeIds),
    knowledgeLabels: toArray(question.knowledgeLabels),
    knowledgeSelections: normalizeSelectionIds(
      question.knowledgeSelections,
      question.knowledgeIds,
    ),
    optionKnowledgeSelections: toArray(question.optionKnowledgeSelections).map(
      (selection) => normalizeIdList(selection),
    ),
    optionList: normalizedOptionList,
    questionId: getQuestionId(question),
    questionLevel,
    questionLevelName:
      question.questionLevelName || getQuestionLevelLabel(questionLevel),
    questionScore: normalizeQuestionScore(question.questionScore),
    ...buildSectionDraftFields(question),
    sonQuestionList: getChildEditorDrafts(type, question),
    subjectId: normalizeIdValue(question.subjectId),
    type,
  };
};

export const resetQuestionDraftByType = (question, nextType) => {
  const type = getQuestionType(nextType);
  const baseQuestion = {
    ...question,
    analysis: normalizeRichTextHtml(question.analysis),
    answer: question.answer,
    content: normalizeRichTextHtml(question.content),
    gapFillingAnswer: normalizeGapFillingAnswer(question.gapFillingAnswer),
    optionList: toArray(question.optionList).map((option, index) =>
      createOptionDraft(index, option),
    ),
    questionLevel: Number(question.questionLevel) || QUESTION_LEVEL_NORMAL,
    questionLevelName: getQuestionLevelLabel(question.questionLevel),
    type,
  };

  if (isChoiceQuestionType(type)) {
    return resetAsChoiceQuestion(baseQuestion, type);
  }

  if (type === QUESTION_TYPE_BLANK) {
    return resetAsBlankQuestion(baseQuestion);
  }

  if (type === QUESTION_TYPE_JUDGE) {
    return resetAsJudgeQuestion(baseQuestion);
  }

  if (type === QUESTION_TYPE_COMBINATION) {
    return resetAsCombinationQuestion(baseQuestion);
  }

  return resetAsEssayQuestion(baseQuestion);
};

const rekeyOptionList = (optionList) =>
  toArray(optionList).map((option, index) => ({
    ...option,
    key: getOptionKey(index) || option.key,
  }));

export const addOptionToQuestionDraft = (question) => {
  if (!isChoiceQuestionType(question.type)) {
    return question;
  }

  if (toArray(question.optionList).length >= MAX_OPTION_COUNT) {
    return question;
  }

  return {
    ...question,
    optionList: rekeyOptionList([
      ...question.optionList,
      createOptionDraft(question.optionList.length),
    ]),
  };
};

export const removeOptionFromQuestionDraft = (question, optionIndex) => {
  const optionList = toArray(question.optionList);
  if (
    !isChoiceQuestionType(question.type) ||
    optionList.length <= MIN_OPTION_COUNT
  ) {
    return question;
  }

  const previousKeyByEditorId = new Map(
    optionList.map((option) => [option.editorId, option.key]),
  );
  const nextOptionList = rekeyOptionList(
    optionList.filter((_, index) => index !== optionIndex),
  );
  const answerByPreviousKey = nextOptionList
    .map((option) => {
      const previousKey = previousKeyByEditorId.get(option.editorId);
      return previousKey && String(question.answer || "").includes(previousKey)
        ? option.key
        : "";
    })
    .filter(Boolean);

  return {
    ...question,
    answer: normalizeChoiceAnswer(
      answerByPreviousKey.join(""),
      nextOptionList,
      question.type,
    ),
    optionList: nextOptionList,
  };
};

export const moveOptionInQuestionDraft = (question, optionIndex, offset) => {
  const optionList = toArray(question.optionList);
  const nextIndex = optionIndex + offset;

  if (
    !isChoiceQuestionType(question.type) ||
    nextIndex < 0 ||
    nextIndex >= optionList.length
  ) {
    return question;
  }

  const previousKeyByEditorId = new Map(
    optionList.map((option) => [option.editorId, option.key]),
  );
  const movedOptions = [...optionList];
  const [movedOption] = movedOptions.splice(optionIndex, 1);
  movedOptions.splice(nextIndex, 0, movedOption);
  const nextOptionList = rekeyOptionList(movedOptions);
  const answerByPreviousKey = nextOptionList
    .map((option) => {
      const previousKey = previousKeyByEditorId.get(option.editorId);
      return previousKey && String(question.answer || "").includes(previousKey)
        ? option.key
        : "";
    })
    .filter(Boolean);

  return {
    ...question,
    answer: normalizeChoiceAnswer(
      answerByPreviousKey.join(""),
      nextOptionList,
      question.type,
    ),
    optionList: nextOptionList,
  };
};

export const toggleQuestionOptionAnswer = (
  question,
  optionKey,
  checked = true,
) => {
  if (!isChoiceQuestionType(question.type)) {
    return question;
  }

  if (
    [QUESTION_TYPE_CHOICE, QUESTION_TYPE_SINGLE_VOTE].includes(
      Number(question.type),
    )
  ) {
    return {
      ...question,
      answer: checked ? optionKey : "",
    };
  }

  const nextAnswer = [...String(question.answer || "")].filter(
    (item) => item !== optionKey,
  );

  if (checked) {
    nextAnswer.push(optionKey);
  }

  return {
    ...question,
    answer: normalizeChoiceAnswer(
      nextAnswer.join(""),
      question.optionList,
      question.type,
    ),
  };
};

const serializeGapFillingAnswer = (gapFillingAnswer) => {
  return buildGapFillingAnswerTransport({
    answerGroups: toArray(
      gapFillingAnswer && gapFillingAnswer.answerGroups,
    ).map((group) =>
      toArray(group && group.answers)
        .map((answer) =>
          normalizeBlankAnswerContent(
            answer && answer.content ? answer.content : "",
          ),
        )
        .filter((answer) => hasRichTextContent(answer)),
    ),
    isOrder: !!(gapFillingAnswer && gapFillingAnswer.isOrder),
  });
};

const getSaveDraftAnswer = (type, question) => {
  if (question.answer === undefined) {
    return type === QUESTION_TYPE_BLANK ? undefined : "";
  }

  return type === QUESTION_TYPE_JUDGE
    ? normalizeJudgeAnswer(question.answer)
    : question.answer;
};

const getSaveDraftGapFillingAnswer = (type, question) =>
  type === QUESTION_TYPE_BLANK
    ? serializeGapFillingAnswer(question.gapFillingAnswer)
    : undefined;

const getSaveDraftOptionList = (type, question) =>
  isChoiceQuestionType(type)
    ? toArray(question.optionList)
        .filter((option) => normalizeRichTextHtml(option && option.answers))
        .map((option, index) => ({
          answers: normalizeRichTextHtml(option.answers),
          key: getOptionKey(index) || option.key,
          knowledgeIds: normalizeIdList(option.knowledgeIds),
        }))
    : [];

const buildRootSaveDraftFields = (question) => ({
  gradeId: normalizeIdValue(question.gradeId),
  ...buildSectionDraftFields(question),
  subjectId: normalizeIdValue(question.subjectId),
});

const toQuestionSaveDraft = (question, includeRootMeta) => {
  const type = Number(question.type) || QUESTION_TYPE_ANSWER;
  const draft = {
    analysis: normalizeRichTextHtml(question.analysis),
    answer: getSaveDraftAnswer(type, question),
    chapterIds: normalizeIdList(question.chapterIds),
    chapterLabels: toArray(question.chapterLabels),
    chapterSelections: normalizeIdList(question.chapterSelections),
    content: normalizeRichTextHtml(question.content),
    gapFillingAnswer: getSaveDraftGapFillingAnswer(type, question),
    indicatorIds: normalizeIdList(question.indicatorIds),
    indicatorLabels: toArray(question.indicatorLabels),
    knowledgeIds: normalizeIdList(question.knowledgeIds),
    knowledgeLabels: toArray(question.knowledgeLabels),
    knowledgeSelections: normalizeIdList(question.knowledgeSelections),
    optionKnowledgeSelections: toArray(question.optionList).map((option) =>
      normalizeIdList(option && option.knowledgeIds),
    ),
    optionList: getSaveDraftOptionList(type, question),
    questionId: question.questionId || undefined,
    questionLevel: Number(question.questionLevel) || QUESTION_LEVEL_NORMAL,
    questionLevelName:
      question.questionLevelName ||
      getQuestionLevelLabel(question.questionLevel),
    questionScore: normalizeQuestionScore(question.questionScore),
    sonQuestionList:
      type === QUESTION_TYPE_COMBINATION
        ? toArray(question.sonQuestionList).map((childQuestion) =>
            toQuestionSaveDraft(childQuestion, false),
          )
        : [],
    type,
  };

  if (includeRootMeta) {
    Object.assign(draft, buildRootSaveDraftFields(question));
  }

  return draft;
};

export const buildQuestionEditorLocalSavePayload = (question) => ({
  draft: toQuestionSaveDraft(question, true),
});

const hasBlankAnswer = (question) =>
  hasGapFillingAnswerContent(
    serializeGapFillingAnswer(question.gapFillingAnswer),
  );

const getChoiceValidationError = (question, label) => {
  if (!isChoiceQuestionType(question.type)) {
    return "";
  }

  const validOptions = toArray(question.optionList).filter((option) =>
    hasRichTextContent(option && option.answers),
  );

  if (validOptions.length < MIN_OPTION_COUNT) {
    return `${label}：${trans("singleInput.fillOption", "选项内容不能为空哦~")}`;
  }

  if (isRequiredChoiceAnswerType(question.type) && !question.answer) {
    return `${label}：${SET_ANSWER_MESSAGE}`;
  }

  if (
    Number(question.type) === QUESTION_TYPE_CHOICE &&
    String(question.answer || "").length > 1
  ) {
    return trans(
      "singleInput.answerError",
      "您编辑的是单选题，答案仅能设置一项哦~",
    );
  }

  return "";
};

const getBlankValidationError = (question, label) =>
  Number(question.type) === QUESTION_TYPE_BLANK && !hasBlankAnswer(question)
    ? `${label}：${SET_ANSWER_MESSAGE}`
    : "";

const getJudgeValidationError = (question, label) =>
  Number(question.type) === QUESTION_TYPE_JUDGE &&
  question.answer !== true &&
  question.answer !== false
    ? `${label}：${SET_ANSWER_MESSAGE}`
    : "";

const getCombinationValidationError = (question, label) => {
  if (Number(question.type) !== QUESTION_TYPE_COMBINATION) {
    return "";
  }

  const childQuestions = toArray(question.sonQuestionList);
  if (childQuestions.length === 0) {
    return `${label}：${trans("global.addChild", "添加子题")}`;
  }

  return (
    childQuestions
      .map((childQuestion, index) =>
        validateQuestionEditorDraft(
          {
            ...childQuestion,
            gradeId: question.gradeId,
            subjectId: question.subjectId,
          },
          trans(
            "questionTask.childQuestionValidationLabel",
            "{$label} 子题{$index}",
            {
              index: index + 1,
              label,
            },
          ),
        ),
      )
      .find(Boolean) || ""
  );
};

export const validateQuestionEditorDraft = (
  question,
  label = DEFAULT_QUESTION_LABEL,
) => {
  const metadataValidationMessage = validateQuestionEditorMetadata(question);

  if (metadataValidationMessage) {
    return metadataValidationMessage;
  }

  if (!hasRichTextContent(question.content)) {
    return `${label}：${trans("singleInput.fillQuestion", "请输入题目")}`;
  }

  return (
    getChoiceValidationError(question, label) ||
    getBlankValidationError(question, label) ||
    getJudgeValidationError(question, label) ||
    getCombinationValidationError(question, label)
  );
};

export const validateQuestionEditorMetadata = (question) => {
  if (
    !normalizeIdValue(question.gradeId) ||
    !normalizeIdValue(question.subjectId)
  ) {
    return trans("batchInpt.message1", "年级、学科缺一不可哦~");
  }

  return "";
};
