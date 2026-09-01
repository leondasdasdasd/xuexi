import React, { Fragment, PureComponent } from "react";
import {
  Empty,
  Icon,
  Input,
  InputNumber,
  message,
  Popover,
  Radio,
  Select,
  Spin,
} from "antd";
import { connect } from "dva";

import MultiSelect from "../../components/MultiSelect";
import ShowFile from "../../components/UseFileItem/showFile";
import { classQuestionAnalysis, updateItem } from "../../services/example";
import { locale, trans } from "../../utils/i18n";

import styles from "./index.module.less";

const { TextArea } = Input;
const { Option } = Select;

let canCommit = true; //重复提交
let timer = null;

class Revised extends PureComponent {
  constructor(properties) {
    super(properties);
    // this.url = this.props.history.location.pathname;
    // this.pathMatch = pathToRegexp('/revise/:testId/:tab').exec(this.url);
    // this.testId = JSON.parse(this.pathMatch[1]);
    this.state = {
      radioType: 2, //1:订正答案  2：订正成绩
      newGrade: "", //新成绩
      updatedSeason: "", //修改原因
      visible: false, //弹窗显示否
      classIndex: null,
      classList: [],
      studentList: [],
      selectList: [],
      selectCount: {},
      selectStudentList: [],
      stageLists: ["A", "B", "C", "D"],
      stuList: [],
      isSubmitting: false,
      answerList: [
        {
          questionNo: undefined,
          oldAnswer: undefined,
          newAnswer: undefined,
          reviseAnswer: undefined,
          questionType: undefined,
          studentList: undefined,
          selectStudentIds: undefined,
          questionScore: undefined,
          oldScore: undefined,
          newScore: undefined,
        },
      ],
      questionStuList: [],
      remark: "", //备注
      examId: undefined, //试卷id
      popVisible: {},
      question: {},
    };
  }

  componentDidMount() {
    const { testId } = this.props;
    // this.getExamList();

    if (this.props.source === "evaluation") {
      console.log(this.props.stuId, "ss");
      this.props.dispatch({
        type: "revisedRecord/getEvaDetail",
        payload: {
          targetId: this.props.evaluationId,
          type: this.props.type,
        },
      });
      this.props.dispatch({
        type: "revisedRecord/getGroupAndStudent",
        payload: {
          targetId: this.props.evaluationId,
          type: this.props.type,
          name: "",
        },
      });
      //目前输入成绩实时调用等级，这个接口暂时注释
      // this.props.dispatch({
      //   type: 'revisedRecord/getStageList',
      //   payload: {
      //     targetId: this.props.evaluationId,
      //     type: this.props.type,
      //   }
      // })
      if (this.props.stuId) {
        this.getStuScore(this.props.stuId);
      } else {
        this.getWillRevisedStudent();
      }
    } else {
      this.getExamList();
      if (testId && testId > 0) {
        this.setState({
          examId: testId + "",
        });
        this.getQuestionList(testId);
      }
    }
  }

  //获取试卷列表
  getExamList = () => {
    const { testId } = this.props;
    this.props.dispatch({
      type: "revisedRecord/getExamList",
      payload: {
        examId: testId ? testId : null,
      },
    });
  };

  //获取题号列表
  getQuestionList = (testId) => {
    if (!testId) {
      return;
    }
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
            questionScore: undefined,
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
      selectStudentIds: undefined,
      questionScore: undefined,
      oldScore: undefined,
      newScore: undefined,
      selectStudent: undefined,
    });
    this.setState({
      answerList: newList,
    });
  };
  //添加学生
  addStudent = () => {
    /* let newList = JSON.parse(JSON.stringify(this.state.answerList));
    newList.push({
      questionNo: undefined,
      oldAnswer: undefined,
      newAnswer: undefined,
      reviseAnswer: undefined,
      questionType: undefined,
      studentList: undefined,
      selectStudentIds: undefined,
      questionScore: undefined,
      oldScore: undefined,
      newScore: undefined,
      selectStudent: undefined
    })
    this.setState({
      answerList: newList,
    }) */
  };

  //订正类型
  changeType = (e) => {
    this.setState(
      {
        radioType: e.target.value,
        answerList: [],
      },
      () => {
        this.setState(
          {
            answerList: [
              {
                questionNo: undefined,
                oldAnswer: undefined,
                newAnswer: [],
                reviseAnswer: undefined,
                questionType: undefined,
                selectStudentIds: [],
                studentList: undefined,
                questionScore: undefined,
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
      },
    );
  };

  //选择题号
  selectQusetionId = (id, index) => {
    let answerList = JSON.parse(JSON.stringify(this.state.answerList));
    answerList[`${index}`]["questionNo"] = id;
    const selectedQuestion = this.props.questionList.find(
      (item) => item.questionId == id,
    );
    const { questionBankId, questionNum } = selectedQuestion;
    answerList[`${index}`]["questionBankId"] = questionBankId;
    answerList[`${index}`]["questionNum"] = questionNum;
    this.setState(
      {
        answerList,
      },
      () => {
        if (this.state.radioType == 1) {
          this.getQuestionDetail(id, index);
        } else {
          this.getQuestionStudent(id, index, "");
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
  //选择新等级
  selectNewStage = (item, index) => {
    let newstageLists = JSON.parse(JSON.stringify(this.state.stageLists));
    newstageLists[`${index}`] = item;
    this.setState({
      stageLists: newstageLists,
    });
  };
  //
  getStuScore = (id) => {
    this.props
      .dispatch({
        type: "revisedRecord/getStuScore",
        payload: {
          studentId: id,
          evaluationTargetId: this.props.evaluationId,
          type: this.props.type,
        },
      })
      .then(() => {
        const { stuScore } = this.props;
        let score = JSON.parse(JSON.stringify(stuScore));
        score.type = 1; //订正类型默认是：订正成绩
        const newList = JSON.parse(JSON.stringify(this.state.stuList));
        newList.push(score);
        this.setState({
          stuList: newList,
        });
      });
  };

  //获取需要订正的学生列表
  getWillRevisedStudent = () => {
    this.props
      .dispatch({
        type: "revisedRecord/getWillRevisedStudent",
        payload: {
          evaluationTargetId: this.props.evaluationId,
        },
      })
      .then(() => {
        let willRevisedStudent = JSON.parse(
          JSON.stringify(this.props.willRevisedStudent),
        );
        willRevisedStudent.map((item) => (item.type = 1));
        const newList = JSON.parse(JSON.stringify(this.state.stuList));
        let studentList = newList.concat(willRevisedStudent);
        this.setState({
          stuList: studentList,
        });
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
  changeScore = (value, index, questionScore) => {
    let newAnswerList = JSON.parse(JSON.stringify(this.state.answerList));
    if (questionScore && questionScore > 0 && value > questionScore) {
      message.info(trans("revise.qustionIdTip2", "新得分不能大于该题分值哦~"));
      newAnswerList[`${index}`]["newScore"] = undefined;
    } else {
      newAnswerList[`${index}`]["newScore"] = value;
    }
    this.setState({
      answerList: newAnswerList,
    });
  };

  getTotalScoreLimit = () => {
    const paperTotalScore = Number(this.props.evaDetail?.paperTotalScore);
    return paperTotalScore > 0 ? paperTotalScore : 100;
  };

  //修改总成绩
  changeTotalScore = (e, index, item) => {
    let newstuList = JSON.parse(JSON.stringify(this.state.stuList));
    //只能输入数字和小数点
    let value = e.target.value.replaceAll(/[^\d.]/g, "");
    const totalScoreLimit = this.getTotalScoreLimit();

    if (value && Number(value) > totalScoreLimit) {
      message.info(
        trans(
          "global.totalScoreLimitWithScore",
          "总成绩不能大于{$score}分哦~",
          {
            score: totalScoreLimit,
          },
        ),
      );
    } else {
      newstuList[`${index}`]["studentNewScore"] = value;
      this.setState(
        {
          stuList: newstuList,
        },
        () => {
          this.fetchScoreLevel(item.studentId, value, index);
        },
      );
    }
  };

  throttle = (function_, delay = 3000) => {
    //
    //期间间隔执行 节流
    let canRun = true;
    return (...rest) => {
      if (!canRun) return;
      canRun = false;
      setTimeout(() => {
        function_.apply(this, rest);
        canRun = true;
      }, delay);
    };
  };

  //修改原因
  changeSeason = (v, index) => {
    let newSeason = JSON.parse(JSON.stringify(this.state.stuList));
    newSeason[`${index}`]["correctionReason"] = v.target.value;
    // this.state.stuList[`${index}`]['grade'] = v.target.value;
    console.log(`updatedSeason`, newSeason[`${index}`]["correctionReason"]);
    this.setState({
      stuList: newSeason,
    });
  };

  //成绩聚焦
  changeScoreFocus = (value, index) => {
    if (!this.state.answerList[index]["questionNo"]) {
      message.info(trans("revise.qustionIdTip", "你还没选择题号哦~"));
      return false;
    }
  };

  //订正答案---获取原答案以及答案列表
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
            data.answer && (data.answer == "W" || data.answer == "F")
              ? "T"
              : "F";
          newAnswerList[`${index}`]["oldAnswer"] = data.answer;
          newAnswerList[`${index}`]["newAnswer"] = answer;
          newAnswerList[`${index}`]["answerType"] = data.answerType;
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

  //订正分数---获取学生列表以及该题分值
  getQuestionStudent = (id, index, name, ifFirst) => {
    this.props.dispatch({
      type: "revisedRecord/getQuestionStudent",
      payload: {
        examId: this.state.examId,
        questionId: id,
        studentName: name,
      },
      onSuccess: (res) => {
        let data = res || {};
        let newAnswerList = JSON.parse(JSON.stringify(this.state.answerList));
        let newQuestionStuList = JSON.parse(
          JSON.stringify(this.state.questionStuList),
        );
        if (ifFirst) {
          newQuestionStuList[`${index}`] = data.studentResult || [];
        }
        newAnswerList[`${index}`]["studentList"] = data.studentResult || [];
        console.log(newAnswerList, "nn");
        newAnswerList[`${index}`]["questionScore"] =
          data.questionScore || undefined;
        this.setState({
          answerList: newAnswerList,
          questionStuList: newQuestionStuList,
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
          {Array.from({ length: 26 }, (_, index_) => {
            const letter = String.fromCharCode(65 + index_); // A-Z
            return (
              <Option value={letter} key={letter}>
                {letter}
              </Option>
            );
          })}
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
          {Array.from({ length: 26 }, (_, index_) => {
            const letter = String.fromCharCode(65 + index_); // A-Z
            return (
              <Option value={letter} key={letter}>
                {letter}
              </Option>
            );
          })}
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
  //删除学生
  deleteStu = (index) => {
    const { selectStudentList } = this.state;
    let newSelect = JSON.parse(JSON.stringify(selectStudentList));
    let newstuList = JSON.parse(JSON.stringify(this.state.stuList));
    const stuId = newstuList[index].studentId;
    newSelect.map((item, ind) => {
      if (stuId === item.studentUserId) {
        newSelect.splice(ind, 1);
      }
    });
    newstuList.splice(index, 1);
    console.log(newSelect, selectStudentList, stuId, "123");
    this.setState({
      stuList: newstuList,
      selectStudentList: newSelect,
    });
  };

  //订正答案明细
  renderAnswerDetail = () => {
    const { answerList } = this.state;
    const { questionList } = this.props;
    console.log(answerList, "zwl");
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
                            {item.questionNum}
                          </Option>
                        ))
                      : null}
                  </Select>
                </div>
                <div style={{ width: "70px", lineHeight: "32px" }}>
                  {item.questionNo ? (
                    <Popover
                      content={
                        this.state.getQuestionStatus ? (
                          <Spin />
                        ) : (
                          this.getContent()
                        )
                      }
                      onVisibleChange={(e) => {
                        this.originalQuestionVisChange(e, item.questionBankId);
                      }}
                      trigger="click"
                    >
                      <span style={{ color: "#0445FC" }}>
                        {trans("global.preview", "预览")}
                      </span>
                    </Popover>
                  ) : (
                    <span style={{ color: "rgba(0, 0, 0, 0.25)" }}>
                      {trans("global.preview", "预览")}
                    </span>
                  )}
                </div>
                <div className={styles.oldAnswerTit}>
                  {item.oldAnswer ? (
                    item.questionType == 4 ? (
                      <span className={styles.oldAnswer}>
                        {item.oldAnswer == "T" || item.oldAnswer == "R" ? (
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
  changeLevel = (index, value) => {
    console.log(index, value);
    let newList = JSON.parse(JSON.stringify(this.state.stuList));
    newList.map((item, ind) => {
      if (ind === index) {
        item.newScoreLevelId = value;
      }
    });
    console.log(newList);
    this.setState({
      stuList: newList,
    });
  };
  getQuestionStudentFocus = (id, index) => {
    if (id) {
      this.getQuestionStudent(id, index, "", true);
    } else {
      message.info(trans("revise.qustionIdTip", "你还没选择题号哦~"));
      return false;
    }
  };

  clearStudent = (id, index) => {
    // this.props.dispatch({
    //   type: "revisedRecord/getQuestionStudent",
    //   payload: {
    //     examId: this.state.examId,
    //     questionId: id,
    //     studentName: '',
    //   },
    //   onSuccess: (res) => {
    //     let data = res || {};
    //     let newAnswerList = JSON.parse(JSON.stringify(this.state.answerList));
    //     newAnswerList[`${index}`]["studentList"] = data.studentResult || [];
    //     newAnswerList[`${index}`]["questionScore"] =
    //       data.questionScore || undefined;
    //       console.log(newAnswerList, '123')
    //     this.setState({
    //       answerList: newAnswerList,
    //     }, () => {

    //     });
    //   },
    // });
    this.props.dispatch({
      type: "revisedRecord/clearStudent",
      payload: {},
    });
  };

  originalQuestionVisChange = (e, questionBankId) => {
    if (e) {
      this.setState({
        getQuestionStatus: true,
      });
      updateItem({
        questionId: questionBankId,
        examId: this.state.examId,
      })
        .then((res) => {
          if (res.status) {
            this.setState({
              questionItem: res.content,
            });
          }
        })
        .finally(() => {
          this.setState({
            getQuestionStatus: false,
          });
        });
    }
  };

  studentAnswer = (e, questionBankId, questionNumber) => {
    if (e) {
      this.setState({
        getQuestionStatus: true,
      });
      classQuestionAnalysis({
        examId: this.state.examId,
        questionId: questionBankId,
        questionNo: questionNumber,
      })
        .then((res) => {
          if (res.status) {
            this.setState({
              singleInfoList: res.content.singleItemAndStudentInfoList,
            });
          }
        })
        .finally(() => {
          this.setState({
            getQuestionStatus: false,
          });
        });
    }
  };

  openText = (id) => {
    this.props
      .dispatch({
        type: "home/getStudentOriginal",
        payload: {
          examId: this.state.examId,
          studentId: id,
        },
      })
      .then(() => {
        let array = [];
        this.props.studentOriginal &&
          this.props.studentOriginal.length &&
          this.props.studentOriginal.map((item) => {
            array.push({
              type: "image",
              url: item,
            });
          });
        this.setState({
          imgArr: array,
          previewVisible: true,
        });
      });
  };

  answerContent = (row) => {
    const { singleInfoList } = this.state;
    if (singleInfoList && singleInfoList.length > 0) {
      return singleInfoList.map((item, index) => {
        if (row.selectStudentIds.includes(item.studentId)) {
          return (
            <div
              className={`singleQuestion singleQuetionBlue`}
              id={`text${item.studentId}`}
            >
              <div className="singleQuestionHeader">
                <span className="answerOf">
                  {item.studentName} {trans("data.answerOf", "的作答")}
                </span>
                <span
                  className="seeTest"
                  onClick={() => this.openText(item.studentId)}
                >
                  {trans("global.seeTest", "查看原卷")}
                </span>
              </div>
              <div className="singleQuestionBody">
                {item.studentAnswerPicture ? (
                  <img src={item.studentAnswerPicture} alt="" />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                    }}
                    dangerouslySetInnerHTML={{
                      __html: item.studentAnswerContent,
                    }}
                  ></div>
                )}
              </div>
            </div>
          );
        }
      });
    }
    return (
      <div className="originalText">
        <Empty />
      </div>
    );
  };

  getContent = () => {
    const { questionItem } = this.state;
    if (!questionItem) {
      return;
    }

    return (
      <div style={{ maxHeight: "calc(100vh - 24px)", overflow: "auto" }}>
        <div
          dangerouslySetInnerHTML={{ __html: questionItem.content }}
          style={{ marginBottom: "10px" }}
        ></div>
        {questionItem.type == 1 || questionItem.type == 2 ? (
          <>
            {questionItem.optionList &&
              questionItem.optionList.length &&
              questionItem.optionList.map((item) => (
                <div
                  dangerouslySetInnerHTML={{
                    __html: `${item.answers}`,
                  }}
                  style={{ display: "flex" }}
                ></div>
              ))}
            <div>
              {trans("global.rightAnswer", "正确答案：")}：{questionItem.answer}
            </div>
          </>
        ) : questionItem.type == 3 ? (
          <div
            dangerouslySetInnerHTML={{
              __html: ` 正确答案：${completion ? completion : ""}`,
            }}
          ></div>
        ) : questionItem.type == 4 ? (
          <div>
            {trans("global.rightAnswer", "正确答案：")}：
            {questionItem.answer == "true"
              ? trans("global.right", "正确")
              : trans("global.wrong", "错误")}
          </div>
        ) : questionItem.type == 5 ? (
          <div
            dangerouslySetInnerHTML={{
              __html: ` 正确答案：${questionItem.answer}`,
            }}
            style={{ display: "inline-block" }}
          ></div>
        ) : questionItem.type == 6 &&
          questionItem.sonQuestionList &&
          questionItem.sonQuestionList.length > 0 ? (
          questionItem.sonQuestionList.map((ii) => (
            <div>
              <div
                dangerouslySetInnerHTML={{ __html: ii.content }}
                style={{ marginBottom: "10px" }}
              ></div>
              {ii.type == 1 || ii.type == 2 ? (
                <>
                  {ii.optionList &&
                    ii.optionList.length &&
                    ii.optionList.map((item) => (
                      <div
                        dangerouslySetInnerHTML={{
                          __html: `${item.answers}`,
                        }}
                      ></div>
                    ))}
                  <div>
                    {trans("global.rightAnswer", "正确答案：")}：{ii.answer}
                  </div>
                </>
              ) : ii.type == 3 ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html: ` 正确答案：${ii.gapFillingAnswer && ii.gapFillingAnswer.answers && ii.gapFillingAnswer?.answers.join(",") ? ii.gapFillingAnswer?.answers.join(",") : ""}`,
                  }}
                ></div>
              ) : ii.type == 4 ? (
                <div>
                  {trans("global.rightAnswer", "正确答案：")}：
                  {ii.answer == "true"
                    ? trans("global.right", "正确")
                    : trans("global.wrong", "错误")}
                </div>
              ) : ii.type == 5 ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html: ` 正确答案：${ii.answer}`,
                  }}
                  style={{ display: "inline-block" }}
                ></div>
              ) : null}
            </div>
          ))
        ) : null}
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
                      ? questionList.map((element) => (
                          <Option
                            value={element.questionId}
                            key={element.questionId}
                          >
                            {element.questionNum}
                          </Option>
                        ))
                      : null}
                  </Select>
                </div>
                <div style={{ width: "70px", lineHeight: "32px" }}>
                  {item.questionNo ? (
                    <Popover
                      content={
                        this.state.getQuestionStatus ? (
                          <Spin />
                        ) : (
                          this.getContent()
                        )
                      }
                      onVisibleChange={(e) => {
                        this.originalQuestionVisChange(e, item.questionBankId);
                      }}
                      trigger="click"
                    >
                      <span style={{ color: "#0445FC" }}>
                        {trans("global.preview", "预览")}
                      </span>
                    </Popover>
                  ) : (
                    <span style={{ color: "rgba(0, 0, 0, 0.25)" }}>
                      {trans("global.preview", "预览")}
                    </span>
                  )}
                </div>
                <div className={styles.scoreTit} style={{ lineHeight: "30px" }}>
                  {item.questionScore}
                </div>
                <div className={styles.studentTit}>
                  <Select
                    style={{ width: 225 }}
                    mode="multiple"
                    placeholder={trans("global.selectStudent", "选择学生")}
                    onChange={(id) => this.selectQusetionStudent(id, index)}
                    onSearch={(value) =>
                      this.getQuestionStudent(item.questionNo, index, value)
                    }
                    onFocus={() =>
                      this.getQuestionStudentFocus(item.questionNo, index)
                    }
                    onBlur={this.clearStudent}
                    filterOption={false}
                  >
                    {item.studentList && item.studentList.length > 0
                      ? item.studentList.map((element) => (
                          <Option
                            value={element.studentId}
                            key={element.studentId}
                          >
                            {element.studentName}
                            <span style={{ float: "right", color: "#cecece" }}>
                              {element.score}
                            </span>
                          </Option>
                        ))
                      : null}
                  </Select>
                </div>
                <div style={{ width: "100px", lineHeight: "32px" }}>
                  {item.selectStudentIds && item.selectStudentIds.length > 0 ? (
                    <Popover
                      placement="top"
                      content={
                        this.state.getQuestionStatus ? (
                          <Spin />
                        ) : (
                          <div
                            style={{
                              width: "500px",
                              maxHeight: "100vh",
                              overflow: "auto",
                            }}
                          >
                            {this.answerContent(item)}
                          </div>
                        )
                      }
                      onVisibleChange={(e) => {
                        this.studentAnswer(
                          e,
                          item.questionBankId,
                          item.questionNum,
                        );
                      }}
                      trigger="click"
                    >
                      <span style={{ color: "#0445FC" }}>
                        {trans("global.preview", "预览")}
                      </span>
                    </Popover>
                  ) : (
                    <span style={{ color: "rgba(0, 0, 0, 0.25)" }}>
                      {trans("global.preview", "预览")}
                    </span>
                  )}
                </div>
                <div className={styles.newScoreTit}>
                  <InputNumber
                    min={0}
                    onChange={(value) =>
                      this.changeScore(value, index, item.questionScore)
                    }
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

  //订正分数明晰
  // renderScore_old = () => {
  //   const { stuList } = this.state;
  //   const { questionList, questionStudent } = this.props;
  //   return <div>
  //     {
  //       stuList && stuList.length ?
  //       stuList.map((item, index) => (
  //           <div className={styles.rowContent}>
  //             <div className={styles.scoreTit} style={{ lineHeight: "30px",width:"75px", minWidth: 75 }}>
  //                 {item.studentName}
  //             </div>
  //             <div className={styles.scoreTit} style={{ lineHeight: "30px" }}>
  //               {item.studentScore}
  //             </div>
  //             <div className={styles.newScoreTit}>
  //               <Input
  //                 onChange={(value) => this.changeTotalScore(value, index)}
  //                 value={item.studentNewScore}
  //                 style={{ width: 60, textAlign: 'center', marginLeft:'23px'}}
  //               />
  //             </div>
  //             <div className={styles.scoreTit}>换算成绩</div>
  //             <div className={styles.scoreTit} style={{ lineHeight: "30px", marginLeft:"28px" }}>
  //               {item.scoreLevel}
  //             </div>
  //             <div className={styles.newScoreTit}>
  //               订正后等级
  //               {/* <Select
  //                 style={{ width: 55,marginLeft:30 }}
  //                 value={item.newScoreLevelId}
  //                 onChange={this.changeLevel.bind(this, index)}
  //               >
  //                 {
  //                   this.props.stageList && this.props.stageList.length ?
  //                   this.props.stageList.map(item => (
  //                     <Select.Option value={item.id}>{item.levelName}</Select.Option>
  //                   )) : null
  //                 } */}
  //                 {/* {
  //                   questionStudent && questionStudent.length > 0 ?
  //                     questionStudent.map(el => (
  //                       <Option value={el.studentId} key={el.studentId}>{el.studentName}<span style={{ float: "right", color: "#cecece" }}>{el.score}</span></Option>
  //                     )) : null
  //                 } */}

  //               {/* </Select> */}
  //             </div>
  //             <div className={styles.scoreTit}>方案原等级</div>
  //             <div className={styles.scoreTit}>方案订正后等级</div>
  //             <div className={styles.newScoreTit}>
  //             <Input
  //                 onChange={(value) => this.changeSeason(value, index)}
  //                 // onChange={(e) => this.setState({updatedSeason:e.target.value})}
  //                 value={item.correctionReason}
  //                 // onFocus={(value) => this.changeScoreFocus(value, index)}
  //                 style={{ width: 145,marginLeft:-8 }}
  //               />
  //             </div>
  //             <i className={[styles.iconfont, styles.deleteIcon].join(' ')} onClick={() => this.deleteStu(index)}>
  //               &#xe71e;
  //             </i>
  //           </div>
  //         )) : null
  //     }
  //   </div>
  // }

  changePopVisible = (visible, index) => {
    let pop = {};
    pop[index] = visible;
    this.setState({
      popVisible: pop,
    });
  };

  renderExamType = (index, item) => {
    return (
      <Radio.Group
        onChange={(e) => this.changeExamType(e, index)}
        value={item.type}
      >
        <Radio value={1}>
          <span className={styles.radioText}>
            {trans("revised.correctionAction", "订正")}
          </span>
        </Radio>
        <Radio value={2}>
          <span className={styles.radioText}>
            {trans("global.absent", "缺考")}
          </span>
        </Radio>
      </Radio.Group>
    );
  };

  changeExamType = (e, index) => {
    let newstuList = JSON.parse(JSON.stringify(this.state.stuList));
    newstuList[`${index}`]["type"] = e.target.value;
    newstuList[`${index}`]["studentNewScore"] = null;
    newstuList[`${index}`]["newScoreLevelId"] = null;
    newstuList[`${index}`]["evaluationItemEnLevel"] = null;
    newstuList[`${index}`]["evaluationItemLevel"] = null;
    newstuList[`${index}`]["oldSchemeEnLevel"] = null;
    newstuList[`${index}`]["oldSchemeLevel"] = null;
    newstuList[`${index}`]["newSchemeLevel"] = null;
    newstuList[`${index}`]["newSchemeEnLevel"] = null;
    this.setState({
      stuList: newstuList,
    });
  };

  //订正分数明细--lbx
  renderScore = () => {
    const { stuList } = this.state;
    const { questionList, questionStudent } = this.props;
    let percent = this.props.evaDetail?.scoreRate || 0;
    return (
      <div>
        {stuList?.length
          ? stuList.map((item, index) => (
              <div
                className={styles.tableContent}
                style={{ background: "#fff" }}
              >
                <div className={styles.fixedWidth}>
                  <Popover
                    content={this.renderExamType(index, item)}
                    title={null}
                    trigger="click"
                    visible={this.state.popVisible[index] || false}
                    onVisibleChange={(visible) =>
                      this.changePopVisible(visible, index)
                    }
                  >
                    <span>
                      <em className={styles.nameStyle}>{item.studentName}</em>
                      <em
                        className={styles.levelName}
                        style={{
                          backgroundColor:
                            item.type === 1 ? "#00a63f" : "#FE9D00",
                        }}
                      >
                        {item.type === 1
                          ? trans("revised.correctionAction", "订正")
                          : trans("global.absent", "缺考")}
                      </em>
                    </span>
                  </Popover>
                </div>
                <div className={`${styles.scoreWidth} ${styles.center}`}>
                  <span>{item.studentScore}</span>
                </div>
                <div className={`${styles.headerPart} ${styles.center}`}>
                  <span>{item.scoreLevel}</span>
                </div>
                <div className={styles.inputWidth}>
                  <Input
                    onChange={(value) =>
                      this.changeTotalScore(value, index, item)
                    }
                    value={item.studentNewScore}
                    disabled={item.type === 1 ? false : true}
                  />
                </div>
                <div
                  className={`${styles.scoreWidth} ${styles.center}`}
                  style={{ width: 100 }}
                >
                  <span style={{ color: "#00a63f" }}>
                    {item.studentNewScore
                      ? Number.parseInt(+item.studentNewScore * percent)
                      : "-"}
                  </span>
                </div>
                <div className={`${styles.headerPart} ${styles.center}`}>
                  <span style={{ color: "#00a63f" }}>
                    {locale() == "en"
                      ? item.evaluationItemEnLevel || "-"
                      : item.evaluationItemLevel || "-"}
                  </span>
                </div>
                <div className={`${styles.headerPart} ${styles.center}`}>
                  <span style={{ color: "#00a63f" }}>
                    {locale() == "en"
                      ? item.oldSchemeEnLevel || "-"
                      : item.oldSchemeLevel || "-"}
                  </span>
                </div>
                <div
                  className={`${styles.headerPart} ${styles.center}`}
                  style={{ width: 100 }}
                >
                  <span style={{ color: "#00a63f" }}>
                    {locale() == "en"
                      ? item.newSchemeEnLevel || "-"
                      : item.newSchemeLevel || "-"}
                  </span>
                </div>
                <div className={`${styles.inputWidth} ${styles.center}`}>
                  <Input
                    onChange={(value) => this.changeSeason(value, index)}
                    value={item.correctionReason}
                  />
                </div>
                <i
                  className={[styles.iconfont, styles.deleteIcon].join(" ")}
                  onClick={() => this.deleteStu(index)}
                >
                  &#xe71e;
                </i>
              </div>
            ))
          : null}
      </div>
    );
  };

  //渲染订正试卷表头
  renderTableTitle = () => {
    const { radioType } = this.state;
    return radioType == 1 ? (
      <div className={`${styles.rowContent} ${styles.tabTitle}`}>
        <div className={styles.questionIdTit}>
          <div>{trans("analysis.questionIndex", "题号")}</div>
        </div>
        <div style={{ width: "70px" }}>
          <div>{trans("global.Originalquestion", "原题")}</div>
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
        <div style={{ width: "70px" }}>
          <div>{trans("global.Originalquestion", "原题")}</div>
        </div>
        <div className={styles.scoreTit}>
          <div>{trans("gobal.questionScore", "分值")}</div>
        </div>
        <div className={styles.studentTit}>
          <div>
            {trans("global.student", "学生")}/
            {trans("global.currentScore", "当前得分")}
          </div>
        </div>
        <div style={{ width: "100px" }}>
          <div>{trans("global.studentAnswer", "学生作答")}</div>
        </div>
        <div className={styles.newScoreTit}>
          <div>{trans("global.newScore", "新得分")}</div>
        </div>
      </div>
    );
  };

  //渲染修改成绩表头--lbx临时修改
  renderScoreTableTitle = () => {
    return (
      <div className={styles.tableContent} style={{ padding: 10 }}>
        <div className={styles.fixedWidth}>
          <span>{trans("analysis.student", "学生")}</span>
        </div>
        <div className={`${styles.scoreWidth} ${styles.center}`}>
          <span>{trans("gobal.score", "原成绩")}</span>
        </div>
        <div className={`${styles.headerPart} ${styles.center}`}>
          <span>{trans("gobal.stage", "原等级")}</span>
        </div>
        <div className={`${styles.inputWidth} ${styles.center}`}>
          <span>{trans("global.updatedScore", "订正后成绩")}</span>
        </div>
        <div
          className={`${styles.scoreWidth} ${styles.center}`}
          style={{ width: 100 }}
        >
          <span>{trans("evaluation.score", "订正后分数")}</span>
        </div>
        <div className={`${styles.headerPart}  ${styles.center}`}>
          <span>{trans("global.updatedStage", "订正后等级")}</span>
        </div>
        <div className={`${styles.headerPart} ${styles.center}`}>
          <span>{trans("evaluation.oldSchemeLevel", "方案原等级")}</span>
        </div>
        <div
          className={`${styles.headerPart} ${styles.center}`}
          style={{ width: 100 }}
        >
          <span>{trans("evaluation.newSchemeLevel", "方案订正后等级")}</span>
        </div>
        <div className={`${styles.inputWidth} ${styles.center}`}>
          <span>{trans("global.season", "订正原因")}</span>
        </div>
      </div>
    );
  };
  //渲染修改成绩表头
  // renderScoreTableTitle_old = () => {
  //   return (
  //     <div className={`${styles.rowContent} ${styles.tabTitle}`}>
  //       <div style={{ margin: "0", width: "75px", minWidth: 75 }}>
  //           {trans("analysis.student", "学生")}
  //       </div>
  //       <div className={styles.scoreTit}>
  //         <div style={{ width: "50px" }}>{trans("gobal.score", "原成绩")}</div>
  //       </div>
  //       <div className={styles.newScoreTit}>
  //         <div>{trans("global.updatedScore", "订正后成绩")}</div>
  //       </div>
  //       <div className={styles.scoreTit}>
  //         <div>实际成绩</div>
  //       </div>
  //       <div className={styles.scoreTit}>
  //         <div style={{ width: "48px" }}>{trans("gobal.stage", "原等级")}</div>
  //       </div>
  //       <div className={styles.newScoreTit}>
  //         <div>{trans("global.updatedStage", "订正后等级")}</div>
  //       </div>
  //       <div className={styles.scoreTit}>
  //         <div>方案原等级</div>
  //       </div>
  //       <div className={styles.scoreTit}>
  //         <div>方案订正后等级</div>
  //       </div>
  //       <div className={styles.newScoreTit}>
  //         <div style={{ textAlign: "center" }}>
  //           {trans("global.season", "订正原因")}
  //         </div>
  //       </div>
  //     </div>
  //   );
  //   // }
  // };

  //根据成绩查询对应等级
  fetchScoreLevel = (studentId, score, index) => {
    const { dispatch, evaluationId } = this.props;
    //节流
    clearTimeout(timer);
    timer = null;
    timer = setTimeout(() => {
      let percent = this.props.evaDetail?.scoreRate || 0;
      dispatch({
        type: "revisedRecord/fetchModifiedScore",
        payload: {
          evaluationTargetId: evaluationId,
          studentId: studentId,
          score: score ? Number.parseInt(+score * percent) : "",
        },
        onSuccess: () => {
          const { levelInfo } = this.props;
          let newStuList = JSON.parse(JSON.stringify(this.state.stuList));
          newStuList[`${index}`]["newScoreLevelId"] = score
            ? levelInfo.evaluationItemScoreLevelId
            : null;
          newStuList[`${index}`]["evaluationItemEnLevel"] = score
            ? levelInfo.evaluationItemEnLevel
            : null;
          newStuList[`${index}`]["evaluationItemLevel"] = score
            ? levelInfo.evaluationItemLevel
            : null;
          newStuList[`${index}`]["oldSchemeEnLevel"] = score
            ? levelInfo.oldSchemeEnLevel
            : null;
          newStuList[`${index}`]["oldSchemeLevel"] = score
            ? levelInfo.oldSchemeLevel
            : null;
          newStuList[`${index}`]["newSchemeLevel"] = score
            ? levelInfo.newSchemeLevel
            : null;
          newStuList[`${index}`]["newSchemeEnLevel"] = score
            ? levelInfo.newSchemeEnLevel
            : null;
          newStuList[`${index}`]["newSchemeScore"] = score
            ? levelInfo.newSchemeScore
            : null;
          newStuList[`${index}`]["oldSchemeScore"] = score
            ? levelInfo.oldSchemeScore
            : null;
          newStuList[`${index}`]["newCategoryScore"] = score
            ? levelInfo.newCategoryScore
            : null;
          newStuList[`${index}`]["newCategoryLevel"] = score
            ? levelInfo.newCategoryLevel
            : null;
          newStuList[`${index}`]["newCategoryEnLevel"] = score
            ? levelInfo.newCategoryEnLevel
            : null;
          this.setState({
            stuList: newStuList,
          });
        },
      });
    }, 500);
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
    for (const [index, element] of newAnswerList.entries()) {
      if (radioType == 1) {
        //订正答案
        if (element.questionType == 0) {
          //多选
          array.push({
            questionId: element.questionNo,
            answer: element.oldAnswer.join(""),
            answerList: element.newAnswer,
            questionType: element.questionType,
          });
        } else if (element.questionType == 4) {
          //判断
          array.push({
            questionId: element.questionNo,
            answer: element.oldAnswer,
            newAnswer: this.formatAnswer(
              element.oldAnswer,
              element.newAnswer,
              element.answerType,
            ),
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
        let newList = [];
        this.state.questionStuList &&
          this.state.questionStuList.length &&
          this.state.questionStuList[index].map((item) => {
            element.selectStudentIds.map((it) => {
              if (item.studentId === it) {
                newList.push({
                  studentId: item.studentId,
                  score: item.score,
                });
              }
            });
          });
        array.push({
          questionId: element.questionNo,
          newStudentScore: element.newScore,
          studentList: newList,
        });
      }
    }
    return array;
  };

  //格式化判断题答案  原答案是WR，提交时也是WR；原答案是TF，提交是也是TF
  formatAnswer = (oldAnswer, newAnswer, type) => {
    let answer = "";
    // if (oldAnswer === "W" || oldAnswer === "R") {
    //   answer = newAnswer && newAnswer === "T" ? "W" : "R";
    // } else {
    //   answer = newAnswer;
    // }
    answer = newAnswer;
    if (newAnswer == "F") {
      answer = type === "RW" || type === "TW" ? "W" : newAnswer;
    } else {
      answer = type === "RW" ? "R" : newAnswer;
    }
    return answer;
  };

  //提交修改
  submitCorrect = () => {
    if (this.props.source === "evaluation") {
      let flag = true;
      let studentList = JSON.parse(JSON.stringify(this.state.stuList));
      if (studentList.length === 0) {
        flag = false;
        message.info(trans("revise.selectStudentTip", "您还没选择学生哦~"));
      } else {
        for (const element of studentList) {
          if (!element.studentNewScore && element["type"] === 1) {
            message.info(trans("revise.newScoreListTip", "新成绩不能为空哦~"));
            flag = false;
            break;
          }
          // if(!studentList[i].newScoreLevelId) {
          //   message.info(trans("revise.newScoreLevelIdTip", "新等级不能为空哦~"));
          //   flag = false;
          //   break;
          // }
          if (!element.correctionReason) {
            message.info(trans("revise.newResonTip", "订正原因不能为空哦~"));
            flag = false;
            break;
          }
        }
      }
      if (!flag) {
        return;
      }
      let percent = this.props.evaDetail?.scoreRate || 0;
      studentList.map(
        (item) =>
          (item.studentNewScore =
            item.type === 2
              ? null
              : Number.parseInt(+item.studentNewScore * percent)),
      );
      this.setState({
        isSubmitting: true,
      });
      this.props
        .dispatch({
          type: "revisedRecord/submitCorrectEva",
          payload: {
            targetId: this.props.evaluationId,
            courseName: this.props.evaDetail.courseName,
            semesterName: this.props.evaDetail.semesterName,
            correctionTypeName: this.props.evaDetail.correctionTypeName,
            studentScoreCorrectionRequest: studentList,
            type: this.props.type,
          },
          onSuccess: () => {
            window.location.href = this.props.stuId
              ? `${window.location.origin}/exam#/revisedPage/1/false/${this.props.evaluationId}/${this.props.type}/${this.props.courseId}/${this.props.semesterId}/${this.props.stuId}`
              : `${window.location.origin}/exam#/revisedPage/1/false/${this.props.evaluationId}/${this.props.type}/${this.props.courseId}/${this.props.semesterId}`;
            window.location.reload();
          },
        })
        .then((res) => {
          this.setState({
            isSubmitting: false,
          });
        });
    } else {
      if (!canCommit) return false;
      if (!this.state.examId) {
        message.info(trans("revise.examTip", "您还没选择试卷哦~"));
        return false;
      }
      let ifContinue = this.judgeAnswerList();
      if (!ifContinue) return false;
      let correctionList = this.formatAnswerList();
      canCommit = false;
      this.setState({
        isSubmitting: true,
      });
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
            const { reloadSource } = this.props;
            typeof reloadSource == "function" && reloadSource.call(this);
          },
        })
        .then(() => {
          canCommit = true;
          this.setState({
            isSubmitting: false,
          });
        });
      console.log(`this.state.stuList`, this.state.stuList);
    }
  };

  handelCacel = () => {
    this.props.dispatch({
      type: "revisedRecord/clearRevisedData",
      payload: {},
    });
    const { openRevisedDataModal } = this.props;
    typeof openRevisedDataModal == "function" &&
      openRevisedDataModal.call(this, undefined, false);
  };

  //提交
  handleSubmit = (e) => {
    e.preventDefault();
    this.props.form.validateFields((error, values) => {
      if (!error) {
        console.log("Received values of form:", values);
      }
    });
  };
  searchByName(keyWord) {
    console.log("111");
  }
  multiSelectOnSearch = (keyword) => {
    if (this.timeId) {
      clearTimeout(this.timeId);
    }
    this.timeId = setTimeout(() => {
      this.getBaseAll(keyword);
      this.timeId = false;
    }, 500);
  };
  getBaseAll(value) {
    const { dispatch } = this.props;
    dispatch({
      type: "revisedRecord/getGroupAndStudent",
      payload: {
        targetId: this.props.evaluationId,
        type: this.props.type,
        name: value,
      },
    });
  }
  multiSelectOnChange = (selectValue) => {
    this.setState({
      selectStudentList: cloneObjectList(selectValue),
    });
  };
  //切换班级
  classChange(index) {
    this.setState({
      classIndex: index,
    });
  }

  //全选
  selectAll(e) {
    const {
      classIndex,
      selectList,
      selectCount,
      classList,
      selectStudentList,
    } = this.state;
    let list = [...selectList];

    classList &&
      !selectCount[classList[classIndex]["id"]] &&
      (selectCount[classList[classIndex]["id"]] = 0);
    selectStudentList[classIndex].map((element) => {
      let index = this.inArray(element.id, list);
      if (e.target.checked) {
        if (index < 0) {
          classList && selectCount[classList[classIndex]["id"]]++;
          list.push(
            classList
              ? Object.assign(element, { groupId: classList[classIndex]["id"] })
              : element,
          );
        }
      } else {
        classList && selectCount[classList[classIndex]["id"]]--;
        index > -1 && list.splice(index, 1);
      }
    });

    this.setState({
      selectList: list,
      selectCount,
    });
    // this.propsChange(list);
  }
  ifCheckAll() {
    let ifAll = false,
      selectCount = 0;
    const { classIndex, selectList, selectStudentList } = this.state;
    if (selectStudentList && selectStudentList.length > 0) {
      selectStudentList[classIndex].map((element) => {
        this.inArray(element.id, selectList) > -1 && selectCount++;
      });
      ifAll = selectCount == selectStudentList[classIndex].length;
    }

    return ifAll;
  }

  inArray(element, array) {
    let index = -1;
    array = array || [];
    for (var index_ = 0, l = array.length; index_ < l; index_++) {
      if (element == array[index_]["id"]) {
        index = index_;
        break;
      }
    }
    return index;
  }

  lookDetail = (status, item) => {
    console.log(item, "111");
    this.setState({
      previewVisible: status || false,
      previewInfo: item || null,
    });
  };

  render() {
    const {
      radioType,
      answerList,
      remark,
      examId,
      classIndex,
      classList,
      studentList,
      selectStudentList,
      questionStuList,
    } = this.state;
    console.log(questionStuList, "kk");
    // const { getFieldDecorator } = this.props.form;
    const { testId, examList, baseAllStudents } = this.props;
    // console.log(examList);
    // console.log(examId);
    // console.log(this.props.source, studentList, selectStudentList, "111");
    // console.log(answerList, "zwl");
    let hasExamId = testId > 0 ? true : false;
    return (
      <div className={styles.reviseBox}>
        <ShowFile
          previewVisible={this.state.previewVisible}
          previewInfo={this.state.imgArr}
          lookDetail={this.lookDetail}
          imgchange={true}
        />

        <div className={styles.header}>
          <div className={styles.headerLeft} onClick={this.handelCacel}>
            <i className={[styles.iconfont, styles.closeIcon].join(" ")}>
              &#xe6e2;
            </i>
            <span>{trans("revised.addRevisionTitle", "新增订正")}</span>
          </div>
          <div className={styles.headerRight}>
            <span className={styles.cancelBtn} onClick={this.handelCacel}>
              {trans("global.cancle", "取消")}
            </span>
            {this.state.isSubmitting ? (
              <span className={styles.agreeBtn}>
                <Icon type="loading" />{" "}
                {trans("global.submitting", "提交中...")}
              </span>
            ) : (
              <span className={styles.agreeBtn} onClick={this.submitCorrect}>
                {trans("global.submit", "提交")}
              </span>
            )}
          </div>
        </div>
        {this.props.source == "question" ? (
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
                      "revised.questionApprovalStarted",
                      "订正流程发起后，待学科首席",
                    )}
                    <i className={styles.iconfont}>&#xe7f4;</i>
                    {trans(
                      "revised.questionApprovalAcademicDean",
                      "学术长审核通过后，系统会自动更新成绩，更新完成后会钉钉消息通知",
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
                  // disabled={hasExamId} //测验分析=》订正管理=》允许此操作可选。这里在组件内统一放开，后续有问题再改动
                  key={examId}
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
                  <div className={styles.reviseTable} style={{ width: "auto" }}>
                    {this.renderTableTitle()}
                    {radioType == 1
                      ? this.renderAnswerDetail()
                      : this.renderScoreDetail()}
                    <div
                      className={styles.addQuestionNo}
                      onClick={this.addQuestionNo}
                    >
                      <i
                        className={[styles.iconfont, styles.closeIcon].join(
                          " ",
                        )}
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
        ) : (
          <div className={styles.content}>
            <div className={styles.reviseContent}>
              <div className={styles.formIetem}>
                <div className={styles.formTitle}>
                  {trans("revise.course", "课程")}
                </div>
                <div>{this.props.evaDetail.courseName || ""}</div>
              </div>
              <div className={styles.formIetem}>
                <div className={styles.formTitle}>
                  {trans("revised.semester", "学期")}：
                </div>
                <div>{this.props.evaDetail.semesterName || ""}</div>
              </div>
              <div className={styles.formIetem}>
                <div className={styles.formTitle}>
                  {trans("revise.classification", "订正分类：")}
                </div>
                <div>{this.props.evaDetail.correctionTypeName || ""}</div>
              </div>
              <div className={[styles.formIetem, styles.detailItem].join(" ")}>
                <div className={styles.formTitle}>
                  {trans("revise.detail", "订正明细：")}
                </div>
                <div className={styles.reviseDetail}>
                  <div
                    className={[
                      styles.reviseTable,
                      styles.evaluationTable,
                    ].join(" ")}
                  >
                    {this.renderScoreTableTitle()}
                    {this.renderScore()}
                    <MultiSelect
                      className="multiSelect"
                      isMobile={false}
                      onSearch={this.multiSelectOnSearch}
                      onChange={this.multiSelectOnChange}
                      sourceData={baseAllStudents}
                      initData={selectStudentList}
                      onOk={this.handleOk}
                      onCancel={this.handleCancel}
                      getStuScore={this.getStuScore}
                      handleOk={this.handleOk}
                      handleCancel={this.handleCancel}
                      toolDirection={"topLeft"}
                      hideAddBox={true}
                      hideMask={true}
                    />
                    {/* <Modal
                    title="添加学生"
                    visible={this.state.visible}
                    onOk={this.handleOk}
                    onCancel={this.handleCancel}
                  >
                    <Form onSubmit={this.handleSubmit} className="login-form">
                      <Form.Item>
                        {getFieldDecorator('stuName', {
                          rules: [{ required: true, message: 'Please input student‘name!' }],
                        })(
                          <Input
                            prefix={<Icon type="user" style={{ color: 'rgba(0,0,0,.25)' }} />}
                            placeholder="学生姓名"
                          />,
                        )}
                      </Form.Item>
                      <Form.Item>
                        {getFieldDecorator('stuGrade', {
                          rules: [{ required: true, message: 'Please input student’grade!' }],
                        })(
                          <Input
                            prefix={<Icon type="lock" style={{ color: 'rgba(0,0,0,.25)' }} />}
                            placeholder="学生成绩"
                          />,
                        )}
                      </Form.Item>
                    </Form>
                  </Modal> */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default connect(({ revisedRecord, home }) => ({
  examList: revisedRecord.examList,
  questionList: revisedRecord.questionList,
  questionStudent: revisedRecord.questionStudent,
  baseAllStudents: revisedRecord.baseAllStudents,
  stuScore: revisedRecord.stuScore,
  stageList: revisedRecord.stageList,
  evaDetail: revisedRecord.evaDetail,
  willRevisedStudent: revisedRecord.willRevisedStudent,
  levelInfo: revisedRecord.levelInfo,
  studentOriginal: home.studentOriginal,
}))(Revised);
const cloneObjectList = (list) => {
  let moveList = [];

  for (const element of list) {
    if (element) {
      moveList.push(Object.assign({}, element));
    }
  }
  return moveList;
};
