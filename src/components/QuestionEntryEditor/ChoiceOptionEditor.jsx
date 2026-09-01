import React from "react";
import { Button, Icon } from "antd";
import PropTypes from "prop-types";

import { trans } from "../../utils/i18n";
import {
  isRequiredChoiceAnswerType,
  QUESTION_TYPE_CHOICE,
  QUESTION_TYPE_SINGLE_VOTE,
  toArray,
} from "./questionEntryModel";
import { css } from "./questionEntryStyles";
import { MIN_OPTION_COUNT } from "./questionEntryUiHelpers";
import RichTextField from "./RichTextField";

const ChoiceOptionEditor = ({
  onAddOption,
  onEditorActive,
  onMoveOption,
  onOptionAnswerChange,
  onOptionChange,
  onRemoveOption,
  question,
  uploadImage,
}) => (
  <div className={css.optionList}>
    {toArray(question.optionList).map((option, optionIndex) => {
      const checked = String(question.answer || "").includes(option.key);
      const isSingleAnswer = [
        QUESTION_TYPE_CHOICE,
        QUESTION_TYPE_SINGLE_VOTE,
      ].includes(Number(question.type));
      const canRemove = question.optionList.length > MIN_OPTION_COUNT;

      return (
        <div className={css.optionRow} key={option.editorId}>
          <button
            aria-label={trans(
              "singleInput.setOptionAsAnswer",
              "设置 {$option} 为答案",
              {
                option: option.key,
              },
            )}
            className={[
              css.answerToggle,
              isSingleAnswer ? "" : css.answerToggleCheckbox,
              checked ? css.answerToggleChecked : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={(event) => {
              event.preventDefault();
              onOptionAnswerChange(option.key, !checked);
            }}
            title={
              isRequiredChoiceAnswerType(question.type)
                ? trans("questionTask.setCorrectAnswer", "设置正确答案")
                : trans("questionTask.setDefaultVoteOption", "设置投票默认选项")
            }
            type="button"
          >
            {isSingleAnswer ? (
              checked ? (
                <span className={css.radioDot} />
              ) : undefined
            ) : checked ? (
              <Icon type="check" />
            ) : undefined}
          </button>
          <div className={css.optionKey}>{option.key}.</div>
          <div className={css.optionEditor}>
            <RichTextField
              fieldId={`${option.editorId}-answers`}
              onActive={onEditorActive}
              onChange={(answers) => onOptionChange(optionIndex, { answers })}
              placeholder={trans(
                "singleInput.placeholderTxt",
                "请输入选项内容",
              )}
              uploadImage={uploadImage}
              value={option.answers}
            />
          </div>
          <div className={css.optionActions}>
            <Button
              disabled={optionIndex === 0}
              icon="arrow-up"
              size="small"
              title={trans("questionTask.moveOptionUp", "上移选项")}
              onClick={(event) => {
                event.preventDefault();
                onMoveOption(optionIndex, -1);
              }}
            />
            <Button
              disabled={optionIndex === question.optionList.length - 1}
              icon="arrow-down"
              size="small"
              title={trans("questionTask.moveOptionDown", "下移选项")}
              onClick={(event) => {
                event.preventDefault();
                onMoveOption(optionIndex, 1);
              }}
            />
            <Button
              disabled={!canRemove}
              icon="delete"
              size="small"
              title={trans("questionTask.removeOption", "删除选项")}
              onClick={(event) => {
                event.preventDefault();
                onRemoveOption(optionIndex);
              }}
            />
          </div>
        </div>
      );
    })}
    <Button className={css.inlineAddButton} onClick={onAddOption}>
      <Icon type="plus" />
      {trans("singleInput.addOption", "添加更多选项")}
    </Button>
  </div>
);

ChoiceOptionEditor.propTypes = {
  onAddOption: PropTypes.func.isRequired,
  onEditorActive: PropTypes.func.isRequired,
  onMoveOption: PropTypes.func.isRequired,
  onOptionAnswerChange: PropTypes.func.isRequired,
  onOptionChange: PropTypes.func.isRequired,
  onRemoveOption: PropTypes.func.isRequired,
  question: PropTypes.object.isRequired,
  uploadImage: PropTypes.func,
};

export default ChoiceOptionEditor;
