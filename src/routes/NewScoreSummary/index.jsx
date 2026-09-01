//新闻
import React, { Fragment, PureComponent } from "react";
import {
  Icon,
  Input,
  message,
  Pagination,
  Popconfirm,
  Popover,
  Select,
  Spin,
  Tooltip,
} from "antd";
import { connect } from "dva";

import {
  summaryClassStudentOne,
  summaryDelete,
  summaryGetStudentList,
  summaryList,
  summarySendMessage,
} from "../../services/exam";
import { locale, trans } from "../../utils/i18n";

import styles from "./index.module.less";
const language = locale() == "en" ? false : true;
import noTask from "../../assets/noTask.png";
import ComnModal from "../../components/ComnModal";
import MyButton from "../../components/MyButton";
import Loding from "../../components/PupllAnalyse//components/Loding";
import MyTable from "../../components/PupllAnalyse/components/MyTable";
import SuperSelector from "../../components/PupllAnalyse/components/SuperSelector";
import StepProgressBar from "../../components/StepProgressBar";
import {
  messageLog,
  reRevokeMessage,
  resendMessage,
} from "../../services/example";
import { readingStatistics } from "../../services/global";
import { aesEncrypt } from "../../utils/utils";
import LearningAnalysis from "./components/LearningAnalysis";
import LeftContent from "./components/LeftContent";

const { Option } = Select;
const { Search } = Input;
let timerid1 = null;

class ScoreSummary extends PureComponent {
  constructor(properties) {
    super(properties);

    this.state = {
      gradeId: 0,
      courseId: undefined,
      reportType: 0,
      keyword: undefined,
      defaultSemester: {},
      tableList: undefined,
      loading: true,
      readDetail: {},
      filteredInfo: {},
      tabIndex: 1,
      modelListLoding: [false, false, false],
      SsSLodaing: true,
    };
  }
  componentDidMount() {
    this.getPermission("exam:scoreSummary:sendParent");

    // 获取学期
    this.props
      .dispatch({
        type: "home/getOptions",
        payload: {
          gradeJudge: true,
        },
      })
      .then(() => {
        const { examOptions } = this.props;
        let ind = 0;
        if (
          examOptions &&
          examOptions.length > 0 &&
          examOptions.findIndex((item) => item.current) > 0
        ) {
          ind = examOptions.findIndex((item) => item.current);
        }
        this.setState(
          {
            defaultSemester:
              examOptions && examOptions.length > 0 ? examOptions[ind] : {},
            semesterId:
              examOptions && examOptions.length > 0
                ? examOptions[ind].semesterId
                : 0,
          },
          () => {
            this.getPage();
          },
        );
      });
  }

  getPermission = (key) => {
    this.props.dispatch({
      type: "global/checkPermission",
      payload: {
        permissionCode: key,
      },
      onSuccess: (res) => {
        this.setState({
          [key]: res,
        });
      },
    });
  };

  changeType = (value) => {
    this.setState(
      {
        reportType: value,
      },
      () => {
        this.page = 1;
        this.getPage();
      },
    );
  };

  changeStage = (value) => {
    const { examOptions } = this.props;
    let newSemester = {};
    if (examOptions && examOptions.length > 0) {
      examOptions?.map((item) => {
        if (item.semesterId === value) {
          newSemester = item;
        }
      });
    }
    this.setState(
      {
        semesterId: value,
        defaultSemester: newSemester,
      },
      () => {
        this.page = 1;
        this.getPage();
      },
    );
  };

  changeSearch = (e) => {
    this.setState({
      keyword: e.target.value,
    });
  };

  getPage = () => {
    this.setState({
      loading: true,
    });
    summaryList({
      pageNo: this.state.pageNo,
      limit: this.state.pageSize,
      semesterId: this.state.semesterId ? this.state.semesterId : "",
      gradeId: this.state.gradeId ? this.state.gradeId : "",
      reportType: this.state.reportType ? this.state.reportType : "",
      keyword: this.state.keyword,
    })
      .then((res) => {
        if (res.status) {
          this.setState({
            tableList: res.content,
          });
        } else {
          message.error(res.message);
        }
      })
      .finally(() => {
        this.setState({
          loading: false,
        });
      });
  };

  createStudentGradeSummary = (origin, record) => {
    if (origin == "add") {
      window.open(`${window.location.origin}/exam#/newScoreSummary/add`);
    } else if (origin == "edit") {
      const { id, applyGrades, reportType, semesterId } = record;
      if (id) {
        window.open(
          `${window.location.origin}/exam#/newScoreSummary/add/${id}`,
        );
      } else {
        // 系统生成的报告
        window.open(
          `${window.location.origin}/exam#/newScoreSummary/add/${null}/${applyGrades[0]}/${reportType}/${semesterId}`,
        );
      }
    }
  };

  onSummaryAnalysisButtonClick = (record) => {
    this.openAnalysisSummary(record, "classAnalysis");
  };

  openAnalysisSummary = (record, tabsKey = "classAnalysis") => {
    const { id, applyGrades, reportType, semesterId } = record;
    let date = {};
    date = id
      ? {
          id: id,
        }
      : {
          id: undefined,
          gradeId: applyGrades[0],
          reportType: reportType,
          semesterId: semesterId,
        };
    // id: Number 或 'null'  汇总报告id id为null页面规则为为系统生成的汇总分析
    // gradeId: Number 年级id
    // reportType: Number 类型
    // semesterId: Number 学期id
    // window.open(`${window.location.origin}/exam#/newScoreSummary/analysisTable/0?date=${aesEncrypt(JSON.stringify(date), 'lsk')}`)
    const encryptedDate = aesEncrypt(JSON.stringify(date), "lsk");
    const url = `${window.location.origin}/exam#/newScoreSummary/analysisSummary/${tabsKey}?date=${encodeURIComponent(
      encryptedDate,
    )}`;
    const userAgent = String(window.navigator.userAgent || "").toLowerCase();
    const preferSameTab =
      window.innerWidth <= 1024 ||
      userAgent.includes("codex") ||
      userAgent.includes("electron");
    if (preferSameTab) {
      window.location.href = url;
      return;
    }
    window.open(url);
  };

  getSubjectNames = (item) => {
    let array = [];
    item.summaryDetail?.map((element) => {
      element.examDetails?.map((ele) => {
        if (ele.examDetailList && ele.examDetailList.length > 0) {
          array.push(ele.subjectName);
        }
      });
    });
    return array;
  };

  changeGrade = (value) => {
    this.setState(
      {
        gradeId: value,
      },
      () => {
        this.page = 1;
        this.getPage();
      },
    );
  };

  onSearch = (value) => {
    this.page = 1;
    this.getPage();
  };

  delet = (item) => {
    summaryDelete({
      id: item.id,
    }).then((res) => {
      if (res.status) {
        this.getPage();
        message.success(trans("scoreSummary.operationSuccess", "操作成功"));
      } else {
        message.error(res.message);
      }
    });
  };

  handleChange = (pagination, filters, sorter) => {
    console.log("Various parameters", filters);
    this.setState({
      filteredInfo: filters,
    });
  };

  // 下载此报告
  sending = (key, item) => {
    this.setState(
      {
        visible: true,
        currentTab: trans("global.NotSent", "未发送"),
        sendType: key,
        summaryReportId: item.id,
      },
      () => {
        // 获取当前报告的班级以及学生数据
        summaryGetStudentList({
          summaryReportId: item.id,
        }).then((res) => {
          if (res) {
            this.setState({
              classListData: res.content,
            });
            if (res.content && res.content.length > 0) {
              this.changeClass1(res.content[0].groupId);
            }
          }
        });
      },
    );
  };

  cancelChange = () => {
    if (this.state.tabIndex == 1) {
      this.setState({
        visible: false,
        tabIndex: 1,
      });
    } else if (this.state.tabIndex == 2) {
      this.changeTab(1);
    }
  };

  resetSendingModalStatus = () => {
    this.setState({
      visible: false,
      emptyVisble: true,
      tabIndex: 1,
      btnLoading: false,
      classListData: [],
      studentUserId1: "",
      subjectsScoreTabData: {},
    });
  };

  confirmChange = () => {
    const { selectedStuKeys } = this.state;
    if (this.state.tabIndex == 1) {
      this.changeTab(2);
    } else if (this.state.tabIndex == 2) {
      if (selectedStuKeys.length === 0) {
        return message.error(trans("pupllAnalyse.selectStudent", "请选择学生"));
      }
      this.setState({ btnLoading: true });

      if (this.state.currentTab == trans("global.NotSent", "未发送")) {
        let groupWithStudentDTOList = [];
        const { classListData } = this.state;
        for (const id of selectedStuKeys) {
          outerLoop: for (const element of classListData) {
            if (element.studentInfoResponseList) {
              for (
                let index = 0;
                index < element.studentInfoResponseList.length;
                index++
              ) {
                const studentInfo = element.studentInfoResponseList[index];
                if (studentInfo.studentId == id) {
                  let k = groupWithStudentDTOList.findIndex(
                    (item) => item.groupId == element.groupId,
                  );
                  if (k == -1) {
                    groupWithStudentDTOList.push({
                      groupId: element.groupId,
                      studentIdList: [studentInfo.studentId],
                    });
                  } else {
                    groupWithStudentDTOList[k].studentIdList.push(
                      studentInfo.studentId,
                    );
                  }
                  break outerLoop;
                }
              }
            }
          }
        }
        // 发送消息
        summarySendMessage({
          summaryReportId: this.state.summaryReportId,
          groupWithStudentDTOList: groupWithStudentDTOList,
        }).then((res) => {
          this.resetSendingModalStatus();
        });
      }
      // else if (this.state.currentTab == '发送成功') {
      //   // 撤回已经发送的消息
      //   reRevokeMessage({
      //     examId: this.props.examId,
      //     studentIdList: this.state.selectedStuKeys.join(','),
      //   }).then(res => {
      //     resetSendingModalStatus()
      //   })
      // } else if (this.state.currentTab == '发送失败') {
      //   // 重发失败消息
      //   resendMessage({
      //     examId: this.props.examId,
      //     studentIdList: this.state.selectedStuKeys.join(','),
      //   }).then(res => {
      //     resetSendingModalStatus()
      //   })
      // }
    }
  };

  // 家长阅读情况
  readMsgClick = (type) => {
    this.setState({
      readMsgLoading: true,
      currentTab: type,
      readMsgVisble: true,
      activeReadId: "",
    });
    readingStatistics({
      examId: this.props.examId,
      type: type == "家长阅读情况" ? 1 : 0,
    }).then((res) => {
      this.setState({
        readMsgLoading: false,
      });
      if (res.status) {
        this.setState({
          readStatistics: res.content,
        });
      } else {
        message.error(res.message);
      }
    });
  };

  // 查看发送日志
  showLog = () => {
    this.setState({
      showLogLoading: true,
    });
    messageLog({
      examId: this.props.examId,
    }).then((res) => {
      this.setState({
        showLogLoading: false,
      });
      if (res.status) {
        this.setState({
          messageLogData: res.content,
        });
      } else {
        message.error(res.message);
      }
    });
    this.setState({
      emptyVisble: false,
      logVisible: true,
    });
  };

  // 重发
  resendMessageFun = (record) => {
    resendMessage({
      examId: this.props.examId,
      planId: record.planId,
    }).then((res) => {
      this.showLog();
    });
  };

  // 撤回
  reRevokeMessageFun = (record) => {
    reRevokeMessage({
      examId: this.props.examId,
      planId: record.planId,
    }).then((res) => {
      this.showLog();
    });
  };

  // 确认要撤回全部的学情报告
  revokeFun = () => {
    reRevokeMessage({
      examId: this.props.examId,
    }).then((res) => {
      this.showLog();
    });
  };

  // 确认要重发所有失败的学情报告
  resendFun = () => {
    resendMessage({
      examId: this.props.examId,
    }).then((res) => {
      this.showLog();
    });
  };

  // 关闭发送日志弹窗
  cancelPreviewLog = () => {
    if (timerid1) {
      clearInterval(timerid1);
    }
    this.setState({
      logVisible: false,
    });
  };

  openReadDetail = (record, index) => {
    this.setState({
      readMagDetailVis: true,
      activeReadId: index,
      readDetail: record,
    });
  };

  getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
    }) => (
      <div style={{ padding: 8 }}>
        <Input
          ref={(node) => {
            this.searchInput = node;
          }}
          placeholder={trans("global.searchStu", "搜索学生")}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() =>
            this.handleSearch(selectedKeys, confirm, dataIndex)
          }
          style={{ width: 188, marginBottom: 8, display: "block" }}
        />
        <MyButton
          style={{ marginRight: "10px" }}
          sizeclass="smallBtn"
          typeclass="confirmBtn"
          onClick={() => this.handleSearch(selectedKeys, confirm, dataIndex)}
        >
          {trans("global.query", "查询")}
        </MyButton>
        <MyButton
          sizeclass="smallBtn"
          typeclass="cancelBtn"
          onClick={() => this.handleReset(clearFilters)}
        >
          {trans("global.reset", "重置")}
        </MyButton>
      </div>
    ),
    filterIcon: (filtered) => (
      <Icon type="search" style={{ color: filtered ? "#1890ff" : undefined }} />
    ),
    onFilter: (value, record) => {
      console.log(value, record);
      return record[dataIndex]
        ?.toString()
        ?.toLowerCase()
        .includes(value.toLowerCase());
    },
    onFilterDropdownVisibleChange: (visible) => {
      if (visible) {
        setTimeout(() => this.searchInput.select());
      }
    },
    render: (text) => text,
  });

  getColumns = () => {
    return [
      {
        title: trans("global.order", "序号"),
        dataIndex: "order",
        key: "order",
        render: (text, record, index) => index + 1,
        ellipsis: true,
        width: 50,
      },
      {
        title: trans("scoreSummary.sendTime", "发送时间"),
        dataIndex: "sendTime",
        key: "sendTime",
        align: "left",
        width: 170,
      },
      {
        title: trans("scoreSummary.sender", "发送人"),
        dataIndex: "sendUserName",
        key: "sender",
        align: "left",
        width: 100,
      },
      {
        title: trans("scoreSummary.recipient", "发送对象"),
        dataIndex: "sendTo",
        key: "sendTo",
        width: 180,
        align: "left",
        render: (text, record) => {
          return (
            <>
              <span style={{ textDecoration: "underline", cursor: "pointer" }}>
                <Popover
                  content={<div>{record.sendGroupNames?.join(",")}</div>}
                  trigger="click"
                >
                  {trans("scoreSummary.sendClassCount", "{$count}个班级", {
                    count: record.sendGroupCount,
                  })}
                </Popover>
              </span>
              {trans(
                "scoreSummary.sendPeopleSummary",
                "｜{$count}个｜{$recipient}",
                {
                  count: record.sendPeopleCount,
                  recipient:
                    record.sendType == 0
                      ? trans("global.student", "学生")
                      : trans("global.parent", "家长"),
                },
              )}
            </>
          );
        },
      },
      {
        title: trans("scoreSummary.channel", "途径"),
        dataIndex: "sendType",
        key: "sendType",
        align: "left",
        width: 70,
        render: (text, record) => {
          return text == 0
            ? trans("scoreSummary.internalMessage", "站内信")
            : trans("scoreSummary.dingTalk", "钉钉");
        },
      },
      {
        title: trans("global.status", "状态"),
        dataIndex: "sendStatus",
        key: "sendStatus",
        width: 80,
        align: "left",
        render: (text, record) => {
          if (text == 0) {
            return trans("scoreSummary.waitingSend", "待发送");
          } else if (text == 1) {
            return (
              <div style={{ display: "flex" }}>
                <Loding />
                &nbsp;{trans("scoreSummary.sending", "发送中")}
              </div>
            );
          } else if (text == 2) {
            return trans("scoreSummary.sentComplete", "发送完毕");
          } else if (text == 3) {
            return (
              <div style={{ display: "flex" }}>
                <Loding />
                &nbsp;{trans("scoreSummary.revoking", "撤回中")}
              </div>
            );
          } else {
            return trans("scoreSummary.revokeComplete", "撤回完毕");
          }
        },
      },
      {
        title: trans("scoreSummary.messageReturn", "消息返回"),
        dataIndex: "messageReturn",
        key: "messageReturn",
        align: "left",
        width: 350,
        render: (text, record, index) => {
          return (
            <div style={{ display: "flex" }}>
              {
                <div
                  style={{
                    textWrap: "nowrap",
                    whiteSpace: "pre",
                    marginRight: "16px",
                  }}
                >
                  {trans(
                    "scoreSummary.pendingSendCount",
                    "待发送：{$count}人",
                    {
                      count: record.sendStayCount,
                    },
                  )}
                </div>
              }
              {record.sendStatus == 2 ? (
                <>
                  <div
                    style={{
                      marginRight: "16px",
                      textWrap: "nowrap",
                      whiteSpace: "pre",
                    }}
                  >
                    {trans(
                      "scoreSummary.sentSuccessCount",
                      "发送成功：{$count}人",
                      {
                        count: record.sendSuccessCount,
                      },
                    )}
                  </div>
                  <div style={{ textWrap: "nowrap", whiteSpace: "pre" }}>
                    {trans("scoreSummary.sentFailLabel", "发送失败：")}
                    <Popover
                      content={<div>{record.sendFailNames?.join(",")}</div>}
                      trigger="click"
                    >
                      <span
                        style={{
                          color: "#FC491E",
                          textDecoration: "underline",
                        }}
                      >
                        {trans("scoreSummary.countWithPerson", "{$count}人", {
                          count: record.sendFailCount,
                        })}
                      </span>
                    </Popover>
                  </div>
                </>
              ) : null}
              {record.sendStatus == 4 ? (
                <>
                  <div
                    style={{
                      marginRight: "16px",
                      textWrap: "nowrap",
                      whiteSpace: "pre",
                    }}
                  >
                    {trans(
                      "scoreSummary.revokeSuccessCount",
                      "撤回成功：{$count}人",
                      {
                        count: record.revokeSuccessCount,
                      },
                    )}
                  </div>
                  <div style={{ textWrap: "nowrap", whiteSpace: "pre" }}>
                    {trans("scoreSummary.revokeFailLabel", "撤回失败：")}
                    <span style={{ color: "#FC491E" }}>
                      {trans("scoreSummary.countWithPerson", "{$count}人", {
                        count: record.revokeFailCount,
                      })}
                    </span>
                  </div>
                </>
              ) : null}
              {record.sendStatus == 1 || record.sendStatus == 3 ? (
                <div style={{ width: "100%", height: "8px" }}>
                  <div className={styles.progress_bar}>
                    <div
                      className={styles.progress_bar_filler}
                      style={{
                        background:
                          record.sendStatus == 3 ? "#04C919" : "#FCB605",
                      }}
                    ></div>
                  </div>
                </div>
              ) : null}
            </div>
          );
        },
      },
      {
        title: trans("global.operation", "操作"),
        key: "action",
        render: (text, record) => {
          // 是否超过24小时
          // let isMoreThan24HoursApart = Math.abs(Date.now() - new Date('2024-04-24 14:14:52').getTime()) > oneDayInMs
          // isMoreThan24HoursApart &&
          let styleObject = {
            color: "#0445FC",
            whiteSpace: "pre",
            textWrap: "nowrap",
            cursor: "pointer",
            marginRight: "5px",
          };
          return (
            <div style={{ display: "flex" }}>
              {record.sendType == 0 ? (
                <>
                  {record.isRevoke ? (
                    <div
                      style={{ ...styleObject }}
                      onClick={() => {
                        this.reRevokeMessageFun(record);
                      }}
                    >
                      {" "}
                      {trans("scoreSummary.revokeAction", "撤回")}
                    </div>
                  ) : (
                    <div
                      style={{ ...styleObject, color: "rgba(1, 17, 61, 0.5)" }}
                    >
                      {" "}
                      {trans("scoreSummary.revokeAction", "撤回")}
                    </div>
                  )}
                </>
              ) : (
                <Popover
                  placement="bottom"
                  content={trans(
                    "scoreSummary.revokeTip",
                    "钉钉消息发送已经超过24小时无法在发起撤回或已经发起撤回并全部撤回成功",
                  )}
                >
                  {record.isRevoke ? (
                    <div
                      style={{ ...styleObject }}
                      onClick={() => {
                        this.reRevokeMessageFun(record);
                      }}
                    >
                      {" "}
                      {trans("scoreSummary.revokeAction", "撤回")}
                    </div>
                  ) : (
                    <div
                      style={{ ...styleObject, color: "rgba(1, 17, 61, 0.5)" }}
                    >
                      {" "}
                      {trans("scoreSummary.revokeAction", "撤回")}
                    </div>
                  )}
                </Popover>
              )}
              {record.sendStatus == 2 && record.sendSuccessCount !== 0 ? (
                <div
                  style={{ ...styleObject, marginRight: "0" }}
                  onClick={() => {
                    this.resendMessageFun(record);
                  }}
                >
                  {trans("scoreSummary.resendReport", "重发")}
                </div>
              ) : null}
            </div>
          );
        },
      },
    ];
  };

  getColumns1 = () => {
    return [
      {
        title: trans("global.order", "序号"),
        dataIndex: "order",
        key: "order",
        render: (text, record, index) => index + 1,
      },
      {
        title: trans("global.group", "班级"),
        dataIndex: "groupName",
        key: "groupName",
      },
      {
        title: trans("global.status", "状态"),
        dataIndex: "status",
        key: "status",
        render: (text, record, index) => (
          <div style={{ display: "flex" }}>
            {text == 0
              ? trans("global.NotSent", "未发送")
              : trans("scoreSummary.sentLabel", "已发送")}
          </div>
        ),
      },
      {
        title: trans("scoreSummary.studentTotal", "学生总数"),
        dataIndex: "totalPeople",
        key: "totalPeople",
      },
      {
        title: trans("global.absentStudents", "缺考学生"),
        dataIndex: "absenteesPeople",
        key: "absenteesPeople",
      },
      {
        title:
          this.state.currentTab == "家长阅读情况"
            ? trans("scoreSummary.sendParentCount", "发送家长人数")
            : trans("scoreSummary.sendStudentCount", "发送学生人数"),
        dataIndex: "sendPeople",
        key: "sendPeople",
      },
      {
        title: trans("global.SentSuccessfully", "发送成功"),
        dataIndex: "sendSuccess",
        key: "sendSuccess",
      },
      {
        title: trans("global.SendingFailed", "发送失败"),
        dataIndex: "sendFail",
        key: "sendFail",
      },
      {
        title:
          this.state.currentTab == "家长阅读情况"
            ? trans("scoreSummary.familyReadStatus", "家庭阅读情况")
            : this.state.currentTab,
        dataIndex: "readFamily",
        key: "readFamily",
        width: 200,
        render: (text, record, index) => {
          return this.state.currentTab == "家长阅读情况" ? (
            <div
              onClick={() => {
                this.openReadDetail(record, index);
              }}
              className={`${styles.readFamilyBtn} ${this.state.activeReadId === index ? styles.active : ""}`}
            >
              {trans(
                "scoreSummary.readFamilySummary",
                "已读家庭 {$read} 未读家庭 {$unread}",
                {
                  read: record.readFamily,
                  unread: record.noReadFamily,
                },
              )}
            </div>
          ) : (
            <div
              onClick={() => {
                this.openReadDetail(record, index);
              }}
              className={`${styles.readFamilyBtn} ${this.state.activeReadId === index ? styles.active : ""}`}
            >
              {trans("scoreSummary.readCount", "已读{$count}", {
                count: record.readFamily,
              })}
            </div>
          );
        },
      },
    ];
  };

  getColumns2 = () => {
    return [
      {
        title: trans("global.order", "序号"),
        dataIndex: "order",
        key: "order",
        render: (text, record, index) => (
          <div style={{ display: "flex" }}>{index + 1}</div>
        ),
      },
      {
        title: trans("global.student", "学生"),
        dataIndex: "studentName",
        key: "studentName",
        ...this.getColumnSearchProps("studentName"),
      },
      {
        title: trans("scoreSummary.father", "父亲"),
        dataIndex: "fatherRead",
        key: "fatherRead",
        filters: [
          { text: trans("scoreSummary.read", "已读"), value: true },
          { text: trans("scoreSummary.unread", "未读"), value: false },
        ],
        filteredValue: this.state.filteredInfo.fatherRead || null,
        onFilter: (value, record) => value == Boolean(record.fatherRead),
        ellipsis: true,
        render: (text, record, index) => (
          <div style={{ display: "flex" }}>
            {text ? (
              <span style={{ color: "#04C919" }}>
                {trans("scoreSummary.read", "已读")}
              </span>
            ) : (
              <span style={{ color: "rgba(1, 17, 61, 0.5)" }}>
                {trans("scoreSummary.unread", "未读")}
              </span>
            )}
          </div>
        ),
      },
      {
        title: trans("scoreSummary.mother", "母亲"),
        dataIndex: "matherRead",
        key: "matherRead",
        filters: [
          { text: trans("scoreSummary.read", "已读"), value: true },
          { text: trans("scoreSummary.unread", "未读"), value: false },
        ],
        filteredValue: this.state.filteredInfo.matherRead || null,
        onFilter: (value, record) => value == Boolean(record.matherRead),
        ellipsis: true,
        render: (text, record, index) => (
          <div style={{ display: "flex" }}>
            {text ? (
              <span style={{ color: "#04C919" }}>
                {trans("scoreSummary.read", "已读")}
              </span>
            ) : (
              <span style={{ color: "rgba(1, 17, 61, 0.5)" }}>
                {trans("scoreSummary.unread", "未读")}
              </span>
            )}
          </div>
        ),
      },
      {
        title: trans("global.family", "家庭"),
        dataIndex: "familyRead",
        key: "familyRead",
        filters: [
          { text: trans("scoreSummary.read", "已读"), value: true },
          { text: trans("scoreSummary.unread", "未读"), value: false },
        ],
        filteredValue: this.state.filteredInfo.familyRead || null,
        onFilter: (value, record) => value == Boolean(record.familyRead),
        ellipsis: true,
        render: (text, record, index) => (
          <div style={{ display: "flex" }}>
            {text ? (
              <span style={{ color: "#04C919" }}>
                {trans("scoreSummary.read", "已读")}
              </span>
            ) : (
              <span style={{ color: "rgba(1, 17, 61, 0.5)" }}>
                {trans("scoreSummary.unread", "未读")}
              </span>
            )}
          </div>
        ),
      },
    ];
  };

  getColumns3 = () => {
    return [
      {
        title: trans("global.order", "序号"),
        dataIndex: "order",
        key: "order",
        render: (text, record, index) => (
          <div style={{ display: "flex" }}>{index + 1}</div>
        ),
      },
      {
        title: trans("global.student", "学生"),
        dataIndex: "studentName",
        key: "studentName",
        ...this.getColumnSearchProps("studentName"),
      },
      {
        title: trans("global.status", "状态"),
        dataIndex: "studentRead",
        key: "studentRead",
        filters: [
          { text: trans("scoreSummary.read", "已读"), value: true },
          { text: trans("scoreSummary.unread", "未读"), value: false },
        ],
        filteredValue: this.state.filteredInfo.studentRead || null,
        onFilter: (value, record) => value == Boolean(record.studentRead),
        ellipsis: true,
        render: (text, record, index) => (
          <div style={{ display: "flex" }}>
            {text ? (
              <span style={{ color: "#04C919" }}>
                {trans("scoreSummary.read", "已读")}
              </span>
            ) : (
              <span style={{ color: "rgba(1, 17, 61, 0.5)" }}>
                {trans("scoreSummary.unread", "未读")}
              </span>
            )}
          </div>
        ),
      },
    ];
  };

  changeTab = async (value) => {
    if (value == 1) {
      if (!this.state.studentUserId1) {
        let defaultId = this.state.classListData?.length
          ? this.state.classListData[0].groupId
          : "";
        this.changeClass1(defaultId);
      }
    } else if (value == 2) {
      this.setState({
        searchVal: "",
        selectedStuKeys: [],
      });
      this.checkedStudentsByType(this.state.currentTab);
    }

    this.setState({
      tabIndex: value,
    });
  };

  checkedStudentsByType = (type) => {
    let array = [];
    const { classListData } = this.state;
    if (classListData && classListData.length > 0) {
      for (const item of classListData) {
        for (const student of item.studentInfoResponseList) {
          if (
            type == trans("global.NotSent", "未发送") &&
            student.status == 0
          ) {
            array.push(student.studentId);
          } else if (
            type == trans("global.SendingFailed", "发送失败") &&
            student.status == 2
          ) {
            array.push(student.studentId);
          } else if (
            type == trans("global.SentSuccessfully", "发送成功") &&
            student.status == 1
          ) {
            array.push(student.studentId);
          }
        }
      }
    }
    this.setState({
      selectedStuKeys: array,
    });
  };

  cancelPreviewStudentReport = () => {
    this.setState({
      tabIndex: 1,
      visible: false,
      classListData: {},
      studentUserId1: "",
      subjectsScoreTabData: {},
    });
  };

  changeClass1 = (id) => {
    this.setState({
      groupId1: id,
    });
    let result = this.state.classListData?.find((item) => item.groupId == id);
    if (
      result &&
      result.studentInfoResponseList &&
      result.studentInfoResponseList.length > 0
    ) {
      let { studentId } = result.studentInfoResponseList[0];
      this.changeStudent1(studentId);
    }
  };

  changeStudent1 = (id) => {
    if (id) {
      if (document.querySelector("#previewRight")) {
        document.querySelector("#previewRight").scrollTop = 0;
      }
      this.setState({
        studentUserId1: id,
      });
      this.getSubjectsScore({
        summaryReportId: this.state.summaryReportId,
        studentId: id,
      });
    }
  };

  // 根据状态名称过滤学生
  filterByStudentName = () => {
    let classStudentData = this.filterByStudentStatus();
    let list = [];
    if (classStudentData.length > 0) {
      for (const item of classStudentData) {
        let array = [];
        for (const student of item.studentInfoResponseList) {
          if (student.name.toLowerCase().includes(this.state.searchVal)) {
            array.push(student);
          }
        }
        if (array.length > 0) {
          list.push({
            ...item,
            studentInfoResponseList: array,
          });
        }
      }
    }
    return list;
  };

  // 根据状态过滤学生
  filterByStudentStatus = () => {
    let classStudentData = [];
    const { classListData } = this.state;
    if (classListData && classListData.length > 0) {
      for (const item of classListData) {
        let array = [];
        for (const student of item.studentInfoResponseList) {
          if (
            this.state.currentTab == trans("global.NotSent", "未发送") &&
            student.status == 0
          ) {
            array.push(student);
          } else if (
            this.state.currentTab ==
              trans("global.SendingFailed", "发送失败") &&
            student.status == 2
          ) {
            array.push(student);
          } else if (
            this.state.currentTab ==
              trans("global.SentSuccessfully", "发送成功") &&
            student.status == 1
          ) {
            array.push(student);
          } else if (this.state.currentTab == trans("global.All", "全部")) {
            array.push(student);
          }
        }
        if (array.length > 0) {
          classStudentData.push({
            ...item,
            studentInfoResponseList: array,
          });
        }
      }
    }
    return classStudentData;
  };

  selectorChange = (ids) => {
    this.setState({
      selectedStuKeys: ids,
    });
  };

  searchStu1 = (value, event) => {
    this.setState({ loading: true });
    this.props
      .dispatch({
        type: "global/getStudentList",
        payload: {
          examId: this.props.examId,
          keyWord: this.state.searchVal,
        },
      })
      .then((res) => {
        this.setState({ loading: false });
      });
  };

  changeStuName = (e) => {
    this.setState({
      searchVal: e.target.value,
    });
  };

  tabChange = (key) => {
    this.setState({
      currentTab: key,
    });
    this.superSelector.setState({
      classIndex: 0,
    });
    this.checkedStudentsByType(key);
  };

  getSubjectsScore = ({ summaryReportId, studentId }) => {
    this.setState({ SsSLodaing: true });
    summaryClassStudentOne({
      summaryReportId: summaryReportId,
      studentId: studentId,
    })
      .then((response) => {
        if (response.ifLogin) {
          if (response.status) {
            this.setState({
              subjectsScoreTabData: response.content,
            });
          } else {
            message.error(response.message);
          }
        } else {
          loginRedirect();
        }
      })
      .finally(() => {
        this.setState({ SsSLodaing: false });
      });
  };

  filterStuList = () => {
    const { classListData } = this.state;
    if (classListData && classListData.length > 0) {
      let result = classListData.find(
        (item) => item.groupId == this.state.groupId1,
      );
      if (result) {
        return result.studentInfoResponseList;
      }
    }
    return [];
  };

  render() {
    const { defaultSemester } = this.state;
    const { examOptions, currentUser } = this.props;
    const { studySituationByStudentIdList } = this.props;

    let device = window.yg;

    return (
      <div
        style={{
          height: "100%",
          width: "100%",
          background: "#f5f5f5",
          padding: "0 8px",
        }}
      >
        <div className={styles.searchBar}>
          <Select
            onChange={this.changeStage}
            value={this.state.semesterId}
            style={{ width: "180px", marginRight: "10px" }}
            placeholder={trans("revisedList.selectSemester", "请选择学期")}
          >
            {examOptions && examOptions.length > 0
              ? examOptions.map((item) => (
                  <Option value={item.semesterId} key={item.semesterId}>
                    <span title={item.semesterName}>{item.semesterName}</span>
                  </Option>
                ))
              : null}
          </Select>

          <Select
            onChange={this.changeGrade}
            value={this.state.gradeId}
            style={{ width: "180px", marginRight: "10px" }}
            placeholder={trans("global.pleaseSelectGrade", "请选择年级")}
          >
            <Option value={0} key={0}>
              {trans("global.allGrade", "全部年级")}
            </Option>
            {defaultSemester.gradeList && defaultSemester.gradeList.length > 0
              ? defaultSemester.gradeList.map((item) => (
                  <Option value={item.gradeId} key={item.gradeId}>
                    <span title={item.gradeName}>{item.gradeName}</span>
                  </Option>
                ))
              : null}
          </Select>

          <Select
            value={this.state.reportType}
            style={{ width: "180px", marginRight: "10px" }}
            onChange={this.changeType}
            placeholder={trans("global.pleaseSelectType", "请选择类型")}
          >
            <Option value={0} key={0}>
              {trans("global.allType", "全部类型")}
            </Option>
            {defaultSemester.examType &&
              defaultSemester.examType.length &&
              defaultSemester.examType.map((item) => (
                <Option value={item.examTypeCode} key={item.examTypeCode}>
                  <span title={item.examTypeName}>{item.examTypeName}</span>
                </Option>
              ))}
          </Select>

          <Search
            placeholder={trans("global.search", "搜索")}
            allowClear
            value={this.state.keyword}
            onChange={this.changeSearch}
            onSearch={this.onSearch}
            style={{ width: 130 }}
          />

          <span
            className={[styles.inline, styles.makeCard].join(" ")}
            data-type="新建成绩汇总报告"
          >
            <div
              className={styles.makeCardButton}
              onClick={() => {
                this.createStudentGradeSummary("add");
              }}
            >
              {trans("global.AddaNewScoreSummaryReport", "新建成绩汇总报告")}
            </div>
          </span>
        </div>
        <div
          style={{
            width: "100%",
            height: "calc(100% - 98px)",
            overflow: "auto",
          }}
        >
          <div className={styles.testMapList} id="listBox">
            {this.state.loading == true ? (
              <div
                style={{
                  width: "100%",
                  height: "300px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Spin tip="Loading..." />
              </div>
            ) : this.state.tableList && this.state.tableList.length > 0 ? (
              this.state.tableList.map((item, index) => (
                <div
                  className={[styles.mapBox, "listItem"].join(" ")}
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    this.onSummaryAnalysisButtonClick(item);
                  }}
                >
                  <span
                    className={[styles.inline, styles.messageBox].join(" ")}
                  >
                    <div
                      style={{
                        marginBottom: "14px",
                        display: "flex",
                        flexWrap: "nowrap",
                        alignItems: "center",
                      }}
                    >
                      <span
                        className={`${styles.examTypeBox} ${
                          item.reportType == 1
                            ? styles.green
                            : item.reportType == 2 ||
                                item.reportType == 3 ||
                                item.reportType == 10
                              ? styles.blue
                              : item.reportType == 7 || item.reportType == 9
                                ? styles.red
                                : item.reportType == 6 ||
                                    item.reportType == 4 ||
                                    item.reportType == 5
                                  ? styles.orange
                                  : item.reportType == 11
                                    ? styles.grey
                                    : styles.grey
                        }`}
                      >
                        {item.reportTypeName}
                      </span>
                      <div className={styles.header}>
                        <div className={styles.headerInner}>
                          <div className={styles.text}> {item.reportName} </div>
                          <span
                            style={{
                              fontSize: "12px",
                              color: "rgba(0, 0, 0, 0.65)",
                            }}
                          >
                            {item.id
                              ? null
                              : trans(
                                  "scoreSummary.systemGeneratedTag",
                                  "(系统生成)",
                                )}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div
                      className={styles.content}
                      style={{ marginTop: "5px" }}
                    >
                      <span className={[styles.inline, styles.time].join(" ")}>
                        <i className={styles.iconfont}>&#xe61f;</i>
                        {item.createTimeStr}
                      </span>
                      <span className={[styles.inline, styles.time].join(" ")}>
                        <i className={styles.iconfont}>&#xe708;</i>
                        {this.getSubjectNames(item).join(" ")}
                      </span>
                      <span className={[styles.inline, styles.time].join(" ")}>
                        <i className={styles.iconfont}>&#xe745;</i>
                        {item.summaryDetail[0].gradeName}
                      </span>
                      <span className={[styles.inline, styles.time].join(" ")}>
                        <Icon type="user" />
                        {item.createUserName}
                      </span>
                    </div>
                  </span>
                  <div className={styles.rightActionButtons}>
                    {item.id && item.createUserId == currentUser?.userId ? (
                      <div
                        className={styles.activeBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                        }}
                      >
                        <Popconfirm
                          placement="top"
                          title={trans(
                            "scoreSummary.deleteReportConfirm",
                            "确认要删除这份成绩汇总报告吗？",
                          )}
                          onConfirm={() => {
                            this.delet(item);
                          }}
                          okText="确定"
                          cancelText="取消"
                        >
                          <i
                            className={styles.iconfont}
                            style={{ fontSize: "14px", color: "#0445FC" }}
                          >
                            &#xe7a8;
                          </i>
                          <div className={styles.buttonLabel}>
                            {trans("global.delete", "删除")}
                          </div>
                        </Popconfirm>
                      </div>
                    ) : null}

                    {this.state["exam:scoreSummary:sendParent"] ? (
                      <>
                        {/* <div className={styles.activeBtn}
                              onClick={(e) => {
                                e.stopPropagation()
                                e.preventDefault()
                                this.readMsgClick('家长阅读情况')
                              }}
                            >
                              <i
                                className={styles.iconfont}
                                style={{ fontSize: "14px", color: "#0445FC" }}
                              >
                                &#xe83b;
                              </i>
                              <div className={styles.buttonLabel} >
                                阅读统计
                              </div>
                            </div>

                            <div className={styles.activeBtn}
                              onClick={(e) => {
                                e.stopPropagation()
                                e.preventDefault()
                                this.showLog(item)
                              }}
                            >
                              <i
                                className={styles.iconfont}
                                style={{ fontSize: "14px", color: "#0445FC" }}
                              >
                                &#xe83b;
                              </i>
                              <div className={styles.buttonLabel} >
                                发送日志
                              </div>
                            </div> */}

                        {item.id ? (
                          <div
                            className={styles.activeBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              this.sending(1, item);
                            }}
                          >
                            <i
                              className={styles.iconfont}
                              style={{ fontSize: "14px", color: "#0445FC" }}
                            >
                              &#xe85c;
                            </i>
                            <div className={styles.buttonLabel}>
                              {trans("global.SendtoParents", "发送家长")}
                            </div>
                          </div>
                        ) : (
                          <Tooltip
                            title={trans(
                              "scoreSummary.systemGeneratedSendDisabledTip",
                              "系统生成报告暂不支持，请编辑保存后发送",
                            )}
                          >
                            <div
                              className={`${styles.activeBtn} ${styles.disableColor}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                              }}
                            >
                              <i
                                className={`${styles.iconfont} ${styles.disableColor}`}
                                style={{ fontSize: "14px" }}
                              >
                                &#xe85c;
                              </i>
                              <div
                                className={`${styles.buttonLabel} ${styles.disableColor}`}
                              >
                                {trans("global.SendtoParents", "发送家长")}
                              </div>
                            </div>
                          </Tooltip>
                        )}
                      </>
                    ) : null}

                    <div
                      className={styles.activeBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        this.createStudentGradeSummary("edit", item);
                      }}
                    >
                      <i
                        className={styles.iconfont}
                        style={{ fontSize: "14px", color: "#0445FC" }}
                      >
                        &#xe83b;
                      </i>
                      <div className={styles.buttonLabel}>
                        {trans("global.ReportSettings", "报告设置")}
                      </div>
                    </div>
                    <div
                      className={styles.activeBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        this.onSummaryAnalysisButtonClick(item);
                      }}
                    >
                      <i
                        className={styles.iconfont}
                        style={{ fontSize: "14px", color: "#0445FC" }}
                      >
                        &#xe85e;
                      </i>
                      <div className={styles.buttonLabel}>
                        {trans("global.SummaryAnalysis", "汇总分析")}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: "center", padding: "20px" }}>
                <div className={styles.iconBox}>
                  <img className={styles.noTask} src={noTask}></img>
                </div>
                {trans("selectCourse.noData", "暂无数据")}
              </div>
            )}
          </div>
        </div>
        <div className={styles.pagination}>
          <Pagination
            size="small"
            current={1}
            pageSize={10}
            pageSizeOptions={[50, 100, 150, 200]}
            total={10}
            onChange={this.changeNo}
            showSizeChanger
            showQuickJumper
            onShowSizeChange={this.onShowSizeChange}
          />
        </div>

        {/* 发送给家长/发送给学生/批量下载 */}
        <ComnModal
          options={{
            visible: this.state.visible,
            footer: (
              <>
                {this.state.tabIndex == 2 && this.state.sendType == 2 ? (
                  <span
                    style={{
                      fontSize: "14px",
                      lineHeight: "22px",
                      color: "#01113D",
                      float: "left",
                      marginLeft: "44px",
                    }}
                  >
                    {trans(
                      "scoreSummary.sendParentsOnlyTip",
                      "说明：报告只发送给学生的父母，不会发送给其他联系人",
                    )}
                  </span>
                ) : (
                  ""
                )}

                <MyButton
                  sizeclass="smallBtn"
                  typeclass="cancelBtn"
                  onClick={this.cancelChange}
                >
                  {this.state.tabIndex == 1
                    ? trans("global.cancle", "取消")
                    : trans("global.previousStep", "上一步")}
                </MyButton>

                {this.state.tabIndex == 0 ? (
                  <MyButton
                    sizeclass="smallBtn"
                    typeclass="confirmBtn"
                    loading={this.state.btnLoading}
                    onClick={this.confirmChange}
                  >
                    {trans("global.PreviewReport", "预览报告")}
                  </MyButton>
                ) : null}

                {this.state.tabIndex == 1 ? (
                  <MyButton
                    sizeclass="smallBtn"
                    typeclass="confirmBtn"
                    onClick={this.confirmChange}
                  >
                    {trans("global.NextStep", "下一步")}
                  </MyButton>
                ) : null}

                {this.state.tabIndex == 2 && this.state.sendType == 0 ? (
                  <MyButton
                    loading={this.state.btnLoading}
                    sizeclass="smallBtn"
                    typeclass="confirmBtn"
                    onClick={() => {
                      this.downLodaStudy(this.state.selectedStuKeys);
                    }}
                  >
                    {trans("global.DownloadNow", "立即下载")}
                  </MyButton>
                ) : null}

                {/* {this.state.tabIndex == 2 && this.state.currentTab == '发送失败' ? < Popconfirm
              title="您确定发送报告吗？"
              onConfirm={this.confirmChange}
              onCancel={() => { }}
              okText="确认"
              cancelText="取消"
              overlayClassName={styles.my_popconfirm}
            >
              <MyButton
                loading={this.state.btnLoading}
                sizeclass="smallBtn"
                typeclass="confirmBtn"
              >
                重新发送
              </MyButton>
            </Popconfirm> : null} 

            {this.state.tabIndex == 2 && this.state.currentTab == '发送成功' ? < Popconfirm
              title="您确定要撤回选中的人的学情报告吗？"
              onConfirm={this.confirmChange}
              onCancel={() => { }}
              okText="确认"
              cancelText="取消"
              overlayClassName={styles.my_popconfirm}
            >
              <MyButton
                loading={this.state.btnLoading}
                sizeclass="smallBtn"
                typeclass="confirmBtn"
              >
                撤回报告
              </MyButton>
            </Popconfirm> : null}  */}
                {this.state.tabIndex == 2 &&
                this.state.currentTab == trans("global.NotSent", "未发送") ? (
                  <Popconfirm
                    title="您确定发送报告吗？"
                    onConfirm={this.confirmChange}
                    onCancel={() => {}}
                    okText="确认"
                    cancelText="取消"
                    overlayClassName={styles.my_popconfirm}
                  >
                    <MyButton
                      loading={this.state.btnLoading}
                      sizeclass="smallBtn"
                      typeclass="confirmBtn"
                    >
                      {trans("global.ConfirmAndSend", "确认发送")}
                    </MyButton>
                  </Popconfirm>
                ) : null}
              </>
            ),
            onCancel: this.cancelPreviewStudentReport,
            title: [
              trans("global.SetTheReportStyle", "设置样式报告"),
              trans("global.PreviewReportEffect", "预览报告效果"),
              [
                "批量下载",
                trans("global.sentToParents", "发送给家长"),
                "发送给学生",
              ][this.state.sendType],
            ][this.state.tabIndex],
            width: 800,
            className: styles.previewStudentReportModal,
            centered: true,
          }}
          innerContent={
            <>
              <div className={styles.stepWarp}>
                <StepProgressBar
                  data={[
                    {
                      tab: trans("global.PreviewReportEffect", "预览报告效果"),
                      key: 1,
                    },
                    { tab: trans("global.selectStudents", "选择学生"), key: 2 },
                  ]}
                  onChange={(value) => {
                    this.changeTab(value.key);
                  }}
                  activeKey={this.state.tabIndex}
                  style={{ marginTop: "13px" }}
                />
              </div>

              <div
                className={`${styles.modalBodyContent} ${styles.scrollbar} `}
              >
                {this.state.tabIndex == 1 ? (
                  <Spin
                    wrapperClassName={styles.spinContent}
                    spinning={this.state.loading}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "nowrap",
                        width: "100%",
                        height: "100%",
                      }}
                    >
                      <div className={styles.previewLeft}>
                        <div style={{ height: "100%", width: "100%" }}>
                          <LeftContent
                            trendStuList={this.filterStuList()}
                            studentUserId={this.state.studentUserId1}
                            groupId={this.state.groupId1}
                            classListData={this.state.classListData}
                            onChangeStu={this.changeStudent1}
                            onChangeClass={this.changeClass1}
                          />
                        </div>
                      </div>
                      <div className={styles.previewRight}>
                        <LearningAnalysis
                          tabData={this.state.subjectsScoreTabData}
                          isLoading={this.state.SsSLodaing}
                        />
                      </div>
                    </div>
                  </Spin>
                ) : null}

                {this.state.tabIndex == 2 ? (
                  <div className={styles.selectContent}>
                    <div className={styles.tabsBox}>
                      {[
                        trans("global.NotSent", "未发送"),
                        trans("global.SendingFailed", "发送失败"),
                        trans("global.SentSuccessfully", "发送成功"),
                        trans("global.All", "全部"),
                      ].map((item) => (
                        <div
                          className={`${styles.tab} 
                            ${item == trans("global.SendingFailed", "发送失败") ? styles.error : ""} 
                            ${this.state.currentTab == item ? styles.active : ""}`}
                          onClick={() => {
                            this.tabChange(item);
                          }}
                          key={item}
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                    <div className={styles.searchBox}>
                      <Search
                        placeholder={trans(
                          "global.studentSearch",
                          "请输入学生姓名/学号进行搜索",
                        )}
                        onSearch={this.searchStu1}
                        onChange={this.changeStuName}
                        value={this.state.searchVal}
                      />
                    </div>

                    <div className={styles.selectorContent}>
                      <Spin
                        wrapperClassName={styles.spinContent}
                        spinning={this.state.loading}
                      >
                        <SuperSelector
                          onRef={(_this) => {
                            this.superSelector = _this;
                          }}
                          currentTab={this.state.currentTab}
                          selectedKeys={this.state.selectedStuKeys}
                          treeData={this.filterByStudentName()}
                          onChange={this.selectorChange}
                        />
                      </Spin>
                    </div>
                  </div>
                ) : null}
              </div>
            </>
          }
        />

        {/* 查看日志 */}
        <ComnModal
          options={{
            visible: this.state.logVisible,
            footer: (
              <div className={styles.footerBox}>
                <Popconfirm
                  title={trans(
                    "scoreSummary.confirmRevokeAll",
                    "确认要撤回全部的学情报告吗？",
                  )}
                  onConfirm={this.revokeFun}
                  onCancel={() => {}}
                  okText="确认"
                  cancelText="取消"
                  overlayClassName={styles.my_popconfirm}
                >
                  <div className={`${styles.btn} ${styles.warning}`}>
                    {trans("scoreSummary.revokeAllReports", "撤回全部报告")}
                  </div>
                </Popconfirm>
                <Popconfirm
                  title={trans(
                    "scoreSummary.confirmResendFailed",
                    "确认要重发所有失败的学情报告吗？",
                  )}
                  onConfirm={this.resendFun}
                  onCancel={() => {}}
                  okText="确认"
                  cancelText="取消"
                  overlayClassName={styles.my_popconfirm}
                >
                  <div className={`${styles.btn} ${styles.confirm}`}>
                    {trans(
                      "scoreSummary.resendFailedReports",
                      "一键重发失败报告",
                    )}
                  </div>
                </Popconfirm>
              </div>
            ),
            onCancel: this.cancelPreviewLog,
            title: (
              <span style={{ lineHeight: "22px" }}>
                <span style={{ marginRight: "10px", display: "inline-block" }}>
                  {trans("scoreSummary.sendLog", "发送日志")}
                </span>
                <i
                  style={{
                    color: "#0445FC",
                    fontSize: "18px",
                    cursor: "pointer",
                  }}
                  className={styles.iconfont}
                  onClick={this.showLog}
                >
                  &#xe8cf;
                </i>
              </span>
            ),
            width: 1150,
            className: `${styles.logModal} ${styles.heightClass}`,
            centered: true,
          }}
          innerContent={
            <>
              <MyTable
                loading={this.state.showLogLoading}
                dataSource={this.state.messageLogData}
                pagination={false}
                columns={this.getColumns()}
                scroll={{ y: 449 }}
              />
            </>
          }
        />

        {/* 阅读统计 */}
        <ComnModal
          options={{
            title: (
              <div className={styles.modalTabsBox}>
                {
                  // ['家长阅读情况','学生阅读情况']
                  ["家长阅读情况"].map((item) => (
                    <div
                      className={`${styles.tab}  ${this.state.currentTab == item ? styles.active : ""}`}
                      onClick={() => this.readMsgClick(item)}
                      key={item}
                    >
                      {item}
                    </div>
                  ))
                }
              </div>
            ),
            visible: this.state.readMsgVisble,
            width: 1105,
            footer: null,
            centered: true,
            onOk: () => {
              this.setState({ readMsgVisble: false });
            },
            onCancel: () => {
              this.setState({ readMsgVisble: false });
            },
            className: `${styles.readMsgModal} ${styles.heightClass}`,
          }}
          innerContent={
            <div className={styles.readMsgContent}>
              <MyTable
                loading={this.state.readMsgLoading}
                dataSource={this.state.readStatistics}
                pagination={false}
                columns={this.getColumns1()}
                scroll={{ y: 449 }}
              />
            </div>
          }
        />

        {/* 家长阅读情况 */}
        <ComnModal
          options={{
            title: this.state.readDetail.groupName,
            visible:
              this.state.readMagDetailVis &&
              this.state.currentTab == "家长阅读情况",
            width: 500,
            footer: null,
            centered: true,
            onOk: () => {
              this.setState({ readMagDetailVis: false });
            },
            onCancel: () => {
              this.setState({ readMagDetailVis: false });
            },
            className: `${styles.readMsgDetailModal} ${styles.heightClass}`,
            mask: false,
          }}
          innerContent={
            <div className={styles.readMsgContent}>
              <MyTable
                dataSource={this.state.readDetail.familyReadingDetails}
                pagination={false}
                columns={this.getColumns2()}
                onChange={this.handleChange}
                scroll={{ y: 449 }}
              ></MyTable>
            </div>
          }
        />

        {/* 学生阅读情况 */}
        <ComnModal
          options={{
            title: this.state.readDetail.groupName,
            visible:
              this.state.readMagDetailVis &&
              this.state.currentTab == "学生阅读情况",
            width: 500,
            footer: null,
            centered: true,
            onOk: () => {
              this.setState({ readMagDetailVis: false });
            },
            onCancel: () => {
              this.setState({ readMagDetailVis: false });
            },
            className: `${styles.readMsgDetailModal} ${styles.heightClass}`,
            mask: false,
          }}
          innerContent={
            <div className={styles.readMsgContent}>
              <MyTable
                dataSource={this.state.readDetail.familyReadingDetails}
                pagination={false}
                columns={this.getColumns3()}
                onChange={this.handleChange}
                scroll={{ y: 449 }}
              ></MyTable>
            </div>
          }
        />

        {/* 报告操作成功提示 */}
        <ComnModal
          options={{
            title: (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {/* 如果是在发送成功下操作则提示撤回成功，如果不是则提示发送成功 */}
                <Loding />
                &nbsp;{" "}
                <span className={styles.stateText}>
                  {trans("scoreSummary.report", "报告")}
                  {this.state.currentTab ==
                  trans("global.SentSuccessfully", "发送成功")
                    ? trans("scoreSummary.revokeAction", "撤回")
                    : trans("scoreSummary.sendingReport", "发送")}
                  {trans("scoreSummary.inProgress", "中......")}
                </span>
              </div>
            ),
            visible: this.state.emptyVisble,
            width: 626,
            footer: null,
            centered: true,
            onOk: () => {
              this.setState({ emptyVisble: false });
            },
            onCancel: () => {
              this.setState({ emptyVisble: false });
            },
          }}
          innerContent={
            <div className={styles.emptyContent}>
              <div style={{ textAlign: "center" }}>
                <i
                  className={styles.iconfont}
                  style={{ fontSize: "80px", color: "#04C919" }}
                >
                  &#xe8ba;
                </i>
              </div>
              <div className={styles.text}>
                {trans("scoreSummary.operationSuccess", "操作成功")}
              </div>
              {this.state.sendType == 1 &&
              this.state.currentTab !==
                trans("global.SentSuccessfully", "发送成功") ? (
                <div className={styles.text}>
                  学生将通过站内信的方式收到此次报告
                </div>
              ) : null}

              {this.state.sendType == 0 &&
              this.state.currentTab !==
                trans("global.SentSuccessfully", "发送成功") ? (
                <div className={styles.text}>
                  家长将通过钉钉消息通知收到此次报告
                </div>
              ) : null}

              <div style={{ textAlign: "center", marginTop: "58px" }}>
                {/* <MyButton
                style={{ marginRight: '10px' }}
                sizeclass="smallBtn"
                typeclass="cancelBtn"
                onClick={this.showLog}
              >
                查看发送日志
              </MyButton> */}
                <MyButton
                  sizeclass="smallBtn"
                  typeclass="cancelBtn"
                  onClick={() => {
                    this.setState({ emptyVisble: false });
                  }}
                >
                  {trans("qualityBenchmark.close", "关闭")}
                </MyButton>
              </div>
            </div>
          }
        />
      </div>
    );
  }
}

export default connect(({ home, global }) => ({
  examOptions: home.examOptions,
  currentUser: global.currentUser,
  studySituationByStudentIdList: home.studySituationByStudentIdList,
  studentList: global.studentList,
}))(ScoreSummary);
