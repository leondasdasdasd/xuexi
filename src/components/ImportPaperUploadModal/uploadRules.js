import { trans } from "../../utils/i18n";
import {
  PAPER_TITLE_LENGTH_LIMIT_MESSAGE_KEY,
  isPaperTitleTooLong,
} from "../../utils/paperTitle";
import {
  ACCEPTED_EXTENSIONS,
  ACCEPTED_TYPES,
  DOCX_EXTENSION,
  DOCX_TYPE,
  MODE_UPLOAD_AND_PARSE,
  OCR_RECOGNITION,
  WORD_RECOGNITION,
} from "./constants";

export const getFileExtension = (file) =>
  (file?.name || "").split(".").pop()?.toLowerCase();

export const isDocxFile = (file) =>
  file?.type === DOCX_TYPE || getFileExtension(file) === DOCX_EXTENSION;

export const hasInvalidWordAiAnswerFile = (formData) =>
  (formData.examAnswerFile || []).length > 0 &&
  !isDocxFile(formData.examAnswerFile?.[0]);

// Word 解码要求试卷文件为 docx，且答案文件存在时也必须为 docx，避免解析链路收到混合格式。
export const canSelectWordRecognition = (formData) =>
  isDocxFile(formData.uploadFile?.[0]) && !hasInvalidWordAiAnswerFile(formData);

export const calculateAiRecognition = (formData) => {
  if (formData.processMode !== MODE_UPLOAD_AND_PARSE) {
    return OCR_RECOGNITION;
  }

  return canSelectWordRecognition(formData)
    ? WORD_RECOGNITION
    : OCR_RECOGNITION;
};

export const getWordRecognitionDisabledReason = (formData) => {
  if (!isDocxFile(formData.uploadFile?.[0])) {
    return "";
  }

  if (hasInvalidWordAiAnswerFile(formData)) {
    return trans(
      "paper.upload.wordAiAnswerFileTypeError",
      "Word 解码需保持文件格式一致",
    );
  }

  return "";
};

export const validateFile = (file) => {
  const fileExtension = getFileExtension(file);
  const isAcceptedType =
    ACCEPTED_TYPES.has(file.type) || ACCEPTED_EXTENSIONS.has(fileExtension);
  const isLt20M = file.size / 1024 / 1024 <= 20;

  return { isAcceptedType, isLt20M };
};

export const validateRequiredFields = (formData) => {
  const {
    aiRecognition,
    gradeId,
    paperName,
    paperType,
    subjectId,
    uploadFile,
    year,
  } = formData;
  // 按用户操作路径从文件到基础信息依次返回首个错误，保证弹出的校验提示稳定且可预期。
  const rules = [
    {
      isInvalid: (uploadFile || []).length === 0,
      message: trans("paper.upload.uploadRequired"),
    },
    {
      isInvalid:
        aiRecognition === WORD_RECOGNITION &&
        hasInvalidWordAiAnswerFile(formData),
      message: trans(
        "paper.upload.wordAiAnswerFileTypeError",
        "Word 解码需保持文件格式一致",
      ),
    },
    {
      isInvalid: !(paperName || "").trim(),
      message: trans("paper.upload.paperNameRequired"),
    },
    {
      isInvalid: isPaperTitleTooLong(paperName),
      message: trans(
        PAPER_TITLE_LENGTH_LIMIT_MESSAGE_KEY,
        "标题长度超过字数限制",
      ),
    },
    {
      isInvalid: !subjectId,
      message: trans("paper.upload.subjectRequired"),
    },
    {
      isInvalid: !paperType,
      message: trans("paper.upload.paperTypeRequired"),
    },
    {
      isInvalid: !gradeId,
      message: trans("paper.upload.gradeRequired"),
    },
    {
      isInvalid: !year,
      message: trans("paper.upload.yearRequired"),
    },
  ];
  const failedRule = rules.find((rule) => rule.isInvalid);
  return failedRule?.message;
};

export const buildUploadedPaperPayload = (
  formData,
  paperFileId,
  examAnswerFileId,
) => {
  const {
    gradeId,
    mainQuestionCount,
    paperName,
    paperType,
    processMode,
    subjectId,
    subQuestionCount,
    termId,
    totalScore,
    year,
  } = formData;

  // payload 是表单状态到创建试卷接口的边界形态，只在这里做 trim 和 fileId 注入。
  return {
    paperName: (paperName || "").trim(),
    paperType,
    subjectId,
    gradeId,
    termId,
    year,
    totalScore,
    mainQuestionCount,
    subQuestionCount,
    processMode,
    paperFileId,
    examAnswerFileId,
  };
};
