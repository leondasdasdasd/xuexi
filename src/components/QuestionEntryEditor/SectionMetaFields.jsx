import React from "react";
import { Input, InputNumber } from "antd";
import PropTypes from "prop-types";

import { trans } from "../../utils/i18n";
import FieldLabel from "./FieldLabel";
import { css } from "./questionEntryStyles";

const getSectionNumberValue = (question) =>
  question.sectionNumber === undefined || question.sectionNumber === null
    ? undefined
    : Number(question.sectionNumber);

const SectionMetaFields = ({ onQuestionChange, question }) => (
  <>
    <div className={css.metaField}>
      <FieldLabel
        title={trans("questionTask.sectionNumber", "Section Number")}
      />
      <InputNumber
        className={css.fullControl}
        min={1}
        onChange={(value) =>
          onQuestionChange({
            sectionNumber: value === undefined ? undefined : Number(value),
          })
        }
        placeholder={trans(
          "questionTask.sectionNumberPlaceholder",
          "Enter section number",
        )}
        value={getSectionNumberValue(question)}
      />
    </div>
    <div className={css.metaField}>
      <FieldLabel title={trans("questionTask.sectionTitle", "Section Title")} />
      <Input
        className={css.fullControl}
        maxLength={100}
        onChange={(event) =>
          onQuestionChange({
            sectionTitle: event.target.value,
          })
        }
        placeholder={trans(
          "questionTask.sectionTitlePlaceholder",
          "Enter section title",
        )}
        value={question.sectionTitle || ""}
      />
    </div>
  </>
);

SectionMetaFields.propTypes = {
  onQuestionChange: PropTypes.func.isRequired,
  question: PropTypes.object.isRequired,
};

export default SectionMetaFields;
