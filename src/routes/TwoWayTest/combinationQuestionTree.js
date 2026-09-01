const getQuestionId = (question) => question?.questionId || question?.id;

const getChildren = (question) => {
  if (Array.isArray(question?.questionData?.children)) {
    return question.questionData.children;
  }

  if (Array.isArray(question?.children)) {
    return question.children;
  }

  return Array.isArray(question?.sonQuestionList)
    ? question.sonQuestionList
    : [];
};

/**
 * 按服务端树顺序提取最终可作答叶子，并保存稳定的根到叶 ID 路径。
 * @param {object} rootQuestion 组合题根节点
 * @returns {Array|null} 叶子题及其根到叶路径；节点缺少 ID 时返回 null
 */
export const collectCombinationLeafQuestions = (rootQuestion) => {
  const leaves = [];
  const rootQuestionId = getQuestionId(rootQuestion);

  if (rootQuestionId == undefined) {
    return null;
  }

  if (getChildren(rootQuestion).length === 0) {
    return [];
  }

  const visit = (question, parentPath) => {
    const questionId = getQuestionId(question);
    if (questionId == undefined) {
      return false;
    }

    const nodePath = [...parentPath, questionId];
    const children = getChildren(question);
    if (children.length === 0) {
      leaves.push({ nodePath, question });
      return true;
    }

    return children.every((child) => visit(child, nodePath));
  };

  return visit(rootQuestion, []) ? leaves : null;
};

export const buildLeafAssociationStrategy = ({ nodePath, questionId }) => {
  if (
    !Array.isArray(nodePath) ||
    nodePath.length < 2 ||
    !nodePath.every((id) => Number.isInteger(Number(id)) && Number(id) > 0) ||
    Number(nodePath.at(-1)) !== Number(questionId)
  ) {
    return null;
  }

  return {
    nodePath: nodePath.map(Number),
    type: "leaf",
  };
};

const getTargetQuestion = (questionTypeList, targetOption) => {
  const moduleIndex = Number(targetOption?.moduleIndex);
  const questionIndex = Number(targetOption?.questionIndex);
  if (
    !Number.isInteger(moduleIndex) ||
    moduleIndex < 0 ||
    !Number.isInteger(questionIndex) ||
    questionIndex < 0
  ) {
    return null;
  }

  return questionTypeList?.at(moduleIndex)?.questionList?.at(questionIndex);
};

const createLeafAssociationPlanItem = ({
  leaf,
  questionTypeList,
  targetOption,
}) => {
  const leafQuestionId = getQuestionId(leaf?.question);
  const strategy = buildLeafAssociationStrategy({
    nodePath: leaf?.nodePath,
    questionId: leafQuestionId,
  });
  const target = getTargetQuestion(questionTypeList, targetOption);

  return target && leafQuestionId != undefined && strategy
    ? { leafQuestion: leaf.question, leafQuestionId, strategy, target }
    : null;
};

/**
 * 在修改页面状态前完整验证叶子与目标题位，保证批量关联原子执行。
 * @param {object} input 叶子、目标题位和当前大题列表
 * @param {Array} input.leaves 递归题目树中的叶子及路径
 * @param {Array} input.questionTypeList 当前细目表大题列表
 * @param {Array} input.targetOptions 叶子对应的目标题位
 * @returns {Array|null} 可直接应用的关联计划；任一节点无效时返回 null
 */
export const buildCombinationLeafAssociationPlan = ({
  leaves,
  questionTypeList,
  targetOptions,
}) => {
  if (
    !Array.isArray(leaves) ||
    !Array.isArray(targetOptions) ||
    leaves.length !== targetOptions.length
  ) {
    return null;
  }

  const plan = [];
  for (const [leafIndex, targetOption] of targetOptions.entries()) {
    const planItem = createLeafAssociationPlanItem({
      leaf: leaves.at(leafIndex),
      questionTypeList,
      targetOption,
    });

    if (!planItem) {
      return null;
    }

    plan.push(planItem);
  }

  return plan;
};
