import React from "react";
import { Radio } from "antd";
import PropTypes from "prop-types";

import { css } from "./questionEntryStyles";

const QuestionTypeGroup = ({ onChange, options, value }) => (
  <Radio.Group
    className={css.questionTypeGroup}
    onChange={(event) => onChange(event.target.value)}
    value={value}
  >
    {options.map((item) => (
      <Radio.Button key={item.value} value={item.value}>
        {item.label}
      </Radio.Button>
    ))}
  </Radio.Group>
);

QuestionTypeGroup.propTypes = {
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(PropTypes.object).isRequired,
  value: PropTypes.number,
};

export default QuestionTypeGroup;
