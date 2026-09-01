import { trans } from "../../utils/i18n";

const COMBINATION_QUESTION_TYPE = 6;
export const MIN_MODULE_QUESTION_COUNT = 1;

export const ASSOCIATION_STRATEGY_TYPES = {
  blank: "blank",
  group: "group",
  leaf: "leaf",
};

export const BLANK_ASSOCIATION_NUMBERING_MODE = {
  continuous: "continuous",
  subquestion: "subquestion",
};

const STALE_ASSOCIATION_FIELDS = [
  "associationCompatibility",
  "associationList",
  "blankSplitAssociation",
  "combinationSplitAssociation",
  "sourceLabel",
  "sourceQuestionId",
  "version",
];

const toNumber = (value) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : undefined;
};

const normalizeScore = (value) => {
  const numericValue = toNumber(value);
  return numericValue === undefined
    ? undefined
    : Math.round(numericValue * 100) / 100;
};

const getQuestionTypeLabel = (type) => {
  const questionType = Number(type);

  if (questionType === 1) {
    return "单选题";
  }
  if (questionType === 2) {
    return "多选题";
  }
  if (questionType === 3) {
    return "填空题";
  }
  if (questionType === 4) {
    return "判断题";
  }
  if (questionType === 5) {
    return "问答题";
  }
  if (questionType === 6) {
    return "组合题";
  }

  return "其他题";
};

const getQuestionScore = (question) =>
  normalizeScore(
    question?.questionScore ??
      question?.score ??
      question?.fullScore ??
      question?.points,
  );

export const buildAssociationStrategy = (type, index = 0) => {
  if (
    type === ASSOCIATION_STRATEGY_TYPES.leaf ||
    !Object.values(ASSOCIATION_STRATEGY_TYPES).includes(type)
  ) {
    return null;
  }

  const numericIndex = Number(index);
  return {
    type,
    index: Number.isFinite(numericIndex) ? Math.max(numericIndex, 0) : 0,
  };
};

export const buildBlankAssociationStrategy = ({ blankId, blankOrder }) => ({
  blankId,
  blankOrder,
  type: ASSOCIATION_STRATEGY_TYPES.blank,
});

export const buildQuestionAssociationStrategy = (
  question,
  { bindCombinationAsSingle = false } = {},
) => {
  if (
    bindCombinationAsSingle &&
    Number(question?.type) === COMBINATION_QUESTION_TYPE
  ) {
    return buildAssociationStrategy(ASSOCIATION_STRATEGY_TYPES.group, 0);
  }

  return null;
};

export const getAssociationStrategyLabel = (strategy) => {
  if (!strategy) {
    return "";
  }

  const strategyOrder =
    strategy.type === ASSOCIATION_STRATEGY_TYPES.blank
      ? strategy.blankOrder
      : strategy.index;
  const index = Number.isFinite(Number(strategyOrder))
    ? Number(strategyOrder)
    : 0;

  if (strategy.type === ASSOCIATION_STRATEGY_TYPES.group) {
    return `组${index + 1}`;
  }

  if (strategy.type === ASSOCIATION_STRATEGY_TYPES.leaf) {
    return trans("twoWayTest.leafQuestion", "叶子题");
  }

  if (strategy.type === ASSOCIATION_STRATEGY_TYPES.blank) {
    return `空${index + 1}`;
  }

  return "";
};

export const getCombinationChildDisplayLabel = (childIndex) =>
  `叶${childIndex + 1}`;

export const isAssociationFollowerQuestion = (
  question,
  { includeFirstBlank = false } = {},
) => {
  const strategyType = question?.associationStrategy?.type;
  const strategyIndex = Number(
    strategyType === ASSOCIATION_STRATEGY_TYPES.blank
      ? question?.associationStrategy?.blankOrder
      : question?.associationStrategy?.index,
  );

  if (!Number.isFinite(strategyIndex)) {
    return false;
  }

  if (strategyType === ASSOCIATION_STRATEGY_TYPES.blank) {
    return includeFirstBlank || strategyIndex > 0;
  }

  // 组合题子题关联只是题源映射关系，不能阻断当前单题的属性维护和题目关联操作。
  return false;
};

const BLANK_ASSOCIATION_EDITABLE_FIELDS = new Set([
  "chapterId",
  "indicatorIds",
  "knowledgeIds",
  "predictionDifficulty",
  "questionLevelType",
  "questionScore",
  "sourceType",
]);

export const hasEditableBlankAssociationAttributes = (question) => {
  const strategy = question?.associationStrategy;
  return (
    strategy?.type === ASSOCIATION_STRATEGY_TYPES.blank &&
    strategy.blankOrder != undefined &&
    Number.isFinite(Number(strategy.blankOrder))
  );
};

export const canEditBlankAssociationField = (question, fieldName) =>
  hasEditableBlankAssociationAttributes(question) &&
  BLANK_ASSOCIATION_EDITABLE_FIELDS.has(fieldName);

const getBlankAssociationSourceKey = (question) => {
  if (
    question?.associationStrategy?.type !== ASSOCIATION_STRATEGY_TYPES.blank
  ) {
    return null;
  }

  const sourceId =
    question?.associationSourceSnapshot?.questionId ??
    question?.associationSourceSnapshot?.id ??
    question?.questionId;
  const blankOrder = Number(question?.associationStrategy?.blankOrder);

  return sourceId != undefined && Number.isFinite(blankOrder)
    ? { blankOrder, sourceId: String(sourceId) }
    : null;
};

/**
 * 将题块直属题位按可移动单元分组；连续填空关联题位始终作为一个原子单元。
 * @param {Array<object>} questionList 当前题块的一级题位。
 * @returns {Array<{start: number, end: number}>} 原子单元的索引范围。
 */
export const buildQuestionPlacementUnits = (questionList = []) => {
  const units = [];

  for (let index = 0; index < questionList.length; index += 1) {
    const start = index;
    const blankAssociation = getBlankAssociationSourceKey(questionList[index]);

    if (blankAssociation) {
      while (index + 1 < questionList.length) {
        const nextAssociation = getBlankAssociationSourceKey(
          questionList[index + 1],
        );
        const currentAssociation = getBlankAssociationSourceKey(
          questionList[index],
        );

        if (
          !nextAssociation ||
          nextAssociation.sourceId !== blankAssociation.sourceId ||
          nextAssociation.blankOrder !== currentAssociation.blankOrder + 1
        ) {
          break;
        }

        index += 1;
      }
    }

    units.push({ end: index, start });
  }

  return units;
};

/**
 * 在单个题块内交换相邻完整题位单元，并返回旧索引到新索引的映射。
 * @param {Array<object>} questionList 当前题块的一级题位。
 * @param {number} questionIndex 要移动的单元首题索引。
 * @param {"up" | "down"} direction 移动方向。
 * @returns {{questionList: Array<object>, indexMap: Array<number>, moved: boolean}} 排序结果与索引映射。
 */
export const moveQuestionPlacementUnit = (
  questionList = [],
  questionIndex,
  direction,
) => {
  const units = buildQuestionPlacementUnits(questionList);
  const unitIndex = units.findIndex(
    ({ start, end }) => questionIndex >= start && questionIndex <= end,
  );
  const targetUnitIndex = unitIndex + (direction === "up" ? -1 : 1);

  if (
    unitIndex < 0 ||
    questionIndex !== units[unitIndex].start ||
    targetUnitIndex < 0 ||
    targetUnitIndex >= units.length
  ) {
    return {
      indexMap: questionList.map((unusedQuestion, index) => index),
      moved: false,
      questionList: [...questionList],
    };
  }

  const orderedUnitIndexes = units.map((unusedUnit, index) => index);
  [orderedUnitIndexes[unitIndex], orderedUnitIndexes[targetUnitIndex]] = [
    orderedUnitIndexes[targetUnitIndex],
    orderedUnitIndexes[unitIndex],
  ];

  const indexMap = [];
  const nextQuestionList = [];
  for (const orderedUnitIndex of orderedUnitIndexes) {
    const unit = units[orderedUnitIndex];
    for (let oldIndex = unit.start; oldIndex <= unit.end; oldIndex += 1) {
      indexMap[oldIndex] = nextQuestionList.length;
      nextQuestionList.push(questionList[oldIndex]);
    }
  }

  return { indexMap, moved: true, questionList: nextQuestionList };
};

export const formatDecimalDisplay = (value) => {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const text = String(value);

  if (!text.includes(".")) {
    return `${text}.00`;
  }

  const [integerPart, decimalPart] = text.split(".");

  return decimalPart.length === 1 ? `${integerPart}.${decimalPart}0` : text;
};

export const buildQuestionFromPreviousTemplate = (previousQuestion) => ({
  questionScore: previousQuestion?.questionScore || 1,
  predictionDifficulty: previousQuestion?.predictionDifficulty,
  questionLevelType: previousQuestion?.questionLevelType,
  sourceType: previousQuestion?.sourceType,
  // 此处只复制编辑默认值；调用方必须在所属边界覆盖题型字段。
  type: previousQuestion?.type,
});

export const isValidModuleQuestionCount = (value) => {
  if (value === "" || value == undefined || typeof value === "boolean") {
    return false;
  }

  const questionCount = Number(value);

  return (
    Number.isInteger(questionCount) &&
    questionCount >= MIN_MODULE_QUESTION_COUNT
  );
};

const hasQuestionType = (type) => type != undefined && type !== "";

export const normalizeExamSideSonQuestions = (sonQuestions, parentType) => {
  const shouldInheritParentType = hasQuestionType(parentType);
  const currentSonQuestions = Array.isArray(sonQuestions) ? sonQuestions : [];

  return currentSonQuestions.map((sonQuestion) => {
    const nextSonQuestion = {
      ...(sonQuestion == undefined ? {} : sonQuestion),
    };

    // 考试侧子题必须带题型，AI 匹配会按题型选择结构规则和字段示例。
    if (!hasQuestionType(nextSonQuestion.type) && shouldInheritParentType) {
      nextSonQuestion.type = parentType;
    }

    return nextSonQuestion;
  });
};

export const resizeExamSideSonQuestions = ({
  parentType,
  sonQuestions,
  targetCount,
}) => {
  const nextCount = Math.max(Number(targetCount) || 0, 0);
  const nextSonQuestions = normalizeExamSideSonQuestions(
    sonQuestions,
    parentType,
  ).slice(0, nextCount);
  const appendedCount = Math.max(nextCount - nextSonQuestions.length, 0);
  const newSonQuestions = Array.from({ length: appendedCount }, () => ({
    ...(hasQuestionType(parentType) ? { type: parentType } : {}),
    questionScore: 0,
  }));

  return [...nextSonQuestions, ...newSonQuestions];
};

export const buildBlankSubquestionAssociationPatch = ({
  blankParts,
  childQuestions,
  parentScore,
  questionType,
  sourceQuestionId,
}) => {
  const existingChildren = Array.isArray(childQuestions) ? childQuestions : [];
  const generatedScore =
    existingChildren.length === 0 && parentScore != undefined
      ? Number((Number(parentScore) / blankParts.length).toFixed(2))
      : undefined;
  const sonQuestionList = blankParts.map((blankPart, blankOrder) => ({
    ...existingChildren[blankOrder],
    associationStrategy: buildBlankAssociationStrategy({
      blankId: blankPart.blankId,
      blankOrder,
    }),
    indicatorName: existingChildren[blankOrder]?.indicatorName || [],
    questionId: sourceQuestionId,
    questionScore:
      existingChildren[blankOrder]?.questionScore ?? generatedScore,
    type: questionType,
  }));

  return {
    associationStrategy: null,
    questionId: sourceQuestionId,
    questionScore:
      parentScore ??
      sonQuestionList.reduce(
        (totalScore, sonQuestion) =>
          totalScore + (sonQuestion.questionScore || 0),
        0,
      ),
    sonQuestionList,
    sonQuestionScores: sonQuestionList.map((sonQuestion, sonQuestionIndex) => ({
      index: sonQuestionIndex,
      score: sonQuestion.questionScore,
    })),
  };
};

const normalizeAssociationNames = (ids, values) => {
  if (!Array.isArray(values) || values.length === 0) {
    return [];
  }

  const normalizedIds = Array.isArray(ids) ? ids.map(String) : [];
  const matchedValues =
    normalizedIds.length > 0
      ? normalizedIds
          .map((id) =>
            values.find((value) => String(value).split("-")[0] === id),
          )
          .filter(Boolean)
      : values;

  return matchedValues.map((value) => {
    const parts = String(value).split("-");
    return parts.length > 1 ? parts.slice(1).join("-") : parts[0];
  });
};

const normalizeChildAssociationNames = (
  childQuestion,
  nameKey,
  idsKey,
  valuesKey,
) => {
  if (Array.isArray(childQuestion[nameKey])) {
    return childQuestion[nameKey];
  }

  return normalizeAssociationNames(
    childQuestion[idsKey],
    childQuestion[valuesKey],
  );
};

// 通用“+”按来源内容树递归生成题位树，每层保留自己的业务题型。
const mapSourceContentNodeToPlacement = (sourceQuestion) => {
  const sourceChildren = Array.isArray(sourceQuestion?.children)
    ? sourceQuestion.children
    : [];
  const sonQuestionList = sourceChildren.map(mapSourceContentNodeToPlacement);
  const hasChildScore = sonQuestionList.some(
    (childQuestion) => childQuestion.questionScore != undefined,
  );
  const childTotalScore = sonQuestionList.reduce(
    (totalScore, childQuestion) =>
      totalScore + (childQuestion.questionScore || 0),
    0,
  );
  const placement = { ...sourceQuestion };

  // 内容树仅用于生成题位，题位对外只保留 sonQuestionList 结构。
  delete placement.children;
  delete placement.questionData;
  delete placement.v2Aggregate;

  const questionScore =
    sourceQuestion.questionScore == undefined
      ? hasChildScore
        ? childTotalScore
        : undefined
      : sourceQuestion.questionScore;

  return {
    ...placement,
    chapterName: normalizeChildAssociationNames(
      sourceQuestion,
      "chapterName",
      "chapterId",
      "chapterValues",
    ),
    checked: false,
    indicatorName: normalizeChildAssociationNames(
      sourceQuestion,
      "indicatorName",
      "indicatorIds",
      "indicatorValues",
    ),
    knowledge: normalizeChildAssociationNames(
      sourceQuestion,
      "knowledge",
      "knowledgeIds",
      "knowledgeValues",
    ),
    ...(questionScore == undefined ? {} : { questionScore }),
    sonQuestionList,
    sonQuestionScores: sonQuestionList.map((sonQuestion, sonQuestionIndex) => ({
      index: sonQuestionIndex,
      score: sonQuestion.questionScore,
    })),
  };
};

export const buildCombinationQuestionAssociationPatch = (question) => {
  const childQuestions = Array.isArray(question?.children)
    ? question.children
    : [];

  if (
    Number(question?.type) !== COMBINATION_QUESTION_TYPE ||
    childQuestions.length === 0
  ) {
    return {};
  }

  const sonQuestionList = childQuestions.map(mapSourceContentNodeToPlacement);
  const hasChildScore = sonQuestionList.some(
    (childQuestion) => childQuestion.questionScore != undefined,
  );
  const childTotalScore = sonQuestionList.reduce(
    (totalScore, childQuestion) =>
      totalScore + (childQuestion.questionScore || 0),
    0,
  );

  const questionScore =
    question.questionScore == undefined
      ? hasChildScore
        ? childTotalScore
        : undefined
      : question.questionScore;

  return {
    ...(questionScore == undefined ? {} : { questionScore }),
    sonQuestionList,
    sonQuestionScores: sonQuestionList.map((sonQuestion, sonQuestionIndex) => ({
      index: sonQuestionIndex,
      score: sonQuestion.questionScore,
    })),
  };
};

export const buildClearAssociatedChildrenPatch = () => ({
  sonQuestionList: null,
  sonQuestionScores: null,
});

const getQuestionId = (question) => question?.questionId || question?.id;

const isSameQuestionId = (left, right) =>
  left != undefined && right != undefined && String(left) === String(right);

export const getLeafAssociationSourceId = (question) =>
  question?.associationStrategy?.type === ASSOCIATION_STRATEGY_TYPES.leaf
    ? question.associationStrategy.nodePath?.[0]
    : getQuestionId(question?.associationSourceSnapshot) ||
      question?.virtualAssociation?.sourceQuestionId ||
      question?.questionId;

export const getQuestionAssociationIds = (question) => {
  if (
    question?.associationStrategy?.type === ASSOCIATION_STRATEGY_TYPES.leaf &&
    question.associationStrategy.nodePath?.[0] != undefined
  ) {
    return [question.associationStrategy.nodePath[0]];
  }

  return question?.questionId == undefined ? [] : [question.questionId];
};

const removeSplitAssociationGroupByType = (
  questionTypeList,
  target,
  fallbackPosition,
  associationType,
) => {
  const sourceQuestionId = getLeafAssociationSourceId(target);
  const targetStrategyIndex = Number(target?.associationStrategy?.index);
  const fallbackModule = questionTypeList[fallbackPosition?.moduleIndex];
  const fallbackQuestionList = fallbackModule?.questionList || [];
  let fallbackStartIndex = fallbackPosition?.questionIndex;
  let fallbackEndIndex = fallbackPosition?.questionIndex;

  if (
    Number.isFinite(targetStrategyIndex) &&
    Array.isArray(fallbackQuestionList)
  ) {
    while (
      fallbackStartIndex > 0 &&
      fallbackQuestionList[fallbackStartIndex - 1]?.associationStrategy
        ?.type === associationType &&
      Number(
        fallbackQuestionList[fallbackStartIndex - 1]?.associationStrategy
          ?.index,
      ) ===
        Number(
          fallbackQuestionList[fallbackStartIndex]?.associationStrategy?.index,
        ) -
          1
    ) {
      fallbackStartIndex -= 1;
    }

    while (
      fallbackEndIndex < fallbackQuestionList.length - 1 &&
      fallbackQuestionList[fallbackEndIndex + 1]?.associationStrategy?.type ===
        associationType &&
      Number(
        fallbackQuestionList[fallbackEndIndex + 1]?.associationStrategy?.index,
      ) ===
        Number(
          fallbackQuestionList[fallbackEndIndex]?.associationStrategy?.index,
        ) +
          1
    ) {
      fallbackEndIndex += 1;
    }
  }

  const sourceMatchedCount =
    sourceQuestionId == undefined
      ? 0
      : questionTypeList.reduce(
          (count, moduleItem) =>
            count +
            (moduleItem.questionList || []).filter(
              (question) =>
                question?.associationStrategy?.type === associationType &&
                isSameQuestionId(
                  getLeafAssociationSourceId(question),
                  sourceQuestionId,
                ),
            ).length,
          0,
        );

  return questionTypeList.map((moduleItem, moduleIndex) => {
    if (!Array.isArray(moduleItem.questionList)) {
      return moduleItem;
    }

    const questionList =
      sourceQuestionId == undefined || sourceMatchedCount <= 1
        ? moduleItem.questionList.filter(
            (_, questionIndex) =>
              moduleIndex !== fallbackPosition?.moduleIndex ||
              questionIndex < fallbackStartIndex ||
              questionIndex > fallbackEndIndex,
          )
        : moduleItem.questionList.filter(
            (question) =>
              question?.associationStrategy?.type !== associationType ||
              !isSameQuestionId(
                getLeafAssociationSourceId(question),
                sourceQuestionId,
              ),
          );

    return {
      ...moduleItem,
      questionList,
      questionNum: questionList.length,
    };
  });
};

export const removeCombinationSplitAssociationGroup = (
  questionTypeList,
  target,
  fallbackPosition,
) =>
  removeSplitAssociationGroupByType(
    questionTypeList,
    target,
    fallbackPosition,
    ASSOCIATION_STRATEGY_TYPES.leaf,
  );

export const removeBlankSplitAssociationGroup = (
  questionTypeList,
  target,
  fallbackPosition,
) =>
  removeSplitAssociationGroupByType(
    questionTypeList,
    target,
    fallbackPosition,
    ASSOCIATION_STRATEGY_TYPES.blank,
  );

export const hasAssociatedQuestionInResizeRemovedRange = (
  questionList,
  nextQuestionCount,
) => {
  if (!Array.isArray(questionList)) {
    return false;
  }

  return questionList
    .slice(nextQuestionCount)
    .some(
      (question) =>
        question?.questionId != undefined ||
        question?.associationStrategy ||
        (Array.isArray(question?.sonQuestionList) &&
          question.sonQuestionList.some(
            (sonQuestion) =>
              sonQuestion?.questionId != undefined ||
              sonQuestion?.associationStrategy,
          )),
    );
};

export const sanitizeAssociationPayloadQuestion = (question) => {
  if (!question) {
    return question;
  }

  for (const field of STALE_ASSOCIATION_FIELDS) {
    delete question[field];
  }
  delete question.associationSourceSnapshot;
  delete question.virtualAssociation;

  if (!question.associationStrategy) {
    delete question.associationStrategy;
  }

  if (Array.isArray(question.sonQuestionList)) {
    question.sonQuestionList.forEach(sanitizeAssociationPayloadQuestion);
  }

  return question;
};

export const normalizeSaveSonQuestion = (question) => {
  if (!question) {
    return question;
  }

  return {
    ...question,
    // 保存时统一补齐题库题目主键，避免子题只剩本地 id 而丢失后端识别字段。
    questionId: question.questionId ?? question.id ?? null,
  };
};

export const getQuestionFillBlankParts = (question) => {
  const elements = Array.isArray(question?.questionData?.elements)
    ? question.questionData.elements
    : [];
  const blankIds = elements
    .filter((element) => element?.type === "fill")
    .flatMap((element) =>
      Array.isArray(element.blanks) ? element.blanks : [],
    );
  const normalizedBlankIds = blankIds.map((blankId) =>
    typeof blankId === "string" ? blankId.trim() : "",
  );
  const uniqueBlankIds = new Set(normalizedBlankIds);

  if (
    normalizedBlankIds.some((blankId) => blankId.length === 0) ||
    uniqueBlankIds.size !== normalizedBlankIds.length
  ) {
    throw new Error(
      trans(
        "twoWayTest.fillBlankIdsMustBeUnique",
        "填空题空位 ID 必须非空且唯一",
      ),
    );
  }

  return normalizedBlankIds.map((blankId, blankOrder) => ({
    blankId,
    blankOrder,
    label: String(blankOrder + 1),
  }));
};

export const buildBlankAssociationTargetLabels = ({
  blankCount,
  numberingMode,
  startNo,
}) => {
  if (!startNo || !blankCount) {
    return [];
  }

  return Array.from({ length: blankCount }).map((_, index) =>
    numberingMode === BLANK_ASSOCIATION_NUMBERING_MODE.subquestion
      ? `${startNo}.${index + 1}`
      : String(startNo + index),
  );
};

export const getDefaultBlankAssociationNumberingMode = (question) =>
  Array.isArray(question?.sonQuestionList) &&
  question.sonQuestionList.length > 0
    ? BLANK_ASSOCIATION_NUMBERING_MODE.subquestion
    : BLANK_ASSOCIATION_NUMBERING_MODE.continuous;

const buildTargetFragments = (question, questionLabel) => {
  const childQuestions = Array.isArray(question?.sonQuestionList)
    ? question.sonQuestionList
    : [];

  if (childQuestions.length > 0) {
    return {
      fragmentCount: childQuestions.length,
      fragments: childQuestions.map((childQuestion, index) => ({
        id: `${questionLabel}-target-child-${index + 1}`,
        label: `${questionLabel}.${index + 1}`,
        score: getQuestionScore(childQuestion),
        typeLabel: getQuestionTypeLabel(childQuestion?.type || question?.type),
      })),
      structureKind: "childQuestions",
      structureLabel: `${childQuestions.length} 个子题`,
    };
  }

  const blankAnswers = getQuestionFillBlankParts(question);

  if (blankAnswers.length > 1) {
    return {
      fragmentCount: blankAnswers.length,
      fragments: blankAnswers.map((answer, index) => ({
        id: `${questionLabel}-target-blank-${index + 1}`,
        label: `${questionLabel}(${index + 1})`,
        score:
          getQuestionScore(question) === undefined
            ? undefined
            : normalizeScore(getQuestionScore(question) / blankAnswers.length),
        typeLabel: getQuestionTypeLabel(question?.type),
      })),
      structureKind: "fillBlank",
      structureLabel: `${blankAnswers.length} 个空位`,
    };
  }

  return {
    fragmentCount: 1,
    fragments: [
      {
        id: `${questionLabel}-target-single`,
        label: questionLabel,
        score: getQuestionScore(question),
        typeLabel: getQuestionTypeLabel(question?.type),
      },
    ],
    structureKind: "single",
    structureLabel: "单题",
  };
};

const buildSourceFragments = (question, questionLabel) => {
  const childQuestions = Array.isArray(question?.sonQuestionList)
    ? question.sonQuestionList
    : [];

  if (
    Number(question?.type) === COMBINATION_QUESTION_TYPE &&
    childQuestions.length > 0
  ) {
    return {
      fragmentCount: childQuestions.length,
      fragments: childQuestions.map((childQuestion, index) => ({
        id: `${questionLabel}-source-child-${index + 1}`,
        label: `${questionLabel}-${index + 1}`,
        score: getQuestionScore(childQuestion),
        typeLabel: getQuestionTypeLabel(childQuestion?.type || question?.type),
      })),
      structureKind: "combination",
      structureLabel: `${childQuestions.length} 个组合子题`,
    };
  }

  const blankAnswers = getQuestionFillBlankParts(question);

  if (blankAnswers.length > 1) {
    return {
      fragmentCount: blankAnswers.length,
      fragments: blankAnswers.map((answer, index) => ({
        id: `${questionLabel}-source-blank-${index + 1}`,
        label: `${questionLabel}(${index + 1})`,
        score:
          getQuestionScore(question) === undefined
            ? undefined
            : normalizeScore(getQuestionScore(question) / blankAnswers.length),
        typeLabel: getQuestionTypeLabel(question?.type),
      })),
      structureKind: "fillBlank",
      structureLabel: `${blankAnswers.length} 个空位`,
    };
  }

  return {
    fragmentCount: 1,
    fragments: [
      {
        id: `${questionLabel}-source-single`,
        label: questionLabel,
        score: getQuestionScore(question),
        typeLabel: getQuestionTypeLabel(question?.type),
      },
    ],
    structureKind: "single",
    structureLabel: "单题",
  };
};

const buildPreviewPairs = (targetFragments, sourceFragments) => {
  if (targetFragments.length === 1 && sourceFragments.length > 1) {
    return sourceFragments.map((sourceFragment) => ({
      sourceLabel: sourceFragment?.label,
      targetLabel: targetFragments[0]?.label,
    }));
  }

  const size = Math.min(targetFragments.length, sourceFragments.length);

  return Array.from({ length: size }).map((_, index) => ({
    sourceLabel: sourceFragments[index]?.label,
    targetLabel: targetFragments[index]?.label,
  }));
};

const getSimpleStructureName = (summary, role) => {
  if (!summary) {
    return role === "source" ? "原卷题目" : "答题卡题目";
  }

  if (summary.structureKind === "fillBlank") {
    return `${summary.fragmentCount} 空填空题`;
  }

  if (summary.structureKind === "combination") {
    return `${summary.fragmentCount} 小问组合题`;
  }

  if (summary.structureKind === "childQuestions") {
    return `${summary.fragmentCount} 个子题`;
  }

  return summary.typeLabel || summary.structureLabel || "单题";
};

const buildModeNote = ({
  mode,
  sourceSummary,
  targetSummary,
  sourceLabel,
  targetLabel,
}) => {
  if (mode === "blank-compatible") {
    return `已关联原卷第 ${sourceLabel} 题。原卷是 ${getSimpleStructureName(sourceSummary, "source")}，当前第 ${targetLabel} 题已有 ${targetSummary.fragmentCount} 个子题；系统按空位顺序关联到 ${targetLabel}.1-${targetLabel}.${targetSummary.fragmentCount}。`;
  }

  if (mode === "parent-child") {
    if (
      targetSummary.fragmentCount === 1 &&
      sourceSummary.structureKind === "combination" &&
      sourceSummary.fragmentCount > 1
    ) {
      return `已关联原卷组合题第 ${sourceLabel} 题。原卷有 ${sourceSummary.fragmentCount} 个小问，当前第 ${targetLabel} 题保持一个题号；错题打印使用组合题题干和已挂小问。`;
    }

    return `已关联原卷组合题第 ${sourceLabel} 题。原卷有 ${sourceSummary.fragmentCount} 个小问，当前第 ${targetLabel} 题已有 ${targetSummary.fragmentCount} 个子题；系统按小问顺序关联到 ${targetLabel}.1-${targetLabel}.${targetSummary.fragmentCount}。`;
  }

  if (mode === "parent-only") {
    return `已关联原卷第 ${sourceLabel} 题，但当前第 ${targetLabel} 题还是${getSimpleStructureName(targetSummary, "target")}。如果老师把它录成连续单题，先生成子题，再做关联子题或关联空位。`;
  }

  if (sourceSummary.fragmentCount > 1 || targetSummary.fragmentCount > 1) {
    return `当前只把第 ${targetLabel} 题整体关联到原卷第 ${sourceLabel} 题，不处理下面的小问或空位。`;
  }

  return `当前把第 ${targetLabel} 题整体关联到原卷第 ${sourceLabel} 题。`;
};

const getAvailableModes = ({ sourceSummary, targetSummary }) => {
  const supportsStructuredSource = sourceSummary.fragmentCount > 1;
  const sameFragmentCount =
    supportsStructuredSource &&
    targetSummary.fragmentCount === sourceSummary.fragmentCount &&
    targetSummary.fragmentCount > 1;
  const supportsSingleTargetParentChild =
    supportsStructuredSource &&
    sourceSummary.structureKind === "combination" &&
    targetSummary.fragmentCount === 1;
  const supportsBlankCompatible =
    sameFragmentCount && sourceSummary.structureKind === "fillBlank";
  const supportsParentChild =
    sameFragmentCount || supportsSingleTargetParentChild;
  const modes = [{ value: "single" }];

  if (supportsParentChild) {
    modes.push({ value: "parent-child" });
  }

  if (supportsBlankCompatible) {
    modes.push({ value: "blank-compatible" });
  }

  if (supportsStructuredSource && !supportsParentChild) {
    modes.push({ value: "parent-only" });
  }

  return {
    sameFragmentCount,
    supportsBlankCompatible,
    supportsParentChild,
    supportsStructuredSource,
    values: modes,
  };
};

const getDefaultMode = (modeAvailability) => {
  if (modeAvailability.supportsBlankCompatible) {
    return "blank-compatible";
  }

  if (modeAvailability.supportsParentChild) {
    return "parent-child";
  }

  if (modeAvailability.supportsStructuredSource) {
    return "parent-only";
  }

  return "single";
};

const normalizeSourceQuestion = (sourceQuestion) => {
  if (Array.isArray(sourceQuestion)) {
    return sourceQuestion[0];
  }

  return sourceQuestion;
};

export const buildVirtualAssociationPlan = ({
  targetQuestion,
  sourceQuestion,
  targetQuestionLabel,
  sourceQuestionLabel,
}) => {
  const normalizedSourceQuestion = normalizeSourceQuestion(sourceQuestion);

  if (!targetQuestion || !normalizedSourceQuestion) {
    return null;
  }

  const sourceSummary = buildSourceFragments(
    normalizedSourceQuestion,
    sourceQuestionLabel,
  );
  const targetSummary = buildTargetFragments(
    targetQuestion,
    targetQuestionLabel,
  );
  const modeAvailability = getAvailableModes({
    sourceSummary,
    targetSummary,
  });
  const mode = getDefaultMode(modeAvailability);

  return {
    availableModes: modeAvailability.values,
    mode,
    modeLabel: mode,
    note: buildModeNote({
      mode,
      sourceSummary,
      targetSummary,
      sourceLabel: sourceQuestionLabel,
      targetLabel: targetQuestionLabel,
    }),
    previewPairs: buildPreviewPairs(
      targetSummary.fragments,
      sourceSummary.fragments,
    ),
    sourceQuestionId:
      normalizedSourceQuestion?.questionId || normalizedSourceQuestion?.id,
    sourceQuestionLabel,
    sourceSummary: {
      ...sourceSummary,
      typeLabel: getQuestionTypeLabel(normalizedSourceQuestion?.type),
      title: getQuestionTypeLabel(normalizedSourceQuestion?.type),
    },
    targetQuestionLabel,
    targetSummary,
  };
};

export const changeVirtualAssociationMode = ({ plan, nextMode }) => {
  if (!plan || !nextMode) {
    return plan;
  }

  return {
    ...plan,
    mode: nextMode,
    modeLabel: nextMode,
    note: buildModeNote({
      mode: nextMode,
      sourceSummary: plan.sourceSummary,
      targetSummary: plan.targetSummary,
      sourceLabel: plan.sourceQuestionLabel,
      targetLabel: plan.targetQuestionLabel,
    }),
  };
};
