export const attachParsedQuestionMetadata = (questionList = []) => {
  if (!questionList || questionList.length === 0) {
    return questionList;
  }

  for (const item of questionList) {
    item.knowledgeNames = item.knowledge;
    item.chapterNames = item.chapter;
    item.indicatorNames = item.indicator;
  }

  return questionList;
};
