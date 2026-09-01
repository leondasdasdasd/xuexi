import React, { useMemo } from "react";
import PropTypes from "prop-types";

import SlateRichEditor, { htmlToSlate, slateToHtml } from "../SlateRichEditor";
import { normalizeRichTextHtml } from "./questionEntryModel";
import { css } from "./questionEntryStyles";

const RichTextField = ({
  fieldId,
  onActive,
  onChange,
  placeholder,
  uploadImage,
  value,
}) => {
  const slateValue = useMemo(
    () => htmlToSlate(normalizeRichTextHtml(value)),
    [value],
  );

  return (
    <div className={css.richTextField}>
      <SlateRichEditor
        key={fieldId}
        onActive={onActive}
        onChange={(nextValue) => {
          onChange(normalizeRichTextHtml(slateToHtml(nextValue)));
        }}
        placeholder={placeholder}
        toolbar={false}
        uploadImage={uploadImage}
        value={slateValue}
      />
    </div>
  );
};

RichTextField.propTypes = {
  fieldId: PropTypes.string.isRequired,
  onActive: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  uploadImage: PropTypes.func,
  value: PropTypes.string,
};

export default RichTextField;
