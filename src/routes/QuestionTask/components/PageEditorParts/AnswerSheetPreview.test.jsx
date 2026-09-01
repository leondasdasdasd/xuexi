import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AnswerSheetPreview from "./AnswerSheetPreview";

const BLANK_QUESTION_CONTENT = "<p>填写答案</p>";

describe("AnswerSheetPreview", () => {
  beforeEach(() => {
    window.globalLange = "zh-CN";
  });

  it("hides combination stem in reference answer preview while keeping sub questions", () => {
    render(
      <AnswerSheetPreview
        onApplyReferenceEdits={jest.fn()}
        onQuestionSelect={jest.fn()}
        questions={[
          {
            content: "<p>公共材料不应展示</p>",
            draftId: "combination-1",
            questionScore: 6,
            sonQuestionList: [
              {
                answer: "B",
                questionScore: 2,
                type: 1,
              },
              {
                answer: "D",
                questionScore: 4,
                type: 1,
              },
            ],
            type: 6,
          },
        ]}
      />,
    );

    expect(screen.queryByText(/公共题干/)).not.toBeInTheDocument();
    expect(screen.queryByText("公共材料不应展示")).not.toBeInTheDocument();
    expect(screen.getByText("1-1")).toBeVisible();
    expect(screen.getByText("1-2")).toBeVisible();
    expect(screen.getByText("B")).toBeVisible();
    expect(screen.getByText("D")).toBeVisible();
  });

  it("shows empty reference preview when only empty combination questions exist", () => {
    render(
      <AnswerSheetPreview
        onApplyReferenceEdits={jest.fn()}
        onQuestionSelect={jest.fn()}
        questions={[
          {
            content: "<p>只有组合题题干</p>",
            draftId: "combination-empty",
            questionScore: 6,
            sonQuestionList: [
              {
                questionScore: 2,
                type: 5,
              },
              {
                questionScore: 4,
                type: 5,
              },
            ],
            type: 6,
          },
        ]}
      />,
    );

    expect(screen.getByText("暂无可预览的参考答案或解析")).toBeVisible();
    expect(screen.queryByText("只有组合题题干")).not.toBeInTheDocument();
    expect(screen.queryByText("1-1")).not.toBeInTheDocument();
  });

  it("shows localized English copy in empty preview", () => {
    window.globalLange = "en";

    render(
      <AnswerSheetPreview
        onApplyReferenceEdits={jest.fn()}
        onQuestionSelect={jest.fn()}
        questions={[]}
      />,
    );

    expect(screen.getByText("Reference Answer")).toBeVisible();
    expect(
      screen.getByText("No reference answer or analysis available for preview"),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Batch Edit" })).toBeVisible();
  });

  it("renders grouped blank answers with rich answerRaw content in reference preview", () => {
    render(
      <AnswerSheetPreview
        onApplyReferenceEdits={jest.fn()}
        onQuestionSelect={jest.fn()}
        questions={[
          {
            content: BLANK_QUESTION_CONTENT,
            draftId: "blank-1",
            gapFillingAnswer: {
              answerRaw: [
                ["<strong>粗体答案</strong>", "<em>斜体答案</em>"],
                ["<span>第二空答案</span>"],
              ],
              answers: ["旧答案"],
              isOrder: false,
            },
            questionScore: 4,
            type: 3,
            typeLabel: "填空题",
          },
        ]}
      />,
    );

    expect(screen.getByText("粗体答案", { selector: "strong" })).toBeVisible();
    expect(screen.getByText("斜体答案", { selector: "em" })).toBeVisible();
    expect(screen.getByText("1.")).toBeVisible();
    expect(screen.getByText("2.")).toBeVisible();
    expect(screen.getByText(",")).toBeVisible();
    expect(screen.queryByText("第1空")).not.toBeInTheDocument();
    expect(screen.queryByText("或")).not.toBeInTheDocument();
    expect(screen.queryByText("旧答案")).not.toBeInTheDocument();
  });

  it("falls back to legacy blank answers and keeps grouped layout in reference preview", () => {
    render(
      <AnswerSheetPreview
        onApplyReferenceEdits={jest.fn()}
        onQuestionSelect={jest.fn()}
        questions={[
          {
            content: BLANK_QUESTION_CONTENT,
            draftId: "blank-legacy",
            gapFillingAnswer: {
              answers: ["兼容答案"],
              isOrder: false,
            },
            questionScore: 4,
            type: 3,
            typeLabel: "填空题",
          },
        ]}
      />,
    );

    expect(screen.getByText("兼容答案")).toBeVisible();
    expect(screen.getByText("1.")).toBeVisible();
  });

  it("renders grouped blank answers for combination sub questions in reference preview", () => {
    render(
      <AnswerSheetPreview
        onApplyReferenceEdits={jest.fn()}
        onQuestionSelect={jest.fn()}
        questions={[
          {
            content: "<p>组合题题干</p>",
            draftId: "combination-blank",
            questionScore: 6,
            sonQuestionList: [
              {
                gapFillingAnswer: {
                  answerRaw: [
                    ["<strong>子题填空答案</strong>", "<em>别名</em>"],
                  ],
                  answers: ["旧子题答案"],
                  isOrder: false,
                },
                questionScore: 2,
                type: 3,
                typeLabel: "填空题",
              },
            ],
            type: 6,
          },
        ]}
      />,
    );

    expect(
      screen.getByText("子题填空答案", { selector: "strong" }),
    ).toBeVisible();
    expect(screen.getByText("别名", { selector: "em" })).toBeVisible();
    expect(screen.getByText("1.")).toBeVisible();
    expect(screen.getByText(",")).toBeVisible();
  });

  it("renders formula answers in the shared rich-text editing boundary", () => {
    render(
      <AnswerSheetPreview
        onApplyReferenceEdits={jest.fn()}
        onQuestionSelect={jest.fn()}
        questions={[
          {
            answer:
              '<p>结果 <img src="https://example.com/formula.png?mathUrl=x%5E2%2B1" /></p>',
            draftId: "answer-rich-formula",
            questionScore: 5,
            type: 5,
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "批量编辑" }));

    const answerEditor = screen
      .getByRole("group", { name: "答案" })
      .querySelector('[contenteditable="true"]');
    const formulaImage = answerEditor.querySelector("img");

    expect(screen.getByRole("toolbar")).toBeVisible();
    expect(screen.getByRole("button", { name: "数学公式" })).toBeVisible();
    expect(answerEditor).toHaveTextContent("结果");
    expect(formulaImage).toHaveAttribute(
      "src",
      "https://example.com/formula.png?mathUrl=x%5E2%2B1",
    );
  });

  it("inserts a shared-toolbar formula into only the active rich-text answer", async () => {
    const onApplyReferenceEdits = jest.fn();

    render(
      <AnswerSheetPreview
        onApplyReferenceEdits={onApplyReferenceEdits}
        onQuestionSelect={jest.fn()}
        questions={[
          {
            answer: "第一个答案",
            draftId: "answer-rich-first",
            questionScore: 5,
            type: 5,
          },
          {
            answer: "第二个答案",
            draftId: "answer-rich-second",
            questionScore: 5,
            type: 5,
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "批量编辑" }));
    const answerGroups = screen.getAllByRole("group", { name: "答案" });
    const secondEditor = answerGroups[1].querySelector(
      '[contenteditable="true"]',
    );

    fireEvent.mouseDown(secondEditor);
    fireEvent.click(screen.getByRole("button", { name: "数学公式" }));
    fireEvent.change(
      screen.getByPlaceholderText("这里会同步显示 LaTeX，可直接编辑"),
      { target: { value: "x^2+1" } },
    );
    fireEvent.click(screen.getByText("确 定").closest("button"));
    await waitFor(() => {
      expect(answerGroups[1].querySelector("img")).toHaveAttribute(
        "src",
        expect.stringContaining("mathUrl=x%5E2%2B1"),
      );
    });
    fireEvent.click(screen.getByRole("button", { name: "保存答案" }));

    expect(onApplyReferenceEdits).toHaveBeenCalledWith([
      {
        draftId: "answer-rich-second",
        patch: {
          answer: expect.stringContaining("mathUrl=x%5E2%2B1"),
        },
      },
    ]);
  });

  it("keeps rich-text answer values aligned after deleting an accepted answer", () => {
    render(
      <AnswerSheetPreview
        onApplyReferenceEdits={jest.fn()}
        onQuestionSelect={jest.fn()}
        questions={[
          {
            draftId: "blank-rich-delete-answer",
            gapFillingAnswer: {
              answerRaw: [["<p>首选答案</p>", "<p>保留答案</p>"]],
              answers: ["首选答案&&保留答案"],
              isOrder: false,
            },
            questionScore: 4,
            type: 3,
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "批量编辑" }));
    const removeButtons = screen.getAllByRole("button", {
      name: "删除该可接受答案",
    });

    fireEvent.click(removeButtons[0]);

    expect(screen.queryByText("首选答案")).not.toBeInTheDocument();
    expect(screen.getByText("保留答案")).toBeVisible();
    expect(screen.getAllByRole("group", { name: /可接受答案/ })).toHaveLength(
      1,
    );
  });

  it("upgrades legacy && blank answers into structured batch editing inputs", () => {
    render(
      <AnswerSheetPreview
        onApplyReferenceEdits={jest.fn()}
        onQuestionSelect={jest.fn()}
        questions={[
          {
            content: BLANK_QUESTION_CONTENT,
            draftId: "blank-batch-legacy",
            gapFillingAnswer: {
              answers: ["1ffewfef&&123&&321", "第二空&&备选"],
              isOrder: false,
            },
            questionScore: 4,
            type: 3,
            typeLabel: "填空题",
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "批量编辑" }));

    expect(screen.getByText("第1空")).toBeVisible();
    expect(screen.getByText("第2空")).toBeVisible();
    expect(screen.getByText("1ffewfef")).toBeVisible();
    expect(screen.getByText("123")).toBeVisible();
    expect(screen.getByText("321")).toBeVisible();
    expect(screen.getByText("第二空")).toBeVisible();
    expect(screen.getByText("备选")).toBeVisible();
  });

  it("adds another accepted answer input for blank questions in batch editing", () => {
    render(
      <AnswerSheetPreview
        onApplyReferenceEdits={jest.fn()}
        onQuestionSelect={jest.fn()}
        questions={[
          {
            content: BLANK_QUESTION_CONTENT,
            draftId: "blank-batch-add-answer",
            gapFillingAnswer: {
              answers: ["第一空答案"],
              isOrder: false,
            },
            questionScore: 4,
            type: 3,
            typeLabel: "填空题",
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "批量编辑" }));
    expect(screen.getByText("添答案")).toBeVisible();
    expect(screen.queryByText("添加可接受答案")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "添加可接受答案" }));

    expect(screen.getByText("第一空答案")).toBeVisible();
    expect(screen.getAllByRole("group", { name: /可接受答案/ })).toHaveLength(
      2,
    );
  });

  it("adds multiple accepted answer inputs when the blank is still empty", () => {
    render(
      <AnswerSheetPreview
        onApplyReferenceEdits={jest.fn()}
        onQuestionSelect={jest.fn()}
        questions={[
          {
            content: BLANK_QUESTION_CONTENT,
            draftId: "blank-batch-add-empty-answer",
            gapFillingAnswer: {
              answers: [],
              isOrder: false,
            },
            questionScore: 4,
            type: 3,
            typeLabel: "填空题",
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "批量编辑" }));
    fireEvent.click(screen.getByRole("button", { name: "添加可接受答案" }));
    fireEvent.click(screen.getByRole("button", { name: "添加可接受答案" }));

    expect(screen.getAllByRole("group", { name: /可接受答案/ })).toHaveLength(
      3,
    );
  });

  it("adds another blank from the blank action row in batch editing", () => {
    render(
      <AnswerSheetPreview
        onApplyReferenceEdits={jest.fn()}
        onQuestionSelect={jest.fn()}
        questions={[
          {
            content: BLANK_QUESTION_CONTENT,
            draftId: "blank-batch-add-blank",
            gapFillingAnswer: {
              answers: ["第一空答案"],
              isOrder: false,
            },
            questionScore: 4,
            type: 3,
            typeLabel: "填空题",
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "批量编辑" }));
    expect(screen.getByText("添空")).toBeVisible();
    expect(screen.queryByText("增加一个空")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "增加一个空" }));

    expect(screen.getByText("第1空")).toBeVisible();
    expect(screen.getByText("第2空")).toBeVisible();
    expect(screen.getAllByRole("group", { name: /可接受答案/ })).toHaveLength(
      2,
    );
  });

  it("uses an icon-only delete blank action in batch editing", () => {
    render(
      <AnswerSheetPreview
        onApplyReferenceEdits={jest.fn()}
        onQuestionSelect={jest.fn()}
        questions={[
          {
            content: BLANK_QUESTION_CONTENT,
            draftId: "blank-batch-delete-blank",
            gapFillingAnswer: {
              answers: ["第一空答案", "第二空答案"],
              isOrder: false,
            },
            questionScore: 4,
            type: 3,
            typeLabel: "填空题",
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "批量编辑" }));

    const deleteBlankButtons = screen.getAllByRole("button", {
      name: "删除当前空",
    });

    expect(deleteBlankButtons).toHaveLength(2);
    expect(screen.queryByText("删除当前空")).not.toBeInTheDocument();

    fireEvent.click(deleteBlankButtons[0]);

    expect(screen.queryByText("第2空")).not.toBeInTheDocument();
    expect(screen.getByText("第1空")).toBeVisible();
  });

  it("refreshes batch drafts from updated questions while unchanged", () => {
    const { rerender } = render(
      <AnswerSheetPreview
        onApplyReferenceEdits={jest.fn()}
        onQuestionSelect={jest.fn()}
        questions={[
          {
            content: BLANK_QUESTION_CONTENT,
            draftId: "blank-batch-sync",
            gapFillingAnswer: {
              answers: ["旧答案"],
              isOrder: false,
            },
            questionScore: 4,
            type: 3,
            typeLabel: "填空题",
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "批量编辑" }));

    expect(screen.getByText("旧答案")).toBeVisible();

    rerender(
      <AnswerSheetPreview
        onApplyReferenceEdits={jest.fn()}
        onQuestionSelect={jest.fn()}
        questions={[
          {
            content: BLANK_QUESTION_CONTENT,
            draftId: "blank-batch-sync",
            gapFillingAnswer: {
              answers: ["单题编辑后的答案"],
              isOrder: false,
            },
            questionScore: 4,
            type: 3,
            typeLabel: "填空题",
          },
        ]}
      />,
    );

    expect(screen.queryByText("旧答案")).not.toBeInTheDocument();
    expect(screen.getByText("单题编辑后的答案")).toBeVisible();
  });

  it("only edits combination sub-question scores and shows their read-only sum", () => {
    const handleApplyReferenceEdits = jest.fn();

    render(
      <AnswerSheetPreview
        onApplyReferenceEdits={handleApplyReferenceEdits}
        onQuestionSelect={jest.fn()}
        questions={[
          {
            content: "<p>组合题题干</p>",
            draftId: "combination-batch-score",
            questionScore: 20,
            sonQuestionList: [
              {
                answer: "A",
                questionScore: 4.5,
                type: 1,
              },
              {
                gapFillingAnswer: {
                  answers: ["192"],
                  isOrder: false,
                },
                questionScore: 4,
                type: 3,
                typeLabel: "填空题",
              },
              {
                answer: false,
                questionScore: 4,
                type: 4,
              },
              {
                answer: "说明",
                questionScore: 8,
                type: 5,
              },
            ],
            type: 6,
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "批量编辑" }));

    expect(screen.queryByText("每题")).not.toBeInTheDocument();
    expect(screen.queryByText("每小题")).not.toBeInTheDocument();

    const scoreInputs = screen.getAllByRole("spinbutton");
    const [parentScoreInput, ...subQuestionScoreInputs] = scoreInputs;

    expect(scoreInputs).toHaveLength(5);
    expect(parentScoreInput).toBeDisabled();
    expect(parentScoreInput).toHaveValue("20.5");
    expect(subQuestionScoreInputs.every((input) => !input.disabled)).toBe(true);

    fireEvent.change(subQuestionScoreInputs[0], { target: { value: "4" } });
    fireEvent.change(subQuestionScoreInputs[1], { target: { value: "6" } });

    expect(parentScoreInput).toHaveValue("22");

    fireEvent.click(screen.getByRole("button", { name: "保存答案" }));

    expect(handleApplyReferenceEdits).toHaveBeenCalledWith([
      {
        draftId: "combination-batch-score",
        patch: {
          questionScore: 22,
          sonQuestionList: [
            {
              answer: "A",
              questionScore: 4,
              type: 1,
            },
            {
              gapFillingAnswer: {
                answers: ["192"],
                isOrder: false,
              },
              questionScore: 6,
              type: 3,
              typeLabel: "填空题",
            },
            {
              answer: false,
              questionScore: 4,
              type: 4,
            },
            {
              answer: "说明",
              questionScore: 8,
              type: 5,
            },
          ],
        },
      },
    ]);
  });

  it("keeps section and individual score editing available for normal questions", () => {
    const handleApplyReferenceEdits = jest.fn();

    render(
      <AnswerSheetPreview
        onApplyReferenceEdits={handleApplyReferenceEdits}
        onQuestionSelect={jest.fn()}
        questions={[
          {
            answer: "A",
            draftId: "choice-score-one",
            optionList: [{ answers: "选项 A", key: "A" }],
            questionScore: 1,
            type: 1,
          },
          {
            answer: "B",
            draftId: "choice-score-two",
            optionList: [{ answers: "选项 B", key: "B" }],
            questionScore: 2,
            type: 1,
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "批量编辑" }));

    const [sectionScoreInput, firstScoreInput, secondScoreInput] =
      screen.getAllByRole("spinbutton");

    fireEvent.change(sectionScoreInput, { target: { value: "4" } });

    expect(firstScoreInput).toHaveValue("4");
    expect(secondScoreInput).toHaveValue("4");

    fireEvent.change(secondScoreInput, { target: { value: "6" } });
    fireEvent.click(screen.getByRole("button", { name: "保存答案" }));

    expect(handleApplyReferenceEdits).toHaveBeenCalledWith([
      {
        draftId: "choice-score-one",
        patch: { questionScore: 4 },
      },
      {
        draftId: "choice-score-two",
        patch: { questionScore: 6 },
      },
    ]);
  });

  it("keeps page scrolling available when wheeling over score inputs", () => {
    render(
      <AnswerSheetPreview
        onApplyReferenceEdits={jest.fn()}
        onQuestionSelect={jest.fn()}
        questions={[
          {
            answer: "A",
            draftId: "choice-score-wheel",
            optionList: [{ answers: "选项 A", key: "A" }],
            questionScore: 1,
            type: 1,
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "批量编辑" }));

    const scoreInputs = screen.getAllByRole("spinbutton");
    expect(scoreInputs).toHaveLength(2);
    expect(
      scoreInputs.map((scoreInput) => scoreInput.hasAttribute("type")),
    ).toEqual([false, false]);

    const [sectionScoreInput, questionScoreInput] = scoreInputs;
    const sectionWheelEvent = new Event("wheel", {
      bubbles: true,
      cancelable: true,
    });
    const questionWheelEvent = new Event("wheel", {
      bubbles: true,
      cancelable: true,
    });

    sectionScoreInput.focus();
    fireEvent(sectionScoreInput, sectionWheelEvent);

    questionScoreInput.focus();
    fireEvent(questionScoreInput, questionWheelEvent);

    expect(sectionWheelEvent.defaultPrevented).toBe(false);
    expect(questionWheelEvent.defaultPrevented).toBe(false);
    expect(sectionScoreInput).toHaveValue("1");
    expect(questionScoreInput).toHaveValue("1");
  });
});
