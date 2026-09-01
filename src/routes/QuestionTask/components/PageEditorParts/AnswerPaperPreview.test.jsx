import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import AnswerPaperPreview from "./AnswerPaperPreview";

const noop = (event) => event;

const renderImagePreview = (event) =>
  event ||
  render(
    <AnswerPaperPreview
      answerFileUrl=""
      answerPages={[
        {
          imageUrl: "https://task.daily.yungu-inc.org/api/preview_file?id=1",
          pageKey: "answer-page-1",
          pageNumber: 1,
        },
      ]}
      answerSheetMarkdown=""
      answerTextPages={[]}
      onZoomChange={noop}
      zoomScale={100}
    />,
  );

describe("AnswerPaperPreview", () => {
  beforeEach(() => {
    window.globalLange = "zh-CN";
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("shows answer page badge after the image has loaded", () => {
    jest
      .spyOn(HTMLImageElement.prototype, "complete", "get")
      .mockReturnValue(false);

    renderImagePreview();

    const answerImage = screen.getByRole("img", { name: "解析第 1 页" });

    expect(screen.queryByText("解析第 1 页")).not.toBeInTheDocument();

    fireEvent.load(answerImage);

    expect(screen.getByText("解析第 1 页")).toBeInTheDocument();
  });
});
