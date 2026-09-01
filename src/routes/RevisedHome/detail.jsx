//订正详情
import React, { Fragment, PureComponent } from "react";
import {
  Empty,
  Icon,
  Input,
  message,
  Modal,
  Popover,
  Skeleton,
  Spin,
  Table,
} from "antd";
import { connect } from "dva";
import { routerRedux } from "dva/router";
import pathToRegexp from "path-to-regexp";

import MyButton from "../../components/MyButton";
import {
  adminAgentAudit,
  adminAudit,
  adminReopen,
} from "../../services/correctionProcess";
import { classQuestionAnalysis, updateItem } from "../../services/example";
import { locale, trans } from "../../utils/i18n";

import styles from "./detail.module.less";

const { TextArea } = Input;

const evaluatioTypeMap = {
  1: trans("global.finalExam", "期末考试"),
  2: trans("global.midtermExam", "期中考试"),
  3: trans("global.dailyPractice", "日常练习"),
  4: trans("global.classQuiz", "课堂小测"),
  5: trans("global.monthlyExam", "月考"),
  6: trans("global.unitTest", "单元考试"),
  7: trans("global.mockExam", "模拟考试"),
  8: trans("global.comprehensivePractice", "综合实践"),
  9: trans("global.performanceTask", "表现性任务"),
  10: trans("global.studyHabits", "学习习惯"),
};
@connect(({ revisedRecord, global }) => ({
  correctionProcessInfo: revisedRecord.correctionProcessInfo,
  currentUser: global.currentUser,
}))
class RevisedDetail extends PureComponent {
  constructor(properties) {
    super(properties);
    this.url = this.props.history.location.pathname;
    console.log(`this.url`, this.url);
    this.pathMatch = pathToRegexp(
      "/revisedDetail/:correctionProcessId/:type",
    ).exec(this.url);
    console.log(this.pathMatch, "111");
    this.source = Number.parseInt(this.pathMatch[2], 10);
    // this.queryParams = {}
    // const search = window.location.hash
    // if (search) {
    //   if (search.includes('data=')) {
    //     let str = search.split('data=')[1]
    //     let str1 = aesDecrypt(str, 'lsk')
    //     this.queryParams = JSON.parse(str1)
    //   }
    // }

    this.state = {
      loading: false,
      approvalComments: undefined, //审批意见
      approveModal: false, //审批弹框
      type: "agree", //agree: 同意   refuse: 拒绝
      submitLoading: false, //提交loading
    };
  }

  componentDidMount() {
    this.getDetail();
    this.getCurrentUser();
  }

  getCurrentUser = () => {
    this.props.dispatch({
      type: "global/getCurrentUser",
    });
  };

  //获取审批详情
  getDetail = () => {
    let url =
      this.source === 1
        ? "revisedRecord/getcorrectionProcessInfo"
        : "revisedRecord/getEvaCorrectionDetail";
    const {
      match: { params },
      dispatch,
    } = this.props;
    this.setState({
      loading: true,
    });
    dispatch({
      type: url,
      payload: {
        correctionProcessId:
          params && params.correctionProcessId
            ? params.correctionProcessId
            : null,
      },
    }).then(() => {
      this.setState({
        loading: false,
      });
    });
  };
  renderEvaDetail = (processContent) => {
    let correctionDetail = processContent.correctionDetail || [];

    const columns = [
      {
        title: trans("global.student", "学生"),
        dataIndex: "studentName",
        key: "studentName",
        className: styles.studentNames,
        render: (text, data) => {
          return data.type === 2 ? (
            <span className={styles.noExamStudent}>
              <em className={styles.nameStyle}>{data.studentName}</em>
              <em className={styles.levelName}>
                {trans("global.absent", "缺考")}
              </em>
            </span>
          ) : (
            <span>{data.studentName}</span>
          );
        },
      },
      {
        title: trans("global.oldScore", "原成绩"),
        dataIndex: "studentScore",
        key: "studentScore",
        className: styles.studentNames,
      },
      {
        title: trans("global.revisedNewScore", "学生"),
        dataIndex: "studentNewScore",
        key: "studentNewScore",
        className: styles.studentNames,
      },
      {
        title: trans("global.oldLevel", "学生"),
        dataIndex: "scoreLevel",
        key: "scoreLevel",
        className: styles.studentNames,
      },
      {
        title: trans("global.revisedLevel", "题号"),
        dataIndex: "newScoreLevelName",
        key: "newScoreLevelName",
        className: styles.questionId,
      },
      {
        title: trans("global.revisedReason", "题号"),
        dataIndex: "correctionReason",
        key: "correctionReason",
        className: styles.questionId,
      },
    ];
    return (
      <Table
        dataSource={correctionDetail}
        columns={columns}
        pagination={false}
      />
    );
  };
  getContent = () => {
    const { questionItem } = this.state;
    if (!questionItem) {
      return <Empty />;
    }
    let completion;
    if (questionItem.type == 3) {
      completion = questionItem.gapFillingAnswer?.answers.join(",");
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

  originalQuestionVisChange = (e, questionBankId) => {
    if (e) {
      const { correctionProcessInfo } = this.props;
      this.setState({
        getQuestionStatus: true,
      });
      updateItem({
        examId: correctionProcessInfo?.examId,
        questionId: questionBankId,
      })
        .then((res) => {
          if (res.status) {
            this.setState({
              questionItem: res.content,
            });
          } else {
            message.error(res.message);
          }
        })
        .finally(() => {
          this.setState({
            getQuestionStatus: false,
          });
        });
    } else {
      this.setState({
        questionItem: null,
      });
    }
  };
  answerContent = (row) => {
    const { singleInfoList } = this.state;
    if (singleInfoList && singleInfoList.length > 0) {
      return singleInfoList.map((item, index) => {
        if (
          row.selectStudentIds &&
          row.selectStudentIds.includes(item.studentId)
        ) {
          return (
            <div
              className={`singleQuestion singleQuetionBlue`}
              id={`text${item.studentId}`}
            >
              <div className="singleQuestionHeader">
                <span className="answerOf">
                  {item.studentName} {trans("data.answerOf", "的作答")}
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

  studentAnswer = (e, questionBankId) => {
    if (e) {
      const { correctionProcessInfo } = this.props;
      this.setState({
        getQuestionStatus: true,
      });

      classQuestionAnalysis({
        examId: correctionProcessInfo?.examId,
        questionId: questionBankId,
      })
        .then((res) => {
          if (res.status) {
            this.setState({
              singleInfoList: res.content.singleItemAndStudentInfoList,
            });
          } else {
            message.error(res.message);
          }
        })
        .finally(() => {
          this.setState({
            getQuestionStatus: false,
          });
        });
    }
  };

  //订正明细
  renderDetail = (processContent) => {
    let correctionDetail = processContent.correctionDetail || [];
    let columns = [];

    let originalQuestionColumn = {
      title: trans("global.Originalquestion", "原题"),
      render: (text, record) => (
        <Popover
          content={this.state.getQuestionStatus ? <Spin /> : this.getContent()}
          onVisibleChange={(e) => {
            this.originalQuestionVisChange(e, record.questionBankId);
          }}
          trigger="click"
        >
          <span style={{ color: "#0445FC" }}>
            {trans("global.preview", "预览")}
          </span>
        </Popover>
      ),
    };

    let studentAnswerColumn = {
      title: trans("global.studentAnswers", "学生答案"),
      className: styles.questionId,
      render: (text, record) => (
        <Popover
          placement="top"
          content={
            this.state.getQuestionStatus ? (
              <Spin />
            ) : (
              <div
                style={{ width: "500px", maxHeight: "100vh", overflow: "auto" }}
              >
                {this.answerContent(record)}
              </div>
            )
          }
          onVisibleChange={(e) => {
            this.studentAnswer(e, record.questionBankId);
          }}
          trigger="click"
        >
          <span style={{ color: "#0445FC" }}>
            {trans("global.preview", "预览")}
          </span>
        </Popover>
      ),
    };
    columns =
      processContent.processType && processContent.processType == 2
        ? [
            {
              title: trans("analysis.questionIndex", "题号"),
              dataIndex: "questionId",
              key: "questionId",
              className: styles.questionId,
            },
            originalQuestionColumn,
            {
              title: trans("gobal.questionScore", "分值"),
              dataIndex: "questionScore",
              key: "questionScore",
              className: styles.questionId,
            },
            {
              title: trans("global.student", "学生"),
              dataIndex: "studentNames",
              key: "studentNames",
              className: styles.studentNames,
            },
            studentAnswerColumn,
            {
              title: trans("global.newScore", "新得分"),
              dataIndex: "newScore",
              key: "newScore",
            },
          ]
        : [
            {
              title: trans("analysis.questionIndex", "题号"),
              dataIndex: "questionId",
              key: "questionId",
              className: styles.questionId,
            },
            originalQuestionColumn,
            {
              title: trans("global.oldAnswer", "原答案"),
              dataIndex: "answer",
              key: "answer",
            },
            {
              title: trans("global.newAnswer", "新答案"),
              dataIndex: "newAnswer",
              key: "newAnswer",
            },
          ];

    return (
      <Table
        dataSource={correctionDetail}
        columns={columns}
        pagination={false}
      />
    );
  };

  //获取当前类名
  getClassName = (info, name, type) => {
    let currentClassName = "";
    if (type && type === 1) {
      currentClassName = info.processStatusType
        ? info.processStatusType == 1
          ? styles.delaybg
          : info.processStatusType == 2
            ? styles.completedbg
            : styles.refusebg
        : null;
    } else {
      currentClassName = info.processStatusType
        ? info.processStatusType == 1
          ? styles.delay
          : info.processStatusType == 2
            ? styles.completed
            : styles.refuse
        : null;
    }
    return `${name} ${currentClassName}`;
  };

  //获取进度状态
  getCurrentStatus = (list, index) => {
    if (index === list.length - 1) {
      return false;
    } else {
      let nextItem = list[index + 1];
      return this.getClassName(nextItem, styles.line, 1);
    }
  };

  //展示审批进度
  showProgressContent = (processAudit) => {
    return (
      <div className={styles.progressContent}>
        {processAudit &&
          processAudit.length > 0 &&
          processAudit.map((item, index) => (
            <div className={styles.progressItem}>
              <div className={styles.progressStatus}>
                <span
                  className={this.getClassName(item, styles.round, 1)}
                ></span>
                <span
                  className={this.getCurrentStatus(processAudit, index)}
                ></span>
              </div>
              <div className={styles.itemLeft}>
                <img src={item.avatarUrl} alt="" />
              </div>
              <div className={styles.itemRight}>
                <div className={styles.userName}>
                  {item.userName}
                  {item.adminUserName ? (
                    <> &nbsp; -&gt; {item.adminUserName}</>
                  ) : null}
                  <span>{item.dealTime}</span>
                </div>
                <div className={this.getClassName(item, styles.desc, 2)}>
                  {item.dealStatus}
                  <span style={{ color: "rgba(1, 17, 61, 0.65)" }}>
                    {/* {item.processStatusType == 3 ? `（${item.remark}）` : null} */}
                    {item.remark ? `（${item.remark}）` : null}
                  </span>
                </div>
              </div>
            </div>
          ))}
      </div>
    );
  };

  //关闭弹窗
  deleteHandleCancel = () => {
    this.setState({
      approveModal: false,
      approvalComments: undefined,
    });
  };

  //确定审批
  agreeApprove = () => {
    const { type, approvalComments } = this.state;
    // 1是从订正管理过来   否则是从评价过来
    let url =
      this.source === 1
        ? "revisedRecord/toApprove"
        : "revisedRecord/toApproveNew";
    const {
      dispatch,
      match: { params },
    } = this.props;
    const { reviewAllScoreCorrectionPower } = this.props.currentUser || {};
    this.setState({
      submitLoading: true,
    });

    // 页面来源于订正管理的逻辑
    if (this.source == 1) {
      // 是管理员
      if (reviewAllScoreCorrectionPower) {
        const { processAudit, processInfo, showOperation } =
          this.props.correctionProcessInfo || {};

        // 当前登陆账号为当前要审核节点
        if (showOperation) {
          // flag：布尔值 如果当前流程包含已结束状态，并且在进行中，则证明流程已经被重启过，则进行管理员审批接口的调用
          let flag = false;

          if (processAudit?.length > 0) {
            processAudit.map((item, index) => {
              if (
                item.type == 4 &&
                processInfo?.processStatusDescribe == "进行中"
              ) {
                flag = true;
              }
            });
          }
          // 当前登陆账号为管理员，且流程已经被重启过，则下一个审核节点为完成重启操作的管理员
          if (flag) {
            // 管理员审批
            adminAudit({
              correctionProcessId:
                params && params.correctionProcessId
                  ? params.correctionProcessId
                  : null,
              auditType: type && type === "agree" ? 1 : 2,
              remark: approvalComments,
            }).then((res) => {
              if (res.status) {
                this.deleteHandleCancel();
                this.getDetail();
              } else {
                message.error(res.message);
              }
            });
          } else {
            // 正常审批
            dispatch({
              type: url,
              payload: {
                correctionProcessId:
                  params && params.correctionProcessId
                    ? params.correctionProcessId
                    : null,
                auditType: type && type === "agree" ? 1 : 2,
                remark: approvalComments,
              },
              onSuccess: () => {
                message.success(trans("global.operateSuccess", "操作成功"));
                this.deleteHandleCancel();
                this.getDetail();
              },
            }).then(() => {
              this.setState({
                submitLoading: false,
              });
            });
          }
        } else {
          // 管理员代审核
          adminAgentAudit({
            correctionProcessId:
              params && params.correctionProcessId
                ? params.correctionProcessId
                : null,
            auditType: type && type === "agree" ? 1 : 2,
            remark: approvalComments,
          }).then((res) => {
            this.setState({
              submitLoading: false,
            });
            if (res.status) {
              this.deleteHandleCancel();
              this.getDetail();
            } else {
              message.error(res.message);
            }
          });
        }
      } else {
        dispatch({
          type: url,
          payload: {
            correctionProcessId:
              params && params.correctionProcessId
                ? params.correctionProcessId
                : null,
            auditType: type && type === "agree" ? 1 : 2,
            remark: approvalComments,
          },
          onSuccess: () => {
            message.success(trans("global.operateSuccess", "操作成功"));
            this.deleteHandleCancel();
            this.getDetail();
          },
        }).then(() => {
          this.setState({
            submitLoading: false,
          });
        });
      }
    } else {
      // 页面来源于评价的逻辑
      dispatch({
        type: url,
        payload: {
          correctionProcessId:
            params && params.correctionProcessId
              ? params.correctionProcessId
              : null,
          auditType: type && type === "agree" ? 1 : 2,
          remark: approvalComments,
        },
        onSuccess: () => {
          message.success(trans("global.operateSuccess", "操作成功"));
          this.deleteHandleCancel();
          this.getDetail();
        },
      }).then(() => {
        this.setState({
          submitLoading: false,
        });
      });
    }
  };

  //审批意见
  changeApprovalComments = (e) => {
    this.setState({
      approvalComments: e.target.value,
    });
  };

  //打开审批
  openApprove = (type) => {
    this.setState({
      type,
      approveModal: true,
      approvalComments:
        type === "agree"
          ? trans("global.agree", "同意")
          : trans("global.refuse", "拒绝"),
    });
  };

  back = () => {
    this.props.dispatch({
      type: "revisedRecord/clearData",
      payload: {},
    });
    this.props.dispatch(routerRedux.push("/revisedPage/1/false"));
  };

  agentAudit = () => {};

  startProcess = () => {
    this.setState({
      submitLoading: true,
    });
    const {
      dispatch,
      match: { params },
    } = this.props;
    adminReopen({
      correctionProcessId:
        params && params.correctionProcessId
          ? params.correctionProcessId
          : null,
    }).then((res) => {
      this.setState({
        submitLoading: false,
      });
      if (res.status) {
        message.success(trans("global.operateSuccess", "操作成功"));
        this.getDetail();
      } else {
        message.error(res.message);
      }
    });
  };

  render() {
    const { correctionProcessInfo } = this.props;
    let processInfo =
      (correctionProcessInfo && correctionProcessInfo.processInfo) || {};
    let processContent =
      (correctionProcessInfo && correctionProcessInfo.processContent) || {};
    let processAudit =
      (correctionProcessInfo && correctionProcessInfo.processAudit) || {};
    console.log(this.source);
    // 是否是管理员身份
    const { reviewAllScoreCorrectionPower } = this.props.currentUser || {};
    return (
      <div>
        <Skeleton active loading={this.state.loading}>
          <div className={styles.revsedDetailBox}>
            <div className={styles.header}>
              <div className={styles.headerLeft}>
                <i
                  className={[styles.iconfont, styles.closeIcon].join(" ")}
                  onClick={this.back}
                >
                  &#xe76d;
                </i>
                {this.source === 1
                  ? processInfo.examName
                  : processInfo.scoreCorrectionName}
                {processInfo.createUserName ? (
                  <span>
                    {trans("global.addPerson", "创建人")}：
                    {processInfo.createUserName}
                  </span>
                ) : null}
              </div>
              <span className={styles.headerRight}>
                {processInfo.processStatusDescribe}
              </span>

              {
                //是管理员身份，有重新打开流程权限
                correctionProcessInfo?.adminReopenOperation &&
                reviewAllScoreCorrectionPower &&
                this.source == 1 ? (
                  <div
                    style={{ marginLeft: "auto", paddingRight: "10px" }}
                    onClick={() => {
                      this.startProcess();
                    }}
                  >
                    <MyButton
                      typeclass="confirmBtn"
                      loading={this.state.submitLoading}
                    >
                      {trans("revisedHome.reopenProcess", "重新打开流程")}
                    </MyButton>
                  </div>
                ) : null
              }
            </div>

            {this.source == "question" ? (
              <div className={styles.content}>
                <div className={styles.approvalContent}>
                  <div className={styles.approvalItem}>
                    <span className={styles.approvalTitle}>
                      {trans("revise.applicationContent", "申请内容")}
                    </span>
                  </div>
                  <div className={styles.approvalItem}>
                    <span className={styles.approvalTitle}>
                      {trans("revise.paper", "订正试卷：")}
                    </span>
                    <span className={styles.approvalDetail}>
                      {processContent.examName}
                    </span>
                  </div>
                  <div className={styles.approvalItem}>
                    <span className={styles.approvalTitle}>
                      {trans("revise.classification", "订正分类：")}
                    </span>
                    <span className={styles.approvalDetail}>
                      {processContent.processType == 1
                        ? trans("revise.correctedAnswer", "订正答案")
                        : trans("revise.revisedScore", "订正成绩")}
                    </span>
                  </div>
                  <div className={styles.approvalItem}>
                    <span className={styles.approvalTitle}>
                      {trans("revise.detail", "订正明细：")}
                    </span>
                    <div className={styles.detailBox}>
                      {this.source === 2
                        ? this.renderEvaDetail(processContent)
                        : this.renderDetail(processContent)}
                    </div>
                  </div>
                  <div className={styles.approvalItem}>
                    <span className={styles.approvalTitle}>
                      {trans("revise.remark", "备注：")}
                    </span>
                    <span className={styles.approvalDetail}>
                      {processContent.remark
                        ? processContent.remark
                        : trans("global.without", "无")}
                    </span>
                  </div>
                </div>
                <div className={styles.progressBox}>
                  <div className={styles.progressTitle}>
                    {trans("revise.approvalProgress", "审批进度")}
                  </div>
                  {this.showProgressContent(processAudit)}
                </div>

                {this.source == 1 ? (
                  <>
                    {
                      // 流程进行中
                      processInfo.processStatusType == 1 ? (
                        // 是管理员
                        reviewAllScoreCorrectionPower ? (
                          <div className={styles.btnBox}>
                            <span
                              className={styles.refuseBtn}
                              onClick={() => this.openApprove("refuse")}
                            >
                              {correctionProcessInfo.showOperation
                                ? trans("global.refuse", "拒绝")
                                : trans(
                                    "revisedHome.delegateReject",
                                    "代TA拒绝",
                                  )}
                            </span>
                            <span
                              className={styles.agreeBtn}
                              onClick={() => this.openApprove("agree")}
                            >
                              {correctionProcessInfo.showOperation
                                ? trans("global.agree", "同意")
                                : trans(
                                    "revisedHome.delegateAgree",
                                    "代TA同意",
                                  )}
                            </span>
                          </div>
                        ) : correctionProcessInfo.showOperation ? (
                          <div className={styles.btnBox}>
                            <span
                              className={styles.refuseBtn}
                              onClick={() => this.openApprove("refuse")}
                            >
                              {trans("global.refuse", "拒绝")}
                            </span>
                            <span
                              className={styles.agreeBtn}
                              onClick={() => this.openApprove("agree")}
                            >
                              {trans("global.agree", "同意")}
                            </span>
                          </div>
                        ) : null
                      ) : null
                    }
                  </>
                ) : (
                  <>
                    {correctionProcessInfo.showOperation ? (
                      <div className={styles.btnBox}>
                        <span
                          className={styles.refuseBtn}
                          onClick={() => this.openApprove("refuse")}
                        >
                          {trans("global.refuse", "拒绝")}
                        </span>
                        <span
                          className={styles.agreeBtn}
                          onClick={() => this.openApprove("agree")}
                        >
                          {trans("global.agree", "同意")}
                        </span>
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            ) : (
              <div className={styles.content}>
                <div className={styles.approvalContent}>
                  <div className={styles.approvalItem}>
                    <span className={styles.approvalTitle}>
                      {trans("revise.applicationContent", "申请内容")}
                    </span>
                  </div>
                  <div className={styles.approvalItem}>
                    <span className={styles.approvalTitle}>
                      {trans("global.sources", "来源")}：
                    </span>
                    <span className={styles.approvalDetail}>
                      {this.source == 1
                        ? trans("global.fromQuiz", "来自测验")
                        : trans("global.fromAssessment", "来自评价")}
                    </span>
                  </div>
                  {this.source === 2 ? (
                    <div className={styles.approvalItem}>
                      <span className={styles.approvalTitle}>
                        {trans("revise.course", "课程：")}
                      </span>
                      <span className={styles.approvalDetail}>
                        {processContent.courseName}
                      </span>
                    </div>
                  ) : (
                    <div className={styles.approvalItem}>
                      <span className={styles.approvalTitle}>
                        {trans("revise.paper", "订正分类")}
                      </span>
                      <span className={styles.approvalDetail}>
                        {processContent.examName}
                      </span>
                    </div>
                  )}
                  {this.source === 2 ? (
                    <div className={styles.approvalItem}>
                      <span className={styles.approvalTitle}>
                        {trans("revised.semester", "学期")}：
                      </span>
                      <span className={styles.approvalDetail}>
                        {processContent.processType == 1
                          ? trans("revise.correctedAnswer", "订正答案")
                          : trans("revise.revisedScore", "订正成绩")}
                      </span>
                    </div>
                  ) : null}
                  <div className={styles.approvalItem}>
                    <span className={styles.approvalTitle}>
                      {trans("revise.classification", "订正分类：")}
                    </span>
                    <span className={styles.approvalDetail}>
                      {this.source === 2
                        ? evaluatioTypeMap[
                            correctionProcessInfo.evaluationItemType
                          ]
                        : processContent.processType == 1
                          ? trans("revise.correctedAnswer", "订正答案")
                          : trans("revise.revisedScore", "订正成绩")}
                    </span>
                  </div>
                  <div className={styles.approvalItem}>
                    <span className={styles.approvalTitle}>
                      {trans("revise.detail", "订正明细：")}
                    </span>
                    <div className={styles.detailBox}>
                      {this.source === 2
                        ? this.renderEvaDetail(processContent)
                        : this.renderDetail(processContent)}
                    </div>
                  </div>
                </div>
                <div className={styles.progressBox}>
                  <div className={styles.progressTitle}>
                    {trans("revise.approvalProgress", "审批进度")}
                  </div>
                  {this.showProgressContent(processAudit)}
                </div>

                {
                  // 页面来源于订正管理
                  this.source == 1 ? (
                    <>
                      {
                        // 流程进行中
                        processInfo.processStatusType == 1 ? (
                          // 是管理员
                          reviewAllScoreCorrectionPower ? (
                            <div className={styles.btnBox}>
                              <span
                                className={styles.refuseBtn}
                                onClick={() => this.openApprove("refuse")}
                              >
                                {correctionProcessInfo.showOperation
                                  ? trans("global.refuse", "拒绝")
                                  : trans(
                                      "revisedHome.delegateReject",
                                      "代TA拒绝",
                                    )}
                              </span>
                              <span
                                className={styles.agreeBtn}
                                onClick={() => this.openApprove("agree")}
                              >
                                {correctionProcessInfo.showOperation
                                  ? trans("global.agree", "同意")
                                  : trans(
                                      "revisedHome.delegateAgree",
                                      "代TA同意",
                                    )}
                              </span>
                            </div>
                          ) : correctionProcessInfo.showOperation ? (
                            <div className={styles.btnBox}>
                              <span
                                className={styles.refuseBtn}
                                onClick={() => this.openApprove("refuse")}
                              >
                                {trans("global.refuse", "拒绝")}
                              </span>
                              <span
                                className={styles.agreeBtn}
                                onClick={() => this.openApprove("agree")}
                              >
                                {trans("global.agree", "同意")}
                              </span>
                            </div>
                          ) : null
                        ) : null
                      }
                    </>
                  ) : (
                    <>
                      {
                        // 页面来源与评价
                        correctionProcessInfo.showOperation ? (
                          <div className={styles.btnBox}>
                            <span
                              className={styles.refuseBtn}
                              onClick={() => this.openApprove("refuse")}
                            >
                              {trans("global.refuse", "拒绝")}
                            </span>
                            <span
                              className={styles.agreeBtn}
                              onClick={() => this.openApprove("agree")}
                            >
                              {trans("global.agree", "同意")}
                            </span>
                          </div>
                        ) : null
                      }
                    </>
                  )
                }
              </div>
            )}
          </div>
        </Skeleton>
        <Modal
          visible={this.state.approveModal}
          footer={null}
          className={styles.approveModal}
          width="428px"
          closable={false}
          centered={true}
          onCancel={this.deleteHandleCancel.bind(this)}
        >
          <i
            className={[
              styles.iconfont,
              styles.closeIcon,
              styles.closeBtn,
            ].join(" ")}
            onClick={this.deleteHandleCancel.bind(this)}
          >
            &#xe6e2;
          </i>
          <div className={styles.modalTitle}>
            {trans("revise.approvalComments", "审批意见")}
          </div>
          <div className={styles.modalContent}>
            <TextArea
              value={this.state.approvalComments}
              onChange={this.changeApprovalComments}
            />
          </div>
          <div className={styles.operBtn}>
            <span
              className={`${styles.modalBtn} ${styles.cancelBtn}`}
              onClick={this.deleteHandleCancel.bind(this)}
            >
              {trans("global.cancle", "取消")}
            </span>
            {this.state.submitLoading ? (
              <span className={`${styles.modalBtn} ${styles.confirmBtn}`}>
                <Icon type="loading" />{" "}
                {trans("global.submitting", "提交中...")}
              </span>
            ) : (
              <span
                className={`${styles.modalBtn} ${styles.confirmBtn}`}
                onClick={this.agreeApprove.bind(this)}
              >
                {trans("global.sure", "确定")}
              </span>
            )}
          </div>
        </Modal>
      </div>
    );
  }
}

export default RevisedDetail;
