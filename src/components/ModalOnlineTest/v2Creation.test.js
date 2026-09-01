/** @jest-environment node */
import { ModalOnlineTest } from "./index";
import { message } from "antd";
import {
  configureAndPublishExamV2,
  createOnlineExamForPublication,
} from "../../services/explicitExam";
import { ANSWER_RELEASE_MODE } from "./answerReleasePolicy";

jest.mock("../../services/explicitExam", () => ({
  configureAndPublishExamV2: jest.fn(),
  createOnlineExamForPublication: jest.fn(),
}));
jest.mock("../../services/example", () => ({
  getConfig: jest.fn(),
  queryPaperList: jest.fn(),
}));
jest.mock("../../services/machine", () => ({
  closeAppraise: jest.fn(),
  createAppraise: jest.fn(),
}));
jest.mock("../../services/publishToStudent", () => ({
  queryCourseStudents: jest.fn(),
}));
jest.mock("../../utils/i18n", () => ({
  trans: jest.fn((_, fallback) => fallback),
}));
jest.mock("antd", () => ({
  ...jest.requireActual("antd"),
  message: { error: jest.fn(), warning: jest.fn() },
}));

const flush = () => new Promise((resolve) => setImmediate(resolve));

beforeEach(() => {
  jest.clearAllMocks();
});

const createComponent = (state, publicationContract) => {
  const modalOnlineTestProps = {
    options: { onCancel: jest.fn(), onOk: jest.fn() },
  };
  if (publicationContract !== undefined)
    modalOnlineTestProps.publicationContract = publicationContract;
  const component = new ModalOnlineTest({
    dispatch: jest.fn(),
    modalOnlineTestProps,
  });
  component.setState = (next, callback) => {
    Object.assign(component.state, next);
    callback?.();
  };
  component.getPublishDisplay = jest.fn();
  Object.assign(component.state, state);
  return component;
};

it("creates a new V2 exam with the existing body and selects V2 publication", async () => {
  createOnlineExamForPublication.mockResolvedValue({
    contractVersion: "V2",
    examId: 9,
    taskId: 10,
  });
  const component = createComponent({
    answerTime: 30,
    courseId: 2,
    courseIdList: [2],
    examName: "V2 exam",
    examType: 1,
    hasTimeLimit: 0,
    paperId: 7,
    subjectId: 3,
    tabKey: 1,
  });

  component.handleSubmit();
  await flush();

  expect(createOnlineExamForPublication).toHaveBeenCalledWith(
    expect.objectContaining({
      examOpenShowTime: null,
      openAnswer: true,
      paperId: 7,
    }),
    true,
  );
  expect(component.state).toMatchObject({
    id: 9,
    tabKey: 2,
    taskId: 10,
    usesV2Publication: true,
  });
});

it("creates a never-release exam without changing score visibility", async () => {
  createOnlineExamForPublication.mockResolvedValue({
    contractVersion: "V2",
    examId: 9,
    taskId: 10,
  });
  const component = createComponent({
    answerReleaseMode: ANSWER_RELEASE_MODE.NEVER,
    answerTime: 30,
    courseId: 2,
    courseIdList: [2],
    examName: "Never release",
    examType: 1,
    hasTimeLimit: 0,
    openScore: true,
    paperId: 7,
    subjectId: 3,
    tabKey: 1,
  });

  component.handleSubmit();
  await flush();

  expect(createOnlineExamForPublication).toHaveBeenCalledWith(
    expect.objectContaining({
      examOpenShowTime: null,
      openAnswer: false,
      openScore: true,
    }),
    true,
  );
});

it("does not submit an invalid scheduled release time", () => {
  const component = createComponent({
    answerReleaseMode: ANSWER_RELEASE_MODE.SCHEDULED,
    answerReleaseTime: "2020-01-01 00:00",
    answerTime: 30,
    courseId: 2,
    courseIdList: [2],
    examName: "Invalid schedule",
    examType: 1,
    hasTimeLimit: 0,
    paperId: 7,
    subjectId: 3,
    tabKey: 1,
  });

  component.handleSubmit();

  expect(createOnlineExamForPublication).not.toHaveBeenCalled();
  expect(message.error).toHaveBeenCalledWith(
    "正确答案公开时间必须晚于当前时间",
  );
});

it("keeps the form on the creation step when creation fails", async () => {
  createOnlineExamForPublication.mockRejectedValue(new Error("create failed"));
  const component = createComponent({
    answerTime: 30,
    courseId: 2,
    courseIdList: [2],
    examName: "V2 exam",
    examType: 1,
    hasTimeLimit: 0,
    paperId: 7,
    subjectId: 3,
    tabKey: 1,
  });

  component.handleSubmit();
  await flush();

  expect(component.state).toMatchObject({
    onOKLoding: false,
    tabKey: 1,
    usesV2Publication: false,
  });
  expect(component.state.id).toBeUndefined();
});

it("keeps the form when the V2 creation response is not V2", async () => {
  createOnlineExamForPublication.mockResolvedValue({ examId: 9, taskId: 10 });
  const component = createComponent({
    answerTime: 30,
    courseId: 2,
    courseIdList: [2],
    examName: "V2 exam",
    answerReleaseMode: ANSWER_RELEASE_MODE.SCHEDULED,
    answerReleaseTime: "2099-08-07 09:00",
    examType: 1,
    hasTimeLimit: 0,
    iFAssociateLessonId: true,
    lessonId: [1, 2],
    paperId: 7,
    subjectId: 3,
    tabKey: 1,
  });

  component.handleSubmit();
  await flush();

  expect(createOnlineExamForPublication).toHaveBeenCalledWith(
    expect.objectContaining({
      examOpenShowTime: "2099-08-07 09:00",
      iFAssociateLessonId: true,
      lessonId: 2,
    }),
    true,
  );
  expect(component.state).toMatchObject({
    tabKey: 1,
    usesV2Publication: false,
  });
});

it("keeps existing-exam edits on the legacy publication branch", async () => {
  createOnlineExamForPublication.mockResolvedValue({
    contractVersion: "LEGACY",
    examId: 9,
    taskId: 10,
  });
  const component = createComponent({
    answerTime: 30,
    courseId: 2,
    courseIdList: [2],
    examName: "Existing exam",
    examType: 1,
    hasTimeLimit: 0,
    id: 9,
    paperId: 7,
    subjectId: 3,
    tabKey: 1,
  });

  component.handleSubmit();
  await flush();

  expect(createOnlineExamForPublication).toHaveBeenCalledWith(
    expect.objectContaining({ examId: 9 }),
    false,
  );
  expect(component.state.usesV2Publication).toBe(false);
});

it("uses the persisted contract when an existing V2 exam is edited", async () => {
  createOnlineExamForPublication.mockResolvedValue({
    contractVersion: "V2",
    examId: 9,
    taskId: 10,
  });
  const component = createComponent({
    answerTime: 30,
    courseId: 2,
    courseIdList: [2],
    examName: "Existing V2 exam",
    examType: 1,
    hasTimeLimit: 0,
    id: 9,
    paperId: 7,
    subjectId: 3,
    tabKey: 1,
  });

  component.handleSubmit();
  await flush();

  expect(createOnlineExamForPublication).toHaveBeenCalledWith(
    expect.objectContaining({ examId: 9 }),
    false,
  );
  expect(component.state.usesV2Publication).toBe(true);
});

it("does not let a legacy publication hint downgrade new exam creation", async () => {
  createOnlineExamForPublication.mockResolvedValue({
    contractVersion: "V2",
    examId: 9,
    taskId: 10,
  });
  const component = createComponent(
    {
      answerTime: 30,
      courseId: 2,
      courseIdList: [2],
      examName: "Other entry",
      examType: 1,
      hasTimeLimit: 0,
      paperId: 7,
      subjectId: 3,
      tabKey: 1,
    },
    "LEGACY",
  );

  component.handleSubmit();
  await flush();

  expect(createOnlineExamForPublication).toHaveBeenCalledWith(
    expect.objectContaining({ paperId: 7 }),
    true,
  );
  expect(component.state.usesV2Publication).toBe(true);
});

it.each([
  [{ contractVersion: "V2", examId: null, taskId: 10 }],
  [{ contractVersion: "V2", examId: 9, taskId: 0 }],
])("keeps the form when creation identifiers are invalid", async (creation) => {
  createOnlineExamForPublication.mockResolvedValue(creation);
  const component = createComponent({
    answerTime: 30,
    courseId: 2,
    courseIdList: [2],
    examName: "Invalid creation",
    examType: 1,
    hasTimeLimit: 0,
    paperId: 7,
    subjectId: 3,
    tabKey: 1,
  });

  component.handleSubmit();
  await flush();

  expect(component.state).toMatchObject({
    tabKey: 1,
    usesV2Publication: false,
  });
  expect(component.getPublishDisplay).not.toHaveBeenCalled();
});

it("publishes a new exam through the V2 configuration boundary", async () => {
  configureAndPublishExamV2.mockResolvedValue({});
  const component = createComponent({
    classStudentData: [
      {
        groupCourseId: 20,
        studentList: [
          { disabled: false, id: 1, selected: true },
          { disabled: false, id: 2, selected: false },
          { disabled: true, id: 3, selected: false },
        ],
      },
    ],
    id: 9,
    paperId: 7,
    tabKey: 2,
    taskId: 10,
    usesV2Publication: true,
  });

  component.handleSubmit();
  await flush();

  expect(configureAndPublishExamV2).toHaveBeenCalledWith(
    expect.objectContaining({
      examId: 9,
      publicationBody: {
        resourceRequestList: [
          expect.objectContaining({
            examPaperId: 7,
            studentList: [{ groupId: 20, id: 1 }],
            taskId: 10,
          }),
        ],
      },
    }),
  );
  expect(configureAndPublishExamV2.mock.calls[0][0]).not.toHaveProperty(
    "allStudentIds",
  );
  expect(configureAndPublishExamV2.mock.calls[0][0]).not.toHaveProperty(
    "selectedStudentIds",
  );
  expect(component.state).toMatchObject({ onOKLoding: false, tabKey: 3 });
});

it("retains the created exam when V2 publication fails", async () => {
  configureAndPublishExamV2.mockRejectedValue(new Error("publish failed"));
  const component = createComponent({
    classStudentData: [
      {
        groupCourseId: 20,
        studentList: [{ disabled: false, id: 1, selected: true }],
      },
    ],
    id: 9,
    paperId: 7,
    tabKey: 2,
    taskId: 10,
    usesV2Publication: true,
  });

  component.handleSubmit();
  await flush();

  expect(createOnlineExamForPublication).not.toHaveBeenCalled();
  expect(component.getPublishDisplay).toHaveBeenCalledWith(10);
  expect(component.state).toMatchObject({
    id: 9,
    onOKLoding: false,
    tabKey: 2,
    usesV2Publication: true,
  });
});
