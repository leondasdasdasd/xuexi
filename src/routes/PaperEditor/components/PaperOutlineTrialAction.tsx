import React from "react";

import { trans } from "../../../utils/i18n";

import styles from "../index.module.less";

interface Props {
  onIpadTrial?: () => void;
  onTrial?: () => void;
}

/**
 * 在试卷结构末尾渲染统一的教师试作入口。
 * @param {Props} properties 当前试卷可用时提供的试作回调。
 * @returns {React.ReactElement|null} 电脑端与 iPad 试作按钮。
 */
function PaperOutlineTrialAction(properties: Props): React.ReactElement | null {
  const { onIpadTrial, onTrial } = properties;
  if (!onTrial && !onIpadTrial) return null;
  const trialLabel = onIpadTrial
    ? trans("global.PCPreview", "电脑端试做")
    : trans("paperEditor.tryPaper", "试作");
  return (
    <div className={styles["outline-trial"]}>
      {onTrial ? (
        <button
          className={styles["outline-trial-button"]}
          type="button"
          onClick={onTrial}
        >
          {trialLabel}
        </button>
      ) : null}
      {onIpadTrial ? (
        <button
          className={styles["outline-trial-button"]}
          type="button"
          onClick={onIpadTrial}
        >
          {trans("global.IPadPreview", "iPad端试做")}
        </button>
      ) : null}
    </div>
  );
}

export default PaperOutlineTrialAction;
