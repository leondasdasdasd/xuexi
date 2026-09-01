import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";

import {
  PageImageAssetPicker,
  PureTaskQuestionEditor,
  SectionMetaFields,
} from "./index";
import { MetaEditor } from "./EditorFields";
import { QUESTION_TASK_EDITOR_PREFERENCE_STORAGE_KEY } from "./constants";

const EDIT_QUESTION_ID = "question-1";

jest.mock("../../../../services/global", () => ({
  richerUploadFile: jest.fn(),
}));

jest.mock("./QuestionBlock", () => {
  const MockQuestionBlock = (properties) => {
    return (
      <div data-testid="question-block">
        {properties.isAnnotationCollapsed ? undefined : <div>难易程度</div>}
        <textarea
          aria-label={`${properties.question.editorId}-content`}
          readOnly
          value={properties.question.content || ""}
        />
        <div
          aria-label={`${properties.question.editorId}-rich-content`}
          contentEditable
          role="textbox"
          suppressContentEditableWarning
        >
          富文本编辑区
        </div>
        <div data-question-editor-child-index="1">第二小题编辑区</div>
      </div>
    );
  };
  MockQuestionBlock.displayName = "MockQuestionBlock";

  return MockQuestionBlock;
});

describe("TaskQuestionEditor section copy", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  const renderSectionMetaFields = (options = {}) => {
    void options;
    render(
      <SectionMetaFields
        question={{ sectionNumber: 2, sectionTitle: "选择题" }}
      />,
    );
  };

  it("shows localized Chinese section copy", () => {
    window.globalLange = "zh-CN";

    renderSectionMetaFields();

    expect(screen.getByText("分段编号")).toBeVisible();
    expect(screen.getByText("2")).toBeVisible();
    expect(screen.getByText("分段标题")).toBeVisible();
    expect(screen.getByText("选择题")).toBeVisible();
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("shows localized English section copy", () => {
    window.globalLange = "en";

    renderSectionMetaFields();

    expect(screen.getByText("Section No.")).toBeVisible();
    expect(screen.getByText("2")).toBeVisible();
    expect(screen.getByText("Section Title")).toBeVisible();
    expect(screen.getByText("选择题")).toBeVisible();
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("renders the difficulty options as a single custom button group", () => {
    const handleQuestionChange = jest.fn();
    window.globalLange = "zh-CN";

    render(
      <MetaEditor
        chapterTreeData={[]}
        indicatorTreeData={[]}
        knowledgeTreeData={[]}
        onQuestionChange={handleQuestionChange}
        popupContainer={(event) => {
          void event;
          return document.body;
        }}
        question={{ questionLevel: 2, questionScore: "1" }}
      />,
    );

    const normalButton = screen.getByRole("radio", { name: "普通" });
    expect(screen.getByRole("radio", { name: "简单" })).toBeVisible();
    expect(normalButton).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: "困难" })).toBeVisible();

    fireEvent.click(screen.getByRole("radio", { name: "困难" }));

    expect(handleQuestionChange).toHaveBeenCalledWith({
      questionLevel: 3,
      questionLevelName: "困难",
    });
  });

  it("uses the same meta field set for child questions without section fields", () => {
    window.globalLange = "zh-CN";

    render(
      <MetaEditor
        chapterTreeData={[]}
        indicatorTreeData={[]}
        isChild
        knowledgeTreeData={[]}
        onQuestionChange={(payload) => {
          void payload;
        }}
        popupContainer={(event) => {
          void event;
          return document.body;
        }}
        question={{
          chapterSelections: [],
          indicatorIds: [],
          knowledgeSelections: [],
          questionLevel: 2,
          questionScore: "",
        }}
      />,
    );

    expect(screen.getByText("难易程度")).toBeVisible();
    expect(screen.getByText("成绩")).toBeVisible();
    expect(screen.getByText("章节")).toBeVisible();
    expect(screen.getByText("知识点")).toBeVisible();
    expect(screen.getByText("素养")).toBeVisible();
    expect(screen.queryByText("分段编号")).not.toBeInTheDocument();
    expect(screen.queryByText("分段标题")).not.toBeInTheDocument();
  });

  it("shows root grade subject and type but omits section fields in the top scope area", () => {
    window.globalLange = "zh-CN";

    render(
      <PureTaskQuestionEditor
        allGradeList={[{ gradeId: 9, name: "九年级" }]}
        chapterList={[]}
        dispatch={jest.fn()}
        editQuestion={{
          content: "题干",
          draftId: EDIT_QUESTION_ID,
          gradeId: 9,
          questionScore: "4",
          sectionNumber: 2,
          sectionTitle: "选择题",
          subjectId: 2,
          type: 1,
        }}
        labelList={[]}
        onCancel={jest.fn()}
        onLocalSave={jest.fn()}
        subjectList={[{ id: 2, name: "数学" }]}
        treeData={[]}
      />,
    );

    expect(screen.getAllByText("年级")[0]).toBeVisible();
    expect(screen.getAllByText("学科")[0]).toBeVisible();
    expect(screen.getByText("题型")).toBeVisible();
    expect(screen.queryByText("分段编号")).not.toBeInTheDocument();
    expect(screen.queryByText("分段标题")).not.toBeInTheDocument();
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("question-editor-section-nav"),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText("题目编辑定位")).not.toBeInTheDocument();
  });

  it("keeps grade subject and type visible when collapsing annotation fields", () => {
    window.globalLange = "zh-CN";

    render(
      <PureTaskQuestionEditor
        allGradeList={[{ gradeId: 9, name: "九年级" }]}
        chapterList={[]}
        dispatch={jest.fn()}
        editQuestion={{
          content: "题干",
          draftId: EDIT_QUESTION_ID,
          gradeId: 9,
          questionScore: "4",
          subjectId: 2,
          type: 1,
        }}
        labelList={[]}
        onCancel={jest.fn()}
        onLocalSave={jest.fn()}
        subjectList={[{ id: 2, name: "数学" }]}
        treeData={[]}
      />,
    );

    expect(screen.getByText("难易程度")).toBeVisible();

    fireEvent.click(screen.getByRole("switch", { name: "收起标注" }));

    expect(screen.getAllByText("年级")[0]).toBeVisible();
    expect(screen.getAllByText("学科")[0]).toBeVisible();
    expect(screen.getByText("题型")).toBeVisible();
    expect(screen.queryByText("难易程度")).not.toBeInTheDocument();
    expect(screen.queryByText("章节")).not.toBeInTheDocument();
    expect(screen.queryByText("知识点")).not.toBeInTheDocument();
    expect(screen.queryByText("素养")).not.toBeInTheDocument();
  });

  it("persists annotation collapse preference locally", () => {
    window.globalLange = "zh-CN";

    const editorProperties = {
      allGradeList: [{ gradeId: 9, name: "九年级" }],
      chapterList: [],
      dispatch: jest.fn(),
      editQuestion: {
        content: "题干",
        draftId: EDIT_QUESTION_ID,
        gradeId: 9,
        questionScore: "4",
        subjectId: 2,
        type: 1,
      },
      labelList: [],
      onCancel: jest.fn(),
      onLocalSave: jest.fn(),
      subjectList: [{ id: 2, name: "数学" }],
      treeData: [],
    };
    const { unmount } = render(
      <PureTaskQuestionEditor {...editorProperties} />,
    );

    fireEvent.click(screen.getByRole("switch", { name: "收起标注" }));

    expect(
      JSON.parse(
        window.localStorage.getItem(
          QUESTION_TASK_EDITOR_PREFERENCE_STORAGE_KEY,
        ),
      ),
    ).toEqual(expect.objectContaining({ isAnnotationCollapsed: true }));

    unmount();
    render(<PureTaskQuestionEditor {...editorProperties} />);

    expect(screen.getByRole("switch", { name: "展开标注" })).toBeChecked();
    expect(screen.queryByText("难易程度")).not.toBeInTheDocument();
  });

  it("renders source page images in an outer dock with compact page labels", () => {
    window.globalLange = "zh-CN";

    render(
      <PureTaskQuestionEditor
        allGradeList={[{ gradeId: 9, name: "九年级" }]}
        chapterList={[]}
        dispatch={jest.fn()}
        editQuestion={{
          content: "题干",
          draftId: EDIT_QUESTION_ID,
          gradeId: 9,
          questionScore: "4",
          subjectId: 2,
          type: 1,
        }}
        labelList={[]}
        onCancel={jest.fn()}
        onLocalSave={jest.fn()}
        sourceImageAssets={[
          {
            id: "page-5-image-1",
            imageUrl: "https://example.com/page-5-1.png",
            pageNumber: 5,
            title: "第 5 页识别图 1",
          },
          {
            id: "page-5-image-2",
            imageUrl: "https://example.com/page-5-2.png",
            pageNumber: 5,
            title: "第 5 页识别图 2",
          },
        ]}
        subjectList={[{ id: 2, name: "数学" }]}
        treeData={[]}
      />,
    );

    const editorStage = screen.getByTestId("task-question-editor-stage");
    const editorContent = screen.getByTestId("task-question-editor-content");

    expect(within(editorStage).getByText("本页图片 2 张")).toBeVisible();
    expect(within(editorStage).getAllByText("第 5 页").length).toBeGreaterThan(
      0,
    );
    expect(
      within(editorStage).queryByText("第 5 页识别图 1"),
    ).not.toBeInTheDocument();
    expect(
      within(editorStage).queryByText("第 5 页识别图 2"),
    ).not.toBeInTheDocument();
    expect(
      within(editorStage).getByRole("button", {
        name: "插入图片：第 5 页识别图 1",
      }),
    ).toBeVisible();
    expect(
      within(editorContent).queryByTestId("source-image-strip"),
    ).not.toBeInTheDocument();
    expect(within(editorContent).getByTestId("question-block")).toBeVisible();
  });

  it("aligns the source page image dock with the measured toolbar height", async () => {
    const originalGetBoundingClientRect =
      window.HTMLElement.prototype.getBoundingClientRect;
    window.globalLange = "zh-CN";
    window.HTMLElement.prototype.getBoundingClientRect =
      function getBoundingClientRect(event) {
        void event;

        if (this.dataset.questionEditorSharedToolbar) {
          return {
            bottom: 96,
            height: 96,
            left: 0,
            right: 320,
            top: 0,
            width: 320,
          };
        }

        return originalGetBoundingClientRect
          ? originalGetBoundingClientRect.call(this)
          : {
              bottom: 0,
              height: 0,
              left: 0,
              right: 0,
              top: 0,
              width: 0,
            };
      };

    try {
      render(
        <PureTaskQuestionEditor
          allGradeList={[{ gradeId: 9, name: "九年级" }]}
          chapterList={[]}
          dispatch={jest.fn()}
          editQuestion={{
            content: "题干",
            draftId: EDIT_QUESTION_ID,
            gradeId: 9,
            questionScore: "4",
            subjectId: 2,
            type: 1,
          }}
          labelList={[]}
          onCancel={jest.fn()}
          onLocalSave={jest.fn()}
          sourceImageAssets={[
            {
              id: "page-1-image-1",
              imageUrl: "https://example.com/page-1-1.png",
              pageNumber: 1,
              title: "第 1 页识别图 1",
            },
          ]}
          subjectList={[{ id: 2, name: "数学" }]}
          treeData={[]}
        />,
      );

      fireEvent(window, new Event("resize"));

      await waitFor(() => {
        expect(screen.getByTestId("source-image-dock").style.top).toBe("-96px");
      });
    } finally {
      if (originalGetBoundingClientRect) {
        window.HTMLElement.prototype.getBoundingClientRect =
          originalGetBoundingClientRect;
      } else {
        delete window.HTMLElement.prototype.getBoundingClientRect;
      }
    }
  });

  it("collapses and expands source page images", () => {
    window.globalLange = "zh-CN";

    render(
      <PureTaskQuestionEditor
        allGradeList={[{ gradeId: 9, name: "九年级" }]}
        chapterList={[]}
        dispatch={jest.fn()}
        editQuestion={{
          content: "题干",
          draftId: EDIT_QUESTION_ID,
          gradeId: 9,
          questionScore: "4",
          subjectId: 2,
          type: 1,
        }}
        labelList={[]}
        onCancel={jest.fn()}
        onLocalSave={jest.fn()}
        sourceImageAssets={[
          {
            id: "page-1-image-1",
            imageUrl: "https://example.com/page-1-1.png",
            pageNumber: 1,
            title: "第 1 页识别图 1",
          },
        ]}
        subjectList={[{ id: 2, name: "数学" }]}
        treeData={[]}
      />,
    );

    const editorStage = screen.getByTestId("task-question-editor-stage");
    const insertButtonName = "插入图片：第 1 页识别图 1";

    expect(
      within(editorStage).getByRole("button", {
        name: insertButtonName,
      }),
    ).toBeVisible();

    fireEvent.click(
      within(editorStage).getByRole("button", {
        name: "收起本页图片",
      }),
    );

    expect(within(editorStage).getByText("配图1")).toBeVisible();
    expect(
      within(editorStage).queryByText("本页图片 1 张"),
    ).not.toBeInTheDocument();
    expect(within(editorStage).queryByText("第 1 页")).not.toBeInTheDocument();
    expect(
      within(editorStage).getByRole("button", {
        name: "展开本页图片",
      }),
    ).toBeVisible();
    expect(
      within(editorStage).queryByRole("button", {
        name: insertButtonName,
      }),
    ).not.toBeInTheDocument();

    fireEvent.click(
      within(editorStage).getByRole("button", {
        name: "展开本页图片",
      }),
    );

    expect(
      within(editorStage).getByRole("button", {
        name: insertButtonName,
      }),
    ).toBeVisible();
  });

  it("navigates questions from keyboard shortcuts without hijacking text editing arrows", () => {
    const handleNavigateQuestion = jest.fn();
    const handleLocalSave = jest.fn();
    window.globalLange = "zh-CN";

    render(
      <PureTaskQuestionEditor
        allGradeList={[{ gradeId: 9, name: "九年级" }]}
        chapterList={[]}
        dispatch={jest.fn()}
        editQuestion={{
          content: "题干",
          draftId: EDIT_QUESTION_ID,
          gradeId: 9,
          questionScore: "4",
          subjectId: 2,
          type: 5,
        }}
        hasNextQuestion
        hasPreviousQuestion
        labelList={[]}
        onCancel={jest.fn()}
        onLocalSave={handleLocalSave}
        onNavigateQuestion={handleNavigateQuestion}
        subjectList={[{ id: 2, name: "数学" }]}
        treeData={[]}
      />,
    );

    fireEvent.keyDown(screen.getByTestId("question-block"), {
      key: "ArrowDown",
    });
    expect(handleNavigateQuestion).toHaveBeenCalledWith(
      "next",
      expect.objectContaining({
        draft: expect.objectContaining({ content: "题干" }),
      }),
    );

    fireEvent.keyDown(screen.getByLabelText(`${EDIT_QUESTION_ID}-content`), {
      key: "ArrowUp",
    });
    expect(handleNavigateQuestion).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(
      screen.getByLabelText(`${EDIT_QUESTION_ID}-rich-content`),
      {
        key: "ArrowDown",
      },
    );
    expect(handleNavigateQuestion).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(screen.getByLabelText(`${EDIT_QUESTION_ID}-content`), {
      altKey: true,
      key: "ArrowUp",
    });
    expect(handleNavigateQuestion).toHaveBeenLastCalledWith(
      "previous",
      expect.any(Object),
    );
    expect(handleLocalSave).not.toHaveBeenCalled();
  });

  it("scrolls to the requested sub-question when editing a group question", () => {
    const originalScrollIntoView = window.HTMLElement.prototype.scrollIntoView;
    const scrollIntoView = jest.fn();
    window.globalLange = "zh-CN";
    window.HTMLElement.prototype.scrollIntoView = scrollIntoView;

    try {
      render(
        <PureTaskQuestionEditor
          allGradeList={[{ gradeId: 9, name: "九年级" }]}
          chapterList={[]}
          dispatch={jest.fn()}
          editQuestion={{
            content: "组合题",
            draftId: EDIT_QUESTION_ID,
            gradeId: 9,
            questionScore: "8",
            sonQuestionList: [{ content: "一" }, { content: "二" }],
            subjectId: 2,
            type: 6,
          }}
          labelList={[]}
          onCancel={jest.fn()}
          onLocalSave={jest.fn()}
          subjectList={[{ id: 2, name: "数学" }]}
          targetSubQuestionIndex={1}
          treeData={[]}
        />,
      );

      expect(scrollIntoView).toHaveBeenCalledWith({
        behavior: "smooth",
        block: "center",
      });
    } finally {
      if (originalScrollIntoView) {
        window.HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
      } else {
        delete window.HTMLElement.prototype.scrollIntoView;
      }
    }
  });

  it("shows progress and saves directly into the next question", () => {
    const handleSaveAndNext = jest.fn();
    window.globalLange = "zh-CN";

    render(
      <PureTaskQuestionEditor
        allGradeList={[{ gradeId: 9, name: "九年级" }]}
        chapterList={[]}
        dispatch={jest.fn()}
        editQuestion={{
          content: "题干",
          draftId: EDIT_QUESTION_ID,
          gradeId: 9,
          questionScore: "4",
          subjectId: 2,
          type: 5,
        }}
        hasNextQuestion
        labelList={[]}
        onCancel={jest.fn()}
        onLocalSave={jest.fn()}
        onSaveAndNext={handleSaveAndNext}
        questionPosition={1}
        subjectList={[{ id: 2, name: "数学" }]}
        totalQuestionCount={26}
        treeData={[]}
      />,
    );

    expect(screen.getByText("第 1 / 26 题")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "保存并下一题" }));

    expect(handleSaveAndNext).toHaveBeenCalledWith({
      draft: expect.objectContaining({
        content: "题干",
        gradeId: 9,
        subjectId: 2,
      }),
    });
  });

  it("inserts a source page image into the active rich text editor", () => {
    const insertImage = jest.fn();
    window.globalLange = "zh-CN";

    render(
      <PageImageAssetPicker
        activeEditorController={{ insertImage }}
        onCollapsedChange={jest.fn()}
        sourceImageAssets={[
          {
            height: 80,
            id: "page-1-image",
            imageUrl: "https://example.com/page-1.png",
            pageNumber: 1,
            title: "第1页 第4题 图1",
            width: 120,
          },
        ]}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "插入图片：第1页 第4题 图1" }),
    );

    expect(insertImage).toHaveBeenCalledWith(
      "https://example.com/page-1.png",
      "第1页 第4题 图1",
      {
        height: 80,
        width: 120,
      },
    );
  });
});
