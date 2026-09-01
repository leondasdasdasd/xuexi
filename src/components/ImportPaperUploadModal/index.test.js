import {
  createInitialFormData,
  MODE_UPLOAD_AND_PARSE,
  MODE_UPLOAD_ONLY,
  OCR_RECOGNITION,
  WORD_RECOGNITION,
} from "./constants";
import {
  buildUploadedPaperPayload,
  calculateAiRecognition,
  canSelectWordRecognition,
  getFileExtension,
  getWordRecognitionDisabledReason,
  hasInvalidWordAiAnswerFile,
  validateRequiredFields,
} from "./uploadRules";

const createFile = (name, type) => ({
  name,
  size: 1024,
  type,
});

const DOCX_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const PDF_TYPE = "application/pdf";
const PAPER_DOCX = "paper.docx";

describe("ImportPaperUploadModal data flow", () => {
  beforeEach(() => {
    window.globalLange = "zh-CN";
  });

  it("defaults new imports to AI parsing with OCR recognition", () => {
    expect(createInitialFormData()).toEqual(
      expect.objectContaining({
        processMode: MODE_UPLOAD_AND_PARSE,
        aiRecognition: OCR_RECOGNITION,
        uploadFile: [],
        examAnswerFile: [],
      }),
    );
  });

  it("derives Word recognition only when paper and answer files are docx-compatible", () => {
    const formData = {
      ...createInitialFormData(),
      uploadFile: [createFile(PAPER_DOCX, DOCX_TYPE)],
      examAnswerFile: [createFile("answer.docx", DOCX_TYPE)],
    };

    expect(getFileExtension(formData.uploadFile[0])).toBe("docx");
    expect(canSelectWordRecognition(formData)).toBe(true);
    expect(calculateAiRecognition(formData)).toBe(WORD_RECOGNITION);
  });

  it("falls back to OCR recognition when the answer file is not docx", () => {
    const formData = {
      ...createInitialFormData(),
      uploadFile: [createFile(PAPER_DOCX, DOCX_TYPE)],
      examAnswerFile: [createFile("answer.pdf", PDF_TYPE)],
    };

    expect(hasInvalidWordAiAnswerFile(formData)).toBe(true);
    expect(canSelectWordRecognition(formData)).toBe(false);
    expect(calculateAiRecognition(formData)).toBe(OCR_RECOGNITION);
    expect(getWordRecognitionDisabledReason(formData)).toBe(
      "Word 解码需保持文件格式一致",
    );
  });

  it("does not select Word recognition in upload-only mode", () => {
    const formData = {
      ...createInitialFormData(),
      processMode: MODE_UPLOAD_ONLY,
      uploadFile: [createFile(PAPER_DOCX, DOCX_TYPE)],
    };

    expect(canSelectWordRecognition(formData)).toBe(true);
    expect(calculateAiRecognition(formData)).toBe(OCR_RECOGNITION);
  });

  it("validates required business fields before submission", () => {
    const formData = {
      ...createInitialFormData(),
      uploadFile: [createFile(PAPER_DOCX, DOCX_TYPE)],
      paperName: "  ",
    };

    expect(validateRequiredFields(formData)).toBe("请输入试卷名称");
  });

  it("rejects paper names at 60 characters", () => {
    const formData = {
      ...createInitialFormData(),
      uploadFile: [createFile(PAPER_DOCX, DOCX_TYPE)],
      paperName: "题".repeat(60),
    };

    expect(validateRequiredFields(formData)).toBe("标题长度超过字数限制");
  });

  it("allows paper names at 59 characters before later business checks", () => {
    const formData = {
      ...createInitialFormData(),
      uploadFile: [createFile(PAPER_DOCX, DOCX_TYPE)],
      paperName: "题".repeat(59),
    };

    expect(validateRequiredFields(formData)).toBe("请选择学科");
  });

  it("builds the uploaded paper payload without recognition state", () => {
    const formData = {
      ...createInitialFormData(),
      paperName: "  单元测试  ",
      paperType: 2,
      subjectId: 1,
      gradeId: 7,
      termId: 1,
      year: 2026,
      totalScore: 100,
      mainQuestionCount: 4,
      subQuestionCount: 20,
      aiRecognition: WORD_RECOGNITION,
    };

    expect(
      buildUploadedPaperPayload(formData, "paper-file", "answer-file"),
    ).toEqual({
      paperName: "单元测试",
      paperType: 2,
      subjectId: 1,
      gradeId: 7,
      termId: 1,
      year: 2026,
      totalScore: 100,
      mainQuestionCount: 4,
      subQuestionCount: 20,
      processMode: MODE_UPLOAD_AND_PARSE,
      paperFileId: "paper-file",
      examAnswerFileId: "answer-file",
    });
  });
});
