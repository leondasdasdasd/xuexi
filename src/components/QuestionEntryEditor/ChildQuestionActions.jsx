import React, { useState } from "react";
import { Button, Icon, Select } from "antd";
import PropTypes from "prop-types";

import { trans } from "../../utils/i18n";
import { QUESTION_TYPE_CHOICE } from "./questionEntryModel";
import { css } from "./questionEntryStyles";
import { CHILD_TYPE_OPTIONS } from "./questionEntryUiHelpers";

const { Option } = Select;

const ChildQuestionActions = ({ onAddChild }) => {
  const [childType, setChildType] = useState(QUESTION_TYPE_CHOICE);

  return (
    <div className={css.childActions}>
      <Select
        className={css.childTypeSelect}
        onChange={setChildType}
        value={childType}
      >
        {CHILD_TYPE_OPTIONS.map((item) => (
          <Option key={item.value} value={item.value}>
            {item.label}
          </Option>
        ))}
      </Select>
      <Button
        onClick={(event) => {
          event.preventDefault();
          onAddChild(childType);
        }}
      >
        <Icon type="plus" />
        {trans("global.addChild", "添加子题")}
      </Button>
    </div>
  );
};

ChildQuestionActions.propTypes = {
  onAddChild: PropTypes.func.isRequired,
};

export default ChildQuestionActions;
