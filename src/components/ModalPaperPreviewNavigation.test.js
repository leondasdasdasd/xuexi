import { ModalDotMatrixPen } from "./ModalDotMatrixPen";
import { ModalMachineTest } from "./ModalMachineTest";
import { ModalOnlineTest } from "./ModalOnlineTest";

jest.mock("../services/machine", () => ({
  closeAppraise: jest.fn(),
  createAppraise: jest.fn(),
  examPaperAnswer: jest.fn(),
  machineReading: jest.fn(),
}));

const previewCases = [
  ["online test", ModalOnlineTest, "modalOnlineTestProps"],
  ["machine test", ModalMachineTest, "modalMachineTestProps"],
  ["dot matrix pen test", ModalDotMatrixPen, "modalDotMatrixPenProps"],
];

const createComponent = (Component, modalPropsName) =>
  new Component({
    [modalPropsName]: { options: {} },
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

describe("initiate test paper preview navigation", () => {
  const originalOpen = window.open;

  beforeEach(() => {
    window.history.pushState({}, "", "/exam/");
    window.open = jest.fn();
  });

  afterEach(() => {
    window.history.pushState({}, "", "/");
    window.open = originalOpen;
    jest.restoreAllMocks();
  });

  it.each(previewCases)(
    "opens the read-only paper detail from the %s modal",
    (_name, Component, modalPropsName) => {
      const component = createComponent(Component, modalPropsName);
      component.state.paperId = 11_290;

      component.clickPreviewTestPaper();

      expect(window.open).toHaveBeenCalledWith(
        "http://localhost/exam#/paperEditor?mode=preview&paperId=11290",
      );
    },
  );
});
