import { trans } from "../../utils/i18n";
import { collectQuestionContentBusinessQuestionTypeIds } from "../../utils/questionContentV2Tree";

export interface V2QuestionContent {
  id: number;
  businessQuestionTypeId: number;
  version: string;
  elements: unknown[];
  extras?: unknown;
  children: V2QuestionContent[];
}

export interface V2QuestionResource {
  level?: number;
  knowledgeIds?: number[];
  chapterIds?: number[];
  indicatorIds?: number[];
}

export interface V2QuestionAggregate {
  createUserId?: number;
  id: number;
  question: V2QuestionContent;
  resource?: V2QuestionResource;
}

export interface TwoWayQuestionPreviewView extends TwoWayQuestionDraft {
  createUserName: string;
  id: number;
  level?: number;
  type?: number;
  v2Aggregate: V2QuestionAggregate;
}

interface TwoWayQuestionCandidateNode extends TwoWayQuestionDraft {
  children: TwoWayQuestionCandidateNode[];
  type?: number;
}

export interface BusinessQuestionTypeRegistryItem {
  businessQuestionTypeId: number;
  legacyTypeId?: number;
  [key: string]: unknown;
}

export interface TwoWayQuestionContentData {
  id?: number;
  businessQuestionTypeId: number;
  version: string;
  elements: unknown[];
  extras?: unknown;
  children: TwoWayQuestionContentData[];
}

export interface TwoWayQuestionDraft {
  questionId?: number;
  businessQuestionTypeId: number;
  questionData: TwoWayQuestionContentData;
  questionScore?: number;
  questionLevelType?: number;
  predictionDifficulty?: number;
  sourceType?: number;
  knowledgeIds: number[];
  chapterIds: number[];
  indicatorIds: number[];
  associationStrategy?: unknown;
  children: TwoWayQuestionDraft[];
}

interface PaperQuestionDataResponse {
  id?: number;
  businessQuestionTypeId: number;
  version: string;
  elements: unknown[];
  extras?: unknown;
  children?: PaperQuestionDataResponse[];
}

interface PaperQuestionResponse {
  questionId?: number;
  businessQuestionTypeId: number;
  questionScore?: number;
  questionLevelType?: number;
  predictionDifficulty?: number;
  sourceType?: number;
  knowledgeIds?: number[];
  chapterIds?: number[];
  indicatorIds?: number[];
  associationStrategy?: unknown;
  children?: PaperQuestionResponse[];
  questionData: PaperQuestionDataResponse | null;
}

interface PaperModuleResponse {
  moduleName: string;
  moduleQuestionNumber: number;
  questionList: PaperQuestionResponse[];
}

interface SegmentationPaperResponse {
  gradeId: number;
  id: number;
  moduleList?: PaperModuleResponse[];
  subjectId: number;
  title: string;
  totalScore: number;
  type: number;
}

interface TwoWayModuleDraft {
  moduleName: string;
  questions: TwoWayQuestionDraft[];
}

interface TwoWayPaperDraft {
  gradeId: number;
  modules: TwoWayModuleDraft[];
  paperId?: number;
  paperTypeCode: number;
  preview?: boolean;
  subjectId: number;
  tabId?: string;
  title: string;
  totalScore: number;
}

interface TwoWayQuestionView extends TwoWayQuestionDraft {
  chapterId?: number[];
  id?: number;
  sonQuestionList?: TwoWayQuestionView[];
  type?: number;
}

interface AssociationStrategy {
  nodePath?: unknown;
  type?: unknown;
  [key: string]: unknown;
}

interface TwoWayModuleView {
  moduleName: string;
  questionList: TwoWayQuestionView[];
}

interface TwoWayPaperView {
  gradeId: number;
  isPreview?: boolean;
  paperModuleModels: TwoWayModuleView[];
  subjectId: number;
  tabId?: string;
  title: string;
  totalScore: number;
  type: number;
}

const copy = <T>(values?: T[]): T[] =>
  Array.isArray(values) ? [...values] : [];

const mapAssociationStrategyToV2Request = (
  strategy: unknown,
  questionId?: number,
): unknown => {
  const value = strategy as AssociationStrategy | null | undefined;
  if (value?.type !== "leaf") {
    return strategy;
  }

  const nodePath = Array.isArray(value.nodePath) ? value.nodePath : [];
  const valid =
    nodePath.length >= 2 &&
    nodePath.every((id) => Number.isInteger(Number(id)) && Number(id) > 0) &&
    Number(nodePath.at(-1)) === Number(questionId);
  if (!valid) {
    throw new Error(
      trans(
        "twoWayTest.invalidLeafNodePathForSave",
        "保存细目表失败：leaf 关联必须包含完整且有效的 nodePath，questionId={$questionId}",
        { questionId },
      ),
    );
  }

  return { nodePath: nodePath.map(Number), type: "leaf" };
};

const mapV2ContentData = (
  question: V2QuestionContent,
): TwoWayQuestionContentData => ({
  businessQuestionTypeId: question.businessQuestionTypeId,
  children: copy(question.children).map((child) => mapV2ContentData(child)),
  elements: copy(question.elements),
  extras: question.extras,
  id: question.id,
  version: question.version,
});

const mapContent = (
  question: V2QuestionContent,
  resource: V2QuestionResource = {},
): TwoWayQuestionDraft => ({
  businessQuestionTypeId: question.businessQuestionTypeId,
  chapterIds: copy(resource.chapterIds),
  children: copy(question.children).map((child) => mapContent(child)),
  indicatorIds: copy(resource.indicatorIds),
  knowledgeIds: copy(resource.knowledgeIds),
  questionData: mapV2ContentData(question),
  questionId: question.id,
  questionLevelType: resource.level,
});

export const mapV2QuestionAggregateToTwoWayDraft = (
  aggregate: V2QuestionAggregate,
): TwoWayQuestionDraft => mapContent(aggregate.question, aggregate.resource);

const mapDraftToCandidateNode = (
  draft: TwoWayQuestionDraft,
  questionTypeByBusinessId: Map<number, BusinessQuestionTypeRegistryItem>,
): TwoWayQuestionCandidateNode => ({
  ...draft,
  children: copy(draft.children).map((child) =>
    mapDraftToCandidateNode(child, questionTypeByBusinessId),
  ),
  type: questionTypeByBusinessId.get(Number(draft.businessQuestionTypeId))
    ?.legacyTypeId,
});

const persistedQuestionId = (question: TwoWayQuestionView) => {
  const candidate = question.questionId ?? question.id;
  const numericCandidate = Number(candidate);
  return Number.isInteger(numericCandidate) && numericCandidate > 0
    ? numericCandidate
    : undefined;
};

const mapV2QuestionAggregateToTwoWayView = (
  aggregate: V2QuestionAggregate,
  questionTypeByBusinessId: Map<number, BusinessQuestionTypeRegistryItem>,
): TwoWayQuestionPreviewView => {
  const draft = mapDraftToCandidateNode(
    mapV2QuestionAggregateToTwoWayDraft(aggregate),
    questionTypeByBusinessId,
  );
  return {
    ...draft,
    id: aggregate.id,
    createUserName: aggregate.createUserId
      ? String(aggregate.createUserId)
      : "",
    level: aggregate.resource?.level,
    type: draft.type,
    v2Aggregate: aggregate,
  };
};

export const mapV2QuestionAggregatesWithRegistryToTwoWayViews = (
  aggregates: V2QuestionAggregate[],
  questionTypes: BusinessQuestionTypeRegistryItem[],
) => {
  const questionTypeByBusinessId = new Map(
    questionTypes.map((questionType) => [
      Number(questionType.businessQuestionTypeId),
      questionType,
    ]),
  );
  const missingBusinessQuestionTypeIds =
    collectQuestionContentBusinessQuestionTypeIds(
      aggregates.map((aggregate) => aggregate.question),
    ).filter(
      (businessQuestionTypeId) =>
        !questionTypeByBusinessId.has(businessQuestionTypeId),
    );

  if (missingBusinessQuestionTypeIds.length > 0) {
    return { missingBusinessQuestionTypeIds, views: [] };
  }

  return {
    missingBusinessQuestionTypeIds,
    views: aggregates.map((aggregate) =>
      mapV2QuestionAggregateToTwoWayView(aggregate, questionTypeByBusinessId),
    ),
  };
};

const mapPaperQuestionData = (
  question: PaperQuestionDataResponse | null,
  placementBusinessQuestionTypeId: number,
): TwoWayQuestionContentData => {
  if (question === null) {
    return {
      businessQuestionTypeId: placementBusinessQuestionTypeId,
      children: [],
      elements: [],
      version: "1",
    };
  }

  return {
    businessQuestionTypeId: question.businessQuestionTypeId,
    children: copy(question.children).map((child) =>
      mapPaperQuestionData(child, child.businessQuestionTypeId),
    ),
    elements: copy(question.elements),
    extras: question.extras,
    id: question.id,
    version: question.version,
  };
};

export const mapV2PaperQuestionToTwoWayDraft = (
  question: PaperQuestionResponse,
): TwoWayQuestionDraft => ({
  associationStrategy: question.associationStrategy,
  businessQuestionTypeId: question.businessQuestionTypeId,
  chapterIds: copy(question.chapterIds),
  children: copy(question.children).map((child) =>
    mapV2PaperQuestionToTwoWayDraft(child),
  ),
  indicatorIds: copy(question.indicatorIds),
  knowledgeIds: copy(question.knowledgeIds),
  questionData: mapPaperQuestionData(
    question.questionData,
    question.businessQuestionTypeId,
  ),
  questionId: question.questionId,
  predictionDifficulty: question.predictionDifficulty,
  questionLevelType: question.questionLevelType,
  questionScore: question.questionScore,
  sourceType: question.sourceType,
});

export const mapV2SegmentationPaperToTwoWayDraft = (
  paper: SegmentationPaperResponse,
): TwoWayPaperDraft => ({
  gradeId: paper.gradeId,
  modules: copy(paper.moduleList).map((module) => ({
    moduleName: module.moduleName,
    questions: copy(module.questionList).map((question) =>
      mapV2PaperQuestionToTwoWayDraft(question),
    ),
  })),
  paperId: paper.id,
  paperTypeCode: paper.type,
  subjectId: paper.subjectId,
  title: paper.title,
  totalScore: paper.totalScore,
});

export const mapV2SegmentationPaperToTwoWayView = (
  paper: SegmentationPaperResponse,
  legacyTypeIdByBusinessId: Record<number, number>,
) => {
  const mapQuestion = (question: PaperQuestionResponse): TwoWayQuestionView => {
    const draft = mapV2PaperQuestionToTwoWayDraft(question);
    return {
      ...draft,
      chapterId: draft.chapterIds,
      id: draft.questionId,
      sonQuestionList: draft.children.map((child) => mapDraftChild(child)),
      type: legacyTypeIdByBusinessId[draft.questionData.businessQuestionTypeId],
    };
  };
  const mapDraftChild = (draft: TwoWayQuestionDraft): TwoWayQuestionView => ({
    ...draft,
    chapterId: draft.chapterIds,
    id: draft.questionId,
    sonQuestionList: draft.children.map((child) => mapDraftChild(child)),
    type: legacyTypeIdByBusinessId[draft.questionData.businessQuestionTypeId],
  });

  return {
    gradeId: paper.gradeId,
    moduleModelList: copy(paper.moduleList).map((module) => ({
      moduleName: module.moduleName,
      questionList: copy(module.questionList).map((question) =>
        mapQuestion(question),
      ),
      questionNum: module.moduleQuestionNumber,
    })),
    paperId: paper.id,
    subjectId: paper.subjectId,
    title: paper.title,
    totalScore: paper.totalScore,
    type: paper.type,
  };
};

const mapQuestionRequest = (question: TwoWayQuestionDraft): object => ({
  associationStrategy: mapAssociationStrategyToV2Request(
    question.associationStrategy,
    question.questionId,
  ),
  businessQuestionTypeId: question.businessQuestionTypeId,
  chapterIds: copy(question.chapterIds),
  children: copy(question.children).map((child) => mapQuestionRequest(child)),
  indicatorIds: copy(question.indicatorIds),
  knowledgeIds: copy(question.knowledgeIds),
  questionId: question.questionId,
  predictionDifficulty: question.predictionDifficulty,
  questionLevelType: question.questionLevelType,
  questionScore: question.questionScore,
  sourceType: question.sourceType,
});

export const mapTwoWayDraftToV2SegmentationPaperRequest = (
  draft: TwoWayPaperDraft,
) => ({
  gradeId: draft.gradeId,
  modules: copy(draft.modules).map((module) => ({
    moduleName: module.moduleName,
    questions: copy(module.questions).map((question) =>
      mapQuestionRequest(question),
    ),
  })),
  paperTypeCode: draft.paperTypeCode,
  preview: draft.preview,
  subjectId: draft.subjectId,
  tabId: draft.tabId,
  title: draft.title,
  totalScore: draft.totalScore,
});

export const mapTwoWayViewToV2SegmentationPaperRequest = (
  view: TwoWayPaperView,
) => {
  const mapViewQuestion = (question: TwoWayQuestionView): object => {
    const questionId = persistedQuestionId(question);
    return {
      associationStrategy: mapAssociationStrategyToV2Request(
        question.associationStrategy,
        questionId,
      ),
      businessQuestionTypeId: question.businessQuestionTypeId,
      chapterIds: copy(question.chapterId || question.chapterIds),
      children: copy(question.sonQuestionList).map((child) =>
        mapViewQuestion(child),
      ),
      indicatorIds: copy(question.indicatorIds),
      knowledgeIds: copy(question.knowledgeIds),
      predictionDifficulty: question.predictionDifficulty,
      questionId,
      questionLevelType: question.questionLevelType,
      questionScore: question.questionScore,
      sourceType: question.sourceType,
    };
  };

  return {
    gradeId: view.gradeId,
    modules: copy(view.paperModuleModels).map((module) => ({
      moduleName: module.moduleName,
      questions: copy(module.questionList).map((question) =>
        mapViewQuestion(question),
      ),
    })),
    paperTypeCode: view.type,
    preview: view.isPreview,
    subjectId: view.subjectId,
    tabId: view.tabId,
    title: view.title,
    totalScore: view.totalScore,
  };
};
