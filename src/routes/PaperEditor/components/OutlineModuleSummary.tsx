import React from "react";

import { trans } from "../../../utils/i18n";
import { getModuleScore } from "../paperEditorModel";
import type { PaperModuleDraft } from "../types";

import styles from "../index.module.less";

interface Props {
  module: PaperModuleDraft;
}

/**
 * 展示目录模块标题后的总分与靠右题量。
 * @param {Props} root0 模块统计属性。
 * @param {PaperModuleDraft} root0.module 需要统计的试卷模块。
 * @returns {React.ReactElement} 模块总分与题量。
 */
function OutlineModuleSummary({ module }: Props): React.ReactElement {
  return (
    <span className={styles["outline-module-summary"]}>
      <span>
        {trans("paperEditor.moduleTitleScore", "（{$score}分）", {
          score: String(getModuleScore(module)),
        })}
      </span>
      <span className={styles["outline-module-question-count"]}>
        {trans("paperEditor.questionCountSummary", "共{$count}题", {
          count: String(module.questions.length),
        })}
      </span>
    </span>
  );
}

export default OutlineModuleSummary;
