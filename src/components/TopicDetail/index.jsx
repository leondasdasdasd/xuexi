//新闻
import React, { PureComponent } from "react";
import { Radio, Spin } from "antd";
import { connect } from "dva";

import AnswerProgress from "../../components/AnswerProgress/index";
import { resolveAnalysisQuestionSelection } from "../../routes/DataAnalysis/analysisQuestionSelection";
import AnalysisQuestionPreview from "../../routes/DataAnalysis/components/AnalysisQuestionPreview";
import { classQuestionAnalysis } from "../../services/example";
import { trans } from "../../utils/i18n";
import { convertToChineseNumber, switchingSupport } from "../../utils/utils";

import styles from "./index.module.less";

export class TopicFargment extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {
      moduleValue: 0,
      showIndex: undefined,
      loding: false,
      autoScore: 1,
      record: {},
      classQuestionAnalysisData: {},
    };
  }

  showParseOrNot = (index) => {
    if (this.state.moduleValue == "jiexi" && this.state.showIndex == index) {
      this.setState({
        moduleValue: "",
        showIndex: -1,
      });
    } else {
      this.setState({
        moduleValue: "jiexi",
        showIndex: index,
      });
    }
  };

  // 获取学生作答
  getClassQuestionAnalysis = (record) => {
    const selection = resolveAnalysisQuestionSelection(record);
    if (!selection) return;
    this.setState({
      loding: true,
      record: record,
    });
    classQuestionAnalysis({
      examId: this.props.examId,
      groupId: this.props.groupId,
      questionId: selection.questionId,
      questionNo: selection.questionNo,
      autoScore: Boolean(this.state.autoScore),
      filterFlag: false,
    }).then((res) => {
      console.log(res);
      if (res.status) {
        this.setState({
          classQuestionAnalysisData: res.content,
        });
      }
      this.setState({
        loding: false,
      });
    });
  };

  showStatisticsOrNot = (index, record) => {
    if (this.state.moduleValue == "zuoda" && this.state.showIndex == index) {
      this.setState({
        moduleValue: "",
        showIndex: -1,
      });
    } else {
      this.setState({
        moduleValue: "zuoda",
        showIndex: index,
      });
    }

    let scoreModel = 0;
    scoreModel = switchingSupport(record) ? 0 : 1;

    this.setState(
      {
        autoScore: scoreModel,
      },
      () => {
        this.getClassQuestionAnalysis(record);
      },
    );
  };

  showAnswer = (qu, index) => {
    if (this.props.showAnswer) {
      this.props.showAnswer(qu, index);
    }
  };

  scoreTypeChange = (e) => {
    this.setState(
      {
        autoScore: e.target.value,
      },
      () => {
        this.getClassQuestionAnalysis(this.state.record);
      },
    );
  };

  getContent = (question) => {
    const { moduleValue, showIndex } = this.state;
    const { checkSerialNumber } = this.props;
    const selection = resolveAnalysisQuestionSelection(question);
    const number_ = selection?.questionNo;

    /**
     *
     */
    function computeScore() {
      let groupScoreRate = question.groupScoreRate * 10;
      let gradeScoreRate = question.gradeScoreRate * 10;
      if (groupScoreRate == gradeScoreRate) {
        return <span>{trans("global.atGradeLevel", "与年级持平")}</span>;
      } else if (groupScoreRate > gradeScoreRate) {
        return (
          <span style={{ color: "#00B213" }}>
            {trans("global.aboveGradeLevel", "高于年级")}
            {question.groupGradeAndCompareScoreRate}%
          </span>
        );
      } else {
        return (
          <span style={{ color: "#FC491E" }}>
            {trans("global.belowGradeLevel", "低于年级")}
            {question.groupGradeAndCompareScoreRate.split("-")[1]}%
          </span>
        );
      }
    }

    return (
      <div
        key={selection?.questionId ?? number_}
        className={`${styles.mainContent} ${checkSerialNumber == number_ ? styles.active : ""}`}
      >
        <div
          style={{ backgroundColor: "#fff", padding: "12px 16px 12px 16px" }}
        >
          {this.props.analysisQuestionCatalog && selection ? (
            <AnalysisQuestionPreview
              catalog={this.props.analysisQuestionCatalog}
              mode="question"
              questionId={selection.questionId}
              showAnswer={moduleValue == "jiexi" && showIndex == number_}
            />
          ) : null}
        </div>

        <div
          className={`${styles.bottomOpetare} ${showIndex == number_ ? styles.borderBottom : ""}`}
        >
          <div className={styles.topicDetail}>
            <span style={{ color: "#01113d", fontWeight: "normal" }}>
              {trans("analysis.classScoreRate", "班级得分率")}
              {question.groupScoreRate}%，
              {trans("global.gradeScoreRate", "年级得分率")}
              {question.gradeScoreRate}%，
              {computeScore()}
            </span>
          </div>

          <div className={`${styles.operaStyle}`}>
            <div
              className={`${styles.optionBtn} ${moduleValue == "jiexi" && showIndex == number_ ? styles.active : ""}`}
              onClick={() => this.showParseOrNot(number_)}
            >
              <i className={styles.iconfont}>&#xe631;</i>&nbsp;
              {trans("detail.viewAnalysis", "查看解析")}
            </div>

            <div
              onClick={() => this.showStatisticsOrNot(number_, question)}
              className={`${styles.optionBtn}  ${moduleValue == "zuoda" && showIndex == number_ ? styles.active : ""}`}
            >
              <i className={styles.iconfont}>&#xe8ae;</i>&nbsp;
              {trans("global.studentAnswer", "学生作答")}
            </div>

            <div
              className={`${styles.optionBtn} ${styles.operaTopic} ${question.classInstruction ? styles.active : ""}`}
              onClick={() => {
                this.props.onJoinOrCancel &&
                  this.props.onJoinOrCancel(question);
              }}
            >
              {question.classInstruction ? (
                <i
                  className={styles.iconfont}
                  style={{ fontSize: "2px", marginRight: "4px" }}
                >
                  &#xe8b8;
                </i>
              ) : (
                <i
                  className={styles.iconfont}
                  style={{
                    fontSize: "11.5px",
                    marginRight: "4px",
                    color: "rgb(4, 69, 252)",
                  }}
                >
                  &#xe8b7;
                </i>
              )}
              <div>
                {question.classInstruction
                  ? trans("global.cancelJoin", "取消加入")
                  : trans("global.classroomExplanation", "课堂讲解")}
              </div>
            </div>
          </div>
        </div>

        {moduleValue == "zuoda" && showIndex == number_ ? (
          <div className={styles.statisticsDetail}>
            <div className={styles.subsectionTop}>
              {switchingSupport(question) ? (
                <Radio.Group
                  name="radiogroup"
                  value={this.state.autoScore}
                  style={{ marginBottom: "10px" }}
                  onChange={this.scoreTypeChange}
                >
                  <Radio value={0}>
                    {trans("global.viewByScore", "按得分分布")}
                  </Radio>
                  <Radio value={1}>
                    {trans("global.viewAutomatically", "按自动分布")}
                  </Radio>
                </Radio.Group>
              ) : null}

              <Spin spinning={this.state.loding}>
                <div style={{ display: "flex" }}>
                  <div>
                    <AnswerProgress
                      data={this.state.classQuestionAnalysisData}
                      autoScore={this.state.autoScore}
                      selectStudentInfo={(index) => {
                        if (index != -4) {
                          this.showAnswer(question, index);
                        }
                      }}
                    />
                  </div>
                  <div
                    onClick={() => {
                      this.showAnswer(question);
                    }}
                    className={styles.textBtn}
                  >
                    {trans("global.viewDetails", "查看作答详情")}
                  </div>
                </div>
              </Spin>
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  getScore(item) {
    let score = item.moduleScore / item.moduleQuestionNumber;
    if (String(score).includes(".")) {
      return String(score).split(".")[1].length === 1
        ? `每题${score}${trans("global.point", "分")}，`
        : "";
    } else {
      return `每题${score}${trans("global.point", "分")}，`;
    }
  }

  render() {
    const { detailList } = this.props;
    return (
      <div className={styles.listBox}>
        {detailList && detailList.length > 0 ? (
          <div>
            {detailList.map((item, index) => {
              // 进行了排序questionList为undefined
              if (item.questionList == undefined) {
                return this.getContent(item);
              } else {
                //没有进行排序
                return (
                  <div key={index}>
                    <div className={styles.topicStyle}>
                      {`${convertToChineseNumber(index + 1)}、
                      ${item.moduleName}(${item.moduleType != 7 && item.moduleType != 8 ? this.getScore(item) : ""}
                        共${item.moduleQuestionNumber}题 ${item.moduleType != 7 && item.moduleType != 8 ? `，共${item.moduleScore}${trans("global.point", "分")}` : ""})
                      `}
                    </div>
                    {item.questionList && item.questionList.length > 0
                      ? item.questionList.map((element, index_) => {
                          return this.getContent(element);
                        })
                      : null}
                  </div>
                );
              }
            })}
          </div>
        ) : null}
      </div>
    );
  }
}

export default connect(({ home, global, inputQuestion }) => ({}))(
  TopicFargment,
);
