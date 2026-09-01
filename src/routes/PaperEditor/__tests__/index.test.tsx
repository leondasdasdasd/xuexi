import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { message } from "antd";
import React from "react";

import {
  loadPaperEditorDetailSource,
  loadPaperEditorSource,
  savePaperEditorDraft,
} from "../paperEditorService";
import { downloadExamPaperPdf } from "../paperPdf";
import { PaperEditor } from "../index";

interface MockOnlineTestProps {
  dispatch: jest.Mock;
  options: {
    onCancel: () => void;
    onOk: () => void;
    visible: boolean;
  };
  paperId: number;
  publicationContract: string;
}

let mockOnlineTestProps: MockOnlineTestProps | undefined;

jest.mock("@yungu-fed/question-editor", () => ({
  normalizeRichTextContent: (value: unknown) => value,
}));
jest.mock("../../../components/ModalOnlineTest", () => ({
  __esModule: true,
  default: (properties: { modalOnlineTestProps: MockOnlineTestProps }) => {
    mockOnlineTestProps = properties.modalOnlineTestProps;
    return (
      <div aria-label="线上测验配置" role="dialog">
        <button
          type="button"
          onClick={properties.modalOnlineTestProps.options.onCancel}
        >
          取消线上测验
        </button>
        <button
          type="button"
          onClick={properties.modalOnlineTestProps.options.onOk}
        >
          完成线上测验
        </button>
      </div>
    );
  },
}));
jest.mock("qrcode.react", () => ({
  QRCodeSVG: ({
    "aria-label": label,
    value,
  }: {
    "aria-label": string;
    value: string;
  }) => (
    <div data-testid="ipad-trial-qrcode" data-value={value}>
      {label}
    </div>
  ),
}));
let mockPageQuery: Record<string, string> = { subjectId: "2" };
jest.mock("../../../utils/utils", () => ({
  getPageQuery: () => mockPageQuery,
}));
jest.mock("../paperEditorService", () => ({
  getPaperEditorDisplayError: (error: Error, fallback: string) =>
    error?.message || fallback,
  loadPaperEditorDetailSource: jest.fn(),
  loadPaperEditorSource: jest.fn(),
  savePaperEditorDraft: jest.fn(),
}));
jest.mock("../paperPdf", () => ({
  downloadExamPaperPdf: jest.fn(),
}));
jest.mock(
  "../components/ModuleList",
  () =>
    function MockModuleList(properties: {
      editable: boolean;
      draft: {
        modules: Array<{
          key: string;
          questions: Array<{ key: string }>;
          title: string;
        }>;
      };
      onDeleteQuestion: (questionKey: string) => void;
      onScoreChange: (questionKey: string, score: number) => void;
      onTitleChange: (moduleKey: string, title: string) => void;
    }) {
      const module = properties.draft.modules[0];
      const question = module?.questions[0];
      return (
        <div data-testid="module-list">
          <span data-testid="module-count">
            {properties.draft.modules.length}
          </span>
          <span data-testid="question-count">
            {properties.draft.modules.reduce(
              (count, item) => count + item.questions.length,
              0,
            )}
          </span>
          {properties.draft.modules.map((item) => (
            <input
              aria-label={`${item.key}题块标题`}
              id={`paper-module-title-${item.key}`}
              key={item.key}
              value={item.title}
              onChange={(event) =>
                properties.onTitleChange(item.key, event.target.value)
              }
            />
          ))}
          <input id="paper-question-score-question-341" />
          <span>{properties.editable ? "editable" : "readonly"}</span>
          {properties.editable ? (
            <>
              <button
                data-testid="rename-module"
                onClick={() => properties.onTitleChange(module.key, "新块标题")}
                type="button"
              />
              <button
                data-testid="score-question"
                onClick={() =>
                  question && properties.onScoreChange(question.key, 5)
                }
                type="button"
              />
              {question ? (
                <button
                  data-testid="delete-question"
                  onClick={() => properties.onDeleteQuestion(question.key)}
                  type="button"
                />
              ) : null}
            </>
          ) : null}
        </div>
      );
    },
);
jest.mock(
  "../components/PaperOutlineSidebar",
  () =>
    function MockPaperOutlineSidebar(properties: {
      editable: boolean;
      draft: {
        gradeName?: string;
        modules: Array<{ key: string }>;
        subjectName: string;
      };
      grades: Array<{ gradeId: number; name: string }>;
      onAddModule: () => void;
      onGradeChange: (gradeId: number) => void;
      onSubjectChange: (subjectId: number) => void;
      onMoveModule: (oldIndex: number, newIndex: number) => void;
      onMoveQuestion: (command: {
        sourceModuleKey: string;
        sourceQuestionIndex: number;
        targetModuleKey: string;
        targetQuestionIndex: number;
      }) => void;
      onIpadTrial?: () => void;
      onTrial?: () => void;
    }) {
      const moduleKey = properties.draft.modules[0]?.key || "module-1";
      return (
        <aside>
          <span>{properties.draft.gradeName}</span>
          <span>{properties.draft.subjectName}</span>
          {properties.editable ? (
            <>
              <button
                data-testid="add-module"
                onClick={properties.onAddModule}
                type="button"
              />
              <button
                data-testid="change-grade"
                onClick={() => properties.onGradeChange(8)}
                type="button"
              >
                切换年级
              </button>
              <button
                data-testid="change-subject"
                onClick={() => properties.onSubjectChange(3)}
                type="button"
              >
                切换学科
              </button>
              <select aria-label="试卷类型" />
              <button
                data-testid="move-module"
                onClick={() => properties.onMoveModule(0, 0)}
                type="button"
              />
              <button
                data-testid="move-question"
                onClick={() =>
                  properties.onMoveQuestion({
                    sourceModuleKey: moduleKey,
                    sourceQuestionIndex: 0,
                    targetModuleKey: moduleKey,
                    targetQuestionIndex: 0,
                  })
                }
                type="button"
              />
            </>
          ) : null}
          {properties.onTrial ? (
            <button type="button" onClick={properties.onTrial}>
              {properties.onIpadTrial ? "电脑端试做" : "试作"}
            </button>
          ) : null}
          {properties.onIpadTrial ? (
            <button type="button" onClick={properties.onIpadTrial}>
              iPad端试做
            </button>
          ) : null}
        </aside>
      );
    },
);

const source = {
  basket: {
    subjectId: 2,
    subjectName: "数学",
    moduleList: [
      {
        moduleName: "问卷题",
        moduleQuestionNumber: "1",
        moduleType: 0,
        businessQuestionTypeId: 101,
        questionList: [
          {
            questionId: 341,
            type: 7,
            businessQuestionTypeId: 101,
            knowledgeIds: [],
            knowledgeValues: [],
            chapterIds: [],
            chapterValues: [],
            indicatorIds: [],
            indicatorValues: [],
            children: [],
            questionData: {
              id: 341,
              businessQuestionTypeId: 101,
              version: "1",
              elements: [],
              extras: [],
              children: [],
            },
          },
        ],
      },
    ],
  },
  grades: [
    { gradeId: 7, name: "七年级" },
    { gradeId: 8, name: "八年级" },
  ],
  paperTypes: [{ code: 1, typeName: "课堂小测" }],
  subjects: [
    { subjectId: 2, name: "数学" },
    { subjectId: 3, name: "英语" },
  ],
  questionTypes: [
    {
      businessQuestionTypeId: 101,
      name: "问卷题",
      elements: [],
      extras: [],
      globalConfig: { hasAnswer: false },
    },
  ],
};

const loadMock = loadPaperEditorSource as jest.Mock;
const loadDetailMock = loadPaperEditorDetailSource as jest.Mock;
const saveMock = savePaperEditorDraft as jest.Mock;

describe("PaperEditor page", () => {
  let closeMock: jest.SpyInstance;
  let openMock: jest.SpyInstance;
  let animationFrameMock: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnlineTestProps = undefined;
    Reflect.set(window, "globalLange", "zh-CN");
    closeMock = jest.spyOn(window, "close").mockImplementation(jest.fn());
    openMock = jest.spyOn(window, "open").mockImplementation(jest.fn());
    animationFrameMock = jest
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((callback: FrameRequestCallback) => {
        callback(0);
        return 0;
      });
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: jest.fn(),
    });
    mockPageQuery = { subjectId: "2" };
    loadMock.mockResolvedValue(source);
    saveMock.mockResolvedValue(99);
    loadDetailMock.mockResolvedValue({
      detail: {
        id: 99,
        title: "已有试卷",
        paperTypeCode: 1,
        gradeId: 7,
        subjectId: 2,
        totalScore: 0,
        capabilities: { update: true, delete: false, copy: false },
        content: { moduleList: source.basket.moduleList },
      },
      grades: source.grades,
      paperTypes: source.paperTypes,
      subjects: source.subjects,
      questionTypes: source.questionTypes,
    });
    jest.spyOn(message, "success").mockImplementation(jest.fn());
    jest.spyOn(message, "error").mockImplementation(jest.fn());
    jest.spyOn(message, "warning").mockImplementation(jest.fn());
  });

  afterEach(() => {
    closeMock.mockRestore();
    openMock.mockRestore();
    animationFrameMock.mockRestore();
  });

  it("navigates a newly created paper to its detail page after saving", async () => {
    const dispatch = jest.fn();
    const push = jest.fn();
    render(<PaperEditor dispatch={dispatch} history={{ push }} />);

    expect(await screen.findByText("数学")).toBeInTheDocument();
    expect(loadMock).toHaveBeenCalledWith(2);
    expect(screen.queryByText("七年级")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("change-grade"));
    expect(screen.getByText("八年级")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("change-subject"));
    expect(screen.getByText("英语")).toBeInTheDocument();
    expect(screen.getByLabelText("试卷类型")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "电脑端试做" }),
    ).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("试卷标题"), {
      target: { value: "七年级练习" },
    });
    fireEvent.click(screen.getByTestId("score-question"));
    fireEvent.click(screen.getByText("保存试卷"));
    await waitFor(() => expect(saveMock).toHaveBeenCalledTimes(1));
    expect(saveMock.mock.calls[0][0]).not.toHaveProperty("paperId");
    expect(saveMock.mock.calls[0][0]).toHaveProperty("subjectId", 3);
    expect(dispatch).toHaveBeenCalledWith({ type: "home/getCount" });
    expect(push).toHaveBeenCalledWith("/paperEditor?mode=preview&paperId=99");
  });

  it("navigates an edited paper to its detail page after saving", async () => {
    mockPageQuery = { mode: "edit", paperId: "99" };
    const push = jest.fn();
    render(<PaperEditor dispatch={jest.fn()} history={{ push }} />);

    await screen.findByDisplayValue("已有试卷");
    fireEvent.click(screen.getByTestId("score-question"));
    fireEvent.click(screen.getByText("保存试卷"));

    await waitFor(() => expect(saveMock).toHaveBeenCalledTimes(1));
    expect(saveMock.mock.calls[0][0]).toHaveProperty("paperId", 99);
    expect(push).toHaveBeenCalledWith("/paperEditor?mode=preview&paperId=99");
  });

  it("does not navigate when saving fails", async () => {
    const push = jest.fn();
    saveMock.mockRejectedValueOnce(new Error("保存接口异常"));
    render(<PaperEditor dispatch={jest.fn()} history={{ push }} />);

    await screen.findByText("数学");
    fireEvent.click(screen.getByTestId("change-grade"));
    fireEvent.change(screen.getByLabelText("试卷标题"), {
      target: { value: "保存失败试卷" },
    });
    fireEvent.click(screen.getByTestId("score-question"));
    fireEvent.click(screen.getByText("保存试卷"));

    await waitFor(() =>
      expect(message.error).toHaveBeenCalledWith("保存接口异常"),
    );
    expect(push).not.toHaveBeenCalled();
  });

  it("returns to the source page when closed inside the application", async () => {
    const goBack = jest.fn();
    render(
      <PaperEditor
        dispatch={jest.fn()}
        history={{ goBack, length: 2, push: jest.fn() }}
      />,
    );

    fireEvent.click(await screen.findByRole("button", { name: "编辑试卷" }));

    expect(goBack).toHaveBeenCalledTimes(1);
    expect(closeMock).not.toHaveBeenCalled();
  });

  it("closes a standalone window without a source history entry", async () => {
    const goBack = jest.fn();
    render(
      <PaperEditor
        dispatch={jest.fn()}
        history={{ goBack, length: 1, push: jest.fn() }}
      />,
    );

    fireEvent.click(await screen.findByRole("button", { name: "编辑试卷" }));

    expect(closeMock).toHaveBeenCalledTimes(1);
    expect(goBack).not.toHaveBeenCalled();
  });

  it("closes the preview window after returning from edit mode", async () => {
    mockPageQuery = { mode: "preview", paperId: "99" };
    const goBack = jest.fn();
    const push = jest.fn();
    const history = { goBack, length: 2, push };
    const { rerender } = render(
      <PaperEditor
        dispatch={jest.fn()}
        history={history}
        location={{ search: "?mode=preview&paperId=99" }}
      />,
    );

    expect(
      await screen.findByRole("button", { name: "预览试卷" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "编辑试卷" }));
    expect(push).toHaveBeenCalledWith("/paperEditor?mode=edit&paperId=99");

    rerender(
      <PaperEditor
        dispatch={jest.fn()}
        history={history}
        location={{ search: "?mode=edit&paperId=99" }}
      />,
    );
    expect(await screen.findByDisplayValue("已有试卷")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "编辑试卷" }));
    expect(goBack).toHaveBeenCalledTimes(1);

    rerender(
      <PaperEditor
        dispatch={jest.fn()}
        history={history}
        location={{ search: "?mode=preview&paperId=99" }}
      />,
    );
    expect(
      await screen.findByRole("button", { name: "预览试卷" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "预览试卷" }));

    expect(closeMock).toHaveBeenCalledTimes(1);
    expect(goBack).toHaveBeenCalledTimes(1);
  });

  it("prompts and focuses the first missing score without opening a modal", async () => {
    render(<PaperEditor dispatch={jest.fn()} />);
    await screen.findByText("数学");
    fireEvent.click(screen.getByTestId("change-grade"));
    fireEvent.change(screen.getByLabelText("试卷标题"), {
      target: { value: "缺分试卷" },
    });

    fireEvent.click(screen.getByText("保存试卷"));

    expect(saveMock).not.toHaveBeenCalled();
    expect(screen.queryByText("存在未设置分数的题目")).not.toBeInTheDocument();
    const scoreInput = document.getElementById(
      "paper-question-score-question-341",
    );
    expect(document.activeElement).toBe(scoreInput);
    expect(scoreInput?.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "center",
    });
    expect(message.warning).toHaveBeenCalledWith("请填写分数");
  });

  it("forwards edit commands and preserves a module after its last question is removed", async () => {
    render(<PaperEditor dispatch={jest.fn()} />);
    await screen.findByTestId("module-list");

    fireEvent.click(screen.getByTestId("move-module"));
    fireEvent.click(screen.getByTestId("move-question"));
    fireEvent.click(screen.getByTestId("rename-module"));
    fireEvent.click(screen.getByTestId("score-question"));
    fireEvent.click(screen.getByTestId("delete-question"));

    expect(screen.getByTestId("module-list")).toBeInTheDocument();
    expect(screen.getByTestId("module-count")).toHaveTextContent("1");
    expect(screen.getByTestId("question-count")).toHaveTextContent("0");
  });

  it("adds a module at the end and focuses its title input", async () => {
    let focusNewModule: FrameRequestCallback | undefined;
    animationFrameMock.mockImplementation((callback: FrameRequestCallback) => {
      focusNewModule = callback;
      return 0;
    });
    render(<PaperEditor dispatch={jest.fn()} />);
    await screen.findByTestId("module-list");

    fireEvent.click(screen.getByTestId("add-module"));

    expect(screen.getByTestId("module-count")).toHaveTextContent("2");
    const titleInput = screen.getByLabelText(/module-new-\d+题块标题/);
    act(() => focusNewModule?.(0));
    expect(document.activeElement).toBe(titleInput);
    expect(titleInput.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "center",
    });
  });

  it("blocks the save request while an empty module remains", async () => {
    render(<PaperEditor dispatch={jest.fn()} />);
    await screen.findByTestId("module-list");
    fireEvent.change(screen.getByLabelText("试卷标题"), {
      target: { value: "包含空题块的试卷" },
    });
    fireEvent.click(screen.getByTestId("change-grade"));
    fireEvent.click(screen.getByTestId("score-question"));
    fireEvent.click(screen.getByTestId("add-module"));

    fireEvent.click(screen.getByText("保存试卷"));

    expect(saveMock).not.toHaveBeenCalled();
    expect(message.warning).toHaveBeenCalledWith(
      "试卷存在没有题目的题块，请添加题目或删除题块",
    );
  });

  it("renders a load failure without constructing an editor draft", async () => {
    loadMock.mockRejectedValueOnce(new Error("试题栏不可用"));

    render(<PaperEditor dispatch={jest.fn()} />);

    expect(await screen.findByText("试题栏不可用")).toBeInTheDocument();
    expect(screen.queryByTestId("module-list")).not.toBeInTheDocument();
  });

  it("renders the localized empty basket state", async () => {
    loadMock.mockResolvedValueOnce({
      ...source,
      basket: { ...source.basket, moduleList: [] },
    });

    render(<PaperEditor dispatch={jest.fn()} />);

    expect(await screen.findByText("试卷暂无题目")).toBeInTheDocument();
  });

  it("loads an existing paper in edit mode", async () => {
    mockPageQuery = { mode: "edit", paperId: "99" };

    render(<PaperEditor dispatch={jest.fn()} />);

    expect(await screen.findByDisplayValue("已有试卷")).toBeInTheDocument();
    expect(loadDetailMock).toHaveBeenCalledWith(99);
    expect(loadMock).not.toHaveBeenCalled();
    expect(screen.getByText("editable")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "发起测验" }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "编辑试卷" }));
    expect(closeMock).toHaveBeenCalledTimes(1);
    const editModeTrial = screen.getByRole("button", { name: "电脑端试做" });
    expect(editModeTrial.closest("aside")).not.toBeNull();
    fireEvent.click(editModeTrial);
    expect(openMock).toHaveBeenCalledWith(
      "http://localhost/#/teacher/papers/99/trial",
      "_blank",
      "noopener,noreferrer",
    );
  });

  it("shows the current teacher trial URL as an iPad QR code", async () => {
    mockPageQuery = { mode: "edit", paperId: "99" };

    render(<PaperEditor dispatch={jest.fn()} />);

    fireEvent.click(await screen.findByRole("button", { name: "iPad端试做" }));

    expect(openMock).not.toHaveBeenCalled();
    expect(screen.getByTestId("ipad-trial-qrcode")).toHaveAttribute(
      "data-value",
      "http://localhost/#/teacher/papers/99/trial",
    );
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByTestId("ipad-trial-qrcode")).not.toBeInTheDocument();
  });

  it("clears the previous iPad trial URL when the paper changes", async () => {
    mockPageQuery = { mode: "preview", paperId: "99" };
    const nextDetailSource = await loadDetailMock();
    let resolveNextDetail: (value: typeof nextDetailSource) => void = jest.fn();
    const nextDetailPromise = new Promise<typeof nextDetailSource>(
      (resolve) => {
        resolveNextDetail = resolve;
      },
    );
    loadDetailMock
      .mockResolvedValueOnce(nextDetailSource)
      .mockReturnValueOnce(nextDetailPromise);
    const properties = {
      dispatch: jest.fn(),
      history: { push: jest.fn() },
    };
    const { rerender } = render(
      <PaperEditor
        {...properties}
        location={{ search: "?mode=preview&paperId=99" }}
      />,
    );

    fireEvent.click(await screen.findByRole("button", { name: "iPad端试做" }));
    expect(screen.getByTestId("ipad-trial-qrcode")).toHaveAttribute(
      "data-value",
      "http://localhost/#/teacher/papers/99/trial",
    );

    rerender(
      <PaperEditor
        {...properties}
        location={{ search: "?mode=preview&paperId=100" }}
      />,
    );
    expect(screen.queryByTestId("ipad-trial-qrcode")).not.toBeInTheDocument();

    await act(async () => {
      resolveNextDetail(nextDetailSource);
      await nextDetailPromise;
    });
    expect(
      await screen.findByRole("heading", { name: "已有试卷" }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("ipad-trial-qrcode")).not.toBeInTheDocument();
  });

  it("renders preview mode without editing operations", async () => {
    mockPageQuery = { mode: "preview", paperId: "99" };
    const push = jest.fn();

    render(
      <PaperEditor
        dispatch={jest.fn()}
        history={{ push }}
        location={{ search: "?mode=preview&paperId=99" }}
      />,
    );

    expect(
      await screen.findByRole("heading", { name: "已有试卷" }),
    ).toBeInTheDocument();
    expect(screen.getByText("预览试卷")).toBeInTheDocument();
    expect(screen.getByText("readonly")).toBeInTheDocument();
    expect(screen.queryByText("保存试卷")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("试卷标题")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "电脑端试做" }).closest("aside"),
    ).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "预览试卷" }));
    expect(closeMock).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "编辑试卷" }));
    expect(push).toHaveBeenCalledWith("/paperEditor?mode=edit&paperId=99");

    fireEvent.click(screen.getByRole("button", { name: "下载答题卡" }));
    expect(openMock).toHaveBeenCalledWith(
      "/api/v2/exam-papers/99/answer-sheet",
      "_blank",
      "noopener,noreferrer",
    );
    fireEvent.click(screen.getByRole("button", { name: "下载试卷" }));
    expect(downloadExamPaperPdf).toHaveBeenCalledWith({ paperId: 99 });
  });

  it("opens the V2 online test flow from preview mode", async () => {
    mockPageQuery = { mode: "preview", paperId: "99" };
    const dispatch = jest.fn();
    const push = jest.fn();

    render(
      <PaperEditor
        dispatch={dispatch}
        history={{ push }}
        location={{ search: "?mode=preview&paperId=99" }}
      />,
    );

    fireEvent.click(await screen.findByRole("button", { name: "发起测验" }));

    expect(
      screen.getByRole("dialog", { name: "线上测验配置" }),
    ).toBeInTheDocument();
    expect(mockOnlineTestProps).toMatchObject({
      dispatch,
      paperId: 99,
      publicationContract: "V2",
      options: { visible: true },
    });

    fireEvent.click(screen.getByRole("button", { name: "取消线上测验" }));
    expect(
      screen.queryByRole("dialog", { name: "线上测验配置" }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "发起测验" }));
    fireEvent.click(screen.getByRole("button", { name: "完成线上测验" }));

    expect(push).toHaveBeenCalledWith("/examAnalysis");
    expect(
      screen.queryByRole("dialog", { name: "线上测验配置" }),
    ).not.toBeInTheDocument();
  });

  it("keeps paper downloads out of create mode", async () => {
    render(<PaperEditor dispatch={jest.fn()} />);

    expect(await screen.findByLabelText("试卷标题")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "下载答题卡" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "下载试卷" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "发起测验" }),
    ).not.toBeInTheDocument();
  });

  it("disables preview editing when update capability is unavailable", async () => {
    mockPageQuery = { mode: "preview", paperId: "99" };
    const detailSource = await loadDetailMock();
    const push = jest.fn();
    loadDetailMock.mockResolvedValueOnce({
      ...detailSource,
      detail: {
        ...detailSource.detail,
        capabilities: {
          update: false,
          updateDisabledReasonCode: "PAPER_PERMISSION_REQUIRED",
          delete: false,
          copy: false,
        },
      },
    });

    render(
      <PaperEditor
        dispatch={jest.fn()}
        history={{ push }}
        location={{ search: "?mode=preview&paperId=99" }}
      />,
    );

    const editButton = await screen.findByRole("button", {
      name: "编辑试卷",
    });
    expect(editButton).toHaveAttribute("aria-disabled", "true");
    fireEvent.mouseEnter(editButton);
    expect(
      await screen.findByText(
        "仅试卷创建人或拥有对应年级、学科管理权限的老师可编辑",
      ),
    ).toBeInTheDocument();
    fireEvent.click(editButton);
    expect(push).not.toHaveBeenCalled();
  });

  it("clears the previous preview capability while a new paper loads", async () => {
    mockPageQuery = { mode: "preview", paperId: "99" };
    const properties = {
      dispatch: jest.fn(),
      history: { push: jest.fn() },
    };
    const { rerender } = render(
      <PaperEditor
        {...properties}
        location={{ search: "?mode=preview&paperId=99" }}
      />,
    );

    expect(
      await screen.findByRole("button", { name: "编辑试卷" }),
    ).toBeEnabled();

    loadDetailMock.mockReturnValueOnce(new Promise(() => undefined));
    mockPageQuery = { mode: "preview", paperId: "100" };
    rerender(
      <PaperEditor
        {...properties}
        location={{ search: "?mode=preview&paperId=100" }}
      />,
    );

    expect(await screen.findByText("正在加载试卷……")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "编辑试卷" }),
    ).not.toBeInTheDocument();
  });

  it("downgrades edit mode when update capability is unavailable", async () => {
    mockPageQuery = { mode: "edit", paperId: "99" };
    loadDetailMock.mockResolvedValueOnce({
      ...(await loadDetailMock()),
      detail: {
        ...(await loadDetailMock()).detail,
        capabilities: {
          update: false,
          updateDisabledReasonCode: "PAPER_CONTENT_FROZEN",
          delete: false,
          copy: false,
        },
      },
    });

    render(<PaperEditor dispatch={jest.fn()} />);

    expect(
      await screen.findByText(
        "该试卷内容已固化，当前不能直接编辑；如需调整，请复制试卷后编辑",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("readonly")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "电脑端试做" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "编辑试卷" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "发起测验" }),
    ).not.toBeInTheDocument();
  });
});
