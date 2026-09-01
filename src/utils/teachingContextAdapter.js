const isPresent = (value) => value != undefined && value !== "";

export const getStageIdByGradeId = (gradeList = [], gradeId) =>
  gradeList.find((grade) => grade.gradeId === gradeId)?.stageId;

export const mapGradeSubjectToTeachingContext = (
  gradeList,
  gradeId,
  subjectId,
) => {
  const stageId = getStageIdByGradeId(gradeList, gradeId);
  return isPresent(stageId) && isPresent(subjectId)
    ? { stageId, subjectId }
    : null;
};
