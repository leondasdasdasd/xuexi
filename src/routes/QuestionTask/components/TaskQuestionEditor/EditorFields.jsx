import React, { useMemo } from "react";
import { InputNumber, Select, TreeSelect } from "antd";
import PropTypes from "prop-types";

import SlateRichEditor, {
  htmlToSlate,
  slateToHtml,
  Toolbar,
} from "../../../../components/SlateRichEditor";
import { trans } from "../../../../utils/i18n";
import {
  getQuestionLevelLabel,
  QUESTION_LEVEL_NORMAL,
  QUESTION_LEVEL_OPTIONS,
} from "../../../../utils/questionDifficulty.js";
import { css, Option, PLEASE_CHOOSE_LABEL, SHOW_PARENT } from "./constants";
import { getSectionNumberValue, getTreeLabelsByValues } from "./helpers";
import {
  normalizeIdList,
  normalizeRichTextHtml,
  toArray,
} from "./questionEditorModel";

export const SharedRichTextToolbar = ({
  activeEditorController,
  uploadImage,
}) => {
  const activeEditor = activeEditorController && activeEditorController.editor;
  const activeUploadImage =
    activeEditorController && activeEditorController.uploadImage
      ? activeEditorController.uploadImage
      : uploadImage;

  return (
    <Toolbar.Root
      className={css.sharedToolbar}
      data-question-editor-shared-toolbar="true"
      editor={activeEditor}
    >
      <Toolbar.Undo />
      <Toolbar.Redo />
      <Toolbar.Bold />
      <Toolbar.Italic />
      <Toolbar.Underline />
      <Toolbar.Strike />
      <Toolbar.Formula />
      <Toolbar.FontSize />
      <Toolbar.Color />
      <Toolbar.UnorderedList />
      <Toolbar.OrderedList />
      <Toolbar.AlignLeft />
      <Toolbar.AlignCenter />
      <Toolbar.AlignRight />
      <Toolbar.Table />
      <Toolbar.Image uploadImage={activeUploadImage} />
    </Toolbar.Root>
  );
};

SharedRichTextToolbar.propTypes = {
  activeEditorController: PropTypes.shape({
    editor: PropTypes.object,
    insertImage: PropTypes.func,
    toolbarStateKey: PropTypes.string,
    uploadImage: PropTypes.func,
  }),
  uploadImage: PropTypes.func,
};

export const RichTextField = ({
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

export const FieldLabel = ({ extra, required, title }) => (
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

export const QuestionTypeSelect = ({ onChange, options, value }) => (
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

export const SectionMetaFields = ({ question }) => (
  <>
    <div className={css.metaField}>
      <FieldLabel
        title={trans("questionTask.sectionNumber", "Section Number")}
      />
      <div className={css.metaValue}>
        {getSectionNumberValue(question) || "-"}
      </div>
    </div>
    <div className={css.metaField}>
      <FieldLabel title={trans("questionTask.sectionTitle", "Section Title")} />
      <div className={css.metaValue}>
        {question.sectionTitle ||
          trans("questionTask.ungroupedSection", "未分组")}
      </div>
    </div>
  </>
);

SectionMetaFields.propTypes = {
  question: PropTypes.object.isRequired,
};

export const MetaEditor = ({
  chapterTreeData,
  indicatorTreeData,
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

  const renderDifficultyField = (className = css.metaField) => (
    <div className={className}>
      <FieldLabel title={trans("singleInput.difficultyContent", "难易程度")} />
      <div
        className={css.levelGroup}
        role="radiogroup"
        aria-label={trans("singleInput.difficultyContent", "难易程度")}
      >
        {QUESTION_LEVEL_OPTIONS.map((item) => {
          const isChecked =
            (Number(question.questionLevel) || QUESTION_LEVEL_NORMAL) ===
            item.value;

          return (
            <button
              type="button"
              role="radio"
              aria-checked={isChecked}
              className={`${css.levelOption} ${
                isChecked ? css.levelOptionChecked : ""
              }`}
              onClick={(event) => {
                void event;
                onQuestionChange({
                  questionLevel: item.value,
                  questionLevelName: getQuestionLevelLabel(item.value),
                });
              }}
              key={item.value}
            >
              <span className={css.levelOptionLabel}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderScoreField = (className = css.metaField) => (
    <div className={className}>
      <FieldLabel title={trans("global.score", "分数")} />
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
  );

  return (
    <div className={css.metaGrid}>
      {renderDifficultyField()}
      {renderScoreField()}
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
