import React from "react";
import { InputNumber } from "antd";

import { trans } from "../../../utils/i18n";
import { getPaperQuestionScoreElementId } from "../paperEditorDomIds";
import { getQuestionScore, isValidLeafScore } from "../paperEditorModel";
import { collectLeafQuestionScoreFields } from "../questionScoreFieldsModel";
import type { PaperQuestionDraft } from "../types";

import styles from "../index.module.less";

interface Props {
  onScoreChange: (questionKey: string, score?: number) => void;
  path?: number[];
  question: PaperQuestionDraft;
}

const changeLeafQuestionScore = (
  onScoreChange: Props["onScoreChange"],
  questionKey: string,
  value: number | null | undefined,
) => {
  if (value === null || value === undefined) {
    onScoreChange(questionKey);
    return;
  }
  if (isValidLeafScore(value)) {
    onScoreChange(questionKey, value);
    return;
  }
  onScoreChange(questionKey);
};

/**
 * 将组合题叶子分值集中展示，父题只展示一次自动汇总。
 * @param {Props} properties 分值编辑属性。
 * @returns {React.ReactElement} 叶子分值编辑器或复合题汇总。
 */
function QuestionScoreFields(properties: Props): React.ReactElement {
  const { onScoreChange, path = [], question } = properties;
  if (question.children.length > 0) {
    const leafFields = collectLeafQuestionScoreFields(question, path);
    return (
      <div className={styles["child-scores"]}>
        <div className={styles["score-summary"]}>
          {trans("paperEditor.compositeScore", "复合题总分")}:
          {getQuestionScore(question)}
        </div>
        {leafFields.map((field) => (
          <div className={styles["child-score-row"]} key={field.question.key}>
            <span>
              {trans("paperEditor.subQuestion", "小题")} {field.path.join(".")}
            </span>
            <InputNumber
              id={getPaperQuestionScoreElementId(field.question.key)}
              aria-label={trans(
                "paperEditor.subQuestionScore",
                "第 {$path} 小题分值",
                { path: field.path.join(".") },
              )}
              min={0.1}
              step={0.1}
              value={field.question.score}
              onChange={(value) =>
                changeLeafQuestionScore(
                  onScoreChange,
                  field.question.key,
                  value,
                )
              }
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <InputNumber
      id={getPaperQuestionScoreElementId(question.key)}
      aria-label={
        path.length > 0
          ? trans("paperEditor.subQuestionScore", "第 {$path} 小题分值", {
              path: path.join("."),
            })
          : trans("paperEditor.questionScore", "题目分值")
      }
      min={0.1}
      step={0.1}
      value={question.score}
      onChange={(value) =>
        changeLeafQuestionScore(onScoreChange, question.key, value)
      }
    />
  );
}

export default QuestionScoreFields;
