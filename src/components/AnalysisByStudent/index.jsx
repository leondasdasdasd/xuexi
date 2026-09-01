//按学生的数据统计
import React, { PureComponent } from "react";
import { message, Modal, Pagination, Spin, Table, Tooltip } from "antd";
import { connect } from "dva";

import {
  buildAnalysisMarkingPath,
  buildTeacherStudentResultPath,
} from "../../common/explicitExamRoutes";
import { formatAnalysisAnswerSummary } from "../../routes/DataAnalysis/analysisAnswerSummary";
import AnalysisQuestionPreview from "../../routes/DataAnalysis/components/AnalysisQuestionPreview";
import { trans } from "../../utils/i18n";
import ShowFile from "../UseFileItem/showFile";

import icon from "../../icon.module.less";
import styles from "./index.module.less";
const { Column } = Table;

@connect((state) => ({
  answerRateData: state.home.answerRateData,
}))
class AnalysisByStudent extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {
      pageSize: 25,
      pageNumber: 1,
      visibleObj: {},
      fileList: [],
      studentId: null,
      viewList: [],
      answerDetail: null,
      columns: [],
    };
  }

  componentDidMount() {
    this.props.onRef(this);
  }

  componentDidUpdate(previousProperties) {
    if (this.props.stuData != previousProperties.stuData) {
      this.initColumns(this.props.stuData);
    }
  }

  goToCorrectionRemark = (record) => {
    const path = buildAnalysisMarkingPath(
      this.props.contractVersion,
      this.props.examId,
      this.props.examPaperId,
      record.userId,
    );
    window.open(`${window.location.origin}/exam#${path}`);
  };

  initColumns = (data) => {
    const { answersResponses } = data;
    let list = answersResponses?.length
      ? answersResponses.map((item, index) => {
          return {
            key: index,
            title: <em className={styles.examTitle}>{item.questionNum}</em>,
            dataIndex: index,
            align: "center",
            render: (text, record) =>
              this.renderQuestionAnswer(text, record, item),
            className: styles.columnStyle,
            width: 100,
          };
        })
      : [];

    let columns = [
      {
        title: trans("analysis.studentList", "学生列表"),
        key: "studentList",
        dataIndex: "studentList",
        render: (text, record) => (
          <span>
            <em className={styles.boldStyle}>
              {record.name} {record.ename}
            </em>
            <em className={styles.grayStyle}>{record.groupName}</em>
          </span>
        ),
        fixed: "left",
        width: 180,
      },
      {
        title: trans("global.gradingStatus", "批改状态"),
        key: "isComplete",
        dataIndex: "isComplete",
        render: (text, record, index) => {
          const { isComplete, studentQuestion } = record;
          if (isComplete) {
            let pendingGradingList = null;
            if (studentQuestion && studentQuestion.length > 0) {
              pendingGradingList = studentQuestion.filter(
                (qu) => qu.isCorrect == "待批改",
              );
            }

            return pendingGradingList && pendingGradingList.length > 0 ? (
              <div className={styles.textStyle}>
                {trans("analysisStudent.pendingGrading", "待批改")}
                <span style={{ color: "#0445FC", marginLeft: "5px" }}>
                  {pendingGradingList.length}
                </span>
              </div>
            ) : (
              trans("global.completed", "已完成")
            );
          }
        },
        align: "center",
        fixed: "left",
        width: 100,
      },
      {
        title: trans("analysisStudent.scoreAndDuration", "成绩/耗时"),
        key: "completeCell",
        dataIndex: "completeCell",
        render: (text, record) => this.renderFinish(text, record),
        align: "center",
        fixed: "left",
        width: 120,
      },
      ...list,
      {},
      {
        title: trans("global.option", "操作"),
        key: "operation",
        width: 140,
        render: (text, record) => (
          <div style={{ display: "flex" }}>
            <div
              onClick={() => this.lookStudentTest(text)}
              className={
                text.isComplete == true ? styles.lookPaper : styles.unLookPaper
              }
            >
              {trans("analysis.lookPaperStatus", "看答卷")}
            </div>

            {record.isComplete === true && (
              <div
                className={styles.lookPaper}
                onClick={() => this.goToCorrectionRemark(record)}
              >
                去批改
              </div>
            )}

            {text.fileList && text.fileList.length > 0
              ? text.fileList.map((item, index) => (
                  <div className={styles.fileBox}>
                    <a
                      href={`${window.location.origin}/${item.url}`}
                      target="_blank"
                      className={styles.fileItem}
                      rel="noreferrer"
                    >
                      {trans("analysisStudent.imagePrefix", "图片")}
                      {index + 1}
                    </a>
                    <i
                      className={[styles.iconfont, styles.deleteIcon].join(" ")}
                      onClick={this.deleteFile.bind(this, text, index)}
                    >
                      &#xe6e2;
                    </i>
                    {this.state.viewList.length > 0 &&
                    JSON.stringify(this.state.viewList).includes(item.url) ? (
                      <Tooltip
                        placement="topRight"
                        title={trans(
                          "analysisStudent.addedToProjection",
                          "已加入投屏",
                        )}
                      >
                        <i
                          className={[styles.iconfont, styles.cancelIcon].join(
                            " ",
                          )}
                          onClick={this.cancelFile.bind(this, item)}
                          style={{ fontSize: "14px" }}
                        >
                          &#xe7fd;
                        </i>
                      </Tooltip>
                    ) : (
                      <Tooltip
                        placement="topRight"
                        title={trans(
                          "analysisStudent.addToProjection",
                          "加入投屏",
                        )}
                      >
                        <i
                          className={[styles.iconfont, styles.deleteIcon].join(
                            " ",
                          )}
                          onClick={this.addFile.bind(this, item)}
                          style={{ fontSize: "14px" }}
                        >
                          &#xe7d5;
                        </i>
                      </Tooltip>
                    )}
                  </div>
                ))
              : null}
          </div>
        ),
        align: "center",
        fixed: "right",
      },
    ];
    this.setState({ columns });
  };

  resetPageSize = (page, size) => {
    console.log(size, "111");
    this.setState({
      pageNumber: page,
      pageSize: size,
    });
  };

  //切换分页
  changePageSize = (page, size) => {
    this.setState(
      {
        pageNumber: page,
        pageSize: size,
      },
      () => {
        const { getData } = this.props;
        typeof getData == "function" && getData.call(this, page, size);
      },
    );
  };

  switchPageSize = (current, size) => {
    this.setState(
      {
        pageNumber: current,
        pageSize: size,
      },
      () => {
        const { getData } = this.props;
        typeof getData == "function" && getData.call(this, current, size);
      },
    );
  };

  changeVisible = (item, visible) => {
    const { groupId, studentName } = this.props;
    let visibleObject = JSON.parse(JSON.stringify(this.state.visibleObj));
    visibleObject = {};
    visibleObject[`${item.questionBankId}`] = visible;
    if (visible) {
      const { dispatch, examPaperId } = this.props;
      dispatch({
        type: "home/getAnswerRate",
        payload: {
          examId: this.props.examId,
          questionBankId: item.questionBankId,
          keyGroupId: groupId, //班级id
          keyName: studentName, //学生关键字
        },
      });
    }
    this.setState({
      visibleObj: visibleObject,
    });
  };

  //渲染完成情况
  renderFinish = (text, record) => {
    let pendingGradingList = null;
    if (record.studentQuestion && record.studentQuestion.length > 0) {
      pendingGradingList = record.studentQuestion?.filter(
        (qu) => qu.isCorrect === "待批改",
      );
    }
    return (
      <div>
        {record.isComplete === true ? (
          <span className={styles.scoreCol}>
            <div>
              <i className={icon.iconfont} style={{ color: "#01113D" }}>
                &#xe634;
              </i>
              {pendingGradingList?.length ? (
                <span
                  className={styles.textStyle}
                  style={{ color: "#0445FC", marginLeft: "10px" }}
                >
                  {trans("analysisStudent.pendingGrading", "待批改")}
                </span>
              ) : (
                <>
                  <span style={{ marginLeft: "10px" }}>{record.score}</span>/
                  <span className={styles.allScore}>{record.totalScore}</span>
                </>
              )}
            </div>
            <div>
              <i className={icon.iconfont} style={{ color: "#01113D" }}>
                &#xe646;
              </i>
              <span className={styles.allScore} style={{ marginLeft: "10px" }}>
                {record.answerTime} min
              </span>
            </div>
          </span>
        ) : (
          <em className={styles.unFinishStatus}>
            {trans("analysisStudent.notAnswered", "未作答")}
          </em>
        )}
      </div>
    );
  };

  addFile = (item) => {
    let newList = JSON.parse(JSON.stringify(this.state.viewList));
    newList.push(item.url);
    this.setState(
      {
        viewList: newList,
      },
      () => {
        this.props.setViewList(newList);
      },
    );
  };
  cancelFile = (item) => {
    let newList = [];
    if (this.state.viewList && this.state.viewList.length > 0) {
      this.state.viewList.map((it) => {
        if (it !== item.url) {
          newList.push(it);
        }
      });
    }
    this.setState(
      {
        viewList: newList,
      },
      () => {
        this.props.setViewList(newList);
      },
    );
  };

  //渲染班级统计情况
  renderClassSource = (item) => {
    const { answerRateData } = this.props;
    let difficulity =
      answerRateData.questionLevelCode == 1
        ? `${styles.questionLevel} ${styles.easy}`
        : answerRateData.questionLevelCode == 2
          ? `${styles.questionLevel} ${styles.general}`
          : `${styles.questionLevel} ${styles.difficult}`;
    return (
      <div className={styles.classSourceRate}>
        <p>
          <span className={styles.questionType}>
            <i className={icon.iconfont}>&#xe761;</i> {answerRateData.type}
          </span>
          <span className={difficulity}>
            <i className={icon.iconfont}>&#xe764;</i>{" "}
            {this.renderDifficult(answerRateData.questionLevelCode)}
          </span>
        </p>
        {answerRateData.answerResponses &&
          answerRateData.answerResponses.length > 0 &&
          answerRateData.answerResponses.map((item, key) => (
            <p key={key}>
              <span>{item.choose}</span>
              <span className={styles.progressBar}>
                <em
                  style={{
                    width: item.chooseRate || 0,
                    background: item.trueAnswer ? "#67B251" : "#E5492E",
                  }}
                ></em>
              </span>
              <span className={styles.analysisNum}>
                {trans("analysisStudent.totalPerson", "{$num}人", {
                  num: item.chooseNum || "0",
                })}{" "}
                . {item.chooseRate}
              </span>
            </p>
          ))}
      </div>
    );
  };
  deleteFile = (text, index) => {
    let newList = [];
    if (text.fileList && text.fileList.length > 0) {
      text.fileList.map((item, ind) => {
        if (index !== ind) {
          newList.push(item.fileId);
        }
      });
    }
    this.props.dispatch({
      type: "home/upStuFile",
      payload: {
        examPaperId: this.props.examPaperId,
        studentId: text.userId,
        sourceType: 0,
        fileList: newList,
      },
      onSuccess: () => {
        const { getData } = this.props;
        typeof getData == "function" &&
          getData.call(this, this.state.pageNumber, this.state.pageSize);
      },
    });
  };
  //渲染难易程度
  renderDifficult = (code) => {
    let level = {
      1: trans("global.easy", "简单"),
      2: trans("global.general", "普通"),
      3: trans("global.difficult", "困难"),
    };
    return level[`${code}`];
  };
  openAnswerDetail = (answerDetail) => {
    this.setState({ answerDetail });
  };
  closeAnswerDetail = () => {
    this.setState({ answerDetail: null });
  };
  //渲染学生答题情况
  renderQuestionAnswer = (text, record, item) => {
    let studentQuestion = record.studentQuestion || [];
    // console.log(studentQuestion, "zwl");
    return (
      studentQuestion.length > 0 &&
      studentQuestion.map((list) => {
        const { answerJson, isCorrect, questionBankId } = list;
        if (item.questionBankId == questionBankId) {
          const question =
            this.props.analysisQuestionCatalog?.findQuestion(questionBankId);
          const answerSummary = question
            ? formatAnalysisAnswerSummary(answerJson, question.content)
            : null;
          const stylesMap = {
            正确: { background: "rgba(103,178,81,0.08)", border: "0 none" },
            错误: { background: "#fff", border: "1px solid rgba(229,73,46,1)" },
            默认: { background: "#fff", border: "0 none" },
            半对: { border: "1px solid #FC8A1E" },
            待批改: { background: "#E5F0FF" },
          };

          const iconMap = {
            正确: (
              <i
                className={`${icon.iconfont} ${styles.rightIcon} ${styles.bottomRight}`}
              >
                &#xe6b2;
              </i>
            ),
            错误: (
              <i
                className={`${icon.iconfont} ${styles.wrongIcon} ${styles.bottomRight}`}
              >
                &#xe6df;
              </i>
            ),
            未作答: "未作答",
            半对: (
              <i
                className={`${icon.iconfont} ${styles.bottomRight}`}
                style={{ color: "#FC8A1E", fontSize: "25px", bottom: "-10px" }}
              >
                &#xe894;
              </i>
            ),
            待批改: (
              <span className={styles.bottomRight}>
                <div className={styles.point}></div>
                <div className={styles.point}></div>
                <div className={styles.point}></div>
              </span>
            ),
          };

          return (
            <span
              key={questionBankId}
              className={styles.renderQuesionCol}
              style={stylesMap[isCorrect] || stylesMap.默认}
            >
              {answerSummary ? (
                answerSummary.canOpenDetail ? (
                  <button
                    className={styles.answerSummaryClickable}
                    onClick={() => this.openAnswerDetail(list)}
                    title={answerSummary.text}
                    type="button"
                  >
                    {answerSummary.text}
                  </button>
                ) : (
                  <em
                    className={styles.answerSummary}
                    title={answerSummary.text}
                  >
                    {answerSummary.text}
                  </em>
                )
              ) : null}
              {iconMap[isCorrect] || null}
            </span>
          );
        }
      })
    );
  };

  uploadOnChange = (text, info) => {
    console.log(info, text, "ii");
    let file = info.file;
    let { fileList } = this.state;
    if (file.status === "uploading") {
      // let index = this.haveId(file.uid, fileList);
      // if (index > -1) {
      //   //数组中包含id
      //   file.fileName = file.name;
      //   fileList[index] = file;
      // } else {
      //   file.fileName = file.name;
      //   fileList.push(file);
      // }
      // this.fileChange(fileList);
      // this.props.holdback(false)
    }
    if (
      file.status === "done" &&
      file.response.status &&
      file.response.ifLogin
    ) {
      //   let newList = [];
      //   newList = file.response.content;
      let newList = JSON.parse(JSON.stringify(this.state.fileList));
      newList.push(file.response.content[0]);
      this.setState(
        {
          fileList: newList,
        },
        () => {
          let fileList = [];
          this.state.fileList.map((item) => {
            fileList.push(item.fileId);
          });
          this.props.dispatch({
            type: "home/upStuFile",
            payload: {
              examPaperId: this.props.examPaperId,
              studentId: text.userId,
              sourceType: 0,
              fileList,
            },
            onSuccess: () => {
              const { getData } = this.props;
              typeof getData == "function" &&
                getData.call(this, this.state.pageNumber, this.state.pageSize);
            },
          });
        },
      );
      return;
    } else if (info.file.status === "error") {
      message.error(`${info.file.name} ${file.response.message}`);
      window._czc &&
        window._czc.push([
          "_trackEvent",
          "上传附件",
          "添加附件",
          info.file.name,
        ]);
    }
  };
  //查看学生答卷
  lookStudentTest = (text) => {
    if (text.isComplete) {
      const { examId } = this.props;
      const resultPath = buildTeacherStudentResultPath(examId, text.userId);
      window.open(`${window.location.origin}/exam#${resultPath}`);
    } else {
      return false;
    }
  };
  saveStu = (text) => {
    console.log(text, "tt");
    this.setState({
      studentId: text.studentId,
    });
  };
  beforeUpload = (maxSize, file) => {
    if (file.size / 1024 / 1024 <= maxSize) {
      return true;
    } else {
      message.info(trans("global.fileLarge", "上传文件过大！"));
      return false;
    }
  };
  render() {
    const { stuData } = this.props;
    const { answerDetail } = this.state;
    let studentQuestionResponses = stuData.studentQuestionResponses || {}; //学生答题情况
    let tableSource = studentQuestionResponses.data
      ? studentQuestionResponses.data
      : [];
    let answersResponses = stuData.answersResponses || []; //试卷题目情况
    let overflowX =
      answersResponses.length > 0 ? answersResponses.length * 100 + 540 : 0;
    const uploadProperties = {
      name: "file",
      action: "/api/upload_file",
      multiple: true,
      accept: "image/*",
      showUploadList: false,
      headers: {
        authorization: "authorization-text",
      },
      beforeUpload: this.beforeUpload.bind(this, 10),
    };
    console.log(this.state.pageSize, "222");
    return (
      <div className={styles.analysisStudent}>
        <Spin spinning={this.props.loadingTable} size="large">
          <Table
            dataSource={tableSource}
            rowKey="userId"
            bordered
            pagination={false}
            scroll={{ x: overflowX }}
            columns={this.state.columns}
          />
          <Modal
            destroyOnClose
            footer={null}
            onCancel={this.closeAnswerDetail}
            title={trans("global.answerDetails", "学生作答")}
            visible={Boolean(answerDetail)}
            width={760}
          >
            {answerDetail && this.props.analysisQuestionCatalog ? (
              <div className={styles.answerDetail}>
                <AnalysisQuestionPreview
                  answerJson={answerDetail.answerJson}
                  catalog={this.props.analysisQuestionCatalog}
                  mode="response"
                  questionId={answerDetail.questionBankId}
                />
              </div>
            ) : null}
          </Modal>
        </Spin>

        <div className={styles.showPage}>
          <Pagination
            total={studentQuestionResponses.total || 0}
            showSizeChanger
            onChange={this.changePageSize}
            onShowSizeChange={this.switchPageSize}
            current={this.state.pageNumber}
            pageSize={this.state.pageSize}
            hideOnSinglePage={true}
            pageSizeOptions={["25", "50"]}
          />
        </div>
      </div>
    );
  }
}

export default AnalysisByStudent;
