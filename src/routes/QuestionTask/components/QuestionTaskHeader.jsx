import React from "react";
import { Icon } from "antd";
import PropTypes from "prop-types";

import { trans } from "../../../utils/i18n";
import { QuestionTaskAiHeaderActions } from "./QuestionTaskHeaderActions";

import styles from "./QuestionTaskHeader.module.less";

const SAVE_PAPER_KEY = "questionTask.savePaper";
const SAVE_PAPER_TEXT = "保存试卷";
const SUBMIT_PAPER_KEY = "questionTask.submitPaper";
const SUBMIT_PAPER_TEXT = "试卷提交";
const HEADER_ACTION_GROUP_CLASS_NAME = styles["header-action-group"];
const HEADER_ACTION_GROUP_PRIMARY_CLASS_NAME =
  styles["header-action-group-primary"];
const QUESTION_CARD_DISPLAY_MODE = {
  PREVIEW: "preview",
  REVIEW: "review",
};
const DISPLAY_MODE_OPTIONS = [
  {
    label: (event) => {
      void event;

      return trans("questionTask.previewDisplayMode", "预览");
    },
    value: QUESTION_CARD_DISPLAY_MODE.PREVIEW,
  },
  {
    label: (event) => {
      void event;

      return trans("questionTask.reviewDisplayMode", "检阅");
    },
    value: QUESTION_CARD_DISPLAY_MODE.REVIEW,
  },
];

const getFullscreenLabel = (view) =>
  view.isPageFullscreen
    ? trans("questionTask.exitFullscreen", "退出全屏模式")
    : trans("questionTask.enterFullscreen", "进入全屏模式");

const getFullscreenIconType = (view) =>
  view.isPageFullscreen ? "shrink" : "arrows-alt";

const getSaveButtonText = (view) =>
  view.savingAction === "save"
    ? trans("questionTask.savingPaper", "保存中...")
    : trans(SAVE_PAPER_KEY, SAVE_PAPER_TEXT);

const getSubmitButtonText = (view) =>
  view.savingAction === "submit"
    ? trans("questionTask.submittingPaper", "提交中...")
    : trans(SUBMIT_PAPER_KEY, SUBMIT_PAPER_TEXT);

const getSubmitButtonTitle = (view) =>
  view.hasRunningAiTask
    ? trans(
        "questionTask.aiTaskRunningSubmitBlock",
        "存在进行中的 AI 任务，暂不能提交试卷。请先等待任务结束或取消任务。",
      )
    : trans(SUBMIT_PAPER_KEY, SUBMIT_PAPER_TEXT);

const getQuestionTaskHeaderTitle = (view) =>
  view.paperName || trans("questionTask.title", "AI 录入试卷");

const getSavedAtStatusClassName = (view) =>
  view.lastSavedAtText === trans("questionTask.notSaved", "未保存")
    ? styles["header-status-value-pending"]
    : styles["header-status-value-saved"];

const QuestionTaskDisplayModeSwitch = ({ view }) => (
  <div
    aria-label={trans("questionTask.displayMode", "显示模式")}
    className={styles["display-mode-switch"]}
    role="group"
  >
    {DISPLAY_MODE_OPTIONS.map((option) => {
      const selected = view.questionCardDisplayMode === option.value;

      return (
        <button
          key={option.value}
          aria-pressed={selected}
          className={`${styles["display-mode-button"]} ${
            selected ? styles["display-mode-button-active"] : ""
          }`}
          onClick={(event) => {
            void event;
            view.setQuestionCardDisplayMode(option.value);
          }}
          type="button"
        >
          {option.label()}
        </button>
      );
    })}
  </div>
);

const QuestionTaskHeader = ({ view }) => (
  <div className={styles["header"]}>
    <div className={styles["header-main"]}>
      <button
        aria-label={view.closeLabel}
        className={styles["close-button"]}
        onClick={view.handleClose}
        title={view.closeLabel}
        type="button"
      >
        <Icon type="close" />
      </button>
      <div className={styles["header-title-block"]}>
        <div
          className={styles["title"]}
          title={getQuestionTaskHeaderTitle(view)}
        >
          {getQuestionTaskHeaderTitle(view)}
        </div>
        <div className={styles["header-status-row"]}>
          <span className={styles["header-status-label"]}>
            {trans("questionTask.lastSavedAt", "上次保存：")}
          </span>
          <span className={getSavedAtStatusClassName(view)}>
            {view.lastSavedAtText}
          </span>
        </div>
      </div>
    </div>
    <div className={styles["header-actions"]}>
      <div className={HEADER_ACTION_GROUP_CLASS_NAME}>
        <QuestionTaskDisplayModeSwitch view={view} />
      </div>
      <div className={HEADER_ACTION_GROUP_CLASS_NAME}>
        <button
          aria-label={getFullscreenLabel(view)}
          className={styles["ai-header-solo-icon-button"]}
          onClick={view.handleToggleFullscreen}
          title={getFullscreenLabel(view)}
          type="button"
        >
          <Icon type={getFullscreenIconType(view)} />
        </button>
      </div>
      <div className={HEADER_ACTION_GROUP_CLASS_NAME}>
        <QuestionTaskAiHeaderActions view={view} />
      </div>
      <div
        className={`${HEADER_ACTION_GROUP_CLASS_NAME} ${HEADER_ACTION_GROUP_PRIMARY_CLASS_NAME}`}
      >
        <button
          aria-label={trans(SAVE_PAPER_KEY, SAVE_PAPER_TEXT)}
          className={styles["secondary-button"]}
          disabled={view.loading || view.isSaving}
          onClick={view.handleSave}
          title={trans(SAVE_PAPER_KEY, SAVE_PAPER_TEXT)}
          type="button"
        >
          {getSaveButtonText(view)}
        </button>
        <button
          aria-label={trans(SUBMIT_PAPER_KEY, SUBMIT_PAPER_TEXT)}
          className={styles["save-button"]}
          disabled={view.loading || view.isSaving || view.hasRunningAiTask}
          onClick={view.handleSubmit}
          title={getSubmitButtonTitle(view)}
          type="button"
        >
          {getSubmitButtonText(view)}
        </button>
      </div>
    </div>
  </div>
);

QuestionTaskDisplayModeSwitch.propTypes = {
  view: PropTypes.any.isRequired,
};

QuestionTaskHeader.propTypes = {
  view: PropTypes.any.isRequired,
};

export default QuestionTaskHeader;
