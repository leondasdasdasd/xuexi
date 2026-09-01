const hasNoIds = (ids) => !Array.isArray(ids) || ids.length === 0;

const firstResourceName = (values) => values?.[0]?.split("-")[0];

const buildKnowledgePatch = (target, source) => {
  if (hasNoIds(target?.knowledgeIds) && source?.knowledgeIds?.length > 0) {
    const knowledge = firstResourceName(source.knowledgeValues);
    return {
      knowledgeIds: [...source.knowledgeIds],
      ...(knowledge ? { knowledge } : {}),
    };
  }
  return {};
};

const buildChapterPatch = (target, source) => {
  if (hasNoIds(target?.chapterId) && source?.chapterIds?.length > 0) {
    const chapterName = firstResourceName(source.chapterValues);
    return {
      chapterId: [...source.chapterIds],
      ...(chapterName ? { chapterName } : {}),
    };
  }
  return {};
};

const buildIndicatorPatch = (target, source) => {
  if (hasNoIds(target?.indicatorIds) && source?.indicatorIds?.length > 0) {
    const indicatorName = source.indicatorValues?.map(
      (value) => value.split("-")[0],
    );
    return {
      indicatorIds: [...source.indicatorIds],
      ...(indicatorName?.length > 0 ? { indicatorName } : {}),
    };
  }
  return {};
};

export const buildAssociationResourcePatch = (target, source) => ({
  ...buildKnowledgePatch(target, source),
  ...buildChapterPatch(target, source),
  ...buildIndicatorPatch(target, source),
});

/**
 * 关联身份只描述来源题目，题位规划题型继续由题位状态独立维护。
 * @param {number|string} questionId 关联来源题目 ID
 * @param {object|null} associationStrategy 关联策略
 * @returns {object} 仅包含关联身份字段的 patch
 */
export const buildQuestionAssociationIdentityPatch = (
  questionId,
  associationStrategy = null,
) => ({
  associationStrategy,
  questionId: questionId || null,
});

/**
 * 推荐目标只消费题位规划属性，关联来源快照不参与题型选择。
 * @param {string} key 题位结构键
 * @param {object} questionSlot 细目表题位
 * @returns {object} 推荐接口目标
 */
export const buildAssociationRecommendationTarget = (key, questionSlot) => ({
  businessQuestionTypeId: questionSlot.businessQuestionTypeId,
  chapterIds: questionSlot.chapterId || [],
  key,
  knowledgeIds: questionSlot.knowledgeIds || [],
});

/**
 * 关联弹窗每次打开都从当前细目表恢复年级；相似题入口继续保留自身筛选状态。
 * @param {object} parameters 弹窗查询上下文
 * @param {number|string} parameters.gradeId 当前细目表年级 ID
 * @param {boolean} parameters.isAssociation 是否为关联题目入口
 * @returns {object} 需要写入弹窗 state 的查询上下文
 */
export const buildAssociationModalSearchContext = ({
  gradeId,
  isAssociation,
}) => (isAssociation ? { searchGradeId: gradeId } : {});
