import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import QuestionBottomActions from "./QuestionBottomActions.jsx";

const styles = {
  active: "active",
  bottomBtn: "bottomBtn",
  deletePopover: "deletePopover",
  iconfont: "iconfont",
  isAddedContent: "isAddedContent",
  primary: "primary",
  text: "text",
  viewBottom: "viewBottom",
  viewResolution: "viewResolution",
};

const baseProperties = {
  index: 0,
  item: {
    canEdit: false,
    createUserName: "Ada",
    gradeName: "三年级",
    id: 1,
    isInQuestionBasket: false,
    level: 1,
    questionTypeDisplayName: "Single choice",
  },
  onCancelAdd: jest.fn(),
  onDeleteQuestion: jest.fn(),
  onEditQuestion: jest.fn(),
  onShowTransLate: jest.fn(),
  onToggleAnswerDetails: jest.fn(),
  styles,
};

const renderMarkup = (properties) =>
  renderToStaticMarkup(<QuestionBottomActions {...properties} />);

const getElementChildrenText = (children) => {
  if (Array.isArray(children)) {
    return children.map((child) => getElementChildrenText(child)).join("");
  }

  if (React.isValidElement(children)) {
    return getElementChildrenText(children.props.children);
  }

  return children ? String(children) : "";
};

const findActionByText = (element, text) => {
  if (Array.isArray(element)) {
    return (
      element.flatMap((child) => {
        const foundElement = findActionByText(child, text);

        return foundElement ? [foundElement] : [];
      })[0] || false
    );
  }

  if (!React.isValidElement(element)) {
    return false;
  }

  if (
    typeof element.props.onClick === "function" &&
    getElementChildrenText(element.props.children).trim() === text
  ) {
    return element;
  }

  return (
    React.Children.toArray(element.props.children).flatMap((child) => {
      const foundElement = findActionByText(child, text);

      return foundElement ? [foundElement] : [];
    })[0] || false
  );
};

const renderActionTree = (properties) => QuestionBottomActions(properties);

describe("QuestionBottomActions", () => {
  beforeEach(() => {
    window.globalLange = "en";
    jest.clearAllMocks();
  });

  it("renders the view analysis action and toggles answer details", () => {
    const view = renderMarkup({
      ...baseProperties,
      answerDetailsVisible: false,
    });

    expect(view).toContain("View analysis");

    findActionByText(
      renderActionTree({
        ...baseProperties,
        answerDetailsVisible: false,
      }),
      "View analysis",
    ).props.onClick();
    expect(baseProperties.onToggleAnswerDetails).toHaveBeenCalledTimes(1);
  });

  it("keeps the view analysis label when answer details are visible", () => {
    const view = renderMarkup({
      ...baseProperties,
      answerDetailsVisible: true,
    });

    expect(view).toContain("View analysis");
  });

  it("renders question type name from the preview action view model", () => {
    const view = renderMarkup({
      ...baseProperties,
      answerDetailsVisible: false,
      item: {
        ...baseProperties.item,
        questionTypeDisplayName: "Single choice",
      },
    });

    expect(view).toContain("Single choice");
  });

  it("renders add action when the question is not in the basket", () => {
    const actionTree = renderActionTree({
      ...baseProperties,
      answerDetailsVisible: false,
    });

    expect(findActionByText(actionTree, "Add to basket")).toBeTruthy();
    expect(findActionByText(actionTree, "Cancel Add to basket")).toBeFalsy();
  });

  it("renders remove action when the question is in the basket", () => {
    const onCancelAdd = jest.fn();
    const actionTree = renderActionTree({
      ...baseProperties,
      answerDetailsVisible: false,
      item: { ...baseProperties.item, isInQuestionBasket: true },
      onCancelAdd,
    });
    const removeAction = findActionByText(actionTree, "Cancel Add to basket");

    expect(removeAction).toBeTruthy();
    expect(findActionByText(actionTree, "Add to basket")).toBeFalsy();

    removeAction.props.onClick();
    expect(onCancelAdd).toHaveBeenCalledWith(1, 0);
  });
});
