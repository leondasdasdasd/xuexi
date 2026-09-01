import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";

import { PureSingleQuestionNew } from "./index";

const mockEditorSubmit = jest.fn();
const mockState = {
  questionEntryEditorProperties: undefined,
};

jest.mock("../../components/Basket/index", () => {
  return function MockBasket(properties) {
    void properties;
    return false;
  };
});

jest.mock("../../components/QuestionEntryEditor", () => {
  return function MockQuestionEntryEditor(properties) {
    mockState.questionEntryEditorProperties = properties;
    properties.onControllerReady({
      submit: mockEditorSubmit,
    });

    return false;
  };
});

const renderPage = (properties = {}) =>
  render(
    <PureSingleQuestionNew
      basketList={[]}
      count={5}
      dispatch={jest.fn()}
      history={{ go: jest.fn() }}
      match={{ params: { id: "null" } }}
      {...properties}
    />,
  );

describe("SingleQuestionNew page header", () => {
  beforeEach(() => {
    mockEditorSubmit.mockClear();
    mockState.questionEntryEditorProperties = undefined;
    window.location.hash = "";
  });

  it("uses the outer page header and embeds the editor without its header", () => {
    renderPage();

    expect(screen.getByText("新增题目")).toBeInTheDocument();
    expect(mockState.questionEntryEditorProperties.headerMode).toBeUndefined();
    expect(mockState.questionEntryEditorProperties.mode).toBeUndefined();
  });

  it("shows edit copy when editing an existing question", () => {
    renderPage({
      match: { params: { id: "123" } },
      questionItem: { questionId: 123 },
    });

    expect(screen.getByText("编辑题目")).toBeInTheDocument();
  });

  it("submits editor actions from the outer header buttons", () => {
    renderPage();

    fireEvent.click(screen.getByText("保存并加入试题篮"));
    fireEvent.click(screen.getByText("保存到题库"));

    expect(mockEditorSubmit.mock.calls).toEqual([["basket"], ["bank"]]);
  });

  it("keeps grade and subject after saving a new question", async () => {
    const dispatch = jest.fn((action = {}) => {
      if (typeof action.onSuccess === "function") {
        action.onSuccess([123]);
      }
    });

    renderPage({ dispatch });

    await act(async () => {
      await mockState.questionEntryEditorProperties.onSubmit({
        action: "bank",
        payload: {
          gradeId: 7,
          questionList: [],
          subjectId: 2,
        },
      });
    });

    expect(
      mockState.questionEntryEditorProperties.initialContext,
    ).toMatchObject({
      gradeId: 7,
      subjectId: 2,
    });
  });
});
