import React from "react";
import { Select } from "antd";
import PropTypes from "prop-types";

import { css } from "./questionEntryStyles";

const { Option } = Select;

const QuestionTypeSelect = ({ onChange, options, value }) => (
  <Select className={css.fullControl} onChange={onChange} value={value}>
    {options.map((item) => (
      <Option key={item.value} value={item.value}>
        {item.label}
      </Option>
    ))}
  </Select>
);

QuestionTypeSelect.propTypes = {
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(PropTypes.object).isRequired,
  value: PropTypes.number,
};

export default QuestionTypeSelect;
