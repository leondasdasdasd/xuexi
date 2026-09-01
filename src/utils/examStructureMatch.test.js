import {
  canUseExamStructureMatch,
  isClassroomQuiz,
} from "./examStructureMatch";

describe("examStructureMatch", () => {
  it("blocks classroom quizzes from paper structure matching", () => {
    expect(isClassroomQuiz({ examTypeCode: 1 })).toBe(true);
    expect(isClassroomQuiz({ examTypeName: "课堂小测" })).toBe(true);
    expect(canUseExamStructureMatch({ paperType: 1 })).toBe(false);
  });

  it("allows non-classroom exam structures to use matching", () => {
    expect(canUseExamStructureMatch({ examTypeCode: 6 })).toBe(true);
    expect(canUseExamStructureMatch({ examTypeName: "期中考试" })).toBe(true);
  });
});
