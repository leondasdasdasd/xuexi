import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import QuestionCards from "./QuestionCards";
import { buildSubQuestionSelectionId } from "../domain/questionTaskStructure";

const noop = (event) => event;
const QUESTION_ONE_ID = "question-1";
const QUESTION_TWO_ID = "question-2";
const COMBINATION_QUESTION_ID = "combination-1";
const CHILD_ONE_ID = "child-1";
const CHILD_TWO_ID = "child-2";
const CHOICE_PROMPT_HTML = "<p>选择正确答案。</p>";
const CHILD_ONE_CONTENT_HTML = "<p>子题一</p>";
const CHILD_TWO_CONTENT_HTML = "<p>子题二</p>";

const getQuestionCards = (questions, properties = {}) => (
  <QuestionCards
    readOnly={false}
    onInsertAtEnd={noop}
    onInsertAtStart={noop}
    onQuestionAiEnhance={noop}
    onQuestionDelete={noop}
    onQuestionDuplicateAfter={noop}
    onQuestionEdit={noop}
    onQuestionInsertAfter={noop}
    onQuestionReorder={noop}
    onQuestionDeselect={noop}
    onQuestionSectionInsertAfter={noop}
    onQuestionSectionInsertAtStart={noop}
    onQuestionSectionUpdate={noop}
    onQuestionSelect={noop}
    questions={questions}
    selectedQuestionId=""
    {...properties}
  />
);

const renderQuestionCards = (questions, properties = {}) =>
  render(getQuestionCards(questions, properties));

const createQuestion = (draftId, displayQuestionNumber) => ({
  answer: "A",
  content: `<p>题干内容 ${displayQuestionNumber}</p>`,
  displayQuestionNumber,
  draftId,
  optionList: [],
  questionScore: 5,
  sectionNumber: 1,
  sectionTitle: "单项选择题",
  type: 5,
  typeLabel: "问答题",
});

const getQuestionCard = (displayQuestionNumber) =>
  screen.getAllByRole("button").find((element) => {
    const accessibleName = element.getAttribute("aria-label") || "";
    const textContent = element.textContent || "";
    const questionLabel = `题干内容 ${displayQuestionNumber}`;

    return (
      accessibleName.includes(questionLabel) ||
      textContent.includes(questionLabel)
    );
  });

describe("QuestionCards", () => {
  beforeEach(() => {
    window.globalLange = "zh-CN";
    global.ResizeObserver = function MockResizeObserver(callback) {
      void callback;

      return {
        disconnect(unusedCallback) {
          void unusedCallback;
        },
        observe(unusedTarget) {
          void unusedTarget;
        },
      };
    };
  });

  it("locks running AI task cards while keeping cancel actions available", () => {
    const runningQuestionId = "question-running";
    const handleCancelAnalysis = jest.fn();
    renderQuestionCards(
      [
        {
          analysisTaskStatus: "PROCESSING",
          answer: "A",
          content: CHOICE_PROMPT_HTML,
          displayQuestionNumber: 1,
          draftId: runningQuestionId,
          optionList: [],
          questionScore: 5,
          type: 5,
          typeLabel: "问答题",
        },
      ],
      {
        lockedQuestionIds: [runningQuestionId],
        onCancelQuestionAnalysis: handleCancelAnalysis,
      },
    );

    expect(screen.getByRole("button", { name: "编辑" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "删除" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "取消解析" }));
    expect(handleCancelAnalysis).toHaveBeenCalledWith(runningQuestionId);
  });

  it("toggles question selection from the card checkbox", () => {
    const handleSelectionChange = jest.fn();
    renderQuestionCards([createQuestion(QUESTION_ONE_ID, 1)], {
      onQuestionSelectionChange: handleSelectionChange,
    });

    fireEvent.click(screen.getByRole("checkbox", { name: "选择第 1 题" }));

    expect(handleSelectionChange).toHaveBeenCalledWith(QUESTION_ONE_ID, true);
  });

  it("keeps selected question selection control visible", () => {
    renderQuestionCards([createQuestion(QUESTION_ONE_ID, 1)], {
      selectedQuestionIds: [QUESTION_ONE_ID],
    });

    const selectedCheckbox = screen.getByRole("checkbox", {
      name: "选择第 1 题",
    });

    expect(selectedCheckbox).toBeChecked();
    expect(
      screen.getByTestId(`question-selection-control-${QUESTION_ONE_ID}`),
    ).toHaveClass("question-selection-control-selected");
  });

  it("keeps review status hidden in the default preview mode", () => {
    renderQuestionCards([createQuestion(QUESTION_ONE_ID, 1)], {
      reviewStatusByQuestionId: new Map([
        [
          QUESTION_ONE_ID,
          {
            status: "missingAnalysis",
            statusLabel: "缺少解析",
            statusShortLabel: "缺解析",
          },
        ],
      ]),
    });

    expect(screen.queryByText("缺解析")).not.toBeInTheDocument();
  });

  it("renders review status in review mode without hiding selection state", () => {
    renderQuestionCards([createQuestion(QUESTION_ONE_ID, 1)], {
      displayMode: "review",
      reviewStatusByQuestionId: new Map([
        [
          QUESTION_ONE_ID,
          {
            status: "missingAnalysis",
            statusLabel: "缺少解析",
            statusShortLabel: "缺解析",
          },
        ],
      ]),
      selectedQuestionIds: [QUESTION_ONE_ID],
    });

    expect(screen.getByText("缺解析")).toBeInTheDocument();
    expect(
      screen.getByTestId(`question-selection-control-${QUESTION_ONE_ID}`),
    ).toHaveClass("question-selection-control-selected");
  });

  it("clears selected question when clicking the selected card again", () => {
    const handleQuestionDeselect = jest.fn();
    const handleQuestionSelect = jest.fn();

    renderQuestionCards([createQuestion(QUESTION_ONE_ID, 1)], {
      onQuestionDeselect: handleQuestionDeselect,
      onQuestionSelect: handleQuestionSelect,
      selectedQuestionId: QUESTION_ONE_ID,
    });

    fireEvent.click(getQuestionCard(1));

    expect(handleQuestionDeselect).toHaveBeenCalledTimes(1);
    expect(handleQuestionSelect).not.toHaveBeenCalled();
  });

  it("updates a section from the section header", () => {
    const handleQuestionSectionUpdate = jest.fn();

    renderQuestionCards([createQuestion(QUESTION_ONE_ID, 1)], {
      onQuestionSectionUpdate: handleQuestionSectionUpdate,
    });

    fireEvent.click(
      screen.getByRole("button", { name: "一、单项选择题 编辑" }),
    );

    expect(handleQuestionSectionUpdate).toHaveBeenCalledWith(QUESTION_ONE_ID);
  });

  it("moves questions from the hover action buttons", () => {
    const handleQuestionReorder = jest.fn();

    renderQuestionCards(
      [createQuestion(QUESTION_ONE_ID, 1), createQuestion(QUESTION_TWO_ID, 2)],
      {
        onQuestionReorder: handleQuestionReorder,
      },
    );

    expect(screen.getAllByRole("button", { name: "上移" })[0]).toBeDisabled();

    fireEvent.click(screen.getAllByRole("button", { name: "下移" })[0]);
    expect(handleQuestionReorder).toHaveBeenCalledWith(
      QUESTION_ONE_ID,
      QUESTION_TWO_ID,
      "after",
    );

    fireEvent.click(screen.getAllByRole("button", { name: "上移" })[1]);
    expect(handleQuestionReorder).toHaveBeenCalledWith(
      QUESTION_TWO_ID,
      QUESTION_ONE_ID,
      "before",
    );
  });

  it("opens question edit when double-clicking the card body", () => {
    const handleQuestionEdit = jest.fn();
    renderQuestionCards([createQuestion(QUESTION_ONE_ID, 1)], {
      onQuestionEdit: handleQuestionEdit,
    });

    fireEvent.doubleClick(getQuestionCard(1));

    expect(handleQuestionEdit).toHaveBeenCalledWith(QUESTION_ONE_ID);
  });

  it("numbers sub-questions by parent question number and edits the clicked sub-question", () => {
    const handleQuestionEdit = jest.fn();

    renderQuestionCards(
      [
        {
          ...createQuestion(COMBINATION_QUESTION_ID, 26),
          answer: "",
          sonQuestionList: [
            {
              content: CHILD_ONE_CONTENT_HTML,
              draftId: CHILD_ONE_ID,
              optionList: [],
              questionScore: 4,
              type: 1,
              typeLabel: "单选题",
            },
            {
              content: CHILD_TWO_CONTENT_HTML,
              draftId: CHILD_TWO_ID,
              optionList: [],
              questionScore: 4,
              type: 3,
              typeLabel: "填空题",
            },
          ],
          type: 6,
          typeLabel: "组合题",
        },
      ],
      {
        onQuestionEdit: handleQuestionEdit,
      },
    );

    expect(screen.getByText("26.1")).toBeVisible();
    expect(screen.getByText("26.2")).toBeVisible();
    expect(screen.getAllByTestId("sub-question-prompt")[0]).toHaveTextContent(
      /26\.1\s*子题一\s*4 分/,
    );
    expect(screen.queryByText("单选题")).not.toBeInTheDocument();
    expect(screen.queryByText("填空题")).not.toBeInTheDocument();

    fireEvent.doubleClick(screen.getByText("子题二"));

    expect(handleQuestionEdit).toHaveBeenCalledWith(COMBINATION_QUESTION_ID, {
      subQuestionIndex: 1,
    });
  });

  it("moves combination sub-questions from their row action buttons", () => {
    const handleSubQuestionMove = jest.fn();

    renderQuestionCards(
      [
        {
          ...createQuestion(COMBINATION_QUESTION_ID, 26),
          answer: "",
          sonQuestionList: [
            {
              content: CHILD_ONE_CONTENT_HTML,
              draftId: CHILD_ONE_ID,
              optionList: [],
              questionScore: 4,
              type: 1,
              typeLabel: "单选题",
            },
            {
              content: CHILD_TWO_CONTENT_HTML,
              draftId: CHILD_TWO_ID,
              optionList: [],
              questionScore: 4,
              type: 3,
              typeLabel: "填空题",
            },
          ],
          type: 6,
          typeLabel: "组合题",
        },
      ],
      {
        onSubQuestionMove: handleSubQuestionMove,
      },
    );

    expect(
      screen.getAllByRole("button", { name: "上移小题" })[0],
    ).toBeDisabled();
    expect(
      screen.getAllByRole("button", { name: "下移小题" })[1],
    ).toBeDisabled();

    fireEvent.click(screen.getAllByRole("button", { name: "下移小题" })[0]);
    expect(handleSubQuestionMove).toHaveBeenCalledWith(
      COMBINATION_QUESTION_ID,
      0,
      "down",
    );

    fireEvent.click(screen.getAllByRole("button", { name: "上移小题" })[1]);
    expect(handleSubQuestionMove).toHaveBeenCalledWith(
      COMBINATION_QUESTION_ID,
      1,
      "up",
    );
  });

  it("does not open question edit when double-clicking read-only cards", () => {
    const handleQuestionEdit = jest.fn();
    const questions = [createQuestion(QUESTION_ONE_ID, 1)];
    const { rerender } = renderQuestionCards(questions, {
      onQuestionEdit: handleQuestionEdit,
      readOnly: true,
    });

    fireEvent.doubleClick(getQuestionCard(1));
    expect(handleQuestionEdit).not.toHaveBeenCalled();

    rerender(
      getQuestionCards(questions, {
        lockedQuestionIds: [QUESTION_ONE_ID],
        onQuestionEdit: handleQuestionEdit,
      }),
    );
    fireEvent.doubleClick(getQuestionCard(1));
    expect(handleQuestionEdit).not.toHaveBeenCalled();
  });

  it("does not open question edit when double-clicking card controls", () => {
    const handleQuestionDelete = jest.fn();
    const handleQuestionEdit = jest.fn();
    const handleQuestionSelectionChange = jest.fn();
    renderQuestionCards([createQuestion(QUESTION_ONE_ID, 1)], {
      onQuestionDelete: handleQuestionDelete,
      onQuestionEdit: handleQuestionEdit,
      onQuestionSelectionChange: handleQuestionSelectionChange,
    });

    fireEvent.doubleClick(screen.getByRole("button", { name: "删除" }));
    fireEvent.doubleClick(
      screen.getByRole("checkbox", { name: "选择第 1 题" }),
    );

    expect(handleQuestionEdit).not.toHaveBeenCalled();
  });

  it("enables merge for selected non-combination questions", () => {
    const handleMerge = jest.fn();
    renderQuestionCards(
      [createQuestion(QUESTION_ONE_ID, 1), createQuestion(QUESTION_TWO_ID, 2)],
      {
        onSelectedQuestionMerge: handleMerge,
        selectedQuestionIds: [QUESTION_ONE_ID, QUESTION_TWO_ID],
      },
    );

    expect(screen.getByText("已选 2 题")).toBeVisible();

    const mergeButton = screen.getByRole("button", {
      name: "合并为组合题",
    });

    expect(mergeButton).not.toBeDisabled();
    fireEvent.click(mergeButton);
    expect(handleMerge).toHaveBeenCalledTimes(1);
  });

  it("hides the selection toolbar when nothing is selected", () => {
    renderQuestionCards([
      createQuestion(QUESTION_ONE_ID, 1),
      createQuestion(QUESTION_TWO_ID, 2),
    ]);

    expect(screen.queryByText(/已选 \d+ 题/)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "合并为组合题" }),
    ).not.toBeInTheDocument();
  });

  it("enables split only when one combination question is selected", () => {
    const handleSplit = jest.fn();
    renderQuestionCards(
      [
        {
          ...createQuestion(COMBINATION_QUESTION_ID, 1),
          answer: "",
          sonQuestionList: [createQuestion(CHILD_ONE_ID, 1)],
          type: 6,
          typeLabel: "组合题",
        },
      ],
      {
        onSelectedQuestionSplit: handleSplit,
        selectedQuestionIds: [COMBINATION_QUESTION_ID],
      },
    );

    const splitButton = screen.getByRole("button", {
      name: "拆分组合题",
    });

    expect(splitButton).not.toBeDisabled();
    fireEvent.click(splitButton);
    expect(handleSplit).toHaveBeenCalledTimes(1);
  });

  it("allows selecting combination subquestions for split", () => {
    const handleSelectionChange = jest.fn();
    const handleSplit = jest.fn();
    renderQuestionCards(
      [
        {
          ...createQuestion(COMBINATION_QUESTION_ID, 1),
          answer: "",
          sonQuestionList: [
            createQuestion(CHILD_ONE_ID, 1),
            createQuestion(CHILD_TWO_ID, 2),
          ],
          type: 6,
          typeLabel: "组合题",
        },
      ],
      {
        onQuestionSelectionChange: handleSelectionChange,
        onSelectedQuestionSplit: handleSplit,
        selectedQuestionIds: [
          buildSubQuestionSelectionId(COMBINATION_QUESTION_ID, 1),
        ],
      },
    );

    const subQuestionCheckbox = screen.getByRole("checkbox", {
      name: "选择第 1-2 小题",
    });
    const secondSubQuestionPrompt = screen.getAllByTestId(
      "sub-question-prompt",
    )[1];

    expect(subQuestionCheckbox).toBeChecked();
    expect(
      within(secondSubQuestionPrompt).getByRole("checkbox", {
        name: "选择第 1-2 小题",
      }),
    ).toBe(subQuestionCheckbox);
    fireEvent.click(subQuestionCheckbox);
    expect(handleSelectionChange).toHaveBeenCalledWith(
      buildSubQuestionSelectionId(COMBINATION_QUESTION_ID, 1),
      false,
    );

    const splitButton = screen.getByRole("button", {
      name: "拆分组合题",
    });

    expect(splitButton).not.toBeDisabled();
    fireEvent.click(splitButton);
    expect(handleSplit).toHaveBeenCalledTimes(1);
  });

  it("scrolls to the clicked sub-question instead of the group card top", () => {
    const originalScrollIntoView = window.HTMLElement.prototype.scrollIntoView;
    const scrolledNodes = [];
    const handleQuestionSelect = jest.fn();
    const combinationQuestion = {
      ...createQuestion(COMBINATION_QUESTION_ID, 26),
      answer: "",
      sonQuestionList: [
        {
          content: CHILD_ONE_CONTENT_HTML,
          draftId: CHILD_ONE_ID,
          optionList: [],
          questionScore: 4,
          type: 1,
          typeLabel: "单选题",
        },
        {
          content: CHILD_TWO_CONTENT_HTML,
          draftId: CHILD_TWO_ID,
          optionList: [],
          questionScore: 4,
          type: 3,
          typeLabel: "填空题",
        },
      ],
      type: 6,
      typeLabel: "组合题",
    };

    window.HTMLElement.prototype.scrollIntoView = function scrollIntoView(
      options,
    ) {
      scrolledNodes.push({ node: this, options });
    };

    try {
      const { rerender } = renderQuestionCards([combinationQuestion], {
        onQuestionSelect: handleQuestionSelect,
      });

      fireEvent.click(screen.getByText("子题二"));

      expect(handleQuestionSelect).toHaveBeenCalledWith(
        COMBINATION_QUESTION_ID,
        "result",
      );

      rerender(
        getQuestionCards([combinationQuestion], {
          onQuestionSelect: handleQuestionSelect,
          selectedQuestionId: COMBINATION_QUESTION_ID,
        }),
      );

      const lastScrolledNode = scrolledNodes.at(-1);

      expect(lastScrolledNode.node).toHaveTextContent("子题二");
      expect(lastScrolledNode.node).not.toHaveTextContent("子题一");
      expect(lastScrolledNode.options).toEqual({
        behavior: "smooth",
        block: "nearest",
      });
    } finally {
      if (originalScrollIntoView) {
        window.HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
      } else {
        delete window.HTMLElement.prototype.scrollIntoView;
      }
    }
  });

  it("keeps the selected group active when clicking one of its sub-questions", () => {
    const originalScrollIntoView = window.HTMLElement.prototype.scrollIntoView;
    const scrolledNodes = [];
    const handleQuestionDeselect = jest.fn();
    const handleQuestionSelect = jest.fn();
    const combinationQuestion = {
      ...createQuestion(COMBINATION_QUESTION_ID, 26),
      answer: "",
      sonQuestionList: [
        {
          content: CHILD_ONE_CONTENT_HTML,
          draftId: CHILD_ONE_ID,
          optionList: [],
          questionScore: 4,
          type: 1,
          typeLabel: "单选题",
        },
        {
          content: CHILD_TWO_CONTENT_HTML,
          draftId: CHILD_TWO_ID,
          optionList: [],
          questionScore: 4,
          type: 3,
          typeLabel: "填空题",
        },
      ],
      type: 6,
      typeLabel: "组合题",
    };

    window.HTMLElement.prototype.scrollIntoView = function scrollIntoView(
      options,
    ) {
      scrolledNodes.push({ node: this, options });
    };

    try {
      renderQuestionCards([combinationQuestion], {
        onQuestionDeselect: handleQuestionDeselect,
        onQuestionSelect: handleQuestionSelect,
        selectedQuestionId: COMBINATION_QUESTION_ID,
      });

      fireEvent.click(screen.getByText("子题二"));

      expect(handleQuestionDeselect).not.toHaveBeenCalled();
      expect(handleQuestionSelect).toHaveBeenCalledWith(
        COMBINATION_QUESTION_ID,
        "result",
      );

      const lastScrolledNode = scrolledNodes.at(-1);

      expect(lastScrolledNode.node).toHaveTextContent("子题二");
      expect(lastScrolledNode.node).not.toHaveTextContent("子题一");
    } finally {
      if (originalScrollIntoView) {
        window.HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
      } else {
        delete window.HTMLElement.prototype.scrollIntoView;
      }
    }
  });

  it("keeps manual scroll position when selected question does not change", () => {
    const originalScrollIntoView = window.HTMLElement.prototype.scrollIntoView;
    const scrollIntoView = jest.fn();
    const questions = [
      createQuestion(QUESTION_ONE_ID, 1),
      createQuestion(QUESTION_TWO_ID, 2),
    ];
    const updatedQuestions = questions.map((question) =>
      question.draftId === QUESTION_ONE_ID
        ? { ...question, analysisTaskStatus: "PROCESSING" }
        : question,
    );

    window.HTMLElement.prototype.scrollIntoView = scrollIntoView;

    try {
      const { rerender } = renderQuestionCards(questions, {
        selectedQuestionId: QUESTION_ONE_ID,
      });

      expect(scrollIntoView).toHaveBeenCalledTimes(1);
      expect(scrollIntoView).toHaveBeenLastCalledWith({
        behavior: "smooth",
        block: "nearest",
      });

      rerender(
        getQuestionCards(updatedQuestions, {
          selectedQuestionId: QUESTION_ONE_ID,
        }),
      );

      expect(scrollIntoView).toHaveBeenCalledTimes(1);

      rerender(
        getQuestionCards(updatedQuestions, {
          selectedQuestionId: QUESTION_TWO_ID,
        }),
      );

      expect(scrollIntoView).toHaveBeenCalledTimes(2);
    } finally {
      if (originalScrollIntoView) {
        window.HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
      } else {
        delete window.HTMLElement.prototype.scrollIntoView;
      }
    }
  });
});
