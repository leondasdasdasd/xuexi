import { render, screen } from "@testing-library/react";
import React from "react";

import OutlineModuleSummary from "./OutlineModuleSummary";

describe("OutlineModuleSummary", () => {
  beforeEach(() => {
    (window as Window & { globalLange?: string }).globalLange = "zh-CN";
  });

  it("shows the leaf score total and top-level question count", () => {
    render(
      <OutlineModuleSummary
        module={{
          key: "module-compound",
          title: "组合题",
          questions: [
            {
              children: [
                {
                  children: [],
                  content: null,
                  key: "question-child-1",
                  questionId: 2,
                  score: 1.2,
                },
                {
                  children: [],
                  content: null,
                  key: "question-child-2",
                  questionId: 3,
                  score: 2.3,
                },
              ],
              content: null,
              key: "question-parent",
              questionId: 1,
            },
          ],
        }}
      />,
    );

    expect(screen.getByText("共1题")).toBeInTheDocument();
    expect(screen.getByText("（3.5分）")).toBeInTheDocument();
  });

  it("shows zero totals for an empty module", () => {
    render(
      <OutlineModuleSummary
        module={{ key: "module-empty", title: "填空题", questions: [] }}
      />,
    );

    expect(screen.getByText("共0题")).toBeInTheDocument();
    expect(screen.getByText("（0分）")).toBeInTheDocument();
  });
});
