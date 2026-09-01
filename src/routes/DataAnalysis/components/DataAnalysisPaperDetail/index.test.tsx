import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";

import { loadPaperDetailViewModel } from "../../../PaperEditor/paperDetail";
import DataAnalysisPaperDetail, { PAPER_DETAIL_STATUS } from ".";

jest.mock("../../../PaperEditor/paperDetail", () => ({
  getPaperDetailDisplayError: (error: Error, fallback: string) =>
    error.message || fallback,
  loadPaperDetailViewModel: jest.fn(),
  ReadOnlyPaperDetailContent:
    function MockReadOnlyPaperDetailContent(properties: {
      draft: { title: string };
      onIpadTrial?: () => void;
      onTrial?: () => void;
    }) {
      return (
        <div>
          {properties.draft.title}
          {properties.onTrial ? (
            <button type="button" onClick={properties.onTrial}>
              电脑端试做
            </button>
          ) : null}
          {properties.onIpadTrial ? (
            <button type="button" onClick={properties.onIpadTrial}>
              iPad端试做
            </button>
          ) : null}
        </div>
      );
    },
}));

const loadViewModelMock = loadPaperDetailViewModel as jest.Mock;
const createViewModel = (
  title: string,
  updateAllowed = true,
  updateDisabledReasonCode?: string,
) => ({
  draft: { title },
  grades: [],
  paperTypes: [],
  subjects: [],
  updateAllowed,
  updateDisabledReasonCode,
});

describe("DataAnalysisPaperDetail", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    loadViewModelMock.mockReset();
    Reflect.set(window, "globalLange", "zh-CN");
  });

  it("loads V2 detail and reports denied editing without hiding the paper", async () => {
    loadViewModelMock.mockResolvedValue(
      createViewModel("只读试卷", false, "PAPER_PERMISSION_REQUIRED"),
    );
    const onStatusChange = jest.fn();
    const onTrial = jest.fn();
    const onSourceChange = jest.fn();

    render(
      <DataAnalysisPaperDetail
        onStatusChange={onStatusChange}
        onSourceChange={onSourceChange}
        onTrial={onTrial}
        paperId={99}
        visible
      />,
    );

    expect(screen.getByText("正在加载试卷……")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "电脑端试做" }),
    ).not.toBeInTheDocument();
    expect(await screen.findByText("只读试卷")).toBeInTheDocument();
    expect(loadViewModelMock).toHaveBeenCalledWith(99, "zh-CN");
    expect(onStatusChange).toHaveBeenLastCalledWith(PAPER_DETAIL_STATUS.denied);
    expect(onSourceChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        draft: { title: "只读试卷" },
        updateDisabledReasonCode: "PAPER_PERMISSION_REQUIRED",
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "电脑端试做" }));
    expect(onTrial).toHaveBeenCalledWith(99);
    fireEvent.click(screen.getByRole("button", { name: "iPad端试做" }));
    expect(
      screen.getByRole("img", { name: "在 iPad 上试做本卷" }),
    ).toBeInTheDocument();
  });

  it("renders an empty state for an invalid paper id", async () => {
    const onStatusChange = jest.fn();

    render(
      <DataAnalysisPaperDetail
        onStatusChange={onStatusChange}
        onTrial={jest.fn()}
        paperId={null}
        visible
      />,
    );

    expect(
      screen.getByText("当前测验缺少有效试卷，无法加载详情"),
    ).toBeInTheDocument();
    expect(loadViewModelMock).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(onStatusChange).toHaveBeenLastCalledWith(
        PAPER_DETAIL_STATUS.error,
      ),
    );
  });

  it("shows a retryable error without rendering a legacy fallback", async () => {
    loadViewModelMock
      .mockRejectedValueOnce(new Error("V2 加载失败"))
      .mockResolvedValueOnce(createViewModel("重试成功"));
    const onStatusChange = jest.fn();

    render(
      <DataAnalysisPaperDetail
        onStatusChange={onStatusChange}
        onTrial={jest.fn()}
        paperId={99}
        visible
      />,
    );

    expect(await screen.findByText("V2 加载失败")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "电脑端试做" }),
    ).not.toBeInTheDocument();
    expect(onStatusChange).toHaveBeenLastCalledWith(PAPER_DETAIL_STATUS.error);
    fireEvent.click(screen.getByRole("button", { name: /重\s*试/ }));

    expect(await screen.findByText("重试成功")).toBeInTheDocument();
    expect(loadViewModelMock).toHaveBeenCalledTimes(2);
    expect(onStatusChange).toHaveBeenLastCalledWith(PAPER_DETAIL_STATUS.ready);
  });

  it("clears loaded content and permission before a new paper resolves", async () => {
    let resolveSecond: (value: ReturnType<typeof createViewModel>) => void;
    loadViewModelMock
      .mockResolvedValueOnce(createViewModel("旧试卷"))
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveSecond = resolve;
          }),
      );
    const onStatusChange = jest.fn();
    const { rerender } = render(
      <DataAnalysisPaperDetail
        onStatusChange={onStatusChange}
        onTrial={jest.fn()}
        paperId={1}
        visible
      />,
    );
    expect(await screen.findByText("旧试卷")).toBeInTheDocument();

    rerender(
      <DataAnalysisPaperDetail
        onStatusChange={onStatusChange}
        onTrial={jest.fn()}
        paperId={2}
        visible
      />,
    );

    expect(screen.queryByText("旧试卷")).not.toBeInTheDocument();
    expect(screen.getByText("正在加载试卷……")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "电脑端试做" }),
    ).not.toBeInTheDocument();
    expect(onStatusChange).toHaveBeenLastCalledWith(
      PAPER_DETAIL_STATUS.loading,
    );

    resolveSecond!(createViewModel("新试卷"));
    expect(await screen.findByText("新试卷")).toBeInTheDocument();
  });

  it("does not restore an open iPad trial after leaving the paper preview", async () => {
    loadViewModelMock.mockResolvedValue(createViewModel("试卷"));
    const properties = {
      onStatusChange: jest.fn(),
      onTrial: jest.fn(),
      paperId: 99,
    };
    const { rerender } = render(
      <DataAnalysisPaperDetail {...properties} visible />,
    );
    expect(await screen.findByText("试卷")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "iPad端试做" }));
    expect(
      screen.getByRole("img", { name: "在 iPad 上试做本卷" }),
    ).toBeInTheDocument();

    rerender(<DataAnalysisPaperDetail {...properties} visible={false} />);
    rerender(<DataAnalysisPaperDetail {...properties} visible />);

    expect(
      screen.queryByRole("img", { name: "在 iPad 上试做本卷" }),
    ).not.toBeInTheDocument();
  });

  it("ignores an obsolete paper response after the paper id changes", async () => {
    let resolveFirst: (value: ReturnType<typeof createViewModel>) => void;
    let resolveSecond: (value: ReturnType<typeof createViewModel>) => void;
    loadViewModelMock
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveSecond = resolve;
          }),
      );
    const onStatusChange = jest.fn();
    const { rerender } = render(
      <DataAnalysisPaperDetail
        onStatusChange={onStatusChange}
        onTrial={jest.fn()}
        paperId={1}
        visible
      />,
    );

    rerender(
      <DataAnalysisPaperDetail
        onStatusChange={onStatusChange}
        onTrial={jest.fn()}
        paperId={2}
        visible
      />,
    );
    await waitFor(() => expect(loadViewModelMock).toHaveBeenCalledTimes(2));
    resolveSecond!(createViewModel("新试卷"));
    expect(await screen.findByText("新试卷")).toBeInTheDocument();
    resolveFirst!(createViewModel("旧试卷"));

    await waitFor(() =>
      expect(screen.queryByText("旧试卷")).not.toBeInTheDocument(),
    );
  });
});
