import React from "react";
import { render, screen } from "@testing-library/react";
import { QuestionTaskContent } from "./QuestionTaskWorkspace";

jest.mock("./PageEditor", () => () => <div data-testid="page-editor" />);
jest.mock("./QuestionRecognitionOverview", () => () => (
  <div data-testid="question-recognition-overview" />
));

const noop = (event) => {
  void event;
};

const QUESTION_ONE_ID = "question-1";

const createView = () => ({
  answerPages: [],
  editingQuestion: undefined,
  handleCancelQuestionAnalysis: noop,
  handleCancelQuestionQualityCheck: noop,
  handleQuestionDelete: noop,
  handleQuestionDeselect: noop,
  handleQuestionEdit: noop,
  handleQuestionReorder: noop,
  handleQuestionSelect: noop,
  handleQuestionSelectionChange: noop,
  handleQuestionSelectionClear: noop,
  handleReferenceSheetApply: noop,
  handleResetSplitLayout: noop,
  handleSelectedQuestionMerge: noop,
  handleSelectedQuestionSplit: noop,
  handleSplitResizeStart: noop,
  handleSubQuestionMove: noop,
  hasTaskResult: true,
  insertQuestionAtBoundary: noop,
  insertQuestionRelative: noop,
  insertSectionAfter: noop,
  insertSectionAtStart: noop,
  isEditSessionActive: false,
  isSplitResizing: false,
  lastSavedAtText: "未保存",
  loading: false,
  mainReference: { current: null },
  openSingleAiModal: noop,
  paperReviewSummary: {
    groups: [
      {
        items: [
          {
            draftId: QUESTION_ONE_ID,
            status: "missingAnalysis",
            statusLabel: "缺少解析",
            statusShortLabel: "缺解析",
          },
        ],
      },
    ],
  },
  questionCardDisplayMode: "preview",
  rightPaneWidth: 430,
  runningQuestionIds: [],
  savingAction: "",
  selectedQuestionId: "",
  selectedQuestionIds: [],
  setEditingQuestionId: noop,
  setEditingTarget: noop,
  setRightPaneWidth: noop,
  splitAffordance: "",
  splitMode: "",
  taskId: "mock",
  updateSectionFromQuestion: noop,
  visiblePages: [{ pageNumber: 1 }],
  visibleQuestions: [
    {
      answer: "A",
      content: "<p>题干内容</p>",
      displayQuestionNumber: 1,
      draftId: QUESTION_ONE_ID,
      optionList: [],
      questionScore: 5,
      sectionNumber: 1,
      sectionTitle: "单项选择题",
      type: 5,
      typeLabel: "问答题",
    },
  ],
});

describe("QuestionTaskWorkspace display mode", () => {
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

  it("uses the display mode from the workspace view", () => {
    const { rerender } = render(
      <QuestionTaskContent
        getDefaultRightPaneWidth={() => 430}
        view={createView()}
      />,
    );

    expect(screen.queryByText("缺解析")).not.toBeInTheDocument();

    rerender(
      <QuestionTaskContent
        getDefaultRightPaneWidth={() => 430}
        view={{ ...createView(), questionCardDisplayMode: "review" }}
      />,
    );

    expect(screen.getByText("缺解析")).toBeInTheDocument();

    rerender(
      <QuestionTaskContent
        getDefaultRightPaneWidth={() => 430}
        view={createView()}
      />,
    );

    expect(screen.queryByText("缺解析")).not.toBeInTheDocument();
  });
});
