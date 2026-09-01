import React, { useState } from "react";
import { Button, Icon, InputNumber, Popover, Radio } from "antd";

import { trans } from "../../../utils/i18n";
import { type BatchScoreMode, isValidLeafScore } from "../paperEditorModel";

import styles from "../index.module.less";

interface Props {
  onConfirm: (score: number, mode: BatchScoreMode) => void;
}

const BATCH_SCORE_TRANSLATION_KEY = "paperEditor.batchSetScores";

/**
 * 编辑单个题型块的批量叶子分数，默认保留已有有效分数。
 * @param {Props} properties 批量设置回调。
 * @returns {React.ReactElement} 批量分数浮层入口。
 */
function ModuleBatchScoreEditor(properties: Props): React.ReactElement {
  const { onConfirm } = properties;
  const [mode, setMode] = useState<BatchScoreMode>("missing-only");
  const [score, setScore] = useState<number>();
  const [visible, setVisible] = useState(false);
  const content = (
    <div className={styles["batch-score-editor"]}>
      <label className={styles["batch-score-value"]}>
        <span>{trans("paperEditor.batchScoreValue", "每小题分值")}</span>
        <InputNumber
          aria-label={trans("paperEditor.batchScoreValue", "每小题分值")}
          min={0.1}
          step={0.1}
          value={score}
          onChange={(value) => setScore(value ?? undefined)}
        />
      </label>
      <Radio.Group
        aria-label={trans("paperEditor.batchScoreMode", "批量设置范围")}
        value={mode}
        onChange={(event) => setMode(event.target.value as BatchScoreMode)}
      >
        <Radio value="missing-only">
          {trans("paperEditor.fillMissingScores", "仅补齐未设置分数")}
        </Radio>
        <Radio value="overwrite-all">
          {trans("paperEditor.overwriteAllScores", "覆盖本块全部分数")}
        </Radio>
      </Radio.Group>
      <div className={styles["batch-score-actions"]}>
        <Button onClick={() => setVisible(false)}>
          {trans("global.cancel", "取消")}
        </Button>
        <Button
          disabled={!isValidLeafScore(score)}
          type="primary"
          onClick={() => {
            if (!isValidLeafScore(score)) return;
            onConfirm(score as number, mode);
            setVisible(false);
          }}
        >
          {trans("global.sure", "确定")}
        </Button>
      </div>
    </div>
  );
  return (
    <Popover
      content={content}
      placement="bottomRight"
      title={trans(BATCH_SCORE_TRANSLATION_KEY, "批量设置分数")}
      trigger="click"
      visible={visible}
      onVisibleChange={setVisible}
    >
      <Button
        aria-label={trans(BATCH_SCORE_TRANSLATION_KEY, "批量设置分数")}
        className={styles["batch-score-trigger"]}
        title={trans(BATCH_SCORE_TRANSLATION_KEY, "批量设置分数")}
        type="link"
      >
        <Icon aria-hidden="true" type="setting" />
      </Button>
    </Popover>
  );
}

export default ModuleBatchScoreEditor;
