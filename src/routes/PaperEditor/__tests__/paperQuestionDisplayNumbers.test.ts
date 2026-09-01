import { createPaperQuestionDisplayNumbers } from "../paperQuestionDisplayNumbers";
import type { PaperEditorDraft } from "../types";

const draftWithQuestionKeys = (moduleQuestionKeys: string[][]) =>
  ({
    modules: moduleQuestionKeys.map((questionKeys, moduleIndex) => ({
      key: `module-${moduleIndex}`,
      questions: questionKeys.map((key) => ({ key })),
    })),
  }) as PaperEditorDraft;

describe("createPaperQuestionDisplayNumbers", () => {
  it("numbers root questions continuously across modules and empty modules", () => {
    const numbers = createPaperQuestionDisplayNumbers(
      draftWithQuestionKeys([["q-1", "q-2"], [], ["q-3"]]),
    );

    expect([...numbers.entries()]).toEqual([
      ["q-1", 1],
      ["q-2", 2],
      ["q-3", 3],
    ]);
  });

  it("derives new numbers after modules or questions are reordered or deleted", () => {
    const numbers = createPaperQuestionDisplayNumbers(
      draftWithQuestionKeys([["q-3"], ["q-2"]]),
    );

    expect([...numbers.entries()]).toEqual([
      ["q-3", 1],
      ["q-2", 2],
    ]);
  });
});
