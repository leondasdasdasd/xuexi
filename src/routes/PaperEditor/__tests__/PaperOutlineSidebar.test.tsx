import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

import PaperOutlineSidebar from "../components/PaperOutlineSidebar";

const draft = {
  title: "七年级练习",
  paperType: 1,
  gradeId: 7,
  gradeName: "七年级",
  subjectId: 2,
  subjectName: "数学",
  modules: [
    {
      key: "module-101-0",
      title: "单选题",
      questions: [
        {
          key: "question-341",
          questionId: 341,
          score: 11,
          content: {
            id: 341,
            questionTypeKey: 101,
            version: "1",
            elements: [],
            extras: [],
            children: [],
          },
          children: [],
        },
      ],
    },
  ],
  questionTypeTemplates: [],
};

describe("PaperOutlineSidebar", () => {
  beforeEach(() => {
    (window as Window & { globalLange?: string }).globalLange = "zh-CN";
  });

  it("shows paper property fields and navigates by question", () => {
    const onNavigate = jest.fn();
    const onAddModule = jest.fn();
    const onIpadTrial = jest.fn();
    const onTrial = jest.fn();
    render(
      <PaperOutlineSidebar
        draft={draft}
        editable
        grades={[
          { gradeId: 7, name: "七年级" },
          { gradeId: 8, name: "八年级" },
        ]}
        locale="zh-CN"
        onAddLibraryQuestions={jest.fn()}
        onAddModule={onAddModule}
        onDeleteModule={jest.fn()}
        onGradeChange={jest.fn()}
        onMoveModule={jest.fn()}
        onMoveQuestion={jest.fn()}
        onNavigate={onNavigate}
        onIpadTrial={onIpadTrial}
        onPaperTypeChange={jest.fn()}
        onSubjectChange={jest.fn()}
        onTrial={onTrial}
        paperTypes={[{ code: 1, typeName: "课堂小测" }]}
        subjects={[
          { subjectId: 2, name: "数学" },
          { subjectId: 3, name: "英语" },
        ]}
      />,
    );

    expect(screen.queryByText("适用范围")).not.toBeInTheDocument();
    expect(screen.getByText("所属年级")).toBeInTheDocument();
    expect(screen.getByText("所属学科")).toBeInTheDocument();
    expect(screen.getByLabelText("年级")).toBeInTheDocument();
    expect(screen.getByLabelText("学科")).toBeInTheDocument();
    expect(screen.getByLabelText("试卷类型")).toBeInTheDocument();
    expect(screen.getByText("拖拽题号排序")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /新增题块/ }));
    expect(onAddModule).toHaveBeenCalledTimes(1);
    expect(screen.getByText("共1题")).toBeInTheDocument();
    expect(screen.getByText("（11分）")).toBeInTheDocument();

    fireEvent.click(screen.getByText("1", { selector: "button" }));

    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(onNavigate).toHaveBeenCalledWith("paper-question-question-341");
    fireEvent.click(screen.getByRole("button", { name: "电脑端试做" }));
    fireEvent.click(screen.getByRole("button", { name: "iPad端试做" }));
    expect(onTrial).toHaveBeenCalledTimes(1);
    expect(onIpadTrial).toHaveBeenCalledTimes(1);
  });

  it("renders the module title as read-only structure text", () => {
    render(
      <PaperOutlineSidebar
        draft={draft}
        editable
        grades={[{ gradeId: 7, name: "七年级" }]}
        locale="zh-CN"
        onAddLibraryQuestions={jest.fn()}
        onAddModule={jest.fn()}
        onDeleteModule={jest.fn()}
        onGradeChange={jest.fn()}
        onMoveModule={jest.fn()}
        onMoveQuestion={jest.fn()}
        onNavigate={jest.fn()}
        onPaperTypeChange={jest.fn()}
        onSubjectChange={jest.fn()}
        paperTypes={[{ code: 1, typeName: "课堂小测" }]}
        subjects={[{ subjectId: 2, name: "数学" }]}
      />,
    );

    expect(screen.getByText("1. 单选题")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "1. 单选题" }),
    ).not.toBeInTheDocument();
  });

  it("renders plain values and navigation without editing controls", () => {
    const onTrial = jest.fn();
    render(
      <PaperOutlineSidebar
        draft={draft}
        editable={false}
        locale="zh-CN"
        onNavigate={jest.fn()}
        onTrial={onTrial}
        paperTypes={[{ code: 1, typeName: "课堂小测" }]}
      />,
    );

    expect(screen.getByText("七年级")).toHaveClass("readonly-scope-value");
    expect(screen.getByText("数学")).toHaveClass("readonly-scope-value");
    expect(screen.getByText("课堂小测")).toHaveClass("readonly-scope-value");
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByText("拖拽题号排序")).not.toBeInTheDocument();
    expect(screen.getByTestId("readonly-outline")).toBeInTheDocument();
    expect(screen.getByText("共1题")).toBeInTheDocument();
    expect(screen.getByText("（11分）")).toBeInTheDocument();
    const trialButton = screen.getByRole("button", { name: "试作" });
    expect(
      screen
        .getByTestId("readonly-outline")
        .compareDocumentPosition(trialButton) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    fireEvent.click(trialButton);
    expect(onTrial).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByRole("button", { name: "iPad端试做" }),
    ).not.toBeInTheDocument();
  });

  it("omits trial when the page has no persisted paper", () => {
    render(
      <PaperOutlineSidebar
        draft={draft}
        editable={false}
        locale="zh-CN"
        onNavigate={jest.fn()}
        paperTypes={[{ code: 1, typeName: "课堂小测" }]}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "试作" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "iPad端试做" }),
    ).not.toBeInTheDocument();
  });
});
