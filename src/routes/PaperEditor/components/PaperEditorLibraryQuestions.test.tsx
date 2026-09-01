import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

import {
  appendPaperQuestionsFromLibrary,
  collectPaperQuestionIds,
} from "../paperEditorModel";
import type { PaperEditorDraft } from "../types";
import PaperEditorLibraryQuestions from "./PaperEditorLibraryQuestions";

let libraryModalProperties: Record<string, unknown> = {};

jest.mock("../paperEditorModel", () => ({
  appendPaperQuestionsFromLibrary: jest.fn((draft) => ({
    ...draft,
    modules: [{ key: "module-1", questions: [{ key: "question-99" }] }],
  })),
  collectPaperQuestionIds: jest.fn(() => [1]),
}));
jest.mock("./PaperQuestionLibraryModal", () => (properties: object) => {
  libraryModalProperties = properties as Record<string, unknown>;
  return (
    <button
      type="button"
      onClick={() =>
        Reflect.get(properties, "onConfirm")([{ question: { questionId: 99 } }])
      }
    >
      Add library result
    </button>
  );
});

const draft: PaperEditorDraft = {
  gradeId: 7,
  gradeName: "七年级",
  modules: [{ key: "module-1", questions: [], title: "选择题" }],
  questionTypeTemplates: [],
  subjectId: 2,
  subjectName: "数学",
  title: "试卷",
};

describe("PaperEditorLibraryQuestions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    libraryModalProperties = {};
  });

  it("uses the paper scope only as defaults and preserves it after adding", () => {
    const onClose = jest.fn();
    const setDraft = jest.fn();
    render(
      <PaperEditorLibraryQuestions
        draft={draft}
        grades={[
          { gradeId: 7, name: "七年级" },
          { gradeId: 8, name: "八年级" },
        ]}
        locale="zh-CN"
        onClose={onClose}
        setDraft={setDraft}
        subjects={[
          { name: "数学", subjectId: 2 },
          { name: "英语", subjectId: 3 },
        ]}
        target={{ initialQuestionTypeKey: 101, moduleKey: "module-1" }}
      />,
    );

    expect(libraryModalProperties).toEqual(
      expect.objectContaining({
        excludedQuestionIds: [1],
        initialGradeId: 7,
        initialQuestionTypeKey: 101,
        initialSubjectId: 2,
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Add library result" }));

    expect(collectPaperQuestionIds).toHaveBeenCalledWith(draft);
    expect(appendPaperQuestionsFromLibrary).toHaveBeenCalledWith(
      draft,
      "module-1",
      [{ question: { questionId: 99 } }],
    );
    expect(setDraft).toHaveBeenCalledWith(
      expect.objectContaining({ gradeId: 7, subjectId: 2 }),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
