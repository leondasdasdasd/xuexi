import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import PaperCard from "./index";

jest.mock("../HoverTooltip", () => {
  const MockHoverTooltip = (properties) => <span>{properties.text}</span>;
  MockHoverTooltip.displayName = "MockHoverTooltip";
  return MockHoverTooltip;
});

jest.mock("../PaperActions", () => {
  const MockPaperActions = (properties) => (
    <>
      <button onClick={properties.onPreview} type="button">
        预览
      </button>
      <button onClick={properties.onEdit} type="button">
        编辑
      </button>
    </>
  );
  MockPaperActions.displayName = "MockPaperActions";
  return MockPaperActions;
});

const createItem = (overrides = {}) => ({
  createDate: "2026-05-26",
  createUserName: "乐乐",
  examTypeCode: 4,
  examTypeName: "月考",
  gradeName: "八年级",
  id: 11_264,
  largeQuestionNumbers: 1,
  smallQuestionNumbers: 5,
  subjectId: 14,
  subjectName: "数学",
  title: "2025-S2八年级数学",
  totalScore: 5,
  ...overrides,
});

describe("PaperCard edit action", () => {
  beforeEach(() => {
    window.globalLange = "zh-CN";
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  [
    ["isEdit=true", true],
    ["isEdit=false", false],
    ["isEdit omitted", "omitted"],
  ].map(([_label, isEdit]) => {
    const itemOverrides = isEdit === "omitted" ? {} : { isEdit };
    it(`always opens the edit config modal when ${_label}`, () => {
      const onEditConfig = jest.fn();
      render(
        <PaperCard
          item={createItem(itemOverrides)}
          onCancelDeletion={jest.fn()}
          onDelete={jest.fn()}
          onEditConfig={onEditConfig}
          onInitiateTest={jest.fn()}
          onOpenDownloadHistory={jest.fn()}
          onPreviewDetail={jest.fn()}
          onPreviewPdf={jest.fn()}
          onRefresh={jest.fn()}
          onResetToFirstPageAndRefresh={jest.fn()}
          onShowDeleteConfirm={jest.fn()}
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: "编辑" }));

      expect(onEditConfig).toHaveBeenCalledWith(11_264);
    });
  });

  [
    ["aiRecognition=0", 0],
    ["aiRecognition=1", 1],
    ["aiRecognition=2", 2],
    ["aiRecognition=3", 3],
    ["aiRecognition=4", 4],
    ["aiRecognition omitted", "omitted"],
  ].map(([_label, aiRecognition]) => {
    const itemOverrides = {
      paperUploadFileId: 9_834_889,
      ...(aiRecognition === "omitted" ? {} : { aiRecognition }),
    };
    it(`keeps the edit action on the edit config modal for ${_label}`, () => {
      const onEditConfig = jest.fn();
      render(
        <PaperCard
          item={createItem(itemOverrides)}
          onCancelDeletion={jest.fn()}
          onDelete={jest.fn()}
          onEditConfig={onEditConfig}
          onInitiateTest={jest.fn()}
          onOpenDownloadHistory={jest.fn()}
          onPreviewDetail={jest.fn()}
          onPreviewPdf={jest.fn()}
          onRefresh={jest.fn()}
          onResetToFirstPageAndRefresh={jest.fn()}
          onShowDeleteConfirm={jest.fn()}
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: "编辑" }));

      expect(onEditConfig).toHaveBeenCalledWith(11_264);
    });
  });

  it("opens the detail preview from the preview action", () => {
    const onPreviewDetail = jest.fn();
    const onPreviewPdf = jest.fn();
    render(
      <PaperCard
        item={createItem({ paperUploadFileId: 9_834_889 })}
        onCancelDeletion={jest.fn()}
        onDelete={jest.fn()}
        onEditConfig={jest.fn()}
        onInitiateTest={jest.fn()}
        onOpenDownloadHistory={jest.fn()}
        onPreviewDetail={onPreviewDetail}
        onPreviewPdf={onPreviewPdf}
        onRefresh={jest.fn()}
        onResetToFirstPageAndRefresh={jest.fn()}
        onShowDeleteConfirm={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "预览" }));

    expect(onPreviewDetail).toHaveBeenCalledWith(
      expect.objectContaining({ id: 11_264 }),
    );
    expect(onPreviewPdf).not.toHaveBeenCalled();
  });

  it("opens the original paper preview from the card body when a source file exists", () => {
    const onPreviewPdf = jest.fn();
    render(
      <PaperCard
        item={createItem({ paperUploadFileId: 9_834_889 })}
        onCancelDeletion={jest.fn()}
        onDelete={jest.fn()}
        onEditConfig={jest.fn()}
        onInitiateTest={jest.fn()}
        onOpenDownloadHistory={jest.fn()}
        onPreviewDetail={jest.fn()}
        onPreviewPdf={onPreviewPdf}
        onRefresh={jest.fn()}
        onResetToFirstPageAndRefresh={jest.fn()}
        onShowDeleteConfirm={jest.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /月考.*2025-s2八年级数学/i }),
    );

    expect(onPreviewPdf).toHaveBeenCalledWith(
      expect.objectContaining({ id: 11_264 }),
    );
  });

  it("keeps the card body non-interactive when no source file exists", () => {
    const onPreviewPdf = jest.fn();
    render(
      <PaperCard
        item={createItem()}
        onCancelDeletion={jest.fn()}
        onDelete={jest.fn()}
        onEditConfig={jest.fn()}
        onInitiateTest={jest.fn()}
        onOpenDownloadHistory={jest.fn()}
        onPreviewDetail={jest.fn()}
        onPreviewPdf={onPreviewPdf}
        onRefresh={jest.fn()}
        onResetToFirstPageAndRefresh={jest.fn()}
        onShowDeleteConfirm={jest.fn()}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /月考.*2025-s2八年级数学/i }),
    ).toBeNull();
    expect(onPreviewPdf).not.toHaveBeenCalled();
  });
});
