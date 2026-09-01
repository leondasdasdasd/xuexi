export const assignMissingQuestionUuids = (question, createUuid) => {
  if (!question) {
    return question;
  }

  return {
    ...question,
    sonQuestionList: Array.isArray(question.sonQuestionList)
      ? question.sonQuestionList.map((subQuestion) =>
          assignMissingQuestionUuids(subQuestion, createUuid),
        )
      : [],
    uuid: question.uuid || createUuid(),
  };
};

export const assignMissingTaskResultQuestionUuids = (
  taskResult,
  createUuid,
) => {
  if (!taskResult) {
    return taskResult;
  }

  return {
    ...taskResult,
    pages: Array.isArray(taskResult.pages)
      ? taskResult.pages.map((page) => ({
          ...page,
          questions: Array.isArray(page.questions)
            ? page.questions.map((question) =>
                assignMissingQuestionUuids(question, createUuid),
              )
            : [],
        }))
      : [],
  };
};
