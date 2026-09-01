import type { SortEvent } from "react-sortable-hoc";

import {
  QUESTION_SORT_HANDLE_ATTRIBUTE,
  shouldCancelQuestionSortStart,
} from "../outlineQuestionDragStart";

const eventFrom = (target: Element): SortEvent =>
  ({ target }) as unknown as SortEvent;

describe("shouldCancelQuestionSortStart", () => {
  it("allows dragging from the marked question number", () => {
    const button = document.createElement("button");
    button.setAttribute(QUESTION_SORT_HANDLE_ATTRIBUTE, "true");

    expect(shouldCancelQuestionSortStart(eventFrom(button))).toBe(false);
  });

  it("cancels dragging from other interactive content", () => {
    expect(
      shouldCancelQuestionSortStart(
        eventFrom(document.createElement("button")),
      ),
    ).toBe(true);
    expect(
      shouldCancelQuestionSortStart(eventFrom(document.createElement("input"))),
    ).toBe(true);
  });
});
