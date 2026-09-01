import React from "react";
import { render, screen } from "@testing-library/react";

import QuestionAssetTypePanel from "./QuestionAssetTypePanel";

const options = [
  { label: "单选题", value: 1 },
  { label: "多选题", value: 2 },
];

describe("QuestionAssetTypePanel", () => {
  it("keeps the current type highlighted while editing locks the buttons", () => {
    render(
      <QuestionAssetTypePanel
        locked
        onChange={jest.fn()}
        options={options}
        value="2"
      />,
    );

    const selectedButton = screen.getByRole("button", { name: "多选题" });
    const otherButton = screen.getByRole("button", { name: "单选题" });

    expect(selectedButton).toBeDisabled();
    expect(selectedButton).toHaveClass("type-button-disabled-selected");
    expect(selectedButton).toHaveClass("ant-btn-primary");
    expect(otherButton).toBeDisabled();
    expect(otherButton).not.toHaveClass("type-button-disabled-selected");
  });

  it("keeps the native primary interaction styles while selection is enabled", () => {
    render(
      <QuestionAssetTypePanel
        onChange={jest.fn()}
        options={options}
        value={2}
      />,
    );

    const selectedButton = screen.getByRole("button", { name: "多选题" });

    expect(selectedButton).toBeEnabled();
    expect(selectedButton).toHaveClass("ant-btn-primary");
    expect(selectedButton).not.toHaveClass("type-button-disabled-selected");
  });
});
