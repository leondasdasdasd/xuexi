import { GlobalHeader } from "./index";
import {
  buildOriginalVolumeZip,
  downloadOriginalVolumeZip,
} from "./originalVolumeZip";
import {
  buildOriginalVolumePdf,
  downloadOriginalVolumePdf,
} from "./originalVolumePdf";
import { queryStuScore } from "../../services/example";
import React from "react";
import { Button, message, Modal, Table, Tooltip } from "antd";

const TEST_EXAM_NAME = "期末测验";
const TEST_CLASS_NAME = "一班";
const TEST_ORIGINAL_VOLUME_IMAGE_URL = "https://example.com/1.jpg";
const TEST_ORIGINAL_VOLUME_ZIP_FILE_NAME = "期末测验-原卷.zip";
const TEST_ORIGINAL_VOLUME_PDF_FILE_NAME = "期末测验-一班-原卷.pdf";

jest.mock("./originalVolumeZip", () => ({
  buildOriginalVolumeZip: jest.fn(),
  downloadOriginalVolumeZip: jest.fn(),
}));

jest.mock("./originalVolumePdf", () => ({
  buildOriginalVolumePdf: jest.fn(),
  downloadOriginalVolumePdf: jest.fn(),
}));

jest.mock("../../services/example", () => ({
  queryStuScore: jest.fn(),
}));

jest.mock("../../utils/i18n", () => ({
  locale: jest.fn(() => "zh-CN"),
  trans: jest.fn((_, fallback) => fallback),
}));

/**
 * 创建一个可直接调用实例方法的学生得分组件实例。
 * @param {object} state 覆盖组件状态的测试数据。
 * @returns {GlobalHeader} 学生得分组件实例。
 */
function createComponent(state) {
  const component = new GlobalHeader({
    examId: "exam-1",
  });
  component.state = {
    check: 1,
    groupId: "group-1",
    stuName: "张三",
    stuScoreSpecify: true,
    correction: false,
    exportingOriginalVolume: false,
    ...state,
  };
  component.setState = (nextState) => {
    component.state = {
      ...component.state,
      ...nextState,
    };
  };
  return component;
}

describe("学生得分视图加载", () => {
  it("列表视图复用列表请求且不初始化图表", () => {
    const component = createComponent({ check: 1 });
    const dispatch = jest.fn(() => new Promise(() => {}));
    component.props.dispatch = dispatch;

    component.renderScoreChart();

    expect(dispatch).not.toHaveBeenCalled();
  });

  it("学生得分表使用学生 ID 并为汇总行提供稳定 key", () => {
    const component = createComponent({ check: 1 });
    component.props.questionScore = {
      examTotalScore: 12,
      columnSet: [],
      examResultList: [
        { studentName: "共 1 人" },
        { studentUserId: 52_315, studentName: "四学生20240405" },
      ],
    };
    component.props.stuScore = { examResultList: [] };
    component.props.stuGradeList = [];
    component.props.filterStudentListPermissions = {
      haveFilterStudentList: false,
    };

    const findMainTable = (node) => {
      if (!React.isValidElement(node)) return undefined;
      if (node.type === Table && Array.isArray(node.props.columns)) return node;
      return React.Children.toArray(node.props.children)
        .map(findMainTable)
        .find(Boolean);
    };
    const table = findMainTable(component.render());

    expect(table.props.dataSource.map((row) => row.key)).toEqual([
      "student-score-summary",
      52_315,
    ]);
  });
});

/**
 * 等待组件方法中的 promise then 回调完成。
 * @param {boolean} ready 无业务含义，只用于满足项目函数参数约束。
 * @returns {Promise<boolean>} 微任务刷新结果。
 */
async function flushMicrotasks(ready) {
  return ready;
}

describe("学生得分原卷 zip 导出参数", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    buildOriginalVolumeZip.mockReset();
    downloadOriginalVolumeZip.mockReset();
    buildOriginalVolumePdf.mockReset();
    downloadOriginalVolumePdf.mockReset();
    queryStuScore.mockReset();
    jest.spyOn(message, "success").mockImplementation(jest.fn());
    jest.spyOn(message, "error").mockImplementation(jest.fn());
    jest.spyOn(message, "info").mockImplementation(jest.fn());
    window.open = jest.fn();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it("复用当前学生得分列表筛选条件创建任务入参", () => {
    const component = createComponent();

    expect(component.getOriginalVolumeExportParameters()).toEqual({
      examId: "exam-1",
      groupId: "group-1",
      searchStudentKeyWord: "张三",
      isSort: true,
      filterFlag: true,
    });
  });

  it("导出原卷时拉取筛选全集并在前端生成 zip 下载", async () => {
    const component = createComponent({
      examName: TEST_EXAM_NAME,
    });
    component.props.examName = TEST_EXAM_NAME;
    queryStuScore.mockResolvedValue({
      status: true,
      content: {
        examResultList: [
          { studentUserId: undefined, studentName: "共 1 人" },
          {
            groupId: "group-1",
            groupName: TEST_CLASS_NAME,
            studentUserId: "student-1",
            studentName: "张三",
            studentExamPaperUrl: [TEST_ORIGINAL_VOLUME_IMAGE_URL],
          },
        ],
      },
    });
    buildOriginalVolumeZip.mockResolvedValue({
      fileName: TEST_ORIGINAL_VOLUME_ZIP_FILE_NAME,
      blob: new Blob(["zip"]),
    });

    await component.exportOriginalVolumeZip();
    await flushMicrotasks(true);

    expect(queryStuScore).toHaveBeenCalledWith({
      examId: "exam-1",
      groupId: "group-1",
      pageNo: undefined,
      limit: undefined,
      searchStudentKeyWord: "张三",
      scoreCorrectionType: 0,
      isSort: true,
      filterFlag: true,
    });
    expect(buildOriginalVolumeZip).toHaveBeenCalledWith({
      examName: TEST_EXAM_NAME,
      studentList: queryStuScore.mock.calls[0] && expect.any(Array),
    });
    expect(downloadOriginalVolumeZip).toHaveBeenCalledWith({
      fileName: TEST_ORIGINAL_VOLUME_ZIP_FILE_NAME,
      blob: expect.any(Blob),
    });
    expect(component.state.exportingOriginalVolume).toBe(false);
    expect(message.success).toHaveBeenCalled();
  });

  it("组件卸载时清理原卷 zip 导出状态", () => {
    const component = createComponent();
    component.originalVolumeExportTracking = true;
    component.originalVolumeExportActiveSequence = 1;

    component.componentWillUnmount();

    expect(component.originalVolumeExportTracking).toBe(false);
    expect(component.originalVolumeExportActiveSequence).toBeUndefined();
  });

  it("前端生成 zip 失败时关闭生成中状态并提示失败原因", async () => {
    const component = createComponent();
    queryStuScore.mockResolvedValue({
      status: true,
      content: {
        examResultList: [
          {
            studentUserId: "student-1",
            studentName: "张三",
            studentExamPaperUrl: [TEST_ORIGINAL_VOLUME_IMAGE_URL],
          },
        ],
      },
    });
    buildOriginalVolumeZip.mockRejectedValue(
      new Error("学生【张三】第1张图片读取失败"),
    );

    await component.exportOriginalVolumeZip();
    await flushMicrotasks(true);

    expect(message.error).toHaveBeenCalledWith("学生【张三】第1张图片读取失败");
    expect(component.state.exportingOriginalVolume).toBe(false);
  });

  it("关闭生成中提示时弹出二次确认，确认后停止跟踪", () => {
    const component = createComponent({
      exportingOriginalVolume: true,
    });
    jest.spyOn(Modal, "confirm").mockImplementation((config) => {
      config.onOk();
    });

    component.cancelOriginalVolumeExportTracking();

    expect(Modal.confirm).toHaveBeenCalled();
    expect(component.state.exportingOriginalVolume).toBe(false);
  });

  it("正在生成原卷 zip 时重复点击只提示当前任务进行中", () => {
    const component = createComponent({
      exportingOriginalVolume: true,
    });

    component.exportOriginalVolumeZip();

    expect(queryStuScore).not.toHaveBeenCalled();
    expect(message.info).toHaveBeenCalled();
  });
});

describe("查看原卷弹层班级 PDF 导出", () => {
  beforeEach(() => {
    buildOriginalVolumePdf.mockReset();
    downloadOriginalVolumePdf.mockReset();
    queryStuScore.mockReset();
    jest.spyOn(message, "success").mockImplementation(jest.fn());
    jest.spyOn(message, "error").mockImplementation(jest.fn());
    jest.spyOn(message, "info").mockImplementation(jest.fn());
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it("选择全部班级时 PDF 导出按钮置灰并提示切换到具体班级", () => {
    const component = createComponent({
      groupId1: 0,
    });

    const view = component.renderOriginalVolumePdfButton();

    expect(view.type).toBe(Tooltip);
    expect(view.props.title).toBe("切换到具体班级后才可以导出");
    expect(view.props.children.props.children.type).toBe(Button);
    expect(view.props.children.props.children.props.disabled).toBe(true);
  });

  it("点击 PDF 导出时拉取当前班级全集学生并下载 PDF", async () => {
    const component = createComponent({
      groupId1: "group-1",
      studentKeyword: "张三",
      studentList: [],
    });
    component.props.examName = TEST_EXAM_NAME;
    component.props.stuGradeList = [
      {
        groupId: "group-1",
        groupName: TEST_CLASS_NAME,
        groupEName: "Class One",
      },
    ];
    queryStuScore.mockResolvedValue({
      status: true,
      content: {
        examResultList: [
          {
            groupId: "group-1",
            studentUserId: "student-1",
            studentName: "张三",
            studentExamPaperUrl: [TEST_ORIGINAL_VOLUME_IMAGE_URL],
          },
        ],
      },
    });
    buildOriginalVolumePdf.mockResolvedValue({
      pdf: { save: jest.fn() },
      fileName: TEST_ORIGINAL_VOLUME_PDF_FILE_NAME,
    });

    await component.exportOriginalVolumePdf();
    await flushMicrotasks(true);

    expect(queryStuScore).toHaveBeenCalledWith({
      examId: "exam-1",
      groupId: "group-1",
      pageNo: 1,
      limit: 1000,
      searchStudentKeyWord: "",
      scoreCorrectionType: 0,
      isSort: true,
      filterFlag: true,
    });
    expect(buildOriginalVolumePdf).toHaveBeenCalledWith({
      examName: TEST_EXAM_NAME,
      groupName: TEST_CLASS_NAME,
      studentList: queryStuScore.mock.calls[0] && expect.any(Array),
    });
    expect(downloadOriginalVolumePdf).toHaveBeenCalledWith({
      pdf: expect.any(Object),
      fileName: TEST_ORIGINAL_VOLUME_PDF_FILE_NAME,
    });
    expect(message.success).toHaveBeenCalled();
  });
});
