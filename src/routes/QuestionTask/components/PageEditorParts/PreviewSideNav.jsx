import React from "react";
import { Icon } from "antd";
import PropTypes from "prop-types";

import { trans } from "../../../../utils/i18n";

import styles from "./PreviewSideNav.module.less";

const getPreviewModeButtonClassName = (previewMode, targetMode) =>
  `${styles["preview-side-button"]} ${
    previewMode === targetMode ? styles["preview-side-button-active"] : ""
  }`;

const getPreviewToggleTitle = (collapsed) =>
  collapsed
    ? trans("questionTask.expandPreviewNav", "展开预览入口")
    : trans("questionTask.collapsePreviewNav", "收起预览入口");

const PreviewSideNav = ({
  collapsed,
  hasAnswerAnalysis,
  hasAnswerSheet,
  onPreviewModeChange,
  onToggleCollapse,
  previewMode,
}) => (
  <div
    className={`${styles["preview-side-nav"]} ${
      collapsed ? styles["preview-side-nav-collapsed"] : ""
    }`}
  >
    <button
      className={styles["preview-side-toggle"]}
      title={getPreviewToggleTitle(collapsed)}
      type="button"
      onClick={onToggleCollapse}
    >
      <Icon type={collapsed ? "menu-unfold" : "menu-fold"} />
    </button>
    <div className={styles["preview-side-button-list"]}>
      <button
        className={getPreviewModeButtonClassName(previewMode, "question")}
        title={trans("questionTask.questionPreview", "题目预览")}
        type="button"
        onClick={(event) => {
          void event;
          onPreviewModeChange("question");
        }}
      >
        {collapsed
          ? trans("questionTask.questionPreviewShort", "题")
          : trans("questionTask.questionPreviewTab", "题目")}
      </button>
      {hasAnswerAnalysis ? (
        <button
          className={getPreviewModeButtonClassName(previewMode, "analysis")}
          title={trans("questionTask.analysisPreview", "解析预览")}
          type="button"
          onClick={(event) => {
            void event;
            onPreviewModeChange("analysis");
          }}
        >
          {collapsed
            ? trans("questionTask.analysisPreviewShort", "解")
            : trans("questionTask.analysisPreviewTab", "解析")}
        </button>
      ) : undefined}
      <button
        className={getPreviewModeButtonClassName(previewMode, "answerSheet")}
        disabled={!hasAnswerSheet}
        title={
          hasAnswerSheet
            ? trans("questionTask.referenceAnswerPreview", "参考答案")
            : trans("questionTask.noRecognizedQuestion", "暂无已识别题目")
        }
        type="button"
        onClick={(event) => {
          void event;
          onPreviewModeChange("answerSheet");
        }}
      >
        {collapsed
          ? trans("questionTask.referenceAnswerPreviewShort", "答")
          : trans("questionTask.referenceAnswerPreview", "参考答案")}
      </button>
    </div>
  </div>
);

PreviewSideNav.propTypes = {
  collapsed: PropTypes.bool,
  hasAnswerAnalysis: PropTypes.bool,
  hasAnswerSheet: PropTypes.bool,
  onPreviewModeChange: PropTypes.func.isRequired,
  onToggleCollapse: PropTypes.func.isRequired,
  previewMode: PropTypes.string.isRequired,
};

PreviewSideNav.defaultProps = {
  collapsed: false,
  hasAnswerAnalysis: false,
  hasAnswerSheet: false,
};

export default PreviewSideNav;
