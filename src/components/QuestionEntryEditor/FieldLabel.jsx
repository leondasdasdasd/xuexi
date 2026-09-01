import React from "react";
import PropTypes from "prop-types";

import { css } from "./questionEntryStyles";

const FieldLabel = ({ extra, required, title }) => (
  <div className={css.fieldLabel}>
    <span>
      {title}
      {required ? <em>*</em> : undefined}
    </span>
    {extra ? <small>{extra}</small> : undefined}
  </div>
);

FieldLabel.propTypes = {
  extra: PropTypes.string,
  required: PropTypes.bool,
  title: PropTypes.string.isRequired,
};

export default FieldLabel;
