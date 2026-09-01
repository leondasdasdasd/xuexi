import React, { PureComponent } from "react";
import { Chart } from "@antv/g2";
import {
  Button,
  Dropdown,
  Icon,
  Input,
  InputNumber,
  Menu,
  message,
  Modal,
  Select,
  Table,
  Upload,
} from "antd";
import { connect } from "dva";

import sendParent from "../../assets/sendParent.png";
import { locale, trans } from "../../utils/i18n";
import PreviewImg from "../PreviewImg/index";
import StudentQualitySelect from "../studentQualitySelect";

import "viewerjs-react/dist/index.css";
import "viewerjs/dist/viewer.css";
import styles from "./index.module.less";

const language = locale() == "en" ? false : true;

const { Option } = Select;
const { Search } = Input;
const { Column } = Table;
const questionLevel = {
  1: trans("global.easy", "简单"),
  2: trans("global.general", "普通"),
  3: trans("global.difficult", "困难"),
};

let aaa = null;

class PupllPreview extends PureComponent {
  constructor(properties) {
    super(properties);
    this.state = {
      TitName: "",
      errorSetTitle: "",
      errorSetTitle1: "",
      situationSumTitle: "",
      situationSumName: "",
      endingGoalTitle: trans("global.endingGoal", "期末目标"),
      teleslsWayTitle: trans("global.teleslsWay", "达成目标的行动路径"),
      wrongCourseTitle: trans("global.wrongCourse", "错题及订正过程"),
      wrongCourseTitle1: "",
      errorAnalysisTitle: trans("global.errorAnalysis", "错因分析"),
      stuNameId: null,
      modStuInfo: {},
      groupId: 0,
      isEdit: false,
      isEdit1: false,
      testName: "",
      isTitName: false,
      isSituationSumTitle: false,
      isSituationSumName: false,
      isEndingGoalTitle: false,
      isTeleslsWayTitle: false,
      isKnowledgeLiteracy: false,
      newfileList: [],
      literacyFail: false,
      fileId: null,
      dateList: [],
      dateList1: [],
      isShowChart: true,
      isShowSumUp: true,
      isShowWrong: true,
      isShowAnswer: true,
      isShowWrong1: true,
      checkQuestionId: null,
      modalStatus: false,
      stageId: 0,
      gradeId: 0,
      courseId: 0,
      scrollTop: 0,
      questionType: 0,
      searchValue: "",
      IconFont: null,
      questionIndex: null,
      hoverIndexID: null,
      isWrongCourseTitle: false,
      sendParent: false,
      sendoneParent: false,
      stuName: "",
      active: null,
      url: null,
      imgVisible: false,
      hiddenErrorCauseAnalysis: false,
      hiddenAllErrorCauseAnalysis: false,
      hiddeneAnswerArea: false,
    };
    this.rende = true;
    this.child = null;
    this.page = 1;
    this.getCardStatus = true;
  }
  componentDidMount() {
    const IconFonts = Icon.createFromIconfontCN({
      scriptUrl: "//at.alicdn.com/t/font_789461_ovr9ifg67hb.js",
    });
    this.setState({
      IconFont: IconFonts,
    });
    this.props.onRef(this);
    this.props.dispatch({
      type: "home/getClassList",
      payload: {
        examId: this.props.examId,
      },
      callback: (response) => {
        if (response.status) {
          const data = response.content;
          let temporaryClassId = null;

          // 存在班级则默认选中第一个班级，不存在则显示全部班级
          temporaryClassId = data && data.length > 0 ? data[0].groupId : 0;
          this.setState(
            {
              groupId: temporaryClassId,
            },
            () => {
              this.props
                .dispatch({
                  type: "home/getTrendStu",
                  payload: {
                    groupId: temporaryClassId,
                    searchStudentKeyWord: "",
                    examId: this.props.examId,
                  },
                })
                .then(() => {
                  console.log(111);
                  this.props
                    .dispatch({
                      type: "home/getStudySituationByStudentId",
                      payload: {
                        examId: this.props.examId,
                        studentUserId: this.props.trendStuList[0].studentId,
                      },
                    })
                    .then(() => {
                      const { studySituationByStudentIdList } = this.props;
                      this.props.studySituationByStudentIdList &&
                        this.props.studySituationByStudentIdList
                          .moduleModelList &&
                        this.props.studySituationByStudentIdList.moduleModelList
                          .length &&
                        this.props.studySituationByStudentIdList
                          .moduleModelList[0] &&
                        this.props.studySituationByStudentIdList
                          .moduleModelList[0].modelValue &&
                        this.props.studySituationByStudentIdList
                          .moduleModelList[0].modelValue
                          .qualityIndicatorResponseList &&
                        this.props.studySituationByStudentIdList
                          .moduleModelList[0].modelValue
                          .qualityIndicatorResponseList.length &&
                        this.props.studySituationByStudentIdList
                          .moduleModelList[0].modelShow &&
                        this.props.studySituationByStudentIdList.moduleModelList[0].modelValue.qualityIndicatorResponseList.map(
                          (item, index) => {
                            this[`chart${index}`] = new Chart({
                              container: `trendNode${index}`,
                              // forceFit: true,
                              height: 150,
                              padding: [10, 10, 30, 50],
                            });
                            this.renderChart(item, index);
                          },
                        );
                      // console.log(studySituationByStudentIdList, "333");
                      this.setState(
                        {
                          modStuInfo: studySituationByStudentIdList,
                          stuNameId: this.props.trendStuList[0].studentId,
                          TitName:
                            studySituationByStudentIdList &&
                            studySituationByStudentIdList.moduleModelList &&
                            studySituationByStudentIdList.moduleModelList[0]
                              .modelName,
                          errorSetTitle:
                            studySituationByStudentIdList &&
                            studySituationByStudentIdList.moduleModelList &&
                            studySituationByStudentIdList.moduleModelList[2]
                              .modelName,
                          errorSetTitle1:
                            studySituationByStudentIdList &&
                            studySituationByStudentIdList.moduleModelList &&
                            studySituationByStudentIdList.moduleModelList[3]
                              .modelName,
                          situationSumTitle:
                            studySituationByStudentIdList &&
                            studySituationByStudentIdList.moduleModelList &&
                            studySituationByStudentIdList.moduleModelList[1]
                              .modelName,
                          testName: studySituationByStudentIdList.reportName,
                          wrongCourseTitle:
                            studySituationByStudentIdList &&
                            studySituationByStudentIdList.moduleModelList &&
                            studySituationByStudentIdList?.moduleModelList[2]
                              ?.modelValue.objectModelList[0].objectTitle,
                          wrongCourseTitle1:
                            studySituationByStudentIdList &&
                            studySituationByStudentIdList.moduleModelList &&
                            studySituationByStudentIdList?.moduleModelList[3]
                              ?.modelValue.objectModelList[0].objectTitle,
                          // errorAnalysisTitle:
                          //   studySituationByStudentIdList &&
                          //   studySituationByStudentIdList.moduleModelList &&
                          //   studySituationByStudentIdList?.moduleModelList[2]
                          //     ?.modelValue.objectModelList[1].objectTitle,
                          situationSumName:
                            studySituationByStudentIdList &&
                            studySituationByStudentIdList.moduleModelList &&
                            studySituationByStudentIdList?.moduleModelList[1]
                              ?.modelValue.objectModelList[0].objectTitle,
                          endingGoalTitle:
                            studySituationByStudentIdList &&
                            studySituationByStudentIdList.moduleModelList &&
                            studySituationByStudentIdList?.moduleModelList[1]
                              ?.modelValue.objectModelList[1].objectTitle,
                          teleslsWayTitle:
                            studySituationByStudentIdList &&
                            studySituationByStudentIdList.moduleModelList &&
                            studySituationByStudentIdList?.moduleModelList[1]
                              ?.modelValue.objectModelList[2].objectTitle,
                          dateList:
                            studySituationByStudentIdList &&
                            studySituationByStudentIdList.moduleModelList &&
                            studySituationByStudentIdList?.moduleModelList[2]
                              ?.modelValue?.objectModelList[0]
                              ?.objectContentList,
                          dateList1:
                            studySituationByStudentIdList &&
                            studySituationByStudentIdList.moduleModelList &&
                            studySituationByStudentIdList?.moduleModelList[3]
                              ?.modelValue?.objectModelList[0]
                              ?.objectContentList,
                          isShowChart:
                            studySituationByStudentIdList &&
                            studySituationByStudentIdList.moduleModelList &&
                            studySituationByStudentIdList?.moduleModelList[0]
                              ?.modelShow,
                          isShowSumUp:
                            studySituationByStudentIdList &&
                            studySituationByStudentIdList.moduleModelList &&
                            studySituationByStudentIdList?.moduleModelList[1]
                              ?.modelShow,
                          isShowWrong:
                            studySituationByStudentIdList &&
                            studySituationByStudentIdList.moduleModelList &&
                            studySituationByStudentIdList?.moduleModelList[2]
                              ?.modelShow,
                          isShowAnswer:
                            studySituationByStudentIdList &&
                            studySituationByStudentIdList.moduleModelList &&
                            studySituationByStudentIdList?.moduleModelList[2]
                              ?.hasAnswer,
                          isShowWrong1:
                            studySituationByStudentIdList &&
                            studySituationByStudentIdList.moduleModelList &&
                            studySituationByStudentIdList?.moduleModelList[3]
                              ?.modelShow,
                          hiddenErrorCauseAnalysis:
                            studySituationByStudentIdList &&
                            studySituationByStudentIdList.moduleModelList &&
                            studySituationByStudentIdList?.moduleModelList[2]
                              ?.hiddenErrorCauseAnalysis,
                          hiddenAllErrorCauseAnalysis:
                            studySituationByStudentIdList &&
                            studySituationByStudentIdList.moduleModelList &&
                            studySituationByStudentIdList?.moduleModelList[2]
                              ?.hiddenAllErrorCauseAnalysis,
                          hiddeneAnswerArea:
                            studySituationByStudentIdList &&
                            studySituationByStudentIdList.moduleModelList &&
                            studySituationByStudentIdList?.moduleModelList[2]
                              ?.hiddeneAnswerArea,
                        },
                        () => {
                          this.autoSave();
                          this.props.dispatch({
                            type: "global/getFocusQuestionList",
                            payload: {
                              examId: this.props.examId,
                              studentUserId: this.state.stuNameId,
                            },
                          });
                        },
                      );
                    });
                });
            },
          );
        } else {
          message.error(response.message);
        }
      },
    });
  }
  componentWillUnmount() {
    clearTimeout(aaa);
  }

  autoSave = (id) => {
    //
    const { studySituationByStudentIdList } = this.props;
    const {
      stuNameId,
      TitName,
      isShowChart,
      isShowSumUp,
      situationSumTitle,
      situationSumName,
      endingGoalTitle,
      teleslsWayTitle,
      errorSetTitle,
      errorSetTitle1,
      isShowWrong,
      isShowWrong1,
      wrongCourseTitle,
      wrongCourseTitle1,
      errorAnalysisTitle,
      dateList,
      dateList1,
      isShowAnswer,
    } = this.state;
    aaa = setInterval(() => {
      console.log("hahaha");
      this.props.dispatch({
        type: "global/postStudySituationStructureByStudentId",
        payload: {
          examId: this.props.examId,
          studentId: id ? id : stuNameId,
          reportName: studySituationByStudentIdList?.reportName,
          studentName: studySituationByStudentIdList?.studentName,
          studentEnName: studySituationByStudentIdList?.studentEnName,
          groupName: studySituationByStudentIdList?.groupName,
          groupEnName: studySituationByStudentIdList?.groupEnName,
          moduleModelList: [
            {
              modelCode:
                studySituationByStudentIdList &&
                studySituationByStudentIdList.moduleModelList &&
                studySituationByStudentIdList?.moduleModelList[0]?.modelCode,
              modelName: TitName,
              modelShow: isShowChart,
            },
            {
              modelCode:
                studySituationByStudentIdList &&
                studySituationByStudentIdList.moduleModelList &&
                studySituationByStudentIdList?.moduleModelList[1]?.modelCode,
              modelName: situationSumTitle,
              modelValue: {
                objectModelList: [
                  {
                    objectTitle: situationSumName,
                    objectType: "text",
                    objectContentList: [],
                  },
                  {
                    objectTitle: endingGoalTitle,
                    objectType: "text",
                    objectContentList: [],
                  },
                  {
                    objectTitle: teleslsWayTitle,
                    objectType: "text",
                    objectContentList: [],
                  },
                ],
              },
              modelShow: isShowSumUp,
            },
            {
              modelCode:
                studySituationByStudentIdList &&
                studySituationByStudentIdList.moduleModelList &&
                studySituationByStudentIdList?.moduleModelList[2]?.modelCode,
              modelName: errorSetTitle,
              modelValue: {
                objectModelList: [
                  {
                    objectTitle: wrongCourseTitle,
                    objectType:
                      studySituationByStudentIdList &&
                      studySituationByStudentIdList.moduleModelList &&
                      studySituationByStudentIdList?.moduleModelList[2]
                        ?.modelValue.objectModelList[0].objectType,
                    objectContentList: dateList,
                  },
                  // {
                  //   objectTitle: errorAnalysisTitle,
                  //   objectType:
                  //     studySituationByStudentIdList &&
                  //     studySituationByStudentIdList.moduleModelList &&
                  //     studySituationByStudentIdList?.moduleModelList[2]
                  //       ?.modelValue.objectModelList[1].objectType,
                  //   objectContentList: [],
                  // },
                ],
              },
              modelShow: isShowWrong,
              isShowAnswer: isShowAnswer,
            },
            {
              modelCode:
                studySituationByStudentIdList &&
                studySituationByStudentIdList.moduleModelList &&
                studySituationByStudentIdList?.moduleModelList[3]?.modelCode,
              modelName: errorSetTitle1,
              modelValue: {
                objectModelList: [
                  {
                    objectTitle: wrongCourseTitle1,
                    objectType:
                      studySituationByStudentIdList &&
                      studySituationByStudentIdList.moduleModelList &&
                      studySituationByStudentIdList?.moduleModelList[3]
                        ?.modelValue.objectModelList[0].objectType,
                    objectContentList: dateList1,
                  },
                ],
              },
              modelShow: isShowWrong1,
            },
          ],
        },
      });
    }, 30_000);
  };
  changeSave = (id) => {
    //
    const { studySituationByStudentIdList } = this.props;
    const {
      stuNameId,
      TitName,
      isShowChart,
      isShowSumUp,
      situationSumTitle,
      situationSumName,
      endingGoalTitle,
      teleslsWayTitle,
      errorSetTitle,
      errorSetTitle1,
      isShowWrong,
      isShowWrong1,
      wrongCourseTitle,
      wrongCourseTitle1,
      errorAnalysisTitle,
      dateList,
      dateList1,
      isShowAnswer,
    } = this.state;
    console.log("hahaha");
    this.props.dispatch({
      type: "global/postStudySituationStructureByStudentId",
      payload: {
        examId: this.props.examId,
        studentId: id ? id : stuNameId,
        reportName: studySituationByStudentIdList?.reportName,
        studentName: studySituationByStudentIdList?.studentName,
        studentEnName: studySituationByStudentIdList?.studentEnName,
        groupName: studySituationByStudentIdList?.groupName,
        groupEnName: studySituationByStudentIdList?.groupEnName,
        moduleModelList: [
          {
            modelCode:
              studySituationByStudentIdList?.moduleModelList &&
              studySituationByStudentIdList?.moduleModelList.length > 0
                ? studySituationByStudentIdList?.moduleModelList[0]?.modelCode
                : "OVERALL_SITUATION",
            modelName: TitName,
            modelShow: isShowChart,
          },
          {
            modelCode:
              studySituationByStudentIdList?.moduleModelList &&
              studySituationByStudentIdList?.moduleModelList.length > 0
                ? studySituationByStudentIdList?.moduleModelList[1]?.modelCode
                : "CONCLUSION",
            modelName: situationSumTitle,
            modelValue: {
              objectModelList: [
                {
                  objectTitle: situationSumName,
                  objectType: "text",
                  objectContentList: [],
                },
                {
                  objectTitle: endingGoalTitle,
                  objectType: "text",
                  objectContentList: [],
                },
                {
                  objectTitle: teleslsWayTitle,
                  objectType: "text",
                  objectContentList: [],
                },
              ],
            },
            modelShow: isShowSumUp,
          },
          {
            modelCode:
              studySituationByStudentIdList?.moduleModelList &&
              studySituationByStudentIdList?.moduleModelList.length > 0
                ? studySituationByStudentIdList?.moduleModelList[2]?.modelCode
                : "WRONG_TOPIC_COLLECTION",
            modelName: errorSetTitle,
            modelValue: {
              objectModelList: [
                {
                  objectTitle: wrongCourseTitle,
                  objectType:
                    studySituationByStudentIdList?.moduleModelList &&
                    studySituationByStudentIdList?.moduleModelList.length > 0
                      ? studySituationByStudentIdList?.moduleModelList[2]
                          ?.modelValue?.objectModelList[0]?.objectType
                      : "question",
                  objectContentList: dateList,
                },
                // {
                //   objectTitle: errorAnalysisTitle,
                //   objectType:
                //     studySituationByStudentIdList?.moduleModelList &&
                //     studySituationByStudentIdList?.moduleModelList.length > 0
                //       ? studySituationByStudentIdList?.moduleModelList[2]
                //           ?.modelValue?.objectModelList[1]?.objectType
                //       : "text",
                //   objectContentList: [],
                // },
              ],
            },
            modelShow: isShowWrong,
            isShowAnswer: isShowAnswer,
          },
          {
            modelCode:
              studySituationByStudentIdList?.moduleModelList &&
              studySituationByStudentIdList?.moduleModelList.length > 0
                ? studySituationByStudentIdList?.moduleModelList[3]?.modelCode
                : "PERSONALISE",
            modelName: errorSetTitle1,
            modelValue: {
              objectModelList: [
                {
                  objectTitle: wrongCourseTitle1,
                  objectType:
                    studySituationByStudentIdList?.moduleModelList &&
                    studySituationByStudentIdList?.moduleModelList.length > 0
                      ? studySituationByStudentIdList?.moduleModelList[3]
                          ?.modelValue.objectModelList[0].objectType
                      : "question",
                  objectContentList: dateList1,
                },
              ],
            },
            modelShow: isShowWrong1,
          },
        ],
      },
    });
  };
  changeStu = (id) => {
    // this.changeSave(id);
    setTimeout(() => {
      this.changeSearchStuName(id);
    }, 1000);
  };
  // 选择学生
  changeSearchStuName = (e) => {
    console.log(this.state.stuNameId, e, "qww");
    if (e) {
      this.setState({
        stuNameId: e,
      });
    }
    this.props
      .dispatch({
        type: "home/getStudySituationByStudentId",
        payload: {
          examId: this.props.examId,
          studentUserId: e ? e : this.state.stuNameId,
        },
      })
      .then(() => {
        const { studySituationByStudentIdList } = this.props;
        this.setState(
          {
            modStuInfo: studySituationByStudentIdList,
            stuNameId: e ? e : this.state.stuNameId,
            TitName:
              studySituationByStudentIdList?.moduleModelList &&
              studySituationByStudentIdList?.moduleModelList.length > 0 &&
              studySituationByStudentIdList.moduleModelList[0]?.modelName,
            errorSetTitle:
              studySituationByStudentIdList?.moduleModelList &&
              studySituationByStudentIdList?.moduleModelList.length > 0 &&
              studySituationByStudentIdList.moduleModelList[2]?.modelName,
            errorSetTitle1:
              studySituationByStudentIdList?.moduleModelList &&
              studySituationByStudentIdList?.moduleModelList.length > 0 &&
              studySituationByStudentIdList.moduleModelList[3]?.modelName,
            situationSumTitle:
              studySituationByStudentIdList?.moduleModelList &&
              studySituationByStudentIdList?.moduleModelList.length > 0 &&
              studySituationByStudentIdList.moduleModelList[1]?.modelName,
            testName: studySituationByStudentIdList.reportName,
            wrongCourseTitle:
              studySituationByStudentIdList?.moduleModelList &&
              studySituationByStudentIdList?.moduleModelList.length > 0 &&
              studySituationByStudentIdList?.moduleModelList[2]?.modelValue
                .objectModelList[0]?.objectTitle,
            wrongCourseTitle1:
              studySituationByStudentIdList?.moduleModelList &&
              studySituationByStudentIdList?.moduleModelList.length > 0 &&
              studySituationByStudentIdList?.moduleModelList[3]?.modelValue
                .objectModelList[0]?.objectTitle,
            // errorAnalysisTitle:
            //   studySituationByStudentIdList?.moduleModelList &&
            //   studySituationByStudentIdList?.moduleModelList.length > 0 &&
            //   studySituationByStudentIdList?.moduleModelList[2]?.modelValue
            //     .objectModelList[1]?.objectTitle,
            situationSumName:
              studySituationByStudentIdList?.moduleModelList &&
              studySituationByStudentIdList?.moduleModelList.length > 0 &&
              studySituationByStudentIdList?.moduleModelList[1]?.modelValue
                .objectModelList[0]?.objectTitle,
            endingGoalTitle:
              studySituationByStudentIdList?.moduleModelList &&
              studySituationByStudentIdList?.moduleModelList.length > 0 &&
              studySituationByStudentIdList?.moduleModelList[1]?.modelValue
                .objectModelList[1]?.objectTitle,
            teleslsWayTitle:
              studySituationByStudentIdList?.moduleModelList &&
              studySituationByStudentIdList?.moduleModelList.length > 0 &&
              studySituationByStudentIdList?.moduleModelList[1]?.modelValue
                .objectModelList[2]?.objectTitle,
            dateList:
              studySituationByStudentIdList?.moduleModelList &&
              studySituationByStudentIdList?.moduleModelList.length > 0 &&
              studySituationByStudentIdList?.moduleModelList[2]?.modelValue
                ?.objectModelList[0]?.objectContentList,
            dateList1:
              studySituationByStudentIdList?.moduleModelList &&
              studySituationByStudentIdList?.moduleModelList.length > 0 &&
              studySituationByStudentIdList?.moduleModelList[3]?.modelValue
                ?.objectModelList[0]?.objectContentList,
            isShowChart:
              studySituationByStudentIdList?.moduleModelList &&
              studySituationByStudentIdList?.moduleModelList.length > 0 &&
              studySituationByStudentIdList?.moduleModelList[0]?.modelShow,
            isShowSumUp:
              studySituationByStudentIdList?.moduleModelList &&
              studySituationByStudentIdList?.moduleModelList.length > 0 &&
              studySituationByStudentIdList?.moduleModelList[1]?.modelShow,
            isShowWrong:
              studySituationByStudentIdList?.moduleModelList &&
              studySituationByStudentIdList?.moduleModelList.length > 0 &&
              studySituationByStudentIdList?.moduleModelList[2]?.modelShow,
            isShowAnswer:
              studySituationByStudentIdList?.moduleModelList &&
              studySituationByStudentIdList?.moduleModelList.length > 0 &&
              studySituationByStudentIdList?.moduleModelList[2]?.hasAnswer,
            isShowWrong1:
              studySituationByStudentIdList?.moduleModelList &&
              studySituationByStudentIdList?.moduleModelList.length > 0 &&
              studySituationByStudentIdList?.moduleModelList[3]?.modelShow,
            hiddenErrorCauseAnalysis:
              studySituationByStudentIdList &&
              studySituationByStudentIdList.moduleModelList &&
              studySituationByStudentIdList?.moduleModelList[2]
                ?.hiddenErrorCauseAnalysis,
            hiddenAllErrorCauseAnalysis:
              studySituationByStudentIdList &&
              studySituationByStudentIdList.moduleModelList &&
              studySituationByStudentIdList?.moduleModelList[2]
                ?.hiddenAllErrorCauseAnalysis,
            hiddeneAnswerArea:
              studySituationByStudentIdList &&
              studySituationByStudentIdList.moduleModelList &&
              studySituationByStudentIdList?.moduleModelList[2]
                ?.hiddeneAnswerArea,
          },
          () => {
            clearTimeout(aaa);
            this.autoSave(e);
          },
        );
        this.props.studySituationByStudentIdList &&
          this.props.studySituationByStudentIdList.moduleModelList &&
          this.props.studySituationByStudentIdList.moduleModelList.length &&
          this.props.studySituationByStudentIdList.moduleModelList[0] &&
          this.props.studySituationByStudentIdList.moduleModelList[0]
            .modelValue &&
          this.props.studySituationByStudentIdList.moduleModelList[0].modelValue
            .qualityIndicatorResponseList &&
          this.props.studySituationByStudentIdList.moduleModelList[0].modelValue
            .qualityIndicatorResponseList.length &&
          this.props.studySituationByStudentIdList.moduleModelList[0].modelValue.qualityIndicatorResponseList.map(
            (item, index) => {
              if (!this[`chart${index}`]) {
                this[`chart${index}`] = new Chart({
                  container: `trendNode${index}`,
                  // forceFit: true,
                  height: 150,
                  padding: [10, 10, 30, 50],
                });
              }
              // this[`chart${index}`] = new Chart({
              //   container: `trendNode${index}`,
              //   // forceFit: true,
              //   height: 330,
              // });
              this.renderChart(item, index);
            },
          );
        // this.setState({
        //   modStuInfo: studySituationByStudentIdList,
        //   // stuNameId: this.props.trendStuList[0].studentId,
        //   TitName: studySituationByStudentIdList?.moduleModelList[0]?.modelName,
        //   errorSetTitle:
        //     studySituationByStudentIdList.moduleModelList[2].modelName,
        //   situationSumTitle:
        //     studySituationByStudentIdList.moduleModelList[1].modelName,
        // });
      });
  };

  // 搜索学生
  onSearchStuName = () => {};

  renderChart = (knowLedgeAnalysis, id) => {
    // $(`#trendBox${id}`).find("canvas").remove();
    const dom = document.getElementById(`trendBox${id}`);
    if (!dom) {
      return;
    }
    if (knowLedgeAnalysis.columnSet && knowLedgeAnalysis.columnSet.length > 0) {
      if (
        knowLedgeAnalysis.columnSet.length > 4 &&
        knowLedgeAnalysis.columnSet.length < 8
      ) {
        dom.style.width = "50%";
        // console.log(dom.offsetWidth);
        this[`chart${id}`].changeWidth(dom.offsetWidth);
      } else if (knowLedgeAnalysis.columnSet.length > 7) {
        // const dom = document.getElementById(`trendBox${id}`);
        dom.style.width = "100%";
        this[`chart${id}`].changeWidth(dom.offsetWidth);
      } else if (knowLedgeAnalysis.columnSet.length < 5) {
        // const dom = document.getElementById(`trendBox${id}`);
        dom.style.width = "33%";
        this[`chart${id}`].changeWidth(dom.offsetWidth);
      }
    }
    if (!this.rende) {
      this[`chart${id}`].clear();
    }
    let newList = [];
    if (
      knowLedgeAnalysis &&
      knowLedgeAnalysis.qualityIndicatorData &&
      knowLedgeAnalysis.qualityIndicatorData.length > 0
    ) {
      knowLedgeAnalysis?.qualityIndicatorData[0]?.columnDataModelList.map(
        (item, index) => {
          newList.push({
            年级得分率: Number.parseInt(item.averageRate, 10),
            index: index,
          });
        },
      );
      knowLedgeAnalysis?.qualityIndicatorData[1]?.columnDataModelList.map(
        (item, index) => {
          newList[index].学生得分率 = Number.parseInt(item.averageRate, 10);
        },
      );
      knowLedgeAnalysis?.columnSet.map((item, index) => {
        if (index == 0) return;
        newList[index - 1].title = item.columnName;
      });
    }

    this[`chart${id}`].source(newList);
    this[`chart${id}`].scale({
      学生得分率: {
        min: 0,
        max: 100,
        formatter: (value) => {
          // 设置坐标轴和提示框的文字
          return value + "%";
        },
      },
      年级得分率: {
        min: 0,
        max: 100,
        formatter: (value) => {
          return value + "%";
        },
      },
    });
    this[`chart${id}`].axis("年级得分率", {
      grid: null,
      label: {
        textStyle: {
          fill: "",
        },
      },
      line: null,
    });
    this[`chart${id}`]
      .interval()
      .position("title*学生得分率")
      .color("title", [
        "#3d94ff",
        "#12CC67",
        "#FFE030",
        "#FC7D7D",
        "#4BE4E7",
        "#19A978",
        "#FF9451",
        "#B169EB",
        "#E286D2",
        "#3D82D6",
        "#CC8C47",
        "#B0CAFF",
        "#CE6C6C",
        "#C0DF35",
        "#D4B589",
        "#C1C1C1",
      ])
      .tooltip(
        "title*学生得分率*color*fakeName",
        (title, value, color, fakeName) => {
          return {
            name: title,
            value,
            color,
            fakeName: "学生得分率",
          };
        },
      )
      .label("学生得分率", (value) => {
        // if (val < 10) {
        //   return false;
        // }
        return {
          position: "top",
          offset: 0,
          textStyle: {
            fill: "#333",
            fontSize: 10,
            shadowBlur: 2,
            // shadowColor: "rgba(0, 0, 0, .45)",
          },
          formatter: (text) => {
            return text;
          },
        };
      });
    this[`chart${id}`]
      .line()
      .position("title*年级得分率")
      .color("#f00")
      .size(2)
      .shape("line")
      .tooltip(
        "title*年级得分率*color*fakeName",
        (title, value, color, fakeName) => {
          return {
            name: title,
            value,
            color: "#f00",
            fakeName: "年级得分率",
          };
        },
      );
    this[`chart${id}`].axis("title", {
      label: {
        textStyle: {
          textAlign: "center", // 文本对齐方向，可取值为： start center end
          fill: "#404040", // 文本的颜色
          fontSize: "12", // 文本大小
          fontWeight: "bold", // 文本粗细
          textBaseline: "top", // 文本基准线，可取 top middle bottom，默认为middle
        },
        htmlTemplate(text, item, index) {
          if (knowLedgeAnalysis.columnSet.length > 15) {
            if ((index + 1) % 2 === 1) {
              let html = "";
              text.length > 3
                ? (html = `<div style="width: 45px; white-space: pre-wrap; text-align: left; font-size: 12px;transform:scale(0.7);line-height: 14px;">${text}</div>`)
                : (html = `<div style="width: 45px;white-space: nowrap;overflow: hidden; text-overflow:ellipsis; text-align: center; font-size: 12px;transform:scale(0.7);line-height: 14px;">${text}</div>`);
              return html;
            } else {
              let html = "";
              text.length > 3
                ? (html = `<div style="width: 45px; white-space: pre-wrap; text-align: left; font-size: 12px;transform:scale(0.7);line-height: 14px;">${text}</div>`)
                : (html = `<div style="width: 45px;white-space: nowrap;overflow: hidden; text-overflow:ellipsis; text-align: center; font-size: 12px;transform:scale(0.7);line-height: 14px;">${text}</div>`);
              return html;
            }
          } else {
            if ((index + 1) % 2 === 1) {
              let html = "";
              text.length > 3
                ? (html = `<div style="width: 54px; white-space: pre-wrap; text-align: left; font-size: 12px;transform:scale(0.8);line-height: 14px;">${text}</div>`)
                : (html = `<div style="width: 54px;white-space: nowrap;overflow: hidden; text-overflow:ellipsis; text-align: center; font-size: 12px;transform:scale(0.8);line-height: 14px;">${text}</div>`);
              return html;
            } else {
              let html = "";
              text.length > 3
                ? (html = `<div style="width: 54px; white-space: pre-wrap; text-align: left; font-size: 12px;transform:scale(0.8);line-height: 14px;">${text}</div>`)
                : (html = `<div style="width: 54px;white-space: nowrap;overflow: hidden; text-overflow:ellipsis; text-align: center; font-size: 12px;transform:scale(0.8);line-height: 14px;">${text}</div>`);
              return html;
            }
          }
        },
      },
    });
    this[`chart${id}`].tooltip({
      itemTpl: `<div><li><span style="background-color: {color}; width: 4px;height: 4px;border-radius: 2px;display: inline-block; vertical-align: middle"></span><span style='margin-left: 10px;'>{fakeName}</span><span style='margin-left: 10px;'>{value}%</span></li></div>`,
    });
    this[`chart${id}`].animate({
      enter: {
        animation: "fadeIn", // 动画名称
        easing: "easeQuadIn", // 动画缓动效果
        delay: 100, // 动画延迟执行时间
        duration: 200, // 动画执行时间
      },
    });
    this[`chart${id}`].legend(false);
    this[`chart${id}`].render();
    if (this.rende) {
      this.rende = false;
    }
  };

  downloadTest = () => {
    let array = [this.state.stuNameId];
    // window.print();
    console.log(array, "33");
    window.open(
      `${window.location.origin}/api/exam/download/allStudentStudySituation?examId=${this.props.examId}&studentIdList=${array}`,
    );
    // this.props.dispatch({
    //   type: "home/postAllStudentStudySituation",
    //   payload: {
    //     examId: this.props.examId,
    //     studentIdList: arr,
    //   },
    // });
  };

  changeSearch = (e) => {
    this.setState({
      stuName: e.target.value,
    });
  };

  onSearch = (value) => {
    this.getStu();
  };

  getStu = () => {
    console.log("1111");
    this.props
      .dispatch({
        type: "home/getTrendStu",
        payload: {
          groupId: this.state.groupId,
          searchStudentKeyWord: this.state.stuName,
          examId: this.props.examId,
        },
      })
      .then(() => {
        if (this.props.trendStuList && this.props.trendStuList.length > 0) {
          this.setState(
            {
              stuNameId: this.props.trendStuList[0].studentId,
            },
            () => {
              this.changeSearchStuName(this.props.trendStuList[0].studentId);
            },
          );
        }
      });
  };

  changeClass = (value) => {
    this.setState(
      {
        groupId: value,
        pageNo: 1,
      },
      () => {
        this.getStu();
      },
    );
  };

  clickBatchDown = () => {
    let url = `${window.location.origin}/api/exam/download/allStudentStudySituation?examId=${this.props.examId}`;
    window.open(url);
  };

  //保存
  saveData = () => {
    const {
      testName,
      TitName,
      situationSumTitle,
      errorSetTitle,
      errorSetTitle1,
      situationSumName,
      endingGoalTitle,
      teleslsWayTitle,
      wrongCourseTitle,
      wrongCourseTitle1,
      errorAnalysisTitle,
    } = this.state;
    console.log(
      this.state.stuNameId,
      this.props.trendStuList[0].studentId,
      "111",
    );
    this.props
      .dispatch({
        type: "home/postSaveStudySituationStructure",
        payload: {
          examId: this.props.examId,
          reportName: testName,
          studentName: "张三",
          studentEnName: "zhangsan",
          groupName: "九云",
          groupEnName: "九云-en",
          moduleModelList: [
            {
              modelCode: "OVERALL_SITUATION",
              modelName: TitName,
            },
            {
              modelCode: "CONCLUSION",
              modelName: situationSumTitle,
              modelValue: {
                objectModelList: [
                  {
                    objectTitle: situationSumName,
                    objectType: "text",
                    objectContentList: [],
                  },
                  {
                    objectTitle: endingGoalTitle,
                    objectType: "text",
                    objectContentList: [],
                  },
                  {
                    objectTitle: teleslsWayTitle,
                    objectType: "text",
                    objectContentList: [],
                  },
                ],
              },
            },
            {
              modelCode: "WRONG_TOPIC_COLLECTION",
              modelName: errorSetTitle,
              modelValue: {
                objectModelList: [
                  {
                    objectTitle: wrongCourseTitle,
                    objectType: "question",
                    objectContentList: [],
                  },
                  // {
                  //   objectTitle: errorAnalysisTitle,
                  //   objectType: "text",
                  //   objectContentList: [],
                  // },
                ],
              },
            },
            {
              modelCode: "PERSONALISE",
              modelName: errorSetTitle1,
              modelValue: {
                objectModelList: [
                  {
                    objectTitle: wrongCourseTitle1,
                    objectType: "question",
                    objectContentList: [],
                  },
                ],
              },
            },
          ],
        },
      })
      .then(() => {
        this.setState(
          {
            isEdit: false,
          },
          () => {
            this.changeSearchStuName(
              this.state.stuNameId || this.props.trendStuList[0].studentId,
            );
          },
        );
      });
  };

  // 整体概述
  clickTitName = () => {
    this.setState(
      {
        isTitName: true,
      },
      () => {
        const titleInp = document.querySelector("#headerInput");
        titleInp.focus();
      },
    );
  };

  blurTitName = (e) => {
    this.setState({
      TitName: e.target.value,
      isTitName: false,
    });
  };

  // 现状总结·新目标·行动路径
  clickSituationSumTitle = () => {
    this.setState(
      {
        isSituationSumTitle: true,
      },
      () => {
        const titleInp = document.querySelector("#situationSumTitleId");
        titleInp.focus();
      },
    );
  };

  blurSituationSumTitle = (e) => {
    this.setState(
      {
        situationSumTitle: e.target.value,
        isSituationSumTitle: false,
      },
      () => {},
    );
  };

  // 现状总结
  clickSituationSumName = () => {
    this.setState(
      {
        isSituationSumName: true,
      },
      () => {
        const titleInp = document.querySelector("#situationSumNameId");
        titleInp.focus();
      },
    );
  };

  blurSituationSumName = (e) => {
    this.setState(
      {
        situationSumName: e.target.value,
        isSituationSumName: false,
      },
      () => {},
    );
  };

  // 期末目标
  clickEndingGoalTitle = () => {
    this.setState(
      {
        isEndingGoalTitle: true,
      },
      () => {
        const titleInp = document.querySelector("#endingGoalTitleId");
        titleInp.focus();
      },
    );
  };

  blurEndingGoalTitle = (e) => {
    this.setState(
      {
        endingGoalTitle: e.target.value,
        isEndingGoalTitle: false,
      },
      () => {},
    );
  };

  // 达成目标的行动路径
  clickTeleslsWayTitle = () => {
    this.setState(
      {
        isTeleslsWayTitle: true,
      },
      () => {
        const titleInp = document.querySelector("#teleslsWayTitleId");
        titleInp.focus();
      },
    );
  };

  blurTeleslsWayTitle = (e) => {
    this.setState(
      {
        teleslsWayTitle: e.target.value,
        isTeleslsWayTitle: false,
      },
      () => {},
    );
  };

  // 错题及订正过程
  wrongCourseName = () => {
    const { wrongCourseTitle, isWrongCourseTitle } = this.state;
    return isWrongCourseTitle ? (
      <Input
        value={wrongCourseTitle}
        className={styles.headerTitle}
        id="wrongCourseTitleId"
        onChange={(e) => this.setState({ wrongCourseTitle: e.target.value })}
        onBlur={(e) => this.blurWrongCourseTitle(e)}
      />
    ) : (
      <span className={styles.tableHeaderTitle}>
        <span className={styles.tableHeaderTitle}>
          {wrongCourseTitle}
          {/* <i
            className={[styles.iconfont, styles.editTitle].join(" ")}
            style={{ cursor: "pointer" }}
            onClick={() => this.clickWrongCourseTitle()}
          >
            &#xe7a1;
          </i> */}
        </span>
      </span>
    );
  };

  clickWrongCourseTitle = () => {
    this.setState(
      {
        isWrongCourseTitle: true,
      },
      () => {
        const titleInp = document.querySelector("#wrongCourseTitleId");
        titleInp.focus();
      },
    );
  };

  changeTestName = (e) => {
    this.setState({
      testName: e.target.value,
    });
  };

  onBlurTitle = () => {};

  clickKnowledgeLiteracy = (id) => {
    this.props
      .dispatch({
        type: "home/getModifyAnalysisDimension",
        payload: {
          examId: this.props.examId,
        },
      })
      .then(() => {
        if (this.props.modifyAnalysisDimension) {
          this.setState({
            isKnowledgeLiteracy: true,
            titleId: id,
            newfileList: [
              {
                uid: this.props.modifyAnalysisDimension?.fileId || null,
                name: this.props.modifyAnalysisDimension?.fileName || null,
                status: "done",
                url: this.props.modifyAnalysisDimension?.downloadUrl,
              },
            ],
          });
        } else {
          this.setState({
            isKnowledgeLiteracy: true,
            titleId: id,
            newfileList: null,
          });
        }
      });
  };

  // 取消
  cancelKnowledgeLiteracy = (e) => {
    this.setState({
      isKnowledgeLiteracy: false,
      literacyFail: false,
      // disabled: this.props.qualityFileModel?.fileId ? false : true,
    });
  };

  // 确定
  okKnowledgeLiteracy = (e) => {
    this.props
      .dispatch({
        type: "home/getAttainmentTest",
        payload: {
          fileId: this.state.fileId,
          paperId: this.props.paperId,
        },
      })
      .then(() => {
        if (this.props.attainmentTest === null) {
          this.cancelKnowledgeLiteracy();
          this.setState({
            isKnowledgeLiteracy: false,
          });
          message.success(trans("homeWorkNew.importSuccess", "导入成功"));
          this.setState({
            isKnowledgeLiteracy: false,
          });
          this.Refresh();
          // this.forceUpdate();
        } else {
          this.setState({
            literacyFail: true,
          });
          const { attainmentTest } = this.props;
          let newAttainmentTest = JSON.parse(JSON.stringify(attainmentTest));
          let array = [];
          newAttainmentTest?.map((item) => {
            array.push({ lineNumber: item, mistake: "错误内容文案" });
          });
          this.props.dispatch({
            type: "home/changeAttainmentTest",
            payload: {
              attainmentTest: array,
            },
          });
        }
      });
  };

  // 下载素养模板
  clickDownloadTemplate = () => {
    let url = `${window.location.origin}/api/paper/export/template?paperId=${this.props.paperId}`;
    window.location.href = url;
  };

  changupload = (info) => {
    let file = info.file;
    let fileList = [...info.fileList];
    this.setState({
      filelist: info.file,
    });
    fileList = fileList.slice(-1);
    fileList = fileList.map((file) => {
      if (file.response) {
        file.url = file.response.url;
        this.setState({
          fileId: file.response.content[0].fileId,
        });
      }
      return file;
    });
    this.setState({
      newfileList: fileList,
    });
  };

  onRow = (row, index) => {
    return {
      onClick: (event) => {
        console.log(row, index, "www");
        let state = Object.assign({}, this.state);
        state[`hoverIndex${this.props.hoverIndex}`] = false;
        console.log(this.props.hoverIndex, state, row.questionId, "sasa");
        this.setState(
          {
            ...state,
            hoverIndexID: row.questionId,
          },
          () => {
            this.props
              .dispatch({
                type: "home/hoverIndex",
                payload: {
                  hoverIndex: row.questionId,
                },
              })
              .then(() => {
                // let state = Object.assign({}, this.state);
                state[`hoverIndex${row.questionId}`] = true;
                // state[`hoverIndex${this.props.hoverIndex}`] = false;
                console.log(state, "sasa1");
                this.setState({
                  ...state,
                  hoverIndexID: row.questionId,
                });
              });
          },
        );
      },
      // onMouseLeave: (event) => {
      //   this.props.dispatch({
      //     type: "home/hoverIndex",
      //     payload: {
      //       hoverIndex: row.questionId,
      //     },
      //   });
      //   console.log(row, index, "www");
      //   let state = Object.assign({}, this.state);
      //   state[`hoverIndex${row.questionId}`] = false;
      //   this.setState({
      //     ...state,
      //     hoverIndexID: null,
      //   });
      // },
    };
  };
  onRow1 = (row, index) => {
    return {
      onClick: (event) => {
        let state = Object.assign({}, this.state);
        state[`hoverIndexc${this.props.hoverIndexc}`] = false;
        this.setState(
          {
            ...state,
          },
          () => {
            this.props
              .dispatch({
                type: "home/hoverIndexc",
                payload: {
                  hoverIndexc: row.questionId,
                },
              })
              .then(() => {
                state[`hoverIndexc${row.questionId}`] = true;

                this.setState({
                  ...state,
                });
              });
          },
        );
        // console.log(row, index, "www");
      },
      // onMouseLeave: (event) => {
      //   this.props.dispatch({
      //     type: "home/hoverIndexc",
      //     payload: {
      //       hoverIndexc: row.questionId,
      //     },
      //   });
      //   console.log(row, index, "www");
      //   let state = Object.assign({}, this.state);
      //   state[`hoverIndexc${row.questionId}`] = false;
      //   this.setState({
      //     ...state,
      //   });
      // },
    };
  };

  scoreChange = (index, e) => {
    const dom = document.getElementById(`question${index}`);

    if (e === 0) {
      return message.error(trans("detail.numMessage2", "请输入正整数"));
    }
    let value = e === "" ? 0 : e;
    const r = /^\d+(\.\d+)?/;
    if (!r.test(value)) {
      // return message.error(trans("detail.numMessage", "请输入数字"));
    }
    let newDateList = JSON.parse(JSON.stringify(this.state.dateList));
    newDateList.length > 0 &&
      newDateList.map((item) => {
        if (item.questionId == index) {
          item.answerFormat = value;
        }
      });
    this.setState(
      {
        dateList: newDateList,
      },
      () => {
        clearTimeout(aaa);
        this.autoSave();
      },
    );
    dom.scrollIntoView();
  };
  scoreChange1 = (index, e) => {
    if (e === 0) {
      return message.error(trans("detail.numMessage2", "请输入正整数"));
    }
    let value = e === "" ? 0 : e;
    const r = /^\d+(\.\d+)?/;
    if (!r.test(value)) {
      // return message.error(trans("detail.numMessage", "请输入数字"));
    }
    let newDateList = JSON.parse(JSON.stringify(this.state.dateList1));
    newDateList.length > 0 &&
      newDateList.map((item) => {
        if (item.questionId == index) {
          item.answerFormat = value;
        }
      });
    this.setState(
      {
        dateList1: newDateList,
      },
      () => {
        clearTimeout(aaa);
        this.autoSave();
      },
    );
  };

  deleteQuestion = (e, id) => {
    e.stopPropagation();
    let newDateList = JSON.parse(JSON.stringify(this.state.dateList));
    newDateList =
      newDateList.length > 0 &&
      newDateList.filter((item) => item.questionId != id);
    this.setState(
      {
        dateList: newDateList,
      },
      () => {
        clearTimeout(aaa);
        this.autoSave();
      },
    );
  };
  deleteQuestion1 = (e, id) => {
    e.stopPropagation();
    let newDateList = JSON.parse(JSON.stringify(this.state.dateList1));
    newDateList =
      newDateList.length > 0 &&
      newDateList.filter((item) => item.questionId != id);
    this.setState(
      {
        dateList1: newDateList,
      },
      () => {
        clearTimeout(aaa);
        this.autoSave();
      },
    );
  };

  swapArray = (array, index1, index2) => {
    array[index1] = array.splice(index2, 1, array[index1])[0];
    // this.setState({
    //   detaiList: arr,
    // });
    // let state = Object.assign({}, this.state);
    // state[`moveUpDown${index1}`] = false;
    this.setState({
      detaiList: array,
    });
  };

  clickMoveUp = (e, id) => {
    e.stopPropagation();
    let list = JSON.parse(JSON.stringify(this.state.dateList));
    let index = null;
    list.length > 0 &&
      list.map((item, ind) => {
        if (item.questionId == id) {
          index = ind;
        }
      });
    if (index == 0) {
      message.warning(
        trans("pupllPreview.alreadyAtTop", "已经处于置顶，无法上移"),
      );
    } else {
      // this.swapArray(list, index, index - 1);
      list[index] = list.splice(index - 1, 1, list[index])[0];
    }
    this.setState(
      {
        dateList: list,
      },
      () => {
        clearTimeout(aaa);
        this.autoSave();
      },
    );
  };
  clickMoveUp1 = (e, id) => {
    e.stopPropagation();
    let list = JSON.parse(JSON.stringify(this.state.dateList1));
    let index = null;
    list.length > 0 &&
      list.map((item, ind) => {
        if (item.questionId == id) {
          index = ind;
        }
      });
    if (index == 0) {
      message.warning(
        trans("pupllPreview.alreadyAtTop", "已经处于置顶，无法上移"),
      );
    } else {
      // this.swapArray(list, index, index - 1);
      list[index] = list.splice(index - 1, 1, list[index])[0];
    }
    this.setState(
      {
        dateList1: list,
      },
      () => {
        clearTimeout(aaa);
        this.autoSave();
      },
    );
  };

  clickMoveDown = (e, id) => {
    e.stopPropagation();
    let list = JSON.parse(JSON.stringify(this.state.dateList));
    let index = null;
    list.length > 0 &&
      list.map((item, ind) => {
        if (item.questionId == id) {
          index = ind;
        }
      });
    if (index + 1 == list.length) {
      message.warning(
        trans("pupllPreview.alreadyAtBottom", "已经处于置底，无法下移"),
      );
    } else {
      list[index] = list.splice(index + 1, 1, list[index])[0];
    }
    this.setState(
      {
        dateList: list,
      },
      () => {
        clearTimeout(aaa);
        this.autoSave();
      },
    );
  };
  clickMoveDown1 = (e, id) => {
    e.stopPropagation();
    let list = JSON.parse(JSON.stringify(this.state.dateList1));
    let index = null;
    list.length > 0 &&
      list.map((item, ind) => {
        if (item.questionId == id) {
          index = ind;
        }
      });
    if (index + 1 == list.length) {
      message.warning(
        trans("pupllPreview.alreadyAtBottom", "已经处于置底，无法下移"),
      );
    } else {
      list[index] = list.splice(index + 1, 1, list[index])[0];
    }
    this.setState(
      {
        dateList1: list,
      },
      () => {
        clearTimeout(aaa);
        this.autoSave();
      },
    );
  };
  onRef = (reference) => {
    this.child = reference;
  };
  dropQuestionChange = (index, sourceKey, targetKey) => {
    // let newIndex = parseInt(index, 10);
    // let source = parseInt(sourceKey, 10);
    // let target = parseInt(targetKey, 10);
    // console.log(source, target, "lll");
    // let fileList = JSON.parse(JSON.stringify(this.state.detaiList));
    // let newList = fileList[index].questionList;
    // sourceKey < targetKey && targetKey++;
    // // const a = newList.splice(source, 1);
    // // console.log(newList, 'aa')
    // newList.splice(target, 0, ...newList.splice(source, 1));
    // fileList[newIndex].questionList = newList;
    // this.setState({
    //   detaiList: fileList,
    // });
    // console.log(fileList, "kkk");
    // this.props.dispatch({
    //   type: "home/changeDrop",
    //   payload: fileList,
    // });
  };
  showAddTopic = (index) => {
    // let state = Object.assign({}, this.state);
    // state[`addTopic${index}`] = !state[`addTopic${index}`];
    // this.setState({
    //   ...state,
    // });
  };
  // showModal = () => {
  // };
  showModal1 = (e, index, id) => {
    e.stopPropagation();
    this.props.dispatch({
      type: "global/getStage",
    });
    this.props.dispatch({
      type: "global/getType",
    });
    // let state = Object.assign({}, this.state);
    this.setState(
      {
        // ...state,
        checkQuestionId: id,
        modalStatus: true,
        questionIndex: index,
      },
      () => {
        console.log(this.state.modalStatus, "zwl1234");
        this.getPage1();
      },
    );
  };
  checkQuestion = (id) => {
    this.setState({
      checkQuestionId: id,
    });
  };
  modalCancel = () => {
    this.props.dispatch({
      type: "home/clearQuestionList",
    });
    this.page = 1;
    this.setState({
      modalStatus: false,
      questionIndex: null,
    });
  };
  getPage = () => {
    let list = JSON.parse(JSON.stringify(this.state.dateList));
    let questionIds = [];
    if (list && list.length > 0) {
      list.map((item) => {
        // if (item.questionList && item.questionList.length) {
        // item.questionList.map((it) => {
        questionIds.push(item.questionId);
        // });
        // }
      });
    }
    // if (this.props.deleteList && this.props.deleteList.length) {
    //   this.props.deleteList.map((item) => {
    //     questionIds.push(item.questionId);
    //   });
    // }
    this.props
      .dispatch({
        type: "home/getQuestion",
        payload: {
          questionIds,
          content: this.state.searchValue,
          pageNo: this.page,
          limit: 10,
          type: 2,
          questionType:
            this.state.questionType === 0 ? "" : this.state.questionType,
          subjectId: this.props.data.subjectId || 0,
          yearPeriodId: this.state.stageId === 0 ? "" : this.state.stageId,
          gradeId: this.state.gradeId === 0 ? "" : this.state.gradeId,
        },
      })
      .then(() => {
        this.getCardStatus = true;
        this.page += 1;
      });
  };
  getPage1 = () => {
    let list = JSON.parse(JSON.stringify(this.state.dateList1));
    let questionIds = [];
    if (list && list.length > 0) {
      list.map((item) => {
        // if (item.questionList && item.questionList.length) {
        // item.questionList.map((it) => {
        questionIds.push(item.questionId);
        // });
        // }
      });
    }
    // if (this.props.deleteList && this.props.deleteList.length) {
    //   this.props.deleteList.map((item) => {
    //     questionIds.push(item.questionId);
    //   });
    // }
    this.props
      .dispatch({
        type: "home/getQuestion",
        payload: {
          questionIds,
          content: this.state.searchValue,
          pageNo: this.page,
          limit: 10,
          type: 2,
          questionType:
            this.state.questionType === 0 ? "" : this.state.questionType,
          subjectId: this.props.subjectId || 0,
          yearPeriodId: this.state.stageId === 0 ? "" : this.state.stageId,
          gradeId: this.state.gradeId === 0 ? "" : this.state.gradeId,
        },
      })
      .then(() => {
        this.getCardStatus = true;
        this.page += 1;
      });
  };

  changeStage = (value) => {
    this.setState(
      {
        stageId: value,
        gradeId: 0,
        courseId: 0,
        scrollTop: 0,
      },
      () => {
        this.props.dispatch({
          type: "global/getGrade",
          payload: {
            stageId: this.state.stageId,
          },
        });
        this.page = 1;
        this.getPage();
      },
    );
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
  changeType = (value) => {
    this.setState(
      {
        questionType: value,
        scrollTop: 0,
      },
      () => {
        this.page = 1;
        this.getPage();
      },
    );
  };
  searchValue = (value) => {
    this.setState(
      {
        searchValue: value,
      },
      () => {
        this.page = 1;
        this.getPage();
      },
    );
  };
  viewModalAnalysis = (id) => {
    const e = document.getElementById(`modalAnalysis${id}`);
    const button = document.getElementById(`viewbutton${id}`);
    if (e) {
      if (e.style.display === "block") {
        e.style.display = "none";
        button.style.backgroundColor = "#fff";
        button.style.color = "#666";
      } else {
        e.style.display = "block";
        button.style.backgroundColor = "rgba(59,111,245,0.12)";
        button.style.color = "#4D7FFF";
      }
    }
  };
  addTest = (item) => {
    let newList = JSON.parse(JSON.stringify(this.state.dateList1));
    let object = item;
    object.questionId = item.id;
    object.answerFormat = 3;
    newList.splice(this.state.questionIndex + 1, 0, object);
    // console.log(newList, "eee");
    this.setState(
      {
        dateList1: newList,
      },
      () => {
        clearTimeout(aaa);
        this.autoSave();
      },
    );
    // let ifHave = false;
    // let newObj = {};
    // if (newList && newList.length) {
    //   newList.map((it) => {
    //     if (it.moduleType === item.type) {
    //       ifHave = true;
    //       newObj.analysis = item.analysis;
    //       newObj.answer = item.answer;
    //       newObj.content = item.content;
    //       newObj.optionList = item.answersModelList;
    //       newObj.questionId = item.id;
    //       newObj.questionLevel = item.level;
    //       newObj.questionLevelName = null;
    //       newObj.questionScore = null;
    //       newObj.questionSerialNumber = null;
    //       newObj.studentAnswer = null;
    //       newObj.type = item.type;
    //       it.questionList.push(newObj);
    //     }
    //   });
    // }
    // if (!ifHave) {
    //   newObj.moduleName =
    //     item.type === 1
    //       ? "单选题"
    //       : item.type === 2
    //       ? "多选题"
    //       : item.type === 3
    //       ? "填空题"
    //       : item.type === 4
    //       ? "判断题"
    //       : item.type === 5
    //       ? "问答题"
    //       : "";
    //   newObj.moduleQuestionNumber = "1";
    //   newObj.moduleScore = null;
    //   newObj.moduleType = item.type;
    //   newObj.questionList = [
    //     {
    //       analysis: item.analysis,
    //       answer: item.answer,
    //       content: item.content,
    //       optionList: item.answersModelList,
    //       questionId: item.id,
    //       questionLevel: item.level,
    //       questionLevelName: null,
    //       questionScore: null,
    //       questionSerialNumber: null,
    //       studentAnswer: null,
    //       type: item.type,
    //     },
    //   ];
    //   newList.push(newObj);
    // }
    // this.setState({
    //   list: newList,
    // });
    // this.props.dispatch({
    //   type: "home/updateQuestion",
    //   payload: item.id,
    // });
    // this.props.updateList(newList);
  };
  changeParentVisible1 = (index) => {
    this.setState(
      {
        sendParent: true,
        active: index,
      },
      () => {
        this.props.dispatch({
          type: "global/getStudentList",
          payload: {
            examId: this.props.examId,
          },
        });
      },
    );
  };
  componentDidUpdate() {
    const imgList = document.querySelectorAll("img");
    for (const element of imgList) {
      let source = element.src;
      if (source.includes("&style=")) {
        source = source.split("&style=")[0];
      }
      element.addEventListener("click", this.showImg.bind(this, source));
    }
  }
  showImg = (source) => {
    this.setState({
      imgVisible: true,
      url: source,
    });
  };
  cancelImg = () => {
    this.setState({
      url: null,
      imgVisible: false,
    });
  };
  searchStuName = (e) => {
    // this.props.dispatch({});
    // const { chooseCourseId, dayClassesId } = this.state;
    // if (dayClassesId) {
    //   if (dayClassesId.length == 2) {
    //     this.props.dispatch({
    //       type: "publishToStudent/getGroupList",
    //       payload: {
    //         courseId: chooseCourseId,
    //         unitId: dayClassesId[0],
    //         activityId: dayClassesId[1],
    //         matchName: e,
    //       },
    //     });
    //   } else {
    //     this.props.dispatch({
    //       type: "publishToStudent/getCourseStudents",
    //       payload: {
    //         courseId: chooseCourseId,
    //         matchName: e,
    //       },
    //     });
    //   }
    // } else {
    this.props.dispatch({
      type: "global/getStudentList",
      payload: {
        examId: this.props.examId,
        keyWord: e,
      },
    });
    // }
  };
  handleCancel = () => {
    this.setState({
      sendParent: false,
    });
    this.props.dispatch({
      type: "global/clearStu",
    });
  };
  changeStuName = (e) => {
    this.setState({
      stuName: e.target.value,
    });
  };
  onRef1 = (reference) => {
    this.studentSelect = reference;
  };
  changeoneParentVisible = () => {
    this.setState({
      sendoneParent: !this.state.sendoneParent,
    });
  };
  sureSend = () => {
    this.props
      .dispatch({
        type: "home/sendParent",
        payload: {
          examId: this.props.examId,
        },
      })
      .then(() => {
        this.changeParentVisible();
      });
  };
  sureSendOne = () => {
    console.log(this.state.stuNameId, "11");
    this.props
      .dispatch({
        type: "home/sendParent",
        payload: {
          examId: this.props.examId,
          studentUserId: this.state.stuNameId,
        },
      })
      .then(() => {
        this.changeoneParentVisible();
      });
  };
  addTest1 = (e, index, item) => {
    // console.log(e, 112233);
    e.stopPropagation();
    let newList = JSON.parse(JSON.stringify(this.state.dateList));
    let object = item;
    // obj.questionId = item.id;
    object.answerFormat = 3;
    newList.splice(index + 1, 0, object);
    this.setState(
      {
        dateList: newList,
      },
      () => {
        clearTimeout(aaa);
        this.autoSave();
      },
    );
  };
  scrollChange = () => {
    const overflowDom = document.querySelector("#listBox1");
    const cardDomList = document.querySelectorAll(".listItem1");
    const mastTop = cardDomList.at(-2).offsetTop;
    const scrollTop = overflowDom.scrollTop;
    const innerHeight = window.innerHeight;
    this.setState({
      scrollTop: scrollTop,
    });
    if (scrollTop + innerHeight > mastTop && this.getCardStatus) {
      this.getCardStatus = false;
      if (scrollTop > this.state.scrollTop) {
        // this.props.getExamineList();
        this.getPage();
      }
    }
  };
  render() {
    const {
      trendStuList,
      studySituationByStudentIdList,
      classListData,
      data,
      stageList,
      gradeList,
      typeList,
      questionList,
      focusQuestionList,
      studentList,
    } = this.props;
    const {
      modalStatus,
      situationSumName,
      endingGoalTitle,
      teleslsWayTitle,
      wrongCourseTitle,
      errorAnalysisTitle,
      stuNameId,
      TitName,
      errorSetTitle,
      errorSetTitle1,
      situationSumTitle,
      stuName,
      groupId,
      isEdit1,
      isEdit,
      isTitName,
      isSituationSumName,
      isEndingGoalTitle,
      isSituationSumTitle,
      isTeleslsWayTitle,
      isKnowledgeLiteracy,
      dateList,
      dateList1,
      checkQuestionId,
      IconFont,
      hoverIndexID,
      active,
      isShowAnswer,
    } = this.state;
    console.log(dateList, "dada");
    let smallQuestionList = [];
    let bigQuestionList = [];
    studySituationByStudentIdList &&
      studySituationByStudentIdList.moduleModelList &&
      studySituationByStudentIdList.moduleModelList[2] &&
      studySituationByStudentIdList.moduleModelList[2].modelValue &&
      studySituationByStudentIdList.moduleModelList[2].modelValue
        .objectModelList &&
      studySituationByStudentIdList.moduleModelList[2].modelValue
        .objectModelList.length &&
      studySituationByStudentIdList.moduleModelList[2].modelValue.objectModelList.map(
        (item) => {
          if (
            item.type == 1 ||
            item.type == 2 ||
            item.type == 3 ||
            item.type == 4
          ) {
            smallQuestionList.push(item);
          } else if (item == 5) {
            bigQuestionList.push(item);
          }
        },
      );
    const newColums = [];
    studySituationByStudentIdList &&
      studySituationByStudentIdList.moduleModelList &&
      studySituationByStudentIdList.moduleModelList[2] &&
      studySituationByStudentIdList.moduleModelList[2].modelValue &&
      studySituationByStudentIdList.moduleModelList[2].modelValue
        .objectModelList &&
      studySituationByStudentIdList.moduleModelList[2].modelValue
        .objectModelList.length &&
      studySituationByStudentIdList.moduleModelList[2].modelValue.objectModelList.map(
        (item, index) => {
          if (item.objectType == "question") {
            newColums.push({
              title: item.objectTitle,
              key: item.objectType,
              dataIndex: item.objectType,
              width: "70%",
              render: (text, record, index) => {
                return (
                  <div>
                    <div
                      className={styles.questName}
                      style={{ display: "flex" }}
                    >
                      <span style={{ width: 24, display: "inline-block" }}>
                        {text.questionSerialNumber}.
                      </span>
                      <div
                        dangerouslySetInnerHTML={{ __html: text.content }}
                        style={{ flex: "1" }}
                      ></div>
                    </div>
                    {text.type == 6 &&
                    text.sonQuestionList &&
                    text.sonQuestionList.length > 0
                      ? text.sonQuestionList.map((ii, inde) => (
                          <div
                            className={styles.questName}
                            style={{ display: "flex" }}
                          >
                            <span>
                              {text.questionSerialNumber}.{inde + 1}
                            </span>
                            <div
                              dangerouslySetInnerHTML={{ __html: ii.content }}
                              style={{ flex: "1" }}
                            ></div>
                          </div>
                        ))
                      : null}
                    {text.type == 1 || text.type == 2 ? (
                      <>
                        <div
                          className={styles.questName}
                          style={{ paddingLeft: "25px" }}
                        >
                          {text.optionList &&
                            text.optionList.length &&
                            text.optionList.map((it) => (
                              <div
                                key={item}
                                dangerouslySetInnerHTML={{
                                  __html: `${it.answers}`,
                                }}
                                style={{
                                  marginRight: "10px",
                                }}
                              ></div>
                            ))}
                        </div>
                      </>
                    ) : text.type == 6 &&
                      text.sonQuestionList &&
                      text.sonQuestionList.length > 0 ? (
                      text.sonQuestionList.map((ii, inde) =>
                        ii.type == 1 || ii.type == 2 ? (
                          <>
                            <div
                              className={styles.questName}
                              style={{ paddingLeft: "25px" }}
                            >
                              <span>
                                {text.questionSerialNumber}.{inde + 1}
                              </span>
                              {ii.optionList &&
                                ii.optionList.length &&
                                ii.optionList.map((it) => (
                                  <div
                                    key={it}
                                    dangerouslySetInnerHTML={{
                                      __html: `${it.answers}`,
                                    }}
                                    style={{
                                      marginRight: "10px",
                                    }}
                                  ></div>
                                ))}
                            </div>
                          </>
                        ) : null,
                      )
                    ) : null}

                    {/* {this.state[`hoverIndex${text.questionId}`] ? (
                      <span className={styles.markExempt}>
                        {trans("global.markExempt", "标记为免做")}
                      </span>
                    ) : null} */}
                  </div>
                );
              },
            });
          } else if (item.objectType == "text") {
            newColums.push({
              title: item.objectTitle,
              key: item.objectType,
              dataIndex: item.objectType,
            });
          }
        },
      );
    const columns = newColums;
    studySituationByStudentIdList &&
      studySituationByStudentIdList.moduleModelList &&
      studySituationByStudentIdList.moduleModelList[2] &&
      studySituationByStudentIdList.moduleModelList[2].modelValue &&
      studySituationByStudentIdList.moduleModelList[2].modelValue
        .objectModelList &&
      studySituationByStudentIdList.moduleModelList[2].modelValue
        .objectModelList.length &&
      studySituationByStudentIdList.moduleModelList[2].modelValue
        .objectModelList[0].objectContentList &&
      studySituationByStudentIdList.moduleModelList[2].modelValue
        .objectModelList[0].objectContentList.length &&
      studySituationByStudentIdList.moduleModelList[2].modelValue.objectModelList[0].objectContentList.map(
        (item, index) => {
          if (
            item.type == 1 ||
            item.type == 2 ||
            item.type == 3 ||
            item.type == 4
          ) {
            smallQuestionList.push({
              key: item.questionId,
              question: item,
              text: "",
            });
          } else if (item.type == 5) {
            bigQuestionList.push({
              key: item.questionId,
              question: item,
              text: "",
            });
          }
          // newData.push({
          //   key: item.questionId,
          //   question: item,
          //   text: "",
          // });
        },
      );
    let result = [];
    for (var index = 0; index < smallQuestionList.length; index += 3) {
      result.push(smallQuestionList.slice(index, index + 3));
    }
    const parentContent = (
      <div className={styles.messageBox}>
        <div>
          {trans(
            "global.sureSendMessage",
            "确认发送后将通过钉钉消息给家长推送学生学情报告",
          )}
        </div>
        <div>
          <div style={{ margin: "10px 0" }}>
            {trans("global.sendStyle", "家长端钉钉消息通知样式")}
          </div>
          <img src={sendParent} style={{ width: "100%" }} />
        </div>
        <div className={styles.buttonBox}>
          <span
            onClick={this.changeParentVisible}
            className={[styles.parentButton].join(" ")}
          >
            {trans("global.cancle")}
          </span>
          <span
            onClick={this.sureSend}
            className={[styles.parentButton, styles.sure].join(" ")}
          >
            {trans("global.sureSend", "确认发送")}
          </span>
        </div>
      </div>
    );
    const parentoneContent = (
      <div className={styles.messageBox}>
        <div>
          {trans(
            "global.sureSendMessage",
            "确认发送后将通过钉钉消息给家长推送学生学情报告",
          )}
        </div>
        <div>
          <div style={{ margin: "10px 0" }}>
            {trans("global.sendStyle", "家长端钉钉消息通知样式")}
          </div>
          <img src={sendParent} style={{ width: "100%" }} />
        </div>
        <div className={styles.buttonBox}>
          <span
            onClick={this.changeoneParentVisible}
            className={[styles.parentButton].join(" ")}
          >
            {trans("global.cancle")}
          </span>
          <span
            onClick={this.sureSendOne}
            className={[styles.parentButton, styles.sure].join(" ")}
          >
            {trans("global.sureSend", "确认发送")}
          </span>
        </div>
      </div>
    );
    const newcolumns = [
      {
        title: this.wrongCourseName,
        dataIndex: "name",
        key: "name",
        width: "70%",
        render: (text, record, index) => {
          console.log(
            this.state.hiddenAllErrorCauseAnalysis,
            "this.state.hiddenAllErrorCauseAnalysis",
          );
          console.log(hoverIndexID, record.questionId, "222zwl");
          let numberRow = (record.answerFormat - 0) * 20;
          return {
            children: (
              <div
                // style={
                //   this.state[`hoverIndex${record.questionId}`]
                //     ? { border: "1px solid rgba(151,151,151,0.70)" }
                //     : null
                // }
                className={[
                  styles.rowBox,
                  this.state[`hoverIndex${record.questionId}`]
                    ? styles.blurBorder
                    : "",
                ].join(" ")}
                id={`question${record.questionId}`}
              >
                <div className={styles.questName} style={{ display: "flex" }}>
                  <span style={{ width: 24, display: "inline-block" }}>
                    {record.questionSerialNumber}.
                  </span>
                  <div
                    dangerouslySetInnerHTML={{ __html: record.content }}
                    style={{ flex: "1", color: "#01113D" }}
                  ></div>
                </div>
                {record.type == 6 &&
                record.sonQuestionList &&
                record.sonQuestionList.length > 0
                  ? record.sonQuestionList.map((ii, inde) => (
                      <div
                        className={styles.questName}
                        style={{ display: "flex", paddingLeft: "25px" }}
                      >
                        <span>
                          {record.questionSerialNumber}.{inde + 1}
                        </span>
                        <div
                          dangerouslySetInnerHTML={{ __html: ii.content }}
                          style={{ flex: "1" }}
                        ></div>
                      </div>
                    ))
                  : null}
                {record.type == 1 || record.type == 2 ? (
                  <>
                    <div
                      className={styles.questName}
                      style={{ paddingLeft: "25px" }}
                    >
                      {record.optionList &&
                        record.optionList.length &&
                        record.optionList.map((it) => (
                          <div
                            key={it}
                            dangerouslySetInnerHTML={{
                              __html: `${it.answers}`,
                            }}
                            style={{
                              marginRight: "10px",
                            }}
                          ></div>
                        ))}
                    </div>
                  </>
                ) : record.type == 6 &&
                  record.sonQuestionList &&
                  record.sonQuestionList.length > 0 ? (
                  record.sonQuestionList.map((ii, inde) =>
                    ii.type == 1 || ii.type == 2 ? (
                      <>
                        <div
                          className={styles.questName}
                          style={{ paddingLeft: "25px" }}
                        >
                          <span>
                            {record.questionSerialNumber}.{inde + 1}
                          </span>
                          {ii.optionList &&
                            ii.optionList.length &&
                            ii.optionList.map((it) => (
                              <div
                                key={it}
                                dangerouslySetInnerHTML={{
                                  __html: `${it.answers}`,
                                }}
                                style={{
                                  marginRight: "10px",
                                }}
                              ></div>
                            ))}
                        </div>
                      </>
                    ) : null,
                  )
                ) : null}
                {/* {this.state[`hoverIndex${record.questionId}`] ? (
                <span className={styles.markExempt}>
                  {trans("global.markExempt", "标记为免做")}
                </span>
              ) : null} */}

                {isShowAnswer ? (
                  <div className={styles.stuAnswer}>
                    {record.type == 6 &&
                    record.sonQuestionList &&
                    record.sonQuestionList.length > 0 ? (
                      record.sonQuestionList.map((ii, inde) =>
                        ii.studentAnswer || ii.studentAnswerUrl ? (
                          <div
                            className={styles.questName}
                            style={{ paddingLeft: "25px", display: "flex" }}
                          >
                            <span style={{ width: "80px" }}>
                              {record.questionSerialNumber}.{inde + 1}
                            </span>
                            {ii.studentAnswerUrl ? (
                              <img src={ii.studentAnswerUrl} />
                            ) : ii.studentAnswer ? (
                              <div>
                                <span>
                                  {trans("global.studentAnswers", "学生答案")}：
                                </span>
                                {ii.studentAnswer}
                              </div>
                            ) : null}
                          </div>
                        ) : null,
                      )
                    ) : record.studentAnswerUrl ? (
                      <img src={record.studentAnswerUrl} />
                    ) : record.studentAnswer ? (
                      <div>
                        <span>
                          {trans("global.studentAnswers", "学生答案")}：
                        </span>
                        {record.studentAnswer}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {this.state.hiddenAllErrorCauseAnalysis ? null : this.state
                    .hiddenErrorCauseAnalysis ? (
                  record.type == 1 ||
                  record.type == 2 ||
                  record.type == 3 ||
                  record.type == 4 ? null : (
                    <>
                      <div className={styles.errorAnalysisTitle}>
                        {this.state.errorAnalysisTitle}:
                      </div>
                    </>
                  )
                ) : (
                  <>
                    <div className={styles.errorAnalysisTitle}>
                      {this.state.errorAnalysisTitle}:
                    </div>
                  </>
                )}

                {this.state.hiddeneAnswerArea ? (
                  record.type == 1 ||
                  record.type == 2 ||
                  record.type == 3 ||
                  record.type == 4 ? null : (
                    <>
                      <div className={styles.errorAnalysisTitle}>
                        {trans("global.retry", "重新作答")}:
                      </div>
                      <div style={{ height: numberRow }}></div>
                    </>
                  )
                ) : (
                  <>
                    <div className={styles.errorAnalysisTitle}>
                      {trans("global.retry", "重新作答")}:
                    </div>
                    <div style={{ height: numberRow }}></div>
                  </>
                )}

                <div
                  className={`${styles.operateRow} ${this.state[`hoverIndex${record.questionId}`] ? styles.active : ""}`}
                >
                  <span
                    className={styles.addRow}
                    onClick={(e) => this.clickMoveUp(e, record.questionId)}
                  >
                    {trans("global.moveUp", "上移")}
                  </span>
                  <span
                    className={styles.addRow}
                    onClick={(e) => this.clickMoveDown(e, record.questionId)}
                  >
                    {trans("global.moveDown", "下移")}
                  </span>
                  <Dropdown
                    // visible={true}
                    overlayStyle={{ height: "200px", overflow: "scroll" }}
                    placement="topCenter"
                    overlay={() => (
                      <Menu>
                        {focusQuestionList.length > 0 &&
                          focusQuestionList.map((item) => (
                            <Menu.Item
                              key={item.content}
                              disabled={item.correct}
                            >
                              <div
                                onClick={(e) =>
                                  this.addTest1(e, index, item.content)
                                }
                              >
                                {item.questionName}
                              </div>
                            </Menu.Item>
                          ))}
                      </Menu>
                    )}
                  >
                    <span
                      className={styles.addRow}
                      // onClick={this.showModal.bind(
                      //   this,
                      //   index,
                      //   record.questionId
                      // )}
                    >
                      {trans("global.insertTestQuestions", "插入试题")}
                    </span>
                  </Dropdown>
                  <span className={styles.addRow}>
                    {trans("global.addResponseArea", "增加作答区")}
                    <span style={{ padding: "0 5px" }}>
                      <InputNumber
                        defaultValue={record.answerFormat}
                        onChange={this.scoreChange.bind(
                          this,
                          record.questionId,
                        )}
                        precision={0}
                        min={0}
                        autoFocus={true}
                        onPressEnter={this.scoreChange.bind(
                          this,
                          record.questionId,
                        )}
                        // size="small"
                      />
                    </span>
                    {trans("global.go", "行")}
                  </span>
                  <span
                    className={styles.addRow}
                    onClick={(e) => this.deleteQuestion(e, record.questionId)}
                  >
                    {trans("global.deleteTestQuestions", "删除试题")}
                  </span>
                </div>
              </div>
            ),
            props: {
              colSpan: hoverIndexID == record.questionId ? 2 : 1,
            },
          };
        },
      },
      // {
      //   title: errorAnalysisTitle,
      //   dataIndex: "age",
      //   key: "age",
      // },
    ];
    const newcolumns1 = [
      {
        // title: this.wrongCourseName,
        dataIndex: "name",
        key: "name",
        width: "70%",
        render: (text, record, index) => {
          // console.log(
          //   this.state[`hoverIndexc${record.questionId}`],
          //   index,
          //   "111zwl"
          // );
          let numberRow = (record.answerFormat - 0) * 20;
          return (
            <div
              className={[
                styles.rowBox,
                this.state[`hoverIndexc${record.questionId}`]
                  ? styles.blurBorder
                  : "",
              ].join(" ")}
            >
              <div className={styles.questName} style={{ display: "flex" }}>
                <span style={{ width: 24, display: "inline-block" }}>
                  {record.questionSerialNumber}.
                </span>
                <div
                  dangerouslySetInnerHTML={{ __html: record.content }}
                  style={{ flex: "1", color: "#01113D" }}
                ></div>
              </div>
              {record.type == 6 &&
              record.sonQuestionList &&
              record.sonQuestionList.length > 0
                ? record.sonQuestionList.map((ii, inde) => (
                    <div
                      className={styles.questName}
                      style={{ display: "flex" }}
                    >
                      <span>
                        {record.questionSerialNumber}.{inde + 1}
                      </span>
                      <div
                        dangerouslySetInnerHTML={{ __html: ii.content }}
                        style={{ flex: "1" }}
                      ></div>
                    </div>
                  ))
                : null}

              {record.type == 1 || record.type == 2 ? (
                <>
                  <div
                    className={styles.questName}
                    style={{ paddingLeft: "25px" }}
                  >
                    {record.optionList &&
                      record.optionList.length &&
                      record.optionList.map((it) => (
                        <div
                          key={it}
                          dangerouslySetInnerHTML={{
                            __html: `${it.answers}`,
                          }}
                          style={{
                            marginRight: "10px",
                          }}
                        ></div>
                      ))}
                  </div>
                </>
              ) : record.type == 6 &&
                record.sonQuestionList &&
                record.sonQuestionList.length > 0 ? (
                record.sonQuestionList.map((ii, inde) =>
                  ii.type == 1 || ii.type == 2 ? (
                    <>
                      <div
                        className={styles.questName}
                        style={{ paddingLeft: "25px" }}
                      >
                        <span>
                          {record.questionSerialNumber}.{inde + 1}
                        </span>
                        {ii.optionList &&
                          ii.optionList.length &&
                          ii.optionList.map((it) => (
                            <div
                              key={it}
                              dangerouslySetInnerHTML={{
                                __html: `${it.answers}`,
                              }}
                              style={{
                                marginRight: "10px",
                              }}
                            ></div>
                          ))}
                      </div>
                    </>
                  ) : null,
                )
              ) : null}

              {this.state.hiddeneAnswerArea ? (
                record.type == 1 ||
                record.type == 2 ||
                record.type == 3 ||
                record.type == 4 ? null : (
                  <>
                    <div style={{ height: numberRow }}></div>
                  </>
                )
              ) : (
                <>
                  <div style={{ height: numberRow }}></div>
                </>
              )}
              {this.state[`hoverIndexc${record.questionId}`] ? (
                <div className={styles.operateRow}>
                  <span
                    className={styles.addRow}
                    onClick={(e) => this.clickMoveUp1(e, record.questionId)}
                  >
                    {trans("global.moveUp", "上移")}
                  </span>
                  <span
                    className={styles.addRow}
                    onClick={(e) => this.clickMoveDown1(e, record.questionId)}
                  >
                    {trans("global.moveDown", "下移")}
                  </span>
                  <span
                    className={styles.addRow}
                    onClick={(e) =>
                      this.showModal1(e, index, record.questionId)
                    }
                  >
                    {trans("global.insertTestQuestions", "插入试题")}
                  </span>
                  <span className={styles.addRow}>
                    {trans("global.addResponseArea", "增加作答区")}
                    <span style={{ padding: "0 5px" }}>
                      <InputNumber
                        defaultValue={record.answerFormat}
                        onChange={this.scoreChange1.bind(
                          this,
                          record.questionId,
                        )}
                        precision={0}
                        min={0}
                        autoFocus={true}
                        onPressEnter={this.scoreChange1.bind(
                          this,
                          record.questionId,
                        )}
                        // size="small"
                      />
                    </span>
                    {trans("global.go", "行")}
                  </span>
                  <span
                    className={styles.addRow}
                    onClick={(e) => this.deleteQuestion1(e, record.questionId)}
                  >
                    {trans("global.deleteTestQuestions", "删除试题")}
                  </span>
                </div>
              ) : null}
            </div>
          );
        },
      },
      // {
      //   title: this.errorAnalysisName,
      //   dataIndex: "age",
      //   key: "age",
      // },
    ];
    console.log(stuNameId, TitName, studySituationByStudentIdList, "www");
    const numberPages = bigQuestionList.length + result.length + 1;
    return (
      <div className={styles.pupllAnalyseBox}>
        <div className={styles.stuList} style={{ width: "200px" }}>
          <span className={styles.selteReport}>
            {trans("global.selectStudentPreviewReport", "选择学生预览报告")}
          </span>
          <Search
            placeholder={trans("global.searchStu", "搜索学生")}
            allowClear
            value={stuName}
            onChange={this.changeSearch}
            onSearch={this.onSearch}
            style={{ width: 150, left: 25 }}
          />
          <Select
            onChange={this.changeClass}
            value={groupId}
            style={{ width: 150, left: 25, marginTop: 10 }}
          >
            <Option value={0} key={0}>
              <span>{trans("global.allClass", "全部班级")}</span>
            </Option>
            {classListData &&
              classListData.length &&
              classListData.map((item) => (
                <Option value={item.groupId} key={item.groupId}>
                  <span>{language ? item.groupName : item.groupEnName}</span>
                </Option>
              ))}
          </Select>
          <div style={{ height: "400px", marginTop: "10px" }}>
            {trendStuList && trendStuList.length > 0
              ? trendStuList.map((item) => (
                  <div
                    className={[
                      styles.userBox,
                      stuNameId === item.studentId ? styles.isChecked : "",
                    ].join(" ")}
                    onClick={() => this.changeStu(item.studentId)}
                  >
                    <div className={[styles.nameBox].join(" ")}>
                      <div>{item.studentName}</div>
                    </div>
                  </div>
                ))
              : null}
          </div>
        </div>
        <div className={styles.pupllAnalyseBoxLeftMod}>
          <div className={styles.onePage}>
            <div className={styles.stodyTitle}>
              {isEdit ? (
                <div className={styles.titltInput}>
                  <Input
                    placeholder={trans(
                      "global.studyName",
                      "请在此输入学情报告的标题（必填）",
                    )}
                    value={this.state.testName}
                    onChange={this.changeTestName}
                    onBlur={this.onBlurTitle}
                    onPressEnter={this.onBlurTitle}
                  />
                  <div className={styles.ccc}></div>
                </div>
              ) : (
                <div className={styles.titltName}>
                  {studySituationByStudentIdList.reportName}
                </div>
              )}

              {/* <div className={styles.stuHead}></div> */}
              <span className={styles.stuName}>
                <span style={{ marginRight: 10 }}>
                  {trans("global.group", "班级")}：
                  {studySituationByStudentIdList.groupName}
                </span>
                <span>
                  {trans("global.fullName", "姓名")}：
                  {studySituationByStudentIdList.studentName}
                </span>
              </span>
              <div className={styles.stuPhoto}>
                {studySituationByStudentIdList.studentName}
              </div>
            </div>
            {isEdit1 ? (
              <div
                className={styles.youSituationBox}
                style={{ marginBottom: 0 }}
              >
                <div className={styles.tableHeader1}>
                  {/* <span className={styles.tableHeaderSpan}></span> */}
                  {isEdit1 ? (
                    <>
                      {isTitName ? (
                        <Input
                          value={TitName}
                          className={styles.headerTitle1}
                          id="headerInput"
                          onChange={(e) =>
                            this.setState({ TitName: e.target.value })
                          }
                          onBlur={(e) => this.blurTitName(e)}
                        />
                      ) : (
                        <span className={styles.tableHeaderTitle}>
                          <span className={styles.tableHeaderTitle}>
                            {TitName}
                            <i
                              className={[
                                styles.iconfont,
                                styles.editTitle,
                              ].join(" ")}
                              style={{ cursor: "pointer", marginLeft: "5px" }}
                              onClick={() => this.clickTitName()}
                            >
                              &#xe7a1;
                            </i>
                          </span>
                        </span>
                      )}
                    </>
                  ) : studySituationByStudentIdList.moduleModelList &&
                    studySituationByStudentIdList.moduleModelList[0]
                      .modelShow ? (
                    <span className={styles.tableHeaderTitle}>{TitName}</span>
                  ) : null}
                </div>
                {/* {this.state.isShowChart ? ( */}
                <div
                  className={styles.youChart1}
                  style={this.state.isShowChart ? {} : { display: "none" }}
                >
                  {this.props.studySituationByStudentIdList &&
                  this.props.studySituationByStudentIdList.moduleModelList &&
                  this.props.studySituationByStudentIdList.moduleModelList
                    .length > 0 &&
                  this.props.studySituationByStudentIdList.moduleModelList[0] &&
                  this.props.studySituationByStudentIdList.moduleModelList[0]
                    .modelValue &&
                  this.props.studySituationByStudentIdList.moduleModelList[0]
                    .modelValue.qualityIndicatorResponseList &&
                  this.props.studySituationByStudentIdList?.moduleModelList[0]
                    .modelValue?.qualityIndicatorResponseList.length > 0 ? (
                    <div
                      className={styles.personalChartBox}
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        flexWrap: "wrap",
                      }}
                    >
                      {this.props.studySituationByStudentIdList &&
                        this.props.studySituationByStudentIdList
                          .moduleModelList &&
                        this.props.studySituationByStudentIdList.moduleModelList
                          .length &&
                        this.props.studySituationByStudentIdList
                          .moduleModelList[0] &&
                        this.props.studySituationByStudentIdList
                          .moduleModelList[0].modelValue &&
                        this.props.studySituationByStudentIdList
                          .moduleModelList[0].modelValue
                          .qualityIndicatorResponseList &&
                        this.props.studySituationByStudentIdList
                          .moduleModelList[0].modelValue
                          .qualityIndicatorResponseList.length &&
                        this.props.studySituationByStudentIdList.moduleModelList[0].modelValue.qualityIndicatorResponseList.map(
                          (item, index) => (
                            <div
                              style={{
                                position: "relative",
                                width: "33%",
                              }}
                              id={`trendBox${index}`}
                            >
                              <div
                                style={{
                                  position: "absolute",
                                  top: "-10px",
                                  width: "100%",
                                  textAlign: "center",
                                }}
                              >
                                {item.title}
                              </div>
                              <div id={`trendNode${index}`}></div>
                            </div>
                          ),
                        )}
                    </div>
                  ) : (
                    <div className={styles.suyang}>
                      <p>
                        {trans(
                          "global.dimensionIntroduction",
                          "你可定义自己想要分析的维度，比如素养能力、知识点或所属章节，上传后，系统会自动生成学生和班级维度的分析报表，使用时，请先下载模板表格，依次标注好每道小题的分析维度。",
                        )}
                      </p>
                      <Button
                        type="primary"
                        style={{ marginTop: "30px" }}
                        className={styles.grades}
                        onClick={() => this.clickKnowledgeLiteracy(1)}
                      >
                        {trans(
                          "global.importAnalysisDimension",
                          "导入分析维度",
                        )}
                      </Button>
                    </div>
                  )}
                </div>
                {/* ) : null} */}
              </div>
            ) : studySituationByStudentIdList.moduleModelList &&
              studySituationByStudentIdList.moduleModelList[0].modelShow ? (
              <div
                className={styles.youSituationBox}
                style={{ marginBottom: 0 }}
              >
                <div className={styles.tableHeader1}>
                  {/* <span className={styles.tableHeaderSpan}></span> */}
                  {isEdit1 ? (
                    <>
                      {isTitName ? (
                        <Input
                          value={TitName}
                          className={styles.headerTitle1}
                          id="headerInput"
                          onChange={(e) =>
                            this.setState({ TitName: e.target.value })
                          }
                          onBlur={(e) => this.blurTitName(e)}
                        />
                      ) : (
                        <span className={styles.tableHeaderTitle}>
                          <span className={styles.tableHeaderTitle}>
                            {TitName}
                            <i
                              className={[
                                styles.iconfont,
                                styles.editTitle,
                              ].join(" ")}
                              style={{ cursor: "pointer", marginLeft: "5px" }}
                              onClick={() => this.clickTitName()}
                            >
                              &#xe7a1;
                            </i>
                          </span>
                        </span>
                      )}
                    </>
                  ) : studySituationByStudentIdList.moduleModelList &&
                    studySituationByStudentIdList.moduleModelList[0]
                      .modelShow ? (
                    <span className={styles.tableHeaderTitle}>{TitName}</span>
                  ) : null}
                </div>
                {/* {this.state.isShowChart ? ( */}
                <div
                  className={styles.youChart1}
                  style={this.state.isShowChart ? {} : { display: "none" }}
                >
                  {this.props.studySituationByStudentIdList &&
                  this.props.studySituationByStudentIdList.moduleModelList &&
                  this.props.studySituationByStudentIdList.moduleModelList
                    .length > 0 &&
                  this.props.studySituationByStudentIdList.moduleModelList[0] &&
                  this.props.studySituationByStudentIdList.moduleModelList[0]
                    .modelValue &&
                  this.props.studySituationByStudentIdList.moduleModelList[0]
                    .modelValue.qualityIndicatorResponseList &&
                  this.props.studySituationByStudentIdList?.moduleModelList[0]
                    .modelValue?.qualityIndicatorResponseList.length > 0 ? (
                    <div
                      className={styles.personalChartBox}
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        flexWrap: "wrap",
                      }}
                    >
                      {this.props.studySituationByStudentIdList &&
                        this.props.studySituationByStudentIdList
                          .moduleModelList &&
                        this.props.studySituationByStudentIdList.moduleModelList
                          .length &&
                        this.props.studySituationByStudentIdList
                          .moduleModelList[0] &&
                        this.props.studySituationByStudentIdList
                          .moduleModelList[0].modelValue &&
                        this.props.studySituationByStudentIdList
                          .moduleModelList[0].modelValue
                          .qualityIndicatorResponseList &&
                        this.props.studySituationByStudentIdList
                          .moduleModelList[0].modelValue
                          .qualityIndicatorResponseList.length &&
                        this.props.studySituationByStudentIdList.moduleModelList[0].modelValue.qualityIndicatorResponseList.map(
                          (item, index) => (
                            <div
                              style={{
                                position: "relative",
                                width: "33%",
                              }}
                              id={`trendBox${index}`}
                            >
                              <div
                                style={{
                                  position: "absolute",
                                  top: "-10px",
                                  width: "100%",
                                  textAlign: "center",
                                }}
                              >
                                {item.title}
                              </div>
                              <div id={`trendNode${index}`}></div>
                            </div>
                          ),
                        )}
                    </div>
                  ) : (
                    <div className={styles.suyang}>
                      <p>
                        {trans(
                          "global.dimensionIntroduction",
                          "你可定义自己想要分析的维度，比如素养能力、知识点或所属章节，上传后，系统会自动生成学生和班级维度的分析报表，使用时，请先下载模板表格，依次标注好每道小题的分析维度。",
                        )}
                      </p>
                      <Button
                        type="primary"
                        style={{ marginTop: "30px" }}
                        className={styles.grades}
                        onClick={() => this.clickKnowledgeLiteracy(1)}
                      >
                        {trans(
                          "global.importAnalysisDimension",
                          "导入分析维度",
                        )}
                      </Button>
                    </div>
                  )}
                </div>
                {/* ) : null} */}
              </div>
            ) : null}
            {isEdit1 ? (
              <div className={styles.youSituationBox}>
                <div className={styles.tableHeader}>
                  {/* <span className={styles.tableHeaderSpan}></span> */}
                  {isEdit1 ? (
                    <>
                      {isSituationSumTitle ? (
                        <Input
                          value={situationSumTitle}
                          className={styles.headerTitle1}
                          id="situationSumTitleId"
                          onChange={(e) =>
                            this.setState({ situationSumTitle: e.target.value })
                          }
                          onBlur={(e) => this.blurSituationSumTitle(e)}
                        />
                      ) : (
                        <span className={styles.tableHeaderTitle}>
                          <span className={styles.tableHeaderTitle}>
                            {situationSumTitle}
                            <i
                              className={[
                                styles.iconfont,
                                styles.editTitle,
                              ].join(" ")}
                              style={{ cursor: "pointer", marginLeft: "5px" }}
                              onClick={() => this.clickSituationSumTitle()}
                            >
                              &#xe7a1;
                            </i>
                          </span>
                        </span>
                      )}
                    </>
                  ) : (
                    <span className={styles.tableHeaderTitle}>
                      {situationSumTitle}
                    </span>
                  )}
                </div>
                {this.state.isShowSumUp ? (
                  <div
                    className={[styles.youChart, styles.studyTabBox].join(" ")}
                  >
                    <div className={styles.studyTab}>
                      <div className={styles.situationSumTitleTab}>
                        <div className={styles.situationSumTitleTitle}>
                          {isEdit1 ? (
                            <>
                              {isSituationSumName ? (
                                <Input
                                  value={situationSumName}
                                  className={styles.tabTitle}
                                  id="situationSumNameId"
                                  onChange={(e) =>
                                    this.setState({
                                      situationSumName: e.target.value,
                                    })
                                  }
                                  onBlur={(e) => this.blurSituationSumName(e)}
                                />
                              ) : (
                                <span className={styles.tableHeaderTitle}>
                                  <span className={styles.tableHeaderTitle}>
                                    {situationSumName}
                                    <i
                                      className={[
                                        styles.iconfont,
                                        styles.editTitle,
                                      ].join(" ")}
                                      style={{
                                        cursor: "pointer",
                                        marginLeft: "3px",
                                      }}
                                      onClick={() =>
                                        this.clickSituationSumName()
                                      }
                                    >
                                      &#xe7a1;
                                    </i>
                                  </span>
                                </span>
                              )}
                            </>
                          ) : (
                            <span className={styles.tableHeaderTitle}>
                              {situationSumName}
                            </span>
                          )}
                        </div>
                        <div className={styles.situationSumTitleBox}></div>
                      </div>
                      <div
                        className={[
                          styles.situationSumTitleTab,
                          styles.centerTab,
                        ].join(" ")}
                      >
                        <div className={styles.situationSumTitleTitle}>
                          {isEdit1 ? (
                            <>
                              {isEndingGoalTitle ? (
                                <Input
                                  value={endingGoalTitle}
                                  className={styles.tabTitle}
                                  id="endingGoalTitleId"
                                  onChange={(e) =>
                                    this.setState({
                                      endingGoalTitle: e.target.value,
                                    })
                                  }
                                  onBlur={(e) => this.blurEndingGoalTitle(e)}
                                />
                              ) : (
                                <span className={styles.tableHeaderTitle}>
                                  <span className={styles.tableHeaderTitle}>
                                    {endingGoalTitle}
                                    <i
                                      className={[
                                        styles.iconfont,
                                        styles.editTitle,
                                      ].join(" ")}
                                      style={{ cursor: "pointer" }}
                                      onClick={() =>
                                        this.clickEndingGoalTitle()
                                      }
                                    >
                                      &#xe7a1;
                                    </i>
                                  </span>
                                </span>
                              )}
                            </>
                          ) : (
                            <span className={styles.tableHeaderTitle}>
                              {endingGoalTitle}
                            </span>
                          )}
                        </div>
                        <div className={styles.situationSumTitleBox}></div>
                      </div>
                      <div className={styles.situationSumTitleTab}>
                        <div className={styles.situationSumTitleTitle}>
                          {isEdit1 ? (
                            <>
                              {isTeleslsWayTitle ? (
                                <Input
                                  value={teleslsWayTitle}
                                  className={styles.tabTitle}
                                  id="teleslsWayTitleId"
                                  onChange={(e) =>
                                    this.setState({
                                      teleslsWayTitle: e.target.value,
                                    })
                                  }
                                  onBlur={(e) => this.blurTeleslsWayTitle(e)}
                                />
                              ) : (
                                <span className={styles.tableHeaderTitle}>
                                  <span className={styles.tableHeaderTitle}>
                                    {teleslsWayTitle}
                                    <i
                                      className={[
                                        styles.iconfont,
                                        styles.editTitle,
                                      ].join(" ")}
                                      style={{ cursor: "pointer" }}
                                      onClick={() =>
                                        this.clickTeleslsWayTitle()
                                      }
                                    >
                                      &#xe7a1;
                                    </i>
                                  </span>
                                </span>
                              )}
                            </>
                          ) : (
                            <span className={styles.tableHeaderTitle}>
                              {teleslsWayTitle}
                            </span>
                          )}
                        </div>
                        <div className={styles.situationSumTitleBox}></div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : studySituationByStudentIdList.moduleModelList &&
              studySituationByStudentIdList.moduleModelList[1] &&
              studySituationByStudentIdList.moduleModelList[1].modelShow ? (
              <div className={styles.youSituationBox}>
                <div className={styles.tableHeader}>
                  {/* <span className={styles.tableHeaderSpan}></span> */}
                  {isEdit1 ? (
                    <>
                      {isSituationSumTitle ? (
                        <Input
                          value={situationSumTitle}
                          className={styles.headerTitle1}
                          id="situationSumTitleId"
                          onChange={(e) =>
                            this.setState({ situationSumTitle: e.target.value })
                          }
                          onBlur={(e) => this.blurSituationSumTitle(e)}
                        />
                      ) : (
                        <span className={styles.tableHeaderTitle}>
                          <span className={styles.tableHeaderTitle}>
                            {situationSumTitle}
                            <i
                              className={[
                                styles.iconfont,
                                styles.editTitle,
                              ].join(" ")}
                              style={{ cursor: "pointer", marginLeft: "5px" }}
                              onClick={() => this.clickSituationSumTitle()}
                            >
                              &#xe7a1;
                            </i>
                          </span>
                        </span>
                      )}
                    </>
                  ) : (
                    <span className={styles.tableHeaderTitle}>
                      {situationSumTitle}
                    </span>
                  )}
                </div>
                {this.state.isShowSumUp ? (
                  <div
                    className={[styles.youChart, styles.studyTabBox].join(" ")}
                  >
                    <div className={styles.studyTab}>
                      <div className={styles.situationSumTitleTab}>
                        <div className={styles.situationSumTitleTitle}>
                          {isEdit1 ? (
                            <>
                              {isSituationSumName ? (
                                <Input
                                  value={situationSumName}
                                  className={styles.tabTitle}
                                  id="situationSumNameId"
                                  onChange={(e) =>
                                    this.setState({
                                      situationSumName: e.target.value,
                                    })
                                  }
                                  onBlur={(e) => this.blurSituationSumName(e)}
                                />
                              ) : (
                                <span className={styles.tableHeaderTitle}>
                                  <span className={styles.tableHeaderTitle}>
                                    {situationSumName}
                                    <i
                                      className={[
                                        styles.iconfont,
                                        styles.editTitle,
                                      ].join(" ")}
                                      style={{
                                        cursor: "pointer",
                                        marginLeft: "3px",
                                      }}
                                      onClick={() =>
                                        this.clickSituationSumName()
                                      }
                                    >
                                      &#xe7a1;
                                    </i>
                                  </span>
                                </span>
                              )}
                            </>
                          ) : (
                            <span className={styles.tableHeaderTitle}>
                              {situationSumName}
                            </span>
                          )}
                        </div>
                        <div className={styles.situationSumTitleBox}></div>
                      </div>
                      <div
                        className={[
                          styles.situationSumTitleTab,
                          styles.centerTab,
                        ].join(" ")}
                      >
                        <div className={styles.situationSumTitleTitle}>
                          {isEdit1 ? (
                            <>
                              {isEndingGoalTitle ? (
                                <Input
                                  value={endingGoalTitle}
                                  className={styles.tabTitle}
                                  id="endingGoalTitleId"
                                  onChange={(e) =>
                                    this.setState({
                                      endingGoalTitle: e.target.value,
                                    })
                                  }
                                  onBlur={(e) => this.blurEndingGoalTitle(e)}
                                />
                              ) : (
                                <span className={styles.tableHeaderTitle}>
                                  <span className={styles.tableHeaderTitle}>
                                    {endingGoalTitle}
                                    <i
                                      className={[
                                        styles.iconfont,
                                        styles.editTitle,
                                      ].join(" ")}
                                      style={{ cursor: "pointer" }}
                                      onClick={() =>
                                        this.clickEndingGoalTitle()
                                      }
                                    >
                                      &#xe7a1;
                                    </i>
                                  </span>
                                </span>
                              )}
                            </>
                          ) : (
                            <span className={styles.tableHeaderTitle}>
                              {endingGoalTitle}
                            </span>
                          )}
                        </div>
                        <div className={styles.situationSumTitleBox}></div>
                      </div>
                      <div className={styles.situationSumTitleTab}>
                        <div className={styles.situationSumTitleTitle}>
                          {isEdit1 ? (
                            <>
                              {isTeleslsWayTitle ? (
                                <Input
                                  value={teleslsWayTitle}
                                  className={styles.tabTitle}
                                  id="teleslsWayTitleId"
                                  onChange={(e) =>
                                    this.setState({
                                      teleslsWayTitle: e.target.value,
                                    })
                                  }
                                  onBlur={(e) => this.blurTeleslsWayTitle(e)}
                                />
                              ) : (
                                <span className={styles.tableHeaderTitle}>
                                  <span className={styles.tableHeaderTitle}>
                                    {teleslsWayTitle}
                                    <i
                                      className={[
                                        styles.iconfont,
                                        styles.editTitle,
                                      ].join(" ")}
                                      style={{ cursor: "pointer" }}
                                      onClick={() =>
                                        this.clickTeleslsWayTitle()
                                      }
                                    >
                                      &#xe7a1;
                                    </i>
                                  </span>
                                </span>
                              )}
                            </>
                          ) : (
                            <span className={styles.tableHeaderTitle}>
                              {teleslsWayTitle}
                            </span>
                          )}
                        </div>
                        <div className={styles.situationSumTitleBox}></div>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* <span className={styles.numPage1}>
                1/{numPages}
                {trans("global.numPage", " 页")}
              </span> */}
              </div>
            ) : null}
          </div>
          {/* 错题集合 */}
          {studySituationByStudentIdList.moduleModelList &&
          studySituationByStudentIdList.moduleModelList[2] &&
          studySituationByStudentIdList.moduleModelList[2].modelShow ? (
            <div
              className={[
                styles.youSituationBox,
                styles.youSituationBoxPage,
              ].join(" ")}
            >
              <div
                className={styles.tableHeader}
                style={{ borderRadius: "15px 15px 0 0" }}
              >
                {/* <span className={styles.tableHeaderSpan}></span> */}
                <span className={styles.tableHeaderTitle}>{errorSetTitle}</span>
                {/* <span className={styles.TAexemption}>
                    {trans("global.TAexemption", "TA的免做题")}
                  </span> */}
              </div>
              {this.state.isShowWrong ? (
                <div
                  className={[styles.wrongTpicBox, styles.youChart].join(" ")}
                >
                  <div className={styles.studyTabTopic}>
                    <Table
                      columns={newcolumns}
                      dataSource={dateList}
                      bordered={true}
                      align={"center"}
                      pagination={false}
                      onRow={this.onRow}
                    />
                  </div>
                </div>
              ) : null}

              {/* <span className={styles.numPage1}>
              {3} /{numPages}
              {trans("global.numPage", " 页")}
            </span> */}
            </div>
          ) : null}
          {/* 个性化 */}
          {studySituationByStudentIdList.moduleModelList &&
          studySituationByStudentIdList.moduleModelList[3] &&
          studySituationByStudentIdList.moduleModelList[3].modelShow ? (
            <div
              className={[
                styles.youSituationBox,
                styles.youSituationBoxPage,
              ].join(" ")}
            >
              <div
                className={styles.tableHeader}
                style={{ borderRadius: "15px 15px 0 0" }}
              >
                {/* <span className={styles.tableHeaderSpan}></span> */}
                <span className={styles.tableHeaderTitle}>
                  {errorSetTitle1}
                </span>
              </div>
              {this.state.isShowWrong1 ? (
                <div
                  className={[styles.wrongTpicBox, styles.youChart].join(" ")}
                >
                  <div className={styles.studyTabTopic1}>
                    <Table
                      columns={newcolumns1}
                      dataSource={dateList1}
                      bordered={true}
                      align={"center"}
                      pagination={false}
                      onRow={this.onRow1}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
        {isEdit ? (
          <span className={styles.pupllAnalyseBoxRight}>
            <span className={styles.batchDownload} onClick={this.saveData}>
              {trans("global.save", "保存")}
            </span>
            <span
              className={styles.previewStudentReport}
              onClick={() => this.setState({ isEdit: false })}
              id="previewStudentReport"
            >
              {trans("global.cancle", "取消")}
            </span>
          </span>
        ) : (
          <span className={styles.pupllAnalyseBoxRight}>
            <span
              className={styles.editTemplate}
              onClick={
                () =>
                  // this.setState({ isEdit: true }, () => {
                  this.props.editMode()
                // })
              }
            >
              {trans("global.editTemplate", "设置模板")}
            </span>
            <span
              className={styles.previewStudentReport}
              onClick={this.downloadTest}
              id="previewStudentReport"
            >
              {trans("global.downloadCurrentReport", "下载此报告")}
            </span>
            <span
              className={styles.previewStudentReport}
              onClick={() => this.changeParentVisible1(1)}
              style={{ marginTop: 10 }}
            >
              {trans("global.batchDownload", "批量下载")}
            </span>
            <span
              className={styles.editTemplate}
              onClick={() => this.changeParentVisible1(2)}
              style={{ marginBottom: 0, marginTop: 10 }}
            >
              {trans("global.batchSendToStu", "批量发送给学生")}
            </span>
            <span
              className={styles.editTemplate}
              onClick={() => this.changeParentVisible1(3)}
              style={{ marginBottom: 0, marginTop: 10 }}
            >
              {trans("global.batchSendToParent", "批量发送给家长")}
            </span>
          </span>
        )}
        <Modal
          title={""}
          footer={null}
          getContainer={false}
          centered={true}
          visible={modalStatus}
          closable={false}
          destroyOnClose={true}
          onCancel={this.modalCancel}
          wrapClassName={styles.questList}
        >
          <div className={styles.questionListBox}>
            <div className={styles.titleheader}>
              <i className={styles.iconfont} onClick={this.modalCancel}>
                &#xe6a9;
              </i>
              <div className={styles.content}>
                {trans("global.addFromMyQuestion", "从我的题库添加…")}
              </div>
            </div>
            <div className={styles.searchBar}>
              <span className={styles.inline}>
                <span className={styles.searchTitle}>
                  {trans("global.stage", "学段")}
                </span>
                <Select
                  onChange={this.changeStage}
                  value={this.state.stageId}
                  placeholder={trans("global.pleaseChoose", "请选择")}
                >
                  <Option value={0} key={0}>
                    {trans("global.allStage", "全部学段")}
                  </Option>
                  {stageList && stageList.length > 0
                    ? stageList.map((item) => (
                        <Option value={item.id} key={item.id}>
                          {item.name}
                        </Option>
                      ))
                    : null}
                </Select>
              </span>
              <span className={styles.inline}>
                <span className={styles.searchTitle}>
                  {trans("global.grade", "年级")}
                </span>
                <Select
                  onChange={this.changeGrade}
                  value={this.state.gradeId}
                  placeholder={trans("global.pleaseChoose", "请选择")}
                >
                  <Option value={0} key={0}>
                    {trans("global.allGrade", "全部年级")}
                  </Option>
                  {gradeList && gradeList.length > 0
                    ? gradeList.map((item) => (
                        <Option value={item.gradeId} key={item.gradeId}>
                          {item.name}
                        </Option>
                      ))
                    : null}
                </Select>
              </span>
              <span className={styles.inline}>
                <span className={styles.searchTitle}>
                  {trans("global.subject", "学科")}
                </span>
                <Select
                  value={data.subjectId}
                  disabled={true}
                  style={{ width: 120 }}
                  onChange={this.changeCourse}
                  placeholder={trans("global.pleaseChoose", "请选择")}
                >
                  <Option value={0} key={0}>
                    {trans("global.allSubject", "全部学科")}
                  </Option>
                  <Option value={data.subjectId} key={data.subjectId}>
                    {data.subjectName}
                  </Option>
                </Select>
              </span>
              <span className={styles.inline}>
                <span className={styles.searchTitle}>
                  {trans("global.questionType", "题型")}
                </span>
                <Select
                  onChange={this.changeType}
                  value={this.state.questionType}
                  placeholder={trans("global.pleaseChoose", "请选择")}
                >
                  <Option value={0} key={0}>
                    {trans("global.allType", "全部类型")}
                  </Option>
                  {typeList && typeList.length > 0
                    ? typeList.map((item) => (
                        <Option value={item.code} key={item.code}>
                          {item.typeName}
                        </Option>
                      ))
                    : null}
                </Select>
              </span>
              <span className={styles.inline}>
                <Search
                  placeholder={trans(
                    "global.inputKeyToSearch",
                    "输入关键词搜索题目",
                  )}
                  onChange={this.changeValue}
                  onSearch={this.searchValue}
                />
              </span>
            </div>
            <div
              className={styles.questionMapList}
              id="listBox1"
              onScroll={this.scrollChange}
            >
              {questionList && questionList.length > 0 ? (
                questionList.map((item, index) => (
                  <div
                    className={[styles.questionList, "listItem1"].join(" ")}
                    key={index}
                  >
                    <div className={styles.header}>
                      {item.type === 1 ? (
                        <span className={styles.questionType}>
                          <i className={styles.iconfont}>&#xe761;</i>
                          {trans("global.radio", "单选题")}
                        </span>
                      ) : item.type === 2 ? (
                        <span className={styles.questionType}>
                          <i className={styles.iconfont}>&#xe761;</i>
                          {trans("global.check", "多选题")}
                        </span>
                      ) : item.type === 3 ? (
                        <span className={styles.questionType}>
                          <i className={styles.iconfont}>&#xe761;</i>
                          {trans("global.pack", "填空题")}
                        </span>
                      ) : item.type === 4 ? (
                        <span className={styles.questionType}>
                          <i className={styles.iconfont}>&#xe761;</i>
                          {trans("global.judge", "判断题")}
                        </span>
                      ) : item.type === 5 ? (
                        <span className={styles.questionType}>
                          <i className={styles.iconfont}>&#xe761;</i>
                          {trans("global.ask", "问答题")}
                        </span>
                      ) : null}
                      <div
                        className={[styles.inline, styles.level].join(" ")}
                        style={
                          item.level === 1
                            ? {
                                backgroundColor: "rgba(103,178,81,0.04)",
                                color: "#67b251",
                              }
                            : item.level === 2
                              ? {
                                  backgroundColor: "rgba(233,182,53,0.04)",
                                  color: "#E9B635",
                                }
                              : {
                                  backgroundColor: "rgba(221,107,71,0.04)",
                                  color: "#DD6B47",
                                }
                        }
                      >
                        <i className={styles.iconfont}>&#xe764;</i>
                        {questionLevel[item.level]}
                      </div>
                    </div>
                    <div
                      className={styles.modulecontent}
                      dangerouslySetInnerHTML={{ __html: item.content }}
                    ></div>
                    <div className={styles.optionBox}>
                      {item.answersModelList && item.answersModelList.length > 0
                        ? item.answersModelList.map((it, newIn) =>
                            item.type === 1 || item.type === 2 ? (
                              <div
                                className={[
                                  styles.optionList,
                                  item.answer && item.answer.includes(it.key)
                                    ? styles.trueValue
                                    : "",
                                ].join(" ")}
                                key={newIn}
                              >
                                <div className={styles.opListLeft}>
                                  <i
                                    className={[
                                      styles.iconfont,
                                      styles.optionIcon,
                                    ].join(" ")}
                                  >
                                    &#xe6a8;
                                  </i>
                                </div>
                                <div
                                  className={styles.opListRight}
                                  dangerouslySetInnerHTML={{
                                    __html: it.answers,
                                  }}
                                ></div>
                              </div>
                            ) : item.type === 3 ? (
                              <div
                                className={styles.opListRight}
                                dangerouslySetInnerHTML={{ __html: it }}
                              ></div>
                            ) : null,
                          )
                        : null}
                    </div>

                    <div className={styles.questionTitle}>
                      <i className={styles.iconfont}>&#xe798;</i>
                      {item.gradeName}-{item.subjectName}
                    </div>
                    <div className={styles.moduleBottom}>
                      <div
                        className={[styles.inline, styles.cursor].join(" ")}
                        id={`viewbutton${item.id}`}
                        onClick={this.viewModalAnalysis.bind(this, item.id)}
                      >
                        <i className={styles.iconfont}>&#xe631;</i>
                        {trans("detail.analysis", "解析")}
                      </div>
                      <div
                        className={styles.rightButton}
                        onClick={this.addTest.bind(this, item)}
                      >
                        {trans("global.addTest", "加入测验")}
                        <div
                          className={[styles.iconfont, "transLateIcon"].join(
                            " ",
                          )}
                          style={{ display: "none", zIndex: "999" }}
                        >
                          &#xe73c;
                        </div>
                      </div>
                    </div>
                    <div
                      id={`modalAnalysis${item.id}`}
                      className={styles.analysisBox}
                    >
                      <div className={styles.rightTitle}>
                        {trans("global.rightAnswer", "正确答案")}
                        <span>{item.answer}</span>
                      </div>
                      <div
                        dangerouslySetInnerHTML={{
                          __html: item.analysis
                            ? item.analysis
                            : `<span>${trans(
                                "global.noAnalysis",
                                "暂无解析",
                              )}</span>`,
                        }}
                        className={styles.rightAnswerBox}
                      ></div>
                    </div>
                  </div>
                ))
              ) : IconFont ? (
                <div className={styles.noQuestion}>
                  <div className={styles.iconBox}>
                    <IconFont
                      type="icon-chengguoweikong"
                      className={styles.noSourceIcon}
                    />{" "}
                  </div>
                  {trans("global.noQuestion", "暂时没有题目哦")}
                </div>
              ) : null}
            </div>
          </div>
        </Modal>
        <Modal
          title={trans("global.exportDiy", "导入分析维度")}
          wrapClassName={styles.importLiteracy}
          visible={this.state.isKnowledgeLiteracy}
          onCancel={this.cancelKnowledgeLiteracy}
          footer={[
            <Button key="back" onClick={this.cancelKnowledgeLiteracy}>
              {trans("global.cancle", "取消")}
            </Button>,
            <Button
              key="submit"
              type="primary"
              onClick={this.okKnowledgeLiteracy}
            >
              {trans("global.sure", "确定")}
            </Button>,
          ]}
        >
          <p className={styles.setInstruction}>
            1.
            {trans(
              "global.downloadTheImportTemplateAndFillInTheImportInformationInBatches",
              "下载导入模板，批量填写导入信息",
            )}
          </p>
          <Button onClick={this.clickDownloadTemplate}>
            {trans("global.downloadTemplate", "下载模板")}
          </Button>
          <p className={styles.information}>
            2.
            {trans(
              "global.uploadTheCompletedImportInformationForm",
              "上传填写好的导入信息表",
            )}
          </p>
          <Upload
            name="files"
            action="/api/upload_file"
            onChange={this.changupload.bind(this)}
            fileList={this.state.newfileList}
          >
            <Button>{trans("global.selectFile", "选择文件")}</Button>
          </Upload>
        </Modal>
        {this.state.imgVisible ? (
          <PreviewImg
            imgUrl={this.state.url}
            modalVisible={this.state.imgVisible}
            changeModalVisible={this.cancelImg}
          />
        ) : null}
        {this.state.sendParent && this.state.sendParent ? (
          <StudentQualitySelect
            groupList={studentList} //学生列表
            visible={this.state.sendParent} // 开关
            title={
              active == 1
                ? trans("global.batchDownload", "批量下载")
                : active == 2
                  ? trans("global.batchSendToStu", "批量发送给学生")
                  : trans("global.batchSendToParent", "批量发送给家长")
            }
            modalVisible={this.handleCancel} //关闭方法
            disabledStu={[]} //禁用学生
            publishText={
              active == 1
                ? trans("global.confirmDownload", "确认下载")
                : trans("global.sureSend", "确认发送")
            } //发布
            sureStu={this.handleCancel} //发布完后的内容
            search={this.searchStuName} //搜索
            onRef={this.onRef1} //
            ifDeadLine={true}
            dispatch={this.props.dispatch}
            examId={this.props.examId}
            active={active}
          />
        ) : null}
      </div>
    );
  }
}
export default connect(({ home, global, publishToStudent }) => ({
  trendStuList: home.trendStuList,
  studySituationStructureList: home.studySituationStructureList,
  studySituationByStudentIdList: home.studySituationByStudentIdList,
  classListData: home.classListData,
  modifyAnalysisDimension: home.modifyAnalysisDimension,
  attainmentTest: home.attainmentTest,
  hoverIndex: home.hoverIndex,
  hoverIndexc: home.hoverIndexc,
  stageList: global.stageList,
  gradeList: global.gradeList,
  typeList: global.typeList,
  questionList: home.questionList,
  focusQuestionList: global.focusQuestionList,
  studentList: global.studentList,
}))(PupllPreview);
