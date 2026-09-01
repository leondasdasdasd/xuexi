import { render, screen } from "@testing-library/react";
import React from "react";

import type { PaperEditorDraft } from "../types";
import { SortableOutlineContent } from "../components/SortableOutlineContent";

jest.mock("../components/OutlineModuleHeader", () =>
  jest.fn(({ module }: { module: { key: string } }) => (
    <div data-testid={`module-header-${module.key}`} />
  )),
);
jest.mock("../components/OutlineQuestionNumber", () =>
  jest.fn(({ number }: { number: number }) => (
    <button data-testid={`question-number-${number}`} type="button" />
  )),
);

const draft = {
  modules: [
    {
      key: "module-1",
      title: "选择题",
      questions: [{ key: "question-1" }, { key: "question-2" }],
    },
    {
      key: "module-2",
      title: "填空题",
      questions: [{ key: "question-3" }],
    },
  ],
} as PaperEditorDraft;

describe("SortableOutlineContent", () => {
  it("renders every sortable question as a sibling in module order", () => {
    render(
      <SortableOutlineContent
        draft={draft}
        onAddLibraryQuestions={jest.fn()}
        onDeleteModule={jest.fn()}
        onMoveModule={jest.fn()}
        onNavigate={jest.fn()}
        positionByQuestionKey={
          new Map([
            ["question-1", 0],
            ["question-2", 1],
            ["question-3", 2],
          ])
        }
        questionNumberByKey={
          new Map([
            ["question-1", 1],
            ["question-2", 2],
            ["question-3", 3],
          ])
        }
      />,
    );

    const grid = screen.getByTestId("outline-sort-grid");
    expect(
      [...grid.children].map((element) => element.getAttribute("data-testid")),
    ).toEqual([
      "module-header-module-1",
      "question-number-1",
      "question-number-2",
      "module-header-module-2",
      "question-number-3",
    ]);
  });
});
