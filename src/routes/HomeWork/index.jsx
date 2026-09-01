//新闻
import React, { PureComponent } from "react";
import { StudentSelect } from "@yungu-fed/yungu-studentselect";
import {
  Button,
  Checkbox,
  Dropdown,
  Icon,
  Input,
  Menu,
  message,
  Modal,
  Pagination,
  Select,
  Table,
  Upload,
} from "antd";
import { connect } from "dva";
import { Link, routerRedux } from "dva/router";

import noTask from "../../assets/noTask.png";
import ExamSetting from "../../components/ExamSetting/index";
import StudyActivity from "../../components/PublishToStudents/StudyActivity/index";
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
const format1 = "HH:mm";
const format2 = "YYYY-MM-DD";
let sortList = {
  1: "STUDENT_NO",
  2: "STUDENT_NAME",
  3: "STUDENT_E_NAME",
  4: "SCORE",
  5: "SCORE",
};

let date = new Date();
let month = date.getMonth() + 1; //当前月
let year = date.getFullYear(); //当前年(4位)
let day = date.getDate();
class ExamAnalysis extends PureComponent {
  constructor(properties) {
    super(properties);
    // this.url = this.props.history.location.pathname;
    this.url = window.location.hash;
    // this.pathMatch = pathToRegexp("#/examAnalysis/:id?/:tab?").exec(this.url);
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
      studentDisplayId: undefined,
      upVisible: false,
      downloadVisible: false,
      checkWorkList: [],
      workType: [1],
    };
    this.page = 1;
    this.pageSize = 50;
    this.getCardStatus = true;
  }
  componentDidMount() {
    if (this.paperId) {
      this.setState(
        {
          initiateTestModal: true,
        },
        () => {
          // this.getStudents();
        },
      );
    }
    console.log(this.pathMatch, "666");
    if (this.tabId == 2) {
      this.setState({
        initiateTestModal: 2,
      });
    }
    // this.getStudents();
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
            // gradeId: examOptions && examOptions.length && examOptions[0].gradeList && examOptions[0].gradeList.length ? examOptions[0].gradeList[0].gradeId : 0,
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
    if (this.state.initiateTestModal && this.state.testTitle == 2) {
      this.props
        .dispatch({
          type: "home/getGradeClass",
          payload: {
            gradeIdList: 0,
            subjectId: 0,
            courseIdList: 0,
          },
        })
        .then(() => {
          this.setState({
            classList: this.props.classList,
          });
        });
    }
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
          let gareId = null;
          // paperList &&
          //   paperList.examList.length &&
          //   paperList.examList.map((item) => {
          //     if (item.id == id) {
          //       gareId = item.gradeId;
          //     }
          //   });
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
  }
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
  switchNavList = (key) => {
    this.setState({
      cur: key,
    });
  };
  scrollChange = () => {
    const overflowDom = document.querySelector("#listBox");
    const cardDomList = document.querySelectorAll(".listItem");
    const mastTop = cardDomList.at(-1).offsetTop;
    const scrollTop = overflowDom.scrollTop;
    const innerHeight = window.innerHeight;
    this.setState({
      scrollTop: scrollTop,
    });
    // this.props.saveTop(scrollTop)
    // this.props.dispatch({
    //   type: 'task/Conditions',
    //   payload: {
    //     value: {},
    //     height: scrollTop,
    //   },
    // })
    if (scrollTop + innerHeight > mastTop && this.getCardStatus) {
      this.getCardStatus = false;
      if (scrollTop > this.state.scrollTop) {
        // this.props.getExamineList();
        this.getPage();
      }
    }
  };
  changeGrade = (value) => {
    this.setState(
      {
        gradeId: value,
        scrollTop: 0,
        courseId: 0,
      },
      () => {
        this.props.dispatch({
          type: "global/getSubject",
          payload: {
            gradeId: this.state.gradeId,
          },
        });
        this.page = 1;
        this.getPage();
      },
    );
  };
  changeStage = (value) => {
    const { examOptions } = this.props;
    let newSemester = {};
    if (examOptions && examOptions.length > 0) {
      examOptions.map((item) => {
        if (item.semesterId === value) {
          newSemester = item;
        }
      });
    }
    this.setState(
      {
        stageId: value,
        // gradeId: 0,
        // courseId: 0,
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
  };
  changeScoreVisible = (index) => {
    let state = Object.assign({}, this.state);
    console.log(index, "bb");
    state[`itemViesble${index}`] = !state[`itemViesble${index}`];
    this.setState({
      ...state,
    });
  };
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
  pushToStu = (item) => {
    // window.open(`${window.location.origin}/#/course`)
    this.setState({
      viewData: { subjectId: (item && item.subjectId) || null, item: item },
      testName: item.title,
      exampleId: item.id,
      publishStatus: true,
      examTestId: item.examId,
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
  changeTestStatus = (value) => {
    this.setState(
      {
        status: value,
      },
      () => {
        this.page = 1;
        this.setState({
          scrollTop: 0,
        });
        this.getPage();
      },
    );
  };
  changeStatus = (value) => {
    this.props
      .dispatch({
        type: "home/changeSearch",
        payload: {
          statusValue: value,
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
  uploadOnChange = (info) => {
    console.log(info, "ii");
    let file = info.file;
    let { fileList } = this.state;
    if (
      file.status === "done" &&
      file.response.status &&
      file.response.ifLogin
    ) {
      let newList = [];
      newList = file.response.content;
      this.setState({
        fileList: newList,
        uploadSucceeded: true,
      });
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
  uploadWork = (info) => {
    let file = info.file;
    if (
      file.status === "done" &&
      file.response.status &&
      file.response.ifLogin
    ) {
      // let newList = [];
      // newList = file.response.content;
      this.setState(
        {
          pageNo: 1,
        },
        () => {
          this.getPage();
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
  cleanFile = () => {
    this.setState({
      fileList: [],
    });
  };
  beforeUpload = (size) => {};
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
  openView = (id, paperId, examSourceType) => {
    window.open(
      `${window.location.origin}/exam#/dataAnalysis/${id || null}/${
        paperId || null
      }/1`,
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
    this.setState(
      {
        testTitle: 1,
        initiateTestModal: true,
      },
      () => {
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
        if (item) {
          this.setState({
            examTestName: item.examName,
            selectTestId: item.paperId,
            examType1: item.paperTypeName,
          });
        }
      },
    );
  };

  readingTestClick = () => {
    this.setState(
      {
        testTitle: 2,
      },
      () => {
        this.props.dispatch({
          type: "home/getExamType",
          payload: {
            type: 1,
          },
        });
        this.props.dispatch({
          type: "home/getAllGrade",
          payload: {
            paperId: this.props.inquireId,
          },
        });
        this.props
          .dispatch({
            type: "home/getGradeClass",
            payload: {
              gradeIdList: 0,
              subjectId: 0,
              courseIdList: 0,
            },
          })
          .then(() => {
            this.setState({
              classList: this.props.classList,
            });
          });
        this.setState({
          initiateTestModal: true,
        });
      },
    );
  };

  onlineQuizOk = () => {
    this.setState({
      initiateTestModal: false,
    });
  };

  //退出发起测验对话框
  machineReadingTestCancel = () => {
    this.clearData();
    this.setState(
      {
        initiateTestModal: false,
        completeStep: false,
        initiatingSteps: 1,
      },
      () => {
        window.parent.postMessage("examUrl", "*");
        if (window.top) {
          window.parent.location.href = `${window.location.origin}/#/examAnalysis`;
        } else {
          window.location.href = `${window.location.origin}/#/examAnalysis`;
        }
        this.getPage();
      },
    );
  };

  //年月日
  onChangeDeadlineData = (date, dateString) => {
    // console.log(date, dateString, "333");
    this.setState({
      dataLine: dateString,
    });
  };

  //定时年月日
  onChangeDeadlineDataTiming = (date, dateString) => {
    // console.log(date, dateString, "333");
    this.setState({
      dataLineTiming: dateString,
    });
  };

  // 时分
  onChangeDeadlineTime = (date, dateString) => {
    this.setState({
      dataTime: dateString,
    });
  };

  // 定时时分
  onChangeDeadlineTimeTiming = (date, dateString) => {
    this.setState({
      dataTimeTiming: dateString,
    });
  };

  // 测验名称
  changeExamTestName = (e) => {
    this.setState({
      examTestName: e.target.value,
    });
  };

  //关联日课开关
  onChangeDailyClasses = (checked) => {
    let isBr = this.state.dayClassesId;
    if (!checked) {
      isBr = null;
    }
    this.setState({
      dailyClassesSwitch: checked,
      dayClassesId: isBr,
    });
  };

  // 需要评价开关
  onChangeIsEvaluate = (checked) => {
    this.setState(
      {
        evaluateChecked: checked,
      },
      () => {
        if (!checked) {
          this.setState({
            totalScoreEvaluate: null,
            studentDisplayId: undefined,
            evaluationDimensionId: null,
          });
        }
      },
    );
  };

  //评价总分
  changeTotalScoreEvaluate = (value) => {
    this.setState({
      totalScoreEvaluate: value,
    });
  };

  //维度占比
  changeProportionDimensions = (value) => {
    this.setState({
      proportionDimensions: value,
    });
  };

  changeLengthAnswerNum = (e) => {
    this.setState({
      lengthAnswerNum: e,
    });
  };

  // 测验说明
  changeTestDescription = (e) => {
    this.setState({
      testDescription: e.target.value,
    });
  };

  // 搜索学生姓名
  changeStuName = (e) => {
    this.setState({
      stuName: e.target.value,
    });
  };

  // 搜索
  searchStuName = (e) => {
    // this.props.dispatch({});
    const { chooseCourseId, dayClassesId } = this.state;
    if (dayClassesId) {
      if (dayClassesId.length == 2) {
        this.props.dispatch({
          type: "publishToStudent/getGroupList",
          payload: {
            courseId: chooseCourseId,
            unitId: dayClassesId[0],
            activityId: dayClassesId[1],
            matchName: e,
          },
        });
      } else {
        this.props.dispatch({
          type: "publishToStudent/getCourseStudents",
          payload: {
            courseId: chooseCourseId,
            matchName: e,
          },
        });
      }
    } else {
      this.props.dispatch({
        type: "publishToStudent/getCourseStudents",
        payload: {
          courseId: chooseCourseId,
          matchName: e,
        },
      });
    }
  };

  // 点击选择学生
  clicksSelectStudents = () => {
    if (this.state.completeStep) {
      this.setState({
        initiatingSteps: 2,
      });
    }
  };

  //点击填写测验设置
  clickFillInTestSettings = () => {
    if (this.state.completeStep) {
      this.setState({
        initiatingSteps: 1,
      });
    }
  };

  //班级
  changeClass = (value) => {
    this.setState({
      group: value,
    });
  };

  //学号
  changeStuNo = (e) => {
    console.log("radio checked", e.target.value);
    this.setState({
      stuNo: e.target.value,
    });
  };

  //立即上传
  uploadOnChange1 = (info) => {
    let file = info.file;
    let newList = JSON.parse(JSON.stringify(this.state.fileList));
    if (
      file.status === "done" &&
      file.response.status &&
      file.response.ifLogin
    ) {
      // console.log("come");
      // console.log(newList, file, "ss");
      newList.push(file.response.content[0]);
      // console.log(newList, "222");
      this.setState(
        {
          fileList: [newList[0]],
        },
        () => {
          // let fileIdList = [];
          // newList.map((item) => {
          //   fileIdList.push(item.fileId);
          // });
          // this.props.dispatch({
          //   type: "home/PostBindUploadedFile",
          //   payload: {
          //     examId: this.testId,
          //     fileIdList: [file.response.content[0].fileId],
          //   },
          // });
        },
      );
    }
  };
  //上传类型
  changeUploadType = (e) => {
    this.setState({
      uploadType: e.target.value,
    });
  };

  // 点击查看历史版本
  clickHisVersion = () => {
    this.setState(
      {
        historicalVersion: true,
      },
      () => {
        this.props
          .dispatch({
            type: "home/historyTestList",
            payload: {
              paperId: 0,
            },
          })
          .then(() => {
            const { historyTestList } = this.props;
            let newHistoryTestList = JSON.parse(
              JSON.stringify(historyTestList),
            );
            // this.downloadTestList = historyTestList;
            for (const [index, value] of newHistoryTestList.entries()) {
              value["originalTest"] = "下载";
              value["printingTest"] = "下载";
            }
            this.props.dispatch({
              type: "home/changeHistoryTestList",
              payload: {
                historyTestList: newHistoryTestList,
              },
            });
          });
      },
    );
  };

  //学生
  changeStu = (e, id) => {
    const { groupList } = this.props;
    let array = this.state.stuIdList;
    let br = false;
    let index = 0;
    let state = Object.assign({}, this.state);
    let number_ = 0;
    state[`stuChecked${id}`] = e.target.checked;
    if (!e.target.checked) {
      state[`allStuChecked${this.state.classIndex}`] = false;
    }
    if (e.target.checked) {
      if (array.length === 0) {
        array.push({
          groupId: groupList[this.state.classIndex].groupCourseId,
          id: id,
        });
      } else {
        array.map((item) => {
          if (item.id == id) {
            return;
          }
        });
        array.push({
          groupId: groupList[this.state.classIndex].groupCourseId,
          id: id,
        });
      }
      groupList &&
        groupList[this.state.classIndex] &&
        groupList[this.state.classIndex].studentList &&
        groupList[this.state.classIndex].studentList.length &&
        groupList[this.state.classIndex].studentList.map((item) => {
          if (state[`stuChecked${item.id}`]) {
            index += 1;
          }
        });
      if (groupList[this.state.classIndex].studentList.length == index) {
        state[`allStuChecked${this.state.classIndex}`] = true;
      }
      groupList &&
        groupList.length &&
        groupList.map((item) => {
          number_ += item.studentList.length;
        });
      if (number_ == array.length) {
        br = true;
      }
    } else {
      array = array.filter((item) => {
        return item.id !== id;
      });
    }
    this.setState({
      ...state,
      stuIdList: array,
      allGroupsChecked: br,
    });
    console.log(array, "222");
  };

  //所有学生
  changeAllStu = (e, id) => {
    const { groupList } = this.props;
    let br = false;
    let number_ = 0;
    let array = this.state.stuIdList;
    let state = Object.assign({}, this.state);
    state[`allStuChecked${this.state.classIndex}`] = e.target.checked;
    groupList &&
      groupList.length &&
      groupList.map((it) => {
        number_ += it.studentList.length;
      });
    groupList &&
      groupList[this.state.classIndex] &&
      groupList[this.state.classIndex].studentList &&
      groupList[this.state.classIndex].studentList.length &&
      groupList[this.state.classIndex].studentList.map((item, index) => {
        state[`stuChecked${item.id}`] = e.target.checked;
        if (e.target.checked) {
          if (array.length === 0) {
            array.push({
              groupId: groupList[this.state.classIndex].groupCourseId,
              id: item.id,
            });
          } else {
            array.push({
              groupId: groupList[this.state.classIndex].groupCourseId,
              id: item.id,
            });
          }
        } else {
          return;
        }
      });
    array.filter(Boolean);

    if (e.target.checked) {
      var object = {};
      array = array.reduce(function (item, next) {
        object[next.id] ? "" : (object[next.id] = true && item.push(next));
        return item;
      }, []);
      if (array.length == number_) {
        br = true;
      }
    } else {
      array = array.filter((item) => {
        return item.groupId !== id;
      });
    }

    this.setState({
      ...state,
      allGroupsChecked: br,
      stuIdList: array,
    });
    console.log(array, "2222");
  };

  //所有组
  changeAllGroups = (e) => {
    const { groupList } = this.props;
    let array = [];
    let state = Object.assign({}, this.state);
    groupList &&
      groupList.length &&
      groupList.map((item, index) => {
        state[`allStuChecked${index}`] = e.target.checked;
        item.studentList.length &&
          item.studentList.map((it) => {
            state[`stuChecked${it.id}`] = e.target.checked;
            if (e.target.checked) {
              array.push({
                groupId: item.groupCourseId,
                id: it.id,
              });
            } else {
              array = [];
            }
          });
      });
    this.setState({
      ...state,
      allGroupsChecked: e.target.checked,
      stuIdList: array,
    });
    console.log(array, "22222");
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

  // 点击编辑答题卡
  clickAnswerCard = () => {
    this.setState({
      initiateTestModal: true,
      testTitle: 2,
      initiatingSteps: 2,
      completeStep: true,
    });
  };

  // 点击发起测验
  clickInitiateTest = (item) => {
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

    this.props
      .dispatch({
        type: "home/getExamInfoByExamId",
        payload: {
          examId: item.examId,
        },
      })
      .then(() => {
        const { examInfoByExamId } = this.props;

        this.setState(
          {
            initiateTestModal: true,
            testTitle: 1,
            initiatingSteps: 1,
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
            // dayClassesId: [
            //   examInfoByExamId.lessonAndAppraiseModel.unitId,
            //   examInfoByExamId.lessonAndAppraiseModel.lessonId,
            // ], //日课id
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
            evaluationItemName:
              examInfoByExamId.lessonAndAppraiseModel.evaluationItemId,
            selectTestId: examInfoByExamId.paperId,
            examIdModal: examInfoByExamId.examId,
            taskId: examInfoByExamId.taskId,
            isAnswer: examInfoByExamId.forceSubmit ? 2 : 1,
          },
          () => {
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
            if (examInfoByExamId.lessonAndAppraiseModel?.lessonId) {
              this.props.dispatch({
                type: "publishToStudent/getGroupList",
                payload: {
                  courseId: examInfoByExamId.courseId,
                  unitId: examInfoByExamId.lessonAndAppraiseModel.unitId,
                  activityId: examInfoByExamId.lessonAndAppraiseModel.lessonId,
                  matchName: "",
                },
              });
            } else {
              this.props.dispatch({
                type: "publishToStudent/getCourseStudents",
                payload: {
                  courseId: examInfoByExamId.courseId,
                },
              });
            }
          },
        );
      });
  };

  // 点击编辑测验设置
  clickTestSettings = (id, hide, pushNumber) => {
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
            isStudentSelest: hide == "aaa" ? true : false,
            initiateTestModal: hide == "aaa" ? false : true,
            testTitle: 1,
            // initiatingSteps: hide == "bbb" ? 2 : 1,
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
            if (hide == "aaa") {
              this.props
                .dispatch({
                  type: "home/getTaskPublishDisplay",
                  payload: {
                    ifCopyTask: false,
                    taskId: examInfoByExamId.taskId,
                  },
                })
                .then(() => {
                  this.setState({
                    disabledStu:
                      (this.props.taskPublishDisplayList &&
                        this.props.taskPublishDisplayList.lockStudentList) ||
                      [],
                  });
                });
            }
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
            if (examInfoByExamId.lessonAndAppraiseModel?.lessonId) {
              this.props.dispatch({
                type: "publishToStudent/getGroupList",
                payload: {
                  courseId: examInfoByExamId.courseId,
                  unitId: examInfoByExamId.lessonAndAppraiseModel.unitId,
                  activityId: examInfoByExamId.lessonAndAppraiseModel.lessonId,
                  matchName: "",
                },
              });
            } else {
              this.props.dispatch({
                type: "publishToStudent/getCourseStudents",
                payload: {
                  courseId: examInfoByExamId.courseId,
                },
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

  changeExamType = (value) => {
    this.setState({
      examType1: value,
    });
  };

  // 选择课程
  changeChooseCourse = (id) => {
    this.setState({
      chooseCourseId: id,
      evaluationDimensionId: null,
      totalScoreEvaluate: null,
      studentDisplayId: undefined,
      evaluativeItemsId: null,
    });
    this.props.dispatch({
      type: "publishToStudent/getActivityList",
      payload: { courseId: id },
    });
    this.props.dispatch({
      type: "home/getSelectEvaluationCategoryByExample",
      payload: { courseId: id },
    });
  };

  // 选择年级
  changeGradeModal = (id) => {
    this.setState({
      gradeIdModal: id,
    });
  };

  // 选择学科
  changeSubjectModal = (id) => {
    this.setState({
      subjedtIdModal: id,
    });
    this.props
      .dispatch({
        type: "publishToStudent/getCourseList",
        payload: {
          // gradeIdList: [this.state.gradeModalId],
          subjectId: id,
        },
      })
      .then(() => {
        if (this.props.courseList.length == 1) {
          this.setState(
            {
              chooseCourseId: this.props.courseList[0].courseId,
            },
            () => {
              this.props.dispatch({
                type: "publishToStudent/getActivityList",
                payload: { courseId: this.props.courseList[0].courseId },
              });
              this.props.dispatch({
                type: "home/getSelectEvaluationCategoryByExample",
                payload: { courseId: this.props.courseList[0].courseId },
              });
            },
          );
        }
      });
  };

  // 点击 确认，下一步
  clickNextStep = () => {
    const {
      examTestName,
      examType1,
      subjedtIdModal,
      chooseCourseId,
      testDescription,
      dailyClassesSwitch,
      dayClassesId,
      evaluateChecked,
      totalScoreEvaluate,
      studentDisplayId,
      evaluationDimensionId,
      evaluationItemName,
      selectTestId,
      examIdModal,
      taskId,
      scoreStuChecked,
      isLengthAnswer,
      lengthAnswerNum,
      corrAnsVis,
    } = this.state;
    if (!examTestName) {
      message.error(trans("homeWork.examNameRequired", "请填写测验名称"));
      return;
    }
    if (!selectTestId) {
      message.error(trans("homeWork.paperRequired", "请选择试卷"));
      return;
    }
    if (!subjedtIdModal) {
      message.error(trans("homeWork.subjectRequired", "请选择学科"));
      return;
    }
    if (!chooseCourseId) {
      message.error(trans("homeWork.courseRequired", "请选择课程"));
      return;
    }
    if (!examType1) {
      message.error(trans("homeWork.paperTypeRequired", "请选择试卷类型"));
      return;
    }
    if (dailyClassesSwitch && !dayClassesId) {
      message.error(trans("homeWork.dailyLessonRequired", "请选择日课"));
      return;
    }
    if (evaluateChecked) {
      if (!evaluationDimensionId) {
        message.error(trans("global.pleaseSelect", "请选择评价维度"));
        return;
      }
      if (!totalScoreEvaluate) {
        message.error(trans("homeWork.totalScoreRequired", "请选择总分"));
        return;
      }
      if (!studentDisplayId && studentDisplayId === undefined) {
        message.error(
          trans("homeWork.studentDisplayRequired", "请选择学生显示"),
        );
        return;
      }
    }
    if (isLengthAnswer && !lengthAnswerNum) {
      message.error(trans("homeWork.answerDurationRequired", "请输入答题时长"));
      return;
    }
    this.createTest();
    this.setState({
      initiatingSteps: 2,
      completeStep: true,
      taskId: this.props.resourceCreate.taskId,
    });
    this.getStudents();
  };

  // 点击上一步
  clickPreviousStep = () => {
    this.setState({
      initiatingSteps: 1,
      // examIdModal: this.props.resourceCreate.examId,
    });
  };

  // 点击直接保存
  clickSaveDirectly = () => {
    const {
      examTestName,
      examType1,
      subjedtIdModal,
      chooseCourseId,
      testDescription,
      dailyClassesSwitch,
      dayClassesId,
      evaluateChecked,
      totalScoreEvaluate,
      studentDisplayId,
      evaluationDimensionId,
      evaluationItemName,
      selectTestId,
      examIdModal,
      taskId,
      scoreStuChecked,
      isLengthAnswer,
      lengthAnswerNum,
    } = this.state;
    if (!examTestName) {
      message.error(trans("homeWork.examNameRequired", "请填写测验名称"));
      return;
    }
    if (!selectTestId) {
      message.error(trans("homeWork.paperRequired", "请选择试卷"));
      return;
    }
    if (!subjedtIdModal) {
      message.error(trans("homeWork.subjectRequired", "请选择学科"));
      return;
    }
    if (!chooseCourseId) {
      message.error(trans("homeWork.courseRequired", "请选择课程"));
      return;
    }
    if (!examType1) {
      message.error(trans("homeWork.paperTypeRequired", "请选择试卷类型"));
      return;
    }
    if (dailyClassesSwitch && !dayClassesId) {
      message.error(trans("homeWork.dailyLessonRequired", "请选择日课"));
      return;
    }
    if (evaluateChecked) {
      if (!evaluationDimensionId) {
        message.error(trans("global.pleaseSelect", "请选择评价维度"));
        return;
      }
      if (!totalScoreEvaluate) {
        message.error(trans("homeWork.totalScoreRequired", "请选择总分"));
        return;
      }
      if (!studentDisplayId && studentDisplayId === undefined) {
        message.error(
          trans("homeWork.studentDisplayRequired", "请选择学生显示"),
        );
        return;
      }
    }
    if (isLengthAnswer && !lengthAnswerNum) {
      message.error(trans("homeWork.answerDurationRequired", "请输入答题时长"));
      return;
    }
    this.createTest();
    this.setState(
      {
        initiateTestModal: false,
      },
      () => {
        this.clearData();
        this.getPage();
      },
    );
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

  //创建试卷
  createTest = () => {
    const {
      examTestName,
      examType1,
      subjedtIdModal,
      chooseCourseId,
      testDescription,
      dailyClassesSwitch,
      dayClassesId,
      evaluateChecked,
      totalScoreEvaluate,
      studentDisplayId,
      evaluationDimensionId,
      evaluationItemName,
      selectTestId,
      examIdModal,
      taskId,
      scoreStuChecked,
      corrAnsVis,
      isLengthAnswer,
      lengthAnswerNum,
      isAnswer,
      proportionDimensions,
      creatEvaluationItemId,
      evaluativeItemsId,
    } = this.state;
    if (this.state.testTitle == 1) {
      this.props
        .dispatch({
          type: "home/postResourceCreate",
          payload: {
            examName: examTestName, //试卷名称
            examType: examType1, //试卷类型
            subjectId: subjedtIdModal, //学科id
            courseId: chooseCourseId, //课程id
            examIllustrate: testDescription, //测验说明
            iFAssociateLessonId: dailyClassesSwitch, //日课开关
            lessonId: dayClassesId && dayClassesId[1] ? dayClassesId[1] : null, //日课id
            iFNeedAppraise: evaluateChecked, //评价开关
            total: totalScoreEvaluate, //总分
            evaluationCriterionId: studentDisplayId, //学生显示
            evaluationCategoryId: evaluationDimensionId, //评价维度id
            evaluationItemName: evaluateChecked
              ? evaluativeItemsId == 0
                ? examTestName
                : evaluationItemName
              : null,
            evaluationItemId: evaluateChecked
              ? evaluativeItemsId == 0
                ? [creatEvaluationItemId || examTestName]
                : [evaluativeItemsId]
              : [],
            paperId: selectTestId,
            examId: examIdModal,
            origin: 3,
            distributionType: 1,
            taskId: taskId,
            openScore: scoreStuChecked,
            answerTime: isLengthAnswer ? lengthAnswerNum : null,
            forceSubmit: isAnswer == 2 ? true : false,
            weights: proportionDimensions,
            openAnswer: corrAnsVis,
          },
        })
        .then(() => {
          this.setState({
            taskId: this.props.resourceCreate.taskId,
            examIdModal: this.props.resourceCreate.examId,
            creatEvaluationItemId: this.props.resourceCreate.evaluationItemId,
          });
        });
    }
  };

  // 选择试卷
  changeSelectTest = (id) => {
    this.props
      .dispatch({
        type: "home/getPaperInfo",
        payload: {
          paperId: id,
        },
      })
      .then(() => {
        const { paperInfo, paperList } = this.props;
        let gareId = null;
        paperList &&
          paperList.examList.length &&
          paperList.examList.map((item) => {
            if (item.id == id) {
              gareId = item.gradeId;
            }
          });
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
                this.setState(
                  {
                    chooseCourseId: this.props.courseList[0].courseId,
                  },
                  () => {
                    this.props.dispatch({
                      type: "publishToStudent/getActivityList",
                      payload: { courseId: this.props.courseList[0].courseId },
                    });
                    this.props.dispatch({
                      type: "home/getSelectEvaluationCategoryByExample",
                      payload: { courseId: this.props.courseList[0].courseId },
                    });
                  },
                );
              }
            });
        }
        this.setState({
          selectTestId: id,
          // totalScoreEvaluate: paperInfo.totalScore,
          examTestName: paperInfo.examPaperName,
          examType1: paperInfo.examType,
          gradeModalId: gareId,
          subjedtIdModal: paperInfo.subjectId,
        });
      });
  };

  changeSelectTest1 = (id) => {
    this.setState({
      selectTestId: id,
    });
  };

  // 选择日课
  changeDayClasses = (id) => {
    this.setState({
      dayClassesId: id,
    });
  };

  //学生显示
  changeStudentDisplay = (id) => {
    this.setState({
      studentDisplayId: id,
    });
  };

  // 选择评价维度
  changeEvaluationDimension = (id, a) => {
    this.setState(
      {
        evaluationDimensionId: id,
        evaluationItemName: a.props.children,
        evaluativeItemsId: 0,
      },
      () => {
        this.props
          .dispatch({
            type: "home/getEvaluationItemListByCategoryId",
            payload: {
              evaluationCategoryId: this.state.evaluationDimensionId,
            },
          })
          .then(() => {});
      },
    );
  };
  changeEvaluationDimensionId = (id, a) => {
    this.setState(
      {
        evaluativeItemsId: id,
        evaluationItemName: a.props.children,
      },
      () => {
        const { evaluationItemListByCategoryId } = this.props;
        if (id == 0) {
          this.setState({
            proportionDimensions: null,
            totalScoreEvaluate: "",
            studentDisplayId: undefined,
          });
        }
        evaluationItemListByCategoryId &&
          evaluationItemListByCategoryId.length > 0 &&
          evaluationItemListByCategoryId.map((item) => {
            if (item.id == this.state.evaluativeItemsId) {
              this.setState({
                proportionDimensions: item.weights,
                totalScoreEvaluate: item.totalScore,
                studentDisplayId: item.evaluationCriterionId,
              });
            }
          });
      },
    );
  };

  // 获取学生
  getStudents = () => {
    const { dayClassesId, stuName } = this.state;
    if (dayClassesId) {
      if (dayClassesId.length == 2) {
        this.props.dispatch({
          type: "publishToStudent/getGroupList",
          payload: {
            courseId: this.state.chooseCourseId,
            unitId: dayClassesId && dayClassesId[0] ? dayClassesId[0] : null,
            activityId:
              dayClassesId && dayClassesId[1] ? dayClassesId[1] : null,
            matchName: stuName,
          },
        });
      } else {
        this.props.dispatch({
          type: "publishToStudent/getCourseStudents",
          payload: {
            courseId: this.state.chooseCourseId,
          },
        });
      }
    } else {
      this.props.dispatch({
        type: "publishToStudent/getCourseStudents",
        payload: {
          courseId: this.state.chooseCourseId,
        },
      });
    }
  };

  // 点击切换班级
  switchClasses = (index, id) => {
    this.setState({
      classIndex: index,
      switchClassesId: id,
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

  // 点击预览试卷
  clickPreviewTestPaper = () => {
    // this.props
    //   .dispatch({
    //     type: "home/getViewOrDownPaper",
    //     payload: {
    //       paperId: this.state.selectTestId,
    //     },
    //   })
    //   .then(() => {
    //     if (this.props.viewOrDownPaper.moduleList.length == 0) {
    //       window.open(this.props.viewOrDownPaper.url);
    //     } else {
    // window.open(
    //   `${window.location.origin}/exam#/dataAnalysis/${this.props.uploadPaper.paperId}/${this.props.uploadPaper.paperId}/1/3`
    // );
    window.open(
      `${window.location.origin}/exam#/detail/true/true/${this.state.selectTestId}`,
    );
    // }
    // });
  };

  //点击立即发布
  clickReleaseNow = () => {
    const {
      stuIdList,
      selectTestId,
      dataLine,
      dataLineTiming,
      dataTime,
      dataTimeTiming,
      dayClassesId,
      evaluationDimensionId,
      publishType,
    } = this.state;
    let deadlineTime = new Date(`${dataLine} ${dataTime}`).getTime();
    let timingTime = new Date(`${dataLineTiming} ${dataTimeTiming}`).getTime();
    let currentTime = Date.now();
    if (stuIdList.length === 0) {
      message.warning(
        trans("global.selectAtLeastOneStudent", "请至少选择一个学生哦~"),
      );
      return;
    }
    if (publishType == "1" && deadlineTime < timingTime) {
      message.error(
        trans("homeWork.publishTimeAfterDeadline", "发布时间不能大于截止时间"),
      );
      return;
    }
    if (publishType == "1" && timingTime < currentTime) {
      message.error(
        trans("homeWork.publishTimeBeforeNow", "发布时间不能小于当前时间"),
      );
      return;
    }
    this.props
      .dispatch({
        type: "publishToStudent/release",
        payload: {
          resourceRequestList: [
            {
              groupId: null, //班级id
              lessonId:
                dayClassesId && dayClassesId[1] ? dayClassesId[1] : null,
              taskId: this.state.taskId, //任务id
              evaluationItemId: evaluationDimensionId,
              // ifTiming: 0,
              deadTime: `${dataLine}  ${dataTime}`, //截止日期
              studentList: stuIdList,
              expectTime: 0,
              examPaperId: selectTestId, //试卷id
              ifTiming: publishType == "0" ? 0 : 1,
              publishTime:
                publishType == "1"
                  ? `${dataLineTiming}  ${dataTimeTiming}`
                  : null,
            },
          ],
        },
        onSuccess: () => {
          this.setState(
            {
              initiateTestModal: false,
            },
            () => {
              this.clearData();
              this.getPage();
            },
          );
        },
      })
      .then(() => {});

    // .then(() => {
    //   this.setState(
    //     {
    //       initiateTestModal: false,
    //     },
    //     () => {
    //       this.clearData();
    //       this.getPage();
    //     }
    //   );
    // });
  };

  setStu = (data) => {
    console.log(data, "dsds");
    this.setState(
      {
        publishType: data.publishType,
        dataLine: data.dataLine,
        dataTime: data.dataTime,
        dataLineTiming: data.dataLineTiming,
        dataTimeTiming: data.dataTimeTiming,
        stuIdList: data.stuIdList,
      },
      () => {
        this.clickReleaseNow();
      },
    );
  };

  //切换发布类型
  changePublishType = (item) => {
    this.setState({
      publishType: item.key,
    });
  };

  // 测验名称
  examNameChange = (id, e) => {
    e.preventDefault();
    // console.log(111);
    this.props
      .dispatch({
        type: "home/getEditPaperOrExamName",
        payload: {
          examId: id,
          name: e.target.value,
        },
      })
      .then(() => {
        this.getPage();
      });
  };

  doubleClickExamName = (id, e) => {
    e.preventDefault();
    console.log(111);
    let state = Object.assign({}, this.state);
    state[`isExamTitle${id}`] = true;
    this.setState(
      {
        ...state,
      },
      () => {
        const titleInp = document.querySelector("#headerInput");
        titleInp.focus();
      },
    );
  };

  blueInputTitle = (id, e) => {
    let state = Object.assign({}, this.state);
    state[`isExamTitle${id}`] = false;
    this.props
      .dispatch({
        type: "home/getEditPaperOrExamName",
        payload: {
          examId: id,
          name: e.target.value,
        },
      })
      .then(() => {
        this.setState({
          ...state,
        });
        this.getPage();
      });
  };

  searchTest = (value) => {
    this.props.dispatch({
      type: "home/getPaperList",
      payload: {
        semesterId: null,
        gradeId: null,
        examTypeCode: null,
        subjectId: null,
        examName: value,
        viewType: 2,
        pageNo: 1, //pageNo是当前页码
        limit: 500, //limit是每页的数据数量
        sourceType: 0,
      },
    });
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

  handleVisibleChange = (value) => {
    this.setState({
      visSetTiming: value,
    });
  };

  clickTimeancle = () => {
    this.setState({
      visSetTiming: false,
    });
  };

  clickTimeSure = () => {
    this.setState({
      visSetTiming: false,
      publishType: "1",
    });
  };

  changeScoreStuChecked = (e) => {
    this.setState({
      scoreStuChecked: e,
    });
  };
  changeCorrAnsVis = (e) => {
    this.setState({
      corrAnsVis: e,
    });
  };

  changeIsLengthAnswer = (e) => {
    this.setState({
      isLengthAnswer: e,
    });
  };

  onChangeIsAnswer = (e) => {
    this.setState({
      isAnswer: e.target.value,
    });
  };

  handleCancel = () => {
    this.setState({
      isStudentSelest: false,
    });
  };

  onRef = (reference) => {
    this.studentSelect = reference;
  };

  clickCancle = () => {
    this.setState(
      {
        initiateTestModal: false,
      },
      () => {
        this.clearData();
      },
    );
  };

  renderTotal = () => {
    let number_ = false;
    if (this.props.groupList && this.props.groupList.length > 0) {
      this.props.groupList.map((item) => {
        item.studentList.map((it) => {
          if (this.state.stuIdList && this.state.stuIdList.length > 0) {
            this.state.stuIdList.map((index) => {
              if (index.id === it.id) {
                number_ = true;
              } else {
                if (
                  this.state.disabledStu &&
                  this.state.disabledStu.length > 0
                ) {
                  this.state.disabledStu.map((ite) => {
                    if (ite.id === it.id) {
                      number_ = true;
                    }
                  });
                }
              }
            });
          } else {
            if (this.state.disabledStu && this.state.disabledStu.length > 0) {
              this.state.disabledStu.map((ite) => {
                if (ite.id === it.id) {
                  number_ = true;
                }
              });
            }
          }
        });
      });
    }
    return number_;
  };
  //所有学生
  changeAllStuAndClass(e, id, ind) {
    const { groupList } = this.props;
    let br = false;
    let number_ = 0;
    let array = this.state.stuIdList;
    let state = Object.assign({}, this.state);
    state[`allStuChecked${ind}`] = e.target.checked;
    let newNumber = 0;
    groupList &&
      groupList.length &&
      groupList.map((it) => {
        number_ += it.studentList.length;
        it.studentList.map((ite) => {
          if (this.props.disabledStu && this.props.disabledStu.length > 0) {
            this.props.disabledStu.map((itee) => {
              if (ite.id === itee.id) {
                newNumber += 1;
              }
            });
          }
        });
      });
    groupList &&
      groupList[ind] &&
      groupList[ind].studentList &&
      groupList[ind].studentList.length &&
      groupList[ind].studentList.map((item, index) => {
        state[`stuChecked${item.id}`] = e.target.checked;
        if (e.target.checked) {
          if (array.length === 0) {
            let count = false;
            if (this.props.disabledStu && this.props.disabledStu.length > 0) {
              this.props.disabledStu.map((ite) => {
                if (ite.id === item.id) {
                  count = true;
                }
              });
            }
            if (!count) {
              array.push({
                groupId: groupList[ind].groupCourseId,
                id: item.id,
              });
            }
          } else {
            let count = false;
            if (this.props.disabledStu && this.props.disabledStu.length > 0) {
              this.props.disabledStu.map((ite) => {
                if (ite.id === item.id) {
                  count = true;
                }
              });
            }
            if (!count) {
              array.push({
                groupId: groupList[ind].groupCourseId,
                id: item.id,
              });
            }
          }
        } else {
          return;
        }
      });
    array.filter(Boolean);
    console.log(array);
    if (e.target.checked) {
      var object = {};
      array = array.reduce(function (item, next) {
        object[next.id] ? "" : (object[next.id] = true && item.push(next));
        return item;
      }, []);
      if (array.length + newNumber == number_) {
        br = true;
      }
    } else {
      array = array.filter((item) => {
        return item.groupId !== id;
      });
    }

    this.setState({
      ...state,
      allGroupsChecked: br,
      stuIdList: array,
    });
  }

  renderInder(index) {
    let number_ = false;
    if (this.props.groupList && this.props.groupList[index]) {
      this.props.groupList[index].studentList.map((it) => {
        if (this.state.stuIdList && this.state.stuIdList.length > 0) {
          this.state.stuIdList.map((index_) => {
            if (index_.id === it.id) {
              number_ = true;
            } else {
              if (this.props.disabledStu && this.props.disabledStu.length > 0) {
                this.props.disabledStu.map((ite) => {
                  if (ite.id === it.id) {
                    number_ = true;
                  }
                });
              }
            }
          });
        } else {
          if (this.props.disabledStu && this.props.disabledStu.length > 0) {
            this.props.disabledStu.map((ite) => {
              if (ite.id === it.id) {
                number_ = true;
              }
            });
          }
        }
      });
    }
    return number_;
  }

  renderNum(index) {
    let number_ = 0;
    let list = this.state.disabledStu
      ? JSON.parse(JSON.stringify(this.state.disabledStu))
      : [];
    if (this.props.groupList && this.props.groupList[index]) {
      this.props.groupList[index].studentList.map((it) => {
        if (this.state.stuIdList && this.state.stuIdList.length > 0) {
          this.state.stuIdList.map((index_) => {
            if (index_.id === it.id) {
              number_ += 1;
            } else {
              if (list && list) {
                list.map((ite, ind) => {
                  if (ite.id === it.id) {
                    number_ += 1;
                    list.splice(ind, 1);
                  }
                });
              }
            }
          });
        } else {
          if (list && list.length > 0) {
            list.map((ite, ind) => {
              if (ite.id === it.id) {
                number_ += 1;
                list.splice(ind, 1);
              }
            });
          }
        }
      });
    }
    return number_ === 0 ? <div></div> : <div>({number_})</div>;
  }
  batchDownLoad = () => {};
  uploadHomeWork = () => {};
  changeUpVisible = () => {
    this.setState({
      upVisible: !this.state.upVisible,
      fileList: [],
    });
  };
  changeDownVisible = () => {
    this.setState({
      downloadVisible: !this.state.downloadVisible,
    });
  };
  uploadCard = () => {};
  cancelUp = () => {
    this.changeUpVisible();
  };
  sureUp = () => {
    this.changeUpVisible();
  };
  cancelDown = () => {
    this.changeDownVisible();
  };
  sureDown = () => {
    this.changeDownVisible();
  };
  changeWorkList = (id, e) => {
    console.log(id, e, "da");
    let newList = JSON.parse(JSON.stringify(this.state.checkWorkList));
    if (e.target.checked) {
      newList.push(id);
    } else {
      let index_ = null;
      newList.map((item, index) => {
        if (item === id) {
          index_ = index;
        }
      });
      newList.splice(index_, 1);
    }
    this.setState(
      {
        checkWorkList: newList,
      },
      () => {
        console.log(this.state.checkWorkList);
      },
    );
  };
  changeWorkType = (checkedValues) => {
    console.log("checked =", checkedValues);
    this.setState({
      workType: checkedValues,
    });
  };
  render() {
    const {
      examOptions,
      examList,
      currentUser: { showRevisePaper },

      activityList,

      groupList,
    } = this.props;
    const {
      IconFont,
      viewData,
      exampleId,
      testName,
      defaultSemester,
      examTestId,
      disabledStu,
      checkExam,
      isStudentSelest,
      upVisible,
      downloadVisible,
      fileList,
      workType,
    } = this.state;
    const workList = [
      { name: "作业1", id: 1 },
      { name: "作业2", id: 2 },
      { name: "作业3", id: 3 },
      { name: "作业4", id: 4 },
      { name: "作业5", id: 5 },
      { name: "作业6", id: 6 },
      { name: "作业7", id: 7 },
      { name: "作业8", id: 8 },
      { name: "作业9", id: 9 },
      { name: "作业10", id: 10 },
    ];
    const uploadProperties = {
      name: "file",
      action: "/api/upload_file",
      multiple: true,
      accept: "file/*",
      showUploadList: false,
      headers: {
        authorization: "authorization-text",
      },
      onChange: this.uploadOnChange,
      beforeUpload: this.beforeUpload.bind(this, 20),
    };
    const upWorkProperties = {
      name: "file",
      action: "/api/upload_file",
      multiple: true,
      accept: "file/*",
      showUploadList: false,
      headers: {
        authorization: "authorization-text",
      },
      onChange: this.uploadWork,
      beforeUpload: this.beforeUpload.bind(this, 20),
    };
    let optionsDayClassesList = [];
    activityList &&
      activityList.length &&
      activityList.map((item) => {
        let array = [];
        item.activityResponseList &&
          item.activityResponseList.length &&
          item.activityResponseList.map((item) => {
            array.push({
              value: item.id,
              label: item.name,
            });
          });
        optionsDayClassesList.push({
          value: item.id,
          label: item.name,
          children: array,
        });
      });
    let device = window.yg;
    const plainOptions = [
      { label: trans("global.workList", "作业单"), value: 1 },
      { label: trans("global.workCard", "作业单"), value: 2 },
    ];
    return (
      <div className={styles.examBox}>
        <div className={styles.testContent}>
          <div className={styles.testListBox}>
            <div
              className={styles.searchBar}
              style={device == "ipad" ? {} : { height: "40px" }}
              data-block="搜索"
            >
              <span className={styles.viewBox}>
                <span
                  onClick={() => this.switchTab(1)}
                  className={[
                    styles.viewTab,
                    checkExam === 1 ? styles.isCheck : "",
                  ].join(" ")}
                  data-type="我的测验"
                >
                  {trans("test.myHomeWork", "我的作业")}
                </span>
                <span
                  onClick={() => this.switchTab(0)}
                  className={[
                    styles.viewTab,
                    checkExam === 0 ? styles.isCheck : "",
                  ].join(" ")}
                  data-type="校本测验"
                >
                  {trans("test.schoolWork", "校本作业")}
                </span>
              </span>
              <span
                className={[styles.inline, styles.semesterSelect1].join(" ")}
                data-type="全部学期"
                id="allSemesterId"
              >
                <Select
                  onChange={this.changeStage}
                  value={this.state.stageId}
                  style={{ width: 200 }}
                  // open="true"
                  getPopupContainer={() =>
                    document.querySelector(`#allSemesterId`)
                  }
                >
                  <Option value={0} key={0}>
                    {trans("global.allSemester", "全部学期")}
                  </Option>
                  {examOptions && examOptions.length > 0
                    ? examOptions.map((item) => (
                        <Option value={item.semesterId} key={item.semesterId}>
                          <span title={item.semesterName}>
                            {item.semesterName}
                          </span>
                        </Option>
                      ))
                    : null}
                </Select>
              </span>
              <span className={styles.inline} data-type="全部年级">
                <Select
                  onChange={this.changeGrade}
                  value={this.state.gradeId}
                  style={{ width: 150 }}
                >
                  <Option value={0} key={0}>
                    {trans("global.allGrade", "全部年级")}
                  </Option>
                  {defaultSemester.gradeList &&
                  defaultSemester.gradeList.length > 0
                    ? defaultSemester.gradeList.map((item) => (
                        <Option value={item.gradeId} key={item.gradeId}>
                          <span title={item.gradeName}>{item.gradeName}</span>
                        </Option>
                      ))
                    : null}
                </Select>
              </span>
              <span className={styles.inline} data-type="全部学科">
                <Select
                  value={this.state.courseId}
                  style={{ width: 150 }}
                  onChange={this.changeCourse}
                >
                  <Option value={0} key={0}>
                    <span title={trans("global.allSubject", "全部学科")}>
                      {trans("global.allSubject", "全部学科")}
                    </span>
                  </Option>
                  {defaultSemester.subjectList &&
                    defaultSemester.subjectList.length &&
                    defaultSemester.subjectList.map((item) => (
                      <Option value={item.subjectId} key={item.subjectId}>
                        <span title={item.subjectName}>{item.subjectName}</span>
                      </Option>
                    ))}
                </Select>
              </span>
              <span className={styles.inline} data-type="搜索">
                <Search
                  placeholder={trans(
                    "global.forKeyWordSearch",
                    "根据关键词搜索测验",
                  )}
                  allowClear
                  value={this.state.examName}
                  onChange={this.changeSearch}
                  onSearch={this.onSearch}
                  style={{ width: 150 }}
                />
              </span>
              <div
                className={
                  device == "ipad" ? styles.ipadExamBtn : styles.examBtn
                }
              >
                <span
                  className={[styles.inline, styles.correctionPaper].join(" ")}
                  data-type="批量下载"
                >
                  <div
                    className={styles.makeCardButton}
                    onClick={this.changeDownVisible}
                  >
                    {trans("global.batchDownload", "批量下载")}
                  </div>
                </span>
                <Upload {...upWorkProperties}>
                  <span
                    className={[styles.inline, styles.makeExam].join(" ")}
                    data-type="上传作业"
                  >
                    <div
                      className={styles.makeCardButton}
                      onClick={this.uploadHomeWork}
                    >
                      {trans("global.uploadHomeWork", "上传作业")}
                    </div>
                  </span>
                </Upload>
              </div>
            </div>
            <div
              className={[
                styles.testMapList,
                device == "ipad" ? styles.ipadHeight : "",
              ].join(" ")}
              id="listBox"
            >
              {examList?.examList && examList?.examList.length ? (
                examList.examList.map((item, index) => (
                  <div
                    className={[styles.mapBox, "listItem"].join(" ")}
                    key={index}
                  >
                    <Link
                      to={`/dataAnalysis/${item.examId || null}/${
                        item.id || null
                      }/2`}
                      target="_blank"
                    >
                      <span
                        className={[styles.inline, styles.messageBox].join(" ")}
                      >
                        <div>
                          {/* {!this.state[`isExamTitle${item.examId}`] ? ( */}
                          <span
                            className={styles.header}
                            // onClick={(e) =>
                            //   this.doubleClickExamName(item.examId, e)
                            // }
                          >
                            {item.examName}
                            {item.fileStatus ? (
                              <Link
                                to={`/dataAnalysis/${item.examId || null}/${
                                  item.id || null
                                }/1`}
                                target="_blank"
                              >
                                <Icon
                                  type="eye"
                                  style={{ color: "#0445fc", marginLeft: 6 }}
                                />
                              </Link>
                            ) : null}
                          </span>
                          {/* ) : (
                            <Input
                              className={styles.headerInput}
                              id="headerInput"
                              // value={item.examName}
                              // onChange={(e) =>
                              //   this.examNameChange(item.examId, e)
                              // }
                              onClick={(e) => e.preventDefault()}
                              onBlur={(e) =>
                                this.blueInputTitle(item.examId, e)
                              }
                            />
                          )} */}
                        </div>
                        <div className={styles.content}>
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
                          <span
                            className={[styles.inline, styles.time].join(" ")}
                          >
                            <i className={styles.iconfont}>&#xe61f;</i>
                            {item.examDate}
                          </span>
                          <span
                            className={[styles.inline, styles.time].join(" ")}
                          >
                            <i className={styles.iconfont}>&#xe634;</i>
                            {trans("global.manfen", "满分")}
                            {item.totalScore}
                          </span>
                          <span
                            className={[styles.inline, styles.time].join(" ")}
                          >
                            <i className={styles.iconfont}>&#xe708;</i>
                            {item.subjectName}
                          </span>
                          <span
                            className={[styles.inline, styles.time].join(" ")}
                          >
                            <i className={styles.iconfont}>&#xe745;</i>
                            {item.gradeName}
                          </span>
                          <span
                            className={[styles.inline, styles.time].join(" ")}
                          >
                            <Icon type="user" />
                            {item.createUserName || ""}
                          </span>
                        </div>
                      </span>
                    </Link>

                    <span
                      className={[
                        styles.inline,
                        styles.optionBox,
                        item.isEdit ? styles.editOption : null,
                      ].join(" ")}
                      id={`option${item.id}`}
                      data-block="操作"
                    >
                      <Modal
                        footer={null}
                        visible={this.state[`itemViesble${item.examId}`]}
                        onCancel={this.changeScoreVisible.bind(
                          this,
                          item.examId,
                        )}
                      >
                        <div>
                          <div className={styles.messageContent}>
                            <span>
                              {trans(
                                "global.messageContent",
                                "你确定要删除这个测验吗？删除后，该测验所有内容将不可恢复。",
                              )}
                            </span>
                          </div>
                          <div className={styles.modalBottom}>
                            <Button
                              shape="round"
                              onClick={this.changeScoreVisible.bind(
                                this,
                                item.examId,
                              )}
                            >
                              {trans("global.cancle", "取消")}
                            </Button>
                            <Button
                              type="primary"
                              shape="round"
                              onClick={this.deleteTest.bind(this, item)}
                            >
                              {trans("global.sure", "确定")}
                            </Button>
                          </div>
                        </div>
                      </Modal>
                      <div className={styles.downloadBox}>
                        <div
                          className={styles.download}
                          style={{ minWidth: "80px" }}
                        >
                          <div
                            className={styles.initiateTest}
                            // onClick={() => this.clickInitiateTest(item)}
                            // onClick={() =>
                            //   this.clickTestSettings(item.examId, "aaa")
                            // }
                          >
                            <i
                              className={styles.iconfont}
                              style={{
                                fontSize: "14px",
                                color: "#0445FC",
                              }}
                            >
                              &#xe778;
                            </i>
                            <span
                              className={[styles.grades, styles.dir].join(" ")}
                            >
                              {trans("global.downloadHomeWork", "下载作业")}
                            </span>
                          </div>
                        </div>
                        <div
                          className={styles.download}
                          style={{ minWidth: "80px" }}
                        >
                          <div
                            className={styles.initiateTest}
                            // onClick={() => this.clickInitiateTest(item)}
                            // onClick={() =>
                            //   this.clickTestSettings(item.examId, "aaa")
                            // }
                          >
                            <i
                              className={styles.iconfont}
                              style={{
                                fontSize: "14px",
                                color: "#0445FC",
                              }}
                            >
                              &#xe778;
                            </i>
                            <span
                              className={[styles.grades, styles.dir].join(" ")}
                            >
                              {trans("global.downLoadCard", "下载作业")}
                            </span>
                          </div>
                        </div>
                        <div
                          className={styles.download}
                          style={{ minWidth: "80px" }}
                        >
                          <div
                            className={styles.initiateTest}
                            onClick={this.changeUpVisible.bind(this)}
                          >
                            <i
                              className={styles.iconfont}
                              style={{
                                fontSize: "14px",
                                color: "#0445FC",
                              }}
                            >
                              &#xe87a;
                            </i>
                            <span
                              className={[styles.grades, styles.dir].join(" ")}
                            >
                              {trans("global.uploadCard", "继续推送")}
                            </span>
                          </div>
                        </div>
                        {/* <div className={styles.download} data-block="测验操作">
                          <Link
                            to={`/dataAnalysis/${item.examId || null}/${
                              item.id || null
                            }/1`}
                            target="_blank"
                          >
                            <div className={styles.testPaperAnalysis}>
                              <i
                                className={styles.iconfont}
                                style={{ fontSize: "14px", color: "#0445FC" }}
                              >
                                &#xe85d;
                              </i>
                              <sapn
                                className={[styles.grades, styles.dir].join(
                                  " "
                                )}
                                data-type="预览"
                              >
                                {trans("global.preview", "预览")}
                              </sapn>
                            </div>
                          </Link>
                        </div> */}
                        <div className={styles.download}>
                          {(item.examSourceType == 0 && item.pushNum) ||
                          (item.examSourceType == 1 &&
                            item.ifThirdQuestionBankListExists) ? (
                            <Link
                              to={`/dataAnalysis/${item.examId || null}/${
                                item.id || null
                              }/2`}
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
                      <div
                        id="testMenu1"
                        className={styles.testMenu1}
                        data-block="更多"
                      >
                        <Dropdown
                          overlay={() => {
                            return (
                              <Menu onClick={this.handleMenuClick}>
                                <Menu.Item key="0" data-type="修改作业">
                                  <Link
                                    to={`/detail/false/true/${item.subjectId}/${item.id}`}
                                    // target="_blank"
                                  >
                                    {trans("global.editHomeWork", "修改作业")}
                                  </Link>
                                </Menu.Item>
                                <Menu.Item key="1" data-type="删除作业">
                                  <div
                                    to={`/detail/false/true/${item.subjectId}/${item.id}`}
                                    // target="_blank"
                                  >
                                    {trans("global.deleteHomeWork", "编辑试卷")}
                                  </div>
                                </Menu.Item>
                              </Menu>
                            );
                          }}
                          placement="bottomRight"
                          getPopupContainer={() =>
                            document.querySelector("#testMenu1")
                          }
                          // visible={true}
                        >
                          <i
                            className={[styles.iconfont, styles.more].join(" ")}
                            onClick={(e) => e.preventDefault()}
                          >
                            &#xe6fd;
                          </i>
                        </Dropdown>
                      </div>
                    </span>
                  </div>
                ))
              ) : this.props.infoStatus ? (
                IconFont ? (
                  <div className={styles.noTest}>
                    <div className={styles.iconBox}>
                      {/* <IconFont
                      type="icon-chengguoweikong"
                      className={styles.noSourceIcon}
                    />{" "} */}
                      <img className={styles.noTask} src={noTask}></img>
                    </div>
                    {/* {trans("global.noTest", "暂时没有试卷")} */}
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
            getPage={this.getPage}
          />
        ) : null}
        {viewData && viewData.subjectId && exampleId ? (
          <Modal
            title={""}
            footer={null}
            getContainer={false}
            // centered={true}
            visible={this.state.publishStatus}
            closable={false}
            maskClosable={false}
            destroyOnClose={true}
            // onCancel={this.publishCancel}
            width="480px"
            className={styles.studyModal}
          >
            <StudyActivity
              viewData={viewData}
              testName={testName}
              exampleId={exampleId}
              onCancel={this.publishCancel}
              returnMyTest={this.returnMyTest}
              view={this.view}
              examId={examTestId}
            />
          </Modal>
        ) : null}
        <Modal
          title={""}
          footer={null}
          getContainer={false}
          // centered={true}
          visible={upVisible}
          closable={false}
          maskClosable={false}
          destroyOnClose={true}
          // onCancel={this.publishCancel}
          width="500px"
          className={styles.studyModal}
        >
          <div className={styles.uploadDom}>
            <div className={styles.uploadHeader}>
              <i
                className={[styles.iconfont, styles.closeIcon].join(" ")}
                onClick={this.changeUpVisible}
              >
                &#xe6a9;
              </i>
              {trans("global.uploadCard")}
            </div>
            <div className={styles.uploadContent}>
              <div className={styles.upFile}>
                <div className={styles.upTitle}>
                  {trans("global.chooseFile")}
                </div>
                {fileList && fileList.length > 0 ? (
                  <div className={styles.fileMessage}>
                    {fileList[0].fileName}
                  </div>
                ) : null}
                <Upload {...uploadProperties}>
                  <div className={styles.fileButton}>
                    {trans("global.selectFile", "浏览")}
                  </div>
                </Upload>
              </div>
              <div className={styles.selectMessage}>
                {trans(
                  "global.selectMessage",
                  "该答题卡的样式如果要通用给其他作业使用，请在下方勾选",
                )}
              </div>
              <div className={styles.searchDom}>
                <Search
                  placeholder={trans("global.searchWork", "搜索作业单")}
                  onSearch={(value) => console.log(value)}
                  style={{ width: "100%" }}
                />
              </div>
              <div className={styles.workList}>
                {workList.map((it) => (
                  <Checkbox onChange={this.changeWorkList.bind(this, it.id)}>
                    {it.name}
                  </Checkbox>
                ))}
              </div>
              <div className={styles.uploadBottom}>
                <div className={styles.cancelButton} onClick={this.cancelUp}>
                  {trans("global.cancle")}
                </div>
                <div className={styles.sureButton} onClick={this.sureUp}>
                  {trans("global.ok")}
                </div>
              </div>
            </div>
          </div>
        </Modal>
        <Modal
          title={""}
          footer={null}
          getContainer={false}
          // centered={true}
          visible={downloadVisible}
          closable={false}
          maskClosable={false}
          destroyOnClose={true}
          // onCancel={this.publishCancel}
          width="500px"
          className={styles.studyModal}
        >
          <div className={styles.uploadDom}>
            <div className={styles.uploadHeader}>
              <i
                className={[styles.iconfont, styles.closeIcon].join(" ")}
                onClick={this.changeDownVisible}
              >
                &#xe6a9;
              </i>
              {trans("global.batchDownload")}
            </div>
            <div className={styles.uploadContent}>
              <div className={styles.upFile}>
                <div className={styles.upTitle}>
                  {trans("global.downloadContent", "下载内容")}
                </div>
                <Checkbox.Group
                  options={plainOptions}
                  defaultValue={workType}
                  onChange={this.changeWorkType}
                />
              </div>
              {/* <div className={styles.selectMessage}>{trans('global.selectMessage', '该答题卡的样式如果要通用给其他作业使用，请在下方勾选')}</div> */}
              <div className={styles.searchDom}>
                <Search
                  placeholder={trans("global.searchWork", "搜索作业单")}
                  onSearch={(value) => console.log(value)}
                  style={{ width: "100%" }}
                />
              </div>
              <div className={styles.workList}>
                {workList.map((it) => (
                  <Checkbox onChange={this.changeWorkList.bind(this, it.id)}>
                    {it.name}
                  </Checkbox>
                ))}
              </div>
              <div className={styles.uploadBottom}>
                <div className={styles.cancelButton} onClick={this.cancelDown}>
                  {trans("global.cancle")}
                </div>
                <div className={styles.sureButton} onClick={this.sureDown}>
                  {trans("global.ok")}
                </div>
              </div>
            </div>
          </div>
        </Modal>
        {this.state.revisedModal && (
          <RevisedModal
            testId={this.state.examId}
            openRevisedDataModal={this.openRevisedDataModal}
            dispatch={this.props.dispatch}
            reloadSource={this.reloadSource}
            source="question"
          />
        )}
        <StudentSelect
          groupList={groupList} //学生列表
          visible={isStudentSelest} // 开关
          title={trans("global.launchOnlineQuiz", "发起线上")}
          modalVisible={this.handleCancel} //关闭方法
          disabledStu={disabledStu ? disabledStu : []} //禁用学生
          publishText={trans("create.releaseNow", "立即发布")} //发布
          sureStu={this.setStu} //发布完后的内容
          search={this.searchStuName} //搜索
          onRef={this.onRef} //
          ifDeadLine={true}
        />
      </div>
    );
  }
}

export default connect(({ home, global, publishToStudent }) => ({
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
const cloneObjectList = (list) => {
  let moveList = [];

  for (const element of list) {
    if (element) {
      moveList.push(Object.assign({}, element));
    }
  }
  return moveList;
};
