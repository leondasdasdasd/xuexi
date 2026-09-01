import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import React from "react";

import {
  loadPaperQuestionLibraryPage,
  loadPaperQuestionLibraryTypes,
} from "../paperQuestionLibraryService";
import PaperQuestionLibraryModal from "./PaperQuestionLibraryModal";

jest.mock("../paperQuestionLibraryService", () => ({
  loadPaperQuestionLibraryPage: jest.fn(),
  loadPaperQuestionLibraryTypes: jest.fn(),
}));
jest.mock("../questionAssetPaperAdapter", () => ({
  createPaperQuestionAssetResult: jest.fn((aggregate) => ({
    question: { questionId: aggregate.question.id },
  })),
}));
jest.mock("../../../components/QuestionPreviewContent", () => () => (
  <div>题目预览</div>
));

const page = {
  items: [
    {
      question: {
        id: 99,
        businessQuestionTypeId: 101,
        children: [],
      },
    },
    {
      question: {
        id: 100,
        businessQuestionTypeId: 101,
        children: [],
      },
    },
  ],
  questionTypes: [{ businessQuestionTypeId: 101 }],
  questionTypesById: { 101: { businessQuestionTypeId: 101 } },
  total: 2,
};

const questionTypes = [
  { businessQuestionTypeId: 101, name: "单选题" },
  { businessQuestionTypeId: 102, name: "填空题" },
];

const createDeferredPage = () => {
  let resolve!: (value: typeof page) => void;
  const promise = new Promise<typeof page>((nextResolve) => {
    resolve = nextResolve;
  });
  return { promise, resolve };
};

describe("PaperQuestionLibraryModal", () => {
  beforeEach(() => {
    (window as Window & { globalLange?: string }).globalLange = "zh-CN";
    jest.clearAllMocks();
    (loadPaperQuestionLibraryPage as jest.Mock).mockResolvedValue(page);
    (loadPaperQuestionLibraryTypes as jest.Mock).mockResolvedValue(
      questionTypes,
    );
  });

  it("uses the preferred type and prevents duplicate selection", async () => {
    const onConfirm = jest.fn();
    render(
      <PaperQuestionLibraryModal
        excludedQuestionIds={[100]}
        gradeOptions={[
          { gradeId: 7, name: "七年级", stageId: 2 },
          { gradeId: 8, name: "八年级", stageId: 2 },
        ]}
        initialGradeId={7}
        initialSubjectId={2}
        locale="zh-CN"
        onCancel={jest.fn()}
        onConfirm={onConfirm}
        initialQuestionTypeKey={101}
        subjectOptions={[
          { name: "数学", subjectId: 2 },
          { name: "英语", subjectId: 3 },
        ]}
        visible
      />,
    );

    await screen.findAllByText("题目预览");
    expect(loadPaperQuestionLibraryPage).toHaveBeenCalledWith({
      gradeId: 7,
      keyword: "",
      limit: 10,
      pageNo: 1,
      questionTypeKey: 101,
      subjectId: 2,
    });
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes[1]).toBeDisabled();
    fireEvent.click(checkboxes[0]);
    fireEvent.click(
      screen.getByRole("button", {
        name: /添加所选题目|Add selected questions/,
      }),
    );

    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
    expect(onConfirm.mock.calls[0][0]).toEqual([
      expect.objectContaining({ question: { questionId: 99 } }),
    ]);
  });

  it("falls back to the first enabled type when the module has no usable type", async () => {
    render(
      <PaperQuestionLibraryModal
        excludedQuestionIds={[]}
        gradeOptions={[{ gradeId: 7, name: "七年级", stageId: 2 }]}
        initialGradeId={7}
        initialQuestionTypeKey={999}
        initialSubjectId={2}
        locale="zh-CN"
        onCancel={jest.fn()}
        onConfirm={jest.fn()}
        subjectOptions={[{ name: "数学", subjectId: 2 }]}
        visible
      />,
    );

    await waitFor(() =>
      expect(loadPaperQuestionLibraryPage).toHaveBeenCalledWith(
        expect.objectContaining({ questionTypeKey: 101 }),
      ),
    );
  });

  it("switches question types, clears selection, and preserves the keyword", async () => {
    render(
      <PaperQuestionLibraryModal
        excludedQuestionIds={[]}
        gradeOptions={[{ gradeId: 7, name: "七年级", stageId: 2 }]}
        initialGradeId={7}
        initialQuestionTypeKey={101}
        initialSubjectId={2}
        locale="zh-CN"
        onCancel={jest.fn()}
        onConfirm={jest.fn()}
        subjectOptions={[{ name: "数学", subjectId: 2 }]}
        visible
      />,
    );

    await screen.findAllByText("题目预览");
    fireEvent.click(screen.getAllByRole("checkbox")[0]);
    const keyword = screen.getByRole("textbox", {
      name: /题目关键词|Question keyword/,
    });
    fireEvent.change(keyword, { target: { value: "面积" } });
    fireEvent.click(screen.getByRole("button", { name: /搜\s*题|Search/ }));

    fireEvent.click(screen.getByRole("combobox", { name: /题型|type/i }));
    fireEvent.click(await screen.findByText("填空题"));

    expect(keyword).toHaveValue("面积");
    expect(screen.getByText(/已选择 0 题|0 selected/)).toBeVisible();
    await waitFor(() =>
      expect(loadPaperQuestionLibraryPage).toHaveBeenLastCalledWith({
        gradeId: 7,
        keyword: "面积",
        limit: 10,
        pageNo: 1,
        questionTypeKey: 102,
        subjectId: 2,
      }),
    );
  });

  it("ignores a late page response from the previous question type", async () => {
    const firstRequest = createDeferredPage();
    const secondRequest = createDeferredPage();
    (loadPaperQuestionLibraryPage as jest.Mock)
      .mockImplementationOnce(() => firstRequest.promise)
      .mockImplementationOnce(() => secondRequest.promise);
    render(
      <PaperQuestionLibraryModal
        excludedQuestionIds={[]}
        gradeOptions={[{ gradeId: 7, name: "七年级", stageId: 2 }]}
        initialGradeId={7}
        initialQuestionTypeKey={101}
        initialSubjectId={2}
        locale="zh-CN"
        onCancel={jest.fn()}
        onConfirm={jest.fn()}
        subjectOptions={[{ name: "数学", subjectId: 2 }]}
        visible
      />,
    );
    await waitFor(() =>
      expect(loadPaperQuestionLibraryPage).toHaveBeenCalledTimes(1),
    );

    fireEvent.click(screen.getByRole("combobox", { name: /题型|type/i }));
    fireEvent.click(await screen.findByText("填空题"));
    await waitFor(() =>
      expect(loadPaperQuestionLibraryPage).toHaveBeenCalledTimes(2),
    );

    await act(async () => {
      secondRequest.resolve({ ...page, items: [], total: 0 });
    });
    expect(
      await screen.findByText(/没有符合条件的题目|No matching questions found/),
    ).toBeVisible();

    await act(async () => {
      firstRequest.resolve(page);
    });
    expect(screen.queryByText("题目预览")).not.toBeInTheDocument();
  });

  it("keeps the modal open and exposes retry when loading fails", async () => {
    (loadPaperQuestionLibraryPage as jest.Mock).mockRejectedValue(
      new Error("题库不可用"),
    );
    render(
      <PaperQuestionLibraryModal
        excludedQuestionIds={[]}
        gradeOptions={[{ gradeId: 7, name: "七年级", stageId: 2 }]}
        initialGradeId={7}
        initialSubjectId={2}
        locale="zh-CN"
        onCancel={jest.fn()}
        onConfirm={jest.fn()}
        initialQuestionTypeKey={101}
        subjectOptions={[{ name: "数学", subjectId: 2 }]}
        visible
      />,
    );

    expect(await screen.findByText("题库不可用")).toBeVisible();
    expect(
      screen.getByRole("dialog", {
        name: /从题库添加题目|Add questions from the library/,
      }),
    ).toBeVisible();
    fireEvent.click(
      screen.getByRole("button", { name: /重新作答|重试|Retry/ }),
    );
    await waitFor(() =>
      expect(loadPaperQuestionLibraryPage).toHaveBeenCalledTimes(2),
    );
  });

  it("waits for a complete scope and queries the user-selected filters", async () => {
    render(
      <PaperQuestionLibraryModal
        excludedQuestionIds={[]}
        gradeOptions={[
          { gradeId: 7, name: "七年级", stageId: 2 },
          { gradeId: 8, name: "八年级", stageId: 2 },
        ]}
        locale="zh-CN"
        onCancel={jest.fn()}
        onConfirm={jest.fn()}
        initialQuestionTypeKey={101}
        subjectOptions={[
          { name: "数学", subjectId: 2 },
          { name: "英语", subjectId: 3 },
        ]}
        visible
      />,
    );

    expect(loadPaperQuestionLibraryPage).not.toHaveBeenCalled();
    expect(
      screen.getByText(
        /请选择年级和学科后查看题目|Select a grade and subject to browse questions/,
      ),
    ).toBeVisible();

    fireEvent.click(screen.getByRole("combobox", { name: /年级|Grade/ }));
    fireEvent.click(await screen.findByText("八年级"));
    expect(loadPaperQuestionLibraryPage).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("combobox", { name: /学科|Subject/ }));
    fireEvent.click(await screen.findByText("英语"));

    await waitFor(() =>
      expect(loadPaperQuestionLibraryPage).toHaveBeenCalledWith({
        gradeId: 8,
        keyword: "",
        limit: 10,
        pageNo: 1,
        questionTypeKey: 101,
        subjectId: 3,
      }),
    );
  });

  it("ignores a late response after switching scope", async () => {
    const firstRequest = createDeferredPage();
    const secondRequest = createDeferredPage();
    (loadPaperQuestionLibraryPage as jest.Mock)
      .mockImplementationOnce(() => firstRequest.promise)
      .mockImplementationOnce(() => secondRequest.promise);
    render(
      <PaperQuestionLibraryModal
        excludedQuestionIds={[]}
        gradeOptions={[
          { gradeId: 7, name: "七年级", stageId: 2 },
          { gradeId: 8, name: "八年级", stageId: 2 },
        ]}
        initialGradeId={7}
        initialSubjectId={2}
        locale="zh-CN"
        onCancel={jest.fn()}
        onConfirm={jest.fn()}
        initialQuestionTypeKey={101}
        subjectOptions={[{ name: "数学", subjectId: 2 }]}
        visible
      />,
    );
    await waitFor(() =>
      expect(loadPaperQuestionLibraryPage).toHaveBeenCalledTimes(1),
    );

    fireEvent.click(screen.getByRole("combobox", { name: /年级|Grade/ }));
    fireEvent.click(await screen.findByText("八年级"));
    await waitFor(() =>
      expect(loadPaperQuestionLibraryPage).toHaveBeenCalledTimes(2),
    );

    await act(async () => {
      secondRequest.resolve({ ...page, items: [], total: 0 });
    });
    expect(
      await screen.findByText(/没有符合条件的题目|No matching questions found/),
    ).toBeVisible();

    await act(async () => {
      firstRequest.resolve(page);
    });
    expect(screen.queryByText("题目预览")).not.toBeInTheDocument();
  });

  it("resets the complete query transaction after switching scope", async () => {
    const nextScopeRequest = createDeferredPage();
    (loadPaperQuestionLibraryPage as jest.Mock).mockResolvedValue({
      ...page,
      total: 12,
    });
    render(
      <PaperQuestionLibraryModal
        excludedQuestionIds={[]}
        gradeOptions={[
          { gradeId: 7, name: "七年级", stageId: 2 },
          { gradeId: 8, name: "八年级", stageId: 2 },
        ]}
        initialGradeId={7}
        initialSubjectId={2}
        locale="zh-CN"
        onCancel={jest.fn()}
        onConfirm={jest.fn()}
        initialQuestionTypeKey={101}
        subjectOptions={[{ name: "数学", subjectId: 2 }]}
        visible
      />,
    );

    await screen.findAllByText("题目预览");
    fireEvent.click(screen.getAllByRole("checkbox")[0]);
    expect(screen.getByText(/已选择 1 题|1 selected/)).toBeVisible();

    const keyword = screen.getByRole("textbox", {
      name: /题目关键词|Question keyword/,
    });
    fireEvent.change(keyword, { target: { value: "分数" } });
    fireEvent.click(screen.getByRole("button", { name: /搜\s*题|Search/ }));
    await waitFor(() =>
      expect(loadPaperQuestionLibraryPage).toHaveBeenLastCalledWith(
        expect.objectContaining({ keyword: "分数", pageNo: 1 }),
      ),
    );

    expect(screen.getByTitle("2").closest(".ant-modal-footer")).not.toBeNull();
    fireEvent.click(screen.getByTitle("2"));
    await waitFor(() =>
      expect(loadPaperQuestionLibraryPage).toHaveBeenLastCalledWith(
        expect.objectContaining({ keyword: "分数", pageNo: 2 }),
      ),
    );

    (loadPaperQuestionLibraryPage as jest.Mock).mockImplementationOnce(
      () => nextScopeRequest.promise,
    );
    fireEvent.click(screen.getByRole("combobox", { name: /年级|Grade/ }));
    fireEvent.click(await screen.findByText("八年级"));

    expect(keyword).toHaveValue("");
    expect(screen.getByText(/已选择 0 题|0 selected/)).toBeVisible();
    expect(screen.queryByText("题目预览")).not.toBeInTheDocument();
    await waitFor(() =>
      expect(loadPaperQuestionLibraryPage).toHaveBeenLastCalledWith({
        gradeId: 8,
        keyword: "",
        limit: 10,
        pageNo: 1,
        questionTypeKey: 101,
        subjectId: 2,
      }),
    );
  });
});
