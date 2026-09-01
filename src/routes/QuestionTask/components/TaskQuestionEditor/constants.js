import { Select, TreeSelect } from "antd";

import { trans } from "../../../../utils/i18n";
import {
  QUESTION_TYPE_COMBINATION,
  QUESTION_TYPE_MULTIPLE_VOTE,
  QUESTION_TYPE_OPTIONS,
  QUESTION_TYPE_SINGLE_VOTE,
} from "./questionEditorModel";

import styles from "./index.module.less";

export const css = {
  body: styles.body,
  editorContent: styles["editor-content"],
  editorContentMain: styles["editor-content-main"],
  editorShell: styles["editor-shell"],
  editorStage: styles["editor-stage"],
  editorStageImagesCollapsed: styles["editor-stage-images-collapsed"],
  editorStageWithImages: styles["editor-stage-with-images"],
  header: styles.header,
  iconButton: styles["icon-button"],
  headerTitle: styles["header-title"],
  headerActions: styles["header-actions"],
  annotationToggle: styles["annotation-toggle"],
  sharedToolbar: styles["shared-toolbar"],
  sourceImageDock: styles["source-image-dock"],
  sourceImageStrip: styles["source-image-strip"],
  sourceImageStripCollapsed: styles["source-image-strip-collapsed"],
  sourceImageStripHeader: styles["source-image-strip-header"],
  sourceImageToggle: styles["source-image-toggle"],
  sourceImageCount: styles["source-image-count"],
  sourceImagePageChips: styles["source-image-page-chips"],
  sourceImageList: styles["source-image-list"],
  sourceImageButton: styles["source-image-button"],
  sourceImageThumbnail: styles["source-image-thumbnail"],
  sourceImagePageBadge: styles["source-image-page-badge"],
  scopeBar: styles["scope-bar"],
  scopeField: styles["scope-field"],
  metaField: styles["meta-field"],
  metaValue: styles["meta-value"],
  formField: styles["form-field"],
  analysisField: styles["analysis-field"],
  questionBlock: styles["question-block"],
  childQuestionBlock: styles["child-question-block"],
  blockHeader: styles["block-header"],
  blockHeaderActions: styles["block-header-actions"],
  blockHeaderTitle: styles["block-header-title"],
  blockTitle: styles["block-title"],
  blockSubTitle: styles["block-sub-title"],
  fieldStack: styles["field-stack"],
  fieldLabel: styles["field-label"],
  richTextField: styles["rich-text-field"],
  fullControl: styles["full-control"],
  metaGrid: styles["meta-grid"],
  levelGroup: styles["level-group"],
  levelOption: styles["level-option"],
  levelOptionChecked: styles["level-option-checked"],
  levelOptionLabel: styles["level-option-label"],
  optionList: styles["option-list"],
  blankEditor: styles["blank-editor"],
  childList: styles["child-list"],
  optionRow: styles["option-row"],
  answerToggle: styles["answer-toggle"],
  answerToggleChecked: styles["answer-toggle-checked"],
  radioDot: styles["radio-dot"],
  optionKey: styles["option-key"],
  optionEditor: styles["option-editor"],
  optionActions: styles["option-actions"],
  inlineAddButton: styles["inline-add-button"],
  blankGroup: styles["blank-group"],
  blankGroupHeader: styles["blank-group-header"],
  blankAnswerList: styles["blank-answer-list"],
  blankAnswerRow: styles["blank-answer-row"],
  blankAnswerMeta: styles["blank-answer-meta"],
  blankAnswerEditor: styles["blank-answer-editor"],
  blankAnswerActions: styles["blank-answer-actions"],
  judgeGroup: styles["judge-group"],
  childListHeader: styles["child-list-header"],
  childActions: styles["child-actions"],
  childTypeSelect: styles["child-type-select"],
};

export const { Option } = Select;
export const { SHOW_PARENT } = TreeSelect;

export const PLEASE_CHOOSE_LABEL = trans("global.pleaseChoose", "请选择");
export const MIN_OPTION_COUNT = 2;
export const CHILD_TYPE_OPTIONS = QUESTION_TYPE_OPTIONS.filter(
  (item) =>
    ![
      QUESTION_TYPE_COMBINATION,
      QUESTION_TYPE_SINGLE_VOTE,
      QUESTION_TYPE_MULTIPLE_VOTE,
    ].includes(Number(item.value)),
);

export const QUESTION_TASK_EDITOR_PREFERENCE_STORAGE_KEY =
  "question-task-editor-preferences";
