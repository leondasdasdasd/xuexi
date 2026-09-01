import React from "react";

import { V2QuestionList } from "./index";

const findReactElements = (value, predicate, matches = []) => {
  if (Array.isArray(value)) {
    value.forEach((item) => findReactElements(item, predicate, matches));
    return matches;
  }
  if (!React.isValidElement(value)) return matches;
  if (predicate(value)) matches.push(value);
  React.Children.forEach(value.props.children, (child) =>
    findReactElements(child, predicate, matches),
  );
  return matches;
};

describe("V2QuestionList empty-state navigation", () => {
  it("opens question creation without reusing the page route id", () => {
    const page = new V2QuestionList({
      basketList: [],
      dispatch: jest.fn(),
      history: { push: jest.fn() },
      match: { params: { id: "341" } },
    });
    page.state.IconFont = () => null;

    const inputLinks = findReactElements(
      page.render(),
      (element) =>
        typeof element.props.to === "string" &&
        element.props.to.startsWith("/questionAssetInput"),
    );

    expect(inputLinks).toHaveLength(1);
    expect(inputLinks[0].props.to).toBe("/questionAssetInput");
  });
});
