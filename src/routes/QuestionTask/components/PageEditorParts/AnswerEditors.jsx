import React from "react";
import { InputNumber } from "antd";
import PropTypes from "prop-types";

import { trans } from "../../../../utils/i18n";
import {
  FIRST_CHOICE_CODE_POINT,
  getChoiceAnswerValues,
  normalizeJudgeAnswer,
  stopPropagation,
  stripHtml,
} from "./pageEditorData";

import styles from "./AnswerEditors.module.less";

const SCORE_INPUT_MIN = 0;
const SCORE_INPUT_STEP = 0.5;

const ChoiceAnswerEditor = ({ isMultiple, options, value, onChange }) => {
  const selectedValues = getChoiceAnswerValues(value);
  const normalizedOptions = Array.isArray(options) ? options : [];

  return (
    <div className={styles["answer-choice-grid"]}>
      {normalizedOptions.map((option, optionIndex) => {
        const optionKey = String(
          (option && option.key) ||
            String.fromCodePoint(FIRST_CHOICE_CODE_POINT + optionIndex),
        );
        const optionText =
          stripHtml(option && option.answers) ||
          trans("questionTask.optionFallback", "选项 {$key}", {
            key: optionKey,
          });
        const isActive = selectedValues.includes(optionKey);

        return (
          <button
            key={optionKey}
            aria-label={optionText}
            aria-pressed={isActive}
            className={`${styles["answer-choice-button"]} ${
              isActive ? styles["answer-choice-button-active"] : ""
            }`}
            title={optionText}
            type="button"
            onClick={(event) => {
              event.stopPropagation();

              if (isMultiple) {
                const nextValues = isActive
                  ? selectedValues.filter((item) => item !== optionKey)
                  : [...selectedValues, optionKey];
                const orderedValues = normalizedOptions
                  .map((item, itemIndex) =>
                    String(
                      (item && item.key) ||
                        String.fromCodePoint(
                          FIRST_CHOICE_CODE_POINT + itemIndex,
                        ),
                    ),
                  )
                  .filter((item) => nextValues.includes(item));
                onChange(orderedValues.join(""));
                return;
              }

              onChange(isActive ? "" : optionKey);
            }}
          >
            <span className={styles["answer-choice-key"]}>{optionKey}</span>
          </button>
        );
      })}
    </div>
  );
};

ChoiceAnswerEditor.propTypes = {
  isMultiple: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(PropTypes.object),
  value: PropTypes.string,
};

ChoiceAnswerEditor.defaultProps = {
  isMultiple: false,
  options: [],
  value: "",
};

const JudgeAnswerEditor = ({ value, onChange }) => {
  const normalizedValue = normalizeJudgeAnswer(value);

  return (
    <div className={styles["answer-binary-row"]}>
      {[
        { label: trans("global.right", "正确"), value: "true" },
        { label: trans("global.wrong", "错误"), value: "false" },
      ].map((item) => (
        <button
          key={item.value}
          className={`${styles["answer-binary-button"]} ${
            normalizedValue === item.value
              ? styles["answer-binary-button-active"]
              : ""
          }`}
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onChange(item.value);
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
};

JudgeAnswerEditor.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string,
};

JudgeAnswerEditor.defaultProps = {
  value: "",
};

const CompactTextField = ({ className, placeholder, value, onChange }) => (
  <input
    className={`${styles["answer-inline-input"]} ${className || ""}`}
    placeholder={placeholder}
    type="text"
    value={value}
    onChange={(event) => onChange(event.target.value)}
    onClick={stopPropagation}
  />
);

CompactTextField.propTypes = {
  className: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  value: PropTypes.string,
};

CompactTextField.defaultProps = {
  className: "",
  placeholder: "",
  value: "",
};

const getScoreInputValue = (value) =>
  value === undefined || value === null ? "" : String(value);

const formatScoreInputValue = (value) =>
  getScoreInputValue(value).replace(/\.0$/, "");

const ScoreEditor = ({ readOnly, value, onChange }) => (
  <span
    className={`${styles["answer-score-editor"]} ${
      readOnly ? styles["answer-score-editor-read-only"] : ""
    }`}
  >
    <InputNumber
      className={styles["answer-score-input"]}
      disabled={readOnly}
      formatter={formatScoreInputValue}
      min={SCORE_INPUT_MIN}
      placeholder={trans("questionTask.scoreUnit", "分")}
      step={SCORE_INPUT_STEP}
      value={value || ""}
      onChange={(nextValue) => onChange(getScoreInputValue(nextValue))}
      onClick={stopPropagation}
    />
    <span className={styles["answer-score-unit"]}>
      {trans("questionTask.scoreUnit", "分")}
    </span>
  </span>
);

ScoreEditor.propTypes = {
  onChange: PropTypes.func.isRequired,
  readOnly: PropTypes.bool,
  value: PropTypes.string,
};

ScoreEditor.defaultProps = {
  readOnly: false,
  value: "",
};

export {
  ChoiceAnswerEditor,
  CompactTextField,
  formatScoreInputValue,
  getScoreInputValue,
  JudgeAnswerEditor,
  SCORE_INPUT_MIN,
  SCORE_INPUT_STEP,
  ScoreEditor,
};
