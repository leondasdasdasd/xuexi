import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

import QuestionAssetMetadataPanel from "./QuestionAssetMetadataPanel.jsx";

describe("QuestionAssetMetadataPanel", () => {
  it("renders resource metadata fields and reports difficulty changes", () => {
    const onChange = jest.fn();

    render(
      <QuestionAssetMetadataPanel
        chapterOptions={[]}
        indicatorOptions={[]}
        knowledgeOptions={[]}
        onChange={onChange}
        value={{ level: 2 }}
      />,
    );

    expect(screen.getByText("难易程度")).toBeVisible();
    expect(screen.getByText("章节")).toBeVisible();
    expect(screen.getByText("知识点")).toBeVisible();
    expect(screen.getByText("素养")).toBeVisible();

    fireEvent.click(screen.getByText("困难"));

    expect(onChange).toHaveBeenCalledWith({ level: 3 });
  });
});
