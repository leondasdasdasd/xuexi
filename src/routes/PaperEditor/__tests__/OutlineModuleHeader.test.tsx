import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

import OutlineModuleHeader from "../components/OutlineModuleHeader";

describe("OutlineModuleHeader", () => {
  beforeEach(() => {
    (window as Window & { globalLange?: string }).globalLange = "zh-CN";
  });

  it("opens the library for the module question type", () => {
    const onAddLibraryQuestions = jest.fn();
    render(
      <OutlineModuleHeader
        isFirst
        isLast
        module={{
          key: "module-1",
          title: "选择题",
          questions: [
            {
              children: [],
              content: {
                children: [],
                elements: [],
                extras: [],
                id: 1,
                questionTypeKey: 101,
                version: "1",
              },
              key: "question-1",
              questionId: 1,
            },
          ],
        }}
        moduleIndex={0}
        onAddLibraryQuestions={onAddLibraryQuestions}
        onDeleteModule={jest.fn()}
        onMoveModule={jest.fn()}
      />,
    );

    expect(screen.getByText("1. 选择题")).not.toHaveAttribute("role", "button");
    fireEvent.click(screen.getByLabelText("从题库添加题目"));
    expect(onAddLibraryQuestions).toHaveBeenCalledWith("module-1", 101);
  });

  it("moves a middle module through the compact sort menu", () => {
    const onMoveModule = jest.fn();
    render(
      <OutlineModuleHeader
        isFirst={false}
        isLast={false}
        module={{ key: "module-2", title: "填空题", questions: [] }}
        moduleIndex={1}
        onAddLibraryQuestions={jest.fn()}
        onDeleteModule={jest.fn()}
        onMoveModule={onMoveModule}
      />,
    );

    fireEvent.click(screen.getByLabelText("调整块顺序"));
    fireEvent.click(screen.getByText("上移"));
    expect(onMoveModule).toHaveBeenCalledWith(1, 0);

    fireEvent.click(screen.getByLabelText("调整块顺序"));
    fireEvent.click(screen.getByText("下移"));
    expect(onMoveModule).toHaveBeenCalledWith(1, 2);
  });

  it("disables moving beyond the module boundaries", () => {
    const { rerender } = render(
      <OutlineModuleHeader
        isFirst
        isLast={false}
        module={{ key: "module-1", title: "选择题", questions: [] }}
        moduleIndex={0}
        onAddLibraryQuestions={jest.fn()}
        onDeleteModule={jest.fn()}
        onMoveModule={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByLabelText("调整块顺序"));
    expect(screen.getByText("上移").closest("li")).toHaveClass(
      "ant-dropdown-menu-item-disabled",
    );

    rerender(
      <OutlineModuleHeader
        isFirst={false}
        isLast
        module={{ key: "module-2", title: "填空题", questions: [] }}
        moduleIndex={1}
        onAddLibraryQuestions={jest.fn()}
        onDeleteModule={jest.fn()}
        onMoveModule={jest.fn()}
      />,
    );
    fireEvent.click(screen.getByLabelText("调整块顺序"));
    expect(screen.getByText("下移").closest("li")).toHaveClass(
      "ant-dropdown-menu-item-disabled",
    );
  });

  it("opens the library for empty modules without a preferred type", () => {
    const onAddLibraryQuestions = jest.fn();
    const onDeleteModule = jest.fn();
    render(
      <OutlineModuleHeader
        isFirst
        isLast
        module={{ key: "module-empty", title: "", questions: [] }}
        moduleIndex={0}
        onAddLibraryQuestions={onAddLibraryQuestions}
        onDeleteModule={onDeleteModule}
        onMoveModule={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByLabelText("从题库添加题目"));
    expect(onAddLibraryQuestions).toHaveBeenCalledWith(
      "module-empty",
      undefined,
    );
    fireEvent.click(screen.getByLabelText("删除题块"));
    expect(onDeleteModule).toHaveBeenCalledWith("module-empty");
  });

  it("confirms before deleting a non-empty module", () => {
    const onDeleteModule = jest.fn();
    render(
      <OutlineModuleHeader
        isFirst
        isLast
        module={{
          key: "module-1",
          title: "选择题",
          questions: [
            {
              children: [],
              content: null,
              key: "question-1",
              questionId: 1,
            },
          ],
        }}
        moduleIndex={0}
        onAddLibraryQuestions={jest.fn()}
        onDeleteModule={onDeleteModule}
        onMoveModule={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByLabelText("删除题块"));
    expect(onDeleteModule).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /^确\s*定$/ }));
    expect(onDeleteModule).toHaveBeenCalledWith("module-1");
  });
});
