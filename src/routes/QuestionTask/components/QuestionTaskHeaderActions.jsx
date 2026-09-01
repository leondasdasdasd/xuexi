import React from "react";
import { Icon } from "antd";
import PropTypes from "prop-types";

import { trans } from "../../../utils/i18n";

import styles from "./QuestionTaskHeader.module.less";

const EMPTY_TYPE_EXAMPLES = {
  answer: "",
  blank: "",
  choice: "",
  judge: "",
  prompt: "",
};

const isAiHeaderActionDisabled = (view) =>
  view.loading ||
  view.isSaving ||
  view.isEditSessionActive ||
  view.visibleQuestions.length === 0 ||
  view.isBatchToolRunning;

const AI_HEADER_ACTION_REGISTRY = [
  {
    getIconType: (view) =>
      view.isBatchAnalysisRunning ? "loading" : "setting",
    getText: (view) =>
      view.isBatchAnalysisRunning
        ? trans("questionTask.aiGenerating", "AI生成中")
        : trans("questionTask.aiAnalysis", "AI解析"),
    onRun: (view) =>
      view.runBatchAiAnalysis({
        model: view.batchAiSettings.model || view.defaultAiModel,
        prompt: view.batchAiSettings.prompt || view.defaultBatchAnalysisPrompt,
        typeExamples: view.batchAiSettings.typeExamples || EMPTY_TYPE_EXAMPLES,
      }),
    onSettings: (view) => view.openBatchAiModal(),
    renderCount: (view) =>
      view.aiSupplementCount ? (
        <span className={styles["ai-header-count"]}>
          {view.aiSupplementCount}
        </span>
      ) : (
        false
      ),
    settingsLabel: (event) => {
      void event;

      return trans("questionTask.aiAnalysisSettings", "AI解析设置");
    },
    title: (event) => {
      void event;

      return trans(
        "questionTask.batchAiAnalysisTitle",
        "按当前保存规则批量补充缺失答案和解析",
      );
    },
  },
  {
    getIconType: (view) => (view.isBatchQualityRunning ? "loading" : "setting"),
    getText: (view) =>
      view.isBatchQualityRunning
        ? trans("questionTask.aiGenerating", "AI生成中")
        : trans("questionTask.aiQuality", "AI质检"),
    onRun: (view) => view.runBatchQualityCheck(),
    onSettings: (view) => view.openBatchQualityCheckModal(),
    renderCount: (event) => {
      void event;

      return false;
    },
    settingsLabel: (event) => {
      void event;

      return trans("questionTask.aiQualitySettings", "AI质检设置");
    },
    title: (event) => {
      void event;

      return trans(
        "questionTask.batchAiQualityTitle",
        "按通用出版级标准批量质检题干、答案和解析",
      );
    },
  },
];

const QuestionTaskAiHeaderAction = ({ action, view }) => (
  <div className={styles["ai-header-compound-button"]}>
    <button
      className={styles["ai-header-button"]}
      disabled={isAiHeaderActionDisabled(view)}
      onClick={(clickEvent) => {
        void clickEvent;
        action.onRun(view);
      }}
      title={action.title(view)}
      type="button"
    >
      {action.getText(view)}
      {action.renderCount(view)}
    </button>
    <button
      aria-label={action.settingsLabel(view)}
      className={styles["ai-header-inline-icon-button"]}
      disabled={isAiHeaderActionDisabled(view)}
      onClick={(clickEvent) => {
        void clickEvent;
        action.onSettings(view);
      }}
      title={action.settingsLabel(view)}
      type="button"
    >
      <Icon type={action.getIconType(view)} />
    </button>
  </div>
);

export const QuestionTaskAiHeaderActions = ({ view }) =>
  AI_HEADER_ACTION_REGISTRY.map((action) => (
    <QuestionTaskAiHeaderAction
      key={action.settingsLabel(view)}
      action={action}
      view={view}
    />
  ));

QuestionTaskAiHeaderAction.propTypes = {
  action: PropTypes.object.isRequired,
  view: PropTypes.any.isRequired,
};

QuestionTaskAiHeaderActions.propTypes = {
  view: PropTypes.any.isRequired,
};
