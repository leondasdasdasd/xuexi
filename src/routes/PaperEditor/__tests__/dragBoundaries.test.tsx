import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import type { SortEvent, SortEventWithTag } from "react-sortable-hoc";

import type { PaperEditorDraft } from "../types";
import { shouldCancelQuestionSortStart } from "../outlineQuestionDragStart";
import OutlineQuestionSortBoundary from "../components/OutlineQuestionSortBoundary";

jest.mock(
  "../components/SortableOutlineContent",
  () =>
    function MockSortableOutlineContent(properties: {
      onNavigate: (elementId: string) => void;
      onSortEnd: (sort: { newIndex: number; oldIndex: number }) => void;
      onSortStart: () => void;
      shouldCancelStart: (event: SortEvent | SortEventWithTag) => boolean;
    }) {
      return (
        <div>
          <button
            data-testid="sort-questions"
            onClick={() => {
              properties.onSortStart();
              properties.onSortEnd({ newIndex: 1, oldIndex: 0 });
            }}
            type="button"
          />
          <span data-testid="cancel-start-prop">
            {String(
              properties.shouldCancelStart === shouldCancelQuestionSortStart,
            )}
          </span>
          <button
            data-testid="start-sort"
            onClick={properties.onSortStart}
            type="button"
          />
          <button
            data-testid="end-sort"
            onClick={() => properties.onSortEnd({ newIndex: 1, oldIndex: 0 })}
            type="button"
          />
          <button
            data-testid="navigate"
            onClick={() => properties.onNavigate("paper-question-question-1")}
            type="button"
          />
        </div>
      );
    },
);

const content = {
  id: 1,
  questionTypeKey: 101,
  version: "1",
  elements: [],
  extras: [],
  children: [],
};

const draft: PaperEditorDraft = {
  title: "",
  gradeId: 7,
  gradeName: "七年级",
  subjectId: 2,
  subjectName: "数学",
  modules: [
    {
      key: "module-1",
      title: "选择题",
      questions: [
        {
          key: "question-1",
          questionId: 1,
          content,
          children: [],
        },
      ],
    },
    {
      key: "module-2",
      title: "解答题",
      questions: [
        {
          key: "question-2",
          questionId: 2,
          content,
          children: [],
        },
      ],
    },
  ],
  questionTypeTemplates: [],
};

describe("paper editor drag boundaries", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("normalizes a cross-module sort event to one domain command", () => {
    const onMoveQuestion = jest.fn();
    render(
      <OutlineQuestionSortBoundary
        draft={draft}
        onAddLibraryQuestions={jest.fn()}
        onDeleteModule={jest.fn()}
        onMoveModule={jest.fn()}
        onMoveQuestion={onMoveQuestion}
        onNavigate={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId("sort-questions"));

    expect(onMoveQuestion).toHaveBeenCalledWith({
      sourceModuleKey: "module-1",
      sourceQuestionIndex: 0,
      targetModuleKey: "module-2",
      targetQuestionIndex: 1,
    });
    expect(screen.getByTestId("cancel-start-prop")).toHaveTextContent("true");
  });

  it("suppresses drag navigation until the next event loop and clears timers", () => {
    jest.useFakeTimers();
    const onNavigate = jest.fn();
    const { unmount } = render(
      <OutlineQuestionSortBoundary
        draft={draft}
        onAddLibraryQuestions={jest.fn()}
        onDeleteModule={jest.fn()}
        onMoveModule={jest.fn()}
        onMoveQuestion={jest.fn()}
        onNavigate={onNavigate}
      />,
    );

    fireEvent.click(screen.getByTestId("start-sort"));
    fireEvent.click(screen.getByTestId("navigate"));
    fireEvent.click(screen.getByTestId("end-sort"));
    fireEvent.click(screen.getByTestId("navigate"));
    expect(onNavigate).not.toHaveBeenCalled();

    jest.runOnlyPendingTimers();
    fireEvent.click(screen.getByTestId("navigate"));
    expect(onNavigate).toHaveBeenCalledWith("paper-question-question-1");

    fireEvent.click(screen.getByTestId("start-sort"));
    fireEvent.click(screen.getByTestId("end-sort"));
    expect(jest.getTimerCount()).toBe(1);
    unmount();
    expect(jest.getTimerCount()).toBe(0);
  });
});
