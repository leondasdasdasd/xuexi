import { message } from "antd";

import { closeAppraise, createAppraise } from "../services/machine";
import { ModalDotMatrixPen } from "./ModalDotMatrixPen";
import { ModalMachineTest } from "./ModalMachineTest";
import { ModalOnlineTest } from "./ModalOnlineTest";

jest.mock("../services/machine", () => ({
  closeAppraise: jest.fn(),
  createAppraise: jest.fn(),
  examPaperAnswer: jest.fn(),
  machineReading: jest.fn(),
}));

const modalCases = [
  {
    Component: ModalMachineTest,
    modalPropsName: "modalMachineTestProps",
    scoreSwitchName: "needAppraise",
  },
  {
    Component: ModalDotMatrixPen,
    modalPropsName: "modalDotMatrixPenProps",
    scoreSwitchName: "iFNeedAppraise",
  },
  {
    Component: ModalOnlineTest,
    modalPropsName: "modalOnlineTestProps",
    scoreSwitchName: "iFNeedAppraise",
  },
];

const createComponent = ({
  Component,
  modalPropsName,
  scoreSwitchName,
  scoreSwitchValue,
}) => {
  const onOk = jest.fn();
  const component = new Component({
    [modalPropsName]: {
      options: {
        onOk,
      },
    },
    activityList: [],
    allGrade: [],
    classList: [],
    courseList: [],
    criterionList: [],
    dispatch: jest.fn(),
    evaluateList: [],
    evaluationItemList: [],
    examOptions: [],
    examTypeList: [],
    paperInfo: {},
    stageSubjectList: [],
    subjectListTest: [],
  });

  component.setState = (nextState, callback) => {
    component.state = {
      ...component.state,
      ...(typeof nextState === "function"
        ? nextState(component.state, component.props)
        : nextState),
    };
    callback && callback();
  };

  component.setState({
    [scoreSwitchName]: scoreSwitchValue,
    evaluationCategoryId: 2,
    evaluationCourseId: 1,
    evaluationCriterionId: 3,
    examName: "阶段测验",
    id: 100,
    tabKey: 3,
    total: 100,
    totalScore: 100,
  });

  return {
    component,
    onOk,
  };
};

const closeScoreSyncModalCase = async (modalCase) => {
  const { component, onOk } = createComponent({
    ...modalCase,
    scoreSwitchValue: false,
  });

  await component.handleSubmit();

  return onOk.mock.calls.length;
};

describe("score sync confirm step", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.globalLange = "zh-CN";
    createAppraise.mockResolvedValue({
      status: true,
    });
    closeAppraise.mockResolvedValue({
      status: true,
    });
    jest.spyOn(message, "success").mockImplementation(() => {});
    jest.spyOn(message, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("uses a confirm button without disabled state when score sync is off", () => {
    const footerOptionsList = modalCases.map((modalCase) => {
      const { component } = createComponent({
        ...modalCase,
        scoreSwitchValue: false,
      });

      return component.render().props.options;
    });

    expect(footerOptionsList.map(({ okText }) => okText)).toEqual([
      "确认",
      "确认",
      "确认",
    ]);
    expect(footerOptionsList.map(({ okButtonProps }) => okButtonProps)).toEqual(
      [{ loading: false }, { loading: false }, { loading: false }],
    );
  });

  it("uses initiate sync text when score sync is on", () => {
    const okTextList = modalCases.map((modalCase) => {
      const { component } = createComponent({
        ...modalCase,
        scoreSwitchValue: true,
      });

      return component.render().props.options.okText;
    });

    expect(okTextList).toEqual([
      "发起成绩同步",
      "发起成绩同步",
      "发起成绩同步",
    ]);
  });

  it("closes score sync when the score sync switch is off", async () => {
    const closeCallCounts = [
      await closeScoreSyncModalCase(modalCases[0]),
      await closeScoreSyncModalCase(modalCases[1]),
      await closeScoreSyncModalCase(modalCases[2]),
    ];

    expect(closeCallCounts).toEqual([1, 1, 1]);
    expect(closeAppraise).toHaveBeenCalledTimes(modalCases.length);
    expect(closeAppraise.mock.calls.map(([examId]) => examId)).toEqual([
      100, 100, 100,
    ]);
    expect(createAppraise).not.toHaveBeenCalled();
  });

  it("keeps the modal open when closing score sync fails", async () => {
    closeAppraise.mockResolvedValue({
      status: false,
      message: "关闭失败",
    });
    const { component, onOk } = createComponent({
      ...modalCases[0],
      scoreSwitchValue: false,
    });

    await component.handleSubmit();

    expect(onOk).not.toHaveBeenCalled();
    expect(message.error).toHaveBeenCalledWith("关闭失败");
  });

  it("starts score sync when the score sync switch is on", () => {
    const syncCallCounts = modalCases.map((modalCase) => {
      const { component } = createComponent({
        ...modalCase,
        scoreSwitchValue: true,
      });

      component.handleSubmit();

      return createAppraise.mock.calls.length;
    });

    expect(createAppraise).toHaveBeenCalledTimes(modalCases.length);
    expect(syncCallCounts).toEqual([1, 2, 3]);
    expect(closeAppraise).not.toHaveBeenCalled();
  });
});
