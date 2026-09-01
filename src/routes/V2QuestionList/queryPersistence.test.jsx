import React from "react";

import {
  batchQueryNewMyBusinessQuestionTypes,
  queryNewMyQuestionPage,
} from "../../services/newMyQuestion";
import {
  stageSubjectList,
  teachingMaterialAndGradeList,
} from "../../services/qustion";
import { V2QuestionList } from "./index";
import {
  normalizeV2QuestionListQueryContext,
  readV2QuestionListQuerySession,
  saveV2QuestionListQuerySession,
} from "./questionListQuerySession";

jest.mock("../../services/global", () => ({
  updateQuestionChapter: jest.fn(),
  updateQuestionIndicator: jest.fn(),
}));
jest.mock("../../services/inputQuestion", () => ({
  queryChapter: jest.fn(),
  queryLabel: jest.fn(),
  queryTree: jest.fn(),
}));
jest.mock("../../services/newMyQuestion", () => ({
  batchQueryNewMyBusinessQuestionTypes: jest.fn(),
  queryEnabledNewMyBusinessQuestionTypes: jest.fn(),
  queryNewMyQuestionPage: jest.fn(),
}));
jest.mock("../../services/questionV2", () => ({
  bindQuestionV2Basket: jest.fn(),
  deleteQuestionV2Resource: jest.fn(),
  unbindQuestionV2Basket: jest.fn(),
}));
jest.mock("../../services/qustion", () => ({
  stageSubjectList: jest.fn(),
  teachingMaterialAndGradeList: jest.fn(),
}));

const createPage = () => {
  const page = new V2QuestionList({
    basketList: [],
    dispatch: jest.fn(),
    history: { push: jest.fn() },
    match: { params: {} },
  });
  page.setState = jest.fn((update) => {
    const nextState =
      typeof update === "function" ? update(page.state) : update;
    page.state = { ...page.state, ...nextState };
  });
  return page;
};

const savedQueryContext = normalizeV2QuestionListQueryContext({
  businessQuestionTypeIds: [3],
  chapterGradeId: 25,
  chapterIds: ["chapter-1"],
  gradeIds: [25],
  keyword: "面积",
  knowledgeIds: ["knowledge-1", "knowledge-2"],
  knowledgeMultiple: true,
  levels: [2],
  limit: 50,
  pageNo: 4,
  stageId: 2,
  subjectId: 13,
  tabKey: 2,
  teachingMaterialId: 7,
});

describe("V2QuestionList query persistence", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.sessionStorage.clear();
    queryNewMyQuestionPage.mockResolvedValue({
      content: { data: [], total: 0 },
      ifLogin: true,
      status: true,
    });
    batchQueryNewMyBusinessQuestionTypes.mockResolvedValue({
      content: [],
      ifLogin: true,
      status: true,
    });
  });

  it("saves the applied query and restores it in a new page instance", async () => {
    const page = createPage();
    page.state = {
      ...page.state,
      businessQuestionTypeIds: [3],
      checkKnowledgeIds: ["knowledge-1", "knowledge-2"],
      gradeIds: [25],
      knowledgeMultiple: true,
      levels: [2],
      stage: { stageId: 2 },
      subject: { id: 13 },
      tabKey: 2,
    };

    await page.getPage({ keyword: "面积", limit: 50, pageNo: 4 });

    expect(queryNewMyQuestionPage).toHaveBeenCalledWith({
      businessQuestionTypeIds: [3],
      gradeIds: [25],
      keyword: "面积",
      knowledgeIds: ["knowledge-1", "knowledge-2"],
      levels: [2],
      limit: 50,
      pageNo: 4,
      subjectIds: [13],
    });
    expect(readV2QuestionListQuerySession()).toMatchObject({
      keyword: "面积",
      knowledgeIds: ["knowledge-1", "knowledge-2"],
      limit: 50,
      pageNo: 4,
    });

    const restoredPage = createPage();
    expect(restoredPage.pageNo).toBe(4);
    expect(restoredPage.limit).toBe(50);
    expect(restoredPage.state).toMatchObject({
      businessQuestionTypeIds: [3],
      checkKnowledgeIds: ["knowledge-1", "knowledge-2"],
      keyword: "面积",
      knowledgeMultiple: true,
      levels: [2],
      tabKey: 2,
    });
  });

  it("保持题型和年级组合符合后端查询契约", () => {
    const page = createPage();
    page.getPage = jest.fn();
    page.state.gradeIds = [];
    page.state.tabKey = 2;

    page.quTypeChange({ code: 3 });

    expect(page.state.businessQuestionTypeIds).toEqual([]);
    expect(page.getPage).not.toHaveBeenCalled();

    page.state.gradeIds = [25];
    page.quTypeChange({ code: 3 });

    expect(page.state.businessQuestionTypeIds).toEqual([3]);
    expect(page.getPage).toHaveBeenCalledWith({
      businessQuestionTypeIds: [3],
      pageNo: 1,
    });

    page.gradeChange({ gradeId: -1 });

    expect(page.state.gradeIds).toEqual([25]);
    expect(page.getPage).toHaveBeenCalledTimes(1);
  });

  it("切回章节视图后使用章节年级校验题型", () => {
    const page = createPage();
    page.getPage = jest.fn();
    page.state.gradeIds = [];
    page.state.selectGrade = { gradeId: 25 };
    page.state.tabKey = 2;

    page.treeTypeChange(1);
    page.quTypeChange({ code: 3 });

    expect(page.state.businessQuestionTypeIds).toEqual([3]);
    expect(page.getPage).toHaveBeenLastCalledWith({
      businessQuestionTypeIds: [3],
      pageNo: 1,
    });

    page.treeTypeChange(2);

    expect(page.state.businessQuestionTypeIds).toEqual([]);
    expect(page.getPage).toHaveBeenLastCalledWith({
      businessQuestionTypeIds: [],
      tabKey: 2,
    });
  });

  it("restores current catalog objects before loading the saved query", async () => {
    saveV2QuestionListQuerySession(savedQueryContext);
    const page = createPage();
    const stage = {
      stageId: 2,
      stageName: "小学",
      subjectList: [{ id: 13, name: "数学" }],
    };
    stageSubjectList.mockResolvedValue({
      content: [stage],
      ifLogin: true,
      status: true,
    });
    page.getQuestionTypeOptions = jest.fn();
    page.getTeachingMaterialAndGradeList = jest.fn();
    page.getKnowledgeTree = jest.fn();

    await page.getStageSubjectlist();

    expect(page.state.stage).toBe(stage);
    expect(page.state.subject).toBe(stage.subjectList[0]);
    expect(page.getTeachingMaterialAndGradeList).toHaveBeenCalledWith({
      queryContext: savedQueryContext,
      stageId: 2,
      subject: stage.subjectList[0],
    });
  });

  it("falls back to current teaching options and clears dependent filters", async () => {
    saveV2QuestionListQuerySession(savedQueryContext);
    const page = createPage();
    const subject = { id: 14, name: "语文" };
    const stage = { stageId: 3, stageName: "初中", subjectList: [subject] };
    stageSubjectList.mockResolvedValue({
      content: [stage],
      ifLogin: true,
      status: true,
    });
    page.getQuestionTypeOptions = jest.fn();
    page.getTeachingMaterialAndGradeList = jest.fn();
    page.getKnowledgeTree = jest.fn();

    await page.getStageSubjectlist();

    expect(page.pageNo).toBe(1);
    expect(page.state).toMatchObject({
      businessQuestionTypeIds: [],
      chapterIds: [],
      checkKnowledgeIds: [],
      gradeIds: [],
      knowledgeIds: [],
    });
    expect(page.getTeachingMaterialAndGradeList).toHaveBeenCalledWith({
      queryContext: expect.objectContaining({
        businessQuestionTypeIds: [],
        chapterIds: [],
        gradeIds: [],
        knowledgeIds: [],
        pageNo: 1,
        stageId: 3,
        subjectId: 14,
      }),
      stageId: 3,
      subject,
    });
  });

  it("restores material and grade objects and drops unavailable grade ids", async () => {
    const page = createPage();
    page.state.stage = { stageId: 2 };
    page.state.subject = { id: 13 };
    page.getChapterTree = jest.fn();
    page.getPage = jest.fn();
    teachingMaterialAndGradeList.mockResolvedValue({
      content: {
        gradeList: [
          { gradeId: 24, name: "四年级" },
          { gradeId: 25, name: "五年级" },
        ],
        teachingList: [
          { id: 6, name: "旧版" },
          { id: 7, name: "新版" },
        ],
      },
      ifLogin: true,
      status: true,
    });
    const queryContext = {
      ...savedQueryContext,
      gradeIds: [25, 99],
    };

    await page.getTeachingMaterialAndGradeList({
      queryContext,
      stageId: 2,
      subject: page.state.subject,
    });

    expect(page.state.teachingMaterial).toEqual({ id: 7, name: "新版" });
    expect(page.state.selectGrade).toEqual({ gradeId: 25, name: "五年级" });
    expect(page.state.gradeIds).toEqual([25]);
    expect(page.state.chapterIds).toEqual(["chapter-1"]);
    expect(page.getPage).toHaveBeenCalledWith(
      expect.objectContaining({
        chapterGradeId: 25,
        chapterIds: ["chapter-1"],
        gradeIds: [25],
        teachingMaterialId: 7,
      }),
    );
  });

  it("passes cleared chapters through the query boundary before setState flushes", () => {
    const page = createPage();
    page.state = {
      ...page.state,
      chapterIds: ["old-chapter"],
      selectGrade: { gradeId: 24 },
      subject: { id: 13 },
      teachingMaterial: { id: 6 },
    };
    page.setState = jest.fn();
    page.getChapterTree = jest.fn();
    page.getPage = jest.fn();

    page.gradeAndTextbookChange({ id: 7 }, "textbook");

    expect(page.getPage).toHaveBeenCalledWith({
      chapterGradeId: 24,
      chapterIds: [],
      gradeIds: [24],
      teachingMaterialId: 7,
    });
  });

  it("renders the restored keyword in the search control", () => {
    saveV2QuestionListQuerySession(savedQueryContext);
    const page = createPage();
    const searchElements = [];
    const visit = (value) => {
      if (!React.isValidElement(value)) return;
      if (value.props.defaultValue === "面积") searchElements.push(value);
      React.Children.forEach(value.props.children, visit);
    };

    visit(page.render());

    expect(searchElements).toHaveLength(1);
  });
});
