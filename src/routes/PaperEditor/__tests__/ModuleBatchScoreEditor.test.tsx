import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

import ModuleBatchScoreEditor from "../components/ModuleBatchScoreEditor";

describe("ModuleBatchScoreEditor", () => {
  beforeEach(() => {
    Reflect.set(window, "globalLange", "zh-CN");
  });

  it("defaults to filling missing scores only", () => {
    const onConfirm = jest.fn();
    render(<ModuleBatchScoreEditor onConfirm={onConfirm} />);

    fireEvent.click(screen.getByRole("button", { name: "批量设置分数" }));
    fireEvent.change(screen.getByLabelText("每小题分值"), {
      target: { value: "2.5" },
    });
    fireEvent.click(screen.getByRole("button", { name: /确\s*定/ }));

    expect(onConfirm).toHaveBeenCalledWith(2.5, "missing-only");
  });

  it("requires an explicit selection before overwriting existing scores", () => {
    const onConfirm = jest.fn();
    render(<ModuleBatchScoreEditor onConfirm={onConfirm} />);

    fireEvent.click(screen.getByRole("button", { name: "批量设置分数" }));
    fireEvent.click(screen.getByText("覆盖本块全部分数"));
    fireEvent.change(screen.getByLabelText("每小题分值"), {
      target: { value: "3" },
    });
    fireEvent.click(screen.getByRole("button", { name: /确\s*定/ }));

    expect(onConfirm).toHaveBeenCalledWith(3, "overwrite-all");
  });
});
