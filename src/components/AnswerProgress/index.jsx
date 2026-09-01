// 类组件
import React from "react";
import { Progress } from "antd";

import { trans } from "../../utils/i18n";

import styles from "./index.module.less";

class AnswerProgress extends React.Component {
  constructor(properties) {
    super(properties);
    this.state = {
      index: undefined,
    };
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
  selectStudentInfo = (index) => {
    console.log(index, "index");
    this.setState({
      index: index,
    });
    if (this.props.selectStudentInfo) {
      this.props.selectStudentInfo(index);
    }
  };
  render() {
    const { data, autoScore } = this.props;
    return (
      <div className="AnswerProgress">
        {data &&
        data.answerErrorStudentInfoList &&
        data.answerErrorStudentInfoList.length > 0
          ? data.answerErrorStudentInfoList.map((bb, cc) => (
              <div
                className={`${styles.subsectionNum} ${cc == this.state.index ? styles.active : ""}`}
                key={cc}
                onClick={() => {
                  this.selectStudentInfo(cc);
                }}
              >
                <div className={styles.leftNumber}>
                  {bb.questionScore}
                  {autoScore == 0 ? ` ${trans("global.point", "分")}` : ""}
                </div>
                <div className={styles.rightProgress}>
                  <Progress
                    percent={Number(bb.studentNum)}
                    showInfo={false}
                    strokeColor={bb.isHigher ? "#1EC337" : "#FB5F4E "}
                  />
                </div>
                <span className={styles.percentage}>
                  {bb.studentNum}
                  {trans("global.person", "人")} / {bb.studentRate}
                </span>
                {cc == this.state.index ? (
                  <i
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      this.selectStudentInfo(-4);
                    }}
                    className={styles.iconfont}
                  >
                    &#xe743;
                  </i>
                ) : (
                  ""
                )}
              </div>
            ))
          : null}

        {data && data.answerCorrectStudentInfo ? (
          <div
            className={styles.subsectionNum}
            onClick={() => {
              this.selectStudentInfo(-1);
            }}
          >
            <div className={styles.leftNumber}>
              {data.answerCorrectStudentInfo.questionScore}
              {autoScore == 0 ? ` ${trans("global.point", "分")}` : ""}
            </div>
            <div className={styles.rightProgress}>
              <Progress
                percent={Number(data.answerCorrectStudentInfo.studentNum)}
                showInfo={false}
                strokeColor={
                  data.answerCorrectStudentInfo.isHigher
                    ? "#1EC337"
                    : "#FB5F4E "
                }
              />
            </div>
            <span className={styles.percentage}>
              {data.answerCorrectStudentInfo.studentNum}
              {trans("global.person", "人")} /{" "}
              {data.answerCorrectStudentInfo.studentRate}
            </span>
          </div>
        ) : (
          ""
        )}
      </div>
    );
  }
}

export default AnswerProgress;
