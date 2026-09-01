import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import PageEditor from "./PageEditor";

const MAX_ZOOM_IN_CLICK_COUNT = 8;

jest.mock("../../../components/PaperAiParsingPolygonEditor", () => ({
  PaperAiParsingPolygonEditorCanvas: ({ renderStage }) =>
    renderStage({
      containerProps: {},
      imageNode: <img alt="polygon-editor" src="paper.png" />,
      overlayNode: <svg />,
    }),
  POLYGON_EDITOR_EVENT: {
    POLYGON_SELECT: "POLYGON_SELECT",
  },
  usePolygonEditorController: (options) => {
    void options;

    return {
      actions: {
        clearSelection: jest.fn(),
        selectAnnotation: jest.fn(),
      },
      state: {
        annotations: [],
        selectedAnnotationId: undefined,
      },
    };
  },
}));

const renderPageEditor = (options = {}) => {
  void options;

  return render(
    <PageEditor
      onApplyReferenceEdits={jest.fn()}
      onQuestionSelect={jest.fn()}
      pages={[
        {
          imageUrl: "paper.png",
          pageKey: "page-1",
          pageNumber: 1,
          questions: [],
        },
      ]}
      questions={[]}
    />,
  );
};

const clickButtonTimes = (button, total) =>
  total <= 0
    ? 0
    : clickButtonTimes(button, total - 1) + Number(!!fireEvent.click(button));

describe("PageEditor zoom controls", () => {
  beforeEach(() => {
    window.globalLange = "zh-CN";
  });

  it("keeps enlarging the paper preview beyond 100% until the max zoom", () => {
    renderPageEditor();
    const zoomInButton = screen.getByRole("button", { name: "放大原图" });

    clickButtonTimes(zoomInButton, MAX_ZOOM_IN_CLICK_COUNT);

    expect(screen.getByText("180%")).toBeVisible();
    expect(zoomInButton).toBeDisabled();
    expect(screen.getByTestId("question-page-preview")).toHaveStyle({
      alignSelf: "flex-start",
      width: "180%",
    });
  });
});
