import React from "react";
import { Icon, InputNumber } from "antd";

import { trans } from "../../../utils/i18n";

import styles from "./index.module.less";

const ScoreInputNumber = (properties) => {
  const {
    question,
    formatter,
    onFocus,
    value,
    onBlur,
    onChange,
    onPressEnter,
    inputToolChange,
  } = properties;
  return (
    <div style={{ marginBottom: "12px" }} key={question.questionId}>
      <div className={styles.scoreBox}>
        <div className={styles.questionNumBox}>
          {question.questionSerialNumber}
        </div>
        <div className={styles.questionScoreBox}>
          ({question.questionScore}
          {trans("global.point", "分")})
        </div>

        <div style={{ position: "relative" }}>
          <InputNumber
            id={`scoreInput_${question.questionId}`}
            className="gradingPapersQuestionScoreNumber"
            precision={0}
            step={1}
            formatter={formatter}
            parser={(value_) => value_.replaceAll(/[+-]/g, "")}
            onFocus={onFocus}
            value={value}
            onBlur={onBlur}
            onChange={onChange}
            onPressEnter={onPressEnter}
          />
          {/* 这里自定义加减分快捷键，避免onChange事件监听错误 */}
          <div className={styles.inputToolBox}>
            <div className={styles.inputToolIcon}>
              <Icon
                type="up"
                onClick={() => {
                  inputToolChange(question.questionId, "up");
                }}
              />
            </div>
            <div className={styles.inputToolIcon}>
              <Icon
                type="down"
                onClick={() => {
                  inputToolChange(question.questionId, "down");
                }}
              />
            </div>
          </div>
        </div>

        <div className={styles.scoreResult}>
          <span className={styles.scoreResultText}>
            {trans("global.yourScore", "得分")}&nbsp;
          </span>
          <span className={styles.scoreResultNum}>{question.studentScore}</span>
        </div>
      </div>
      <div
        id={`errorMsgBox_${question.questionId}`}
        className={styles.errMessageBox}
      >
        {trans("gradingPapers.maxScorePrefix", "最高分为")}
        {question.questionScore}
        {trans("global.point", "分")}
      </div>
    </div>
  );
};
export default ScoreInputNumber;
