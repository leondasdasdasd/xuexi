import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

import ReadOnlyPaperDetailContent from "../components/ReadOnlyPaperDetailContent";
import type { PaperEditorDraft } from "../types";

jest.mock(
  "../components/PaperModuleCard",
  () =>
    function MockPaperModuleCard(properties: { editable: boolean }) {
      return (
        <div>{properties.editable ? "editable" : "readonly questions"}</div>
      );
    },
);
jest.mock(
  "../components/PaperOutlineSidebar",
  () =>
    function MockPaperOutlineSidebar(properties: {
      editable: boolean;
      onTrial?: () => void;
    }) {
      return (
        <aside>
          {properties.editable ? "editable outline" : "readonly outline"}
          {properties.onTrial ? (
            <button type="button" onClick={properties.onTrial}>
              试作
            </button>
          ) : null}
        </aside>
      );
    },
);

const draft: PaperEditorDraft = {
  modules: [{ key: "module-1", questions: [], title: "选择题" }],
  questionTypeTemplates: [],
  subjectId: 2,
  subjectName: "数学",
  title: "V2 试卷",
};

describe("ReadOnlyPaperDetailContent", () => {
  it("renders the shared paper body without standalone editor controls", () => {
    const onTrial = jest.fn();
    render(
      <ReadOnlyPaperDetailContent
        draft={draft}
        locale="zh-CN"
        onTrial={onTrial}
        paperTypes={[]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "V2 试卷" }),
    ).toBeInTheDocument();
    expect(screen.getByText("readonly questions")).toBeInTheDocument();
    expect(screen.getByText("readonly outline")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "试作" }));
    expect(onTrial).toHaveBeenCalledTimes(1);
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(
      screen.queryByRole("button", { name: "预览试卷" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "编辑试卷" }),
    ).not.toBeInTheDocument();
  });
});
