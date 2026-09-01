import {
  createMoveQuestionCommand,
  createOutlineQuestionPositions,
} from "../outlineQuestionMoveAdapter";
import { movePaperQuestion } from "../paperEditorModel";
import type { PaperEditorDraft } from "../types";

const content = {
  id: 1,
  questionTypeKey: 101,
  version: "1",
  elements: [],
  extras: [],
  children: [],
};

const draft: PaperEditorDraft = {
  title: "练习",
  gradeId: 7,
  gradeName: "七年级",
  subjectId: 2,
  subjectName: "数学",
  modules: [
    {
      key: "module-a",
      title: "选择题",
      questions: [
        {
          key: "question-1",
          questionId: 1,
          content,
          children: [],
        },
        {
          key: "question-2",
          questionId: 2,
          content,
          children: [],
        },
      ],
    },
    {
      key: "module-b",
      title: "解答题",
      questions: [
        {
          key: "question-3",
          questionId: 3,
          content,
          children: [],
        },
      ],
    },
  ],
  questionTypeTemplates: [],
};

describe("outline question move adapter", () => {
  it("maps a forward cross-module move after the target question", () => {
    const positions = createOutlineQuestionPositions(draft);
    const command = createMoveQuestionCommand(positions, 0, 2);

    expect(command).toEqual({
      sourceModuleKey: "module-a",
      sourceQuestionIndex: 0,
      targetModuleKey: "module-b",
      targetQuestionIndex: 1,
    });
    expect(
      movePaperQuestion(draft, command!).modules.flatMap((module) =>
        module.questions.map((question) => question.questionId),
      ),
    ).toEqual([2, 3, 1]);
  });

  it("maps a backward cross-module move before the target question", () => {
    const positions = createOutlineQuestionPositions(draft);
    const command = createMoveQuestionCommand(positions, 2, 0);

    expect(command).toEqual({
      sourceModuleKey: "module-b",
      sourceQuestionIndex: 0,
      targetModuleKey: "module-a",
      targetQuestionIndex: 0,
    });
    expect(
      movePaperQuestion(draft, command!).modules.flatMap((module) =>
        module.questions.map((question) => question.questionId),
      ),
    ).toEqual([3, 1, 2]);
  });

  it("ignores unchanged and invalid sort indexes", () => {
    const positions = createOutlineQuestionPositions(draft);

    expect(createMoveQuestionCommand(positions, 1, 1)).toBeUndefined();
    expect(createMoveQuestionCommand(positions, 8, 0)).toBeUndefined();
  });
});
