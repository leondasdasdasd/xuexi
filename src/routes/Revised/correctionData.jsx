import React, { PureComponent } from "react";
import { Input, InputNumber, message, Radio, Select } from "antd";
import { connect } from "dva";
import { routerRedux } from "dva/router";

import { locale, trans } from "../../utils/i18n";

import styles from "./index.module.less";

const { TextArea } = Input;
const { Option } = Select;

let canCommit = true; //重复提交

class Revised extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {
      radioType: 2, //1:订正答案  2：订正成绩
      answerList: [
        {
          questionNo: undefined,
          oldAnswer: undefined,
          newAnswer: undefined,
          reviseAnswer: undefined,
          questionType: undefined,
          studentList: undefined,
          selectStudentIds: undefined,
          oldScore: undefined,
          newScore: undefined,
        },
      ],
      remark: "", //备注
      examId: undefined, //试卷id
    };
  }

  componentDidMount() {
    const {
      match: { params },
    } = this.props;
    let testId = params.testId;
    this.getExamList();
    if (testId && testId > 0) {
      this.setState({
        examId: testId + "",
      });
      this.getQuestionList(testId);
    }
  }

  //获取试卷列表
  getExamList = () => {
    const {
      match: { params },
    } = this.props;
    this.props.dispatch({
      type: "revisedRecord/getExamList",
      payload: {
        examId: params && params.testId ? params.testId : null,
      },
    });
  };

  //获取题号列表
  getQuestionList = (testId) => {
    this.props.dispatch({
      type: "revisedRecord/getQuestionList",
      payload: {
        examId: testId,
        correctionType: this.state.radioType,
      },
    });
  };

  //修改备注
  changeRemark = (e) => {
    this.setState({
      remark: e.target.value,
    });
  };

  selectExam = (id) => {
    this.setState(
      {
        examId: id,
        answerList: [
          {
            questionNo: undefined,
            oldAnswer: undefined,
            newAnswer: undefined,
            reviseAnswer: undefined,
            questionType: undefined,
            studentList: undefined,
            selectStudentIds: undefined,
            oldScore: undefined,
            newScore: undefined,
          },
        ],
      },
      () => {
        this.getQuestionList(id);
      },
    );
  };

  //添加题号
  addQuestionNo = () => {
    let newList = JSON.parse(JSON.stringify(this.state.answerList));
    newList.push({
      questionNo: undefined,
      oldAnswer: undefined,
      newAnswer: undefined,
      reviseAnswer: undefined,
      questionType: undefined,
      studentList: undefined,
      oldScore: undefined,
      newScore: undefined,
      selectStudent: undefined,
    });
    this.setState({
      answerList: newList,
    });
  };

  //订正类型
  changeType = (e) => {
    this.setState(
      {
        radioType: e.target.value,
        answerList: [
          {
            questionNo: undefined,
            oldAnswer: undefined,
            newAnswer: undefined,
            reviseAnswer: undefined,
            questionType: undefined,
            studentList: undefined,
            oldScore: undefined,
            newScore: undefined,
            selectStudent: undefined,
          },
        ],
      },
      () => {
        this.getQuestionList(this.state.examId);
      },
    );
  };

  //选择题号
  selectQusetionId = (id, index) => {
    let answerList = JSON.parse(JSON.stringify(this.state.answerList));
    answerList[`${index}`]["questionNo"] = id;
    this.setState(
      {
        answerList,
      },
      () => {
        if (this.state.radioType == 1) {
          this.getQuestionDetail(id, index);
        } else {
          this.getQuestionStudent(id, index);
        }
      },
    );
  };

  selectQusetionStudent = (id, index) => {
    let newAnswerList = JSON.parse(JSON.stringify(this.state.answerList));
    newAnswerList[`${index}`]["selectStudentIds"] = id;
    this.setState({
      answerList: newAnswerList,
    });
  };

  //订正答案
  changeAnswer = (answer, index, type) => {
    if (type && type === "0") {
      answer = [...answer].sort();
    }
    let newAnswerList = JSON.parse(JSON.stringify(this.state.answerList));
    newAnswerList[`${index}`]["newAnswer"] = answer;
    this.setState({
      answerList: newAnswerList,
    });
  };

  //修改成绩
  changeScore = (value, index) => {
    let newAnswerList = JSON.parse(JSON.stringify(this.state.answerList));
    newAnswerList[`${index}`]["newScore"] = value;
    this.setState({
      answerList: newAnswerList,
    });
  };

  //成绩聚焦
  changeScoreFocus = (value, index) => {
    if (!this.state.answerList[index]["questionNo"]) {
      message.info(trans("revise.qustionIdTip", "你还没选择题号哦~"));
      return false;
    }
  };

  getQuestionDetail = (id, index) => {
    this.props.dispatch({
      type: "revisedRecord/getQuestionAnswer",
      payload: {
        examId: this.state.examId,
        questionId: id,
      },
      onSuccess: (res) => {
        let data = res || {};
        let newAnswerList = JSON.parse(JSON.stringify(this.state.answerList));
        if (data.questionType == 0) {
          newAnswerList[`${index}`]["oldAnswer"] = data.answerList;
          newAnswerList[`${index}`]["newAnswer"] = data.answerList;
        } else if (data.questionType == 4) {
          let answer =
            data.answer && (data.answer == "T" || data.answer == "W")
              ? "T"
              : "F";
          newAnswerList[`${index}`]["oldAnswer"] = data.answer;
          newAnswerList[`${index}`]["newAnswer"] = answer;
        } else {
          newAnswerList[`${index}`]["oldAnswer"] = data.answer;
          newAnswerList[`${index}`]["newAnswer"] = data.answer;
        }

        newAnswerList[`${index}`]["questionType"] = data.questionType;
        this.setState({
          answerList: newAnswerList,
        });
      },
    });
  };

  getQuestionStudent = (id, index) => {
    this.props.dispatch({
      type: "revisedRecord/getQuestionStudent",
      payload: {
        examId: this.state.examId,
        questionId: id,
      },
      onSuccess: (res) => {
        let data = res || {};
        let newAnswerList = JSON.parse(JSON.stringify(this.state.answerList));
        newAnswerList[`${index}`]["studentList"] = data;
        this.setState({
          answerList: newAnswerList,
        });
      },
    });
  };

  //渲染选项
  renderOption = (item, index) => {
    if (item.questionType == 1) {
      //单选
      return (
        <Select
          style={{ width: 231 }}
          placeholder={trans("revise.selectAnswer", "选择答案")}
          value={item.newAnswer}
          onChange={(newAnswer) => this.changeAnswer(newAnswer, index, "1")}
        >
          <Option value="A" key="A">
            A
          </Option>
          <Option value="B" key="B">
            B
          </Option>
          <Option value="C" key="C">
            C
          </Option>
          <Option value="D" key="D">
            D
          </Option>
        </Select>
      );
    } else if (item.questionType == 0) {
      //多选
      return (
        <Select
          mode="multiple"
          style={{ width: 231 }}
          placeholder={trans("revise.selectAnswer", "选择答案")}
          value={item.newAnswer}
          onChange={(newAnswer) => this.changeAnswer(newAnswer, index, "0")}
        >
          <Option value="A" key="A">
            A
          </Option>
          <Option value="B" key="B">
            B
          </Option>
          <Option value="C" key="C">
            C
          </Option>
          <Option value="D" key="D">
            D
          </Option>
          <Option value="E" key="E">
            E
          </Option>
          <Option value="F" key="F">
            F
          </Option>
        </Select>
      );
    } else if (item.questionType == 4) {
      //判断
      return (
        <Select
          style={{ width: 231 }}
          placeholder={trans("revise.selectAnswer", "选择答案")}
          value={item.newAnswer}
          onChange={(newAnswer) => this.changeAnswer(newAnswer, index, "4")}
        >
          <Option value="T" key="T">
            <i className={[styles.iconfont, styles.redIcon].join(" ")}>
              &#xe6b2;
            </i>
          </Option>
          <Option value="F" key="F">
            <i className={[styles.iconfont, styles.closeIcon].join(" ")}>
              &#xe6df;
            </i>
          </Option>
        </Select>
      );
    }
  };

  //删除题
  deleteQuestion = (index) => {
    let newAnswerList = JSON.parse(JSON.stringify(this.state.answerList));
    newAnswerList.splice(index, 1);
    this.setState({
      answerList: newAnswerList,
    });
  };

  //订正答案明细
  renderAnswerDetail = () => {
    const { answerList } = this.state;
    const { questionList } = this.props;
    return (
      <div>
        {answerList && answerList.length > 0
          ? answerList.map((item, index) => (
              <div className={styles.rowContent}>
                <div className={styles.questionIdTit}>
                  <Select
                    style={{ width: "140px" }}
                    placeholder={trans("revise.selectQuestionId", "选择题号")}
                    onChange={(id) => this.selectQusetionId(id, index)}
                    value={item.questionNo}
                    showSearch
                  >
                    {questionList && questionList.length > 0
                      ? questionList.map((item) => (
                          <Option value={item.questionId} key={item.questionId}>
                            {item.questionId}
                          </Option>
                        ))
                      : null}
                  </Select>
                </div>
                <div className={styles.oldAnswerTit}>
                  {item.oldAnswer ? (
                    item.questionType == 4 ? (
                      <span className={styles.oldAnswer}>
                        {item.oldAnswer == "T" || item.oldAnswer == "W" ? (
                          <i
                            className={[styles.iconfont, styles.redIcon].join(
                              " ",
                            )}
                          >
                            &#xe6b2;
                          </i>
                        ) : (
                          <i
                            className={[styles.iconfont, styles.closeIcon].join(
                              " ",
                            )}
                          >
                            &#xe6df;
                          </i>
                        )}
                      </span>
                    ) : (
                      <span className={styles.oldAnswer}>{item.oldAnswer}</span>
                    )
                  ) : (
                    <span
                      className={[styles.iconfont, styles.oldAnswer].join(" ")}
                    >
                      &#xe7fd;
                    </span>
                  )}
                </div>
                <div className={styles.newAnswerTit}>
                  {item.questionType ? (
                    this.renderOption(item, index)
                  ) : (
                    <Select
                      style={{ width: 231 }}
                      placeholder={trans("revise.selectAnswer", "选择答案")}
                    ></Select>
                  )}
                </div>
                <i
                  className={[styles.iconfont, styles.deleteIcon].join(" ")}
                  onClick={() => this.deleteQuestion(index)}
                >
                  &#xe71e;
                </i>
              </div>
            ))
          : null}
      </div>
    );
  };

  //订正分数明晰
  renderScoreDetail = () => {
    const { answerList } = this.state;
    const { questionList, questionStudent } = this.props;
    return (
      <div>
        {answerList && answerList.length > 0
          ? answerList.map((item, index) => (
              <div className={styles.rowContent}>
                <div className={styles.questionIdTit}>
                  <Select
                    style={{ width: 140 }}
                    placeholder={trans("revise.selectQuestionId", "选择题号")}
                    onChange={(id) => this.selectQusetionId(id, index)}
                    value={item.questionNo}
                    showSearch
                  >
                    {questionList && questionList.length > 0
                      ? questionList.map((item) => (
                          <Option value={item.questionId} key={item.questionId}>
                            {item.questionId}
                          </Option>
                        ))
                      : null}
                  </Select>
                </div>
                <div className={styles.studentTit}>
                  <Select
                    style={{ width: 275 }}
                    mode="multiple"
                    placeholder={trans("global.selectStudent", "选择学生")}
                    onChange={(id) => this.selectQusetionStudent(id, index)}
                  >
                    {item.studentList && item.studentList.length > 0
                      ? item.studentList.map((item) => (
                          <Option value={item.studentId} key={item.studentId}>
                            {item.studentName}
                            <span style={{ float: "right", color: "#cecece" }}>
                              {item.score}
                            </span>
                          </Option>
                        ))
                      : null}
                  </Select>
                </div>
                <div className={styles.newScoreTit}>
                  <InputNumber
                    min={0}
                    onChange={(value) => this.changeScore(value, index)}
                    value={item.newScore}
                    onFocus={(value) => this.changeScoreFocus(value, index)}
                  />
                </div>
                <i
                  className={[styles.iconfont, styles.deleteIcon].join(" ")}
                  onClick={() => this.deleteQuestion(index)}
                >
                  &#xe71e;
                </i>
              </div>
            ))
          : null}
      </div>
    );
  };

  //渲染表头
  renderTableTitle = () => {
    const { radioType } = this.state;
    return radioType == 1 ? (
      <div className={`${styles.rowContent} ${styles.tabTitle}`}>
        <div className={styles.questionIdTit}>
          <div>{trans("analysis.questionIndex", "题号")}</div>
        </div>
        <div className={styles.oldAnswerTit}>
          <div>{trans("global.oldAnswer", "原答案")}</div>
        </div>
        <div className={styles.newAnswerTit}>
          <div>{trans("global.reviseTo", "订正为")}</div>
        </div>
      </div>
    ) : (
      <div className={`${styles.rowContent} ${styles.tabTitle}`}>
        <div className={styles.questionIdTit}>
          <div>{trans("analysis.questionIndex", "题号")}</div>
        </div>
        <div className={styles.studentTit}>
          <div>
            {trans("global.student", "学生")}/
            {trans("global.currentScore", "当前得分")}
          </div>
        </div>
        <div className={styles.newScoreTit}>
          <div>{trans("global.newScore", "新得分")}</div>
        </div>
      </div>
    );
  };

  judgeAnswerList = () => {
    const { radioType } = this.state;
    let newAnswerList = JSON.parse(JSON.stringify(this.state.answerList));
    let flag = true;
    for (const element of newAnswerList) {
      if (!element.questionNo) {
        message.info(trans("revise.qustionIdTip", "你还没选择题号哦~"));
        flag = false;
        break;
      }
      if (radioType == 1) {
        //订正答案
        if (!element.newAnswer) {
          message.info(trans("revise.newAnswerListTip", "新答案不能为空哦~"));
          flag = false;
          break;
        }
      } else {
        //订正分数
        if (
          !(element.selectStudentIds && element.selectStudentIds.length > 0)
        ) {
          message.info(trans("revise.selectStudentTip", "您还没选择学生哦~"));
          flag = false;
          break;
        }
        if (!(element.newScore >= 0)) {
          message.info(trans("revise.newScoreTip", "新得分不能为空哦~"));
          flag = false;
          break;
        }
      }
    }
    return flag;
  };

  formatAnswerList = () => {
    const { radioType } = this.state;
    let newAnswerList = JSON.parse(JSON.stringify(this.state.answerList));
    let array = [];
    for (const element of newAnswerList) {
      if (radioType == 1) {
        //订正答案
        if (element.questionType == 0) {
          //多选
          array.push({
            questionId: element.questionNo,
            answer: element.oldAnswer,
            answerList: element.newAnswer,
            questionType: element.questionType,
          });
        } else if (element.questionType == 4) {
          //判断
          array.push({
            questionId: element.questionNo,
            answer: element.oldAnswer,
            newAnswer: this.formatAnswer(element.oldAnswer, element.newAnswer),
            questionType: element.questionType,
          });
        } else {
          array.push({
            questionId: element.questionNo,
            answer: element.oldAnswer,
            newAnswer: element.newAnswer,
            questionType: element.questionType,
          });
        }
      } else {
        //订正分数
        array.push({
          questionId: element.questionNo,
          newStudentScore: element.newScore,
          studentUserIds: element.selectStudentIds,
        });
      }
    }
    return array;
  };

  //格式化判断题答案  原答案是WR，提交时也是WR；原答案是TF，提交是也是TF
  formatAnswer = (oldAnswer, newAnswer) => {
    let answer = "";
    if (oldAnswer === "W" || oldAnswer === "R") {
      answer = newAnswer && newAnswer === "T" ? "W" : "R";
    } else {
      answer = newAnswer;
    }
    return answer;
  };

  //提交修改
  submitCorrect = () => {
    if (!canCommit) return false;
    if (!this.state.examId) {
      message.info(trans("revise.examTip", "您还没选择试卷哦~"));
      return false;
    }
    let ifContinue = this.judgeAnswerList();
    if (!ifContinue) return false;
    let correctionList = this.formatAnswerList();
    canCommit = false;
    this.props
      .dispatch({
        type: "revisedRecord/submitCorrect",
        payload: {
          examId: this.state.examId,
          type: this.state.radioType,
          remark: this.state.remark,
          correctionList: correctionList,
        },
        onSuccess: () => {
          this.props.dispatch({
            type: "revisedRecord/clearRevisedData",
            payload: {},
          });
          window.open(
            `${window.location.origin}/exam#/revisedPage/1/false`,
            "_blank",
          ); //跳转到我创建的
        },
      })
      .then(() => {
        canCommit = true;
      });
  };

  handelCacel = () => {
    const {
      match: { params },
    } = this.props;
    this.props.dispatch({
      type: "revisedRecord/clearRevisedData",
      payload: {},
    });
    if (params && params.backUrl) {
      this.props.dispatch(routerRedux.push(backUrl));
    } else {
      this.props.dispatch(routerRedux.push("/examAnalysis"));
    }
  };

  render() {
    const { radioType, answerList, remark, examId } = this.state;
    const {
      match: { params },
      examList,
    } = this.props;

    let hasExamId = params && params.testId > 0 ? true : false;
    return (
      <div className={styles.reviseBox}>
        <div className={styles.header}>
          <div className={styles.headerLeft} onClick={this.handelCacel}>
            <i className={[styles.iconfont, styles.closeIcon].join(" ")}>
              &#xe6e2;
            </i>
            <span>{trans("global.addRevise", "新增订正")}</span>
          </div>
          <div className={styles.headerRight}>
            <span className={styles.cancelBtn} onClick={this.handelCacel}>
              {trans("global.cancle", "取消")}
            </span>
            <span className={styles.agreeBtn} onClick={this.submitCorrect}>
              {trans("global.submit", "提交")}
            </span>
          </div>
        </div>
        <div className={styles.content}>
          <div className={styles.reviseContent}>
            <div className={styles.titleMessage}>
              <i className={[styles.iconfont, styles.toast].join(" ")}>
                &#xe7f3;
              </i>
              {locale() === "en" ? (
                <span>
                  {trans(
                    "global.correctionTips",
                    "The modification has been sent to approve. After approving by the head of department, the score will be updated autometically and you will be notified on DingTalk.",
                  )}
                </span>
              ) : (
                <span>
                  {trans(
                    "revised.correctionDataApprovalStarted",
                    "订正流程发起后，待学科首席",
                  )}
                  <i className={styles.iconfont}>&#xe7f4;</i>
                  {trans(
                    "revised.correctionDataApprovalAcademicDean",
                    "学术长",
                  )}
                  <i className={styles.iconfont}>&#xe7f4;</i>
                  {trans(
                    "revised.correctionDataApprovalCourseInstitute",
                    "课程院老师审核通过后，更新成绩",
                  )}
                </span>
              )}
            </div>
            <div className={styles.formIetem}>
              <div className={styles.formTitle}>
                {trans("revise.paper", "订正试卷：")}
              </div>
              <Select
                value={examId}
                style={{ width: 400 }}
                onChange={this.selectExam}
                disabled={hasExamId}
                placeholder={trans("revise.selectPaper", "选择试卷")}
              >
                {examList && examList.length > 0
                  ? examList.map((item) => (
                      <Option key={item.examId}>{item.examName}</Option>
                    ))
                  : null}
              </Select>
            </div>
            <div className={styles.formIetem}>
              <div className={styles.formTitle}>
                {trans("revise.classification", "订正分类：")}
              </div>
              <Radio.Group onChange={this.changeType} value={radioType}>
                <Radio value={1}>
                  {trans("revise.correctedAnswer", "订正答案")}
                </Radio>
                <Radio value={2}>
                  {trans("revise.revisedScore", "订正成绩")}
                </Radio>
              </Radio.Group>
            </div>
            <div className={[styles.formIetem, styles.detailItem].join(" ")}>
              <div className={styles.formTitle}>
                {trans("revise.detail", "订正明细：")}
              </div>
              <div className={styles.reviseDetail}>
                <div className={styles.reviseTable}>
                  {this.renderTableTitle()}
                  {radioType == 1
                    ? this.renderAnswerDetail()
                    : this.renderScoreDetail()}
                  <div
                    className={styles.addQuestionNo}
                    onClick={this.addQuestionNo}
                  >
                    <i
                      className={[styles.iconfont, styles.closeIcon].join(" ")}
                    >
                      &#xe7d5;
                    </i>
                    {trans("global.addQuestionNo", "添加题号")}
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.formIetem}>
              <div className={styles.formTitle}>
                {trans("revise.remark", "备注：")}
              </div>
              <TextArea
                rows={3}
                onChange={this.changeRemark}
                value={remark}
                className={styles.remark}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect(({ revisedRecord }) => ({
  examList: revisedRecord.examList,
  questionList: revisedRecord.questionList,
  questionStudent: revisedRecord.questionStudent,
}))(Revised);
