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
  bindQuestionV2Basket,
  createQuestionV2Resource,
  queryQuestionV2Resource,
  updateQuestionV2Resource,
} from "../../services/questionV2.js";
import { queryEnabledBusinessQuestionTypesV2 } from "../../services/businessQuestionTypeV2.js";
import { QUESTION_ASSET_TYPE_V2_FIXTURES } from "./questionAssetTypeV2.testFixtures.js";
import { PureQuestionAssetInput } from "./index.jsx";

jest.mock("../../services/questionV2.js", () => ({
  bindQuestionV2Basket: jest.fn(),
  createQuestionV2Resource: jest.fn(),
  queryQuestionV2Resource: jest.fn(),
  updateQuestionV2Resource: jest.fn(),
}));

jest.mock("../../services/businessQuestionTypeV2.js", () => ({
  queryEnabledBusinessQuestionTypesV2: jest.fn(),
}));

const mockQuestionAssetContentPanel = jest.fn(
  ({ draft, questionTypeTemplates }) => (
    <div data-testid="question-asset-editor">
      <span>{draft.questionTypeKey}</span>
      <span>{questionTypeTemplates.length}</span>
    </div>
  ),
);

/**
 * 测试替身：只暴露 editor 收到的关键题型数据。
 * @param {object} properties 组件属性。
 * @returns {React.ReactElement} 测试节点。
 */
function mockRenderQuestionAssetContentPanel(properties) {
  return mockQuestionAssetContentPanel(properties);
}

jest.mock(
  "./components/QuestionAssetContentPanel.jsx",
  () => mockRenderQuestionAssetContentPanel,
);

const mockQuestionAssetScopePanel = jest.fn(
  ({ onGradeChange, onSubjectChange }) => (
    <div>
      <button
        type="button"
        onClick={(event) => {
          void event;
          onGradeChange(7);
        }}
      >
        选择年级
      </button>
      <button
        type="button"
        onClick={(event) => {
          void event;
          onSubjectChange(2);
        }}
      >
        选择学科
      </button>
      <button type="button" onClick={() => onGradeChange(8)}>
        更换年级
      </button>
      <button type="button" onClick={() => onSubjectChange(3)}>
        更换学科
      </button>
      <button type="button" onClick={() => onGradeChange(7)}>
        恢复年级
      </button>
      <button type="button" onClick={() => onSubjectChange(2)}>
        恢复学科
      </button>
    </div>
  ),
);

/**
 * 测试替身：通过按钮稳定触发范围选择。
 * @param {object} properties 组件属性。
 * @returns {React.ReactElement} 测试节点。
 */
function mockRenderQuestionAssetScopePanel(properties) {
  return mockQuestionAssetScopePanel(properties);
}

jest.mock(
  "./components/QuestionAssetScopePanel.jsx",
  () => mockRenderQuestionAssetScopePanel,
);

const mockQuestionAssetMetadataPanel = jest.fn(({ onChange }) => (
  <button
    type="button"
    onClick={(event) => {
      void event;
      onChange({ level: 3 });
      onChange({ chapterIds: [30] });
      onChange({ knowledgeIds: [10] });
      onChange({ indicatorIds: [20] });
    }}
  >
    选择资源属性
  </button>
));

/**
 * 测试替身：集中触发题目资源属性变更。
 * @param {object} properties 组件属性。
 * @returns {React.ReactElement} 测试节点。
 */
function mockRenderQuestionAssetMetadataPanel(properties) {
  return mockQuestionAssetMetadataPanel(properties);
}

jest.mock(
  "./components/QuestionAssetMetadataPanel.jsx",
  () => mockRenderQuestionAssetMetadataPanel,
);

const createQuestionAssetInputElement = (properties = {}) => (
  <PureQuestionAssetInput
    allGradeList={[
      { gradeId: 7, name: "一年级", stageId: 2 },
      { gradeId: 8, name: "七年级", stageId: 3 },
    ]}
    dispatch={jest.fn()}
    history={{ go: jest.fn() }}
    subjectList={[]}
    {...properties}
  />
);

const renderQuestionAssetInput = (properties = {}) =>
  render(createQuestionAssetInputElement(properties));

const selectTeachingContext = () => {
  fireEvent.click(screen.getByText("选择年级"));
  fireEvent.click(screen.getByText("选择学科"));
};

const createDeferredResponse = () => {
  let resolve;
  const promise = new Promise((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
};

describe("QuestionAssetInput", () => {
  beforeEach(() => {
    window.globalLange = "zh";
    window.history.replaceState({}, "", "/");
    jest.clearAllMocks();
    queryEnabledBusinessQuestionTypesV2.mockResolvedValue({
      content: QUESTION_ASSET_TYPE_V2_FIXTURES,
      ifLogin: true,
      status: true,
    });
    createQuestionV2Resource.mockResolvedValue({
      content: { id: 341 },
      ifLogin: true,
      status: true,
    });
    updateQuestionV2Resource.mockResolvedValue({
      content: { id: 341 },
      ifLogin: true,
      status: true,
    });
    bindQuestionV2Basket.mockResolvedValue({
      content: {},
      ifLogin: true,
      status: true,
    });
    queryQuestionV2Resource.mockResolvedValue({
      content: {
        question: {
          children: [],
          elements: [
            {
              content: { html: "题干", json: [], text: "题干" },
              type: "richText",
            },
            {
              answers: { optionIds: ["option-a"] },
              columns: [
                {
                  content: { html: "", json: [], text: "" },
                  id: "column-1",
                },
              ],
              options: [
                {
                  cells: [{ html: "选项A", json: [], text: "选项A" }],
                  id: "option-a",
                },
              ],
              type: "choice",
            },
          ],
          extras: [
            {
              content: { html: "", json: [], text: "" },
              type: "solvingProcess",
            },
            {
              content: { html: "", json: [], text: "" },
              type: "scoringRule",
            },
          ],
          id: 341,
          businessQuestionTypeId: 3,
          version: "1",
        },
        resource: {
          chapterIds: [30],
          gradeId: 7,
          knowledgeIds: [10],
          level: 2,
          stem: "详情派生题干",
          subjectId: 2,
        },
      },
      ifLogin: true,
      status: true,
    });
  });

  it.each([
    [undefined, "题目录入"],
    ["new", "题目录入"],
    ["341", "题目编辑"],
  ])("shows the correct title for route id %s", (id, title) => {
    if (id === "341") {
      queryQuestionV2Resource.mockImplementationOnce(
        () => new Promise(() => undefined),
      );
    }
    const { unmount } = renderQuestionAssetInput({ match: { params: { id } } });

    expect(
      screen.getByRole("heading", { level: 1, name: title }),
    ).toBeVisible();
    unmount();
  });

  it("prefills the teaching scope from the create route", async () => {
    const dispatch = jest.fn();
    window.history.replaceState(
      {},
      "",
      "/exam#/questionAssetInput?gradeId=7&subjectId=2",
    );

    renderQuestionAssetInput({ dispatch });

    await waitFor(() => {
      expect(queryEnabledBusinessQuestionTypesV2).toHaveBeenCalledWith({
        stageId: 2,
        subjectId: 2,
      });
    });
    expect(dispatch).toHaveBeenCalledWith({
      payload: { gradeId: 7 },
      type: "inputQuestion/getSubjectList",
    });
  });

  it("waits for a complete teaching context before loading question types", async () => {
    const dispatch = jest.fn();

    renderQuestionAssetInput({ dispatch });

    expect(dispatch).toHaveBeenCalledWith({
      type: "inputQuestion/getAllGradeList",
    });
    expect(queryEnabledBusinessQuestionTypesV2).not.toHaveBeenCalled();
    expect(mockQuestionAssetContentPanel).not.toHaveBeenCalled();

    selectTeachingContext();

    expect(await screen.findByText("服务端组合题")).toBeInTheDocument();
    expect(queryEnabledBusinessQuestionTypesV2).toHaveBeenCalledWith({
      stageId: 2,
      subjectId: 2,
    });
    expect(screen.getByText("服务端单选")).toBeInTheDocument();
    expect(mockQuestionAssetContentPanel).toHaveBeenLastCalledWith(
      expect.objectContaining({
        draft: expect.objectContaining({ questionTypeKey: 1 }),
        questionTypeTemplates: expect.arrayContaining([
          expect.objectContaining({ questionTypeKey: 1 }),
        ]),
      }),
    );
  });

  it("does not query types when the selected grade has no stage mapping", async () => {
    renderQuestionAssetInput({
      allGradeList: [{ gradeId: 8, name: "七年级", stageId: 3 }],
    });

    selectTeachingContext();
    await act(async () => undefined);

    expect(queryEnabledBusinessQuestionTypesV2).not.toHaveBeenCalled();
    expect(mockQuestionAssetContentPanel).not.toHaveBeenCalled();
  });

  it("rebuilds the editor draft when switching to another v2 question type", async () => {
    renderQuestionAssetInput();
    selectTeachingContext();

    fireEvent.click(await screen.findByText("服务端单选"));

    await waitFor(() => {
      expect(mockQuestionAssetContentPanel).toHaveBeenLastCalledWith(
        expect.objectContaining({
          draft: expect.objectContaining({ questionTypeKey: 3 }),
          questionTypeTemplates: expect.arrayContaining([
            expect.objectContaining({ questionTypeKey: 3 }),
          ]),
        }),
      );
    });
  });

  it("resets the editor and reloads types after the teaching context changes", async () => {
    renderQuestionAssetInput();
    selectTeachingContext();
    expect(await screen.findByText("服务端单选")).toBeInTheDocument();

    fireEvent.click(screen.getByText("更换年级"));

    expect(mockQuestionAssetContentPanel).toHaveBeenLastCalledWith(
      expect.objectContaining({ draft: expect.any(Object) }),
    );
    expect(
      screen.queryByTestId("question-asset-editor"),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("更换学科"));

    await waitFor(() => {
      expect(queryEnabledBusinessQuestionTypesV2).toHaveBeenLastCalledWith({
        stageId: 3,
        subjectId: 3,
      });
    });
    expect(
      await screen.findByTestId("question-asset-editor"),
    ).toBeInTheDocument();
  });

  it("ignores an outdated question type response after the context changes", async () => {
    const firstRequest = createDeferredResponse();
    const secondRequest = createDeferredResponse();
    queryEnabledBusinessQuestionTypesV2
      .mockImplementationOnce(() => firstRequest.promise)
      .mockImplementationOnce(() => secondRequest.promise);
    renderQuestionAssetInput();

    selectTeachingContext();
    await waitFor(() => {
      expect(queryEnabledBusinessQuestionTypesV2).toHaveBeenCalledTimes(1);
    });
    fireEvent.click(screen.getByText("更换年级"));
    fireEvent.click(screen.getByText("更换学科"));
    await waitFor(() => {
      expect(queryEnabledBusinessQuestionTypesV2).toHaveBeenCalledTimes(2);
    });

    await act(async () => {
      secondRequest.resolve({
        content: [
          { ...QUESTION_ASSET_TYPE_V2_FIXTURES[0], name: "新范围组合题" },
        ],
        ifLogin: true,
        status: true,
      });
    });
    expect(await screen.findByText("新范围组合题")).toBeInTheDocument();

    await act(async () => {
      firstRequest.resolve({
        content: QUESTION_ASSET_TYPE_V2_FIXTURES,
        ifLogin: true,
        status: true,
      });
    });
    expect(screen.queryByText("服务端单选")).not.toBeInTheDocument();
  });

  it("reloads types when returning to a previously loaded context", async () => {
    renderQuestionAssetInput();
    selectTeachingContext();
    expect(await screen.findByText("服务端单选")).toBeInTheDocument();

    fireEvent.click(screen.getByText("更换年级"));
    fireEvent.click(screen.getByText("恢复年级"));
    fireEvent.click(screen.getByText("恢复学科"));

    await waitFor(() => {
      expect(queryEnabledBusinessQuestionTypesV2).toHaveBeenCalledTimes(2);
    });
    expect(queryEnabledBusinessQuestionTypesV2).toHaveBeenLastCalledWith({
      stageId: 2,
      subjectId: 2,
    });
  });

  it("shows an empty state when v2 returns no question types", async () => {
    queryEnabledBusinessQuestionTypesV2.mockResolvedValue({
      content: [],
      ifLogin: true,
      status: true,
    });

    renderQuestionAssetInput();
    selectTeachingContext();

    expect(
      await screen.findByText("暂无可用题型，暂无法保存"),
    ).toBeInTheDocument();
    expect(mockQuestionAssetContentPanel).not.toHaveBeenCalled();
  });

  it("creates a v2 question resource when saving to bank", async () => {
    renderQuestionAssetInput();

    selectTeachingContext();
    await screen.findByText("服务端单选");
    fireEvent.click(screen.getByText("服务端单选"));
    fireEvent.click(screen.getByText("保存到题库"));

    await waitFor(() => {
      expect(createQuestionV2Resource).toHaveBeenCalledWith(
        expect.objectContaining({
          question: expect.objectContaining({
            businessQuestionTypeId: 3,
          }),
          resource: expect.objectContaining({
            gradeId: 7,
            subjectId: 2,
          }),
        }),
      );
    });
    expect(
      createQuestionV2Resource.mock.calls[0][0].question,
    ).not.toHaveProperty("id");
    expect(createQuestionV2Resource.mock.calls[0][0]).not.toHaveProperty(
      "extras",
    );
    expect(createQuestionV2Resource.mock.calls[0][0]).not.toHaveProperty(
      "action",
    );
  });

  it("saves a v2 question resource before adding it to basket", async () => {
    renderQuestionAssetInput();

    selectTeachingContext();
    await screen.findByText("服务端单选");
    fireEvent.click(screen.getByText("保存并加入试题篮"));

    await waitFor(() => {
      expect(createQuestionV2Resource).toHaveBeenCalled();
    });
    expect(bindQuestionV2Basket).toHaveBeenCalledWith({
      gradeId: 7,
      questionId: 341,
      subjectId: 2,
    });
  });

  it("loads and saves resource metadata using the selected grade and subject", async () => {
    const dispatch = jest.fn();

    renderQuestionAssetInput({ dispatch });

    selectTeachingContext();
    await screen.findByText("服务端单选");

    await waitFor(() => {
      expect(dispatch).toHaveBeenCalledWith({
        payload: { gradeId: 7, isSegmentation: true, subjectId: 2 },
        type: "inputQuestion/getChapter",
      });
      expect(dispatch).toHaveBeenCalledWith({
        payload: { gradeId: 7, subjectId: 2 },
        type: "inputQuestion/getTree",
      });
      expect(dispatch).toHaveBeenCalledWith({
        payload: { gradeId: 7, subjectId: 2 },
        type: "inputQuestion/getLabel",
      });
    });

    fireEvent.click(screen.getByText("选择资源属性"));
    fireEvent.click(screen.getByText("保存到题库"));

    await waitFor(() => {
      expect(createQuestionV2Resource).toHaveBeenCalledWith(
        expect.objectContaining({
          resource: {
            chapterIds: [30],
            gradeId: 7,
            indicatorIds: [20],
            knowledgeIds: [10],
            level: 3,
            subjectId: 2,
          },
        }),
      );
    });
  });

  it("loads a v2 question resource and saves edits through update", async () => {
    renderQuestionAssetInput({
      match: { params: { id: "341" } },
    });

    await waitFor(() => {
      expect(queryQuestionV2Resource).toHaveBeenCalledWith("341");
      expect(queryEnabledBusinessQuestionTypesV2).toHaveBeenCalledWith({
        stageId: 2,
        subjectId: 2,
      });
    });
    expect(queryQuestionV2Resource.mock.invocationCallOrder[0]).toBeLessThan(
      queryEnabledBusinessQuestionTypesV2.mock.invocationCallOrder[0],
    );
    fireEvent.click(screen.getByText("保存到题库"));

    await waitFor(() => {
      expect(updateQuestionV2Resource).toHaveBeenCalledWith(
        "341",
        expect.objectContaining({
          question: expect.objectContaining({ businessQuestionTypeId: 3 }),
          resource: {
            chapterIds: [30],
            gradeId: 7,
            knowledgeIds: [10],
            level: 2,
            subjectId: 2,
          },
        }),
      );
    });
    expect(
      updateQuestionV2Resource.mock.calls[0][1].resource,
    ).not.toHaveProperty("stem");
  });

  it("does not query question types when edit detail lacks a complete context", async () => {
    queryQuestionV2Resource.mockResolvedValue({
      content: {
        question: { businessQuestionTypeId: 3 },
        resource: { gradeId: 7 },
      },
      ifLogin: true,
      status: true,
    });

    renderQuestionAssetInput({ match: { params: { id: "341" } } });

    await waitFor(() => {
      expect(queryQuestionV2Resource).toHaveBeenCalledWith("341");
    });
    await act(async () => undefined);
    expect(queryEnabledBusinessQuestionTypesV2).not.toHaveBeenCalled();
    expect(mockQuestionAssetContentPanel).not.toHaveBeenCalled();
  });

  it("does not let late edit detail overwrite a newly selected question", async () => {
    const detailRequest = createDeferredResponse();
    queryQuestionV2Resource
      .mockImplementationOnce(() => detailRequest.promise)
      .mockResolvedValueOnce({
        content: {
          question: { businessQuestionTypeId: 3 },
          resource: { gradeId: 8, subjectId: 3 },
        },
        ifLogin: true,
        status: true,
      });
    const { rerender } = renderQuestionAssetInput({
      match: { params: { id: "341" } },
    });

    rerender(
      createQuestionAssetInputElement({
        match: { params: { id: "342" } },
      }),
    );
    await waitFor(() => {
      expect(queryEnabledBusinessQuestionTypesV2).toHaveBeenCalledWith({
        stageId: 3,
        subjectId: 3,
      });
    });

    await act(async () => {
      detailRequest.resolve({
        content: {
          question: { businessQuestionTypeId: 3 },
          resource: { gradeId: 7, subjectId: 2 },
        },
        ifLogin: true,
        status: true,
      });
    });

    await waitFor(() =>
      expect(queryEnabledBusinessQuestionTypesV2).toHaveBeenCalledTimes(2),
    );
    expect(queryQuestionV2Resource).toHaveBeenCalledWith("342");
    expect(mockQuestionAssetScopePanel.mock.calls.at(-1)[0].disabled).toBe(
      true,
    );
    expect(mockQuestionAssetScopePanel.mock.calls.at(-1)[0].value).toEqual(
      expect.objectContaining({ gradeId: 8, subjectId: 3 }),
    );
    expect(
      await screen.findByTestId("question-asset-editor"),
    ).toBeInTheDocument();
  });

  it("does not surface a late edit initialization error after unmount", async () => {
    const detailRequest = createDeferredResponse();
    queryQuestionV2Resource.mockImplementationOnce(() => detailRequest.promise);
    queryEnabledBusinessQuestionTypesV2.mockRejectedValueOnce(
      new Error("late error"),
    );
    const messageError = jest
      .spyOn(message, "error")
      .mockImplementation(() => undefined);
    const { unmount } = renderQuestionAssetInput({
      match: { params: { id: "341" } },
    });

    unmount();
    await act(async () => {
      detailRequest.resolve({
        content: {
          question: { businessQuestionTypeId: 3 },
          resource: { gradeId: 7, subjectId: 2 },
        },
        ifLogin: true,
        status: true,
      });
    });

    await waitFor(() =>
      expect(queryEnabledBusinessQuestionTypesV2).toHaveBeenCalledTimes(1),
    );
    expect(messageError).not.toHaveBeenCalled();
    messageError.mockRestore();
  });

  it("keeps the question type loading state while edit detail is pending", () => {
    const detailRequest = createDeferredResponse();
    queryQuestionV2Resource.mockImplementationOnce(() => detailRequest.promise);

    const { container } = renderQuestionAssetInput({
      match: { params: { id: "341" } },
    });

    expect(container.querySelector(".ant-spin-spinning")).toBeInTheDocument();
  });
});
