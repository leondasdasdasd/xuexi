import React from "react";

import { trans } from "../../utils/i18n";

import styles from "./index.module.less";

// 是否以字母开头
/**
 *
 * @param string_
 */
function isAlphaStart(string_) {
  return /^[A-Za-z]/.test(string_);
}

/**
 *
 * @param properties
 */
function AnswerOptions(properties) {
  const { question, isAnswer } = properties;

  // type: 1单选题 2多选题 3填空题 4判断题 5简答题 7图片单选题 8图片多选题
  const change = (question, data) => {
    const type = question.type;
    properties.onChange(type, data);
  };

  if ((question.type === 1 || question.type === 7) && question.optionList) {
    return question.optionList.map((option, newI) => {
      // 是否以字母开头(如果是字母开头手动删除掉A. B. C.)
      let flag = isAlphaStart(option.answers);
      return (
        <div
          className={styles.optionContent}
          onClick={() => {
            change(question, { value: option.key });
          }}
        >
          <div
            className={`${styles.optionHandle} ${question.studentAnswer === option.key ? styles.checkedOption : ""}`}
          >
            {option.key}
          </div>
          <div
            style={{ display: "flex" }}
            dangerouslySetInnerHTML={{
              __html: flag ? option.answers?.slice(2) : option.answers,
            }}
          ></div>
        </div>
      );
    });
  } else if (
    (question.type === 2 || question.type === 8) &&
    question.optionList
  ) {
    return question.optionList.map((option, newI) => {
      // 是否以字母开头(如果是字母开头手动删除掉A. B. C.)
      let flag = isAlphaStart(option.answers);
      return (
        <div
          className={styles.optionContent}
          onClick={() => {
            change(question, { value: option.key });
          }}
        >
          <div
            className={`${styles.optionHandle} ${question.studentAnswer?.indexOf(option.key) > -1 ? styles.checkedOption : ""}`}
          >
            {option.key}
          </div>
          <div
            style={{ display: "flex", whiteSpace: "nowrap" }}
            dangerouslySetInnerHTML={{
              __html: flag ? option.answers?.slice(2) : option.answers,
            }}
          ></div>
        </div>
      );
    });
  } else
    switch (question.type) {
      case 3: {
        if (isAnswer) {
          return question.studentGapFillingAnswer?.length
            ? question.studentGapFillingAnswer.map((index, op) => (
                <div
                  style={{
                    position: "relative",
                    marginRight: "20px",
                    minWidth: "100px",
                    height: "32px",
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      width: "100%",
                      height: "100%",
                      visibility: "hidden",
                    }}
                  >
                    {index}
                  </span>
                  <input
                    className={styles.gapfilling}
                    placeholder={trans(
                      "answerOptions.answerPlaceholder",
                      "点击填写答案",
                    )}
                    value={index}
                    onChange={(e) => {
                      change(question, {
                        index: op,
                        value: e.target.value,
                      });
                    }}
                  />
                </div>
              ))
            : null;
        } else {
          return (
            <div className={styles.optionContent}>
              {question?.studentGapFillingAnswer?.length //学生答案
                ? question.studentGapFillingAnswer.map((index, op) => (
                    <div
                      className={styles.completionList}
                      dangerouslySetInnerHTML={{ __html: index }}
                    />
                  ))
                : question.gapFillingAnswer?.answers?.length // 答案
                  ? question.gapFillingAnswer.answers.map((index) => (
                      <div
                        className={`${styles.completionList} ${styles.notwrite}`}
                      />
                    ))
                  : null}
            </div>
          );
        }
      }
      case 4: {
        return (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              minWidth: "20%",
              padding: "5px",
              margin: "0px 5px 5px 0",
              borderRadius: "8px",
            }}
          >
            <div
              style={{ marginRight: "8px" }}
              className={`${styles.judgeOption} ${question.studentAnswer == "true" || question.studentAnswer === true ? styles.checkedOption : ""}`}
              onClick={() => {
                change(question, { value: true });
              }}
            >
              <div className={styles.judgeIcon}>
                <i className={`${styles.iconfont}`}>&#xe6a8;</i>
              </div>
              <div className={styles.judgeLabel}>
                {trans("global.right", "正确")}
              </div>
            </div>
            <div
              className={`${styles.judgeOption} ${question.studentAnswer == "false" || question.studentAnswer === false ? styles.checkedOption : ""}`}
              onClick={() => {
                change(question, { value: false });
              }}
            >
              <div className={styles.judgeIcon}>
                <i className={`${styles.iconfont}`}>&#xe6a9;</i>
              </div>
              <div className={styles.judgeLabel}>
                {trans("global.wrong", "错误")}
              </div>
            </div>
          </div>
        );
      }
      case 5: {
        return (
          <div
            dangerouslySetInnerHTML={{ __html: question.studentAnswer }}
            className={styles.completionList}
          />
        );
      }
      default: {
        return (
          <span>
            {trans(
              "answerOptions.questionTypeNotMatched",
              "未能够匹配到对应的题目类型",
            )}
          </span>
        );
      }
    }
}
export default AnswerOptions;
