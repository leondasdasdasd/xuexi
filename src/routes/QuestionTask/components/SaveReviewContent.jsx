import React from "react";
import PropTypes from "prop-types";

import { trans } from "../../../utils/i18n";

import styles from "./SaveReviewContent.module.less";

const SCORE_DECIMAL_SCALE = 100;
const SAVE_REVIEW_STAT_CARD_CLASS_NAME = styles["save-review-stat-card"];
const SAVE_REVIEW_BIG_QUESTION_COUNT_KEY =
  "questionTask.reviewBigQuestionCount";
const SAVE_REVIEW_SUB_QUESTION_COUNT_KEY =
  "questionTask.reviewSubQuestionCount";
const SAVE_REVIEW_TOTAL_SCORE_KEY = "questionTask.reviewTotalScore";

const formatScoreValue = (value) => {
  const normalizedValue = Number(value) || 0;
  const fixedValue =
    Math.round(normalizedValue * SCORE_DECIMAL_SCALE) / SCORE_DECIMAL_SCALE;

  return String(fixedValue);
};

/**
 * 保存或提交前的试卷概览弹层内容。
 * @param {object} root0 属性集合
 * @param {string} root0.message 概览提示文案
 * @param {object} root0.summary 试卷概览数据
 * @param {string} root0.title 提示标题
 * @returns {JSX.Element} 试卷概览内容
 */
export default function SaveReviewContent({ message, summary, title }) {
  return (
    <div className={styles["save-review-content"]}>
      <div className={styles["save-review-stats"]}>
        <div className={SAVE_REVIEW_STAT_CARD_CLASS_NAME}>
          <span>{trans(SAVE_REVIEW_BIG_QUESTION_COUNT_KEY, "大题数")}</span>
          <strong>{summary.bigQuestionCount}</strong>
        </div>
        <div className={SAVE_REVIEW_STAT_CARD_CLASS_NAME}>
          <span>{trans(SAVE_REVIEW_SUB_QUESTION_COUNT_KEY, "小题数")}</span>
          <strong>{summary.subQuestionCount}</strong>
        </div>
        <div className={SAVE_REVIEW_STAT_CARD_CLASS_NAME}>
          <span>{trans(SAVE_REVIEW_TOTAL_SCORE_KEY, "总分")}</span>
          <strong>{formatScoreValue(summary.totalScore)}</strong>
        </div>
      </div>
      {message ? (
        <div className={styles["save-review-overview"]}>
          <div className={styles["save-review-overview-title"]}>{title}</div>
          <div className={styles["save-review-hint"]}>{message}</div>
        </div>
      ) : (
        false
      )}
      <div className={styles["save-review-overview"]}>
        <div className={styles["save-review-overview-title"]}>
          {trans("questionTask.reviewOverviewTitle", "题目概览")}
        </div>
        <div className={styles["recognition-groups"]}>
          {summary.groups.map((group) => (
            <div key={group.key} className={styles["recognition-group"]}>
              <div className={styles["recognition-group-header"]}>
                <span>{group.label}</span>
                <strong>
                  {trans("questionTask.reviewQuestionCount", "{$count} 题", {
                    count: group.items.length,
                  })}
                </strong>
              </div>
              <div className={styles["question-number-list"]}>
                {group.items.map((item) => (
                  <span
                    key={`${group.key}-${item.number}`}
                    className={`${styles["question-number-button"]} ${item.statusClassName} ${styles["save-review-question-number"]}`}
                    title={trans(
                      "questionTask.reviewQuestionNumberTitle",
                      "第 {$number} 题",
                      {
                        number: item.number,
                      },
                    )}
                  >
                    {item.number}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className={styles["recognition-legend"]}>
          <span>
            <i className={styles["legend-complete"]} />
            {trans("questionTask.reviewStatusCompleteShort", "完整")}
          </span>
          <span>
            <i className={styles["legend-missing-score"]} />
            {trans("questionTask.reviewStatusMissingScoreShort", "缺分数")}
          </span>
          <span>
            <i className={styles["legend-missing-analysis"]} />
            {trans("questionTask.reviewStatusMissingAnalysisShort", "缺解析")}
          </span>
          <span>
            <i className={styles["legend-missing-answer"]} />
            {trans("questionTask.reviewStatusMissingAnswerShort", "缺答案")}
          </span>
          <span>
            <i className={styles["legend-missing-all"]} />
            {trans("questionTask.reviewStatusPending", "待补齐")}
          </span>
        </div>
      </div>
    </div>
  );
}

SaveReviewContent.propTypes = {
  message: PropTypes.string,
  summary: PropTypes.shape({
    bigQuestionCount: PropTypes.number,
    completedCount: PropTypes.number,
    groups: PropTypes.arrayOf(PropTypes.object),
    saveWarningDetails: PropTypes.arrayOf(PropTypes.object),
    saveWarningIssues: PropTypes.arrayOf(PropTypes.string),
    subQuestionCount: PropTypes.number,
    submitBlockingDetails: PropTypes.arrayOf(PropTypes.object),
    submitBlockingIssues: PropTypes.arrayOf(PropTypes.string),
    totalScore: PropTypes.number,
  }).isRequired,
  title: PropTypes.string,
};

SaveReviewContent.defaultProps = {
  message: "",
  title: trans("questionTask.submitReviewPromptTitle", "提交提示"),
};
