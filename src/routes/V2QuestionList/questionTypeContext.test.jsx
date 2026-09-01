import { queryEnabledNewMyBusinessQuestionTypes } from "../../services/newMyQuestion";
import { stageSubjectList } from "../../services/qustion";
import { V2QuestionList } from "./index";

jest.mock("../../services/global", () => ({
  addToBasket: jest.fn(),
  cancelToBasket: jest.fn(),
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
  deleteQuestionV2Resource: jest.fn(),
}));
jest.mock("../../services/qustion", () => ({
  stageSubjectList: jest.fn(),
  teachingMaterialAndGradeList: jest.fn(),
}));
jest.mock("../../utils/utils", () => ({
  ...jest.requireActual("../../utils/utils"),
  loginRedirect: jest.fn(),
}));

const createPage = () => {
  const page = new V2QuestionList({
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

const deferred = () => {
  let resolve;
  const promise = new Promise((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
};

const successResponse = (id, name) => ({
  content: [{ businessQuestionTypeId: id, name }],
  ifLogin: true,
  status: true,
});

describe("V2QuestionList question type teaching context", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("waits for the teaching context instead of querying all types on mount", async () => {
    const page = createPage();
    page.getStageSubjectlist = jest.fn();
    page.getQuestionTypeOptions = jest.fn();

    await page.componentDidMount();

    expect(page.getStageSubjectlist).toHaveBeenCalledTimes(1);
    expect(page.getQuestionTypeOptions).not.toHaveBeenCalled();
  });

  it("loads type options after the default stage and subject are known", async () => {
    const page = createPage();
    const subject = { id: 13, name: "语文" };
    page.getQuestionTypeOptions = jest.fn();
    page.getTeachingMaterialAndGradeList = jest.fn();
    page.getKnowledgeTree = jest.fn();
    stageSubjectList.mockResolvedValue({
      content: [{ stageId: 2, stageName: "小学", subjectList: [subject] }],
      ifLogin: true,
      status: true,
    });

    await page.getStageSubjectlist();

    expect(page.getQuestionTypeOptions).toHaveBeenCalledWith({
      stageId: 2,
      subjectId: 13,
    });
    expect(page.getTeachingMaterialAndGradeList).toHaveBeenCalledWith({
      stageId: 2,
      subject,
    });
  });

  it("does not reload type options when the grade changes within a stage", () => {
    const page = createPage();
    page.state.subject = { id: 13, name: "语文" };
    page.state.teachingMaterial = { id: 1, name: "浙教版" };
    page.state.selectGrade = { gradeId: 8, gradeName: "一年级" };
    page.getChapterTree = jest.fn();
    page.getPage = jest.fn();
    page.getQuestionTypeOptions = jest.fn();

    page.gradeAndTextbookChange({ gradeId: 12, gradeName: "五年级" }, "grade");

    expect(page.getQuestionTypeOptions).not.toHaveBeenCalled();
  });

  it("keeps only the latest teaching context response", async () => {
    const page = createPage();
    const first = deferred();
    const second = deferred();
    queryEnabledNewMyBusinessQuestionTypes
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);

    const firstRequest = page.getQuestionTypeOptions({
      stageId: 2,
      subjectId: 13,
    });
    const secondRequest = page.getQuestionTypeOptions({
      stageId: 2,
      subjectId: 14,
    });
    second.resolve(successResponse(2, "新上下文题型"));
    await secondRequest;
    first.resolve(successResponse(1, "旧上下文题型"));
    await firstRequest;

    expect(queryEnabledNewMyBusinessQuestionTypes).toHaveBeenNthCalledWith(1, {
      stageId: 2,
      subjectId: 13,
    });
    expect(queryEnabledNewMyBusinessQuestionTypes).toHaveBeenNthCalledWith(2, {
      stageId: 2,
      subjectId: 14,
    });
    expect(page.state.questionTypeOptions).toEqual([
      { code: 2, typeName: "新上下文题型" },
    ]);
  });

  it("clears the selected type when the stage or subject changes", () => {
    const page = createPage();
    const subject = { id: 14, name: "数学" };
    const stage = { stageId: 2, stageName: "小学" };
    page.state.businessQuestionTypeIds = [99];
    page.state.questionTypeOptions = [{ code: 99, typeName: "旧题型" }];
    page.getQuestionTypeOptions = jest.fn();
    page.getTeachingMaterialAndGradeList = jest.fn();
    page.getKnowledgeTree = jest.fn();

    page.stageSubjectChange(subject, stage);

    expect(page.state.businessQuestionTypeIds).toEqual([]);
    expect(page.state.questionTypeOptions).toEqual([]);
    expect(page.getTeachingMaterialAndGradeList).toHaveBeenCalledWith({
      stageId: 2,
      subject,
    });
    expect(page.getQuestionTypeOptions).toHaveBeenCalledWith({
      stageId: 2,
      subjectId: 14,
    });
  });
});
