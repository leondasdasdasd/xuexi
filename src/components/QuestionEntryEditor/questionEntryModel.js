import { trans } from "../../utils/i18n";
import {
  getQuestionLevelLabel,
  QUESTION_LEVEL_NORMAL,
} from "../../utils/questionDifficulty.js";
import {
  createEditorId,
  createOptionDraft,
  normalizeBlankAnswerContent,
  normalizeGapFillingAnswer,
} from "./questionEntryDraftParts";
import {
  DEFAULT_OPTION_COUNT,
  hasRichTextContent,
  isChoiceQuestionType,
  isRequiredChoiceAnswerType,
  MAX_OPTION_COUNT,
  MIN_OPTION_COUNT,
  normalizeIdList,
  normalizeIdValue,
  normalizeRichTextHtml,
  normalizeSelectionValues,
  OPTION_KEYS,
  QUESTION_TYPE_ANSWER,
  QUESTION_TYPE_BLANK,
  QUESTION_TYPE_CHOICE,
  QUESTION_TYPE_COMBINATION,
  QUESTION_TYPE_JUDGE,
  QUESTION_TYPE_OPTIONS,
  QUESTION_TYPE_SINGLE_VOTE,
  toArray,
} from "./questionEntryShared";

export {
  createBlankAnswerDraft,
  createBlankGroupDraft,
  createOptionDraft,
} from "./questionEntryDraftParts";
export {
  getQuestionTypeLabel,
  isChoiceQuestionType,
  isRequiredChoiceAnswerType,
  normalizeIdList,
  normalizeIdValue,
  normalizeRichTextHtml,
  QUESTION_TYPE_ANSWER,
  QUESTION_TYPE_BLANK,
  QUESTION_TYPE_CHOICE,
  QUESTION_TYPE_COMBINATION,
  QUESTION_TYPE_JUDGE,
  QUESTION_TYPE_MULTIPLE_CHOICE,
  QUESTION_TYPE_MULTIPLE_VOTE,
  QUESTION_TYPE_OPTIONS,
  QUESTION_TYPE_SINGLE_VOTE,
  stripRichText,
  toArray,
} from "./questionEntryShared";

const DEFAULT_QUESTION_LABEL = "当前题";
const SET_ANSWER_MESSAGE = trans("singleInput.setAnswer", "请设置题目答案哦~");

const getQuestionType = (value) => {
  const type = Number(value);
  return QUESTION_TYPE_OPTIONS.some((item) => item.value === type)
    ? type
    : QUESTION_TYPE_ANSWER;
};

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

const normalizeEditorOptionList = (type, question) => {
  if (!isChoiceQuestionType(type)) {
    return [];
  }

  const optionList = toArray(question.optionList).map((option, index) =>
    createOptionDraft(index, option),
  );

  return optionList.length > 0
    ? optionList
    : OPTION_KEYS.slice(0, DEFAULT_OPTION_COUNT).map((_, index) =>
        createOptionDraft(index),
      );
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
      : OPTION_KEYS.slice(0, DEFAULT_OPTION_COUNT).map((_, index) =>
          createOptionDraft(index),
        );

  return {
    ...baseQuestion,
    answer: normalizeChoiceAnswer(baseQuestion.answer, optionList, type),
    optionList: optionList.map((option, index) => ({
      ...option,
      key: OPTION_KEYS.slice(index, index + 1).shift() || option.key,
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
    ? OPTION_KEYS.slice(0, DEFAULT_OPTION_COUNT).map((_, index) =>
        createOptionDraft(index),
      )
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
    indicatorSelections: [],
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

const hasSelectionValue = (value) => toArray(value).length > 0;

const getIdsFromExplicitIdsOrSelections = (ids, selections) =>
  normalizeIdList(hasSelectionValue(ids) ? ids : selections);

const buildEditorMetadataDraft = (question) => {
  const chapterSelections = normalizeSelectionValues([
    question.chapterSelections,
    question.chapterValues,
    question.chapterIds,
  ]);
  const indicatorSelections = normalizeSelectionValues([
    question.indicatorSelections,
    question.indicatorValues,
    question.indicatorIds,
  ]);
  const knowledgeSelections = normalizeSelectionValues([
    question.knowledgeSelections,
    question.knowledgeValues,
    question.knowledgeIds,
  ]);

  return {
    chapterIds: getIdsFromExplicitIdsOrSelections(
      question.chapterIds,
      chapterSelections,
    ),
    chapterLabels: toArray(question.chapterLabels || question.chapterValues),
    chapterSelections,
    indicatorIds: getIdsFromExplicitIdsOrSelections(
      question.indicatorIds,
      indicatorSelections,
    ),
    indicatorLabels: toArray(
      question.indicatorLabels || question.indicatorValues,
    ),
    indicatorSelections,
    knowledgeIds: getIdsFromExplicitIdsOrSelections(
      question.knowledgeIds,
      knowledgeSelections,
    ),
    knowledgeLabels: toArray(
      question.knowledgeLabels || question.knowledgeValues,
    ),
    knowledgeSelections,
  };
};

export const createQuestionEditorDraft = (question = {}) => {
  const type = getQuestionType(question.type);
  const normalizedOptionList = normalizeEditorOptionList(type, question);
  const questionLevel = Number(question.questionLevel) || QUESTION_LEVEL_NORMAL;
  const gapFillingAnswer = normalizeGapFillingAnswer(question.gapFillingAnswer);
  const answer = getEditorAnswer(type, question, normalizedOptionList);

  return {
    analysis: normalizeRichTextHtml(question.analysis),
    answer,
    content: normalizeRichTextHtml(question.content),
    draftId: question.draftId || "",
    editorId: getQuestionEditorId(question),
    gapFillingAnswer,
    gradeId: normalizeIdValue(question.gradeId),
    ...buildEditorMetadataDraft(question),
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
    key:
      OPTION_KEYS.slice(index, index + 1).shift() ||
      option.key ||
      String(index + 1),
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
  const answerGroups = toArray(
    gapFillingAnswer && gapFillingAnswer.answerGroups,
  );
  return {
    answers: answerGroups
      .map((group) =>
        toArray(group && group.answers)
          .map((answer) =>
            normalizeBlankAnswerContent(
              answer && answer.content ? answer.content : "",
            ),
          )
          .filter((answer) => hasRichTextContent(answer))
          .join("&&"),
      )
      .filter(Boolean),
    isOrder: !!(gapFillingAnswer && gapFillingAnswer.isOrder),
  };
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
          key:
            OPTION_KEYS.slice(index, index + 1).shift() ||
            option.key ||
            String(index + 1),
          knowledgeIds: normalizeIdList(option.knowledgeIds),
        }))
    : [];

const buildRootSaveDraftFields = (question) => ({
  gradeId: normalizeIdValue(question.gradeId),
  ...buildSectionDraftFields(question),
  subjectId: normalizeIdValue(question.subjectId),
});

const getSaveIdsFromSelections = (selections, ids) =>
  normalizeIdList(hasSelectionValue(selections) ? selections : ids);

const buildSaveDraftMetadata = (question) => ({
  chapterIds: getSaveIdsFromSelections(
    question.chapterSelections,
    question.chapterIds,
  ),
  chapterLabels: toArray(question.chapterLabels),
  chapterSelections: normalizeSelectionValues([question.chapterSelections]),
  indicatorIds: getSaveIdsFromSelections(
    question.indicatorSelections,
    question.indicatorIds,
  ),
  indicatorLabels: toArray(question.indicatorLabels),
  indicatorSelections: normalizeSelectionValues([question.indicatorSelections]),
  knowledgeIds: getSaveIdsFromSelections(
    question.knowledgeSelections,
    question.knowledgeIds,
  ),
  knowledgeLabels: toArray(question.knowledgeLabels),
  knowledgeSelections: normalizeSelectionValues([question.knowledgeSelections]),
});

const getSaveDraftChildren = (type, question) =>
  type === QUESTION_TYPE_COMBINATION
    ? toArray(question.sonQuestionList).map((childQuestion) =>
        toQuestionSaveDraft(childQuestion, false),
      )
    : [];

const toQuestionSaveDraft = (question, includeRootMeta) => {
  const type = Number(question.type) || QUESTION_TYPE_ANSWER;
  const draft = {
    analysis: normalizeRichTextHtml(question.analysis),
    answer: getSaveDraftAnswer(type, question),
    content: normalizeRichTextHtml(question.content),
    gapFillingAnswer: getSaveDraftGapFillingAnswer(type, question),
    ...buildSaveDraftMetadata(question),
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
    sonQuestionList: getSaveDraftChildren(type, question),
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

const getMetadataDisplayValues = (selections, labels) => {
  const selectionValues = toArray(selections);
  const hasFullSelectionValue = selectionValues.some((value) => {
    const text = String(value || "");
    return text && String(normalizeIdValue(text)) !== text;
  });

  return hasFullSelectionValue ? selectionValues : toArray(labels);
};

export const buildQuestionEntrySavePayload = (question) => {
  const draft = toQuestionSaveDraft(question, true);

  return {
    chapterIds: normalizeIdList(
      draft.chapterSelections && draft.chapterSelections.length > 0
        ? draft.chapterSelections
        : draft.chapterIds,
    ),
    chapterValues: getMetadataDisplayValues(
      draft.chapterSelections,
      draft.chapterLabels,
    ),
    gradeId: draft.gradeId,
    indicatorIds: normalizeIdList(
      draft.indicatorSelections && draft.indicatorSelections.length > 0
        ? draft.indicatorSelections
        : draft.indicatorIds,
    ),
    knowledgeIds: normalizeIdList(
      draft.knowledgeSelections && draft.knowledgeSelections.length > 0
        ? draft.knowledgeSelections
        : draft.knowledgeIds,
    ),
    knowledgeValues: getMetadataDisplayValues(
      draft.knowledgeSelections,
      draft.knowledgeLabels,
    ),
    questionList: [draft],
    subjectId: draft.subjectId,
  };
};

const hasBlankAnswer = (question) =>
  serializeGapFillingAnswer(question.gapFillingAnswer).answers.length > 0;

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
          `${label} 子题${index + 1}`,
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
