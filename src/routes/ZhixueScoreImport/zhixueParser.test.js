import {
  normalizeQuestionAbsentStatus,
  parseZhixueFilesFromBuffers,
} from "./zhixueParser";

describe("zhixueParser", () => {
  it("treats unanswered single questions as blank when the subject has score", () => {
    const emptyScore = undefined;
    const subjectScoreRows = [
      {
        studentId: "zhixue-1",
        studentNo: "S1",
        studentName: "张同学",
        className: "三一班",
        subjectName: "数学",
        score: 18,
      },
      {
        studentId: "zhixue-2",
        studentNo: "S2",
        studentName: "李同学",
        className: "三一班",
        subjectName: "数学",
        score: 0,
      },
    ];
    const questionScoreRows = [
      {
        studentId: "zhixue-1",
        studentNo: "S1",
        studentName: "张同学",
        className: "三一班",
        subjectName: "数学",
        questionNo: "1",
        rawValue: "缺考",
        status: "缺考",
        score: emptyScore,
      },
      {
        studentId: "zhixue-1",
        studentNo: "S1",
        studentName: "张同学",
        className: "三一班",
        subjectName: "数学",
        questionNo: "2",
        rawValue: "6",
        status: "可导入",
        score: 6,
      },
      {
        studentId: "zhixue-2",
        studentNo: "S2",
        studentName: "李同学",
        className: "三一班",
        subjectName: "数学",
        questionNo: "1",
        rawValue: "",
        status: "空值",
        score: emptyScore,
      },
      {
        studentId: "zhixue-2",
        studentNo: "S2",
        studentName: "李同学",
        className: "三一班",
        subjectName: "数学",
        questionNo: "2",
        rawValue: "0",
        status: "可导入",
        score: 0,
      },
    ];

    normalizeQuestionAbsentStatus(questionScoreRows, subjectScoreRows);

    expect(questionScoreRows[0].status).toBe("空值");
    expect(questionScoreRows[0].score).toBeNull();
    expect(questionScoreRows[1]).toEqual(
      expect.objectContaining({ status: "可导入", score: 6 }),
    );
    expect(questionScoreRows[2].status).toBe("缺考");
    expect(questionScoreRows[2].score).toBeNull();
    expect(questionScoreRows[3].status).toBe("缺考");
    expect(questionScoreRows[3].score).toBeNull();
  });

  it("returns localized parser messages instead of raw issue payloads", async () => {
    const previousLang = window.globalLange;
    window.globalLange = "en";

    try {
      const preview = await parseZhixueFilesFromBuffers([], {});

      expect(preview.errors[0]).toEqual(
        expect.objectContaining({
          position: "上传文件",
          message: "Upload a Zhixue score file.",
        }),
      );
    } finally {
      window.globalLange = previousLang;
    }
  });
});
