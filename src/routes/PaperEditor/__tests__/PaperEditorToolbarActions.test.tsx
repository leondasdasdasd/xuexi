import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

import PaperEditorToolbarActions from "../components/PaperEditorToolbarActions";

const renderToolbar = (
  editAction?: Parameters<typeof PaperEditorToolbarActions>[0]["editAction"],
) =>
  render(
    <PaperEditorToolbarActions
      editAction={editAction}
      editable={false}
      onAddQuestion={jest.fn()}
      onSave={jest.fn()}
      saving={false}
    />,
  );

describe("PaperEditorToolbarActions", () => {
  beforeEach(() => {
    Reflect.set(window, "globalLange", "zh-CN");
  });

  it("adds a question from the editable toolbar", () => {
    const onAddQuestion = jest.fn();
    render(
      <PaperEditorToolbarActions
        editable
        onAddQuestion={onAddQuestion}
        onSave={jest.fn()}
        saving={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "新增题目" }));
    expect(onAddQuestion).toHaveBeenCalledTimes(1);
  });

  it("starts a test when the preview action is available", () => {
    const onInitiateTest = jest.fn();
    render(
      <PaperEditorToolbarActions
        editable={false}
        onAddQuestion={jest.fn()}
        onInitiateTest={onInitiateTest}
        onSave={jest.fn()}
        saving={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "发起测验" }));

    expect(onInitiateTest).toHaveBeenCalledTimes(1);
  });

  it("runs the authorized preview edit action", () => {
    const onEdit = jest.fn();
    renderToolbar({ allowed: true, onEdit });

    fireEvent.click(screen.getByRole("button", { name: "编辑试卷" }));

    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it("disables editing and explains the missing permission", async () => {
    const onEdit = jest.fn();
    renderToolbar({ allowed: false, onEdit });
    const editButton = screen.getByRole("button", { name: "编辑试卷" });

    expect(editButton).toHaveAttribute("aria-disabled", "true");
    expect(editButton.className).toContain("toolbar-disabled-action");
    fireEvent.click(editButton);
    fireEvent.mouseEnter(editButton);

    expect(onEdit).not.toHaveBeenCalled();
    expect(
      await screen.findByText("当前账号无试卷编辑权限，已切换为预览模式"),
    ).toBeInTheDocument();
  });

  it("shows the specific reason supplied by the paper capability", async () => {
    renderToolbar({
      allowed: false,
      disabledReason: "该试卷内容已固化，当前不能直接编辑",
      onEdit: jest.fn(),
    });

    fireEvent.mouseEnter(screen.getByRole("button", { name: "编辑试卷" }));

    expect(
      await screen.findByText("该试卷内容已固化，当前不能直接编辑"),
    ).toBeInTheDocument();
  });

  it("omits the edit action outside preview mode", () => {
    renderToolbar();

    expect(
      screen.queryByRole("button", { name: "发起测验" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "试作" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "编辑试卷" }),
    ).not.toBeInTheDocument();
  });
});
