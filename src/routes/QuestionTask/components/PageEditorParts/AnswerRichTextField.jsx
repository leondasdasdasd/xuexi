import React, { useMemo } from "react";
import PropTypes from "prop-types";

import SlateRichEditor, {
  htmlToSlate,
  slateToHtml,
} from "../../../../components/SlateRichEditor";

import styles from "./AnswerSheetPreview.module.less";

const AnswerRichTextField = ({
  ariaLabel,
  fieldId,
  onActive,
  onChange,
  placeholder,
  value,
}) => {
  const slateValue = useMemo(() => htmlToSlate(value), [value]);

  return (
    <div
      aria-label={ariaLabel}
      className={styles["answer-rich-text-field"]}
      role="group"
    >
      <SlateRichEditor
        key={fieldId}
        onActive={onActive}
        onChange={(nextValue) => onChange(slateToHtml(nextValue))}
        placeholder={placeholder}
        toolbar={false}
        value={slateValue}
      />
    </div>
  );
};

AnswerRichTextField.propTypes = {
  ariaLabel: PropTypes.string.isRequired,
  fieldId: PropTypes.string.isRequired,
  onActive: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  value: PropTypes.string,
};

AnswerRichTextField.defaultProps = {
  placeholder: "",
  value: "",
};

export default AnswerRichTextField;
