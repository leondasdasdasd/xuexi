import React from "react";
import { render, screen, waitFor } from "@testing-library/react";

const mockRichTextFieldTestId = "mock-rich-text-field";

jest.mock("../SlateRichEditor", () => {
  const React = jest.requireActual("react");
  const PropertyTypes = jest.requireActual("prop-types");
  const MockSlateRichEditor = ({ placeholder }) =>
    React.createElement("div", {
      "data-placeholder": placeholder,
      "data-testid": mockRichTextFieldTestId,
    });
  const MockToolbarItem = ({ children }) =>
    React.createElement("span", undefined, children);
  const MockToolbarRoot = ({ children }) =>
    React.createElement("div", undefined, children);

  MockSlateRichEditor.propTypes = {
    placeholder: PropertyTypes.string,
  };
  MockToolbarItem.propTypes = {
    children: PropertyTypes.node,
  };
  MockToolbarRoot.propTypes = {
    children: PropertyTypes.node,
  };

  return {
    __esModule: true,
    default: MockSlateRichEditor,
    htmlToSlate: (html) => {
      void html;
      return [{ children: [{ text: "" }], type: "paragraph" }];
    },
    slateToHtml: (value) => {
      void value;
      return "<p>题干</p>";
    },
    Toolbar: {
      AlignCenter: MockToolbarItem,
      AlignLeft: MockToolbarItem,
      AlignRight: MockToolbarItem,
      Bold: MockToolbarItem,
      Color: MockToolbarItem,
      FontSize: MockToolbarItem,
      Formula: MockToolbarItem,
      Image: MockToolbarItem,
      Italic: MockToolbarItem,
      OrderedList: MockToolbarItem,
      Redo: MockToolbarItem,
      Root: MockToolbarRoot,
      Strike: MockToolbarItem,
      Table: MockToolbarItem,
      Underline: MockToolbarItem,
      Undo: MockToolbarItem,
      UnorderedList: MockToolbarItem,
    },
  };
});

import { PureQuestionEntryEditor } from "./index";

const getRequiredProperties = (properties = {}) => ({
  allGradeList: [{ gradeId: 7, name: "七年级" }],
  chapterList: [],
  dispatch: jest.fn(),
  initialQuestion: {
    answer: "A",
    content: "<p>题干</p>",
    gradeId: 7,
    optionList: [
      { answers: "<p>A</p>", key: "A" },
      { answers: "<p>B</p>", key: "B" },
    ],
    subjectId: 2,
    type: 1,
  },
  labelList: [],
  onSubmit: jest.fn(),
  subjectList: [{ id: 2, name: "数学" }],
  treeData: [],
  ...properties,
});

describe("QuestionEntryEditor controller", () => {
  it("does not render container header actions", () => {
    render(<PureQuestionEntryEditor {...getRequiredProperties()} />);

    expect(screen.queryByText("编辑题目")).not.toBeInTheDocument();
    expect(screen.queryByText("新增题目")).not.toBeInTheDocument();
    expect(screen.queryByText("保存到题库")).not.toBeInTheDocument();
    expect(screen.getByText("题干描述")).toBeInTheDocument();
  });

  it("renders unified rich text fields for stem, options, and analysis", () => {
    render(<PureQuestionEntryEditor {...getRequiredProperties()} />);

    const placeholders = screen
      .getAllByTestId(mockRichTextFieldTestId)
      .map((field) => field.dataset.placeholder);

    expect(placeholders).toContain("请输入题目");
    expect(placeholders).toContain("这里预留解析编辑空间");
    expect(
      placeholders.filter((placeholder) => placeholder === "请输入选项内容"),
    ).toHaveLength(2);
  });

  it("renders option display keys with trailing dots for choice questions", () => {
    render(<PureQuestionEntryEditor {...getRequiredProperties()} />);

    expect(screen.getByText("A.")).toBeInTheDocument();
    expect(screen.getByText("B.")).toBeInTheDocument();
  });

  it("preserves option answer prefixes from initial question data", async () => {
    const onSubmit = jest.fn();
    const onControllerReady = jest.fn();

    render(
      <PureQuestionEntryEditor
        {...getRequiredProperties({
          initialQuestion: {
            answer: "A",
            content: "<p>题干</p>",
            gradeId: 7,
            optionList: [
              { answers: "A.<p>甲</p>", key: "A" },
              { answers: "<p>乙</p>", key: "B" },
            ],
            subjectId: 2,
            type: 1,
          },
          onControllerReady,
          onSubmit,
        })}
      />,
    );

    await waitFor(() => expect(onControllerReady).toHaveBeenCalled());
    const controller = onControllerReady.mock.calls[0][0];
    controller.submit("local");

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        draft: expect.objectContaining({
          optionList: expect.arrayContaining([
            expect.objectContaining({ answers: "A.<p>甲</p>", key: "A" }),
          ]),
        }),
      }),
    );
  });

  it("renders the answer rich text field for answer questions", () => {
    render(
      <PureQuestionEntryEditor
        {...getRequiredProperties({
          initialQuestion: {
            answer: "<p>参考答案</p>",
            content: "<p>题干</p>",
            gradeId: 7,
            subjectId: 2,
            type: 5,
          },
        })}
      />,
    );

    const placeholders = screen
      .getAllByTestId(mockRichTextFieldTestId)
      .map((field) => field.dataset.placeholder);

    expect(placeholders).toEqual(
      expect.arrayContaining([
        "请输入题目",
        "请输入参考答案",
        "这里预留解析编辑空间",
      ]),
    );
  });

  it("exposes submit through the page controller", async () => {
    const onSubmit = jest.fn();
    const onControllerReady = jest.fn();

    render(
      <PureQuestionEntryEditor
        {...getRequiredProperties({
          onControllerReady,
          onSubmit,
        })}
      />,
    );

    await waitFor(() => expect(onControllerReady).toHaveBeenCalled());
    const controller = onControllerReady.mock.calls[0][0];
    controller.submit("bank");

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "bank",
        draft: expect.objectContaining({ content: "<p>题干</p>" }),
        payload: expect.objectContaining({ gradeId: 7, subjectId: 2 }),
      }),
    );
  });

  it("supports local save through the same controller", async () => {
    const onSubmit = jest.fn();
    const onControllerReady = jest.fn();

    render(
      <PureQuestionEntryEditor
        {...getRequiredProperties({
          onControllerReady,
          onSubmit,
        })}
      />,
    );

    await waitFor(() => expect(onControllerReady).toHaveBeenCalled());
    const controller = onControllerReady.mock.calls[0][0];
    controller.submit("local");

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "local",
        draft: expect.objectContaining({ content: "<p>题干</p>" }),
      }),
    );
  });
});
