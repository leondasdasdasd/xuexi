import { getQuestionTypeLocalizedName } from "../../utils/questionTypeEditorAdapter.js";

export const buildQuestionTypeContextKey = ({ stageId, subjectId }) =>
  `${stageId}:${subjectId}`;

export const mapServerQuestionTypesToTwoWayOptions = (
  questionTypes = [],
  locale,
) =>
  questionTypes.map((questionType) => ({
    businessQuestionTypeId: questionType.businessQuestionTypeId,
    isComposite: questionType.isComposite,
    label: getQuestionTypeLocalizedName(questionType, locale),
    legacyTypeId: questionType.legacyTypeId,
  }));

export const findQuestionTypeByBusinessId = (
  questionTypes = [],
  businessQuestionTypeId,
) =>
  questionTypes.find(
    (questionType) =>
      Number(questionType.businessQuestionTypeId) ===
      Number(businessQuestionTypeId),
  );

export const getBusinessQuestionTypeLabel = (
  questionTypes = [],
  businessQuestionTypeId,
) =>
  findQuestionTypeByBusinessId(questionTypes, businessQuestionTypeId)?.label ||
  "";

export const createEmptyTwoWayQuestion = (questionType) => ({
  businessQuestionTypeId: questionType.businessQuestionTypeId,
  isComposite: questionType.isComposite,
  predictionDifficulty: 1,
  questionLevelType: undefined,
  questionScore: 1,
  questionTypeName: questionType.label,
  type: questionType.legacyTypeId,
});

export const createModuleQuestionTypeTemplate = (
  firstQuestion,
  questionTypes = [],
) => {
  if (!firstQuestion?.businessQuestionTypeId) {
    return null;
  }

  const registeredType = findQuestionTypeByBusinessId(
    questionTypes,
    firstQuestion.businessQuestionTypeId,
  );

  return {
    businessQuestionTypeId: firstQuestion.businessQuestionTypeId,
    isComposite: firstQuestion.isComposite ?? registeredType?.isComposite,
    questionTypeName: firstQuestion.questionTypeName ?? registeredType?.label,
    type: firstQuestion.type ?? registeredType?.legacyTypeId,
  };
};

export const initializeModuleQuestionTypeTemplate = (
  module,
  questionTypes = [],
) => ({
  ...module,
  questionTypeTemplate:
    module?.questionTypeTemplate ||
    createModuleQuestionTypeTemplate(module?.questionList?.[0], questionTypes),
});

export const applyModuleQuestionTypeTemplate = (question, module) => {
  const template = module?.questionTypeTemplate;

  if (!template?.businessQuestionTypeId) {
    return null;
  }

  return {
    ...question,
    ...template,
  };
};

export const inheritTwoWayQuestionType = (question, parentQuestion) => ({
  ...question,
  businessQuestionTypeId:
    question?.businessQuestionTypeId ?? parentQuestion?.businessQuestionTypeId,
  isComposite: question?.isComposite ?? parentQuestion?.isComposite,
  questionTypeName:
    question?.questionTypeName ?? parentQuestion?.questionTypeName,
  type: question?.type ?? parentQuestion?.type,
});

export const shouldApplyQuestionTypeResponse = ({
  currentContextKey,
  currentRequestVersion,
  requestContextKey,
  requestVersion,
}) =>
  requestVersion === currentRequestVersion &&
  requestContextKey === currentContextKey;

export const shouldReuseQuestionTypeRegistry = ({
  loadedContextKey,
  loading,
  loadError,
  requestedContextKey,
}) => loadedContextKey === requestedContextKey && !loading && loadError == null;
