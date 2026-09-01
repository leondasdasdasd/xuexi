import React, { useEffect, useState } from "react";
import { Input, InputNumber, message, Select, Upload } from "antd";

import { CuModal, FormGrid, GridFormItem } from "../../../components/Custom";
import { trans } from "../../../utils/i18n";
import { Icons } from "./Icons";

import styles from "./UploadModal.module.less";
const { Dragger } = Upload;
const { Option } = Select;
const initialFormData = {
  paperName: undefined,
  subjectId: undefined,
  gradeId: undefined,
  year: undefined,
  totalScore: undefined,
  mainQuestionCount: undefined,
  subQuestionCount: undefined,
  uploadFile: [],
  examAnswerFile: [],
  processMode: 1,
};

/**
 *
 * @param properties
 */
function UploadModal(properties) {
  const {
    visible,
    onCancel,
    subjectOptions,
    gradeOptions,
    yearOptions,
    onConfirm,
  } = properties;

  const [formData, setFormData] = useState(initialFormData);

  const [okLoading, setOkLoading] = useState(false);
  const {
    paperName,
    subjectId,
    gradeId,
    year,
    totalScore,
    mainQuestionCount,
    subQuestionCount,
    uploadFile,
    examAnswerFile,
    processMode,
  } = formData;

  const titleText = trans("paper.upload.title", "上传试卷");

  useEffect(() => {
    if (visible) {
      setFormData(initialFormData);
    }
  }, [visible]);

  const handleSubmit = () => {
    if ((uploadFile || []).length === 0) {
      return message.error(trans("paper.upload.uploadRequired", "请上传试卷"));
    }
    if (!paperName) {
      return message.error(
        trans("paper.upload.paperNameRequired", "请输入试卷名称"),
      );
    }
    if (!subjectId) {
      return message.error(trans("paper.upload.subjectRequired", "请选择学科"));
    }
    if (!gradeId) {
      return message.error(trans("paper.upload.gradeRequired", "请选择年级"));
    }
    if (!year) {
      return message.error(trans("paper.upload.yearRequired", "请选择年份"));
    }
    const data = {
      ...formData,
      examAnswerFileId: examAnswerFile?.[0]?.fileId,
      files: uploadFile?.[0]?.originFileObj,
    };
    onConfirm && onConfirm(data, setOkLoading);
  };

  const validateFile = (file) => {
    // 文件类型仅支持word
    const isWord =
      file.type === "application/msword" ||
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    const isLt20M = file.size / 1024 / 1024 <= 20;

    return {
      isWord: isWord,
      isLt20M: isLt20M,
    };
  };

  const uploadOnChange = ({ file }, key) => {
    // 1️⃣ 删除（最高优先级）
    if (file.status === "removed") {
      setFormData((previous) => ({
        ...previous,
        [key]: [],
      }));
      return;
    }

    // 2️⃣ 业务校验（只要不是 removed 都可以校验）
    const { isWord, isLt20M } = validateFile(file);
    if (!isWord || !isLt20M) {
      // setFormData(prev => ({
      //   ...prev,
      //   [key]: []
      // }));
      return;
    }

    // 3️⃣ 上传失败
    if (file.status === "error") {
      message.error(trans("global.fileUploadFailure", "上传失败"));
      setFormData((previous) => ({
        ...previous,
        [key]: [],
      }));
      return;
    }

    // 4️⃣ 上传中（不赋值）
    if (file.status === "uploading") {
      setFormData((previous) => ({
        ...previous,
        [key]: [file],
      }));
      return;
    }

    // 5️⃣ 上传成功
    if (file.status === "done" && file.response?.content?.length) {
      const newFile = {
        ...file,
        url: file.response.content[0].url,
        fileId: file.response.content[0].fileId,
      };

      setFormData((previous) => {
        const next = {
          ...previous,
          [key]: [newFile],
        };

        // uploadFile 特殊逻辑
        if (key === "uploadFile" && !previous.paperName && newFile.name) {
          next.paperName = newFile.name.split(".")[0];
        }

        return next;
      });
    }
  };

  const beforeUpload = (file, fileList, key) => {
    const { isWord, isLt20M } = validateFile(file);
    if (!isWord) {
      message.error(
        trans("paper.upload.wordFormatOnly", "仅支持上传Word格式!"),
      );
    }

    if (!isLt20M) {
      message.info(trans("global.fileLarge", "上传文件过大！"));
    }

    return isWord && isLt20M;
  };

  const commonUploadProperties = {
    name: "file",
    action: "/api/upload_file",
    // 只允许word格式
    accept:
      "application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    headers: {
      authorization: "authorization-text",
    },
    showUploadList: false,
  };

  const testPaperUploadProperties = {
    ...commonUploadProperties,
    beforeUpload: (file, fileList) =>
      beforeUpload(file, fileList, "uploadFile"),
    fileList: uploadFile || [],
    onChange: (info) => {
      uploadOnChange(info, "uploadFile");
    },
  };

  const answerSheetUploadProperties = {
    ...commonUploadProperties,
    beforeUpload: (file, fileList) =>
      beforeUpload(file, fileList, "examAnswerFile"),
    fileList: examAnswerFile || [],
    onChange: (info) => {
      uploadOnChange(info, "examAnswerFile");
    },
  };

  return (
    <CuModal
      visible={visible}
      title={titleText}
      width={720}
      destroyOnClose
      maskClosable={false}
      onCancel={onCancel}
      onOk={handleSubmit}
      okButtonProps={{ loading: okLoading }}
    >
      <FormGrid
        className={styles.form}
        layout="vertical"
        rowGap={12}
        columnGap={16}
      >
        <GridFormItem
          label={trans("paper.upload.questionnaire", "问卷")}
          required
          span={12}
        >
          <Dragger
            {...testPaperUploadProperties}
            className={uploadFile.length > 0 ? styles.uploadFileActive : ""}
          >
            <div>
              <div>
                {uploadFile.length > 0 ? <Icons.Check /> : <Icons.Upload />}
              </div>
              {uploadFile.length > 0
                ? uploadFile[0].name
                : trans("paper.upload.fileFormat", "Word格式")}
            </div>
          </Dragger>
        </GridFormItem>

        <GridFormItem
          label={trans("paper.upload.answerSheet", "答案卷")}
          span={12}
        >
          <Dragger
            {...answerSheetUploadProperties}
            className={examAnswerFile.length > 0 ? styles.uploadFileActive : ""}
          >
            <div>
              <div>
                {" "}
                {examAnswerFile.length > 0 ? <Icons.Check /> : <Icons.Upload />}
              </div>
              {examAnswerFile.length > 0
                ? examAnswerFile[0].name
                : trans("paper.upload.fileFormat", "Word格式")}
            </div>
          </Dragger>
        </GridFormItem>

        <GridFormItem
          label={trans("paper.upload.paperName", "试卷名称")}
          required
          span={24}
        >
          <Input
            value={paperName}
            style={{ width: "100%" }}
            onChange={(e) =>
              setFormData({ ...formData, paperName: e.target.value })
            }
            placeholder={trans(
              "paper.upload.paperNamePlaceholder",
              "请输入试卷名称",
            )}
          />
        </GridFormItem>

        <GridFormItem
          label={trans("paper.upload.processMode", "处理方式")}
          span={24}
        >
          <div className={styles.tabs}>
            {[
              {
                label: trans("paper.upload.uploadOnly", "仅上传试卷"),
                value: 1,
                icon: <Icons.FileText />,
              },
              {
                label: trans(
                  "paper.upload.uploadAndParse",
                  "上传试卷并智能解析题目",
                ),
                value: 2,
                disabled: true,
                icon: <Icons.Search />,
              },
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                className={`${styles.tab} ${processMode === item.value && styles.tabActive} ${item.disabled && styles.tabDisabled}`}
                onClick={() =>
                  setFormData({ ...formData, processMode: item.value })
                }
                disabled={item.disabled}
              >
                {item.disabled ? <Icons.Lock /> : item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </GridFormItem>

        <GridFormItem
          label={trans("paper.upload.subject", "学科")}
          required
          className={styles.gridItem}
          span={12}
        >
          <Select
            value={subjectId}
            style={{ width: "100%" }}
            placeholder={trans("paper.upload.subjectPlaceholder", "请选择学科")}
            onChange={(value) => setFormData({ ...formData, subjectId: value })}
          >
            {(subjectOptions || []).map((opt) => (
              <Option key={opt.value} value={opt.value}>
                {opt.label}
              </Option>
            ))}
          </Select>
        </GridFormItem>
        <GridFormItem
          label={trans("paper.upload.grade", "年级")}
          required
          className={styles.gridItem}
          span={12}
        >
          <Select
            value={gradeId}
            style={{ width: "100%" }}
            placeholder={trans("paper.upload.gradePlaceholder", "请选择年级")}
            onChange={(value) => setFormData({ ...formData, gradeId: value })}
          >
            {(gradeOptions || []).map((opt) => (
              <Option key={opt.value} value={opt.value}>
                {opt.label}
              </Option>
            ))}
          </Select>
        </GridFormItem>
        <GridFormItem
          label={trans("paper.upload.year", "年份")}
          required
          className={styles.gridItem}
          span={12}
        >
          <Select
            value={year}
            style={{ width: "100%" }}
            placeholder={trans("paper.upload.yearPlaceholder", "请选择年份")}
            onChange={(value) => setFormData({ ...formData, year: value })}
          >
            {(yearOptions || []).map((opt) => (
              <Option key={opt} value={opt}>
                {opt}
              </Option>
            ))}
          </Select>
        </GridFormItem>

        <GridFormItem
          label={trans("paper.upload.totalScore", "总分")}
          className={styles.gridItem}
          span={12}
        >
          <InputNumber
            min={0}
            style={{ width: "100%" }}
            placeholder={trans(
              "paper.upload.totalScorePlaceholder",
              "请输入总分",
            )}
            value={totalScore}
            onChange={(value) =>
              setFormData({ ...formData, totalScore: value })
            }
          />
        </GridFormItem>

        <GridFormItem
          label={trans("paper.upload.mainQuestionCount", "大题数")}
          className={styles.gridItem}
          span={12}
        >
          <InputNumber
            min={0}
            style={{ width: "100%" }}
            value={mainQuestionCount}
            placeholder={trans(
              "paper.upload.mainQuestionCountPlaceholder",
              "请输入大题数",
            )}
            onChange={(value) =>
              setFormData({ ...formData, mainQuestionCount: value })
            }
          />
        </GridFormItem>

        <GridFormItem
          label={trans("paper.upload.subQuestionCount", "小题数量")}
          className={styles.gridItem}
          span={12}
        >
          <InputNumber
            min={0}
            style={{ width: "100%" }}
            value={subQuestionCount}
            placeholder={trans(
              "paper.upload.subQuestionCountPlaceholder",
              "请输入小题数量",
            )}
            onChange={(value) =>
              setFormData({ ...formData, subQuestionCount: value })
            }
          />
        </GridFormItem>
      </FormGrid>
    </CuModal>
  );
}

export default UploadModal;
