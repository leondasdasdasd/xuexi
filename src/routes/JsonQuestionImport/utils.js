import { trans } from "../../utils/i18n";

const OPTION_KEYS = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];
const EMPTY_HTML_REG = /<(p+)(?:\s[^>]*)?>\s*<\/\1>/gi;

let uidSeed = 0;

const QUESTION_TYPE_OPTIONS = [
  { value: 1, label: trans("global.radio", "单选题") },
  { value: 2, label: trans("global.check", "多选题") },
  { value: 3, label: trans("global.pack", "填空题") },
  { value: 4, label: trans("global.judge", "判断题") },
  { value: 5, label: trans("global.ask", "问答题") },
  { value: 6, label: trans("global.combination", "组合题") },
];

const LEVEL_OPTIONS = [
  { value: 1, label: trans("global.easy", "简单") },
  { value: 2, label: trans("global.general", "普通") },
  { value: 3, label: trans("global.difficult", "困难") },
];

const QUESTION_TYPE_KEYWORD_MAP = [
  {
    type: 1,
    words: ["single", "single_choice", "single-choice", "单选", "单项选择"],
  },
  {
    type: 2,
    words: [
      "multiple",
      "multi",
      "multiple_choice",
      "multiple-choice",
      "多选",
      "多项选择",
    ],
  },
  { type: 3, words: ["fill", "blank", "gap", "填空"] },
  { type: 4, words: ["judge", "truefalse", "true_false", "判断", "正误"] },
  {
    type: 5,
    words: [
      "essay",
      "subjective",
      "qa",
      "question-answer",
      "问答",
      "简答",
      "主观",
    ],
  },
  { type: 6, words: ["combination", "group", "composite", "组合", "子题"] },
];

const QUESTION_LIST_KEYS = [
  "questionList",
  "questions",
  "list",
  "items",
  "rows",
  "records",
  "data",
  "content",
  "result",
];

const CONTENT_KEYS = [
  "content",
  "question",
  "title",
  "stem",
  "body",
  "name",
  "questionContent",
  "题目",
  "题干",
  "标题",
];

const ANALYSIS_KEYS = [
  "analysis",
  "解析",
  "answerAnalysis",
  "explanation",
  "solution",
  "commentary",
];

const ANSWER_KEYS = [
  "answer",
  "answers",
  "correctAnswer",
  "correctAnswers",
  "result",
  "key",
  "referenceAnswer",
  "答案",
];

const OPTION_KEYS_CANDIDATES = [
  "optionList",
  "options",
  "choices",
  "optionMap",
  "option",
  "selections",
];

const CHILD_KEYS = [
  "sonQuestionList",
  "children",
  "subQuestions",
  "childQuestions",
  "questionChildren",
];

const CHAPTER_ID_KEYS = ["chapterIds", "chapterId"];
const CHAPTER_NAME_KEYS = [
  "chapterNames",
  "chapterName",
  "chapter",
  "chapters",
  "章节",
];
const KNOWLEDGE_ID_KEYS = ["knowledgeIds", "knowlegeIds", "knowledgeId"];
const KNOWLEDGE_NAME_KEYS = [
  "knowledgeNames",
  "knowledgeName",
  "knowledge",
  "knowledgePoints",
  "knowledges",
  "知识点",
];

const LEVEL_KEYS = [
  "questionLevel",
  "difficulty",
  "level",
  "hardValue",
  "难度",
];
const TYPE_KEYS = ["type", "questionType", "question_type", "题型"];

const toArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }
  if (value === undefined || value === null || value === "") {
    return [];
  }
  return [value];
};

const uniqueList = (list) =>
  toArray(list).reduce((result, item) => {
    if (
      item !== undefined &&
      item !== null &&
      item !== "" &&
      !result.includes(item)
    ) {
      result.push(item);
    }
    return result;
  }, []);

const normalizeCompare = (value) =>
  String(value === undefined || value === null ? "" : value)
    .replaceAll(/\s+/g, "")
    .toLowerCase();

const isPlainObject = (value) =>
  !!value && Object.prototype.toString.call(value) === "[object Object]";

const getFirstDefinedValue = (target, keys) => {
  if (!isPlainObject(target)) {
    return;
  }

  for (const key of keys) {
    const value = target[key];
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return;
};

const normalizeText = (value) => {
  if (value === undefined || value === null) {
    return "";
  }
  if (typeof value === "string") {
    return value.trim();
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeText(item))
      .filter(Boolean)
      .join("\n");
  }
  if (isPlainObject(value)) {
    const nested = getFirstDefinedValue(value, [
      ...CONTENT_KEYS,
      "text",
      "label",
      "value",
    ]);
    if (nested !== undefined) {
      return normalizeText(nested);
    }
  }
  return String(value).trim();
};

const isIgnorableSiblingNode = (node) => {
  if (!node) {
    return true;
  }

  if (node.nodeType === Node.TEXT_NODE) {
    return !String(node.textContent || "").trim();
  }

  return false;
};

const getPreviousMeaningfulSibling = (node) => {
  let current = node ? node.previousSibling : null;
  while (current && isIgnorableSiblingNode(current)) {
    current = current.previousSibling;
  }
  return current;
};

const getNextMeaningfulSibling = (node) => {
  let current = node ? node.nextSibling : null;
  while (current && isIgnorableSiblingNode(current)) {
    current = current.nextSibling;
  }
  return current;
};

const isEmptyParagraphNode = (node) => {
  if (!node || node.nodeType !== Node.ELEMENT_NODE || node.tagName !== "P") {
    return false;
  }

  const innerHtml = String(node.innerHTML || "")
    .replaceAll(/<br\s*\/?>/gi, "")
    .replaceAll(/&nbsp;/gi, "")
    .replaceAll("​", "")
    .trim();

  return innerHtml === "";
};

const createEmptyParagraphNode = (document_) => document_.createElement("p");

const ensureTableBoundaryParagraphs = (html) => {
  if (!html || typeof DOMParser !== "function") {
    return html;
  }

  const parser = new DOMParser();
  const document_ = parser.parseFromString(
    `<!doctype html><body>${html}</body>`,
    "text/html",
  );
  const { body } = document_;
  const tableNodes = [...body.querySelectorAll("table")];

  for (const tableNode of tableNodes) {
    const previousSibling = getPreviousMeaningfulSibling(tableNode);
    if (!isEmptyParagraphNode(previousSibling)) {
      tableNode.parentNode.insertBefore(
        createEmptyParagraphNode(document_),
        tableNode,
      );
    }

    const nextSibling = getNextMeaningfulSibling(tableNode);
    if (!isEmptyParagraphNode(nextSibling)) {
      tableNode.parentNode.insertBefore(
        createEmptyParagraphNode(document_),
        nextSibling,
      );
    }
  }

  return body.innerHTML.trim();
};

export const cleanupRichTextHtml = (value) => {
  const html = normalizeText(value);
  if (!html) {
    return "";
  }

  const compact = html.replaceAll("​", "").trim();
  if (!compact) {
    return "";
  }

  const normalized = ensureTableBoundaryParagraphs(compact);
  const stripped = normalized.replaceAll(EMPTY_HTML_REG, "").trim();
  return stripped ? normalized : "";
};

export const createUid = (prefix = "json-field") => {
  uidSeed += 1;
  return `${prefix}-${Date.now()}-${uidSeed}-${Math.random().toString(16).slice(2, 10)}`;
};

export const createGapAnswerItem = (content = "") => ({
  content: cleanupRichTextHtml(content),
  uid: createUid("gap-answer"),
});

export const createGapAnswerGroup = (answers) => {
  const normalizedAnswers = toArray(answers)
    .map((item) => {
      if (isPlainObject(item)) {
        return {
          content: cleanupRichTextHtml(item.content || item.value || item.html),
          uid: item.uid || createUid("gap-answer"),
        };
      }
      return createGapAnswerItem(item);
    })
    .filter((item) => item.content);

  return {
    answers:
      normalizedAnswers.length > 0
        ? normalizedAnswers
        : [createGapAnswerItem("")],
    uid: createUid("gap-group"),
  };
};

const serializeGapAnswerGroups = (answerGroups) =>
  uniqueList(
    toArray(answerGroups)
      .map((group) =>
        uniqueList(
          toArray(group && group.answers)
            .map((answer) =>
              cleanupRichTextHtml(
                isPlainObject(answer) ? answer.content || answer.value : answer,
              ),
            )
            .filter(Boolean),
        ).join("&&"),
      )
      .filter(Boolean),
  );

const normalizeGapAnswerGroups = (rawGapAnswer) => {
  if (rawGapAnswer && isPlainObject(rawGapAnswer)) {
    if (Array.isArray(rawGapAnswer.answerGroups)) {
      return toArray(rawGapAnswer.answerGroups).map((group) => ({
        answers:
          toArray(group && group.answers)
            .map((answer) => ({
              content: cleanupRichTextHtml(
                isPlainObject(answer)
                  ? answer.content || answer.value || answer.html
                  : answer,
              ),
              uid:
                (isPlainObject(answer) && answer.uid) ||
                createUid("gap-answer"),
            }))
            .filter((answer) => answer.content) || [],
        uid: (group && group.uid) || createUid("gap-group"),
      }));
    }

    if (Array.isArray(rawGapAnswer.answers)) {
      return rawGapAnswer.answers.map((groupValue) =>
        createGapAnswerGroup(
          String(groupValue || "")
            .split("&&")
            .map((item) => cleanupRichTextHtml(item)),
        ),
      );
    }
  }

  return uniqueList(
    toArray(rawGapAnswer)
      .map((item) => {
        if (Array.isArray(item)) {
          return item.join("&&");
        }
        return item;
      })
      .filter((item) => item !== undefined && item !== null),
  ).map((groupValue) =>
    createGapAnswerGroup(
      String(groupValue || "")
        .split("&&")
        .map((item) => cleanupRichTextHtml(item)),
    ),
  );
};

const normalizeGapFillingAnswer = (question) => {
  const rawGapAnswer = getFirstDefinedValue(question, [
    "gapFillingAnswer",
    "blankAnswers",
    "gapAnswers",
    "fillAnswers",
    "answers",
    "answer",
  ]);

  const answerGroups = normalizeGapAnswerGroups(rawGapAnswer);
  const answers = serializeGapAnswerGroups(answerGroups);

  return {
    answerGroups:
      answerGroups.length > 0 ? answerGroups : [createGapAnswerGroup([""])],
    answers,
    isOrder: !!(
      rawGapAnswer &&
      isPlainObject(rawGapAnswer) &&
      rawGapAnswer.isOrder
    ),
  };
};

const ensureGapFillingAnswer = (gapFillingAnswer) => {
  const answerGroups = normalizeGapAnswerGroups(gapFillingAnswer);
  return {
    answerGroups:
      answerGroups.length > 0 ? answerGroups : [createGapAnswerGroup([""])],
    answers: serializeGapAnswerGroups(answerGroups),
    isOrder: !!(gapFillingAnswer && gapFillingAnswer.isOrder),
  };
};

export const syncGapFillingAnswerDraft = (gapFillingAnswer) =>
  ensureGapFillingAnswer(gapFillingAnswer);

const createOptionDraft = (key, answers = "", knowledgeIds = []) => ({
  answers: cleanupRichTextHtml(answers),
  key,
  knowledgeIds: normalizeIdList(knowledgeIds),
  uid: createUid(`option-${key}`),
});

const normalizeIdList = (value) =>
  uniqueList(
    toArray(value)
      .map((item) => {
        if (isPlainObject(item)) {
          return getFirstDefinedValue(item, ["id", "value", "key"]);
        }
        return item;
      })
      .map(Number)
      .filter((item) => Number.isFinite(item)),
  );

const normalizeNameList = (value) =>
  uniqueList(
    toArray(value)
      .map((item) => {
        if (isPlainObject(item)) {
          return normalizeText(
            getFirstDefinedValue(item, [
              "name",
              "title",
              "text",
              "label",
              "value",
            ]),
          );
        }
        return normalizeText(item);
      })
      .filter(Boolean),
  );

const stripOptionPrefix = (value, optionKey) => {
  const text = normalizeText(value);
  if (!text) {
    return "";
  }

  const prefixReg = new RegExp(`^${optionKey}[\\.．、\\)）\\s]+`, "i");
  return text
    .replace(new RegExp(`^<p>\\s*${optionKey}[\\.．、\\)）\\s]+`, "i"), "<p>")
    .replace(prefixReg, "")
    .trim();
};

const getQuestionLevelLabel = (level) => {
  const matched = LEVEL_OPTIONS.find((item) => item.value === Number(level));
  return matched ? matched.label : LEVEL_OPTIONS[0].label;
};

const normalizeQuestionLevel = (value) => {
  const numericLevel = Number(value);
  if (numericLevel >= 1 && numericLevel <= 3) {
    return numericLevel;
  }

  const text = normalizeCompare(value);
  if (!text) {
    return 1;
  }
  if (
    text.includes("easy") ||
    text.includes("simple") ||
    text.includes("简单")
  ) {
    return 1;
  }
  if (
    text.includes("hard") ||
    text.includes("difficult") ||
    text.includes("困难")
  ) {
    return 3;
  }
  return 2;
};

const findQuestionArray = (payload, depth = 0) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!isPlainObject(payload) || depth > 3) {
    return [];
  }

  for (const key of QUESTION_LIST_KEYS) {
    const value = payload[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  for (const key of QUESTION_LIST_KEYS) {
    const value = payload[key];
    if (isPlainObject(value)) {
      const nested = findQuestionArray(value, depth + 1);
      if (nested.length > 0) {
        return nested;
      }
    }
  }

  return [];
};

const normalizeMetaSource = (value) => {
  if (Array.isArray(value)) {
    return value;
  }
  if (isPlainObject(value)) {
    return Object.keys(value).map((key) => value[key]);
  }
  return value;
};

const normalizeMetaField = (question, idKeys, nameKeys) => {
  const rawIdValue = getFirstDefinedValue(question, idKeys);
  const rawNameValue = normalizeMetaSource(
    getFirstDefinedValue(question, nameKeys),
  );

  const ids = normalizeIdList(rawIdValue);
  const names = normalizeNameList(rawNameValue);

  if (ids.length === 0 && names.length === 0) {
    const fallbackValue = normalizeMetaSource(
      getFirstDefinedValue(question, nameKeys.concat(idKeys)),
    );
    return {
      ids: normalizeIdList(fallbackValue),
      names: normalizeNameList(fallbackValue),
    };
  }

  return { ids, names };
};

const getOptionMapFromFields = (question) => {
  const mapped = [];

  for (const [index, optionKey] of OPTION_KEYS.entries()) {
    const directKey = question[optionKey];
    const optionField = question[`option${optionKey}`];
    const answerField = question[`answer${index + 1}`];
    const optionValue = directKey || optionField || answerField;

    if (
      optionValue !== undefined &&
      optionValue !== null &&
      optionValue !== ""
    ) {
      mapped.push({
        answers: stripOptionPrefix(optionValue, optionKey),
        key: optionKey,
      });
    }
  }

  return mapped;
};

const normalizeOptionDrafts = (question) => {
  const rawOptions = getFirstDefinedValue(question, OPTION_KEYS_CANDIDATES);
  let optionList = [];

  if (Array.isArray(rawOptions)) {
    optionList = rawOptions.map((option, index) => {
      const optionKey =
        normalizeText(
          getFirstDefinedValue(option, ["key", "optionKey", "label"]),
        ) ||
        OPTION_KEYS[index] ||
        String(index + 1);

      return {
        answers: stripOptionPrefix(
          getFirstDefinedValue(option, [
            "answers",
            "content",
            "text",
            "label",
            "value",
            "optionContent",
          ]),
          optionKey,
        ),
        correct: !!getFirstDefinedValue(option, [
          "correct",
          "isRight",
          "isAnswer",
          "checked",
        ]),
        key: optionKey,
      };
    });
  } else if (isPlainObject(rawOptions)) {
    optionList = Object.keys(rawOptions)
      .sort()
      .map((key, index) => ({
        answers: stripOptionPrefix(
          rawOptions[key],
          /^[a-z]$/i.test(key) ? key.toUpperCase() : OPTION_KEYS[index] || key,
        ),
        correct: false,
        key: /^[a-z]$/i.test(key)
          ? key.toUpperCase()
          : OPTION_KEYS[index] || key,
      }));
  } else {
    optionList = getOptionMapFromFields(question);
  }

  return optionList.filter((item) => item.answers);
};

const mapAnswerTokenToOptionKey = (token, optionList) => {
  if (token === undefined || token === null || token === "") {
    return "";
  }

  if (typeof token === "boolean") {
    return "";
  }

  const normalizedToken = normalizeText(token).toUpperCase();
  if (!normalizedToken) {
    return "";
  }

  const optionByKey = optionList.find((item) => item.key === normalizedToken);
  if (optionByKey) {
    return optionByKey.key;
  }

  if (/^\d+$/.test(normalizedToken)) {
    const numericIndex = Number(normalizedToken);
    if (numericIndex >= 1 && numericIndex <= optionList.length) {
      return optionList[numericIndex - 1].key;
    }
    if (numericIndex >= 0 && numericIndex < optionList.length) {
      return optionList[numericIndex].key;
    }
  }

  const optionByContent = optionList.find(
    (item) =>
      normalizeCompare(item.answers) === normalizeCompare(normalizedToken),
  );
  return optionByContent ? optionByContent.key : "";
};

const normalizeChoiceAnswer = (rawAnswer, optionList) => {
  if (optionList.length === 0) {
    return "";
  }

  let tokens = [];
  if (Array.isArray(rawAnswer)) {
    tokens = rawAnswer;
  } else if (typeof rawAnswer === "string") {
    if (
      rawAnswer.includes(",") ||
      rawAnswer.includes("，") ||
      rawAnswer.includes("|") ||
      rawAnswer.includes("/") ||
      rawAnswer.includes("、")
    ) {
      tokens = rawAnswer.split(/[,/|、，]/);
    } else if (/^[a-z]+$/i.test(rawAnswer.trim())) {
      tokens = rawAnswer.trim().split("");
    } else {
      tokens = [rawAnswer];
    }
  } else {
    tokens = [rawAnswer];
  }

  return uniqueList(
    tokens
      .map((item) => mapAnswerTokenToOptionKey(item, optionList))
      .filter(Boolean),
  )
    .sort()
    .join("");
};

const normalizeJudgeAnswer = (value) => {
  if (typeof value === "boolean") {
    return value;
  }

  const text = normalizeCompare(value);
  if (!text) {
    return "";
  }
  if (
    text === "true" ||
    text === "t" ||
    text === "1" ||
    text.includes("正确") ||
    text.includes("对") ||
    text.includes("yes")
  ) {
    return true;
  }
  if (
    text === "false" ||
    text === "f" ||
    text === "0" ||
    text.includes("错误") ||
    text.includes("错") ||
    text.includes("no")
  ) {
    return false;
  }
  return "";
};

const detectQuestionType = (question, optionList, childQuestionList) => {
  const explicitTypeValue = getFirstDefinedValue(question, TYPE_KEYS);
  if (explicitTypeValue !== undefined) {
    const numericType = Number(explicitTypeValue);
    if (numericType >= 1 && numericType <= 8) {
      return numericType;
    }

    const typeText = normalizeCompare(explicitTypeValue);
    for (const item of QUESTION_TYPE_KEYWORD_MAP) {
      if (
        item.words.some((word) => typeText.includes(normalizeCompare(word)))
      ) {
        return item.type;
      }
    }
  }

  if (childQuestionList.length > 0) {
    return 6;
  }

  const rawAnswer = getFirstDefinedValue(question, ANSWER_KEYS);
  if (typeof rawAnswer === "boolean") {
    return 4;
  }

  if (optionList.length > 0) {
    const normalizedAnswer = normalizeChoiceAnswer(rawAnswer, optionList);
    return normalizedAnswer.length > 1 ? 2 : 1;
  }

  if (normalizeGapFillingAnswer(question).answers.length > 0) {
    return 3;
  }

  const normalizedJudgeAnswer = normalizeJudgeAnswer(rawAnswer);
  if (normalizedJudgeAnswer === true || normalizedJudgeAnswer === false) {
    return 4;
  }

  return 5;
};

const toDisplayOptionList = (optionList) =>
  optionList.map((item, index) =>
    createOptionDraft(
      item.key || OPTION_KEYS[index] || String(index + 1),
      item.answers,
      item.knowledgeIds,
    ),
  );

export const createEmptyQuestion = (type = 1) => {
  const numericType = Number(type) || 1;
  const question = {
    analysis: "",
    answer: "",
    chapterIds: [],
    chapterNameHints: [],
    content: "",
    gapFillingAnswer: ensureGapFillingAnswer({
      answerGroups: [createGapAnswerGroup([""])],
      isOrder: false,
    }),
    knowledgeIds: [],
    knowledgeNameHints: [],
    optionList: [],
    questionLevel: 1,
    questionLevelName: getQuestionLevelLabel(1),
    sonQuestionList: [],
    type: numericType,
    uid: createUid("question"),
  };

  if ([1, 2].includes(numericType)) {
    question.optionList = OPTION_KEYS.slice(0, 4).map((item) =>
      createOptionDraft(item),
    );
  }

  if (numericType === 3) {
    question.answer = null;
  }

  if (numericType === 4) {
    question.answer = "";
    question.optionList = [];
  }

  if (numericType === 5) {
    question.optionList = [];
  }

  if (numericType === 6) {
    question.answer = "";
    question.optionList = [];
    question.sonQuestionList = [createEmptyQuestion(1)];
  }

  return question;
};

export const resetQuestionByType = (question, nextType) => {
  const baseQuestion = {
    analysis: cleanupRichTextHtml(question.analysis || ""),
    answer: question.answer,
    chapterIds: normalizeIdList(question.chapterIds),
    chapterNameHints: normalizeNameList(question.chapterNameHints),
    content: cleanupRichTextHtml(question.content || ""),
    gapFillingAnswer: ensureGapFillingAnswer(question.gapFillingAnswer),
    knowledgeIds: normalizeIdList(question.knowledgeIds),
    knowledgeNameHints: normalizeNameList(question.knowledgeNameHints),
    optionList: Array.isArray(question.optionList)
      ? question.optionList.map((item, index) =>
          createOptionDraft(
            item.key || OPTION_KEYS[index] || String(index + 1),
            item.answers,
            item.knowledgeIds,
          ),
        )
      : [],
    questionLevel: normalizeQuestionLevel(question.questionLevel),
    questionLevelName: getQuestionLevelLabel(question.questionLevel),
    sonQuestionList: Array.isArray(question.sonQuestionList)
      ? question.sonQuestionList
      : [],
    type: Number(nextType),
    uid: question.uid || createUid("question"),
  };

  if ([1, 2].includes(Number(nextType))) {
    baseQuestion.optionList =
      baseQuestion.optionList.length >= 2
        ? baseQuestion.optionList
        : OPTION_KEYS.slice(0, 4).map((item) => createOptionDraft(item));
    baseQuestion.answer =
      typeof baseQuestion.answer === "string" ? baseQuestion.answer : "";
    baseQuestion.sonQuestionList = [];
    return baseQuestion;
  }

  if (Number(nextType) === 3) {
    baseQuestion.optionList = [];
    baseQuestion.answer = null;
    baseQuestion.sonQuestionList = [];
    baseQuestion.gapFillingAnswer = ensureGapFillingAnswer(
      baseQuestion.gapFillingAnswer,
    );
    return baseQuestion;
  }

  if (Number(nextType) === 4) {
    baseQuestion.optionList = [];
    baseQuestion.answer =
      baseQuestion.answer === true || baseQuestion.answer === false
        ? baseQuestion.answer
        : "";
    baseQuestion.sonQuestionList = [];
    return baseQuestion;
  }

  if (Number(nextType) === 5) {
    baseQuestion.optionList = [];
    baseQuestion.answer =
      baseQuestion.answer === null || baseQuestion.answer === undefined
        ? ""
        : cleanupRichTextHtml(baseQuestion.answer);
    baseQuestion.sonQuestionList = [];
    return baseQuestion;
  }

  if (Number(nextType) === 6) {
    baseQuestion.answer = "";
    baseQuestion.optionList = [];
    baseQuestion.sonQuestionList =
      baseQuestion.sonQuestionList && baseQuestion.sonQuestionList.length > 0
        ? baseQuestion.sonQuestionList
        : [createEmptyQuestion(1)];
    return baseQuestion;
  }

  return baseQuestion;
};

const normalizeQuestion = (question, indexPrefix) => {
  const childSource = getFirstDefinedValue(question, CHILD_KEYS);
  const childQuestionList = Array.isArray(childSource)
    ? childSource.map((item, index) =>
        normalizeQuestion(item, `${indexPrefix}-${index}`),
      )
    : [];

  const optionDrafts = normalizeOptionDrafts(question);
  const type = detectQuestionType(question, optionDrafts, childQuestionList);
  const rawAnswer = getFirstDefinedValue(question, ANSWER_KEYS);
  const questionLevel = normalizeQuestionLevel(
    getFirstDefinedValue(question, LEVEL_KEYS),
  );
  const chapterMeta = normalizeMetaField(
    question,
    CHAPTER_ID_KEYS,
    CHAPTER_NAME_KEYS,
  );
  const knowledgeMeta = normalizeMetaField(
    question,
    KNOWLEDGE_ID_KEYS,
    KNOWLEDGE_NAME_KEYS,
  );

  const normalizedQuestion = {
    analysis: cleanupRichTextHtml(
      getFirstDefinedValue(question, ANALYSIS_KEYS),
    ),
    answer: "",
    chapterIds: chapterMeta.ids,
    chapterNameHints: chapterMeta.names,
    content: cleanupRichTextHtml(getFirstDefinedValue(question, CONTENT_KEYS)),
    gapFillingAnswer: normalizeGapFillingAnswer(question),
    knowledgeIds: knowledgeMeta.ids,
    knowledgeNameHints: knowledgeMeta.names,
    optionList: toDisplayOptionList(optionDrafts),
    questionLevel,
    questionLevelName: getQuestionLevelLabel(questionLevel),
    sonQuestionList: childQuestionList,
    type,
    uid: createUid(`question-${indexPrefix}`),
  };

  switch (type) {
    case 3: {
      normalizedQuestion.answer = null;
      normalizedQuestion.optionList = [];

      break;
    }
    case 4: {
      normalizedQuestion.answer = normalizeJudgeAnswer(rawAnswer);
      normalizedQuestion.optionList = [];

      break;
    }
    case 5: {
      normalizedQuestion.answer = cleanupRichTextHtml(rawAnswer);
      normalizedQuestion.optionList = [];

      break;
    }
    case 6: {
      normalizedQuestion.answer = "";
      normalizedQuestion.optionList = [];

      break;
    }
    default: {
      const explicitAnswer = normalizeChoiceAnswer(
        rawAnswer,
        normalizedQuestion.optionList,
      );
      const answerFromOptions = normalizedQuestion.optionList
        .filter((item) =>
          optionDrafts.find(
            (option) => option.key === item.key && option.correct,
          ),
        )
        .map((item) => item.key)
        .join("");
      normalizedQuestion.answer = explicitAnswer || answerFromOptions;
    }
  }

  return resetQuestionByType(normalizedQuestion, type);
};

export const parseJsonQuestions = (jsonText) => {
  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error(
      trans("jsonInput.invalidJson", "JSON 格式不正确，请检查后重试"),
    );
  }

  const rawQuestionList = findQuestionArray(parsed);
  if (rawQuestionList.length === 0) {
    throw new Error(
      trans(
        "jsonInput.noQuestionFound",
        "没有识别到题目数组，支持直接传数组，或放在 questionList/questions/data/list 字段里",
      ),
    );
  }

  return rawQuestionList.map((question, index) =>
    normalizeQuestion(question, String(index)),
  );
};

const flattenTreeData = (treeData) => {
  const result = [];
  const loop = (list) => {
    for (const item of toArray(list)) {
      if (!item) {
        continue;
      }
      result.push(item);
      if (Array.isArray(item.children) && item.children.length > 0) {
        loop(item.children);
      }
    }
  };
  loop(treeData);
  return result;
};

const matchIdsByNames = (treeData, names) => {
  const flatTree = flattenTreeData(treeData);
  if (flatTree.length === 0 || names.length === 0) {
    return [];
  }

  return uniqueList(
    names.reduce((result, name) => {
      const matched = flatTree.find((item) => {
        const title = normalizeText(
          item.title || item.name || item.text || item.label,
        );
        return (
          normalizeCompare(title) === normalizeCompare(name) ||
          normalizeCompare(title).includes(normalizeCompare(name)) ||
          normalizeCompare(name).includes(normalizeCompare(title))
        );
      });
      if (matched && matched.value !== undefined && matched.value !== null) {
        result.push(Number(matched.value));
      }
      return result;
    }, []),
  ).filter((item) => Number.isFinite(item));
};

const filterValidIds = (treeData, ids) => {
  if (!treeData || treeData.length === 0) {
    return normalizeIdList(ids);
  }

  const availableIds = new Set(
    flattenTreeData(treeData)
      .map((item) => Number(item.value))
      .filter((item) => Number.isFinite(item)),
  );

  return normalizeIdList(ids).filter((item) => availableIds.has(item));
};

const syncQuestionMetaByTree = (
  question,
  knowledgeTreeData,
  chapterTreeData,
) => {
  const nextKnowledgeIds = filterValidIds(
    knowledgeTreeData,
    question.knowledgeIds,
  );
  const nextChapterIds = filterValidIds(chapterTreeData, question.chapterIds);
  const matchedKnowledgeIds =
    nextKnowledgeIds.length > 0
      ? nextKnowledgeIds
      : matchIdsByNames(knowledgeTreeData, question.knowledgeNameHints || []);
  const matchedChapterIds =
    nextChapterIds.length > 0
      ? nextChapterIds
      : matchIdsByNames(chapterTreeData, question.chapterNameHints || []);

  return {
    ...question,
    chapterIds: matchedChapterIds,
    knowledgeIds: matchedKnowledgeIds,
    sonQuestionList: (question.sonQuestionList || []).map((item) =>
      syncQuestionMetaByTree(item, knowledgeTreeData, chapterTreeData),
    ),
  };
};

export const syncQuestionListMetaByTree = (
  questionList,
  knowledgeTreeData,
  chapterTreeData,
) =>
  toArray(questionList).map((item) =>
    syncQuestionMetaByTree(item, knowledgeTreeData, chapterTreeData),
  );

export const normalizeTreeData = (list, childKeys) =>
  toArray(list).map((item, index) => {
    const childrenKey =
      childKeys ||
      (Array.isArray(item && item.indicatorSon) ? "indicatorSon" : "children");
    const children = item && item[childrenKey];
    const title = normalizeText(
      item &&
        (item.title || item.text || item.name || item.label || item.value),
    );
    const value = Number(
      item &&
        (item.value !== undefined && item.value !== null
          ? item.value
          : item.id),
    );

    return {
      children:
        Array.isArray(children) && children.length > 0
          ? normalizeTreeData(children, childKeys)
          : [],
      key: Number.isFinite(value) ? value : `${title}-${index}`,
      title,
      value: Number.isFinite(value) ? value : `${title}-${index}`,
    };
  });

const collectMetaIds = (questionList, field) => {
  const result = [];
  const travel = (list) => {
    for (const item of toArray(list)) {
      for (const id of normalizeIdList(item && item[field])) {
        if (!result.includes(id)) {
          result.push(id);
        }
      }
      if (
        item &&
        Array.isArray(item.sonQuestionList) &&
        item.sonQuestionList.length > 0
      ) {
        travel(item.sonQuestionList);
      }
    }
  };
  travel(questionList);
  return result;
};

export const getQuestionFieldId = (question, fieldType) =>
  `${question.uid}-${fieldType}`;

export const getOptionFieldId = (question, option) =>
  `${question.uid}-option-${option.uid || option.key}`;

export const getGapAnswerFieldId = (question, group, answer) =>
  `${question.uid}-gap-${group.uid}-${answer.uid}`;

const collectRichFieldDefinitionsByQuestion = (question, definitions) => {
  definitions.push({
    fieldId: getQuestionFieldId(question, "content"),
    html: cleanupRichTextHtml(question.content),
    meta: {
      fieldType: "content",
      questionUid: question.uid,
    },
  });

  definitions.push({
    fieldId: getQuestionFieldId(question, "analysis"),
    html: cleanupRichTextHtml(question.analysis),
    meta: {
      fieldType: "analysis",
      questionUid: question.uid,
    },
  });

  if ([1, 2].includes(Number(question.type))) {
    for (const option of toArray(question.optionList)) {
      definitions.push({
        fieldId: getOptionFieldId(question, option),
        html: cleanupRichTextHtml(option.answers),
        meta: {
          fieldType: "option",
          optionUid: option.uid,
          questionUid: question.uid,
        },
      });
    }
  }

  if (Number(question.type) === 3) {
    for (const group of toArray(
      question.gapFillingAnswer && question.gapFillingAnswer.answerGroups,
    )) {
      for (const answer of toArray(group && group.answers)) {
        definitions.push({
          fieldId: getGapAnswerFieldId(question, group, answer),
          html: cleanupRichTextHtml(answer.content),
          meta: {
            answerUid: answer.uid,
            fieldType: "gap-answer",
            groupUid: group.uid,
            questionUid: question.uid,
          },
        });
      }
    }
  }

  if (Number(question.type) === 5) {
    definitions.push({
      fieldId: getQuestionFieldId(question, "answer"),
      html: cleanupRichTextHtml(question.answer),
      meta: {
        fieldType: "answer",
        questionUid: question.uid,
      },
    });
  }

  for (const childQuestion of toArray(question.sonQuestionList)) {
    collectRichFieldDefinitionsByQuestion(childQuestion, definitions);
  }
};

export const collectRichFieldDefinitions = (questionList) => {
  const definitions = [];
  for (const question of toArray(questionList)) {
    collectRichFieldDefinitionsByQuestion(question, definitions);
  }
  return definitions;
};

const updateQuestionRichField = (question, meta, html) => {
  if (question.uid === meta.questionUid) {
    if (meta.fieldType === "content" || meta.fieldType === "analysis") {
      return {
        ...question,
        [meta.fieldType]: html,
      };
    }

    if (meta.fieldType === "answer") {
      return {
        ...question,
        answer: html,
      };
    }

    if (meta.fieldType === "option") {
      return {
        ...question,
        optionList: toArray(question.optionList).map((option) =>
          option.uid === meta.optionUid
            ? {
                ...option,
                answers: html,
              }
            : option,
        ),
      };
    }

    if (meta.fieldType === "gap-answer") {
      const nextAnswerGroups = toArray(
        question.gapFillingAnswer && question.gapFillingAnswer.answerGroups,
      ).map((group) =>
        group.uid === meta.groupUid
          ? {
              ...group,
              answers: toArray(group.answers).map((answer) =>
                answer.uid === meta.answerUid
                  ? {
                      ...answer,
                      content: html,
                    }
                  : answer,
              ),
            }
          : group,
      );

      return {
        ...question,
        gapFillingAnswer: {
          ...question.gapFillingAnswer,
          answerGroups: nextAnswerGroups,
          answers: serializeGapAnswerGroups(nextAnswerGroups),
          isOrder: !!(
            question &&
            question.gapFillingAnswer &&
            question.gapFillingAnswer.isOrder
          ),
        },
      };
    }
  }

  if (
    Array.isArray(question.sonQuestionList) &&
    question.sonQuestionList.length > 0
  ) {
    return {
      ...question,
      sonQuestionList: question.sonQuestionList.map((childQuestion) =>
        updateQuestionRichField(childQuestion, meta, html),
      ),
    };
  }

  return question;
};

export const updateQuestionListRichField = (questionList, meta, html) =>
  toArray(questionList).map((question) =>
    updateQuestionRichField(question, meta, cleanupRichTextHtml(html)),
  );

const buildOptionListForSave = (optionList) =>
  toArray(optionList)
    .filter((option) => cleanupRichTextHtml(option && option.answers))
    .map((option, index) => ({
      answers: cleanupRichTextHtml(option && option.answers),
      key: (option && option.key) || OPTION_KEYS[index] || String(index + 1),
      knowledgeIds: normalizeIdList(option && option.knowledgeIds),
    }));

const toSaveQuestion = (question) => {
  const draft = {
    analysis: cleanupRichTextHtml(question && question.analysis),
    chapterIds: normalizeIdList(question && question.chapterIds),
    content: cleanupRichTextHtml(question && question.content),
    knowledgeIds: normalizeIdList(question && question.knowledgeIds),
    optionList: [],
    questionLevel: normalizeQuestionLevel(question && question.questionLevel),
    questionLevelName: getQuestionLevelLabel(
      question && question.questionLevel,
    ),
    type: Number(question && question.type) || 5,
  };

  if ([1, 2].includes(draft.type)) {
    draft.optionList = buildOptionListForSave(question && question.optionList);
    draft.answer = normalizeText(question && question.answer);
    return draft;
  }

  if (draft.type === 3) {
    const gapFillingAnswer = ensureGapFillingAnswer(
      question && question.gapFillingAnswer,
    );
    draft.answer = null;
    draft.gapFillingAnswer = {
      answers: serializeGapAnswerGroups(gapFillingAnswer.answerGroups),
      isOrder: !!gapFillingAnswer.isOrder,
    };
    draft.optionList = [];
    return draft;
  }

  if (draft.type === 4) {
    draft.answer =
      question && (question.answer === true || question.answer === false)
        ? question.answer
        : "";
    draft.optionList = [];
    return draft;
  }

  if (draft.type === 6) {
    draft.answer = "";
    draft.optionList = [];
    draft.sonQuestionList = toArray(question && question.sonQuestionList).map(
      (item) => toSaveQuestion(item),
    );
    return draft;
  }

  draft.answer = cleanupRichTextHtml(question && question.answer);
  draft.optionList = [];
  return draft;
};

export const buildBatchImportPayload = ({
  gradeId,
  subjectId,
  questionList,
}) => {
  const knowledgeIds = collectMetaIds(questionList, "knowledgeIds");
  const chapterIds = collectMetaIds(questionList, "chapterIds");

  return {
    chapterIds,
    gradeId,
    knowlegeIds: knowledgeIds,
    knowledgeIds,
    questionList: toArray(questionList).map((item) => toSaveQuestion(item)),
    subjectId,
  };
};

export const getQuestionTypeOptions = () => [...QUESTION_TYPE_OPTIONS];

export const getDifficultyOptions = () => [...LEVEL_OPTIONS];

export const getQuestionTypeLabel = (type) => {
  const target = QUESTION_TYPE_OPTIONS.find(
    (item) => item.value === Number(type),
  );
  return target ? target.label : trans("global.ask", "问答题");
};

export const validateQuestionList = (questionList, parentLabel) => {
  for (const [index, question] of questionList.entries()) {
    const label = parentLabel ? `${parentLabel}.${index + 1}` : `${index + 1}`;

    if (!cleanupRichTextHtml(question && question.content)) {
      return trans(
        "jsonInput.questionContentRequired",
        `第 ${label} 题题干不能为空`,
      );
    }

    if ([1, 2].includes(Number(question && question.type))) {
      const validOptions = toArray(question && question.optionList).filter(
        (item) => cleanupRichTextHtml(item && item.answers),
      );
      if (validOptions.length < 2) {
        return trans(
          "jsonInput.optionRequired",
          `第 ${label} 题至少需要 2 个有效选项`,
        );
      }
      const normalizedAnswer = normalizeText(question && question.answer);
      if (!normalizedAnswer) {
        return trans("jsonInput.answerRequired", `第 ${label} 题请设置答案`);
      }
      if (
        Number(question && question.type) === 1 &&
        normalizedAnswer.length !== 1
      ) {
        return trans(
          "jsonInput.singleAnswerRequired",
          `第 ${label} 题是单选题，只能设置 1 个答案`,
        );
      }
    }

    if (Number(question && question.type) === 3) {
      const answerGroups = toArray(
        question &&
          question.gapFillingAnswer &&
          question.gapFillingAnswer.answerGroups,
      );
      const validAnswers = answerGroups.filter((group) =>
        toArray(group && group.answers).some((item) =>
          cleanupRichTextHtml(item && item.content),
        ),
      );
      if (validAnswers.length === 0) {
        return trans(
          "jsonInput.gapAnswerRequired",
          `第 ${label} 题请至少填写 1 个填空答案`,
        );
      }
    }

    if (
      Number(question && question.type) === 4 &&
      !(question && (question.answer === true || question.answer === false))
    ) {
      return trans(
        "jsonInput.judgeAnswerRequired",
        `第 ${label} 题请选择正确或错误`,
      );
    }

    if (Number(question && question.type) === 6) {
      if (
        !(
          question &&
          Array.isArray(question.sonQuestionList) &&
          question.sonQuestionList.length > 0
        )
      ) {
        return trans(
          "jsonInput.childQuestionRequired",
          `第 ${label} 题是组合题，请至少保留 1 个子题`,
        );
      }
      const childValidationMessage = validateQuestionList(
        question.sonQuestionList,
        label,
      );
      if (childValidationMessage) {
        return childValidationMessage;
      }
    }
  }

  return "";
};
