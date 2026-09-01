import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import QuestionCards from "./QuestionCards";

const noop = (event) => event;
const NULL_SCORE = JSON.parse("null");
const QUESTION_ONE_ID = "question-1";
const QUESTION_TWO_ID = "question-2";
const COMBINATION_QUESTION_ID = "combination-1";
const CHILD_ONE_ID = "child-1";
const CHOICE_PROMPT_HTML = "<p>选择正确答案。</p>";
const OPTION_GRID_TEST_ID = "question-option-grid";
const OPTION_CONTENT_TEST_ID = "question-option-content";
const OVERFLOW_OPTION_WIDTH = 100;
const SAFE_OPTION_WIDTH = 240;
const OVERFLOW_SCROLL_WIDTH = 180;
const GAP_FILLING_ANSWER_INDEX_SELECTOR = ".gap-filling-answer-index";
const getMockScrollWidth = function getMockScrollWidth(unusedArgument) {
  void unusedArgument;

  return OVERFLOW_SCROLL_WIDTH;
};

const renderQuestionCards = (questions, properties = {}) =>
  render(
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
    />,
  );

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

describe("QuestionCards rendering", () => {
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

  it("renders formula image HTML in answer text", () => {
    const formulaHtml =
      '<img src="https://yungu-photo-daily.oss-cn-hangzhou.aliyuncs.com/exam/ocr/formula/0b67594353c1827c4cfc698c48617bff3cb3db1c.png?mathUrl=m%3D2" alt="m=2">';
    renderQuestionCards([
      {
        answer: `(1) ${formulaHtml}`,
        content: "<p>求 m 的值。</p>",
        displayQuestionNumber: 1,
        draftId: QUESTION_ONE_ID,
        optionList: [],
        questionScore: 5,
        type: 5,
        typeLabel: "问答题",
      },
    ]);

    const answerImage = screen.getByRole("img", { name: "m=2" });
    fireEvent.load(answerImage);

    expect(answerImage).toBeInTheDocument();
    expect(answerImage).toHaveAttribute("alt", "m=2");
    expect(answerImage).toHaveAttribute(
      "src",
      expect.stringContaining("mathUrl=m%3D2"),
    );
    expect(
      screen.queryByText("<img", { exact: false }),
    ).not.toBeInTheDocument();
  });

  it("prefers answerRaw rich text for blank answers in question cards", () => {
    renderQuestionCards([
      {
        content: "<p>填写答案。</p>",
        displayQuestionNumber: 1,
        draftId: QUESTION_ONE_ID,
        gapFillingAnswer: {
          answerRaw: [
            ["<strong>粗体答案</strong>", "<em>斜体答案</em>"],
            ["<span>第二空答案</span>"],
          ],
          answers: ["纯文本答案"],
          isOrder: false,
        },
        optionList: [],
        questionScore: 5,
        type: 3,
        typeLabel: "填空题",
      },
    ]);

    expect(
      screen.getByText("粗体答案", { selector: "strong" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("斜体答案", { selector: "em" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/^[12]\.$/, {
        selector: GAP_FILLING_ANSWER_INDEX_SELECTOR,
      }),
    ).toHaveLength(2);
    expect(screen.getByText(",")).toBeInTheDocument();
    expect(screen.queryByText("第1空")).not.toBeInTheDocument();
    expect(screen.queryByText("或")).not.toBeInTheDocument();
    expect(screen.queryByText("纯文本答案")).not.toBeInTheDocument();
  });

  it("falls back to legacy blank answers when answerRaw is missing", () => {
    renderQuestionCards([
      {
        content: "<p>填写答案。</p>",
        displayQuestionNumber: 1,
        draftId: QUESTION_ONE_ID,
        gapFillingAnswer: {
          answers: ["兼容答案"],
          isOrder: false,
        },
        optionList: [],
        questionScore: 5,
        type: 3,
        typeLabel: "填空题",
      },
    ]);

    expect(screen.getByText("兼容答案")).toBeInTheDocument();
    expect(
      screen.getByText("1.", { selector: GAP_FILLING_ANSWER_INDEX_SELECTOR }),
    ).toBeInTheDocument();
  });

  it("renders blank child answers in combination questions with the same grouped layout", () => {
    renderQuestionCards([
      {
        content: "<p>组合题题干。</p>",
        displayQuestionNumber: 1,
        draftId: COMBINATION_QUESTION_ID,
        optionList: [],
        questionScore: 6,
        sonQuestionList: [
          {
            content: "<p>子题一</p>",
            draftId: CHILD_ONE_ID,
            gapFillingAnswer: {
              answerRaw: [["<strong>组合填空答案</strong>", "<em>别名</em>"]],
              answers: ["组合旧答案"],
              isOrder: false,
            },
            optionList: [],
            questionScore: 3,
            type: 3,
            typeLabel: "填空题",
          },
        ],
        type: 6,
        typeLabel: "组合题",
      },
    ]);

    expect(
      screen.getByText("组合填空答案", { selector: "strong" }),
    ).toBeVisible();
    expect(screen.getByText("别名", { selector: "em" })).toBeVisible();
    expect(
      screen.getByText("1.", { selector: GAP_FILLING_ANSWER_INDEX_SELECTOR }),
    ).toBeInTheDocument();
    expect(screen.getByText(",")).toBeVisible();
  });

  it("keeps formula-only blocks rendered as formula images", () => {
    renderQuestionCards([
      {
        answer: "A",
        analysis:
          '<p><img src="https://example.com/formula.png?mathUrl=%5Cfrac%7Ba%7D%7Bb%7D" alt="a/b"></p>',
        content: "<p>只看公式块。</p>",
        displayQuestionNumber: 1,
        draftId: QUESTION_ONE_ID,
        optionList: [],
        questionScore: 5,
        type: 5,
        typeLabel: "问答题",
      },
    ]);

    const formulaImage = screen.getByRole("img", { name: "a/b" });
    fireEvent.load(formulaImage);

    expect(formulaImage).toBeInTheDocument();
    expect(formulaImage).toHaveAttribute(
      "src",
      expect.stringContaining("mathUrl="),
    );
  });

  it("preserves svg formula semantics for inline option content", () => {
    renderQuestionCards([
      {
        answer: "A",
        content: CHOICE_PROMPT_HTML,
        displayQuestionNumber: 1,
        draftId: QUESTION_ONE_ID,
        optionList: [
          {
            answers:
              '<img class="math-inline" data-math="inline" alt="(\\\\bigcirc \\\\times 10)\\\\nabla" src="https://ai.daily.yungu-inc.org/center/api/custom-services/document-render/api/math-svg?mathUrl=%28%5Cbigcirc%20%5Ctimes%2010%29%5Cnabla&display=inline">',
            key: "A",
          },
        ],
        questionScore: 5,
        type: 1,
        typeLabel: "单选题",
      },
    ]);

    const formulaImage = screen.getByAltText(
      String.raw`(\\bigcirc \\times 10)\\nabla`,
    );

    expect(formulaImage).toHaveAttribute("data-math", "inline");
    expect(formulaImage).toHaveAttribute("class", "math-inline");
    expect(formulaImage).toHaveAttribute(
      "src",
      expect.stringContaining("/api/math-svg?"),
    );
  });

  it("preserves svg formula semantics for block rich text content", () => {
    renderQuestionCards([
      {
        answer: "A",
        analysis:
          '<p><img class="math-display" data-math="block" alt="180 \\\\times 30 =" src="https://ai.daily.yungu-inc.org/center/api/custom-services/document-render/api/math-svg?mathUrl=180+%5Ctimes+30+%3D&display=block" style="display:block;margin:1em 0;"></p>',
        content: "<p>只看 SVG 公式块。</p>",
        displayQuestionNumber: 1,
        draftId: QUESTION_ONE_ID,
        optionList: [],
        questionScore: 5,
        type: 5,
        typeLabel: "问答题",
      },
    ]);

    const formulaImage = screen.getByAltText(String.raw`180 \\times 30 =`);

    expect(formulaImage).toHaveAttribute("data-math", "block");
    expect(formulaImage).toHaveAttribute("class", "math-display");
    expect(formulaImage).toHaveAttribute(
      "src",
      expect.stringContaining("/api/math-svg?"),
    );
  });

  it("renders non-formula rich text images inside the shared rich text boundary", () => {
    renderQuestionCards([
      {
        answer: "A",
        analysis:
          '<p>解析图：</p><img src="https://task.daily.yungu-inc.org/api/preview_file?id=686181" alt="解析配图">',
        content:
          '<p>题干图：</p><img src="https://task.daily.yungu-inc.org/api/preview_file?id=686180" alt="题干配图">',
        displayQuestionNumber: 1,
        draftId: QUESTION_ONE_ID,
        optionList: [
          {
            answers:
              '<img src="https://task.daily.yungu-inc.org/api/preview_file?id=686165" alt="选项配图">',
            key: "A",
          },
        ],
        questionScore: 5,
        type: 1,
        typeLabel: "单选题",
      },
    ]);

    expect(screen.getByRole("img", { name: "题干配图" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "选项配图" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "解析配图" })).toBeInTheDocument();
  });

  it("renders choice options inside the shared option grid container", () => {
    renderQuestionCards([
      {
        answer: "A",
        content: CHOICE_PROMPT_HTML,
        displayQuestionNumber: 1,
        draftId: QUESTION_ONE_ID,
        optionList: [
          { answers: "选项甲", key: "A" },
          { answers: "选项乙", key: "B" },
          { answers: "选项丙", key: "C" },
          { answers: "选项丁", key: "D" },
        ],
        questionScore: 5,
        type: 1,
        typeLabel: "单选题",
      },
    ]);

    const [optionGrid] = screen.getAllByTestId(OPTION_GRID_TEST_ID);

    expect(optionGrid).toHaveAttribute("data-option-count", "4");
    expect(screen.getByText("选项甲")).toBeInTheDocument();
    expect(screen.getByText("选项丁")).toBeInTheDocument();
  });

  it("keeps prompt and option rich text inside the serif content boundary", () => {
    renderQuestionCards([
      {
        answer: "A",
        content: "<p>题干正文</p>",
        displayQuestionNumber: 1,
        draftId: QUESTION_ONE_ID,
        optionList: [{ answers: "<span>选项正文</span>", key: "A" }],
        questionScore: 5,
        type: 1,
        typeLabel: "单选题",
      },
    ]);

    expect(
      screen.getByText("题干正文", { selector: ".html-content *" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("选项正文", { selector: ".option-content *" }),
    ).toBeInTheDocument();
  });

  it("keeps formula images and regular images in separate rich text boundaries", () => {
    renderQuestionCards([
      {
        answer: "A",
        analysis:
          '<p><img src="https://example.com/formula.png?mathUrl=%5Cfrac%7Ba%7D%7Bb%7D" alt="公式图"></p>',
        content:
          '<p>题干图：</p><img src="https://task.daily.yungu-inc.org/api/preview_file?id=686180" alt="普通题图">',
        displayQuestionNumber: 1,
        draftId: QUESTION_ONE_ID,
        optionList: [],
        questionScore: 5,
        type: 5,
        typeLabel: "问答题",
      },
    ]);

    const formulaImage = screen.getByRole("img", { name: "公式图" });
    const regularImage = screen.getByRole("img", { name: "普通题图" });

    expect(formulaImage).toHaveAttribute(
      "src",
      expect.stringContaining("mathUrl="),
    );
    expect(regularImage).not.toHaveAttribute(
      "src",
      expect.stringContaining("mathUrl="),
    );
    expect(
      screen.getByText("题干图：", { selector: ".html-content *" }),
    ).toBeInTheDocument();
    expect(screen.getByText("解析", { exact: false })).toBeInTheDocument();
  });

  it("reuses the shared option grid for combination sub-questions", () => {
    renderQuestionCards([
      {
        answer: "",
        content: "<p>组合题题干。</p>",
        displayQuestionNumber: 1,
        draftId: COMBINATION_QUESTION_ID,
        optionList: [],
        questionScore: 10,
        sonQuestionList: [
          {
            analysis: "",
            answer: "B",
            content: "<p>子题题干。</p>",
            optionList: [
              {
                answers:
                  '<img src="https://example.com/formula.png?mathUrl=104%5Cmathrm%7Bcm%7D%5E3" alt="104\\\\mathrm{cm}^3">',
                key: "A",
              },
              { answers: "217cm³", key: "B" },
              { answers: "104dm³", key: "C" },
              { answers: "217dm³", key: "D" },
            ],
            questionScore: 2,
            type: 1,
            typeLabel: "单选题",
          },
        ],
        type: 6,
        typeLabel: "组合题",
      },
    ]);

    const [optionGrid] = screen.getAllByTestId(OPTION_GRID_TEST_ID);

    expect(optionGrid).toHaveAttribute("data-option-count", "4");
    expect(
      screen.getByAltText(String.raw`104\\mathrm{cm}^3`),
    ).toBeInTheDocument();
    expect(screen.getByText("217cm³")).toBeInTheDocument();
  });

  it("falls back from four columns to two columns when option content would overlap", () => {
    renderQuestionCards([
      {
        answer: "A",
        content: CHOICE_PROMPT_HTML,
        displayQuestionNumber: 1,
        draftId: QUESTION_ONE_ID,
        optionList: [
          { answers: "first ionisation energy", key: "A" },
          { answers: "relative atomic mass", key: "B" },
          { answers: "number of electrons in the outer shell", key: "C" },
          { answers: "number of protons in the nucleus", key: "D" },
        ],
        questionScore: 5,
        type: 1,
        typeLabel: "单选题",
      },
    ]);

    const [optionGrid] = screen.getAllByTestId(OPTION_GRID_TEST_ID);
    const optionContentNodes = screen.getAllByTestId(OPTION_CONTENT_TEST_ID);
    const getMockClientWidth = function getMockClientWidth(unusedArgument) {
      void unusedArgument;

      return optionGrid.dataset.layoutMode === "cols-4"
        ? OVERFLOW_OPTION_WIDTH
        : SAFE_OPTION_WIDTH;
    };

    optionContentNodes.map((contentNode) => {
      Object.defineProperty(contentNode, "clientWidth", {
        configurable: true,
        get: getMockClientWidth,
      });
      Object.defineProperty(contentNode, "scrollWidth", {
        configurable: true,
        get: getMockScrollWidth,
      });

      return contentNode;
    });

    fireEvent(window, new Event("resize"));

    expect(optionGrid).toHaveAttribute("data-layout-mode", "cols-2");
  });

  it("falls back to a single column when option content still overflows in two columns", () => {
    renderQuestionCards([
      {
        answer: "A",
        content: CHOICE_PROMPT_HTML,
        displayQuestionNumber: 1,
        draftId: QUESTION_ONE_ID,
        optionList: [
          { answers: "first ionisation energy", key: "A" },
          { answers: "relative atomic mass", key: "B" },
          { answers: "number of electrons in the outer shell", key: "C" },
          { answers: "number of protons in the nucleus", key: "D" },
        ],
        questionScore: 5,
        type: 1,
        typeLabel: "单选题",
      },
    ]);

    const [optionGrid] = screen.getAllByTestId(OPTION_GRID_TEST_ID);
    const optionContentNodes = screen.getAllByTestId(OPTION_CONTENT_TEST_ID);
    const getMockClientWidth = function getMockClientWidth(unusedArgument) {
      void unusedArgument;

      if (optionGrid.dataset.layoutMode === "cols-4") {
        return OVERFLOW_OPTION_WIDTH;
      }

      if (optionGrid.dataset.layoutMode === "cols-2") {
        return OVERFLOW_SCROLL_WIDTH - 20;
      }

      return SAFE_OPTION_WIDTH;
    };

    optionContentNodes.map((contentNode) => {
      Object.defineProperty(contentNode, "clientWidth", {
        configurable: true,
        get: getMockClientWidth,
      });
      Object.defineProperty(contentNode, "scrollWidth", {
        configurable: true,
        get: getMockScrollWidth,
      });

      return contentNode;
    });

    fireEvent(window, new Event("resize"));

    expect(optionGrid).toHaveAttribute("data-layout-mode", "cols-1");
  });

  it("uses the shared score formatter for missing question scores", () => {
    renderQuestionCards([
      {
        answer: "A",
        content: CHOICE_PROMPT_HTML,
        displayQuestionNumber: 1,
        draftId: "question-null-score",
        optionList: [],
        questionScore: NULL_SCORE,
        type: 5,
        typeLabel: "问答题",
      },
    ]);

    expect(screen.getByText("未设分")).toBeInTheDocument();
    expect(screen.queryByText("null 分")).not.toBeInTheDocument();
  });

  it("renders section labels outside question cards", () => {
    renderQuestionCards([
      createQuestion(QUESTION_ONE_ID, 1),
      {
        ...createQuestion(QUESTION_TWO_ID, 2),
        sectionNumber: 2,
        sectionTitle: "填空题",
      },
    ]);

    expect(screen.getByText("一、单项选择题")).toBeInTheDocument();
    expect(screen.getByText("二、填空题")).toBeInTheDocument();
    expect(
      screen
        .getAllByTestId("question-section-header")
        .some((sectionHeader) =>
          within(sectionHeader).queryByText("一、单项选择题"),
        ),
    ).toBe(true);
  });

  it("renders display-only type sections when section metadata is missing", () => {
    renderQuestionCards([
      {
        ...createQuestion(QUESTION_ONE_ID, 1),
        sectionNumber: undefined,
        sectionTitle: "",
        typeLabel: "单选题",
      },
      {
        ...createQuestion(QUESTION_TWO_ID, 2),
        sectionNumber: undefined,
        sectionTitle: "",
        typeLabel: "填空题",
      },
    ]);

    expect(screen.getByText("一、单选题")).toBeInTheDocument();
    expect(screen.getByText("二、填空题")).toBeInTheDocument();
  });

  it("renders the question number inline with the prompt instead of the header", () => {
    renderQuestionCards([createQuestion(QUESTION_ONE_ID, 1)]);

    expect(screen.getByText("1.")).toBeInTheDocument();
    expect(screen.getByText("5 分")).toBeInTheDocument();
    expect(screen.queryByText("第 1 题")).not.toBeInTheDocument();
  });

  it("renders sub-question number prompt and score in one left-aligned prompt", () => {
    renderQuestionCards([
      {
        answer: "",
        content: "<p>组合题题干。</p>",
        displayQuestionNumber: 27,
        draftId: COMBINATION_QUESTION_ID,
        optionList: [],
        questionScore: 10,
        sonQuestionList: [
          {
            analysis: "",
            answer: "",
            content: "<p>若展示区宽为 x 米。</p>",
            optionList: [],
            questionScore: 4,
            type: 3,
            typeLabel: "填空题",
          },
        ],
        type: 6,
        typeLabel: "组合题",
      },
    ]);

    const subQuestionPrompt = screen.getByTestId("sub-question-prompt");

    expect(subQuestionPrompt).toHaveClass("sub-question-prompt");
    expect(subQuestionPrompt).toHaveTextContent(
      /27\.1\s*若展示区宽为 x 米。\s*4 分/,
    );
  });

  it("removes duplicated option key prefixes only in card display", () => {
    renderQuestionCards([
      {
        answer: "B",
        content: CHOICE_PROMPT_HTML,
        displayQuestionNumber: 1,
        draftId: QUESTION_ONE_ID,
        optionList: [{ answers: "B. 选项 B", key: "B" }],
        questionScore: 5,
        type: 1,
        typeLabel: "单选题",
      },
    ]);

    const optionItem = screen.getByTestId("question-option-item");
    const optionContent = screen.getByTestId(OPTION_CONTENT_TEST_ID);

    expect(optionItem).toHaveTextContent(/^B\.\s*选项 B$/);
    expect(optionContent).toHaveTextContent("选项 B");
    expect(optionContent).not.toHaveTextContent(/^B\./);
  });

  it("keeps option content that starts with a letter and space", () => {
    renderQuestionCards([
      {
        answer: "A",
        content: CHOICE_PROMPT_HTML,
        displayQuestionNumber: 1,
        draftId: QUESTION_ONE_ID,
        optionList: [
          { answers: "A BBBB", key: "A" },
          { answers: "<p>A BBBB</p>", key: "B" },
        ],
        questionScore: 5,
        type: 1,
        typeLabel: "单选题",
      },
    ]);

    const optionContents = screen.getAllByTestId(OPTION_CONTENT_TEST_ID);

    expect(optionContents[0]).toHaveTextContent("A BBBB");
    expect(optionContents[1]).toHaveTextContent("A BBBB");
  });
});
