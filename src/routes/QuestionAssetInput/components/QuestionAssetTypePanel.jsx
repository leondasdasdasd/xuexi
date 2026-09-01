import React from "react";
import { Button } from "antd";
import PropTypes from "prop-types";

import { trans } from "../../../utils/i18n";

import styles from "../index.module.less";

const QuestionAssetTypePanel = ({
  disabled,
  locked,
  onChange,
  options,
  value,
}) => (
  <div className={styles.field}>
    <span className={styles.label}>
      <span className={styles.required}>*</span>
      {trans("questionAssetInput.questionType", "题型")}
    </span>
    <div className={styles.typeGrid}>
      {options.map((option) => {
        const isSelected = Number(value) === Number(option.value);

        return (
          <Button
            className={[
              styles.typeButton,
              isSelected &&
                (disabled || locked) &&
                styles["type-button-disabled-selected"],
            ]
              .filter(Boolean)
              .join(" ")}
            disabled={disabled || locked}
            key={option.value}
            onClick={(event) => {
              event.preventDefault();
              onChange(option.value);
            }}
            title={option.label}
            type={isSelected ? "primary" : "default"}
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  </div>
);

QuestionAssetTypePanel.propTypes = {
  disabled: PropTypes.bool,
  locked: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
        .isRequired,
    }),
  ).isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

QuestionAssetTypePanel.defaultProps = {
  disabled: false,
  locked: false,
  value: undefined,
};

export default QuestionAssetTypePanel;
