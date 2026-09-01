import {
  getQuestionTypeFilterGradeIds,
  isValidQuestionTypeGradeFilter,
  normalizeV2QuestionListQueryContext,
  type V2QuestionListQueryContext,
} from "./questionListQuerySession";

export {
  getQuestionTypeFilterGradeIds,
  isValidQuestionTypeGradeFilter,
} from "./questionListQuerySession";

interface GradeOption {
  gradeId: number;
}

interface TeachingMaterialOption {
  id: number;
}

interface TeachingContextContent {
  gradeList?: GradeOption[];
  teachingList?: TeachingMaterialOption[];
}

interface SubjectOption {
  id: number;
}

interface StageOption {
  stageId: number;
  subjectList: SubjectOption[];
}

const hasSameId = (left: unknown, right: unknown): boolean =>
  String(left) === String(right);

const findById = <Item>(
  items: Item[],
  id: number | undefined,
  getId: (item: Item) => unknown,
): Item | undefined =>
  id === undefined
    ? undefined
    : items.find((item) => hasSameId(getId(item), id));

const getAvailableGradeIds = (
  gradeList: GradeOption[],
  grade: GradeOption | undefined,
  queryContext: V2QuestionListQueryContext | undefined,
): number[] => {
  if (!queryContext) return grade ? [grade.gradeId] : [];
  const availableGradeIds = new Set(
    gradeList.map((item) => Number(item.gradeId)),
  );
  return queryContext.gradeIds.filter((gradeId) =>
    availableGradeIds.has(gradeId),
  );
};

/**
 * 将会话查询上下文映射为列表组件的初始受控状态。
 * @param {V2QuestionListQueryContext|undefined} savedQueryContext 已保存的查询上下文。
 * @returns {object} 列表组件查询状态。
 */
export const createRestoredQueryState = (
  savedQueryContext: V2QuestionListQueryContext | undefined,
) => {
  const queryContext = normalizeV2QuestionListQueryContext(savedQueryContext);
  return {
    businessQuestionTypeIds: queryContext.businessQuestionTypeIds,
    chapterIds: queryContext.chapterIds,
    checkKnowledgeIds: queryContext.knowledgeMultiple
      ? queryContext.knowledgeIds
      : [],
    gradeIds: queryContext.gradeIds,
    keyword: queryContext.keyword,
    knowledgeIds: queryContext.knowledgeMultiple
      ? []
      : queryContext.knowledgeIds,
    knowledgeMultiple: queryContext.knowledgeMultiple,
    levels: queryContext.levels,
    tabKey: queryContext.tabKey,
  };
};

/**
 * 将页面查询上下文映射为后端 V2 列表请求参数。
 * @param {V2QuestionListQueryContext} queryContext 页面查询上下文。
 * @returns {object} V2 列表请求参数。
 */
export const createQuestionListPayload = (
  queryContext: V2QuestionListQueryContext,
) => {
  const gradeIds = getQuestionTypeFilterGradeIds(queryContext);
  if (
    !isValidQuestionTypeGradeFilter(
      queryContext.businessQuestionTypeIds,
      gradeIds,
    )
  ) {
    throw new TypeError("Invalid question type and grade filter");
  }

  const sourceParameters =
    queryContext.tabKey === 1
      ? {
          chapterIds: queryContext.chapterIds,
          gradeIds,
        }
      : {
          gradeIds,
          knowledgeIds: queryContext.knowledgeIds,
        };

  return {
    ...sourceParameters,
    businessQuestionTypeIds: queryContext.businessQuestionTypeIds,
    keyword: queryContext.keyword,
    levels: queryContext.levels,
    limit: queryContext.limit,
    pageNo: queryContext.pageNo,
    subjectIds: queryContext.subjectId ? [queryContext.subjectId] : [],
  };
};

/**
 * 使用最新教材与年级目录恢复缓存选择。
 * @param {TeachingContextContent} content 最新教材与年级目录。
 * @param {V2QuestionListQueryContext|undefined} queryContext 已保存的查询上下文。
 * @returns {object} 可直接写入页面状态的教材上下文。
 */
export const resolveTeachingSelection = (
  content: TeachingContextContent,
  queryContext: V2QuestionListQueryContext | undefined,
) => {
  const teachingList = content.teachingList || [];
  const gradeList = content.gradeList || [];
  const restoredTeachingMaterial = findById(
    teachingList,
    queryContext?.teachingMaterialId,
    (item) => item.id,
  );
  const restoredGrade = findById(
    gradeList,
    queryContext?.chapterGradeId,
    (item) => item.gradeId,
  );
  const teachingMaterial = restoredTeachingMaterial || teachingList[0];
  const grade = restoredGrade || gradeList[0];

  return {
    chapterIds:
      restoredTeachingMaterial && restoredGrade && queryContext
        ? queryContext.chapterIds
        : [],
    grade,
    gradeIds: getAvailableGradeIds(gradeList, grade, queryContext),
    teachingMaterial,
  };
};

/**
 * 使用最新学段学科目录恢复缓存选择。
 * @param {StageOption[]} stageList 最新学段学科目录。
 * @param {V2QuestionListQueryContext|undefined} savedQueryContext 已保存的查询上下文。
 * @returns {object} 当前学段、学科及缓存是否有效。
 */
export const resolveStageSubjectSelection = (
  stageList: StageOption[],
  savedQueryContext: V2QuestionListQueryContext | undefined,
) => {
  const restoredStage = findById(
    stageList,
    savedQueryContext?.stageId,
    (item) => item.stageId,
  );
  const stage = restoredStage || stageList[0];
  const restoredSubject = findById(
    restoredStage?.subjectList || [],
    savedQueryContext?.subjectId,
    (item) => item.id,
  );
  const subject = restoredSubject || stage.subjectList[0];
  return {
    canRestoreTeachingContext: Boolean(restoredStage && restoredSubject),
    stage,
    subject,
  };
};

/**
 * 学段或学科失效时删除其依赖查询字段并收敛到最新上下文。
 * @param {V2QuestionListQueryContext|undefined} savedQueryContext 已保存的查询上下文。
 * @param {StageOption} stage 当前学段。
 * @param {SubjectOption} subject 当前学科。
 * @param {boolean} canRestoreTeachingContext 缓存教学上下文是否仍然有效。
 * @returns {V2QuestionListQueryContext|undefined} 可继续恢复的查询上下文。
 */
export const reconcileSavedTeachingContext = (
  savedQueryContext: V2QuestionListQueryContext | undefined,
  stage: StageOption,
  subject: SubjectOption,
  canRestoreTeachingContext: boolean,
): V2QuestionListQueryContext | undefined => {
  if (!savedQueryContext) return undefined;

  const teachingContext = canRestoreTeachingContext
    ? savedQueryContext
    : {
        ...savedQueryContext,
        businessQuestionTypeIds: [],
        chapterGradeId: undefined,
        chapterIds: [],
        gradeIds: [],
        knowledgeIds: [],
        pageNo: 1,
        teachingMaterialId: undefined,
      };

  return normalizeV2QuestionListQueryContext({
    ...teachingContext,
    stageId: stage.stageId,
    subjectId: subject.id,
  });
};
