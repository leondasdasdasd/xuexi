export const buildQuestionPositionKey = (moduleIndex, questionIndex) =>
  `${moduleIndex}-${questionIndex}`;

export const getQuestionAtPath = (questionList, questionPath) => {
  if (!Array.isArray(questionList) || !Array.isArray(questionPath)) {
    return null;
  }

  let question = questionList.at(questionPath[0]);
  for (const childIndex of questionPath.slice(1)) {
    question = question?.sonQuestionList?.at(childIndex);
  }
  return question || null;
};

export const flattenQuestionDescendants = (questions, parentPath = []) =>
  (Array.isArray(questions) ? questions : []).flatMap((question, index) => {
    const questionPath = [...parentPath, index];
    return [
      { question, questionPath },
      ...flattenQuestionDescendants(question?.sonQuestionList, questionPath),
    ];
  });

export const hasQuestionChildren = (question) =>
  Array.isArray(question?.sonQuestionList) &&
  question.sonQuestionList.length > 0;

export const clearQuestionChildren = (question) => {
  const leafQuestion = {
    ...question,
    questionScore: null,
    sonQuestionList: null,
  };
  delete leafQuestion.sonQuestionScores;
  return leafQuestion;
};

export const buildSynchronizedQuestionScorePatch = (question) => {
  if (!hasQuestionChildren(question)) {
    return {};
  }
  const questionScore = question.sonQuestionList.reduce(
    (total, child) => total + (Number(child.questionScore) || 0),
    0,
  );
  return {
    questionScore,
    sonQuestionScores: question.sonQuestionList.map((child, index) => ({
      index,
      score: child.questionScore,
    })),
  };
};

/**
 * 叶子分数是唯一权威来源；组合节点只保存直属子题汇总，供展示和保存使用。
 * @param {object} question 当前题位树节点
 * @returns {object} 分数逐级同步后的新题位树节点
 */
export const synchronizeQuestionTreeScores = (question) => {
  if (!hasQuestionChildren(question)) {
    const leafQuestion = { ...question };
    // 叶子节点的题位分数是权威值，关联流程留下的空汇总字段仅需清理。
    delete leafQuestion.sonQuestionScores;
    return leafQuestion;
  }

  const sonQuestionList = question.sonQuestionList.map((child) =>
    synchronizeQuestionTreeScores(child),
  );
  return {
    ...question,
    sonQuestionList,
    ...buildSynchronizedQuestionScorePatch({ sonQuestionList }),
  };
};

export const setQuestionTreeLeafScores = (
  question,
  score,
  canSetScore = () => true,
) =>
  synchronizeQuestionTreeScores(
    hasQuestionChildren(question)
      ? {
          ...question,
          sonQuestionList: question.sonQuestionList.map((child) =>
            setQuestionTreeLeafScores(child, score, canSetScore),
          ),
        }
      : canSetScore(question)
        ? { ...question, questionScore: score }
        : question,
  );

const synchronizeAncestorScores = (questionList, questionPath) => {
  for (let depth = questionPath.length - 1; depth > 0; depth -= 1) {
    const question = getQuestionAtPath(
      questionList,
      questionPath.slice(0, depth),
    );
    const synchronizedQuestion = synchronizeQuestionTreeScores(question);
    delete question.sonQuestionScores;
    Object.assign(question, synchronizedQuestion);
  }
};

const QUESTION_FIELD_SETTERS = [
  {
    name: "checked",
    set: (question, value) => {
      question.checked = value;
    },
  },
  {
    name: "predictionDifficulty",
    set: (question, value) => {
      question.predictionDifficulty = value;
    },
  },
  {
    name: "questionLevelType",
    set: (question, value) => {
      question.questionLevelType = value;
    },
  },
  {
    name: "questionScore",
    set: (question, value) => {
      question.questionScore = value;
    },
  },
  {
    name: "sourceType",
    set: (question, value) => {
      question.sourceType = value;
    },
  },
];

export const removeQuestionAtPath = (questionList, questionPath) => {
  if (!Array.isArray(questionPath) || questionPath.length === 0) {
    return questionList;
  }

  const nextQuestionList = JSON.parse(JSON.stringify(questionList || []));
  const parent = getQuestionAtPath(nextQuestionList, questionPath.slice(0, -1));
  const parentHadChildren = hasQuestionChildren(parent);
  const siblings =
    questionPath.length === 1 ? nextQuestionList : parent?.sonQuestionList;
  if (Array.isArray(siblings)) {
    siblings.splice(questionPath.at(-1), 1);
  }
  if (parentHadChildren && !hasQuestionChildren(parent)) {
    // 组合节点删除最后一个子题后恢复为叶子，旧汇总分不能成为叶子权威分数。
    Object.assign(parent, clearQuestionChildren(parent));
  }
  synchronizeAncestorScores(nextQuestionList, questionPath);
  return nextQuestionList;
};

export const updateQuestionFieldAtPath = (
  questionList,
  questionPath,
  fieldName,
  value,
) => {
  const nextQuestionList = JSON.parse(JSON.stringify(questionList || []));
  const question = getQuestionAtPath(nextQuestionList, questionPath);
  if (!question) {
    return questionList;
  }
  const fieldSetter = QUESTION_FIELD_SETTERS.find(
    (candidate) => candidate.name === fieldName,
  );
  if (!fieldSetter) {
    return questionList;
  }
  if (fieldName === "questionScore" && hasQuestionChildren(question)) {
    return questionList;
  }
  fieldSetter.set(question, value);
  if (fieldName === "questionScore") {
    synchronizeAncestorScores(nextQuestionList, questionPath);
  }
  return nextQuestionList;
};

export const buildQuestionNumber = (rootNumber, descendantPath = []) =>
  [rootNumber, ...descendantPath.map((index) => index + 1)].join(".");
