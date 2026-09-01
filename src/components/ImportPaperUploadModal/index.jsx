import React, { useEffect, useState } from "react";
import { Input, message } from "antd";
import PropTypes from "prop-types";

import {
  createUploadedPaper,
  submitExamPaperOcrTask,
  uploadPaperSourceFile,
} from "../../services/paper";
import { locale, trans } from "../../utils/i18n";
import { PAPER_TITLE_MAX_LENGTH } from "../../utils/paperTitle";
import { CuModal, FormGrid, GridFormItem } from "../Custom";
import {
  createInitialFormData,
  FILE_ACCEPT,
  FILE_UPLOAD_FAILURE_KEY,
  MODE_UPLOAD_AND_PARSE,
  SUCCESS_KEY,
} from "./constants";
import {
  buildModeOptions,
  buildScoreFields,
  buildSelectFields,
} from "./fieldConfig";
import {
  EntrySettingPanel,
  SelectField,
  UploadFileField,
} from "./FormSections";
import {
  buildGradeOptions,
  buildYearOptions,
  normalizeOptions,
} from "./optionUtils";
import {
  buildUploadedPaperPayload,
  calculateAiRecognition,
  canSelectWordRecognition,
  getWordRecognitionDisabledReason,
  validateFile,
  validateRequiredFields,
} from "./uploadRules";

import styles from "./index.module.less";

const notifyConfirm = (onConfirm, createdPaper) => {
  if (onConfirm) {
    onConfirm(createdPaper);
  }
};

const startPaperParsing = async (createdPaper, onConfirm) => {
  const submitResponse = await submitExamPaperOcrTask({
    examPaperId: createdPaper?.examPaperId,
  });

  if (!submitResponse?.status) {
    message.error(
      submitResponse?.message ||
        trans(
          "importPaperUploadModal.startRecognitionFailed",
          "试卷已创建，发起识别失败",
        ),
    );
    notifyConfirm(onConfirm, createdPaper);
    return;
  }

  message.success(
    trans("importPaperUploadModal.recognitionStarted", "已开始识别"),
  );
  notifyConfirm(onConfirm, createdPaper);
};

const completeUploadOnly = (response, createdPaper, onConfirm) => {
  message.success(response?.message || trans(SUCCESS_KEY));
  notifyConfirm(onConfirm, createdPaper);
};

const canStartSubmit = (formData, submitting) => {
  const validationMessage = validateRequiredFields(formData);
  if (validationMessage) {
    message.error(validationMessage);
    return false;
  }

  return !submitting;
};

const isSameId = (left, right) =>
  left !== undefined &&
  left !== null &&
  right !== undefined &&
  right !== null &&
  String(left) === String(right);

const getDefaultGradeOption = (gradeOptions, defaultGradeId, defaultTermId) => {
  if (defaultGradeId === undefined || defaultGradeId === null) {
    return;
  }

  return (
    gradeOptions.find(
      (option) =>
        isSameId(option.gradeId, defaultGradeId) &&
        isSameId(option.termId, defaultTermId),
    ) || gradeOptions.find((option) => isSameId(option.gradeId, defaultGradeId))
  );
};

/**
 * 渲染试卷导入弹窗，负责把上传文件、基础字段和录入模式组织成创建试卷的数据流。
 * @param {object} properties 弹窗属性。
 * @returns {React.ReactElement} 试卷导入弹窗。
 */
export function ImportPaperUploadModal(properties) {
  const {
    defaultGradeId,
    defaultPaperName,
    defaultSubjectId,
    defaultTermId,
    visible,
    title,
    onCancel,
    onConfirm,
    subjectOptions,
    paperTypeOptions,
    gradeOptions,
  } = properties;

  const [formData, setFormData] = useState(createInitialFormData);
  const [submitting, setSubmitting] = useState(false);
  const { paperName, uploadFile, examAnswerFile, processMode, aiRecognition } =
    formData;
  const isEnglish = locale() === "en";

  const normalizedSubjectOptions = normalizeOptions(
    subjectOptions,
    ["label", "name"],
    ["value", "id"],
  );
  const normalizedPaperTypeOptions = normalizeOptions(
    paperTypeOptions,
    ["label", "examTypeName", "name"],
    ["value", "examTypeCode", "id"],
  );
  const normalizedGradeOptions = buildGradeOptions(gradeOptions, isEnglish);
  const canSelectWordDecode = canSelectWordRecognition(formData);
  const wordRecognitionDisabledReason =
    getWordRecognitionDisabledReason(formData);
  const selectFields = buildSelectFields({
    normalizedGradeOptions,
    normalizedPaperTypeOptions,
    normalizedSubjectOptions,
    yearOptions: buildYearOptions(),
  });
  const defaultGradeOption = getDefaultGradeOption(
    normalizedGradeOptions,
    defaultGradeId,
    defaultTermId,
  );

  const updateField = (key, value) => {
    setFormData((previous) => {
      const nextFormData = { ...previous, [key]: value };
      if (key === "processMode") {
        nextFormData.aiRecognition = calculateAiRecognition(nextFormData);
      }
      return nextFormData;
    });
  };

  const handleGradeChange = (value) => {
    const selectedOption = normalizedGradeOptions.find(
      (option) => option.value === value,
    );
    // 年级下拉的 value 是展示层合成值，写入表单时拆回接口所需的 gradeId 和 termId。
    setFormData((previous) => ({
      ...previous,
      gradeId: selectedOption?.gradeId,
      termId: selectedOption?.termId,
    }));
  };

  const syncFileField = (file, key) => {
    const { isAcceptedType, isLt20M } = validateFile(file);
    if (!isAcceptedType || !isLt20M) {
      return;
    }

    setFormData((previous) => {
      const nextFormData = { ...previous, [key]: [file] };
      if (key === "uploadFile" && !previous.paperName && file.name) {
        nextFormData.paperName = file.name.replace(/\.[^./]+$/, "");
      }
      // 文件格式会影响 Word/OCR 解码可选状态，文件变化后同步刷新识别模式，避免提交非法组合。
      nextFormData.aiRecognition = calculateAiRecognition(nextFormData);
      return nextFormData;
    });
  };

  const beforeUpload = (file) => {
    const { isAcceptedType, isLt20M } = validateFile(file);

    if (!isAcceptedType) {
      message.error(trans("paper.upload.fileTypeError"));
    }

    if (!isLt20M) {
      message.info(trans("global.fileLarge", "上传文件过大！"));
    }

    return isAcceptedType && isLt20M;
  };

  const buildUploadProperties = (key) => ({
    accept: FILE_ACCEPT,
    multiple: false,
    showUploadList: false,
    beforeUpload: (file) => {
      if (!beforeUpload(file)) {
        return false;
      }
      syncFileField(file, key);
      return false;
    },
    onRemove: () => {
      setFormData((previous) => {
        const nextFormData = { ...previous, [key]: [] };
        nextFormData.aiRecognition = calculateAiRecognition(nextFormData);
        return nextFormData;
      });
    },
  });

  const paperUploadProperties = {
    ...buildUploadProperties("uploadFile"),
    fileList: uploadFile || [],
  };

  const answerUploadProperties = {
    ...buildUploadProperties("examAnswerFile"),
    fileList: examAnswerFile || [],
  };

  const uploadSelectedFile = async (file) => {
    const response = await uploadPaperSourceFile(file);
    if (!response?.status) {
      throw new Error(response?.message || trans(FILE_UPLOAD_FAILURE_KEY));
    }

    const fileId = response?.content?.[0]?.fileId;
    if (!fileId) {
      throw new Error(response?.message || trans(FILE_UPLOAD_FAILURE_KEY));
    }

    return fileId;
  };

  const buildSubmitPayload = async () => {
    const paperFile = uploadFile?.[0];
    const answerFile = examAnswerFile?.[0];
    // 创建试卷接口只接收文件 ID，因此提交前先完成试卷和答案文件上传。
    const paperFileId = await uploadSelectedFile(paperFile);
    const examAnswerFileId = answerFile
      ? await uploadSelectedFile(answerFile)
      : undefined;

    return buildUploadedPaperPayload(formData, paperFileId, examAnswerFileId);
  };

  const handleSubmit = async () => {
    if (!canStartSubmit(formData, submitting)) {
      return;
    }

    setSubmitting(true);
    let createdPaper;
    try {
      const payload = await buildSubmitPayload();
      const response = await createUploadedPaper(payload);

      if (!response?.status) {
        message.error(response?.message);
        return;
      }

      createdPaper = response.content;

      // “上传并解析”需要在试卷创建成功后继续发起识别任务；“仅上传”到创建完成即结束。
      if (processMode === MODE_UPLOAD_AND_PARSE) {
        await startPaperParsing(createdPaper, onConfirm);
        return;
      }

      completeUploadOnly(response, createdPaper, onConfirm);
    } catch (error) {
      if (createdPaper && processMode === MODE_UPLOAD_AND_PARSE) {
        message.error(
          trans(
            "importPaperUploadModal.startRecognitionFailed",
            "试卷已创建，发起识别失败",
          ),
        );
        notifyConfirm(onConfirm, createdPaper);
        return;
      }
      message.error(error?.message || trans(FILE_UPLOAD_FAILURE_KEY));
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (visible) {
      setFormData({
        ...createInitialFormData(),
        paperName: defaultPaperName,
        gradeId: defaultGradeOption?.gradeId || defaultGradeId,
        termId: defaultGradeOption?.termId,
        subjectId: defaultSubjectId,
      });
    }
  }, [
    defaultGradeId,
    defaultGradeOption?.value,
    defaultPaperName,
    defaultSubjectId,
    defaultTermId,
    visible,
  ]);

  return (
    <CuModal
      visible={visible}
      title={title}
      width="min(48.75rem, calc(100vw - 2rem))"
      wrapClassName={styles.importPaperUploadModal}
      style={{ top: "1rem" }}
      bodyStyle={{
        maxHeight: "calc(100vh - 11rem)",
        minHeight: "min(32.5rem, calc(100vh - 12rem))",
        overflowY: "auto",
      }}
      destroyOnClose
      maskClosable={false}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={submitting}
      okText={
        processMode === MODE_UPLOAD_AND_PARSE
          ? trans("paper.upload.startParse")
          : trans("paper.upload.confirmUpload")
      }
    >
      <FormGrid
        className={styles.form}
        layout="vertical"
        rowGap="0.75rem"
        columnGap="1rem"
      >
        <UploadFileField
          label={trans("importPaperUploadModal.paperFileLabel", "试卷")}
          fileList={uploadFile || []}
          placeholder={trans("paper.upload.paperFilePlaceholder")}
          required
          uploadProperties={paperUploadProperties}
        />

        <UploadFileField
          label={trans("paper.upload.answerSheet")}
          fileList={examAnswerFile || []}
          placeholder={trans("paper.upload.answerFilePlaceholder")}
          uploadProperties={answerUploadProperties}
        />

        <GridFormItem
          label={trans("paper.upload.paperName")}
          required
          span={24}
        >
          <Input
            value={paperName}
            maxLength={PAPER_TITLE_MAX_LENGTH}
            style={{ width: "100%" }}
            onChange={(event) => updateField("paperName", event.target.value)}
            placeholder={trans("paper.upload.paperNamePlaceholder")}
          />
        </GridFormItem>

        <EntrySettingPanel
          aiRecognition={aiRecognition}
          canSelectWordDecode={canSelectWordDecode}
          formData={formData}
          modeOptions={buildModeOptions()}
          processMode={processMode}
          scoreFields={buildScoreFields()}
          updateField={updateField}
          wordRecognitionDisabledReason={wordRecognitionDisabledReason}
        />

        {selectFields.map((field) => (
          <SelectField
            key={field.key}
            field={field}
            formData={formData}
            handleGradeChange={handleGradeChange}
            normalizedGradeOptions={normalizedGradeOptions}
            updateField={updateField}
          />
        ))}
      </FormGrid>
    </CuModal>
  );
}

ImportPaperUploadModal.propTypes = {
  defaultGradeId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  defaultPaperName: PropTypes.string,
  defaultSubjectId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  defaultTermId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  gradeOptions: PropTypes.arrayOf(PropTypes.shape({})),
  onCancel: PropTypes.func,
  onConfirm: PropTypes.func,
  paperTypeOptions: PropTypes.arrayOf(PropTypes.shape({})),
  subjectOptions: PropTypes.arrayOf(PropTypes.shape({})),
  title: PropTypes.node,
  visible: PropTypes.bool,
};

ImportPaperUploadModal.defaultProps = {
  defaultGradeId: undefined,
  defaultPaperName: undefined,
  defaultSubjectId: undefined,
  defaultTermId: undefined,
  gradeOptions: [],
  onCancel: undefined,
  onConfirm: undefined,
  paperTypeOptions: [],
  subjectOptions: [],
  title: undefined,
  visible: false,
};

export default ImportPaperUploadModal;
