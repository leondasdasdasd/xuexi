import React from "react";
import { Radio, TreeSelect } from "antd";
import PropTypes from "prop-types";

import { trans } from "../../../utils/i18n";
import {
  QUESTION_LEVEL_NORMAL,
  QUESTION_LEVEL_OPTIONS,
} from "../../../utils/questionDifficulty.js";

import styles from "../index.module.less";

const { SHOW_PARENT } = TreeSelect;
const PLEASE_CHOOSE_LABEL = trans("global.pleaseChoose", "请选择");

const QuestionAssetMetadataPanel = ({
  chapterOptions,
  indicatorOptions,
  knowledgeOptions,
  onChange,
  value,
}) => (
  <div className={styles["metadata-stack"]}>
    <div className={styles.field}>
      <span className={styles.label}>
        {trans("singleInput.difficultyContent", "难易程度")}
      </span>
      <Radio.Group
        className={styles["level-group"]}
        onChange={(event) => onChange({ level: event.target.value })}
        value={Number(value.level) || QUESTION_LEVEL_NORMAL}
      >
        {QUESTION_LEVEL_OPTIONS.map((option) => (
          <Radio.Button key={option.value} value={option.value}>
            {option.label}
          </Radio.Button>
        ))}
      </Radio.Group>
    </div>
    <div className={styles.field}>
      <span className={styles.label}>{trans("global.chapter", "章节")}</span>
      <TreeSelect
        allowClear
        className={styles.fullControl}
        onChange={(chapterId) =>
          onChange({ chapterIds: chapterId ? [chapterId] : [] })
        }
        placeholder={PLEASE_CHOOSE_LABEL}
        showCheckedStrategy={SHOW_PARENT}
        treeData={chapterOptions}
        value={value.chapterIds?.[0]}
      />
    </div>
    <div className={styles.field}>
      <span className={styles.label}>
        {trans("singleInput.knowledgeTree", "知识点")}
      </span>
      <TreeSelect
        allowClear
        className={styles.fullControl}
        onChange={(knowledgeIds) => onChange({ knowledgeIds })}
        placeholder={PLEASE_CHOOSE_LABEL}
        showCheckedStrategy={SHOW_PARENT}
        showSearch
        treeCheckable
        treeData={knowledgeOptions}
        value={value.knowledgeIds || []}
      />
    </div>
    <div className={styles.field}>
      <span className={styles.label}>{trans("singleInput.label", "素养")}</span>
      <TreeSelect
        allowClear
        className={styles.fullControl}
        onChange={(indicatorIds) => onChange({ indicatorIds })}
        placeholder={PLEASE_CHOOSE_LABEL}
        showCheckedStrategy={SHOW_PARENT}
        showSearch
        treeCheckable
        treeData={indicatorOptions}
        value={value.indicatorIds || []}
      />
    </div>
  </div>
);

const treeOptionsPropType = PropTypes.arrayOf(PropTypes.object).isRequired;

QuestionAssetMetadataPanel.propTypes = {
  chapterOptions: treeOptionsPropType,
  indicatorOptions: treeOptionsPropType,
  knowledgeOptions: treeOptionsPropType,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.shape({
    chapterIds: PropTypes.array,
    indicatorIds: PropTypes.array,
    knowledgeIds: PropTypes.array,
    level: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }).isRequired,
};

export default QuestionAssetMetadataPanel;
