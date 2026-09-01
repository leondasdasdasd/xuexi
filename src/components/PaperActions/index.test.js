import {
  downloadPaperByType,
  getAiRecognitionActionDefinition,
  getAiRecognitionActionHandler,
  getAiRecognitionStatus,
  getSourcePaperActionStyles,
} from "./index";
import { downloadExamPaperPdf } from "../../routes/PaperEditor/paperPdf";

jest.mock("../../routes/PaperEditor/paperPdf", () => ({
  downloadExamPaperPdf: jest.fn(),
}));

describe("PaperActions helpers", () => {
  beforeEach(() => {
    jest.spyOn(window, "open").mockImplementation(jest.fn());
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it("marks ai recognition as unavailable when the original paper is missing", () => {
    expect(
      getAiRecognitionStatus({
        hasUploadFile: false,
        aiRecognition: 3,
        ocrLoading: false,
      }),
    ).toBe("unavailable_no_source_file");
  });

  it("returns the historical unavailable icon and disabled state", () => {
    expect(
      getAiRecognitionActionDefinition("unavailable_no_source_file"),
    ).toEqual(
      expect.objectContaining({
        actionKey: "none",
        disabled: true,
        icon: "&#xe749;",
      }),
    );
  });

  it("keeps the confirm action on the historical confirm icon", () => {
    expect(getAiRecognitionActionDefinition("confirm")).toEqual(
      expect.objectContaining({
        actionKey: "openQuestionTask",
        disabled: false,
        icon: "&#xe7a1;",
      }),
    );
  });

  it("picks the question-task handler for confirm actions", () => {
    const handleOpenQuestionTask = jest.fn();
    const handleSubmitOcrTask = jest.fn();
    const handler = getAiRecognitionActionHandler({
      actionKey: "openQuestionTask",
      handleOpenQuestionTask,
      handleSubmitOcrTask,
    });

    handler();

    expect(handleOpenQuestionTask).toHaveBeenCalled();
    expect(handleSubmitOcrTask).not.toHaveBeenCalled();
  });

  it("greys out the original paper action when no source file exists", () => {
    expect(getSourcePaperActionStyles()).toEqual({
      iconStyle: { color: "#bfbfbf" },
      textStyle: { color: "#bfbfbf" },
    });
  });

  it("routes a structured paper export through the browser PDF boundary", () => {
    downloadPaperByType(11_721, 2);

    expect(downloadExamPaperPdf).toHaveBeenCalledWith({ paperId: 11_721 });
    expect(window.open).not.toHaveBeenCalled();
  });

  it("keeps uploaded source files on the original file download path", () => {
    downloadPaperByType(11_721, 1);

    expect(window.open).toHaveBeenCalledWith(
      `${window.location.origin}/api/new_download_file?id=11721`,
    );
    expect(downloadExamPaperPdf).not.toHaveBeenCalled();
  });
});
