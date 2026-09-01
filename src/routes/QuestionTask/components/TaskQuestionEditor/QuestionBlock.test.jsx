import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";

import QuestionBlock from "./QuestionBlock";
import {
  QUESTION_TYPE_CHOICE,
  QUESTION_TYPE_COMBINATION,
} from "./questionEditorModel";

jest.mock("./EditorFields", () => {
  const { createElement } = jest.requireActual("react");
  const PropertyTypes = jest.requireActual("prop-types");

  const MockFieldLabel = ({ extra, required, title }) =>
    createElement(
      "div",
      {},
      createElement(
        "span",
        {},
        title,
        required ? createElement("em", {}, "*") : undefined,
      ),
      extra ? createElement("small", {}, extra) : undefined,
    );
  MockFieldLabel.propTypes = {
    extra: PropertyTypes.string,
    required: PropertyTypes.bool,
    title: PropertyTypes.string.isRequired,
  };

  const MockMetaEditor = (properties) => {
    void properties;
    return createElement("div", {}, "难易程度");
  };

  const MockQuestionTypeSelect = (properties) => {
    void properties;
    return createElement("select", { "aria-label": "题型" });
  };

  const MockRichTextField = ({ fieldId, onChange, placeholder, value }) =>
    createElement("textarea", {
      "aria-label": fieldId,
      onChange: (event) => onChange(event.target.value),
      placeholder,
      value: value || "",
    });
  MockRichTextField.propTypes = {
    fieldId: PropertyTypes.string.isRequired,
    onChange: PropertyTypes.func.isRequired,
    placeholder: PropertyTypes.string,
    value: PropertyTypes.string,
  };

  return {
    FieldLabel: MockFieldLabel,
    MetaEditor: MockMetaEditor,
    QuestionTypeSelect: MockQuestionTypeSelect,
    RichTextField: MockRichTextField,
  };
});

const ANALYSIS_FIELD_ID = "question-1-analysis";
const MOVE_SUB_QUESTION_DOWN_LABEL = "下移小题";
const MOVE_SUB_QUESTION_UP_LABEL = "上移小题";

const createChoiceQuestion = (patch = {}) => ({
  answer: "A",
  analysis: "",
  content: "<p>题干</p>",
  editorId: "question-1",
  optionList: [
    { answers: "<p>选项 A</p>", editorId: "option-a", key: "A" },
    { answers: "<p>选项 B</p>", editorId: "option-b", key: "B" },
  ],
  questionLevel: 2,
  questionScore: "4",
  type: QUESTION_TYPE_CHOICE,
  ...patch,
});

const createCombinationQuestion = (patch = {}) => ({
  analysis: "",
  content: "<p>组合题</p>",
  editorId: "combination-1",
  questionScore: "8",
  sonQuestionList: [
    createChoiceQuestion({
      content: "<p>子题一</p>",
      editorId: "child-1",
    }),
    createChoiceQuestion({
      content: "<p>子题二</p>",
      editorId: "child-2",
    }),
  ],
  type: QUESTION_TYPE_COMBINATION,
  ...patch,
});

const renderQuestionBlock = (question, properties = {}) =>
  render(
    <QuestionBlock
      chapterTreeData={[]}
      indicatorTreeData={[]}
      knowledgeTreeData={[]}
      onEditorActive={jest.fn()}
      onQuestionRemove={jest.fn()}
      onQuestionUpdate={jest.fn()}
      path={[]}
      popupContainer={(element) => {
        void element;
        return document.body;
      }}
      question={question}
      {...properties}
    />,
  );

describe("QuestionBlock analysis editor", () => {
  beforeEach(() => {
    window.globalLange = "zh-CN";
  });

  it("keeps an empty analysis editor visible without optional or collapse controls", () => {
    renderQuestionBlock(createChoiceQuestion());

    expect(screen.getByText("答案解析")).toBeVisible();
    expect(screen.getByLabelText(ANALYSIS_FIELD_ID)).toBeVisible();
    expect(screen.queryByText("非必填项")).not.toBeInTheDocument();
    expect(screen.queryByText("添加解析")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "收起解析" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "展开解析" }),
    ).not.toBeInTheDocument();
  });

  it("keeps an existing analysis visible for review and editing", () => {
    renderQuestionBlock(createChoiceQuestion({ analysis: "<p>已有解析</p>" }));

    expect(screen.getByLabelText(ANALYSIS_FIELD_ID)).toHaveValue(
      "<p>已有解析</p>",
    );
    expect(
      screen.queryByRole("button", { name: "收起解析" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("添加解析")).not.toBeInTheDocument();
  });

  it("keeps shared rich text placeholders on stem options and analysis", () => {
    renderQuestionBlock(
      createChoiceQuestion({
        analysis: "",
        content: "",
        optionList: [
          { answers: "", editorId: "option-a", key: "A" },
          { answers: "", editorId: "option-b", key: "B" },
        ],
      }),
    );

    expect(screen.getByPlaceholderText("请输入题目")).toBeVisible();
    expect(screen.getAllByPlaceholderText("请输入选项内容")).toHaveLength(2);
    expect(screen.getByPlaceholderText("这里预留解析编辑空间")).toBeVisible();
  });

  it("keeps child question title and type in the same header row", () => {
    renderQuestionBlock(createChoiceQuestion(), {
      isChild: true,
      path: [0],
    });

    const heading = screen.getByTestId("child-question-editor-heading");

    expect(heading).toHaveTextContent("子题 1");
    expect(heading).toHaveTextContent("单选题");
    expect(within(heading).getByText("子题 1")).toBeVisible();
    expect(within(heading).getByText("单选题")).toBeVisible();
  });

  it("moves child questions inside a combination question", () => {
    const handleQuestionUpdate = jest.fn();
    renderQuestionBlock(createCombinationQuestion(), {
      onQuestionUpdate: handleQuestionUpdate,
    });

    expect(
      screen.getAllByRole("button", { name: MOVE_SUB_QUESTION_UP_LABEL })[0],
    ).toBeDisabled();
    expect(
      screen.getAllByRole("button", { name: MOVE_SUB_QUESTION_DOWN_LABEL })[1],
    ).toBeDisabled();

    fireEvent.click(
      screen.getAllByRole("button", {
        name: MOVE_SUB_QUESTION_DOWN_LABEL,
      })[0],
    );

    expect(handleQuestionUpdate).toHaveBeenCalledWith([], expect.any(Function));

    const updater = handleQuestionUpdate.mock.calls[0][1];
    const nextQuestion = updater(createCombinationQuestion());

    expect(
      nextQuestion.sonQuestionList.map((question) => question.editorId),
    ).toEqual(["child-2", "child-1"]);
  });
});
