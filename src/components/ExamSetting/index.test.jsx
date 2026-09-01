import { waitFor } from "@testing-library/react";

jest.mock("antd", () => {
  const actual = jest.requireActual("antd");
  const React = require("react");

  return {
    ...actual,
    Icon: () => null,
    Spin: ({ children }) => <>{children}</>,
    Upload: ({ children }) => <div>{children}</div>,
  };
});

jest.mock("../../services/global", () => ({
  getExamConfig: jest.fn(),
  thisSemester: jest.fn(),
}));

jest.mock("../../utils/i18n", () => ({
  locale: jest.fn(() => "zh-CN"),
  trans: jest.fn((_, fallback) => fallback),
}));

jest.mock("@yungu-fed/yungu-selector", () => ({
  SearchTeacher: () => null,
}));

jest.mock("../Custom", () => ({
  CuModal: ({ children, footer, title, visible }) =>
    visible ? (
      <div>
        <div>{title}</div>
        <div>{children}</div>
        <div>{footer}</div>
      </div>
    ) : null,
}));

import { message } from "antd";

import { ExamSetting, getPlatformValueFromInquireTest } from "./index";

/**
 *
 * @param overrides
 */
function createProperties(overrides = {}) {
  return {
    allGrade: [{ gradeId: 10, gradeName: "十年级", gradeEnName: "Grade 10" }],
    allOrgTeachersList: [],
    allSubject: [],
    changeExamModal: jest.fn(),
    classList: [],
    dispatch: jest.fn(() => Promise.resolve()),
    examTypeList: [{ code: 1, typeName: "课堂小测" }],
    examVisble: true,
    getPage: jest.fn(),
    inquireTest: {},
    modifyTest: { status: true, content: {} },
    stageSubjectList: [{ id: 9, name: "数学" }],
    wordPdfUrl: {},
    ...overrides,
  };
}

/**
 *
 * @param propertyOverrides
 * @param stateOverrides
 */
function createComponentInstance(propertyOverrides = {}, stateOverrides = {}) {
  const component = new ExamSetting(createProperties(propertyOverrides));
  component.props = createProperties(propertyOverrides);
  component.state = {
    ...component.state,
    grade: [10],
    subjectValue: 9,
    group: [1001],
    examType: 1,
    examPaperName: "数学卷",
    totalScore: 100,
    uploadFile: [{ fileId: "paper-file-1" }],
    fileList: [{ fileId: "answer-file-1", url: "/answer.doc" }],
    courseIdList: [2001],
    teacherNameList: [],
    baseExamNmae: "2025-S2",
    ...stateOverrides,
  };
  component.setState = jest.fn((nextState, callback) => {
    const resolvedState =
      typeof nextState === "function"
        ? nextState(component.state, component.props)
        : nextState;
    component.state = {
      ...component.state,
      ...resolvedState,
    };
    if (callback) {
      callback();
    }
  });
  return component;
}

/**
 *
 * @param node
 * @param predicate
 */
function findElement(node, predicate) {
  if (!node || typeof node !== "object") {
    return;
  }

  if (predicate(node)) {
    return node;
  }

  const { children } = node.props || {};
  if (Array.isArray(children)) {
    for (const child of children) {
      const matchedChild = findElement(child, predicate);
      if (matchedChild) {
        return matchedChild;
      }
    }
    return;
  }

  return findElement(children, predicate);
}

describe("ExamSetting", () => {
  beforeEach(() => {
    global.isYungu = true;
    jest.spyOn(message, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("defaults to platform-made mode for new exams", () => {
    const component = createComponentInstance();

    expect(component.state.platform).toBe(1);
  });

  it("keeps the stored production method for edited exams", () => {
    expect(getPlatformValueFromInquireTest({ madePlatformUtil: true })).toBe(1);
    expect(getPlatformValueFromInquireTest({ madePlatformUtil: false })).toBe(
      2,
    );
  });

  it("keeps the production method radios enabled in edit mode", () => {
    const component = createComponentInstance(
      {
        inquireId: 321,
        inquireTest: {
          sourceType: 1,
        },
      },
      {
        platform: 2,
      },
    );

    const productionMethodGroup = findElement(
      component.render(),
      (element) => element?.props?.onChange === component.changePlatform,
    );

    expect(productionMethodGroup).toBeDefined();
    expect(productionMethodGroup.props.disabled).toBeUndefined();
    expect(productionMethodGroup.props.value).toBe(2);
  });

  it("submits madePlatformUtil=true when user selects platform-made mode", async () => {
    const dispatch = jest.fn(() => Promise.resolve());
    const component = createComponentInstance(
      {
        inquireId: 654,
        dispatch,
      },
      {
        platform: 2,
      },
    );

    component.changePlatform({
      target: {
        value: 1,
      },
    });

    component.surePass();

    await waitFor(() => {
      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "home/ModifyTest",
          payload: expect.objectContaining({
            madePlatformUtil: true,
          }),
        }),
      );
    });
  });

  it("blocks update submission when answer sheet file is missing", () => {
    const dispatch = jest.fn();
    const component = createComponentInstance(
      {
        inquireId: 654,
        dispatch,
      },
      {
        fileList: [],
      },
    );

    component.surePass();

    expect(message.error).toHaveBeenCalledWith("请上传答题卡");
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("blocks update submission when composed paper title reaches 60 characters", () => {
    const dispatch = jest.fn();
    const component = createComponentInstance(
      {
        inquireId: 654,
        dispatch,
      },
      {
        examPaperName: "题".repeat(60),
      },
    );

    component.surePass();

    expect(message.error).toHaveBeenCalledWith("标题长度超过字数限制");
    expect(dispatch).not.toHaveBeenCalled();
  });
});
