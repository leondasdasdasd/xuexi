import React from "react";
import { Button, Checkbox, Icon, Select } from "antd";
import PropTypes from "prop-types";

import { trans } from "../../utils/i18n";
import { toArray } from "./questionEntryModel";
import { css } from "./questionEntryStyles";
import { getArrayItem, getBlankAnswerValues } from "./questionEntryUiHelpers";

const BlankAnswerEditor = ({ onChange, question }) => {
  const gapFillingAnswer = question.gapFillingAnswer || {};
  const answerGroups = toArray(gapFillingAnswer.answerGroups);

  const updateGroups = (nextGroups) => {
    onChange({
      gapFillingAnswer: {
        ...gapFillingAnswer,
        answerGroups: nextGroups,
      },
    });
  };

  return (
    <div className={css.blankEditor}>
      <Checkbox
        checked={!gapFillingAnswer.isOrder}
        onChange={(event) =>
          onChange({
            gapFillingAnswer: {
              ...gapFillingAnswer,
              isOrder: !event.target.checked,
            },
          })
        }
      >
        {trans(
          "singleInput.allowAnswerOrderMismatch",
          "允许学生答案与参考答案顺序不一致",
        )}
      </Checkbox>
      {answerGroups.map((group, groupIndex) => (
        <div className={css.blankGroup} key={group.editorId}>
          <div className={css.blankGroupHeader}>
            <span>
              {trans("singleInput.blankAnswerIndex", "第 {$index} 空", {
                index: groupIndex + 1,
              })}
            </span>
            {answerGroups.length > 1 ? (
              <Button
                size="small"
                type="link"
                onClick={(event) => {
                  event.preventDefault();
                  updateGroups(
                    answerGroups.filter((_, index) => index !== groupIndex),
                  );
                }}
              >
                {trans("global.delete", "删除")}
              </Button>
            ) : undefined}
          </div>
          <Select
            className={css.fullControl}
            dropdownStyle={{ display: "none" }}
            mode="tags"
            onChange={(values) =>
              updateGroups(
                answerGroups.map((item, index) =>
                  index === groupIndex
                    ? {
                        ...item,
                        answers: toArray(values).map((value, answerIndex) => ({
                          content: value,
                          editorId:
                            item.answers &&
                            getArrayItem(item.answers, answerIndex) &&
                            getArrayItem(item.answers, answerIndex).editorId
                              ? getArrayItem(item.answers, answerIndex).editorId
                              : `${item.editorId}-answer-${answerIndex}`,
                        })),
                      }
                    : item,
                ),
              )
            }
            placeholder={trans(
              "singleInput.blankAnswerInputPlaceholder",
              "点击输入，回车保存；支持多个可接受答案",
            )}
            value={getBlankAnswerValues(group.answers)}
          />
        </div>
      ))}
      <Button
        className={css.inlineAddButton}
        onClick={(event) => {
          event.preventDefault();
          updateGroups([
            ...answerGroups,
            {
              answers: [
                { content: "", editorId: `${question.editorId}-blank-new` },
              ],
              editorId: `${question.editorId}-blank-${answerGroups.length}`,
            },
          ]);
        }}
      >
        <Icon type="plus" />
        {trans("jsonInput.addBlank", "添加填空")}
      </Button>
    </div>
  );
};

BlankAnswerEditor.propTypes = {
  onChange: PropTypes.func.isRequired,
  question: PropTypes.object.isRequired,
};

export default BlankAnswerEditor;
