import { message } from "antd";

import {
  TestPaperManagement,
  canShowImportPaperAction,
  isPaperAiRecognitionProcessing,
} from "./index";

const ALLOWED_IMPORT_PAPER_USER_ID = "100000336459";
const DENIED_IMPORT_PAPER_USER_ID = "100000336460";
const ALLOWED_IMPORT_PAPER_SCHOOL_ID = "3300002072";
const ANOTHER_ALLOWED_IMPORT_PAPER_SCHOOL_ID = "3300002109";
const DENIED_IMPORT_PAPER_SCHOOL_ID = "3300002073";

const createComponent = (overrides = {}) =>
  new TestPaperManagement({
    dispatch: jest.fn(async (payload) => payload),
    examOptions: [],
    history: { location: { pathname: "/testPaperManagement/1" } },
    paperList: { examList: [] },
    testSubject: [],
    typeValue: 0,
    viewOrDownPaper: {},
    ...overrides,
  });

describe("TestPaperManagement preview flows", () => {
  const originalOpen = window.open;

  beforeEach(() => {
    window.globalLange = "zh-CN";
    window.history.pushState({}, "", "/exam/");
    window.open = jest.fn();
    jest.spyOn(message, "error").mockImplementation(jest.fn());
  });

  afterEach(() => {
    window.history.pushState({}, "", "/");
    window.open = originalOpen;
    jest.restoreAllMocks();
  });

  it("always opens the paper detail page from the preview action", () => {
    const component = createComponent();

    component.previewPaperDetail({ id: 11_290 });

    expect(window.open).toHaveBeenCalledWith(
      "http://localhost/exam#/paperEditor?mode=preview&paperId=11290",
    );
  });

  it("opens the same paper detail page from the initiate test action", () => {
    const component = createComponent();
    component.state.jumpExamPaperId = 11_290;

    component.clickTestPaperOnline();

    expect(window.open).toHaveBeenCalledWith(
      "http://localhost/exam#/paperEditor?mode=preview&paperId=11290",
    );
  });

  it("opens the original paper preview url when the backend returns one", async () => {
    const dispatch = jest.fn(async (payload) => payload);
    const component = createComponent({
      dispatch,
      viewOrDownPaper: {
        url: "https://cdn.example.com/original-paper.pdf",
      },
    });

    await component.previewOriginalPaper({ id: 11_290 });

    expect(dispatch).toHaveBeenCalledWith({
      type: "home/getViewOrDownPaper",
      payload: { paperId: 11_290 },
    });
    expect(window.open).toHaveBeenCalledWith(
      "https://cdn.example.com/original-paper.pdf",
    );
  });

  it("shows an error and stays on the page when no original paper preview url is returned", async () => {
    const dispatch = jest.fn(async (payload) => payload);
    const component = createComponent({
      dispatch,
      viewOrDownPaper: {},
    });

    await component.previewOriginalPaper({ id: 11_290 });

    expect(window.open).not.toHaveBeenCalled();
    expect(message.error).toHaveBeenCalledWith("当前原卷暂不可预览");
  });
});

describe("canShowImportPaperAction", () => {
  it("allows the configured import paper user id", () => {
    expect(
      canShowImportPaperAction({ userId: ALLOWED_IMPORT_PAPER_USER_ID }),
    ).toBe(true);
  });

  it("allows the configured import paper user id when backend returns a number", () => {
    expect(
      canShowImportPaperAction({
        userId: Number(ALLOWED_IMPORT_PAPER_USER_ID),
      }),
    ).toBe(true);
  });

  it("allows any user in the configured import paper school", () => {
    expect(
      canShowImportPaperAction({
        schoolId: ALLOWED_IMPORT_PAPER_SCHOOL_ID,
        userId: DENIED_IMPORT_PAPER_USER_ID,
      }),
    ).toBe(true);
    expect(
      canShowImportPaperAction({
        schoolId: ANOTHER_ALLOWED_IMPORT_PAPER_SCHOOL_ID,
        userId: DENIED_IMPORT_PAPER_USER_ID,
      }),
    ).toBe(true);
  });

  it("allows the configured import paper school when backend returns a number", () => {
    expect(
      canShowImportPaperAction({
        schoolId: Number(ALLOWED_IMPORT_PAPER_SCHOOL_ID),
        userId: DENIED_IMPORT_PAPER_USER_ID,
      }),
    ).toBe(true);
  });

  it("rejects users outside the import paper allowlist", () => {
    expect(
      canShowImportPaperAction({
        schoolId: DENIED_IMPORT_PAPER_SCHOOL_ID,
        userId: DENIED_IMPORT_PAPER_USER_ID,
      }),
    ).toBe(false);
  });

  it("rejects missing current user data", () => {
    expect(canShowImportPaperAction()).toBe(false);
    expect(canShowImportPaperAction({})).toBe(false);
  });
});

describe("online exam availability during AI recognition", () => {
  it.each([
    [1, true],
    ["1", true],
    [0, false],
    [2, false],
    [3, false],
    [4, false],
    [undefined, false],
  ])("maps aiRecognition=%p to processing=%p", (status, expected) => {
    expect(isPaperAiRecognitionProcessing({ aiRecognition: status })).toBe(
      expected,
    );
  });

  it("uses the refreshed selected paper status while the modal stays open", () => {
    const component = createComponent({
      paperList: {
        examList: [{ id: 11_290, aiRecognition: 1 }],
      },
    });
    component.state.jumpExamPaperId = 11_290;

    expect(component.isSelectedPaperRecognizing()).toBe(true);

    component.props.paperList = {
      examList: [{ id: 11_290, aiRecognition: 3 }],
    };

    expect(component.isSelectedPaperRecognizing()).toBe(false);
  });
});
