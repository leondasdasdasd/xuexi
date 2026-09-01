import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";

import PaperEditorQuestionModal from "../components/PaperEditorQuestionModal";
import { savePaperEditorDraft } from "../paperEditorService";
import type { PaperEditorDraft } from "../types";

let mockModalShouldSave = true;
let mockSavedQuestionId = 2;
jest.mock(
  "../../QuestionAssetInput/components/QuestionAssetEditorModal",
  () =>
    ({ onSaved }: { onSaved: (result: object) => void }) => (
      <button
        type="button"
        onClick={() => {
          if (!mockModalShouldSave) return;
          onSaved({
            questionTypes: [
              {
                businessQuestionTypeId: 102,
                elements: [],
                extras: [],
                globalConfig: { hasAnswer: true },
                name: "Multiple choice",
              },
            ],
            resource: {
              question: {
                id: mockSavedQuestionId,
                businessQuestionTypeId: 102,
                version: "1",
                elements: [],
                extras: [],
                children: [],
              },
              resource: { gradeId: 8, subjectId: 3 },
            },
          });
        }}
      >
        Save question
      </button>
    ),
);
jest.mock("../paperEditorService", () => ({
  savePaperEditorDraft: jest.fn(),
}));

const draft: PaperEditorDraft = {
  title: "Paper",
  subjectId: 2,
  subjectName: "Math",
  gradeId: 7,
  modules: [
    {
      key: "module-1",
      title: "Questions",
      questions: [],
    },
  ],
  questionTypeTemplates: [],
};

const Harness = ({
  initialDraft = draft,
  onClose,
  targetQuestionId = null,
}: {
  initialDraft?: PaperEditorDraft;
  onClose: () => void;
  targetQuestionId?: number | null;
}) => {
  const [current, setCurrent] = useState<PaperEditorDraft | null>(initialDraft);
  if (!current) return null;
  return (
    <>
      <span data-testid="question-count">
        {current.modules.reduce(
          (count, module) => count + module.questions.length,
          0,
        )}
      </span>
      <span data-testid="last-module-title">
        {current.modules.at(-1)?.title}
      </span>
      <span data-testid="question-score">
        {current.modules[0].questions[0]?.score || 0}
      </span>
      <span data-testid="paper-grade">{current.gradeId}</span>
      <span data-testid="paper-subject">{current.subjectId}</span>
      <PaperEditorQuestionModal
        draft={current}
        editable
        onClose={onClose}
        setDraft={setCurrent}
        targetQuestionId={targetQuestionId}
      />
    </>
  );
};

describe("PaperEditorQuestionModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockModalShouldSave = true;
    mockSavedQuestionId = 2;
  });

  it("adds the saved question to the draft without saving the paper", () => {
    const onClose = jest.fn();
    render(<Harness onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: "Save question" }));

    expect(screen.getByTestId("question-count")).toHaveTextContent("1");
    expect(screen.getByTestId("last-module-title")).toHaveTextContent(
      "Multiple choice",
    );
    expect(screen.getByTestId("paper-grade")).toHaveTextContent("7");
    expect(screen.getByTestId("paper-subject")).toHaveTextContent("2");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(savePaperEditorDraft).not.toHaveBeenCalled();
  });

  it("replaces edited content while preserving the paper score", () => {
    mockSavedQuestionId = 1;
    const existingDraft: PaperEditorDraft = {
      ...draft,
      modules: [
        {
          ...draft.modules[0],
          questions: [
            {
              key: "question-1",
              questionId: 1,
              score: 5,
              content: null,
              children: [],
            },
          ],
        },
      ],
    };
    render(
      <Harness
        initialDraft={existingDraft}
        onClose={jest.fn()}
        targetQuestionId={1}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Save question" }));

    expect(screen.getByTestId("question-score")).toHaveTextContent("5");
    expect(savePaperEditorDraft).not.toHaveBeenCalled();
  });

  it("keeps the draft and modal open when question saving fails", () => {
    mockModalShouldSave = false;
    const onClose = jest.fn();
    render(<Harness onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: "Save question" }));

    expect(screen.getByTestId("question-count")).toHaveTextContent("0");
    expect(screen.getByRole("button", { name: "Save question" })).toBeVisible();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("does not expose the editor without update capability", () => {
    const { container } = render(
      <PaperEditorQuestionModal
        draft={draft}
        editable={false}
        onClose={jest.fn()}
        setDraft={jest.fn()}
        targetQuestionId={null}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
