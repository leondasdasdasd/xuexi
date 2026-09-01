import React from "react";
import { InputNumber, Radio, TreeSelect } from "antd";
import PropTypes from "prop-types";

import { trans } from "../../utils/i18n";
import {
  getQuestionLevelLabel,
  QUESTION_LEVEL_NORMAL,
  QUESTION_LEVEL_OPTIONS,
} from "../../utils/questionDifficulty.js";
import FieldLabel from "./FieldLabel";
import { normalizeIdList, toArray } from "./questionEntryModel";
import { css } from "./questionEntryStyles";
import {
  getTreeLabelsByValues,
  PLEASE_CHOOSE_LABEL,
  SHOW_PARENT,
} from "./questionEntryUiHelpers";
import SectionMetaFields from "./SectionMetaFields";

const MetaEditor = ({
  chapterTreeData,
  indicatorTreeData,
  isChild,
  knowledgeTreeData,
  onQuestionChange,
  popupContainer,
  question,
}) => {
  const updateSelection = (field, value, label, treeData) => {
    const ids = normalizeIdList(value);
    const labels =
      toArray(label).length > 0
        ? toArray(label)
        : getTreeLabelsByValues(treeData, ids);

    onQuestionChange({
      [`${field}Ids`]: ids,
      [`${field}Labels`]: labels,
      [`${field}Selections`]: ids,
    });
  };

  const chapterValue = normalizeIdList(question.chapterSelections)[0];
  const scoreValue = Number(question.questionScore);

  return (
    <div className={css.metaGrid}>
      <div className={css.metaField}>
        <FieldLabel
          title={trans("singleInput.difficultyContent", "难易程度")}
        />
        <Radio.Group
          className={css.levelGroup}
          onChange={(event) =>
            onQuestionChange({
              questionLevel: event.target.value,
              questionLevelName: getQuestionLevelLabel(event.target.value),
            })
          }
          value={Number(question.questionLevel) || QUESTION_LEVEL_NORMAL}
        >
          {QUESTION_LEVEL_OPTIONS.map((item) => (
            <Radio.Button key={item.value} value={item.value}>
              {item.label}
            </Radio.Button>
          ))}
        </Radio.Group>
      </div>
      <div className={css.metaField}>
        <FieldLabel title={trans("global.questionScore", "分值")} />
        <InputNumber
          className={css.fullControl}
          min={0}
          onChange={(value) =>
            onQuestionChange({
              questionScore: value === undefined ? "" : String(value),
            })
          }
          placeholder={trans("questionTask.scorePlaceholder", "未设分")}
          value={
            question.questionScore === "" || !Number.isFinite(scoreValue)
              ? undefined
              : scoreValue
          }
        />
      </div>
      {isChild ? undefined : (
        <SectionMetaFields
          onQuestionChange={onQuestionChange}
          question={question}
        />
      )}
      <div className={css.metaField}>
        <FieldLabel title={trans("global.chapter", "章节")} />
        <TreeSelect
          allowClear
          className={css.fullControl}
          getPopupContainer={popupContainer}
          onChange={(value, label) =>
            updateSelection(
              "chapter",
              value ? [value] : [],
              label,
              chapterTreeData,
            )
          }
          placeholder={PLEASE_CHOOSE_LABEL}
          showCheckedStrategy={SHOW_PARENT}
          treeData={chapterTreeData}
          value={chapterValue}
        />
      </div>
      <div className={css.metaField}>
        <FieldLabel title={trans("singleInput.knowledgeTree", "知识点")} />
        <TreeSelect
          allowClear
          className={css.fullControl}
          getPopupContainer={popupContainer}
          onChange={(value, label) =>
            updateSelection("knowledge", value, label, knowledgeTreeData)
          }
          placeholder={PLEASE_CHOOSE_LABEL}
          showCheckedStrategy={SHOW_PARENT}
          showSearch
          treeCheckable
          treeData={knowledgeTreeData}
          value={normalizeIdList(question.knowledgeSelections)}
        />
      </div>
      <div className={css.metaField}>
        <FieldLabel title={trans("singleInput.label", "素养")} />
        <TreeSelect
          allowClear
          className={css.fullControl}
          getPopupContainer={popupContainer}
          onChange={(value, label) =>
            updateSelection("indicator", value, label, indicatorTreeData)
          }
          placeholder={PLEASE_CHOOSE_LABEL}
          showCheckedStrategy={SHOW_PARENT}
          showSearch
          treeCheckable
          treeData={indicatorTreeData}
          value={normalizeIdList(question.indicatorIds)}
        />
      </div>
      {isChild ? undefined : <div className={css.metaFieldPlaceholder} />}
    </div>
  );
};

MetaEditor.propTypes = {
  chapterTreeData: PropTypes.arrayOf(PropTypes.object).isRequired,
  indicatorTreeData: PropTypes.arrayOf(PropTypes.object).isRequired,
  isChild: PropTypes.bool,
  knowledgeTreeData: PropTypes.arrayOf(PropTypes.object).isRequired,
  onQuestionChange: PropTypes.func.isRequired,
  popupContainer: PropTypes.func.isRequired,
  question: PropTypes.object.isRequired,
};

export default MetaEditor;
