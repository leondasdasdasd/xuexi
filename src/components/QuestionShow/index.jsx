// 类组件
import React from "react";

import { trans } from "../../utils/i18n";
import Options from "./components/Options";

import styles from "./index.module.less";
class QuestionStem extends React.Component {
  constructor(properties) {
    super(properties);
    this.state = {};
  }

  // 初始化会执行 相当于componentWillMount
  // 更新会执行 相当于componentWillUpdate
  static getDerivedStateFromProps(nextProperties, nextState) {
    return {
      // 规定要返回数据，和state进行合并更新, state中有同名，否则新增到state中
      // xxx: nextProps.xxx,
    };
  }

  componentDidMount() {}

  render() {
    const { question } = this.props;
    const canOpenTwoWay = !!this.props.openTwoWay;
    return (
      <div className={styles.questionItem}>
        <div
          className={styles.questionSerialNumber}
          id={`question${question?.questionSerialNumber}`}
        >
          {question.questionSerialNumber}.
        </div>
        <div style={{ flexGrow: 1 }}>
          <div className={styles.questionContent}>
            {question.questionScore ? (
              <span className={styles.scoreWarp}>
                {`（${question.questionScore} ${trans("global.point", "分")}）`}
              </span>
            ) : null}
            {question.questionId ? (
              <div
                className={styles.questionContentWarp}
                dangerouslySetInnerHTML={{ __html: question.content }}
              ></div>
            ) : canOpenTwoWay ? (
              <span>
                {trans("questionShow.clickTopRightPrefix", "请在右上角的")}
                <span
                  style={{
                    color: "#0445FC",
                    textDecoration: "underline",
                    cursor: "pointer",
                  }}
                  onClick={this.props.openTwoWay}
                >
                  {trans("questionShow.setBlueprintAction", "【设置细目表】")}
                </span>
                {trans(
                  "questionShow.linkQuestionFromBankTip",
                  "从题库中选择题目进行关联，题库中没有时，可先新建题目后再进行关联。",
                )}
              </span>
            ) : (
              <span>
                {trans(
                  "questionShow.finishAssociationFirst",
                  "请先完成题目关联。",
                )}
              </span>
            )}
          </div>
          {question.optionList && question.optionList.length > 0 ? (
            <div className={styles.questionOptions}>
              <Options question={question} />
            </div>
          ) : null}

          {question.sonQuestionList && question.sonQuestionList.length > 0
            ? question.sonQuestionList.map((index, inde) => (
                <>
                  <div
                    className={styles.childQuestionItem}
                    id={`question${index.questionSerialNumber}`}
                  >
                    <div style={{ float: "left", height: "100%" }}>
                      {index.questionSerialNumber} &nbsp;
                    </div>

                    {question.questionId ? (
                      <div
                        className={styles.childBox}
                        dangerouslySetInnerHTML={{ __html: index.content }}
                      />
                    ) : canOpenTwoWay ? (
                      <span>
                        {trans(
                          "questionShow.clickTopRightPrefix",
                          "请在右上角的",
                        )}
                        <span
                          style={{
                            color: "#0445FC",
                            textDecoration: "underline",
                            cursor: "pointer",
                          }}
                          onClick={this.props.openTwoWay}
                        >
                          {trans(
                            "questionShow.setBlueprintAction",
                            "【设置细目表】",
                          )}
                        </span>
                        {trans(
                          "questionShow.linkQuestionFromBankTip",
                          "从题库中选择题目进行关联，题库中没有时，可先新建题目后再进行关联。",
                        )}
                      </span>
                    ) : (
                      <span>
                        {trans(
                          "questionShow.finishAssociationFirst",
                          "请先完成题目关联。",
                        )}
                      </span>
                    )}
                  </div>
                  {index.optionList && index.optionList.length > 0 ? (
                    <div className={styles.questionOptions}>
                      <Options question={index} />
                    </div>
                  ) : null}
                </>
              ))
            : null}
        </div>
      </div>
    );
  }
}

export default QuestionStem;
