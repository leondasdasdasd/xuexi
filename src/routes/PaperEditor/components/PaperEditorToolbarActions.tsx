import React from "react";
import { Button, Tooltip } from "antd";

import { trans } from "../../../utils/i18n";

import styles from "../index.module.less";

interface Props {
  editAction?: PaperEditorEditAction;
  editable: boolean;
  onAddQuestion: () => void;
  onDownloadAnswerSheet?: () => void;
  onDownloadPaper?: () => void;
  onInitiateTest?: () => void;
  onSave: () => void;
  saving: boolean;
}

export interface PaperEditorEditAction {
  allowed: boolean;
  disabledReason?: string;
  onEdit: () => void;
}

const createAddQuestionButton = (
  editable: boolean,
  onAddQuestion: () => void,
) =>
  editable ? (
    <Button onClick={onAddQuestion}>
      {trans("global.addQuestion", "新增题目")}
    </Button>
  ) : null;

const createDownloadButtons = (
  onDownloadAnswerSheet?: () => void,
  onDownloadPaper?: () => void,
) => (
  <>
    {onDownloadAnswerSheet ? (
      <Button
        aria-label={trans("global.downLoadCard", "下载答题卡")}
        onClick={onDownloadAnswerSheet}
      >
        {trans("global.downLoadCard", "下载答题卡")}
      </Button>
    ) : null}
    {onDownloadPaper ? (
      <Button
        aria-label={trans("global.downloadTestPaper3", "下载试卷")}
        onClick={onDownloadPaper}
      >
        {trans("global.downloadTestPaper3", "下载试卷")}
      </Button>
    ) : null}
  </>
);

const createInitiateTestButton = (onInitiateTest?: () => void) =>
  onInitiateTest ? (
    <Button type="primary" onClick={onInitiateTest}>
      {trans("global.initiateTest", "发起测验")}
    </Button>
  ) : null;

/**
 * 根据试卷状态提供编辑与保存入口。
 * @param {Props} properties 页面能力与操作回调。
 * @returns {React.ReactElement} 工具栏操作区。
 */
function PaperEditorToolbarActions(properties: Props): React.ReactElement {
  const {
    editAction,
    editable,
    onAddQuestion,
    onDownloadAnswerSheet,
    onDownloadPaper,
    onInitiateTest,
    onSave,
    saving,
  } = properties;
  const editButton = editAction ? (
    <Button
      aria-disabled={!editAction.allowed}
      className={
        editAction.allowed ? undefined : styles["toolbar-disabled-action"]
      }
      onClick={editAction.allowed ? editAction.onEdit : undefined}
    >
      {trans("paperEditor.editPaper", "编辑试卷")}
    </Button>
  ) : null;
  const addQuestionButton = createAddQuestionButton(editable, onAddQuestion);
  const downloadButtons = createDownloadButtons(
    onDownloadAnswerSheet,
    onDownloadPaper,
  );
  const initiateTestButton = createInitiateTestButton(onInitiateTest);
  return (
    <div className={styles["toolbar-actions"]}>
      {addQuestionButton}
      {downloadButtons}
      {initiateTestButton}
      {editAction?.allowed || !editButton ? (
        editButton
      ) : (
        <Tooltip
          title={
            editAction?.disabledReason ||
            trans(
              "paperEditor.readOnlyPermission",
              "当前账号无试卷编辑权限，已切换为预览模式",
            )
          }
        >
          {editButton}
        </Tooltip>
      )}
      {editable ? (
        <Button
          className={styles["toolbar-save"]}
          loading={saving}
          type="primary"
          onClick={onSave}
        >
          {trans("paperEditor.savePaper", "保存试卷")}
        </Button>
      ) : null}
    </div>
  );
}

export default PaperEditorToolbarActions;
