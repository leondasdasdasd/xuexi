import React from "react";

import { trans } from "../../../utils/i18n";
import { getQuestionScore } from "../paperEditorModel";
import { collectLeafQuestionScoreFields } from "../questionScoreFieldsModel";
import type { PaperQuestionDraft } from "../types";

import styles from "../index.module.less";

interface Props {
  question: PaperQuestionDraft;
}

/**
 * 按编辑模式的同一分值语义渲染纯文本分值。
 * @param {Props} properties 题目分值属性。
 * @returns {React.ReactElement} 题目及子题的只读分值。
 */
function ReadOnlyQuestionScores({ question }: Props): React.ReactElement {
  const leafFields = collectLeafQuestionScoreFields(question);
  return (
    <div className={styles["readonly-question-score"]}>
      <strong>
        {question.children.length > 0
          ? trans("paperEditor.compositeScore", "复合题总分")
          : trans("paperEditor.questionScore", "题目分值")}
        : {getQuestionScore(question)}
      </strong>
      {question.children.length > 0
        ? leafFields.map((field) => (
            <span
              className={styles["readonly-score-item"]}
              key={field.question.key}
            >
              {trans("paperEditor.subQuestion", "小题")} {field.path.join(".")}:
              {field.question.score || 0}
            </span>
          ))
        : null}
    </div>
  );
}

export default ReadOnlyQuestionScores;
