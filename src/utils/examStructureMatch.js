const CLASSROOM_QUIZ_TYPE_CODE = 1;

const CLASSROOM_QUIZ_NAMES = ["课堂小测", "Class Quiz"];

const toNumber = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const nextValue = Number(value);
  return Number.isNaN(nextValue) ? null : nextValue;
};

const includesClassroomQuizName = (value) => {
  if (!value) {
    return false;
  }

  return CLASSROOM_QUIZ_NAMES.some((name) => String(value).includes(name));
};

export const isClassroomQuiz = (record = {}) => {
  const typeCodes = [
    record.examTypeCode,
    record.examType,
    record.type,
    record.paperType,
  ]
    .map(toNumber)
    .filter((value) => value !== null);

  if (typeCodes.includes(CLASSROOM_QUIZ_TYPE_CODE)) {
    return true;
  }

  return [record.examTypeName, record.paperTypeName, record.typeName].some(
    includesClassroomQuizName,
  );
};

export const canUseExamStructureMatch = (record = {}) => {
  return !isClassroomQuiz(record);
};
