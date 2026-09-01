import React, { PureComponent } from "react";
import { Empty, Icon, Input, Modal, Radio, Select, Spin } from "antd";
import { connect } from "dva";

import ChartSwitch from "components/ChartSwitch";

import activeBad from "../../assets/activeBad.svg";
import activelike from "../../assets/activeLike.svg";
import activeMulticolumn from "../../assets/activeMulticolumn.svg";
import activeSingleRow from "../../assets/activeSingleRow.svg";
import multicolumn from "../../assets/multicolumn.svg";
import singleRow from "../../assets/singleRow.svg";
import AnswerProgress from "../../components/AnswerProgress/index";
import TopicDetail from "../../components/TopicDetail/index";
import { resolveAnalysisQuestionSelection } from "../../routes/DataAnalysis/analysisQuestionSelection";
import AnalysisQuestionPreview from "../../routes/DataAnalysis/components/AnalysisQuestionPreview";
import {
  classQuestionAnalysis,
  singleQuestionAnalysis,
} from "../../services/example";
// import visibleIcon from "../../assets/visibleIcon.png";
// import fileIcon from "../../assets/fileIcon.png";
// import addIcon from "../../assets/addIcon.png";
import {
  answerQuestionRemark,
  goodAnswerQuestion,
  questionAnalysisPaperModuleAndRate,
  questionView,
  typicalAnswerQuestion,
} from "../../services/global";
import { locale, trans } from "../../utils/i18n";
import { convertToChineseNumber, switchingSupport } from "../../utils/utils";
import AnswerTable from "../AnswerTable";

import styles from "./index.module.less";
const { Search } = Input;
const createAnalysisQuestionState = (questionList) => {
  const currentQuestion = questionList[0] ?? null;
  return {
    currentQuestion,
    currentQuestionSelection: resolveAnalysisQuestionSelection(currentQuestion),
    autoScore: switchingSupport(currentQuestion ?? {}) ? 0 : 1,
  };
};

export class AnalysisByTop extends PureComponent {
  constructor(properties) {
    super(properties);
    this.isUnmounted = false;
    this.questionListRequestId = 0;
    this.questionDetailRequestId = 0;
    this.state = {
      ifEdit: true,
      checkSerialNumber: null,
      selectImg: null,
      classInstruction: false,
      filterIndex: 0,
      filterIndex1: 0,
      order: undefined,
      groupId: "",
      questionRange: 1,
      groupScoreStart: 0,
      groupScoreEnd: 100,
      isLeftContentVisible: false,
      visible: false,
      intervalIndex: 0,
      studentIndex: -4,
      arrangeKey: 1,
      modalType: "studentAnswer",
      studentChange: undefined,
      isStatisticsVis: false,
      currentQuestion: null,
      currentQuestionSelection: null,
      classQuestionAnalysis: {},
      searchStudentVal: "",
      instructionList: [],
      answerLoding: false,
      // cloneQuestionAnalysisData: {},
      autoScore: 1,
      order1: undefined,
      loding: false,
      instructionLoading: false,
      isShowStuName: false,
      // questionRangeIndex: -1,
      num: 0,
      detailList: [],
      rightData: [],
      fontIndex: 32,
    };
  }
  componentDidMount() {
    this.props.onRef && this.props.onRef(this);

    // opportunity：Boolean  表示 何时初始化组件 true
    // true ：在父组件中初始化
    if (this.props.isParentInit) {
      console.log("从父组件加载完成后再初始化数据");
    } else {
      this.props
        .dispatch({
          type: "home/getClassList",
          payload: {
            examId: this.props.examId,
          },
        })
        .then((res) => {
          if (this.props.classListData && this.props.classListData.length > 0) {
            this.setState(
              {
                groupId: this.props.classListData[0].groupId,
              },
              async () => {
                await this.questionAnalysisList();
                this.getRightData();
                if (this.props.commentMode) {
                  this.startExplaining();
                }
              },
            );
          }
        });
    }
  }

  componentWillUnmount() {
    this.isUnmounted = true;
    this.questionListRequestId += 1;
    this.questionDetailRequestId += 1;
  }

  // 父组加载完毕后可以调用次函数初始化数据，相当于父组件加载完毕之后调用
  initData = () => {
    this.setState(
      {
        groupId: this.props.groupId,
      },
      async () => {
        await this.questionAnalysisList();
        this.getRightData();
        if (this.props.commentMode) {
          this.startExplaining();
        }
      },
    );
  };

  studentChange = (value, index) => {
    this.setState({
      studentIndex: index,
    });
    if (this.info.state.visible) {
      this.info.close();
    }
    let id = value.studentId;
    const dom = document.getElementById(`text${id}`);
    if (dom) {
      dom.scrollIntoView(true);
    }
  };

  arrangeChange = (key) => {
    console.log(key, "key");
    this.setState({
      arrangeKey: key,
    });
  };

  questionAnalysisList = async () => {
    this.setState({
      loding: true,
    });
    return new Promise((resolve, reject) => {
      const {
        groupId,
        filterIndex,
        order,
        classInstruction,
        groupScoreStart,
        groupScoreEnd,
      } = this.state;
      this.props
        .dispatch({
          type: "home/questionAnalysisList",
          payload: {
            examId: this.props.examId,
            groupId: groupId,
            groupScoreSort: filterIndex == 1 ? (order ? 0 : 1) : null,
            groupAvgScoreSort: filterIndex == 2 ? (order ? 0 : 1) : null,
            groupScoreStart:
              groupScoreStart == 0 && groupScoreEnd == 100
                ? null
                : groupScoreStart,
            groupScoreEnd:
              groupScoreStart == 0 && groupScoreEnd == 100
                ? null
                : groupScoreEnd,
            classInstruction: classInstruction,
          },
        })
        .then((res) => {
          let number_ = 0;
          let detailList = [];
          if (
            this.state.order != undefined ||
            groupScoreStart != 0 ||
            groupScoreEnd != 100 ||
            classInstruction
          ) {
            console.log("过滤了");
            detailList = this.props.questionAnalysisData?.questionList; // 列表页数据
            if (detailList)
              for (const element of detailList) {
                if (element.classInstruction) {
                  number_ += 1; // 课堂评审的数量
                }
              }
          } else {
            console.log("未过滤");
            detailList = this.props.questionAnalysisData?.moduleModelList; // 列表页数据
            if (detailList)
              for (const element of detailList) {
                if (element.questionList && element.questionList.length > 0) {
                  for (const item of element.questionList) {
                    if (item.classInstruction) {
                      number_ += 1; // 课堂评审的数量
                    }
                  }
                }
              }
          }
          this.setState({
            loding: false,
            num: number_,
            detailList: detailList,
          });
          resolve(res);
        });
    });
  };

  scrollView = (serialNumber) => {
    const ele = document.getElementById(`question${serialNumber}`);
    if (ele) {
      ele.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    this.setState({
      checkSerialNumber: serialNumber,
    });
  };

  changeCheck = (checked) => {
    this.setState(
      {
        classInstruction: checked,
      },
      () => {
        this.questionAnalysisList();
      },
    );
  };

  outReview = () => {
    this.setState({
      questionRange: 1,
    });
    this.props.onOutReview && this.props.onOutReview();
  };

  startExplaining = () => {
    this.props.onStartExplaining && this.props.onStartExplaining();
    this.singleQuestionAnalysisFun("startExplaining");
  };

  filterByCondition = (index) => {
    let order;
    let filterIndex = index;
    if (index == 0) {
      order = undefined;
      filterIndex = index;
    } else if (index == this.state.filterIndex) {
      order = !this.state.order;
      filterIndex = index;
    } else {
      order = true;
      filterIndex = index;
    }
    this.setState(
      {
        order: order,
        filterIndex: filterIndex,
      },
      () => {
        this.questionAnalysisList();
      },
    );
  };

  filterByCondition1 = (index) => {
    let parameters = {
      order1: true,
      filterIndex1: index,
    };

    if (index == 0) {
      this.setState({
        order1: undefined,
        filterIndex1: index,
      });
    } else if (index == this.state.filterIndex1) {
      parameters = {
        order1: !this.state.order1,
        filterIndex1: index,
      };
    } else {
      parameters = {
        order1: true,
        filterIndex1: index,
      };
    }

    this.setState(parameters, () => {
      this.singleQuestionAnalysisFun();
    });
  };

  getStudentList = () => {
    const { searchStudentVal } = this.state;
    let studentList = [];
    if (searchStudentVal != "") {
      let array = [];
      if (this.state.classQuestionAnalysis.answerErrorStudentInfoList)
        for (const item of this.state.classQuestionAnalysis
          .answerErrorStudentInfoList) {
          if (item && item.studentList && item.studentList.length > 0) {
            let ls = item.studentList?.filter((item) =>
              item.studentName.includes(searchStudentVal),
            );
            array = [...array, ...(ls || [])];
          }
        }

      let array1 =
        this.state.classQuestionAnalysis?.answerCorrectStudentInfo?.studentList?.filter(
          (item) => item.studentName.includes(searchStudentVal),
        );
      studentList = [...array, ...(array1 || [])];
    } else if (this.state.intervalIndex == -1) {
      studentList =
        this.state.classQuestionAnalysis?.answerCorrectStudentInfo?.studentList;
    } else if (this.state.intervalIndex == -2) {
      studentList =
        this.state.classQuestionAnalysis?.singleItemAndStudentInfoList?.filter(
          (item) => item.excellentAnswering,
        );
    } else if (this.state.intervalIndex == -3) {
      studentList =
        this.state.classQuestionAnalysis?.singleItemAndStudentInfoList?.filter(
          (item) => item.errorAnalysis,
        );
    } else if (this.state.intervalIndex == -4) {
      studentList =
        this.state.classQuestionAnalysis?.singleItemAndStudentInfoList;
    } else {
      if (
        this.state.classQuestionAnalysis?.answerErrorStudentInfoList &&
        this.state.classQuestionAnalysis?.answerErrorStudentInfoList.length
      ) {
        studentList =
          this.state.classQuestionAnalysis?.answerErrorStudentInfoList[
            this.state.intervalIndex
          ]?.studentList;
      }
    }
    return studentList;
  };

  intervalChange = (index) => {
    let index_ = -1;
    this.setState(
      {
        intervalIndex: index,
      },
      () => {
        if (this.info?.state?.visible) {
          this.info.close();
        }
        let sTuList = this.getStudentList();
        if (sTuList.length > 0) {
          let id = sTuList[0].studentId;
          const dom = document.getElementById(`text${id}`);
          if (dom) {
            dom.scrollIntoView(true);
          }
          // 当前分类下存在学生，则默认选中第一个学生
          index_ = 0;
        }
        this.setState({
          studentIndex: index_,
        });
      },
    );
  };

  changeGroupValue = (value) => {
    this.setState(
      {
        groupId: value,
        order: undefined,
        filterIndex: undefined,
        checked: false,
      },
      () => {
        this.questionAnalysisList();
      },
    );
  };

  switchType = (value) => {
    this.setState(
      {
        questionRange: value,
      },
      () => {
        this.singleQuestionAnalysisFun();
      },
    );
  };

  singleQuestionAnalysisFun = (isStartExplaining) => {
    const requestId = ++this.questionListRequestId;
    this.questionDetailRequestId += 1;
    this.setState({
      instructionLoading: true,
      answerLoding: false,
      classQuestionAnalysis: {},
    });
    return singleQuestionAnalysis({
      examId: this.props.examId,
      groupId: this.state.groupId,
      groupScoreSort:
        this.state.filterIndex1 == 1 ? (this.state.order1 ? 0 : 1) : null,
      questionNoSort: this.state.filterIndex1 == 0 ? 0 : null,
      classInstruction: this.state.questionRange == 0 ? false : true,
      thisClassInstruction: this.state.questionRange == 0 ? true : false,
    })
      .then((res) => {
        if (this.isUnmounted || requestId !== this.questionListRequestId)
          return;
        const questionList = res.content?.questionList ?? [];
        if (isStartExplaining && questionList.length === 0) {
          this.setState(
            {
              questionRange: 0,
            },
            () => {
              this.singleQuestionAnalysisFun();
            },
          );
          return;
        }

        const questionState = createAnalysisQuestionState(questionList);

        this.setState(
          {
            instructionList: questionList,
            instructionLoading: false,
            ...questionState,
          },
          () => {
            const selection = questionState.currentQuestionSelection;
            if (!selection) return;
            this.getClassQuestionAnalysis({
              examId: this.props.examId,
              groupId: this.state.groupId ? this.state.groupId : "",
              questionId: selection.questionId,
              questionNo: selection.questionNo,
              filterFlag: false,
              autoScore: Boolean(this.state.autoScore),
            });
          },
        );
        return questionState.currentQuestion;
      })
      .catch(() => {
        if (this.isUnmounted || requestId !== this.questionListRequestId)
          return;
        this.setState({ instructionLoading: false });
      });
  };

  handleCancel = () => {
    this.setState({
      visible: false,
    });
  };

  showAnswer = (question, index) => {
    const selection = resolveAnalysisQuestionSelection(question);
    if (!selection) return;
    this.setState(
      {
        visible: true,
        currentQuestion: question,
        currentQuestionSelection: selection,
        classQuestionAnalysis: {},
        autoScore: 1,
      },
      () => {
        this.getClassQuestionAnalysis(
          {
            examId: this.props.examId,
            groupId: this.state.groupId ? this.state.groupId : "",
            questionId: selection.questionId,
            questionNo: selection.questionNo,
            filterFlag: false,
            autoScore: Boolean(this.state.autoScore),
          },
          () => {
            this.intervalChange(index || 0);
          },
        );
      },
    );
  };

  paginationChange = (key) => {
    let ele = document.querySelector("#paginationContent");
    let eleInner = document.querySelector("#paginationContentInner");
    let maxWidth = eleInner.offsetWidth - ele.offsetWidth;
    if (key == "right" && ele.scrollLeft < maxWidth) {
      ele.scrollLeft += eleInner.offsetWidth;
    } else if (key == "left" && ele.scrollLeft > 0) {
      ele.scrollLeft -= eleInner.offsetWidth;
    }
  };

  selectqQuestion = (question) => {
    const selection = resolveAnalysisQuestionSelection(question);
    if (!selection) return;
    this.setState(
      {
        currentQuestion: question,
        currentQuestionSelection: selection,
        classQuestionAnalysis: {},
        autoScore: switchingSupport(question) ? 0 : 1,
      },
      () => {
        this.getClassQuestionAnalysis({
          examId: this.props.examId,
          groupId: this.state.groupId,
          questionId: selection.questionId,
          questionNo: selection.questionNo,
          filterFlag: false,
          autoScore: Boolean(this.state.autoScore),
        });
      },
    );
  };

  changeGroupScoreStart = (e) => {
    console.log(e.target);
    e.target.blur();
    this.setState(
      {
        groupScoreStart: e.target.value,
      },
      () => {
        this.getRightData();
        this.questionAnalysisList();
      },
    );
  };

  changeGroupScoreEnd = (e) => {
    e.target.blur();
    this.setState(
      {
        groupScoreEnd: e.target.value,
      },
      () => {
        this.getRightData();
        this.questionAnalysisList();
      },
    );
  };

  toggleStatisticsCon = () => {
    this.setState({
      isStatisticsVis: !this.state.isStatisticsVis,
    });
  };

  toggleLeftContent = () => {
    this.setState({
      isLeftContentVisible: !this.state.isLeftContentVisible,
    });
  };

  statusChange = (qustion, commentType) => {
    const { currentQuestionSelection } = this.state;
    if (!currentQuestionSelection) return;
    let parameters = {
      examId: this.props.examId,
      groupId: this.state.groupId,
      questionId: currentQuestionSelection.questionId,
      student: qustion.studentId,
      remark: qustion.remark,
    };
    let follow = false;

    if (commentType.includes("like")) {
      if (commentType == "un-like") {
        follow = false;
      }
      if (commentType == "like") {
        follow = true;
      }
      parameters.follow = follow;
      goodAnswerQuestion(parameters).then((res) => {
        this.getClassQuestionAnalysis({
          examId: this.props.examId,
          groupId: this.state.groupId,
          questionId: currentQuestionSelection.questionId,
          questionNo: currentQuestionSelection.questionNo,
          filterFlag: false,
          autoScore: Boolean(this.state.autoScore),
        });
      });
    } else if (commentType.includes("bad")) {
      follow = false;
      if (commentType == "bad") {
        follow = true;
      }
      parameters.follow = follow;
      typicalAnswerQuestion(parameters).then((res) => {
        this.getClassQuestionAnalysis({
          examId: this.props.examId,
          groupId: this.state.groupId,
          questionId: currentQuestionSelection.questionId,
          questionNo: currentQuestionSelection.questionNo,
          filterFlag: false,
          autoScore: Boolean(this.state.autoScore),
        });
      });
    }
  };

  remarkChange = (item) => {
    const { currentQuestionSelection } = this.state;
    if (!currentQuestionSelection) return;
    answerQuestionRemark({
      examId: this.props.examId,
      groupId: this.state.groupId,
      questionId: currentQuestionSelection.questionId,
      student: item.studentId,
      remark: item.remark,
    }).then((res) => {
      this.getClassQuestionAnalysis({
        examId: this.props.examId,
        groupId: this.state.groupId,
        questionId: currentQuestionSelection.questionId,
        questionNo: currentQuestionSelection.questionNo,
        filterFlag: false,
        autoScore: Boolean(this.state.autoScore),
      });
    });
  };

  getClassQuestionAnalysis = (parameters, callback) => {
    const requestId = ++this.questionDetailRequestId;
    this.setState({
      answerLoding: true,
    });
    return classQuestionAnalysis(parameters)
      .then((res) => {
        if (this.isUnmounted || requestId !== this.questionDetailRequestId)
          return;
        this.setState({
          answerLoding: false,
          classQuestionAnalysis: res.status ? res.content : {},
        });
        callback && callback();
        return res;
      })
      .catch(() => {
        if (this.isUnmounted || requestId !== this.questionDetailRequestId)
          return;
        this.setState({
          answerLoding: false,
          classQuestionAnalysis: {},
        });
      });
  };

  joinOrCancel = (element) => {
    const selection = resolveAnalysisQuestionSelection(element);
    if (!selection) return;
    questionView({
      examId: this.props.examId,
      groupId: this.state.groupId,
      questionId: selection.questionId,
      follow: !element.classInstruction,
    }).then((res) => {
      this.questionAnalysisList();
    });
  };

  searchStudent = (e) => {
    console.log(e.target.value, "val");
    this.setState({
      searchStudentVal: e.target.value,
    });
  };

  selectModal = (type) => {
    this.setState({
      modalType: type,
    });
  };

  scoreTypeChange = (e) => {
    const { currentQuestionSelection } = this.state;
    if (!currentQuestionSelection) return;
    this.setState(
      {
        autoScore: e.target.value,
      },
      () => {
        this.getClassQuestionAnalysis({
          examId: this.props.examId,
          groupId: this.state.groupId ? this.state.groupId : "",
          questionId: currentQuestionSelection.questionId,
          questionNo: currentQuestionSelection.questionNo,
          filterFlag: false,
          autoScore: Boolean(this.state.autoScore),
        });
      },
    );
  };

  stuNameChange = (checked) => {
    this.setState({
      isShowStuName: checked,
    });
  };

  selectQuestionRange = (index) => {
    let groupScoreStart = 0;
    let groupScoreEnd = 100;
    if (index == 0) {
      groupScoreStart = 0;
      groupScoreEnd = 40;
    } else if (index == 1) {
      groupScoreStart = 40;
      groupScoreEnd = 70;
    } else if (index == 2) {
      groupScoreStart = 70;
      groupScoreEnd = 100;
    }
    this.setState(
      {
        // questionRangeIndex: index,
        groupScoreStart: groupScoreStart,
        groupScoreEnd: groupScoreEnd,
      },
      () => {
        this.getRightData();
        this.questionAnalysisList();
      },
    );
  };

  isActive(index) {
    console.log(index, "index");
    const { groupScoreStart, groupScoreEnd } = this.state;
    if (index == 0) {
      if (groupScoreStart == 0 && groupScoreEnd == 40) {
        return styles.active;
      }
    } else if (index == 1) {
      if (groupScoreStart == 40 && groupScoreEnd == 70) {
        return styles.active;
      }
    } else if (index == 2 && groupScoreStart == 70 && groupScoreEnd == 100) {
      return styles.active;
    }
  }
  sizeChange = (key) => {
    if (key == "small") {
      if (this.state.fontIndex > 0) {
        this.setState({ fontIndex: this.state.fontIndex - 1 });
      }
    } else if (key == "large" && this.state.fontIndex < 68) {
      this.setState({ fontIndex: this.state.fontIndex + 1 });
    }
  };
  getRightData = () => {
    questionAnalysisPaperModuleAndRate({
      examId: this.props.examId,
      groupId: this.state.groupId ? this.state.groupId : "",
      groupScoreStart: this.state.groupScoreStart,
      groupScoreEnd: this.state.groupScoreEnd,
    }).then((res) => {
      if (res.status) {
        this.setState({
          rightData: res.content,
        });
      }
    });
  };
  render() {
    const { questionAnalysisData, classListData, commentMode } = this.props;
    const {
      checkSerialNumber,
      filterIndex,
      order,
      groupId,
      groupScoreStart,
      groupScoreEnd,
      searchStudentVal,
      order1,
      filterIndex1,
      classInstruction,
      classQuestionAnalysis: classQuestionAnalysisData,
      currentQuestion,
      currentQuestionSelection,
      instructionLoading,
    } = this.state;

    const currentNumber = currentQuestionSelection?.questionNo;

    // 过滤学生77
    let stuList = this.getStudentList();

    // 过滤试题
    let dataList = [];
    let excellentAnsweringNumber = 0;
    let errorAnalysisNumber = 0;

    if (this.props.commentMode) {
      if (this.state.modalType == "excellentAnswer") {
        dataList =
          classQuestionAnalysisData?.singleItemAndStudentInfoList?.filter(
            (item) => item.excellentAnswering,
          );
      } else if (this.state.modalType == "typicalMistakeCause") {
        dataList =
          classQuestionAnalysisData?.singleItemAndStudentInfoList?.filter(
            (item) => item.errorAnalysis,
          );
      } else if (
        this.state.modalType == "studentAnswer" &&
        classQuestionAnalysisData?.singleItemAndStudentInfoList
      )
        for (const item of classQuestionAnalysisData?.singleItemAndStudentInfoList) {
          if (stuList)
            for (const stu of stuList) {
              if (stu.studentId == item.studentId) {
                dataList.push(item);
              }
            }
        }
    } else if (this.state.visible) {
      if (classQuestionAnalysisData?.singleItemAndStudentInfoList)
        for (const item of classQuestionAnalysisData?.singleItemAndStudentInfoList) {
          if (item.excellentAnswering) {
            excellentAnsweringNumber += 1;
          } else if (item.errorAnalysis) {
            errorAnalysisNumber += 1;
          }
        }

      if (this.state.intervalIndex == -2) {
        dataList =
          classQuestionAnalysisData?.singleItemAndStudentInfoList?.filter(
            (item) => item.excellentAnswering,
          );
      } else if (this.state.intervalIndex == -3) {
        dataList =
          classQuestionAnalysisData?.singleItemAndStudentInfoList?.filter(
            (item) => item.errorAnalysis,
          );
      } else if (this.state.intervalIndex == -4) {
        dataList = classQuestionAnalysisData?.singleItemAndStudentInfoList;
      } else {
        if (classQuestionAnalysisData?.singleItemAndStudentInfoList)
          for (const item of classQuestionAnalysisData?.singleItemAndStudentInfoList) {
            if (stuList)
              for (const stu of stuList) {
                if (stu.studentId == item.studentId) {
                  dataList.push(item);
                }
              }
          }
      }
    }

    /**
     *
     * @param question
     */
    function computeScore(question) {
      let groupScoreRate = question?.groupScoreRate * 10;
      let gradeScoreRate = question?.gradeScoreRate * 10;
      if (groupScoreRate == gradeScoreRate) {
        return <span>{trans("global.atGradeLevel", "与年级持平")}</span>;
      } else if (groupScoreRate > gradeScoreRate) {
        return (
          <span style={{ color: "#00B213" }}>
            {trans("global.aboveGradeLevel", "高于年级")}
            {question?.groupGradeAndCompareScoreRate}%
          </span>
        );
      } else {
        return (
          <span style={{ color: "#FC491E" }}>
            {trans("global.belowGradeLevel", "低于年级")}
            {question?.groupGradeAndCompareScoreRate?.split("-")[1]}%
          </span>
        );
      }
    }

    return (
      <Spin spinning={this.state.loding}>
        <div className={styles.analysis}>
          {
            <div
              className={styles.analysisContent}
              style={this.props.isParentInit ? { background: "#fff" } : {}}
            >
              <div
                className={styles.contentLeft}
                style={
                  this.props.heidenRight
                    ? { width: "100%", height: "100%", margin: 0 }
                    : {}
                }
              >
                <div className={styles.topFilterStyle}>
                  {this.props.heidenGradeSelect ? null : (
                    <Select
                      className={styles.classSelect}
                      style={{ width: 142, marginLeft: 12, height: 28 }}
                      onChange={this.changeGroupValue}
                      value={groupId}
                    >
                      {classListData.map((item) => {
                        return (
                          <Select.Option
                            key={item.groupId}
                            value={item.groupId}
                          >
                            {item.groupName}
                          </Select.Option>
                        );
                      })}
                    </Select>
                  )}

                  <span
                    className={`${styles.singleFilter} ${filterIndex == 0 ? styles.active : ""}`}
                    onClick={() => this.filterByCondition(0)}
                  >
                    <span>{trans("analysis.questionIndex", "题号")}</span>
                  </span>
                  <span
                    className={`${styles.singleFilter} ${filterIndex == 1 ? styles.active : ""}`}
                    onClick={() => this.filterByCondition(1)}
                  >
                    <span>
                      {trans("analysis.classScoreRate", "班级得分率")}
                    </span>
                    <div className={styles.filterIconCon}>
                      <Icon
                        className={`${styles.sorterUp} ${order && filterIndex == 1 ? styles.active : ""}`}
                        type="caret-up"
                      />
                      <Icon
                        className={`${styles.sorterDown} ${order == false && filterIndex == 1 ? styles.active : ""}`}
                        type="caret-down"
                      />
                    </div>
                  </span>
                  <span
                    className={`${styles.singleFilter} ${filterIndex == 2 ? styles.active : ""}`}
                    onClick={() => this.filterByCondition(2)}
                  >
                    <span>{trans("global.gradeGap", "与年级均值的差距")}</span>
                    <div className={styles.filterIconCon}>
                      <Icon
                        type="caret-up"
                        className={`${styles.sorterUp} ${order && filterIndex == 2 ? styles.active : ""}`}
                      />
                      <Icon
                        className={`${styles.sorterDown} ${order == false && filterIndex == 2 ? styles.active : ""}`}
                        type="caret-down"
                      />
                    </div>
                  </span>
                  <span className={styles.singleFilter}>
                    <span style={{ lineHeight: "13px" }}>
                      {trans("analysis.classScoreRate", "班级得分率")}
                    </span>
                    <div
                      className={styles.filterIconCon}
                      style={{ flexDirection: "row" }}
                    >
                      <Input
                        value={groupScoreStart}
                        onBlur={this.changeGroupScoreStart}
                        onPressEnter={this.changeGroupScoreStart}
                        onChange={(e) => {
                          this.setState({ groupScoreStart: e.target.value });
                        }}
                      />
                      {` `} % {trans("global.to", "到")}
                      {` `}
                      <Input
                        value={groupScoreEnd}
                        onBlur={this.changeGroupScoreEnd}
                        onPressEnter={this.changeGroupScoreEnd}
                        onChange={(e) => {
                          this.setState({ groupScoreEnd: e.target.value });
                        }}
                      />
                      &nbsp;%
                    </div>
                  </span>
                  <div className={styles.testNameSwitch}>
                    <span className={styles.switchTitle}></span>
                    <ChartSwitch
                      label={trans(
                        "global.filterLessonsOnly",
                        "只看课堂讲解题",
                      )}
                      style={{ marginLeft: "4px" }}
                      checked={this.state.classInstruction}
                      onChange={this.changeCheck}
                    />
                  </div>
                  {this.props.heidenRight ? (
                    <div
                      className={styles.optionTitleBox}
                      style={{ marginLeft: "auto" }}
                    >
                      <div
                        className={styles.confirmBtn}
                        onClick={() => this.startExplaining()}
                      >
                        {trans("global.fullScreenQuestion", "题目全屏显示")}
                      </div>
                    </div>
                  ) : null}
                </div>
                <div className={styles.testList}>
                  {this.state.detailList && this.state.detailList.length > 0 ? (
                    <TopicDetail
                      analysisQuestionCatalog={
                        this.props.analysisQuestionCatalog
                      }
                      onJoinOrCancel={this.joinOrCancel}
                      showAnswer={this.showAnswer}
                      detailList={this.state.detailList}
                      examId={this.props.examId}
                      groupId={this.state.groupId}
                      checkSerialNumber={checkSerialNumber}
                    />
                  ) : (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={trans("analysis.noData", "暂无数据")}
                    />
                  )}
                </div>
              </div>

              {this.props.heidenRight ? null : (
                <div className={styles.contentRight}>
                  <div className={styles.contentRightOption}>
                    <div className={styles.optionTitleBox}>
                      <div
                        className={styles.confirmBtn}
                        onClick={() => this.startExplaining()}
                      >
                        {trans("global.startClassroomReview", "开始课堂讲评")}(
                        {this.state.num})
                      </div>
                    </div>
                    <div className={styles.analysisRemark}>
                      <div className={`${styles.label}`}>
                        {trans("topicAnalysis.category", "类别")}
                        <br />
                        {trans("topicAnalysis.scoreRate", "得分率")}
                      </div>
                      {[
                        trans("global.frequentErrors", "高频错题"),
                        trans("global.commonMistakes", "易错题"),
                        trans("global.basicsMastered", "基本掌握"),
                      ].map((item, index) => (
                        <div
                          className={`${styles.remarkItem} ${this.isActive(index)}`}
                          key={index}
                          onClick={() => this.selectQuestionRange(index)}
                        >
                          <i
                            className={styles.iconfont}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              this.selectQuestionRange(-1);
                            }}
                          >
                            &#xe7c4;
                          </i>
                          <div
                            className={`${styles[["oftenError", "easyError", "master"][index]]} ${styles.tag}`}
                          >
                            {item}
                          </div>
                          <div
                            className={
                              styles[
                                [
                                  "oftenErrorInterval",
                                  "easyErrorInterval",
                                  "masterInterval",
                                ][index]
                              ]
                            }
                          >
                            {["0% ～ 40%", "40% ～ 70%", "70% ～ 100%"][index]}
                          </div>
                        </div>
                      ))}
                      <div></div>
                    </div>
                    <div className={styles.moveListWarp}>
                      {this.state.rightData && this.state.rightData.length > 0
                        ? this.state.rightData.map((item, index) => {
                            return (
                              <div className={styles.moveList} key={index}>
                                <div className={styles.moveListTitle}>
                                  <div>
                                    {convertToChineseNumber(index + 1)}、
                                    <span
                                      className={styles.contentVisible}
                                      title={item.moduleName}
                                    >
                                      {item.moduleName}
                                    </span>
                                    ({item.moduleScore || 0}
                                    {trans("global.point", "分")})
                                  </div>
                                  {this.props.testStatus ? (
                                    <div className={styles.modultScore}>
                                      <i className={styles.iconfont}>
                                        &#xe634;
                                      </i>
                                      <span className={styles.score}>
                                        {item.moduleScore}
                                      </span>
                                      {trans("global.point", "分")}
                                    </div>
                                  ) : null}
                                </div>
                                <div className={styles.moveListContent}>
                                  {item.questionAnalysisNumberModels &&
                                  item.questionAnalysisNumberModels.length > 0
                                    ? item.questionAnalysisNumberModels.map(
                                        (it, ind) => {
                                          return (
                                            <div
                                              className={`${checkSerialNumber === it.questionSerialNumber ? styles.active : ""} ${styles.optionBox} ${it.groupScoreRate * 100 > 7000 ? styles.master : it.groupScoreRate * 100 > 4000 ? styles.easyError : styles.oftenError}`}
                                              onClick={this.scrollView.bind(
                                                this,
                                                it.questionSerialNumber,
                                              )}
                                              key={ind}
                                            >
                                              {it.questionSerialNumber}
                                            </div>
                                          );
                                        },
                                      )
                                    : null}
                                </div>
                              </div>
                            );
                          })
                        : null}
                    </div>
                  </div>
                </div>
              )}
            </div>
          }
          {commentMode ? (
            <div className={styles.explaining}>
              <div
                className={`${styles.leftContent}  ${this.state.isLeftContentVisible ? styles.hideLeftContent : ""}`}
              >
                <div
                  className={`${styles.handle} ${styles.handleSize}`}
                  onClick={() => this.toggleLeftContent()}
                >
                  {this.state.isLeftContentVisible ? (
                    <Icon type="right" />
                  ) : (
                    <Icon type="left" />
                  )}
                </div>
                <div className={styles.headerOptions}>
                  <div
                    className={styles.outReview}
                    onClick={() => this.outReview()}
                  >
                    {trans("global.exitReview", "退出讲评")}
                  </div>
                  <span className={styles.viewBox}>
                    <span
                      onClick={this.switchType.bind(this, 0)}
                      className={`${styles.viewTab} ${this.state.questionRange === 0 ? styles.isCheck : ""}`}
                    >
                      {trans("global.allQuestions", "全部题目")}
                    </span>
                    <span
                      onClick={this.switchType.bind(this, 1)}
                      className={`${styles.viewTab} ${this.state.questionRange === 1 ? styles.isCheck : ""}`}
                    >
                      {trans("global.classroomReviewQuestion", "课堂讲评题")}
                    </span>
                  </span>
                  <span
                    className={`${styles.singleFilter} ${filterIndex1 == 0 ? styles.active : ""}`}
                    onClick={() => this.filterByCondition1(0)}
                  >
                    <span>{trans("analysis.questionIndex", "题号")}</span>
                  </span>
                  <span
                    className={`${styles.singleFilter} ${filterIndex1 == 1 ? styles.active : ""}`}
                    onClick={() => this.filterByCondition1(1)}
                  >
                    <span>
                      {trans("analysis.classScoreRate", "班级得分率")}
                    </span>
                    <div className={styles.filterIconCon}>
                      <Icon
                        className={`${styles.sorterUp} ${order1 && filterIndex1 == 1 ? styles.active : ""}`}
                        type="caret-up"
                      />
                      <Icon
                        className={`${styles.sorterDown} ${order1 == false && filterIndex1 == 1 ? styles.active : ""}`}
                        type="caret-down"
                      />
                    </div>
                  </span>

                  <div className={styles.sizeOptionBox}>
                    <span
                      onClick={() => {
                        this.sizeChange("small");
                      }}
                    >
                      <Icon
                        type="minus-circle"
                        style={{ fontSize: "24px", cursor: "pointer" }}
                      />
                      &nbsp;
                    </span>
                    <span style={{ fontSize: "13px" }}>
                      {trans("global.fontSize", "字号")}
                    </span>
                    <span
                      onClick={() => {
                        this.sizeChange("large");
                      }}
                    >
                      &nbsp;
                      <Icon
                        type="plus-circle"
                        style={{ fontSize: "24px", cursor: "pointer" }}
                      />
                    </span>
                  </div>

                  <div
                    style={{
                      marginLeft: "auto",
                      transform: "translateX(12px)",
                      flexShrink: "0",
                    }}
                  >
                    <ChartSwitch
                      label={trans("global.stuName", "学生姓名")}
                      checked={this.state.isShowStuName}
                      onChange={this.stuNameChange}
                    />
                  </div>
                </div>
                <div className={styles.myPagination}>
                  <div
                    className={styles.paginationPrev}
                    onClick={() => {
                      this.paginationChange("left");
                    }}
                  >
                    <Icon type="left" />
                  </div>
                  <div
                    className={styles.paginationContent}
                    id="paginationContent"
                  >
                    <div
                      id="paginationContentInner"
                      style={{ display: "flex" }}
                    >
                      {this.state.instructionList.map((item, index) => {
                        const number_ =
                          resolveAnalysisQuestionSelection(item)?.questionNo;
                        return (
                          <div
                            key={index}
                            className={`${styles.paginationItem} ${currentNumber == number_ ? styles.active : ""}`}
                            onClick={() => {
                              this.selectqQuestion(item);
                            }}
                          >
                            {number_}
                            <div
                              className={`${styles.scoringRate} ${styles.optionBox} ${item.groupScoreRate * 100 > 7000 ? styles.masterInterval : item.groupScoreRate * 100 > 4000 ? styles.easyErrorInterval : styles.oftenErrorInterval}`}
                            >
                              {item.groupScoreRate
                                ? `${item.groupScoreRate}%`
                                : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div
                    className={styles.paginationNext}
                    onClick={() => {
                      this.paginationChange("right");
                    }}
                  >
                    <Icon type="right" />
                  </div>
                </div>
                <div
                  className={styles.questionContent}
                  style={{
                    fontSize: `${this.state.fontIndex}px`,
                    lineHeight: `${this.state.fontIndex + 8}px`,
                  }}
                >
                  {this.props.analysisQuestionCatalog &&
                  currentQuestionSelection ? (
                    <AnalysisQuestionPreview
                      catalog={this.props.analysisQuestionCatalog}
                      mode="question"
                      questionId={currentQuestionSelection.questionId}
                      showAnswer
                    />
                  ) : instructionLoading ? null : (
                    <Empty
                      description={trans("questionTask.noQuestion", "暂无题目")}
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  )}
                </div>
                <div style={{ position: "relative", maxHeight: "200px" }}>
                  <div
                    className={`${styles.handle} ${styles.handleSize1}`}
                    onClick={() => this.toggleStatisticsCon()}
                  >
                    {this.state.isStatisticsVis ? (
                      <Icon type="up" />
                    ) : (
                      <Icon type="down" />
                    )}
                  </div>
                  <div
                    className={`${styles.statisticsContainer} ${this.state.isStatisticsVis ? styles.hideStatisticsContent : ""}`}
                  >
                    <div className={styles.statisticsDetail}>
                      <div>
                        {currentQuestion &&
                        switchingSupport(currentQuestion) ? (
                          <Radio.Group
                            name="radiogroup"
                            value={this.state.autoScore}
                            className={styles.scoreTypeOptions}
                            onChange={this.scoreTypeChange}
                          >
                            <Radio value={0}>
                              {trans("global.scoreDistribution", "得分分布")}
                            </Radio>
                            <Radio value={1}>
                              {trans(
                                "global.automaticDistribution",
                                "自动分布",
                              )}
                            </Radio>
                          </Radio.Group>
                        ) : null}
                      </div>
                      <Spin spinning={this.state.answerLoding}>
                        <div className={styles.subsectionTop}>
                          <AnswerProgress
                            selectStudentInfo={(index) => {
                              this.setState({
                                modalType: "studentAnswer",
                              });
                              this.intervalChange(index);
                            }}
                            data={classQuestionAnalysis}
                            autoScore={this.state.autoScore}
                          />
                        </div>
                      </Spin>
                    </div>
                  </div>
                </div>
              </div>
              <div
                className={`${styles.rightContent} ${this.state.isLeftContentVisible ? styles.hideLeftContent : ""}`}
              >
                <div className={styles.headerOptions}>
                  <div className={styles.tabs}>
                    {[
                      {
                        name: trans("global.studentAnswer", "学生作答"),
                        id: "studentAnswer",
                      },
                      {
                        name: trans("global.excellentAnswer", "优秀作答"),
                        id: "excellentAnswer",
                      },
                      {
                        name: trans("global.typicalMistakeCause", "典型错因"),
                        id: "typicalMistakeCause",
                      },
                      {
                        name: trans("global.classroomGrouping", "课堂分组"),
                        id: "classroomGrouping",
                      },
                    ].map((item, index) => (
                      <div
                        style={{
                          display:
                            item.id == "classroomGrouping" ? "none" : "block",
                        }}
                        onClick={() => this.selectModal(item.id)}
                        className={`${styles.TabPane} ${item.id == this.state.modalType ? styles.active : ""}`}
                        key={index}
                      >
                        {item.name}
                      </div>
                    ))}
                  </div>
                  {this.state.modalType == "excellentAnswer" ||
                  this.state.modalType == "typicalMistakeCause" ||
                  this.state.modalType == "studentAnswer" ? (
                    <div className={styles.arrange}>
                      <div className={styles.leftIcon}>
                        {this.state.arrangeKey == 0 ? (
                          <img src={activeSingleRow} alt="" />
                        ) : (
                          <img
                            src={singleRow}
                            alt=""
                            onClick={() => {
                              this.arrangeChange(0);
                            }}
                          />
                        )}
                      </div>
                      <div className={styles.rightIcon}>
                        {this.state.arrangeKey == 1 ? (
                          <img src={activeMulticolumn} alt="" />
                        ) : (
                          <img
                            src={multicolumn}
                            alt=""
                            onClick={() => {
                              this.arrangeChange(1);
                            }}
                          />
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
                <div className={styles.answeringArea}>
                  {this.state.modalType == "excellentAnswer" ||
                  this.state.modalType == "typicalMistakeCause" ||
                  this.state.modalType == "studentAnswer" ? (
                    <Spin
                      spinning={this.state.answerLoding}
                      wrapperClassName={styles.spinWarp}
                    >
                      {dataList?.length ? (
                        <AnswerTable
                          analysisQuestionCatalog={
                            this.props.analysisQuestionCatalog
                          }
                          questionId={currentQuestionSelection?.questionId}
                          isShowStuName={this.state.isShowStuName}
                          onRemarkChange={this.remarkChange}
                          onStatusChange={this.statusChange}
                          dataList={dataList}
                          arrangeKey={this.state.arrangeKey}
                        />
                      ) : (
                        <div style={{ textAlign: "center", padding: "10px" }}>
                          {this.state.modalType == 1 ||
                          this.state.modalType == 2
                            ? trans(
                                "topicAnalysis.noDataSelectStudentTip",
                                "暂无数据，你可以点击【全部作答】选择学生进行标记",
                              )
                            : trans("analysis.noData", "暂无数据")}
                        </div>
                      )}
                    </Spin>
                  ) : null}

                  {this.state.modalType == "classroomGrouping" ? (
                    <div>{trans("global.classroomGrouping", "课堂分组")}</div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
          <Modal
            centered={true}
            title={
              <div className={styles.headerContainer}>
                <div className={styles.questionsName}>
                  {trans("analysis.questionIndex", "题号")}{" "}
                  {currentQuestion?.questionSerialNumber}
                </div>
                <div className={styles.scoreBox}>
                  （{currentQuestion?.questionScore}
                  {trans("global.point", "分")}）
                </div>
                <div className={styles.statistics}>
                  <div>
                    {trans("analysis.classScoreRate", "班级得分率")}{" "}
                    {currentQuestion?.groupScoreRate}%，
                  </div>
                  <div>
                    {trans("global.gradeScoreRate", "年级得分率")}{" "}
                    {currentQuestion?.gradeScoreRate}%，
                  </div>
                  {computeScore(currentQuestion)}
                </div>
                <div className={styles.arrange}>
                  <div className={styles.leftIcon}>
                    {this.state.arrangeKey == 0 ? (
                      <img src={activeSingleRow} alt="" />
                    ) : (
                      <img
                        src={singleRow}
                        alt=""
                        onClick={() => {
                          this.arrangeChange(0);
                        }}
                      />
                    )}
                  </div>
                  <div className={styles.rightIcon}>
                    {this.state.arrangeKey == 1 ? (
                      <img src={activeMulticolumn} alt="" />
                    ) : (
                      <img
                        src={multicolumn}
                        alt=""
                        onClick={() => {
                          this.arrangeChange(1);
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            }
            width={1020}
            footer={null}
            visible={this.state.visible}
            onCancel={this.handleCancel}
            wrapClassName={styles.answerModal}
          >
            <div className={styles.modalBodyContainer}>
              <div className={styles.leftContainer}>
                <div
                  className={`${styles.intervalItem} ${this.state.intervalIndex == -2 ? styles.active : ""}`}
                  onClick={() => this.intervalChange(-2)}
                >
                  <div className={styles.intervalLabel}>
                    <img
                      src={activelike}
                      style={{
                        width: "18px",
                        height: "18px",
                        verticalAlign: "text-top",
                      }}
                    />{" "}
                    &nbsp;
                    {trans("global.excellentAnswer", "优秀作答")}
                  </div>
                  <div className={styles.intervalVal}>
                    {excellentAnsweringNumber}
                    {trans("global.person", "人")}
                  </div>
                </div>
                <div
                  className={`${styles.intervalItem} ${this.state.intervalIndex == -3 ? styles.active : ""}`}
                  onClick={() => this.intervalChange(-3)}
                >
                  <div className={styles.intervalLabel}>
                    <img
                      src={activeBad}
                      style={{
                        width: "18px",
                        height: "18px",
                        verticalAlign: "text-top",
                      }}
                    />{" "}
                    &nbsp;
                    {trans("global.typicalMistakeCause", "典型错因")}
                  </div>
                  <div className={styles.intervalVal}>
                    {errorAnalysisNumber}
                    {trans("global.person", "人")}
                  </div>
                </div>

                {currentQuestion && switchingSupport(currentQuestion) ? (
                  <div
                    className={`${styles.headerOptionBox} ${styles.flexCenter}`}
                  >
                    <Radio.Group
                      name="radiogroup"
                      value={this.state.autoScore}
                      className={styles.scoreTypeOptions}
                      onChange={this.scoreTypeChange}
                    >
                      <Radio value={0}>
                        {trans("global.scoreDistribution", "得分分布")}
                      </Radio>
                      <Radio value={1}>
                        {trans("global.automaticDistribution", "自动分布")}
                      </Radio>
                    </Radio.Group>
                  </div>
                ) : null}

                <div className={styles.distributionInterval}>
                  {classQuestionAnalysisData &&
                  classQuestionAnalysisData.answerErrorStudentInfoList &&
                  classQuestionAnalysisData.answerErrorStudentInfoList.length >
                    0
                    ? classQuestionAnalysisData.answerErrorStudentInfoList.map(
                        (item, index) => (
                          <div
                            className={`${styles.intervalItem} ${this.state.intervalIndex == index ? styles.active : ""}`}
                            onClick={() => this.intervalChange(index)}
                            key={index}
                          >
                            <div className={styles.intervalLabel}>
                              {item.questionScore}
                              {this.state.autoScore == 0
                                ? ` ${trans("global.point", "分")}`
                                : ""}
                            </div>
                            <div className={styles.intervalVal}>
                              {item.studentNum}
                              {trans("global.person", "人")} /
                              <div
                                style={{
                                  display: "inline-block",
                                  minWidth: "40px",
                                }}
                              >
                                {item.studentRate}
                              </div>
                            </div>
                          </div>
                        ),
                      )
                    : null}
                  {classQuestionAnalysisData &&
                  classQuestionAnalysisData.answerCorrectStudentInfo ? (
                    <div
                      className={`${styles.intervalItem}  ${this.state.intervalIndex == -1 ? styles.active : ""}`}
                      onClick={() => this.intervalChange(-1)}
                    >
                      <div className={styles.intervalLabel}>
                        {
                          classQuestionAnalysisData.answerCorrectStudentInfo
                            .questionScore
                        }
                        {this.state.autoScore == 0
                          ? ` ${trans("global.point", "分")}`
                          : ""}
                      </div>
                      <div className={styles.intervalVal}>
                        {
                          classQuestionAnalysisData.answerCorrectStudentInfo
                            .studentNum
                        }
                        人 /
                        <div
                          style={{ display: "inline-block", minWidth: "40px" }}
                        >
                          {
                            classQuestionAnalysisData.answerCorrectStudentInfo
                              .studentRate
                          }
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div
                  className={`${styles.intervalItem} ${this.state.intervalIndex == -4 ? styles.active : ""}`}
                  onClick={() => this.intervalChange(-4)}
                >
                  <div className={styles.intervalLabel}>
                    {trans("global.all", "全部")}
                  </div>
                  <div className={styles.intervalVal}>
                    {classQuestionAnalysisData?.singleItemAndStudentInfoList
                      ?.length || "-"}
                    {trans("global.person", "人")}
                  </div>
                </div>
              </div>
              <div className={styles.studentContainer}>
                <div
                  className={`${styles.headerOptionBox}  ${styles.flexCenter}`}
                >
                  <Search
                    placeholder={trans(
                      "testAnalysis.searchStudent",
                      "搜索学生",
                    )}
                    onChange={(e) => this.searchStudent(e)}
                    className={styles.searchPut}
                  />
                </div>
                <div className={styles.studentContent}>
                  {stuList && stuList.length > 0 ? (
                    stuList.map((item, index) => (
                      <div
                        className={`${styles.studentItem} ${index == this.state.studentIndex ? styles.active : ""}`}
                        onClick={() => {
                          this.studentChange(item, index);
                        }}
                        key={index}
                      >
                        <div className={styles.name} title={item.studentName}>
                          {item.studentName}
                        </div>
                        <div className={styles.score}>
                          {item.score}
                          {trans("global.point", "分")}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: "center", padding: "10px" }}>
                      {trans("analysis.noData", "暂无数据")}
                    </div>
                  )}
                </div>
              </div>
              <div className={styles.rightContainer}>
                <div className={styles.answeringArea}>
                  <Spin
                    spinning={this.state.answerLoding}
                    wrapperClassName={styles.spinWarp}
                  >
                    {dataList?.length ? (
                      <AnswerTable
                        analysisQuestionCatalog={
                          this.props.analysisQuestionCatalog
                        }
                        questionId={currentQuestionSelection?.questionId}
                        getRef={(info) => {
                          this.info = info;
                        }}
                        currentStudentId={
                          stuList
                            ? stuList[this.state.studentIndex]?.studentId
                            : ""
                        }
                        isShowStuName={true}
                        onRemarkChange={this.remarkChange}
                        onStatusChange={this.statusChange}
                        dataList={dataList}
                        arrangeKey={this.state.arrangeKey}
                      />
                    ) : (
                      <div style={{ textAlign: "center", padding: "10px" }}>
                        {trans(
                          "topicAnalysis.noDataSelectStudentFromGroupTip",
                          "暂无数据，你可以点击下方的分组后选择学生进行标记",
                        )}
                      </div>
                    )}
                  </Spin>
                </div>
              </div>
            </div>
          </Modal>
        </div>
      </Spin>
    );
  }
}

export default connect(({ home }) => ({
  classListData: home.classListData,
  questionAnalysisData: home.questionAnalysisData,
}))(AnalysisByTop);
