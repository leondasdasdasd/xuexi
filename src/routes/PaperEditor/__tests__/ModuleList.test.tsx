import { render } from "@testing-library/react";
import React from "react";

import ModuleList from "../components/ModuleList";
import PaperModuleCard from "../components/PaperModuleCard";

jest.mock("../components/PaperModuleCard", () => jest.fn(() => null));

describe("ModuleList", () => {
  it("passes continuous whole-paper question numbers to every module", () => {
    const draft = {
      modules: [
        {
          key: "module-1",
          questions: [{ key: "question-1" }, { key: "question-2" }],
        },
        { key: "module-2", questions: [{ key: "question-3" }] },
      ],
      questionTypeTemplates: [],
    };

    render(
      <ModuleList
        draft={draft as never}
        editable
        locale="zh-CN"
        onBatchScore={jest.fn()}
        onDeleteQuestion={jest.fn()}
        onEditQuestion={jest.fn()}
        onScoreChange={jest.fn()}
        onTitleChange={jest.fn()}
      />,
    );

    const firstNumbers = (PaperModuleCard as jest.Mock).mock.calls[0][0]
      .questionNumberByKey;
    const secondNumbers = (PaperModuleCard as jest.Mock).mock.calls[1][0]
      .questionNumberByKey;
    expect([...firstNumbers.entries()]).toEqual([
      ["question-1", 1],
      ["question-2", 2],
      ["question-3", 3],
    ]);
    expect(secondNumbers).toBe(firstNumbers);
  });
});
