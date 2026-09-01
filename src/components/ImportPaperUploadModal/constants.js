export const FILE_ACCEPT = ".docx,.pdf";
export const CURRENT_YEAR = new Date().getFullYear();
export const DOCX_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
export const ACCEPTED_TYPES = new Set([DOCX_TYPE, "application/pdf"]);
export const ACCEPTED_EXTENSIONS = new Set(["docx", "pdf"]);
export const DOCX_EXTENSION = "docx";
export const MODE_UPLOAD_ONLY = 1;
export const MODE_UPLOAD_AND_PARSE = 2;
export const OCR_RECOGNITION = 0;
export const WORD_RECOGNITION = 1;
export const YEAR_OPTIONS = Array.from(
  { length: 15 },
  (_, index) => CURRENT_YEAR - index,
);
export const FALL_TERM_ID = 1;
export const SPRING_TERM_ID = 2;
export const FILE_UPLOAD_FAILURE_KEY = "global.fileUploadFailure";
export const SUCCESS_KEY = "paper.upload.success";

// 表单状态的唯一初始形态，提交前的校验、文件上传和 payload 组装都基于这份结构流转。
export const createInitialFormData = () => ({
  paperName: undefined,
  paperType: undefined,
  subjectId: undefined,
  gradeId: undefined,
  termId: undefined,
  year: CURRENT_YEAR,
  totalScore: undefined,
  mainQuestionCount: undefined,
  subQuestionCount: undefined,
  uploadFile: [],
  examAnswerFile: [],
  processMode: MODE_UPLOAD_AND_PARSE,
  aiRecognition: OCR_RECOGNITION,
});
