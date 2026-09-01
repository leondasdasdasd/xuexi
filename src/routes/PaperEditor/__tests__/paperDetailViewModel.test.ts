import { createPaperEditorDraftFromDetail } from "../paperEditorDetailModel";
import { loadPaperEditorDetailSource } from "../paperEditorService";
import {
  getPaperEditDisabledMessage,
  loadPaperDetailViewModel,
} from "../paperDetailViewModel";

jest.mock("../paperEditorDetailModel", () => ({
  createPaperEditorDraftFromDetail: jest.fn(),
}));
jest.mock("../paperEditorService", () => ({
  loadPaperEditorDetailSource: jest.fn(),
}));

const createDraftMock = createPaperEditorDraftFromDetail as jest.Mock;
const loadSourceMock = loadPaperEditorDetailSource as jest.Mock;

describe("paper detail view model", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("maps the V2 source through the shared detail boundary", async () => {
    const source = {
      detail: {
        capabilities: {
          copy: false,
          delete: false,
          update: false,
          updateDisabledReasonCode: "PAPER_PERMISSION_REQUIRED",
        },
        content: { moduleList: [] },
        gradeId: 7,
        gradeName: "七年级",
        id: 99,
        paperTypeCode: 1,
        subjectId: 2,
        title: "期中试卷",
        totalScore: 0,
      },
      grades: [{ gradeId: 7, name: "七年级" }],
      paperTypes: [{ code: 1, typeName: "课堂小测" }],
      questionTypes: [],
      subjects: [{ name: "数学", subjectId: 2 }],
    };
    const draft = {
      gradeName: "七年级",
      modules: [],
      paperId: 99,
      questionTypeTemplates: [],
      subjectName: "数学",
      title: "期中试卷",
    };
    loadSourceMock.mockResolvedValue(source);
    createDraftMock.mockReturnValue(draft);

    const result = await loadPaperDetailViewModel(99, "zh-CN");

    expect(loadSourceMock).toHaveBeenCalledWith(99);
    expect(createDraftMock).toHaveBeenCalledWith(
      source.detail,
      source.questionTypes,
      source.grades,
      source.subjects,
      "zh-CN",
    );
    expect(result).toEqual({
      draft,
      grades: source.grades,
      paperTypes: source.paperTypes,
      subjects: source.subjects,
      updateAllowed: false,
      updateDisabledReasonCode: "PAPER_PERMISSION_REQUIRED",
    });
  });

  it("maps edit-disabled reason codes to localized messages with a fallback", () => {
    Reflect.set(window, "globalLange", "zh-CN");
    expect(getPaperEditDisabledMessage("PAPER_CONTENT_FROZEN")).toBe(
      "该试卷内容已固化，当前不能直接编辑；如需调整，请复制试卷后编辑",
    );
    expect(getPaperEditDisabledMessage("PAPER_PERMISSION_REQUIRED")).toBe(
      "仅试卷创建人或拥有对应年级、学科管理权限的老师可编辑",
    );
    expect(
      getPaperEditDisabledMessage("ENROLLMENT_PAPER_PERMISSION_REQUIRED"),
    ).toBe("仅试卷创建人或拥有招生试卷管理权限的老师可编辑");
    expect(getPaperEditDisabledMessage()).toBe(
      "当前账号无试卷编辑权限，已切换为预览模式",
    );
    expect(getPaperEditDisabledMessage("UNKNOWN_REASON" as never)).toBe(
      "当前账号无试卷编辑权限，已切换为预览模式",
    );
  });

  it("maps edit-disabled reasons to English", () => {
    Reflect.set(window, "globalLange", "en-US");

    expect(getPaperEditDisabledMessage("PAPER_CONTENT_FROZEN")).toBe(
      "This paper's content is frozen and cannot be edited directly. Make a copy to make changes.",
    );
  });

  it("preserves loader failures for the page boundary", async () => {
    const error = new Error("detail failed");
    loadSourceMock.mockRejectedValueOnce(error);

    await expect(loadPaperDetailViewModel(99, "en-US")).rejects.toBe(error);
  });
});
