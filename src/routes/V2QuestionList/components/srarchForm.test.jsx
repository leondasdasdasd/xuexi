import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";

import { SrarchForm } from "./srarchForm.jsx";

jest.mock("antd", () => {
  const Menu = ({ children }) => <div role="menu">{children}</div>;
  Menu.Item = ({ children, disabled, onClick }) => (
    <button disabled={disabled} role="menuitem" type="button" onClick={onClick}>
      {children}
    </button>
  );

  return {
    Dropdown: ({ children, overlay }) => (
      <div>
        {children}
        {overlay}
      </div>
    ),
    Icon: ({ type }) => <span data-icon={type} />,
    Menu,
    message: { error: jest.fn() },
  };
});

jest.mock("../../../services/qustion", () => ({
  questionCreateList: jest.fn(() => new Promise(() => {})),
}));

const baseProperties = {
  createUserId: -1,
  dispatch: jest.fn(),
  editionAndGradeData: { gradeList: [] },
  examType: -1,
  examTypeList: [],
  gradeIds: [],
  levels: [],
  onExamTypeChange: jest.fn(),
  onGradeChange: jest.fn(),
  onQuLevelChange: jest.fn(),
  onQuTypeChange: jest.fn(),
  onUserChange: jest.fn(),
  onYearChange: jest.fn(),
  businessQuestionTypeIds: [],
  questionTypeGradeIds: [],
  tabKey: 1,
  total: 0,
  typeList: [],
};

describe("SrarchForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '<div id="tableWarp"></div>';
  });

  it("renders v2 question type options from parent props", () => {
    const view = renderToStaticMarkup(
      <SrarchForm
        {...baseProperties}
        businessQuestionTypeIds={[3]}
        typeList={[{ code: 3, typeName: "单选题" }]}
      />,
    );

    expect(view).toContain("单选题");
    expect(view).not.toContain("过滤启用");
  });

  it("全部年级下禁用具体题型", () => {
    const disabledView = renderToStaticMarkup(
      <SrarchForm
        {...baseProperties}
        gradeIds={[]}
        typeList={[{ code: 3, typeName: "单选题" }]}
      />,
    );
    const enabledView = renderToStaticMarkup(
      <SrarchForm
        {...baseProperties}
        gradeIds={[25]}
        questionTypeGradeIds={[25]}
        typeList={[{ code: 3, typeName: "单选题" }]}
      />,
    );

    expect(disabledView).toContain('aria-disabled="true"');
    expect(enabledView).not.toContain('aria-disabled="true"');
  });

  it("emits the selected v2 question type option on click", () => {
    const onQuTypeChange = jest.fn();
    const option = { code: 3, typeName: "单选题" };

    render(
      <SrarchForm
        {...baseProperties}
        onQuTypeChange={onQuTypeChange}
        questionTypeGradeIds={[25]}
        typeList={[option]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "单选题" }));

    expect(onQuTypeChange).toHaveBeenCalledWith(option);
  });

  it.each(["Enter", " "])("支持使用 %p 键选择题型", (key) => {
    const onQuTypeChange = jest.fn();
    const option = { code: 3, typeName: "单选题" };

    render(
      <SrarchForm
        {...baseProperties}
        onQuTypeChange={onQuTypeChange}
        questionTypeGradeIds={[25]}
        typeList={[option]}
      />,
    );
    const questionType = screen.getByRole("button", { name: "单选题" });
    const eventWasNotCancelled = fireEvent.keyDown(questionType, { key });

    expect(eventWasNotCancelled).toBe(false);
    expect(onQuTypeChange).toHaveBeenCalledWith(option);
  });

  it("阻止操作全部年级下禁用的具体题型", () => {
    const onQuTypeChange = jest.fn();

    render(
      <SrarchForm
        {...baseProperties}
        onQuTypeChange={onQuTypeChange}
        typeList={[{ code: 3, typeName: "单选题" }]}
      />,
    );
    const questionType = screen.getByRole("button", { name: "单选题" });

    expect(questionType).toHaveAttribute("aria-disabled", "true");
    expect(questionType).toHaveAttribute("tabindex", "-1");
    fireEvent.click(questionType);
    fireEvent.keyDown(questionType, { key: "Enter" });

    expect(onQuTypeChange).not.toHaveBeenCalled();
  });

  it("选择具体题型后禁用全部年级", () => {
    render(
      <SrarchForm
        {...baseProperties}
        businessQuestionTypeIds={[3]}
        editionAndGradeData={{
          gradeList: [{ gradeId: 25, name: "一年级" }],
        }}
        gradeIds={[25]}
        questionTypeGradeIds={[25]}
        tabKey={2}
      />,
    );
    const allGradeOptions = screen
      .getAllByRole("menuitem", { name: "全部" })
      .filter((item) => item.hasAttribute("disabled"));

    expect(allGradeOptions).toHaveLength(1);
  });

  it("does not dispatch the legacy global/getType action on mount", () => {
    const component = new SrarchForm(baseProperties);
    component.getQuestionCreateList = jest.fn();

    component.componentDidMount();

    expect(baseProperties.dispatch).toHaveBeenCalledWith({
      payload: { type: 0 },
      type: "home/getExamType",
    });
    expect(baseProperties.dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: "global/getType" }),
    );
  });
});
