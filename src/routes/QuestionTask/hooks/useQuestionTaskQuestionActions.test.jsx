import React, { useState } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { message, Modal } from "antd";

import { useQuestionTaskQuestionActions } from "./useQuestionTaskQuestionActions";
import { buildSubQuestionSelectionId } from "../domain/questionTaskStructure";

const QUESTION_ONE_ID = "question-1";
const QUESTION_TWO_ID = "question-2";
const CHILD_ONE_ID = "child-1";
const CHILD_TWO_ID = "child-2";

const noop = (event) => {
  void event;
};

const returnEmptyArray = (event) => {
  void event;
  return [];
};

const returnEmptyObject = (event) => {
  void event;
  return {};
};

const returnFalse = (event) => {
  void event;
  return false;
};

const returnTrue = (event) => {
  void event;
  return true;
};

const updateQuestionInPages = (pages, questionId, updater) =>
  pages.map((page) => ({
    ...page,
    questions: page.questions.map((question) =>
      question.draftId === questionId ? updater(question) : question,
    ),
  }));

const createTaskResult = (event) => {
  void event;
  return {
    pages: [
      {
        pageKey: "page-1",
        questions: [
          {
            draftId: QUESTION_ONE_ID,
            sectionNumber: 1,
            sectionTitle: "选择题",
            typeLabel: "单选题",
          },
          {
            draftId: QUESTION_TWO_ID,
            sectionNumber: 1,
            sectionTitle: "选择题",
            typeLabel: "填空题",
          },
        ],
      },
    ],
  };
};

const createTaskResultWithCombination = (event) => {
  void event;
  return {
    pages: [
      {
        pageKey: "page-1",
        questions: [
          {
            draftId: QUESTION_ONE_ID,
            sectionNumber: 1,
            sectionTitle: "选择题",
            sonQuestionList: [
              { content: "子题一", draftId: CHILD_ONE_ID },
              { content: "子题二", draftId: CHILD_TWO_ID },
            ],
            typeLabel: "组合题",
          },
        ],
      },
    ],
  };
};

const QuestionActionHarness = (properties) => {
  void properties;
  const [editingQuestionId, setEditingQuestionId] = useState("");
  const [focusRequest, setFocusRequest] = useState({});
  const [selectedQuestionId, setSelectedQuestionId] = useState("");
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
  const [taskResult, setTaskResult] = useState(createTaskResult());
  const visibleQuestions = taskResult.pages[0].questions;
  const actions = useQuestionTaskQuestionActions({
    applyLocalSave: (question) => question,
    buildQuestionSectionPatch: (question) => ({
      sectionNumber: question.sectionNumber,
      sectionTitle: question.sectionTitle,
    }),
    canSelectQuestion: returnTrue,
    cloneArrayField: returnEmptyArray,
    editingQuestionId,
    getInheritedSectionPatch: returnEmptyObject,
    getModalContainer: (event) => {
      void event;
      return document.body;
    },
    getQuestionLevelLabel: (event) => {
      void event;
      return "普通";
    },
    getQuestionTypeLabel: (event) => {
      void event;
      return "单选题";
    },
    getValidMetadataId: (value) => value,
    isOptionBasedQuestion: returnFalse,
    markQuestionDeleted: (pages) => pages,
    mergeSelectedQuestionsIntoCombination: returnEmptyObject,
    runningQuestionIdSet: new Set(),
    selectableQuestionIdSet: new Set([QUESTION_ONE_ID, QUESTION_TWO_ID]),
    selectedQuestionId,
    selectedQuestionIds,
    setEditingQuestionId,
    setEditingTarget: noop,
    setFocusRequest,
    setSelectedQuestionId,
    setSelectedQuestionIds,
    setTaskResult,
    splitSelectedCombinationQuestion: returnEmptyObject,
    syncQuestionMetadataInPages: (pages) => pages,
    taskResult,
    updateQuestionInPages,
    visibleQuestions,
  });

  return (
    <div>
      <button
        type="button"
        onClick={(event) => {
          void event;
          actions.insertSectionAfter(QUESTION_ONE_ID);
        }}
      >
        分段
      </button>
      <button
        type="button"
        onClick={(event) => {
          void event;
          actions.insertSectionAtStart();
        }}
      >
        开头分段
      </button>
      <button
        type="button"
        onClick={(event) => {
          void event;
          actions.updateSectionFromQuestion(QUESTION_ONE_ID);
        }}
      >
        编辑分段
      </button>
      {visibleQuestions.map((question) => (
        <span key={question.draftId}>
          {`${question.draftId}:${question.sectionNumber}:${question.sectionTitle}`}
        </span>
      ))}
      <span>{focusRequest.questionId || ""}</span>
      <span>{editingQuestionId}</span>
      <span>{selectedQuestionId}</span>
      <span>{selectedQuestionIds.join(",")}</span>
    </div>
  );
};

const SubQuestionMoveHarness = () => {
  const [editingQuestionId, setEditingQuestionId] = useState("");
  const [focusRequest, setFocusRequest] = useState({});
  const [selectedQuestionId, setSelectedQuestionId] = useState("");
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([
    buildSubQuestionSelectionId(QUESTION_ONE_ID, 1),
  ]);
  const [taskResult, setTaskResult] = useState(
    createTaskResultWithCombination(),
  );
  const visibleQuestions = taskResult.pages[0].questions;
  const actions = useQuestionTaskQuestionActions({
    applyLocalSave: (question) => question,
    buildQuestionSectionPatch: returnEmptyObject,
    canSelectQuestion: returnTrue,
    cloneArrayField: returnEmptyArray,
    editingQuestionId,
    getInheritedSectionPatch: returnEmptyObject,
    getModalContainer: (event) => {
      void event;
      return document.body;
    },
    getQuestionLevelLabel: (event) => {
      void event;
      return "普通";
    },
    getQuestionTypeLabel: (event) => {
      void event;
      return "单选题";
    },
    getValidMetadataId: (value) => value,
    isOptionBasedQuestion: returnFalse,
    markQuestionDeleted: (pages) => pages,
    mergeSelectedQuestionsIntoCombination: returnEmptyObject,
    runningQuestionIdSet: new Set(),
    selectableQuestionIdSet: new Set([QUESTION_ONE_ID]),
    selectedQuestionId,
    selectedQuestionIds,
    setEditingQuestionId,
    setEditingTarget: noop,
    setFocusRequest,
    setSelectedQuestionId,
    setSelectedQuestionIds,
    setTaskResult,
    splitSelectedCombinationQuestion: returnEmptyObject,
    syncQuestionMetadataInPages: (pages) => pages,
    taskResult,
    updateQuestionInPages,
    visibleQuestions,
  });

  return (
    <div>
      <button
        type="button"
        onClick={(event) => {
          void event;
          actions.handleSubQuestionMove(QUESTION_ONE_ID, 1, "up");
        }}
      >
        上移小题
      </button>
      {visibleQuestions[0].sonQuestionList.map((subQuestion) => (
        <span key={subQuestion.draftId}>{subQuestion.content}</span>
      ))}
      <span>{focusRequest.questionId || ""}</span>
      <span>{selectedQuestionId}</span>
      <span>{selectedQuestionIds.join(",")}</span>
    </div>
  );
};

describe("useQuestionTaskQuestionActions", () => {
  beforeEach(() => {
    window.globalLange = "zh-CN";
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("requires confirming section name before inserting a section", async () => {
    const confirmSpy = jest
      .spyOn(Modal, "confirm")
      .mockImplementation(({ content }) => {
        render(content);
      });
    const successSpy = jest
      .spyOn(message, "success")
      .mockImplementation(() => {});
    const errorSpy = jest.spyOn(message, "error").mockImplementation(() => {});

    render(<QuestionActionHarness />);

    fireEvent.click(screen.getByRole("button", { name: "分段" }));

    expect(confirmSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        icon: <></>,
        okText: "确定",
        title: "新增分段",
        onOk: expect.any(Function),
      }),
    );

    const confirmConfig = confirmSpy.mock.calls[0][0];

    expect(confirmConfig.onOk()).toBe(true);
    expect(errorSpy).toHaveBeenCalledWith("请先输入分段名");

    fireEvent.change(screen.getByLabelText("分段名"), {
      target: { value: "新分段" },
    });

    act(() => {
      expect(confirmConfig.onOk()).toBeUndefined();
    });

    expect(screen.getByText("question-2:2:新分段")).toBeVisible();
    expect(successSpy).toHaveBeenCalledWith("已插入新分段");
  });

  it("requires confirmation before inserting a section at the first question", () => {
    const confirmSpy = jest
      .spyOn(Modal, "confirm")
      .mockImplementation(({ content }) => {
        render(content);
      });
    const successSpy = jest
      .spyOn(message, "success")
      .mockImplementation(() => {});

    render(<QuestionActionHarness />);

    fireEvent.click(screen.getByRole("button", { name: "开头分段" }));

    const confirmConfig = confirmSpy.mock.calls[0][0];

    fireEvent.change(screen.getByLabelText("分段编号"), {
      target: { value: 7 },
    });
    fireEvent.change(screen.getByLabelText("分段名"), {
      target: { value: "开头分段" },
    });

    act(() => {
      expect(confirmConfig.onOk()).toBeUndefined();
    });

    expect(screen.getByText("question-1:7:开头分段")).toBeVisible();
    expect(screen.getByText("question-2:7:开头分段")).toBeVisible();
    expect(successSpy).toHaveBeenCalledWith("已插入新分段");
  });

  it("updates the current contiguous section after confirmation", () => {
    const confirmSpy = jest
      .spyOn(Modal, "confirm")
      .mockImplementation(({ content }) => {
        render(content);
      });
    const successSpy = jest
      .spyOn(message, "success")
      .mockImplementation(() => {});

    render(<QuestionActionHarness />);

    fireEvent.click(screen.getByRole("button", { name: "编辑分段" }));

    expect(confirmSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "编辑分段",
        onOk: expect.any(Function),
      }),
    );

    const confirmConfig = confirmSpy.mock.calls[0][0];

    fireEvent.change(screen.getByLabelText("分段编号"), {
      target: { value: 6 },
    });
    fireEvent.change(screen.getByLabelText("分段名"), {
      target: { value: "更新分段" },
    });

    act(() => {
      expect(confirmConfig.onOk()).toBeUndefined();
    });

    expect(screen.getByText("question-1:6:更新分段")).toBeVisible();
    expect(screen.getByText("question-2:6:更新分段")).toBeVisible();
    expect(successSpy).toHaveBeenCalledWith("已更新分段");
  });

  it("moves a sub-question and remaps selected sub-question ids", () => {
    const successSpy = jest
      .spyOn(message, "success")
      .mockImplementation(() => {});

    render(<SubQuestionMoveHarness />);

    expect(screen.getByText("子题一").nextSibling).toHaveTextContent("子题二");

    fireEvent.click(screen.getByRole("button", { name: "上移小题" }));

    expect(screen.getByText("子题二").nextSibling).toHaveTextContent("子题一");
    expect(
      screen.getByText(buildSubQuestionSelectionId(QUESTION_ONE_ID, 0)),
    ).toBeVisible();
    expect(successSpy).toHaveBeenCalledWith("小题顺序已保存");
  });
});
