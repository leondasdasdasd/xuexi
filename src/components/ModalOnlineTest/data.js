export const initData = {
  subjectId: [
    { key: "courseIdList", value: [] },
    { key: "evaluationCourseId", value: undefined },
    { key: "childEvaluationCategoryId", value: undefined },
    { key: "lessonId", value: undefined },
    { key: "evaluationCategoryId", value: undefined },
    { key: "weights", value: undefined },
    { key: "evaluationItemId", value: undefined },
    { key: "total", value: undefined },
    { key: "evaluationCriterionId", value: undefined },
  ],
  courseIdList: [{ key: "lessonId", value: undefined }],
  evaluationCourseId: [
    { key: "evaluationCategoryId", value: undefined },
    { key: "childEvaluationCategoryId", value: undefined },
    { key: "weights", value: undefined },
    { key: "evaluationItemId", value: undefined },
    { key: "total", value: undefined },
    { key: "evaluationCriterionId", value: undefined },
  ],
  evaluationCategoryId: [
    { key: "childEvaluationCategoryId", value: undefined },
    { key: "weights", value: undefined },
    { key: "evaluationItemId", value: undefined },
    { key: "total", value: undefined },
    { key: "evaluationCriterionId", value: undefined },
  ],
  childEvaluationCategoryId: [
    { key: "weights", value: undefined },
    { key: "evaluationItemId", value: undefined },
    { key: "total", value: undefined },
    { key: "evaluationCriterionId", value: undefined },
  ],
  evaluationItemId: [
    { key: "total", value: undefined },
    { key: "evaluationCriterionId", value: undefined },
  ],
};
