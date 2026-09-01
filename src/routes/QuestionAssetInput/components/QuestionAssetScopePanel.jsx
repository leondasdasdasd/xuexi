import React from "react";
import { Select } from "antd";
import PropTypes from "prop-types";

import { trans } from "../../../utils/i18n";

import styles from "../index.module.less";

const { Option } = Select;

const QuestionAssetScopePanel = ({
  disabled,
  gradeOptions,
  onGradeChange,
  onSubjectChange,
  subjectOptions,
  value,
}) => (
  <div className={styles.scopeGrid}>
    <div className={styles.field}>
      <span className={styles.label}>
        <span className={styles.required}>*</span>
        {trans("global.grade", "年级")}
      </span>
      <Select
        className={styles.fullControl}
        disabled={disabled}
        onChange={onGradeChange}
        placeholder={trans("global.grade", "年级")}
        value={value.gradeId}
      >
        {gradeOptions.map((option) => (
          <Option key={option.value} value={option.value}>
            {option.label}
          </Option>
        ))}
      </Select>
    </div>
    <div className={styles.field}>
      <span className={styles.label}>
        <span className={styles.required}>*</span>
        {trans("global.subject", "学科")}
      </span>
      <Select
        className={styles.fullControl}
        disabled={disabled}
        onChange={onSubjectChange}
        placeholder={trans("global.subject", "学科")}
        value={value.subjectId}
      >
        {subjectOptions.map((option) => (
          <Option key={option.value} value={option.value}>
            {option.label}
          </Option>
        ))}
      </Select>
    </div>
  </div>
);

QuestionAssetScopePanel.propTypes = {
  disabled: PropTypes.bool,
  gradeOptions: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
        .isRequired,
    }),
  ).isRequired,
  onGradeChange: PropTypes.func.isRequired,
  onSubjectChange: PropTypes.func.isRequired,
  subjectOptions: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
        .isRequired,
    }),
  ).isRequired,
  value: PropTypes.shape({
    gradeId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    subjectId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }).isRequired,
};

QuestionAssetScopePanel.defaultProps = {
  disabled: false,
};

export default QuestionAssetScopePanel;
