//新闻
import React, { Fragment, PureComponent } from "react";
import {
  DatePicker,
  Dropdown,
  Icon,
  Input,
  Menu,
  message,
  Modal,
  Pagination,
  Progress,
  Select,
  Table,
  TimePicker,
  Tooltip,
} from "antd";
import { connect } from "dva";
import { Link, routerRedux } from "dva/router";
import moment from "moment";

import ComnModal from "components/ComnModal";

import noTask from "../../assets/noTask.png";
import { CuModal } from "../../components/Custom";
import ExamSetting from "../../components/ExamSetting/index";
import ModalDotMatrixPen from "../../components/ModalDotMatrixPen";
import SelectStu from "../../components/ModalDotMatrixPen/SelectStu";
import ModalMachineTest from "../../components/ModalMachineTest";
import ModalOnlineTest from "../../components/ModalOnlineTest";
import ScoreImportModal from "../../components/ScoreImportModal";
import TimedTask from "../../components/TimedTask";
import { getExamModule } from "../../services/exam";
import { locale, trans } from "../../utils/i18n";
import {
  downloadExamPaperPdf,
  resolvePaperDownloadTarget,
} from "../PaperEditor/paperPdf";
import RevisedModal from "../Revised/index";

import styles from "./index.module.less";
const language = locale() == "en" ? false : true;

const { Option } = Select;
const { Search, TextArea } = Input;
const { Column } = Table;
let date = new Date();
let month = date.getMonth() + 1; //当前月
let year = date.getFullYear(); //当前年(4位)
let day = date.getDate();
class ExamAnalysis extends PureComponent {
  constructor(properties) {
    super(properties);
    this.url = window.location.hash;
    this.pathMatch = this.url.split("/");
    this.paperId =
      this.pathMatch && this.pathMatch[2]
        ? Number.parseInt(this.pathMatch[2])
        : null;
    this.tabId =
      this.pathMatch && this.pathMatch[3]
        ? Number.parseInt(this.pathMatch[3])
        : 1;
    this.state = {
      cur: 1,
      scrollTop: 0,
      stageId: 0,
      courseId: 0,
      gradeId: 0,
      status: 2,
      IconFont: null,
      viewData: {},
      testName: "",
      publishStatus: false,
      exampleId: null,
      examTestId: null,
      examName: "",
      pageNo: 1,
      pageSize: 50,
      examVisble: false,
      defaultSemester: {},
      revisedModal: false, //订正数据modal
      examId: undefined, //试卷id
      initiateTestModal: false,
      testTitle: 1,
      // testTitle: 2,
      initiatingSteps: 1, // 步骤
      examTestName: "", // 测验名称
      dailyClassesSwitch: false, //日课开关
      evaluateChecked: false, //评价开关
      totalScoreEvaluate: "", //评价总分
      testDescription: "", //测验说明
      dataLine: "2022-8-2", //年月
      dataTime: "22: 00", //时分
      stuName: "", //搜索学生姓名
      completeStep: false,
      group: [], // 班级
      classList: [],
      stuNo: 3, //学号
      fileList: [],
      uploadType: 1,
      allGroupsChecked: false,
      historicalVersion: false,
      uploadSucceeded: false, //上传成功
      examType1: null,
      chooseCourseId: null, //课程
      gradeIdModal: null, // 年级
      subjedtIdModal: null, //学科
      selectTestId: null, //试卷
      dayClassesId: null, // 日课
      evaluationItemName: null,
      switchClassesId: 0,
      classIndex: null, //选中班级
      stuIdList: [], //学生
      gradeModalId: null,
      examIdModal: null,
      taskId: null,
      isHide: false,
      disabledStu: [],
      publishType: "0", //0：立即发布 1：定时发布
      dataLineTiming: "2022-12-12", //定时年月日
      dataTimeTiming: "17: 00", //定时时间
      isExamTitle: false,
      checkExam: 0,
      visSetTiming: false,
      scoreStuChecked: true,
      isLengthAnswer: false,
      lengthAnswerNum: null,
      isAnswer: 1,
      evaluationDimensionId: null,
      evaluativeItemsId: null,
      isStudentSelest: false,
      isTestSettings: false,
      isExamEdit: false,
      isProportionDimensions: 1,
      proportionDimensions: null,
      evaluationCategoryType: false,
      creatEvaluationItemId: null,
      corrAnsVis: true,
      studentDisplayId: null,
      machineTestoptions: {
        visible: false,
        title: trans("global.editTestSettings", "编辑测验设置"),
        wrapClassName: "modalMachineTest",
        width: 700,
        onOk: () => {
          const { machineTestoptions } = this.state;
          this.setState({
            machineTestoptions: {
              ...machineTestoptions,
              visible: false,
            },
          });
        },
        onCancel: () => {
          const { machineTestoptions } = this.state;
          this.setState({
            machineTestoptions: {
              ...machineTestoptions,
              visible: false,
            },
          });
        },
      },
      isScoreImportModal: false,
      modalMachineTestProps: {
        paperId: null,
      },
      modalOnlineTestOptions: {
        visible: false,
        width: 700,
        title: trans("global.editTestSettings", "编辑测验设置"),
        onCancel: () => {
          const { modalOnlineTestOptions } = this.state;
          this.setState({
            modalOnlineTestOptions: {
              ...modalOnlineTestOptions,
              visible: false,
            },
          });
        },
        onOk: () => {
          const { modalOnlineTestOptions } = this.state;
          this.setState({
            modalOnlineTestOptions: {
              ...modalOnlineTestOptions,
              visible: false,
            },
          });
        },
      },
      modalDotMatrixPenProps: {
        visible: false,
        width: 700,
        title: trans("global.editTestSettings", "编辑测验设置"),
        onCancel: () => {
          const { modalDotMatrixPenProps } = this.state;
          this.setState({
            modalDotMatrixPenProps: {
              ...modalDotMatrixPenProps,
              visible: false,
            },
          });
        },
        onOk: () => {
          const { modalDotMatrixPenProps } = this.state;
          this.setState({
            modalDotMatrixPenProps: {
              ...modalDotMatrixPenProps,
              visible: false,
            },
          });
        },
      },
    };
    this.page = 1;
    this.pageSize = 50;
    this.getCardStatus = true;
  }

  componentWillUnmount() {
    this.props.dispatch({
      type: "global/clearSearch",
    });
    this.props.dispatch({
      type: "home/changeSearch",
      payload: {
        typeValue: 0,
      },
    });
  }

  componentDidMount() {
    this.props
      .dispatch({
        type: "home/getOptions",
      })
      .then(() => {
        const { examOptions } = this.props;
        let ind = 0;
        if (examOptions && examOptions.length > 0) {
          examOptions.map((item, index) => {
            if (item.current) {
              ind = index;
            }
          });
        }
        this.setState(
          {
            defaultSemester:
              examOptions && examOptions.length > 0 ? examOptions[ind] : {},
            stageId:
              examOptions && examOptions.length > 0
                ? examOptions[ind].semesterId
                : 0,
          },
          () => {
            this.getPage();
          },
        );
      });
    const IconFonts = Icon.createFromIconfontCN({
      scriptUrl: "//at.alicdn.com/t/font_789461_ovr9ifg67hb.js",
    });
    this.setState({
      IconFont: IconFonts,
      dataLine: `${year}-${month}-${day}`,
      dataLineTiming: `${year}-${month}-${day}`,
    });

    if (this.paperId) {
      this.onlineQuizClick();
      this.changeSelectTest1(this.paperId);
      this.props
        .dispatch({
          type: "home/getPaperInfo",
          payload: {
            paperId: this.paperId,
          },
        })
        .then(() => {
          const { paperInfo, paperList } = this.props;
          console.log(paperInfo, "333");
          if (paperInfo.subjectId) {
            this.props
              .dispatch({
                type: "publishToStudent/getCourseList",
                payload: {
                  // gradeIdList: [this.state.gradeModalId],
                  subjectId: paperInfo.subjectId,
                },
              })
              .then(() => {
                if (this.props.courseList.length == 1) {
                  this.setState({
                    chooseCourseId: this.props.courseList[0].courseId,
                  });
                }
              });
          }
          this.setState({
            selectTestId: this.paperId,
            // totalScoreEvaluate: paperInfo.totalScore,
            examTestName: paperInfo.examPaperName,
            examType1: paperInfo.examType,
            // gradeModalId: gareId,
            subjedtIdModal: paperInfo.subjectId,
          });
        });
    }
    this.getPermission();

    this.props.dispatch({
      type: "home/getAllTestSubject",
      payload: this.state.gradeId,
    });
  }

  getPermission = () => {
    // 获取校级配置，决定列表是否拥有平行卷操作权限
    getExamModule().then((res) => {
      if (res.status) {
        if (res.content) {
          for (const item of res.content) {
            if (
              item.groupCode == "PRECISION_TEACHING" &&
              item.childModuleCodeList &&
              item.childModuleCodeList.includes("DianZhenBi")
            ) {
              this.setState({
                DianZhenBi: true,
              });
            }
          }
        }
      } else {
        message.error(res.message);
      }
    });
  };

  /**
   * 判断当前测验列表是否处于招生试卷模式。
   * @returns {boolean} true 表示列表请求需要透传招生试卷参数
   */
  isRecruitPaperMode = () => {
    // 列表页是 hash 路由，优先读取 hash query，兼容 #/examAnalysis?queryZhaoShengPaper=true。
    const hash = window.location.hash || "";
    const hashQuery = hash.includes("?") ? hash.split("?")[1] : "";
    const hashParameters = new URLSearchParams(hashQuery);
    if (hashParameters.get("queryZhaoShengPaper") === "true") {
      return true;
    }
    // 兼容外层 search query 传参，避免不同跳转写法下参数丢失。
    const searchParameters = new URLSearchParams(window.location.search || "");
    return searchParameters.get("queryZhaoShengPaper") === "true";
  };

  /**
   * 计算从测验列表进入详情页时的默认页签。
   * @param {object} item 当前测验列表项
   * @returns {number} 招生试卷固定进入学生分析页，其他测验沿用原有默认规则
   */
  getDefaultDataAnalysisTab = (item) => {
    // 招生试卷详情页需要直接落到保留可用的学生分析页，避免先进入受限页签再被重定向。
    if (this.isRecruitPaperMode()) {
      return 4;
    }
    return item && item.examSourceType == 3 ? 1 : 2;
  };

  onShowSizeChange = (current, pageSize) => {
    this.setState(
      {
        pageNo: 1,
        pageSize,
      },
      () => {
        this.getPage();
      },
    );
  };

  changeNo = (value, pageSize) => {
    this.setState(
      {
        pageNo: value,
      },
      () => {
        this.getPage();
      },
    );
  };

  getPage = () => {
    this.props
      .dispatch({
        type: "home/getExam",
        payload: {
          pageNo: this.state.pageNo,
          limit: this.state.pageSize,
          examName: this.state.examName,
          examTypeCode: this.props.typeValue === 0 ? "" : this.props.typeValue,
          subjectId: this.state.courseId === 0 ? "" : this.state.courseId,
          semesterId: this.state.stageId === 0 ? "" : this.state.stageId,
          gradeId: this.state.gradeId === 0 ? "" : this.state.gradeId,
          campusOrMy: this.state.checkExam,
          ...(this.isRecruitPaperMode()
            ? {
                queryZhaoShengPaper: true,
              }
            : {}),
        },
      })
      .then(() => {
        this.getCardStatus = true;
        this.page += 1;
      });
  };

  onSearch = (value) => {
    this.getPage();
  };

  changeSearch = (e) => {
    this.setState({
      examName: e.target.value,
    });
  };

  changeGrade = (value) => {
    this.props.dispatch({
      type: "home/getAllTestSubject",
      payload: {
        gradeId: value,
      },
    });
    this.setState(
      {
        gradeId: value,
        scrollTop: 0,
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
      newSemester = examOptions.find((item) => item.semesterId === value) || {};
    }

    this.setState(
      {
        stageId: value,
        scrollTop: 0,
        defaultSemester: newSemester,
      },
      () => {
        this.props
          .dispatch({
            type: "home/changeSearch",
            payload: {
              typeValue: 0,
            },
          })
          .then(() => {
            this.page = 1;
            this.getPage();
          });
        this.props.dispatch({
          type: "global/getGrade",
          payload: {
            stageId: this.state.stageId,
          },
        });
      },
    );

    const { gradeList, subjectList } = newSemester;
    const { gradeId, courseId } = this.state;

    if (gradeList) {
      let gradeIndex = gradeList.findIndex((item) => item.gradeId == gradeId);
      if (gradeIndex == -1) {
        this.setState({
          gradeId: 0,
        });
      }
    }

    if (subjectList) {
      let courseIdIndex = subjectList.findIndex(
        (item) => item.subjectId == courseId,
      );
      if (courseIdIndex == -1) {
        this.setState({
          courseId: 0,
        });
      }
    }
  };

  changeScoreVisible = (index) => {
    let state = Object.assign({}, this.state);
    console.log(index, "bb");
    state[`itemViesble${index}`] = !state[`itemViesble${index}`];
    this.setState({
      ...state,
    });
  };

  changeType = (value) => {
    this.props
      .dispatch({
        type: "home/changeSearch",
        payload: {
          typeValue: value,
        },
      })
      .then(() => {
        this.page = 1;
        this.setState({
          scrollTop: 0,
        });
        this.getPage();
      });
  };

  changeCourse = (value) => {
    this.setState(
      {
        courseId: value,
        scrollTop: 0,
      },
      () => {
        this.page = 1;
        this.getPage();
      },
    );
  };

  deleteTest = (item) => {
    this.props
      .dispatch({
        type: "home/examDelete",
        payload: {
          examId: item.examId,
        },
      })
      .then(() => {
        this.changeScoreVisible(item.examId);
        this.getPage();
      });
  };

  changeExamModal = () => {
    this.setState({
      examVisble: !this.state.examVisble,
    });
  };

  publishCancel = () => {
    this.setState({
      publishStatus: false,
    });
  };

  returnMyTest = () => {
    this.setState(
      {
        publishStatus: false,
      },
      () => {
        window.location.reload();
      },
    );
  };

  view = () => {
    const {
      viewData: { item },
    } = this.state;
    this.props.dispatch(
      routerRedux.push(
        `/dataAnalysis/${item.examId || null}/${item.id || null}/1`,
      ),
    );
  };

  jumpTo = () => {
    window.open(
      `${window.location.origin}/exam#/revisedPage/1/false`,
      "_blank",
    ); //跳转到我创建的
  };

  //订正数据modal
  openRevisedDataModal = (examId, visible) => {
    this.setState({
      examId: examId,
      revisedModal: visible,
    });
  };

  reloadSource = () => {
    this.openRevisedDataModal(undefined, false);
    this.getPage();
    window.open(
      `${window.location.origin}/exam#/revisedPage/1/false`,
      "_blank",
    ); //跳转到我创建的
  };

  onlineQuizClick = (item) => {
    const { modalOnlineTestOptions } = this.state;
    this.setState({
      modalOnlineTestOptions: {
        ...modalOnlineTestOptions,
        visible: true,
      },
      examId: null,
      tabKey: 0,
    });
  };

  dotMatrixPen = () => {
    const { modalDotMatrixPenProps } = this.state;
    this.setState({
      modalDotMatrixPenProps: {
        ...modalDotMatrixPenProps,
        visible: true,
      },
      examId: null,
      tabKey: 0,
    });
  };

  // 关闭历史版本
  editionCancel = () => {
    this.setState({
      historicalVersion: false,
    });
  };

  handleMenuClick = (e) => {
    if (e.key === "1") {
      this.setState({ visible: false });
    }
  };

  handelExam = (item) => {
    let id = item.examId;
    let examSourceType = item.examSourceType;
    let classroomInteraction = item.classroomInteraction;
    const {
      machineTestoptions,
      modalMachineTestProps,
      modalOnlineTestOptions,
      modalDotMatrixPenProps,
    } = this.state;
    // 机阅测验，走此逻辑
    if (examSourceType === 1) {
      this.setState(
        {
          machineTestoptions: {
            ...machineTestoptions,
            visible: true,
          },
          modalMachineTestProps: {
            ...modalMachineTestProps,
            id: id,
          },
          tabKey: 1,
        },
        () => {
          console.log(this.state.modalMachineTestProps);
        },
      );
    } else if (classroomInteraction) {
      this.setState({
        modalDotMatrixPenProps: {
          ...modalDotMatrixPenProps,
          visible: true,
        },
        examId: id,
        tabKey: 1,
      });
    } else {
      this.setState({
        modalOnlineTestOptions: {
          ...modalOnlineTestOptions,
          visible: true,
        },
        examId: id,
        tabKey: 1,
      });
    }
  };

  syncEvaluate = (item) => {
    let id = item.examId;
    let examSourceType = item.examSourceType;
    let classroomInteraction = item.classroomInteraction;
    const {
      machineTestoptions,
      modalMachineTestProps,
      modalOnlineTestOptions,
      modalDotMatrixPenProps,
    } = this.state;
    // 机阅测验，走此逻辑
    if (examSourceType === 1) {
      this.setState(
        {
          machineTestoptions: {
            ...machineTestoptions,
            visible: true,
          },
          modalMachineTestProps: {
            ...modalMachineTestProps,
            id: id,
          },
          tabKey: 3,
        },
        () => {
          console.log(this.state.modalMachineTestProps);
        },
      );
    } else if (classroomInteraction) {
      this.setState({
        modalDotMatrixPenProps: {
          ...modalDotMatrixPenProps,
          visible: true,
        },
        examId: id,
        tabKey: 3,
      });
    } else {
      this.setState({
        modalOnlineTestOptions: {
          ...modalOnlineTestOptions,
          visible: true,
        },
        examId: id,
        tabKey: 3,
      });
    }
  };

  confirmePushExam = () => {
    const {
      deadTime,
      publishTime,
      selectTestId,
      dayClassesId,
      evaluationDimensionId,
      publishType,
      classStudentData,
    } = this.state;

    let stuIdList = classStudentData?.flatMap((cls) => {
      if (cls && cls.studentList && cls.studentList.length > 0) {
        let array = cls.studentList.filter(
          (stu) => stu.selected && !stu.disabled,
        );
        return array.map((stu) => ({
          groupId: cls.groupCourseId, // 班级 ID 作为 groupId
          id: stu.id, // 学生 ID
        }));
      }
    });

    if (stuIdList.length === 0) {
      message.warning(
        trans("global.selectAtLeastOneStudent", "请至少选择一个学生哦~"),
      );
      return;
    }

    this.props.dispatch({
      type: "publishToStudent/release",
      payload: {
        resourceRequestList: [
          {
            groupId: null, //班级id
            lessonId: dayClassesId && dayClassesId[1] ? dayClassesId[1] : null,
            taskId: this.state.taskId, //任务id
            evaluationItemId: evaluationDimensionId,
            deadTime: deadTime, //截止日期
            studentList: stuIdList,
            expectTime: 0,
            examPaperId: selectTestId, //试卷id
            ifTiming: publishType == "0" ? 0 : 1,
            publishTime: publishTime,
          },
        ],
      },
      onSuccess: () => {
        this.setState(
          {
            isStudentSelest: false,
          },
          () => {
            this.clearData();
            this.getPage();
          },
        );
      },
    });
  };

  clickTestSettings = (id, hide, pushNumber, examSourceType) => {
    const {
      machineTestoptions,
      modalMachineTestProps,
      modalOnlineTestOptions,
    } = this.state;
    this.setState({
      isStudentSelest: true,
    });
    this.props
      .dispatch({
        type: "home/getExamInfoByExamId",
        payload: {
          examId: id,
        },
      })
      .then(() => {
        const { examInfoByExamId } = this.props;

        this.setState(
          {
            isExamEdit: hide == "bbb" && pushNumber > 0 ? true : false,
            isTestSettings: hide == "bbb" ? true : false,
            initiateTestModal: hide == "aaa" ? false : true,
            testTitle: 1,
            completeStep: false,
            corrAnsVis: examInfoByExamId.openAnswer,
            scoreStuChecked: examInfoByExamId.openScore,
            isLengthAnswer: examInfoByExamId.answerTime ? true : false,
            lengthAnswerNum: examInfoByExamId.answerTime,
            examTestName: examInfoByExamId.examName, //试卷名称
            examType1: examInfoByExamId.examType, //试卷类型
            subjedtIdModal: examInfoByExamId.subjectId, //学科id
            chooseCourseId: examInfoByExamId.courseId, //课程id
            testDescription: examInfoByExamId.examIllustrate, //测验说明
            dailyClassesSwitch: examInfoByExamId.lessonAndAppraiseModel.lessonId
              ? true
              : false, //日课开关

            evaluateChecked: examInfoByExamId.lessonAndAppraiseModel
              .evaluationCategoryId
              ? true
              : false, //评价开关
            totalScoreEvaluate:
              examInfoByExamId.lessonAndAppraiseModel.totalScore, //总分
            studentDisplayId:
              examInfoByExamId.lessonAndAppraiseModel.evaluationCriterionId, //学生显示
            evaluationDimensionId:
              examInfoByExamId.lessonAndAppraiseModel.evaluationCategoryId, //评价维度id
            evaluativeItemsId:
              examInfoByExamId.lessonAndAppraiseModel.evaluationItemId,
            evaluationItemName:
              examInfoByExamId.lessonAndAppraiseModel?.evaluationItemName,
            selectTestId: examInfoByExamId.paperId,
            examIdModal: examInfoByExamId.examId,
            taskId: examInfoByExamId.taskId,
            isHide: hide == "aaa" ? true : false,
            isAnswer: examInfoByExamId.forceSubmit ? 2 : 1,
            proportionDimensions:
              examInfoByExamId.lessonAndAppraiseModel.weights,
            evaluationCategoryType:
              examInfoByExamId.lessonAndAppraiseModel.evaluationCategoryType ==
              2
                ? true
                : false,
          },
          () => {
            this.props
              .dispatch({
                type: "home/getTaskPublishDisplay",
                payload: {
                  ifCopyTask: false,
                  taskId: examInfoByExamId.taskId,
                },
              })
              .then(() => {
                const { taskPublishDisplayList } = this.props;

                this.setState({
                  disabledStu: taskPublishDisplayList?.lockStudentList
                    ? taskPublishDisplayList.lockStudentList
                    : [],
                  deadTime: taskPublishDisplayList.deadTime,
                  publishTime: taskPublishDisplayList.publishTime,
                });

                if (examInfoByExamId.lessonAndAppraiseModel?.lessonId) {
                  this.props.dispatch({
                    type: "publishToStudent/getGroupList",
                    payload: {
                      courseId: examInfoByExamId.courseId,
                      unitId: examInfoByExamId.lessonAndAppraiseModel.unitId,
                      activityId:
                        examInfoByExamId.lessonAndAppraiseModel.lessonId,
                      matchName: "",
                    },
                    onSuccess: (content) => {
                      let list = this.updateDisabledStudents(
                        taskPublishDisplayList?.lockStudentList,
                        content,
                      );
                      this.setState({
                        classStudentData: list,
                      });
                    },
                  });
                } else {
                  this.props.dispatch({
                    type: "publishToStudent/getCourseStudents",
                    payload: {
                      courseId: examInfoByExamId.courseId,
                    },
                    onSuccess: (content) => {
                      let list = this.updateDisabledStudents(
                        taskPublishDisplayList?.lockStudentList,
                        content,
                      );
                      this.setState({
                        classStudentData: list,
                      });
                    },
                  });
                }
              });

            if (examInfoByExamId.lessonAndAppraiseModel.lessonId) {
              this.setState({
                dayClassesId: [
                  examInfoByExamId.lessonAndAppraiseModel.unitId,
                  examInfoByExamId.lessonAndAppraiseModel.lessonId,
                ], //日课id
              });
            }

            if (examInfoByExamId.courseId) {
              this.props.dispatch({
                type: "publishToStudent/getActivityList",
                payload: { courseId: examInfoByExamId.courseId },
              });
              this.props.dispatch({
                type: "home/getSelectEvaluationCategoryByExample",
                payload: { courseId: examInfoByExamId.courseId },
              });
            }

            if (examInfoByExamId.subjectId) {
              this.props
                .dispatch({
                  type: "publishToStudent/getCourseList",
                  payload: {
                    // gradeIdList: [this.state.gradeModalId],
                    subjectId: examInfoByExamId.subjectId,
                  },
                })
                .then(() => {
                  if (this.props.courseList.length == 1) {
                    this.setState({
                      chooseCourseId: this.props.courseList[0].courseId,
                    });
                  }
                });
            }

            if (examInfoByExamId.lessonAndAppraiseModel?.evaluationCategoryId) {
              this.props.dispatch({
                type: "home/getEvaluationItemListByCategoryId",
                payload: {
                  evaluationCategoryId: this.state.evaluationDimensionId,
                },
              });
            }
          },
        );
      });
    this.props.dispatch({
      type: "home/getExamType",
      payload: {
        type: 1,
      },
    });
    this.props.dispatch({
      type: "home/getSubjectList",
    });
    this.props.dispatch({
      type: "home/getPaperList",
      payload: {
        semesterId: null,
        gradeId: null,
        examTypeCode: null,
        subjectId: null,
        examName: "",
        viewType: 2,
        pageNo: 1, //pageNo是当前页码
        limit: 500, //limit是每页的数据数量
        sourceType: 0,
      },
    });
    this.props.dispatch({
      type: "home/getCriterionList",
    });
  };

  //清除modal框数据
  clearData = () => {
    this.setState({
      examTestName: "", //试卷名称
      examType1: null, //试卷类型
      subjedtIdModal: null, //学科id
      chooseCourseId: null, //课程id
      testDescription: "", //测验说明
      dailyClassesSwitch: false, //日课开关
      dayClassesId: null, //日课id
      evaluateChecked: false, //评价开关
      totalScoreEvaluate: null, //总分
      studentDisplayId: undefined, //学生显示
      evaluationDimensionId: null, //评价维度id
      evaluativeItemsId: null,
      evaluationItemName: null,
      selectTestId: null,
      examIdModal: null,
      isHide: false,
      disabledStu: [],
      stuIdList: [],
      publishType: "0", //0：立即发布 1：定时发布
      // dataLineTiming: "2022-12-12", //定时年月日
      dataTimeTiming: "17: 00", //定时时间
      dataTime: "22: 00",
      scoreStuChecked: true,
      corrAnsVis: true,
      isLengthAnswer: false,
      lengthAnswerNum: null,
      isAnswer: 1,
      isTestSettings: false,
      isExamEdit: false,
      isProportionDimensions: 1,
      proportionDimensions: null,
      evaluationCategoryType: false,
      creatEvaluationItemId: null,
    });
  };

  changeSelectTest1 = (id) => {
    this.setState({
      selectTestId: id,
    });
  };

  // 点击下载试卷
  clickDownloadTestPaper = (id, uploadFileExist, isEdit) => {
    const downloadTarget = resolvePaperDownloadTarget({
      uploadFileEditable: isEdit,
      uploadFileExist,
    });
    if (downloadTarget === "browser-pdf") {
      void downloadExamPaperPdf({ paperId: id });
    } else if (downloadTarget === "source-file") {
      this.props
        .dispatch({
          type: "home/getViewOrDownPaper",
          payload: {
            paperId: id,
          },
        })
        .then(() => {
          window.open(this.props.viewOrDownPaper.url);
        });
    }
  };

  // 切换
  switchTab = (check) => {
    this.setState(
      {
        checkExam: check,
      },
      () => this.getPage(),
    );
  };

  handleCancel = () => {
    this.setState({
      isStudentSelest: false,
    });
  };

  changeScoreImportModal = () => {
    this.setState({
      isScoreImportModal: !this.state.isScoreImportModal,
    });
  };

  openScoreImportModal = () => {
    this.setState({
      isScoreImportModal: true,
    });
  };

  deadTimeChange = (dateString) => {
    console.log(dateString);
    this.setState({
      deadTime: dateString,
    });
  };

  changeDate = (date, dateString) => {
    console.log(dateString, "dateString");
    const [day1, time1] = this.state.deadTime
      ? this.state.deadTime.split(" ")
      : ["", ""];
    this.setState(
      {
        day: dateString,
      },
      () => {
        this.deadTimeChange(`${dateString} ${time1}`);
      },
    );
  };

  changeTime = (date, dateString) => {
    const [day1, time1] = this.state.deadTime
      ? this.state.deadTime.split(" ")
      : ["", ""];
    this.setState(
      {
        time: dateString,
      },
      () => {
        this.deadTimeChange(`${day1} ${dateString}`);
      },
    );
  };

  stuChange = (data) => {
    this.setState({
      classStudentData: data,
    });
  };

  /**
   * @param {Array} disabledStu 禁用的学生列表
   * @param {Array} groupList 班级列表
   */
  updateDisabledStudents = (disabledStu = [], groupList = []) => {
    if (groupList && groupList.length > 0) {
      let list = JSON.parse(JSON.stringify(groupList));
      return list.map((cls) => ({
        ...cls,
        studentList: cls.studentList.map((stu) => {
          const isDisabled = disabledStu.some((ds) => ds.id == stu.id);

          return isDisabled
            ? { ...stu, selected: true, disabled: true }
            : { ...stu, selected: false, disabled: false };
        }),
      }));
    }
  };

  timedTaskChange = (time) => {
    this.setState({
      publishTime: time,
    });
  };

  render() {
    const {
      examOptions,
      examList,
      currentUser: { showRevisePaper },
      historyTestList,
    } = this.props;
    const {
      IconFont,
      viewData,
      exampleId,
      testName,
      defaultSemester,
      historicalVersion,
      examTestId,
      checkExam,
      isStudentSelest,
    } = this.state;

    let device = window.yg;
    const [day1, time1] = this.state.deadTime
      ? this.state.deadTime.split(" ")
      : ["", ""];
    const searchView = (
      <span className={styles.viewBox} key="view">
        <span
          onClick={() => this.switchTab(1)}
          className={[
            styles.viewTab,
            checkExam === 1 ? styles.isCheck : "",
          ].join(" ")}
          data-type="我的测验"
        >
          {trans("global.myTest1", "我的测验")}
        </span>
        <span
          onClick={() => this.switchTab(0)}
          className={[
            styles.viewTab,
            checkExam === 0 ? styles.isCheck : "",
          ].join(" ")}
          data-type="校本测验"
        >
          {trans("global.schoolBasedTest", "校本测验")}
        </span>
      </span>
    );

    const semesterFilter = (
      <span
        className={[styles.inline, styles.semesterSelect1].join(" ")}
        data-type="全部学期"
        id="allSemesterId"
        key="semester"
      >
        <Select
          onChange={this.changeStage}
          value={this.state.stageId}
          getPopupContainer={() => document.querySelector(`#allSemesterId`)}
        >
          <Option value={0} key={0}>
            {trans("global.allSemester", "全部学期")}
          </Option>
          {examOptions && examOptions.length > 0
            ? examOptions.map((item) => (
                <Option value={item.semesterId} key={item.semesterId}>
                  <span title={item.semesterName}>{item.semesterName}</span>
                </Option>
              ))
            : null}
        </Select>
      </span>
    );

    const gradeFilter = (
      <span
        className={[styles.inline, styles.semesterSelect2].join(" ")}
        id="allSemesterId3"
        data-type="全部年级"
        key="grade"
      >
        <Select
          onChange={this.changeGrade}
          value={this.state.gradeId}
          style={{ width: 90 }}
          getPopupContainer={() => document.querySelector(`#allSemesterId3`)}
        >
          <Option value={0} key={0}>
            {trans("global.allGrade", "全部年级")}
          </Option>
          {defaultSemester?.gradeList && defaultSemester.gradeList.length > 0
            ? defaultSemester.gradeList.map((item) => (
                <Option value={item.gradeId} key={item.gradeId}>
                  <span title={item.gradeName}>{item.gradeName}</span>
                </Option>
              ))
            : null}
        </Select>
      </span>
    );

    const subjectFilter = (
      <span
        className={[styles.inline, styles.semesterSelect2].join(" ")}
        id="allSemesterId1"
        data-type="全部学科"
        key="subject"
      >
        <Select
          value={this.state.courseId}
          style={{ width: 90 }}
          onChange={this.changeCourse}
          dropdownMatchSelectWidth={false}
          getPopupContainer={() => document.querySelector(`#allSemesterId1`)}
        >
          <Option value={0} key={0}>
            <span title={trans("global.allSubject", "全部学科")}>
              {trans("global.allSubject", "全部学科")}
            </span>
          </Option>
          {this.props.testSubject &&
            this.props.testSubject.length &&
            this.props.testSubject.map((item) => (
              <Option value={item.id} key={item.id}>
                <span title={item.name}>{item.name}</span>
              </Option>
            ))}
        </Select>
      </span>
    );

    const typeFilter = (
      <span
        className={[styles.inline, styles.semesterSelect2].join(" ")}
        id="allSemesterId2"
        data-type="全部类型"
        key="type"
      >
        <Select
          value={this.props.typeValue}
          style={{ width: 90 }}
          onChange={this.changeType}
          getPopupContainer={() => document.querySelector(`#allSemesterId2`)}
        >
          <Option value={0}>{trans("global.allType", "全部类型")}</Option>
          {defaultSemester.examType &&
            defaultSemester.examType.length &&
            defaultSemester.examType.map((item) => (
              <Option value={item.examTypeCode} key={item.examTypeCode}>
                <span title={item.examTypeName}>{item.examTypeName}</span>
              </Option>
            ))}
        </Select>
      </span>
    );

    const searchInput = (
      <span className={styles.inline} data-type="搜索" key="search">
        <Search
          placeholder={trans("global.forKeyWordSearch", "根据关键词搜索测验")}
          allowClear
          value={this.state.examName}
          onChange={this.changeSearch}
          onSearch={this.onSearch}
          style={{ width: 180 }}
        />
      </span>
    );

    const initiateAction = (
      <Dropdown
        key="initiate"
        getPopupContainer={() => document.querySelector("#initiateTest1")}
        overlayClassName={styles.testMenu}
        overlay={() => {
          return (
            <Menu>
              <Menu.Item
                key="1"
                data-type="线上测验"
                onClick={this.onlineQuizClick}
              >
                <div style={{ width: "320px" }}>
                  <div>{trans("global.onlineQuiz", "线上测验")}</div>
                  <span>
                    {trans(
                      "global.launchOnlineQuizTest",
                      "以任务的形式发送给学生，学生在线完成答题，系统实时生成分析数据",
                    )}
                  </span>
                </div>
              </Menu.Item>

              {this.state.DianZhenBi ? (
                <Menu.Item
                  key="2"
                  data-type="点阵笔互动测验"
                  onClick={this.dotMatrixPen}
                >
                  <div style={{ width: "320px" }}>
                    <div>
                      {trans("examAnalysis.dotMatrixPenQuiz", "点阵笔互动测验")}
                    </div>
                    <span>
                      {trans(
                        "examAnalysis.dotMatrixPenQuizDescriptionLine1",
                        "学生使用专属的点阵笔在通用答题卡上答题，目",
                      )}
                      <br />
                      {trans(
                        "examAnalysis.dotMatrixPenQuizDescriptionLine2",
                        "前只支持15题以内的选择题，实时生成分析数据",
                      )}
                    </span>
                  </div>
                </Menu.Item>
              ) : null}
            </Menu>
          );
        }}
      >
        <span className={styles.makeCardButton} id="initiateTest1">
          {trans("global.initiateTest", "发起测验")}
          <Icon style={{ marginLeft: "6px" }} type="down" />
        </span>
      </Dropdown>
    );

    const reviseAction = showRevisePaper ? (
      <div
        key="revise"
        data-type="订正管理"
        className={styles.makeCardButton}
        onClick={this.jumpTo}
      >
        {trans("global.correctionPaper1", "订正管理")}
      </div>
    ) : null;

    const uploadAction = (
      <div
        key="upload"
        className={styles.makeCardButton}
        onClick={this.changeExamModal}
        data-type="上传试卷"
      >
        {trans("global.uploadTestPaper", "上传试卷")}
      </div>
    );

    const makeCardAction = (
      <span
        key="makeCard"
        className={styles.makeCardButton}
        id="makeCard"
        data-type="制作答题卡"
      >
        <a
          href="http://129.211.106.195:1234/#/datika"
          target="_blank"
          style={{ color: "#fff" }}
          rel="noreferrer"
        >
          {trans("global.makeCard", "制作答题卡")}
        </a>
      </span>
    );

    const importAction = (
      <div
        key="import"
        data-type="导入成绩"
        className={styles.makeCardButton}
        onClick={this.openScoreImportModal}
      >
        {trans("global.importGrades", "导入成绩")}
      </div>
    );

    const filterToolbarItems = [
      searchView,
      semesterFilter,
      gradeFilter,
      subjectFilter,
      typeFilter,
      searchInput,
    ];

    const primaryActionItems = [initiateAction, reviseAction].filter(Boolean);
    const secondaryActionItems = [uploadAction, makeCardAction, importAction];

    return (
      <div className={styles.examBox}>
        <div className={styles.testContent}>
          <div className={styles.testListBox}>
            <div className={styles.searchBar} data-block="搜索">
              <div className={styles.searchMain}>
                <div className={styles.searchLeft}>{filterToolbarItems}</div>
                {this.isRecruitPaperMode() ? null : (
                  <div className={styles.searchRight}>
                    {[...primaryActionItems, ...secondaryActionItems]}
                  </div>
                )}
              </div>
            </div>

            <div className={styles.testMapList} id="listBox">
              {examList?.examList && examList?.examList.length ? (
                examList.examList.map((item, index) => (
                  <div
                    className={[styles.mapBox, "listItem"].join(" ")}
                    key={index}
                  >
                    <Link
                      to={`/dataAnalysis/${item.examId || null}/${item.id || null}/${this.getDefaultDataAnalysisTab(item)}`}
                      target="_blank"
                    >
                      <span
                        className={[styles.inline, styles.messageBox].join(" ")}
                      >
                        <div>
                          {
                            <span
                              className={[
                                styles.examTypeBox,
                                item.examTypeCode == 1
                                  ? styles.green
                                  : item.examTypeCode == 2 ||
                                      item.examTypeCode == 3
                                    ? styles.blue
                                    : item.examTypeCode == 3 ||
                                        item.examTypeCode == 10
                                      ? styles.blue
                                      : item.examTypeCode == 7 ||
                                          item.examTypeCode == 9
                                        ? styles.red
                                        : item.examTypeCode == 6 ||
                                            item.examTypeCode == 4 ||
                                            item.examTypeCode == 5
                                          ? styles.orange
                                          : item.examTypeCode == 11
                                            ? styles.grey
                                            : styles.grey,
                              ].join(" ")}
                            >
                              {item.examTypeName}
                            </span>
                          }
                          <span className={styles.header}>
                            {item.examName}
                            {item.fileStatus ? (
                              <Link
                                to={`/dataAnalysis/${item.examId || null}/${item.id || null}/${this.getDefaultDataAnalysisTab(item)}`}
                                target="_blank"
                              >
                                <Icon
                                  type="eye"
                                  style={{ color: "#0445fc", marginLeft: 6 }}
                                />
                              </Link>
                            ) : null}
                          </span>
                        </div>
                        <div
                          style={{
                            overflow: "hidden",
                            whiteSpace: "nowrap",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {[
                            {
                              label: item.examDate,
                              icon: <i className={styles.iconfont}>&#xe61f;</i>,
                            },
                            {
                              label: item.totalScore,
                              icon: <i className={styles.iconfont}>&#xe634;</i>,
                            },
                            {
                              label: item.subjectName,
                              icon: <i className={styles.iconfont}>&#xe708;</i>,
                            },
                            {
                              label: item.gradeName,
                              icon: <i className={styles.iconfont}>&#xe745;</i>,
                            },
                            {
                              label: item.createUserName || "",
                              icon: <Icon type="user" />,
                            },
                          ].map((content) => (
                            <>
                              <span
                                style={{ color: "#000", marginRight: "5px" }}
                              >
                                {content.icon}
                              </span>
                              <span
                                style={{
                                  color: "#666",
                                  marginRight: "22px",
                                  fontFamily: "PingFangSC-Regular",
                                }}
                              >
                                {content.label}
                              </span>
                            </>
                          ))}
                        </div>
                        <div className={styles.bottom}>
                          <span
                            className={[styles.inline, styles.totalScore].join(
                              " ",
                            )}
                          >
                            {trans("global.gong", "共")}
                            <span className={styles.point}>
                              {item.examSourceType === 0
                                ? item.questionTotalNum
                                : item.applyGroupNum}
                            </span>
                            {item.examSourceType === 0
                              ? trans("global.question", "题")
                              : trans("global.groupNum", "个班级")}
                          </span>
                          <Tooltip
                            mouseEnterDelay={0.5}
                            title={() => (
                              <>
                                {item.examSourceType === 0 ? (
                                  item.questionTypeNumberModels &&
                                  item.questionTypeNumberModels.length > 0 ? (
                                    item.questionTypeNumberModels.map(
                                      (index_, newI) => (
                                        <span
                                          className={[
                                            styles.inline,
                                            styles.testType,
                                          ].join(" ")}
                                          key={newI}
                                        >
                                          <span className={styles.point}>
                                            {index_.questionNum}
                                          </span>
                                          {index_.typeName}
                                        </span>
                                      ),
                                    )
                                  ) : null
                                ) : (
                                  <span
                                    className={[
                                      styles.inline,
                                      styles.testType,
                                    ].join(" ")}
                                  >
                                    {item.applyGroupNames}
                                  </span>
                                )}
                              </>
                            )}
                          >
                            <div className={styles.classNamesBox}>
                              {item.examSourceType === 0 ? (
                                item.questionTypeNumberModels &&
                                item.questionTypeNumberModels.length > 0 ? (
                                  item.questionTypeNumberModels.map(
                                    (index_, newI) => (
                                      <span
                                        className={[
                                          styles.inline,
                                          styles.testType,
                                        ].join(" ")}
                                        key={newI}
                                      >
                                        <span className={styles.point}>
                                          {index_.questionNum}
                                        </span>
                                        {index_.typeName}
                                      </span>
                                    ),
                                  )
                                ) : null
                              ) : (
                                <span
                                  className={[
                                    styles.inline,
                                    styles.testType,
                                  ].join(" ")}
                                >
                                  {item.applyGroupNames}
                                </span>
                              )}
                            </div>
                          </Tooltip>
                        </div>
                      </span>
                    </Link>
                    {item.examSourceType === 0 ? (
                      item.isEdit ? null : (
                        <span
                          className={[styles.inline, styles.chartBox].join(" ")}
                          style={device == "ipad" ? { width: "160px" } : {}}
                        >
                          <Progress
                            percent={(item.completedNum / item.pushNum) * 100}
                            showInfo={false}
                          />
                          <span className={styles.paid}>
                            {item.completedNum}
                            {trans("global.paid", "已交")}
                          </span>
                          <span className={styles.unpaid}>
                            {item.notCompletedNum}
                            {trans("global.unpaid", "未交")}
                          </span>
                          <span className={styles.Pushed}>
                            {item.pushNum}
                            {trans("global.Pushed", "已推送")}
                          </span>
                        </span>
                      )
                    ) : (
                      <span
                        className={[styles.inline, styles.chartBox].join(" ")}
                        style={device == "ipad" ? { width: "160px" } : {}}
                      ></span>
                    )}
                    <span
                      className={[
                        styles.inline,
                        styles.optionBox,
                        item.isEdit ? styles.editOption : null,
                      ].join(" ")}
                      id={`option${item.id}`}
                      data-block="操作"
                    >
                      <ComnModal
                        options={{
                          title: trans("global.deleteQuiz", "删除测验"),
                          visible: this.state[`itemViesble${item.examId}`],
                          centered: true,
                          onOk: this.deleteTest.bind(this, item),
                          onCancel: this.changeScoreVisible.bind(
                            this,
                            item.examId,
                          ),
                        }}
                        innerContent={
                          <>
                            {trans(
                              "global.messageContent",
                              "你确定要删除这个测验吗？删除后，该测验所有内容将不可恢复。",
                            )}
                          </>
                        }
                      />
                      <div className={styles.downloadBox}>
                        {this.isRecruitPaperMode() ? null : (
                          <div className={styles.download}>
                            <div
                              className={styles.initiateTest}
                              onClick={() => this.syncEvaluate(item)}
                            >
                              <i
                                className={styles.iconfont}
                                style={{
                                  fontSize: "14px",
                                  color: "#0445FC",
                                }}
                              >
                                &#xe8a1;
                              </i>
                              <span
                                className={[styles.grades, styles.dir].join(
                                  " ",
                                )}
                              >
                                {trans(
                                  "global.synchronousEvaluation",
                                  "成绩同步",
                                )}
                              </span>
                            </div>
                          </div>
                        )}
                        {this.isRecruitPaperMode() ? null : (
                          <div
                            className={styles.download}
                            style={{ minWidth: "80px" }}
                          >
                            {item.examSourceType == 0 ? (
                              <>
                                {item.pushNum ? (
                                  <div
                                    className={styles.initiateTest}
                                    onClick={() =>
                                      this.clickTestSettings(item.examId, "aaa")
                                    }
                                  >
                                    <i
                                      className={styles.iconfont}
                                      style={{
                                        fontSize: "14px",
                                        color: "#0445FC",
                                      }}
                                    >
                                      &#xe85c;
                                    </i>
                                    <span
                                      className={[
                                        styles.grades,
                                        styles.dir,
                                      ].join(" ")}
                                    >
                                      {trans("global.goPushToStu1", "继续推送")}
                                    </span>
                                  </div>
                                ) : (
                                  <div
                                    className={styles.initiateTest}
                                    // onClick={() => this.clickInitiateTest(item)}
                                    onClick={() =>
                                      this.clickTestSettings(item.examId, "aaa")
                                    }
                                  >
                                    <i
                                      className={styles.iconfont}
                                      style={{
                                        fontSize: "14px",
                                        color: "#0445FC",
                                      }}
                                    >
                                      &#xe85c;
                                    </i>
                                    <span
                                      className={[
                                        styles.grades,
                                        styles.dir,
                                      ].join(" ")}
                                    >
                                      {trans("global.pushStudents", "推送学生")}
                                    </span>
                                  </div>
                                )}
                              </>
                            ) : null}
                          </div>
                        )}
                        <div className={styles.download}>
                          {(item.examSourceType == 0 && item.pushNum) ||
                          (item.examSourceType == 1 &&
                            item.ifThirdQuestionBankListExists) ? (
                            <Link
                              to={`/dataAnalysis/${item.examId || null}/${item.id || null}/${this.getDefaultDataAnalysisTab(item)}`}
                              target="_blank"
                            >
                              <div className={styles.testPaperAnalysis}>
                                <i
                                  className={styles.iconfont}
                                  style={{
                                    fontSize: "14px",
                                    color: "#0445FC",
                                  }}
                                >
                                  &#xe85e;
                                </i>
                                <span
                                  className={[styles.grades, styles.dir].join(
                                    " ",
                                  )}
                                >
                                  {trans("global.analytical", "分析")}
                                </span>
                              </div>
                            </Link>
                          ) : null}
                        </div>
                      </div>
                      {this.isRecruitPaperMode() ? null : (
                        <div
                          className={styles.testMenu1}
                          id="testMenu1"
                          data-block="更多"
                        >
                          <Dropdown
                            overlay={() => {
                              return (
                                <Menu onClick={this.handleMenuClick}>
                                  {item.pushNum ? (
                                    <Menu.Item
                                      key="7"
                                      data-type="订正数据"
                                      onClick={() =>
                                        this.openRevisedDataModal(
                                          item.examId,
                                          true,
                                        )
                                      }
                                    >
                                      {trans("revise.revisedData", "订正数据")}
                                    </Menu.Item>
                                  ) : null}
                                  {item.examSourceType == 0 && !item.pushNum ? (
                                    <Menu.Item key="1" data-type="编辑试卷">
                                      <Link
                                        to={`/detail/false/true/${item.subjectId}/${item.id}`}
                                      >
                                        {trans("global.editPaper", "编辑试卷")}
                                      </Link>
                                    </Menu.Item>
                                  ) : null}
                                  <Menu.Item
                                    key="2"
                                    data-type="编辑测验"
                                    onClick={() => this.handelExam(item)}
                                  >
                                    {trans(
                                      "global.editTestSettings",
                                      "编辑测验设置",
                                    )}
                                  </Menu.Item>
                                  <Menu.Item key="3" data-type="个性化作业">
                                    <Link
                                      to={`/detail/false/true/${item.subjectId}/${item.id}/true`}
                                      target="_blank"
                                    >
                                      {trans("global.diyWork", "个性化作业")}
                                    </Link>
                                  </Menu.Item>
                                  <Menu.Item
                                    key="4"
                                    data-type="下载试卷"
                                    onClick={() =>
                                      this.clickDownloadTestPaper(
                                        item.id,
                                        item.uploadFileExist,
                                        item.isEdit,
                                      )
                                    }
                                  >
                                    {trans(
                                      "global.downloadTestPaper3",
                                      "下载试卷",
                                    )}
                                  </Menu.Item>
                                  {item.pushNum ? null : (
                                    <Menu.Item
                                      key="5"
                                      data-type="删除"
                                      onClick={this.changeScoreVisible.bind(
                                        this,
                                        item.examId,
                                      )}
                                    >
                                      {trans("global.delete", "删除")}
                                    </Menu.Item>
                                  )}
                                </Menu>
                              );
                            }}
                            placement="bottomRight"
                            getPopupContainer={() =>
                              document.querySelector("#testMenu1")
                            }
                          >
                            <i
                              className={[styles.iconfont, styles.more].join(
                                " ",
                              )}
                              onClick={(e) => e.preventDefault()}
                            >
                              &#xe6fd;
                            </i>
                          </Dropdown>
                        </div>
                      )}
                    </span>
                  </div>
                ))
              ) : this.props.infoStatus ? (
                IconFont ? (
                  <div className={styles.noTest}>
                    <div className={styles.iconBox}>
                      <img className={styles.noTask} src={noTask}></img>
                    </div>
                    {trans("global.noExamTest", "目前还没有相关测验")}
                  </div>
                ) : null
              ) : null}
            </div>

            <Pagination
              size="small"
              current={this.state.pageNo}
              pageSize={50}
              pageSizeOptions={[50, 100, 150, 200]}
              total={examList?.totalNum || 0}
              onChange={this.changeNo}
              showSizeChanger
              showQuickJumper
              onShowSizeChange={this.onShowSizeChange}
            />
          </div>
        </div>

        {this.state.examVisble ? (
          <ExamSetting
            examVisble={this.state.examVisble}
            history={this.props.history}
            changeExamModal={this.changeExamModal}
            dispatch={this.props.dispatch}
            defaultSemester={this.state.defaultSemester}
            getPage={this.getPage}
          />
        ) : null}

        {this.state.revisedModal && (
          <RevisedModal
            testId={this.state.examId}
            openRevisedDataModal={this.openRevisedDataModal}
            dispatch={this.props.dispatch}
            reloadSource={this.reloadSource}
            source="question"
          />
        )}

        <Modal
          visible={historicalVersion}
          footer={false}
          className={styles.historicalVersion}
          mask={false}
          onCancel={this.editionCancel}
        >
          <Table dataSource={historyTestList} pagination={false}>
            <Column
              title={trans("global.versionNumber", "版本号")}
              // width={80}
              dataIndex="examNum"
              key="examNum"
            />
            <Column
              title={trans("global.creationTime", "创建时间")}
              dataIndex="createDate"
              key="createDate"
            />
            <Column
              title={trans("global.originalVolume", "原卷")}
              dataIndex="originalTest"
              key="originalTest"
              render={(text, record) => (
                <a href={record.wordFile} target="_blank" rel="noreferrer">
                  {trans("global.download", "下载")}
                </a>
              )}
            />
            <Column
              title={trans("global.printedVolume", "印刷卷")}
              dataIndex="printingTest"
              key="printingTest"
              render={(text, record) =>
                record.needMark ? (
                  <span>{trans("global.download", "下载")}</span>
                ) : (
                  <a href={record.pdfFile} target="_blank" rel="noreferrer">
                    {trans("global.download", "下载")}
                  </a>
                )
              }
            />
            <Column
              title={trans("global.option", "操作")}
              dataIndex="printingTest"
              key="printingTest"
              render={(text, record) =>
                record.isMarkShow ? (
                  <a
                    href={record.makePaperUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {trans("global.markingAndMarking", "批阅打标")}
                  </a>
                ) : null
              }
            />
          </Table>
        </Modal>

        <CuModal
          title={trans("global.launchOnlineQuiz", "发起线上")}
          okText={trans("create.releaseNow", "立即发布")}
          onOk={this.confirmePushExam} // 提交表单
          onCancel={this.handleCancel}
          width={700}
          visible={isStudentSelest} // 开关
        >
          <div style={{ padding: "0 20px" }}>
            <div className={styles.deadline} style={{ marginBottom: 15 }}>
              <span className={styles.radioTitleStu}>
                {trans("global.deadline", "截止时间")}
              </span>
              <div style={{ marginRight: 8, width: "130px" }}>
                <DatePicker
                  onChange={this.changeDate}
                  format="YYYY-MM-DD"
                  value={day1 ? moment(day1, "YYYY-MM-DD") : null}
                />
              </div>

              <div style={{ marginRight: 8, width: "80px" }}>
                <TimePicker
                  value={time1 ? moment(time1, "HH:mm") : null}
                  onChange={this.changeTime}
                  format="HH:mm"
                />
              </div>

              <div style={{ flexGrow: 1 }}>
                <Search
                  placeholder={trans(
                    "global.studentSearch",
                    "请输入学生姓名/学号进行搜索",
                  )}
                  // onSearch={(e) => { this.setState({ stuName: e.target.value }) }}
                  onChange={(e) => {
                    this.setState({ stuName: e.target.value });
                  }}
                  value={this.state.stuName}
                />
              </div>
            </div>

            <SelectStu
              searchKey={this.state.stuName}
              groupList={this.state.classStudentData}
              onSelectChange={this.stuChange}
            />

            {isStudentSelest ? (
              <TimedTask
                onChange={this.timedTaskChange}
                value={this.state.publishTime}
                style={{ position: "absolute", bottom: "0", left: "0" }}
              />
            ) : null}
          </div>
        </CuModal>

        {this.state.machineTestoptions.visible ? (
          <ModalMachineTest
            modalMachineTestProps={{
              options: this.state.machineTestoptions,
              ...this.state.modalMachineTestProps,
              tabKey: this.state.tabKey,
              // editFormData:this.state.modalMachineTestProps.editFormData
            }}
          />
        ) : null}
        {this.state.modalOnlineTestOptions.visible ? (
          <ModalOnlineTest
            modalOnlineTestProps={{
              options: this.state.modalOnlineTestOptions,
              dispatch: this.props.dispatch,
              id: this.state.examId,
              publicationContract: "V2",
              tabKey: this.state.tabKey,
            }}
          />
        ) : null}
        {this.state.modalDotMatrixPenProps.visible ? (
          <ModalDotMatrixPen
            modalDotMatrixPenProps={{
              options: this.state.modalDotMatrixPenProps,
              dispatch: this.props.dispatch,
              id: this.state.examId,
              tabKey: this.state.tabKey,
            }}
          />
        ) : null}

        {this.state.isScoreImportModal ? (
          <ScoreImportModal
            examOptions={examOptions}
            examList={examList}
            examVisble={this.state.isScoreImportModal}
            history={this.props.history}
            changeExamModal={this.changeScoreImportModal}
            dispatch={this.props.dispatch}
            getPage={this.getPage}
          />
        ) : null}
      </div>
    );
  }
}

export default connect(({ home, global, publishToStudent }) => ({
  testSubject: home.testSubject,
  testList: home.testList,
  typeValue: home.typeValue,
  courseValue: home.courseValue,
  statusValue: home.statusValue,
  stageList: global.stageList,
  gradeList: global.gradeList,
  subjectList: global.subjectList,
  examOptions: home.examOptions,
  examList: home.examList,
  currentUser: global.currentUser,
  infoStatus: home.infoStatus,
  classList: home.classList,
  historyTestList: home.historyTestList,
  examTypeList: home.examTypeList,
  activityList: publishToStudent.activityList,
  allGrade: home.allGrade,
  subjectListTest: home.subjectListTest,
  allSubject: home.allSubject,
  paperList: home.paperList,
  evaluateList: home.evaluateList,
  evaluationItemListByCategoryId: home.evaluationItemListByCategoryId,
  criterionList: home.criterionList,
  paperInfo: home.paperInfo,
  groupList: publishToStudent.groupList,
  courseList: publishToStudent.courseList,
  resourceCreate: home.resourceCreate,
  examInfoByExamId: home.examInfoByExamId,
  viewOrDownPaper: home.viewOrDownPaper,
  taskPublishDisplayList: home.taskPublishDisplayList,
}))(ExamAnalysis);
