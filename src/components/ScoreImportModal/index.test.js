import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { message, Modal } from "antd";

import {
  confirmScoreImport,
  confirmZhixueScoreImport,
  downloadScoreImportTemplate,
  queryScoreImportSubjectPreset,
  saveScoreImportSubjectPreset,
} from "../../services/global";
import { queryAllSubject, queryGradeClass } from "../../services/example";
import {
  IMPORT_MODE_APPEND,
  IMPORT_MODE_CREATE,
  OVERWRITE_SKIP,
  SCORE_UPDATE_INCREMENTAL,
  SCORE_UPDATE_OVERWRITE,
  IMPORT_SOURCE_ZHIXUE,
} from "./scoreImportUtils";
import { ScoreImportModal } from "./index";

jest.mock("../../services/global", () => ({
  confirmScoreImport: jest.fn(),
  confirmZhixueScoreImport: jest.fn(),
  downloadScoreImportTemplate: jest.fn(),
  previewScoreImport: jest.fn(),
  previewZhixueScoreImport: jest.fn(),
  queryScoreImportSubjectPreset: jest.fn(),
  queryScoreImportAppendOptions: jest.fn(),
  saveScoreImportSubjectPreset: jest.fn(),
}));

jest.mock("../../services/example", () => ({
  queryAllSubject: jest.fn(),
  queryGradeClass: jest.fn(),
}));

const baseProperties = {
  allGrade: [],
  changeExamModal: jest.fn(),
  classList: [],
  dispatch: jest.fn(),
  examList: {},
  examOptions: [],
  examTypeList: [],
  examVisble: true,
  getPage: jest.fn(),
  stageSubjectList: [],
};

/**
 * 构造未连接 dva 的弹窗实例，方便只验证第一步业务区块的展示层级。
 * @param {object} overrides 需要覆盖的弹窗 state。
 * @returns {ScoreImportModal} 未挂载的成绩导入弹窗实例。
 */
function createModal(overrides = {}) {
  const modal = new ScoreImportModal(baseProperties);
  modal.state = {
    ...modal.state,
    ...overrides,
  };
  return modal;
}

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
  jest.restoreAllMocks();
});

describe("ScoreImportModal layout", () => {
  it("shows create and existing-exam supplement targets", () => {
    const modal = createModal({
      importMode: IMPORT_MODE_CREATE,
    });

    render(modal.renderImportModeSection());

    expect(screen.getByText("导入目标")).toBeInTheDocument();
    expect(screen.getByText("新建考试")).toBeInTheDocument();
    expect(screen.getByText("批量订正")).toBeInTheDocument();
    expect(screen.getByText(/可以补充单题得分/)).toBeInTheDocument();
  });

  it("shows coming-soon message when clicking existing-exam supplement", () => {
    const modal = createModal({
      importMode: IMPORT_MODE_CREATE,
      examName: "期中考试",
      selectedSubjects: [{ subjectId: 1, subjectName: "语文" }],
      fileId: "file-001",
      currentStep: 1,
    });

    const infoSpy = jest.spyOn(message, "info").mockImplementation(jest.fn());
    modal.setState = jest.fn((nextState) => {
      modal.state = {
        ...modal.state,
        ...nextState,
      };
    });
    render(modal.renderImportModeSection());
    fireEvent.click(screen.getByText("批量订正"));

    expect(infoSpy).toHaveBeenCalledWith("暂未开发，敬请期待");
    expect(modal.setState).not.toHaveBeenCalled();
    expect(modal.state.importMode).toBe(IMPORT_MODE_CREATE);
    expect(modal.state.examName).toBe("期中考试");
    expect(modal.state.selectedSubjects).toEqual([
      { subjectId: 1, subjectName: "语文" },
    ]);
    expect(modal.state.fileId).toBe("file-001");
    expect(modal.state.scoreUpdateMode).toBe(SCORE_UPDATE_INCREMENTAL);
    expect(modal.state.currentStep).toBe(1);
  });

  it("shows summary report option unchecked by default in create mode", () => {
    const modal = createModal({
      importMode: IMPORT_MODE_CREATE,
    });

    render(modal.renderForm());

    expect(screen.getByLabelText("导入成功后生成成绩汇总")).not.toBeChecked();
  });

  it("keeps common presets inside the subject course section in create mode", () => {
    const modal = createModal({
      importMode: IMPORT_MODE_CREATE,
      selectedSubjects: [],
    });

    render(modal.renderSubjectConfigSection());

    expect(screen.getByText("学科课程设置")).toBeInTheDocument();
    expect(screen.getByText("配置名称")).toBeInTheDocument();
    expect(screen.getByText("选择或输入配置名称")).toBeInTheDocument();
    expect(screen.getByText("保存")).toBeInTheDocument();
    expect(screen.queryByText("配置名称（必填）")).not.toBeInTheDocument();
    expect(screen.queryByText("保存当前配置")).not.toBeInTheDocument();
  });

  it("keeps built-in presets while loading custom presets from backend", async () => {
    queryScoreImportSubjectPreset.mockResolvedValue({
      status: true,
      content: [
        {
          presetId: "custom-1",
          presetName: "我的配置",
          subjects: [{ subjectId: "1", subjectName: "语文" }],
        },
      ],
    });
    const modal = createModal();
    modal.setState = jest.fn((nextState) => {
      modal.state = {
        ...modal.state,
        ...nextState,
      };
    });

    await modal.loadPresetConfig();

    expect(queryScoreImportSubjectPreset).toHaveBeenCalledWith({ type: 11 });
    expect(modal.getPresetOptions().map((item) => item.presetName)).toEqual(
      expect.arrayContaining(["语文单科", "初中全科", "高中九科", "我的配置"]),
    );
  });

  it("saves renamed built-in preset as custom backend config", async () => {
    saveScoreImportSubjectPreset.mockResolvedValue({ status: true });
    const successSpy = jest
      .spyOn(message, "success")
      .mockImplementation(jest.fn());
    const modal = createModal({
      presetId: "builtin-junior-all",
      presetName: "初中常用配置",
      selectedSubjects: [
        {
          subjectId: "1",
          subjectName: "语文",
          courseIdList: ["course-1"],
          courseNameList: ["语文课程"],
          groupIdList: ["group-1"],
          groupNameList: ["一班"],
          fullScore: 120,
        },
      ],
    });
    modal.setState = jest.fn((nextState) => {
      modal.state = {
        ...modal.state,
        ...nextState,
      };
    });

    await modal.savePreset();
    const request = saveScoreImportSubjectPreset.mock.calls[0][0];
    const config = JSON.parse(request.config);

    expect(request.type).toBe(11);
    expect(config[0].presetId).toMatch(/^custom-/);
    expect(config[0].presetName).toBe("初中常用配置");
    expect(config[0].subjects[0].courseIdList).toEqual(["course-1"]);
    expect(modal.state.presetId).toMatch(/^custom-/);
    expect(successSpy).toHaveBeenCalledWith("常用配置已创建");
  });

  it("does not overwrite built-in preset without renaming", () => {
    const errorSpy = jest.spyOn(message, "error").mockImplementation(jest.fn());
    const modal = createModal({
      presetId: "builtin-junior-all",
      presetName: "初中全科",
      selectedSubjects: [{ subjectId: "1", subjectName: "语文" }],
    });

    modal.savePreset();

    expect(saveScoreImportSubjectPreset).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith(
      "内置配置不能覆盖，请输入新配置名称后另存",
    );
  });

  it("matches junior preset history and society by subject alias", async () => {
    queryAllSubject.mockResolvedValue({ status: true, content: [] });
    const modal = new ScoreImportModal({
      ...baseProperties,
      stageSubjectList: [
        { id: "chinese", name: "语文" },
        { id: "math", name: "数学" },
        { id: "english", name: "英语" },
        { id: "science", name: "科学" },
        { id: "society", name: "社会" },
      ],
    });
    modal.state = {
      ...modal.state,
      gradeId: "grade-7",
    };
    modal.setState = jest.fn((nextState, callback) => {
      modal.state = {
        ...modal.state,
        ...nextState,
      };
      if (callback) {
        callback();
      }
    });

    await modal.applyPreset("builtin-junior-all");

    expect(modal.state.selectedSubjects.map((item) => item.subjectId)).toEqual([
      "chinese",
      "math",
      "english",
      "science",
      "society",
    ]);
  });

  it("clears preset courses and groups when they do not exist in current grade", async () => {
    queryAllSubject.mockResolvedValue({
      status: true,
      content: [{ courseId: "course-new", courseName: "当前年级数学" }],
    });
    const modal = new ScoreImportModal({
      ...baseProperties,
      stageSubjectList: [{ id: "math", name: "数学" }],
    });
    modal.state = {
      ...modal.state,
      gradeId: "grade-8",
      customPresetList: [
        {
          presetId: "custom-old-grade",
          presetName: "旧年级配置",
          subjects: [
            {
              subjectId: "math",
              subjectName: "数学",
              courseIdList: ["course-old"],
              courseNameList: ["旧年级数学"],
              groupIdList: ["group-old"],
              groupNameList: ["旧班级"],
              fullScore: 120,
            },
          ],
        },
      ],
    };
    modal.setState = jest.fn((nextState) => {
      modal.state = {
        ...modal.state,
        ...nextState,
      };
    });

    await modal.applyPreset("custom-old-grade");

    expect(modal.state.selectedSubjects[0]).toMatchObject({
      subjectId: "math",
      subjectName: "数学",
      fullScore: 120,
      courseIdList: [],
      courseNameList: [],
      groupIdList: [],
      groupNameList: [],
      groupOptionList: [],
    });
    expect(queryGradeClass).not.toHaveBeenCalled();
  });

  it("keeps preset course but clears unavailable groups in current grade", async () => {
    queryAllSubject.mockResolvedValue({
      status: true,
      content: [{ courseId: "course-1", courseName: "当前年级数学" }],
    });
    queryGradeClass.mockResolvedValue({
      status: true,
      content: [{ groupId: "group-2", groupName: "当前班级" }],
    });
    const modal = new ScoreImportModal({
      ...baseProperties,
      stageSubjectList: [{ id: "math", name: "数学" }],
    });
    modal.state = {
      ...modal.state,
      gradeId: "grade-8",
      customPresetList: [
        {
          presetId: "custom-group-missing",
          presetName: "班级缺失配置",
          subjects: [
            {
              subjectId: "math",
              subjectName: "数学",
              courseIdList: "course-1",
              groupIdList: "group-old",
              fullScore: 120,
            },
          ],
        },
      ],
    };
    modal.setState = jest.fn((nextState) => {
      modal.state = {
        ...modal.state,
        ...nextState,
      };
    });

    await modal.applyPreset("custom-group-missing");

    expect(modal.state.selectedSubjects[0]).toMatchObject({
      courseIdList: ["course-1"],
      courseNameList: ["当前年级数学"],
      groupIdList: [],
      groupNameList: [],
    });
    expect(modal.state.selectedSubjects[0].groupOptionList).toEqual([
      { groupId: "group-2", groupName: "当前班级" },
    ]);
  });

  it("blocks next step and template download while applying preset", () => {
    const warningSpy = jest
      .spyOn(message, "warning")
      .mockImplementation(jest.fn());
    const modal = createModal({
      currentStep: 0,
      examName: "期中考试",
      examTime: "2026-05-21",
      examType: "unit",
      gradeId: "grade-8",
      loadingPresetConfig: true,
      selectedSubjects: [
        {
          subjectId: "math",
          subjectName: "数学",
          groupIdList: ["old-group"],
          fullScore: 120,
        },
      ],
    });
    modal.setState = jest.fn((nextState) => {
      modal.state = {
        ...modal.state,
        ...nextState,
      };
    });

    modal.handleOk();
    modal.downloadTemplate();
    const uploadAllowed = modal.beforeUpload({ name: "成绩.xlsx" });

    expect(modal.state.currentStep).toBe(0);
    expect(uploadAllowed).toBe(false);
    expect(downloadScoreImportTemplate).not.toHaveBeenCalled();
    expect(warningSpy).toHaveBeenCalledWith("常用配置加载中，请稍后再操作");
  });

  it("does not show common presets in append mode", () => {
    const modal = createModal({
      importMode: IMPORT_MODE_APPEND,
      selectedSubjects: [],
    });

    render(modal.renderSubjectConfigSection());

    expect(screen.getByText("可订正成绩学科")).toBeInTheDocument();
    expect(screen.getByText(/补充或修正/)).toBeInTheDocument();
    expect(screen.queryByText("配置名称")).not.toBeInTheDocument();
  });

  it("shows paper name without changing subject payload in create mode", () => {
    const modal = createModal({
      examName: "期中考试",
      importMode: IMPORT_MODE_CREATE,
      selectedSubjects: [
        {
          rowKey: "subject-row-1",
          subjectId: 2,
          subjectName: "数学",
          courseIdList: [],
          groupIdList: [],
          fullScore: 120,
        },
      ],
    });

    render(modal.renderSubjectConfig());

    expect(screen.getByText("期中考试-数学")).toBeInTheDocument();
    expect(modal.getFormData().selectedSubjects[0].subjectName).toBe("数学");
  });

  it("shows existing exam details as a readable summary in append mode", () => {
    const modal = createModal({
      appendGroupList: [
        { groupId: "class-1", groupName: "三一班" },
        { groupId: "class-2", groupName: "三二班" },
      ],
      examName: "第八、九章单元复习周末作业",
      examTime: "2026-04-10",
      existingExamId: "exam-001",
      importMode: IMPORT_MODE_APPEND,
      selectedSubjects: [
        { subjectId: "math", subjectName: "数学" },
        { subjectId: "english", subjectName: "英语" },
      ],
    });

    render(modal.renderAppendForm());

    expect(screen.getByText("考试名称")).toBeInTheDocument();
    expect(screen.getByText("考试时间")).toBeInTheDocument();
    expect(screen.getByText("2026-04-10")).toBeInTheDocument();
    expect(screen.queryByText("班级")).not.toBeInTheDocument();
    expect(
      screen.queryByText("三一班、三二班（2个班）"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("可订正学科")).not.toBeInTheDocument();
    expect(screen.queryByText("数学、英语（2科）")).not.toBeInTheDocument();
  });

  it("shows exam type and grade as flat selectable rows", () => {
    const modal = new ScoreImportModal({
      ...baseProperties,
      allGrade: [
        { gradeId: "grade-3", gradeName: "三年级" },
        { gradeId: "grade-4", gradeName: "四年级" },
      ],
      examTypeList: [
        { code: "unit", typeName: "单元测验" },
        { code: "midterm", typeName: "期中考试" },
      ],
    });
    modal.state = {
      ...modal.state,
      examType: "unit",
      gradeId: "grade-3",
      importMode: IMPORT_MODE_CREATE,
    };
    modal.setState = jest.fn((nextState) => {
      modal.state = {
        ...modal.state,
        ...nextState,
      };
    });

    render(modal.renderForm());
    fireEvent.click(screen.getByRole("button", { name: "期中考试" }));
    fireEvent.click(screen.getByRole("button", { name: "四年级" }));

    expect(screen.getByRole("group", { name: "考试类型" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "年级" })).toBeInTheDocument();
    expect(screen.queryByText("选择考试类型")).not.toBeInTheDocument();
    expect(screen.queryByText("选择年级")).not.toBeInTheDocument();
    expect(modal.state.examType).toBe("midterm");
    expect(modal.state.gradeId).toBe("grade-4");
    expect(baseProperties.dispatch).toHaveBeenCalledWith({
      type: "home/subjectListByGrades",
      payload: {
        gradeIds: "grade-4",
      },
    });
  });

  it("sorts grade choices by stage and sort from backend", () => {
    const modal = new ScoreImportModal({
      ...baseProperties,
      allGrade: [
        {
          gradeId: "grade-10-ready",
          gradeName: "预备十年级",
          stage: 4,
          sort: 0,
        },
        { gradeId: "grade-4", gradeName: "四年级", stage: 2, sort: 4 },
        { gradeId: "grade-1", gradeName: "一年级", stage: 2, sort: 1 },
        { gradeId: "grade-7", gradeName: "七年级", stage: 3, sort: 1 },
      ],
      examTypeList: [],
    });
    modal.state = {
      ...modal.state,
      gradeId: "grade-4",
      importMode: IMPORT_MODE_CREATE,
    };

    render(modal.renderForm());

    const gradeButtons = within(
      screen.getByRole("group", { name: "年级" }),
    ).getAllByRole("button");
    expect(gradeButtons[0]).toHaveTextContent("一年级");
    expect(gradeButtons[1]).toHaveTextContent("四年级");
    expect(gradeButtons[2]).toHaveTextContent("七年级");
    expect(gradeButtons[3]).toHaveTextContent("预备十年级");
  });

  it("uses create-specific upload labels", () => {
    const modal = createModal({
      importMode: IMPORT_MODE_CREATE,
    });

    render(modal.renderUploadFlow());

    expect(screen.getByText("标准模板")).toBeInTheDocument();
    expect(screen.getByText("成绩文件")).toBeInTheDocument();
    expect(screen.getByText("校验导入")).toBeInTheDocument();
    expect(screen.getByText("上传完成后自动校验")).toBeInTheDocument();
    expect(screen.queryByText("AI 整理")).not.toBeInTheDocument();
    expect(screen.queryByText("复制提示词")).not.toBeInTheDocument();
  });

  it("shows zhixue upload entry beside standard upload in create mode", () => {
    const modal = createModal({
      importMode: IMPORT_MODE_CREATE,
    });

    render(modal.renderUploadFlow());

    expect(screen.getByText("上传文件")).toBeInTheDocument();
    expect(screen.getByText("智学网文件")).toBeInTheDocument();
  });

  it("keeps zhixue upload entry out of append mode", () => {
    const modal = createModal({
      importMode: IMPORT_MODE_APPEND,
    });

    render(modal.renderUploadFlow());

    expect(
      screen.queryByRole("button", { name: "智学网文件" }),
    ).not.toBeInTheDocument();
  });

  it("uses append-specific upload labels", () => {
    const modal = createModal({
      importMode: IMPORT_MODE_APPEND,
    });

    render(modal.renderUploadFlow());

    expect(screen.getByText("原始成绩文件")).toBeInTheDocument();
    expect(screen.getByText("下载原始成绩")).toBeInTheDocument();
    expect(screen.getByText("订正后文件")).toBeInTheDocument();
    expect(screen.getByText("校验订正")).toBeInTheDocument();
    expect(
      screen.getByText("上传完成后自动校验，随后选择更新方式"),
    ).toBeInTheDocument();
    expect(screen.queryByText("AI 整理")).not.toBeInTheDocument();
    expect(screen.queryByText("复制提示词")).not.toBeInTheDocument();
  });

  it("starts preview validation automatically after upload succeeds", () => {
    const modal = createModal({
      importMode: IMPORT_MODE_APPEND,
    });
    const previewImport = jest.fn();
    modal.previewImport = previewImport;
    modal.setState = jest.fn((nextState, callback) => {
      modal.state = {
        ...modal.state,
        ...nextState,
      };
      if (callback) {
        callback();
      }
    });

    modal.changeUpload({
      file: {
        name: "订正后文件.xlsx",
        percent: 100,
        status: "done",
        response: {
          status: true,
          content: [{ fileId: "file-001" }],
        },
      },
      fileList: [
        {
          name: "订正后文件.xlsx",
          percent: 100,
          status: "done",
        },
      ],
    });

    expect(modal.setState).toHaveBeenCalledWith(
      expect.objectContaining({
        fileId: "file-001",
        uploadPercent: 100,
        uploading: false,
      }),
      expect.any(Function),
    );
    expect(previewImport).toHaveBeenCalled();
  });

  it("keeps overwrite controls out of create preview", () => {
    const modal = createModal({
      importMode: IMPORT_MODE_CREATE,
      previewData: {
        previewId: "preview-001",
        summary: {},
        scoreWorkbookRows: [
          {
            status: "可导入",
            studentNo: "S001",
            studentName: "张三",
            className: "一班",
            totalScore: 90,
            fullScore: 100,
            scoreSource: "1_学科得分",
            subjectScoreMap: {
              语文: 90,
            },
          },
        ],
        questionWorkbookList: [],
      },
    });

    render(modal.renderPreview());

    expect(screen.getByText("1_学科得分")).toBeInTheDocument();
    expect(screen.getByText("语文")).toBeInTheDocument();
    expect(screen.queryByText("总分")).not.toBeInTheDocument();
    expect(screen.queryByText("满分")).not.toBeInTheDocument();
    expect(screen.queryByText("来源")).not.toBeInTheDocument();
    expect(screen.queryByText("更新方式")).not.toBeInTheDocument();
  });

  it("renders all score workbook rows in create preview", () => {
    const modal = createModal({
      importMode: IMPORT_MODE_CREATE,
      previewData: {
        previewId: "preview-001",
        summary: {},
        scoreWorkbookRows: Array.from({ length: 10 }).map((_, index) => ({
          status: "可导入",
          studentNo: `S${index + 1}`,
          studentName: `学生${index + 1}`,
          className: "一班",
          subjectScoreMap: {
            语文: index + 1,
          },
        })),
        questionWorkbookList: [],
      },
    });

    render(modal.renderPreview());

    expect(screen.getByText("S10")).toBeInTheDocument();
  });

  it("renders description and item issues in one table", () => {
    const modal = createModal({
      importMode: IMPORT_MODE_CREATE,
      previewData: {
        previewId: "preview-001",
        summary: {
          errorCount: 2,
        },
        errors: [
          {
            position: "参数",
            message: "考试名称不能为空",
          },
          {
            position: "语文_小题得分!第9行/第1题",
            message: "分数格式错误",
          },
        ],
        scoreWorkbookRows: [],
        questionWorkbookList: [],
      },
    });

    render(modal.renderPreview());

    expect(
      screen.queryByText("文件汇总项：考试名称不能为空"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "优先级" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "影响范围" }),
    ).toBeInTheDocument();
    expect(screen.getByText("考试名称不能为空")).toBeInTheDocument();
    expect(screen.getByText("分数格式错误")).toBeInTheDocument();
    expect(screen.getByText("参数")).toBeInTheDocument();
    expect(screen.getByText("语文_小题得分!第9行/第1题")).toBeInTheDocument();
  });

  it("shows incremental and overwrite update modes in append preview", () => {
    const modal = createModal({
      importMode: IMPORT_MODE_APPEND,
      scoreUpdateMode: SCORE_UPDATE_INCREMENTAL,
      previewData: {
        previewId: "preview-001",
        summary: { studentCount: 3 },
        changeSummary: {
          addedStudentCount: 1,
          updatedStudentCount: 2,
          deletedStudentCount: 0,
          changedStudentCount: 3,
        },
        scoreWorkbookRows: [],
        questionWorkbookList: [],
      },
    });
    modal.setState = jest.fn((nextState) => {
      modal.state = {
        ...modal.state,
        ...nextState,
      };
    });

    render(modal.renderPreview());

    expect(screen.getByText("学科得分参考")).toBeInTheDocument();
    expect(screen.getByText("更新方式")).toBeInTheDocument();
    expect(screen.getByText("增量更新")).toBeInTheDocument();
    expect(screen.getByText("覆盖更新")).toBeInTheDocument();
    expect(screen.getByText(/本次预计影响 3 名学生/)).toBeInTheDocument();

    fireEvent.click(screen.getByText("覆盖更新"));

    expect(modal.setState).toHaveBeenCalledWith({
      scoreUpdateMode: SCORE_UPDATE_OVERWRITE,
    });
  });

  it("requires a second confirmation for risky overwrite corrections", () => {
    const modal = createModal({
      importMode: IMPORT_MODE_APPEND,
      scoreUpdateMode: SCORE_UPDATE_OVERWRITE,
      uploading: false,
      previewData: {
        previewId: "preview-001",
        errors: [],
        summary: { studentCount: 6 },
        changeSummary: {
          addedStudentCount: 1,
          updatedStudentCount: 5,
          deletedStudentCount: 0,
          changedStudentCount: 6,
        },
      },
    });
    const confirmSpy = jest
      .spyOn(Modal, "confirm")
      .mockImplementation(() => {});

    modal.confirmImport();

    expect(confirmSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "确认覆盖更新？",
        okText: "确认覆盖入库",
        cancelText: "返回检查",
      }),
    );
  });

  it("passes full preview payload when confirming import", async () => {
    const modal = createModal({
      examName: "期中考试",
      examTime: "2026-05-01",
      examType: 1,
      fileId: "file-001",
      fileName: "成绩.xlsx",
      gradeId: 8,
      importMode: IMPORT_MODE_CREATE,
      previewData: {
        previewId: "preview-001",
      },
      semesterId: 202_401,
      selectedSubjects: [
        {
          subjectId: 1,
          subjectName: "语文",
          courseIdList: [11],
          courseNameList: ["语文"],
          groupIdList: [101],
          groupNameList: ["八年级1班"],
          fullScore: 100,
        },
      ],
    });
    modal.setState = jest.fn((nextState) => {
      modal.state = {
        ...modal.state,
        ...nextState,
      };
    });
    confirmScoreImport.mockResolvedValue({ status: true });
    jest.spyOn(message, "success").mockImplementation(jest.fn());

    modal.submitConfirmImport();
    await Promise.resolve();
    await Promise.resolve();

    expect(confirmScoreImport).toHaveBeenCalledWith(
      expect.objectContaining({
        examName: "期中考试",
        fileId: "file-001",
        fileName: "成绩.xlsx",
        previewId: "preview-001",
        subjectConfigListString:
          expect.stringContaining('"subjectName":"语文"'),
        overwritePolicy: OVERWRITE_SKIP,
        generateSummaryReport: false,
      }),
    );
  });

  it("passes generateSummaryReport true when confirming import after checked", async () => {
    const modal = createModal({
      examName: "期中考试",
      examTime: "2026-05-01",
      examType: 1,
      fileId: "file-001",
      fileName: "成绩.xlsx",
      generateSummaryReport: true,
      gradeId: 8,
      importMode: IMPORT_MODE_CREATE,
      previewData: {
        previewId: "preview-001",
      },
      semesterId: 202_401,
      selectedSubjects: [
        {
          subjectId: 1,
          subjectName: "语文",
          courseIdList: [11],
          courseNameList: ["语文"],
          groupIdList: [101],
          groupNameList: ["八年级1班"],
          fullScore: 100,
        },
      ],
    });
    modal.setState = jest.fn((nextState) => {
      modal.state = {
        ...modal.state,
        ...nextState,
      };
    });
    confirmScoreImport.mockResolvedValue({ status: true });
    jest.spyOn(message, "success").mockImplementation(jest.fn());

    modal.submitConfirmImport();
    await Promise.resolve();
    await Promise.resolve();

    expect(confirmScoreImport).toHaveBeenCalledWith(
      expect.objectContaining({
        generateSummaryReport: true,
        previewId: "preview-001",
      }),
    );
  });

  it("uses zhixue confirm endpoint when confirming zhixue import", async () => {
    const modal = createModal({
      examName: "期中考试",
      examTime: "2026-05-01",
      examType: 1,
      fileId: "file-zhixue",
      fileName: "智学网成绩.zip",
      gradeId: 8,
      importMode: IMPORT_MODE_CREATE,
      importSource: IMPORT_SOURCE_ZHIXUE,
      previewData: {
        previewId: "zhixue-preview-001",
      },
      semesterId: 202_401,
      selectedSubjects: [
        {
          subjectId: 1,
          subjectName: "语文",
          courseIdList: [11],
          courseNameList: ["语文"],
          groupIdList: [101],
          groupNameList: ["八年级1班"],
          fullScore: 100,
        },
      ],
    });
    modal.setState = jest.fn((nextState) => {
      modal.state = {
        ...modal.state,
        ...nextState,
      };
    });
    confirmZhixueScoreImport.mockResolvedValue({ status: true });
    jest.spyOn(message, "success").mockImplementation(jest.fn());

    modal.submitConfirmImport();
    await Promise.resolve();
    await Promise.resolve();

    expect(confirmZhixueScoreImport).toHaveBeenCalledWith(
      expect.objectContaining({
        fileId: "file-zhixue",
        fileName: "智学网成绩.zip",
        importSource: IMPORT_SOURCE_ZHIXUE,
        previewId: "zhixue-preview-001",
        overwritePolicy: OVERWRITE_SKIP,
      }),
    );
    expect(confirmScoreImport).not.toHaveBeenCalled();
  });

  it("refreshes preview errors when confirm revalidation fails", async () => {
    const preview = {
      previewId: "preview-rechecked",
      errors: [{ message: "表头不正确" }],
      summary: { errorCount: 1 },
    };
    const modal = createModal({
      fileId: "file-001",
      importMode: IMPORT_MODE_CREATE,
      previewData: {
        previewId: "preview-001",
      },
      selectedSubjects: [
        {
          subjectId: 1,
          subjectName: "语文",
          courseIdList: [11],
          groupIdList: [101],
          fullScore: 100,
        },
      ],
    });
    modal.setState = jest.fn((nextState) => {
      modal.state = {
        ...modal.state,
        ...nextState,
      };
    });
    confirmScoreImport.mockResolvedValue({
      status: false,
      message: "导入文件校验失败，请重新预览后再导入",
      content: { preview },
    });
    jest.spyOn(message, "error").mockImplementation(jest.fn());

    modal.submitConfirmImport();
    await Promise.resolve();
    await Promise.resolve();

    expect(modal.setState).toHaveBeenCalledWith({
      expandedIssueKeys: [],
      previewData: preview,
    });
  });
});
