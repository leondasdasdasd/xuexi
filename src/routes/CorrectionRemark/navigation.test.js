import {
  flattenQuestions,
  hasGradedAllQuestions,
  pickNextPendingStudent,
} from "./navigation";

describe("CorrectionRemark navigation helpers", () => {
  describe("flattenQuestions", () => {
    it("将组合题展开为子题，普通题保持原样", () => {
      const questions = [
        { questionId: 1, questionType: 5 },
        {
          questionId: 2,
          questionType: 6,
          sonQuestionList: [
            { questionId: 21, questionType: 3 },
            { questionId: 22, questionType: 5 },
          ],
        },
      ];
      expect(flattenQuestions(questions).map((q) => q.questionId)).toEqual([
        1, 21, 22,
      ]);
    });

    it("组合题缺少子题列表时不抛错", () => {
      const questions = [{ questionId: 2, questionType: 6 }];
      expect(flattenQuestions(questions)).toEqual([]);
    });
  });

  describe("hasGradedAllQuestions", () => {
    it("含子题时所有题（含子题）都打分才算完成", () => {
      const questions = [
        { questionId: 1, questionType: 5, studentScore: 3 },
        {
          questionId: 2,
          questionType: 6,
          sonQuestionList: [
            { questionId: 21, questionType: 3, studentScore: 2 },
            { questionId: 22, questionType: 5, studentScore: 0 },
          ],
        },
      ];
      expect(hasGradedAllQuestions(questions)).toBe(true);
    });

    it("0 分视为已批改", () => {
      const questions = [{ questionId: 1, questionType: 5, studentScore: 0 }];
      expect(hasGradedAllQuestions(questions)).toBe(true);
    });

    it("存在未打分的子题时返回 false", () => {
      const questions = [
        {
          questionId: 2,
          questionType: 6,
          sonQuestionList: [
            { questionId: 21, questionType: 3, studentScore: 2 },
            { questionId: 22, questionType: 5, studentScore: "" },
          ],
        },
      ];
      expect(hasGradedAllQuestions(questions)).toBe(false);
    });

    it("空题目列表返回 false", () => {
      expect(hasGradedAllQuestions([])).toBe(false);
    });
  });

  describe("pickNextPendingStudent", () => {
    it("跳过刚批完的当前学生，选下一个待批改学生", () => {
      const list = [
        { studentId: 1, pending: false },
        { studentId: 2, pending: true },
        { studentId: 3, pending: true },
      ];
      expect(pickNextPendingStudent(list, 2)).toEqual({
        studentId: 3,
        pending: true,
      });
    });

    it("当前学生仍被标记为 pending（服务端滞后）时不回跳到自己", () => {
      const list = [
        { studentId: 1, pending: false },
        { studentId: 2, pending: true },
      ];
      expect(pickNextPendingStudent(list, 2)).toBeUndefined();
    });

    it("没有其他待批改学生时返回 null", () => {
      const list = [
        { studentId: 1, pending: false },
        { studentId: 2, pending: false },
      ];
      expect(pickNextPendingStudent(list, 1)).toBeUndefined();
    });

    it("正常前进：当前学生非 pending 时选第一个 pending", () => {
      const list = [
        { studentId: 1, pending: false },
        { studentId: 2, pending: false },
        { studentId: 3, pending: true },
      ];
      expect(pickNextPendingStudent(list, 1)).toEqual({
        studentId: 3,
        pending: true,
      });
    });
  });
});
