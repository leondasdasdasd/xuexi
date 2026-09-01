/** @jest-environment node */

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import CandidateAnswerDetailsAction, {
  toggleAnswerDetailsVisibility,
} from "./CandidateAnswerDetailsAction";

jest.mock("../../utils/i18n", () => ({
  trans: (key: string, fallback: string) =>
    key === "twoWayTest.answerDetails" ? "Answers / Attributes" : fallback,
}));

describe("CandidateAnswerDetailsAction", () => {
  it("renders the fixed bilingual action instead of the legacy analysis action", () => {
    const action = CandidateAnswerDetailsAction({
      visible: false,
      onToggle: jest.fn(),
    });
    const view = renderToStaticMarkup(action);

    expect(view).toContain("Answers / Attributes");
    expect(view).not.toContain("查看解析");
    expect(action.props["aria-pressed"]).toBe(false);
  });

  it("calls the toggle handler and marks the visible state as active", () => {
    const onToggle = jest.fn();
    const action = CandidateAnswerDetailsAction({ visible: true, onToggle });

    action.props.onClick();

    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(action.props.className).toContain("answer-details-active");
    expect(action.props["aria-pressed"]).toBe(true);
  });

  it("keeps visibility independent for each stable question ID", () => {
    const firstVisible = toggleAnswerDetailsVisibility({}, 101);
    const bothVisible = toggleAnswerDetailsVisibility(firstVisible, 202);
    const secondOnlyVisible = toggleAnswerDetailsVisibility(bothVisible, 101);

    expect(secondOnlyVisible).toEqual({ 101: false, 202: true });
  });
});
