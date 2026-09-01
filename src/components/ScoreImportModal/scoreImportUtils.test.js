import {
  buildIssueOverview,
  buildScoreImportPayload,
  calculateQuestionScore,
  getLeafQuestionColumns,
  getPreviewSummaryCards,
  getQuestionWorkbookColumns,
  getQuestionWorkbookGroups,
  getQuestionWorkbookPreviewRows,
  getScoreCorrectionChangeSummary,
  getScoreImportAiPrompt,
  getScoreWorkbookRows,
  getScoreWorkbookSubjectColumns,
  IMPORT_MODE_APPEND,
  IMPORT_MODE_CREATE,
  IMPORT_SOURCE_STANDARD,
  IMPORT_SOURCE_ZHIXUE,
  isAbsentValue,
  normalizeQuestionAbsentStatus,
  normalizeChoiceAnswer,
  normalizeSelectedSubjects,
  SCORE_UPDATE_INCREMENTAL,
  summarizePreview,
  validateScoreImportForm,
  validateScoreImportUploadFile,
} from "./scoreImportUtils";

const baseForm = {
  importMode: IMPORT_MODE_CREATE,
  importSource: IMPORT_SOURCE_STANDARD,
  existingExamId: undefined,
  examName: "第八、九章单元复习",
  examTime: "2026-04-28",
  semesterId: 1,
  gradeId: 8,
  groupIdList: [101, 102],
  selectedSubjects: [
    {
      key: 5,
      label: "物理",
      courseIdList: [501],
      courseNameList: ["物理G8"],
      groupIdList: [101, 102],
      groupNameList: ["三一班", "三二班"],
      fullScore: 100,
    },
  ],
  examType: 2,
  fileId: "file-001",
};
const scoreImportTemplateFileName = "成绩导入模板.xlsx";

describe("ScoreImportModal utilities", () => {
  it("validates required exam time and uploaded file", () => {
    expect(
      validateScoreImportForm({
        ...baseForm,
        examTime: "",
      }),
    ).toBe("请选择考试时间");

    expect(
      validateScoreImportForm({
        ...baseForm,
        fileId: "",
      }),
    ).toBe("请先上传成绩文件");
  });

  it("validates upload file extension, empty file and size", () => {
    expect(validateScoreImportUploadFile()).toBe("请选择要上传的成绩文件");
    expect(
      validateScoreImportUploadFile({ name: "成绩.csv", size: 1024 }),
    ).toBe("仅支持上传 Excel 文件（.xlsx 或 .xls）");
    expect(
      validateScoreImportUploadFile(
        { name: "智学网导出.zip", size: 1024 },
        { allowZip: true },
      ),
    ).toBe("");
    expect(
      validateScoreImportUploadFile({
        name: scoreImportTemplateFileName,
        size: 0,
      }),
    ).toBe("上传文件为空，请重新导出模板后填写");
    expect(
      validateScoreImportUploadFile({
        name: scoreImportTemplateFileName,
        size: 21 * 1024 * 1024,
      }),
    ).toBe("上传文件不能超过 20MB");
    expect(
      validateScoreImportUploadFile({
        name: scoreImportTemplateFileName,
        size: 1024,
      }),
    ).toBe("");
  });

  it("builds copyable AI prompt for create and append imports", () => {
    const createPrompt = getScoreImportAiPrompt(IMPORT_MODE_CREATE);
    const appendPrompt = getScoreImportAiPrompt(IMPORT_MODE_APPEND);

    expect(createPrompt).toContain("原始成绩文件");
    expect(createPrompt).toContain("系统下载的成绩导入模板");
    expect(createPrompt).toContain("不要导入外部总分、排名、班次、校次");
    expect(createPrompt).toContain("优先保留原始作答选项");
    expect(createPrompt).toContain("不要把选项强行换算成分数");
    expect(createPrompt).toContain("不要丢失任何选项字母");
    expect(createPrompt).toContain("单题没做不是缺考");
    expect(appendPrompt).toContain("系统下载的当前考试原始成绩文件");
  });

  it("requires existing exam for append imports", () => {
    expect(
      validateScoreImportForm({
        ...baseForm,
        importMode: IMPORT_MODE_APPEND,
        existingExamId: undefined,
      }),
    ).toBe("批量订正需要先选择已有考试");
  });

  it("append imports only require an existing exam with appendable subjects and file", () => {
    expect(
      validateScoreImportForm({
        ...baseForm,
        importMode: IMPORT_MODE_APPEND,
        existingExamId: 9001,
        examName: "",
        examTime: "",
        semesterId: "",
        gradeId: undefined,
        groupIdList: [],
        examType: undefined,
      }),
    ).toBe("");

    expect(
      validateScoreImportForm({
        ...baseForm,
        importMode: IMPORT_MODE_APPEND,
        existingExamId: 9001,
        selectedSubjects: [],
      }),
    ).toBe("当前考试没有可订正成绩的学科");

    expect(
      validateScoreImportForm({
        ...baseForm,
        importMode: IMPORT_MODE_APPEND,
        importSource: IMPORT_SOURCE_ZHIXUE,
        existingExamId: 9001,
        selectedSubjects: [
          { key: 5, label: "物理", courseIdList: [501], fullScore: 100 },
          { key: 6, label: "数学", courseIdList: [601], fullScore: 120 },
        ],
      }),
    ).toBe("");
  });

  it("allows zhixue import to validate multiple subjects before backend preview", () => {
    expect(
      validateScoreImportForm({
        ...baseForm,
        importSource: IMPORT_SOURCE_ZHIXUE,
        selectedSubjects: [
          {
            key: 5,
            label: "物理",
            courseIdList: [501],
            groupIdList: [101],
            fullScore: 100,
          },
          {
            key: 6,
            label: "数学",
            courseIdList: [601],
            groupIdList: [102],
            fullScore: 120,
          },
        ],
      }),
    ).toBe("");
  });

  it("requires course, class and full score for each exam subject", () => {
    expect(
      validateScoreImportForm({
        ...baseForm,
        selectedSubjects: [{ key: 5, label: "物理", fullScore: 100 }],
      }),
    ).toBe("请完善每个考试科目的课程、班级和满分");
  });

  it("rejects duplicate exam subjects", () => {
    expect(
      validateScoreImportForm({
        ...baseForm,
        selectedSubjects: [
          { key: 5, label: "物理", courseIdList: [501], fullScore: 100 },
          { key: 5, label: "物理", courseIdList: [502], fullScore: 100 },
        ],
      }),
    ).toBe("考试科目不能重复");
  });

  it("builds the preview payload without external total score fields", () => {
    expect(buildScoreImportPayload(baseForm)).toEqual({
      fileId: "file-001",
      fileName: undefined,
      generateSummaryReport: false,
      importMode: IMPORT_MODE_CREATE,
      importSource: IMPORT_SOURCE_STANDARD,
      updateMode: undefined,
      examId: undefined,
      examName: "第八、九章单元复习",
      examTime: "2026-04-28",
      semesterId: 1,
      gradeId: 8,
      groupIdList: [101, 102],
      subjectIdList: [5],
      subjectConfigList: [
        {
          subjectId: 5,
          subjectName: "物理",
          courseIdList: [501],
          courseNameList: ["物理G8"],
          groupIdList: [101, 102],
          groupNameList: ["三一班", "三二班"],
          fullScore: 100,
        },
      ],
      examType: 2,
    });
  });

  it("passes append update mode and summarizes risky correction scope", () => {
    expect(
      buildScoreImportPayload({
        ...baseForm,
        importMode: IMPORT_MODE_APPEND,
        existingExamId: 9001,
        scoreUpdateMode: SCORE_UPDATE_INCREMENTAL,
      }),
    ).toEqual(
      expect.objectContaining({
        examId: 9001,
        updateMode: SCORE_UPDATE_INCREMENTAL,
      }),
    );

    expect(
      getScoreCorrectionChangeSummary({
        changeSummary: {
          addedStudentCount: 2,
          updatedStudentCount: 3,
          deletedStudentCount: 1,
        },
      }),
    ).toEqual({
      added: 2,
      updated: 3,
      deleted: 1,
      total: 6,
      source: "diff",
    });
  });

  it("normalizes labelInValue subject selections", () => {
    expect(
      normalizeSelectedSubjects({
        key: "physics",
        label: "物理",
        courseIdList: [501],
        groupIdList: [101],
        groupNameList: ["三一班"],
        fullScore: 100,
      }),
    ).toEqual([
      {
        subjectId: "physics",
        subjectName: "物理",
        courseIdList: [501],
        courseNameList: [],
        groupIdList: [101],
        groupNameList: ["三一班"],
        fullScore: 100,
      },
    ]);
  });

  it("calculates wide-table choice answers and numeric question scores", () => {
    expect(normalizeChoiceAnswer("BA")).toBe("AB");
    expect(
      calculateQuestionScore({
        questionType: "单选",
        rawValue: "A",
        correctAnswer: "A",
        fullScore: 2,
      }),
    ).toEqual({ score: 2, status: "可导入", blocking: false });
    expect(
      calculateQuestionScore({
        questionType: "多选",
        rawValue: "BA",
        correctAnswer: "AB",
        fullScore: 2,
      }),
    ).toEqual({ score: 2, status: "可导入", blocking: false });
    expect(
      calculateQuestionScore({
        questionType: "单选",
        rawValue: "AB",
        correctAnswer: "A",
        fullScore: 2,
      }).status,
    ).toBe("单选题只能填写一个选项");
    expect(
      calculateQuestionScore({
        questionType: "单选",
        rawValue: "3",
        correctAnswer: "",
        fullScore: 5,
      }),
    ).toEqual({ score: 3, status: "可导入", blocking: false });
    expect(
      calculateQuestionScore({
        questionType: "单选",
        rawValue: "A",
        correctAnswer: "",
        fullScore: 5,
      }).status,
    ).toBe("缺少正确答案");
    expect(
      calculateQuestionScore({
        questionType: "解答",
        rawValue: "7",
        fullScore: 6,
      }).status,
    ).toBe("得分超满分");
  });

  it("keeps only leaf question columns from zhixue parent-child headers", () => {
    expect(
      getLeafQuestionColumns([
        "1",
        "2",
        "16",
        "16(1)",
        "16(2)",
        "17",
        "17(1)",
        "20",
      ]),
    ).toEqual(["1", "2", "16(1)", "16(2)", "17(1)", "20"]);
  });

  it("recognizes absent values and summarizes preview results", () => {
    expect(isAbsentValue("缺考")).toBe(true);
    expect(isAbsentValue("未扫")).toBe(true);
    expect(isAbsentValue("A")).toBe(false);
    expect(isAbsentValue("0")).toBe(false);

    expect(
      summarizePreview({
        summary: { studentCount: 3, importableCount: 2 },
        errors: [{ message: "x" }],
        warnings: [{ message: "y" }],
      }),
    ).toEqual({
      studentCount: 3,
      subjectScoreCount: 0,
      scoreWorkbookRowCount: 0,
      questionWorkbookCount: 0,
      questionScoreCount: 0,
      errorCount: 1,
      warningCount: 1,
      importableCount: 2,
    });
  });

  it("marks absence only when a whole student subject has no answers", () => {
    const subjectScoreRows = [
      {
        studentNo: "S1",
        studentName: "张同学",
        className: "三一班",
        subjectName: "数学",
        score: 18,
      },
      {
        studentNo: "S2",
        studentName: "李同学",
        className: "三一班",
        subjectName: "数学",
        score: 0,
      },
    ];
    const questionScoreRows = [
      {
        studentNo: "S1",
        studentName: "张同学",
        className: "三一班",
        subjectName: "数学",
        questionNo: "1",
        rawValue: "缺考",
        status: "缺考",
      },
      {
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
        studentNo: "S2",
        studentName: "李同学",
        className: "三一班",
        subjectName: "数学",
        questionNo: "1",
        rawValue: "",
        status: "空值",
      },
      {
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

    expect(questionScoreRows[0]).toEqual(
      expect.objectContaining({ status: "空值" }),
    );
    expect(questionScoreRows[0].score).toBeNull();
    expect(questionScoreRows[1]).toEqual(
      expect.objectContaining({ status: "可导入", score: 6 }),
    );
    expect(questionScoreRows[2]).toEqual(
      expect.objectContaining({ status: "缺考" }),
    );
    expect(questionScoreRows[2].score).toBeNull();
    expect(questionScoreRows[3]).toEqual(
      expect.objectContaining({ status: "缺考" }),
    );
    expect(questionScoreRows[3].score).toBeNull();
  });

  it("builds preview summary cards with units and teacher-facing descriptions", () => {
    const cards = getPreviewSummaryCards({
      studentCount: 24,
      scoreWorkbookRowCount: 24,
      questionWorkbookCount: 1,
      questionScoreCount: 120,
      errorCount: 0,
      warningCount: 19,
      importableCount: 136,
    });

    expect(cards).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "scoreWorkbookRowCount",
          unit: "条",
          label: "多科成绩",
          description: "来自学科成绩表",
        }),
        expect.objectContaining({
          key: "errorCount",
          unit: "个",
          label: "错误",
          description: "暂无阻断问题",
          tone: "success",
        }),
        expect.objectContaining({
          key: "importableCount",
          unit: "条",
          label: "可导入成绩",
          description: "学科成绩 + 单题成绩",
        }),
      ]),
    );
  });

  it("groups preview issues by priority and adds next-step guidance", () => {
    const firstAbsentPosition = "数学_小题得分 / 三一班 / 张同学 / 第16(1)题";
    const secondAbsentPosition = "数学_小题得分 / 三一班 / 李同学 / 第16(1)题";
    const absentWarningMessage = "识别为缺考，不会按 0 分自动写入";
    const issues = buildIssueOverview({
      errors: [
        {
          position: "数学_小题得分 / 三一班 / 001",
          message: "学号未匹配到学生",
        },
      ],
      warnings: [
        {
          position: firstAbsentPosition,
          message: absentWarningMessage,
        },
        {
          position: secondAbsentPosition,
          message: absentWarningMessage,
        },
        {
          position: "小题明细",
          message: "未上传或未识别小题得分明细，本次只生成学科总分预览",
        },
        {
          position: "三一班 / 张同学 / 数学",
          message: "智学网总分 85 与叶子题汇总 83 不一致",
        },
        {
          position: "三一班 / 李同学 / 数学",
          message: "智学网总分 72 与叶子题汇总 70 不一致",
        },
      ],
    });

    expect(issues).toHaveLength(4);
    expect(issues[0]).toEqual(
      expect.objectContaining({
        level: "错误",
        count: 1,
        action: "核对学号、姓名和班级，修改文件后重新上传。",
      }),
    );
    expect(issues[1]).toEqual(
      expect.objectContaining({
        level: "警告",
        count: 2,
        issueType: "item",
        message: absentWarningMessage,
        action: "确认该学生确实缺考；系统不会自动写入 0 分。",
      }),
    );
    expect(issues[1].positions).toEqual([firstAbsentPosition]);
    expect(issues[1].allPositions).toEqual([
      firstAbsentPosition,
      secondAbsentPosition,
    ]);
    expect(issues[2]).toEqual(
      expect.objectContaining({
        count: 2,
        issueType: "item",
        message: "总分与小题汇总分数不一致",
      }),
    );
    expect(issues[2].positions).toEqual([
      "三一班 / 张同学 / 数学：智学网总分 85 与叶子题汇总 83 不一致",
    ]);
    expect(issues[2].allPositions).toEqual([
      "三一班 / 张同学 / 数学：智学网总分 85 与叶子题汇总 83 不一致",
      "三一班 / 李同学 / 数学：智学网总分 72 与叶子题汇总 70 不一致",
    ]);
    expect(issues[3]).toEqual(
      expect.objectContaining({
        issueType: "description",
        message: "未上传或未识别小题得分明细，本次只生成学科总分预览",
      }),
    );
  });

  it("builds workbook score rows from subject scores", () => {
    const preview = {
      subjectScoreRows: [
        {
          status: "可导入",
          studentNo: "G1",
          studentName: "张同学",
          className: "三一班",
          subjectName: "物理",
          score: 88,
          fullScore: 100,
        },
        {
          status: "可导入",
          studentNo: "G1",
          studentName: "张同学",
          className: "三一班",
          subjectName: "数学",
          score: 96,
          fullScore: 120,
        },
      ],
    };

    expect(getScoreWorkbookRows(preview)).toEqual([
      expect.objectContaining({
        studentNo: "G1",
        totalScore: 184,
        fullScore: 220,
        scoreSource: "1_学科得分",
        subjectScoreMap: {
          物理: 88,
          数学: 96,
        },
      }),
    ]);
  });

  it("builds workbook subject columns from score workbook subject map", () => {
    expect(
      getScoreWorkbookSubjectColumns({
        scoreWorkbookRows: [
          {
            subjectScoreMap: {
              语文: 90,
              数学: 88,
            },
          },
        ],
      }),
    ).toEqual([
      {
        subjectName: "语文",
      },
      {
        subjectName: "数学",
      },
    ]);
  });

  it("builds workbook score rows and subject lists from question scores", () => {
    const preview = {
      questionScoreRows: [
        {
          status: "可导入",
          studentNo: "G1",
          studentName: "张同学",
          className: "三一班",
          subjectName: "物理",
          questionNo: "1",
          score: 2,
          fullScore: 2,
        },
        {
          status: "可导入",
          studentNo: "G1",
          studentName: "张同学",
          className: "三一班",
          subjectName: "物理",
          questionNo: "2",
          score: 1.5,
          fullScore: 2,
        },
        {
          status: "得分超满分",
          studentNo: "G1",
          studentName: "张同学",
          className: "三一班",
          subjectName: "物理",
          questionNo: "3",
          score: 7,
          fullScore: 6,
        },
      ],
    };

    expect(getScoreWorkbookRows(preview)).toEqual([
      expect.objectContaining({
        totalScore: 3.5,
        fullScore: 4,
        scoreSource: "小题得分汇总",
        subjectScoreMap: {
          物理: 3.5,
        },
      }),
    ]);
    const groups = getQuestionWorkbookGroups(preview);
    expect(groups).toHaveLength(1);
    expect(groups[0].sheetName).toBe("物理_小题得分");
    expect(
      getQuestionWorkbookColumns(groups[0]).map((item) => item.questionNo),
    ).toEqual(["1", "2", "3"]);
    expect(getQuestionWorkbookPreviewRows(groups[0])).toEqual([
      expect.objectContaining({
        studentNo: "G1",
        questionScoreMap: {
          1: 2,
          2: 1.5,
          3: 7,
        },
      }),
    ]);
  });

  it("keeps all question preview rows and builds columns from standard workbook question map", () => {
    const group = {
      sheetName: "语文_小题得分",
      questions: [
        {
          questionNo: "1",
          moduleNo: "一",
          subQuestionNo: "1",
          fullScore: 5,
        },
      ],
      rows: Array.from({ length: 10 }).map((_, index) => ({
        status: "可导入",
        studentNo: `S${index + 1}`,
        studentName: `学生${index + 1}`,
        className: "一班",
        questionScoreMap: {
          1: index + 1,
        },
      })),
    };

    expect(
      getQuestionWorkbookColumns(group).map((item) => item.questionNo),
    ).toEqual(["1"]);
    expect(getQuestionWorkbookPreviewRows(group)).toHaveLength(10);
    expect(getQuestionWorkbookPreviewRows(group)[9]).toEqual(
      expect.objectContaining({
        studentNo: "S10",
        questionScoreMap: {
          1: 10,
        },
      }),
    );
  });
});
