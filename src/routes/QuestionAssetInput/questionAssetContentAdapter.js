import {
  createEmptyQuestionContentDraft,
  createQuestionPreviewDraft,
  serializeQuestionContentDraft,
} from "@yungu-fed/question-editor";

import {
  createQuestionContentSerializedDraftFromV2Question,
  createQuestionContentV2QuestionFromSerializedDraft,
} from "../../utils/questionContentV2EditorAdapter.js";
import {
  createQuestionEditorContentStructure,
  createQuestionEditorQuestionTypeTemplates,
} from "../../utils/questionTypeEditorAdapter.js";

export const createQuestionAssetContentStructure = (questionType) =>
  createQuestionEditorContentStructure(questionType);

export const getQuestionAssetTypeById = (questionTypes = [], typeId) =>
  questionTypes.find(
    (item) => Number(item.businessQuestionTypeId) === Number(typeId),
  );

export const getDefaultQuestionAssetTypeId = (questionTypes = []) =>
  questionTypes[0]?.businessQuestionTypeId;

export const createQuestionAssetContentStructureByTypeId = (
  questionTypes = [],
  typeId,
) => {
  const questionType = getQuestionAssetTypeById(questionTypes, typeId);

  return questionType
    ? createQuestionAssetContentStructure(questionType)
    : undefined;
};

export const createQuestionAssetEditorDraft = (questionType) =>
  createEmptyQuestionContentDraft(
    createQuestionAssetContentStructure(questionType),
    questionType.businessQuestionTypeId,
  );

export const createQuestionAssetEditorDraftByTypeId = (
  questionTypes,
  typeId,
) => {
  const questionType = getQuestionAssetTypeById(questionTypes, typeId);

  return questionType
    ? createQuestionAssetEditorDraft(questionType)
    : undefined;
};

export const createQuestionAssetQuestionTypeTemplates = (questionTypes = []) =>
  createQuestionEditorQuestionTypeTemplates(questionTypes);

export const isQuestionAssetEditorReady = ({
  draft,
  questionTypes,
  selectedTypeId,
}) => {
  if (!draft || !selectedTypeId) return false;
  const matchingTypes = questionTypes.filter(
    (questionType) =>
      Number(questionType.businessQuestionTypeId) ===
      Number(draft.questionTypeKey),
  );
  return (
    matchingTypes.length === 1 &&
    Number(draft.questionTypeKey) === Number(selectedTypeId)
  );
};

const copyQuestionAssetResourceValue = (value) =>
  Array.isArray(value) ? [...value] : value;

const createQuestionAssetResourceField = (value, fieldFactory) =>
  value === undefined
    ? {}
    : fieldFactory(copyQuestionAssetResourceValue(value));

/**
 * 将页面资源草稿收口成 v2 写入契约，避免把详情响应里的派生字段回写。
 * @param {object} resource 页面资源草稿。
 * @returns {object} v2 QuestionResourcePayload 写入字段。
 */
export const createQuestionAssetV2ResourceRequestFromEditorResource = (
  resource = {},
) => ({
  ...createQuestionAssetResourceField(resource.chapterIds, (chapterIds) => ({
    chapterIds,
  })),
  ...createQuestionAssetResourceField(
    resource.contentImage,
    (contentImage) => ({
      contentImage,
    }),
  ),
  ...createQuestionAssetResourceField(
    resource.enrollmentQuestion,
    (enrollmentQuestion) => ({ enrollmentQuestion }),
  ),
  ...createQuestionAssetResourceField(resource.gradeId, (gradeId) => ({
    gradeId,
  })),
  ...createQuestionAssetResourceField(
    resource.indicatorIds,
    (indicatorIds) => ({
      indicatorIds,
    }),
  ),
  ...createQuestionAssetResourceField(
    resource.knowledgeIds,
    (knowledgeIds) => ({
      knowledgeIds,
    }),
  ),
  ...createQuestionAssetResourceField(resource.level, (level) => ({ level })),
  ...createQuestionAssetResourceField(resource.mathNodeIds, (mathNodeIds) => ({
    mathNodeIds,
  })),
  ...createQuestionAssetResourceField(resource.outSourceId, (outSourceId) => ({
    outSourceId,
  })),
  ...createQuestionAssetResourceField(
    resource.outSourceType,
    (outSourceType) => ({ outSourceType }),
  ),
  ...createQuestionAssetResourceField(
    resource.questionTimeLimit,
    (questionTimeLimit) => ({ questionTimeLimit }),
  ),
  ...createQuestionAssetResourceField(
    resource.sourcePaperId,
    (sourcePaperId) => ({ sourcePaperId }),
  ),
  ...createQuestionAssetResourceField(resource.subjectId, (subjectId) => ({
    subjectId,
  })),
  ...createQuestionAssetResourceField(
    resource.yearPeriodId,
    (yearPeriodId) => ({
      yearPeriodId,
    }),
  ),
});

export const createQuestionAssetEditorResourceDraftFromV2Resource = (
  resource = {},
) => createQuestionAssetV2ResourceRequestFromEditorResource(resource);

export const createQuestionAssetEditorDraftFromV2Question = (
  question,
  questionTypes,
) => {
  const serialized =
    createQuestionContentSerializedDraftFromV2Question(question);
  return createQuestionPreviewDraft(
    serialized,
    createQuestionAssetQuestionTypeTemplates(questionTypes),
  );
};

export const createQuestionAssetEditorStateFromV2Aggregate = (
  aggregate,
  questionTypes,
) => {
  const resource = createQuestionAssetEditorResourceDraftFromV2Resource(
    aggregate.resource,
  );
  const questionType = getQuestionAssetTypeById(
    questionTypes,
    aggregate.question.businessQuestionTypeId,
  );

  if (!questionType) {
    return;
  }

  return {
    draft: createQuestionAssetEditorDraftFromV2Question(
      aggregate.question,
      questionTypes,
    ),
    questionTypes,
    resource,
    selectedTypeId: questionType.businessQuestionTypeId,
  };
};

const createQuestionAssetV2Request = ({
  draft,
  includeQuestionId,
  questionTypes,
  resource,
}) => {
  const serializedDraft = serializeQuestionContentDraft(draft);
  // 保存前使用组件公开 hydrator 递归校验每个未展开子题，并补齐题型定义的 extras。
  const alignedDraft = createQuestionPreviewDraft(
    serializedDraft,
    createQuestionAssetQuestionTypeTemplates(questionTypes),
  );
  const serializedQuestion = serializeQuestionContentDraft(alignedDraft);
  const question = createQuestionContentV2QuestionFromSerializedDraft(
    serializedQuestion,
    {
      includeQuestionId,
    },
  );

  return {
    question,
    resource: createQuestionAssetV2ResourceRequestFromEditorResource(resource),
  };
};

export const createQuestionAssetV2CreateRequest = ({
  draft,
  questionTypes,
  resource,
}) =>
  createQuestionAssetV2Request({
    draft,
    includeQuestionId: false,
    questionTypes,
    resource,
  });

export const createQuestionAssetV2UpdateRequest = ({
  draft,
  questionTypes,
  resource,
}) =>
  createQuestionAssetV2Request({
    draft,
    includeQuestionId: true,
    questionTypes,
    resource,
  });

export const createQuestionAssetV2BasketPayload = ({
  gradeId,
  questionId,
  subjectId,
}) => ({
  gradeId,
  questionId,
  subjectId,
});

export const validateQuestionAssetScope = ({ gradeId, subjectId }) =>
  gradeId && subjectId ? "" : "batchInpt.message1";
