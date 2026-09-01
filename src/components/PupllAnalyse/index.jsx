// 类组件
import React from "react";
import {
  Checkbox,
  Icon,
  Input,
  message,
  Popconfirm,
  Popover,
  Spin,
  Upload,
} from "antd";
import Search from "antd/lib/input/Search";
import { connect } from "dva";

import excelLogo from "../../assets/excelLogo.png";
import ComnModal from "../../components/ComnModal";
import StepProgressBar from "../../components/StepProgressBar";
import EditableText from "../../routes/DataAnalysis/components/ClassReport/EditableText";
import { getExamModule } from "../../services/exam";
import {
  getConfig,
  messageLog,
  queryStudySituationByStudentId,
  queryTrendStu,
  reRevokeMessage,
  resendMessage,
} from "../../services/example";
import {
  getStudentStudySituationConfig,
  queryStudySituationStructureByStudentId,
  readingStatistics,
  saveStudentStudySituationConfig,
} from "../../services/global";
import { trans } from "../../utils/i18n";
import request from "../../utils/request";
import { convertToChineseNumber } from "../../utils/utils";
import Directory from "../Directory";
// import TeacherRemarks from './components/TeacherRemarks';
import HoverTooltip from "../HoverTooltip";
import MyButton from "../MyButton";
import MyTabs from "../MyTabs";
import AiAnalysis from "./components/AiAnalysis";
import DownloadConfig from "./components/DownloadConfig";
import LeftContent from "./components/LeftContent";
import Loding from "./components/Loding";
import MyTable from "./components/MyTable";
import OverallView from "./components/OverallView";
import SuperSelector from "./components/SuperSelector";
import WrongQuestionSet from "./components/WrongQuestionSet";
import WrongQuestionView from "./components/WrongQuestionView";

import styles from "./index.module.less";
let timerId = null;
let timerid1 = null;
let tid = null;
const oneDayInMs = 24 * 60 * 60 * 1000;

class PupllAnalyse extends React.Component {
  constructor(properties) {
    super(properties);
    this.state = {
      tabIndex: 0,
      selectedStuKeys: [],
      stuName: "",
      currentTab: "家长阅读情况",
      visible: false,
      logVisible: false,
      downloadVisble: false,
      situationConfig: {},
      subRangeVis: false,
      subRangeList: [],
      groupId: "",
      detail: {},
      groupId1: "",
      studentUserId1: "",
      trendStuList1: [],
      viewType: 1,
      sendType: null,
      searchVal: "",
      emptyVisble: false,
      elevatorIndex: 0,
      modelListLoding: {
        AI_POWERED_LEARNING_ANALYTICS: false,
        // TEACHER_POWERED_LEARNING_ANALYTICS: false,
        WRONG_QUESTIONS_OVERVIEW: false,
        OVERALL_SITUATION: false,
        WRONG_TOPIC_COLLECTION: false,
      },
      pageLoding: false,
      loading: false,
      btnLoading: false,
      readMagDetailVis: false,
      filteredInfo: {},
      readStatistics: [],
      readDetail: [],
      messageLogData: [],
      // percent: 0
      reportName: "",
      activeReadId: "",
      similarPaperPermission: false,
      AIPoweredLearningAnalytics: false,
      parentStage: null,
      studentStage: null,
    };
    this.centerContentRef = React.createRef(null);
    this.superSelector = null;
  }

  componentDidMount() {
    getConfig({
      type: 6,
      schoolLevel: true,
      businessId: "",
    }).then((response) => {
      if (response.ifLogin) {
        if (response.status) {
          const { parentStage, studentStage } = response.content;
          this.setState({
            parentStage: parentStage || null,
            studentStage: studentStage || null,
          });
        } else {
          message.error(response.message);
        }
      } else {
        loginRedirect();
      }
    });

    // 获取校级配置
    this.getModuleCodeList();

    //  获取模版配置信息
    this.getStudentStudySituationConfigFun();

    this.props.dispatch({
      type: "home/getClassList",
      payload: {
        examId: this.props.examId,
        visible: false,
      },
      callback: (response) => {
        if (response.status) {
          const data = response.content;
          // 存在班级则默认选中第一个班级，不存在则显示全部班级
          let temporaryClassId = data && data.length > 0 ? data[0].groupId : 0;
          this.setState(
            {
              groupId: temporaryClassId,
            },
            () => {
              this.getStu(temporaryClassId);
            },
          );
        } else {
          message.error(response.message);
        }
      },
    });
    document
      .querySelector("#centerContent")
      .addEventListener("scroll", this.scrollChange, true);
  }

  getModuleCodeList = () => {
    // 获取校级配置
    getExamModule().then((res) => {
      if (res.status) {
        if (res.content) {
          for (const item of res.content) {
            if (
              item.groupCode == "PRECISION_TEACHING" &&
              item.childModuleCodeList
            ) {
              if (
                item.childModuleCodeList.includes(
                  "Parallel test paper generation",
                )
              ) {
                this.setState({
                  similarPaperPermission: true,
                });
              }
              if (
                item.childModuleCodeList.includes(
                  "AI_Powered_Learning_Analytics",
                )
              ) {
                this.setState({
                  AIPoweredLearningAnalytics: true,
                });
              }
            }
          }
        }
      } else {
        message.error(res.message);
      }
    });
  };

  scrollChange = (e) => {
    let scrollY = e.target.pageYOffset || e.target.scrollTop;
    // 防抖
    if (timerId) {
      clearTimeout(timerId);
    }
    timerId = setTimeout(() => {
      if (scrollY > 150) {
        document.querySelector("#maoding").style.display = "block";
      } else {
        document.querySelector("#maoding").style.display = "none";
      }
    }, 300);
  };

  cancelPreviewStudentReport = () => {
    this.setState({
      tabIndex: 0,
      visible: false,
    });
  };

  // 下载此报告
  sending = (key) => {
    this.getStudentStudySituationConfigFun();
    this.setState({
      visible: true,
      currentTab: "未发送",
      sendType: key,
    });
  };

  readMsgClick = (type) => {
    this.setState({
      loading: true,
      currentTab: type,
      readMsgVisble: true,
      activeReadId: "",
    });
    readingStatistics({
      examId: this.props.examId,
      type: type == "家长阅读情况" ? 1 : 0,
    }).then((res) => {
      this.setState({
        loading: false,
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

  cancelPreviewLog = () => {
    if (timerid1) {
      clearInterval(timerid1);
    }
    this.setState({
      logVisible: false,
    });
  };

  changeTab = async (value) => {
    // 离开设置报告样式时进行设置报告样式保存操作
    if (value != 0 && this.state.tabIndex == 0) {
      this.setState({ btnLoading: true });
      await saveStudentStudySituationConfig({
        ...this.state.situationConfig,
        examId: this.props.examId,
      }).then((res) => {
        if (!res.status) {
          message.error(res.message);
        }
        this.setState({
          btnLoading: false,
        });
      });
    }

    if (value == 1) {
      let defaultId = this.props.classListData?.length
        ? this.props.classListData[0].groupId
        : "";
      this.changeClass1(defaultId);
    } else if (value == 2) {
      this.setState({
        loading: true,
        searchVal: "",
        selectedStuKeys: [],
      });
      let parameters = {};
      if (this.state.sendType == 1 || this.state.sendType == 2) {
        parameters.type = { 1: 0, 2: 1 }[this.state.sendType];
      }

      this.props
        .dispatch({
          type: "global/getStudentList",
          payload: {
            examId: this.props.examId,
            ...parameters,
          },
        })
        .then((res) => {
          this.setState({ loading: false });
          this.checkedStudentsByType(this.state.currentTab);
        });
    }

    this.setState({
      tabIndex: value,
    });
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

  showLog = () => {
    this.setState({
      loading: true,
    });
    messageLog({
      examId: this.props.examId,
    }).then((res) => {
      this.setState({
        loading: false,
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

  downlodaTemplate = () => {
    this.getStudentStudySituationConfigFun();
    this.setState({
      downloadVisble: true,
    });
  };

  cancelDownload = () => {
    this.setState({
      downloadVisble: false,
    });
  };
  confirmSubRange = async () => {
    let cloneData = JSON.parse(
      JSON.stringify(this.props.studySituationByStudentIdList),
    );
    let moduleIndex = cloneData.moduleModelList.findIndex(
      (item) => item.modelCode === "WRONG_TOPIC_COLLECTION",
    );

    if (moduleIndex !== -1) {
      cloneData.moduleModelList[moduleIndex].modelValue.needViewQuestionIdList =
        this.state.subRangeList;
    }

    this.setState({ loading: true });
    await this.saveData(cloneData);

    this.setState({
      loading: false,
      subRangeVis: false,
      pageLoding: true,
    });
    await this.getDetail();
    this.setState({ pageLoding: false });
  };

  cancelSetSubRange = () => {
    this.setState({
      subRangeVis: false,
    });
  };

  openSubRange = () => {
    this.setState({
      subRangeVis: true,
    });
  };

  subRangeChange = (e, item) => {
    let array = JSON.parse(JSON.stringify(this.state.subRangeList || []));
    if (e.target.checked) {
      array.push(item.questionId);
    } else {
      let index = array.findIndex((id) => id == item.questionId);
      array.splice(index, 1);
    }
    this.setState({
      subRangeList: array,
    });
  };

  changeClass = (value) => {
    this.setState(
      {
        groupId: value,
        pageNo: 1,
      },
      () => {
        this.getStu(value);
      },
    );
  };

  changeClass1 = (id) => {
    this.setState(
      {
        groupId1: id,
        pageNo: 1,
      },
      () => {
        this.getStu1(id);
      },
    );
  };

  changeStudent = (id) => {
    if (id) {
      document.querySelector("#centerContent").scrollTop = 0;

      this.setState({
        studentUserId: id,
        pageLoding: true,
      });
      this.getDetail(id);
    }
  };

  searchStu = (value) => {
    this.setState(
      {
        stuName: value,
      },
      () => {
        this.getStu();
      },
    );
  };

  changeStudent1 = (id) => {
    if (id) {
      if (document.querySelector("#previewRight")) {
        document.querySelector("#previewRight").scrollTop = 0;
      }
      this.setState({
        studentUserId1: id,
      });
      this.getDetail1(id);
    }
  };

  getStu = (value) => {
    this.setState({
      pageLoding: true,
    });
    this.props
      .dispatch({
        type: "home/getTrendStu",
        payload: {
          groupId: value ? value : this.state.groupId,
          searchStudentKeyWord: this.state.stuName,
          examId: this.props.examId,
        },
      })
      .then(() => {
        let defaultStuId = this.props.trendStuList?.length
          ? this.props.trendStuList[0].studentId
          : null;
        if (defaultStuId) {
          this.setState(
            {
              studentUserId: defaultStuId,
            },
            () => {
              this.getDetail(defaultStuId);
            },
          );
        } else {
          this.setState({
            pageLoding: false,
          });
        }
      });
  };

  getStu1 = (id) => {
    queryTrendStu({
      groupId: id ? id : this.state.groupId1,
      searchStudentKeyWord: this.state.stuName,
      examId: this.props.examId,
    }).then((res) => {
      if (res) {
        this.setState({
          trendStuList1: res.content,
        });
        let defaultStuId = res.content?.length
          ? res.content[0]?.studentId
          : null;
        if (defaultStuId) {
          this.setState(
            {
              studentUserId1: defaultStuId,
            },
            () => {
              this.getDetail1(defaultStuId);
            },
          );
        }
      }
    });
  };

  changeView = (value) => {
    this.setState({
      viewType: value,
    });
  };

  getDetail = (id) => {
    return new Promise((resolve, reject) => {
      this.props
        .dispatch({
          type: "home/getStudySituationByStudentId",
          payload: {
            examId: this.props.examId,
            studentUserId: id ? id : this.state.studentUserId,
            isPreview: false,
          },
        })
        .then(() => {
          resolve();
          const { studySituationByStudentIdList } = this.props;
          const { moduleModelList, reportName } = studySituationByStudentIdList;

          //错题范围处理
          let ls = [];

          if (moduleModelList && moduleModelList.length > 0) {
            let moduleIndex = moduleModelList.findIndex(
              (item) => item.modelCode === "WRONG_TOPIC_COLLECTION",
            );

            if (
              moduleIndex !== -1 &&
              moduleModelList &&
              moduleModelList[moduleIndex]?.modelValue?.needViewQuestionIdList
            ) {
              ls =
                moduleModelList[moduleIndex]?.modelValue
                  ?.needViewQuestionIdList;
            } else {
              // 错题范围默认全部选中
              if (
                this.props.data &&
                this.props.data.moduleList &&
                this.props.data.moduleList.length > 0
              ) {
                for (const module of this.props.data.moduleList) {
                  if (module.questionList && module.questionList.length > 0) {
                    for (const question of module.questionList) {
                      ls.push(question.questionId);
                    }
                  }
                }
              }
            }
          }

          this.setState(
            {
              reportName: reportName,
              subRangeList: ls,
              pageLoding: false,
            },
            () => {
              this.info?.initCompenent();
            },
          );

          this.resetImg();
        });
    });
  };

  // 保存
  saveData = (data, callback) => {
    return this.props.dispatch({
      type: "home/postSaveStudySituationStructure",
      payload: data,
    });
  };

  getDetail1 = (id) => {
    this.setState({
      loading: true,
    });
    queryStudySituationByStudentId({
      examId: this.props.examId,
      studentUserId: id ? id : this.state.studentUserId1,
      isPreview: true,
    }).then((res) => {
      this.setState(
        {
          detail: res.content || {},
          modelListLoding: {
            AI_POWERED_LEARNING_ANALYTICS: false,
            // TEACHER_POWERED_LEARNING_ANALYTICS: false,
            WRONG_QUESTIONS_OVERVIEW: false,
            OVERALL_SITUATION: false,
            WRONG_TOPIC_COLLECTION: false,
          },
          loading: false,
        },
        () => {
          this.info1?.initCompenent(true);
        },
      );
      this.resetImg();
    });
  };

  resetImg = () => {
    setTimeout(() => {
      const list = document.querySelectorAll(".img");
      for (const element of list) {
        if (element.naturalWidth) {
          element.width = element.naturalWidth / 2;
        }
      }
    }, 500);
  };

  cancelChange = () => {
    if (this.state.tabIndex == 0) {
      this.setState({
        visible: false,
        tabIndex: 0,
      });
    } else if (this.state.tabIndex == 1) {
      this.changeTab(0);
    } else if (this.state.tabIndex == 2) {
      this.changeTab(1);
    }
  };

  confirmChange = () => {
    if (this.state.tabIndex == 0) {
      this.changeTab(1);
    } else if (this.state.tabIndex == 1) {
      this.changeTab(2);
    } else if (this.state.tabIndex == 2) {
      if (this.state.selectedStuKeys.length === 0) {
        return message.error(trans("pupllAnalyse.selectStudent", "请选择学生"));
      }
      this.setState({ btnLoading: true });

      let resetData = () => {
        this.setState({
          visible: false,
          emptyVisble: true,
          tabIndex: 0,
          btnLoading: false,
        });
      };

      if (this.state.currentTab == "未发送") {
        // 发送消息
        this.props
          .dispatch({
            type: "home/sendParent",
            payload: {
              examId: this.props.examId,
              studentIdList: this.state.selectedStuKeys,
              student: this.state.sendType == 1 ? true : false,
              parent: this.state.sendType == 2 ? true : false,
            },
          })
          .then(() => {
            resetData();
          });
      } else if (this.state.currentTab == "发送成功") {
        // 撤回已经发送的消息
        reRevokeMessage({
          examId: this.props.examId,
          studentIdList: this.state.selectedStuKeys.join(","),
        }).then((res) => {
          resetData();
        });
      } else if (this.state.currentTab == "发送失败") {
        // 重发失败消息
        resendMessage({
          examId: this.props.examId,
          studentIdList: this.state.selectedStuKeys.join(","),
        }).then((res) => {
          resetData();
        });
      }
    }
  };

  modelShowChange = async (e, key) => {
    // console.log(e, index);
    let cloneData = JSON.parse(
      JSON.stringify(this.props.studySituationByStudentIdList),
    );
    for (const item of cloneData.moduleModelList || []) {
      if (item.modelCode == key) {
        item.modelShow = e;
      }
    }
    console.log(cloneData, "cloneData");

    this.setModelLoding(key);
    await this.saveData(cloneData);
    await this.getDetail();
    // 请求成功之后重置模块加载状态
    this.setModelLoding();
    // if (key == 'OVERALL_SITUATION' && e) {
    //   this.info?.handelInitChart()
    // }
  };

  setModelLoding(key) {
    if (key == undefined) {
      this.setState({
        modelListLoding: {
          AI_POWERED_LEARNING_ANALYTICS: false,
          // TEACHER_POWERED_LEARNING_ANALYTICS: false,
          WRONG_QUESTIONS_OVERVIEW: false,
          OVERALL_SITUATION: false,
          WRONG_TOPIC_COLLECTION: false,
        },
      });
    } else {
      let modelListLoding = JSON.parse(
        JSON.stringify(this.state.modelListLoding),
      );
      modelListLoding[key] = true;
      this.setState({
        modelListLoding: modelListLoding,
      });
    }
  }

  downLodaStudy = (studenIds) => {
    if (studenIds.length === 0) {
      return message.error(trans("pupllAnalyse.selectStudent", "请选择学生"));
    }
    let string_ = `${window.location.origin}/api/exam/download/allStudentStudySituation?examId=${this.props.examId}&studentIdList=${studenIds.join(",")}`;
    window.open(string_);
  };

  // 获取模版配置信息
  getStudentStudySituationConfigFun = () => {
    this.setState({
      loading: true,
    });
    getStudentStudySituationConfig({
      examId: this.props.examId,
    }).then((res) => {
      if (res.status) {
        // 如果后端返回null，则错题范围默认全选
        if (!res.content.wrongQuestionRangeList) {
          let array = [];
          if (this.props.data?.moduleList)
            for (const item of this.props.data?.moduleList) {
              if (item?.questionList)
                for (const [index, item1] of item?.questionList.entries()) {
                  if (this.state?.subRangeList?.includes(item1.questionId)) {
                    array.push({
                      questionId: item1.questionId,
                      reAnswerArea:
                        item1.type == 1 ||
                        item1.type == 2 ||
                        item1.type == 3 ||
                        item1.type == 4
                          ? 0
                          : 1,
                    });
                  }
                }
            }
          res.content.wrongQuestionRangeList = array; //后端可能会返回null，影响数组操作
        }

        this.setState({
          situationConfig: res.content,
        });
      } else {
        message.error(res.message);
      }
      this.setState({
        loading: false,
      });
    });
  };

  downloadReport = () => {
    saveStudentStudySituationConfig({
      ...this.state.situationConfig,
      examId: this.props.examId,
    }).then((res) => {
      if (res.status) {
        this.setState({
          downloadVisble: false,
        });
        this.downLodaStudy([this.state.studentUserId]);
      } else {
        message.error(res.message);
      }
    });
  };

  downloadConfigChange = (parameters) => {
    this.setState({
      situationConfig: parameters,
    });
  };

  errorAnalysis = (values, index) => {
    const { studySituationByStudentIdList } = this.props;

    let cloneData = JSON.parse(JSON.stringify(studySituationByStudentIdList));
    const { moduleModelList } = cloneData;

    if (cloneData && moduleModelList?.length) {
      let moduleIndex = moduleModelList.findIndex(
        (item) => item.modelCode === "WRONG_TOPIC_COLLECTION",
      );

      if (
        moduleIndex !== -1 &&
        moduleModelList[moduleIndex]?.modelValue?.objectModelList[moduleIndex]
          ?.objectContentList
      ) {
        cloneData.moduleModelList[
          moduleIndex
        ].modelValue.objectModelList[0].objectContentList[index].errorAnalysis =
          values;
      }
      this.setState({
        pageLoding: true,
      });
      queryStudySituationStructureByStudentId({
        ...cloneData,
        studentId: this.state.studentUserId,
      }).then((res) => {
        if (res.status) {
          this.getDetail();
        } else {
          message.error(res.message);
        }
      });
    }
  };

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
        title: trans("pupllAnalyse.sendTime", "发送时间"),
        dataIndex: "sendTime",
        key: "sendTime",
        align: "left",
        width: 170,
      },
      {
        title: trans("pupllAnalyse.sender", "发送人"),
        dataIndex: "sendUserName",
        key: "sender",
        align: "left",
        width: 100,
      },
      {
        title: trans("pupllAnalyse.sendTarget", "发送对象"),
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
                  {`${record.sendGroupCount}${trans("pupllAnalyse.classCountUnit", "个班级")}`}
                </Popover>
              </span>
              {`｜${record.sendPeopleCount}${trans("pupllAnalyse.personCountUnit", "个")}｜${record.sendType == 0 ? trans("global.student", "学生") : trans("global.parent", "家长")}`}
            </>
          );
        },
      },
      {
        title: trans("pupllAnalyse.channel", "途径"),
        dataIndex: "sendType",
        key: "sendType",
        align: "left",
        width: 70,
        render: (text, record) => {
          return text == 0
            ? trans("pupllAnalyse.siteMessage", "站内信")
            : trans("pupllAnalyse.dingTalk", "钉钉");
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
            return trans("pupllAnalyse.pendingSend", "待发送");
          } else if (text == 1) {
            return (
              <div style={{ display: "flex" }}>
                <Loding />
                &nbsp;{trans("pupllAnalyse.sending", "发送中")}
              </div>
            );
          } else if (text == 2) {
            return trans("pupllAnalyse.sendCompleted", "发送完毕");
          } else if (text == 3) {
            return (
              <div style={{ display: "flex" }}>
                <Loding />
                &nbsp;{trans("pupllAnalyse.withdrawing", "撤回中")}
              </div>
            );
          } else {
            return trans("pupllAnalyse.withdrawCompleted", "撤回完毕");
          }
        },
      },
      {
        title: trans("pupllAnalyse.messageReturn", "消息返回"),
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
                  {trans("pupllAnalyse.pendingSend", "待发送")}：
                  <span>
                    {record.sendStayCount}
                    {trans("global.person", "人")}
                  </span>
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
                    {trans("global.SentSuccessfully", "发送成功")}：
                    {record.sendSuccessCount}
                    {trans("global.person", "人")}
                  </div>
                  <div style={{ textWrap: "nowrap", whiteSpace: "pre" }}>
                    {trans("global.SendingFailed", "发送失败")}：
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
                        {record.sendFailCount}
                        {trans("global.person", "人")}
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
                    {trans("pupllAnalyse.withdrawSuccess", "撤回成功")}：
                    {record.revokeSuccessCount}
                    {trans("global.person", "人")}
                  </div>
                  <div style={{ textWrap: "nowrap", whiteSpace: "pre" }}>
                    {trans("pupllAnalyse.withdrawFailed", "撤回失败")}：
                    <span style={{ color: "#FC491E" }}>
                      {record.revokeFailCount}
                      {trans("global.person", "人")}
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
        title: trans("global.option", "操作"),
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
                      {trans("pupllAnalyse.withdraw", "撤回")}
                    </div>
                  ) : (
                    <div
                      style={{ ...styleObject, color: "rgba(1, 17, 61, 0.5)" }}
                    >
                      {" "}
                      {trans("pupllAnalyse.withdraw", "撤回")}
                    </div>
                  )}
                </>
              ) : (
                <Popover
                  placement="bottom"
                  content={trans(
                    "pupllAnalyse.withdrawUnavailableTip",
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
                      {trans("pupllAnalyse.withdraw", "撤回")}
                    </div>
                  ) : (
                    <div
                      style={{ ...styleObject, color: "rgba(1, 17, 61, 0.5)" }}
                    >
                      {" "}
                      {trans("pupllAnalyse.withdraw", "撤回")}
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
                  {trans("pupllAnalyse.resend", "重发")}
                </div>
              ) : null}
            </div>
          );
        },
      },
    ];
  };

  resendMessageFun = (record) => {
    resendMessage({
      examId: this.props.examId,
      planId: record.planId,
    }).then((res) => {
      this.showLog();
    });
  };
  reRevokeMessageFun = (record) => {
    reRevokeMessage({
      examId: this.props.examId,
      planId: record.planId,
    }).then((res) => {
      this.showLog();
    });
  };

  revokeFun = () => {
    reRevokeMessage({
      examId: this.props.examId,
    }).then((res) => {
      this.showLog();
    });
  };

  resendFun = () => {
    resendMessage({
      examId: this.props.examId,
    }).then((res) => {
      this.showLog();
    });
  };

  titleChange = (e) => {
    this.setState({
      reportName: e.target.value,
    });
  };

  titleEdit = () => {
    if (tid) {
      clearTimeout(tid);
    }
    tid = setTimeout(async () => {
      let cloneData = JSON.parse(
        JSON.stringify(this.props.studySituationByStudentIdList),
      );
      cloneData.reportName = this.state.reportName;
      await this.saveData(cloneData);
      this.getDetail();
    }, 500);
  };
  getColumns1 = () => {
    const readStatusTitleMap = {
      家长阅读情况: trans("pupllAnalyse.familyReadStatus", "家庭阅读情况"),
      学生阅读情况: trans("pupllAnalyse.studentReadStatus", "学生阅读情况"),
    };
    const readStatusTitle =
      readStatusTitleMap[this.state.currentTab] || this.state.currentTab;
    return [
      {
        title: trans("global.order", "序号"),
        dataIndex: "order",
        key: "order",
        render: (text, record, index) => index + 1,
        // width: 60
      },
      {
        title: trans("global.group", "班级"),
        dataIndex: "groupName",
        key: "groupName",
        // width: 130
      },
      {
        title: trans("global.status", "状态"),
        dataIndex: "status",
        key: "status",
        render: (text, record, index) => (
          <div style={{ display: "flex" }}>
            {text == 0
              ? trans("pupllAnalyse.notSent", "未发送")
              : trans("pupllAnalyse.sent", "已发送")}
          </div>
        ),
        // width: 80
      },
      {
        title: trans("pupllAnalyse.studentTotal", "学生总数"),
        dataIndex: "totalPeople",
        key: "totalPeople",
        // width: 100
      },
      {
        title: trans("global.absentStudents", "缺考学生"),
        dataIndex: "absenteesPeople",
        key: "absenteesPeople",
        // width: 100
      },
      {
        title:
          this.state.currentTab == "家长阅读情况"
            ? trans("pupllAnalyse.parentSendCount", "发送家长人数")
            : trans("pupllAnalyse.studentSendCount", "发送学生人数"),
        dataIndex: "sendPeople",
        key: "sendPeople",
        // width: 130
      },
      {
        title: trans("global.SentSuccessfully", "发送成功"),
        dataIndex: "sendSuccess",
        key: "sendSuccess",
        // width: 100
      },
      {
        title: trans("global.SendingFailed", "发送失败"),
        dataIndex: "sendFail",
        key: "sendFail",
        // width: 100
      },
      {
        title: readStatusTitle,
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
              {trans("pupllAnalyse.readFamilies", "已读家庭")}{" "}
              {record.readFamily}{" "}
              {trans("pupllAnalyse.unreadFamilies", "未读家庭")}{" "}
              {record.noReadFamily}
            </div>
          ) : (
            <div
              onClick={() => {
                this.openReadDetail(record, index);
              }}
              className={`${styles.readFamilyBtn} ${this.state.activeReadId === index ? styles.active : ""}`}
            >
              {trans("pupllAnalyse.read", "已读")}
              {record.readFamily}
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
        title: trans("pupllAnalyse.father", "父亲"),
        dataIndex: "fatherRead",
        key: "fatherRead",
        filters: [
          { text: trans("pupllAnalyse.read", "已读"), value: true },
          { text: trans("pupllAnalyse.unread", "未读"), value: false },
        ],
        filteredValue: this.state.filteredInfo.fatherRead || null,
        onFilter: (value, record) => value == Boolean(record.fatherRead),
        ellipsis: true,
        render: (text, record, index) => (
          <div style={{ display: "flex" }}>
            {text ? (
              <span style={{ color: "#04C919" }}>
                {trans("pupllAnalyse.read", "已读")}
              </span>
            ) : (
              <span style={{ color: "rgba(1, 17, 61, 0.5)" }}>
                {trans("pupllAnalyse.unread", "未读")}
              </span>
            )}
          </div>
        ),
      },
      {
        title: trans("pupllAnalyse.mother", "母亲"),
        dataIndex: "matherRead",
        key: "matherRead",
        filters: [
          { text: trans("pupllAnalyse.read", "已读"), value: true },
          { text: trans("pupllAnalyse.unread", "未读"), value: false },
        ],
        filteredValue: this.state.filteredInfo.matherRead || null,
        onFilter: (value, record) => value == Boolean(record.matherRead),
        ellipsis: true,
        render: (text, record, index) => (
          <div style={{ display: "flex" }}>
            {text ? (
              <span style={{ color: "#04C919" }}>
                {trans("pupllAnalyse.read", "已读")}
              </span>
            ) : (
              <span style={{ color: "rgba(1, 17, 61, 0.5)" }}>
                {trans("pupllAnalyse.unread", "未读")}
              </span>
            )}
          </div>
        ),
      },
      {
        title: trans("pupllAnalyse.family", "家庭"),
        dataIndex: "familyRead",
        key: "familyRead",
        filters: [
          { text: trans("pupllAnalyse.read", "已读"), value: true },
          { text: trans("pupllAnalyse.unread", "未读"), value: false },
        ],
        filteredValue: this.state.filteredInfo.familyRead || null,
        onFilter: (value, record) => value == Boolean(record.familyRead),
        ellipsis: true,
        render: (text, record, index) => (
          <div style={{ display: "flex" }}>
            {text ? (
              <span style={{ color: "#04C919" }}>
                {trans("pupllAnalyse.read", "已读")}
              </span>
            ) : (
              <span style={{ color: "rgba(1, 17, 61, 0.5)" }}>
                {trans("pupllAnalyse.unread", "未读")}
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
          { text: trans("pupllAnalyse.read", "已读"), value: true },
          { text: trans("pupllAnalyse.unread", "未读"), value: false },
        ],
        filteredValue: this.state.filteredInfo.studentRead || null,
        onFilter: (value, record) => value == Boolean(record.studentRead),
        ellipsis: true,
        render: (text, record, index) => (
          <div style={{ display: "flex" }}>
            {text ? (
              <span style={{ color: "#04C919" }}>
                {trans("pupllAnalyse.read", "已读")}
              </span>
            ) : (
              <span style={{ color: "rgba(1, 17, 61, 0.5)" }}>
                {trans("pupllAnalyse.unread", "未读")}
              </span>
            )}
          </div>
        ),
      },
    ];
  };
  openReadDetail = (record, index) => {
    this.setState({
      readMagDetailVis: true,
      activeReadId: index,
      readDetail: record,
    });
  };

  handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    this.setState({
      searchText: selectedKeys[0],
    });
  };

  handleReset = (clearFilters) => {
    clearFilters();
    this.setState({ searchText: "" });
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

  handleChange = (pagination, filters, sorter) => {
    console.log("Various parameters", filters);
    this.setState({
      filteredInfo: filters,
    });
  };

  readMsgTabChange = (value) => {
    this.readMsgClick(value);
  };

  // 根据状态名称过滤学生
  filterByStudentName = () => {
    let studentList = this.filterByStudentStatus();
    let list = [];
    if (studentList.length > 0) {
      for (const item of studentList) {
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
    let list = [];
    if (this.props.studentList) {
      for (const item of this.props.studentList) {
        let array = [];
        for (const student of item.studentInfoResponseList) {
          if (this.state.currentTab == "未发送" && student.status == 0) {
            array.push(student);
          } else if (
            this.state.currentTab == "发送失败" &&
            student.status == 2
          ) {
            array.push(student);
          } else if (
            this.state.currentTab == "发送成功" &&
            student.status == 1
          ) {
            array.push(student);
          } else if (this.state.currentTab == "全部") {
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

  tabChange = (key) => {
    this.setState({
      currentTab: key,
    });
    this.superSelector.setState({
      classIndex: 0,
    });
    this.checkedStudentsByType(key);
  };

  checkedStudentsByType = (type) => {
    let array = [];
    if (this.props.studentList) {
      for (const item of this.props.studentList) {
        for (const student of item.studentInfoResponseList) {
          if (type == "未发送" && student.status == 0) {
            array.push(student.studentId);
          } else if (type == "发送失败" && student.status == 2) {
            array.push(student.studentId);
          } else if (type == "发送成功" && student.status == 1) {
            array.push(student.studentId);
          }
        }
      }
    }
    this.setState({
      selectedStuKeys: array,
    });
  };

  importTeacherRemark = () => {
    this.setState({
      importTeacherRemarkVis: true,
    });
  };
  saveImportRemarkChange = () => {
    const formData = new FormData();
    // 添加名字为files的文件数据
    formData.append("examId", this.props.examId);
    // files会作为调用接口时的参数名，需要根据接口修改
    formData.append("file", this.state.fileList[0]);

    request("api/import/exam/studentStudySituation/teacher/comment", {
      method: "POST",
      body: formData,
    })
      .then((res) => {
        if (res.status) {
          this.setState({ importTeacherRemarkVis: false });
          message.success(trans("global.operateSuccess", "操作成功"));
        } else {
          message.error(res.message);
        }
      })
      .catch((error) => {
        message.error(error.message);
      });
  };

  handelMenuData = () => {
    let array = [
      // { title: trans("global.teacherComments", '教师评语'), targetId: 'table_TEACHER_POWERED_LEARNING_ANALYTICS' },
      {
        title: trans("global.wrongAnswers", "错题概览"),
        targetId: "table_WRONG_QUESTIONS_OVERVIEW",
      },
      {
        title: trans("global.overallSummary", "整体概况"),
        targetId: "table_OVERALL_SITUATION",
      },
      {
        title: trans("global.wrongCollection", "错题集合"),
        targetId: "table_WRONG_TOPIC_COLLECTION",
      },
    ];

    if (this.state.AIPoweredLearningAnalytics) {
      array.splice(0, 0, {
        title: trans("global.aiAnalysis", "素养学情综览"),
        targetId: "table_AI_POWERED_LEARNING_ANALYTICS",
      });
    }
    return array;
  };

  regenerateChange = () => {
    const { studentUserId, groupId } = this.state;
    let leftPos = screen.width - 500;
    window.open(
      `${window.location.origin}/exam?studentId=${studentUserId}&groupId=${groupId}&examId=${this.props.examId}&entry_key=10#/aiAssessment`,
    );
  };

  render() {
    const { studySituationByStudentIdList } = this.props;
    const uploadProperties = {
      showUploadList: false,
      onRemove: (file) => {
        this.setState((state) => {
          return {
            fileList: [],
          };
        });
      },
      beforeUpload: (file) => {
        this.setState({
          fileList: [file],
        });
        return false;
      },
    };
    return (
      <Spin
        wrapperClassName={styles.spinContent}
        spinning={this.state.pageLoding}
      >
        <div className={styles.pupllAnalyse}>
          <div
            style={{
              height: "100%",
              width: "1359px",
              display: "flex",
              margin: "0 auto",
            }}
          >
            <div className={styles.leftContent}>
              <div className={styles.selteReport}>
                {trans("global.selectStudentPreviewReport", "选择学生预览报告")}
              </div>
              <div style={{ width: "100%", height: "calc(100% - 50px)" }}>
                <LeftContent
                  trendStuList={this.props.trendStuList}
                  studentUserId={this.state.studentUserId}
                  groupId={this.state.groupId}
                  classListData={this.props.classListData}
                  onChangeStu={this.changeStudent}
                  onChangeClass={this.changeClass}
                  onSearchStu={this.searchStu}
                />
              </div>
            </div>
            <div className={styles.centerWarp} ref={this.centerContentRef}>
              <div className={styles.centerContent} id="centerContent">
                <div className={`${styles.titltName} ${styles.reportNameBox}`}>
                  <EditableText
                    onChange={this.titleChange}
                    onBlur={this.titleEdit}
                    value={this.state.reportName}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    marginBottom: "17px",
                  }}
                >
                  <div
                    style={{ marginRight: "40px" }}
                    className={styles.name_group}
                  >
                    {trans("global.group", "班级")}：
                    {studySituationByStudentIdList?.groupName}
                  </div>
                  <div className={styles.name_group}>
                    {trans("global.fullName", "姓名")}：
                    {studySituationByStudentIdList?.studentName}
                  </div>
                </div>
                <div className={styles.summarize}>
                  {studySituationByStudentIdList?.studentName}
                  {trans("pupllAnalyse.studentGreetingSuffix", "同学：")}
                  <br />
                  {studySituationByStudentIdList?.statisticsTotal}
                </div>

                {this.state.AIPoweredLearningAnalytics ? (
                  <>
                    <div id="table_AI_POWERED_LEARNING_ANALYTICS" />
                    <AiAnalysis
                      regenerate={this.regenerateChange}
                      spinning={
                        this.state.modelListLoding.AI_POWERED_LEARNING_ANALYTICS
                      }
                      onChange={(e) => {
                        this.modelShowChange(
                          e,
                          "AI_POWERED_LEARNING_ANALYTICS",
                        );
                      }}
                      studySituationByStudentIdList={
                        studySituationByStudentIdList || {}
                      }
                      titName={trans("global.aiAnalysis", "素养学情综览")}
                    />
                  </>
                ) : null}
                {/* 
                <div id='table_TEACHER_POWERED_LEARNING_ANALYTICS' />
                <TeacherRemarks
                  spinning={this.state.modelListLoding.TEACHER_POWERED_LEARNING_ANALYTICS}
                  onChange={(e) => { this.modelShowChange(e, 'TEACHER_POWERED_LEARNING_ANALYTICS') }}
                  studySituationByStudentIdList={studySituationByStudentIdList || {}}
                  titName={trans("global.teacherComments", '教师评语')}
                /> */}

                <div id="table_WRONG_QUESTIONS_OVERVIEW" />
                <WrongQuestionView
                  spinning={this.state.modelListLoding.WRONG_QUESTIONS_OVERVIEW}
                  onChange={(e) => {
                    this.modelShowChange(e, "WRONG_QUESTIONS_OVERVIEW");
                  }}
                  studySituationByStudentIdList={
                    studySituationByStudentIdList || {}
                  }
                  titName={trans("global.wrongAnswers", "错题概览")}
                />
                <div id="table_OVERALL_SITUATION" />
                <OverallView
                  examId={this.props.examId}
                  paperId={this.props.paperId}
                  spinning={this.state.modelListLoding.OVERALL_SITUATION}
                  onChange={(e) => {
                    this.modelShowChange(e, "OVERALL_SITUATION");
                  }}
                  studySituationByStudentIdList={
                    studySituationByStudentIdList || {}
                  }
                  titName={trans("global.overallSummary", "整体概况")}
                  getRef={(info) => {
                    this.info = info;
                  }}
                  onImportSuccess={this.getDetail}
                  configData={this.state.situationConfig}
                />
                <div id="table_WRONG_TOPIC_COLLECTION" />
                <WrongQuestionSet
                  analysisQuestionCatalog={this.props.analysisQuestionCatalog}
                  openTwoWay={this.props.openTwoWay}
                  spinning={this.state.modelListLoding.WRONG_TOPIC_COLLECTION}
                  onChange={(e) => {
                    this.modelShowChange(e, "WRONG_TOPIC_COLLECTION");
                  }}
                  studySituationByStudentIdList={
                    studySituationByStudentIdList || {}
                  }
                  openSubRange={this.openSubRange}
                  titName={trans("global.wrongCollection", "错题集合")}
                  onErrorAnalysis={this.errorAnalysis}
                />
              </div>
            </div>
            <div className={styles.rightContent}>
              <div style={{ height: "100%", overflowY: "auto" }}>
                <div className={styles.pupllAnalyseBoxRight}>
                  <div
                    className={styles.mentBtn}
                    onClick={this.importTeacherRemark}
                  >
                    {trans("global.importComment", "导入教师评语")}
                  </div>
                  <div
                    className={styles.mentBtn}
                    onClick={this.downlodaTemplate}
                  >
                    {trans("global.exportTheReport", "下载当前报告")}
                  </div>

                  <div
                    className={styles.mentBtn}
                    onClick={() => {
                      this.sending(0);
                    }}
                  >
                    {trans("global.batchExport", "批量下载")}
                  </div>

                  {this.state.studentStage === null ||
                  this.state.studentStage.includes(this.props.data?.stage) ? (
                    // (typeof (isYungu) !== 'undefined' && !isYungu) || this.props.data?.stage == 3 ?
                    <div
                      className={styles.mentBtn}
                      onClick={() => {
                        this.sending(1);
                      }}
                    >
                      {trans("global.sendToStudents", "发送给学生")}
                    </div>
                  ) : null}

                  {this.state.parentStage === null ||
                  this.state.parentStage.includes(this.props.data?.stage) ? (
                    // typeof (isYungu) !== 'undefined' && !isYungu ?
                    <div
                      className={styles.mentBtn}
                      style={{ marginBottom: "0" }}
                      onClick={() => {
                        this.sending(2);
                      }}
                    >
                      {trans("global.sentToParents", "发送给家长")}
                    </div>
                  ) : null}
                </div>

                {this.state.studentStage === null ||
                this.state.studentStage.includes(this.props.data?.stage) ||
                this.state.parentStage === null ||
                this.state.parentStage.includes(this.props.data?.stage) ? (
                  <div
                    className={styles.pupllAnalyseBoxRight}
                    style={{ marginTop: "12px" }}
                  >
                    <div onClick={this.showLog} className={styles.mentBtn}>
                      {trans("global.reportLog", "发送日志")}
                    </div>
                    <div
                      // 报告阅读统计默认展示家长阅读情况
                      onClick={() => this.readMsgClick("家长阅读情况")}
                      className={styles.mentBtn}
                      style={{ marginBottom: "0" }}
                    >
                      {trans("global.reportViews", "报告阅读统计")}
                    </div>
                  </div>
                ) : null}

                <div className={styles.elevator}>
                  <Directory
                    scrollContainer={this.centerContentRef.current}
                    name={trans("global.viewList", "看板目录")}
                    items={this.handelMenuData()}
                  />
                </div>
                <div
                  id="maoding"
                  style={{
                    position: "absolute",
                    left: "0",
                    bottom: "10px",
                    display: "none",
                  }}
                >
                  <div
                    className={styles.point}
                    onClick={() => {
                      document.querySelector("#centerContent").scrollTop = 0;
                    }}
                  >
                    <Icon
                      type="vertical-align-top"
                      style={{ fontSize: "18px" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
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
                      "pupllAnalyse.parentOnlyReportTip",
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
                  {this.state.tabIndex == 0
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
                    {trans("pupllAnalyse.previewReport", "预览报告")}
                  </MyButton>
                ) : null}

                {this.state.tabIndex == 1 ? (
                  <MyButton
                    sizeclass="smallBtn"
                    typeclass="confirmBtn"
                    onClick={this.confirmChange}
                  >
                    {trans("activity.nextBtn", "下一步")}
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
                    {trans("global.downloadNow", "立即下载")}
                  </MyButton>
                ) : null}

                {this.state.tabIndex == 2 &&
                this.state.currentTab == "发送失败" ? (
                  <Popconfirm
                    title={trans(
                      "pupllAnalyse.confirmSendReport",
                      "您确定发送报告吗？",
                    )}
                    onConfirm={this.confirmChange}
                    onCancel={() => {}}
                    okText={trans("global.ok", "确认")}
                    cancelText={trans("global.cancel", "取消")}
                    overlayClassName={styles.my_popconfirm}
                  >
                    <MyButton
                      loading={this.state.btnLoading}
                      sizeclass="smallBtn"
                      typeclass="confirmBtn"
                    >
                      {trans("pupllAnalyse.resend", "重发")}
                    </MyButton>
                  </Popconfirm>
                ) : null}

                {this.state.tabIndex == 2 &&
                this.state.currentTab == "发送成功" ? (
                  <Popconfirm
                    title={trans(
                      "pupllAnalyse.confirmWithdrawSelectedReports",
                      "您确定要撤回选中的人的学情报告吗？",
                    )}
                    onConfirm={this.confirmChange}
                    onCancel={() => {}}
                    okText={trans("global.ok", "确认")}
                    cancelText={trans("global.cancel", "取消")}
                    overlayClassName={styles.my_popconfirm}
                  >
                    <MyButton
                      loading={this.state.btnLoading}
                      sizeclass="smallBtn"
                      typeclass="confirmBtn"
                    >
                      {trans("pupllAnalyse.withdrawReport", "撤回报告")}
                    </MyButton>
                  </Popconfirm>
                ) : null}

                {this.state.tabIndex == 2 &&
                this.state.currentTab == "未发送" ? (
                  <Popconfirm
                    title={trans(
                      "pupllAnalyse.confirmSendReport",
                      "您确定发送报告吗？",
                    )}
                    onConfirm={this.confirmChange}
                    onCancel={() => {}}
                    okText={trans("global.ok", "确认")}
                    cancelText={trans("global.cancel", "取消")}
                    overlayClassName={styles.my_popconfirm}
                  >
                    <MyButton
                      loading={this.state.btnLoading}
                      sizeclass="smallBtn"
                      typeclass="confirmBtn"
                    >
                      {trans("pupllAnalyse.confirmSend", "确认发送")}
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
                "发送给学生",
                trans("global.sentToParents", "发送给家长"),
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
                      tab: trans("global.SetTheReportStyle", "设置样式报告"),
                      key: 0,
                    },
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
                {this.state.tabIndex == 0 ? (
                  <div
                    className={styles.formWarp}
                    style={{ paddingTop: "12px" }}
                  >
                    <Spin
                      wrapperClassName={styles.spinContent}
                      spinning={this.state.loading}
                    >
                      <DownloadConfig
                        similarPaperPermission={
                          this.state.similarPaperPermission
                        }
                        AIPoweredLearningAnalytics={
                          this.state.AIPoweredLearningAnalytics
                        }
                        subRangeList={this.state.subRangeList} //subRangeList:错题范围，不在错题范围中勾选的题目，不进行展示
                        onConfigChange={this.downloadConfigChange}
                        modalList={this.props.data?.moduleList}
                        configData={this.state.situationConfig}
                        studySituationByStudentIdList={
                          studySituationByStudentIdList
                        }
                      />
                    </Spin>
                  </div>
                ) : null}
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
                        <div
                          style={{
                            height: "44px",
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <MyTabs
                            width="80px"
                            height="26px"
                            data={[
                              { tab: "网页版", key: 1 },
                              { tab: "打印版", key: 2 },
                            ]}
                            onChange={(value) => {
                              this.changeView(value.key);
                            }}
                            activeKey={this.state.viewType}
                          />
                        </div>
                        <div
                          style={{ height: "calc(100% - 44px)", width: "100%" }}
                        >
                          <LeftContent
                            trendStuList={this.state.trendStuList1}
                            studentUserId={this.state.studentUserId1}
                            groupId={this.state.groupId1}
                            classListData={this.props.classListData}
                            onChangeStu={this.changeStudent1}
                            onChangeClass={this.changeClass1}
                          />
                        </div>
                      </div>
                      {this.state.viewType == 2 ? (
                        <div style={{ margin: "auto", textAlign: "center" }}>
                          <div className={styles.remark}>
                            {" "}
                            {trans(
                              "pupllAnalyse.downloadReportToPreview",
                              "请将报告下载到本地预览",
                            )}{" "}
                          </div>
                          <MyButton
                            sizeclass="smallBtn"
                            typeclass="confirmBtn"
                            onClick={() => {
                              this.downLodaStudy([this.state.studentUserId1]);
                            }}
                          >
                            {trans("global.downloadNow", "立即下载")}
                          </MyButton>
                        </div>
                      ) : (
                        <div
                          className={styles.previewRight}
                          id="previewRight"
                          style={{
                            transformOrigin: "0 0",
                            transform: "scale(0.62)",
                          }}
                        >
                          <div
                            style={{
                              padding: "0 12px",
                              backgroundColor: "#fff",
                            }}
                          >
                            <div className={styles.centerContent}>
                              <div className={`${styles.titltName}`}>
                                {studySituationByStudentIdList?.reportName}
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "center",
                                  marginBottom: "17px",
                                }}
                              >
                                <div
                                  style={{ marginRight: "40px" }}
                                  className={styles.name_group}
                                >
                                  {trans("global.group", "班级")}：
                                  {this.state.detail?.groupName}
                                </div>
                                <div className={styles.name_group}>
                                  {trans("global.fullName", "姓名")}：
                                  {this.state.detail?.studentName}
                                </div>
                              </div>
                              <div className={styles.summarize}>
                                {this.state.detail?.studentName}
                                {trans(
                                  "pupllAnalyse.studentGreetingSuffix",
                                  "同学：",
                                )}
                                <br />
                                {this.state.detail?.statisticsTotal}
                              </div>
                              {this.state.situationConfig
                                .aiPoweredLearningAnalytics ? (
                                <AiAnalysis
                                  spinning={
                                    this.state.modelListLoding
                                      .AI_POWERED_LEARNING_ANALYTICS
                                  }
                                  studySituationByStudentIdList={
                                    this.state.detail || {}
                                  }
                                  titName={trans(
                                    "global.aiAnalysis",
                                    "素养学情综览",
                                  )}
                                  edit={false}
                                />
                              ) : null}

                              {/* {
                                this.state.situationConfig.teacherPoweredLearningAnalytics ?
                                  <TeacherRemarks
                                    spinning={this.state.modelListLoding.TEACHER_POWERED_LEARNING_ANALYTICS}
                                    studySituationByStudentIdList={this.state.detail || {}}
                                    titName={trans("global.teacherComments", '教师评语')}
                                    edit={false}
                                  /> : null
                              } */}

                              <WrongQuestionView
                                spinning={
                                  this.state.modelListLoding
                                    .WRONG_QUESTIONS_OVERVIEW
                                }
                                edit={false}
                                studySituationByStudentIdList={
                                  this.state.detail
                                }
                                titName={trans(
                                  "global.wrongAnswers",
                                  "错题概览",
                                )}
                              />
                              <OverallView
                                examId={this.props.examId}
                                paperId={this.props.paperId}
                                spinning={
                                  this.state.modelListLoding.OVERALL_SITUATION
                                }
                                edit={false}
                                studySituationByStudentIdList={
                                  this.state.detail
                                }
                                titName={trans(
                                  "global.overallSummary",
                                  "整体概况",
                                )}
                                getRef={(info1) => {
                                  this.info1 = info1;
                                }}
                                onImportSuccess={this.getDetail1}
                                configData={this.state.situationConfig}
                              />
                              <WrongQuestionSet
                                analysisQuestionCatalog={
                                  this.props.analysisQuestionCatalog
                                }
                                spinning={
                                  this.state.modelListLoding
                                    .WRONG_TOPIC_COLLECTION
                                }
                                edit={false}
                                studySituationByStudentIdList={
                                  this.state.detail
                                }
                                openSubRange={this.openSubRange}
                                configData={this.state.situationConfig}
                                titName={trans(
                                  "global.wrongCollection",
                                  "错题集合",
                                )}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </Spin>
                ) : null}
                {this.state.tabIndex == 2 ? (
                  <div className={styles.selectContent}>
                    <div className={styles.tabsBox}>
                      {["未发送", "发送失败", "发送成功", "全部"].map(
                        (item) => (
                          <div
                            className={`${styles.tab} 
                            ${item == "发送失败" ? styles.error : ""} 
                            ${this.state.currentTab == item ? styles.active : ""}`}
                            onClick={() => {
                              this.tabChange(item);
                            }}
                            key={item}
                          >
                            {
                              {
                                未发送: trans("pupllAnalyse.notSent", "未发送"),
                                发送失败: trans(
                                  "global.SendingFailed",
                                  "发送失败",
                                ),
                                发送成功: trans(
                                  "global.SentSuccessfully",
                                  "发送成功",
                                ),
                                全部: trans("global.all", "全部"),
                              }[item]
                            }
                          </div>
                        ),
                      )}
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
                    "pupllAnalyse.confirmWithdrawAllReports",
                    "确认要撤回全部的学情报告吗？",
                  )}
                  onConfirm={this.revokeFun}
                  onCancel={() => {}}
                  okText={trans("global.ok", "确认")}
                  cancelText={trans("global.cancel", "取消")}
                  overlayClassName={styles.my_popconfirm}
                >
                  <div className={`${styles.btn} ${styles.warning}`}>
                    {trans("pupllAnalyse.withdrawAllReports", "撤回全部报告")}
                  </div>
                </Popconfirm>
                <Popconfirm
                  title={trans(
                    "pupllAnalyse.confirmResendFailedReports",
                    "确认要重发所有失败的学情报告吗？",
                  )}
                  onConfirm={this.resendFun}
                  onCancel={() => {}}
                  okText={trans("global.ok", "确认")}
                  cancelText={trans("global.cancel", "取消")}
                  overlayClassName={styles.my_popconfirm}
                >
                  <div className={`${styles.btn} ${styles.confirm}`}>
                    {trans(
                      "pupllAnalyse.resendFailedReports",
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
                  {trans("pupllAnalyse.sendLog", "发送日志")}
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
                loading={this.state.loading}
                dataSource={this.state.messageLogData}
                pagination={false}
                columns={this.getColumns()}
                scroll={{ y: 449 }}
              />
            </>
          }
        />

        {/* 下载此报告 */}
        <ComnModal
          options={{
            visible: this.state.downloadVisble,
            footer: (
              <div className={styles.footerBox}>
                <div
                  className={`${styles.btn} ${styles.cancel}`}
                  onClick={() => {
                    this.setState({ downloadVisble: false });
                  }}
                >
                  {trans("global.cancel", "取消")}
                </div>
                <div
                  className={`${styles.btn} ${styles.confirm}`}
                  onClick={this.downloadReport}
                >
                  {trans("global.downloadNow", "立即下载")}
                </div>
              </div>
            ),
            onCancel: this.cancelDownload,
            title: trans("pupllAnalyse.reportDownloadConfig", "报告下载配置"),
            width: 900,
            className: styles.downlodaTemplateModal,
            centered: true,
          }}
          innerContent={
            <div
              style={{ width: "100%", height: "450px", overflowY: "auto" }}
              className={styles.scrollbar}
            >
              <Spin
                wrapperClassName={styles.spinContent}
                spinning={this.state.loading}
              >
                <DownloadConfig
                  similarPaperPermission={this.state.similarPaperPermission}
                  AIPoweredLearningAnalytics={
                    this.state.AIPoweredLearningAnalytics
                  }
                  onConfigChange={this.downloadConfigChange}
                  subRangeList={this.state.subRangeList} //错题范围，不在错题范围中勾选的题目，不进行展示
                  modalList={this.props.data?.moduleList}
                  configData={this.state.situationConfig}
                  studySituationByStudentIdList={studySituationByStudentIdList}
                />
              </Spin>
            </div>
          }
        />

        {/* 设置错题范围 */}
        <ComnModal
          options={{
            title: trans("global.setWrongQuestionRange", "设置错题范围"),
            visible: this.state.subRangeVis,
            width: 800,
            centered: true,
            onOk: this.confirmSubRange,
            onCancel: this.cancelSetSubRange,
            okButtonProps: {
              loading: this.state.loading,
            },
          }}
          innerContent={
            <>
              <div className={styles.subjectRanRemark}>
                <Icon
                  theme="filled"
                  type="info-circle"
                  style={{ color: "#4ECEF9", margin: "0 12px 0 16px" }}
                />
                {trans(
                  "global.uncheckedQuestionsHiddenForAllStudents",
                  "不勾选的题目在所有学生的错题中统一不显示",
                )}
                。
              </div>
              {this.props.data &&
              this.props.data.moduleList &&
              this.props.data.moduleList.length > 0
                ? this.props.data.moduleList.map((item, index) => (
                    <div style={{ marginBottom: "10px" }} key={item.moduleName}>
                      <div style={{ marginBottom: "15px" }}>
                        {convertToChineseNumber(index + 1)}、{item.moduleName}
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap" }}>
                        {item.questionList && item.questionList.length > 0
                          ? item.questionList.map((it, ind) => (
                              <Checkbox
                                key={it.questionId}
                                style={{ marginBottom: "5px", marginLeft: "0" }}
                                onChange={(e) => {
                                  this.subRangeChange(e, it);
                                }}
                                checked={
                                  this.state.subRangeList
                                    ? this.state.subRangeList.includes(
                                        it.questionId,
                                      )
                                    : false
                                }
                              >
                                {it.questionSerialNumber} &nbsp;&nbsp;&nbsp;
                              </Checkbox>
                            ))
                          : null}
                      </div>
                    </div>
                  ))
                : null}
            </>
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
                  {trans("pupllAnalyse.reportProcessingPrefix", "报告")}
                  {this.state.currentTab == "发送成功"
                    ? trans("pupllAnalyse.withdraw", "撤回")
                    : trans("pupllAnalyse.send", "发送")}
                  {trans("pupllAnalyse.processingSuffix", "中......")}
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
                {trans("global.operateSuccess", "操作成功")}
              </div>

              {this.state.sendType == 1 &&
              this.state.currentTab !== "发送成功" ? (
                <div className={styles.text}>
                  {trans(
                    "pupllAnalyse.studentReceiveBySiteMessage",
                    "学生将通过站内信的方式收到此次报告",
                  )}
                </div>
              ) : null}

              {this.state.sendType == 0 &&
              this.state.currentTab !== "发送成功" ? (
                <div className={styles.text}>
                  {trans(
                    "pupllAnalyse.parentReceiveByDingTalk",
                    "家长将通过钉钉消息通知收到此次报告",
                  )}
                </div>
              ) : null}

              <div style={{ textAlign: "center", marginTop: "58px" }}>
                <MyButton
                  style={{ marginRight: "10px" }}
                  sizeclass="smallBtn"
                  typeclass="cancelBtn"
                  onClick={this.showLog}
                >
                  {trans("pupllAnalyse.viewSendLog", "查看发送日志")}
                </MyButton>
                <MyButton
                  sizeclass="smallBtn"
                  typeclass="cancelBtn"
                  onClick={() => {
                    this.setState({ emptyVisble: false });
                  }}
                >
                  {trans("global.close", "关闭")}
                </MyButton>
              </div>
            </div>
          }
        />

        {/* 阅读统计 */}
        <ComnModal
          options={{
            title: (
              <div className={styles.modalTabsBox}>
                {["家长阅读情况", "学生阅读情况"].map((item) => (
                  <div
                    className={`${styles.tab}  ${this.state.currentTab == item ? styles.active : ""}`}
                    onClick={() => this.readMsgTabChange(item)}
                    key={item}
                  >
                    {
                      {
                        家长阅读情况: trans(
                          "pupllAnalyse.parentReadStatus",
                          "家长阅读情况",
                        ),
                        学生阅读情况: trans(
                          "pupllAnalyse.studentReadStatus",
                          "学生阅读情况",
                        ),
                      }[item]
                    }
                  </div>
                ))}
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
                loading={this.state.loading}
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

        {/* 导入教师评语 */}
        <ComnModal
          options={{
            title: trans("global.importTeacherRemark", "导入教师评语"),
            visible: this.state.importTeacherRemarkVis,
            width: 423,
            centered: true,
            onOk: this.saveImportRemarkChange,
            onCancel: () => {
              this.setState({ importTeacherRemarkVis: false });
            },
            // className: `${styles.readMsgModal} ${styles.heightClass}`,
          }}
          innerContent={
            <div className={styles.readMsgContent}>
              <div>
                <div style={{ width: "100%", marginBottom: "20px" }}>
                  <span style={{ color: "rgba(1,17,61,0.85)" }}>
                    ①{" "}
                    {trans(
                      "pupllAnalyse.downloadCommentTemplate",
                      "下载评语填写模版",
                    )}
                  </span>
                  <div style={{ marginTop: "10px" }}>
                    <MyButton
                      sizeclass="smallBtn"
                      typeclass="minor"
                      onClick={() => {
                        window.open(
                          `${window.location.origin}/api/export/exam/studentStudySituation/teacher/comment?examId=${this.props.examId}`,
                        );
                      }}
                      style={{ marginRight: "10px" }}
                    >
                      {trans("global.downloadTemplate", "下载模板")}
                    </MyButton>
                    <MyButton
                      sizeclass="smallBtn"
                      typeclass="commonBtn"
                      disabled
                      onClick={() => {
                        window.open(
                          `${window.location.origin}/api/exam/get/studentStudySituationConfig?teacherPoweredLearningAnalytics=true`,
                        );
                      }}
                      style={{ marginRight: "10px" }}
                    >
                      {trans(
                        "pupllAnalyse.downloadTeacherCommentTemplate",
                        "下载教师评语模版",
                      )}
                    </MyButton>
                    <MyButton
                      sizeclass="smallBtn"
                      typeclass="commonBtn"
                      disabled
                      onClick={() => {
                        window.open(
                          `${window.location.origin}/api/exam/get/studentStudySituationConfig?aiPoweredLearningAnalytics=true`,
                        );
                      }}
                    >
                      {trans(
                        "pupllAnalyse.downloadAiCommentTemplate",
                        "下载AI评语模版",
                      )}
                    </MyButton>
                  </div>
                </div>
                <div style={{ width: "100%", marginBottom: "10px" }}>
                  <span style={{ color: "rgba(1,17,61,0.85)" }}>
                    ②{" "}
                    {trans(
                      "global.uploadTheCompletedImportInformationForm",
                      "上传填写好的导入信息表",
                    )}
                  </span>
                  <span style={{ marginLeft: "10px" }}>
                    <Upload {...uploadProperties}>
                      <MyButton sizeclass="smallBtn" typeclass="minor">
                        {trans("pupllAnalyse.uploadTemplate", "上传模版")}
                      </MyButton>
                    </Upload>
                  </span>
                </div>
                <div>
                  {this.state.fileList && this.state.fileList.length > 0 ? (
                    <div
                      key={this.state.fileList[0].uid}
                      style={{
                        position: "relative",
                        border: "1px solid rgba(1, 17, 61, 0.12)",
                        borderRadius: "7px",
                        padding: "7px",
                        lineHeight: "22px",
                        color: "rgba(1,17,61,0.85)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <div
                          style={{
                            width: "25px",
                            marginLeft: "10px",
                            height: "22px",
                          }}
                        >
                          <img
                            src={excelLogo}
                            style={{ width: "100%", height: "100%" }}
                          />
                        </div>
                        <div
                          style={{
                            width: "280px",
                            marginLeft: "10px",
                            height: "22px",
                            textAlign: "left",
                          }}
                        >
                          <HoverTooltip
                            text={this.state.fileList[0].name}
                            maxWidth={"100%"}
                          />
                        </div>
                      </div>
                      <div
                        style={{
                          position: "absolute",
                          top: "-10px",
                          right: "-8px",
                        }}
                        onClick={() => {
                          this.setState({ fileList: [] });
                        }}
                      >
                        <i
                          style={{ fontSize: "24px" }}
                          className={styles.iconfont}
                        >
                          &#xe6cd;
                        </i>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          }
        />
      </Spin>
    );
  }
}

export default connect(({ home, global, publishToStudent }) => ({
  studySituationByStudentIdList: home.studySituationByStudentIdList,
  trendStuList: home.trendStuList,
  classListData: home.classListData,
  studentList: global.studentList,
}))(PupllAnalyse);
