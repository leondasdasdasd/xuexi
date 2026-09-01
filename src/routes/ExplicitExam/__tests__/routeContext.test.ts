/** @jest-environment node */

import {
  InvalidExamRouteError,
  parseStudentAnswerContext,
  parseTeacherPaperTrialContext,
  parseTeacherStudentResultContext,
} from "../routeContext";

describe("explicit exam route contexts", () => {
  it("maps every route id to one explicit business field", () => {
    expect(
      parseStudentAnswerContext({ examId: "11", taskPublishId: "22" }),
    ).toEqual({
      mode: "student-answer",
      examId: 11,
      taskPublishId: 22,
    });
    expect(
      parseTeacherStudentResultContext({ examId: "11", studentId: "33" }),
    ).toEqual({ mode: "teacher-student-result", examId: 11, studentId: 33 });
    expect(parseTeacherPaperTrialContext({ paperId: "44" })).toEqual({
      mode: "teacher-paper-trial",
      paperId: 44,
    });
  });

  it.each([undefined, "", "0", "-1", "1.2", "abc"])(
    "rejects invalid ids: %s",
    (value) => {
      expect(() => parseTeacherPaperTrialContext({ paperId: value })).toThrow(
        InvalidExamRouteError,
      );
    },
  );
});
