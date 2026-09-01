import React from "react";
import { Icon, InputNumber, Select, Tooltip, Upload } from "antd";
import PropTypes from "prop-types";

import { trans } from "../../utils/i18n";
import { GridFormItem } from "../Custom";
import {
  MODE_UPLOAD_AND_PARSE,
  OCR_RECOGNITION,
  WORD_RECOGNITION,
} from "./constants";
import { Icons } from "./icons";

import styles from "./index.module.less";

const { Dragger } = Upload;
const { Option } = Select;

const optionShape = PropTypes.shape({
  label: PropTypes.node,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
});

const stopTipEvent = (event) => {
  event.preventDefault();
  event.stopPropagation();
};

export const UploadFileField = ({
  fileList,
  label,
  placeholder,
  required,
  uploadProperties,
}) => {
  const hasFile = fileList.length > 0;

  return (
    <GridFormItem label={label} required={required} span={12}>
      <Dragger
        {...uploadProperties}
        className={hasFile ? styles.uploadFileActive : ""}
      >
        <div className={styles.uploadContent}>
          <div className={styles.uploadIcon}>
            {hasFile ? <Icons.Check /> : <Icons.Upload />}
          </div>
          <div className={styles.uploadText}>
            {hasFile ? fileList[0].name : placeholder}
          </div>
        </div>
      </Dragger>
    </GridFormItem>
  );
};

UploadFileField.propTypes = {
  fileList: PropTypes.arrayOf(PropTypes.shape({ name: PropTypes.string }))
    .isRequired,
  label: PropTypes.node.isRequired,
  placeholder: PropTypes.node.isRequired,
  required: PropTypes.bool,
  uploadProperties: PropTypes.shape({}).isRequired,
};

UploadFileField.defaultProps = {
  required: false,
};

export const EntrySettingPanel = ({
  aiRecognition,
  canSelectWordDecode,
  formData,
  modeOptions,
  processMode,
  scoreFields,
  updateField,
  wordRecognitionDisabledReason,
}) => {
  const canShowAiParseMode = processMode === MODE_UPLOAD_AND_PARSE;

  return (
    <div className={styles.entryConfigGridItem}>
      <div className={styles.entryConfigCard}>
        <div className={styles.entryConfigHeader}>
          <div className={styles.entryConfigTitle}>
            {trans("paper.upload.entrySetting", "录入设置")}
          </div>
          <div className={styles.entryConfigHint}>
            {processMode === MODE_UPLOAD_AND_PARSE
              ? trans(
                  "paper.upload.entrySettingParseHint",
                  "上传后自动进入解析流程",
                )
              : trans(
                  "paper.upload.entrySettingUploadHint",
                  "仅保存试卷文件，不发起解析",
                )}
          </div>
        </div>

        <div className={styles.entryModeSection}>
          <div className={styles.tabs}>
            {modeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`${styles.tab} ${processMode === option.value ? styles.tabActive : ""}`}
                onClick={() => updateField("processMode", option.value)}
              >
                {option.icon}
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.entryConditionalSection}>
          {canShowAiParseMode ? (
            <ParseModeList
              aiRecognition={aiRecognition}
              canSelectWordDecode={canSelectWordDecode}
              updateField={updateField}
              wordRecognitionDisabledReason={wordRecognitionDisabledReason}
            />
          ) : (
            <ScoreFieldList
              formData={formData}
              scoreFields={scoreFields}
              updateField={updateField}
            />
          )}
        </div>
      </div>
    </div>
  );
};

EntrySettingPanel.propTypes = {
  aiRecognition: PropTypes.number.isRequired,
  canSelectWordDecode: PropTypes.bool.isRequired,
  formData: PropTypes.shape({}).isRequired,
  modeOptions: PropTypes.arrayOf(
    PropTypes.shape({
      icon: PropTypes.node,
      label: PropTypes.node,
      value: PropTypes.number,
    }),
  ).isRequired,
  processMode: PropTypes.number.isRequired,
  scoreFields: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  updateField: PropTypes.func.isRequired,
  wordRecognitionDisabledReason: PropTypes.string.isRequired,
};

const ParseModeList = ({
  aiRecognition,
  canSelectWordDecode,
  updateField,
  wordRecognitionDisabledReason,
}) => (
  <div className={styles.entryConditionalBody}>
    <div className={styles.parseModeList}>
      <button
        type="button"
        className={`${styles.parseModeOption} ${aiRecognition === OCR_RECOGNITION ? styles.parseModeOptionActive : ""}`}
        onClick={() => updateField("aiRecognition", OCR_RECOGNITION)}
      >
        <span className={styles.parseModeOptionTitle}>
          <Icon
            type={aiRecognition === OCR_RECOGNITION ? "check-circle" : "scan"}
          />
          {trans("paper.upload.ocrParse", "OCR 解码")}
        </span>
      </button>

      <button
        type="button"
        aria-disabled={!canSelectWordDecode}
        className={`${styles.parseModeOption} ${aiRecognition === WORD_RECOGNITION ? styles.parseModeOptionActive : ""} ${canSelectWordDecode ? "" : styles.parseModeOptionDisabled}`}
        onClick={() => {
          if (canSelectWordDecode) {
            updateField("aiRecognition", WORD_RECOGNITION);
          }
        }}
      >
        <span className={styles.parseModeOptionTitle}>
          <Icon
            type={
              aiRecognition === WORD_RECOGNITION ? "check-circle" : "file-word"
            }
          />
          {trans("paper.upload.wordParse", "Word 解码")}
          <WordRecognitionTip reason={wordRecognitionDisabledReason} />
        </span>
      </button>
    </div>
  </div>
);

ParseModeList.propTypes = {
  aiRecognition: PropTypes.number.isRequired,
  canSelectWordDecode: PropTypes.bool.isRequired,
  updateField: PropTypes.func.isRequired,
  wordRecognitionDisabledReason: PropTypes.string.isRequired,
};

const WordRecognitionTip = ({ reason }) => {
  if (!reason) {
    return false;
  }

  return (
    <Tooltip placement="top" title={reason} trigger={["hover", "click"]}>
      <button
        type="button"
        className={styles.parseModeTipIcon}
        onClick={stopTipEvent}
        onMouseDown={stopTipEvent}
      >
        <Icon type="info-circle" theme="filled" />
      </button>
    </Tooltip>
  );
};

WordRecognitionTip.propTypes = {
  reason: PropTypes.string.isRequired,
};

const ScoreFieldList = ({ formData, scoreFields, updateField }) => (
  <div className={styles.entryConditionalBody}>
    <div className={styles.entryConfigGrid}>
      {scoreFields.map((field) => (
        <label key={field.key} className={styles.entryMetricFieldCompact}>
          <span className={styles.entryMetricLabel}>{field.label}</span>
          <InputNumber
            min={0}
            max={999}
            className={styles.entryMetricInput}
            value={formData[field.key]}
            placeholder={field.placeholder}
            onChange={(value) => updateField(field.key, value)}
          />
        </label>
      ))}
    </div>
  </div>
);

ScoreFieldList.propTypes = {
  formData: PropTypes.shape({}).isRequired,
  scoreFields: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string,
      label: PropTypes.node,
      placeholder: PropTypes.node,
    }),
  ).isRequired,
  updateField: PropTypes.func.isRequired,
};

export const SelectField = ({
  field,
  formData,
  handleGradeChange,
  normalizedGradeOptions,
  updateField,
}) => {
  const fieldValue =
    field.key === "gradeId"
      ? // 年级控件使用“年级-学期”的合成值展示，表单内部仍保留后端需要的 gradeId 与 termId。
        normalizedGradeOptions.find(
          (option) =>
            option.gradeId === formData.gradeId &&
            option.termId === formData.termId,
        )?.value
      : formData[field.key];

  return (
    <GridFormItem
      key={field.key}
      label={field.label}
      required={field.required}
      className={styles.gridItem}
      span={12}
    >
      <Select
        value={fieldValue}
        style={{ width: "100%" }}
        placeholder={field.placeholder}
        onChange={(value) => {
          if (field.key === "gradeId") {
            handleGradeChange(value);
            return;
          }
          updateField(field.key, value);
        }}
      >
        {(field.options || []).map((option) => (
          <Option key={option.value} value={option.value}>
            {option.label}
          </Option>
        ))}
      </Select>
    </GridFormItem>
  );
};

SelectField.propTypes = {
  field: PropTypes.shape({
    key: PropTypes.string,
    label: PropTypes.node,
    options: PropTypes.arrayOf(optionShape),
    placeholder: PropTypes.node,
    required: PropTypes.bool,
  }).isRequired,
  formData: PropTypes.shape({
    gradeId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    termId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }).isRequired,
  handleGradeChange: PropTypes.func.isRequired,
  normalizedGradeOptions: PropTypes.arrayOf(
    PropTypes.shape({
      gradeId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      termId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    }),
  ).isRequired,
  updateField: PropTypes.func.isRequired,
};
