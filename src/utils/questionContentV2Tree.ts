export interface QuestionContentBusinessTypeSource {
  businessQuestionTypeId: number | string;
  children: readonly QuestionContentBusinessTypeSource[];
}

const collectQuestionContentBusinessTypeIds = (
  question: QuestionContentBusinessTypeSource,
): number[] => {
  const businessQuestionTypeId = Number(question.businessQuestionTypeId);
  return [
    ...(Number.isNaN(businessQuestionTypeId) ? [] : [businessQuestionTypeId]),
    ...question.children.flatMap((child) =>
      collectQuestionContentBusinessTypeIds(child),
    ),
  ];
};

// V2 题型依赖只从 QuestionEditor 题目树收集，题位展示字段不得参与推断。
export const collectQuestionContentBusinessQuestionTypeIds = (
  questions: readonly QuestionContentBusinessTypeSource[],
): number[] => [
  ...new Set(
    questions.flatMap((question) =>
      collectQuestionContentBusinessTypeIds(question),
    ),
  ),
];
