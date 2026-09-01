import React from "react";
import { Icon, Spin } from "antd";
import PropTypes from "prop-types";

import { trans } from "../../utils/i18n";

import styles from "./index.module.less";

export const renderQuestionTypeContent = ({
  errorMessage,
  loading,
  onAddQuestionType,
  onRetry,
  questionTypes,
}) => {
  if (loading) return <Spin size="small" />;
  if (errorMessage) {
    return (
      <div>
        {errorMessage}
        <button type="button" onClick={onRetry}>
          {trans("global.retry", "重试")}
        </button>
      </div>
    );
  }
  if (questionTypes.length === 0) {
    return (
      <div>{trans("twoWayTest.noAvailableQuestionTypes", "暂无可用题型")}</div>
    );
  }
  return questionTypes.map((item) => (
    <button
      className={styles.questionTypeContent}
      key={item.businessQuestionTypeId}
      onClick={() => onAddQuestionType(item)}
      type="button"
    >
      <Icon type="plus" style={{ marginRight: "5px", fontSize: "14px" }} />
      {item.label}
    </button>
  ));
};

const QuestionTypeBar = ({
  errorMessage,
  loading,
  onAddQuestionType,
  onRetry,
  questionTypes,
}) => (
  <div className={[styles.checkDiv, styles.flexRow].join(" ")}>
    <div className={styles.questionType}>{trans("global.questionType")}</div>
    {renderQuestionTypeContent({
      errorMessage,
      loading,
      onAddQuestionType,
      onRetry,
      questionTypes,
    })}
  </div>
);

QuestionTypeBar.propTypes = {
  errorMessage: PropTypes.string,
  loading: PropTypes.bool.isRequired,
  onAddQuestionType: PropTypes.func.isRequired,
  onRetry: PropTypes.func.isRequired,
  questionTypes: PropTypes.arrayOf(
    PropTypes.shape({
      businessQuestionTypeId: PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.string,
      ]).isRequired,
      label: PropTypes.string.isRequired,
    }),
  ).isRequired,
};

export default QuestionTypeBar;
