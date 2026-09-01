import { collectQuestionContentBusinessQuestionTypeIds } from "../../utils/questionContentV2Tree";
import {
  createQuestionPreviewViewModel,
  normalizeV2QuestionAggregateToPreviewDraft,
} from "../../utils/questionPreviewAdapter.js";
import { getQuestionTypeLocalizedName } from "../../utils/questionTypeEditorAdapter.js";

const getQuestionNode = (aggregate) => aggregate.question;

const getNewMyQuestionQuestionId = (aggregate) => getQuestionNode(aggregate).id;

export const collectBusinessQuestionTypeIdsFromAggregates = (aggregates = []) =>
  collectQuestionContentBusinessQuestionTypeIds(
    aggregates.map((aggregate) => getQuestionNode(aggregate)),
  );

export const createNewMyQuestionTypeFilterOptions = (
  questionTypes = [],
  locale,
) =>
  questionTypes.map((questionType) => ({
    code: questionType.businessQuestionTypeId,
    typeName: getQuestionTypeLocalizedName(questionType, locale),
  }));

export const normalizeNewMyQuestionAggregateToPreviewDraft = (aggregate) => {
  return normalizeV2QuestionAggregateToPreviewDraft(aggregate);
};

const getQuestionCreatorName = (aggregate) =>
  `${aggregate?.createUserId || ""}`;

const getQuestionGradeId = (aggregate) => aggregate?.resource?.gradeId;

const getQuestionGradeName = (aggregate) =>
  `${getQuestionGradeId(aggregate) || ""}`;

const getQuestionSubjectId = (aggregate) => aggregate?.resource?.subjectId;

export const createNewMyQuestionActionItemViewModel = (
  aggregate,
  businessQuestionTypesById = {},
  options = {},
) => {
  const questionNode = getQuestionNode(aggregate);
  const questionType =
    businessQuestionTypesById[Number(questionNode.businessQuestionTypeId)];
  const questionId = getNewMyQuestionQuestionId(aggregate);

  return {
    canEdit: true,
    createUserName: getQuestionCreatorName(aggregate),
    gradeId: getQuestionGradeId(aggregate),
    gradeName: getQuestionGradeName(aggregate),
    id: questionId,
    isInQuestionBasket: aggregate.inQuestionBasket,
    level: aggregate?.resource?.level,
    questionTypeDisplayName: getQuestionTypeLocalizedName(
      questionType,
      options.locale,
    ),
    subjectId: getQuestionSubjectId(aggregate),
  };
};

export const updateNewMyQuestionAggregateBasketMembership = (
  aggregates,
  questionId,
  inQuestionBasket,
) =>
  aggregates.map((aggregate) =>
    String(getNewMyQuestionQuestionId(aggregate)) === String(questionId)
      ? { ...aggregate, inQuestionBasket }
      : aggregate,
  );

export const createNewMyQuestionPreviewViewModel = (
  aggregate,
  businessQuestionTypesById = {},
  options = {},
) => ({
  ...createQuestionPreviewViewModel(
    aggregate,
    businessQuestionTypesById,
    options,
  ),
  actionItem: createNewMyQuestionActionItemViewModel(
    aggregate,
    businessQuestionTypesById,
    options,
  ),
});

export const createNewMyQuestionListItemViewModel = (
  aggregate,
  index,
  businessQuestionTypesById = {},
  options = {},
) => {
  const previewViewModel = createNewMyQuestionPreviewViewModel(
    aggregate,
    businessQuestionTypesById,
    options,
  );

  return {
    key: previewViewModel.actionItem.id,
    previewViewModel,
  };
};
