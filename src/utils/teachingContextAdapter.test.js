/** @jest-environment node */

import {
  getStageIdByGradeId,
  mapGradeSubjectToTeachingContext,
} from "./teachingContextAdapter.js";

describe("teaching context adapter", () => {
  const grades = [
    { gradeId: 1, stageId: 1 },
    { gradeId: 7, stageId: 2 },
  ];

  it("maps a grade to its stage", () => {
    expect(getStageIdByGradeId(grades, 7)).toBe(2);
  });

  it("returns a complete teaching context", () => {
    expect(mapGradeSubjectToTeachingContext(grades, 7, 13)).toEqual({
      stageId: 2,
      subjectId: 13,
    });
  });

  it("rejects a teaching context when the grade has no stage mapping", () => {
    expect(mapGradeSubjectToTeachingContext(grades, 8, 13)).toBeNull();
  });
});
